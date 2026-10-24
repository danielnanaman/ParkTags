import {useState} from "react";
import {Navigate} from "react-router-dom";
import {signInWithEmailAndPassword} from "firebase/auth";
import {auth} from "../firebase";
import {useAuth,homeFor} from "../auth";
import {useForm} from "../lib";
import {Field} from "../ui";
import logo from "../assets/image.png";

export default function Login(){
  const a=useAuth(),[v,f]=useForm({email:"",pw:""}),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
  if(!a.loading&&a.user)return <Navigate to={homeFor(a.role)} replace/>;
  const go=async e=>{
    e.preventDefault();setBusy(true);setErr("");
    try{await signInWithEmailAndPassword(auth,v.email.trim(),v.pw);}
    catch{setErr("Incorrect email or password.");setBusy(false);}
  };
  return <div className="login"><form className="card" onSubmit={go}>
    <img src={logo} alt="STI" width="96"/>
    <h2>Sign in to STI ParkTags</h2>
    <Field label="Email"><input type="email" {...f("email")} required autoComplete="username"/></Field>
    <Field label="Password"><input type="password" {...f("pw")} required autoComplete="current-password"/></Field>
    {err&&<p className="err" role="alert">{err}</p>}
    <button className="btn pri wide" disabled={busy||a.loading}>{busy?"Signing in…":"Sign in"}</button>
  </form></div>;
}
