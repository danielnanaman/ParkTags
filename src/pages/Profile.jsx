import {useState} from "react";
import {Link,useNavigate,useParams} from "react-router-dom";
import {ref,remove,update} from "firebase/database";
import {db} from "../firebase";
import {useDB,useForm,isStaff,today} from "../lib";
import {Layout,Modal,Confirm,Badge,useToast} from "../ui";
import {Actions,PersonFields,personData,useSubmit,VehicleModal} from "../forms";

function EditModal({id,s,onClose}){
  const e=s.emergency_contact||{};
  const [v,f]=useForm({name:s.name||"",course:s.course||"",year:s.year_level||"",email:s.email||"",phone:s.contact_number||"",en:e.name||"",ep:e.phone||"",er:e.relationship||""});
  const [busy,submit]=useSubmit(async()=>{await update(ref(db,`students/${id}`),personData(v));return "Profile updated";},onClose);
  return <Modal title="Edit profile" onClose={onClose}><form onSubmit={submit}>
    <PersonFields f={f} staff={isStaff(id,s)}/><Actions onClose={onClose} busy={busy} label="Save"/></form></Modal>;
}

export default function Profile(){
  const {id}=useParams(),nav=useNavigate(),toast=useToast();
  const {data:s,loading}=useDB(`students/${id}`);
  const [m,setM]=useState(null),close=()=>setM(null);
  if(loading)return <Layout title="Profile"><div className="skel" style={{height:260}}/></Layout>;
  if(!s)return <Layout title="User not found"><div className="card empty">No user with ID “{id}”. <Link to="/users">Back to users</Link></div></Layout>;
  const veh=Object.entries(s.vehicles||{}),parked=veh.filter(([,x])=>x.current_status==="parked").length,ec=s.emergency_contact;
  const ini=(s.name||"?").split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase();
  const I=(l,x)=><div key={l}><b>{l}</b>{x||"N/A"}</div>;
  const run=async(fn,ok)=>{try{await fn();toast(ok);close();}catch{toast("Something went wrong. Please try again.","err");}};
  const delUser=()=>run(async()=>{await remove(ref(db,`students/${id}`));nav("/users");},"User deleted");
  const delVeh=()=>run(()=>update(ref(db),{[`students/${id}/vehicles/${m.vid}`]:null,[`students/${id}/last_updated`]:today()}),"Vehicle deleted");
  return <Layout title="Profile" actions={<>
      <button className="btn" onClick={()=>setM({t:"edit"})}>Edit profile</button>
      <button className="btn danger" onClick={()=>setM({t:"del"})}>Delete user</button></>}>
    <Link to="/users" className="back">← All users</Link>
    <div className="prof">
      <aside className="card side">
        <div className="avatar">{ini}</div><h2>{s.name||"N/A"}</h2><p className="mut">{id}</p>
        <Badge>{isStaff(id,s)?"Staff":"Student"}</Badge>
        <ul><li>📧 {s.email||"N/A"}</li><li>📱 {s.contact_number||"N/A"}</li><li>🎓 {s.course||s.department||"N/A"}</li>
          {s.year_level&&<li>📚 Year {s.year_level}</li>}</ul>
        <div className="info"><div><b>Vehicles</b>{veh.length}</div><div><b>Parked now</b>{parked}</div></div>
      </aside>
      <div>
        <section className="card"><h2>Emergency contact</h2>
          {ec?<div className="info">{I("Name",ec.name)}{I("Relationship",ec.relationship)}{I("Phone",ec.phone)}</div>:<p className="mut">No emergency contact on file.</p>}</section>
        <section className="card"><h2>Vehicles ({veh.length}) <button className="btn sm pri" onClick={()=>setM({t:"veh"})}>+ Add vehicle</button></h2>
          {!veh.length&&<p className="empty">No vehicles registered.</p>}
          <div className="vgrid">{veh.map(([vid,x])=><div className="veh" key={vid}>
            <div className="vh"><b>{vid}</b><Badge cls={x.current_status==="parked"?"ok":"mut"}>{x.current_status==="parked"?"Parked":"Not parked"}</Badge></div>
            <dl><dt>Type</dt><dd>{x.type||"N/A"}</dd><dt>Vehicle</dt><dd>{x.brand} {x.model}</dd><dt>Plate</dt><dd>{x.plate_number||"N/A"}</dd>
              <dt>Color</dt><dd>{x.color||"N/A"}</dd><dt>Expires</dt><dd>{x.registration_expiry||"N/A"}</dd></dl>
            <div className="mact"><button className="btn sm" onClick={()=>setM({t:"veh",vid})}>Edit</button>
              <button className="btn sm danger" onClick={()=>setM({t:"delveh",vid})}>Delete</button></div>
          </div>)}</div></section>
        <section className="card"><h2>Account</h2><div className="info">{I("Registered",s.date_registered)}{I("Last updated",s.last_updated)}</div></section>
      </div>
    </div>
    {m?.t==="edit"&&<EditModal id={id} s={s} onClose={close}/>}
    {m?.t==="veh"&&<VehicleModal sid={id} vid={m.vid} vehicles={s.vehicles} onClose={close}/>}
    {m?.t==="del"&&<Confirm title="Delete user" label="Delete user" onClose={close} onOk={delUser}>
      Permanently delete <b>{s.name}</b> ({id}) and all their vehicles? This cannot be undone.</Confirm>}
    {m?.t==="delveh"&&<Confirm title="Delete vehicle" label="Delete vehicle" onClose={close} onOk={delVeh}>
      Remove vehicle <b>{m.vid}</b> from this profile? This cannot be undone.</Confirm>}
  </Layout>;
}
