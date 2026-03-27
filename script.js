
let current="arbeid";

const data={
arbeid:{spec:["Geen betaling","Inname ID"],alg:["Angstig gedrag"],omg:["Meerdere meldingen"]},
seksueel:{spec:["Controle derde"],alg:["Angstig gedrag"],omg:["Meerdere meldingen"]},
crimineel:{spec:["Dwang"],alg:["Angstig gedrag"],omg:["Meerdere meldingen"]}
};

function openTab(t){
current=t;
document.getElementById("home").classList.add("hidden");
document.getElementById("app").classList.remove("hidden");
document.getElementById("title").innerText=t;
render();
}

function render(){
let html="";
["spec","alg","omg"].forEach(type=>{
html+="<h4>"+type+"</h4>";
data[current][type].forEach(s=>{
html+=`<label><input type='checkbox' class='chk' value='${s}'> ${s}</label><br>`;
});
});
document.getElementById("signals").innerHTML=html;
}

function calc(){
let c=document.querySelectorAll(".chk:checked").length;
let K=1+(c*0.5);
let G=c>5?10:c>3?5:1;
let B=c>4?3:c>2?2:1;
let R=K*G*B;

let level="LAAG";
let perc=30;

if(R>60){level="HOOG";perc=100;}
else if(R>25){level="MIDDEL";perc=65;}

let fill=document.getElementById("fill");
fill.style.width=perc+"%";
fill.style.background=level=="HOOG"?"red":level=="MIDDEL"?"orange":"green";

document.getElementById("result").innerText="Risico: "+level;
}

function downloadPDF(){
const { jsPDF } = window.jspdf;
let doc = new jsPDF();

doc.setFontSize(16);
doc.text("Signalencheck Rapport - Gemeente Emmen", 10, 10);

doc.setFontSize(10);
doc.text("Datum: " + new Date(), 10, 20);
doc.text("Locatie: " + document.getElementById("locatie").value, 10, 30);

let y = 50;
doc.text("Geselecteerde signalen:", 10, y);
y += 10;

document.querySelectorAll(".chk:checked").forEach(el=>{
 doc.text("- " + el.value, 10, y);
 y+=8;
});

doc.text("Resultaat: " + document.getElementById("result").innerText, 10, y+10);

doc.save("rapport_mensenhandel.pdf");
}
