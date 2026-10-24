import {useEffect,useMemo,useState} from "react";
import {ref,onValue} from "firebase/database";
import {db} from "./firebase";

// Live subscription to a database path.
export function useDB(path){
  const [s,setS]=useState({data:null,loading:true});
  useEffect(()=>{
    setS({data:null,loading:true});
    return onValue(ref(db,path),x=>setS({data:x.val(),loading:false}),()=>setS({data:null,loading:false}));
  },[path]);
  return s;
}
export const today=()=>new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
export const isStaff=(id,u={})=>id.startsWith("E")||!!u.department;
export const parkedOf=u=>Object.values(u.vehicles||{}).some(v=>v.current_status==="parked");
const fmt=a=>a.timestamp
  ?new Date(a.timestamp).toLocaleString("en-PH",{...(a.isUTC&&{timeZone:"Asia/Manila"}),dateStyle:"medium",timeStyle:"short"})
  :a.timestamp_human||"N/A";

// Logs joined with students in memory (one subscription each, no per-row fetches).
export function useActivities(){
  const logs=useDB("access_logs"),st=useDB("students");
  const students=st.data||{};
  const rows=useMemo(()=>Object.entries(logs.data||{}).map(([id,a])=>{
    const vis=a.user_type==="visitor",s=students[a.student_id]||{},veh=s.vehicles?.[a.card_uid]||{},d=a.visitor_data||{};
    return {...a,id,
      name:a.needs_details?"Unidentified":vis?d.name||"Visitor":s.name||"N/A",
      vtype:(vis?d.vehicle_type:veh.type)||"N/A",
      plate:(vis?d.plate_number:veh.plate_number)||"N/A",
      kind:a.needs_details?"pending":vis?"visitor":isStaff(a.student_id||"",s)?"staff":"student",
      label:!a.granted?"Denied":a.access_type==="EXIT"?"Exit":a.access_type==="ENTRANCE"?"Entry":a.access_type||"Unknown",
      time:fmt(a),
      date:a.timestamp?new Date(a.timestamp).toLocaleDateString("en-CA"):""};
  }).sort((x,y)=>y.timestamp-x.timestamp),[logs.data,st.data]);
  return {rows,students,loading:logs.loading||st.loading};
}
export function useUsers(){
  const {data,loading}=useDB("students");
  const rows=useMemo(()=>Object.entries(data||{}).map(([id,s])=>({...s,id,
    kind:isStaff(id,s)?"staff":"student",count:Object.keys(s.vehicles||{}).length,parked:parkedOf(s)}))
    .sort((a,b)=>(a.name||"").localeCompare(b.name||"")),[data]);
  return {rows,loading};
}
export function usePaged(rows,init=25){
  const [size,setSize]=useState(init),[page,setPage]=useState(1);
  useEffect(()=>setPage(1),[rows.length]);
  const pages=size?Math.max(1,Math.ceil(rows.length/size)):1,p=Math.min(page,pages);
  return {items:size?rows.slice((p-1)*size,p*size):rows,page:p,pages,size,setPage,setSize:n=>{setSize(n);setPage(1);}};
}
export function useForm(init){
  const [v,setV]=useState(init);
  const f=k=>({value:v[k]??"",onChange:e=>setV(s=>({...s,[k]:e.target.value}))});
  return [v,f,setV];
}
