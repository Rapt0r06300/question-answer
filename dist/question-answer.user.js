// ==UserScript==
// @name         Question Answer
// @namespace    https://github.com/Rapt0r06300/question-answer
// @version      0.1.0
// @description  iPhone-first truthful survey assistant for Safari Userscripts
// @match        https://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @inject-into  content
// @run-at       document-idle
// ==/UserScript==

(() => {
'use strict';

async function bootstrap() {
  return { name: 'Question Answer', version: '0.1.0' };
}

if (typeof window !== 'undefined') {
  void bootstrap();
}

})();
