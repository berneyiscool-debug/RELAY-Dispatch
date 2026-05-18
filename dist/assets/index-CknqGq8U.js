(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const d of o)if(d.type==="childList")for(const i of d.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function t(o){const d={};return o.integrity&&(d.integrity=o.integrity),o.referrerPolicy&&(d.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?d.credentials="include":o.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function a(o){if(o.ep)return;o.ep=!0;const d=t(o);fetch(o.href,d)}})();class zt{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(s,t){this.routes[s]=t}navigate(s){typeof window<"u"&&(window.location.hash=s)}resolve(s){let t=s||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const a=t.indexOf("?"),o={};if(a!==-1){const l=t.substring(a+1);t=t.substring(0,a),l.split("&").forEach(r=>{const[c,b]=r.split("=");c&&(o[c]=decodeURIComponent(b||""))})}const{handler:d,params:i}=this.matchRoute(t);if(d){this.currentRoute=t;const l={...i,...o};if(this.onNavigate&&this.onNavigate(t,l)===!1)return;d(l)}}matchRoute(s){if(this.routes[s])return{handler:this.routes[s],params:{}};for(const[t,a]of Object.entries(this.routes)){const o=t.split("/"),d=s.split("/");if(o.length!==d.length)continue;const i={};let l=!0;for(let r=0;r<o.length;r++)if(o[r].startsWith(":"))i[o[r].slice(1)]=d[r];else if(o[r]!==d[r]){l=!1;break}if(l)return{handler:a,params:i}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const z=new zt,ls=Object.freeze(Object.defineProperty({__proto__:null,Router:zt,router:z},Symbol.toStringTag,{value:"Module"})),dt="simpro_";class rs{constructor(){this.listeners={}}_key(s){return dt+s}getAll(s){try{const t=localStorage.getItem(this._key(s));return t?JSON.parse(t):[]}catch{return[]}}getById(s,t){return this.getAll(s).find(o=>o.id===t)||null}save(s,t){localStorage.setItem(this._key(s),JSON.stringify(t)),this.emit(s,t)}create(s,t){const a=this.getAll(s);return t.id=t.id||this.generateId(),t.createdAt=t.createdAt||new Date().toISOString(),t.updatedAt=new Date().toISOString(),a.push(t),this.save(s,a),t}update(s,t,a){const o=this.getAll(s),d=o.findIndex(i=>i.id===t);return d===-1?null:(o[d]={...o[d],...a,updatedAt:new Date().toISOString()},this.save(s,o),o[d])}delete(s,t){const o=this.getAll(s).filter(d=>d.id!==t);this.save(s,o)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const s={markupPercent:20,materialMarkup:{defaultPercent:30,minMarkupAmount:5,useTiers:!0,tiers:[{upTo:50,percent:60},{upTo:200,percent:45},{upTo:1e3,percent:30},{upTo:null,percent:15}]},materialCategories:["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],laborRates:[{id:"rate_1",name:"Standard Rate",rate:85,description:"Normal business hours Mon–Fri",overtimeMultiplier:1,minCallOutFee:0,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!0},{id:"rate_2",name:"After Hours Rate",rate:127.5,description:"Evenings and early mornings",overtimeMultiplier:1.5,minCallOutFee:45,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!1},{id:"rate_3",name:"Saturday Rate",rate:127.5,description:"Saturday work",overtimeMultiplier:1.5,minCallOutFee:65,applicableDays:["Sat"],isDefault:!1},{id:"rate_4",name:"Sunday Rate",rate:170,description:"Sunday and public holidays",overtimeMultiplier:2,minCallOutFee:85,applicableDays:["Sun","PH"],isDefault:!1},{id:"rate_5",name:"Emergency Rate",rate:195,description:"Urgent call-outs any day",overtimeMultiplier:2,minCallOutFee:120,applicableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],isDefault:!1}]};try{const t=localStorage.getItem(this._key("settings"));return t?JSON.parse(t):s}catch{return s}}saveSettings(s){localStorage.setItem(this._key("settings"),JSON.stringify(s)),this.emit("settings",s)}on(s,t){this.listeners[s]||(this.listeners[s]=[]),this.listeners[s].push(t)}off(s,t){this.listeners[s]&&(this.listeners[s]=this.listeners[s].filter(a=>a!==t))}emit(s,t){this.listeners[s]&&this.listeners[s].forEach(a=>a(t))}isSeeded(){return localStorage.getItem(dt+"_seeded")==="true"}markSeeded(){localStorage.setItem(dt+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(s=>s.startsWith(dt)).forEach(s=>localStorage.removeItem(s))}}const m=new rs,ds=Object.freeze(Object.defineProperty({__proto__:null,store:m},Symbol.toStringTag,{value:"Module"})),nt={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Tasklists"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs & Financials"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create / Submit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"edit_all",label:"Edit Any Timesheet"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Create Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View Full Schedule"},{key:"edit",label:"Manage Schedule (Drag/Drop)"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Create Contractors"},{key:"edit",label:"Edit Contractors"}],Stock:[{key:"view",label:"View Inventory"},{key:"create",label:"Create Stock Items"},{key:"edit",label:"Manage Stock Levels"},{key:"delete",label:"Delete Stock"}],"Purchase Orders":[{key:"view",label:"View POs"},{key:"create",label:"Create POs"},{key:"approve",label:"Approve POs"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"send",label:"Send Invoices"},{key:"void",label:"Void Invoices"}],Reports:[{key:"view",label:"Access Reports"},{key:"export",label:"Export Data"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Files"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Profile"},{key:"manage_users",label:"Manage Users & Permissions"},{key:"manage_tax",label:"Manage Tax & Finance"}]};function tt(e){return Object.entries(nt).map(([s,t])=>{const a={module:s};return t.forEach(({key:o})=>{a[o]=e(s,o)}),a})}function cs(){const e=m.getAll("userTypes");if(e&&e.length>0)return e;const s=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:tt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:tt((t,a)=>t==="Settings"?["view","edit_company","manage_tax"].includes(a):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:tt((t,a)=>t==="Dashboard"?a==="view":t==="Jobs"?["view","manage_tasks","book_time"].includes(a):t==="Timesheets"?["view_own","create"].includes(a):t==="Schedule"?["view_own"].includes(a):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:tt((t,a)=>t==="Settings"?!1:t==="Reports"?a==="view":!(["Invoices","Purchase Orders"].includes(t)&&a==="delete"))}];return m.save("userTypes",s),s}const ps=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],it=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin",payRate:95},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager",payRate:85},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech",payRate:58},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech",payRate:62},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech",payRate:55},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office",payRate:42}],Xe=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],$t=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],ct=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function ge(e){return e[Math.floor(Math.random()*e.length)]}function Ae(e,s=0){const t=new Date,a=Math.floor(Math.random()*(e+s))-e;return new Date(t.getTime()+a*864e5).toISOString()}function Oe(e,s){return Math.round((Math.random()*(s-e)+e)*100)/100}function us(){return ps.map((e,s)=>{const t=ge($t),a=ge($t);return{id:`cust_${s+1}`,company:e.company,firstName:e.first,lastName:e.last,email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${t}, ${ge(ct)}, VIC 3000`,status:ge(["Active","Active","Active","Inactive"]),type:ge(["Company","Company","Individual"]),notes:"",createdAt:Ae(365),updatedAt:Ae(30),sites:[{name:"Main Office",address:`${t}, ${ge(ct)}, VIC 3000`},{name:"Warehouse",address:`${a}, ${ge(ct)}, VIC 3001`}],contacts:[{name:`${e.first} ${e.last}`,role:"Primary",email:`${e.first.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${ge(["Alex","Sam","Jordan","Casey","Morgan"])} ${e.last}`,role:"Site Manager",email:`site@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function Lt(){return[{id:"tmpl_elec_std",name:"Standard Electrical Inspection",description:"A comprehensive tasklist for residential or commercial electrical safety inspections.",tags:["Electrical","Maintenance","Compliance"],createdAt:new Date().toISOString(),tasks:[{id:"p1",name:"Main Board Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp1",name:"RCD Testing",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp2",name:"Terminal Tightness",estimatedHours:.5,people:1,status:"Not Started",progress:0}]},{id:"p2",name:"Circuit Testing",status:"Not Started",progress:0,subTasks:[{id:"sp3",name:"Insulation Resistance",estimatedHours:2,people:1,status:"Not Started",progress:0},{id:"sp4",name:"Earth Loop Impedance",estimatedHours:1.5,people:1,status:"Not Started",progress:0}]}]},{id:"tmpl_solar_maint",name:"Solar Panel Maintenance",description:"Annual maintenance checklist for PV solar systems.",tags:["Solar","Renewable","Maintenance"],createdAt:new Date().toISOString(),tasks:[{id:"p3",name:"Physical Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp5",name:"Module Cleaning",estimatedHours:3,people:2,status:"Not Started",progress:0},{id:"sp6",name:"Mounting Hardware Check",estimatedHours:1,people:1,status:"Not Started",progress:0}]},{id:"p4",name:"Electrical Performance",status:"Not Started",progress:0,subTasks:[{id:"sp7",name:"Inverter Diagnostics",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp8",name:"String Voltage Testing",estimatedHours:2,people:1,status:"Not Started",progress:0}]}]}]}function ms(e){const s=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],t=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(a,o)=>{const d=ge(e);return{id:`lead_${o+1}`,title:`${ge(Xe)} ${ge(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:d.id,customerName:d.company,contactName:`${d.firstName} ${d.lastName}`,status:ge(s),source:ge(t),value:Oe(500,25e3),description:`Potential ${ge(Xe).toLowerCase()} work for ${d.company}.`,priority:ge(["Low","Medium","High"]),createdAt:Ae(90),updatedAt:Ae(14)}})}function bs(e){const s=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(t,a)=>{const o=ge(e),d=Oe(200,5e3),i=Oe(100,8e3),l=(d+i)*.1;return{id:`quote_${a+1}`,number:`Q-${String(2024e3+a+1)}`,customerId:o.id,customerName:o.company,contactName:`${o.firstName} ${o.lastName}`,title:`${ge(Xe)} - ${ge(["Service Quote","Project Quote","Maintenance Quote"])}`,status:ge(s),lineItems:[{description:`${ge(Xe)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:Oe(65,120),total:d},{description:`${ge(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:Oe(15,200),total:i}],subtotal:d+i,tax:l,total:d+i+l,validUntil:Ae(-30,60),notes:"",createdAt:Ae(120),updatedAt:Ae(14)}})}function vs(e,s){const t=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],a=["Low","Medium","High","Urgent"];return Array.from({length:20},(o,d)=>{var c;const i=ge(e),l=ge(it),r=ge(t);return{id:`job_${d+1}`,number:`J-${String(1e5+d+1)}`,customerId:i.id,customerName:i.company,contactName:`${i.firstName} ${i.lastName}`,siteAddress:i.address||`${ge($t)}, ${ge(ct)}, VIC 3000`,title:`${ge(Xe)} - ${ge(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:ge(Xe),status:r,priority:ge(a),technicianId:l.id,technicianName:l.name,quoteId:d<s.length?(c=s[d])==null?void 0:c.id:null,scheduledDate:Ae(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:Oe(200,4e3),materialCost:Oe(100,3e3),tasks:[{id:"p1",name:"Site Preparation",status:r==="Pending"?"Not Started":"Completed",progress:r==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:r==="Pending"?"Not Started":"Completed",progress:r==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:r==="Pending"?"Not Started":"Completed",progress:r==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Installation Phase",status:r==="Completed"||r==="Invoiced"?"Completed":r==="In Progress"?"In Progress":"Not Started",progress:r==="Completed"||r==="Invoiced"?100:r==="In Progress"?50:0,estimatedHours:12,people:2,subTasks:[{id:"sp3",name:"Main Installation",status:r==="Completed"||r==="Invoiced"?"Completed":r==="In Progress"?"In Progress":"Not Started",progress:r==="Completed"||r==="Invoiced"||r==="In Progress"?100:0,estimatedHours:8,people:2},{id:"sp4",name:"Final Commissioning",status:r==="Completed"||r==="Invoiced"?"Completed":"Not Started",progress:r==="Completed"||r==="Invoiced"?100:0,estimatedHours:4,people:2}]}],notes:"",createdAt:Ae(90),updatedAt:Ae(7)}})}function ys(e){const s=["Draft","Sent","Paid","Overdue","Void"],t=e.filter(a=>a.status==="Completed"||a.status==="Invoiced");return Array.from({length:Math.max(8,t.length)},(a,o)=>{const d=t[o]||ge(e),i=(d.laborCost||0)+(d.materialCost||0),l=i*.1;return{id:`inv_${o+1}`,number:`INV-${String(5e4+o+1)}`,jobId:d.id,jobNumber:d.number,customerId:d.customerId,customerName:d.customerName,contactName:d.contactName,status:ge(s),lineItems:[{description:`${d.title} - Labor`,amount:d.laborCost||Oe(200,4e3)},{description:`${d.title} - Materials`,amount:d.materialCost||Oe(100,3e3)}],subtotal:i,tax:l,total:i+l,invoiceType:"Standard",issueDate:Ae(60),dueDate:Ae(-14,30),paidDate:null,notes:"",createdAt:Ae(60),updatedAt:Ae(7)}})}function fs(){return[{id:"fmt_1",name:"Job Safety Analysis (JSA)",description:"Daily safety assessment before starting work.",sections:[{id:"sec_1",title:"Personal Protective Equipment",fields:[{id:"f1",type:"checkbox",label:"Gloves worn?",required:!0},{id:"f2",type:"checkbox",label:"Safety Glasses worn?",required:!0},{id:"f3",type:"checkbox",label:"Steel Cap Boots worn?",required:!0}]},{id:"sec_2",title:"Site Hazards",fields:[{id:"f4",type:"select",label:"Overall Site Risk",options:["Low","Medium","High"],required:!0},{id:"f5",type:"textarea",label:"Identified Hazards",placeholder:"Describe any trip hazards, live wires, etc."}]},{id:"sec_3",title:"Authorization",fields:[{id:"f6",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"fmt_2",name:"Site Assessment",description:"Detailed site inspection and requirements.",sections:[{id:"sec_4",title:"Client Details",fields:[{id:"f7",type:"text",label:"Customer Rep Name"},{id:"f8",type:"date",label:"Inspection Date"}]},{id:"sec_5",title:"Access & Logistics",fields:[{id:"f9",type:"checkbox",label:"Access keys provided?"},{id:"f10",type:"textarea",label:"Parking / Entry Instructions"}]}]}]}function gs(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((s,t)=>({id:`stock_${t+1}`,name:s.name,sku:`SKU-${String(1e3+t)}`,category:s.cat,unit:s.unit,unitPrice:s.price,costPrice:s.price*.6,quantity:Math.floor(Math.random()*200)+5,reorderLevel:Math.floor(Math.random()*20)+5,supplier:ge(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:ge(["Warehouse A","Warehouse B","Van Stock","On Order"]),createdAt:Ae(365),updatedAt:Ae(30)}))}function hs(e){var t,a,o,d,i,l;return[{name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active"},{name:"Isuzu NPR Truck",type:"Vehicle",serial:"REG-888-FF",ownerType:"Business",recoveryRate:45,serviceIntervalMonths:6,currentMeter:12e4,status:"Active"},{name:"Scissor Lift 19ft",type:"Plant & Equipment",serial:"SN-SL-9920",ownerType:"Business",recoveryRate:15,serviceIntervalMonths:3,currentMeter:840,status:"Active"},{name:"Carrier Chiller Unit",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-CH-7721",ownerType:"Customer",customerId:e[0].id,site:(a=(t=e[0].sites)==null?void 0:t[0])==null?void 0:a.name,serviceIntervalMonths:12,currentMeter:15400,status:"Active"},{name:"Daikin Split System",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-DS-4410",ownerType:"Customer",customerId:e[1].id,site:(d=(o=e[1].sites)==null?void 0:o[0])==null?void 0:d.name,serviceIntervalMonths:12,currentMeter:3200,status:"Active"},{name:"Fire Alarm Panel v4",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-FP-2299",ownerType:"Customer",customerId:e[2].id,site:(l=(i=e[2].sites)==null?void 0:i[0])==null?void 0:l.name,serviceIntervalMonths:6,currentMeter:0,status:"Active"}].map((r,c)=>({id:`asset_${c+1}`,...r,logs:[{id:`log_${c}_1`,type:"Service",date:Ae(90),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]}))}function xs(e){const s=[];return e.filter(a=>a.status==="Scheduled"||a.status==="In Progress").forEach((a,o)=>{const d=Math.floor(Math.random()*5),i=7+Math.floor(Math.random()*8),l=1+Math.floor(Math.random()*4),r=it.find(c=>c.id===a.technicianId)||ge(it);s.push({id:`sched_${o+1}`,jobId:a.id,jobNumber:a.number,title:a.title,technicianId:r.id,technicianName:r.name,color:r.color,dayOffset:d,startHour:i,endHour:Math.min(i+l,18),customerName:a.customerName,siteAddress:a.siteAddress})}),s}function $s(){if(m.isSeeded()){const c=m.getAll("jobs");let b=!1;const f=c.map(k=>{let S=!1;function $(O){const q={...O};return"subPhases"in q?(q.subTasks=(q.subPhases||[]).map(F=>$(F)),delete q.subPhases,S=!0):q.subTasks&&(q.subTasks=q.subTasks.map(F=>$(F))),q}const I={...k};return"phases"in I?(I.tasks=(I.phases||[]).map(O=>$(O)),delete I.phases,S=!0):I.tasks&&(I.tasks=I.tasks.map(O=>$(O))),S&&(b=!0),I});b&&m.save("jobs",f);const n=m.getAll("taskTemplates");let p=!1;const g=n.map(k=>{let S=!1;function $(O){const q={...O};return"subPhases"in q?(q.subTasks=(q.subPhases||[]).map(F=>$(F)),delete q.subPhases,S=!0):q.subTasks&&(q.subTasks=q.subTasks.map(F=>$(F))),q}const I={...k};return"phases"in I?(I.tasks=(I.phases||[]).map(O=>$(O)),delete I.phases,S=!0):I.tasks&&(I.tasks=I.tasks.map(O=>$(O))),S&&(p=!0),I});p&&m.save("taskTemplates",g);const v=m.getAll("jobs");if(v.length>0&&!v[0].tasks){const k=v.map(S=>{const $=S.status;return{...S,tasks:[{id:"p1",name:"Site Preparation",status:$==="Pending"?"Not Started":"Completed",progress:$==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:$==="Pending"?"Not Started":"Completed",progress:$==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:$==="Pending"?"Not Started":"Completed",progress:$==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Project Execution",status:$==="Completed"||$==="Invoiced"?"Completed":$==="In Progress"?"In Progress":"Not Started",progress:$==="Completed"||$==="Invoiced"?100:$==="In Progress"?50:0,estimatedHours:16,people:2,subTasks:[{id:"sp3",name:"Installation",status:$==="Completed"||$==="Invoiced"?"Completed":$==="In Progress"?"In Progress":"Not Started",progress:$==="Completed"||$==="Invoiced"||$==="In Progress"?100:0,estimatedHours:12,people:2},{id:"sp4",name:"Cleanup & Handover",status:$==="Completed"||$==="Invoiced"?"Completed":"Not Started",progress:$==="Completed"||$==="Invoiced"?100:0,estimatedHours:4,people:2}]}]}});m.save("jobs",k)}const u=m.getAll("userTypes");!u||u.length===0?cs():u.some(S=>S.id==="ut_office")||(u.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:tt((S,$)=>S==="Settings"?!1:S==="Reports"?$==="view":!(["Invoices","Purchase Orders"].includes(S)&&$==="delete"))}),m.save("userTypes",u));const y=m.getAll("technicians"),x=m.getAll("userTypes");if(y.length>0&&x.length>0){const k=y[0];x.some($=>$.id===k.userTypeId)||m.save("technicians",it)}const C=m.getAll("taskTemplates");(!C||C.length===0)&&m.save("taskTemplates",Lt());return}const e=us(),s=ms(e),t=bs(e),a=vs(e,t),o=ys(a),d=gs(),i=hs(e),l=xs(a),r=fs();m.save("customers",e),m.save("leads",s),m.save("quotes",t),m.save("jobs",a),m.save("invoices",o),m.save("stock",d),m.save("assets",i),m.save("schedule",l),m.save("technicians",it),m.save("taskTemplates",Lt()),m.save("formTemplates",r),m.save("formInstances",[]),m.markSeeded()}const ws=[{section:"MAIN"},{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{section:"WORKFLOW"},{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"},{section:"RESOURCES"},{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"},{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{section:"ANALYTICS"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{section:"SYSTEM"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}];function _t(){const e=document.createElement("aside");e.className="sidebar",e.id="sidebar";const s=localStorage.getItem("simpro_sidebar_expanded")==="true";s&&e.classList.add("expanded");const t=m.getSettings();let o=`
    <div class="sidebar-logo" id="sidebar-logo">
      ${t.logo?`<div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
         <img src="${t.logo}" class="custom-logo" id="sidebar-logo-img" style="max-height: 28px; max-width: ${s?"140px":"32px"}; object-fit: contain;" />
         <span class="logo-text" style="${s?"display: block;":"display: none;"}">${t.name||"FieldForge"}</span>
       </div>`:`
      <div class="logo-icon">F</div>
      <span class="logo-text">FieldForge</span>
    `}
    </div>
    <div class="sidebar-scroll-arrow up" id="sidebar-scroll-up">
      <span class="material-icons-outlined">keyboard_arrow_up</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
  `;JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),ws.forEach(n=>{n.section?o+=`<div class="sidebar-section-label" data-section="${n.section}">${n.section}</div>`:o+=`
        <button class="sidebar-nav-item" data-path="${n.path}" data-id="${n.id}" id="nav-${n.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${n.icon}</span></span>
          <span class="nav-label">${n.label}</span>
        </button>
      `}),o+=`
    </nav>
    <div class="sidebar-scroll-arrow down" id="sidebar-scroll-down">
      <span class="material-icons-outlined">keyboard_arrow_down</span>
    </div>
    <div style="padding: 8px 0; border-top: 1px solid rgba(255, 255, 255, 0.06);">
      <button id="btn-logout" class="sidebar-nav-item" style="width: calc(100% - 16px);">
        <span class="nav-icon"><span class="material-icons-outlined">logout</span></span>
        <span class="nav-label">Logout</span>
      </button>
    </div>
    <button class="sidebar-toggle" id="sidebar-toggle">
      <span class="material-icons-outlined" id="sidebar-toggle-icon">${s?"chevron_left":"chevron_right"}</span>
    </button>
  `,e.innerHTML=o,e.addEventListener("click",n=>{const p=n.target.closest(".sidebar-nav-item");if(p&&p.id!=="btn-logout"){const g=p.dataset.path;g&&z.navigate(g)}}),e.querySelector("#sidebar-logo").addEventListener("click",()=>z.navigate("/")),e.querySelector("#sidebar-toggle").addEventListener("click",()=>ks(e));const l=e.querySelector("#sidebar-nav"),r=e.querySelector("#sidebar-scroll-up"),c=e.querySelector("#sidebar-scroll-down"),b=()=>{if(e.classList.contains("expanded")){r.classList.remove("visible"),c.classList.remove("visible");return}const{scrollTop:n,scrollHeight:p,clientHeight:g}=l;r.classList.toggle("visible",n>0),c.classList.toggle("visible",Math.ceil(n+g)<p)};l.addEventListener("scroll",b),r.addEventListener("click",()=>{l.scrollBy({top:-100,behavior:"smooth"})}),c.addEventListener("click",()=>{l.scrollBy({top:100,behavior:"smooth"})}),setTimeout(b,100);const f=e.querySelector("#btn-logout");return f&&f.addEventListener("click",n=>{n.stopPropagation(),window.dispatchEvent(new CustomEvent("fieldforge-logout"))}),window.addEventListener("simpro-settings-updated",()=>{const n=m.getSettings(),p=e.querySelector("#sidebar-logo");n.logo?p.innerHTML=`
        <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
          <img src="${n.logo}" class="custom-logo" style="max-height: 28px; max-width: ${e.classList.contains("expanded")?"140px":"32px"}; object-fit: contain;" />
          <span class="logo-text" style="${e.classList.contains("expanded")?"display: block;":"display: none;"}">${n.name||"FieldForge"}</span>
        </div>
      `:p.innerHTML=`
        <div class="logo-icon">F</div>
        <span class="logo-text">FieldForge</span>
      `}),e}function Ss(e){const s=e||document.getElementById("sidebar");if(!s)return;const t=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}');if(t.role==="customer")s.style.display="none";else{s.style.display="";let a=null;if(t.userTypeId){const l=m.getById("userTypes",t.userTypeId);l&&l.permissions&&(a=l.permissions)}s.querySelectorAll(".sidebar-nav-item").forEach(l=>{if(l.id==="btn-logout"){l.style.display="";return}const r=l.querySelector(".nav-label");if(!r)return;const c=r.textContent.trim();if(t.role==="admin"){l.style.display="";return}if(a){const b=a.find(n=>n.module===c);b&&Object.entries(b).some(([n,p])=>n!=="module"&&p===!0)||c==="Notifications"||c==="Dashboard"?l.style.display="":l.style.display="none"}else(c==="Settings"||c==="Reports"||c==="Invoices")&&(l.style.display="none")}),s.querySelectorAll(".sidebar-section-label").forEach(l=>{let r=!1,c=l.nextElementSibling;for(;c&&c.classList.contains("sidebar-nav-item");){if(c.style.display!=="none"){r=!0;break}c=c.nextElementSibling}l.style.display=r?"":"none"});const o=s.querySelector("#sidebar-nav"),d=s.querySelector("#sidebar-scroll-up"),i=s.querySelector("#sidebar-scroll-down");if(o&&d&&i&&!s.classList.contains("expanded")){const{scrollTop:l,scrollHeight:r,clientHeight:c}=o;d.classList.toggle("visible",l>0),i.classList.toggle("visible",Math.ceil(l+c)<r)}}}function ks(e){e.classList.toggle("expanded");const s=e.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",s);const t=e.querySelector("#sidebar-toggle-icon");t.textContent=s?"chevron_left":"chevron_right";const a=e.querySelector(".custom-logo"),o=e.querySelector(".logo-text");a&&(a.style.maxWidth=s?"140px":"32px"),o&&(o.style.display=s?"block":"none");const d=e.querySelector("#sidebar-nav"),i=e.querySelector("#sidebar-scroll-up"),l=e.querySelector("#sidebar-scroll-down");if(d&&i&&l)if(s)i.classList.remove("visible"),l.classList.remove("visible");else{const{scrollTop:r,scrollHeight:c,clientHeight:b}=d;i.classList.toggle("visible",r>0),l.classList.toggle("visible",Math.ceil(r+b)<c)}}function Ft(e){const s=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(t=>{t.classList.toggle("active",t.dataset.path===s)})}const qt=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:_t,updateSidebarAccess:Ss,updateSidebarActive:Ft},Symbol.toStringTag,{value:"Module"}));function Ht(){const e=document.createElement("header");e.className="topbar",e.id="topbar",e.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${Ot()==="dark"?"light_mode":"dark_mode"}</span>
      </button>
      <button class="topbar-action-btn" id="btn-help" title="Help">
        <span class="material-icons-outlined">help_outline</span>
      </button>
      <button class="topbar-action-btn" id="btn-notifications" title="Notifications">
        <span class="material-icons-outlined">notifications</span>
        <span class="notification-dot"></span>
      </button>
      <div class="topbar-user" id="topbar-user">
        <div class="topbar-avatar" id="topbar-avatar">--</div>
        <div class="topbar-user-info">
          <span class="topbar-user-name" id="topbar-name">Loading...</span>
          <span class="topbar-user-role" id="topbar-role">Role</span>
        </div>
      </div>
    </div>
  `;const s=e.querySelector("#global-search");let t;s.addEventListener("input",l=>{clearTimeout(t),t=setTimeout(()=>{const r=l.target.value.trim();r.length>=2?Ts(r):bt()},300)}),s.addEventListener("blur",()=>{setTimeout(bt,200)}),e.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const r=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",r),localStorage.setItem("simpro_theme",r),e.querySelector("#theme-icon").textContent=r==="dark"?"light_mode":"dark_mode"}),Is();const o=e.querySelector("#btn-notifications"),d=e.querySelector(".notification-dot");function i(){m.getAll("notifications").filter(c=>!c.read).length>0?d.style.display="block":d.style.display="none"}return m.on("notifications",i),i(),o.addEventListener("click",l=>{l.stopPropagation(),Cs(o)}),Rt(e),e}function Rt(e){const s=e||document.getElementById("topbar");if(!s)return;const t=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),a=s.querySelector("#topbar-name"),o=s.querySelector("#topbar-role"),d=s.querySelector("#topbar-avatar");if(a&&(a.textContent=t.name||"Unknown User"),o){let i=t.userTypeName;if(!i&&t.userTypeId){const l=m.getById("userTypes",t.userTypeId);l&&(i=l.name)}i||(i={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[t.role]||t.role),o.textContent=i}if(d){const l=(t.name||"").split(" ").map(r=>r[0]).join("").substring(0,2).toUpperCase()||"U";d.textContent=l}}function Cs(e){let s=document.querySelector("#notifications-dropdown");if(s){s.remove();return}const t=m.getAll("notifications").sort((i,l)=>new Date(l.createdAt)-new Date(i.createdAt));s=document.createElement("div"),s.className="dropdown-menu",s.id="notifications-dropdown",s.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const a=document.createElement("div");a.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",a.innerHTML='<h4 style="margin:0">Notifications</h4>';const o=document.createElement("button");o.className="btn btn-ghost btn-sm",o.textContent="Mark all as read",o.onclick=()=>{const i=m.getAll("notifications");let l=!1;i.forEach(r=>{r.read||(r.read=!0,r.updatedAt=new Date().toISOString(),l=!0)}),l&&m.save("notifications",i),s.remove()},a.appendChild(o),s.appendChild(a),t.length===0?s.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':t.forEach(i=>{const l=document.createElement("div");l.className="dropdown-item",l.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${i.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,l.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${i.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${i.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(i.createdAt).toLocaleString()}</div>
        </div>
      `,l.addEventListener("click",()=>{if(m.update("notifications",i.id,{read:!0}),i.link){const{router:r}=window.__fieldForge||{};r&&r.navigate(i.link)}s.remove()}),s.appendChild(l)}),e.parentNode.style.position="relative",e.parentNode.appendChild(s);const d=i=>{!s.contains(i.target)&&i.target!==e&&!e.contains(i.target)&&(s.remove(),document.removeEventListener("click",d))};document.addEventListener("click",d)}function Ts(e){bt();const{store:s}=window.__fieldForge||{};if(!s)return;const t=[],a=e.toLowerCase();if(s.getAll("customers").forEach(d=>{(d.company.toLowerCase().includes(a)||`${d.firstName} ${d.lastName}`.toLowerCase().includes(a))&&t.push({type:"Customer",label:d.company,icon:"people",path:`/people/${d.id}`})}),s.getAll("jobs").forEach(d=>{(d.number.toLowerCase().includes(a)||d.title.toLowerCase().includes(a)||d.customerName.toLowerCase().includes(a))&&t.push({type:"Job",label:`${d.number} — ${d.title}`,icon:"build",path:`/jobs/${d.id}`})}),s.getAll("quotes").forEach(d=>{var i;(d.number.toLowerCase().includes(a)||(i=d.title)!=null&&i.toLowerCase().includes(a)||d.customerName.toLowerCase().includes(a))&&t.push({type:"Quote",label:`${d.number} — ${d.customerName}`,icon:"request_quote",path:`/quotes/${d.id}`})}),s.getAll("invoices").forEach(d=>{(d.number.toLowerCase().includes(a)||d.customerName.toLowerCase().includes(a))&&t.push({type:"Invoice",label:`${d.number} — ${d.customerName}`,icon:"receipt_long",path:`/invoices/${d.id}`})}),t.length===0)return;const o=document.createElement("div");o.className="dropdown-menu",o.id="search-results",o.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",t.slice(0,12).forEach(d=>{const i=document.createElement("button");i.className="dropdown-item",i.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${d.icon}</span>
      <span style="flex:1" class="truncate">${d.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${d.type}</span>
    `,i.addEventListener("click",()=>{const{router:l}=window.__fieldForge||{};l&&l.navigate(d.path),bt(),document.querySelector("#global-search").value=""}),o.appendChild(i)}),document.querySelector(".topbar-search").appendChild(o)}function bt(){const e=document.querySelector("#search-results");e&&e.remove()}function Ot(){return localStorage.getItem("simpro_theme")||"light"}function Is(){Ot()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const At=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:Ht,updateTopbarAccess:Rt},Symbol.toStringTag,{value:"Module"})),Es={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function Ls(e){const s=document.getElementById("breadcrumb");if(!s)return;if(e==="/"){s.style.display="none";return}s.style.display="flex";const t=e.split("/").filter(Boolean);let a=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,o="";t.forEach((d,i)=>{o+="/"+d;const l=i===t.length-1,r=Es[o]||decodeURIComponent(d);a+='<span class="breadcrumb-separator">›</span>',l?a+=`<span class="breadcrumb-item current">${r}</span>`:a+=`<span class="breadcrumb-item" data-path="${o}">${r}</span>`}),s.innerHTML=a,s.querySelectorAll(".breadcrumb-item[data-path]").forEach(d=>{d.addEventListener("click",()=>{const{router:i}=window.__fieldForge||{};i&&i.navigate(d.dataset.path)})})}function Ve(e){const s=document.getElementById("breadcrumb");if(!s)return;const t=s.querySelector(".breadcrumb-item.current");t&&(t.textContent=e)}const qs="modulepreload",As=function(e){return"/"+e},Dt={},ce=function(s,t,a){let o=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const i=document.querySelector("meta[property=csp-nonce]"),l=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));o=Promise.allSettled(t.map(r=>{if(r=As(r),r in Dt)return;Dt[r]=!0;const c=r.endsWith(".css"),b=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${b}`))return;const f=document.createElement("link");if(f.rel=c?"stylesheet":qs,c||(f.as="script"),f.crossOrigin="",f.href=r,l&&f.setAttribute("nonce",l),document.head.appendChild(f),c)return new Promise((n,p)=>{f.addEventListener("load",n),f.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${r}`)))})}))}function d(i){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=i,window.dispatchEvent(l),!l.defaultPrevented)throw i}return o.then(i=>{for(const l of i||[])l.status==="rejected"&&d(l.reason);return s().catch(d)})};function ft(e,s){if(!e||e<=0)return 0;const t=s.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]};let a=t.defaultPercent||30;if(t.useTiers&&t.tiers&&t.tiers.length>0){const i=t.tiers.find(l=>l.upTo===null||e<=l.upTo);i&&(a=i.percent)}const o=e*(a/100),d=Math.max(o,t.minMarkupAmount||0);return e+d}function Bt(e,s){return e.reduce((t,a)=>{const o=ft(a.unitCost||0,s);return t+o*(a.quantity||1)},0)}let Fe=!1;const st={S:"module-s",M:"module-m",L:"module-l",XL:"module-xl"},at={standard:"",tall:"module-tall",xtall:"module-xtall"};function vt(){const e=JSON.parse(sessionStorage.getItem("currentUser")||"null");return e?`dashboardLayout_v2_${e.id}`:"dashboardLayout_v2"}const yt={"kpi-cards":{title:"KPI Cards",defaultW:"XL",defaultH:"standard",widths:["M","L","XL"],heights:["standard"],kpiStrip:!0,render:Ms},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:js},"tech-map":{title:"Technician Map",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:zs},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:_s},"recent-leads":{title:"Recent Leads",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Fs},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Hs},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:Os},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>De("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>De("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>De("inventory","Inventory looks good")},"profitability-chart":{title:"Projected Profitability",defaultW:"L",defaultH:"tall",widths:["L","XL"],heights:["tall","xtall"],render:Bs},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>De("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>De("schedule","No timesheet alerts")},"asset-status":{title:"Asset Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>De("precision_manufacturing","All assets operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>De("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>De("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>De("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>De("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>De("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>De("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>De("wb_sunny","Sunny, 24°C")}},Ut=[{id:"kpi-cards",w:"XL",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"M",h:"tall"},{id:"recent-leads",w:"M",h:"tall"},{id:"cash-flow",w:"M",h:"standard"}];function De(e,s){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${e}</span>
    <span style="font-size:13px;">${s}</span>
  </div>`}function Ds(e){let s=JSON.parse(JSON.stringify(Ut));try{const o=localStorage.getItem(vt());o&&(s=JSON.parse(o))}catch{}s.forEach(o=>{o.instanceId||(o.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const t={jobs:m.getAll("jobs"),quotes:m.getAll("quotes"),invoices:m.getAll("invoices"),leads:m.getAll("leads"),people:m.getAll("people")};e.innerHTML=`
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
            <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
            <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
          </button>
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;const a=e.querySelector("#dashboard-grid");Be(a,s,t),e.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{Fe=!0,Be(a,s,t),Ps(e,a,s,t)})}function Be(e,s,t){e.innerHTML="",s.forEach(a=>{const o=yt[a.id];if(!o)return;const d=st[a.w]||"module-m",i=at[a.h]||"",l=["dashboard-module",d,i,Fe?"edit-mode":""].filter(Boolean).join(" "),r=o.widths.length>1,c=o.heights.length>1,b=Fe?`
      ${r?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${c?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${r&&c?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",f=`
      <div style="display:flex;align-items:center;gap:4px;">
        ${o.configurable?`
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${a.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${Fe?"":"opacity:0.5;"}">settings</span>
          </button>
        `:""}
        ${Fe?`
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${a.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>
        `:""}
      </div>`,n=Fe?"background:rgba(27,109,224,0.04);":"";e.insertAdjacentHTML("beforeend",`
      <div class="${l}" data-instance-id="${a.instanceId}" data-id="${a.id}" style="position:relative;">
        <div class="card ${o.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${n}">
            <span style="font-weight:600;font-size:14px;">${o.title}</span>
            ${f}
          </div>
          <div class="card-body">${o.render(t,a)}</div>
        </div>
        ${b}
      </div>`)}),Ns(e,s,t),Fe&&wt(e,s,t)}function Ns(e,s,t){e.querySelectorAll(".btn-configure").forEach(a=>{a.addEventListener("click",o=>{const d=o.currentTarget.dataset.instanceId,i=s.find(r=>r.instanceId===d);if(i&&i.id==="pinned-job"){let b=function(f=""){const n=c.querySelector("#job-list-container"),p=r.filter(g=>g.number.toLowerCase().includes(f.toLowerCase())||g.title.toLowerCase().includes(f.toLowerCase())||g.customerName.toLowerCase().includes(f.toLowerCase()));n.innerHTML=p.length>0?p.map(g=>`
            <div class="job-option" data-job-id="${g.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${g.number} - ${g.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${g.customerName}</div>
            </div>
          `).join(""):'<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>',n.querySelectorAll(".job-option").forEach(g=>{g.addEventListener("click",()=>{var v;i.config={...i.config,jobId:g.dataset.jobId},Fe||localStorage.setItem(vt(),JSON.stringify(s)),(v=document.querySelector(".modal-overlay"))==null||v.remove(),Be(e,s,t)})})};var l=b;const r=t.jobs,c=document.createElement("div");c.innerHTML=`
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..." 
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            <!-- Jobs will be rendered here -->
          </div>
        `,b(),c.querySelector("#job-search").addEventListener("input",f=>{b(f.target.value)}),ce(async()=>{const{showModal:f}=await Promise.resolve().then(()=>qe);return{showModal:f}},void 0).then(({showModal:f})=>{f({title:"Select Job to Pin",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()}]})})}})})}function wt(e,s,t){e.querySelectorAll(".btn-remove").forEach(a=>{a.addEventListener("click",o=>{const d=o.currentTarget.dataset.instanceId,i=s.findIndex(l=>l.instanceId===d);i!==-1&&(s.splice(i,1),Be(e,s,t))})}),window.Sortable&&!e.sortableInstance&&(e.sortableInstance=new window.Sortable(e,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const a=Array.from(e.children).map(d=>d.dataset.instanceId),o=[];a.forEach(d=>{const i=s.find(l=>l.instanceId===d);i&&o.push(i)}),s.splice(0,s.length,...o)}})),e.sortableInstance&&e.sortableInstance.option("disabled",!1),e.querySelectorAll(".resize-handle").forEach(a=>{a.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation();const d=o.target.closest(".dashboard-module"),i=d.dataset.instanceId,l=s.find(S=>S.instanceId===i),r=yt[l==null?void 0:l.id];if(!l||!r)return;const c=o.target.closest(".resize-handle"),b=c&&(c.classList.contains("resize-r")||c.classList.contains("resize-br")),f=c&&(c.classList.contains("resize-b")||c.classList.contains("resize-br"));let n=o.clientX,p=o.clientY,g=0,v=0;const u=60,y=["S","M","L","XL"].filter(S=>r.widths.includes(S)),x=["standard","tall","xtall"].filter(S=>r.heights.includes(S));function C(S){if(b){if(g+=S.clientX-n,g>u){let $=y.indexOf(l.w);$<y.length-1&&(l.w=y[$+1],d.className=["dashboard-module",st[l.w]||"module-m",at[l.h]||"","edit-mode"].filter(Boolean).join(" ")),g=0}else if(g<-u){let $=y.indexOf(l.w);$>0&&(l.w=y[$-1],d.className=["dashboard-module",st[l.w]||"module-m",at[l.h]||"","edit-mode"].filter(Boolean).join(" ")),g=0}}if(f){if(v+=S.clientY-p,v>u){let $=x.indexOf(l.h);$<x.length-1&&(l.h=x[$+1],d.className=["dashboard-module",st[l.w]||"module-m",at[l.h]||"","edit-mode"].filter(Boolean).join(" ")),v=0}else if(v<-u){let $=x.indexOf(l.h);$>0&&(l.h=x[$-1],d.className=["dashboard-module",st[l.w]||"module-m",at[l.h]||"","edit-mode"].filter(Boolean).join(" ")),v=0}}n=S.clientX,p=S.clientY}function k(){document.removeEventListener("mousemove",C),document.removeEventListener("mouseup",k),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",C),document.addEventListener("mouseup",k),document.body.style.cursor=window.getComputedStyle(o.target).cursor,document.body.style.userSelect="none"})})}function Ps(e,s,t,a){const o=e.querySelector("#dashboard-header-actions"),d=e.querySelector("#btn-edit-dashboard");d.style.display="none",o.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,o.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(t.splice(0,t.length,...JSON.parse(JSON.stringify(Ut))),Be(s,t,a),wt(s,t,a))}),o.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(vt(),JSON.stringify(t)),Fe=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),d.style.display="",o.innerHTML=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`,Be(s,t,a)}),o.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const i=localStorage.getItem(vt());i&&t.splice(0,t.length,...JSON.parse(i))}catch{}Fe=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),d.style.display="",o.innerHTML=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`,Be(s,t,a)}),o.querySelector("#btn-add-widget").addEventListener("click",()=>{const i=Object.entries(yt),l=document.createElement("div");l.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${i.map(([r,c])=>`
            <div data-id="${r}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${c.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${c.defaultW} · ${c.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,ce(async()=>{const{showModal:r}=await Promise.resolve().then(()=>qe);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:"Add Widget",content:l,actions:[{label:"Close",className:"btn-secondary",onClick:c=>c()}]}),l.querySelectorAll("[data-id]").forEach(c=>{c.addEventListener("click",b=>{var p;const f=b.currentTarget.dataset.id,n=yt[f];t.push({id:f,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:n.defaultW,h:n.defaultH}),(p=document.querySelector(".modal-overlay"))==null||p.remove(),Be(s,t,a),wt(s,t,a)})})})})}function Ms(e,s){const t=e.jobs.filter(i=>i.status==="In Progress"||i.status==="Scheduled").length,a=e.quotes.filter(i=>i.status==="Sent"||i.status==="Draft").length,o=e.invoices.filter(i=>i.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+e.invoices.filter(i=>i.status==="Paid").reduce((i,l)=>i+(l.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:t,icon:"build",color:"green",sub:`${e.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:a,icon:"request_quote",color:"orange",sub:`${e.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:o,icon:"warning",color:"red",sub:o>0?"Requires attention":"All on track",pos:o===0}].map(i=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${i.label}</div>
        <div class="stat-icon ${i.color}"><span class="material-icons-outlined">${i.icon}</span></div>
      </div>
      <div class="stat-value">${i.value}</div>
      <div class="stat-change ${i.pos===!0?"positive":i.pos===!1?"negative":""}">
        <span style="font-size:12px;">${i.sub}</span>
      </div>
    </div>`).join("")}function js(e,s){const t={};e.jobs.forEach(d=>{t[d.status]=(t[d.status]||0)+1});const a=e.jobs.length||1,o={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(t).map(([d,i])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${d}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(i/a*100).toFixed(1)}%;height:100%;background:${o[d]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${i>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${i}</span>
      </div>`).join("")}
  </div>`}function zs(e,s){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${e.people.filter(o=>o.type==="Staff").slice(0,4).map((o,d)=>{const i=15+d*22+Math.sin(d)*12,l=15+d*18+Math.cos(d)*18;return`<div style="position:absolute;top:${i}%;left:${l}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${o.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${o.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function _s(e,s){const t=[];return e.jobs.slice(0,4).forEach(a=>t.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${a.number}</strong> — ${a.title}`,sub:a.customerName,time:a.updatedAt})),e.quotes.slice(0,3).forEach(a=>t.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${a.number}</strong> ${a.status.toLowerCase()}`,sub:a.customerName,time:a.updatedAt})),e.invoices.slice(0,2).forEach(a=>t.push({icon:"receipt_long",color:a.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${a.number}</strong> — ${a.status}`,sub:a.customerName,time:a.updatedAt})),t.sort((a,o)=>new Date(o.time)-new Date(a.time)),t.map(a=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${a.color}20;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${a.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.sub} · ${Rs(a.time)}</div>
      </div>
    </div>`).join("")}function Fs(e,s){const t={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${e.leads.slice(0,8).map(a=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${a.id}'">
        <td class="cell-link font-medium">${a.title}</td>
        <td style="color:var(--text-secondary);">${a.customerName}</td>
        <td><span class="badge ${t[a.status]||"badge-neutral"}">${a.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function Hs(e,s){const t=e.jobs.filter(a=>a.status==="Scheduled"||a.status==="In Progress").slice(0,8);return t.length?t.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${a.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${a.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.technicianName} · ${a.customerName}</div>
      </div>
      <span class="badge ${a.status==="In Progress"?"badge-primary":"badge-warning"}">${a.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function Rs(e){const s=Math.floor((Date.now()-new Date(e))/6e4);if(s<60)return`${s}m ago`;const t=Math.floor(s/60);return t<24?`${t}h ago`:`${Math.floor(t/24)}d ago`}function Os(e,s){var c;const t=(c=s.config)==null?void 0:c.jobId;if(!t)return De("push_pin","Click settings to pin a job");const a=e.jobs.find(b=>b.id===t);if(!a)return De("warning","Job not found");function o(b,f=0){let n=[];return b&&b.forEach(p=>{const g=p.subTasks&&p.subTasks.length>0||p.subPhases&&p.subPhases.length>0;n.push({...p,depth:f,isParent:g}),g&&(n=n.concat(o(p.subTasks||p.subPhases,f+1)))}),n}const d=a.tasks||a.phases||[],i=o(d),l=i.length;let r=0;if(d.length>0){const b=d.reduce((f,n)=>f+(n.progress||0),0);r=Math.round(b/d.length)}return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${a.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${r}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${r}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${l>0?i.map(b=>{const f=b.progress===100;return`
          <div style="display:flex;align-items:center;gap:8px;padding-left:${b.depth*14}px; opacity:${!b.isParent&&f?.6:1}">
            ${b.isParent?'<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>':`<span class="material-icons-outlined" style="font-size:16px;color:${f?"var(--color-success)":"var(--text-tertiary)"};">
                ${f?"check_circle":"radio_button_unchecked"}
              </span>`}
            <span style="font-size:12px;font-weight:${b.isParent?"700":"400"};text-decoration:${!b.isParent&&f?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${b.isParent?"var(--text-primary)":"var(--text-secondary)"};">
              ${b.name}
            </span>
            ${b.isParent?`<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);">${b.progress}%</span>`:""}
          </div>`}).join(""):'<div style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:10px;">No tasks assigned</div>'}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-primary);padding:8px;border-radius:6px;border:1px dashed var(--border-color);">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:12px;color:var(--text-primary);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.title}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${a.customerName}</div>
        </div>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="window.location.hash='/jobs/${a.id}'" title="View Job Details" style="margin-left:8px;">
          <span class="material-icons-outlined" style="font-size:18px;color:var(--color-primary);">open_in_new</span>
        </button>
      </div>
    </div>
  `}function Bs(e,s){const t=m.getSettings(),a=e.jobs.filter(r=>r.status!=="Invoiced"&&r.status!=="Archived");let o=0,d=0;a.forEach(r=>{const c=(r.materials||[]).reduce((v,u)=>v+u.quantity*(u.unitCost||0),0),b=r.laborCost||0;o+=c+b;const f=Bt(r.materials||[],t),n=t.laborRates.find(v=>v.id===r.laborRateProfileId)||t.laborRates.find(v=>v.isDefault),p=r.estimatedHours||0,g=Math.max(p*((n==null?void 0:n.rate)||85),(n==null?void 0:n.minCallOutFee)||0);d+=f+g});const i=d-o,l=d>0?i/d*100:0;return`
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${d.toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Avg. Margin</div>
          <div style="font-size:18px; font-weight:700; color:${l>=30?"var(--color-success)":"var(--color-warning)"};">${l.toFixed(1)}%</div>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:var(--text-secondary);">Projected Profit</span>
            <span style="font-weight:600; color:var(--color-success);">+$${i.toLocaleString("en-AU",{minimumFractionDigits:2})}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(l,100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-primary);"></div>
            <span style="color:var(--text-secondary); flex:1;">Internal Costs (Labor + Mat)</span>
            <span style="font-weight:500;">$${o.toLocaleString()}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-success);"></div>
            <span style="color:var(--text-secondary); flex:1;">Tiered Markup (Proj. Profit)</span>
            <span style="font-weight:500;">$${i.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${a.length} active jobs using tiered material markups.
      </div>
    </div>
  `}function h(e){return e==null?"":String(e).replace(/[&<>"']/g,function(t){switch(t){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return t}})}function ze({columns:e,data:s,onRowClick:t,getId:a,emptyMessage:o="No records found",emptyIcon:d="inbox",selectable:i=!1,onSelectionChange:l=null}){const r=document.createElement("div");r.className="card";let c=null,b="asc",f=1;const n=15,p=new Set;function g(){l&&l(Array.from(p))}function v(){let u=[...s];c&&u.sort((S,$)=>{const I=c.getValue?c.getValue(S):S[c.key],O=c.getValue?c.getValue($):$[c.key];return I==null?1:O==null?-1:typeof I=="string"?b==="asc"?I.localeCompare(O):O.localeCompare(I):b==="asc"?I-O:O-I});const y=Math.ceil(u.length/n);f>y&&(f=y||1);const x=(f-1)*n,C=u.slice(x,x+n);if(s.length===0){r.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${h(d)}</span>
          <h3>${h(o)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let k='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(i){const S=C.length>0&&C.every($=>p.has(String(a?a($):$.id)));k+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${S?"checked":""}></th>`}if(e.forEach(S=>{const $=c&&c.key===S.key,I=$?" sorted":"",O=$?b==="asc"?"arrow_upward":"arrow_downward":"unfold_more";k+=`<th class="${I}" data-key="${S.key}" style="${S.width?"width:"+S.width:""}">
        ${h(S.label)}
        <span class="material-icons-outlined sort-icon">${O}</span>
      </th>`}),k+="</tr></thead><tbody>",C.forEach(S=>{const $=String(a?a(S):S.id),I=p.has($);k+=`<tr data-id="${h($)}" style="cursor:pointer" class="${I?"selected-row":""}">`,i&&(k+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${h($)}" ${I?"checked":""}>
        </td>`),e.forEach(O=>{const q=O.render?O.render(S):h(S[O.key]??"");k+=`<td>${q}</td>`}),k+="</tr>"}),k+="</tbody></table></div>",y>1){k+=`<div class="pagination">
        <span class="pagination-info">Showing ${x+1}–${Math.min(x+n,u.length)} of ${u.length}</span>
        <div class="pagination-controls">
          <button ${f===1?"disabled":""} data-page="prev">‹</button>`;for(let S=1;S<=y;S++){if(y>7&&S>2&&S<y-1&&Math.abs(S-f)>1){(S===3||S===y-2)&&(k+="<button disabled>…</button>");continue}k+=`<button class="${S===f?"page-active":""}" data-page="${S}">${S}</button>`}k+=`<button ${f===y?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(r.innerHTML=k,r.querySelectorAll("th[data-key]").forEach(S=>{S.addEventListener("click",()=>{const $=e.find(I=>I.key===S.dataset.key);c===$?b=b==="asc"?"desc":"asc":(c=$,b="asc"),v()})}),t&&r.querySelectorAll("tbody tr[data-id]").forEach(S=>{S.addEventListener("click",$=>{$.target.closest(".dt-select-cell")||t(S.dataset.id)})}),i){r.querySelectorAll(".dt-select-row").forEach($=>{$.addEventListener("change",I=>{I.target.checked?p.add(I.target.value):p.delete(I.target.value),g(),v()})});const S=r.querySelector(".dt-select-all");S&&S.addEventListener("change",$=>{const I=$.target.checked;C.forEach(O=>{const q=String(a?a(O):O.id);I?p.add(q):p.delete(q)}),g(),v()})}r.querySelectorAll(".pagination-controls button[data-page]").forEach(S=>{S.addEventListener("click",()=>{const $=S.dataset.page;$==="prev"?f--:$==="next"?f++:f=parseInt($),v()})})}return v(),r.updateData=u=>{s=u,v()},r.clearSelection=()=>{p.clear(),g(),v()},r}let Ue=null;function Us(){return(!Ue||!document.body.contains(Ue))&&(Ue=document.createElement("div"),Ue.className="toast-container",Ue.id="toast-container",document.body.appendChild(Ue)),Ue}function L(e,s="info",t=3500){const a=Us(),o=document.createElement("div");o.className=`toast ${s}`;const d={success:"check_circle",error:"error",warning:"warning",info:"info"};o.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${s==="error"?"danger":s})">${d[s]||d.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${e}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,o.querySelector(".toast-close").addEventListener("click",()=>o.remove()),a.appendChild(o),setTimeout(()=>{o.parentNode&&(o.style.opacity="0",o.style.transform="translateX(20px)",o.style.transition="0.3s ease",setTimeout(()=>o.remove(),300))},t)}function Js(e,s,t){m.create("notifications",{title:e,message:s,link:t,read:!1}),L(`${e}: ${s}`,"info")}const Ce=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:Js,showToast:L},Symbol.toStringTag,{value:"Module"}));function Re({container:e,selectedIds:s,actions:t,onClear:a}){const o=e.querySelector(".bulk-action-bar");if(o&&o.remove(),!s||s.length===0)return;const d=document.createElement("div");d.className="bulk-action-bar slide-up";let i=`
    <div class="bulk-action-left">
      <span class="bulk-count">${s.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return t.forEach((l,r)=>{i+=`<button class="btn ${l.className||"btn-secondary"} btn-sm" data-action="${r}">
      ${l.icon?`<span class="material-icons-outlined" style="font-size:16px">${h(l.icon)}</span> `:""}
      ${h(l.label)}
    </button>`}),i+="</div>",d.innerHTML=i,d.querySelector("#btn-clear-selection").addEventListener("click",()=>{a&&a()}),d.querySelectorAll("button[data-action]").forEach(l=>{l.addEventListener("click",()=>{const r=l.dataset.action;t[r]&&t[r].onClick&&t[r].onClick(s)})}),e.appendChild(d),d}function St(e){const s=m.getAll("customers");e.innerHTML=`
    <div class="page-header">
      <h1>Customers</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-export-people">
          <span class="material-icons-outlined">download</span> Export
        </button>
        <button class="btn btn-primary" id="btn-new-person">
          <span class="material-icons-outlined">add</span> New Customer
        </button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        <button class="toolbar-filter" data-filter="Active">Active (${s.filter(d=>d.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${s.filter(d=>d.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let t=[...s];const o=ze({columns:[{key:"company",label:"Company / Name",render:d=>`<span class="cell-link font-medium">${h(d.company)}</span>`},{key:"contact",label:"Contact",render:d=>`${h(d.firstName)} ${h(d.lastName)}`},{key:"email",label:"Email",render:d=>`<span class="text-secondary">${h(d.email)}</span>`},{key:"phone",label:"Phone",render:d=>`<span class="text-secondary">${h(d.phone)}</span>`},{key:"type",label:"Type",render:d=>`<span class="badge badge-neutral">${h(d.type)}</span>`},{key:"status",label:"Status",render:d=>`<span class="badge ${d.status==="Active"?"badge-success":"badge-neutral"}">${h(d.status)}</span>`}],data:t,onRowClick:d=>z.navigate(`/people/${d}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:d=>{Re({container:e,selectedIds:d,onClear:()=>o.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:i=>{const l=document.createElement("div");l.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:r}=await Promise.resolve().then(()=>qe);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:`Update ${i.length} Customers`,content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Apply",className:"btn-primary",onClick:c=>{const b=l.querySelector("#bulk-status").value;i.forEach(f=>m.update("customers",f,{status:b})),o.clearSelection(),St(e),L(`Updated ${i.length} customers to ${b}`,"success"),c()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:i=>{ce(async()=>{const{showModal:l}=await Promise.resolve().then(()=>qe);return{showModal:l}},void 0).then(({showModal:l})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${i.length} customers? This cannot be undone.</p>`,l({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Delete",className:"btn-danger",onClick:c=>{i.forEach(b=>m.delete("customers",b)),o.clearSelection(),St(e),L(`Deleted ${i.length} customers`,"success"),c()}}]})})}}]})}});e.querySelector("#people-table-container").appendChild(o),e.querySelector("#btn-new-person").addEventListener("click",()=>{z.navigate("/people/new")}),e.querySelector("#btn-export-people").addEventListener("click",()=>{L("Customer data exported successfully","success")}),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(l=>l.classList.remove("active")),d.classList.add("active");const i=d.dataset.filter;t=i==="all"?[...s]:s.filter(l=>l.status===i),o.updateData(t)})}),e.querySelector("#people-search").addEventListener("input",d=>{var r;const i=d.target.value.toLowerCase();t=s.filter(c=>c.company.toLowerCase().includes(i)||`${c.firstName} ${c.lastName}`.toLowerCase().includes(i)||c.email.toLowerCase().includes(i));const l=(r=e.querySelector(".toolbar-filter.active"))==null?void 0:r.dataset.filter;l&&l!=="all"&&(t=t.filter(c=>c.status===l)),o.updateData(t)})}function fe({title:e,content:s,size:t="",onClose:a,actions:o=[]}){const d=document.createElement("div");d.className="modal-overlay",d.id="modal-overlay";const i=document.createElement("div");i.className=`modal ${t}`;let l=`
    <div class="modal-header">
      <h3>${h(e)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof s=="string"?h(s):""}</div>
  `;o.length&&(l+='<div class="modal-footer">',o.forEach((b,f)=>{l+=`<button class="btn ${b.className||"btn-secondary"}" id="modal-action-${f}">${h(b.label)}</button>`}),l+="</div>"),i.innerHTML=l,typeof s!="string"&&(s instanceof HTMLElement||s instanceof DocumentFragment)&&(i.querySelector(".modal-body").innerHTML="",i.querySelector(".modal-body").appendChild(s)),d.appendChild(i),document.body.appendChild(d);const r=()=>{d.remove(),a&&a()};i.querySelector("#modal-close-btn").addEventListener("click",r),d.addEventListener("click",b=>{b.target===d&&r()}),o.forEach((b,f)=>{const n=i.querySelector(`#modal-action-${f}`);n&&b.onClick&&n.addEventListener("click",()=>b.onClick(r))});const c=b=>{b.key==="Escape"&&(r(),document.removeEventListener("keydown",c))};return document.addEventListener("keydown",c),{close:r,modal:i,overlay:d}}const qe=Object.freeze(Object.defineProperty({__proto__:null,showModal:fe},Symbol.toStringTag,{value:"Module"}));function Ze({title:e,icon:s,iconBgColor:t="var(--color-primary-light)",iconTextColor:a="var(--color-primary)",metaHtml:o="",actionsHtml:d=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${t};color:${a}">
          <span class="material-icons-outlined">${s}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${e}</h2></div>
          ${o?`<div class="detail-header-meta">${o}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${d}
      </div>
    </div>
  `}function He({title:e,content:s,actions:t=[],width:a=400}){const o=document.querySelector(".drawer-overlay");o&&o.remove();const d=document.createElement("div");d.className="drawer-overlay";const i=document.createElement("div");i.className="drawer",i.style.width=typeof a=="number"?`${a}px`:a;const l=document.createElement("div");l.className="drawer-header",l.innerHTML=`
    <h3>${e}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const r=document.createElement("div");if(r.className="drawer-body",typeof s=="string"?r.innerHTML=s:r.appendChild(s),i.appendChild(l),i.appendChild(r),t.length>0){const b=document.createElement("div");b.className="drawer-footer",t.forEach(f=>{const n=document.createElement("button");n.className=`btn ${f.className||"btn-secondary"}`,n.innerHTML=f.label,n.onclick=()=>f.onClick(c),b.appendChild(n)}),i.appendChild(b)}d.appendChild(i),document.body.appendChild(d);function c(){i.style.animation="slideRightOut 0.2s ease forwards",d.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>d.remove(),200)}l.querySelector(".drawer-close").onclick=c,d.addEventListener("mousedown",b=>{b.target===d&&c()})}function Jt({customerId:e=null,site:s="",onSave:t=null}={}){const a=m.getAll("customers"),o=m.getAll("people").filter(g=>g.type==="Staff"),d=e?m.getById("customers",e):null,i=(d==null?void 0:d.sites)||[],l=document.createElement("div");l.innerHTML=`
    <form id="quick-asset-form" style="display: flex; flex-direction: column; gap: 15px; padding-top: 5px;">
      <div class="form-group">
        <label class="form-label">Asset Name/ID *</label>
        <input type="text" id="qa-asset-name" class="form-input" placeholder="e.g. Carrier HVAC Unit" required />
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="qa-asset-desc" class="form-input" rows="2" placeholder="Brief description..."></textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Owner Type</label>
          <select id="qa-owner-type" class="form-select">
            <option value="Business" ${e?"":"selected"}>My Business</option>
            <option value="Customer" ${e?"selected":""}>Customer</option>
          </select>
        </div>
        <div class="form-group" id="qa-customer-group" style="display: ${e?"block":"none"};">
          <label class="form-label">Customer</label>
          <select id="qa-customer-id" class="form-select">
            <option value="">Select customer...</option>
            ${a.map(g=>`<option value="${g.id}" ${e===g.id?"selected":""}>${g.company||g.firstName+" "+g.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Type / Category</label>
          <select id="qa-asset-type" class="form-select">
            <option>Vehicle</option>
            <option selected>Plant & Equipment</option>
            <option>Specialized Tool</option>
            <option>Fixed Asset (HVAC/Solar/Fire)</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Serial / ID / License</label>
          <input type="text" id="qa-asset-serial" class="form-input" placeholder="Serial number" />
        </div>
      </div>

      <!-- Conditional Sections -->
      <div id="qa-business-fields" style="display: ${e?"none":"flex"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Recovery Rate ($/hr)</label>
          <input type="number" id="qa-recovery-rate" class="form-input" value="0" step="0.5" />
        </div>
        <div class="form-group">
          <label class="form-label">Assign To</label>
          <select id="qa-assigned-to" class="form-select">
            <option value="">Unassigned</option>
            ${o.map(g=>`<option value="${g.id}">${g.firstName} ${g.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${e?"flex":"none"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${i.map(g=>`<option value="${h(g.name)}" ${s===g.name?"selected":""}>${h(g.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Install Date</label>
          <input type="date" id="qa-install-date" class="form-input" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Service Int. (Mos)</label>
          <input type="number" id="qa-service-interval" class="form-input" value="6" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label">Initial Meter/Hrs</label>
          <input type="number" id="qa-initial-meter" class="form-input" value="0" />
        </div>
      </div>
    </form>
  `;const r=l.querySelector("#qa-owner-type"),c=l.querySelector("#qa-customer-group"),b=l.querySelector("#qa-business-fields"),f=l.querySelector("#qa-customer-fields"),n=l.querySelector("#qa-customer-id"),p=l.querySelector("#qa-asset-site");r.addEventListener("change",g=>{const v=g.target.value==="Customer";c.style.display=v?"block":"none",b.style.display=v?"none":"flex",f.style.display=v?"flex":"none"}),n.addEventListener("change",g=>{const v=g.target.value,u=m.getById("customers",v);u&&u.sites?p.innerHTML='<option value="">-- No specific site --</option>'+u.sites.map(y=>`<option value="${h(y.name)}">${h(y.name)}</option>`).join(""):p.innerHTML='<option value="">-- No specific site --</option>'}),fe({title:"Quick Add Asset",size:"modal-70",content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Create Asset",className:"btn-primary",onClick:g=>{const v=l.querySelector("#qa-asset-name").value.trim();if(!v)return L("Asset Name is required","error");const u=r.value,y=n.value;if(u==="Customer"&&!y)return L("Please select a customer","error");const x={name:v,description:l.querySelector("#qa-asset-desc").value.trim(),ownerType:u,customerId:u==="Customer"?y:null,type:l.querySelector("#qa-asset-type").value,serial:l.querySelector("#qa-asset-serial").value.trim(),status:"Active",serviceIntervalMonths:parseInt(l.querySelector("#qa-service-interval").value)||6,currentMeter:parseInt(l.querySelector("#qa-initial-meter").value)||0,logs:[]};u==="Business"?(x.recoveryRate=parseFloat(l.querySelector("#qa-recovery-rate").value)||0,x.assignedToId=l.querySelector("#qa-assigned-to").value):(x.site=p.value,x.installDate=l.querySelector("#qa-install-date").value);const C=m.create("assets",x);L(`Asset "${v}" created successfully`,"success"),t&&t(C),g()}}]})}function Nt({onSave:e}={}){const s=m.getAll("assets"),a=m.getSettings().materialCategories||["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],o=document.createElement("div");o.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${a.map(d=>`<option>${d}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">SKU / Part #</label>
        <input type="text" id="qs-sku" class="form-input" placeholder="e.g. CON-20-4" />
      </div>
      <div class="form-group">
        <label class="form-label">Unit of Measure</label>
        <input type="text" id="qs-unit" class="form-input" value="each" placeholder="e.g. ea, m, pack" />
      </div>
      <div class="form-group">
        <label class="form-label">Reorder Level</label>
        <input type="number" id="qs-reorder" class="form-input" value="10" />
      </div>
      <div class="form-group">
        <label class="form-label">Cost Price (Ex GST) *</label>
        <input type="number" id="qs-cost" class="form-input" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Sell Price (Ex GST)</label>
        <input type="number" id="qs-sell" class="form-input" step="0.01" placeholder="Leave blank to auto-calc" />
      </div>
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Primary Location</label>
        <select id="qs-location" class="form-select">
          <option>Warehouse A</option>
          <option>Warehouse B</option>
          <optgroup label="Assets / Vehicles">
            ${s.map(d=>`<option>${d.name}</option>`).join("")}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `,fe({title:"Create New Catalog Item",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Save to Catalog",className:"btn-primary",onClick:d=>{const i=o.querySelector("#qs-name").value,l=parseFloat(o.querySelector("#qs-cost").value)||0;let r=parseFloat(o.querySelector("#qs-sell").value);if(!i){L("Item name is required","error");return}if(l<=0){L("Cost price is required","error");return}(isNaN(r)||r===0)&&(r=l*1.3);const c=m.create("stock",{name:i,category:o.querySelector("#qs-category").value,sku:o.querySelector("#qs-sku").value||`SKU-${Date.now().toString().slice(-4)}`,unit:o.querySelector("#qs-unit").value,reorderLevel:parseInt(o.querySelector("#qs-reorder").value)||10,costPrice:l,unitPrice:r,location:o.querySelector("#qs-location").value,quantity:0,supplier:""});L(`Stock item "${i}" created`,"success"),e&&e(c),d()}}]})}function Pt({id:e=null,jobId:s=null,supplierId:t=null,onSave:a=null}={}){const o=!e,d=m.getAll("contractors").filter(g=>g.isSupplier!==!1),i=m.getAll("jobs").filter(g=>g.status!=="Completed"&&g.status!=="Invoiced"),l=m.getAll("stock");let r=o?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],notes:"",supplierId:t||"",jobId:s||""}:m.getById("purchaseOrders",e);if(!r){L("Purchase Order not found","error");return}let c=[...r.lineItems||[]];const b=document.createElement("div");b.className="po-drawer-container";function f(){b.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${r.status!=="Draft"&&!o?"disabled":""}>
                <option value="">Select supplier...</option>
                ${d.map(g=>`<option value="${g.id}" ${r.supplierId===g.id?"selected":""}>${g.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${r.status!=="Draft"&&!o?"disabled":""}>
                <option value="">No specific job (Stock PO)</option>
                ${i.map(g=>`<option value="${g.id}" ${r.jobId===g.id?"selected":""}>#${g.number} - ${g.title}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${r.issueDate?r.issueDate.split("T")[0]:""}" ${r.status!=="Draft"&&!o?"disabled":""} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${h(r.notes||"")}" placeholder="e.g. Delivery instructions" ${r.status!=="Draft"&&!o?"disabled":""} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${o?"":`(${h(r.number)})`}</h4>
            ${r.status==="Draft"||o?`
            <div style="display:flex; gap:8px">
               <button class="btn btn-secondary btn-sm" id="btn-browse-stock"><span class="material-icons-outlined" style="font-size:16px">inventory_2</span> Browse Stock</button>
               <button class="btn btn-secondary btn-sm" id="btn-add-stock-new"><span class="material-icons-outlined" style="font-size:16px">add</span> Add New Stock</button>
            </div>
            `:`<span class="badge ${r.status==="Issued"?"badge-primary":"badge-success"}">${r.status}</span>`}
          </div>

          <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
            <table class="data-table" style="margin:0">
              <thead style="position:sticky; top:0; z-index:1">
                <tr>
                  <th>Description</th>
                  <th style="width:80px">Qty</th>
                  <th style="width:100px">Unit Cost</th>
                  <th style="width:100px; text-align:right">Total</th>
                  <th style="width:40px"></th>
                </tr>
              </thead>
              <tbody id="po-items-body">
                ${c.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>':c.map((g,v)=>`
                  <tr data-idx="${v}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${h(g.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${v}" ${r.status!=="Draft"&&!o?"disabled":""} />
                       <datalist id="stock-list-${v}">
                          ${l.map(u=>`<option value="${h(u.name)}">${h(u.name)} - $${(u.costPrice||0).toFixed(2)}</option>`).join("")}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${g.qty||g.quantity}" min="1" style="width:100%" ${r.status!=="Draft"&&!o?"disabled":""} /></td>
                    <td><input type="number" class="form-input item-cost" value="${g.cost||g.unitCost}" step="0.01" style="width:100%" ${r.status!=="Draft"&&!o?"disabled":""} /></td>
                    <td style="text-align:right; font-weight:600">$${((g.qty||g.quantity||0)*(g.cost||g.unitCost||0)).toFixed(2)}</td>
                    <td>${r.status==="Draft"||o?'<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>':""}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${c.reduce((g,v)=>g+(v.qty||v.quantity||0)*(v.cost||v.unitCost||0),0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,n()}function n(){var g,v;(g=b.querySelector("#btn-add-stock-new"))==null||g.addEventListener("click",()=>{Nt({onSave:u=>{c.push({description:u.name,qty:1,cost:u.costPrice||0,stockId:u.id}),f()}})}),(v=b.querySelector("#btn-browse-stock"))==null||v.addEventListener("click",()=>{var y;const u=document.createElement("div");u.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${l.map(x=>`
            <div class="stock-pick-item" data-id="${x.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${h(x.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${x.sku||"N/A"} — Cost: $${(x.costPrice||0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join("")}
        </div>
      `,fe({title:"Select Stock",content:u,actions:[{label:"Close",className:"btn-secondary",onClick:x=>x()}]}),(y=u.querySelector("#btn-po-new-stock"))==null||y.addEventListener("click",()=>{Nt({onSave:x=>{var C;c.push({description:x.name,qty:1,cost:x.costPrice||0,stockId:x.id}),f(),(C=document.querySelector(".modal-overlay"))==null||C.remove()}})}),u.querySelectorAll(".stock-pick-item").forEach(x=>{x.addEventListener("click",()=>{const C=l.find(k=>k.id===x.dataset.id);C&&(c.push({description:C.name,qty:1,cost:C.costPrice||0,stockId:C.id}),f(),L(`Added ${C.name}`,"success"))})})}),b.querySelectorAll("#po-items-body tr").forEach(u=>{var S;const y=parseInt(u.dataset.idx),x=u.querySelector(".item-desc"),C=u.querySelector(".item-qty"),k=u.querySelector(".item-cost");x==null||x.addEventListener("change",$=>{const I=$.target.value,O=l.find(q=>q.name===I);O?(c[y].description=O.name,c[y].cost=O.costPrice||0,c[y].stockId=O.id):c[y].description=I,f()}),C==null||C.addEventListener("input",()=>{const $=parseFloat(C.value)||0;c[y].qty=$,c[y].quantity=$}),k==null||k.addEventListener("input",()=>{const $=parseFloat(k.value)||0;c[y].cost=$,c[y].unitCost=$}),(S=u.querySelector(".btn-remove-item"))==null||S.addEventListener("click",()=>{c.splice(y,1),f()})})}f();const p=[{label:"Cancel",className:"btn-secondary",onClick:g=>g()}];o||r.status==="Draft"?p.push({label:o?"Create & Issue PO":"Update & Issue PO",className:"btn-primary",onClick:g=>{const v=b.querySelector("#qa-po-supplier").value,u=b.querySelector("#qa-po-job").value;if(!v){L("Supplier is required","error");return}if(c.length===0){L("Please add at least one item","error");return}const y=d.find(k=>k.id===v),x=i.find(k=>k.id===u),C={number:r.number||`PO-${Date.now().toString().slice(-6)}`,supplierId:v,supplierName:(y==null?void 0:y.company)||"Unknown",jobId:u||null,jobNumber:(x==null?void 0:x.number)||"",issueDate:b.querySelector("#qa-po-date").value,notes:b.querySelector("#qa-po-notes").value,total:c.reduce((k,S)=>k+(S.qty||S.quantity||0)*(S.cost||S.unitCost||0),0),status:"Issued",lineItems:c};o?m.create("purchaseOrders",C):m.update("purchaseOrders",e,C),L(`Purchase Order ${C.number} issued`,"success"),a&&a(),g()}}):r.status==="Issued"&&p.push({label:"Mark as Received",className:"btn-success",onClick:g=>{m.update("purchaseOrders",e,{status:"Received",receivedDate:new Date().toISOString()}),c.forEach(v=>{if(v.stockId){const u=m.getById("stock",v.stockId);u&&m.update("stock",u.id,{quantity:(u.quantity||0)+(v.qty||v.quantity)})}}),L(`PO ${r.number} marked as Received`,"success"),a&&a(),g()}}),He({title:o?"New Purchase Order":"Manage Purchase Order",content:b,width:750,actions:p})}function Vs(e,{id:s}){const t=m.getById("customers",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}Ve(t.company);const a=m.getAll("jobs").filter(c=>c.customerId===s),o=m.getAll("quotes").filter(c=>c.customerId===s),d=m.getAll("invoices").filter(c=>c.customerId===s);let i="details";function l(){e.innerHTML=`
      ${Ze({title:h(t.company),icon:t.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${h(t.firstName)} ${h(t.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${h(t.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${h(t.phone)}</span>
          <span class="badge ${t.status==="Active"?"badge-success":"badge-neutral"}">${h(t.status)}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-edit-person">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-person">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `})}

      <div class="tabs" id="person-tabs">
        <button class="tab ${i==="details"?"active":""}" data-tab="details">Details</button>
        <button class="tab ${i==="contacts"?"active":""}" data-tab="contacts">Contacts (${(t.contacts||[]).length})</button>
        <button class="tab ${i==="sites"?"active":""}" data-tab="sites">Sites (${(t.sites||[]).length})</button>
        <button class="tab ${i==="assets"?"active":""}" data-tab="assets">Assets (${m.getAll("assets").filter(c=>c.ownerType==="Customer"&&c.customerId===s).length})</button>
        <button class="tab ${i==="communications"?"active":""}" data-tab="communications">Communications (${(t.communications||[]).length})</button>
        <button class="tab ${i==="jobs"?"active":""}" data-tab="jobs">Jobs (${a.length})</button>
        <button class="tab ${i==="quotes"?"active":""}" data-tab="quotes">Quotes (${o.length})</button>
        <button class="tab ${i==="invoices"?"active":""}" data-tab="invoices">Invoices (${d.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,r(),e.querySelectorAll(".tab").forEach(c=>{c.addEventListener("click",()=>{i=c.dataset.tab,e.querySelectorAll(".tab").forEach(b=>b.classList.remove("active")),c.classList.add("active"),r()})}),e.querySelector("#btn-edit-person").addEventListener("click",()=>{z.navigate(`/people/${s}/edit`)}),e.querySelector("#btn-delete-person").addEventListener("click",()=>{const c=document.createElement("div");c.innerHTML=`<p>Are you sure you want to delete <strong>${h(t.company)}</strong>? This action cannot be undone.</p>`,fe({title:"Delete Customer",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{m.delete("customers",s),L("Customer deleted successfully","success"),b(),z.navigate("/people")}}]})})}function r(){const c=e.querySelector("#tab-content");if(i==="details")c.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Me("Company",t.company)}
                  ${Me("Contact",`${t.firstName} ${t.lastName}`)}
                  ${Me("Email",t.email)}
                  ${Me("Phone",t.phone)}
                  ${Me("Type",t.type)}
                  ${Me("Status",t.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Me("Address",t.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Me("Created",new Date(t.createdAt).toLocaleDateString())}
                  ${Me("Last Updated",new Date(t.updatedAt).toLocaleDateString())}
                  ${Me("Total Jobs",a.length)}
                  ${Me("Total Quotes",o.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(i==="contacts"){const b=t.contacts||[];c.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${b.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${b.map((f,n)=>`
                  <tr>
                    <td class="font-medium">${h(f.name)}</td>
                    <td>${h(f.role||"—")}</td>
                    <td><a href="mailto:${h(f.email)}" class="cell-link">${h(f.email)}</a></td>
                    <td><a href="tel:${h(f.phone)}" class="cell-link">${h(f.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${n}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${b.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,c.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const f=document.createElement("div");f.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,He({title:"Add Contact",content:f.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save",className:"btn-primary",onClick:n=>{const p=document.querySelector(".drawer-overlay"),g=p.querySelector("#new-c-name").value.trim();if(!g)return L("Name is required","error");t.contacts||(t.contacts=[]),t.contacts.push({name:g,role:p.querySelector("#new-c-role").value,email:p.querySelector("#new-c-email").value,phone:p.querySelector("#new-c-phone").value}),m.update("customers",s,{contacts:t.contacts}),L("Contact added","success"),r(),l(),n()}}]})}),c.querySelectorAll(".btn-delete-contact").forEach(f=>{f.addEventListener("click",()=>{t.contacts.splice(f.dataset.index,1),m.update("customers",s,{contacts:t.contacts}),L("Contact deleted","success"),r(),l()})})}else if(i==="sites"){const b=t.sites||[];c.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${b.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${b.map((f,n)=>`
                  <tr>
                    <td class="font-medium">${h(f.name)}</td>
                    <td>${h(f.address)}</td>
                    <td class="text-secondary">${h(f.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${n}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${b.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,c.querySelector("#btn-toggle-site").addEventListener("click",()=>{const f=document.createElement("div");f.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,He({title:"Add Site",content:f.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save",className:"btn-primary",onClick:n=>{const p=document.querySelector(".drawer-overlay"),g=p.querySelector("#new-s-name").value.trim(),v=p.querySelector("#new-s-address").value.trim();if(!g||!v)return L("Name and Address are required","error");t.sites||(t.sites=[]),t.sites.push({name:g,address:v,notes:p.querySelector("#new-s-notes").value}),m.update("customers",s,{sites:t.sites}),L("Site added","success"),r(),l(),n()}}]})}),c.querySelectorAll(".btn-delete-site").forEach(f=>{f.addEventListener("click",()=>{t.sites.splice(f.dataset.index,1),m.update("customers",s,{sites:t.sites}),L("Site deleted","success"),r(),l()})})}else if(i==="assets"){t.assets&&t.assets.length>0&&(t.assets.forEach(f=>{m.create("assets",{name:f.name,serial:f.serial,site:f.site,installDate:f.installDate,ownerType:"Customer",customerId:s,status:"Active",type:"Equipment"})}),t.assets=[],m.update("customers",s,{assets:[]}));const b=m.getAll("assets").filter(f=>f.ownerType==="Customer"&&f.customerId===s);t.sites,c.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${b.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${b.map((f,n)=>`
                  <tr>
                    <td class="font-medium">${h(f.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${h(f.serial||"—")}</td>
                    <td>${h(f.site||"—")}</td>
                    <td>${f.installDate?new Date(f.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${f.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${b.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,c.querySelector("#btn-toggle-asset").addEventListener("click",()=>{Jt({customerId:s,onSave:()=>{r(),l()}})}),c.querySelectorAll(".btn-delete-asset").forEach(f=>{f.addEventListener("click",()=>{const n=f.dataset.id;m.delete("assets",n),L("Asset disabled/deleted","success"),r(),l()})})}else if(i==="communications"){const f=[...t.communications||[]].sort((n,p)=>new Date(p.date)-new Date(n.date));c.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${f.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${f.map((n,p)=>`
                  <div style="display:flex;gap:12px;border-bottom:1px solid var(--border-color);padding-bottom:12px">
                    <div style="background:var(--color-${n.type==="Email"?"info":n.type==="Call"?"success":"neutral"}-bg);color:var(--color-${n.type==="Email"?"info":n.type==="Call"?"success":"neutral"});padding:8px;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span class="material-icons-outlined" style="font-size:20px">${n.type==="Email"?"mail":n.type==="Call"?"phone":"sticky_note_2"}</span>
                    </div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                        <strong style="font-size:var(--font-size-md)">${n.type}</strong>
                        <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">${new Date(n.date).toLocaleDateString()}</span>
                      </div>
                      <div style="color:var(--text-secondary);white-space:pre-wrap;font-size:var(--font-size-sm)">${n.content}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      `,c.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const n=document.createElement("div");n.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="new-comm-type" class="form-select">
                <option value="Note">Note</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" id="new-comm-date" class="form-input" value="${new Date().toISOString().split("T")[0]}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Details / Content</label>
            <textarea id="new-comm-content" class="form-input" rows="3" placeholder="Enter notes here..."></textarea>
          </div>
        `,He({title:"Log Activity",content:n.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:p=>p()},{label:"Save",className:"btn-primary",onClick:p=>{const g=document.querySelector(".drawer-overlay"),v=g.querySelector("#new-comm-content").value.trim();if(!v)return L("Details are required","error");t.communications||(t.communications=[]),t.communications.push({id:Date.now().toString(),type:g.querySelector("#new-comm-type").value,date:g.querySelector("#new-comm-date").value,content:v}),m.update("customers",s,{communications:t.communications}),L("Activity logged","success"),r(),l(),p()}}]})})}else i==="jobs"?c.innerHTML=ht(a,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):i==="quotes"?(c.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${ht(o,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,c.querySelector("#btn-create-quote").addEventListener("click",()=>{z.navigate("/quotes/new?customerId="+s)})):i==="invoices"&&(c.innerHTML=ht(d,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}l()}function Me(e,s){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${h(e)}</span>
      <span style="font-size:var(--font-size-base)">${h(s)}</span>
    </div>
  `}function ht(e,s,t,a){if(e.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${a}</h3></div></div>`;const o=d=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[d]||"neutral"}">${h(d)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${s.map(d=>`<th>${h(d.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.map(d=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${t}/${h(d.id)}'">
                ${s.map(i=>{let l=d[i.key];return i.badge?l=o(l):i.format==="currency"?l=`$${(l||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:i.format==="date"?l=l?new Date(l).toLocaleDateString():"—":l=h(l),`<td>${l}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Vt(e,{id:s}){const t=s&&s!=="new",a=t?m.getById("customers",s):{};e.innerHTML=`
    <div class="page-header">
      <h1>${t?"Edit Customer":"New Customer"}</h1>
    </div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="person-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Company Name *</label>
              <input class="form-input" name="company" value="${a.company||""}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                <option value="Company" ${a.type==="Company"?"selected":""}>Company</option>
                <option value="Individual" ${a.type==="Individual"?"selected":""}>Individual</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input class="form-input" name="firstName" value="${a.firstName||""}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input class="form-input" name="lastName" value="${a.lastName||""}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" name="email" value="${a.email||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" name="phone" value="${a.phone||""}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" name="address" value="${a.address||""}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                <option value="Active" ${a.status==="Active"||!t?"selected":""}>Active</option>
                <option value="Inactive" ${a.status==="Inactive"?"selected":""}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${a.notes||""}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save">
          <span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Customer
        </button>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{z.navigate(t?`/people/${s}`:"/people")}),e.querySelector("#btn-save").addEventListener("click",()=>{const o=e.querySelector("#person-form");if(!o.checkValidity()){o.reportValidity();return}const d=new FormData(o),i=Object.fromEntries(d);if(t)m.update("customers",s,i),L("Customer updated successfully","success"),z.navigate(`/people/${s}`);else{const l=m.create("customers",i);L("Customer created successfully","success"),z.navigate(`/people/${l.id}`)}})}function kt(e){const s=m.getAll("leads");e.innerHTML=`
    <div class="page-header">
      <h1>Leads</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-lead">
          <span class="material-icons-outlined">add</span> New Lead
        </button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        <button class="toolbar-filter" data-filter="New">New</button>
        <button class="toolbar-filter" data-filter="Contacted">Contacted</button>
        <button class="toolbar-filter" data-filter="Qualified">Qualified</button>
        <button class="toolbar-filter" data-filter="Won">Won</button>
        <button class="toolbar-filter" data-filter="Lost">Lost</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search leads..." id="leads-search" />
      </div>
    </div>
    <div id="leads-table-container"></div>
  `;let t=[...s];const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},o={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},i=ze({columns:[{key:"title",label:"Lead",render:l=>`<span class="cell-link font-medium">${h(l.title)}</span>`},{key:"customerName",label:"Customer",render:l=>`<span class="text-secondary">${h(l.customerName)}</span>`},{key:"source",label:"Source",render:l=>`<span class="text-secondary">${h(l.source)}</span>`},{key:"status",label:"Status",render:l=>`<span class="badge ${a[l.status]||"badge-neutral"}">${h(l.status)}</span>`},{key:"priority",label:"Priority",render:l=>`<span class="badge ${o[l.priority]||"badge-neutral"}">${h(l.priority)}</span>`},{key:"value",label:"Value",render:l=>`<span class="font-medium">$${(l.value||0).toLocaleString()}</span>`,getValue:l=>l.value},{key:"createdAt",label:"Created",render:l=>`<span class="text-secondary">${new Date(l.createdAt).toLocaleDateString()}</span>`,getValue:l=>new Date(l.createdAt).getTime()}],data:t,onRowClick:l=>z.navigate(`/leads/${l}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:l=>{Re({container:e,selectedIds:l,onClear:()=>i.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:r=>{const c=document.createElement("div");c.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:b}=await Promise.resolve().then(()=>qe);return{showModal:b}},void 0).then(({showModal:b})=>{b({title:`Update ${r.length} Leads`,content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Apply",className:"btn-primary",onClick:f=>{const n=c.querySelector("#bulk-status").value;r.forEach(p=>m.update("leads",p,{status:n})),i.clearSelection(),kt(e),ce(async()=>{const{showToast:p}=await Promise.resolve().then(()=>Ce);return{showToast:p}},void 0).then(({showToast:p})=>p(`Updated ${r.length} leads to ${n}`,"success")),f()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{ce(async()=>{const{showModal:c}=await Promise.resolve().then(()=>qe);return{showModal:c}},void 0).then(({showModal:c})=>{const b=document.createElement("div");b.innerHTML=`<p>Are you sure you want to delete ${r.length} leads? This action cannot be undone.</p>`,c({title:"Confirm Bulk Delete",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Delete",className:"btn-danger",onClick:f=>{r.forEach(n=>m.delete("leads",n)),i.clearSelection(),kt(e),ce(async()=>{const{showToast:n}=await Promise.resolve().then(()=>Ce);return{showToast:n}},void 0).then(({showToast:n})=>n(`Deleted ${r.length} leads`,"success")),f()}}]})})}}]})}});e.querySelector("#leads-table-container").appendChild(i),e.querySelector("#btn-new-lead").addEventListener("click",()=>z.navigate("/leads/new")),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(c=>c.classList.remove("active")),l.classList.add("active");const r=l.dataset.filter;t=r==="all"?[...s]:s.filter(c=>c.status===r),i.updateData(t)})}),e.querySelector("#leads-search").addEventListener("input",l=>{const r=l.target.value.toLowerCase();t=s.filter(c=>c.title.toLowerCase().includes(r)||c.customerName.toLowerCase().includes(r)),i.updateData(t)})}function Qs(e,{id:s}){const t=m.getById("leads",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}Ve(t.title);const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"};e.innerHTML=`
    ${Ze({title:t.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
        <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${t.customerName}</span>
        <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${t.contactName}</span>
        <span class="badge ${a[t.status]||"badge-neutral"}">${t.status}</span>
      `,actionsHtml:`
        <button class="btn btn-primary" id="btn-convert-quote">
          <span class="material-icons-outlined">request_quote</span> Convert to Quote
        </button>
        <button class="btn btn-secondary" id="btn-edit-lead">
          <span class="material-icons-outlined">edit</span> Edit
        </button>
        <button class="btn btn-danger" id="btn-delete-lead">
          <span class="material-icons-outlined">delete</span>
        </button>
      `})}

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Lead Information</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Je("Title",t.title)}
            ${Je("Customer",t.customerName)}
            ${Je("Contact",t.contactName)}
            ${Je("Source",t.source)}
            ${Je("Priority",t.priority)}
            ${Je("Status",t.status)}
            ${Je("Estimated Value","$"+(t.value||0).toLocaleString())}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Description & Notes</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);line-height:1.6">${t.description||"No description provided."}</p>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-convert-quote").addEventListener("click",()=>{const o=m.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,title:t.title,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0});m.update("leads",s,{status:"Won"}),L("Lead converted to quote successfully","success"),z.navigate(`/quotes/${o.id}`)}),e.querySelector("#btn-edit-lead").addEventListener("click",()=>z.navigate(`/leads/${s}/edit`)),e.querySelector("#btn-delete-lead").addEventListener("click",()=>{const o=document.createElement("div");o.innerHTML=`<p>Delete <strong>${h(t.title)}</strong>?</p>`,fe({title:"Delete Lead",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{m.delete("leads",s),L("Lead deleted","success"),d(),z.navigate("/leads")}}]})})}function Je(e,s){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function Qt(e,{id:s}){const t=s&&s!=="new",a=t?m.getById("leads",s):{},o=m.getAll("customers");e.innerHTML=`
    <div class="page-header"><h1>${t?"Edit Lead":"New Lead"}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="lead-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${a.title||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" name="customerId" required>
                <option value="">Select customer...</option>
                ${o.map(d=>`<option value="${d.id}" ${a.customerId===d.id?"selected":""}>${d.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(d=>`<option ${a.source===d?"selected":""}>${d}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(d=>`<option ${a.status===d?"selected":""}>${d}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(d=>`<option ${a.priority===d?"selected":""}>${d}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Estimated Value ($)</label>
            <input class="form-input" type="number" name="value" value="${a.value||""}" step="0.01" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" name="description">${a.description||""}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Lead</button>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>z.navigate(t?`/leads/${s}`:"/leads")),e.querySelector("#btn-save").addEventListener("click",()=>{const d=e.querySelector("#lead-form");if(!d.checkValidity()){d.reportValidity();return}const i=Object.fromEntries(new FormData(d));i.value=parseFloat(i.value)||0;const l=o.find(r=>r.id===i.customerId);if(i.customerName=(l==null?void 0:l.company)||"",i.contactName=l?`${l.firstName} ${l.lastName}`:"",t)m.update("leads",s,i),L("Lead updated","success"),z.navigate(`/leads/${s}`);else{const r=m.create("leads",i);L("Lead created","success"),z.navigate(`/leads/${r.id}`)}})}function Wt(e){const s=m.getAll("notifications")||[];let t="",a="all";function o(){return s.filter(n=>{var u,y,x,C,k;const p=t.toLowerCase(),g=((u=n.title)==null?void 0:u.toLowerCase().includes(p))||((y=n.description)==null?void 0:y.toLowerCase().includes(p))||((x=n.createdBy)==null?void 0:x.toLowerCase().includes(p))||((C=n.type)==null?void 0:C.toLowerCase().includes(p))||((k=n.priority)==null?void 0:k.toLowerCase().includes(p)),v=a==="all"||n.status===a;return g&&v})}e.innerHTML=`
    <div class="page-header">
      <h1>Notifications</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-raise-notification">
          <span class="material-icons-outlined">campaign</span> Raise Notification
        </button>
      </div>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter ${a==="all"?"active":""}" data-filter="all">All (${s.length})</button>
        <button class="toolbar-filter ${a==="Pending"?"active":""}" data-filter="Pending">Pending (${s.filter(n=>n.status==="Pending").length})</button>
        <button class="toolbar-filter ${a==="Converted"?"active":""}" data-filter="Converted">Converted (${s.filter(n=>n.status==="Converted").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${h(t)}" />
      </div>
    </div>
    
    <div id="notifications-table-container"></div>
  `;const i=ze({columns:[{key:"createdAt",label:"Date",render:n=>n.createdAt?new Date(n.createdAt).toLocaleDateString():"—",getValue:n=>n.createdAt?new Date(n.createdAt).getTime():0,width:"100px"},{key:"type",label:"Type",render:n=>`<span class="badge badge-neutral">${h(n.type||"Field Alert")}</span>`,width:"120px"},{key:"title",label:"Title / Job Name",render:n=>`
        <div style="font-weight:500">${h(n.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(n.description)}</div>
      `},{key:"priority",label:"Priority",render:n=>`<span class="badge ${n.priority==="Urgent"||n.priority==="High"?"badge-danger":"badge-neutral"}">${h(n.priority||"Normal")}</span>`,width:"100px"},{key:"status",label:"Status",render:n=>`<span class="badge ${n.status==="Converted"?"badge-success":"badge-warning"}">${h(n.status)}</span>`,width:"110px"},{key:"createdBy",label:"Raised By",width:"150px"},{key:"actions",label:"",render:n=>`
        <div style="text-align:right">
          ${n.status!=="Converted"?`
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${n.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${n.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          `:""}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${n.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${n.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,width:"150px"}],data:o(),onRowClick:n=>{const p=s.find(g=>g.id===n);p&&c(p)},emptyMessage:"No notifications found",emptyIcon:"campaign"});e.querySelector("#notifications-table-container").appendChild(i),e.querySelector("#notif-search").addEventListener("input",n=>{t=n.target.value,i.updateData(o())}),e.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(p=>p.classList.remove("active")),n.classList.add("active"),a=n.dataset.filter,i.updateData(o())})}),e.querySelector("#btn-raise-notification").addEventListener("click",()=>r()),i.addEventListener("click",n=>{const p=n.target.closest("button");if(!p)return;n.stopPropagation();const g=p.dataset.id;if(p.classList.contains("btn-view-notification")){const v=s.find(u=>u.id===g);v&&c(v)}else if(p.classList.contains("btn-edit-notification")){const v=s.find(u=>u.id===g);v&&r(v)}else p.classList.contains("btn-convert-quote")?b(g):p.classList.contains("btn-convert-job")&&f(g)});function r(n=null){const p=m.getAll("jobs"),g=JSON.parse(sessionStorage.getItem("currentUser")||"{}");He({title:n?"Edit Notification":"Raise Notification",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="notif-type">
              <option value="Field Fault" ${(n==null?void 0:n.type)==="Field Fault"?"selected":""}>Field Fault</option>
              <option value="Client Request" ${(n==null?void 0:n.type)==="Client Request"?"selected":""}>Client Request</option>
              <option value="Safety Hazard" ${(n==null?void 0:n.type)==="Safety Hazard"?"selected":""}>Safety Hazard</option>
              <option value="Recurring Job Due" ${(n==null?void 0:n.type)==="Recurring Job Due"?"selected":""}>Recurring Job Due</option>
              <option value="Other" ${(n==null?void 0:n.type)==="Other"?"selected":""}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Related Job (Optional)</label>
            <select class="form-select" id="notif-job">
              <option value="">-- None --</option>
              ${p.map(v=>`<option value="${v.id}" ${(n==null?void 0:n.jobId)===v.id?"selected":""}>${h(v.number)} - ${h(v.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${h((n==null?void 0:n.title)||"")}" />
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="notif-priority">
              <option value="Low" ${(n==null?void 0:n.priority)==="Low"?"selected":""}>Low</option>
              <option value="Normal" ${!n||(n==null?void 0:n.priority)==="Normal"?"selected":""}>Normal</option>
              <option value="High" ${(n==null?void 0:n.priority)==="High"?"selected":""}>High</option>
              <option value="Urgent" ${(n==null?void 0:n.priority)==="Urgent"?"selected":""}>Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fault / Description <span class="text-danger">*</span></label>
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${h((n==null?void 0:n.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:n?"Save Changes":"Submit Notification",className:"btn-primary",onClick:v=>{const u=document.getElementById("notif-type").value,y=document.getElementById("notif-job").value,x=document.getElementById("notif-title").value.trim(),C=document.getElementById("notif-priority").value,k=document.getElementById("notif-desc").value.trim();if(!x||!k){L("Title and Description are required","error");return}n?(m.update("notifications",n.id,{type:u,jobId:y||null,title:x,priority:C,description:k}),L("Notification updated","success")):(m.create("notifications",{type:u,jobId:y||null,title:x,priority:C,description:k,status:"Pending",createdAt:new Date().toISOString(),createdBy:g.name||"Unknown"}),L("Notification raised successfully","success")),v(),Wt(e)}}]})}function c(n){He({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${n.status==="Converted"?"badge-success":"badge-warning"}">${h(n.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${h(n.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${h(n.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${h(n.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${h(n.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${n.createdAt?new Date(n.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${n.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${n.jobId}">${h(n.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:n.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:p=>p()},{label:"Edit",className:"btn-secondary",onClick:p=>{p(),r(n)}},{label:"Convert to Quote",className:"btn-secondary",onClick:p=>{p(),b(n.id)}},{label:"Convert to Job",className:"btn-primary",onClick:p=>{p(),f(n.id)}}]:[{label:"Close",className:"btn-secondary",onClick:p=>p()}]})}function b(n){const p=m.getById("notifications",n);if(!p)return;const g=m.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:p.title,description:p.description,priority:p.priority,status:"Draft",notes:`Generated from Notification: ${p.title}

${p.description}`,createdAt:new Date().toISOString()});m.update("notifications",n,{status:"Converted",convertedTo:`Quote ${g.number}`}),L("Converted to Quote successfully","success"),z.navigate(`/quotes/${g.id}`)}function f(n){const p=m.getById("notifications",n);if(!p)return;const g=m.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,title:p.title,description:p.description,priority:p.priority,status:"Pending",notes:`Generated from Notification: ${p.title}

${p.description}`,createdAt:new Date().toISOString()});m.update("notifications",n,{status:"Converted",convertedTo:`Job ${g.number}`}),L("Converted to Job successfully","success"),z.navigate(`/jobs/${g.id}`)}}function Ct(e){const s=m.getAll("quotes");e.innerHTML=`
    <div class="page-header">
      <h1>Quotes</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Finalised">Finalised</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Accepted">Accepted</button>
        <button class="toolbar-filter" data-filter="Declined">Declined</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search quotes..." id="quotes-search" />
      </div>
    </div>
    <div id="quotes-table-container"></div>
  `;let t=[...s];const a={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},d=ze({columns:[{key:"number",label:"Quote #",render:i=>`<span class="cell-link font-medium">${h(i.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:i=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${h(i.title||"")}</span>`},{key:"status",label:"Status",render:i=>`<span class="badge ${a[i.status]||"badge-neutral"}">${h(i.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:i=>`<span class="font-semibold">$${(i.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:i=>i.total,width:"110px"},{key:"createdAt",label:"Date",render:i=>new Date(i.createdAt).toLocaleDateString(),getValue:i=>new Date(i.createdAt).getTime(),width:"100px"}],data:t,onRowClick:i=>z.navigate(`/quotes/${i}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:i=>{Re({container:e,selectedIds:i,onClear:()=>d.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:l=>{const r=document.createElement("div");r.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Finalised">Finalised</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:c}=await Promise.resolve().then(()=>qe);return{showModal:c}},void 0).then(({showModal:c})=>{c({title:`Update ${l.length} Quotes`,content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{const f=r.querySelector("#bulk-status").value;l.forEach(n=>m.update("quotes",n,{status:f})),d.clearSelection(),Ct(e),ce(async()=>{const{showToast:n}=await Promise.resolve().then(()=>Ce);return{showToast:n}},void 0).then(({showToast:n})=>n(`Updated ${l.length} quotes to ${f}`,"success")),b()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{ce(async()=>{const{showModal:r}=await Promise.resolve().then(()=>qe);return{showModal:r}},void 0).then(({showModal:r})=>{const c=document.createElement("div");c.innerHTML=`<p>Are you sure you want to delete ${l.length} quotes? This action cannot be undone.</p>`,r({title:"Confirm Bulk Delete",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{l.forEach(f=>m.delete("quotes",f)),d.clearSelection(),Ct(e),ce(async()=>{const{showToast:f}=await Promise.resolve().then(()=>Ce);return{showToast:f}},void 0).then(({showToast:f})=>f(`Deleted ${l.length} quotes`,"success")),b()}}]})})}}]})}});e.querySelector("#quotes-table-container").appendChild(d),e.querySelector("#btn-new-quote").addEventListener("click",()=>z.navigate("/quotes/new")),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(r=>r.classList.remove("active")),i.classList.add("active");const l=i.dataset.filter;t=l==="all"?[...s]:s.filter(r=>r.status===l),d.updateData(t)})}),e.querySelector("#quotes-search").addEventListener("input",i=>{const l=i.target.value.toLowerCase();t=s.filter(r=>r.number.toLowerCase().includes(l)||r.customerName.toLowerCase().includes(l)||(r.title||"").toLowerCase().includes(l)),d.updateData(t)})}function Gt({type:e,data:s}){const t=document.createElement("div");t.className="modal-overlay",t.id="print-preview-overlay",t.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const a=document.createElement("div");a.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const o=document.createElement("div");o.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;",o.innerHTML=`
    <span style="font-weight:600;font-size:14px">${e==="quote"?"Quote":"Invoice"} Preview — ${s.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const d=document.createElement("div");d.id="print-document",d.className="print-document",d.innerHTML=Mt(e,s),a.appendChild(o),a.appendChild(d),t.appendChild(a),document.body.appendChild(t);const i=()=>t.remove();o.querySelector("#btn-close-preview").addEventListener("click",i),t.addEventListener("click",r=>{r.target===t&&i()}),o.querySelector("#btn-print-pdf").addEventListener("click",()=>{const r=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.number} — ${e==="quote"?"Quote":"Invoice"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${Ws()}</style>
      </head>
      <body>
        ${Mt(e,s)}
      </body>
      </html>
    `,c=`${e==="quote"?"Quote":"Invoice"} ${s.number}`;if(!m.getAll("documents").find(p=>p.entityId===s.id&&p.name===c)){const p=`data:text/html;charset=utf-8,${encodeURIComponent(r)}`;m.create("documents",{name:c,type:e==="quote"?"Quote PDF":"Invoice PDF",size:r.length,url:p,folder:e==="quote"?"Quotes":"Invoices",uploadedAt:new Date().toISOString(),entityType:e==="quote"?"Quote":"Invoice",entityId:s.id,entityName:s.customerName||"Unknown Customer"}),ce(async()=>{const{showToast:g}=await Promise.resolve().then(()=>Ce);return{showToast:g}},void 0).then(({showToast:g})=>{g(`${c} saved to Documents`,"success")})}const n=window.open("","_blank","width=800,height=1000");n.document.write(r),n.document.close(),setTimeout(()=>{n.print()},500)});const l=r=>{r.key==="Escape"&&(i(),document.removeEventListener("keydown",l))};document.addEventListener("keydown",l)}function Mt(e,s){const t=e==="quote",o={Draft:"#6B7280",Finalised:"#1B6DE0",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[s.status]||"#6B7280",d=s.customerName||"Customer",i=s.contactName||"",l=s.lineItems||[],r=s.sections||[],c=m.getSettings(),b=c.logo?`<img src="${c.logo}" style="max-height:60px; max-width:240px; object-fit:contain" />`:'<div class="pdf-logo">F</div>';let f="";return r.length>0?r.forEach(n=>{f+=`
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${h(n.name||"Phase")}</td>
        </tr>
      `,n.lineItems.forEach(p=>{f+=`
          <tr>
            <td>${p.description?h(p.description):"—"}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(p.type||"other").charAt(0).toUpperCase()+(p.type||"other").slice(1)}</span></td>
            <td style="text-align:center">${p.qty||1}</td>
            <td style="text-align:right">$${(p.rate||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(p.total||0).toFixed(2)}</td>
          </tr>
        `}),f+=`
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(n.subtotal||0).toFixed(2)}</td>
        </tr>
      `}):f=l.map(n=>`
      <tr>
        <td>${n.description?h(n.description):"—"}</td>
        <td style="text-align:center"><span class="pdf-type-tag">${(n.type||"other").charAt(0).toUpperCase()+(n.type||"other").slice(1)}</span></td>
        <td style="text-align:center">${n.qty||1}</td>
        <td style="text-align:right">$${(n.rate||0).toFixed(2)}</td>
        <td style="text-align:right;font-weight:600">$${(n.total||0).toFixed(2)}</td>
      </tr>
    `).join(""),`
    <div class="pdf-page">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-company">
          ${b}
          <div>
            <div class="pdf-company-name">${h(c.name||"FieldForge Demo Company")}</div>
            <div class="pdf-company-detail">ABN: ${h(c.abn||"12 345 678 901")}</div>
            <div class="pdf-company-detail">${h(c.address||"123 Business St, Melbourne VIC 3000")}</div>
            <div class="pdf-company-detail">Phone: ${h(c.phone||"1300 123 456")}</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${t?"QUOTE":"TAX INVOICE"}</div>
          <div class="pdf-doc-number">${s.number}</div>
          <div class="pdf-status" style="background:${o}15;color:${o};border:1px solid ${o}40">${s.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${t?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${d}</div>
          ${i?`<div class="pdf-info-value">Attn: ${i}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${t?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${xt(t?s.createdAt:s.issueDate)}</span>
          </div>
          ${t?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${xt(s.validUntil)}</span>
            </div>
          `:`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${xt(s.dueDate)}</span>
            </div>
          `}
          ${!t&&s.jobNumber?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Job Reference</span>
              <span class="pdf-info-value">${s.jobNumber}</span>
            </div>
          `:""}
          ${t&&s.title?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Description</span>
              <span class="pdf-info-value">${s.title}</span>
            </div>
          `:""}
        </div>
      </div>

      <!-- Line Items Table -->
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width:40%">Description</th>
            <th style="width:12%;text-align:center">Type</th>
            <th style="width:10%;text-align:center">Qty</th>
            <th style="width:13%;text-align:right">Rate</th>
            <th style="width:15%;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${f}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="pdf-totals">
        <div class="pdf-total-row">
          <span>Subtotal</span>
          <span>$${(s.subtotal||0).toFixed(2)}</span>
        </div>
        <div class="pdf-total-row">
          <span>GST (10%)</span>
          <span>$${(s.tax||0).toFixed(2)}</span>
        </div>
        <div class="pdf-total-row pdf-grand-total">
          <span>Total (AUD)</span>
          <span>$${(s.total||0).toFixed(2)}</span>
        </div>
      </div>


      ${s.notes?`
        <div class="pdf-notes">
          <div class="pdf-notes-title">Notes</div>
          <div class="pdf-notes-text">${h(s.notes).replace(/\n/g,"<br>")}</div>
        </div>
      `:""}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div class="pdf-footer-text">
          ${t?"This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.":"Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business."}
        </div>
        <div class="pdf-footer-company">${h(c.name||"FieldForge Demo Company")} — ${h(c.email||"hello@fieldforge.io")} — ${h(c.phone||"1300 123 456")}</div>
      </div>
    </div>
  `}function xt(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return e}}function Ws(){return`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1A2332; font-size: 12px; line-height: 1.5; }
    .pdf-page { padding: 40px 48px; max-width: 210mm; margin: 0 auto; }

    .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E4E9F0; }
    .pdf-company { display: flex; gap: 14px; align-items: flex-start; }
    .pdf-logo { width: 44px; height: 44px; background: linear-gradient(135deg, #1B6DE0, #3B95FF); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 22px; flex-shrink: 0; }
    .pdf-company-name { font-size: 18px; font-weight: 700; color: #1A2332; margin-bottom: 2px; }
    .pdf-company-detail { font-size: 11px; color: #5A6B7F; line-height: 1.6; }

    .pdf-title-block { text-align: right; }
    .pdf-doc-type { font-size: 24px; font-weight: 800; color: #1B6DE0; letter-spacing: 1px; }
    .pdf-doc-number { font-size: 14px; color: #5A6B7F; margin: 2px 0 8px; font-weight: 500; }
    .pdf-status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .pdf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; padding: 20px; background: #F8FAFC; border-radius: 8px; }
    .pdf-info-col { display: flex; flex-direction: column; gap: 6px; }
    .pdf-info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #8A97A8; }
    .pdf-info-value { font-size: 12px; color: #1A2332; }
    .pdf-info-value-lg { font-size: 16px; font-weight: 700; color: #1A2332; }
    .pdf-info-row { display: flex; justify-content: space-between; align-items: center; }

    .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .pdf-table th { padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: white; background: #1E2A3A; text-align: left; }
    .pdf-table th:first-child { border-radius: 6px 0 0 0; }
    .pdf-table th:last-child { border-radius: 0 6px 0 0; }
    .pdf-table td { padding: 10px 12px; border-bottom: 1px solid #E4E9F0; font-size: 12px; }
    .pdf-table tbody tr:last-child td { border-bottom: 2px solid #1E2A3A; }
    .pdf-table tbody tr:nth-child(even) { background: #F8FAFC; }
    .pdf-type-tag { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #E8F1FC; color: #1B6DE0; }

    .pdf-totals { margin-left: auto; width: 280px; margin-bottom: 32px; }
    .pdf-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #5A6B7F; }
    .pdf-grand-total { border-top: 2px solid #1E2A3A; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 800; color: #1A2332; }

    .pdf-notes { margin-bottom: 32px; padding: 16px; background: #FFFBEB; border-radius: 6px; border: 1px solid #FDE68A; }
    .pdf-notes-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #92400E; margin-bottom: 4px; }
    .pdf-notes-text { font-size: 12px; color: #78350F; line-height: 1.6; }

    .pdf-footer { margin-top: 40px; }
    .pdf-footer-line { height: 2px; background: linear-gradient(90deg, #1B6DE0, #3B95FF, #1B6DE0); margin-bottom: 16px; border-radius: 1px; }
    .pdf-footer-text { font-size: 11px; color: #5A6B7F; line-height: 1.6; margin-bottom: 8px; }
    .pdf-footer-company { font-size: 10px; color: #8A97A8; font-weight: 500; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .pdf-page { padding: 20px 24px; }
    }
  `}function Yt(e,{id:s,customerId:t}){const a=s==="new";let o=a?{status:"Draft",version:1,sections:[{id:m.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:t||""}:m.getById("quotes",s);if(!o){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Quote not found</h3></div>';return}o.lineItems&&!o.sections&&(o.sections=[{id:m.generateId(),name:"Main Phase",lineItems:[...o.lineItems]}],delete o.lineItems),a||Ve(o.number+(o.version>1?` v${o.version}`:""));const d=m.getAll("customers"),i=m.getAll("stock"),l=m.getSettings(),r={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function c(){e.innerHTML=`
      ${Ze({title:`${a?"New Quote":o.number} ${o.version>1?`<span class="badge badge-neutral">v${o.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          <span class="badge ${r[o.status]||"badge-neutral"}">${o.status}</span>
        `,actionsHtml:`
          ${a?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!a&&o.status!=="Archived"?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!a&&o.status==="Accepted"?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!a&&o.status==="Draft"?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                <a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>
                <a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>
                ${a?"":'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>'}
             </div>
          </div>
        `})}

      <!-- Quote Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Quote Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="quote-customer" ${o.status==="Archived"?"disabled":""}>
                <option value="">Select customer...</option>
                ${d.map(g=>`<option value="${g.id}" ${o.customerId===g.id?"selected":""}>${g.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input class="form-input" id="quote-title" value="${o.title||""}" placeholder="Quote description..." ${o.status==="Archived"?"disabled":""} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="quote-status" ${o.status==="Archived"?"disabled":""}>
                ${["Draft","Finalised","Sent","Accepted","Declined","Archived"].map(g=>`<option ${o.status===g?"selected":""}>${g}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${o.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${l.laborRates.map(g=>`<option value="${g.id}" ${o.laborProfileId===g.id?"selected":""}>${g.name} ($${g.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input class="form-input" type="date" id="quote-valid" value="${o.validUntil?o.validUntil.split("T")[0]:""}" ${o.status==="Archived"?"disabled":""} />
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${i.map(g=>`<option value="${g.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(o.sections||[]).map((g,v)=>b(g,v)).join("")}
      </div>
      
      ${o.status!=="Archived"?`
      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>`:""}

      <!-- Totals & Estimation -->
      <div style="display:flex; justify-content:flex-end; gap:var(--space-lg); margin-bottom:var(--space-lg); align-items:flex-start">
        <!-- Internal Estimation (Only for internal use) -->
        ${o.status!=="Archived"?`
        <div class="card" style="width:300px; border:1px dashed var(--border-color); background:var(--bg-color)">
          <div class="card-header" style="padding:10px 16px; border-bottom:1px dashed var(--border-color)">
            <h5 style="margin:0; font-size:13px; color:var(--text-secondary)">Internal Estimation</h5>
          </div>
          <div class="card-body" style="padding:12px 16px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
              <span class="text-secondary">Est. Cost</span>
              <span>$${(o.totalInternalCost||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px; font-weight:600; color:${o.subtotal-(o.totalInternalCost||0)>=0?"var(--color-success)":"var(--color-danger)"}">
              <span>Est. Margin</span>
              <span>$${(o.subtotal-(o.totalInternalCost||0)).toFixed(2)} (${o.subtotal>0?Math.round((o.subtotal-o.totalInternalCost)/o.subtotal*100):0}%)</span>
            </div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-top:8px">
              * Based on stock cost and internal labor rates.
            </div>
          </div>
        </div>
        `:""}

        <!-- Client Totals -->
        <div class="card" style="width:360px">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">Subtotal</span>
              <span id="subtotal">$${(o.subtotal||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">GST (10%)</span>
              <span id="tax">$${(o.tax||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
              <span>Total</span>
              <span id="total">$${(o.total||0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      ${o.status!=="Archived"?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:""}
    `,p()}function b(g,v){const u=o.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${v}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${g.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${u?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(g.subtotal||0).toFixed(2)}</span>
            ${u?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${v}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${v}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
            `}
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width:100px">Type</th>
                <th style="width:80px">Qty</th>
                <th style="width:100px">Rate</th>
                <th style="width:110px">Total</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody>
              ${(g.lineItems||[]).map((y,x)=>f(y,v,x,u)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function f(g,v,u,y){return`
      <tr data-sidx="${v}" data-index="${u}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${g.description||""}" data-field="description" placeholder="Type item name..." ${y?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${y?"disabled":""}>
          <option value="labor" ${g.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${g.type==="material"?"selected":""}>Material</option>
          <option value="other" ${g.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${g.qty||1}" data-field="qty" min="1" ${y?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${g.rate||0}" data-field="rate" step="0.01" ${y?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(g.total||0).toFixed(2)}</td>
        <td>${y?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${v}" data-index="${u}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function n(){o.subtotal=0,o.totalInternalCost=0;let g=0;m.getSettings().laborRates.find(u=>u.id===o.laborProfileId),(o.sections||[]).forEach(u=>{u.subtotal=0,(u.lineItems||[]).forEach(y=>{y.total=(y.qty||0)*(y.rate||0),y.type==="labor"&&(g+=y.total),y.internalCost||(y.type==="labor"?y.internalCost=45:y.internalCost=y.rate*.7),o.totalInternalCost+=(y.qty||0)*(y.internalCost||0),u.subtotal+=y.total}),o.subtotal+=u.subtotal}),o.tax=o.subtotal*.1,o.total=o.subtotal+o.tax,c()}function p(){var v,u,y,x,C,k,S,$,I,O;(v=e.querySelector("#btn-preview-pdf"))==null||v.addEventListener("click",()=>{Gt({type:"quote",data:o})});const g=e.querySelector(".dropdown > .btn");g&&(g.addEventListener("click",q=>{q.stopPropagation();const F=g.nextElementSibling;F.style.display=F.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const q=e.querySelector(".dropdown-menu");q&&(q.style.display="none")})),(u=e.querySelector("#btn-create-revision"))==null||u.addEventListener("click",()=>{m.update("quotes",s,{status:"Archived"});const q=JSON.parse(JSON.stringify(o));delete q.id,q.version=(o.version||1)+1,q.status="Draft",q.createdAt=new Date().toISOString();const F=m.create("quotes",q);L(`Revision v${q.version} created`,"success"),z.navigate(`/quotes/${F.id}`)}),(y=e.querySelector("#btn-save-template"))==null||y.addEventListener("click",q=>{q.preventDefault();const F=document.createElement("div");F.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${o.title||"Custom Quote Template"}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `,fe({title:"Save Quote as Template",content:F,actions:[{label:"Cancel",className:"btn-secondary",onClick:K=>K()},{label:"Save Template",className:"btn-primary",onClick:K=>{const X=F.querySelector("#tmpl-name").value,Z=F.querySelector("#tmpl-desc").value;if(!X){L("Template name is required","error");return}const W={name:X,description:Z,sections:JSON.parse(JSON.stringify(o.sections)),createdAt:new Date().toISOString()};m.create("quoteTemplates",W),L("Saved to Quote Templates","success"),K()}}]})}),(x=e.querySelector("#btn-import-template"))==null||x.addEventListener("click",q=>{q.preventDefault();const F=m.getAll("quoteTemplates"),K=document.createElement("div");K.innerHTML=`
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${F.length?F.map(X=>`
            <div class="import-item" data-id="${X.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${h(X.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${X.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${h(X.description||"No description.")}</div>
            </div>
          `).join(""):'<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `,fe({title:"Import Quote Template",content:K,actions:[{label:"Cancel",className:"btn-secondary",onClick:X=>X()}]}),K.querySelectorAll(".import-item").forEach(X=>{X.addEventListener("click",()=>{var W;const Z=F.find(H=>H.id===X.dataset.id);Z&&confirm(`Replace current quote sections with "${Z.name}"?`)&&(o.sections=JSON.parse(JSON.stringify(Z.sections)),o.sections.forEach(H=>{H.id=m.generateId(),H.lineItems.forEach(N=>N.id=m.generateId())}),n(),(W=document.querySelector(".modal-overlay"))==null||W.remove())})})}),e.querySelectorAll("#quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(q=>{q.addEventListener("change",()=>{const F=q.value;if(q.id==="quote-customer")o.customerId=F;else if(q.id==="quote-title")o.title=F;else if(q.id==="quote-status")o.status=F;else if(q.id==="quote-valid")o.validUntil=F;else if(q.id==="quote-labor-profile"){o.laborProfileId=F;const K=l.laborRates.find(X=>X.id===F);if(K){if(o.sections&&o.sections.forEach(X=>{X.lineItems.forEach(Z=>{Z.type==="labor"&&(Z.rate=K.rate)})}),K.minCallOutFee>0){const X=o.sections[0];X&&(X.lineItems.some(W=>W.description.includes("Call-out Fee"))||X.lineItems.unshift({description:"Call-out Fee",type:"other",qty:1,rate:K.minCallOutFee,total:K.minCallOutFee}))}n()}}})}),(C=e.querySelector("#btn-add-section"))==null||C.addEventListener("click",()=>{const q=l.laborRates.find(F=>F.id===o.laborProfileId)||l.laborRates.find(F=>F.isDefault);o.sections.push({id:m.generateId(),name:"New Phase",lineItems:[{description:"Labour",type:"labor",qty:1,rate:q?q.rate:85,total:q?q.rate:85}]}),n()}),e.querySelectorAll(".section-name-input").forEach((q,F)=>{q.addEventListener("change",()=>{o.sections[F].name=q.value})}),e.querySelectorAll(".btn-add-line").forEach(q=>{q.addEventListener("click",F=>{const K=parseInt(q.dataset.sidx);o.sections[K].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),c()})}),e.querySelectorAll(".btn-remove-section").forEach(q=>{q.addEventListener("click",()=>{const F=parseInt(q.dataset.sidx);confirm("Remove this entire phase?")&&(o.sections.splice(F,1),n())})}),e.querySelectorAll(".item-input").forEach(q=>{q.addEventListener("change",F=>{const K=q.closest("tr"),X=parseInt(K.dataset.sidx),Z=parseInt(K.dataset.index),W=q.dataset.field;let H=q.value;if((W==="qty"||W==="rate")&&(H=parseFloat(H)||0),o.sections[X].lineItems[Z][W]=H,W==="description"){const N=i.find(M=>M.name===H);if(N){const M=(N.category||"").toLowerCase().includes("labor");let Y=0,T=0;if(M)Y=N.unitPrice||85,T=N.costPrice||45;else{const w=N.costPrice||N.unitPrice||0;T=w,Y=ft(w,l)}o.sections[X].lineItems[Z].type=M?"labor":"material",o.sections[X].lineItems[Z].rate=Y,o.sections[X].lineItems[Z].internalCost=T}}n()})}),e.querySelectorAll(".btn-remove-line").forEach(q=>{q.addEventListener("click",()=>{const F=parseInt(q.dataset.sidx),K=parseInt(tr.dataset.index);o.sections[F].lineItems.splice(K,1),n()})}),(k=e.querySelector("#btn-cancel-quote"))==null||k.addEventListener("click",()=>z.navigate("/quotes")),(S=e.querySelector("#btn-save-quote"))==null||S.addEventListener("click",()=>{const q=e.querySelector("#quote-customer").value,F=d.find(K=>K.id===q);if(o.customerId=q,o.customerName=(F==null?void 0:F.company)||"",o.contactName=F?`${F.firstName} ${F.lastName}`:"",o.title=e.querySelector("#quote-title").value,o.status=e.querySelector("#quote-status").value,o.validUntil=e.querySelector("#quote-valid").value,n(),a){const K=m.create("quotes",o);L("Quote created","success"),z.navigate(`/quotes/${K.id}`)}else m.update("quotes",s,o),L("Quote saved","success"),c()}),($=e.querySelector("#btn-convert-job"))==null||$.addEventListener("click",()=>{const q=m.getAll("technicians"),F=q[Math.floor(Math.random()*q.length)];let K=0,X=0;(o.sections||[]).forEach(H=>{(H.lineItems||[]).forEach(N=>{N.type==="labor"&&(K+=N.total),N.type==="material"&&(X+=N.total)})});const Z=o.sections.map(H=>({id:m.generateId(),name:H.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),W=m.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:o.customerId,customerName:o.customerName,contactName:o.contactName,title:o.title,type:"Project",status:"Pending",priority:"Medium",technicianId:F==null?void 0:F.id,technicianName:F==null?void 0:F.name,quoteId:s,tasks:Z,phases:Z,laborCost:K,materialCost:X});L("Quote converted to project","success"),z.navigate(`/jobs/${W.id}`)}),(I=e.querySelector("#btn-send-quote"))==null||I.addEventListener("click",()=>{o.emailStatus="Sent",o.status==="Draft"&&(o.status="Sent"),m.update("quotes",s,{emailStatus:"Sent",status:o.status}),ce(async()=>{const{showToast:q,addSystemNotification:F}=await Promise.resolve().then(()=>Ce);return{showToast:q,addSystemNotification:F}},void 0).then(({showToast:q,addSystemNotification:F})=>{q("Email sent to customer","success"),c(),setTimeout(()=>{const K=m.getById("quotes",s);K&&K.emailStatus==="Sent"&&(K.emailStatus="Opened/Viewed",m.update("quotes",s,{emailStatus:"Opened/Viewed"}),F("Quote Opened",`Quote ${K.number} was opened by ${K.customerName||"the customer"}.`,`/quotes/${s}`),window.location.hash.includes(`/quotes/${s}`)&&(o.emailStatus="Opened/Viewed",c()))},15e3)})}),(O=e.querySelector("#btn-delete-quote"))==null||O.addEventListener("click",()=>{const q=document.createElement("div");q.innerHTML=`<p>Delete quote <strong>${h(o.number)}</strong>?</p>`,fe({title:"Delete Quote",content:q,actions:[{label:"Cancel",className:"btn-secondary",onClick:F=>F()},{label:"Delete",className:"btn-danger",onClick:F=>{m.delete("quotes",s),L("Quote deleted","success"),F(),z.navigate("/quotes")}}]})})}c()}function Tt(e){const s=m.getAll("jobs");e.innerHTML=`
    <div class="page-header">
      <h1>Jobs</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-job"><span class="material-icons-outlined">add</span> New Job</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        <button class="toolbar-filter" data-filter="Pending">Pending</button>
        <button class="toolbar-filter" data-filter="Scheduled">Scheduled</button>
        <button class="toolbar-filter" data-filter="In Progress">In Progress</button>
        <button class="toolbar-filter" data-filter="Completed">Completed</button>
        <button class="toolbar-filter" data-filter="unscheduled">Unscheduled</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search jobs..." id="jobs-search" />
      </div>
    </div>
    <div id="jobs-table-container"></div>
  `;let t=[...s];const a={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},o={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},i=ze({columns:[{key:"number",label:"Job #",render:l=>`<span class="cell-link font-medium">${h(l.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:l=>`<span class="truncate" style="max-width:200px;display:inline-block">${h(l.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:l=>{if(l.contractorId){const r=m.getById("contractors",l.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${r?h(r.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${l.technicians&&l.technicians.length>0?l.technicians.map(r=>h(r.name)).join(", "):h(l.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:l=>`<span class="badge ${a[l.status]||"badge-neutral"}">${h(l.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:l=>`<span class="badge ${o[l.priority]||"badge-neutral"}">${h(l.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:l=>l.scheduledDate?new Date(l.scheduledDate).toLocaleDateString():"—",getValue:l=>l.scheduledDate?new Date(l.scheduledDate).getTime():0,width:"100px"}],data:t,onRowClick:l=>z.navigate(`/jobs/${l}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:l=>{Re({container:e,selectedIds:l,onClear:()=>i.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:r=>{const c=document.createElement("div");c.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:b}=await Promise.resolve().then(()=>qe);return{showModal:b}},void 0).then(({showModal:b})=>{b({title:`Update ${r.length} Jobs`,content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Apply",className:"btn-primary",onClick:f=>{const n=c.querySelector("#bulk-status").value;r.forEach(p=>m.update("jobs",p,{status:n})),i.clearSelection(),Tt(e),ce(async()=>{const{showToast:p}=await Promise.resolve().then(()=>Ce);return{showToast:p}},void 0).then(({showToast:p})=>p(`Updated ${r.length} jobs to ${n}`,"success")),f()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{ce(async()=>{const{showModal:c}=await Promise.resolve().then(()=>qe);return{showModal:c}},void 0).then(({showModal:c})=>{const b=document.createElement("div");b.innerHTML=`<p>Are you sure you want to delete ${r.length} jobs? This cannot be undone.</p>`,c({title:"Confirm Bulk Delete",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Delete",className:"btn-danger",onClick:f=>{r.forEach(n=>m.delete("jobs",n)),i.clearSelection(),Tt(e),ce(async()=>{const{showToast:n}=await Promise.resolve().then(()=>Ce);return{showToast:n}},void 0).then(({showToast:n})=>n(`Deleted ${r.length} jobs`,"success")),f()}}]})})}}]})}});e.querySelector("#jobs-table-container").appendChild(i),e.querySelector("#btn-new-job").addEventListener("click",()=>z.navigate("/jobs/new")),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(c=>c.classList.remove("active")),l.classList.add("active");const r=l.dataset.filter;r==="all"?t=[...s]:r==="unscheduled"?t=s.filter(c=>!c.scheduledDate):t=s.filter(c=>c.status===r),i.updateData(t)})}),e.querySelector("#jobs-search").addEventListener("input",l=>{const r=l.target.value.toLowerCase();t=s.filter(c=>c.number.toLowerCase().includes(r)||c.title.toLowerCase().includes(r)||c.customerName.toLowerCase().includes(r)||(c.technicianName||"").toLowerCase().includes(r)),i.updateData(t)})}function Gs(e,{id:s}){const t=m.getById("jobs",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}Ve(t.number);const a={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},o={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let d="overview",i=[0],l=[],r=!1,c=null,b=[];function f(){return c||(c=m.getAll("stock").map(v=>`<option value="${v.id}">${h(v.name)} (Qty: ${v.quantity}) - $${v.costPrice||v.unitPrice}</option>`).join("")),c}function n(){(t.laborCost||0)+(t.materialCost||0),e.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${h(t.number)} — ${h(t.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${h(t.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${h(t.technicianName||"Unassigned")}</span>
              <span class="badge ${a[t.status]||"badge-neutral"}">${h(t.status)}</span>
              <span class="badge ${o[t.priority]||"badge-neutral"}">${h(t.priority)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <!-- Moved invoice creation to Invoices tab -->
          <button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>
          <button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>
        </div>
      </div>
      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${d==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${d==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        <button class="tab ${d==="costs"?"active":""}" data-tab="costs">Costs</button>
        <button class="tab ${d==="quotes"?"active":""}" data-tab="quotes">Quotes</button>
        <button class="tab ${d==="forms"?"active":""}" data-tab="forms">Forms</button>
        <button class="tab ${d==="pos"?"active":""}" data-tab="pos">POs</button>
        <button class="tab ${d==="activity"?"active":""}" data-tab="activity">Activity</button>
        <button class="tab ${d==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>
        <button class="tab ${d==="invoices"?"active":""}" data-tab="invoices">Invoices</button>
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,p(),g()}function p(){var $,I,O,q,F,K,X,Z,W,H,N,M,Y,T,w,R,G,ae,de,he,$e,ke;const v=e.querySelector("#tab-content");if((t.laborCost||0)+(t.materialCost||0),d==="forms"){gt(v);return}if(d==="overview"){let J=0;if(t.tasks&&t.tasks.length>0){let _=0,D=0;t.tasks.forEach(V=>{const ee=(parseFloat(V.estimatedHours)||1)*(parseInt(V.people)||1);_+=ee,D+=ee*((V.progress||0)/100)}),J=_>0?Math.round(D/_*100):0}const E=t.technicians&&t.technicians.length>0?t.technicians.map(_=>`${h(_.name)} (${_.hours}h)`).join(", "):h(t.technicianName||"Unassigned");v.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${Pe("Job Number",h(t.number))}
                ${Pe("Title",h(t.title))}
                ${Pe("Type",h(t.type))}
                ${Pe("Status",h(t.status))}
                ${Pe("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${J}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${J}%</span></div>`)}
                ${Pe("Priority",h(t.priority))}
                ${Pe("Customer",h(t.customerName))}
                ${Pe("Contact",h(t.contactName||"—"))}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
              <h4 style="margin:0">Schedule & Assignment</h4>
              <button class="btn btn-ghost btn-sm" id="btn-add-schedule" style="font-size:12px;padding:4px 8px">
                <span class="material-icons-outlined" style="font-size:14px;margin-right:4px">calendar_month</span> Add to Schedule
              </button>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${Pe("Technicians",E)}
                ${Pe("Scheduled",t.scheduledDate?new Date(t.scheduledDate).toLocaleDateString():"—")}
                ${Pe("Est. Hours",t.estimatedHours||"—")}
                ${Pe("Site Address",h(t.siteAddress||"—"))}
                ${Pe("Quote Ref",t.quoteId?`<a href="#/quotes/${h(t.quoteId)}">${h(t.quoteId)}</a>`:"—")}
                ${Pe("Created",new Date(t.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `,($=v.querySelector("#btn-add-schedule"))==null||$.addEventListener("click",()=>{const _=m.getAll("technicians"),D=m.getAll("timesheets").filter(le=>le.jobId===s),V=document.createElement("div");function ee(le,U=[],ne=[]){let se=[];return le&&le.forEach((be,ie)=>{const ue=[...U,ie].join("-"),Te=[...ne,be.name].join(" > ");se.push({path:ue,name:Te,isLeaf:!be.subTasks||be.subTasks.length===0}),be.subTasks&&(se=se.concat(ee(be.subTasks,[...U,ie],[...ne,be.name])))}),se}const te=ee(t.tasks||[]);function j(le){let U="";return le.forEach((ne,se)=>{U+='<div class="sched-entry" data-index="'+se+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',U+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',U+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(se+1)+"</span>",le.length>1&&(U+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+se+'" style="padding:2px 8px">✕ Remove</button>'),U+="</div>",U+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',U+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',U+='<select class="form-select sched-task" style="width:100%">',U+='<option value="">-- Select a Task --</option>',te.forEach(ie=>{U+=`<option value="${ie.path}" ${ne.taskPath===ie.path?"selected":""}>${h(ie.name)}</option>`}),U+="</select></div>",U+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',U+='<input type="datetime-local" class="form-input sched-start" value="'+ne.start+'"></div>',U+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',U+='<input type="datetime-local" class="form-input sched-finish" value="'+ne.finish+'"></div>',U+="</div>",U+='<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>',U+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',_.forEach(ie=>{const ue=ne.techIds.includes(ie.id),Te=ue?"var(--color-primary)":"var(--border-color)",we=ue?"var(--color-primary-light)":"transparent",Le=ue?"var(--color-primary)":"var(--text-secondary)";U+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Te+";border-radius:999px;cursor:pointer;font-size:13px;background:"+we+";color:"+Le+';transition:all 0.15s">',U+='<input type="checkbox" class="tech-check" data-tech-id="'+ie.id+'" '+(ue?"checked":"")+' style="display:none">',U+='<span class="material-icons-outlined" style="font-size:14px">person</span>',U+=h(ie.name),U+="</label>"}),U+="</div></div>";const be=m.getAll("assets").filter(ie=>ie.category==="Business");U+='<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>',U+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">',be.forEach(ie=>{const ue=ne.assetIds&&ne.assetIds.includes(ie.id),Te=ue?"var(--color-primary)":"var(--border-color)",we=ue?"var(--color-primary-light)":"transparent",Le=ue?"var(--color-primary)":"var(--text-secondary)";U+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Te+";border-radius:999px;cursor:pointer;font-size:13px;background:"+we+";color:"+Le+';transition:all 0.15s">',U+='<input type="checkbox" class="asset-check" data-asset-id="'+ie.id+'" '+(ue?"checked":"")+' style="display:none">',U+='<span class="material-icons-outlined" style="font-size:14px">handyman</span>',U+=h(ie.name),U+="</label>"}),be.length===0&&(U+='<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>'),U+="</div></div></div>"}),U}function A(le){if(!document.getElementById("sched-modal-styles")){const ne=document.createElement("style");ne.id="sched-modal-styles",ne.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(ne)}let U="";D.length>0&&(U+='<div style="margin-bottom:16px">',U+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',D.forEach(ne=>{const se=new Date(ne.startTime||ne.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});U+='<div class="sched-summary-row" style="flex-wrap:wrap">',U+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',U+='<span style="font-weight:500">'+h(ne.technicianName)+"</span>",U+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+h(ne.taskName||"General Task")+"</span>",U+='<span style="color:var(--text-tertiary);margin-left:auto">'+se+"</span>",U+='<span style="font-weight:600;margin-left:12px">'+ne.hours+"h</span>",U+="</div>"}),U+="</div>",U+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),U+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',U+='<div id="sched-entries">'+j(le)+"</div>",U+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',U+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',V.innerHTML=U,V.querySelectorAll(".tech-check").forEach(ne=>{const se=ne.closest("label");ne.addEventListener("change",()=>{ne.checked?(se.style.borderColor="var(--color-primary)",se.style.background="var(--color-primary-light)",se.style.color="var(--color-primary)"):(se.style.borderColor="var(--border-color)",se.style.background="transparent",se.style.color="var(--text-secondary)")})}),V.querySelectorAll(".asset-check").forEach(ne=>{const se=ne.closest("label");ne.addEventListener("change",()=>{ne.checked?(se.style.borderColor="var(--color-primary)",se.style.background="var(--color-primary-light)",se.style.color="var(--color-primary)"):(se.style.borderColor="var(--border-color)",se.style.background="transparent",se.style.color="var(--text-secondary)")})}),V.querySelectorAll(".btn-remove-entry").forEach(ne=>{ne.addEventListener("click",()=>{le.splice(parseInt(ne.dataset.index),1),A(le)})}),V.querySelector("#btn-add-entry").addEventListener("click",()=>{const ne=ie=>ie.toString().padStart(2,"0"),se=new Date;se.setDate(se.getDate()+1);const be=`${se.getFullYear()}-${ne(se.getMonth()+1)}-${ne(se.getDate())}`;le.push({taskPath:"",start:`${be}T08:00`,finish:`${be}T16:00`,techIds:[],assetIds:[]}),A(le)})}const P=le=>le.toString().padStart(2,"0"),B=new Date,re=`${B.getFullYear()}-${P(B.getMonth()+1)}-${P(B.getDate())}`,oe=t.technicianId?[t.technicianId]:[],pe=[{taskPath:"",start:`${re}T08:00`,finish:`${re}T16:00`,techIds:oe,assetIds:[]}];A(pe);function ye(){const le=[];return V.querySelectorAll(".sched-entry").forEach((U,ne)=>{var we,Le,Ne;const se=(we=U.querySelector(".sched-task"))==null?void 0:we.value,be=(Le=U.querySelector(".sched-start"))==null?void 0:Le.value,ie=(Ne=U.querySelector(".sched-finish"))==null?void 0:Ne.value,ue=[...U.querySelectorAll(".tech-check:checked")].map(Q=>Q.dataset.techId),Te=[...U.querySelectorAll(".asset-check:checked")].map(Q=>Q.dataset.assetId);le.push({taskPath:se,start:be,finish:ie,techIds:ue,assetIds:Te})}),le}fe({title:`Schedule Job: ${h(t.title||t.number)}`,content:V,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:le=>le()},{label:"Save Schedule",className:"btn-primary",onClick:le=>{const U=ye();let ne=0,se=[];if(U.forEach((be,ie)=>{var Ne;if(!be.taskPath){se.push(`Entry ${ie+1}: please select a task`);return}if(!be.start||!be.finish){se.push(`Entry ${ie+1}: missing start or finish`);return}const ue=new Date(be.start),Te=new Date(be.finish);if(Te<=ue){se.push(`Entry ${ie+1}: finish must be after start`);return}if(be.techIds.length===0){se.push(`Entry ${ie+1}: select at least one technician`);return}const we=Math.round((Te-ue)/36e5*100)/100,Le=((Ne=te.find(Q=>Q.path===be.taskPath))==null?void 0:Ne.name)||"Unknown Task";be.techIds.forEach(Q=>{const ve=_.find(xe=>xe.id===Q);ve&&(m.create("timesheets",{jobId:s,jobNumber:t.number,taskPath:be.taskPath,taskName:Le,technicianId:Q,technicianName:ve.name,date:be.start.split("T")[0],startTime:be.start,finishTime:be.finish,hours:we,status:"Pending"}),ne++)}),be.assetIds&&be.assetIds.length>0&&be.assetIds.forEach(Q=>{const ve=m.getById("assets",Q);ve&&m.create("assetUsage",{jobId:s,assetId:Q,assetName:ve.name,taskPath:be.taskPath,taskName:Le,startTime:be.start,finishTime:be.finish,hours:we,recoveryRate:ve.recoveryRate||0})})}),se.length){L(se[0],"error");return}if(U.length>0&&U[0].start){const ie=[...new Set(U.flatMap(ue=>ue.techIds))].map(ue=>{const Te=_.find(Le=>Le.id===ue),we=U.filter(Le=>Le.techIds.includes(ue)).reduce((Le,Ne)=>{const Q=(new Date(Ne.finish)-new Date(Ne.start))/36e5;return Le+(isNaN(Q)?0:Q)},0);return{id:ue,name:(Te==null?void 0:Te.name)||"",hours:Math.round(we*100)/100}});m.update("jobs",s,{scheduledDate:U[0].start.split("T")[0],technicians:ie,technicianName:ie.map(ue=>ue.name).join(", ")})}L(`${ne} schedule ${ne===1?"entry":"entries"} saved`,"success"),le(),p()}}]})})}else if(d==="tasks"){let _=function(j,A){let P=j[A[0]];if(!P)return null;for(let B=1;B<A.length;B++)if(!P.subTasks||(P=P.subTasks[A[B]],!P))return null;return P},D=function(j){return!j.subTasks||j.subTasks.length===0?(parseFloat(j.estimatedHours)||0)*(parseInt(j.people)||1):j.subTasks.reduce((A,P)=>A+D(P),0)},V=function(j,A){if(A.length<=1)return;const P=A.slice(0,-1),B=_(j,P);if(B&&B.subTasks&&B.subTasks.length>0){let re=0,oe=0;B.subTasks.forEach(pe=>{const ye=(parseFloat(pe.estimatedHours)||1)*(parseInt(pe.people)||1);re+=ye,oe+=ye*((pe.progress||0)/100)}),B.progress=re>0?Math.round(oe/re*100):0,B.progress===100?B.status="Completed":B.progress>0?B.status="In Progress":B.status="Not Started",V(j,P)}};var u=_,y=D,x=V;const J=JSON.parse(sessionStorage.getItem("currentUser")||"{}");let E=!0;if(J.userTypeId){const j=m.getById("userTypes",J.userTypeId);if(j&&j.permissions){const A=j.permissions.find(P=>P.module==="Jobs");A&&(E=A.edit)}}else(J.role==="customer"||J.role==="technician")&&(E=!1);t.tasks||(t.tasks=[{id:m.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}]),t.tasks.forEach(j=>{j.subTasks||(j.subTasks=[])});let ee=!0,te=t.tasks;for(let j=0;j<i.length;j++){if(!te||!te[i[j]]){ee=!1;break}te=te[i[j]].subTasks}ee||(i=[]),v.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${E?'<button class="btn btn-sm btn-secondary" id="btn-import-tasklist"><span class="material-icons-outlined" style="font-size:14px">download</span> Import</button>':""}
              ${E?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${E?'<button class="btn btn-sm btn-primary" id="btn-save-tasks"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const j=l.length>0?_(t.tasks,l):null,A=j?j.subTasks||[]:t.tasks,P=j?h(j.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${l.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${P}">${P}</span>
                    </div>
                    ${E?l.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${l.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${A.map((B,re)=>{const oe=[...l,re],pe=oe.join("-")===i.join("-");return`
                        <div class="task-list-item" data-path="${oe.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${pe?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${pe?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${h(B.name)}">${h(B.name)}</span>
                          ${B.subTasks&&B.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${oe.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${oe.join("-")}" ${B.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${A.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${i.length>0?(()=>{const j=i,A=_(t.tasks,j);if(!A)return"";const P=A.subTasks&&A.subTasks.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${r?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${h(A.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${E?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${j.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${E?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${j.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${h(A.name)}" ${E?"":"disabled"} />
                  </div>
                  ${P?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${D(A)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${A.startDate?A.startDate.split("T")[0]:""}" ${E?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${A.estimatedHours||""}" min="0" step="0.5" ${E?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${A.people||"1"}" min="1" step="1" ${E?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${A.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${A.progress>50?"#fff":"#000"}">${A.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${E?"":"disabled"}>${h(A.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${h(A.name)}">Info Panel: ${h(A.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${E&&j.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${j.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      <button class="btn btn-sm btn-secondary btn-book-time" data-path="${j.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>
                      ${E?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                      ${E?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${j.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${h(A.name)}</div>
                  </div>
                  ${P?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${D(A)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${A.startDate?A.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${A.estimatedHours?A.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${A.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${A.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${A.progress>50?"#fff":"#000"}">${A.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${h(A.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(I=v.querySelector(".btn-view-back"))==null||I.addEventListener("click",()=>{l.pop(),p()}),v.querySelectorAll(".btn-drill-down").forEach(j=>{j.addEventListener("click",A=>{A.stopPropagation(),l=j.dataset.path.split("-").map(Number),i=[...l],p()})}),v.querySelectorAll(".task-list-checkbox").forEach(j=>{j.addEventListener("change",A=>{const P=A.target.dataset.path.split("-").map(Number),B=_(t.tasks,P);B.progress=A.target.checked?100:0,B.status=A.target.checked?"Completed":"Not Started",V(t.tasks,P),p()}),j.addEventListener("click",A=>A.stopPropagation())}),v.querySelectorAll(".task-list-item").forEach(j=>{j.addEventListener("click",A=>{if(A.target.closest(".btn-drill-down"))return;i=A.currentTarget.dataset.path.split("-").map(Number),r=!1,p()})}),(O=v.querySelector(".btn-edit-info"))==null||O.addEventListener("click",()=>{r=!0,p()}),(q=v.querySelector(".btn-done-info"))==null||q.addEventListener("click",()=>{r=!1,p()}),(F=v.querySelector("#btn-add-main-task"))==null||F.addEventListener("click",()=>{t.tasks||(t.tasks=[]),t.tasks.push({id:m.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),i=[t.tasks.length-1],p()}),v.querySelectorAll(".btn-add-child-task").forEach(j=>{j.addEventListener("click",A=>{const P=A.currentTarget.dataset.path.split("-").map(Number),B=_(t.tasks,P);B.subTasks||(B.subTasks=[]),B.subTasks.push({id:m.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),i=[...P,B.subTasks.length-1],p()})}),v.querySelectorAll(".detail-input").forEach(j=>{j.addEventListener("change",A=>{const P=_(t.tasks,i),B=A.target.dataset.field;B==="progress-check"?(P.progress=A.target.checked?100:0,P.status=A.target.checked?"Completed":"Not Started"):B==="progress"?(P.progress=parseInt(A.target.value),P.progress===100?P.status="Completed":P.progress===0?P.status="Not Started":P.status="In Progress"):B==="estimatedHours"?P.estimatedHours=parseFloat(A.target.value)||0:P[B]=A.target.value,V(t.tasks,i),p()})}),v.querySelectorAll(".btn-remove-task").forEach(j=>{j.addEventListener("click",A=>{const P=j.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(P.length===1)t.tasks.splice(P[0],1);else{const B=P.slice(0,-1),re=_(t.tasks,B);re&&re.subTasks&&re.subTasks.splice(P[P.length-1],1),V(t.tasks,B)}i=P.slice(0,-1),r=!1,p()}})}),(K=v.querySelector("#btn-save-tasks"))==null||K.addEventListener("click",()=>{m.update("jobs",s,{tasks:t.tasks}),L("Tasks saved","success")}),(X=v.querySelector("#btn-save-tasklist-template"))==null||X.addEventListener("click",()=>{const j=document.createElement("div");j.innerHTML=`
           <div class="form-group">
             <label class="form-label">Template Name</label>
             <input type="text" class="form-input" id="tmpl-name" placeholder="e.g. Standard 50pt Maintenance" required />
           </div>
           <div class="form-group">
             <label class="form-label">Description</label>
             <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
           </div>
           <div class="form-group">
             <label class="form-label">Tags (comma separated)</label>
             <input type="text" class="form-input" id="tmpl-tags" placeholder="Electrical, Maintenance, Commercial" />
           </div>
         `,fe({title:"Save Tasklist as Template",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:A=>A()},{label:"Save Template",className:"btn-primary",onClick:A=>{const P=j.querySelector("#tmpl-name").value,B=j.querySelector("#tmpl-desc").value,re=j.querySelector("#tmpl-tags").value.split(",").map(pe=>pe.trim()).filter(Boolean);if(!P){L("Template name is required","error");return}function oe(pe){return pe.map(ye=>({...ye,id:m.generateId(),status:"Not Started",progress:0,subTasks:ye.subTasks||ye.subPhases?oe(ye.subTasks||ye.subPhases):[]}))}m.create("taskTemplates",{name:P,description:B,tags:re,tasks:oe(t.tasks||t.phases||[]),createdAt:new Date().toISOString()}),L("Tasklist saved as template","success"),A()}}]})}),(Z=v.querySelector("#btn-import-tasklist"))==null||Z.addEventListener("click",()=>{const j=m.getAll("taskTemplates"),A=m.getAll("jobs").filter(oe=>oe.id!==s&&(oe.tasks&&oe.tasks.length>0||oe.phases&&oe.phases.length>0));let P="templates";const B=document.createElement("div");B.innerHTML=`
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;function re(oe=""){const pe=B.querySelector("#import-content"),ye=oe.toLowerCase();if(P==="templates"){const le=j.filter(U=>U.name.toLowerCase().includes(ye)||(U.description||"").toLowerCase().includes(ye)||(U.tags||[]).some(ne=>ne.toLowerCase().includes(ye)));pe.innerHTML=le.length?le.map(U=>{const ne=U.tasks||U.phases||[];return`
               <div class="import-item" data-id="${U.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${h(U.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${ne.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${h(U.description||"No description.")}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(U.tags||[]).map(se=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${h(se)}</span>`).join("")}
                 </div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${oe}"</div>`}else{const le=A.filter(U=>U.number.toLowerCase().includes(ye)||U.title.toLowerCase().includes(ye)||U.customerName.toLowerCase().includes(ye));pe.innerHTML=le.length?le.map(U=>{const ne=U.tasks||U.phases||[];return`
               <div class="import-item" data-id="${U.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${h(U.number)} - ${h(U.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${h(U.customerName)} · ${ne.length} tasks</div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${oe}"</div>`}}re(),B.querySelectorAll(".tab").forEach(oe=>{oe.addEventListener("click",()=>{B.querySelectorAll(".tab").forEach(pe=>pe.classList.remove("active")),oe.classList.add("active"),P=oe.dataset.tab,B.querySelector("#import-search").placeholder=P==="templates"?"Search templates...":"Search jobs...",re(B.querySelector("#import-search").value)})}),B.querySelector("#import-search").addEventListener("input",oe=>{re(oe.target.value)}),B.addEventListener("click",oe=>{var ie;const pe=oe.target.closest(".import-item");if(!pe)return;const ye=pe.dataset.id,le=pe.dataset.type,U=m.getAll("taskTemplates"),ne=m.getAll("jobs"),se=le==="template"?U.find(ue=>ue.id===ye):ne.find(ue=>ue.id===ye);if(se&&(se.tasks||se.phases)){if(confirm(`Replace current tasklist with "${se.name||se.number}"?`)){let ue=function(Te){return Te.map(we=>({...we,id:m.generateId(),status:"Not Started",progress:0,subTasks:we.subTasks||we.subPhases?ue(we.subTasks||we.subPhases):[]}))};var be=ue;t.tasks=ue(se.tasks||se.phases),i=[0],l=[],L(`Imported ${se.name||se.number}`,"success"),p(),(ie=document.querySelector(".modal-overlay"))==null||ie.remove()}}else L("Could not find source data","error")}),fe({title:"Import Tasklist",content:B,actions:[{label:"Cancel",className:"btn-secondary",onClick:oe=>oe()}]})}),v.querySelectorAll(".btn-duplicate-task").forEach(j=>{j.addEventListener("click",A=>{const P=A.currentTarget.dataset.path.split("-").map(Number),B=_(t.tasks,P);function re(pe,ye){return{...pe,id:m.generateId(),name:pe.name+(ye?" (Copy)":""),progress:0,status:"Not Started",subTasks:pe.subTasks?pe.subTasks.map(le=>re(le,!1)):[]}}const oe=re(B,!0);if(P.length===1)t.tasks.splice(P[0]+1,0,oe);else{const pe=P.slice(0,-1);_(t.tasks,pe).subTasks.splice(P[P.length-1]+1,0,oe),V(t.tasks,pe)}p()})}),v.querySelectorAll(".btn-book-time").forEach(j=>{j.addEventListener("click",A=>{const P=A.currentTarget.dataset.path.split("-").map(Number),B=_(t.tasks,P),re=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),oe=m.getAll("timesheets").filter(ie=>ie.jobId===s),pe=m.getAll("technicians"),ye=new Date,le=ie=>ie.toString().padStart(2,"0"),U=`${ye.getFullYear()}-${le(ye.getMonth()+1)}-${le(ye.getDate())}`,ne=`${U}T09:00`,se=`${U}T10:00`,be=document.createElement("div");be.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${oe.reduce((ie,ue)=>ie+(ue.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${oe.length?oe.map(ie=>`
                      <tr>
                        <td>${ie.startTime?new Date(ie.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(ie.date).toLocaleDateString()}</td>
                        <td>${h(ie.technicianName)}</td>
                        <td>${h(ie.taskName||ie.phaseName||"—")}</td>
                        <td style="font-weight:600">${ie.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${ne}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${se}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${pe.map(ie=>`<option value="${ie.id}" ${ie.name===re.name?"selected":""}>${ie.name}</option>`).join("")}
              </select>
            </div>
            `,fe({title:"Book Time: "+h(B.name),size:"modal-70",content:be,actions:[{label:"Cancel",className:"btn-secondary",onClick:ie=>ie()},{label:"Log Time",className:"btn-primary",onClick:ie=>{const ue=document.getElementById("bt-start").value,Te=document.getElementById("bt-finish").value,we=document.getElementById("bt-tech").value,Le=B.name;if(!ue||!Te||!we){L("Please fill all required fields","error");return}const Ne=new Date(ue),Q=new Date(Te);if(Q<=Ne){L("Finish time must be after start time","error");return}const ve=Math.round((Q-Ne)/36e5*100)/100,xe=pe.find(Se=>Se.id===we);m.create("timesheets",{jobId:s,jobNumber:t.number,taskId:B.id,taskName:B.name,phaseId:B.id,phaseName:B.name,technicianId:we,technicianName:xe.name,date:ue.split("T")[0],startTime:ue,finishTime:Te,description:Le,hours:ve,status:"Pending"}),L("Time booked successfully","success"),p(),ie()}}]})})})}else if(d==="costs"){let Ne=function(){const Q=(t.materials||[]).reduce((Se,Ie)=>Se+Ie.quantity*(Ie.unitCost||0),0),ve=parseFloat(v.querySelector("#inp-material-cost").value)||0,xe=Q+ve;v.querySelector("#sum-mat").textContent="$"+xe.toFixed(2),v.querySelector("#sum-total").textContent="$"+(V+xe).toFixed(2)};var C=Ne;if(!t.materials){const ve=m.getAll("quotes").filter(xe=>xe.jobId===s||t.quoteId===xe.id).find(xe=>xe.status==="Accepted")||m.getById("quotes",t.quoteId);ve&&ve.sections&&(t.materials=[],ve.sections.forEach(xe=>{(xe.lineItems||[]).forEach(Se=>{if(Se.type==="material"){const Ie=m.getAll("stock").find(Qe=>Qe.name===Se.description);t.materials.push({stockId:Ie?Ie.id:null,name:Se.description||"Unknown Material",quantity:Se.qty||1,unitCost:Ie&&(Ie.costPrice||Ie.unitPrice)||0,fromQuote:!0})}})}),m.update("jobs",s,{materials:t.materials}))}t.materials||(t.materials=[]);const J=m.getAll("timesheets").filter(Q=>Q.jobId===s),E=m.getAll("technicians"),_={};let D=0,V=0;J.forEach(Q=>{if(!_[Q.technicianId]){const ve=E.find(xe=>xe.id===Q.technicianId);_[Q.technicianId]={id:Q.technicianId,name:Q.technicianName||(ve?ve.name:"Unknown Tech"),hours:0,rate:ve&&(ve.payRate||ve.hourlyRate)||45}}_[Q.technicianId].hours+=Q.hours||0});const ee=Object.values(_);ee.forEach(Q=>{D+=Q.hours,V+=Q.hours*Q.rate});const te=m.getAll("assetUsage").filter(Q=>Q.jobId===s),j=m.getAll("assets");let A=0;const P=te.map(Q=>{const ve=j.find(Ie=>Ie.id===Q.assetId),xe=Q.recoveryRate||(ve?ve.recoveryRate:0)||0,Se=Q.hours*xe;return A+=Se,{...Q,rate:xe,cost:Se}}),B=t.materials.reduce((Q,ve)=>Q+ve.quantity*(ve.unitCost||0),0),re=parseFloat(t.additionalMaterialCost||0),oe=B+re,pe=m.getSettings(),ye=Bt(t.materials,pe),le=ft(re,pe),U=ye+(re>0?le-re:0)+re;(t.laborCost!==V||t.estimatedHours!==D||t.materialCost!==oe||t.assetCost!==A)&&(t.laborCost=V,t.estimatedHours=D,t.materialCost=oe,t.assetCost=A,m.update("jobs",s,{laborCost:V,estimatedHours:D,materialCost:oe,assetCost:A}));const ne=pe.laborRates.find(Q=>Q.id===t.laborRateProfileId)||pe.laborRates.find(Q=>Q.isDefault),se=D*(ne?ne.rate:85),be=ne&&ne.minCallOutFee||0,ie=Math.max(se,be),ue=ie+U,Te=V+oe+A,we=ue-Te,Le=ue>0?we/ue*100:0;v.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4 style="margin:0">Technicians & Internal Cost</h4>
              <div style="font-size:12px; color:var(--text-secondary); background:var(--bg-color); padding:4px 8px; border-radius:4px; border:1px solid var(--border-color)">
                Actual Cost (Tech Pay)
              </div>
            </div>
            <div class="card-body">
              <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                Labor costs are based on individual technician pay rates.
              </div>
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th style="width:80px">Hours</th>
                    <th style="width:80px">Pay Rate</th>
                    <th style="width:100px">Actual Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${ee.map(Q=>`
                    <tr>
                      <td>${h(Q.name)}</td>
                      <td style="font-weight:600">${Q.hours.toFixed(2)}</td>
                      <td>$${(Q.payRate||Q.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(Q.hours*(Q.payRate||Q.rate)).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${ee.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>':""}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
              <h4 style="margin:0">Asset Recovery</h4>
              <div style="font-size:12px; color:var(--text-secondary); background:var(--bg-color); padding:4px 8px; border-radius:4px; border:1px solid var(--border-color)">
                Internal Recovery (Tool/Van)
              </div>
            </div>
            <div class="card-body">
              <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                Calculated as (Asset Recovery Rate × Hours Used).
              </div>
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th style="width:80px">Hours</th>
                    <th style="width:80px">Rate</th>
                    <th style="width:100px">Recovery</th>
                  </tr>
                </thead>
                <tbody>
                  ${P.map(Q=>`
                    <tr>
                      <td>${h(Q.assetName)}</td>
                      <td style="font-weight:600">${Q.hours.toFixed(2)}</td>
                      <td>$${Q.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${Q.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${P.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>':""}
                </tbody>
                ${P.length>0?`
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${A.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                `:""}
              </table>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header"><h4>Billing & Labor Profiles</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Labour Rate Profile (Billable)</label>
                <select class="form-select" id="inp-labor-profile">
                  ${pe.laborRates.map(Q=>`<option value="${Q.id}" ${ne.id===Q.id?"selected":""}>${Q.name} ($${Q.rate.toFixed(2)}/hr)</option>`).join("")}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${ne.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(ne.minCallOutFee||0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${ie.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
            <div class="card">
              <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
                <h4 style="margin:0">Material Costs</h4>
                <button class="btn btn-ghost btn-sm" id="btn-refresh-materials" title="Sync materials with the linked quote">
                  <span class="material-icons-outlined" style="font-size:16px; margin-right:4px;">sync</span> Sync Quote
                </button>
              </div>
              <div class="card-body">
                <div id="materials-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                  ${t.materials.map((Q,ve)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${h(Q.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${Q.quantity} x $${(Q.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(Q.quantity*(Q.unitCost||0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${ve}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join("")}
                  ${t.materials.length===0?'<div class="text-secondary" style="font-size:14px">No materials added.</div>':""}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${f()}
                  </select>
                  <input type="number" class="form-input" id="mat-qty" value="1" min="1" style="flex:1" />
                  <button class="btn btn-primary" id="btn-add-material">Add Item</button>
                </div>
                <div class="form-group" style="margin-top:16px;margin-bottom:0">
                  <label class="form-label">Manual Add. Cost ($) (Permits, Travel, etc.)</label>
                  <input type="number" class="form-input" id="inp-material-cost" value="${t.additionalMaterialCost||0}" step="0.01" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Job Cost Summary</h4></div>
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Logged Hours</span><span class="font-medium">${D.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(V+oe).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${ue.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${we>=0?"var(--color-success-bg)":"var(--color-danger-bg)"}; color:${we>=0?"var(--color-success)":"var(--color-danger)"}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${we.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${Le.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      `,(W=v.querySelector("#inp-labor-profile"))==null||W.addEventListener("change",Q=>{t.laborRateProfileId=Q.target.value,m.update("jobs",s,{laborRateProfileId:t.laborRateProfileId}),p()}),v.addEventListener("click",Q=>{const ve=Q.target.closest(".btn-remove-mat");if(ve){const xe=parseInt(ve.dataset.index);t.materials.splice(xe,1),p()}}),(H=v.querySelector("#btn-refresh-materials"))==null||H.addEventListener("click",()=>{const ve=m.getAll("quotes").filter(Ie=>Ie.jobId===s||t.quoteId===Ie.id).find(Ie=>Ie.status==="Accepted")||m.getById("quotes",t.quoteId);if(!ve){L("No linked accepted quote found.","error");return}const xe=(t.materials||[]).filter(Ie=>!Ie.fromQuote),Se=[];ve.sections.forEach(Ie=>{(Ie.lineItems||[]).forEach(Qe=>{if(Qe.type==="material"){const et=m.getAll("stock").find(is=>is.name===Qe.description);Se.push({stockId:et?et.id:null,name:Qe.description||"Unknown Material",quantity:Qe.qty||1,unitCost:et&&(et.costPrice||et.unitPrice)||0,fromQuote:!0})}})}),t.materials=[...Se,...xe],m.update("jobs",s,{materials:t.materials}),L("Materials refreshed from Quote","success"),p()}),(N=v.querySelector("#inp-material-cost"))==null||N.addEventListener("input",Ne),(M=v.querySelector("#btn-add-material"))==null||M.addEventListener("click",()=>{const Q=v.querySelector("#mat-select"),ve=parseInt(v.querySelector("#mat-qty").value)||1,xe=Q.value;if(!xe)return;const Se=m.getById("stock",xe);if(Se){if(Se.quantity<ve){L(`Not enough stock. Available: ${Se.quantity}`,"error");return}m.update("stock",xe,{quantity:Se.quantity-ve}),c=null,t.materials.push({stockId:Se.id,name:Se.name,quantity:ve,unitCost:Se.costPrice||Se.unitPrice||0,fromQuote:!1}),L(`Added ${ve}x ${Se.name}`,"success"),p()}}),(Y=v.querySelector("#btn-save-costs"))==null||Y.addEventListener("click",()=>{const Q=parseFloat(v.querySelector("#inp-material-cost").value)||0,xe=(t.materials||[]).reduce((Se,Ie)=>Se+Ie.quantity*(Ie.unitCost||0),0)+Q;t.materialCost=xe,t.additionalMaterialCost=Q,m.update("jobs",s,{materials:t.materials,materialCost:xe,additionalMaterialCost:Q}),L("Additional costs saved","success"),p()})}else if(d==="quotes"){const J=m.getAll("quotes").filter(E=>E.jobId===s||t.quoteId===E.id);v.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
             <h4>Associated Quotes</h4>
             <button class="btn btn-primary btn-sm" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${J.length?J.map(E=>`
                  <tr>
                    <td><a href="#/quotes/${E.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${h(E.number)}</a></td>
                    <td>${h(E.title||"Untitled Quote")}</td>
                    <td><span class="badge ${E.status==="Accepted"?"badge-success":E.status==="Declined"?"badge-danger":E.status==="Sent"?"badge-info":"badge-neutral"}">${h(E.status)}</span></td>
                    <td style="font-weight:600">$${(E.total||0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${E.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(T=v.querySelector("#btn-new-quote"))==null||T.addEventListener("click",()=>{const E=m.create("quotes",{customerId:t.customerId,customerName:t.customerName,title:t.title,jobId:t.id,status:"Draft",version:1,sections:[{id:m.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});L("Draft quote created","success"),z.navigate("/quotes/"+E.id)})}else if(d==="activity")t.activityLog||(t.activityLog=[]),t.activityLog=t.activityLog.map(J=>J.type==="note"||J.type==="attachment"?{id:J.id,type:"combined",date:J.date,content:J.type==="note"?J.content:"",files:J.type==="attachment"?[J.file]:[]}:J),v.innerHTML=`
        <div class="card" style="max-width:800px;margin-bottom:var(--space-lg)">
          <div class="card-body">
            <div style="display:flex;gap:8px;margin-bottom:var(--space-base)">
              <input type="text" class="form-input" id="new-note-input" placeholder="Type a new note..." style="flex:1" />
              <label class="btn btn-secondary" for="upload-attachment" style="cursor:pointer">
                <span class="material-icons-outlined" style="font-size:16px">attach_file</span> Attach
                <input type="file" id="upload-attachment" style="display:none" multiple accept="image/*,.pdf,.doc,.docx" />
              </label>
              <button class="btn btn-primary" id="btn-add-note">Post</button>
            </div>
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${b.length?"16px":"0"}">
              ${b.map((J,E)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${h(J.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${E}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join("")}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${t.activityLog.length?t.activityLog.map((J,E)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${J.files&&J.files.length?"attachment":"chat_bubble_outline"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(J.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${h(J.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${J.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${h(J.content)}</div>`:""}
                      ${J.files&&J.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${J.files.map(_=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${_.type&&_.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${h(_.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${h(_.name)}">${h(_.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(_.size/1024).toFixed(1)} KB</div>
                               </div>
                             </div>
                          `).join("")}
                        </div>
                      `:""}
                    </div>
                    <div class="expand-overlay" style="display:none; position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(transparent, var(--content-bg));align-items:flex-end;justify-content:center;padding-bottom:4px;cursor:pointer;border-bottom-left-radius:var(--border-radius);border-bottom-right-radius:var(--border-radius)">
                       <span class="text-primary font-medium" style="font-size:12px">Expand to view</span>
                    </div>
                  </div>
                </div>
              `).join(""):'<div class="text-secondary text-center" style="padding:24px">No activity yet.</div>'}
            </div>
          </div>
        </div>
      `,setTimeout(()=>{v.querySelectorAll(".activity-log-item").forEach(J=>{const E=J.querySelector(".activity-content-wrapper"),_=J.querySelector(".expand-overlay");E&&E.scrollHeight>200&&(_.style.display="flex",J.style.paddingBottom="32px",_.addEventListener("click",()=>{J.dataset.expanded==="false"?(E.style.maxHeight=E.scrollHeight+"px",_.style.background="transparent",_.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',J.dataset.expanded="true"):(E.style.maxHeight="200px",_.style.background="linear-gradient(transparent, var(--content-bg))",_.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',J.dataset.expanded="false")}))})},0),v.querySelectorAll(".btn-remove-staged").forEach(J=>{J.addEventListener("click",E=>{const _=parseInt(E.currentTarget.dataset.idx);b.splice(_,1),p()})}),(w=v.querySelector("#btn-add-note"))==null||w.addEventListener("click",()=>{const J=v.querySelector("#new-note-input").value.trim();!J&&!b.length||(t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:J,files:[...b],date:new Date().toISOString()}),m.update("jobs",s,{activityLog:t.activityLog}),b=[],p())}),(R=v.querySelector("#upload-attachment"))==null||R.addEventListener("change",J=>{const E=Array.from(J.target.files);if(!E.length)return;let _=0;E.forEach(D=>{const V=new FileReader;V.onload=ee=>{b.push({name:D.name,size:D.size,type:D.type,data:ee.target.result}),_++,_===E.length&&p()},V.readAsDataURL(D)})}),v.querySelectorAll(".btn-delete-activity").forEach(J=>{J.addEventListener("click",()=>{t.activityLog=t.activityLog.filter(E=>E.id!==J.dataset.id),m.update("jobs",s,{activityLog:t.activityLog}),p()})});else if(d==="timesheets"){const J=m.getAll("timesheets").filter(D=>D.jobId===s),E=J.reduce((D,V)=>D+(V.hours||0),0),_=m.getAll("technicians");v.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${E} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
              <tbody>
                ${J.length?J.map(D=>{const V=currentUser.role==="admin"||D.technicianId===currentUser.id&&D.status!=="Approved";return`
                  <tr>
                    <td>${new Date(D.date).toLocaleDateString()}</td>
                    <td>${h(D.technicianName)}</td>
                    <td class="text-secondary">${h(D.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${D.hours}</td>
                    <td><span class="badge ${D.status==="Approved"?"badge-success":D.status==="Rejected"?"badge-danger":"badge-warning"}">${D.status}</span></td>
                    <td style="text-align:right">
                      ${V?`
                        <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${D.id}">
                          <span class="material-icons-outlined" style="font-size:16px">edit</span>
                        </button>
                      `:""}
                    </td>
                  </tr>
                `}).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,v.querySelectorAll(".btn-edit-ts-job").forEach(D=>{D.addEventListener("click",()=>{const V=D.dataset.id,ee=m.getById("timesheets",V);if(!ee)return;const te=document.createElement("div");te.innerHTML=`
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" id="edit-ts-date" value="${ee.date}" />
            </div>
            <div class="form-group">
              <label class="form-label">Hours</label>
              <input type="number" class="form-input" id="edit-ts-hours" value="${ee.hours}" step="0.25" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-input" id="edit-ts-desc" rows="3">${h(ee.description||"")}</textarea>
            </div>
          `,fe({title:"Edit Timesheet Entry",content:te,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Save Changes",className:"btn-primary",onClick:j=>{const A=document.getElementById("edit-ts-date").value,P=parseFloat(document.getElementById("edit-ts-hours").value),B=document.getElementById("edit-ts-desc").value;if(!A||isNaN(P)){L("Please enter valid date and hours","error");return}m.update("timesheets",V,{date:A,hours:P,description:B}),L("Timesheet updated","success"),j(),p()}}]})})}),(G=v.querySelector("#btn-log-time-tab"))==null||G.addEventListener("click",()=>{const D=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),V=new Date,ee=A=>A.toString().padStart(2,"0"),te=`${V.getFullYear()}-${ee(V.getMonth()+1)}-${ee(V.getDate())}`,j=document.createElement("div");j.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${te}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech">
                <option value="">Select tech...</option>
                ${_.map(A=>`<option value="${A.id}" ${A.name===D.name?"selected":""}>${A.name}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Hours *</label>
              <input type="number" class="form-input" id="lt-hours" value="1" min="0.5" step="0.5" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="lt-desc" placeholder="Brief description..." />
            </div>
          </div>
        `,showDrawer({title:"Log Time",content:j.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:A=>A()},{label:"Save",className:"btn-primary",onClick:A=>{const P=document.querySelector(".drawer-overlay"),B=P.querySelector("#lt-date").value,re=P.querySelector("#lt-tech").value,oe=parseFloat(P.querySelector("#lt-hours").value),pe=P.querySelector("#lt-desc").value;if(!B||!re||isNaN(oe)){L("Please fill all required fields","error");return}const ye=_.find(le=>le.id===re);m.create("timesheets",{jobId:s,jobNumber:t.number,technicianId:re,technicianName:ye.name,date:B,hours:oe,description:pe,status:"Pending"}),L("Time logged successfully","success"),p(),A()}}]})})}else if(d==="forms")t.forms=t.forms||[],v.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${t.forms.length?t.forms.map(J=>`
                  <tr>
                    <td class="font-medium">${h(J.type)}</td>
                    <td>${new Date(J.date).toLocaleString()}</td>
                    <td>${h(J.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ae=v.querySelector("#btn-add-form"))==null||ae.addEventListener("click",()=>{const J=document.createElement("div");J.innerHTML=`
            <div class="form-group">
              <label class="form-label">Form Type</label>
              <select class="form-select" id="new-form-type">
                <option value="JSA (Job Safety Analysis)">JSA (Job Safety Analysis)</option>
                <option value="SWMS (Safe Work Method Statement)">SWMS (Safe Work Method Statement)</option>
                <option value="Site Inspection">Site Inspection</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Checklist Items</label>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked /> Hazards Identified</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked /> PPE Required</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" /> Tools Inspected</label>
                <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" /> Site Secure</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" id="new-form-notes"></textarea>
            </div>
          `,showDrawer({title:"Complete Form",content:J.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Submit",className:"btn-primary",onClick:E=>{const _=document.querySelector(".drawer-overlay");t.forms.push({type:_.querySelector("#new-form-type").value,notes:_.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),m.update("jobs",s,{forms:t.forms}),L("Form submitted successfully","success"),p(),E()}}]})});else if(d==="pos"){const J=m.getAll("purchaseOrders").filter(E=>E.jobId===s);v.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${J.length?J.map(E=>`
                  <tr>
                    <td><a href="#/purchase-orders/${h(E.id)}">${h(E.number)}</a></td>
                    <td>${h(E.supplierName||"—")}</td>
                    <td>${E.issueDate?new Date(E.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(E.total||0).toFixed(2)}</td>
                    <td><span class="badge ${E.status==="Received"?"badge-success":E.status==="Draft"?"badge-neutral":E.status==="Cancelled"?"badge-danger":"badge-primary"}">${E.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(de=v.querySelector("#btn-raise-po"))==null||de.addEventListener("click",()=>{m.getAll("suppliers");const E=m.getAll("stock"),_=document.createElement("div");_.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <input type="text" class="form-input" id="po-supplier" placeholder="e.g. Reece Plumbing" />
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${E.map(D=>`<option value="${D.id}">${D.name} - $${D.costPrice||0}</option>`).join("")}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input type="number" class="form-input" id="po-qty" value="1" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Expected Date</label>
              <input type="date" class="form-input" id="po-date" value="${new Date().toISOString().split("T")[0]}" />
            </div>
          </div>
        `,showDrawer({title:"Quick Purchase Order",content:_.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:D=>D()},{label:"Create PO",className:"btn-primary",onClick:D=>{const V=document.querySelector(".drawer-overlay"),ee=V.querySelector("#po-supplier").value,te=V.querySelector("#po-part").value,j=parseInt(V.querySelector("#po-qty").value)||1,A=V.querySelector("#po-date").value;if(!ee||!te){L("Supplier and Part are required","error");return}const P=E.find(B=>B.id===te);m.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:s,supplierName:ee,issueDate:new Date().toISOString(),expectedDate:A,status:"Draft",items:[{stockId:te,name:P.name,quantity:j,unitCost:P.costPrice||0,total:(P.costPrice||0)*j}],total:(P.costPrice||0)*j}),L("Quick PO Created","success"),p(),D()}}]})})}else if(d==="invoices"){let E=function(D,V,ee){const te=m.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:D,jobId:s,jobNumber:t.number,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,status:"Draft",sections:V,subtotal:ee,tax:ee*.1,total:ee*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+2592e6).toISOString()});m.update("jobs",s,{status:"Invoiced"}),L(`${D} Invoice created`,"success"),z.navigate(`/invoices/${te.id}`)},_=function(){let D=[],V=0;if(t.quoteId){const ee=m.getById("quotes",t.quoteId);ee&&ee.sections&&ee.sections.length>0?(D=JSON.parse(JSON.stringify(ee.sections)),V=ee.subtotal||0):ee&&ee.lineItems&&(D=[{id:m.generateId(),name:"Main Phase",lineItems:JSON.parse(JSON.stringify(ee.lineItems))}],V=ee.subtotal||0)}if(D.length===0){const ee=t.tasks||t.phases||[];if(ee.length>0){D=ee.map(A=>({id:m.generateId(),name:A.name,lineItems:[{description:`${A.name} - Labor & Materials`,type:"other",qty:1,rate:0,total:0}],subtotal:0}));const te=t.laborCost||0,j=t.materialCost||0;(te>0||j>0)&&(D[0].lineItems.push({description:"Estimated Job Labor",type:"labor",qty:1,rate:te,total:te}),D[0].lineItems.push({description:"Estimated Job Materials",type:"material",qty:1,rate:j,total:j}))}else{const te=t.laborCost||0,j=t.materialCost||0;D=[{id:m.generateId(),name:"General Items",lineItems:[{description:`${t.title} - Labor`,type:"labor",qty:1,rate:te,total:te},{description:`${t.title} - Materials`,type:"material",qty:1,rate:j,total:j}]}]}V=D.reduce((te,j)=>te+j.lineItems.reduce((A,P)=>A+(P.total||0),0),0)}return{sections:D,subtotal:V}};var k=E,S=_;const J=m.getAll("invoices").filter(D=>D.jobId===s);v.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Invoices</h4>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-secondary" id="btn-create-deposit-invoice">Create Deposit Invoice</button>
              <button class="btn btn-sm btn-secondary" id="btn-create-progress-invoice">Create Progress Invoice</button>
              <button class="btn btn-sm btn-primary" id="btn-create-standard-invoice"><span class="material-icons-outlined" style="font-size:16px;">add</span> Create Standard Invoice</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Number</th><th>Type</th><th>Issue Date</th><th>Due Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${J.length?J.map(D=>`
                  <tr>
                    <td><a href="#/invoices/${h(D.id)}">${h(D.number)}</a></td>
                    <td><span class="badge badge-neutral">${h(D.invoiceType||"Standard")}</span></td>
                    <td>${D.issueDate?D.issueDate.split("T")[0]:"—"}</td>
                    <td>${D.dueDate?D.dueDate.split("T")[0]:"—"}</td>
                    <td style="font-weight:600;">$${(D.total||0).toFixed(2)}</td>
                    <td><span class="badge ${D.status==="Paid"?"badge-success":D.status==="Draft"?"badge-neutral":D.status==="Overdue"?"badge-danger":"badge-info"}">${D.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(he=v.querySelector("#btn-create-standard-invoice"))==null||he.addEventListener("click",()=>{const{sections:D,subtotal:V}=_();E("Standard",D,V)}),($e=v.querySelector("#btn-create-deposit-invoice"))==null||$e.addEventListener("click",()=>{const D=[{id:m.generateId(),name:"Deposit",lineItems:[{description:`Deposit for Job ${t.number}`,type:"other",qty:1,rate:0,total:0}],subtotal:0}];E("Deposit",D,0)}),(ke=v.querySelector("#btn-create-progress-invoice"))==null||ke.addEventListener("click",()=>{const D=document.createElement("div");D.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,fe({title:"Create Progress Invoice",content:D,actions:[{label:"Cancel",className:"btn-secondary",onClick:V=>V()},{label:"Create",className:"btn-primary",onClick:V=>{const ee=parseFloat(document.getElementById("progress-percent").value)||0;if(ee<=0||ee>100){L("Enter a valid percentage (1-100)","error");return}const{subtotal:te}=_(),j=te*(ee/100),A=[{id:m.generateId(),name:`Progress Payment (${ee}%)`,lineItems:[{description:`Progress Payment (${ee}% of job)`,type:"other",qty:1,rate:j,total:j}],subtotal:j}];E("Progress",A,j),V()}}]})})}}function g(){var v,u;e.querySelectorAll(".tab").forEach(y=>{y.addEventListener("click",()=>{d=y.dataset.tab,e.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")),y.classList.add("active"),p()})}),(v=e.querySelector("#btn-edit-job"))==null||v.addEventListener("click",()=>z.navigate(`/jobs/${s}/edit`)),(u=e.querySelector("#btn-delete-job"))==null||u.addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`<p>Delete job <strong>${h(t.number)}</strong>?</p>`,fe({title:"Delete Job",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Delete",className:"btn-danger",onClick:x=>{m.delete("jobs",s),L("Job deleted","success"),x(),z.navigate("/jobs")}}]})})}n()}function Pe(e,s){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function gt(e){const s=m.getAll("formInstances").filter(a=>a.jobId===id),t=m.getAll("formTemplates");e.innerHTML=`
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
          <h4 style="margin:0">Job Compliance Forms</h4>
          <button class="btn btn-primary btn-sm" id="btn-attach-form">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Attach Form
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Status</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th style="width:100px; text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${s.map(a=>{const o=t.find(l=>l.id===a.templateId),d=a.status==="Completed",i=a.submittedBy?m.getById("people",a.submittedBy):null;return`
                  <tr>
                    <td class="font-medium">${h((o==null?void 0:o.name)||"Unknown Form")}</td>
                    <td><span class="badge ${d?"badge-success":"badge-warning"}">${a.status}</span></td>
                    <td>${i?h(`${i.firstName} ${i.lastName}`):"—"}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${a.submittedAt?new Date(a.submittedAt).toLocaleDateString():"—"}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${d?"btn-secondary":"btn-primary"} btn-sm fill-form" data-id="${a.id}">
                          <span class="material-icons-outlined" style="font-size:16px">${d?"visibility":"edit_note"}</span>
                        </button>
                        ${d?"":`<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${a.id}" style="color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              ${s.length?"":'<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,e.querySelector("#btn-attach-form").addEventListener("click",()=>Ys()),e.querySelectorAll(".fill-form").forEach(a=>{a.addEventListener("click",()=>Ks(a.dataset.id))}),e.querySelectorAll(".remove-form-instance").forEach(a=>{a.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this form from the job?")){const o=a.dataset.id,d=m.getAll("formInstances");m.save("formInstances",d.filter(i=>i.id!==o)),gt(e)}})})}function Ys(){const e=m.getAll("formTemplates"),t=m.getAll("formInstances").filter(o=>o.jobId===id).map(o=>o.templateId),a=document.createElement("div");a.style.minWidth="450px",a.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:12px">
        ${e.map(o=>{const d=t.includes(o.id);return`
            <div class="card attach-template-item ${d?"disabled":""}" data-id="${o.id}" style="cursor:${d?"not-allowed":"pointer"}; opacity:${d?"0.6":"1"}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${h(o.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(o.sections||[]).reduce((i,l)=>i+l.fields.length,0)} fields</div>
                </div>
                ${d?'<span class="badge badge-neutral">Already Attached</span>':'<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `}).join("")}
        ${e.length?"":'<div class="text-center text-tertiary">No templates available.</div>'}
      </div>
    `,a.querySelectorAll(".attach-template-item:not(.disabled)").forEach(o=>{o.addEventListener("click",()=>{var l;const d=o.dataset.id,i=m.getAll("formInstances");i.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:id,templateId:d,responses:{},status:"Pending",createdAt:new Date().toISOString()}),m.save("formInstances",i),L("Form attached to job","success"),(l=document.querySelector(".modal-overlay"))==null||l.remove(),gt(container.querySelector("#tab-content"))})}),fe({title:"Attach Compliance Form",content:a,actions:[{label:"Cancel",className:"btn-secondary",onClick:o=>o()}]})}function Ks(e){const t=m.getAll("formInstances").find(i=>i.id===e),a=m.getById("formTemplates",t.templateId),o=t.status==="Completed",d=document.createElement("div");d.style.minWidth="600px",d.innerHTML=`
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${h(a.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${h(a.description||"")}</div>
      </div>
      <form id="active-job-form">
        <div style="display:flex; flex-direction:column; gap:32px">
          ${(a.sections||[]).map(i=>`
            <div class="form-section">
              <div style="background:var(--bg-color); padding:8px 16px; border-radius:6px; margin-bottom:16px; border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${h(i.title)}</h4>
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; padding:0 8px">
                ${i.fields.map(l=>{const r=t.responses[l.id]||"";let c="";return l.type==="text"?c=`<input class="form-input" name="${l.id}" value="${h(r)}" ${l.required?"required":""} ${o?"disabled":""} />`:l.type==="textarea"?c=`<textarea class="form-textarea" name="${l.id}" rows="3" ${l.required?"required":""} ${o?"disabled":""}>${h(r)}</textarea>`:l.type==="checkbox"?c=`
                       <label style="display:flex; align-items:center; gap:10px; cursor:pointer">
                         <input type="checkbox" name="${l.id}" ${r?"checked":""} ${o?"disabled":""} style="width:18px; height:18px" />
                         <span style="font-size:14px">${l.label}</span>
                       </label>`:l.type==="select"?c=`
                       <select class="form-select" name="${l.id}" ${l.required?"required":""} ${o?"disabled":""}>
                         <option value="">Select option...</option>
                         ${(l.options||[]).map(b=>`<option value="${h(b)}" ${r===b?"selected":""}>${h(b)}</option>`).join("")}
                       </select>`:l.type==="date"?c=`<input type="date" class="form-input" name="${l.id}" value="${r}" ${l.required?"required":""} ${o?"disabled":""} />`:l.type==="signature"&&(c=`
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${r?`<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${h(r)}</span>`:"Digitally Signed on submission"}
                       </div>`),`
                    <div class="form-group" style="margin:0">
                      ${l.type!=="checkbox"?`<label class="form-label" style="font-weight:500">${h(l.label)} ${l.required?'<span style="color:var(--color-danger)">*</span>':""}</label>`:""}
                      ${c}
                    </div>
                  `}).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </form>
    `,fe({title:o?"View Form Response":"Complete Job Form",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},o?null:{label:"Submit Form",className:"btn-primary",onClick:i=>{var p,g;const l=d.querySelector("#active-job-form");if(!l.checkValidity())return l.reportValidity();const r=new FormData(l),c={};(a.sections||[]).forEach(v=>{v.fields.forEach(u=>{var y;u.type==="checkbox"?c[u.id]=r.has(u.id):c[u.id]=r.get(u.id),u.type==="signature"&&(c[u.id]=((y=JSON.parse(sessionStorage.getItem("currentUser")))==null?void 0:y.name)||"Unknown")})});const b=m.getAll("formInstances"),f=b.findIndex(v=>v.id===e);b[f]={...b[f],responses:c,status:"Completed",submittedBy:(p=JSON.parse(sessionStorage.getItem("currentUser")))==null?void 0:p.id,submittedAt:new Date().toISOString()},m.save("formInstances",b),L("Form submitted successfully","success"),i(),gt(container.querySelector("#tab-content"));const n=m.getAll("activity")||[];n.push({id:Date.now(),jobId:id,type:"form_submission",text:`Form "${a.name}" submitted.`,user:(g=JSON.parse(sessionStorage.getItem("currentUser")))==null?void 0:g.name,timestamp:new Date().toISOString()}),m.save("activity",n)}}].filter(Boolean)})}const Xs=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function Kt(e,{id:s}){const t=s&&s!=="new",a=t?m.getById("jobs",s):{},o=m.getAll("customers"),d=m.getAll("contractors").filter(T=>T.active);let i=a.tags?[...a.tags]:[];function l(T){return o.find(w=>w.id===T)||null}function r(T,w){const R=l(T);return!R||!R.sites||R.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+R.sites.map((G,ae)=>`<option value="${ae}" data-address="${h(G.address)}" data-name="${h(G.name)}" ${w===G.name?"selected":""}>${h(G.name)} — ${h(G.address)}</option>`).join("")}function c(T,w,R){const G=l(T);return!G||!G.contacts||G.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${R}</option>`+G.contacts.map((ae,de)=>`<option value="${de}" ${w===ae.name?"selected":""}>${h(ae.name)} (${h(ae.role||"")})</option>`).join("")}function b(){return Xs.map(T=>`<button type="button" class="tag-pill ${i.includes(T)?"tag-pill-active":""}" data-tag="${h(T)}">${h(T)}</button>`).join("")}const f=a.customerId||"";e.innerHTML=`
    <style>
      .tag-pill {
        display:inline-flex; align-items:center; padding:4px 10px;
        border-radius:999px; border:1.5px solid var(--border-color);
        background:var(--bg-color); color:var(--text-secondary);
        font-size:12px; cursor:pointer; transition:all 0.15s; margin:3px;
      }
      .tag-pill:hover { border-color:var(--color-primary); color:var(--color-primary); }
      .tag-pill-active {
        background:var(--color-primary); border-color:var(--color-primary);
        color:#fff;
      }
      .rich-editor-toolbar {
        display:flex; gap:2px; padding:6px 8px;
        background:var(--bg-color); border:1px solid var(--border-color);
        border-bottom:none; border-radius:4px 4px 0 0; flex-wrap:wrap;
      }
      .rich-editor-toolbar button {
        padding:3px 8px; border:1px solid transparent; border-radius:3px;
        background:transparent; cursor:pointer; font-size:13px;
        color:var(--text-primary); min-width:28px;
        transition: background 0.1s;
      }
      .rich-editor-toolbar button:hover { background:var(--border-color); }
      .rich-editor-toolbar button.active { background:var(--color-primary-light); color:var(--color-primary); border-color:var(--color-primary); }
      .rich-editor-toolbar .sep { width:1px; background:var(--border-color); margin:2px 4px; }
      #job-description-editor {
        min-height:160px; padding:12px; border:1px solid var(--border-color);
        border-radius:0 0 4px 4px; background:var(--content-bg);
        color:var(--text-primary); font-size:14px; line-height:1.6;
        outline:none; overflow-y:auto;
      }
      #job-description-editor:focus { border-color:var(--color-primary); }
      #job-description-editor h1,#job-description-editor h2,#job-description-editor h3 { margin:8px 0 4px; }
      #job-description-editor ul,#job-description-editor ol { padding-left:20px; }
      #job-description-editor blockquote { border-left:3px solid var(--color-primary); padding-left:10px; color:var(--text-secondary); margin:8px 0; }
      .site-address-hint { font-size:11px; color:var(--text-tertiary); margin-top:3px; font-style:italic; }
    </style>
    <div class="page-header">
      <h1>${t?"Edit Job":"New Job"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Job</button>
      </div>
    </div>
    <div class="tabs" id="job-form-tabs" style="margin-bottom:16px">
      <button type="button" class="tab active" data-tab="details">Details</button>
      <button type="button" class="tab" data-tab="tasks">Tasklists</button>
      <button type="button" class="tab" data-tab="forms">Compliance Forms</button>
    </div>
    
    <div id="jf-tab-details">
      <div class="card">
        <div class="card-body">
          <form id="job-form">

          <!-- Title -->
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${h(a.title||"")}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${o.map(T=>`<option value="${T.id}" ${a.customerId===T.id?"selected":""}>${h(T.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(T=>`<option ${a.type===T?"selected":""}>${T}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${f?"":"disabled"}>
              ${r(f,a.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${a.siteAddress?h(a.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${f?"":"disabled"}>
                ${c(f,a.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${f?"":"disabled"}>
                ${c(f,a.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(T=>`<option ${a.status===T?"selected":""}>${T}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(T=>`<option ${a.priority===T?"selected":""}>${T}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${d.map(T=>`<option value="${T.id}" ${a.contractorId===T.id?"selected":""}>${h(T.businessName)}</option>`).join("")}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${b()}
            </div>
          </div>

          <!-- Emergency -->
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-emergency" style="width:16px;height:16px" ${a.isEmergency?"checked":""} />
              <label class="form-label" style="margin:0; color:var(--color-danger);" for="is-emergency">Is Emergency (Applies Callout Fee)</label>
            </div>
          </div>
          <div id="emergency-dispatch-suggestion" style="display:none; background:var(--color-warning-bg); border:1px solid var(--color-warning); padding:15px; border-radius:8px; margin-bottom:15px;">
            <strong>Emergency Dispatch Suggestion:</strong>
            <p style="margin:5px 0 0 0;" id="dispatch-reason">Loading best technician...</p>
          </div>

          ${t?"":`
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-recurring" style="width:16px;height:16px" />
              <label class="form-label" style="margin:0" for="is-recurring">Recurring Job</label>
            </div>
          </div>
          <div class="form-row" id="recurring-options" style="display:none;background:var(--card-bg);padding:16px;border-radius:4px;border:1px solid var(--border-color);margin-bottom:16px">
            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select class="form-select" id="recurring-freq">
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">First Job Date</label>
              <input type="date" class="form-input" id="recurring-start" value="${new Date().toISOString().split("T")[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date (Max 50 occurrences)</label>
              <input type="date" class="form-input" id="recurring-end" />
            </div>
          </div>
          `}

          <!-- Rich Description Editor -->
          <div class="form-group">
            <label class="form-label">Description</label>
            <div class="rich-editor-toolbar" id="editor-toolbar">
              <button type="button" data-cmd="bold" title="Bold"><b>B</b></button>
              <button type="button" data-cmd="italic" title="Italic"><i>I</i></button>
              <button type="button" data-cmd="underline" title="Underline"><u>U</u></button>
              <div class="sep"></div>
              <button type="button" data-cmd="formatBlock" data-val="h2" title="Heading">H2</button>
              <button type="button" data-cmd="formatBlock" data-val="h3" title="Subheading">H3</button>
              <button type="button" data-cmd="formatBlock" data-val="p" title="Paragraph">P</button>
              <div class="sep"></div>
              <button type="button" data-cmd="insertUnorderedList" title="Bullet List">&#8226; List</button>
              <button type="button" data-cmd="insertOrderedList" title="Numbered List">1. List</button>
              <div class="sep"></div>
              <button type="button" data-cmd="formatBlock" data-val="blockquote" title="Blockquote">&#8220; Quote</button>
              <button type="button" data-cmd="removeFormat" title="Clear Formatting">&#10006; Clear</button>
              <div class="sep"></div>
              <button type="button" id="editor-link-btn" title="Insert Link">&#128279; Link</button>
            </div>
            <div id="job-description-editor" contenteditable="true" spellcheck="true">${a.description||a.notes||""}</div>
          </div>

        </form>
      </div>
        </form>
      </div>
    </div>
  </div>
  
  <div id="jf-tab-tasks" style="display:none;">
    <div id="jf-task-container"></div>
  </div>
  
  <div id="jf-tab-forms" style="display:none;">
    <div id="jf-forms-container"></div>
  </div>
  `,e.querySelectorAll("#job-form-tabs .tab").forEach(T=>{T.addEventListener("click",w=>{e.querySelectorAll("#job-form-tabs .tab").forEach(G=>G.classList.remove("active")),w.currentTarget.classList.add("active");const R=w.currentTarget.dataset.tab;e.querySelector("#jf-tab-details").style.display=R==="details"?"block":"none",e.querySelector("#jf-tab-tasks").style.display=R==="tasks"?"block":"none",e.querySelector("#jf-tab-forms").style.display=R==="forms"?"block":"none",R==="tasks"&&W(),R==="forms"&&Y()})});const n=e.querySelector("#jf-customer"),p=e.querySelector("#jf-site"),g=e.querySelector("#jf-site-hint"),v=e.querySelector("#jf-primary-contact"),u=e.querySelector("#jf-additional-contact");function y(T){const w=!T;p.innerHTML=r(T,""),p.disabled=w,v.innerHTML=c(T,"","Select primary contact..."),v.disabled=w,u.innerHTML=c(T,"","None"),u.disabled=w,g.textContent=w?"Select a customer to enable jobsite selection":"Select a jobsite above"}n.addEventListener("change",T=>y(T.target.value)),p.addEventListener("change",T=>{const w=T.target.selectedOptions[0];g.textContent=(w==null?void 0:w.dataset.address)||""}),e.querySelector("#jf-tags").addEventListener("click",T=>{const w=T.target.closest(".tag-pill");if(!w)return;const R=w.dataset.tag;i.includes(R)?(i=i.filter(G=>G!==R),w.classList.remove("tag-pill-active")):(i.push(R),w.classList.add("tag-pill-active"))});const x=e.querySelector("#job-description-editor"),C=e.querySelector("#editor-toolbar");C.addEventListener("mousedown",T=>{const w=T.target.closest("button[data-cmd]");if(!w)return;T.preventDefault();const R=w.dataset.cmd,G=w.dataset.val||null;document.execCommand(R,!1,G),x.focus()}),e.querySelector("#editor-link-btn").addEventListener("click",()=>{const T=prompt("Enter URL:","https://");T&&document.execCommand("createLink",!1,T),x.focus()}),x.addEventListener("keyup",k),x.addEventListener("mouseup",k);function k(){C.querySelectorAll("button[data-cmd]").forEach(T=>{try{T.classList.toggle("active",document.queryCommandState(T.dataset.cmd))}catch{}})}const S=e.querySelector("#is-emergency"),$=e.querySelector("#emergency-dispatch-suggestion"),I=e.querySelector("#dispatch-reason"),O=e.querySelector("#job-priority");function q(T){if(T){O.value="Urgent",$.style.display="block";const w=m.getAll("people").filter(R=>R.type==="Staff");if(w.length>0){const R=w[Math.floor(Math.random()*w.length)],G=Math.floor(Math.random()*15)+5;I.innerHTML=`Based on current GPS location, <strong>${R.firstName} ${R.lastName}</strong> is the most suitable technician (approx. ${G} mins away).`}else I.innerHTML="No internal technicians available for dispatch."}else $.style.display="none"}if(S==null||S.addEventListener("change",T=>q(T.target.checked)),a.isEmergency&&q(!0),!t){const T=e.querySelector("#is-recurring"),w=e.querySelector("#recurring-options");T==null||T.addEventListener("change",R=>{w.style.display=R.target.checked?"flex":"none"})}e.querySelector("#btn-cancel").addEventListener("click",()=>z.navigate(t?`/jobs/${s}`:"/jobs"));let F=a.tasks?JSON.parse(JSON.stringify(a.tasks)):[{id:m.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subTasks:[]}];F.forEach(T=>{T.subTasks||(T.subTasks=[])});let K=[0],X=[];function Z(T,w){let R=T[w[0]];if(!R)return null;for(let G=1;G<w.length;G++)if(!R.subTasks||(R=R.subTasks[w[G]],!R))return null;return R}function W(){var he,$e,ke,J;const T=e.querySelector("#jf-task-container");if(!T)return;let w=!0,R=F;for(let E=0;E<K.length;E++){if(!R||!R[K[E]]){w=!1;break}R=R[K[E]].subTasks}w||(K=[]);const G=X.length>0?Z(F,X):null,ae=G?G.subTasks||[]:F,de=G?h(G.name):"Main Tasks";T.innerHTML=`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0">Job Tasks</h4>
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-import-tasklist">
            <span class="material-icons-outlined" style="font-size:16px">download</span> Import
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-save-as-template">
            <span class="material-icons-outlined" style="font-size:16px">bookmark_add</span> Save as Template
          </button>
        </div>
      </div>
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
          
          <!-- Drill-Down List -->
          <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
            <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
              <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                ${X.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${de}">${de}</span>
              </div>
              ${X.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${X.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${ae.map((E,_)=>{const D=[...X,_],V=D.join("-")===K.join("-");return`
                  <div class="task-list-item" data-path="${D.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${V?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${V?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${h(E.name)}">${h(E.name)}</span>
                    ${E.subTasks&&E.subTasks.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${D.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${ae.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${K.length>0?(()=>{const E=K,_=Z(F,E);if(!_)return"";const D=_.subTasks&&_.subTasks.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${h(_.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${E.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${E.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${E.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${h(_.name)}" />
                </div>
                ${D?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${_.startDate?_.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${_.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${_.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${h(_.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(he=T.querySelector(".btn-view-back"))==null||he.addEventListener("click",()=>{X.pop(),W()}),T.querySelectorAll(".btn-drill-down").forEach(E=>{E.addEventListener("click",_=>{_.stopPropagation(),X=E.dataset.path.split("-").map(Number),K=[...X],W()})}),T.querySelectorAll(".task-list-item").forEach(E=>{E.addEventListener("click",()=>{K=E.dataset.path.split("-").map(Number),W()})}),($e=T.querySelector("#btn-add-main-task"))==null||$e.addEventListener("click",()=>{F.push({id:m.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),K=[F.length-1],W()}),T.querySelectorAll(".btn-add-child-task").forEach(E=>{E.addEventListener("click",()=>{const _=E.dataset.path.split("-").map(Number),D=Z(F,_);D&&(D.subTasks||(D.subTasks=[]),D.subTasks.push({id:m.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),K=[..._,D.subTasks.length-1],X=[..._],W())})}),T.querySelectorAll(".btn-remove-task").forEach(E=>{E.addEventListener("click",()=>{const _=E.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(_.length===1)F.splice(_[0],1),K=F.length>0?[0]:[];else{const D=Z(F,_.slice(0,-1));D&&D.subTasks&&D.subTasks.splice(_[_.length-1],1),K=[..._.slice(0,-1)]}W()}})}),T.querySelectorAll(".detail-input").forEach(E=>{E.addEventListener("input",_=>{const D=_.target.dataset.field,V=_.target.value,ee=Z(F,K);if(ee&&(D==="estimatedHours"?ee[D]=parseFloat(V)||0:D==="people"?ee[D]=parseInt(V)||1:ee[D]=V,D==="name")){const te=T.querySelector(`.task-list-item[data-path="${K.join("-")}"] span:first-child`);te&&(te.textContent=V,te.title=V);const j=T.querySelector("h4[title]");j&&(j.textContent="Task Settings: "+V,j.title=V)}})}),(ke=e.querySelector("#btn-save-as-template"))==null||ke.addEventListener("click",()=>{const E=document.createElement("div");E.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" placeholder="e.g. Standard 50pt Maintenance" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input" id="tmpl-tags" placeholder="Electrical, Maintenance, Commercial" />
        </div>
      `,fe({title:"Save Tasklist as Template",content:E,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Save Template",className:"btn-primary",onClick:_=>{const D=E.querySelector("#tmpl-name").value,V=E.querySelector("#tmpl-desc").value,ee=E.querySelector("#tmpl-tags").value.split(",").map(j=>j.trim()).filter(Boolean);if(!D){L("Template name is required","error");return}function te(j){return j.map(A=>({...A,id:m.generateId(),status:"Not Started",progress:0,subTasks:A.subTasks?te(A.subTasks):[]}))}m.create("taskTemplates",{name:D,description:V,tags:ee,tasks:te(F),createdAt:new Date().toISOString()}),L("Tasklist saved as template","success"),_()}}]})}),(J=e.querySelector("#btn-import-tasklist"))==null||J.addEventListener("click",()=>{const E=m.getAll("taskTemplates"),_=m.getAll("jobs").filter(te=>te.id!==s&&te.tasks&&te.tasks.length>0);let D="templates";const V=document.createElement("div");V.innerHTML=`
        <div class="tabs" id="import-tabs" style="margin-bottom:12px">
          <button class="tab active" data-tab="templates">Templates</button>
          <button class="tab" data-tab="jobs">Other Jobs</button>
        </div>
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
           <!-- Content injected here -->
        </div>
      `;function ee(te=""){const j=V.querySelector("#import-content"),A=te.toLowerCase();if(D==="templates"){const P=E.filter(B=>B.name.toLowerCase().includes(A)||(B.description||"").toLowerCase().includes(A)||(B.tags||[]).some(re=>re.toLowerCase().includes(A)));j.innerHTML=P.length?P.map(B=>`
            <div class="import-item" data-id="${B.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${h(B.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(B.tasks||B.phases||[]).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${h(B.description||"No description.")}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(B.tags||[]).map(re=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${h(re)}</span>`).join("")}
              </div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${te}"</div>`}else{const P=_.filter(B=>B.number.toLowerCase().includes(A)||B.title.toLowerCase().includes(A)||B.customerName.toLowerCase().includes(A));j.innerHTML=P.length?P.map(B=>`
            <div class="import-item" data-id="${B.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${h(B.number)} - ${h(B.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${h(B.customerName)} · ${(B.tasks||B.phases||[]).length} tasks</div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${te}"</div>`}}ee(),V.querySelectorAll(".tab").forEach(te=>{te.addEventListener("click",()=>{V.querySelectorAll(".tab").forEach(j=>j.classList.remove("active")),te.classList.add("active"),D=te.dataset.tab,V.querySelector("#import-search").placeholder=D==="templates"?"Search templates...":"Search jobs...",ee(V.querySelector("#import-search").value)})}),V.querySelector("#import-search").addEventListener("input",te=>{ee(te.target.value)}),V.addEventListener("click",te=>{var ye;const j=te.target.closest(".import-item");if(!j)return;const A=j.dataset.id,P=j.dataset.type,B=m.getAll("taskTemplates"),re=m.getAll("jobs"),oe=P==="template"?B.find(le=>le.id===A):re.find(le=>le.id===A);if(oe&&(oe.tasks||oe.phases)){const le=oe.tasks||oe.phases;if(confirm(`Replace current tasklist with "${oe.name||oe.number}"?`)){let U=function(ne){return ne.map(se=>({...se,id:m.generateId(),status:"Not Started",progress:0,subTasks:se.subTasks||se.subPhases?U(se.subTasks||se.subPhases):[]}))};var pe=U;F=U(le),K=[0],X=[],L(`Imported ${oe.name||oe.number}`,"success"),W(),(ye=document.querySelector(".modal-overlay"))==null||ye.remove()}}else L("Could not find source data","error")}),fe({title:"Import Tasklist",content:V,actions:[{label:"Cancel",className:"btn-secondary",onClick:te=>te()}]})})}const H=m.getAll("formTemplates"),N=t?m.getAll("formInstances").filter(T=>T.jobId===s):[];let M=t?N.map(T=>T.templateId):[];function Y(){const T=e.querySelector("#jf-forms-container");T&&(T.innerHTML=`
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${H.map(w=>{const R=M.includes(w.id);return`
            <div class="card form-template-selector ${R?"active":""}" data-id="${w.id}" style="cursor:pointer; border:2px solid ${R?"var(--color-primary)":"var(--border-color)"}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${R?"var(--color-primary)":"var(--text-tertiary)"}; background:${R?"var(--color-primary)":"transparent"}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${R?'<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>':""}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${h(w.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${h(w.description||"No description.")}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(w.sections||[]).reduce((G,ae)=>G+ae.fields.length,0)} Required Fields</div>
                </div>
              </div>
            </div>
          `}).join("")}
        ${H.length?"":'<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>'}
      </div>
    `,T.querySelectorAll(".form-template-selector").forEach(w=>{w.addEventListener("click",()=>{const R=w.dataset.id;M.includes(R)?M=M.filter(G=>G!==R):M.push(R),Y()})}))}e.querySelector("#btn-save").addEventListener("click",()=>{var ee,te,j,A;const T=e.querySelector("#job-form");if(!T.checkValidity()){e.querySelectorAll("#job-form-tabs .tab").forEach(P=>P.classList.remove("active")),e.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),e.querySelector("#jf-tab-details").style.display="block",e.querySelector("#jf-tab-tasks").style.display="none",e.querySelector("#jf-tab-forms").style.display="none",T.reportValidity();return}const w=Object.fromEntries(new FormData(T)),R=w.customerId,G=o.find(P=>P.id===R);w.customerName=(G==null?void 0:G.company)||"";const ae=p.selectedOptions[0];w.siteAddress=(ae==null?void 0:ae.dataset.address)||"",w.siteName=(ae==null?void 0:ae.dataset.name)||"";const de=parseInt(w.primaryContactId),he=parseInt(w.additionalContactId),$e=isNaN(de)?null:(ee=G==null?void 0:G.contacts)==null?void 0:ee[de],ke=isNaN(he)?null:(te=G==null?void 0:G.contacts)==null?void 0:te[he];w.contactName=($e==null?void 0:$e.name)||(G?`${G.firstName} ${G.lastName}`:""),w.primaryContactName=($e==null?void 0:$e.name)||"",w.additionalContactName=(ke==null?void 0:ke.name)||"",delete w.primaryContactId,delete w.additionalContactId,w.tags=i,w.description=x.innerHTML,w.tasks=F,w.phases=F,w.tasks.forEach(P=>{P.subTasks||(P.subTasks=[]),P.subPhases=P.subTasks}),delete w.notes,w.number=a.number||`J-${Date.now().toString().slice(-6)}`;const J=(j=e.querySelector("#is-emergency"))==null?void 0:j.checked;if(w.isEmergency=J,t?J&&!a.isEmergency?w.laborCost=(a.laborCost||0)+150:!J&&a.isEmergency&&(w.laborCost=Math.max(0,(a.laborCost||0)-150)):(w.technicians=[],w.laborCost=J?150:0,w.materialCost=0,w.estimatedHours=0),(A=e.querySelector("#is-recurring"))!=null&&A.checked){const P=e.querySelector("#recurring-freq").value,B=e.querySelector("#recurring-start").value,re=e.querySelector("#recurring-end").value;if(!B||!re){L("Recurring dates required","error");return}w.recurringConfig={freq:P,start:B,end:re}}const E=t?m.update("jobs",s,w):m.create("jobs",w),_=E.id;let V=(m.getAll("formInstances")||[]).filter(P=>{if(P.jobId!==_)return!0;const B=M.includes(P.templateId),re=P.responses&&Object.keys(P.responses).length>0;return B||re});if(M.forEach(P=>{V.find(re=>re.jobId===_&&re.templateId===P)||V.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:_,templateId:P,responses:{},status:"Pending",createdAt:new Date().toISOString()})}),m.save("formInstances",V),!t&&w.recurringConfig){let P=new Date(w.recurringConfig.start);const B=new Date(w.recurringConfig.end);let re=0;for(;P<=B&&re<50;)m.create("notifications",{type:"Recurring Job Due",jobId:_,title:`Recurring: ${E.title||E.number}`,dueDate:P.toISOString().split("T")[0],status:"Pending",createdAt:new Date().toISOString()}),w.recurringConfig.freq==="Daily"?P.setDate(P.getDate()+1):w.recurringConfig.freq==="Weekly"?P.setDate(P.getDate()+7):w.recurringConfig.freq==="Monthly"&&P.setMonth(P.getMonth()+1),re++}L(`Job ${t?"updated":"created"} successfully`,"success"),z.navigate(`/jobs/${_}`)})}function Zs(e){var r;const s=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),t=s.userTypeId?m.getById("userTypes",s.userTypeId):null,a=t?(r=t.permissions)==null?void 0:r.find(c=>c.module==="Timesheets"):null;let o="All",d="All";function i(){var y,x;const c=m.getAll("timesheets").sort((C,k)=>new Date(k.date)-new Date(C.date)),b=m.getAll("technicians");let f=[...c];const n=s.role==="admin"||a&&a.view,p=a&&a.view_own;!n&&p?f=f.filter(C=>String(C.technicianId)===String(s.id)):!n&&!p&&s.role!=="admin"&&(f=[]);const g=f.filter(C=>C.status==="Pending").reduce((C,k)=>C+(k.hours||0),0);let v=o==="All"?[...f]:f.filter(C=>C.status===o);n&&d!=="All"&&(v=v.filter(C=>String(C.technicianId)===String(d)));const u=[];v.forEach(C=>{const S=new Date(C.date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});let $=u.find(I=>I.dateStr===S);$||($={dateStr:S,items:[],total:0},u.push($)),$.items.push(C),$.total+=C.hours||0}),e.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          ${s.role==="admin"||a&&a.approve?`
            <button class="btn btn-primary" id="btn-approve-all-pending" ${f.some(C=>C.status==="Pending")?"":"disabled"}>
              <span class="material-icons-outlined">done_all</span> Approve All Pending
            </button>
          `:""}
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${g.toFixed(2)} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="page-toolbar" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="toolbar-filters">
          <button class="toolbar-filter ${o==="All"?"active":""}" data-status="All">All</button>
          <button class="toolbar-filter ${o==="Pending"?"active":""}" data-status="Pending">Pending</button>
          <button class="toolbar-filter ${o==="Approved"?"active":""}" data-status="Approved">Approved</button>
          <button class="toolbar-filter ${o==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
        </div>
        ${n?`
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Filter by Staff:</label>
            <select class="form-select" id="filter-tech" style="width:180px; height:32px; padding:0 8px; font-size:13px;">
              <option value="All">All Technicians</option>
              ${b.map(C=>`<option value="${C.id}" ${d===C.id?"selected":""}>${C.name}</option>`).join("")}
            </select>
          </div>
        `:""}
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:120px">Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Description</th>
                <th style="text-align:right; width:80px">Hours</th>
                <th style="width:110px">Status</th>
                <th style="width:60px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${u.length===0?'<tr><td colspan="7" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>':u.map(C=>`
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td colspan="4" style="color:var(--text-primary)">${C.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${C.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${C.items.map(k=>{const S=String(k.technicianId)===String(s.id),$=a?a.edit===!0:s.role==="technician"&&S,I=s.role==="admin"||$&&k.status!=="Approved";return`
                  <tr>
                    <td class="text-secondary" style="font-size:12px">${new Date(k.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${h(k.technicianName)}</span></td>
                    <td><a href="#/jobs/${k.jobId}" class="cell-link">${h(k.jobNumber||k.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:300px;display:inline-block">${h(k.description||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${k.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${k.status==="Approved"?"badge-success":k.status==="Rejected"?"badge-danger":"badge-warning"}">
                        ${h(k.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      ${I?`
                        <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${k.id}" title="Edit entry">
                          <span class="material-icons-outlined" style="font-size:18px">edit</span>
                        </button>
                      `:""}
                    </td>
                  </tr>
                `}).join("")}
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,e.querySelectorAll(".toolbar-filter").forEach(C=>{C.addEventListener("click",()=>{o=C.dataset.status,i()})}),(y=e.querySelector("#filter-tech"))==null||y.addEventListener("change",C=>{d=C.target.value,i()}),(x=e.querySelector("#btn-approve-all-pending"))==null||x.addEventListener("click",()=>{const C=f.filter(k=>k.status==="Pending");C.forEach(k=>m.update("timesheets",k.id,{status:"Approved"})),L(`Approved ${C.length} pending timesheets`,"success"),i()}),e.querySelectorAll(".btn-edit-timesheet").forEach(C=>{C.addEventListener("click",()=>{l(C.dataset.id)})})}function l(c){const b=m.getById("timesheets",c);if(!b)return;const f=document.createElement("div");f.innerHTML=`
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="edit-ts-date" value="${b.date}" />
      </div>
      <div class="form-group">
        <label class="form-label">Hours</label>
        <input type="number" class="form-input" id="edit-ts-hours" value="${b.hours}" step="0.25" min="0" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="edit-ts-desc" rows="3">${h(b.description||"")}</textarea>
      </div>
    `,fe({title:"Edit Timesheet Entry",content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save Changes",className:"btn-primary",onClick:n=>{const p=document.getElementById("edit-ts-date").value,g=parseFloat(document.getElementById("edit-ts-hours").value),v=document.getElementById("edit-ts-desc").value;if(!p||isNaN(g)){L("Please enter valid date and hours","error");return}m.update("timesheets",c,{date:p,hours:g,description:v}),L("Timesheet updated","success"),n(),i()}}]})}i()}function ea(e){const s=m.getAll("technicians"),t=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),a=t.role==="technician";let o="week",d="schedule",i=new Date;const l=Array.from({length:24},(H,N)=>N);let r=null,c=null,b=new Set(a?[t.id]:s.map(H=>H.id)),f=null,n=0,p=0;const g=32,v=g/4;function u(H){return Math.round(H*4)/4}function y(H){const N=Math.floor(H),M=Math.round((H-N)*60);return`${N.toString().padStart(2,"0")}:${M.toString().padStart(2,"0")}`}function x(){const H=document.getElementById("calendar-scroll");H&&(n=H.scrollTop,p=H.scrollLeft)}function C(){const H=document.getElementById("calendar-scroll");H&&(H.scrollTop=n,H.scrollLeft=p)}function k(){f&&(f.remove(),f=null)}document.addEventListener("click",k);function S(){const H=new Date(i);return o==="day"?[new Date(i)]:(H.setDate(H.getDate()-H.getDay()+1),Array.from({length:5},(N,M)=>{const Y=new Date(H);return Y.setDate(Y.getDate()+M),Y}))}function $(){const H=m.getAll("jobs"),N=m.getAll("timesheets"),M=[],Y=S();N.filter(w=>w.startTime&&w.finishTime).forEach(w=>{const R=H.find(ae=>ae.id===w.jobId);if(!R||R.status==="Completed"||R.status==="Invoiced")return;const G=new Date(w.startTime);Y.forEach((ae,de)=>{if(G.toDateString()===ae.toDateString()){const he=G.getHours()+G.getMinutes()/60,$e=new Date(w.finishTime),ke=$e.getHours()+$e.getMinutes()/60;M.push({id:w.id,type:"timesheet",jobId:R.id,jobNumber:R.number,customerName:R.customerName,title:R.title,technicianId:w.technicianId,dayIdx:de,startHour:he,endHour:ke,status:R.status,priority:R.priority})}})});const T=new Set(N.map(w=>w.jobId));return H.filter(w=>w.scheduledDate&&!T.has(w.id)&&w.status!=="Completed"&&w.status!=="Invoiced").forEach(w=>{const R=new Date(w.scheduledDate);Y.forEach((G,ae)=>{if(R.toDateString()===G.toDateString()){const de=w.startHour!==void 0?w.startHour:7+Math.abs(I(w.id))%6;if(w.technicians&&w.technicians.length>0)w.technicians.forEach(he=>{const $e=he.hours||2;M.push({id:`legacy-${w.id}-${he.id}`,type:"legacy",jobId:w.id,jobNumber:w.number,customerName:w.customerName,title:w.title,technicianId:he.id,dayIdx:ae,startHour:de,endHour:de+$e,status:w.status,priority:w.priority})});else if(w.technicianId){const he=w.estimatedHours||2;M.push({id:`legacy-${w.id}`,type:"legacy",jobId:w.id,jobNumber:w.number,customerName:w.customerName,title:w.title,technicianId:w.technicianId,dayIdx:ae,startHour:de,endHour:de+he,status:w.status,priority:w.priority})}}})}),M}function I(H){let N=0;for(let M=0;M<H.length;M++)N=(N<<5)-N+H.charCodeAt(M),N|=0;return N}function O(){x();const H=S(),N=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],M=["January","February","March","April","May","June","July","August","September","October","November","December"];if(d==="activity"){W();return}const Y=$(),T=s.filter(w=>b.has(w.id));e.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${M[i.getMonth()]} ${i.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${a?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${t.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${d==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${d==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${o==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${o==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <!-- Calendar Grid + Right Sidebar -->
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 160px);overflow:hidden">
          
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${b.size!==1?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${T.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${T.map(w=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${w.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${w.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${H.map((w,R)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${w.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${N[w.getDay()]}, ${w.getDate()} ${M[w.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${T.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${l.map(ae=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${ae.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${T.map(ae=>{const de=Y.filter(he=>he.technicianId===ae.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${ae.id}" data-day="${R}" data-date="${H[R].getFullYear()}-${(H[R].getMonth()+1).toString().padStart(2,"0")}-${H[R].getDate().toString().padStart(2,"0")}">
                          ${l.map(he=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${he}"></div>`).join("")}
                          ${F(de,R,ae.color)}
                        </div>
                      `}).join("")}
                  </div>
                `).join("")}
            `:`
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${H.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${H.map(w=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${w.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${N[w.getDay()]} ${w.getDate()} ${M[w.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${H.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${l.map(w=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${w.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${H.map((w,R)=>{const G=s.find(de=>de.id===[...b][0]),ae=Y.filter(de=>de.technicianId===G.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${G.id}" data-day="${R}" data-date="${H[R].getFullYear()}-${(H[R].getMonth()+1).toString().padStart(2,"0")}-${H[R].getDate().toString().padStart(2,"0")}">
                      ${l.map(de=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${de}"></div>`).join("")}
                      ${F(ae,R,G.color)}
                    </div>
                  `}).join("")}
              </div>
            `}
          </div>

          <!-- Right Sidebar (For Non-Technicians) -->
          ${a?"":`
          <div style="width:280px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; background:var(--card-bg); overflow-y:auto; flex-shrink:0;">
            
            <!-- Visible Technicians Module -->
            <div style="padding:16px; border-bottom:1px solid var(--border-color);">
              <h4 style="font-size:var(--font-size-sm); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">people</span> Visible Technicians
              </h4>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${s.map(w=>`
                  <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                    <input type="checkbox" class="tech-visibility-checkbox" value="${w.id}" ${b.has(w.id)?"checked":""}>
                    <div style="width:10px; height:10px; border-radius:50%; background:${w.color};"></div>
                    <span style="color:var(--text-primary); font-weight:500;">${w.name}</span>
                  </label>
                `).join("")}
              </div>
            </div>

            <!-- Unscheduled Jobs Module -->
            <div style="padding:16px;">
              <h4 style="font-size:var(--font-size-sm); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">pending_actions</span> Unscheduled Jobs
              </h4>
              <div id="unscheduled-drawer" style="display:flex; flex-direction:column; gap:8px;">
                ${q().map(w=>`
                  <div class="unscheduled-job" draggable="true" data-job-id="${w.id}" data-job-number="${w.number}" data-customer="${w.customerName}" data-title="${w.title}" data-hours="${w.estimatedHours||2}" data-priority="${w.priority}" style="padding:10px; background:var(--content-bg); border:1px solid var(--border-color); border-radius:4px; cursor:grab; transition:all 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span class="font-medium" style="font-size:var(--font-size-sm)">${w.number}</span>
                      <span class="badge ${w.priority==="High"||w.priority==="Urgent"?"badge-danger":"badge-neutral"}" style="font-size:9px">${w.priority}</span>
                    </div>
                    <div class="text-secondary" style="font-size:var(--font-size-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${w.customerName}</div>
                  </div>
                `).join("")||'<span class="text-secondary" style="font-size:var(--font-size-sm);">All jobs are scheduled</span>'}
              </div>
            </div>
          </div>
          `}

        </div>
      </div>
    `,K(),X(H),Z(),C()}function q(){return m.getAll("jobs").filter(N=>(!N.scheduledDate||!N.technicianId)&&N.status!=="Completed"&&N.status!=="Invoiced")}function F(H,N,M){const Y={Urgent:"#EF4444",High:"#F59E0B"};return H.filter(T=>T.dayIdx===N).map(T=>{const w=T.startHour*g,R=Math.max((T.endHour-T.startHour)*g-2,v),G=Y[T.priority]||M,ae=`${y(T.startHour)} — ${y(T.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${T.jobId}"
            data-timesheet-id="${T.id}"
            data-block-type="${T.type}"
            data-start="${T.startHour}"
            data-end="${T.endHour}"
            style="
              top:${w}px;
              height:${R}px;
              background:${M}12;
              border-color:${G};
              color:${M};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${T.jobNumber}</div>
            ${R>20?`<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${T.customerName}</div>`:""}
            ${R>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${ae}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${T.jobId}" data-timesheet-id="${T.id}" data-block-type="${T.type}" data-start="${T.startHour}" data-end="${T.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function K(){var H,N,M;(H=e.querySelector("#btn-prev"))==null||H.addEventListener("click",()=>{i.setDate(i.getDate()-(o==="week"?7:1)),O()}),(N=e.querySelector("#btn-next"))==null||N.addEventListener("click",()=>{i.setDate(i.getDate()+(o==="week"?7:1)),O()}),(M=e.querySelector("#btn-today"))==null||M.addEventListener("click",()=>{i=new Date,O()}),e.querySelectorAll("[data-view]").forEach(Y=>{Y.addEventListener("click",()=>{o=Y.dataset.view,O()})}),e.querySelectorAll("[data-cal]").forEach(Y=>{Y.addEventListener("click",()=>{d=Y.dataset.cal,O()})}),e.querySelectorAll(".tech-visibility-checkbox").forEach(Y=>{Y.addEventListener("change",T=>{T.target.checked?b.add(T.target.value):b.delete(T.target.value),O()})}),e.querySelectorAll(".schedule-block").forEach(Y=>{Y.addEventListener("click",T=>{if(T.defaultPrevented)return;if(Y.dataset.resized==="true"){Y.dataset.resized="false";return}const w=Y.dataset.blockJobId,R=m.getById("jobs",w);R&&He({title:`Job Quick View: ${R.number}`,content:`
            <div style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label class="form-label">Title</label>
                <div class="font-medium" style="font-size:16px">${R.title||"Untitled"}</div>
              </div>
              <div>
                <label class="form-label">Customer</label>
                <div>${R.customerName||"N/A"}</div>
              </div>
              <div>
                <label class="form-label">Site Address</label>
                <div>${R.siteAddress||"No address provided"}</div>
              </div>
              <div>
                <label class="form-label">Priority</label>
                <div><span class="badge ${R.priority==="Urgent"||R.priority==="High"?"badge-danger":"badge-neutral"}">${R.priority||"Normal"}</span></div>
              </div>
              <div>
                <label class="form-label">Notes</label>
                <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${R.notes||"No notes available"}</div>
              </div>
            </div>
          `,actions:[{label:"Close",className:"btn-secondary",onClick:G=>G()},{label:"Open Full Job",className:"btn-primary",onClick:G=>{G(),z.navigate(`/jobs/${w}`)}}],width:450})}),Y.addEventListener("contextmenu",T=>{T.preventDefault(),k();const w=Y.dataset.blockJobId;f=document.createElement("div"),f.className="dropdown-menu",f.style.position="fixed",f.style.top=`${T.clientY}px`,f.style.left=`${T.clientX}px`,f.style.zIndex=1e3,f.style.background="var(--card-bg)",f.style.boxShadow="var(--shadow-md)",f.style.border="1px solid var(--border-color)",f.style.borderRadius="var(--border-radius)",f.style.padding="4px 0",f.style.minWidth="140px",f.innerHTML=`
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `,document.body.appendChild(f),f.querySelector("#ctx-view").addEventListener("click",()=>{k(),z.navigate(`/jobs/${w}`)}),f.querySelector("#ctx-unschedule").addEventListener("click",()=>{k(),jobs.find(G=>G.id===w)&&(m.update("jobs",w,{scheduledDate:null}),L("Job unscheduled","success"),O())})})})}function X(H){const N=document.getElementById("calendar-scroll");N&&(N.addEventListener("dragover",M=>{if(!r)return;const Y=N.getBoundingClientRect(),T=60,w=15;M.clientY-Y.top<T?N.scrollTop-=w:Y.bottom-M.clientY<T&&(N.scrollTop+=w)}),N.addEventListener("wheel",M=>{r&&(N.scrollTop+=M.deltaY)},{passive:!0})),e.querySelectorAll(".unscheduled-job").forEach(M=>{M.addEventListener("dragstart",Y=>{const T=M.getBoundingClientRect();r={type:"unscheduled",jobId:M.dataset.jobId,jobNumber:M.dataset.jobNumber,customerName:M.dataset.customer,title:M.dataset.title,hours:parseInt(M.dataset.hours)||2,offsetY:Y.clientY-T.top},Y.dataTransfer.effectAllowed="move",M.style.opacity="0.5"}),M.addEventListener("dragend",()=>{M.style.opacity="1",r=null,document.querySelectorAll(".schedule-drag-preview").forEach(Y=>Y.remove())})}),e.querySelectorAll(".schedule-block[draggable]").forEach(M=>{M.addEventListener("dragstart",Y=>{Y.stopPropagation();const T=M.getBoundingClientRect();r={type:"existing",blockType:M.dataset.blockType,timesheetId:M.dataset.timesheetId,jobId:M.dataset.blockJobId,startHour:parseFloat(M.dataset.start),endHour:parseFloat(M.dataset.end),offsetY:Y.clientY-T.top},Y.dataTransfer.effectAllowed="move",M.style.opacity="0.4"}),M.addEventListener("dragend",()=>{M.style.opacity="1",r=null,document.querySelectorAll(".schedule-drag-preview").forEach(Y=>Y.remove())})}),e.querySelectorAll(".schedule-day-col").forEach(M=>{M.addEventListener("dragover",Y=>{if(Y.preventDefault(),Y.dataTransfer.dropEffect="move",M.style.background="rgba(27, 109, 224, 0.05)",!r)return;const T=M.getBoundingClientRect(),w=r.offsetY||0,G=(Y.clientY-w-T.top)/g,ae=Math.min(23.75,Math.max(0,u(G)));let de=M.querySelector(".schedule-drag-preview");de||(de=document.createElement("div"),de.className="schedule-drag-preview",de.style.position="absolute",de.style.left="3px",de.style.right="3px",de.style.background="rgba(27, 109, 224, 0.15)",de.style.border="2px dashed var(--color-primary)",de.style.borderRadius="4px",de.style.pointerEvents="none",de.style.zIndex="10",M.appendChild(de));const he=r.type==="existing"?r.endHour-r.startHour:r.hours||2,$e=ae*g,ke=Math.max(he*g-2,v);de.style.top=$e+"px",de.style.height=ke+"px"}),M.addEventListener("dragleave",Y=>{if(!M.contains(Y.relatedTarget)){M.style.background="";const T=M.querySelector(".schedule-drag-preview");T&&T.remove()}}),M.addEventListener("drop",Y=>{const T=m.getAll("jobs");Y.preventDefault(),M.style.background="";const w=M.querySelector(".schedule-drag-preview");if(w&&w.remove(),!r)return;const R=M.dataset.tech,G=parseInt(M.dataset.day),ae=M.dataset.date?new Date(M.dataset.date+"T12:00:00"):H[G],de=M.getBoundingClientRect(),he=r.offsetY||0,ke=(Y.clientY-he-de.top)/g,J=Math.min(23.75,Math.max(0,u(ke))),E=s.find(D=>D.id===R),_=T.find(D=>D.id===r.jobId);if(_){const D=r.type==="existing"?r.endHour-r.startHour:r.hours||_.estimatedHours||2,V=J+D;if($().some(le=>le.technicianId===R&&le.dayIdx===G&&(r.timesheetId?le.id!==r.timesheetId:le.jobId!==_.id)&&Math.max(le.startHour,J)<Math.min(le.endHour,V))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){r=null;return}const j=le=>le.toString().padStart(2,"0"),A=`${ae.getFullYear()}-${j(ae.getMonth()+1)}-${j(ae.getDate())}`,P=Math.floor(J),B=Math.round((J-P)*60),re=Math.floor(V),oe=Math.round((V-re)*60),pe=`${A}T${j(P)}:${j(B)}`,ye=`${A}T${j(re)}:${j(oe)}`;r.type==="existing"&&r.blockType==="timesheet"?(m.update("timesheets",r.timesheetId,{technicianId:R,technicianName:(E==null?void 0:E.name)||"",date:A,startTime:pe,finishTime:ye,hours:D}),L(`Moved ${_.number} for ${E==null?void 0:E.name} to ${A}`,"success")):(m.create("timesheets",{jobId:_.id,jobNumber:_.number,technicianId:R,technicianName:(E==null?void 0:E.name)||"",date:A,startTime:pe,finishTime:ye,hours:D,status:"Pending"}),r.type==="unscheduled"&&m.update("jobs",_.id,{scheduledDate:A,startHour:J,status:_.status==="Pending"?"Scheduled":_.status}),L(`Assigned ${_.number} to ${E==null?void 0:E.name}`,"success"))}r=null,O()})})}function Z(){e.querySelectorAll(".schedule-resize-handle").forEach(H=>{H.addEventListener("mousedown",N=>{N.preventDefault(),N.stopPropagation();const M=H.closest(".schedule-block"),Y=M.closest(".schedule-day-col"),T=parseFloat(H.dataset.start),w=parseFloat(H.dataset.end);Y.getBoundingClientRect(),c={blockType:H.dataset.blockType,timesheetId:H.dataset.timesheetId,jobId:H.dataset.blockJobId,block:M,col:Y,startHour:T,endHour:w},M.dataset.resized="false",M.style.opacity="0.85",M.style.userSelect="none",document.body.style.cursor="ns-resize";function R(ae){if(!c)return;const de=c.col.getBoundingClientRect(),$e=(ae.clientY-de.top)/g,ke=u($e),J=c.startHour+.25,E=Math.max(ke,J);if(E!==c.endHour){c.endHour=E,c.block.dataset.resized="true";const _=Math.max((E-c.startHour)*g-2,v);c.block.style.height=_+"px";const D=c.block.querySelector(".schedule-block-time");D&&(D.textContent=`${y(c.startHour)} — ${y(E)}`)}}function G(){if(document.removeEventListener("mousemove",R),document.removeEventListener("mouseup",G),document.body.style.cursor="",!c)return;const{jobId:ae,startHour:de,endHour:he}=c,$e=he-de;if(c.block.style.opacity="",c.block.style.userSelect="",Math.abs(he-w)>=.25)if(c.blockType==="timesheet"){const ke=m.getById("timesheets",c.timesheetId);if(ke){const J=ke.date||ke.startTime.split("T")[0],E=te=>te.toString().padStart(2,"0"),_=Math.floor(de),D=Math.round((de-_)*60),V=Math.floor(he),ee=Math.round((he-V)*60);m.update("timesheets",c.timesheetId,{startTime:`${J}T${E(_)}:${E(D)}`,finishTime:`${J}T${E(V)}:${E(ee)}`,hours:$e}),L(`Time updated to ${y(de)} — ${y(he)}`,"success")}}else{const ke=m.getAll("jobs").find(J=>J.id===ae);if(ke){let J=ke.technicians||[];J.length>0&&(J=J.map(E=>({...E,hours:$e}))),m.update("jobs",ae,{startHour:de,estimatedHours:parseFloat($e.toFixed(4)),technicians:J.length>0?J:ke.technicians}),L("Job time updated","success")}}c=null}document.addEventListener("mousemove",R),document.addEventListener("mouseup",G)})})}function W(){var T;const H=S(),N=["January","February","March","April","May","June","July","August","September","October","November","December"],M=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),Y=m.getAll("activities").filter(w=>w.assignedToId===M.id);e.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${N[i.getMonth()]} ${i.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
             <!-- Spacer -->
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${d==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${d==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${o==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${o==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>
      <div class="card" style="height:calc(100vh - 160px); display:flex; flex-direction:column;">
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;">My Activities</h3>
          <button class="btn btn-primary btn-sm" id="btn-new-activity">New Activity</button>
        </div>
        <div style="flex:1; overflow-y:auto; padding: 15px;">
          ${H.map(w=>{const R=w.toISOString().split("T")[0],G=Y.filter(ae=>ae.date===R);return`
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">${w.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}</h4>
                ${G.length===0?'<p style="color:var(--text-tertiary); font-size: 13px; margin: 0;">No activities.</p>':`
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${G.map(ae=>`
                      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                          <strong style="color:var(--text-primary);">${h(ae.title)}</strong>
                          <span style="font-size:12px; color:var(--text-secondary);">${ae.time?h(ae.time):""}</span>
                        </div>
                        ${ae.linkedTo?`<div style="font-size:12px; color:var(--text-secondary); margin-bottom:5px;">Linked to: ${h(ae.linkedTo)}</div>`:""}
                        ${ae.notes?`<div style="font-size:13px;">${h(ae.notes)}</div>`:""}
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>
            `}).join("")}
        </div>
      </div>
    `,K(),(T=e.querySelector("#btn-new-activity"))==null||T.addEventListener("click",()=>{const w=prompt("Activity Title:");if(!w)return;const R=prompt("Date (YYYY-MM-DD):",new Date().toISOString().split("T")[0]);if(!R)return;const G=prompt("Time (e.g. 10:00 AM):",""),ae=prompt("Linked To (Job/Customer Name):",""),de=prompt("Notes:","");m.create("activities",{title:w,date:R,time:G,linkedTo:ae,notes:de,assignedToId:M.id}),L("Activity added","success"),O()})}O()}function Ge(e){var f;const s=m.getAll("stock");e.innerHTML=`
    <div class="page-header">
      <h1>Stock / Inventory</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-transfer-stock"><span class="material-icons-outlined">swap_horiz</span> Transfer</button>
        <button class="btn btn-primary" id="btn-new-stock"><span class="material-icons-outlined">add</span> New Item</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-left" style="display:flex; gap:15px; align-items:center; flex-wrap:wrap">
        <div class="toolbar-filters">
          <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
          ${[...new Set(s.map(n=>n.category))].map(n=>`<button class="toolbar-filter" data-filter="${n}">${n}</button>`).join("")}
        </div>
        <div class="toolbar-selectors" style="display:flex; gap:10px; align-items:center;">
           <span class="text-tertiary" style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Location:</span>
           <select class="form-select select-sm" id="location-filter" style="width: 180px; height: 32px; font-size: 13px;">
              <option value="all">All Locations</option>
           </select>
        </div>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search stock..." id="stock-search" />
      </div>
    </div>
    <div id="stock-table-container"></div>
  `;const t=e.querySelector("#location-filter"),a=[...new Set(s.map(n=>n.location||"Unassigned"))].sort(),o=a.filter(n=>n.toLowerCase().includes("warehouse")||n==="Main"),d=a.filter(n=>n.toLowerCase().includes("vehicle")||n.toLowerCase().includes("van")||n.toLowerCase().includes("truck")||n.toLowerCase().includes("van stock")),i=a.filter(n=>!o.includes(n)&&!d.includes(n));if(o.length>0){const n=document.createElement("optgroup");n.label="Warehouses",o.forEach(p=>{const g=new Option(p,p);n.appendChild(g)}),t.appendChild(n)}if(d.length>0){const n=document.createElement("optgroup");n.label="Vehicles / Vans",d.forEach(p=>{const g=new Option(p,p);n.appendChild(g)}),t.appendChild(n)}if(i.length>0){const n=document.createElement("optgroup");n.label="Other",i.forEach(p=>{const g=new Option(p,p);n.appendChild(g)}),t.appendChild(n)}let l={category:"all",location:"all",search:""};function r(){const n=l.search.toLowerCase(),p=s.filter(g=>{const v=l.category==="all"||g.category===l.category,u=l.location==="all"||g.location===l.location,y=!n||g.name.toLowerCase().includes(n)||g.sku.toLowerCase().includes(n)||g.category.toLowerCase().includes(n)||g.location&&g.location.toLowerCase().includes(n);return v&&u&&y});b.updateData(p)}const b=ze({columns:[{key:"name",label:"Item Name",render:n=>`<span class="cell-link font-medium">${h(n.name)}</span>`},{key:"sku",label:"SKU",render:n=>`<span class="text-secondary" style="font-family:monospace">${h(n.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:n=>`<span class="badge badge-neutral">${h(n.category)}</span>`,width:"110px"},{key:"quantity",label:"Qty",render:n=>{const p=n.quantity<=n.reorderLevel;return`<span style="font-weight:600;color:${p?"var(--color-danger)":"var(--text-primary)"}">${n.quantity}</span>${p?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:n=>n.quantity,width:"100px"},{key:"unitPrice",label:"Unit Price",render:n=>`$${n.unitPrice.toFixed(2)}`,getValue:n=>n.unitPrice,width:"100px"},{key:"location",label:"Location",render:n=>{var g,v;return`<div style="display:flex; align-items:center; gap:4px">
        <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary)">${((g=n.location)==null?void 0:g.toLowerCase().includes("vehicle"))||((v=n.location)==null?void 0:v.toLowerCase().includes("van"))?"local_shipping":"warehouse"}</span>
        <span class="text-secondary">${h(n.location)}</span>
      </div>`},width:"160px"},{key:"supplier",label:"Supplier",render:n=>`<span class="text-secondary">${h(n.supplier)}</span>`}],data:s,onRowClick:n=>z.navigate(`/stock/${n}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:n=>{Re({container:e,selectedIds:n,onClear:()=>b.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:p=>{const g=[...new Set(m.getAll("stock").map(u=>u.category))],v=document.createElement("div");v.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${g.map(u=>`<option value="${h(u)}">${h(u)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,v.querySelector("#bulk-category").addEventListener("change",u=>{v.querySelector("#new-cat-field").style.display=u.target.value==="NEW"?"block":"none"}),fe({title:`Update ${p.length} Items`,content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{let y=v.querySelector("#bulk-category").value;y==="NEW"&&(y=v.querySelector("#bulk-new-category").value.trim()),y&&(p.forEach(x=>m.update("stock",x,{category:y})),b.clearSelection(),Ge(e),L(`Updated ${p.length} items to category: ${y}`,"success"),u())}}]})}},{label:"Adjust Price",icon:"payments",onClick:p=>{const g=document.createElement("div");g.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,fe({title:`Adjust Price for ${p.length} Items`,content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Apply",className:"btn-primary",onClick:v=>{const u=parseFloat(g.querySelector("#bulk-price-adjust").value);if(isNaN(u))return;const y=1+u/100;p.forEach(x=>{const C=m.getById("stock",x);C&&m.update("stock",x,{unitPrice:C.unitPrice*y})}),b.clearSelection(),Ge(e),L(`Adjusted prices for ${p.length} items by ${u}%`,"success"),v()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:p=>{fe({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${p.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Delete",className:"btn-danger",onClick:g=>{p.forEach(v=>m.delete("stock",v)),b.clearSelection(),Ge(e),L(`Deleted ${p.length} stock items`,"success"),g()}}]})}}]})}});e.querySelector("#stock-table-container").appendChild(b),e.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(p=>p.classList.remove("active")),n.classList.add("active"),l.category=n.dataset.filter,r()})}),e.querySelector("#location-filter").addEventListener("change",n=>{l.location=n.target.value,r()}),e.querySelector("#stock-search").addEventListener("input",n=>{l.search=n.target.value,r()}),e.querySelector("#btn-new-stock").addEventListener("click",()=>{const n=m.getAll("technicians"),p=document.createElement("div");p.innerHTML=`
      <div class="form-group">
        <label class="form-label">Item Name *</label>
        <input type="text" class="form-input" id="new-stock-name" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <input type="text" class="form-input" id="new-stock-category" />
        </div>
        <div class="form-group">
          <label class="form-label">Initial Location</label>
          <select class="form-select" id="new-stock-location">
            <option value="Main Warehouse">Main Warehouse</option>
            <optgroup label="Warehouses">
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </optgroup>
            <optgroup label="Vehicles">
              ${n.map(g=>`<option value="Vehicle - ${h(g.name)}">Vehicle - ${h(g.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Cost Price ($) *</label>
        <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
      </div>
    `,He({title:"New Stock Item",content:p.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Create",className:"btn-primary",onClick:g=>{const v=document.querySelector(".drawer-overlay"),u=v.querySelector("#new-stock-name").value.trim(),y=v.querySelector("#new-stock-category").value.trim()||"Uncategorized",x=v.querySelector("#new-stock-location").value,C=parseFloat(v.querySelector("#new-stock-cost").value);if(!u||isNaN(C)){L("Please fill all required fields correctly","error");return}m.create("stock",{name:u,sku:"SKU-"+Date.now().toString().slice(-6),category:y,quantity:0,unitPrice:C*1.5,costPrice:C,location:x,supplier:"Unknown"}),L("Stock item created","success"),Ge(e),g()}}]})}),(f=e.querySelector("#btn-transfer-stock"))==null||f.addEventListener("click",()=>{const n=m.getAll("stock"),p=m.getAll("technicians");if(n.length===0){L("No stock items available to transfer","error");return}const g=document.createElement("div");g.innerHTML=`
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${n.map(v=>`<option value="${h(v.id)}">${h(v.name)} (Qty: ${v.quantity}) - ${h(v.location)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select location...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              ${p.map(v=>`<option value="Vehicle - ${h(v.name)}">Vehicle - ${h(v.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" />
          </div>
        </div>
      `,He({title:"Transfer Stock",content:g.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Transfer",className:"btn-primary",onClick:v=>{const u=document.querySelector(".drawer-overlay"),y=u.querySelector("#transfer-item").value,x=u.querySelector("#transfer-to").value,C=parseInt(u.querySelector("#transfer-qty").value)||0;if(!y||!x||C<=0){L("Please fill all fields correctly","error");return}const k=m.getById("stock",y);if(k.quantity<C){L("Insufficient quantity available","error");return}if(k.location===x){L("Cannot transfer to the same location","error");return}m.update("stock",k.id,{quantity:k.quantity-C});const S=n.find($=>$.sku===k.sku&&$.location===x);if(S)m.update("stock",S.id,{quantity:S.quantity+C});else{const $={...k,id:void 0,quantity:C,location:x};m.create("stock",$)}L("Stock transferred successfully","success"),Ge(e),v()}}]})})}function ta(e,{id:s}){const t=m.getById("stock",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}Ve(t.name);const a=t.quantity<=t.reorderLevel,o=t.unitPrice>0?((t.unitPrice-t.costPrice)/t.unitPrice*100).toFixed(1):0;e.innerHTML=`
    ${Ze({title:t.name,icon:"inventory_2",iconBgColor:a?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:a?"var(--color-danger)":"var(--color-success)",metaHtml:`
        <span style="font-family:monospace">${t.sku}</span>
        <span class="badge badge-neutral">${t.category}</span>
        ${a?'<span class="badge badge-danger">LOW STOCK</span>':'<span class="badge badge-success">IN STOCK</span>'}
      `,actionsHtml:`
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `})}

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Current Stock</div>
        <div class="stat-value" style="color:${a?"var(--color-danger)":"var(--text-primary)"}">${t.quantity}</div>
        <div class="text-sm text-secondary">Reorder at ${t.reorderLevel} ${t.unit}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unit Price</div>
        <div class="stat-value">$${t.unitPrice.toFixed(2)}</div>
        <div class="text-sm text-secondary">Cost: $${t.costPrice.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profit Margin</div>
        <div class="stat-value">${o}%</div>
        <div class="text-sm text-secondary">Stock value: $${(t.quantity*t.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Item Details</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${_e("Name",t.name)}
            ${_e("SKU",t.sku)}
            ${_e("Category",t.category)}
            ${_e("Unit",t.unit)}
            ${_e("Supplier",t.supplier)}
            ${_e("Location",t.location)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Pricing</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${_e("Cost Price",`$${t.costPrice.toFixed(2)}`)}
            ${_e("Sell Price",`$${t.unitPrice.toFixed(2)}`)}
            ${_e("Margin",`${o}%`)}
            ${_e("Total Value",`$${(t.quantity*t.unitPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit-stock").addEventListener("click",()=>z.navigate(`/stock/${s}/edit`)),e.querySelector("#btn-delete-stock").addEventListener("click",()=>{const d=document.createElement("div");d.innerHTML=`<p>Delete <strong>${h(t.name)}</strong>?</p>`,fe({title:"Delete Stock Item",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{m.delete("stock",s),L("Item deleted","success"),i(),z.navigate("/stock")}}]})})}function _e(e,s){return`<div style="display:flex;gap:8px"><span style="width:100px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function Xt(e,{id:s}){const t=s&&s!=="new",a=t?m.getById("stock",s):{},o=m.getAll("assets");e.innerHTML=`
    <div class="page-header"><h1>${t?"Edit Stock Item":"New Stock Item"}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="stock-form">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input class="form-input" name="name" value="${a.name||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">SKU</label>
              <input class="form-input" name="sku" value="${a.sku||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="category">
                ${["Electrical","Plumbing","HVAC","Fire Safety","Security","General"].map(d=>`<option ${a.category===d?"selected":""}>${d}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Unit</label>
              <input class="form-input" name="unit" value="${a.unit||"each"}" />
            </div>
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input class="form-input" type="number" name="quantity" value="${a.quantity??""}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cost Price ($)</label>
              <input class="form-input" type="number" name="costPrice" value="${a.costPrice||""}" step="0.01" />
            </div>
            <div class="form-group">
              <label class="form-label">Sell Price ($)</label>
              <input class="form-input" type="number" name="unitPrice" value="${a.unitPrice||""}" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Reorder Level</label>
              <input class="form-input" type="number" name="reorderLevel" value="${a.reorderLevel||"10"}" />
            </div>
            <div class="form-group">
              <label class="form-label">Supplier</label>
              <input class="form-input" name="supplier" value="${a.supplier||""}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <select class="form-select" name="location">
              <option value="Main Warehouse" ${a.location==="Main Warehouse"?"selected":""}>Main Warehouse</option>
              <optgroup label="Warehouses">
                ${["Warehouse A","Warehouse B"].map(d=>`<option ${a.location===d?"selected":""}>${d}</option>`).join("")}
              </optgroup>
              <optgroup label="Vehicles">
                ${m.getAll("technicians").map(d=>{const i=`Vehicle - ${d.name}`;return`<option value="${i}" ${a.location===i?"selected":""}>${i}</option>`}).join("")}
              </optgroup>
              <optgroup label="Assets">
                ${o.map(d=>`<option value="${d.name}" ${a.location===d.name?"selected":""}>${d.name}</option>`).join("")}
              </optgroup>
              <option value="On Order" ${a.location==="On Order"?"selected":""}>On Order</option>
            </select>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Item</button>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>z.navigate(t?`/stock/${s}`:"/stock")),e.querySelector("#btn-save").addEventListener("click",()=>{const d=e.querySelector("#stock-form");if(!d.checkValidity()){d.reportValidity();return}const i=Object.fromEntries(new FormData(d));if(i.quantity=parseInt(i.quantity)||0,i.costPrice=parseFloat(i.costPrice)||0,i.unitPrice=parseFloat(i.unitPrice)||0,i.reorderLevel=parseInt(i.reorderLevel)||10,t)m.update("stock",s,i),L("Item updated","success"),jt(i),z.navigate(`/stock/${s}`);else{i.sku=i.sku||`SKU-${Date.now().toString().slice(-4)}`;const l=m.create("stock",i);L("Item created","success"),jt(i),z.navigate(`/stock/${l.id}`)}})}function jt(e){if(e.quantity<=e.reorderLevel){const s=JSON.parse(sessionStorage.getItem("currentUser")||"{}");let t=!1;if(s.role==="admin")t=!0;else if(s.userTypeId){const a=m.getById("userTypes",s.userTypeId);if(a&&a.permissions){const o=a.permissions.find(d=>d.module==="Stock");o&&(t=o.edit||o.create)}}t&&(ce(async()=>{const{showToast:a}=await Promise.resolve().then(()=>Ce);return{showToast:a}},void 0).then(({showToast:a})=>{a(`Auto-Reorder Alert: ${e.name} is at or below its reorder level (${e.quantity} left).`,"warning")}),m.create("notifications",{title:"Stock Auto-Reorder",message:`${e.name} (SKU: ${e.sku}) has reached its reorder level. Current quantity: ${e.quantity}. Please reorder from ${e.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function pt(e){const s=m.getAll("invoices");e.innerHTML=`
    <div class="page-header">
      <h1>Invoices</h1>
      <div class="page-header-actions">
        <button class="btn btn-outline" id="btn-export-accounting" style="display:none;"><span class="material-icons-outlined">download</span> Export to Accounting</button>
        <button class="btn btn-primary" id="btn-new-invoice"><span class="material-icons-outlined">add</span> New Invoice</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        <button class="toolbar-filter" data-filter="Draft">Draft</button>
        <button class="toolbar-filter" data-filter="Sent">Sent</button>
        <button class="toolbar-filter" data-filter="Paid">Paid</button>
        <button class="toolbar-filter" data-filter="Overdue">Overdue</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search invoices..." id="invoices-search" />
      </div>
    </div>
    <div id="invoices-table-container"></div>
  `;let t=[...s];const a={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},d=ze({columns:[{key:"number",label:"Invoice #",render:r=>`<span class="cell-link font-medium">${h(r.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:r=>r.jobNumber?`<span class="text-secondary">${h(r.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:r=>`<span class="badge ${a[r.status]||"badge-neutral"}">${h(r.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:r=>`<span class="font-semibold">$${(r.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:r=>r.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:r=>r.issueDate?new Date(r.issueDate).toLocaleDateString():"—",getValue:r=>r.issueDate?new Date(r.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():"—",getValue:r=>r.dueDate?new Date(r.dueDate).getTime():0,width:"100px"}],data:t,onRowClick:r=>z.navigate(`/invoices/${r}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:r=>{Re({container:e,selectedIds:r,onClear:()=>d.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:c=>{c.forEach(b=>m.update("invoices",b,{status:"Paid",datePaid:new Date().toISOString()})),d.clearSelection(),pt(e),ce(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ce);return{showToast:b}},void 0).then(({showToast:b})=>b(`Marked ${c.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:c=>{const b=document.createElement("div");b.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:f}=await Promise.resolve().then(()=>qe);return{showModal:f}},void 0).then(({showModal:f})=>{f({title:`Update ${c.length} Invoices`,content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Apply",className:"btn-primary",onClick:n=>{const p=b.querySelector("#bulk-status").value;c.forEach(g=>m.update("invoices",g,{status:p})),d.clearSelection(),pt(e),ce(async()=>{const{showToast:g}=await Promise.resolve().then(()=>Ce);return{showToast:g}},void 0).then(({showToast:g})=>g(`Updated ${c.length} invoices to ${p}`,"success")),n()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:c=>{ce(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ce);return{showToast:b}},void 0).then(({showToast:b})=>b(`Sending reminders for ${c.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:c=>{ce(async()=>{const{showModal:b}=await Promise.resolve().then(()=>qe);return{showModal:b}},void 0).then(({showModal:b})=>{const f=document.createElement("div");f.innerHTML=`<p>Are you sure you want to delete ${c.length} invoices? This action cannot be undone.</p>`,b({title:"Confirm Bulk Delete",content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{c.forEach(p=>m.delete("invoices",p)),d.clearSelection(),pt(e),ce(async()=>{const{showToast:p}=await Promise.resolve().then(()=>Ce);return{showToast:p}},void 0).then(({showToast:p})=>p(`Deleted ${c.length} invoices`,"success")),n()}}]})})}}]})}});e.querySelector("#invoices-table-container").appendChild(d),e.querySelector("#btn-new-invoice").addEventListener("click",()=>z.navigate("/invoices/new"));const i=e.querySelector("#btn-export-accounting");function l(r){r.some(c=>c.status==="Paid")?i.style.display="inline-flex":i.style.display="none"}l(t),e.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(b=>b.classList.remove("active")),r.classList.add("active");const c=r.dataset.filter;t=c==="all"?[...s]:s.filter(b=>b.status===c),d.updateData(t),l(t)})}),i.addEventListener("click",()=>{const r=t.filter(n=>n.status==="Paid");if(r.length===0)return;let c="data:text/csv;charset=utf-8,";c+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,r.forEach(n=>{const p=[n.number,`"${n.customerName.replace(/"/g,'""')}"`,n.email||"",n.issueDate?n.issueDate.split("T")[0]:"",n.dueDate?n.dueDate.split("T")[0]:"",(n.total||0).toFixed(2),(n.tax||0).toFixed(2),"200"].join(",");c+=p+`
`});const b=encodeURI(c),f=document.createElement("a");f.setAttribute("href",b),f.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(f),f.click(),document.body.removeChild(f),ce(async()=>{const{showToast:n}=await Promise.resolve().then(()=>Ce);return{showToast:n}},void 0).then(({showToast:n})=>{n(`Exported ${r.length} paid invoices`,"success")})}),e.querySelector("#invoices-search").addEventListener("input",r=>{const c=r.target.value.toLowerCase();t=s.filter(b=>b.number.toLowerCase().includes(c)||b.customerName.toLowerCase().includes(c)||(b.jobNumber||"").toLowerCase().includes(c)),d.updateData(t),l(t)})}function Zt(e,{id:s}){const t=s==="new";let a=t?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",sections:[{id:m.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:m.getById("invoices",s);if(!a){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}a.lineItems&&!a.sections&&(a.sections=[{id:m.generateId(),name:"Main Phase",lineItems:[...a.lineItems]}],delete a.lineItems),t||Ve(a.number);const o=m.getAll("customers"),d=m.getAll("stock"),i=m.getSettings(),l={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function r(){e.innerHTML=`
      ${Ze({title:`
          ${t?"New Invoice":a.number}
          ${a.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':a.invoiceType&&a.invoiceType!=="Standard"?`<span class="badge badge-primary">${a.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${a.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${a.customerName}</span>`:""}
          ${a.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${a.jobNumber}</span>`:""}
          <span class="badge ${l[a.status]||"badge-neutral"}">${a.status}</span>
        `,actionsHtml:`
          ${t?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!t&&a.status==="Draft"?'<button class="btn btn-primary" id="btn-send-invoice"><span class="material-icons-outlined">send</span> Send</button>':""}
          ${!t&&(a.status==="Sent"||a.status==="Overdue")?'<button class="btn btn-secondary" id="btn-send-reminder"><span class="material-icons-outlined">notifications</span> Reminder</button>':""}
          ${!t&&(a.status==="Sent"||a.status==="Overdue")?'<button class="btn btn-primary" id="btn-mark-paid"><span class="material-icons-outlined">check_circle</span> Mark Paid</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                <a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import from Quote</a>
                ${t?"":'<a href="#" class="dropdown-item" id="btn-delete-invoice" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Invoice</a>'}
             </div>
          </div>
        `})}

      <!-- Invoice Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Invoice Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="inv-customer">
                <option value="">Select customer...</option>
                ${o.map(p=>`<option value="${p.id}" ${a.customerId===p.id?"selected":""}>${p.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${i.laborRates.map(p=>`<option value="${p.id}" ${a.laborProfileId===p.id?"selected":""}>${p.name} ($${p.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(p=>`<option ${a.invoiceType===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input class="form-input" type="date" id="inv-issue" value="${a.issueDate?a.issueDate.split("T")[0]:""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" id="inv-due" value="${a.dueDate?a.dueDate.split("T")[0]:""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inv-status">
                ${["Draft","Sent","Paid","Overdue","Void"].map(p=>`<option ${a.status===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${d.map(p=>`<option value="${p.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(a.sections||[]).map((p,g)=>c(p,g)).join("")}
      </div>

      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>

      <!-- Totals & Margin Analysis -->
      <div style="display:flex; justify-content:flex-end; gap:var(--space-lg); margin-bottom:var(--space-lg); align-items:flex-start">
        <!-- Staff Margin Analysis -->
        <div class="card" style="width:300px; border:1px dashed var(--border-color); background:var(--bg-color)">
          <div class="card-header" style="padding:10px 16px; border-bottom:1px dashed var(--border-color)">
            <h5 style="margin:0; font-size:13px; color:var(--text-secondary)">Margin Analysis</h5>
          </div>
          <div class="card-body" style="padding:12px 16px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
              <span class="text-secondary">Actual Cost</span>
              <span>$${(a.totalInternalCost||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px; font-weight:600; color:${a.subtotal-(a.totalInternalCost||0)>=0?"var(--color-success)":"var(--color-danger)"}">
              <span>Invoice Margin</span>
              <span>$${(a.subtotal-(a.totalInternalCost||0)).toFixed(2)} (${a.subtotal>0?Math.round((a.subtotal-a.totalInternalCost)/a.subtotal*100):0}%)</span>
            </div>
          </div>
        </div>

        <!-- Invoice Totals -->
        <div class="card" style="width:360px">
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">Subtotal</span>
              <span id="inv-subtotal">$${(a.subtotal||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">GST (10%)</span>
              <span id="inv-tax">$${(a.tax||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
              <span>Total</span>
              <span id="inv-total">$${(a.total||0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-inv">Cancel</button>
        <button class="btn btn-primary" id="btn-save-inv"><span class="material-icons-outlined">save</span> Save Invoice</button>
      </div>
    `,n()}function c(p,g){return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${g}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${p.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(p.subtotal||0).toFixed(2)}</span>
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${g}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${g}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width:100px">Type</th>
                <th style="width:80px">Qty</th>
                <th style="width:100px">Rate</th>
                <th style="width:110px">Total</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody>
              ${(p.lineItems||[]).map((v,u)=>b(v,g,u)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function b(p,g,v){return`
      <tr data-sidx="${g}" data-index="${v}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${p.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${p.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${p.type==="material"?"selected":""}>Material</option>
          <option value="other" ${p.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${p.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${p.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(p.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${g}" data-index="${v}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function f(){a.subtotal=0,a.totalInternalCost=0;let p=0;m.getSettings().laborRates.find(v=>v.id===a.laborProfileId),(a.sections||[]).forEach(v=>{v.subtotal=0,(v.lineItems||[]).forEach(u=>{u.total=(u.qty||0)*(u.rate||0),u.type==="labor"&&(p+=u.total),u.internalCost||(u.type==="labor"?u.internalCost=45:u.internalCost=u.rate*.7),a.totalInternalCost+=(u.qty||0)*(u.internalCost||0),v.subtotal+=u.total}),a.subtotal+=v.subtotal}),a.invoiceType==="CreditNote"?a.subtotal=-Math.abs(a.subtotal):a.subtotal=Math.abs(a.subtotal),a.tax=a.subtotal*.1,a.total=a.subtotal+a.tax,r()}function n(){var g,v,u,y,x,C,k,S;(g=e.querySelector("#btn-preview-pdf"))==null||g.addEventListener("click",()=>{Gt({type:"invoice",data:a})});const p=e.querySelector(".dropdown > .btn");p&&(p.addEventListener("click",$=>{$.stopPropagation();const I=p.nextElementSibling;I.style.display=I.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const $=e.querySelector(".dropdown-menu");$&&($.style.display="none")})),(v=e.querySelector("#inv-labor-profile"))==null||v.addEventListener("change",$=>{a.laborProfileId=$.target.value;const I=i.laborRates.find(O=>O.id===a.laborProfileId);I&&(a.sections.forEach(O=>{O.lineItems.forEach(q=>{q.type==="labor"&&(q.rate=I.rate)})}),f())}),(u=e.querySelector("#btn-add-section"))==null||u.addEventListener("click",()=>{a.sections.push({id:m.generateId(),name:"New Phase",lineItems:[]}),f()}),e.querySelectorAll(".section-name-input").forEach(($,I)=>{$.addEventListener("change",()=>{a.sections[I].name=$.value})}),e.querySelectorAll(".btn-add-line").forEach($=>{$.addEventListener("click",()=>{const I=parseInt($.dataset.sidx);a.sections[I].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),r()})}),e.querySelectorAll(".btn-remove-section").forEach($=>{$.addEventListener("click",()=>{const I=parseInt($.dataset.sidx);confirm("Remove this entire phase?")&&(a.sections.splice(I,1),f())})}),e.querySelectorAll(".item-input").forEach($=>{$.addEventListener("change",()=>{const I=$.closest("tr"),O=parseInt(I.dataset.sidx),q=parseInt(I.dataset.index),F=$.dataset.field;let K=$.value;if((F==="qty"||F==="rate")&&(K=parseFloat(K)||0),a.sections[O].lineItems[q][F]=K,F==="description"){const X=d.find(Z=>Z.name===K);if(X){const Z=(X.category||"").toLowerCase().includes("labor");let W=0,H=0;if(Z)W=X.unitPrice||85,H=X.costPrice||45;else{const N=X.costPrice||X.unitPrice||0;H=N,W=ft(N,i)}a.sections[O].lineItems[q].type=Z?"labor":"material",a.sections[O].lineItems[q].rate=W,a.sections[O].lineItems[q].internalCost=H}}f()})}),e.querySelectorAll(".btn-remove-line").forEach($=>{$.addEventListener("click",()=>{const I=parseInt($.dataset.sidx),O=parseInt($.dataset.index);a.sections[I].lineItems.splice(O,1),f()})}),(y=e.querySelector("#btn-save-inv"))==null||y.addEventListener("click",()=>{const $=e.querySelector("#inv-customer").value,I=o.find(O=>O.id===$);if(a.customerId=$,a.customerName=(I==null?void 0:I.company)||"",a.status=e.querySelector("#inv-status").value,a.issueDate=e.querySelector("#inv-issue").value,a.dueDate=e.querySelector("#inv-due").value,a.invoiceType=e.querySelector("#inv-type").value,f(),t){const O=m.create("invoices",a);L("Invoice created","success"),z.navigate(`/invoices/${O.id}`)}else m.update("invoices",s,a),L("Invoice saved","success"),r()}),(x=e.querySelector("#btn-send-invoice"))==null||x.addEventListener("click",()=>{m.update("invoices",s,{status:"Sent"}),a.status="Sent",L("Invoice sent to customer","success"),r()}),(C=e.querySelector("#btn-mark-paid"))==null||C.addEventListener("click",()=>{const $=document.createElement("div");$.innerHTML=`
        <div class="form-group">
          <label class="form-label">Date Paid</label>
          <input type="date" class="form-input" id="paid-date" value="${new Date().toISOString().split("T")[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-select" id="paid-method">
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      `,He({title:"Mark Invoice as Paid",content:$.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Confirm Payment",className:"btn-primary",onClick:I=>{const O=document.querySelector(".drawer-overlay"),q=O.querySelector("#paid-date").value,F=O.querySelector("#paid-method").value;m.update("invoices",s,{status:"Paid",paidDate:q,paymentMethod:F}),a.status="Paid",a.paidDate=q,a.paymentMethod=F,L("Invoice marked as paid","success"),r(),I()}}],width:350})}),(k=e.querySelector("#btn-delete-invoice"))==null||k.addEventListener("click",()=>{const $=document.createElement("div");$.innerHTML=`<p>Delete invoice <strong>${h(a.number)}</strong>?</p>`,fe({title:"Delete Invoice",content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Delete",className:"btn-danger",onClick:I=>{m.delete("invoices",s),L("Invoice deleted","success"),I(),z.navigate("/invoices")}}]})}),(S=e.querySelector("#btn-cancel-inv"))==null||S.addEventListener("click",()=>z.navigate("/invoices"))}r()}function Ye(e){const s=m.getAll("purchaseOrders");e.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(d=>`<button class="toolbar-filter" data-filter="${d}">${d}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let t=[...s];const o=ze({columns:[{key:"number",label:"PO Number",render:d=>`<span class="cell-link font-medium">${h(d.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:d=>`<span class="text-secondary">${h(d.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:d=>d.jobId?`<a href="#/jobs/${d.jobId}" class="cell-link">${h(d.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:d=>d.issueDate?new Date(d.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:d=>`$${(d.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:d=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[d.status]||"badge-neutral"}">${h(d.status)}</span>`,width:"110px"}],data:t,onRowClick:d=>Pt({id:d,onSave:()=>Ye(e)}),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:d=>{Re({container:e,selectedIds:d,onClear:()=>o.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:i=>{i.forEach(l=>m.update("purchaseOrders",l,{status:"Received",receivedDate:new Date().toISOString()})),o.clearSelection(),Ye(e),ce(async()=>{const{showToast:l}=await Promise.resolve().then(()=>Ce);return{showToast:l}},void 0).then(({showToast:l})=>l(`Marked ${i.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:i=>{const l=document.createElement("div");l.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:r}=await Promise.resolve().then(()=>qe);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:`Update ${i.length} Purchase Orders`,content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Apply",className:"btn-primary",onClick:c=>{const b=l.querySelector("#bulk-status").value;i.forEach(f=>m.update("purchaseOrders",f,{status:b})),o.clearSelection(),Ye(e),ce(async()=>{const{showToast:f}=await Promise.resolve().then(()=>Ce);return{showToast:f}},void 0).then(({showToast:f})=>f(`Updated ${i.length} POs to ${b}`,"success")),c()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:i=>{ce(async()=>{const{showModal:l}=await Promise.resolve().then(()=>qe);return{showModal:l}},void 0).then(({showModal:l})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${i.length} purchase orders? This action cannot be undone.</p>`,l({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Delete",className:"btn-danger",onClick:c=>{i.forEach(b=>m.delete("purchaseOrders",b)),o.clearSelection(),Ye(e),ce(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ce);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deleted ${i.length} purchase orders`,"success")),c()}}]})})}}]})}});e.querySelector("#po-table-container").appendChild(o),e.querySelector("#btn-new-po").addEventListener("click",()=>{Pt({onSave:()=>Ye(e)})}),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(l=>l.classList.remove("active")),d.classList.add("active");const i=d.dataset.filter;t=i==="all"?[...s]:s.filter(l=>l.status===i),o.updateData(t)})}),e.querySelector("#po-search").addEventListener("input",d=>{const i=d.target.value.toLowerCase();t=s.filter(l=>{var r,c,b;return((r=l.number)==null?void 0:r.toLowerCase().includes(i))||((c=l.supplierName)==null?void 0:c.toLowerCase().includes(i))||((b=l.jobNumber)==null?void 0:b.toLowerCase().includes(i))}),o.updateData(t)})}function sa(e,{id:s,jobId:t}){const a=s==="new";let o=a?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:t||"",jobNumber:""}:m.getById("purchaseOrders",s);if(!o){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(a&&t){const n=m.getById("jobs",t);n&&(o.jobNumber=n.number)}Ve(o.number||"New PO");const d=m.getAll("stock"),i=m.getAll("jobs"),l=[...new Set(d.map(n=>n.supplier).filter(Boolean))];l.length===0&&l.push("General Supplier");function r(){e.innerHTML=`
      ${Ze({title:o.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${o.status==="Draft"?"badge-neutral":o.status==="Issued"?"badge-primary":o.status==="Received"?"badge-success":"badge-danger"}">${o.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!a&&o.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!a&&o.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${o.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${l.map(n=>`<option value="${n}" ${o.supplierName===n?"selected":""}>${n}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${o.issueDate?o.issueDate.split("T")[0]:""}" ${o.status!=="Draft"?"disabled":""} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${o.status!=="Draft"?"disabled":""}>
                    <option value="">None</option>
                    ${i.map(n=>`<option value="${n.id}" ${o.jobId===n.id?"selected":""}>${n.number} - ${n.title}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${o.status!=="Draft"?"disabled":""}>${o.notes||""}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${o.status==="Draft"?'<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>':""}
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:40%">Item Name / Description</th>
                  <th style="width:15%">SKU</th>
                  <th style="width:15%;text-align:right">Unit Cost</th>
                  <th style="width:15%;text-align:right">Quantity</th>
                  <th style="width:15%;text-align:right">Total</th>
                  ${o.status==="Draft"?'<th style="width:5%"></th>':""}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${o.lineItems.length===0?'<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>':""}
                ${o.lineItems.map((n,p)=>`
                  <tr data-index="${p}">
                    <td>
                      ${o.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${d.map(g=>`<option value="${g.id}" ${n.stockId===g.id?"selected":""}>${g.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${n.stockId?"display:none":""}" value="${n.description||""}" placeholder="Description" />
                      `:`<div>${n.description}</div>`}
                    </td>
                    <td>
                      ${o.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${n.sku||""}" ${n.stockId?"disabled":""} />`:n.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${o.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${n.unitCost||0}" step="0.01" />`:`$${(n.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${o.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${n.quantity||1}" min="1" step="1" />`:n.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((n.unitCost||0)*(n.quantity||1)).toFixed(2)}
                    </td>
                    ${o.status==="Draft"?`
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>`:""}
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(o.total||0).toFixed(2)}</td>
                  ${o.status==="Draft"?"<td></td>":""}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,b()}function c(){let n=0;e.querySelectorAll("#line-items-body tr[data-index]").forEach(g=>{const v=parseFloat(g.querySelector(".item-cost").value)||0,u=parseFloat(g.querySelector(".item-qty").value)||0,y=v*u;g.querySelector(".item-total").textContent="$"+y.toFixed(2),n+=y}),o.total=n;const p=e.querySelector("#po-total");p&&(p.textContent="$"+n.toFixed(2))}function b(){var n,p,g,v;e.querySelector("#btn-cancel").addEventListener("click",()=>z.navigate("/purchase-orders")),(n=e.querySelector("#btn-save"))==null||n.addEventListener("click",()=>{f()}),(p=e.querySelector("#btn-issue"))==null||p.addEventListener("click",()=>{if(o.lineItems.length===0){L("Cannot issue a PO with no items","error");return}f("Issued")}),(g=e.querySelector("#btn-receive"))==null||g.addEventListener("click",()=>{let u=0;o.lineItems.forEach(y=>{if(y.stockId){const x=m.getById("stock",y.stockId);x&&(m.update("stock",x.id,{quantity:(x.quantity||0)+y.quantity}),u++)}}),L(`Received ${u} items into stock.`,"success"),o.status="Received",m.update("purchaseOrders",o.id,{status:"Received"}),r()}),(v=e.querySelector("#btn-add-item"))==null||v.addEventListener("click",()=>{o.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),r()}),e.querySelectorAll(".item-select").forEach((u,y)=>{u.addEventListener("change",x=>{const C=x.target.value,k=x.target.closest("tr"),S=k.querySelector(".item-desc"),$=k.querySelector(".item-sku"),I=k.querySelector(".item-cost");if(C){const O=m.getById("stock",C);O&&(S.style.display="none",S.value=O.name,$.value=O.sku,$.disabled=!0,I.value=O.costPrice||O.unitPrice)}else S.style.display="block",S.value="",$.value="",$.disabled=!1,I.value=0;c()})}),e.querySelectorAll(".item-cost, .item-qty").forEach(u=>{u.addEventListener("input",c)}),e.querySelectorAll(".btn-remove-item").forEach(u=>{u.addEventListener("click",y=>{const x=y.target.closest("tr"),C=parseInt(x.dataset.index);o.lineItems.splice(C,1),r()})})}function f(n=null){if(o.status!=="Draft"){L("Cannot modify an issued or received PO","error");return}const p=e.querySelector("#po-form");if(!p.checkValidity()){p.reportValidity();return}const g=Object.fromEntries(new FormData(p));if(g.jobId){const u=i.find(y=>y.id===g.jobId);g.jobNumber=u?u.number:""}else g.jobNumber="";o.lineItems=Array.from(e.querySelectorAll("#line-items-body tr[data-index]")).map(u=>{const y=u.querySelector(".item-select"),x=y?y.value:"",C=u.querySelector(".item-desc").value,k=x?y.options[y.selectedIndex].text:C;return{stockId:x,description:k,sku:u.querySelector(".item-sku").value,unitCost:parseFloat(u.querySelector(".item-cost").value)||0,quantity:parseInt(u.querySelector(".item-qty").value)||1}}),c();const v={...o,...g,total:o.total,lineItems:o.lineItems,status:n||o.status};if(a){v.number=`PO-${Date.now().toString().slice(-6)}`;const u=m.create("purchaseOrders",v);L(`PO ${n==="Issued"?"issued":"created"} successfully`,"success"),z.navigate(`/purchase-orders/${u.id}`)}else m.update("purchaseOrders",s,v),L(`PO ${n==="Issued"?"issued":"updated"} successfully`,"success"),n==="Issued"&&r()}r()}function aa(e){let s="overview";const t=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function a(){const r=m.getAll("jobs"),c=m.getAll("quotes"),b=m.getAll("invoices"),f=m.getAll("customers"),n=m.getAll("stock"),p=m.getAll("technicians"),g=m.getAll("leads"),v=b.filter(N=>N.status==="Paid").reduce((N,M)=>N+(M.total||0),0),u=b.filter(N=>N.status==="Sent"||N.status==="Overdue").reduce((N,M)=>N+(M.total||0),0),y=r.length>0?r.reduce((N,M)=>N+(M.laborCost||0)+(M.materialCost||0),0)/r.length:0,x=c.length>0?c.filter(N=>N.status==="Accepted").length/c.length*100:0,C=g.length>0?g.filter(N=>N.status==="Won").length/g.length*100:0,k={};r.forEach(N=>{k[N.status]=(k[N.status]||0)+1});const S={};b.forEach(N=>{S[N.status]=(S[N.status]||0)+1});const $=p.map(N=>{const M=r.filter(w=>w.technicianId===N.id),Y=M.filter(w=>w.status==="Completed"||w.status==="Invoiced").length,T=M.reduce((w,R)=>w+(R.laborCost||0)+(R.materialCost||0),0);return{...N,totalJobs:M.length,completed:Y,revenue:T}}),I={};b.filter(N=>N.status==="Paid").forEach(N=>{I[N.customerName]=(I[N.customerName]||0)+(N.total||0)});const O=Object.entries(I).sort((N,M)=>M[1]-N[1]).slice(0,10),q=n.reduce((N,M)=>N+M.quantity*M.costPrice,0),F=n.filter(N=>N.quantity<=N.reorderLevel),K=m.getAll("timesheets"),X={},Z={},W=m.getAll("people"),H={};return W.forEach(N=>{N.payRate&&(H[N.id]=N.payRate)}),K.forEach(N=>{X[N.jobId]=(X[N.jobId]||0)+(N.hours||0);const M=N.payRate||H[N.technicianId]||0;Z[N.jobId]=(Z[N.jobId]||0)+N.hours*M}),{jobs:r,quotes:c,invoices:b,customers:f,stock:n,technicians:p,leads:g,totalRevenue:v,totalOutstanding:u,avgJobValue:y,quoteWinRate:x,leadConvRate:C,jobsByStatus:k,invByStatus:S,techStats:$,topCustomers:O,totalStockValue:q,lowStockItems:F,timesheets:K,hoursByJob:X,internalLaborCostByJob:Z}}function o(){const r=a();e.innerHTML=`
      <div class="page-header">
        <h1>Reports & Analytics</h1>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-csv"><span class="material-icons-outlined">download</span> Export CSV</button>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-lg)">
        <!-- Report Sidebar -->
        <div style="width:220px;flex-shrink:0">
          <div class="card">
            <div class="card-body" style="padding:var(--space-sm)">
              ${t.map(c=>`
                <button class="report-nav-item ${s===c.id?"active":""}" data-report="${c.id}" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${s===c.id?"var(--color-primary-light)":"transparent"};
                  color:${s===c.id?"var(--color-primary)":"var(--text-secondary)"};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${s===c.id?"600":"500"};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${c.icon}</span>
                  ${c.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `,d(r),i(r)}function d(r){const c=e.querySelector("#report-content");switch(s){case"overview":c.innerHTML=oa(r);break;case"revenue":c.innerHTML=na(r);break;case"jobs":c.innerHTML=ia(r);break;case"job_costing":c.innerHTML=la(r);break;case"technicians":c.innerHTML=ra(r);break;case"customers":c.innerHTML=da(r);break;case"inventory":c.innerHTML=ca(r);break;default:c.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function i(r){var c;e.querySelectorAll("[data-report]").forEach(b=>{b.addEventListener("click",()=>{s=b.dataset.report,o()})}),(c=e.querySelector("#btn-export-csv"))==null||c.addEventListener("click",()=>l(r))}function l(r){let c="";if(s==="overview"||s==="revenue")c=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,r.invoices.forEach(p=>{c+=`"${p.number}","${p.customerName}","${p.status}",${p.total||0},"${p.issueDate||""}","${p.dueDate||""}"
`});else if(s==="job_costing"){const p=m.getSettings();c=`Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %
`,r.jobs.filter(v=>v.status==="Completed"||v.status==="Invoiced").map(v=>{const u=r.hoursByJob[v.id]||0,y=r.internalLaborCostByJob[v.id]||v.laborCost||0,x=p.laborRates.find($=>$.id===v.laborRateProfileId)||p.laborRates.find($=>$.isDefault),C=Math.max(u*((x==null?void 0:x.rate)||85),(x==null?void 0:x.minCallOutFee)||0),k=C-y,S=C>0?k/C*100:0;return{num:v.number,tech:v.technicianName||"",actualH:u,actualLabor:y,billableLabor:C,profit:k,margin:S}}).forEach(v=>{c+=`"${v.num}","${v.tech}",${v.actualH},${v.actualLabor.toFixed(2)},${v.billableLabor.toFixed(2)},${v.profit.toFixed(2)},${v.margin.toFixed(1)}%
`})}else s==="jobs"?(c=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,r.jobs.forEach(p=>{c+=`"${p.number}","${p.title}","${p.customerName}","${p.technicianName||""}","${p.status}","${p.priority}",${p.laborCost||0},${p.materialCost||0}
`})):s==="technicians"?(c=`Name,Role,Total Jobs,Completed,Revenue
`,r.techStats.forEach(p=>{c+=`"${p.name}","${p.role}",${p.totalJobs},${p.completed},${p.revenue}
`})):s==="customers"?(c=`Company,First Name,Last Name,Email,Phone,Status
`,r.customers.forEach(p=>{c+=`"${p.company}","${p.firstName}","${p.lastName}","${p.email}","${p.phone}","${p.status}"
`})):s==="inventory"&&(c=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,r.stock.forEach(p=>{c+=`"${p.name}","${p.sku}","${p.category}",${p.quantity},${p.costPrice},${p.unitPrice},"${p.location}","${p.supplier}"
`}));const b=new Blob([c],{type:"text/csv"}),f=URL.createObjectURL(b),n=document.createElement("a");n.href=f,n.download=`simpro_${s}_report.csv`,n.click(),URL.revokeObjectURL(f)}o()}function Ee(e,s,t,a){const o={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${e}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[a]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${o[a]}">${t}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${s}</div>
    </div>
  `}function We(e,s,t){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${t}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${s}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${e}</div>
        </div>
      </div>
    </div>
  `}function lt(e,s={},t="#1B6DE0"){const a=Object.entries(e);if(a.length===0)return'<div class="text-secondary text-sm">No data available</div>';const o=Math.max(...a.map(([,d])=>d));return a.map(([d,i])=>{const l=s[d]||t,r=o>0?i/o*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${d}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${r}%;background:${l};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof i=="number"&&i>=1e3?`$${(i/1e3).toFixed(1)}k`:i}</div>
      </div>
    `}).join("")}function ot(e,s,t,a){const o=t>0?s/t*100:0,d=typeof s=="number"?`$${s.toLocaleString("en-AU",{minimumFractionDigits:0})}`:s;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${e}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${d}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${o}%;background:${a};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function oa(e){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Ee("Total Revenue",`$${e.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${Ee("Outstanding",`$${e.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${Ee("Quote Win Rate",`${e.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${Ee("Lead Conversion",`${e.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${lt(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${lt(e.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
      </div>
    </div>
    <div class="grid-3">
      ${We("Total Jobs",e.jobs.length,"build")}
      ${We("Total Quotes",e.quotes.length,"request_quote")}
      ${We("Total Invoices",e.invoices.length,"receipt_long")}
      ${We("Total Customers",e.customers.length,"people")}
      ${We("Avg Job Value",`$${e.avgJobValue.toFixed(0)}`,"paid")}
      ${We("Stock Items",`${e.stock.length} (${e.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function na(e){const s=e.invoices.filter(i=>i.status==="Paid"),t={};s.forEach(i=>{const l=new Date(i.issueDate||i.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});t[l]=(t[l]||0)+(i.total||0)});const a=e.jobs.reduce((i,l)=>i+(l.materialCost||0),0),o=e.jobs.reduce((i,l)=>i+(l.laborCost||0),0),d=e.totalRevenue-a;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Ee("Gross Revenue",`$${e.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${Ee("Total Labor",`$${o.toFixed(0)}`,"engineering","blue")}
      ${Ee("Material Costs",`$${a.toFixed(0)}`,"inventory_2","orange")}
      ${Ee("Gross Profit",`$${d.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${lt(t,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${ot("Revenue",e.totalRevenue,e.totalRevenue,"#10B981")}
        ${ot("Labor Cost",o,e.totalRevenue,"#3B82F6")}
        ${ot("Material Cost",a,e.totalRevenue,"#F59E0B")}
        ${ot("Gross Profit",d,e.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function ia(e){const s=e.jobs.filter(a=>a.status==="Completed"||a.status==="Invoiced"),t=s.length>0?s.reduce((a,o)=>a+(o.estimatedHours||0),0)/s.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Ee("Total Jobs",e.jobs.length,"build","blue")}
      ${Ee("Completed",s.length,"check_circle","green")}
      ${Ee("In Progress",e.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${Ee("Avg Hours",t.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${lt(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${e.jobs.sort((a,o)=>(o.laborCost||0)+(o.materialCost||0)-((a.laborCost||0)+(a.materialCost||0))).slice(0,8).map(a=>`
              <tr>
                <td class="font-medium">${a.number}</td>
                <td class="text-secondary">${a.customerName}</td>
                <td><span class="badge badge-neutral">${a.status}</span></td>
                <td style="text-align:right;font-weight:600">$${((a.laborCost||0)+(a.materialCost||0)).toFixed(0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function la(e){const s=m.getSettings(),a=e.jobs.filter(r=>r.status==="Completed"||r.status==="Invoiced").map(r=>{const c=e.hoursByJob[r.id]||0,b=e.internalLaborCostByJob[r.id]||r.laborCost||0,f=s.laborRates.find(v=>v.id===r.laborRateProfileId)||s.laborRates.find(v=>v.isDefault),n=Math.max(c*((f==null?void 0:f.rate)||85),(f==null?void 0:f.minCallOutFee)||0),p=n-b,g=n>0?p/n*100:0;return{...r,actualH:c,actualLabor:b,billableLabor:n,profit:p,margin:g}}),o=a.reduce((r,c)=>r+c.actualLabor,0),d=a.reduce((r,c)=>r+c.billableLabor,0),i=d-o,l=d>0?i/d*100:0;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Ee("Internal Labor Cost","$"+o.toLocaleString(),"engineering","orange")}
      ${Ee("Billable Labor Rev.","$"+d.toLocaleString(),"payments","green")}
      ${Ee("Labor Profitability",l.toFixed(1)+"% Margin","trending_up",l>=40?"green":"orange")}
    </div>
    <div class="card">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
        <h4 style="margin:0">Labor Costing Analysis (Completed Jobs)</h4>
        <div style="font-size:12px; color:var(--text-tertiary)">Actual Tech Pay vs. Profile Billable Rate</div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Technician</th>
              <th style="text-align:right">Hrs</th>
              <th style="text-align:right">Internal Cost</th>
              <th style="text-align:right">Billable</th>
              <th style="text-align:right">Profit</th>
              <th style="text-align:right">Margin</th>
            </tr>
          </thead>
          <tbody>
            ${a.map(r=>`
              <tr>
                <td class="font-medium"><a href="#/jobs/${r.id}" class="cell-link">${r.number}</a></td>
                <td>${r.technicianName||"—"}</td>
                <td style="text-align:right">${r.actualH.toFixed(2)}</td>
                <td style="text-align:right">$${r.actualLabor.toFixed(2)}</td>
                <td style="text-align:right">$${r.billableLabor.toFixed(2)}</td>
                <td style="text-align:right;font-weight:600;color:${r.profit>=0?"var(--color-success)":"var(--color-danger)"}">
                  $${r.profit.toFixed(2)}
                </td>
                <td style="text-align:right">
                   <span class="badge ${r.margin>=40?"badge-success":r.margin>=20?"badge-warning":"badge-danger"}">
                    ${r.margin.toFixed(1)}%
                   </span>
                </td>
              </tr>
            `).join("")}
            ${a.length?"":'<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No completed jobs to analyze</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function ra(e){return`
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Technician Performance</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Role</th><th style="text-align:center">Total Jobs</th><th style="text-align:center">Completed</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>
            ${e.techStats.sort((s,t)=>t.revenue-s.revenue).map(s=>`
              <tr>
                <td><div style="width:8px;height:8px;border-radius:50%;background:${s.color}"></div></td>
                <td class="font-medium">${s.name}</td>
                <td class="text-secondary">${s.role}</td>
                <td style="text-align:center">${s.totalJobs}</td>
                <td style="text-align:center"><span class="badge badge-success">${s.completed}</span></td>
                <td style="text-align:right;font-weight:600">$${s.revenue.toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Revenue by Technician</h4></div>
      <div class="card-body">
        ${e.techStats.map(s=>ot(s.name,s.revenue,Math.max(...e.techStats.map(t=>t.revenue)),s.color)).join("")}
      </div>
    </div>
  `}function da(e){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Ee("Total Customers",e.customers.length,"people","blue")}
      ${Ee("Active Customers",e.customers.filter(s=>s.status==="Active").length,"check_circle","green")}
      ${Ee("Total Leads",e.leads.length,"trending_up","orange")}
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Customers by Revenue</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Revenue</th><th>Share</th></tr></thead>
          <tbody>
            ${e.topCustomers.map(([s,t],a)=>`
              <tr>
                <td class="text-secondary">${a+1}</td>
                <td class="font-medium">${s}</td>
                <td style="text-align:right;font-weight:600">$${t.toLocaleString()}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden">
                      <div style="height:100%;width:${e.totalRevenue>0?t/e.totalRevenue*100:0}%;background:var(--color-primary);border-radius:3px"></div>
                    </div>
                    <span class="text-secondary" style="font-size:var(--font-size-xs)">${e.totalRevenue>0?(t/e.totalRevenue*100).toFixed(0):0}%</span>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function ca(e){const s=e.stock.reduce((t,a)=>t+a.quantity*a.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Ee("Total Items",e.stock.length,"inventory_2","blue")}
      ${Ee("Stock Value (Cost)",`$${e.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${Ee("Stock Value (Sell)",`$${s.toFixed(0)}`,"paid","green")}
    </div>
    ${e.lowStockItems.length>0?`
      <div class="card" style="margin-bottom:var(--space-lg);border-color:var(--color-danger)">
        <div class="card-header" style="background:var(--color-danger-bg)">
          <h4 style="color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:18px;vertical-align:middle">warning</span> Low Stock Alert (${e.lowStockItems.length} items)</h4>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:center">Reorder Level</th><th>Supplier</th></tr></thead>
            <tbody>
              ${e.lowStockItems.map(t=>`
                <tr>
                  <td class="font-medium">${t.name}</td>
                  <td class="text-secondary" style="font-family:monospace">${t.sku}</td>
                  <td style="text-align:center;color:var(--color-danger);font-weight:600">${t.quantity}</td>
                  <td style="text-align:center">${t.reorderLevel}</td>
                  <td class="text-secondary">${t.supplier}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `:""}
    <div class="card">
      <div class="card-header"><h4>Stock by Category</h4></div>
      <div class="card-body">
        ${lt(e.stock.reduce((t,a)=>(t[a.category]=(t[a.category]||0)+a.quantity,t),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}function je(e){return Object.entries(nt).map(([s,t])=>{const a={module:s};return t.forEach(({key:o})=>{a[o]=e(s,o)}),a})}function pa(e){let s="company";JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}');function t(){e.innerHTML=`
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${s==="company"?"active":""}" data-tab="company">Company</button>
        <button class="tab ${s==="users"?"active":""}" data-tab="users">Users & Permissions</button>
        <button class="tab ${s==="materials"?"active":""}" data-tab="materials">Materials</button>
        <button class="tab ${s==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        <button class="tab ${s==="forms"?"active":""}" data-tab="forms">Custom Forms</button>
        <button class="tab ${s==="quote_templates"?"active":""}" data-tab="quote_templates">Quote Templates</button>
        <button class="tab ${s==="tax"?"active":""}" data-tab="tax">Tax &amp; Rates</button>
        <button class="tab ${s==="assets"?"active":""}" data-tab="assets">Assets</button>
        <button class="tab ${s==="system"?"active":""}" data-tab="system">System</button>
      </div>
      <div id="settings-content" style="padding-top:var(--space-lg)"></div>
    `,a(),e.querySelectorAll(".tab").forEach(b=>{b.addEventListener("click",()=>{s=b.dataset.tab,e.querySelectorAll(".tab").forEach(f=>f.classList.remove("active")),b.classList.add("active"),a()})})}function a(){var n,p,g;const b=e.querySelector("#settings-content");if(s==="forms"){es(b);return}if(s==="company"){const v=m.getSettings();let u=v.logo;(()=>{var C;b.innerHTML=`
          <div class="card" style="max-width:800px">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 280px; gap:var(--space-lg)">
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${v.name||"FieldForge Demo Company"}" id="company-name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${v.abn||"12 345 678 901"}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${v.phone||"1300 123 456"}" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Company Domain</label>
                    <input class="form-input" value="${v.email||"fieldforge.io"}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2">${v.address||"123 Business St, Melbourne VIC 3000"}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; align-items:center; text-align:center">
                  <label class="form-label" style="align-self:flex-start">Company Logo</label>
                  <div id="logo-preview-container" style="width:100%; aspect-ratio:1; margin:12px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                    ${u?`<img src="${u}" style="max-width:90%; max-height:90%; object-fit:contain" />`:`
                      <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
                        <span class="material-icons-outlined" style="font-size:48px">image</span>
                        <span style="font-size:12px; margin-top:8px">No custom logo</span>
                      </div>
                    `}
                  </div>
                  <input type="file" id="logo-upload" accept="image/*" style="display:none" />
                  <div style="display:flex; flex-direction:column; gap:8px; width:100%">
                    <button class="btn btn-secondary btn-sm" id="btn-upload-logo" style="width:100%">
                      <span class="material-icons-outlined" style="font-size:16px">upload</span> Upload Logo
                    </button>
                    ${u?'<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>':""}
                  </div>
                  <div id="unsaved-logo-hint" style="display:none; margin-top:8px; color:var(--color-warning); font-size:11px; font-weight:600">UNSAVED PREVIEW</div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary" id="btn-save-company">
                <span class="material-icons-outlined">save</span> Save Company Changes
              </button>
            </div>
          </div>
        `;const x=b.querySelector("#logo-upload");b.querySelector("#btn-upload-logo").addEventListener("click",()=>x.click()),x.addEventListener("change",k=>{const S=k.target.files[0];if(S){const $=new FileReader;$.onload=I=>{u=I.target.result;const O=b.querySelector("#logo-preview-container");O.innerHTML=`<img src="${u}" style="max-width:90%; max-height:90%; object-fit:contain" />`,b.querySelector("#unsaved-logo-hint").style.display="block",L("Logo preview updated. Click Save to apply.","info")},$.readAsDataURL(S)}}),(C=b.querySelector("#btn-remove-logo"))==null||C.addEventListener("click",()=>{u=null;const k=b.querySelector("#logo-preview-container");k.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `,b.querySelector("#unsaved-logo-hint").style.display="block",b.querySelector("#btn-remove-logo").style.display="none"}),b.querySelector("#btn-save-company").addEventListener("click",()=>{const k=m.getSettings();k.name=b.querySelector("#company-name").value,k.abn=b.querySelector("#company-abn").value,k.phone=b.querySelector("#company-phone").value,k.email=b.querySelector("#company-domain").value,k.address=b.querySelector("#company-address").value,k.logo=u,m.saveSettings(k),L("Company information saved permanently","success"),b.querySelector("#unsaved-logo-hint").style.display="none",window.dispatchEvent(new CustomEvent("simpro-settings-updated"))})})()}else if(s==="users"){const v=m.getAll("technicians");let u=m.getAll("userTypes");!u||u.length===0?(u=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:je(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:je((y,x)=>y==="Settings"?["view","edit_company"].includes(x):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs",permissions:je((y,x)=>y==="Dashboard"?x==="view":y==="Jobs"?["view","manage_tasks","book_time"].includes(x):y==="Timesheets"?["view_own","create"].includes(x):y==="Schedule"?["view_own"].includes(x):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:je((y,x)=>y==="Settings"?!1:y==="Reports"?x==="view":!(["Invoices","Purchase Orders"].includes(y)&&x==="delete"))}],m.save("userTypes",u)):u.some(x=>x.id==="ut_office")||(u.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:je((x,C)=>x==="Settings"?!1:x==="Reports"?C==="view":!(["Invoices","Purchase Orders"].includes(x)&&C==="delete"))}),m.save("userTypes",u)),b.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Active Users</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-user"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:40px"></th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>User Type</th>
                  <th>Email</th>
                  <th>Pay Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${v.filter(y=>!y.deactivated).map(y=>{const x=u.find(C=>C.id===y.userTypeId);return`
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${y.color}"></div></td>
                      <td class="font-medium">${y.name}</td>
                      <td class="text-secondary">${y.role}</td>
                      <td><span class="badge ${(x==null?void 0:x.id)==="ut_admin"?"badge-primary":"badge-neutral"}">${(x==null?void 0:x.name)||"Unassigned"}</span></td>
                      <td class="text-tertiary">${y.email||"-"}</td>
                      <td class="text-secondary">${y.payRate?`$${y.payRate.toFixed(2)}/hr`:"-"}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${y.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
                        </div>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">User Types & Permissions</h4>
            <button class="btn btn-secondary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> New Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${u.map(y=>`
                  <tr>
                    <td class="font-medium">${y.name}</td>
                    <td class="text-secondary">${y.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${y.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${y.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h4>Deactivated Users (Cooldown Period)</h4></div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Deactivated On</th>
                  <th>Cooldown Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${v.filter(y=>y.deactivated).length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>':""}
                ${v.filter(y=>y.deactivated).map(y=>{const x=new Date(y.deactivatedAt),k=new Date-x,$=30-Math.ceil(k/(1e3*60*60*24)),I=$<=0;return`
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${y.name}</td>
                      <td style="opacity:0.6">${y.role}</td>
                      <td class="text-tertiary">${x.toLocaleDateString()}</td>
                      <td>
                        ${I?'<span class="badge badge-success">Cooldown Complete</span>':`<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${$} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${y.id}" 
                                ${I?"":'disabled style="opacity:0.4; cursor:not-allowed"'}>
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,b.querySelector("#btn-add-user").addEventListener("click",()=>i()),b.querySelectorAll(".btn-edit-user").forEach(y=>{y.addEventListener("click",x=>i(x.currentTarget.dataset.id))}),b.querySelectorAll(".btn-deactivate-user").forEach(y=>{y.addEventListener("click",x=>{const C=x.currentTarget.dataset.id,k=m.getById("technicians",C);if(!k)return;const S=document.createElement("div");S.innerHTML=`<p>Are you sure you want to deactivate <strong>${k.name}</strong>? They will no longer be able to log in.</p>`,fe({title:"Deactivate User",content:S,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Deactivate",className:"btn-danger",onClick:$=>{m.update("technicians",C,{deactivated:!0,deactivatedAt:new Date().toISOString()}),L(`${k.name} deactivated`,"info"),$(),a()}}]})})}),b.querySelectorAll(".btn-reactivate-user").forEach(y=>{y.addEventListener("click",x=>{const C=x.currentTarget.dataset.id,k=m.getById("technicians",C);if(!k)return;const S=new Date(k.deactivatedAt),$=Math.ceil((new Date-S)/(1e3*60*60*24));if($<30){L(`License Policy: Seat cooldown in progress (${30-$} days remaining)`,"error");return}const I=document.createElement("div");I.innerHTML=`<p>Reactivate <strong>${k.name}</strong>? They will regain access once a User Type is assigned.</p>`,fe({title:"Reactivate User",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:O=>O()},{label:"Reactivate",className:"btn-primary",onClick:O=>{m.update("technicians",C,{deactivated:!1,deactivatedAt:null}),L(`${k.name} has been reactivated.`,"success"),O(),a()}}]})})}),(n=b.querySelector("#btn-add-usertype"))==null||n.addEventListener("click",()=>{o()}),b.querySelectorAll(".btn-edit-perms").forEach(y=>{y.addEventListener("click",x=>{d(x.target.dataset.id)})}),b.querySelectorAll(".btn-edit-usertype").forEach(y=>{y.addEventListener("click",x=>{o(x.target.dataset.id)})}),b.querySelectorAll(".btn-delete-usertype").forEach(y=>{y.addEventListener("click",x=>{const C=x.target.dataset.id,k=m.getById("userTypes",C);if(!k)return;if(k.name.toLowerCase().includes("admin")){L("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const S=m.getAll("technicians").filter(I=>I.userTypeId===C),$=document.createElement("div");$.innerHTML=`<p>Are you sure you want to delete the user type <strong>${k.name}</strong>?${S.length>0?` <strong>${S.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,fe({title:"Confirm Deletion",content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Delete",className:"btn-danger",onClick:I=>{m.delete("userTypes",C),L("User Type deleted","success"),I(),a()}}]})})})}else if(s==="materials")c(b);else if(s==="tasks")l(b);else if(s==="quote_templates")r(b);else if(s==="tax"){let u=function(y){return Array.from(y.querySelectorAll(".labor-rate-card")).map(x=>{const C=x.dataset.id,k=x.querySelector(".rate-name").value,S=parseFloat(x.querySelector(".rate-val").value)||0,$=parseFloat(x.querySelector(".rate-multiplier").value)||1,I=x.querySelector(".rate-desc").value,O=parseFloat(x.querySelector(".rate-min-fee").value)||0,q=x.querySelector(".btn-set-default")===null,F=Array.from(x.querySelectorAll(".rate-day:checked")).map(K=>K.dataset.day);return{id:C,name:k,rate:S,description:I,overtimeMultiplier:$,minCallOutFee:O,applicableDays:F,isDefault:q}})};var f=u;const v=m.getSettings();b.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Tax & Global Markup</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Default Tax Rate (GST)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input class="form-input" type="number" value="10" style="width:100px" disabled /> <span class="text-secondary">%</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Global Material Markup</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input class="form-input" id="global-markup" type="number" value="${v.markupPercent||20}" style="width:100px" /> <span class="text-secondary">%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h4>Labor Rounding Rules</h4></div>
            <div class="card-body">
              <div class="form-group">
                <label class="form-label">Round Technician Time To...</label>
                <select class="form-select" id="labor-rounding">
                  <option value="1" ${(v.laborRounding||15)===1?"selected":""}>None (Precise)</option>
                  <option value="5" ${(v.laborRounding||15)===5?"selected":""}>Nearest 5 Minutes</option>
                  <option value="15" ${(v.laborRounding||15)===15?"selected":""}>Nearest 15 Minutes</option>
                  <option value="30" ${(v.laborRounding||15)===30?"selected":""}>Nearest 30 Minutes</option>
                  <option value="60" ${(v.laborRounding||15)===60?"selected":""}>Nearest Hour</option>
                </select>
                <p class="text-tertiary" style="font-size:12px;margin-top:8px">Standardizes billing and ensures technicians are paid consistently for small increments.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:var(--space-lg)">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h4 style="margin:0">Labour Rate Profiles</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">Define charge-out rates for different job types or time periods. These appear as selectable options when adding labour to a quote or job.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="add-rate-btn">
              <span class="material-icons-outlined" style="font-size:16px">add</span> Add Profile
            </button>
          </div>
          <div class="card-body">
            <div id="labor-rates-container" style="display:flex;flex-direction:column;gap:16px;">
              ${v.laborRates.map(y=>{const x=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],C={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},k=y.applicableDays||["Mon","Tue","Wed","Thu","Fri"];return`
                <div class="labor-rate-card" data-id="${y.id}" style="border:2px solid ${y.isDefault?"var(--color-primary)":"var(--border-color)"}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${y.isDefault?"var(--color-primary-light)":"var(--bg-color)"}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${y.isDefault?"var(--color-primary)":"var(--text-tertiary)"}; font-size:20px">sell</span>
                      <input class="rate-name" value="${y.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${y.isDefault?'<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>':""}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${y.isDefault?"":`<button class="btn btn-ghost btn-sm btn-set-default" data-id="${y.id}" title="Set as default rate">Set Default</button>`}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${y.id}" title="Delete profile" ${y.isDefault?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
                        <span class="material-icons-outlined" style="font-size:18px;pointer-events:none">delete</span>
                      </button>
                    </div>
                  </div>
                  <!-- Card Body -->
                  <div style="padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <!-- Charge-out Rate -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Charge-out Rate ($/hr)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-val" type="number" value="${y.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Overtime Multiplier</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <input class="form-input rate-multiplier" type="number" value="${(y.overtimeMultiplier||1).toFixed(1)}" min="1" max="5" step="0.5" style="width:100px" />
                        <span class="text-secondary">× base pay</span>
                      </div>
                    </div>
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${(y.minCallOutFee||0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Description</label>
                      <input class="form-input rate-desc" value="${y.description||""}" placeholder="When is this rate used?" />
                    </div>
                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${x.map(S=>`
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${S}" ${k.includes(S)?"checked":""} style="display:none" />
                            <span class="rate-day-pill" data-day="${S}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${k.includes(S)?"var(--color-primary)":"var(--border-color)"};background:${k.includes(S)?"var(--color-primary-light)":"transparent"};color:${k.includes(S)?"var(--color-primary)":"var(--text-secondary)"}">
                              ${C[S]}
                            </span>
                          </label>
                        `).join("")}
                      </div>
                    </div>
                  </div>
                </div>
              `}).join("")}
            </div>
          </div>
          <div class="card-footer" style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" id="save-tax-settings">
              <span class="material-icons-outlined">save</span> Save All Settings
            </button>
          </div>
        </div>

        <div class="card" style="margin-top:var(--space-lg)">
          <div class="card-header"><h4>Job Type Rate Mapping</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:var(--font-size-sm);margin-bottom:16px">Automatically assign a labor profile when a job of a specific type is created.</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
              ${["Service","Project","Maintenance","Quote"].map(y=>`
                <div class="form-group" style="margin:0">
                  <label class="form-label">${y} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${y}">
                    <option value="">-- Use Default --</option>
                    ${v.laborRates.map(x=>{var C;return`<option value="${x.id}" ${((C=v.rateMappings)==null?void 0:C[y])===x.id?"selected":""}>${x.name}</option>`}).join("")}
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `,b.addEventListener("click",y=>{const x=y.target.closest(".rate-day-pill");if(x){const C=x.dataset.day,S=x.closest(".labor-rate-card").querySelector(`.rate-day[data-day="${C}"]`);S.checked=!S.checked;const $=S.checked;x.style.border=`1px solid ${$?"var(--color-primary)":"var(--border-color)"}`,x.style.background=$?"var(--color-primary-light)":"transparent",x.style.color=$?"var(--color-primary)":"var(--text-secondary)"}}),b.querySelector("#add-rate-btn").addEventListener("click",()=>{const y="rate_"+Date.now().toString(36),x=b.querySelector("#labor-rates-container"),C=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],k={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},S=document.createElement("div");S.className="labor-rate-card",S.dataset.id=y,S.style.cssText="border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);",S.innerHTML=`
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${y}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${y}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
            </div>
          </div>
          <div style="padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group" style="margin:0">
              <label class="form-label">Charge-out Rate ($/hr)</label>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--text-secondary)">$</span>
                <input class="form-input rate-val" type="number" value="0.00" min="0" step="0.50" style="width:120px" />
              </div>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Overtime Multiplier</label>
              <input class="form-input rate-multiplier" type="number" value="1.0" min="1" max="5" step="0.5" style="width:100px" />
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Min Call-out Fee ($)</label>
              <input class="form-input rate-min-fee" type="number" value="0.00" min="0" step="1.00" style="width:120px" />
            </div>
            <div class="form-group" style="margin:0;grid-column:1/-1">
              <label class="form-label">Description</label>
              <input class="form-input rate-desc" value="" />
            </div>
            <div class="form-group" style="margin:0;grid-column:1/-1">
              <label class="form-label">Applicable Days</label>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                ${C.map($=>`
                  <label style="cursor:pointer">
                    <input type="checkbox" class="rate-day" data-day="${$}" ${["Mon","Tue","Wed","Thu","Fri"].includes($)?"checked":""} style="display:none" />
                    <span class="rate-day-pill" data-day="${$}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${["Mon","Tue","Wed","Thu","Fri"].includes($)?"var(--color-primary)":"var(--border-color)"};background:${["Mon","Tue","Wed","Thu","Fri"].includes($)?"var(--color-primary-light)":"transparent"};color:${["Mon","Tue","Wed","Thu","Fri"].includes($)?"var(--color-primary)":"var(--text-secondary)"}">
                      ${k[$]}
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        `,x.appendChild(S)}),b.addEventListener("click",y=>{if(y.target.closest(".remove-rate-btn")){const x=y.target.closest(".labor-rate-card");x&&x.remove()}}),b.addEventListener("click",y=>{if(y.target.closest(".btn-set-default")){const x=y.target.closest(".btn-set-default").dataset.id,C=u(b);C.forEach(S=>S.isDefault=S.id===x);const k=b.querySelector("#labor-rates-container");k.innerHTML=C.map(S=>{b.querySelectorAll(".labor-rate-card").forEach($=>{const I=$.dataset.id===x;$.style.border=`2px solid ${I?"var(--color-primary)":"var(--border-color)"}`;const O=$.querySelector('div[style*="padding:12px 16px"]');O&&(O.style.background=I?"var(--color-primary-light)":"var(--bg-color)");let q=$.querySelector(".badge");if(I&&!q){const K=$.querySelector('div[style*="flex:1"]'),X=document.createElement("span");X.className="badge",X.style.cssText="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600",X.textContent="DEFAULT",K.appendChild(X)}else!I&&q&&q.remove();let F=$.querySelector(".btn-set-default");if(I&&F)F.remove();else if(!I&&!F){const K=$.querySelector('div[style*="gap:8px"]'),X=document.createElement("button");X.className="btn btn-ghost btn-sm btn-set-default",X.dataset.id=$.dataset.id,X.textContent="Set Default",K.prepend(X)}})}),L("Default rate updated in view. Click Save to apply.","info")}}),b.querySelector("#save-tax-settings").addEventListener("click",()=>{const y=parseFloat(b.querySelector("#global-markup").value)||0,x=parseInt(b.querySelector("#labor-rounding").value)||15,C=u(b),k=m.getSettings();k.markupPercent=y,k.laborRounding=x,k.laborRates=C,k.rateMappings={},b.querySelectorAll(".rate-mapping").forEach(S=>{S.value&&(k.rateMappings[S.dataset.type]=S.value)}),m.saveSettings(k),L("Financial and Rate settings saved","success"),a()})}else if(s==="assets"){m.getSettings();const v=m.getAll("assets").filter(u=>u.category==="Business");b.innerHTML=`
        <div class="card" style="max-width:800px">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4 style="margin:0">Business Asset Defaults</h4>
            <div class="badge badge-info">Recovery Automation Enabled</div>
          </div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:13px; margin-bottom:20px">Configure the default recovery rates for your business equipment. These rates are used to calculate internal job costs when assets are assigned to tasks.</p>
            
            <table class="data-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Current Rate ($/hr)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${v.map(u=>`
                  <tr>
                    <td class="font-medium">${h(u.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${u.id}" value="${u.recoveryRate||0}" step="0.5" style="width:100px; height:32px" />
                      </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `).join("")}
                ${v.length===0?'<tr><td colspan="3" class="text-center text-tertiary" style="padding:24px">No business assets found. Add assets in the main Assets module.</td></tr>':""}
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="btn-save-asset-settings">Save Asset Recovery Rates</button>
          </div>
        </div>
      `,b.querySelector("#btn-save-asset-settings").addEventListener("click",()=>{b.querySelectorAll(".asset-rate-input").forEach(u=>{const y=u.dataset.id,x=parseFloat(u.value)||0;m.update("assets",y,{recoveryRate:x})}),L("Asset recovery rates updated across the system","success")})}else s==="system"&&(b.innerHTML=`
        <div class="card" style="max-width:480px">
          <div class="card-header"><h4>Data Management</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="margin-bottom:var(--space-lg)">Manage your application data. All data is stored locally in your browser.</p>
            <div style="display:flex;flex-direction:column;gap:12px">
              <button class="btn btn-secondary" id="btn-reset-data">
                <span class="material-icons-outlined">refresh</span> Reset to Demo Data
              </button>
              <button class="btn btn-danger" id="btn-clear-data">
                <span class="material-icons-outlined">delete_forever</span> Clear All Data
              </button>
            </div>
          </div>
        </div>
      `,(p=b.querySelector("#btn-reset-data"))==null||p.addEventListener("click",()=>{m.clearAll(),L("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(g=b.querySelector("#btn-clear-data"))==null||g.addEventListener("click",()=>{m.clearAll(),L("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)}))}function o(b=null){let f=b?m.getById("userTypes",b):{name:"",description:""};const n=document.createElement("div");n.innerHTML=`
        ${b?"":`
        <div class="form-group">
          <label class="form-label">Template (Auto-fills permissions)</label>
          <select class="form-select" id="ut-template">
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Technician">Technician</option>
            <option value="Office Staff">Office Staff</option>
            <option value="Custom">Custom</option>
          </select>
          <button class="btn btn-secondary mt-2" id="ut-custom-edit-perms" style="display:none; width:100%; justify-content:center; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size:16px;">edit</span> Configure Custom Permissions
          </button>
        </div>
        `}
        <div class="form-group">
          <label class="form-label">User Type Name</label>
          <input class="form-input" id="ut-name" value="${f.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${f.description}" />
        </div>
    `;const p=n.querySelector("#ut-template"),g=n.querySelector("#ut-custom-edit-perms");p&&g&&(p.addEventListener("change",v=>{v.target.value==="Custom"?g.style.display="flex":g.style.display="none"}),g.addEventListener("click",()=>{var C;const v=n.querySelector("#ut-name").value,u=n.querySelector("#ut-desc").value;if(!v){L("Please enter a User Type Name first","error");return}const y=je(()=>!1),x=m.create("userTypes",{name:v,description:u,permissions:y});(C=document.getElementById("modal-close-btn"))==null||C.click(),d(x.id)})),fe({title:b?"Edit User Type":"Add User Type",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Save",className:"btn-primary",onClick:v=>{var C;const u=document.getElementById("ut-name").value,y=document.getElementById("ut-desc").value,x=(C=document.getElementById("ut-template"))==null?void 0:C.value;if(!u){L("Name required","error");return}if(b)m.update("userTypes",b,{name:u,description:y});else{let k=[];x==="Admin"?k=je(()=>!0):x==="Manager"?k=je((S,$)=>S==="Settings"?["view","edit_company"].includes($):!0):x==="Technician"?k=je((S,$)=>S==="Dashboard"?$==="view":S==="Jobs"?["view","manage_tasks","book_time"].includes($):S==="Timesheets"?["view_own","create"].includes($):S==="Schedule"?["view_own"].includes($):!1):x==="Office Staff"?k=je((S,$)=>S==="Settings"?!1:S==="Reports"?$==="view":!(["Invoices","Purchase Orders"].includes(S)&&$==="delete")):k=je(()=>!1),m.create("userTypes",{name:u,description:y,permissions:k})}L("User Type saved","success"),a(),v()}}]})}function d(b){const f=m.getById("userTypes",b);if(!f)return;const n=f.permissions||[],p={};n.forEach(u=>{p[u.module]=u});const g=document.createElement("div"),v=Object.entries(nt).map(([u,y])=>{const x=p[u]||{},C=y.every(({key:S})=>x[S]),k=y.map(({key:S,label:$})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${u}" data-key="${S}" ${x[S]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${$}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${u}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${u}" ${C?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${k}
          </div>
        </div>
      `}).join("");g.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${v}
      </div>
    `,g.querySelector("#btn-select-all-perms").addEventListener("click",()=>{g.querySelectorAll(".perm-chk, .module-select-all").forEach(u=>u.checked=!0)}),g.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{g.querySelectorAll(".perm-chk, .module-select-all").forEach(u=>u.checked=!1)}),g.querySelectorAll(".module-select-all").forEach(u=>{u.addEventListener("change",y=>{const x=y.target.dataset.module;g.querySelectorAll(`.perm-chk[data-module="${x}"]`).forEach(C=>C.checked=y.target.checked)})}),g.querySelectorAll(".perm-chk").forEach(u=>{u.addEventListener("change",()=>{const y=u.dataset.module,C=(nt[y]||[]).every(({key:S})=>{const $=g.querySelector(`.perm-chk[data-module="${y}"][data-key="${S}"]`);return $&&$.checked}),k=g.querySelector(`.module-select-all[data-module="${y}"]`);k&&(k.checked=C)})}),fe({title:`Edit Permissions: ${f.name}`,content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save Permissions",className:"btn-primary",onClick:u=>{const y=Object.entries(nt).map(([x,C])=>{const k={module:x};return C.forEach(({key:S})=>{const $=g.querySelector(`.perm-chk[data-module="${x}"][data-key="${S}"]`);k[S]=$?$.checked:!1}),k});m.update("userTypes",b,{permissions:y}),L("Permissions updated successfully","success"),a(),u()}}]})}function i(b=null){let f=b?m.getById("technicians",b):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const n=m.getAll("userTypes"),p=document.createElement("div");p.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${f.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${f.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${f.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${n.map(u=>`
              <option value="${u.id}" ${f.userTypeId===u.id?"selected":""}>${u.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary);font-size:15px">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${f.payRate||""}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary" style="font-size:var(--font-size-sm)">/hr — used in job cost &amp; P&amp;L calculations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(u=>`
            <div class="color-swatch" data-color="${u}" style="width:28px; height:28px; border-radius:50%; background:${u}; cursor:pointer; border:2px solid ${f.color.toUpperCase()===u.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${f.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const g=p.querySelector("#u-color"),v=p.querySelectorAll(".color-swatch");v.forEach(u=>{u.addEventListener("click",()=>{g.value=u.dataset.color,v.forEach(y=>y.style.borderColor="transparent"),u.style.borderColor="var(--text-primary)"})}),g.addEventListener("input",()=>{v.forEach(u=>u.style.borderColor="transparent")}),fe({title:b?"Edit User":"Add User",content:p,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save",className:"btn-primary",onClick:u=>{const y=document.getElementById("u-name").value,x=document.getElementById("u-email").value,C=document.getElementById("u-role").value,k=document.getElementById("u-type").value,S=document.getElementById("u-color").value,$=parseFloat(document.getElementById("u-payrate").value)||null;if(!y){L("Name required","error");return}b?m.update("technicians",b,{name:y,email:x,role:C,userTypeId:k,color:S,payRate:$}):m.create("technicians",{name:y,email:x,role:C,userTypeId:k,color:S,payRate:$}),L("User saved","success"),a(),u()}}]})}document.addEventListener("save-settings",()=>L("Settings saved","success"));function l(b){const f=m.getAll("taskTemplates");b.innerHTML=`
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0">Tasklist Templates</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-template">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Create Template
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Description</th>
                <th>Tags</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${f.length?f.map(p=>`
                <tr>
                  <td class="font-medium">${h(p.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${h(p.description||"—")}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(p.tags||[]).map(g=>`<span class="badge badge-neutral" style="font-size:10px">${h(g)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-template" data-id="${p.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-template" data-id="${p.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="4" class="text-center text-tertiary" style="padding:32px">No templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,b.querySelector("#btn-add-template").addEventListener("click",()=>{n()}),b.querySelectorAll(".btn-delete-template").forEach(p=>{p.addEventListener("click",()=>{confirm("Delete this template?")&&(m.delete("taskTemplates",p.dataset.id),a())})}),b.querySelectorAll(".btn-edit-template").forEach(p=>{p.addEventListener("click",()=>{n(p.dataset.id)})});function n(p=null){const g=p?m.getById("taskTemplates",p):{name:"",description:"",tags:[],tasks:[]},v=document.createElement("div");v.style.maxHeight="80vh",v.style.overflowY="auto",v.style.padding="4px";let u=JSON.parse(JSON.stringify(g.tasks||g.phases||[])).map(I=>{!I.subTasks&&I.subPhases&&(I.subTasks=I.subPhases,delete I.subPhases),I.tasks&&!I.subTasks&&(I.subTasks=I.tasks.map(q=>({id:q.id||m.generateId(),name:q.name||"",estimatedHours:q.estimatedHours||0,people:q.people||1,status:"Not Started",progress:0})),delete I.tasks);function O(q){q.subPhases&&!q.subTasks&&(q.subTasks=q.subPhases,delete q.subPhases),q.subTasks||(q.subTasks=[]),q.subTasks.forEach(O)}return O(I),I}),y=u.length>0?[0]:[],x=[],C=!1;function k(I,O){if(!O||O.length===0)return null;let q=I[O[0]];if(!q)return null;for(let F=1;F<O.length;F++)if(!q.subTasks||(q=q.subTasks[O[F]],!q))return null;return q}function S(I){return!I.subTasks||I.subTasks.length===0?(parseFloat(I.estimatedHours)||0)*(parseInt(I.people)||1):I.subTasks.reduce((O,q)=>O+S(q),0)}const $=()=>{var I,O,q,F,K,X;v.innerHTML=`
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${h(g.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${h(g.description||"")}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(g.tags||[]).join(", ")}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(()=>{const Z=x.length>0?k(u,x):null,W=Z?Z.subTasks||[]:u,H=Z?h(Z.name):"Main Tasks";return`
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${x.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${H}">${H}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${W.map((N,M)=>{const Y=[...x,M],T=Y.join("-")===y.join("-");return`
                        <div class="tmpl-task-list-item" data-path="${Y.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${T?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${T?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${h(N.name)}">${h(N.name)}</span>
                          ${N.subTasks&&N.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${Y.join("-")}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>`:""}
                        </div>
                      `}).join("")}
                    ${W.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${y.length>0?(()=>{const Z=y,W=k(u,Z);if(!W)return'<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';const H=W.subTasks&&W.subTasks.length>0;return`
                  ${C?`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${Z.join("-")}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${Z.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <label class="form-label" style="font-size:11px">Name *</label>
                      <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${h(W.name)}" style="font-size:13px" />
                    </div>
                    ${H?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:13px; font-weight:500">${S(W)} hrs</div>
                      </div>
                    `:`
                      <div class="form-row" style="margin-bottom:12px; gap:8px">
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">Est. Hours</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${W.estimatedHours||""}" min="0" step="0.5" style="font-size:13px" />
                        </div>
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">People</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${W.people||"1"}" min="1" step="1" style="font-size:13px" />
                        </div>
                      </div>
                    `}
                    <div class="form-group" style="margin-bottom:0">
                      <label class="form-label" style="font-size:11px">Description</label>
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${h(W.description||"")}</textarea>
                    </div>
                  `:`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${h(W.name)}">${h(W.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${Z.length<3?`<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${Z.join("-")}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>`:""}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${Z.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${h(W.name)}</div>
                    </div>
                    ${H?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${S(W)} hrs</div>
                      </div>
                    `:`
                      <div style="display:flex; gap:16px; margin-bottom:12px">
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Estimated Hours</div>
                          <div style="font-size:14px; font-weight:500">${W.estimatedHours||0} hrs</div>
                        </div>
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">People</div>
                          <div style="font-size:14px; font-weight:500">${W.people||1}</div>
                        </div>
                      </div>
                    `}
                    <div style="margin-top:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Description</div>
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${h(W.description||"No description provided.")}</div>
                    </div>
                  `}
                `})():'<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `,(I=v.querySelector(".btn-view-back"))==null||I.addEventListener("click",()=>{x.pop(),$()}),v.querySelectorAll(".btn-drill-down-tmpl").forEach(Z=>{Z.addEventListener("click",W=>{W.stopPropagation(),x=Z.dataset.path.split("-").map(Number),y=[...x],$()})}),v.querySelectorAll(".tmpl-task-list-item").forEach(Z=>{Z.addEventListener("click",W=>{W.target.closest(".btn-drill-down-tmpl")||(y=Z.dataset.path.split("-").map(Number),C=!1,$())})}),(O=v.querySelector(".btn-add-node"))==null||O.addEventListener("click",()=>{const Z={id:m.generateId(),name:"New Task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]};if(x.length===0)u.push(Z),y=[u.length-1];else{const W=k(u,x);W.subTasks||(W.subTasks=[]),W.subTasks.push(Z),y=[...x,W.subTasks.length-1]}C=!0,$()}),(q=v.querySelector(".btn-add-child-tmpl"))==null||q.addEventListener("click",Z=>{const W=Z.currentTarget.dataset.path.split("-").map(Number),H=k(u,W);H.subTasks||(H.subTasks=[]),H.subTasks.push({id:m.generateId(),name:"New Sub-task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]}),y=[...W,H.subTasks.length-1],C=!0,$()}),(F=v.querySelector(".btn-edit-info-tmpl"))==null||F.addEventListener("click",()=>{C=!0,$()}),(K=v.querySelector(".btn-done-info-tmpl"))==null||K.addEventListener("click",()=>{C=!1,$()}),v.querySelectorAll(".tmpl-detail-input").forEach(Z=>{Z.addEventListener("input",W=>{const H=k(u,y);if(!H)return;const N=W.target.dataset.field;N==="estimatedHours"?H[N]=parseFloat(W.target.value)||0:N==="people"?H[N]=parseInt(W.target.value)||1:H[N]=W.target.value})}),v.querySelectorAll(".btn-remove-task-tmpl-item").forEach(Z=>{Z.addEventListener("click",W=>{const H=Z.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this item and all its sub-tasks?")){if(H.length===1)u.splice(H[0],1);else{const N=H.slice(0,-1),M=k(u,N);M&&M.subTasks&&M.subTasks.splice(H[H.length-1],1)}y=H.slice(0,-1),C=!1,$()}})}),(X=v.querySelector(".btn-duplicate-task-tmpl"))==null||X.addEventListener("click",Z=>{const W=Z.currentTarget.dataset.path.split("-").map(Number),H=k(u,W);if(!H)return;function N(Y,T){return{...Y,id:m.generateId(),name:Y.name+(T?" (Copy)":""),status:"Not Started",progress:0,subTasks:Y.subTasks?Y.subTasks.map(w=>N(w,!1)):[]}}const M=N(H,!0);if(W.length===1)u.splice(W[0]+1,0,M),y=[W[0]+1];else{const Y=W.slice(0,-1);k(u,Y).subTasks.splice(W[W.length-1]+1,0,M),y=[...Y,W[W.length-1]+1]}C=!1,$()})};$(),fe({title:p?"Edit Tasklist Template":"Create Tasklist Template",content:v,size:"modal-lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Save Template",className:"btn-primary",onClick:I=>{const O=v.querySelector("#edit-tmpl-name").value,q=v.querySelector("#edit-tmpl-desc").value,F=v.querySelector("#edit-tmpl-tags").value.split(",").map(X=>X.trim()).filter(Boolean);if(!O){L("Name required","error");return}const K={name:O,description:q,tags:F,tasks:u,phases:u};p?m.update("taskTemplates",p,K):m.create("taskTemplates",K),L("Tasklist template saved","success"),I(),a()}}]})}}function r(b){const f=m.getAll("quoteTemplates");b.innerHTML=`
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0">Quote Templates</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-quote-template">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Create Template
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Template Name</th>
                <th>Description</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${f.length?f.map(p=>`
                <tr>
                  <td class="font-medium">${h(p.name)}</td>
                  <td class="text-secondary">${h(p.description||"—")}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-quote-template" data-id="${p.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-quote-template" data-id="${p.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="3" class="text-center text-tertiary" style="padding:32px">No quote templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,b.querySelector("#btn-add-quote-template").addEventListener("click",()=>{n()}),b.querySelectorAll(".btn-delete-quote-template").forEach(p=>{p.addEventListener("click",()=>{confirm("Delete this template?")&&(m.delete("quoteTemplates",p.dataset.id),a())})}),b.querySelectorAll(".btn-edit-quote-template").forEach(p=>{p.addEventListener("click",()=>{n(p.dataset.id)})});function n(p=null){const g=p?m.getById("quoteTemplates",p):{name:"",description:""},v=document.createElement("div");v.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="edit-qtmpl-name" value="${h(g.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="edit-qtmpl-desc" rows="3">${h(g.description||"")}</textarea>
        </div>
      `,fe({title:p?"Edit Quote Template":"Create Quote Template",content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save Template",className:"btn-primary",onClick:u=>{const y=v.querySelector("#edit-qtmpl-name").value,x=v.querySelector("#edit-qtmpl-desc").value;if(!y){L("Name required","error");return}p?m.update("quoteTemplates",p,{name:y,description:x}):m.create("quoteTemplates",{name:y,description:x,sections:[]}),L("Quote template saved","success"),u(),a()}}]})}}function c(b){const f=m.getSettings(),n=f.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]},p=f.materialCategories||["General"];b.innerHTML=`
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${n.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${n.minMarkupAmount}" step="0.50" style="width:100px" />
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Ensures a base profit on even the smallest components.</p>
              </div>
            </div>

            <div style="margin-top:24px; padding-top:24px; border-top:1px solid var(--border-color)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <div>
                  <h5 style="margin:0">Tiered Pricing</h5>
                  <p class="text-secondary" style="font-size:12px;margin:4px 0 0 0">Automatically adjust markup based on the unit cost of the item.</p>
                </div>
                <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                  <input type="checkbox" id="mat-use-tiers" ${n.useTiers?"checked":""} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${n.useTiers?"":"opacity:0.5;pointer-events:none"}">
                <table class="data-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="tier-rows">
                    ${(n.tiers||[]).map((v,u)=>`
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${u===0?"Up to":"From previous up to"} 
                            <div style="display:flex;align-items:center;gap:4px">
                              <span class="text-tertiary">$</span>
                              <input type="number" class="form-input tier-upto" value="${v.upTo||""}" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" class="form-input tier-percent" value="${v.percent}" style="height:28px;padding:2px 8px;width:80px" />
                            <span class="text-tertiary">%</span>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-icon btn-sm text-danger btn-remove-tier" data-idx="${u}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
                <button class="btn btn-secondary btn-sm" id="btn-add-tier" style="align-self:flex-start;margin-top:8px">
                  <span class="material-icons-outlined" style="font-size:16px">add</span> Add Pricing Tier
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h4 style="margin:0">Material Categories</h4></div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:13px;margin-bottom:16px">Group items for reporting and bulk adjustments.</p>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="categories-container">
              ${p.map(v=>`
                <div class="badge badge-neutral" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${v}
                  <span class="material-icons-outlined btn-remove-cat" data-name="${v}" style="font-size:14px;cursor:pointer">close</span>
                </div>
              `).join("")}
              <button class="btn btn-outline btn-sm" id="btn-add-category" style="border-style:dashed">
                <span class="material-icons-outlined" style="font-size:16px">add</span> New Category
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;justify-content:flex-end">
          <button class="btn btn-primary" id="btn-save-materials">Save Material Settings</button>
        </div>
      </div>
    `;const g=()=>{const v=parseFloat(b.querySelector("#mat-default-markup").value),u=parseFloat(b.querySelector("#mat-min-markup").value),y=b.querySelector("#mat-use-tiers").checked,x=Array.from(b.querySelectorAll("#tier-rows tr")).map(S=>({upTo:parseFloat(S.querySelector(".tier-upto").value)||null,percent:parseFloat(S.querySelector(".tier-percent").value)||0})).sort((S,$)=>S.upTo===null?1:$.upTo===null?-1:S.upTo-$.upTo),C=Array.from(b.querySelectorAll(".btn-remove-cat")).map(S=>S.dataset.name),k={...f,materialMarkup:{defaultPercent:v,minMarkupAmount:u,useTiers:y,tiers:x},materialCategories:C};m.saveSettings(k),L("Material settings saved","success")};b.querySelector("#mat-use-tiers").addEventListener("change",v=>{b.querySelector("#tiers-container").style.opacity=v.target.checked?"1":"0.5",b.querySelector("#tiers-container").style.pointerEvents=v.target.checked?"auto":"none"}),b.querySelector("#btn-add-tier").addEventListener("click",()=>{const v=document.createElement("tr");v.innerHTML=`
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            From previous up to 
            <div style="display:flex;align-items:center;gap:4px">
              <span class="text-tertiary">$</span>
              <input type="number" class="form-input tier-upto" value="" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:4px">
            <input type="number" class="form-input tier-percent" value="20" style="height:28px;padding:2px 8px;width:80px" />
            <span class="text-tertiary">%</span>
          </div>
        </td>
        <td>
          <button class="btn btn-icon btn-sm text-danger btn-remove-tier"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
        </td>
      `,b.querySelector("#tier-rows").appendChild(v),v.querySelector(".btn-remove-tier").addEventListener("click",()=>v.remove())}),b.querySelectorAll(".btn-remove-tier").forEach(v=>{v.addEventListener("click",()=>v.closest("tr").remove())}),b.querySelector("#btn-add-category").addEventListener("click",()=>{const v=prompt("Enter category name:");if(v){const u=document.createElement("div");u.className="badge badge-neutral",u.style.cssText="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px",u.innerHTML=`
          ${v}
          <span class="material-icons-outlined btn-remove-cat" data-name="${v}" style="font-size:14px;cursor:pointer">close</span>
        `,b.querySelector("#categories-container").insertBefore(u,b.querySelector("#btn-add-category")),u.querySelector(".btn-remove-cat").addEventListener("click",()=>u.remove())}}),b.querySelectorAll(".btn-remove-cat").forEach(v=>{v.addEventListener("click",()=>v.closest(".badge").remove())}),b.querySelector("#btn-save-materials").addEventListener("click",g)}t()}function es(e){const s=m.getAll("formTemplates");e.innerHTML=`
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
          <h4 style="margin:0">Custom Form Templates</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-form-template">
            <span class="material-icons-outlined" style="font-size:16px">add</span> Create New Form
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <div style="padding:16px; font-size:13px; color:var(--text-tertiary); border-bottom:1px solid var(--border-color)">
            Create reusable forms that can be attached to jobs for technicians to fill out in the field (e.g. Safety Audits, Site Inspections).
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Description</th>
                <th>Fields</th>
                <th style="width:100px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${s.map(t=>`
                <tr>
                  <td class="font-medium">${h(t.name)}</td>
                  <td style="color:var(--text-secondary); font-size:13px">${h(t.description||"—")}</td>
                  <td><span class="badge badge-neutral">${(t.sections||[]).reduce((a,o)=>a+o.fields.length,0)} Fields</span></td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-icon btn-sm edit-form-template" data-id="${t.id}"><span class="material-icons-outlined">edit</span></button>
                    <button class="btn btn-ghost btn-icon btn-sm delete-form-template" data-id="${t.id}" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span></button>
                  </td>
                </tr>
              `).join("")}
              ${s.length?"":'<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-tertiary)">No form templates created yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,e.querySelector("#btn-add-form-template").addEventListener("click",()=>router.navigate("/settings/forms/new")),e.querySelectorAll(".edit-form-template").forEach(t=>{t.addEventListener("click",()=>router.navigate(`/settings/forms/${t.dataset.id}/edit`))}),e.querySelectorAll(".delete-form-template").forEach(t=>{t.addEventListener("click",()=>{if(confirm("Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.")){const a=t.dataset.id,o=m.getAll("formTemplates").filter(d=>d.id!==a);m.save("formTemplates",o),es(e)}})})}function ts(e,{id:s}){const t=s&&s!=="new",a=m.getAll("formTemplates"),o=t?a.find(c=>c.id===s):null;if(t&&!o){e.innerHTML='<div class="empty-state"><h3>Template not found</h3></div>';return}let d=o?JSON.parse(JSON.stringify(o.sections||[])):[{id:"sec_"+Math.random().toString(36).substr(2,5),title:"General Info",fields:[]}];function i(){e.innerHTML=`
      <div class="page-header">
        <div style="display:flex; align-items:center; gap:12px">
          <button class="btn btn-ghost btn-icon" id="btn-back"><span class="material-icons-outlined">arrow_back</span></button>
          <h1>${t?"Edit Form Template":"Create Form Template"}</h1>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Template</button>
        </div>
      </div>

      <div class="card" style="max-width:1000px; margin:0 auto">
        <div class="card-body">
          <div style="display:flex; flex-direction:column; gap:24px">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
              <div class="form-group">
                <label class="form-label">Form Name <span style="color:var(--color-danger)">*</span></label>
                <input class="form-input" id="form-name" value="${h((o==null?void 0:o.name)||"")}" placeholder="e.g. Daily Safety Audit" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" id="form-desc" value="${h((o==null?void 0:o.description)||"")}" placeholder="Optional description..." />
              </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:20px">
              <h4 style="margin:0">Form Structure</h4>
              <button class="btn btn-secondary btn-sm" id="btn-add-section">
                <span class="material-icons-outlined" style="font-size:16px">library_add</span> Add Section
              </button>
            </div>

            <div id="sections-list" style="display:flex; flex-direction:column; gap:24px; padding-bottom:40px">
              ${d.map((c,b)=>`
                <div class="section-card" data-section-index="${b}" style="border:1px solid var(--border-color); border-radius:12px; background:var(--bg-color); overflow:hidden; box-shadow:var(--shadow-sm)">
                  <div style="padding:16px 20px; background:var(--content-bg); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:12px; flex:1">
                      <span class="material-icons-outlined" style="color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                      <input class="form-input section-title" value="${h(c.title)}" placeholder="Section Title..." style="font-weight:600; font-size:16px; background:transparent; border:none; padding:4px; margin:0; width:100%" />
                    </div>
                    <div style="display:flex; gap:12px">
                      <button class="btn btn-secondary btn-sm btn-add-field-to-sec" data-section-index="${b}">
                        <span class="material-icons-outlined" style="font-size:16px">add</span> Add Field
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${b}" style="color:var(--color-danger)">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="fields-container" style="padding:20px; display:flex; flex-direction:column; gap:16px">
                    ${c.fields.map((f,n)=>{var p;return`
                      <div class="field-row" data-field-index="${n}" style="display:grid; grid-template-columns: 1fr 160px 100px 40px; gap:12px; align-items:flex-end; background:white; padding:16px; border-radius:8px; border:1px solid var(--border-color); position:relative">
                        <div class="form-group" style="margin:0">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Field Label</label>
                          <input class="form-input field-label" value="${h(f.label)}" placeholder="Enter question or label..." />
                        </div>
                        <div class="form-group" style="margin:0">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Type</label>
                          <select class="form-select field-type">
                            <option value="text" ${f.type==="text"?"selected":""}>Text</option>
                            <option value="textarea" ${f.type==="textarea"?"selected":""}>Long Text</option>
                            <option value="checkbox" ${f.type==="checkbox"?"selected":""}>Checkbox / Yes-No</option>
                            <option value="select" ${f.type==="select"?"selected":""}>Dropdown Menu</option>
                            <option value="date" ${f.type==="date"?"selected":""}>Date Picker</option>
                            <option value="signature" ${f.type==="signature"?"selected":""}>Signature Field</option>
                          </select>
                        </div>
                        <div class="form-group" style="margin:0; text-align:center">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Required</label>
                          <div style="height:38px; display:flex; align-items:center; justify-content:center">
                            <input type="checkbox" class="field-required" ${f.required?"checked":""} style="width:20px; height:20px; cursor:pointer" />
                          </div>
                        </div>
                        <button class="btn btn-ghost btn-icon btn-sm remove-field" data-section-index="${b}" data-field-index="${n}" style="color:var(--color-danger); height:38px">
                          <span class="material-icons-outlined">close</span>
                        </button>
                        
                        ${f.type==="select"?`
                          <div style="grid-column: 1 / -1; margin-top:8px; padding:12px; background:var(--bg-color); border-radius:4px">
                            <label class="form-label" style="font-size:11px">Dropdown Options (comma separated)</label>
                            <input class="form-input field-options" style="font-size:13px" value="${h(((p=f.options)==null?void 0:p.join(", "))||"")}" placeholder="e.g. Option 1, Option 2, Option 3" />
                          </div>
                        `:""}
                      </div>
                    `}).join("")}
                    ${c.fields.length?"":`
                      <div style="text-align:center; color:var(--text-tertiary); padding:30px; border:2px dashed var(--border-color); border-radius:8px">
                        <span class="material-icons-outlined" style="font-size:32px; display:block; margin-bottom:8px">post_add</span>
                        No fields in this section yet. Click "Add Field" to start.
                      </div>
                    `}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `,r()}function l(){e.querySelectorAll(".section-card").forEach(c=>{const b=parseInt(c.dataset.sectionIndex);d[b].title=c.querySelector(".section-title").value,c.querySelectorAll(".field-row").forEach(f=>{var g;const n=parseInt(f.dataset.fieldIndex),p=d[b].fields[n];if(p.label=f.querySelector(".field-label").value,p.type=f.querySelector(".field-type").value,p.required=f.querySelector(".field-required").checked,p.type==="select"){const v=((g=f.querySelector(".field-options"))==null?void 0:g.value)||"";p.options=v.split(",").map(u=>u.trim()).filter(Boolean)}})})}function r(){e.querySelector("#btn-back").addEventListener("click",()=>z.navigate("/settings?tab=forms")),e.querySelector("#btn-cancel").addEventListener("click",()=>z.navigate("/settings?tab=forms")),e.querySelector("#btn-save").addEventListener("click",()=>{l();const c=e.querySelector("#form-name").value.trim(),b=e.querySelector("#form-desc").value.trim();if(!c){L("Form name is required","error"),e.querySelector("#form-name").focus();return}if(d.reduce((g,v)=>g+v.fields.length,0)===0){L("Please add at least one field to the form","error");return}const n={id:t?s:"fmt_"+Math.random().toString(36).substr(2,9),name:c,description:b,sections:d.map(g=>({...g}))},p=m.getAll("formTemplates");if(t){const g=p.findIndex(v=>v.id===s);p[g]=n}else p.push(n);m.save("formTemplates",p),L(`Form template "${c}" saved`,"success"),z.navigate("/settings?tab=forms")}),e.querySelector("#btn-add-section").addEventListener("click",()=>{l(),d.push({id:"sec_"+Math.random().toString(36).substr(2,5),title:"New Section",fields:[]}),i()}),e.querySelectorAll(".btn-add-field-to-sec").forEach(c=>{c.addEventListener("click",()=>{l();const b=parseInt(c.dataset.sectionIndex);d[b].fields.push({id:"f_"+Math.random().toString(36).substr(2,5),type:"text",label:"",required:!1}),i()})}),e.querySelectorAll(".remove-section").forEach(c=>{c.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this entire section and all its fields?")){const b=parseInt(c.dataset.sectionIndex);d.splice(b,1),i()}})}),e.querySelectorAll(".remove-field").forEach(c=>{c.addEventListener("click",()=>{const b=parseInt(c.dataset.sectionIndex),f=parseInt(c.dataset.fieldIndex);d[b].fields.splice(f,1),i()})}),e.querySelectorAll(".field-type").forEach(c=>{c.addEventListener("change",()=>{l(),i()})})}i()}const ua=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function ma(e,s){if(e.role==="admin"||e.role==="manager")return"/";if(!e.userTypeId)return"/schedule";const t=s.getById("userTypes",e.userTypeId);if(!t||!t.permissions)return"/schedule";for(const{path:a,module:o}of ua){const d=t.permissions.find(i=>i.module===o);if(d&&(d.view||d.create||d.edit||d.delete))return a}return"/schedule"}function ba(e){var r;const s=document.querySelector(".sidebar"),t=document.querySelector(".topbar"),a=document.getElementById("breadcrumb");s&&(s.style.display="none"),t&&(t.style.display="none"),a&&(a.style.display="none");const o=m.getAll("technicians").filter(c=>!c.deactivated),d=m.getAll("userTypes");e.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">FieldForge</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${o.map(c=>{const b=d.find(f=>f.id===c.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${c.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${c.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${b?b.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${o.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const i=async c=>{const b=o.find(u=>u.id===c),f=d.find(u=>u.id===(b==null?void 0:b.userTypeId));let n="technician";if(f){const u=f.name.toLowerCase();u.includes("admin")?n="admin":u.includes("manager")?n="manager":u.includes("office")&&(n="office")}const p={id:b.id,name:b.name,role:n,userTypeName:f?f.name:"Unassigned",userTypeId:b.userTypeId,color:b.color};sessionStorage.setItem("currentUser",JSON.stringify(p)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),ce(async()=>{const{updateSidebarAccess:u}=await Promise.resolve().then(()=>qt);return{updateSidebarAccess:u}},void 0).then(({updateSidebarAccess:u})=>{u&&u()}),ce(async()=>{const{updateTopbarAccess:u}=await Promise.resolve().then(()=>At);return{updateTopbarAccess:u}},void 0).then(({updateTopbarAccess:u})=>{u&&u()});const{store:g}=await ce(async()=>{const{store:u}=await Promise.resolve().then(()=>ds);return{store:u}},void 0),v=ma(p,g);z.navigate(v)};e.querySelectorAll(".btn-login-user").forEach(c=>{c.addEventListener("click",b=>{const f=b.target.closest(".btn-login-user");i(f.dataset.id)})});const l=()=>{const c={id:"customer-user",name:"Customer User",role:"customer"},b=m.get("people").filter(f=>f.type==="Customer");b.length>0&&(c.customerId=b[0].id,c.name=b[0].firstName+" "+b[0].lastName),sessionStorage.setItem("currentUser",JSON.stringify(c)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),ce(async()=>{const{updateSidebarAccess:f}=await Promise.resolve().then(()=>qt);return{updateSidebarAccess:f}},void 0).then(({updateSidebarAccess:f})=>{f&&f()}),ce(async()=>{const{updateTopbarAccess:f}=await Promise.resolve().then(()=>At);return{updateTopbarAccess:f}},void 0).then(({updateTopbarAccess:f})=>{f&&f()}),z.navigate("/portal")};(r=e.querySelector("#btn-login-customer"))==null||r.addEventListener("click",l)}function It(e){const s=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),t=s.customerId;if(s.role!=="customer"||!t){e.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const a=m.getAll("jobs").filter(c=>c.customerId===t),o=m.getAll("quotes").filter(c=>c.customerId===t),d=m.getAll("invoices").filter(c=>c.customerId===t);e.innerHTML=`
    <div class="page-header" style="background:var(--bg-surface); padding:20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1 style="margin:0;">Customer Portal</h1>
        <p style="margin:5px 0 0 0; color:var(--text-secondary);">Welcome back, ${s.name}</p>
      </div>
      <button class="btn btn-outline" id="portal-logout-btn">Log Out</button>
    </div>

    <div class="page-content" style="padding:20px; max-width:1200px; margin:0 auto;">

      <!-- Quotes Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Quotes</h2>
        ${o.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${o.map(c=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${c.number} - ${c.title||"Quote"}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(c.total||0).toFixed(2)} | Status: <span class="badge ${c.status==="Approved"?"badge-success":"badge-neutral"}">${c.status}</span></div>
                </div>
                <div>
                  ${c.status!=="Approved"?`<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${c.id}">Approve</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Jobs Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Jobs</h2>
        ${a.length===0?'<p style="color:var(--text-tertiary);">No jobs found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${a.map(c=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${c.number} - ${c.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${c.status}</span></div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Invoices Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Invoices</h2>
        ${d.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${d.map(c=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${c.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(c.total||0).toFixed(2)} | Status: <span class="badge ${c.status==="Paid"?"badge-success":"badge-danger"}">${c.status}</span></div>
                </div>
                <div>
                  ${c.status!=="Paid"?`<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${c.id}">Pay Now</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;const i=e.querySelector("#portal-logout-btn");i&&i.addEventListener("click",()=>{sessionStorage.removeItem("currentUser"),ce(async()=>{const{router:c}=await Promise.resolve().then(()=>ls);return{router:c}},void 0).then(({router:c})=>{c.navigate("/login")})}),e.querySelectorAll(".btn-approve-quote").forEach(c=>{c.addEventListener("click",b=>{const f=b.target.dataset.id;m.update("quotes",f,{status:"Approved"}),alert("Quote approved successfully!"),It(e)})}),e.querySelectorAll(".btn-pay-invoice").forEach(c=>{c.addEventListener("click",b=>{const f=b.target.dataset.id;m.update("invoices",f,{status:"Paid"}),alert("Invoice paid successfully!"),It(e)})})}function ut(e){const s=m.getAll("contractors");e.innerHTML=`
    <div class="page-header">
      <h1>Contractors</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-contractor"><span class="material-icons-outlined">add</span> Add Contractor</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search contractors..." id="contractors-search" />
      </div>
    </div>

    <div id="contractors-table-container"></div>
  `;let t=[...s];const o=ze({columns:[{key:"businessName",label:"Business Name",render:d=>`<span class="cell-link font-medium">${h(d.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:d=>h(d.email||"—")},{key:"phone",label:"Phone",render:d=>h(d.phone||"—")},{key:"active",label:"Status",render:d=>`<span class="badge ${d.active?"badge-success":"badge-neutral"}">${d.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:d=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${d.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:t,onRowClick:d=>z.navigate(`/contractors/${d}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:d=>{Re({container:e,selectedIds:d,onClear:()=>o.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:i=>{i.forEach(l=>m.update("contractors",l,{active:!0})),o.clearSelection(),ut(e),ce(async()=>{const{showToast:l}=await Promise.resolve().then(()=>Ce);return{showToast:l}},void 0).then(({showToast:l})=>l(`Activated ${i.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:i=>{i.forEach(l=>m.update("contractors",l,{active:!1})),o.clearSelection(),ut(e),ce(async()=>{const{showToast:l}=await Promise.resolve().then(()=>Ce);return{showToast:l}},void 0).then(({showToast:l})=>l(`Deactivated ${i.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:i=>{ce(async()=>{const{showModal:l}=await Promise.resolve().then(()=>qe);return{showModal:l}},void 0).then(({showModal:l})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${i.length} contractors? This action cannot be undone.</p>`,l({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Delete",className:"btn-danger",onClick:c=>{i.forEach(b=>m.delete("contractors",b)),o.clearSelection(),ut(e),ce(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ce);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deleted ${i.length} contractors`,"success")),c()}}]})})}}]})}});e.querySelector("#contractors-table-container").appendChild(o),e.querySelector("#btn-new-contractor").addEventListener("click",()=>z.navigate("/contractors/new")),e.querySelector("#contractors-search").addEventListener("input",d=>{const i=d.target.value.toLowerCase();t=s.filter(l=>l.businessName.toLowerCase().includes(i)||l.contactName.toLowerCase().includes(i)||(l.email||"").toLowerCase().includes(i)),o.updateData(t)}),e.addEventListener("click",d=>{const i=d.target.closest(".contractor-edit-btn");i&&(d.stopPropagation(),z.navigate(`/contractors/${i.dataset.id}/edit`))})}function ss(e,s){const t=s.id==="new";let a=t?{active:!0}:m.getById("contractors",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
    <div class="page-header">
      <h1>${t?"New Contractor":"Edit Contractor"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save</button>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <div class="card-body">
        <form id="contractor-form" style="display: flex; flex-direction: column; gap: 15px;">
          <div class="form-group">
            <label class="form-label">Business Name</label>
            <input type="text" id="businessName" class="form-input" value="${a.businessName||""}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contact Name</label>
            <input type="text" id="contactName" class="form-input" value="${a.contactName||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="email" class="form-input" value="${a.email||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="text" id="phone" class="form-input" value="${a.phone||""}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">License Number</label>
              <input type="text" id="licenseNumber" class="form-input" value="${a.licenseNumber||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Insurance Expiry</label>
              <input type="date" id="insuranceExpiry" class="form-input" value="${a.insuranceExpiry||""}" />
            </div>
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="active" ${a.active?"checked":""} />
            <label for="active" style="margin: 0;" class="form-label">Active</label>
          </div>
        </form>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{z.navigate(t?"/contractors":`/contractors/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const o={businessName:e.querySelector("#businessName").value,contactName:e.querySelector("#contactName").value,email:e.querySelector("#email").value,phone:e.querySelector("#phone").value,licenseNumber:e.querySelector("#licenseNumber").value,insuranceExpiry:e.querySelector("#insuranceExpiry").value,active:e.querySelector("#active").checked};if(!o.businessName||!o.contactName){alert("Business Name and Contact Name are required.");return}t?m.create("contractors",o):m.update("contractors",s.id,o),z.navigate("/contractors")})}function va(e,s){const t=m.getById("contractors",s.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
    <div class="page-header">
      <div class="page-header-info">
        <h1 style="margin: 0;">${h(t.businessName)}</h1>
        <p class="text-secondary" style="margin: 5px 0 0 0;">Contact: ${h(t.contactName)}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-edit"><span class="material-icons-outlined">edit</span> Edit</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 style="margin: 0;">Details</h4>
      </div>
      <div class="card-body">
        <div class="grid-2">
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Email</strong> ${h(t.email||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Phone</strong> ${h(t.phone||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">License</strong> ${h(t.licenseNumber||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Insurance Expiry</strong> ${h(t.insuranceExpiry||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Status</strong> <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span></div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{z.navigate(`/contractors/${s.id}/edit`)})}function mt(e){let s=m.getAll("assets");const t=m.getAll("fleet");s.length===0&&t.length>0&&(t.forEach(i=>{i.ownerType="Business",i.identifier=i.licensePlate,m.create("assets",i)}),s=m.getAll("assets")),e.innerHTML=`
    <div class="page-header">
      <h1>Assets Manager</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-asset"><span class="material-icons-outlined">add</span> Add Asset</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search assets..." id="asset-search" />
      </div>
    </div>

    <div id="asset-table-container"></div>
  `;let a=[...s];const d=ze({columns:[{key:"name",label:"Name / ID",render:i=>`<span class="cell-link font-medium">${h(i.name)}</span>`},{key:"owner",label:"Owner Type",render:i=>{if(i.ownerType==="Customer"&&i.customerId){const l=m.getById("customers",i.customerId);return l?`<span class="badge badge-neutral">${h(l.company)}</span>`:"Customer"}return'<span class="badge badge-primary">My Business</span>'}},{key:"type",label:"Category",render:i=>h(i.type||"—")},{key:"service",label:"Service Status",render:i=>{const r=(i.logs||[]).filter(f=>f.type==="Service").sort((f,n)=>new Date(n.date)-new Date(f.date))[0];if(!r||!i.serviceIntervalMonths)return'<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';const c=new Date(r.date);c.setMonth(c.getMonth()+parseInt(i.serviceIntervalMonths));const b=c<new Date;return`<span style="color:${b?"var(--color-danger)":"var(--text-secondary)"}; font-size:12px; font-weight:${b?"600":"400"}">
          ${b?"OVERDUE":c.toLocaleDateString()}
        </span>`}},{key:"status",label:"Status",render:i=>`<span class="badge ${i.status==="Active"?"badge-success":i.status==="In Maintenance"?"badge-warning":"badge-neutral"}">${h(i.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:i=>{if(!i.assignedToId)return"—";const l=m.getById("technicians",i.assignedToId);return l?h(l.name):"—"}},{key:"actions",label:"",width:"80px",render:i=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${i.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:a,onRowClick:i=>z.navigate(`/assets/${i}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:i=>{Re({container:e,selectedIds:i,onClear:()=>d.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:l=>{const r=document.createElement("div");r.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Commissioning">Commissioning</option>
                    <option value="Decommissioned">Decommissioned</option>
                    <option value="Lost/Stolen">Lost/Stolen</option>
                  </select>
                </div>
              `,ce(async()=>{const{showModal:c}=await Promise.resolve().then(()=>qe);return{showModal:c}},void 0).then(({showModal:c})=>{c({title:`Update ${l.length} Assets`,content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{const f=r.querySelector("#bulk-status").value;l.forEach(n=>m.update("assets",n,{status:f})),d.clearSelection(),mt(e),ce(async()=>{const{showToast:n}=await Promise.resolve().then(()=>Ce);return{showToast:n}},void 0).then(({showToast:n})=>n(`Updated ${l.length} assets to ${f}`,"success")),b()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:l=>{ce(async()=>{const{showToast:r}=await Promise.resolve().then(()=>Ce);return{showToast:r}},void 0).then(({showToast:r})=>r(`Generating tags for ${l.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{ce(async()=>{const{showModal:r}=await Promise.resolve().then(()=>qe);return{showModal:r}},void 0).then(({showModal:r})=>{const c=document.createElement("div");c.innerHTML=`<p>Are you sure you want to delete ${l.length} assets? This action cannot be undone.</p>`,r({title:"Confirm Bulk Delete",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{l.forEach(f=>m.delete("assets",f)),d.clearSelection(),mt(e),ce(async()=>{const{showToast:f}=await Promise.resolve().then(()=>Ce);return{showToast:f}},void 0).then(({showToast:f})=>f(`Deleted ${l.length} assets`,"success")),b()}}]})})}}]})}});e.querySelector("#asset-table-container").appendChild(d),e.querySelector("#btn-new-asset").addEventListener("click",()=>{Jt({onSave:()=>mt(e)})}),e.querySelector("#asset-search").addEventListener("input",i=>{const l=i.target.value.toLowerCase();a=s.filter(r=>r.name.toLowerCase().includes(l)||(r.serial||r.identifier||r.licensePlate||"").toLowerCase().includes(l)||(r.type||"").toLowerCase().includes(l)),d.updateData(a)}),e.addEventListener("click",i=>{const l=i.target.closest(".asset-edit-btn");l&&(i.stopPropagation(),z.navigate(`/assets/${l.dataset.id}/edit`))})}function as(e,s){const t=s.id==="new";let a=t?{status:"Active",ownerType:"Business",type:"Plant & Equipment",serviceIntervalMonths:6,currentMeter:0,recoveryRate:0}:m.getById("assets",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const o=m.getAll("people").filter(p=>p.type==="Staff"),d=m.getAll("customers");let i=[];if(a.customerId){const p=m.getById("customers",a.customerId);p&&p.sites&&(i=p.sites)}e.innerHTML=`
    <div class="page-header">
      <h1>${t?"New Asset":"Edit Asset"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save</button>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <div class="card-body">
        <form id="asset-form" style="display: flex; flex-direction: column; gap: 15px;">
          <div class="form-group">
            <label class="form-label">Asset Name/ID *</label>
            <input type="text" id="name" class="form-input" value="${a.name||""}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="description" class="form-input" rows="3">${a.description||""}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Owner Type</label>
              <select id="ownerType" class="form-select">
                <option value="Business" ${a.ownerType==="Business"?"selected":""}>My Business (Revenue Tool)</option>
                <option value="Customer" ${a.ownerType==="Customer"?"selected":""}>Customer (Service Target)</option>
              </select>
            </div>
            <div class="form-group" id="customer-select-group" style="display: ${a.ownerType==="Customer"?"block":"none"};">
              <label class="form-label">Customer *</label>
              <select id="customerId" class="form-select">
                <option value="">Select customer...</option>
                ${d.map(p=>`<option value="${p.id}" ${a.customerId===p.id?"selected":""}>${p.company||p.firstName+" "+p.lastName}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type / Category</label>
              <select id="type" class="form-select">
                ${["Vehicle","Plant & Equipment","Specialized Tool","Fixed Asset (HVAC/Solar/Fire)","Other"].map(p=>`<option value="${p}" ${a.type===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Serial / ID / License</label>
              <input type="text" id="serial" class="form-input" value="${a.serial||a.identifier||""}" placeholder="e.g. S/N 12345 or REG-123" />
            </div>
          </div>

          <div class="form-row" id="business-fields" style="display: ${a.ownerType==="Business"?"flex":"none"};">
            <div class="form-group">
              <label class="form-label">Recovery Rate ($/hr)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="text-tertiary">$</span>
                <input type="number" id="recoveryRate" class="form-input" value="${a.recoveryRate||0}" step="0.5" />
              </div>
              <div class="form-help">Amount charged to jobs for using this asset.</div>
            </div>
            <div class="form-group">
               <label class="form-label">Assign to Default Staff</label>
               <select id="assignedToId" class="form-select">
                 <option value="">Unassigned</option>
                 ${o.map(p=>`<option value="${p.id}" ${a.assignedToId===p.id?"selected":""}>${p.firstName} ${p.lastName}</option>`).join("")}
               </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Service Interval (Months)</label>
              <input type="number" id="serviceIntervalMonths" class="form-input" value="${a.serviceIntervalMonths||6}" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Current Meter / Hours</label>
              <input type="number" id="currentMeter" class="form-input" value="${a.currentMeter||0}" step="1" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location / Site</label>
              <select id="site" class="form-select" ${a.ownerType==="Business"?"disabled":""}>
                <option value="">-- No specific site --</option>
                ${i.map(p=>`<option value="${p.name}" ${a.site===p.name?"selected":""}>${p.name}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Install / Purchase Date</label>
              <input type="date" id="installDate" class="form-input" value="${a.installDate||""}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="status" class="form-select">
              ${["Active","In Maintenance","Commissioning","Decommissioned","Lost/Stolen"].map(p=>`<option value="${p}" ${a.status===p?"selected":""}>${p}</option>`).join("")}
            </select>
          </div>
        </form>
      </div>
    </div>
  `;const l=e.querySelector("#ownerType"),r=e.querySelector("#customer-select-group"),c=e.querySelector("#customerId"),b=e.querySelector("#site"),f=e.querySelector("#business-fields");l.addEventListener("change",p=>{const g=p.target.value==="Customer";r.style.display=g?"block":"none",f.style.display=g?"none":"flex",b.disabled=!g,g?n(c.value):b.innerHTML='<option value="">-- No specific site --</option>'}),c.addEventListener("change",p=>{n(p.target.value)});function n(p){if(!p){b.innerHTML='<option value="">-- No specific site --</option>';return}const g=m.getById("customers",p);if(!g||!g.sites||g.sites.length===0){b.innerHTML='<option value="">-- No specific site --</option>';return}b.innerHTML='<option value="">-- No specific site --</option>'+g.sites.map(v=>`<option value="${v.name}" ${a.site===v.name?"selected":""}>${v.name}</option>`).join("")}e.querySelector("#btn-cancel").addEventListener("click",()=>{z.navigate(t?"/assets":`/assets/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{var g;const p={name:e.querySelector("#name").value,description:e.querySelector("#description").value,serial:e.querySelector("#serial").value,identifier:e.querySelector("#serial").value,type:e.querySelector("#type").value,status:e.querySelector("#status").value,assignedToId:e.querySelector("#assignedToId").value,ownerType:e.querySelector("#ownerType").value,customerId:e.querySelector("#ownerType").value==="Customer"?e.querySelector("#customerId").value:null,site:e.querySelector("#site").value,installDate:e.querySelector("#installDate").value,recoveryRate:parseFloat(((g=e.querySelector("#recoveryRate"))==null?void 0:g.value)||0),serviceIntervalMonths:parseInt(e.querySelector("#serviceIntervalMonths").value||6),currentMeter:parseFloat(e.querySelector("#currentMeter").value||0)};if(!p.name){alert("Asset Name is required.");return}t?(p.logs=[],m.create("assets",p)):m.update("assets",s.id,p),z.navigate("/assets")})}function os(e,s){const t=m.getById("assets",s.id);if(!t){e.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}m.getSettings();let a="Unassigned";if(t.assignedToId){const n=m.getById("technicians",t.assignedToId);n&&(a=n.name)}let o="My Business",d="Internal Asset";if(t.ownerType==="Customer"&&t.customerId){const n=m.getById("customers",t.customerId);n&&(o=n.company),d="Customer Asset"}const i=t.logs||[],l=i.reduce((n,p)=>n+(parseFloat(p.cost)||0),0),r=i.filter(n=>n.type==="Service").sort((n,p)=>new Date(p.date)-new Date(n.date))[0];let c="Not Scheduled",b=!1;if(r&&t.serviceIntervalMonths){const n=new Date(r.date);n.setMonth(n.getMonth()+parseInt(t.serviceIntervalMonths)),c=n.toLocaleDateString(),b=n<new Date}e.innerHTML=`
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
          <span class="material-icons-outlined" style="color:var(--color-primary)">${t.type==="Vehicle"?"directions_car":"precision_manufacturing"}</span>
        </div>
        <div>
          <h1 style="margin: 0;">${h(t.name)}</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
            <span class="badge ${t.ownerType==="Business"?"badge-primary":"badge-neutral"}">${d}</span>
            <span class="text-tertiary" style="font-size:12px">• ${h(t.identifier||t.serial||"No ID")}</span>
          </div>
        </div>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-edit"><span class="material-icons-outlined" style="font-size:18px">edit</span> Edit Details</button>
      </div>
    </div>

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Current Status</div>
          <div style="display:flex; align-items:center; gap:8px">
            <div style="width:10px; height:10px; border-radius:50%; background:${t.status==="Active"?"var(--color-success)":"var(--color-warning)"}"></div>
            <span style="font-weight:600; font-size:16px">${t.status||"Active"}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Next Service Due</div>
          <div style="font-weight:600; font-size:16px; color:${b?"var(--color-danger)":"inherit"}">
            ${c}
            ${b?'<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">OVERDUE</span>':""}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">
            ${t.ownerType==="Business"?"Total Maintenance Spend":"Current Meter Reading"}
          </div>
          <div style="font-weight:600; font-size:16px">
            ${t.ownerType==="Business"?`$${l.toLocaleString()}`:`${t.currentMeter||0} hrs/km`}
          </div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-lg);">
      <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
        <div class="card">
          <div class="card-header"><h4>Asset Information</h4></div>
          <div class="card-body">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Category</span>
                <span class="font-medium">${h(t.type||"-")}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Owner</span>
                <span class="font-medium">${h(o)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Assigned To</span>
                <span class="font-medium">${h(a)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Location</span>
                <span class="font-medium">${h(t.site||"Main Office")}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Interval</span>
                <span class="font-medium">${t.serviceIntervalMonths||6} Months</span>
              </div>
              ${t.ownerType==="Business"?`
                <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-color); margin-top:4px">
                  <span class="text-secondary">Recovery Rate</span>
                  <span class="font-medium" style="color:var(--color-primary)">$${(t.recoveryRate||0).toFixed(2)}/hr</span>
                </div>
              `:""}
            </div>
          </div>
        </div>

        ${t.description?`
        <div class="card">
          <div class="card-header"><h4>Description</h4></div>
          <div class="card-body text-secondary" style="font-size:13px">
            ${h(t.description)}
          </div>
        </div>
        `:""}
      </div>

      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0;">Service & Activity History</h4>
          <button class="btn btn-sm btn-primary" id="btn-add-log">
            <span class="material-icons-outlined" style="font-size:16px">add</span> New Log
          </button>
        </div>

        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:100px">Date</th>
                <th style="width:120px">Meter</th>
                <th style="width:120px">Type</th>
                <th>Notes</th>
                <th style="text-align:right">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${i.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>':i.sort((n,p)=>new Date(p.date)-new Date(n.date)).map(n=>`
                  <tr>
                    <td class="font-medium">${new Date(n.date).toLocaleDateString()}</td>
                    <td class="text-secondary">${n.meter||"-"}</td>
                    <td>
                      <span class="badge ${n.type==="Service"?"badge-success":n.type==="Repair"?"badge-danger":"badge-neutral"}">
                        ${h(n.type)}
                      </span>
                    </td>
                    <td><span class="text-secondary" style="font-size:13px">${h(n.notes||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${n.cost>0?`$${parseFloat(n.cost).toFixed(2)}`:"—"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{z.navigate(`/assets/${s.id}/edit`)}),e.querySelector("#btn-add-log").addEventListener("click",()=>{f()});function f(){const n=document.createElement("div");n.innerHTML=`
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" id="log-date" class="form-input" value="${new Date().toISOString().split("T")[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">Log Type</label>
          <select id="log-type" class="form-select">
            <option value="Service">Routine Service</option>
            <option value="Repair">Repair</option>
            <option value="Inspection">Inspection</option>
            <option value="Refuel">Refuel / Usage</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Current Meter Reading</label>
          <input type="number" id="log-meter" class="form-input" value="${t.currentMeter||0}" />
        </div>
        <div class="form-group">
          <label class="form-label">Internal Cost ($)</label>
          <input type="number" id="log-cost" class="form-input" value="0" step="0.01" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea id="log-notes" class="form-input" rows="3" placeholder="Describe the work performed..."></textarea>
      </div>
    `,ce(async()=>{const{showModal:p}=await Promise.resolve().then(()=>qe);return{showModal:p}},void 0).then(({showModal:p})=>{p({title:"Add Activity Log",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Save Log",className:"btn-primary",onClick:g=>{const v=n.querySelector("#log-date").value,u=n.querySelector("#log-type").value,y=parseFloat(n.querySelector("#log-meter").value),x=parseFloat(n.querySelector("#log-cost").value),C=n.querySelector("#log-notes").value;if(!v)return;const k={date:v,type:u,meter:y,cost:x,notes:C},S=[...t.logs||[],k];m.update("assets",t.id,{logs:S,currentMeter:y,status:u==="Repair"?"In Maintenance":t.status}),g(),os(e,s)}}]})})}}function ya(e){let s="All Documents";const t=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),a=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];function o(){if(t.role==="admin"||t.role==="manager")return a;const i=["All Documents","Health & Safety","Job Attachments","Customer Attachments","Digital Forms","Purchase Orders"],l=t.userTypeId?m.getById("userTypes",t.userTypeId):null;if(l&&l.permissions){const r=l.permissions.find(b=>b.module==="Quotes"),c=l.permissions.find(b=>b.module==="Invoices");r&&r.view&&i.push("Quotes"),c&&c.view&&i.push("Invoices")}return a.filter(r=>i.includes(r))}function d(){const i=o();i.includes(s)||(s="All Documents");const l=[];m.getAll("documents").forEach(u=>{l.push({id:u.id,name:u.name,url:u.url,type:u.type,size:u.size,uploadedAt:u.uploadedAt,folder:u.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),m.getAll("jobs").forEach(u=>{u.attachments&&Array.isArray(u.attachments)&&u.attachments.forEach(y=>{l.push({id:y.id||Math.random().toString(36).substr(2,9),name:y.name,url:y.url||y.data||"#",type:y.type,size:y.size,uploadedAt:y.uploadedAt||y.date||u.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:u.id,entityName:`${u.number} - ${u.title}`})}),u.activityLog&&Array.isArray(u.activityLog)&&u.activityLog.forEach(y=>{y.type==="attachment"&&y.file&&l.push({id:y.id,name:y.file.name,url:y.file.url||y.file.data||"#",type:y.file.type,size:y.file.size,uploadedAt:y.date,folder:"Job Attachments",entityType:"Job",entityId:u.id,entityName:`${u.number} - ${u.title}`}),y.type==="combined"&&Array.isArray(y.files)&&y.files.forEach((x,C)=>{l.push({id:`${y.id}_${C}`,name:x.name,url:x.url||x.data||"#",type:x.type,size:x.size,uploadedAt:y.date,folder:"Job Attachments",entityType:"Job",entityId:u.id,entityName:`${u.number} - ${u.title}`})})}),u.forms&&Array.isArray(u.forms)&&u.forms.forEach((y,x)=>{l.push({id:`form_${u.id}_${x}`,name:`${y.type} - ${new Date(y.date).toLocaleDateString()}`,url:`#/jobs/${u.id}`,type:"Digital Form",size:null,uploadedAt:y.date,folder:"Digital Forms",entityType:"Job",entityId:u.id,entityName:`${u.number} - ${u.title}`})})}),m.getAll("customers").forEach(u=>{u.attachments&&Array.isArray(u.attachments)&&u.attachments.forEach(y=>{l.push({id:y.id||Math.random().toString(36).substr(2,9),name:y.name,url:y.url||y.data||"#",type:y.type,size:y.size,uploadedAt:y.uploadedAt||u.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:u.id,entityName:u.company})})}),m.getAll("invoices").forEach(u=>{l.push({id:u.id,name:`Invoice ${u.number}.pdf`,url:`#/invoices/${u.id}`,type:"Invoice PDF",size:null,uploadedAt:u.issueDate,folder:"Invoices",entityType:"Invoice",entityId:u.id,entityName:`Inv ${u.number} - ${u.customerName}`})}),m.getAll("quotes").forEach(u=>{l.push({id:u.id,name:`Quote ${u.number}.pdf`,url:`#/quotes/${u.id}`,type:"Quote PDF",size:null,uploadedAt:u.createdAt,folder:"Quotes",entityType:"Quote",entityId:u.id,entityName:`Quote ${u.number} - ${u.customerName}`})}),m.getAll("purchaseOrders").forEach(u=>{l.push({id:u.id,name:`PO ${u.number}.pdf`,url:`#/purchase-orders/${u.id}`,type:"PO PDF",size:null,uploadedAt:u.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:u.id,entityName:`PO ${u.number} - ${u.supplierName}`})}),m.getAll("taskTemplates").forEach(u=>{l.push({id:`task_tmpl_${u.id}`,name:`${u.name} (Tasklist Template)`,url:"#/settings",type:"Tasklist Template",size:null,uploadedAt:u.createdAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:u.id,entityName:"Settings / Tasklist Templates"})}),m.getAll("formTemplates").forEach(u=>{l.push({id:`form_tmpl_${u.id}`,name:`${u.name} (Compliance Form Template)`,url:"#/settings",type:"Form Template",size:null,uploadedAt:u.createdAt||u.updatedAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:u.id,entityName:"Settings / Compliance Forms"})});const r=l.filter(u=>i.includes(u.folder));r.sort((u,y)=>new Date(y.uploadedAt)-new Date(u.uploadedAt));let c=r;s!=="All Documents"&&(c=r.filter(u=>u.folder===s));const b=i;e.innerHTML=`
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1>Document Center</h1>
        <button class="btn btn-primary" id="btn-upload-doc"><span class="material-icons-outlined">upload_file</span> Upload Document</button>
      </div>

      <div style="display:flex; gap:10px; align-items:flex-start; margin-top:10px;">
        <!-- Sidebar Folders -->
        <div class="card" style="width:250px; flex-shrink:0; position: sticky; top: 10px;">
          <div class="card-body" style="padding:12px">
            <h4 style="margin:0 0 12px 8px; font-size:12px; text-transform:uppercase; color:var(--text-tertiary)">Categories</h4>
            <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:4px;" id="folder-list">
              ${b.map(u=>{let y="folder";u==="All Documents"?y="dashboard":u==="Company Docs"?y="domain":u==="Health & Safety"?y="health_and_safety":u==="Templates"?y="file_copy":u==="Job Attachments"?y="build":u==="Customer Attachments"?y="people":u==="Digital Forms"?y="assignment":u==="Invoices"?y="receipt_long":u==="Quotes"?y="request_quote":u==="Purchase Orders"&&(y="shopping_cart");const x=s===u,C=u==="All Documents"?r.length:r.filter(k=>k.folder===u).length;return`
                <li>
                  <button class="btn btn-ghost ${x?"active":""}" data-folder="${u}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${x?"var(--color-primary-bg)":"transparent"}; color:${x?"var(--primary-color)":"var(--text-primary)"}; font-weight:${x?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${y}</span> ${u}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${C}</span>
                  </button>
                </li>
              `}).join("")}
            </ul>
          </div>
        </div>

        <!-- Main Content -->
        <div class="card" style="flex:1; min-width:0;">
          <div class="card-header" style="padding:16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color)">
            <h3 style="margin:0">${s}</h3>
            <div class="toolbar-search">
              <span class="material-icons-outlined">search</span>
              <input type="text" placeholder="Search ${s.toLowerCase()}..." id="docs-search" />
            </div>
          </div>
          <div class="card-body" style="padding:0; overflow-x:auto;">
            <div id="docs-table-container"></div>
          </div>
        </div>
      </div>
    `,e.querySelectorAll("#folder-list button").forEach(u=>{u.addEventListener("click",()=>{s=u.dataset.folder,d()})});let f=[...c];const p=ze({columns:[{key:"name",label:"File Name",render:u=>{let y="insert_drive_file";return u.type==="Invoice PDF"||u.type==="Quote PDF"||u.type==="PO PDF"?y="picture_as_pdf":u.type==="Digital Form"?y="assignment":u.type&&u.type.includes("image")&&(y="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${y}</span> <span class="font-medium truncate" style="max-width:300px" title="${h(u.name)}">${h(u.name)}</span></div>`}},{key:"folder",label:"Category",render:u=>h(u.folder||"—")},{key:"size",label:"Size",render:u=>u.size?(u.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:u=>{if(u.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let y="#";return u.entityType==="Job"?y=`#/jobs/${u.entityId}`:u.entityType==="Customer"?y=`#/people/${u.entityId}`:u.entityType==="Invoice"?y=`#/invoices/${u.entityId}`:u.entityType==="Quote"?y=`#/quotes/${u.entityId}`:u.entityType==="PO"&&(y=`#/purchase-orders/${u.entityId}`),`<span class="badge badge-neutral">${u.entityType}</span> <a href="${y}">${h(u.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:u=>u.uploadedAt?new Date(u.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:u=>`<a href="${h(u.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`}],data:f,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:u=>{Re({container:e.querySelector(".main-wrapper")||e,selectedIds:u,onClear:()=>p.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:y=>{const x=b.filter(k=>k!=="All Documents"),C=document.createElement("div");C.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${x.map(k=>`<option value="${k}">${k}</option>`).join("")}
                    </select>
                  </div>
                `,fe({title:`Move ${y.length} Documents`,content:C,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Move",className:"btn-primary",onClick:k=>{const S=C.querySelector("#bulk-folder").value;y.forEach($=>{m.getById("documents",$)&&m.update("documents",$,{folder:S})}),p.clearSelection(),d(),L(`Moved ${y.length} documents to ${S}`,"success"),k()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:y=>{fe({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${y.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Delete",className:"btn-danger",onClick:x=>{y.forEach(C=>m.delete("documents",C)),p.clearSelection(),d(),L(`Deleted ${y.length} documents`,"success"),x()}}]})}}]})}});e.querySelector("#docs-table-container").appendChild(p);const g=e.querySelector("#docs-search");function v(){const u=g.value.toLowerCase();f=c.filter(y=>y.name.toLowerCase().includes(u)||y.entityName&&y.entityName.toLowerCase().includes(u)||y.folder&&y.folder.toLowerCase().includes(u)),p.updateData(f)}g.addEventListener("input",v),e.querySelector("#btn-upload-doc").addEventListener("click",()=>{const u=b.filter(x=>x!=="All Documents"),y=document.createElement("div");y.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${u.map(x=>`<option value="${x}">${x}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,fe({title:"Upload Global Document",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Upload",className:"btn-primary",onClick:x=>{const C=document.getElementById("upload-file-input"),k=document.getElementById("upload-folder").value;if(!C.files.length){L("Please select a file","error");return}const S=C.files[0],$=new FileReader;$.onload=I=>{m.create("documents",{name:S.name,type:S.type||"unknown",size:S.size,url:I.target.result,folder:k,uploadedAt:new Date().toISOString()}),L("Document uploaded successfully","success"),d(),x()},$.readAsDataURL(S)}}]})})}d()}$s();window.__fieldForge={router:z,store:m};const ns=document.getElementById("app"),fa=_t(),rt=document.createElement("div");rt.className="main-wrapper";const ga=Ht(),Et=document.createElement("div");Et.className="breadcrumb";Et.id="breadcrumb";const Ke=document.createElement("main");Ke.className="main-content";Ke.id="main-content";rt.appendChild(ga);rt.appendChild(Et);rt.appendChild(Ke);ns.appendChild(fa);ns.appendChild(rt);function me(e){return s=>{Ke.innerHTML="",Ke.scrollTop=0,e(Ke,s)}}z.register("/login",me(ba));z.register("/portal",me(It));z.register("/",me(Ds));z.register("/people",me(St));z.register("/people/new",me((e,s)=>Vt(e,{id:"new"})));z.register("/people/:id",me(Vs));z.register("/people/:id/edit",me((e,s)=>Vt(e,s)));z.register("/contractors",me(ut));z.register("/contractors/new",me((e,s)=>ss(e,{id:"new"})));z.register("/contractors/:id",me(va));z.register("/contractors/:id/edit",me((e,s)=>ss(e,s)));z.register("/leads",me(kt));z.register("/leads/new",me((e,s)=>Qt(e,{id:"new"})));z.register("/leads/:id",me(Qs));z.register("/leads/:id/edit",me((e,s)=>Qt(e,s)));z.register("/notifications",me(Wt));z.register("/quotes",me(Ct));z.register("/quotes/new",me((e,s)=>Yt(e,{id:"new"})));z.register("/quotes/:id",me(Yt));z.register("/jobs",me(Tt));z.register("/jobs/new",me((e,s)=>Kt(e,{id:"new"})));z.register("/jobs/:id",me(Gs));z.register("/jobs/:id/edit",me((e,s)=>Kt(e,s)));z.register("/timesheets",me(Zs));z.register("/assets",me(mt));z.register("/assets/new",me((e,s)=>as(e,{id:"new"})));z.register("/assets/:id",me(os));z.register("/assets/:id/edit",me((e,s)=>as(e,s)));z.register("/schedule",me(ea));z.register("/stock",me(Ge));z.register("/stock/new",me((e,s)=>Xt(e,{id:"new"})));z.register("/stock/:id",me(ta));z.register("/stock/:id/edit",me((e,s)=>Xt(e,s)));z.register("/invoices",me(pt));z.register("/invoices/new",me((e,s)=>Zt(e,{id:"new"})));z.register("/invoices/:id",me(Zt));z.register("/purchase-orders",me(Ye));z.register("/purchase-orders/:id",me(sa));z.register("/documents",me(ya));z.register("/reports",me(aa));z.register("/settings",me(pa));z.register("/settings/forms/new",me((e,s)=>ts(e,{id:"new"})));z.register("/settings/forms/:id/edit",me((e,s)=>ts(e,s)));const ha=["/","/people","/contractors","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings","/settings/forms"];z.onNavigate=(e,s)=>{const t=JSON.parse(sessionStorage.getItem("currentUser")||"null"),a=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];if(!t&&e!=="/login")return z.navigate("/login"),!1;if(t){if(t.role==="customer"&&ha.includes(a))return z.navigate("/portal"),!1;if(t.role!=="customer"&&a==="/portal")return z.navigate("/"),!1;if(t.role!=="admin"&&t.role!=="customer"&&t.userTypeId&&e!=="/login"){const o=m.getById("userTypes",t.userTypeId);if(o&&o.permissions){const d={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},i=d[a];if(i&&!(i==="Notifications"||i==="Dashboard")){const l=o.permissions.find(r=>r.module===i);if(!l||Object.entries(l||{}).every(([r,c])=>r==="module"||!c)){const c=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/assets","/documents","/settings"].find(b=>{const f=d[b];if(f==="Notifications"||f==="Dashboard")return!0;const n=o.permissions.find(p=>p.module===f);return n&&Object.entries(n).some(([p,g])=>p!=="module"&&g===!0)})||"/";if(a!==c)return z.navigate(c),!1}}}}}Ft(e),Ls(e)};window.addEventListener("fieldforge-logout",()=>{sessionStorage.removeItem("currentUser");const e=document.querySelector(".sidebar"),s=document.querySelector(".topbar"),t=document.getElementById("breadcrumb");e&&(e.style.display="none"),s&&(s.style.display="none"),t&&(t.style.display="none"),z.navigate("/login")});const xa=JSON.parse(sessionStorage.getItem("currentUser")||"null");!xa&&window.location.hash!=="#/login"&&(window.location.hash="#/login");z.resolve();
