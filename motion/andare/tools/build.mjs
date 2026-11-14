// Assemble a self-contained page from a template: inlines the STAGE kit, SOUND kit and the style.
// node tools/build.mjs <template> <out> [stills.json]
import fs from 'node:fs';
import path from 'node:path';
const dir = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const [tpl, out, pre] = process.argv.slice(2);
const read = (p) => fs.readFileSync(path.join(dir, p), 'utf8');
let html = fs.readFileSync(path.resolve(tpl), 'utf8');
const put = (mark, text) => { if (text.includes('</script')) throw new Error(mark + ' contains </script'); html = html.split(mark).join(text); };
put('/*__STAGE__*/', read('lib/stage.js'));
put('/*__SOUND__*/', read('lib/sound.js'));
put('/*__STYLE__*/', read('andare-style.js'));
put('/*__PRE__*/null', pre ? fs.readFileSync(path.resolve(pre), 'utf8') : 'null');
fs.writeFileSync(path.resolve(out), html);
console.log('wrote', out, (html.length / 1024).toFixed(0) + ' KB');
