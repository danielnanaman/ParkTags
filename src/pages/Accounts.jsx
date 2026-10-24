import {useState} from "react";
import {ref,set,update,remove} from "firebase/database";
import {createUserWithEmailAndPassword,signOut} from "firebase/auth";
import {db,auxAuth} from "../firebase";
import {useDB,useForm} from "../lib";
import {Layout,Field,Confirm,Table,Badge,useToast} from "../ui";
import {useAuth} from "../auth";
import {useSubmit} from "../forms";

const init={email:"",pw:"",role:"guard"};
export default function Accounts(){
  const {data,loading}=useDB("roles"),{user}=useAuth(),toast=useToast();
  const [v,f,setV]=useForm(init),[del,setDel]=useState(null);
  const rows=Object.entries(data||{}).map(([id,c])=>({...c,id}));
  const [busy,submit]=useSubmit(async()=>{
    const a=auxAuth();let c;
    try{c=await createUserWithEmailAndPassword(a,v.email.trim(),v.pw);}
    catch(e){throw new Error(e.code==="auth/email-already-in-use"?"That email already has an account":e.code==="auth/weak-password"?"Password must be at least 6 characters":"Could not create the account");}
    await signOut(a);
    await set(ref(db,`roles/${c.user.uid}`),{role:v.role,email:v.email.trim()});
    return "Account created";
  },()=>setV(init));
  const cols=[
    {h:"Email",c:r=>r.email+(r.id===user.uid?" (you)":"")},
    {h:"Role",c:r=>r.role==="device"?<Badge cls="mut">Device</Badge>:<select className="inp sm" value={r.role} disabled={r.id===user.uid} aria-label="Role"
      onChange={e=>update(ref(db,`roles/${r.id}`),{role:e.target.value}).then(()=>toast("Role updated")).catch(()=>toast("Could not change role","err"))}>
      <option value="admin">Admin</option><option value="guard">Guard</option></select>},
    {h:"",c:r=>r.id!==user.uid&&<button className="btn sm danger" onClick={()=>setDel(r)}>Revoke access</button>}];
  return <Layout title="Accounts">
    <form className="card" onSubmit={submit}>
      <h2>Create account</h2>
      <div className="row2"><Field label="Email"><input type="email" {...f("email")} required autoComplete="off"/></Field>
        <Field label="Temporary password"><input type="password" minLength="6" {...f("pw")} required autoComplete="new-password"/></Field></div>
      <Field label="Role"><select {...f("role")}><option value="guard">Guard — gate and manual entries only</option><option value="admin">Admin — full access</option></select></Field>
      <button className="btn pri" disabled={busy}>{busy?"Creating…":"Create account"}</button>
    </form>
    <div className="card"><Table cols={cols} rows={rows} loading={loading} empty="No accounts yet."/></div>
    {del&&<Confirm title="Revoke access" label="Revoke" onClose={()=>setDel(null)}
      onOk={()=>remove(ref(db,`roles/${del.id}`)).then(()=>{toast("Access revoked");setDel(null);}).catch(()=>toast("Could not revoke access","err"))}>
      <b>{del.email}</b> will no longer be able to use the system.</Confirm>}
  </Layout>;
}
