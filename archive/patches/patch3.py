import re,sys
p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    if n!=count: print('MISMATCH',n,'for',a[:80]); sys.exit(1)
    s=s.replace(a,b)
# slider clears the "night" notice
rep("sun.addEventListener('input',()=>{sunTarget=sunCur=+sun.value;scrub=false;applySun(sunCur)});","sun.addEventListener('input',()=>{sunTarget=sunCur=+sun.value;scrub=false;sunNight=false;applySun(sunCur)});")
# compass with articles
rep("""const COMP={fr:['nord','nord-nord-est','nord-est','est-nord-est','est','est-sud-est','sud-est','sud-sud-est','sud','sud-sud-ouest','sud-ouest','ouest-sud-ouest','ouest','ouest-nord-ouest','nord-ouest','nord-nord-ouest'],
            en:['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest']};""",
"""const COMP={fr:['vers le nord','vers le nord-nord-est','vers le nord-est','vers l\\u2019est-nord-est','vers l\\u2019est','vers l\\u2019est-sud-est','vers le sud-est','vers le sud-sud-est','vers le sud','vers le sud-sud-ouest','vers le sud-ouest','vers l\\u2019ouest-sud-ouest','vers l\\u2019ouest','vers l\\u2019ouest-nord-ouest','vers le nord-ouest','vers le nord-nord-ouest'],
            en:['towards the north','towards the north-northeast','towards the northeast','towards the east-northeast','towards the east','towards the east-southeast','towards the southeast','towards the south-southeast','towards the south','towards the south-southwest','towards the southwest','towards the west-southwest','towards the west','towards the west-northwest','towards the northwest','towards the north-northwest']};""")
rep("`Sun at ${deg}°, towards the ${dir}. The shadow is calculated for Nice, ${date}.`","`Sun at ${deg}°, ${dir}. The shadow is calculated for Nice, ${date}.`")
rep("`Soleil à ${deg}°, vers le ${dir}. L’ombre est calculée pour Nice, le ${date}.`","`Soleil à ${deg}°, ${dir}. L\\u2019ombre est calculée pour Nice, le ${date}.`")
# typographic apostrophes in the French HTML text nodes
head,body=s.split('<body>',1)
body_html,script=body.split('<script>',1)
body_html=re.sub(r'>([^<]*)<',lambda m:'>'+re.sub(r"(?<=\w)'(?=\w)",'’',m.group(1))+'<',body_html)
s=head+'<body>'+body_html+'<script>'+script
open(p,'w',encoding='utf-8').write(s)
print('ok')
