/* Signalencheck v4 — gecombineerde waarnemingen en relatieve signaalprofielen. */
(function (root) {
  "use strict";
  const VERSION = "4.0.0-prototype";
  const STATUSES = Object.freeze({unknown:"Niet beoordeeld", yes:"Ja", no:"Nee"});
  const FORMS = Object.freeze([
    {id:"arbeid", title:"Arbeidsuitbuiting"},
    {id:"seksueel", title:"Seksuele uitbuiting"},
    {id:"crimineel", title:"Criminele uitbuiting"}
  ]);

  function createState(catalog) {
    return {
      revision:0, dirty:false, snapshot:null,
      context:{
        caseCode:"", observedAt:"", observer:"", location:"", controlType:"", locationType:"",
        acuteConcern:"unknown",
        covertStart:"", covertEnd:"", covertTarget:"", covertFootfall:"unknown",
        covertPersonsSeen:"", covertShortVisits:"unknown", covertThirdPartyControl:"unknown",
        covertExchange:"unknown", covertCourierPattern:"unknown", covertWebsiteMatch:"unknown",
        covertWebsiteName:"", covertWebsiteReference:"", covertVehicleMovements:"",
        covertPlateNumbers:"", covertPersonCharacteristics:"", covertPattern:"", covertNotes:""
      },
      answers:Object.fromEntries(catalog.map(item=>[item.id,{status:"unknown",note:""}]))
    };
  }

  function invalidate(state){ state.revision+=1; state.dirty=true; state.snapshot=null; }
  function setContext(state,key,value){
    if(!Object.hasOwn(state.context,key)) throw new Error("Onbekend invoerveld.");
    const next=String(value ?? "").slice(0,20000);
    if(state.context[key]!==next){state.context[key]=next;invalidate(state);}
  }
  function setAnswer(state,id,status,note=""){
    if(!Object.hasOwn(state.answers,id)||!Object.hasOwn(STATUSES,status)) throw new Error("Onbekende waarneming of antwoord.");
    const next={status,note:String(note ?? "").slice(0,2000)};
    const prev=state.answers[id];
    if(prev.status!==next.status||prev.note!==next.note){state.answers[id]=next;invalidate(state);}
  }

  function profile(state,catalog){
    return FORMS.map(form=>{
      const relevant=catalog.filter(item=>(item.weights?.[form.id]||0)>0);
      const assessed=relevant.filter(item=>["yes","no"].includes(state.answers[item.id].status));
      const yes=assessed.filter(item=>state.answers[item.id].status==="yes");
      const yesWeight=yes.reduce((s,item)=>s+(item.weights[form.id]||0),0);
      const assessedWeight=assessed.reduce((s,item)=>s+(item.weights[form.id]||0),0);
      const match=assessedWeight?Math.round((yesWeight/assessedWeight)*100):null;
      const enough=assessed.length>=5;
      let label="Onvoldoende beoordeeld";
      if(enough){
        if(match<20) label="Weinig signaalmatch";
        else if(match<40) label="Beperkte signaalmatch";
        else if(match<65) label="Verhoogde signaalmatch";
        else label="Sterke signaalmatch";
      }
      return Object.freeze({
        ...form, match: enough?match:null, rawMatch:match, enough,
        assessedCount:assessed.length, totalRelevant:relevant.length,
        yesCount:yes.length, yesWeight, assessedWeight, label
      });
    });
  }

  function counts(state,catalog){
    return catalog.reduce((out,item)=>{out[state.answers[item.id].status]+=1;return out;},{yes:0,no:0,unknown:0});
  }

  function positiveEntries(state,catalog){
    return catalog.filter(item=>state.answers[item.id].status==="yes")
      .map(item=>({...item,note:state.answers[item.id].note}));
  }

  function formatMoment(raw){
    const v=String(raw||"").trim();
    if(!v) return "niet ingevuld";
    const m=v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    return m?`${m[3]}-${m[2]}-${m[1]} om ${m[4]}:${m[5]} uur`:v;
  }
  function text(v){return String(v||"").trim();}

  function covertLines(c){
    const lines=[];
    if(text(c.covertStart)||text(c.covertEnd)) lines.push(`Observatieperiode: ${formatMoment(c.covertStart)}${text(c.covertEnd)?" tot "+formatMoment(c.covertEnd):""}.`);
    if(text(c.covertTarget)) lines.push("Object/locatie: "+text(c.covertTarget)+".");
    if(c.covertFootfall==="yes") lines.push("Aanloop of bezoekbewegingen zijn waargenomen.");
    if(text(c.covertPersonsSeen)) lines.push(`Aantal waargenomen personen: ${text(c.covertPersonsSeen)}.`);
    if(c.covertShortVisits==="yes") lines.push("Korte of repeterende bezoeken zijn waargenomen.");
    if(c.covertThirdPartyControl==="yes") lines.push("Er zijn feitelijke aanwijzingen waargenomen van sturing of controle door een derde.");
    if(c.covertExchange==="yes") lines.push("Overdracht van geld, goederen of andere objecten is waargenomen.");
    if(c.covertCourierPattern==="yes") lines.push("Koeriers- of haal/brengbewegingen zijn waargenomen.");
    if(c.covertWebsiteMatch==="yes"){
      let s="De situatie kon worden gerelateerd aan een openbare online bron";
      if(text(c.covertWebsiteName)) s+=`, te weten ${text(c.covertWebsiteName)}`;
      if(text(c.covertWebsiteReference)) s+=` (${text(c.covertWebsiteReference)})`;
      lines.push(s+".");
    }
    if(text(c.covertVehicleMovements)) lines.push("Voertuigbewegingen: "+text(c.covertVehicleMovements));
    if(text(c.covertPlateNumbers)) lines.push("Waargenomen kentekens: "+text(c.covertPlateNumbers));
    if(text(c.covertPersonCharacteristics)) lines.push("Feitelijk waarneembare persoonskenmerken: "+text(c.covertPersonCharacteristics));
    if(text(c.covertPattern)) lines.push("Terugkerend patroon: "+text(c.covertPattern));
    if(text(c.covertNotes)) lines.push(text(c.covertNotes));
    return lines;
  }

  function createSnapshot(state,catalog,now=new Date().toISOString()){
    return {
      version:VERSION, generatedAt:now, context:{...state.context},
      counts:counts(state,catalog), profiles:profile(state,catalog),
      positiveEntries:positiveEntries(state,catalog),
      covert:covertLines(state.context)
    };
  }

  function reportText(snapshot){
    const c=snapshot.context;
    const lines=[
      "RAPPORT VAN BEVINDINGEN – TOEZICHT MENSENHANDEL","",
      "Rapport-/zaakcode: "+(text(c.caseCode)||"niet ingevuld"),
      "Toezichthouder: "+(text(c.observer)||"niet ingevuld"),
      "Datum en tijdstip: "+formatMoment(c.observedAt),
      "Locatie: "+(text(c.location)||"niet ingevuld"),
      "Type controle: "+(text(c.controlType)||"niet ingevuld"),"",
      "AANLEIDING EN CONTROLE",
      `Ik, toezichthouder in dienst van de gemeente Emmen, handelend in mijn hoedanigheid van toezichthouder als bedoeld in artikel 5:11 van de Algemene wet bestuursrecht (Awb), bevond mij op ${formatMoment(c.observedAt)} op ${text(c.location)||"de genoemde locatie"}.`
    ];
    if(snapshot.positiveEntries.length){
      lines.push("","WAARGENOMEN BEVINDINGEN");
      for(const entry of snapshot.positiveEntries){
        lines.push("- "+entry.text+(text(entry.note)?" — "+text(entry.note):""));
      }
    }
    if(snapshot.covert.length) lines.push("","HEIMELIJKE WAARNEMING",...snapshot.covert);
    lines.push("","Dit rapport bevat feitelijke waarnemingen. De relatieve signaalprofielen uit de app maken geen deel uit van het rapport van bevindingen.");
    lines.push("","Opgemaakt op "+new Date(snapshot.generatedAt).toLocaleString("nl-NL")+".");
    return lines.join("\n");
  }

  const api={VERSION,STATUSES,FORMS,createState,setContext,setAnswer,profile,counts,positiveEntries,createSnapshot,reportText};
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  else root.SignalenModel=api;
})(typeof globalThis!=="undefined"?globalThis:this);
