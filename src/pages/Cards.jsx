import {useState} from "react";
import {ref,set,remove} from "firebase/database";
import {db} from "../firebase";
import {useDB,useForm,today} from "../lib";
import {Layout,Field,Confirm,Table,useToast} from "../ui";
import {useAuth} from "../auth";
import {useSubmit} from "../forms";

export default function Cards(){
  const {data,loading}=useDB("settings/manual_cards"),{user}=useAuth(),toast=useToast();
  const [v,f,setV]=useForm({uid:"",label:""}),[del,setDel]=useState(null);
  const rows=Object.entries(data||{}).map(([id,c])=>({...c,id}));
  const [busy,submit]=useSubmit(async()=>{
    const id=v.uid.trim().toUpperCase();
    if(/[.$#[\]\/]/.test(id))throw new Error("Card UID can’t contain . $ # [ ] /");
    if(data?.[id])throw new Error("That card is already registered");
    await set(ref(db,`settings/manual_cards/${id}`),{label:v.label.trim()||null,created:today(),created_by:user.email});
    return "Gate card added";
  },()=>setV({uid:"",label:""}));
  const cols=[{h:"Card UID",c:r=>r.id},{h:"Label",c:r=>r.label||"—"},{h:"Added",c:r=>r.created||"—"},
    {h:"",c:r=><button className="btn sm danger" onClick={()=>setDel(r)}>Remove</button>}];
  return <Layout title="Gate cards">
    <p className="mut">A registered card opens the gate with no registration, expiry or parked-status checks. Each tap is logged and flagged <b>Needs details</b> so the guard can add who entered.</p>
    <form className="card" onSubmit={submit}>
      <div className="row2"><Field label="Card UID" hint="Same format the reader sends (stored in uppercase)"><input {...f("uid")} required autoComplete="off"/></Field>
        <Field label="Label (optional)"><input {...f("label")} placeholder="e.g. Manual card 1"/></Field></div>
      <button className="btn pri" disabled={busy}>{busy?"Saving…":"Register card"}</button>
    </form>
    <div className="card"><Table cols={cols} rows={rows} loading={loading} empty="No gate cards registered yet."/></div>
    {del&&<Confirm title="Remove gate card" label="Remove" onClose={()=>setDel(null)}
      onOk={()=>remove(ref(db,`settings/manual_cards/${del.id}`)).then(()=>{toast("Card removed");setDel(null);}).catch(()=>toast("Could not remove card","err"))}>
      Remove <b>{del.id}</b>? It will no longer open the gate automatically.</Confirm>}
  </Layout>;
}
