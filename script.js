
let tab="arbeid";

const data={
arbeid:{
spec:["Geen betaling","Inname ID","Onveilige arbeid"],
alg:["Angstig gedrag","Geen documenten"],
omg:["Meerdere meldingen","Bekende locatie"]
},
seksueel:{
spec:["Controle door derde","Geen vrijheid"],
alg:["Angstig gedrag","Geen documenten"],
omg:["Meerdere meldingen","Bekende locatie"]
},
crimineel:{
spec:["Aangestuurd gedrag","Schulden/dwang"],
alg:["Angstig gedrag","Geen documenten"],
omg:["Meerdere meldingen","Bekende locatie"]
}
};

function setTab(t){
tab=t;
render();
}

function render(){
let html="";
["spec","alg","omg"].forEach(type=>{
html+=`<div class='section'><h3>${type}</h3>`;
data[tab][type].forEach(s=>{
html+=`<label class='signal'><input type='checkbox' class='chk' data-type='${type}'> ${s}</label>`;
});
html+="</div>";
});
document.getElementById("signals").innerHTML=html;
}

function calculate(){
let checks=document.querySelectorAll(".chk:checked");
let count=checks.length;

let k=1+(count*0.5);
let g=count>5?10:count>3?5:1;
let b=count>4?3:count>2?2:1;

let r=k*g*b;

let level="LAAG";
if(r>80) level="HOOG";
else if(r>30) level="MIDDEL";

document.getElementById("result").innerText="Risico: "+level;

let adv=document.getElementById("advies");

let contacts={
laag:[
{name:"Marieke Sloots",rol:"OOV",advies:"Intern bespreken"},
{name:"Daan Huizing",rol:"Mensenhandel",advies:"Monitoren"}
],
middel:[
{name:"Laura Meems",rol:"RIEC",advies:"Opschalen overleg"},
{name:"Niek Kamps",rol:"Zorg",advies:"Zorg inschakelen"}
],
hoog:[
{name:"Iris van Praag",rol:"Politie AVIM",advies:"Direct opschalen"},
{name:"Samir El Azzouzi",rol:"Arbeidsinspectie",advies:"Onderzoek starten"}
]
};

let lijst="";
let set=level=="LAAG"?contacts.laag:level=="MIDDEL"?contacts.middel:contacts.hoog;

set.forEach(c=>{
lijst+=`<div class='card'><b>${c.name}</b> (${c.rol})<br>Advies: ${c.advies}</div>`;
});

adv.innerHTML=lijst;
}

render();
