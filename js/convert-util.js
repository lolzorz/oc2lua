var tf_output = document.getElementById('output');
var tf_input = document.getElementById('input');
var tab_insert = 2;

function convertText() {
    var originSrc = tf_input.value;
    convertToLua(originSrc);
}

$('#input').on('keydown', function (e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var val = this.value;
        var pre = val.substring(0, start);
        var end = val.substring(start, val.length);
        var space = '';
        for(var i = 0; i < tab_insert; i++) {
            space += ' ';
        }
        this.value = pre + space + end;
        this.selectionStart = start + tab_insert;
        this.selectionEnd = start + tab_insert;
    }
});

//start
function convertToLua(src) {
    var result = " " + src;

    //temporary replace NSString
    var allNsstrings = nsstringArrayInCode(result);
    for(var i = 0; i < allNsstrings.length; i++) {
        result = result.replace(allNsstrings[i], "#s#" + i + "#s#");
    }

    result = convertMethodCall(result);
    result = convertBlockToAliWax(result);
    result = convertCodeFormat(result);
    result = convertOtherToLua(result);

    for(var i = 0; i < allNsstrings.length; i++) {
        var aString = allNsstrings[i];
        result = result.replace("#s#" + i + "#s#", aString.slice(1, aString.length));
    }

    result = result.slice(1, result.length);

    tf_output.value = result;
}

function nsstringArrayInCode(code) {
    var stringArray = new Array();
    var lastC = code.charAt(0);
    var aString = "";
    var start = false;
    for(var i = 1; i < code.length; i++) {
        var c = code.charAt(i);
        if(c == '"') {
            if(start) {
                aString = aString + c;
                if(lastC != '\\') {
                    start = false;
                    stringArray.push(aString);
                    aString = "";
                }
            } else {
                if(lastC == '@') {
                    start = true;
                    aString = "@\"";
                }
            }
        } else {
            if(start) {
                aString = aString + c;
            }
        }
        lastC = c;
    }
    return stringArray;
}

//================================================================
//convert all method call
//it's not supposed to modify
//================================================================
function convertMethodCall(src) {
    var result = src;
    //while is to convert oc method call to lua
    //the reg only match the method which don't have inner call
    //so it would loop for many times
    while(result.match(/[\[\]]/g)) {
        var toBeReplaceArray = result.match(/\[[^\[\]]*\]/g);
        if(toBeReplaceArray.length < 1) {
            break;
        }
        for(var i = 0; i < toBeReplaceArray.length; i++) {
            var aMethod = toBeReplaceArray[i];
            var aLuaMethod = methodToLua(aMethod);
            result = result.replace(aMethod, aLuaMethod);
        }
    }
    return result;
}

//convert a method call
function methodToLua(src) {
    var aSrc = src;

    //replace block params into some unique character
    var toReplaceParam = paramArrayInMethod(aSrc);
    if(toReplaceParam.length > 0) {
        for(var i = 0; i < toReplaceParam.length; i++) {
            aSrc = aSrc.replace(toReplaceParam[i], "##" + i + "##");
        }
    }

    //made the method in a single line
    aSrc = aSrc.replace(/\n/g, ' ');
    aSrc = aSrc.replace(/ {2,}/g, ' ');

    var caller = aSrc.match(/\[[^ ]* /g);
    caller = caller[0];
    caller = caller.slice(1, caller.length - 1);
    var result = caller + ":";
    var allParams = "";

    //match the method body
    var methodBodys = aSrc.match(/ [^: ]*:/g);
    //the call doesn't have param;
    if(!methodBodys) {
        methodBodys = aSrc.split(" ");
        var aMethod = methodBodys[1];
        aMethod = aMethod.slice(0, aMethod.length - 1);
        result = result + aMethod + "()";
        //wax framework will solve 'alloc'
        if(aMethod == "alloc") {
            return caller;
        }

        if(toReplaceParam.length > 0) {
            for(var i = 0; i < toReplaceParam.length; i++) {
                result = result.replace("##" + i + "##", toReplaceParam[i]);
            }
        }
        return result;
    }

    //convert oc method call grammar to lua
    //for example:
    //[NSString stringWithCString:luaStr encoding:NSUTF8StringEncoding];
    //->
    //NSString:stringWithCString_encoding(luaStr, NSUTF8StringEncoding)
    for(var i = 0; i < methodBodys.length; i++) {
        var aBody = methodBodys[i];
        aBody = aBody.slice(1, aBody.length - 1);
        if(i != 0) {
            result = result + "_";
        }
        result = result + aBody;
        var reg = methodBodys[i] + ".*";
        var start = reg.length;
        var end = 1;
        if(i == methodBodys.length - 1) {
            reg = reg + "\]";
        } else {
            var nextBody = methodBodys[i + 1];
            reg = reg + nextBody;
            end = nextBody.length;
        }
        reg = new RegExp(reg, "g");
        reg = aSrc.match(reg);
        reg = reg[0];
        var aParam = reg.slice(start - 2, reg.length - end);
        if(i != 0) {
            allParams = allParams + ",";
        }
        allParams = allParams + aParam;
    }
    result = result + "(" + allParams + ")";

    //recover block params
    if(toReplaceParam.length > 0) {
        for(var i = 0; i < toReplaceParam.length; i++) {
            result = result.replace("##" + i + "##", toReplaceParam[i]);
        }
    }
    return result;
}

//Not use it yet.It's for support c-function call.
function callerOfTheMethod(method) {
    var caller = "";
    var needRight = 0;
    var start = false;
    var end = false;
    for(var i = 1; i < method.length; i++) {
        var c = method.charAt(i);
        switch (c) {
            case ' ': {
                if(needRight == 0) {
                    if(start) {
                        end = true;
                    }
                } else {
                    if(start) {
                        caller = caller + c;
                    }
                }
            }
            break;
            case '(': {
                needRight++;
                start = true;
                caller = caller + c;
            }
            break;
            case ')': {
                needRight--;
                caller = caller + c;
            }
            break;
            default: {
                start = true;
                caller = caller + c;
            }
        }
        if(end) {
            break;
        }
    }
    return caller;
}

//Find out all block params in a method call
//or u can find out all block in code
//but both only return the outer block
//return array of block params
function paramArrayInMethod(method) {
    var resultArray = new Array();
    var needRightMid = 0;
    var isInParam = false;
    var canEnd = false;
    var aParam = "";
    for(var i = 0; i < method.length; i++) {
        var c = method.charAt(i);
        switch (c) {
            case '^': {
                if(!isInParam) {
                    aParam = "";
                    isInParam = true;
                    canEnd = false;
                    needRightMid = 0;
                }
                aParam = aParam + c;
            }
            break;
            case '{': {
                if(isInParam) {
                    canEnd = true;
                    needRightMid++;
                    aParam = aParam + c;
                }
            }
            break;
            case '}': {
                if(isInParam) {
                    needRightMid--;
                    aParam = aParam + c;
                    if(canEnd) {
                        if(needRightMid == 0) {
                            resultArray.push(aParam);
                            isInParam = false;
                        }
                    }
                }
            }
            break;
            default: {
                if(isInParam) {
                    aParam = aParam + c;
                }
            }
        }
    }
    return resultArray;
}

//================================================================
//convert OC block to alibaba's wax framework's block
//it should modify by ur self
//================================================================
function convertBlockToAliWax(src) {
    var result = src;
    while(result.match(/\^[^{]*{/g)) {
        var blocks = paramArrayInMethod(result);
        for(var i = 0; i < blocks.length; i++) {
            var aBlock = blocks[i];
            result = result.replace(aBlock, convertABlock(aBlock));
        }
    }
    return result;
}

var returnType = {
};
returnType["BOOL"] = "BOOL";
returnType["bool"] = "bool";
returnType["NSInteger"] = "NSInteger";
returnType["int"] = "int";
returnType["CGFloat"] = "CGFloat";
returnType["float"] = "float";
returnType["id"] = "id";
returnType[""] = "void";
returnType["void"] = "void";

//it's for alibaba's wax
function convertABlock(block) {
    block = block.trim();
    var blockHeader = block.match(/\^[^{]*{/g);
    blockHeader = blockHeader[0];

    var blockParamTypes = new Array();
    var blockParams = new Array();
    var blockDefine = blockHeader.match(/\([^\(\)]*\)/g);
    if(blockDefine) {
        blockDefine = blockDefine[0];
        blockDefine = blockDefine.slice(1, blockDefine.length - 1);
        var blockDefines = blockDefine.split(",");
        for(var i = 0; i < blockDefines.length; i++) {
            var aDefine = blockDefines[i];
            aDefine = aDefine.trim();
            aDefine = aDefine.split(" ");
            var aParam = aDefine[aDefine.length - 1];
            aDefine = aDefine[0];
            aDefine = convertType(aDefine);
            blockParamTypes.push(aDefine);

            if(aParam.charAt(0) == '*') {
                aParam = aParam.slice(1, aParam.length);
            }
            blockParams.push(aParam);
        }
    }

    var blockReturn = blockHeader.match(/^[^{\(]*[\({]/g);
    blockReturn = blockReturn[0];
    blockReturn = blockReturn.slice(1, blockReturn.length - 1);
    blockReturn = blockReturn.trim();
    blockReturn = convertType(blockReturn);

    var result = "toblock(function(";
    for(var i = 0; i < blockParams.length; i++) {
        if(i != 0) {
            result = result + ",";
        }
        result = result + blockParams[i];
    }
    result = result + ")";
    var blockBody = block.slice(blockHeader.length, block.length - 1);
    result = result + blockBody + "end,{\"" + blockReturn + "\"";
    for(var i = 0; i < blockParamTypes.length; i++) {
        result = result + ",\"" + blockParamTypes[i] + "\"";
    }
    result = result + "})";
    return result;
}

function convertType(type) {
    if(returnType[type]) {
        return returnType[type];
    }
    return "id";
}

//================================================================
//convert "if/for" to lua
//convert basic grammar
//it should be added more case
//================================================================
function convertCodeFormat(src) {
    var result = src;
    result = convertVar(result);
    result = convertDotGrammar(result);
    result = convertForLoop(result);
    result = convertIf(result);
    return result;
}

//convert "NSString *str = "
//->
//"local str = "
function convertVar(src) {
    var result = src;
    var matchedVar = result.match(/[a-zA-Z_][a-zA-Z0-9_]*[ \*]{1,}[a-zA-Z_][a-zA-Z0-9_]* *=[^=]/g);
    if(matchedVar) {
        for(var i = 0; i < matchedVar.length; i++) {
            var aVar = matchedVar[i];
            var varResult = aVar.slice(0, aVar.length - 2);
            varResult = varResult.trim();
            varResult = varResult.split(" ");
            varResult = varResult[varResult.length - 1];
            if(varResult.charAt(0) == '*') {
                varResult = varResult.slice(1, varResult.length);
            }
            varResult = "local " + varResult + " = ";
            result = result.replace(aVar, varResult);
        }
    }
    return result;
}

//convert "self.view"
//->
//"self:view()"
//
//convert "self.view = a"
//->
//"self:setView(a)"
function convertDotGrammar(src) {
    var result = src;
    var matchedDotSets = matchedDotSet(result);
    if(matchedDotSets) {
        for(var i = 0; i < matchedDotSets.length; i++) {
            var aDotSet = matchedDotSets[i];
            result = result.replace(aDotSet, convertADotSet(aDotSet));
        }
    }
    var matchedDot = result.match(/\.[a-zA-Z_][a-zA-Z0-9_]*/g);
    if(matchedDot) {
        for(var i = 0; i < matchedDot.length; i++) {
            var aDot = matchedDot[i];
            var aDotResult = aDot.slice(1, aDot.length);
            aDotResult = ":" + aDotResult + "()";
            result = result.replace(aDot, aDotResult);
        }
    }
    return result;
}

//match all ".name = value;"
function matchedDotSet(src) {
    var tmpSrc = src;
    var allDotSets = new Array();
    while(tmpSrc.match(/\.[a-zA-Z_][a-zA-Z0-9_]* *=/g)) {
        var index = tmpSrc.search(/\.[a-zA-Z_][a-zA-Z0-9_]* *=/g);
        var aDotSet = "";
        var needRight1 = 0;
        var needRight2 = 0;
        var needRight3 = 0;
        var end = false;
        for(var i = index; i < tmpSrc.length; i++) {
            var c = tmpSrc.charAt(i);
            aDotSet = aDotSet + c;
            switch (c) {
                case '{': {
                    needRight1++;
                }
                break;
                case '}': {
                    needRight1--;
                }
                break;
                case '(': {
                    needRight2++;
                }
                break;
                case ')': {
                    needRight2--;
                }
                break;
                case '[': {
                    needRight3++;
                }
                break;
                case ']': {
                    needRight3--;
                }
                break;
                case ';': {
                    if(needRight1 == 0 && needRight2 == 0 && needRight3 == 0) {
                        end = true;
                    }
                }
            }
            if(end) {
                tmpSrc = tmpSrc.slice(i, tmpSrc.length);
                break;
            }
        }
        allDotSets.push(aDotSet);
    }
    return allDotSets;
}

function convertADotSet(dotSet) {
    var setMethod = dotSet.search(/=/g);
    var setValue = dotSet.slice(setMethod + 1, dotSet.length);
    setMethod = dotSet.slice(1, setMethod);
    setMethod = setMethod.trim();
    var firstC = setMethod.slice(0,1);
    firstC = firstC.toUpperCase();
    setMethod = setMethod.slice(1, setMethod.length);
    setMethod = ":set" + firstC + setMethod + "(" + setValue.trim() + ")";
    return setMethod;
}

function convertForLoop(src) {
    var result = src;

    while(result.match(/for[^{]*{/g)) {
        var toReplaceForLoop = matchedForLoop(result);
        if(toReplaceForLoop.length < 1) {
            break;
        }
        for(var i = 0; i < toReplaceForLoop.length; i++) {
            var aForLoop = toReplaceForLoop[i];
            result = result.replace(aForLoop, convertAForLoop(aForLoop));
        }
    }

    return result;
}

//convert oc for loop
//->
//lua for loop
//but only support some specify format
//for(var name = value;name <=> aValue;name++--)
//for(id x in y)
var forCount = 0;
function convertAForLoop(forloop) {
    var result = "for ";
    var fullHeader = forloop.match(/for *\([^{]*{/g);
    fullHeader = fullHeader[0];
    var header = fullHeader.match(/\(.*\)/g);
    var body = forloop.slice(fullHeader.length, forloop.length - 1);
    header = header[0];
    header = header.slice(1, header.length - 1);
    if(header.match(/;/g)) {
        var headers = header.split(";");

        var header1 = headers[0];
        header1 = header1.match(/[a-zA-Z_][a-zA-Z0-9_]* *=.*/g);
        header1 = header1[0];
        result = result + header1;

        var header2 = headers[1];
        header2 = header2.match(/[=\<\>].*/g);
        header2 = header2[0];
        header2 = header2.slice(1, header2.length);
        header2 = header2.trim();
        result = result + "," + header2;

        var header3 = headers[2];
        if(header3.match(/\-/g)) {
            header3 = "1";
        } else {
            header3 = "-1"
        }
        result = result + "," + header3 + " do" + body + "end";
    } else {
        var headers = header.split(" in ");
        var header1 = headers[0];
        header1 = header1.trim();
        header1 = header1.split(" ");
        header1 = header1[header1.length - 1];
        if(header1.match(/\*/g)) {
            header1 = header1.slice(1, header1.length);
        }

        var header2 = headers[1];
        header2 = header2.trim();

        result = result + "luaforloopindex" + forCount + " = 0," + header2 + ":count()," + "1 do local " + header1 + " = " + header2 + ":objectAtIndex(luaforloopindex" + forCount++ + ") " + body + "end";
    }
    return result;
}

//find out all outer for loop
function matchedForLoop(src) {
    var tmpSrc = src;
    var allForLoops = new Array();
    while(tmpSrc.match(/for *\([^{]*{/g)) {
        var index = tmpSrc.search(/for *\([^{]*{/g);
        var aLoop = "";
        var needRight = 0;
        var end = false;
        for(var i = index; i < tmpSrc.length; i++) {
            var c = tmpSrc.charAt(i);
            aLoop = aLoop + c;
            switch (c) {
                case '{': {
                    needRight++;
                }
                break;
                case '}': {
                    needRight--;
                    if(needRight == 0) {
                        end = true;
                    }
                }
                break;
            }
            if(end) {
                tmpSrc = tmpSrc.slice(i, tmpSrc.length);
                break;
            }
        }
        allForLoops.push(aLoop);
    }
    return allForLoops;
}

function convertIf(src) {
    var result = src;
    while(result.match(/if *\([^{]*{/g)) {
        result = convertAllIf(result);
    }
    return result;
}

//convert all outer if
function convertAllIf(src) {
    var result = "";
    var tmpSrc = src;
    while(tmpSrc.match(/if *\([^{]*{/g)) {
        var currentIndex = tmpSrc.search(/if *\([^{]*{/g);
        result = result + tmpSrc.slice(0, currentIndex);
        var needRight = 0;
        var end = false;
        var ifBody = "";
        for(var i = currentIndex; i < tmpSrc.length; i++) {
            var c = tmpSrc.charAt(i);
            ifBody = ifBody + c;
            switch (c) {
                case '{': {
                    needRight++;
                }
                break;
                case '}': {
                    needRight--;
                    if(needRight == 0) {
                        end = true;
                    }
                }
                break;
            }
            if(end) {
                tmpSrc = tmpSrc.slice(i + 1, tmpSrc.length);
                var fullHeader = ifBody.match(/if *\([^{]*{/g);
                fullHeader = fullHeader[0];
                var body = ifBody.slice(fullHeader.length, ifBody.length - 1);
                var header = fullHeader.match(/\(.*\)/g);
                header = header[0];
                header = header.slice(1, header.length - 1);
                header = header.trim();
                result = result + "if " + header + " then " + body;
                break;
            }
        }
        var matchElseIf = tmpSrc.search(/[\n ]*else *if *\([^{]*{/g);
        var matchElse = tmpSrc.search(/[\n ]*else[\n ]*{/g);
        while(matchElseIf == 0 || matchElse == 0) {
            needRight = 0;
            end = false;
            ifBody = "";
            for(var i = 0; i < tmpSrc.length; i++) {
                var c = tmpSrc.charAt(i);
                ifBody = ifBody + c;
                switch (c) {
                    case '{': {
                        needRight++;
                    }
                    break;
                    case '}': {
                        needRight--;
                        if(needRight == 0) {
                            end = true;
                        }
                    }
                    break;
                }
                if(end) {
                    tmpSrc = tmpSrc.slice(i + 1, tmpSrc.length);
                    var fullHeader;
                    if(matchElseIf == 0) {
                        fullHeader = ifBody.match(/[\n ]*else *if *\([^{]*{/g);
                    } else {
                        fullHeader = ifBody.match(/[\n ]*else[\n ]*{/g);
                    }
                    fullHeader = fullHeader[0];
                    var body = ifBody.slice(fullHeader.length, ifBody.length - 1);
                    if(matchElseIf == 0) {
                        var header = fullHeader.match(/\(.*\)/g);
                        header = header[0];
                        header = header.slice(1, header.length - 1);
                        header = header.trim();
                        result = result + "elseif " + header + " then " + body;
                    } else {
                        result = result + "else " + body;
                    }
                    break;
                }
            }
            matchElseIf = tmpSrc.search(/[\n ]*else *if *\([^{]*{/g);
            matchElse = tmpSrc.search(/[\n ]*else[\n ]*{/g);
        }
        result = result + "end";
    }
    result = result + tmpSrc;
    return result;
}

//convert other detail thing to lua
//such YES/NO
function convertOtherToLua(src) {
    var result = src;
    var allmatched;
    allmatched = result.match(/[^a-zA-Z0-9_]NO[^a-zA-Z0-9_]/g);
    if(allmatched) {
        for(var i = 0; i < allmatched.length; i++) {
            var aMatched = allmatched[i];
            var aResult = aMatched.slice(0, 1) + "false" + aMatched.slice(aMatched.length - 1, aMatched.length);
            result = result.replace(aMatched, aResult);
        }
    }

    allmatched = result.match(/[^a-zA-Z0-9_]YES[^a-zA-Z0-9_]/g);
    if(allmatched) {
        for(var i = 0; i < allmatched.length; i++) {
            var aMatched = allmatched[i];
            var aResult = aMatched.slice(0, 1) + "true" + aMatched.slice(aMatched.length - 1, aMatched.length);
            result = result.replace(aMatched, aResult);
        }
    }

    result = result.replace(/;/g, "");

    return result;
}