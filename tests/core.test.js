"use strict";
const M=require("../model.js");
const catalog=require("../signals.js");
const assert=(v,m)=>{if(!v)throw new Error(m);};
function test(name,fn){fn();console.log("OK",name);}
test("Algemene signalen zijn verwijderd en omgevingssignalen blijven",()=>{assert(!catalog.some(x=>x.type==="general"),"Algemene signalen aanwezig");assert(catalog.some(x=>x.type==="environment"),"Omgevingssignalen ontbreken");});
test("Eén waarneming kan aan meerdere vormen bijdragen",()=>{const s=M.createState(catalog);["obs-threat-violence","obs-cannot-stop","obs-third-control","obs-hand-over-proceeds","obs-dependent-basics"].forEach(id=>M.setAnswer(s,id,"yes"));const p=M.profile(s,catalog);assert(p.find(x=>x.id==="arbeid").rawMatch>0,"Arbeid geen bijdrage");assert(p.find(x=>x.id==="seksueel").rawMatch>0,"Seksueel geen bijdrage");assert(p.find(x=>x.id==="crimineel").rawMatch>0,"Crimineel geen bijdrage");});
test("Nee verlaagt de relatieve signaalmatch",()=>{const s=M.createState(catalog);const ids=catalog.filter(x=>(x.weights.seksueel||0)>0).slice(0,6).map(x=>x.id);ids.forEach((id,i)=>M.setAnswer(s,id,i<3?"yes":"no"));const sex=M.profile(s,catalog).find(x=>x.id==="seksueel");assert(sex.match!==null&&sex.match>0&&sex.match<100,"Signaalmatch niet genormaliseerd");});
test("Rapport bevat alleen positieve waarnemingen en geen signaalpercentage",()=>{const s=M.createState(catalog);M.setContext(s,"location","Testlocatie");M.setAnswer(s,catalog[0].id,"yes","feit A");M.setAnswer(s,catalog[1].id,"no","feit B");const text=M.reportText(M.createSnapshot(s,catalog));assert(text.includes(catalog[0].text),"Ja-waarneming ontbreekt");assert(!text.includes(catalog[1].text),"Nee-waarneming staat in rapport");assert(!text.includes("%"),"Signaalmatch staat in formeel rapport");});
console.log("4 modelcontroles geslaagd.");
