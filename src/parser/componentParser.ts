import { BladeCommentNode, BladeComponentNode, BladeEchoNode, ComponentNameNode, DirectiveNode, ParameterNode, ParameterType } from '../nodes/nodes.js';
import { StringUtilities } from '../utilities/stringUtilities.js';
import { DocumentParser } from './documentParser.js';
import { isStartOfString } from './scanners/isStartOfString.js';
import { nextNonWhitespace } from './scanners/nextNonWhitespace.js';
import { scanToEndOfLogicGroup } from './scanners/scanToEndOfLogicGroup.js';
import { skipToEndOfLine } from './scanners/skipToEndOfLine.js';
import { skipToEndOfMultilineComment } from './scanners/skipToEndOfMultilineComment.js';
import { skipToEndOfStringTraced } from './scanners/skipToEndOfString.js';
import { LogicGroupScanResults } from './scanResults.js';
import { StringIterator } from './stringIterator.js';

export class ComponentParser implements StringIterator {
    private document: DocumentParser;
    private content = '';
    private inputLen = 0;
    private chars: string[] = [];
    private currentContent: string[] = [];
    private prev: string | null = null;
    private cur: string | null = null;
    private next: string | null = null;
    private currentIndex = 0;
    private hasFoundName = false;
    private nameStartsOn = 0;
    private nameEndsOn = -1;
    private name = '';
    private parameterContent = '';
    private activeComponent: BladeComponentNode | null = null;

    constructor(document: DocumentParser) {
        this.document = document;
    }
    advance(count: number) {
        for (let i = 0; i < count; i++) {
            this.currentIndex++;
            this.checkCurrentOffsets();
        }
    }
    encounteredFailure() {
        return;
    }
    pushChar(value: string) {
        this.currentContent.push(value);
    }

    updateIndex(index: number): void {
        this.currentIndex = index;
    }
    inputLength(): number {
        return this.inputLen;
    }
    incrementIndex(): void {
        this.currentIndex += 1;
    }
    getCurrentIndex(): number {
        return this.currentIndex;
    }
    getCurrent(): string | null {
        return this.cur;
    }
    getNext(): string | null {
        return this.next;
    }
    getPrev(): string | null {
        return this.prev;
    }
    getChar(index: number) {
        return this.chars[index];
    }
    getSeedOffset(): number {
        return 0;
    }
    getContentSubstring(from: number, length: number): string {
        return this.content.substr(from, length);
    }
    private resetState() {
        this.name = '';
        this.parameterContent = '';
        this.hasFoundName = false;
        this.nameStartsOn = 0;
        this.nameEndsOn = -1;

        this.currentIndex = 0;
        this.content = '';
        this.chars = [];
        this.currentContent = [];
        this.inputLen = 0;
        this.prev = null;
        this.cur = null;
        this.next = null;

        return this;
    }

    checkCurrentOffsets() {
        this.cur = this.chars[this.currentIndex];

        this.prev = null;
        this.next = null;

        if (this.currentIndex > 0) {
            this.prev = this.chars[this.currentIndex - 1];
        }

        if ((this.currentIndex + 1) < this.inputLen) {
            this.next = this.chars[this.currentIndex + 1];
        }
    }


    private makeDirective(name: string, nameStartsOn: number, nameEndsOn: number) {
        const directive = new DirectiveNode(),
            componentOffset = this.getComponentOffset();

        directive.withParser(this.document);

        if (name.startsWith('@')) {
            name = name.substring(1);
        }

        directive.directiveName = name.trim();
        directive.name = name.trim();

        if (name.startsWith('end')) {
            directive.name = name.substring(3);
        } else if (name.startsWith('else') && name != 'elseif' && name != 'else') {
            directive.name = 'elseif';
        }

        const nameStartPosition = this.document.positionFromOffset(componentOffset + nameStartsOn, componentOffset + nameStartsOn),
            nameEndPosition = this.document.positionFromOffset(componentOffset + nameEndsOn, componentOffset + nameEndsOn);

        directive.startPosition = nameStartPosition;
        directive.endPosition = nameEndPosition;

        directive.namePosition = {
            start: nameStartPosition,
            end: nameEndPosition
        };

        directive.hasDirectiveParameters = false;

        if (directive.startPosition != null && directive.endPosition != null) {
            const startOffset = directive.startPosition.index,
                length = (directive.endPosition.index - directive.startPosition.index),
                endOffset = startOffset + length;

            directive.sourceContent = this.document.getContentSubstring(startOffset, length);
            directive.offset = {
                start: startOffset,
                end: endOffset,
                length: length
            };
        }

        return directive;
    }

    private getComponentOffset() {
        return (this.activeComponent?.startPosition?.offset ?? 0) + 3;
    }

    private makeDirectiveWithParameters(name: string, nameStartsOn: number, nameEndsOn: number, params: LogicGroupScanResults): DirectiveNode {
        const directive = this.makeDirective(name, nameStartsOn, nameEndsOn),
            componentOffset = this.getComponentOffset();

        directive.hasDirectiveParameters = true;
        directive.directiveParameters = params.content;

        // Check to see if the directive probably contains JSON params.
        let checkParams = params.content.trim();

        if (checkParams.startsWith('(') && checkParams.endsWith(')')) {
            checkParams = checkParams.substring(1);
            checkParams = checkParams.substring(0, checkParams.length - 1);
            checkParams = checkParams.trim();

            directive.hasJsonParameters = checkParams.startsWith('{') && checkParams.endsWith('}');
        }

        const directiveParamtersStartPosition = this.document.positionFromOffset(params.start + componentOffset, params.start + componentOffset),
            directiveParametersEndPosition = this.document.positionFromOffset(params.end + componentOffset, params.end + componentOffset);

        directive.startPosition = directive.namePosition?.start ?? null;
        directive.endPosition = directiveParametersEndPosition;

        directive.directiveParametersPosition = {
            start: directiveParamtersStartPosition,
            end: directiveParametersEndPosition
        };

        if (directive.startPosition != null && directive.endPosition != null) {
            const startOffset = directive.startPosition.index,
                length = (directive.endPosition.index - directive.startPosition.index),
                endOffset = startOffset + length;

            directive.sourceContent = this.document.getContentSubstring(startOffset, length);
            directive.offset = {
                start: startOffset,
                end: endOffset,
                length: length
            };
        }

        return directive;
    }

    private prepare(content: string) {
        this.content = StringUtilities.normalizeLineEndings(content);
        this.chars = this.content.split('');
        this.inputLen = this.chars.length;

        return this;
    }

    private peek(count: number) {
        return this.chars[count];
    }

    private peekRelative(count: number) {
        return this.peek(this.currentIndex + count);
    }


    private scanToEndOfComment(startedOn: number): BladeCommentNode | null {
        const componentOffset = this.getComponentOffset();

        let hasObservedNewLine = false,
            hasObservedSpace = false,
            newlineRecoveryIndex = -1,
            spaceRecoveryIndex = -1;

        for (this.currentIndex; this.currentIndex < this.inputLen; this.currentIndex += 1) {
            this.checkCurrentOffsets();

            if (this.cur == DocumentParser.NewLine && !hasObservedNewLine) {
                hasObservedNewLine = true;
                newlineRecoveryIndex = this.currentIndex;
            }

            if (StringUtilities.ctypeSpace(this.cur) && !hasObservedSpace) {
                hasObservedSpace = true;
                spaceRecoveryIndex = this.currentIndex;
            }

            if ((this.cur == DocumentParser.Punctuation_Minus && this.next == DocumentParser.Punctuation_Minus) || this.next == null) {
                const peekOne = this.peekRelative(2),
                    peekTwo = this.peekRelative(3);

                if ((peekOne == DocumentParser.RightBrace && peekTwo == DocumentParser.RightBrace) || this.next == null) {
                    const comment = new BladeCommentNode();
                    comment.startPosition = this.document.positionFromOffset((startedOn - 2) + componentOffset, (startedOn - 2) + componentOffset);
                    comment.endPosition = this.document.positionFromOffset(this.currentIndex + 4 + componentOffset, this.currentIndex + 4 + componentOffset);
                   
                    comment.innerContent = this.chars.slice(
                        startedOn + 2,
                        this.currentIndex
                    ).join('');

                    comment.sourceContent = this.chars.slice(
                        startedOn - 2,
                        this.currentIndex + 4
                    ).join('');

                    return comment;
                } else {
                    if (this.cur != null) {
                        this.currentContent.push(this.cur);
                    }
                    continue;
                }
            }

            if (this.cur == null) { break; }
            this.currentContent.push(this.cur);
        }

        return null;
    }

    private scanToEndOfDirective() {
        const directiveNameStartsOn = this.currentIndex,
            directiveBrokeForNewline = false;
        let directiveName = '',
            directiveNameEndsOn = 0;

        let directive: DirectiveNode | null = null;

        for (this.currentIndex; this.currentIndex < this.inputLen; this.currentIndex += 1) {
            this.checkCurrentOffsets();

            if (this.cur == DocumentParser.Punctuation_ForwardSlash && this.next == DocumentParser.Punctuation_Asterisk) {
                skipToEndOfMultilineComment(this, true);
                continue;
            }

            if (this.cur == DocumentParser.Punctuation_ForwardSlash && this.next == DocumentParser.Punctuation_ForwardSlash) {
                skipToEndOfLine(this, true);
                continue;
            }

            if (this.cur == DocumentParser.NewLine) {
                directiveNameEndsOn = this.currentIndex;
                directiveName = this.currentContent.join('');
                this.currentContent = [];
                directive = this.makeDirective(directiveName, directiveNameStartsOn, directiveNameEndsOn);
                break;
            } else if (this.next == null) {
                this.currentContent.push(this.cur as string);
                directiveNameEndsOn = this.currentIndex + 1;
                directiveName = this.currentContent.join('');
                this.currentContent = [];
                directive = this.makeDirective(directiveName, directiveNameStartsOn, directiveNameEndsOn);
                break;
            }

            const nextNonWs = nextNonWhitespace(this);

            if (this.cur != DocumentParser.LeftParen && nextNonWs.didFind && StringUtilities.ctypePunct(nextNonWs.char)) {
                if (nextNonWs.char != DocumentParser.LeftParen && nextNonWs.char != DocumentParser.Punctuation_Minus && nextNonWs.char != '.') {
                    this.currentContent.push(this.cur as string);
                    directiveNameEndsOn = this.currentIndex + 1;
                    directiveName = this.currentContent.join('');
                    this.currentContent = [];
                    directive = this.makeDirective(directiveName, directiveNameStartsOn, directiveNameEndsOn);
                    break;
                }
            }

            if (StringUtilities.ctypeSpace(this.cur)) {
                const nextNonWs = nextNonWhitespace(this);

                if (nextNonWs.didFind && nextNonWs.char == DocumentParser.LeftParen) {
                    directiveNameEndsOn = this.currentIndex - 1;
                    directiveName = this.currentContent.join('');
                    this.currentContent = [];
                    this.currentIndex = (nextNonWs.index as number);
                    this.checkCurrentOffsets();
                    const logicGroupResults = scanToEndOfLogicGroup(this);

                    directive = this.makeDirectiveWithParameters(directiveName, directiveNameStartsOn, directiveNameEndsOn, logicGroupResults);
                    break;
                } else {
                    directiveNameEndsOn = this.currentIndex;
                    directiveName = this.currentContent.join('');
                    this.currentContent = [];
                    directive = this.makeDirective(directiveName, directiveNameStartsOn, directiveNameEndsOn);
                    break;
                }
            } else if (this.cur == DocumentParser.LeftParen) {
                directiveNameEndsOn = this.currentIndex - 1;
                directiveName = this.currentContent.join('');
                this.currentContent = [];
                const logicGroupResults = scanToEndOfLogicGroup(this);

                directive = this.makeDirectiveWithParameters(directiveName, directiveNameStartsOn, directiveNameEndsOn, logicGroupResults);
                break;
            }

            if (this.cur == null) { break; }
            this.currentContent.push(this.cur);
        }

        return directive;
    }

    private nextPunctuation(): string | null {
        for (let i = this.currentIndex + 1; i < this.inputLen; i++) {
            const char = this.chars[i];

            if (StringUtilities.ctypePunct(char)) {
                return char;
            }
        }

        return null;
    }

    private scanToEndOfBladeEcho(startedOn: number) {
        const componentOffset = this.getComponentOffset(),
            echoNode = new BladeEchoNode();

        this.currentContent.unshift();
        this.currentContent.unshift();

        for (this.currentIndex; this.currentIndex < this.inputLen; this.currentIndex += 1) {
            this.checkCurrentOffsets();

            if (this.cur == DocumentParser.RightBrace && this.next == DocumentParser.RightBrace) {
                const echoEnd = this.currentIndex + 1;

                echoNode.startPosition = this.document.positionFromOffset(startedOn + componentOffset, startedOn + componentOffset);
                echoNode.endPosition = this.document.positionFromOffset(echoEnd + componentOffset, echoEnd + componentOffset);
                echoNode.withParser(this.document);

                const startOffset = echoNode.startPosition.index - 5,
                    length = (echoNode.endPosition.index - echoNode.startPosition.index) + 3,
                    endOffset = startOffset + length;

                echoNode.sourceContent = this.content.substr(startOffset, length);
                echoNode.offset = {
                    start: startOffset,
                    end: endOffset,
                    length: length
                };

                echoNode.content = this.currentContent.join('');
                break;
            }

            if (this.cur == null) { break; }
            this.currentContent.push(this.cur);
        }

        return echoNode;
    }

    parse(node: BladeComponentNode) {
        this.resetState().prepare(node.innerContent);
        this.activeComponent = node;

        const parser = node.getParser() as DocumentParser;

        let isParsingParameter = false,
            parameterStartedOn = -1,
            parameterNameEndedOn = -1,
            parameterValueStartedOn = -1,
            terminatorStyle = '"';

        for (this.currentIndex; this.currentIndex < this.inputLen; this.currentIndex += 1) {
            this.checkCurrentOffsets();

            if (this.hasFoundName && this.cur == DocumentParser.LeftBrace && this.next == DocumentParser.LeftBrace) {
                this.currentIndex += 2;
                const peek = this.peekRelative(0),
                    peekTwo = this.peekRelative(1);
                if (peek == DocumentParser.Punctuation_Minus && peekTwo == DocumentParser.Punctuation_Minus) {
                    const comment = this.scanToEndOfComment(this.currentIndex);

                    if (comment != null) {
                        const param = new ParameterNode();

                        param.type = ParameterType.Directive;
                        param.startPosition = comment.startPosition;
                        param.endPosition = comment.endPosition;
                        param.inlineComment = comment;
                        param.type = ParameterType.Comment;
                        node.hasParameters = true;
                        node.parameters.push(param);
                        this.currentContent = [];
                        this.currentIndex += 3;
                        continue;
                    }

                    debugger;
                } else {
                    const echoNode = this.scanToEndOfBladeEcho(this.currentIndex);

                    if (echoNode != null) {
                        const param = new ParameterNode();

                        param.type = ParameterType.Directive;
                        param.startPosition = echoNode.startPosition;
                        param.endPosition = echoNode.endPosition;
                        param.inlineEcho = echoNode;
                        param.type = ParameterType.InlineEcho;
                        node.hasParameters = true;
                        node.parameters.push(param);
                        this.currentContent = [];
                        this.currentIndex += 1;
                        continue;
                    }
                }
            }

            if (this.hasFoundName && this.cur == DocumentParser.AtChar && this.currentContent.length == 0 && this.nextPunctuation() != DocumentParser.Punctuation_Equals) {
                const directive = this.scanToEndOfDirective();

                if (directive != null) {
                    const param = new ParameterNode();

                    param.type = ParameterType.Directive;
                    param.startPosition = directive.startPosition;
                    param.endPosition = directive.endPosition;
                    param.name = directive.directiveName;
                    param.directive = directive;
                    node.hasParameters = true;
                    node.parameters.push(param);
                    continue;
                }

            }

            if (!this.hasFoundName) {
                if ((StringUtilities.ctypeSpace(this.cur) || this.next == null) && this.hasFoundName == false) {
                    if (this.next == null && !StringUtilities.ctypeSpace(this.cur)) {
                        this.currentContent.push(this.cur as string);
                    }

                    this.name = this.currentContent.join('');
                    this.nameEndsOn = this.currentIndex - 1;
                    this.hasFoundName = true;
                    this.currentContent = [];

                    this.parameterContent = this.chars.slice(this.currentIndex).join('');
                    continue;
                }
            } else {
                if (StringUtilities.ctypeSpace(this.cur) || this.next == null) {
                    if (this.currentContent.length > 0) {
                        const param = new ParameterNode(),
                            componentOffset = this.getComponentOffset();
                        param.type = ParameterType.Attribute;

                        if (this.next == null && !StringUtilities.ctypeSpace(this.cur)) {
                            this.currentContent.push(this.cur as string);
                        }

                        param.name = this.currentContent.join('');

                        const startOffset = this.currentIndex + componentOffset - param.name.length;

                        param.startPosition = this.document.positionFromCursor(startOffset, startOffset);
                        param.endPosition = this.document.positionFromCursor(this.currentIndex + componentOffset, this.currentIndex + componentOffset);
                        param.namePosition = {
                            start: param.startPosition,
                            end: param.endPosition
                        };
                        node.parameters.push(param);
                        node.hasParameters = true;
                        this.currentContent = [];

                        continue;
                    }
                    continue;
                } else {
                    if (!isParsingParameter) {
                        isParsingParameter = true;
                        parameterStartedOn = this.currentIndex;
                    }
                }

                if (this.cur == DocumentParser.Punctuation_Equals && isStartOfString(this.next)) {
                    terminatorStyle = this.next as string;
                    parameterNameEndedOn = this.currentIndex - 1;

                    this.currentIndex += 1;
                    this.checkCurrentOffsets();
                    parameterValueStartedOn = this.currentIndex;
                    const paramValue = skipToEndOfStringTraced(this),
                        param = new ParameterNode();

                    param.withParser(parser);
                    param.name = this.currentContent.join('');
                    param.value = paramValue.value;

                    const nameStartOffset = node.relativeOffset(parameterStartedOn + 3),
                        nameEndOffset = node.relativeOffset(parameterNameEndedOn + 3),
                        valueStartOffset = node.relativeOffset(parameterValueStartedOn + 3),
                        valueEndOffset = node.relativeOffset(paramValue.endedOn + 3);

                    param.namePosition = {
                        start: parser.positionFromOffset(nameStartOffset, nameStartOffset),
                        end: parser.positionFromOffset(nameEndOffset, nameEndOffset)
                    };

                    param.valuePosition = {
                        start: parser.positionFromOffset(valueStartOffset, valueStartOffset),
                        end: parser.positionFromOffset(valueEndOffset, valueEndOffset)
                    };

                    param.terminatorStyle = terminatorStyle;
                    param.wrappedValue = terminatorStyle + param.value + terminatorStyle;
                    param.content = param.name + '=' + param.wrappedValue;

                    param.realName = param.name;

                    if (param.realName.startsWith(':')) {
                        param.isExpression = true;
                        param.realName = param.realName.substring(1);

                        if (param.realName.startsWith(':')) {
                            param.isExpression = false;
                            param.realName = param.realName.substring(1);
                            param.isEscapedExpression = true;
                        }
                    }

                    node.hasParameters = true;
                    node.parameters.push(param);

                    this.currentContent = [];
                    isParsingParameter = false;
                    parameterStartedOn = -1;
                    parameterNameEndedOn = -1;
                    parameterValueStartedOn = -1;
                    terminatorStyle = '"';
                    continue;
                }
            }

            this.currentContent.push(this.cur as string);
        }

        node.name = this.makeComponentName(node);
        node.parameterContent = this.parameterContent;

        if (node.hasParameters) {
            for (let i = 0; i < node.parameters.length; i++) {
                const thisParam = node.parameters[i];

                if (thisParam.type == ParameterType.InlineEcho) {
                    const content = thisParam.inlineEcho?.content.trim() as string;

                    if (content.toLowerCase().startsWith('$attributes')) {
                        node.receivesAttributeBag = true;
                        break;
                    }
                }
            }
        }
    }

    private makeComponentName(component: BladeComponentNode) {
        const parser = component.getParser() as DocumentParser,
            componentName = new ComponentNameNode(),
            nameStartOffset = component.relativeOffset(this.nameStartsOn + 3),
            nameEndsOffset = component.relativeOffset(this.nameEndsOn + 3);

        componentName.withParser(parser);
        componentName.name = this.name;

        if (component.isClosingTag) {
            componentName.name = component.innerContent.trim().substring(1);
        }

        if (componentName.name.includes(':')) {
            const parts = componentName.name.split(':');
            componentName.name = parts[0];
            componentName.inlineName = parts.slice(1).join(':');
        }

        componentName.startPosition = parser.positionFromOffset(nameStartOffset, nameStartOffset);
        componentName.endPosition = parser.positionFromOffset(nameEndsOffset, nameEndsOffset);

        return componentName;
    }
}

