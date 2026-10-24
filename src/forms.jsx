import {useState} from "react";
import {ref,get,set,push,update} from "firebase/database";
import {db} from "./firebase";
import {today,useForm} from "./lib";
import {Modal,Field,useToast} from "./ui";
import {useAuth} from "./auth";

// Runs an async save, toasts the result, closes on success, blocks double-submits.
export function useSubmit(fn,onDone){
  const toast=useToast(),[busy,setBusy]=useState(false);
  return [busy,async e=>{
    e.preventDefault();setBusy(true);
    try{toast(await fn());onDone();}
    catch(err){toast(err.message||"Something went wrong. Please try again.","err");}
    finally{setBusy(false);}
  }];
}
export const Actions=({onClose,busy,label})=><div className="mact">
  <button type="button" className="btn" onClick={onClose}>Cancel</button>
  <button className="btn pri" disabled={busy}>{busy?"Saving…":label}</button></div>;

const TYPES=["car","motorcycle"];
export const vInit=(id="",x={})=>({vid:id,vtype:!x.type?"":TYPES.includes(x.type)?x.type:"Other",custom:TYPES.includes(x.type)?"":x.type||"",
  brand:x.brand||"",model:x.model||"",plate:x.plate_number||"",color:x.color||"",expiry:x.registration_expiry||"",status:x.current_status||"not parked"});
export const vehicleData=(v,status="not parked")=>({type:v.vtype==="Other"?v.custom.trim():v.vtype,brand:v.brand.trim(),model:v.model.trim(),
  plate_number:v.plate.trim(),color:v.color.trim(),registration_expiry:v.expiry,is_active:true,current_status:status});
const TypeSelect=({f,v,name="vtype"})=><>
  <Field label="Vehicle type"><select {...f(name)} required><option value="">Select…</option><option value="car">Car</option><option value="motorcycle">Motorcycle</option><option value="Other">Other</option></select></Field>
  {v[name]==="Other"&&<Field label="Specify type"><input {...f("custom")} required/></Field>}</>;
export const VehicleFields=({f,v,withId=true})=><>
  {withId&&<Field label="RFID tag / Vehicle ID"><input {...f("vid")} required/></Field>}
  <TypeSelect f={f} v={v}/>
  <div className="row2"><Field label="Brand"><input {...f("brand")} required/></Field><Field label="Model"><input {...f("model")} required/></Field></div>
  <div className="row2"><Field label="Plate number"><input {...f("plate")} required/></Field><Field label="Color"><input {...f("color")} required/></Field></div>
  <Field label="Registration expiry"><input type="date" {...f("expiry")} required/></Field></>;

export const personInit={name:"",id:"",course:"",year:"",email:"",phone:"",en:"",ep:"",er:""};
export const personData=v=>({name:v.name.trim(),course:v.course.trim(),email:v.email.trim(),contact_number:v.phone.trim(),
  year_level:v.year?+v.year:null,last_updated:today(),emergency_contact:{name:v.en.trim(),phone:v.ep.trim(),relationship:v.er.trim()}});
export const PersonFields=({f,staff,withId})=><>
  <Field label="Full name"><input {...f("name")} required autoComplete="off"/></Field>
  {withId&&<Field label="Student / Staff ID" hint="Staff IDs start with E"><input {...f("id")} required autoComplete="off"/></Field>}
  <div className="row2"><Field label="Course / Department"><input {...f("course")} required/></Field>
    <Field label={staff?"Year level (optional)":"Year level"}><input type="number" min="1" max="5" {...f("year")} required={!staff}/></Field></div>
  <Field label="Email"><input type="email" {...f("email")} required/></Field>
  <Field label="Contact number"><input type="tel" {...f("phone")} required/></Field>
  <h4>Emergency contact</h4>
  <Field label="Name"><input {...f("en")} required/></Field>
  <div className="row2"><Field label="Phone"><input type="tel" {...f("ep")} required/></Field><Field label="Relationship"><input {...f("er")} required/></Field></div></>;

export function UserModal({onClose}){
  const [v,f]=useForm({...personInit,...vInit()}),staff=v.id.trim().startsWith("E");
  const [busy,submit]=useSubmit(async()=>{
    const id=v.id.trim();
    if((await get(ref(db,`students/${id}`))).exists())throw new Error("That Student/Staff ID is already registered");
    await set(ref(db,`students/${id}`),{...personData(v),date_registered:today(),status:"active",vehicles:{[v.vid.trim()]:vehicleData(v)}});
    return "User added";
  },onClose);
  return <Modal title="Add user" onClose={onClose}><form onSubmit={submit}>
    <PersonFields f={f} staff={staff} withId/><h4>Vehicle</h4><VehicleFields f={f} v={v}/>
    <Actions onClose={onClose} busy={busy} label="Add user"/></form></Modal>;
}

export function VehicleModal({sid,vid,vehicles,onClose}){
  const old=vehicles?.[vid]||{},[v,f]=useForm(vInit(vid,old));
  const [busy,submit]=useSubmit(async()=>{
    const id=v.vid.trim(),b=`students/${sid}`;
    if(id!==vid&&vehicles?.[id])throw new Error("That vehicle ID already exists for this user");
    await update(ref(db),{[`${b}/vehicles/${id}`]:{...old,...vehicleData(v,vid?v.status:"not parked")},
      ...(vid&&id!==vid?{[`${b}/vehicles/${vid}`]:null}:{}),[`${b}/last_updated`]:today()});
    return vid?"Vehicle updated":"Vehicle added";
  },onClose);
  return <Modal title={vid?"Edit vehicle":"Add vehicle"} onClose={onClose}><form onSubmit={submit}>
    <VehicleFields f={f} v={v}/>
    {vid&&<Field label="Status"><select {...f("status")}><option value="parked">Parked</option><option value="not parked">Not parked</option></select></Field>}
    <Actions onClose={onClose} busy={busy} label={vid?"Save":"Add vehicle"}/></form></Modal>;
}

// New manual entry, or (when `log` is given) completes a gate-card tap that has no details yet.
export function ActivityModal({students,log,onClose}){
  const {user}=useAuth();
  const [v,f,setV]=useForm({kind:"student",sid:"",vid:"",vname:"",vtype:"",custom:"",plate:"",remarks:"",
    access:log?.access_type==="EXIT"?"EXIT":"ENTRANCE",ts:""});
  const stu=students[v.sid.trim()];
  const [busy,submit]=useSubmit(async()=>{
    let d;
    if(v.kind==="student"){
      if(!stu?.vehicles?.[v.vid])throw new Error("Choose a registered ID and one of its vehicles");
      d={student_id:v.sid.trim(),card_uid:v.vid};
    }else{
      const plate=v.plate.trim();
      d={student_id:`VISITOR_${Date.now()}`,card_uid:`VISITOR_${plate.replace(/\s+/g,"_").toUpperCase()}`,
        visitor_data:{name:v.vname.trim(),vehicle_type:v.vtype==="Other"?v.custom.trim():v.vtype,plate_number:plate}};
    }
    const data={...d,user_type:v.kind,access_type:v.access,remarks:v.remarks.trim()||null,recorded_by:user?.email||null};
    if(log)await update(ref(db,`access_logs/${log.id}`),{...data,needs_details:null,manual_card_uid:log.card_uid||null});
    else await push(ref(db,"access_logs"),{...data,granted:true,reader:"MANUAL",manual_entry:true,timestamp:v.ts?new Date(v.ts).getTime():Date.now()});
    if(v.kind==="student")await set(ref(db,`students/${d.student_id}/vehicles/${d.card_uid}/current_status`),v.access==="ENTRANCE"?"parked":"not parked");
    return log?"Details saved":"Activity recorded";
  },onClose);
  return <Modal title={log?"Add details":"Manual entry"} onClose={onClose}><form onSubmit={submit}>
    {log&&<p className="note">Gate card tap · <b>{log.label}</b> · {log.time}<br/>Card {log.card_uid||"N/A"}. Add who came through so the log is complete.</p>}
    <div className="seg">{[["student","Student / Staff"],["visitor","Visitor"]].map(([k,l])=>
      <button type="button" key={k} className={"btn"+(v.kind===k?" on":"")} onClick={()=>setV(s=>({...s,kind:k}))}>{l}</button>)}</div>
    {v.kind==="student"?<>
      <Field label="Student / Staff ID" hint={v.sid&&!stu?"No registered user with this ID":stu?.name}>
        <input list="sids" {...f("sid")} required autoComplete="off"/>
        <datalist id="sids">{Object.entries(students).map(([id,s])=><option key={id} value={id}>{s.name}</option>)}</datalist></Field>
      <Field label="Vehicle"><select {...f("vid")} required>
        <option value="">{stu?"Select vehicle…":"Enter a valid ID first"}</option>
        {Object.entries(stu?.vehicles||{}).map(([id,x])=><option key={id} value={id}>{x.plate_number} · {x.brand} {x.model}</option>)}</select></Field>
    </>:<>
      <Field label="Visitor name"><input {...f("vname")} required/></Field>
      <TypeSelect f={f} v={v}/>
      <Field label="Plate number"><input {...f("plate")} required/></Field>
    </>}
    <div className="row2">
      <Field label="Entry or exit"><select {...f("access")}><option value="ENTRANCE">Entry</option><option value="EXIT">Exit</option></select></Field>
      {!log&&<Field label="Time" hint="Leave blank for now"><input type="datetime-local" {...f("ts")}/></Field>}</div>
    <Field label="Remarks (optional)"><textarea rows="2" maxLength="300" {...f("remarks")}/></Field>
    <Actions onClose={onClose} busy={busy} label={log?"Save details":"Record"}/></form></Modal>;
}
