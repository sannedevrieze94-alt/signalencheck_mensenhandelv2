
let type="arbeid";

const data={
arbeid:["Geen betaling","Inname ID","Dwang","Onveilige arbeid"],
seksueel:["Controle derde","Geen vrijheid","Dwang"],
crimineel:["Aangestuurd","Dwang","Geldezel"]
};

function toggleMenu(){
let m=document.getElementById("menu");
m.style.display=m.style.display==="block"?"none":"block";
}

function selectType(t){
type=t;
render();
}

function render(){
let html="";
data[type].forEach(s=>{
html+=`<label><input type='checkbox' value='${s}'> ${s}</label><br>`;
});
document.getElementById("signals").innerHTML=html;
}

function calc(){
let c=document.querySelectorAll("input:checked").length;

let K=1+(c*0.5);
let G=c>3?10:3;
let B=c>2?3:1;

let R=K*G*B;

let level="LAAG";
let perc=30;

if(R>60){{level="HOOG";perc=100}}
else if(R>25){{level="MIDDEL";perc=60}}

let bar=document.getElementById("bar");
bar.style.width=perc+"%";
bar.style.background=level=="HOOG"?"red":level=="MIDDEL"?"orange":"green";

document.getElementById("result").innerText="Risico: "+level;

let adv="";
if(level=="LAAG") adv+="<div class='card'>OOV intern bespreken</div>";
if(level=="MIDDEL") adv+="<div class='card'>Time2Connect inschakelen</div>";
if(level=="HOOG") adv+="<div class='card'>TMM + politie</div>";

document.getElementById("advies").innerHTML=adv;
}

function pdf(){
const {{ jsPDF }} = window.jspdf;
let doc=new jsPDF();
doc.text("Signalencheck Rapport",10,10);
doc.text(document.getElementById("result").innerText,10,20);
doc.save("rapport.pdf");
}

render();
