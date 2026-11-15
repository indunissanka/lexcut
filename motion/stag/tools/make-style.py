# Assemble stag-style.js: content head (+ BEATS from the voiceover words, BOARD, ASSUMPTIONS) + the pop-up engine + the score.
# python3 tools/make-style.py words.json
import json, sys, re, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
beats = json.load(open(sys.argv[1]))
SHOW = ["Cover: the family at home; an invitation card pops up on \"invited\"",
 "Andare jumps up on \"Andare\"",
 "Page turns: mother at the mirror; a memory of his mischief on \"mischievous\", stamped with an X on \"no\"",
 "Her bag and umbrella come up on \"ready\"",
 "Ribbon \"I want to go!\" rises on \"I want\"",
 "Page turns: mother, finger up; a card \"1\" on \"one\"",
 "Ribbon \"Like a bull\" on \"like\"; a quiet bull in a thought cloud on \"bull\"",
 "Page turns to the road: Andare nods on \"agreed\", mother on \"set off\", the leaf arch on \"wedding\"",
 "Ribbon \"Wait outside\" on \"outside\"; mother sinks away on \"stepped\"",
 "Page turns inside: the couple on the poruwa; a cloud of good Andare on \"son\"; ribbon \"Being good\" on \"good\"",
 "Hold",
 "Page turns to the yard: a dust cloud of tumbling guests on \"huge\"; ribbon on \"commotion\"",
 "Mother runs out on \"running\"",
 "Page turns: there was Andare, on his hands and knees",
 "He lunges on \"charging\" and \"headbutting\"; ribbon \"Headbutting!\"; guests tumble on \"men\" and \"young\"",
 "His head rocks side to side; a last lunge on \"ramming\"",
 "Page turns: mother grabs him",
 "\"?!\" bubble on \"earth\"; ribbon \"What are you doing?\" on \"doing\"",
 "A cloud of the condition (card 1 and the bull) on \"forgotten\"",
 "A tick bubble from Andare on \"remember\"",
 "The guests look on, grumpy",
 "Page turns: Andare explains; ribbon \"Like a bull!\" on \"like\"; the bull cloud again on \"bull\"",
 "Andare drops to his hands and knees and charges a guest on \"headbutting\"",
 "Page turns: everyone shocked; the pull tab turns every face to laughter on \"burst out laughing\""]
B = ',\n'.join('    ' + json.dumps({'t': b['t'], 'say': b['say'], 'show': s, 'words': b['words']}, ensure_ascii=False).replace('", "', '", "') for b, s in zip(beats, SHOW))
BOARD = [
 dict(t=5.7, beats=[1, 2], text='Ribbon: "A Stag at | the Wedding"; invitation card "Wedding"', note='The book is open on the desk. Andare\'s house, father and mother stand on the cover spread with the title ribbon. On "invited" a wedding invitation rises on a paper arm; on "Andare" he jumps up through the page.', cam='Opens close on the left of the spread and drifts right.', sound='Page lands (slap, thud, card creaks), soft ding; a paper pop for the card; a hop and a pop for Andare.'),
 dict(t=17.5, beats=[3, 4, 5], text='Ribbon: "I want | to go!"', note='Page turns indoors. Mother at her mirror with jasmine in her hair; Andare begging. On "mischievous" a thought cloud of him with a broken pot; on "no" a red X stamps over it; on "ready" her bag and umbrella; ribbon on "go".', cam='Breathes out for the turn, then drifts right to left.', sound='Page turn; soft pop for the cloud; a stamp for the X; pop for the bag; paper tick for the ribbon.'),
 dict(t=27.2, beats=[6, 7], text='Ribbon: "Like a | bull"; card "1"', note='Same room, the door now open. Mother raises a finger; a card "1" on "one condition". Ribbon "Like a bull" on "like", and a thought cloud with a calm bull, mouth shut, on "bull".', cam='Drifts left to right.', sound='Page turn; a wooden tock for the card; a soft low moo for the bull.'),
 dict(t=33.7, beats=[8, 9], text='Ribbon: "Wait | outside"', note='Page turns to the road and the wedding house. Andare nods on "agreed", mother appears on "set off", the coconut-leaf arch rises on "wedding". On "outside" the ribbon rises; on "stepped into" mother sinks into the page: she has gone in.', cam='Drifts right to left toward the arch.', sound='Page turn; pops for each arrival; a sparkle for the arch; a soft paper slide as mother goes in.'),
 dict(t=40.6, beats=[10, 11], text='Ribbon: "Being | good"', note='Page turns inside: the bride and groom on the poruwa, a brass oil lamp, guests. Mother stands at the front; on "son" a thought cloud of Andare standing quietly outside, with a tick; ribbon "Being good" on "good".', cam='Drifts left to right across the hall.', sound='Page turn; soft wedding drum taps under the narration; pop for the cloud.'),
 dict(t=50.6, beats=[12, 13], text='Ribbon: "A huge | commotion!"', note='Page turns back to the yard. On "huge" a cartoon dust cloud with guests flying out of it; ribbon on "commotion"; mother runs out of the house on "running".', cam='Drifts right to left.', sound='Page turn; an impact and crowd hubbub; a whoosh as mother runs.'),
 dict(t=61.5, beats=[14, 15, 16], text='Ribbon: "Head | butting!"', note='Page turns: there is Andare on his hands and knees, snorting, in the middle of the yard. He lunges on "charging" and "headbutting" (ribbon rises); a man and a woman tumble on "men"; a boy and an old man on "young". Through line 16 his head rocks side to side, and he rams once more on "ramming".', cam='Drifts left to right, around the charge.', sound='Page turn; thuds on each lunge; tumbling thumps; hubbub underneath.'),
 dict(t=80.6, beats=[17, 18, 19, 20, 21], text='Ribbon: "What are | you doing?"; bubble "?!"', note='Page turns: mother has him by the arm; he looks sheepish; the guests stand grumpy at the sides. "?!" bubble on "earth"; ribbon on "doing"; on "forgotten" a cloud of the condition (card 1 and the bull); a tick bubble from Andare on "remember".', cam='Drifts right to left.', sound='Page turn; a blip for each bubble; a pop for the cloud.'),
 dict(t=93.6, beats=[22, 23], text='Ribbon: "Like a | bull!"', note='Page turns: Andare, cheerful, explains with a hand up; mother puzzled. Ribbon "Like a bull!" on "like", the same bull cloud on "bull". On "headbutting" he drops onto his hands and knees and charges a guest again.', cam='Drifts left to right.', sound='Page turn; the low moo again; a thud and a star for the charge.'),
 dict(t=99.2, beats=[24], text='Ribbon: "Everyone | laughed"', note='Page turns: mother, Andare and a guest stand shocked. The ribbon rises on "everyone", and on "burst out laughing" the pull tab slides out: every shocked face sinks and a laughing one rises in its place. The last second holds on the laughing yard.', cam='Ends in a gentle push in.', sound='Page turn; tape-pull for the tab; a sparkle and a two-note success as everyone laughs.')]
ASSUME = [
 'Timing comes from the audio file, not the pasted line times: the recording runs about 3 s behind them by the end (the last word ends at 98.4 s, so the piece is 99.4 s long). Word times are from Whisper, word by word.',
 'The recording does not say the bracketed "(be as quiet as a mouse)", so nothing on screen shows it. "Behave like a bull" is read as the saying for standing still and silent, like a tethered bull; Andare takes it literally.',
 'The title says "stag", the story says "bull": the title ribbon keeps your title, and every picture inside shows a bull (a humped village bull with curved horns).',
 'Andare has no horns: the story only says he went on his hands and knees, tilting his head and ramming, so he charges head-down, snorting.',
 'Setting: a Sri Lankan village wedding, shown with a coconut-leaf arch (gokkola), the poruwa platform with the bride in white and gold, a brass oil lamp and paper flags.',
 'Andare\'s family on the first spread is his father, mother and Andare. Andare and his mother look the same as in the hopper story.',
 'Each ribbon (and each pop-up piece) rises through a slit in the page on the word it shows, as in the hopper story, so pictures land on their words in a 99-second story.']
head = open(os.path.join(D, 'content.head.js')).read()
head = head.replace('/*BEATS*/', '[\n' + B + '\n  ]').replace('/*BOARD*/', json.dumps(BOARD, indent=1, ensure_ascii=False)).replace('/*ASSUMPTIONS*/', json.dumps(ASSUME, indent=1, ensure_ascii=False))
eng = open(os.path.join(D, '..', 'andare', 'andare-style.js')).read().split('\n')
tail = '\n'.join(eng[469:744])          # the book's clock .. end of build()
def sub(a, b):
    global tail
    assert tail.count(a) == 1, a[:70]; tail = tail.replace(a, b)
sub("id: 'paper-pop-up-andare'", "id: 'paper-pop-up-stag'")
sub("Small pieces come up through slits on the word they show, and a pull tab sends Andare home on the last spread.", "Small pieces come up through slits on the word they show, Andare rocks and lunges on his paper tab, and a pull tab turns every shocked face to laughter on the last spread.")
sub("explains: 'A folk tale in eleven spreads.'", "explains: 'A folk tale in ten spreads.'")
sub("topic: 'Little Hoppers for Little Andare'", "topic: 'A Stag at the Wedding'")
sub("const q = dt > 0 ? 0.085 * (o.sway || 0) * Math.sin(dt * 21) * Math.exp(-dt * 2.4) : 0,", "const q = (o.wob ? o.wob(t) : 0) + (dt > 0 ? 0.085 * (o.sway || 0) * Math.sin(dt * 21) * Math.exp(-dt * 2.4) : 0),")
sub("for (let i = -9; i <= 9; i++) for (let j = -5; j <= 5; j++) hopperTop(a, i * 0.66, j * 0.66 + (i & 1 ? 0.33 : 0), 0.2); };", "for (let i = -9; i <= 9; i++) for (let j = -5; j <= 5; j++) jasmine(a, i * 0.66, j * 0.66 + (i & 1 ? 0.33 : 0), 0.18); };")
sub("// a cup of plain tea, as you would have with hoppers", "// a cup of tea by the book")
sound = open(os.path.join(D, 'sound.js')).read()
open(os.path.join(D, 'stag-style.js'), 'w').write(head + tail + '\n' + sound)
print('ok', len(head + tail + sound) // 1024, 'KB')
