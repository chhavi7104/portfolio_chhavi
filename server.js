require('dotenv').config();
const express=require('express'),helmet=require('helmet'),cors=require('cors'),rate=require('express-rate-limit'),nodemailer=require('nodemailer');
const app=express();app.use(helmet());app.use(express.json({limit:'10kb'}));
app.use(cors({origin:(process.env.ALLOWED_ORIGIN||'').split(',').filter(Boolean)}));
const tx=nodemailer.createTransport({host:process.env.SMTP_HOST,port:+process.env.SMTP_PORT||587,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
app.post('/api/contact',rate({windowMs:15*60*1000,max:5}),async(req,res)=>{
 const{name,email,message,website}=req.body||{};if(website)return res.json({ok:true}); // honeypot
 if(typeof name!=='string'||name.trim().length<2||name.length>80)return res.status(400).json({error:'Invalid name'});
 if(typeof email!=='string'||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email.length>120)return res.status(400).json({error:'Invalid email'});
 if(typeof message!=='string'||message.trim().length<10||message.length>2000)return res.status(400).json({error:'Invalid message'});
 try{await tx.sendMail({from:process.env.SMTP_USER,to:process.env.CONTACT_TO,replyTo:email,subject:`Portfolio enquiry from ${name.replace(/[\r\n]/g,' ')}`,html:`<p><b>${esc(name)}</b> (${esc(email)})</p><p>${esc(message).replace(/\n/g,'<br>')}</p>`});res.json({ok:true})}
 catch(e){console.error(e.message);res.status(502).json({error:'Email service unavailable'})}});
app.listen(process.env.PORT||4000,()=>console.log('API up'));
