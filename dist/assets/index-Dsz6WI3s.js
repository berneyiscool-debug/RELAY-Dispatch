(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();class Rt{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(s,t){this.routes[s]=t}navigate(s){typeof window<"u"&&(window.location.hash=s)}resolve(s){let t=s||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const a=t.indexOf("?"),o={};if(a!==-1){const p=t.substring(a+1);t=t.substring(0,a),p.split("&").forEach(d=>{const[l,y]=d.split("=");l&&(o[l]=decodeURIComponent(y||""))})}const{handler:i,params:r}=this.matchRoute(t);if(i){this.currentRoute=t;const p={...r,...o};if(this.onNavigate&&this.onNavigate(t,p)===!1)return;i(p)}}matchRoute(s){if(this.routes[s])return{handler:this.routes[s],params:{}};for(const[t,a]of Object.entries(this.routes)){const o=t.split("/"),i=s.split("/");if(o.length!==i.length)continue;const r={};let p=!0;for(let d=0;d<o.length;d++)if(o[d].startsWith(":"))r[o[d].slice(1)]=i[d];else if(o[d]!==i[d]){p=!1;break}if(p)return{handler:a,params:r}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const F=new Rt,ps=Object.freeze(Object.defineProperty({__proto__:null,Router:Rt,router:F},Symbol.toStringTag,{value:"Module"})),mt="simpro_";class us{constructor(){this.listeners={}}_key(s){return mt+s}getAll(s){try{const t=localStorage.getItem(this._key(s));return t?JSON.parse(t):[]}catch{return[]}}getById(s,t){return this.getAll(s).find(o=>o.id===t)||null}save(s,t){localStorage.setItem(this._key(s),JSON.stringify(t)),this.emit(s,t)}create(s,t){const a=this.getAll(s);return t.id=t.id||this.generateId(),t.createdAt=t.createdAt||new Date().toISOString(),t.updatedAt=new Date().toISOString(),a.push(t),this.save(s,a),t}update(s,t,a){const o=this.getAll(s),i=o.findIndex(r=>r.id===t);return i===-1?null:(o[i]={...o[i],...a,updatedAt:new Date().toISOString()},this.save(s,o),o[i])}delete(s,t){const o=this.getAll(s).filter(i=>i.id!==t);this.save(s,o)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const s={markupPercent:20,materialMarkup:{defaultPercent:30,minMarkupAmount:5,useTiers:!0,tiers:[{upTo:50,percent:60},{upTo:200,percent:45},{upTo:1e3,percent:30},{upTo:null,percent:15}]},materialCategories:["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],laborRates:[{id:"rate_1",name:"Standard Rate",rate:85,description:"Normal business hours Mon–Fri",overtimeMultiplier:1,minCallOutFee:0,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!0},{id:"rate_2",name:"After Hours Rate",rate:127.5,description:"Evenings and early mornings",overtimeMultiplier:1.5,minCallOutFee:45,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!1},{id:"rate_3",name:"Saturday Rate",rate:127.5,description:"Saturday work",overtimeMultiplier:1.5,minCallOutFee:65,applicableDays:["Sat"],isDefault:!1},{id:"rate_4",name:"Sunday Rate",rate:170,description:"Sunday and public holidays",overtimeMultiplier:2,minCallOutFee:85,applicableDays:["Sun","PH"],isDefault:!1},{id:"rate_5",name:"Emergency Rate",rate:195,description:"Urgent call-outs any day",overtimeMultiplier:2,minCallOutFee:120,applicableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],isDefault:!1}]};try{const t=localStorage.getItem(this._key("settings"));return t?JSON.parse(t):s}catch{return s}}saveSettings(s){localStorage.setItem(this._key("settings"),JSON.stringify(s)),this.emit("settings",s)}on(s,t){this.listeners[s]||(this.listeners[s]=[]),this.listeners[s].push(t)}off(s,t){this.listeners[s]&&(this.listeners[s]=this.listeners[s].filter(a=>a!==t))}emit(s,t){this.listeners[s]&&this.listeners[s].forEach(a=>a(t))}isSeeded(){return localStorage.getItem(mt+"_seeded")==="true"}markSeeded(){localStorage.setItem(mt+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(s=>s.startsWith(mt)).forEach(s=>localStorage.removeItem(s))}}const c=new us,ms=Object.freeze(Object.defineProperty({__proto__:null,store:c},Symbol.toStringTag,{value:"Module"}));function je(e,s){const t=JSON.parse(localStorage.getItem("currentUser")||"null");if(!t)return!1;if(t.role==="admin")return!0;if(t.role==="customer")return!1;if(t.userTypeId){const a=c.getById("userTypes",t.userTypeId);if(a&&a.permissions){const o=a.permissions.find(i=>i.module===e);return o?!!o[s]:!1}}return t.role==="technician"?e==="Dashboard"?s==="view":e==="Jobs"?["view","manage_tasks","book_time"].includes(s):e==="Timesheets"?["view_own","create"].includes(s):e==="Schedule"?["view_own"].includes(s):!1:t.role==="manager"?e==="Settings"?["view","edit_company","manage_tax"].includes(s):!0:!1}const dt={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Tasklists"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs & Financials"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create / Submit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"edit_all",label:"Edit Any Timesheet"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Create Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View Full Schedule"},{key:"edit",label:"Manage Schedule (Drag/Drop)"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Create Contractors"},{key:"edit",label:"Edit Contractors"}],Stock:[{key:"view",label:"View Inventory"},{key:"create",label:"Create Stock Items"},{key:"edit",label:"Manage Stock Levels"},{key:"delete",label:"Delete Stock"}],"Purchase Orders":[{key:"view",label:"View POs"},{key:"create",label:"Create POs"},{key:"approve",label:"Approve POs"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"send",label:"Send Invoices"},{key:"void",label:"Void Invoices"}],Reports:[{key:"view",label:"Access Reports"},{key:"export",label:"Export Data"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Files"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Profile"},{key:"manage_users",label:"Manage Users & Permissions"},{key:"manage_tax",label:"Manage Tax & Finance"}]};function nt(e){return Object.entries(dt).map(([s,t])=>{const a={module:s};return t.forEach(({key:o})=>{a[o]=e(s,o)}),a})}function bs(){const e=c.getAll("userTypes");if(e&&e.length>0)return e;const s=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:nt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:nt((t,a)=>t==="Settings"?["view","edit_company","manage_tax"].includes(a):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:nt((t,a)=>t==="Dashboard"?a==="view":t==="Jobs"?["view","manage_tasks","book_time"].includes(a):t==="Timesheets"?["view_own","create"].includes(a):t==="Schedule"?["view_own"].includes(a):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:nt((t,a)=>t==="Settings"?!1:t==="Reports"?a==="view":!(["Invoices","Purchase Orders"].includes(t)&&a==="delete"))}];return c.save("userTypes",s),s}const vs=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],ct=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin",payRate:95},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager",payRate:85},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech",payRate:58},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech",payRate:62},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech",payRate:55},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office",payRate:42}],st=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],St=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],bt=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function Se(e){return e[Math.floor(Math.random()*e.length)]}function ze(e,s=0){const t=new Date,a=Math.floor(Math.random()*(e+s))-e;return new Date(t.getTime()+a*864e5).toISOString()}function Ve(e,s){return Math.round((Math.random()*(s-e)+e)*100)/100}function ys(){return vs.map((e,s)=>{const t=Se(St),a=Se(St);return{id:`cust_${s+1}`,company:e.company,firstName:e.first,lastName:e.last,email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${t}, ${Se(bt)}, VIC 3000`,status:Se(["Active","Active","Active","Inactive"]),type:Se(["Company","Company","Individual"]),notes:"",createdAt:ze(365),updatedAt:ze(30),sites:[{name:"Main Office",address:`${t}, ${Se(bt)}, VIC 3000`},{name:"Warehouse",address:`${a}, ${Se(bt)}, VIC 3001`}],contacts:[{name:`${e.first} ${e.last}`,role:"Primary",email:`${e.first.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${Se(["Alex","Sam","Jordan","Casey","Morgan"])} ${e.last}`,role:"Site Manager",email:`site@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function Nt(){return[{id:"tmpl_elec_std",name:"Standard Electrical Inspection",description:"A comprehensive tasklist for residential or commercial electrical safety inspections.",tags:["Electrical","Maintenance","Compliance"],createdAt:new Date().toISOString(),tasks:[{id:"p1",name:"Main Board Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp1",name:"RCD Testing",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp2",name:"Terminal Tightness",estimatedHours:.5,people:1,status:"Not Started",progress:0}]},{id:"p2",name:"Circuit Testing",status:"Not Started",progress:0,subTasks:[{id:"sp3",name:"Insulation Resistance",estimatedHours:2,people:1,status:"Not Started",progress:0},{id:"sp4",name:"Earth Loop Impedance",estimatedHours:1.5,people:1,status:"Not Started",progress:0}]}]},{id:"tmpl_solar_maint",name:"Solar Panel Maintenance",description:"Annual maintenance checklist for PV solar systems.",tags:["Solar","Renewable","Maintenance"],createdAt:new Date().toISOString(),tasks:[{id:"p3",name:"Physical Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp5",name:"Module Cleaning",estimatedHours:3,people:2,status:"Not Started",progress:0},{id:"sp6",name:"Mounting Hardware Check",estimatedHours:1,people:1,status:"Not Started",progress:0}]},{id:"p4",name:"Electrical Performance",status:"Not Started",progress:0,subTasks:[{id:"sp7",name:"Inverter Diagnostics",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp8",name:"String Voltage Testing",estimatedHours:2,people:1,status:"Not Started",progress:0}]}]}]}function fs(e){const s=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],t=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(a,o)=>{const i=Se(e);return{id:`lead_${o+1}`,title:`${Se(st)} ${Se(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:i.id,customerName:i.company,contactName:`${i.firstName} ${i.lastName}`,status:Se(s),source:Se(t),value:Ve(500,25e3),description:`Potential ${Se(st).toLowerCase()} work for ${i.company}.`,priority:Se(["Low","Medium","High"]),createdAt:ze(90),updatedAt:ze(14)}})}function gs(e){const s=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(t,a)=>{const o=Se(e),i=Ve(200,5e3),r=Ve(100,8e3),p=(i+r)*.1;return{id:`quote_${a+1}`,number:`Q-${String(2024e3+a+1)}`,customerId:o.id,customerName:o.company,contactName:`${o.firstName} ${o.lastName}`,title:`${Se(st)} - ${Se(["Service Quote","Project Quote","Maintenance Quote"])}`,status:Se(s),lineItems:[{description:`${Se(st)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:Ve(65,120),total:i},{description:`${Se(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:Ve(15,200),total:r}],subtotal:i+r,tax:p,total:i+r+p,validUntil:ze(-30,60),notes:"",createdAt:ze(120),updatedAt:ze(14)}})}function hs(e,s){const t=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],a=["Low","Medium","High","Urgent"];return Array.from({length:20},(o,i)=>{var l;const r=Se(e),p=Se(ct),d=Se(t);return{id:`job_${i+1}`,number:`J-${String(1e5+i+1)}`,customerId:r.id,customerName:r.company,contactName:`${r.firstName} ${r.lastName}`,siteAddress:r.address||`${Se(St)}, ${Se(bt)}, VIC 3000`,title:`${Se(st)} - ${Se(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:Se(st),status:d,priority:Se(a),technicianId:p.id,technicianName:p.name,quoteId:i<s.length?(l=s[i])==null?void 0:l.id:null,scheduledDate:ze(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:Ve(200,4e3),materialCost:Ve(100,3e3),tasks:[{id:"p1",name:"Site Preparation",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Installation Phase",status:d==="Completed"||d==="Invoiced"?"Completed":d==="In Progress"?"In Progress":"Not Started",progress:d==="Completed"||d==="Invoiced"?100:d==="In Progress"?50:0,estimatedHours:12,people:2,subTasks:[{id:"sp3",name:"Main Installation",status:d==="Completed"||d==="Invoiced"?"Completed":d==="In Progress"?"In Progress":"Not Started",progress:d==="Completed"||d==="Invoiced"||d==="In Progress"?100:0,estimatedHours:8,people:2},{id:"sp4",name:"Final Commissioning",status:d==="Completed"||d==="Invoiced"?"Completed":"Not Started",progress:d==="Completed"||d==="Invoiced"?100:0,estimatedHours:4,people:2}]}],notes:"",createdAt:ze(90),updatedAt:ze(7)}})}function xs(e){const s=["Draft","Sent","Paid","Overdue","Void"],t=e.filter(a=>a.status==="Completed"||a.status==="Invoiced");return Array.from({length:Math.max(8,t.length)},(a,o)=>{const i=t[o]||Se(e),r=(i.laborCost||0)+(i.materialCost||0),p=r*.1;return{id:`inv_${o+1}`,number:`INV-${String(5e4+o+1)}`,jobId:i.id,jobNumber:i.number,customerId:i.customerId,customerName:i.customerName,contactName:i.contactName,status:Se(s),lineItems:[{description:`${i.title} - Labor`,amount:i.laborCost||Ve(200,4e3)},{description:`${i.title} - Materials`,amount:i.materialCost||Ve(100,3e3)}],subtotal:r,tax:p,total:r+p,invoiceType:"Standard",issueDate:ze(60),dueDate:ze(-14,30),paidDate:null,notes:"",createdAt:ze(60),updatedAt:ze(7)}})}function $s(){return[{id:"fmt_1",name:"Job Safety Analysis (JSA)",description:"Daily safety assessment before starting work.",sections:[{id:"sec_1",title:"Personal Protective Equipment",fields:[{id:"f1",type:"checkbox",label:"Gloves worn?",required:!0},{id:"f2",type:"checkbox",label:"Safety Glasses worn?",required:!0},{id:"f3",type:"checkbox",label:"Steel Cap Boots worn?",required:!0}]},{id:"sec_2",title:"Site Hazards",fields:[{id:"f4",type:"select",label:"Overall Site Risk",options:["Low","Medium","High"],required:!0},{id:"f5",type:"textarea",label:"Identified Hazards",placeholder:"Describe any trip hazards, live wires, etc."}]},{id:"sec_3",title:"Authorization",fields:[{id:"f6",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"fmt_2",name:"Site Assessment",description:"Detailed site inspection and requirements.",sections:[{id:"sec_4",title:"Client Details",fields:[{id:"f7",type:"text",label:"Customer Rep Name"},{id:"f8",type:"date",label:"Inspection Date"}]},{id:"sec_5",title:"Access & Logistics",fields:[{id:"f9",type:"checkbox",label:"Access keys provided?"},{id:"f10",type:"textarea",label:"Parking / Entry Instructions"}]}]}]}function ws(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((s,t)=>({id:`stock_${t+1}`,name:s.name,sku:`SKU-${String(1e3+t)}`,category:s.cat,unit:s.unit,unitPrice:s.price,costPrice:s.price*.6,quantity:Math.floor(Math.random()*200)+5,reorderLevel:Math.floor(Math.random()*20)+5,supplier:Se(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:Se(["Warehouse A","Warehouse B","Van Stock","On Order"]),createdAt:ze(365),updatedAt:ze(30)}))}function ks(e){var t,a,o,i,r,p;return[{name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active"},{name:"Isuzu NPR Truck",type:"Vehicle",serial:"REG-888-FF",ownerType:"Business",recoveryRate:45,serviceIntervalMonths:6,currentMeter:12e4,status:"Active"},{name:"Scissor Lift 19ft",type:"Plant & Equipment",serial:"SN-SL-9920",ownerType:"Business",recoveryRate:15,serviceIntervalMonths:3,currentMeter:840,status:"Active"},{name:"Carrier Chiller Unit",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-CH-7721",ownerType:"Customer",customerId:e[0].id,site:(a=(t=e[0].sites)==null?void 0:t[0])==null?void 0:a.name,serviceIntervalMonths:12,currentMeter:15400,status:"Active"},{name:"Daikin Split System",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-DS-4410",ownerType:"Customer",customerId:e[1].id,site:(i=(o=e[1].sites)==null?void 0:o[0])==null?void 0:i.name,serviceIntervalMonths:12,currentMeter:3200,status:"Active"},{name:"Fire Alarm Panel v4",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-FP-2299",ownerType:"Customer",customerId:e[2].id,site:(p=(r=e[2].sites)==null?void 0:r[0])==null?void 0:p.name,serviceIntervalMonths:6,currentMeter:0,status:"Active"}].map((d,l)=>({id:`asset_${l+1}`,...d,logs:[{id:`log_${l}_1`,type:"Service",date:ze(90),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]}))}function Ss(e){const s=[];return e.filter(a=>a.status==="Scheduled"||a.status==="In Progress").forEach((a,o)=>{const i=Math.floor(Math.random()*5),r=7+Math.floor(Math.random()*8),p=1+Math.floor(Math.random()*4),d=ct.find(l=>l.id===a.technicianId)||Se(ct);s.push({id:`sched_${o+1}`,jobId:a.id,jobNumber:a.number,title:a.title,technicianId:d.id,technicianName:d.name,color:d.color,dayOffset:i,startHour:r,endHour:Math.min(r+p,18),customerName:a.customerName,siteAddress:a.siteAddress})}),s}function Ts(){if(c.isSeeded()){const l=c.getAll("jobs");let y=!1;const v=l.map(T=>{let $=!1;function g(D){const E={...D};return"subPhases"in E?(E.subTasks=(E.subPhases||[]).map(C=>g(C)),delete E.subPhases,$=!0):E.subTasks&&(E.subTasks=E.subTasks.map(C=>g(C))),E}const q={...T};return"phases"in q?(q.tasks=(q.phases||[]).map(D=>g(D)),delete q.phases,$=!0):q.tasks&&(q.tasks=q.tasks.map(D=>g(D))),$&&(y=!0),q});y&&c.save("jobs",v);const n=c.getAll("taskTemplates");let u=!1;const m=n.map(T=>{let $=!1;function g(D){const E={...D};return"subPhases"in E?(E.subTasks=(E.subPhases||[]).map(C=>g(C)),delete E.subPhases,$=!0):E.subTasks&&(E.subTasks=E.subTasks.map(C=>g(C))),E}const q={...T};return"phases"in q?(q.tasks=(q.phases||[]).map(D=>g(D)),delete q.phases,$=!0):q.tasks&&(q.tasks=q.tasks.map(D=>g(D))),$&&(u=!0),q});u&&c.save("taskTemplates",m);const w=c.getAll("jobs");if(w.length>0&&!w[0].tasks){const T=w.map($=>{const g=$.status;return{...$,tasks:[{id:"p1",name:"Site Preparation",status:g==="Pending"?"Not Started":"Completed",progress:g==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:g==="Pending"?"Not Started":"Completed",progress:g==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:g==="Pending"?"Not Started":"Completed",progress:g==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Project Execution",status:g==="Completed"||g==="Invoiced"?"Completed":g==="In Progress"?"In Progress":"Not Started",progress:g==="Completed"||g==="Invoiced"?100:g==="In Progress"?50:0,estimatedHours:16,people:2,subTasks:[{id:"sp3",name:"Installation",status:g==="Completed"||g==="Invoiced"?"Completed":g==="In Progress"?"In Progress":"Not Started",progress:g==="Completed"||g==="Invoiced"||g==="In Progress"?100:0,estimatedHours:12,people:2},{id:"sp4",name:"Cleanup & Handover",status:g==="Completed"||g==="Invoiced"?"Completed":"Not Started",progress:g==="Completed"||g==="Invoiced"?100:0,estimatedHours:4,people:2}]}]}});c.save("jobs",T)}const b=c.getAll("userTypes");!b||b.length===0?bs():b.some($=>$.id==="ut_office")||(b.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:nt(($,g)=>$==="Settings"?!1:$==="Reports"?g==="view":!(["Invoices","Purchase Orders"].includes($)&&g==="delete"))}),c.save("userTypes",b));const h=c.getAll("technicians"),L=c.getAll("userTypes");if(h.length>0&&L.length>0){const T=h[0];L.some(g=>g.id===T.userTypeId)||c.save("technicians",ct)}const x=c.getAll("taskTemplates");(!x||x.length===0)&&c.save("taskTemplates",Nt());return}const e=ys(),s=fs(e),t=gs(e),a=hs(e,t),o=xs(a),i=ws(),r=ks(e),p=Ss(a),d=$s();c.save("customers",e),c.save("leads",s),c.save("quotes",t),c.save("jobs",a),c.save("invoices",o),c.save("stock",i),c.save("assets",r),c.save("schedule",p),c.save("technicians",ct),c.save("taskTemplates",Nt()),c.save("formTemplates",d),c.save("formInstances",[]),c.markSeeded()}const Cs=[{section:"MAIN"},{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{section:"WORKFLOW"},{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"},{section:"RESOURCES"},{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"},{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{section:"ANALYTICS"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{section:"SYSTEM"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}];function Ot(){const e=document.createElement("aside");e.className="sidebar",e.id="sidebar";const s=localStorage.getItem("simpro_sidebar_expanded")==="true";s&&e.classList.add("expanded");const t=c.getSettings();let o=`
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
  `;JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),Cs.forEach(n=>{n.section?o+=`<div class="sidebar-section-label" data-section="${n.section}">${n.section}</div>`:o+=`
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
  `,e.innerHTML=o,e.addEventListener("click",n=>{const u=n.target.closest(".sidebar-nav-item");if(u&&u.id!=="btn-logout"){const m=u.dataset.path;m&&F.navigate(m)}}),e.querySelector("#sidebar-logo").addEventListener("click",()=>F.navigate("/")),e.querySelector("#sidebar-toggle").addEventListener("click",()=>Is(e));const p=e.querySelector("#sidebar-nav"),d=e.querySelector("#sidebar-scroll-up"),l=e.querySelector("#sidebar-scroll-down"),y=()=>{if(e.classList.contains("expanded")){d.classList.remove("visible"),l.classList.remove("visible");return}const{scrollTop:n,scrollHeight:u,clientHeight:m}=p;d.classList.toggle("visible",n>0),l.classList.toggle("visible",Math.ceil(n+m)<u)};p.addEventListener("scroll",y),d.addEventListener("click",()=>{p.scrollBy({top:-100,behavior:"smooth"})}),l.addEventListener("click",()=>{p.scrollBy({top:100,behavior:"smooth"})}),setTimeout(y,100);const v=e.querySelector("#btn-logout");return v&&v.addEventListener("click",n=>{n.stopPropagation(),window.dispatchEvent(new CustomEvent("fieldforge-logout"))}),window.addEventListener("simpro-settings-updated",()=>{const n=c.getSettings(),u=e.querySelector("#sidebar-logo");n.logo?u.innerHTML=`
        <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
          <img src="${n.logo}" class="custom-logo" style="max-height: 28px; max-width: ${e.classList.contains("expanded")?"140px":"32px"}; object-fit: contain;" />
          <span class="logo-text" style="${e.classList.contains("expanded")?"display: block;":"display: none;"}">${n.name||"FieldForge"}</span>
        </div>
      `:u.innerHTML=`
        <div class="logo-icon">F</div>
        <span class="logo-text">FieldForge</span>
      `}),e}function Es(e){const s=e||document.getElementById("sidebar");if(!s)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');if(t.role==="customer")s.style.display="none";else{s.style.display="";let a=null;if(t.userTypeId){const p=c.getById("userTypes",t.userTypeId);p&&p.permissions&&(a=p.permissions)}s.querySelectorAll(".sidebar-nav-item").forEach(p=>{if(p.id==="btn-logout"){p.style.display="";return}const d=p.querySelector(".nav-label");if(!d)return;const l=d.textContent.trim();if(t.role==="admin"){p.style.display="";return}if(a){const y=a.find(n=>n.module===l);y&&Object.entries(y).some(([n,u])=>n!=="module"&&u===!0)||l==="Notifications"||l==="Dashboard"?p.style.display="":p.style.display="none"}else(l==="Settings"||l==="Reports"||l==="Invoices")&&(p.style.display="none")}),s.querySelectorAll(".sidebar-section-label").forEach(p=>{let d=!1,l=p.nextElementSibling;for(;l&&l.classList.contains("sidebar-nav-item");){if(l.style.display!=="none"){d=!0;break}l=l.nextElementSibling}p.style.display=d?"":"none"});const o=s.querySelector("#sidebar-nav"),i=s.querySelector("#sidebar-scroll-up"),r=s.querySelector("#sidebar-scroll-down");if(o&&i&&r&&!s.classList.contains("expanded")){const{scrollTop:p,scrollHeight:d,clientHeight:l}=o;i.classList.toggle("visible",p>0),r.classList.toggle("visible",Math.ceil(p+l)<d)}}}function Is(e){e.classList.toggle("expanded");const s=e.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",s);const t=e.querySelector("#sidebar-toggle-icon");t.textContent=s?"chevron_left":"chevron_right";const a=e.querySelector(".custom-logo"),o=e.querySelector(".logo-text");a&&(a.style.maxWidth=s?"140px":"32px"),o&&(o.style.display=s?"block":"none");const i=e.querySelector("#sidebar-nav"),r=e.querySelector("#sidebar-scroll-up"),p=e.querySelector("#sidebar-scroll-down");if(i&&r&&p)if(s)r.classList.remove("visible"),p.classList.remove("visible");else{const{scrollTop:d,scrollHeight:l,clientHeight:y}=i;r.classList.toggle("visible",d>0),p.classList.toggle("visible",Math.ceil(d+y)<l)}}function Bt(e){const s=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(t=>{t.classList.toggle("active",t.dataset.path===s)})}const Pt=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:Ot,updateSidebarAccess:Es,updateSidebarActive:Bt},Symbol.toStringTag,{value:"Module"}));function Ut(){const e=document.createElement("header");e.className="topbar",e.id="topbar",e.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${Vt()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const s=e.querySelector("#global-search");let t;s.addEventListener("input",p=>{clearTimeout(t),t=setTimeout(()=>{const d=p.target.value.trim();d.length>=2?qs(d):gt()},300)}),s.addEventListener("blur",()=>{setTimeout(gt,200)}),e.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const d=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",d),localStorage.setItem("simpro_theme",d),e.querySelector("#theme-icon").textContent=d==="dark"?"light_mode":"dark_mode"}),As();const o=e.querySelector("#btn-notifications"),i=e.querySelector(".notification-dot");function r(){c.getAll("notifications").filter(l=>!l.read).length>0?i.style.display="block":i.style.display="none"}return c.on("notifications",r),r(),o.addEventListener("click",p=>{p.stopPropagation(),Ls(o)}),Jt(e),e}function Jt(e){const s=e||document.getElementById("topbar");if(!s)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),a=s.querySelector("#topbar-name"),o=s.querySelector("#topbar-role"),i=s.querySelector("#topbar-avatar");if(a&&(a.textContent=t.name||"Unknown User"),o){let r=t.userTypeName;if(!r&&t.userTypeId){const p=c.getById("userTypes",t.userTypeId);p&&(r=p.name)}r||(r={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[t.role]||t.role),o.textContent=r}if(i){const p=(t.name||"").split(" ").map(d=>d[0]).join("").substring(0,2).toUpperCase()||"U";i.textContent=p}}function Ls(e){let s=document.querySelector("#notifications-dropdown");if(s){s.remove();return}const t=c.getAll("notifications").sort((r,p)=>new Date(p.createdAt)-new Date(r.createdAt));s=document.createElement("div"),s.className="dropdown-menu",s.id="notifications-dropdown",s.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const a=document.createElement("div");a.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",a.innerHTML='<h4 style="margin:0">Notifications</h4>';const o=document.createElement("button");o.className="btn btn-ghost btn-sm",o.textContent="Mark all as read",o.onclick=()=>{const r=c.getAll("notifications");let p=!1;r.forEach(d=>{d.read||(d.read=!0,d.updatedAt=new Date().toISOString(),p=!0)}),p&&c.save("notifications",r),s.remove()},a.appendChild(o),s.appendChild(a),t.length===0?s.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':t.forEach(r=>{const p=document.createElement("div");p.className="dropdown-item",p.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${r.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,p.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${r.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${r.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(r.createdAt).toLocaleString()}</div>
        </div>
      `,p.addEventListener("click",()=>{if(c.update("notifications",r.id,{read:!0}),r.link){const{router:d}=window.__fieldForge||{};d&&d.navigate(r.link)}s.remove()}),s.appendChild(p)}),e.parentNode.style.position="relative",e.parentNode.appendChild(s);const i=r=>{!s.contains(r.target)&&r.target!==e&&!e.contains(r.target)&&(s.remove(),document.removeEventListener("click",i))};document.addEventListener("click",i)}function qs(e){gt();const{store:s}=window.__fieldForge||{};if(!s)return;const t=[],a=e.toLowerCase();if(s.getAll("customers").forEach(i=>{(i.company.toLowerCase().includes(a)||`${i.firstName} ${i.lastName}`.toLowerCase().includes(a))&&t.push({type:"Customer",label:i.company,icon:"people",path:`/people/${i.id}`})}),s.getAll("jobs").forEach(i=>{(i.number.toLowerCase().includes(a)||i.title.toLowerCase().includes(a)||i.customerName.toLowerCase().includes(a))&&t.push({type:"Job",label:`${i.number} — ${i.title}`,icon:"build",path:`/jobs/${i.id}`})}),s.getAll("quotes").forEach(i=>{var r;(i.number.toLowerCase().includes(a)||(r=i.title)!=null&&r.toLowerCase().includes(a)||i.customerName.toLowerCase().includes(a))&&t.push({type:"Quote",label:`${i.number} — ${i.customerName}`,icon:"request_quote",path:`/quotes/${i.id}`})}),s.getAll("invoices").forEach(i=>{(i.number.toLowerCase().includes(a)||i.customerName.toLowerCase().includes(a))&&t.push({type:"Invoice",label:`${i.number} — ${i.customerName}`,icon:"receipt_long",path:`/invoices/${i.id}`})}),t.length===0)return;const o=document.createElement("div");o.className="dropdown-menu",o.id="search-results",o.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",t.slice(0,12).forEach(i=>{const r=document.createElement("button");r.className="dropdown-item",r.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${i.icon}</span>
      <span style="flex:1" class="truncate">${i.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${i.type}</span>
    `,r.addEventListener("click",()=>{const{router:p}=window.__fieldForge||{};p&&p.navigate(i.path),gt(),document.querySelector("#global-search").value=""}),o.appendChild(r)}),document.querySelector(".topbar-search").appendChild(o)}function gt(){const e=document.querySelector("#search-results");e&&e.remove()}function Vt(){return localStorage.getItem("simpro_theme")||"light"}function As(){Vt()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const Mt=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:Ut,updateTopbarAccess:Jt},Symbol.toStringTag,{value:"Module"})),Ds={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function Ns(e){const s=document.getElementById("breadcrumb");if(!s)return;if(e==="/"){s.style.display="none";return}s.style.display="flex";const t=e.split("/").filter(Boolean);let a=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,o="";t.forEach((i,r)=>{o+="/"+i;const p=r===t.length-1,d=Ds[o]||decodeURIComponent(i);a+='<span class="breadcrumb-separator">›</span>',p?a+=`<span class="breadcrumb-item current">${d}</span>`:a+=`<span class="breadcrumb-item" data-path="${o}">${d}</span>`}),s.innerHTML=a,s.querySelectorAll(".breadcrumb-item[data-path]").forEach(i=>{i.addEventListener("click",()=>{const{router:r}=window.__fieldForge||{};r&&r.navigate(i.dataset.path)})})}function Ye(e){const s=document.getElementById("breadcrumb");if(!s)return;const t=s.querySelector(".breadcrumb-item.current");t&&(t.textContent=e)}const Ps="modulepreload",Ms=function(e){return"/"+e},jt={},ve=function(s,t,a){let o=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),p=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));o=Promise.allSettled(t.map(d=>{if(d=Ms(d),d in jt)return;jt[d]=!0;const l=d.endsWith(".css"),y=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${y}`))return;const v=document.createElement("link");if(v.rel=l?"stylesheet":Ps,l||(v.as="script"),v.crossOrigin="",v.href=d,p&&v.setAttribute("nonce",p),document.head.appendChild(v),l)return new Promise((n,u)=>{v.addEventListener("load",n),v.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(r){const p=new Event("vite:preloadError",{cancelable:!0});if(p.payload=r,window.dispatchEvent(p),!p.defaultPrevented)throw r}return o.then(r=>{for(const p of r||[])p.status==="rejected"&&i(p.reason);return s().catch(i)})};function $t(e,s){if(!e||e<=0)return 0;const t=s.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]};let a=t.defaultPercent||30;if(t.useTiers&&t.tiers&&t.tiers.length>0){const r=t.tiers.find(p=>p.upTo===null||e<=p.upTo);r&&(a=r.percent)}const o=e*(a/100),i=Math.max(o,t.minMarkupAmount||0);return e+i}function Qt(e,s){return e.reduce((t,a)=>{const o=$t(a.unitCost||0,s);return t+o*(a.quantity||1)},0)}function Tt(){const e=je("Jobs","create"),s=je("Quotes","create");let t="";return e&&(t+=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>`),s&&(t+=`
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`),t}let Be=!1;const it={S:"module-s",M:"module-m",L:"module-l",XL:"module-xl"},lt={standard:"",tall:"module-tall",xtall:"module-xtall"};function ht(){const e=JSON.parse(localStorage.getItem("currentUser")||"null");return e?`dashboardLayout_v2_${e.id}`:"dashboardLayout_v2"}const xt={"kpi-cards":{title:"KPI Cards",defaultW:"XL",defaultH:"standard",widths:["M","L","XL"],heights:["standard"],kpiStrip:!0,render:Hs},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Fs},"tech-map":{title:"Technician Map",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Rs},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Os},"recent-leads":{title:"Recent Leads",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Bs},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Us},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:Vs},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>_e("inventory","Inventory looks good")},"profitability-chart":{title:"Projected Profitability",defaultW:"L",defaultH:"tall",widths:["L","XL"],heights:["tall","xtall"],render:Qs},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("schedule","No timesheet alerts")},"asset-status":{title:"Asset Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("precision_manufacturing","All assets operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>_e("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>_e("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>_e("wb_sunny","Sunny, 24°C")}},Wt=[{id:"kpi-cards",w:"XL",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"M",h:"tall"},{id:"recent-leads",w:"M",h:"tall"},{id:"cash-flow",w:"M",h:"standard"}];function _e(e,s){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${e}</span>
    <span style="font-size:13px;">${s}</span>
  </div>`}function js(e){let s=JSON.parse(JSON.stringify(Wt));try{const o=localStorage.getItem(ht());o&&(s=JSON.parse(o))}catch{}s.forEach(o=>{o.instanceId||(o.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const t={jobs:c.getAll("jobs"),quotes:c.getAll("quotes"),invoices:c.getAll("invoices"),leads:c.getAll("leads"),people:c.getAll("people")};e.innerHTML=`
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          ${Tt()}
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;const a=e.querySelector("#dashboard-grid");Qe(a,s,t),e.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{Be=!0,Qe(a,s,t),_s(e,a,s,t)})}function Qe(e,s,t){e.innerHTML="",s.forEach(a=>{const o=xt[a.id];if(!o)return;const i=it[a.w]||"module-m",r=lt[a.h]||"",p=["dashboard-module",i,r,Be?"edit-mode":""].filter(Boolean).join(" "),d=o.widths.length>1,l=o.heights.length>1,y=Be?`
      ${d?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${l?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${d&&l?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",v=`
      <div style="display:flex;align-items:center;gap:4px;">
        ${o.configurable?`
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${a.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${Be?"":"opacity:0.5;"}">settings</span>
          </button>
        `:""}
        ${Be?`
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${a.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>
        `:""}
      </div>`,n=Be?"background:rgba(27,109,224,0.04);":"";e.insertAdjacentHTML("beforeend",`
      <div class="${p}" data-instance-id="${a.instanceId}" data-id="${a.id}" style="position:relative;">
        <div class="card ${o.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${n}">
            <span style="font-weight:600;font-size:14px;">${o.title}</span>
            ${v}
          </div>
          <div class="card-body">${o.render(t,a)}</div>
        </div>
        ${y}
      </div>`)}),zs(e,s,t),Be&&Ct(e,s,t)}function zs(e,s,t){e.querySelectorAll(".btn-configure").forEach(a=>{a.addEventListener("click",o=>{const i=o.currentTarget.dataset.instanceId,r=s.find(d=>d.instanceId===i);if(r&&r.id==="pinned-job"){let y=function(v=""){const n=l.querySelector("#job-list-container"),u=d.filter(m=>m.number.toLowerCase().includes(v.toLowerCase())||m.title.toLowerCase().includes(v.toLowerCase())||m.customerName.toLowerCase().includes(v.toLowerCase()));n.innerHTML=u.length>0?u.map(m=>`
            <div class="job-option" data-job-id="${m.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${m.number} - ${m.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${m.customerName}</div>
            </div>
          `).join(""):'<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>',n.querySelectorAll(".job-option").forEach(m=>{m.addEventListener("click",()=>{var w;r.config={...r.config,jobId:m.dataset.jobId},Be||localStorage.setItem(ht(),JSON.stringify(s)),(w=document.querySelector(".modal-overlay"))==null||w.remove(),Qe(e,s,t)})})};var p=y;const d=t.jobs,l=document.createElement("div");l.innerHTML=`
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..." 
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            <!-- Jobs will be rendered here -->
          </div>
        `,y(),l.querySelector("#job-search").addEventListener("input",v=>{y(v.target.value)}),ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>Me);return{showModal:v}},void 0).then(({showModal:v})=>{v({title:"Select Job to Pin",content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()}]})})}})})}function Ct(e,s,t){e.querySelectorAll(".btn-remove").forEach(a=>{a.addEventListener("click",o=>{const i=o.currentTarget.dataset.instanceId,r=s.findIndex(p=>p.instanceId===i);r!==-1&&(s.splice(r,1),Qe(e,s,t))})}),window.Sortable&&!e.sortableInstance&&(e.sortableInstance=new window.Sortable(e,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const a=Array.from(e.children).map(i=>i.dataset.instanceId),o=[];a.forEach(i=>{const r=s.find(p=>p.instanceId===i);r&&o.push(r)}),s.splice(0,s.length,...o)}})),e.sortableInstance&&e.sortableInstance.option("disabled",!1),e.querySelectorAll(".resize-handle").forEach(a=>{a.addEventListener("mousedown",o=>{o.preventDefault(),o.stopPropagation();const i=o.target.closest(".dashboard-module"),r=i.dataset.instanceId,p=s.find($=>$.instanceId===r),d=xt[p==null?void 0:p.id];if(!p||!d)return;const l=o.target.closest(".resize-handle"),y=l&&(l.classList.contains("resize-r")||l.classList.contains("resize-br")),v=l&&(l.classList.contains("resize-b")||l.classList.contains("resize-br"));let n=o.clientX,u=o.clientY,m=0,w=0;const b=60,h=["S","M","L","XL"].filter($=>d.widths.includes($)),L=["standard","tall","xtall"].filter($=>d.heights.includes($));function x($){if(y){if(m+=$.clientX-n,m>b){let g=h.indexOf(p.w);g<h.length-1&&(p.w=h[g+1],i.className=["dashboard-module",it[p.w]||"module-m",lt[p.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}else if(m<-b){let g=h.indexOf(p.w);g>0&&(p.w=h[g-1],i.className=["dashboard-module",it[p.w]||"module-m",lt[p.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}}if(v){if(w+=$.clientY-u,w>b){let g=L.indexOf(p.h);g<L.length-1&&(p.h=L[g+1],i.className=["dashboard-module",it[p.w]||"module-m",lt[p.h]||"","edit-mode"].filter(Boolean).join(" ")),w=0}else if(w<-b){let g=L.indexOf(p.h);g>0&&(p.h=L[g-1],i.className=["dashboard-module",it[p.w]||"module-m",lt[p.h]||"","edit-mode"].filter(Boolean).join(" ")),w=0}}n=$.clientX,u=$.clientY}function T(){document.removeEventListener("mousemove",x),document.removeEventListener("mouseup",T),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",x),document.addEventListener("mouseup",T),document.body.style.cursor=window.getComputedStyle(o.target).cursor,document.body.style.userSelect="none"})})}function _s(e,s,t,a){const o=e.querySelector("#dashboard-header-actions"),i=e.querySelector("#btn-edit-dashboard");i.style.display="none",o.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,o.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(t.splice(0,t.length,...JSON.parse(JSON.stringify(Wt))),Qe(s,t,a),Ct(s,t,a))}),o.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(ht(),JSON.stringify(t)),Be=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),i.style.display="",o.innerHTML=Tt(),Qe(s,t,a)}),o.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const r=localStorage.getItem(ht());r&&t.splice(0,t.length,...JSON.parse(r))}catch{}Be=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),i.style.display="",o.innerHTML=Tt(),Qe(s,t,a)}),o.querySelector("#btn-add-widget").addEventListener("click",()=>{const r=Object.entries(xt),p=document.createElement("div");p.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${r.map(([d,l])=>`
            <div data-id="${d}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${l.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${l.defaultW} · ${l.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,ve(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Me);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:"Add Widget",content:p,actions:[{label:"Close",className:"btn-secondary",onClick:l=>l()}]}),p.querySelectorAll("[data-id]").forEach(l=>{l.addEventListener("click",y=>{var u;const v=y.currentTarget.dataset.id,n=xt[v];t.push({id:v,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:n.defaultW,h:n.defaultH}),(u=document.querySelector(".modal-overlay"))==null||u.remove(),Qe(s,t,a),Ct(s,t,a)})})})})}function Hs(e,s){const t=e.jobs.filter(r=>r.status==="In Progress"||r.status==="Scheduled").length,a=e.quotes.filter(r=>r.status==="Sent"||r.status==="Draft").length,o=e.invoices.filter(r=>r.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+e.invoices.filter(r=>r.status==="Paid").reduce((r,p)=>r+(p.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:t,icon:"build",color:"green",sub:`${e.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:a,icon:"request_quote",color:"orange",sub:`${e.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:o,icon:"warning",color:"red",sub:o>0?"Requires attention":"All on track",pos:o===0}].map(r=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${r.label}</div>
        <div class="stat-icon ${r.color}"><span class="material-icons-outlined">${r.icon}</span></div>
      </div>
      <div class="stat-value">${r.value}</div>
      <div class="stat-change ${r.pos===!0?"positive":r.pos===!1?"negative":""}">
        <span style="font-size:12px;">${r.sub}</span>
      </div>
    </div>`).join("")}function Fs(e,s){const t={};e.jobs.forEach(i=>{t[i.status]=(t[i.status]||0)+1});const a=e.jobs.length||1,o={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(t).map(([i,r])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${i}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(r/a*100).toFixed(1)}%;height:100%;background:${o[i]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${r>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${r}</span>
      </div>`).join("")}
  </div>`}function Rs(e,s){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${e.people.filter(o=>o.type==="Staff").slice(0,4).map((o,i)=>{const r=15+i*22+Math.sin(i)*12,p=15+i*18+Math.cos(i)*18;return`<div style="position:absolute;top:${r}%;left:${p}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${o.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${o.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function Os(e,s){const t=[];return e.jobs.slice(0,4).forEach(a=>t.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${a.number}</strong> — ${a.title}`,sub:a.customerName,time:a.updatedAt})),e.quotes.slice(0,3).forEach(a=>t.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${a.number}</strong> ${a.status.toLowerCase()}`,sub:a.customerName,time:a.updatedAt})),e.invoices.slice(0,2).forEach(a=>t.push({icon:"receipt_long",color:a.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${a.number}</strong> — ${a.status}`,sub:a.customerName,time:a.updatedAt})),t.sort((a,o)=>new Date(o.time)-new Date(a.time)),t.map(a=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${a.color}20;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${a.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.sub} · ${Js(a.time)}</div>
      </div>
    </div>`).join("")}function Bs(e,s){const t={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${e.leads.slice(0,8).map(a=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${a.id}'">
        <td class="cell-link font-medium">${a.title}</td>
        <td style="color:var(--text-secondary);">${a.customerName}</td>
        <td><span class="badge ${t[a.status]||"badge-neutral"}">${a.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function Us(e,s){const t=e.jobs.filter(a=>a.status==="Scheduled"||a.status==="In Progress").slice(0,8);return t.length?t.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${a.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${a.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.technicianName} · ${a.customerName}</div>
      </div>
      <span class="badge ${a.status==="In Progress"?"badge-primary":"badge-warning"}">${a.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function Js(e){const s=Math.floor((Date.now()-new Date(e))/6e4);if(s<60)return`${s}m ago`;const t=Math.floor(s/60);return t<24?`${t}h ago`:`${Math.floor(t/24)}d ago`}function Vs(e,s){var l;const t=(l=s.config)==null?void 0:l.jobId;if(!t)return _e("push_pin","Click settings to pin a job");const a=e.jobs.find(y=>y.id===t);if(!a)return _e("warning","Job not found");function o(y,v=0){let n=[];return y&&y.forEach(u=>{const m=u.subTasks&&u.subTasks.length>0||u.subPhases&&u.subPhases.length>0;n.push({...u,depth:v,isParent:m}),m&&(n=n.concat(o(u.subTasks||u.subPhases,v+1)))}),n}const i=a.tasks||a.phases||[],r=o(i),p=r.length;let d=0;if(i.length>0){const y=i.reduce((v,n)=>v+(n.progress||0),0);d=Math.round(y/i.length)}return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${a.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${d}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${d}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${p>0?r.map(y=>{const v=y.progress===100;return`
          <div style="display:flex;align-items:center;gap:8px;padding-left:${y.depth*14}px; opacity:${!y.isParent&&v?.6:1}">
            ${y.isParent?'<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>':`<span class="material-icons-outlined" style="font-size:16px;color:${v?"var(--color-success)":"var(--text-tertiary)"};">
                ${v?"check_circle":"radio_button_unchecked"}
              </span>`}
            <span style="font-size:12px;font-weight:${y.isParent?"700":"400"};text-decoration:${!y.isParent&&v?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${y.isParent?"var(--text-primary)":"var(--text-secondary)"};">
              ${y.name}
            </span>
            ${y.isParent?`<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);">${y.progress}%</span>`:""}
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
  `}function Qs(e,s){const t=c.getSettings(),a=e.jobs.filter(d=>d.status!=="Invoiced"&&d.status!=="Archived");let o=0,i=0;a.forEach(d=>{const l=(d.materials||[]).reduce((w,b)=>w+b.quantity*(b.unitCost||0),0),y=d.laborCost||0;o+=l+y;const v=Qt(d.materials||[],t),n=t.laborRates.find(w=>w.id===d.laborRateProfileId)||t.laborRates.find(w=>w.isDefault),u=d.estimatedHours||0,m=Math.max(u*((n==null?void 0:n.rate)||85),(n==null?void 0:n.minCallOutFee)||0);i+=v+m});const r=i-o,p=i>0?r/i*100:0;return`
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${i.toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Avg. Margin</div>
          <div style="font-size:18px; font-weight:700; color:${p>=30?"var(--color-success)":"var(--color-warning)"};">${p.toFixed(1)}%</div>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:var(--text-secondary);">Projected Profit</span>
            <span style="font-weight:600; color:var(--color-success);">+$${r.toLocaleString("en-AU",{minimumFractionDigits:2})}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(p,100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
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
            <span style="font-weight:500;">$${r.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${a.length} active jobs using tiered material markups.
      </div>
    </div>
  `}function f(e){return e==null?"":String(e).replace(/[&<>"']/g,function(t){switch(t){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return t}})}function Re({columns:e,data:s,onRowClick:t,getId:a,emptyMessage:o="No records found",emptyIcon:i="inbox",selectable:r=!1,onSelectionChange:p=null}){const d=document.createElement("div");d.className="card";let l=null,y="asc",v=1;const n=15,u=new Set;function m(){p&&p(Array.from(u))}function w(){let b=[...s];l&&b.sort(($,g)=>{const q=l.getValue?l.getValue($):$[l.key],D=l.getValue?l.getValue(g):g[l.key];return q==null?1:D==null?-1:typeof q=="string"?y==="asc"?q.localeCompare(D):D.localeCompare(q):y==="asc"?q-D:D-q});const h=Math.ceil(b.length/n);v>h&&(v=h||1);const L=(v-1)*n,x=b.slice(L,L+n);if(s.length===0){d.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${f(i)}</span>
          <h3>${f(o)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let T='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(r){const $=x.length>0&&x.every(g=>u.has(String(a?a(g):g.id)));T+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${$?"checked":""}></th>`}if(e.forEach($=>{const g=l&&l.key===$.key,q=g?" sorted":"",D=g?y==="asc"?"arrow_upward":"arrow_downward":"unfold_more";T+=`<th class="${q}" data-key="${$.key}" style="${$.width?"width:"+$.width:""}">
        ${f($.label)}
        <span class="material-icons-outlined sort-icon">${D}</span>
      </th>`}),T+="</tr></thead><tbody>",x.forEach($=>{const g=String(a?a($):$.id),q=u.has(g);T+=`<tr data-id="${f(g)}" style="cursor:pointer" class="${q?"selected-row":""}">`,r&&(T+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${f(g)}" ${q?"checked":""}>
        </td>`),e.forEach(D=>{const E=D.render?D.render($):f($[D.key]??"");T+=`<td>${E}</td>`}),T+="</tr>"}),T+="</tbody></table></div>",h>1){T+=`<div class="pagination">
        <span class="pagination-info">Showing ${L+1}–${Math.min(L+n,b.length)} of ${b.length}</span>
        <div class="pagination-controls">
          <button ${v===1?"disabled":""} data-page="prev">‹</button>`;for(let $=1;$<=h;$++){if(h>7&&$>2&&$<h-1&&Math.abs($-v)>1){($===3||$===h-2)&&(T+="<button disabled>…</button>");continue}T+=`<button class="${$===v?"page-active":""}" data-page="${$}">${$}</button>`}T+=`<button ${v===h?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(d.innerHTML=T,d.querySelectorAll("th[data-key]").forEach($=>{$.addEventListener("click",()=>{const g=e.find(q=>q.key===$.dataset.key);l===g?y=y==="asc"?"desc":"asc":(l=g,y="asc"),w()})}),t&&d.querySelectorAll("tbody tr[data-id]").forEach($=>{$.addEventListener("click",g=>{g.target.closest(".dt-select-cell")||t($.dataset.id)})}),r){d.querySelectorAll(".dt-select-row").forEach(g=>{g.addEventListener("change",q=>{q.target.checked?u.add(q.target.value):u.delete(q.target.value),m(),w()})});const $=d.querySelector(".dt-select-all");$&&$.addEventListener("change",g=>{const q=g.target.checked;x.forEach(D=>{const E=String(a?a(D):D.id);q?u.add(E):u.delete(E)}),m(),w()})}d.querySelectorAll(".pagination-controls button[data-page]").forEach($=>{$.addEventListener("click",()=>{const g=$.dataset.page;g==="prev"?v--:g==="next"?v++:v=parseInt(g),w()})})}return w(),d.updateData=b=>{s=b,w()},d.clearSelection=()=>{u.clear(),m(),w()},d}let We=null;function Ws(){return(!We||!document.body.contains(We))&&(We=document.createElement("div"),We.className="toast-container",We.id="toast-container",document.body.appendChild(We)),We}function M(e,s="info",t=3500){const a=Ws(),o=document.createElement("div");o.className=`toast ${s}`;const i={success:"check_circle",error:"error",warning:"warning",info:"info"};o.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${s==="error"?"danger":s})">${i[s]||i.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${e}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,o.querySelector(".toast-close").addEventListener("click",()=>o.remove()),a.appendChild(o),setTimeout(()=>{o.parentNode&&(o.style.opacity="0",o.style.transform="translateX(20px)",o.style.transition="0.3s ease",setTimeout(()=>o.remove(),300))},t)}function Gs(e,s,t){c.create("notifications",{title:e,message:s,link:t,read:!1}),M(`${e}: ${s}`,"info")}const qe=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:Gs,showToast:M},Symbol.toStringTag,{value:"Module"}));function Je({container:e,selectedIds:s,actions:t,onClear:a}){const o=e.querySelector(".bulk-action-bar");if(o&&o.remove(),!s||s.length===0)return;const i=document.createElement("div");i.className="bulk-action-bar slide-up";let r=`
    <div class="bulk-action-left">
      <span class="bulk-count">${s.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return t.forEach((p,d)=>{r+=`<button class="btn ${p.className||"btn-secondary"} btn-sm" data-action="${d}">
      ${p.icon?`<span class="material-icons-outlined" style="font-size:16px">${f(p.icon)}</span> `:""}
      ${f(p.label)}
    </button>`}),r+="</div>",i.innerHTML=r,i.querySelector("#btn-clear-selection").addEventListener("click",()=>{a&&a()}),i.querySelectorAll("button[data-action]").forEach(p=>{p.addEventListener("click",()=>{const d=p.dataset.action;t[d]&&t[d].onClick&&t[d].onClick(s)})}),e.appendChild(i),i}function Et(e){const s=c.getAll("customers");e.innerHTML=`
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
        <button class="toolbar-filter" data-filter="Active">Active (${s.filter(i=>i.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${s.filter(i=>i.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let t=[...s];const o=Re({columns:[{key:"company",label:"Company / Name",render:i=>`<span class="cell-link font-medium">${f(i.company)}</span>`},{key:"contact",label:"Contact",render:i=>`${f(i.firstName)} ${f(i.lastName)}`},{key:"email",label:"Email",render:i=>`<span class="text-secondary">${f(i.email)}</span>`},{key:"phone",label:"Phone",render:i=>`<span class="text-secondary">${f(i.phone)}</span>`},{key:"type",label:"Type",render:i=>`<span class="badge badge-neutral">${f(i.type)}</span>`},{key:"status",label:"Status",render:i=>`<span class="badge ${i.status==="Active"?"badge-success":"badge-neutral"}">${f(i.status)}</span>`}],data:t,onRowClick:i=>F.navigate(`/people/${i}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:i=>{Je({container:e,selectedIds:i,onClear:()=>o.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:r=>{const p=document.createElement("div");p.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Me);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${r.length} Customers`,content:p,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Apply",className:"btn-primary",onClick:l=>{const y=p.querySelector("#bulk-status").value;r.forEach(v=>c.update("customers",v,{status:y})),o.clearSelection(),Et(e),M(`Updated ${r.length} customers to ${y}`,"success"),l()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{ve(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Me);return{showModal:p}},void 0).then(({showModal:p})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${r.length} customers? This cannot be undone.</p>`,p({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Delete",className:"btn-danger",onClick:l=>{r.forEach(y=>c.delete("customers",y)),o.clearSelection(),Et(e),M(`Deleted ${r.length} customers`,"success"),l()}}]})})}}]})}});e.querySelector("#people-table-container").appendChild(o),e.querySelector("#btn-new-person").addEventListener("click",()=>{F.navigate("/people/new")}),e.querySelector("#btn-export-people").addEventListener("click",()=>{M("Customer data exported successfully","success")}),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(p=>p.classList.remove("active")),i.classList.add("active");const r=i.dataset.filter;t=r==="all"?[...s]:s.filter(p=>p.status===r),o.updateData(t)})}),e.querySelector("#people-search").addEventListener("input",i=>{var d;const r=i.target.value.toLowerCase();t=s.filter(l=>l.company.toLowerCase().includes(r)||`${l.firstName} ${l.lastName}`.toLowerCase().includes(r)||l.email.toLowerCase().includes(r));const p=(d=e.querySelector(".toolbar-filter.active"))==null?void 0:d.dataset.filter;p&&p!=="all"&&(t=t.filter(l=>l.status===p)),o.updateData(t)})}function we({title:e,content:s,size:t="",onClose:a,actions:o=[]}){const i=document.createElement("div");i.className="modal-overlay",i.id="modal-overlay";const r=document.createElement("div");r.className=`modal ${t}`;let p=`
    <div class="modal-header">
      <h3>${f(e)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof s=="string"?f(s):""}</div>
  `;o.length&&(p+='<div class="modal-footer">',o.forEach((y,v)=>{p+=`<button class="btn ${y.className||"btn-secondary"}" id="modal-action-${v}">${f(y.label)}</button>`}),p+="</div>"),r.innerHTML=p,typeof s!="string"&&(s instanceof HTMLElement||s instanceof DocumentFragment)&&(r.querySelector(".modal-body").innerHTML="",r.querySelector(".modal-body").appendChild(s)),i.appendChild(r),document.body.appendChild(i);const d=()=>{i.remove(),a&&a()};r.querySelector("#modal-close-btn").addEventListener("click",d),i.addEventListener("click",y=>{y.target===i&&d()}),o.forEach((y,v)=>{const n=r.querySelector(`#modal-action-${v}`);n&&y.onClick&&n.addEventListener("click",()=>y.onClick(d))});const l=y=>{y.key==="Escape"&&(d(),document.removeEventListener("keydown",l))};return document.addEventListener("keydown",l),{close:d,modal:r,overlay:i}}const Me=Object.freeze(Object.defineProperty({__proto__:null,showModal:we},Symbol.toStringTag,{value:"Module"}));function at({title:e,icon:s,iconBgColor:t="var(--color-primary-light)",iconTextColor:a="var(--color-primary)",metaHtml:o="",actionsHtml:i=""}){return`
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
        ${i}
      </div>
    </div>
  `}function Ue({title:e,content:s,actions:t=[],width:a=400}){const o=document.querySelector(".drawer-overlay");o&&o.remove();const i=document.createElement("div");i.className="drawer-overlay";const r=document.createElement("div");r.className="drawer",r.style.width=typeof a=="number"?`${a}px`:a;const p=document.createElement("div");p.className="drawer-header",p.innerHTML=`
    <h3>${e}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const d=document.createElement("div");if(d.className="drawer-body",typeof s=="string"?d.innerHTML=s:d.appendChild(s),r.appendChild(p),r.appendChild(d),t.length>0){const y=document.createElement("div");y.className="drawer-footer",t.forEach(v=>{const n=document.createElement("button");n.className=`btn ${v.className||"btn-secondary"}`,n.innerHTML=v.label,n.onclick=()=>v.onClick(l),y.appendChild(n)}),r.appendChild(y)}i.appendChild(r),document.body.appendChild(i);function l(){r.style.animation="slideRightOut 0.2s ease forwards",i.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>i.remove(),200)}p.querySelector(".drawer-close").onclick=l,i.addEventListener("mousedown",y=>{y.target===i&&l()})}function Gt({customerId:e=null,site:s="",onSave:t=null}={}){const a=c.getAll("customers"),o=c.getAll("people").filter(m=>m.type==="Staff"),i=e?c.getById("customers",e):null,r=(i==null?void 0:i.sites)||[],p=document.createElement("div");p.innerHTML=`
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
            ${a.map(m=>`<option value="${m.id}" ${e===m.id?"selected":""}>${m.company||m.firstName+" "+m.lastName}</option>`).join("")}
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
            ${o.map(m=>`<option value="${m.id}">${m.firstName} ${m.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${e?"flex":"none"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${r.map(m=>`<option value="${f(m.name)}" ${s===m.name?"selected":""}>${f(m.name)}</option>`).join("")}
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
          <div style="display:flex; gap:8px;">
            <input type="number" id="qa-initial-meter" class="form-input" value="0" style="flex:1" />
            <select id="qa-meter-unit" class="form-select" style="width: 80px;">
              <option value="hrs">hrs</option>
              <option value="kmls">km</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  `;const d=p.querySelector("#qa-owner-type"),l=p.querySelector("#qa-customer-group"),y=p.querySelector("#qa-business-fields"),v=p.querySelector("#qa-customer-fields"),n=p.querySelector("#qa-customer-id"),u=p.querySelector("#qa-asset-site");d.addEventListener("change",m=>{const w=m.target.value==="Customer";l.style.display=w?"block":"none",y.style.display=w?"none":"flex",v.style.display=w?"flex":"none"}),n.addEventListener("change",m=>{const w=m.target.value,b=c.getById("customers",w);b&&b.sites?u.innerHTML='<option value="">-- No specific site --</option>'+b.sites.map(h=>`<option value="${f(h.name)}">${f(h.name)}</option>`).join(""):u.innerHTML='<option value="">-- No specific site --</option>'}),we({title:"Quick Add Asset",size:"modal-70",content:p,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create Asset",className:"btn-primary",onClick:m=>{const w=p.querySelector("#qa-asset-name").value.trim();if(!w)return M("Asset Name is required","error");const b=d.value,h=n.value;if(b==="Customer"&&!h)return M("Please select a customer","error");const L={name:w,description:p.querySelector("#qa-asset-desc").value.trim(),ownerType:b,customerId:b==="Customer"?h:null,type:p.querySelector("#qa-asset-type").value,serial:p.querySelector("#qa-asset-serial").value.trim(),status:"Active",serviceIntervalMonths:parseInt(p.querySelector("#qa-service-interval").value)||6,currentMeter:parseInt(p.querySelector("#qa-initial-meter").value)||0,meterUnit:p.querySelector("#qa-meter-unit").value,logs:[]};b==="Business"?(L.recoveryRate=parseFloat(p.querySelector("#qa-recovery-rate").value)||0,L.assignedToId=p.querySelector("#qa-assigned-to").value):(L.site=u.value,L.installDate=p.querySelector("#qa-install-date").value);const x=c.create("assets",L);M(`Asset "${w}" created successfully`,"success"),t&&t(x),m()}}]})}function zt({onSave:e}={}){const s=c.getAll("assets"),a=c.getSettings().materialCategories||["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],o=document.createElement("div");o.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${a.map(i=>`<option>${i}</option>`).join("")}
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
            ${s.map(i=>`<option>${i.name}</option>`).join("")}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `,we({title:"Create New Catalog Item",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save to Catalog",className:"btn-primary",onClick:i=>{const r=o.querySelector("#qs-name").value,p=parseFloat(o.querySelector("#qs-cost").value)||0;let d=parseFloat(o.querySelector("#qs-sell").value);if(!r){M("Item name is required","error");return}if(p<=0){M("Cost price is required","error");return}(isNaN(d)||d===0)&&(d=p*1.3);const l=c.create("stock",{name:r,category:o.querySelector("#qs-category").value,sku:o.querySelector("#qs-sku").value||`SKU-${Date.now().toString().slice(-4)}`,unit:o.querySelector("#qs-unit").value,reorderLevel:parseInt(o.querySelector("#qs-reorder").value)||10,costPrice:p,unitPrice:d,location:o.querySelector("#qs-location").value,quantity:0,supplier:""});M(`Stock item "${r}" created`,"success"),e&&e(l),i()}}]})}function _t({id:e=null,jobId:s=null,supplierId:t=null,onSave:a=null}={}){const o=!e,i=c.getAll("contractors").filter(m=>m.isSupplier!==!1),r=c.getAll("jobs").filter(m=>m.status!=="Completed"&&m.status!=="Invoiced"),p=c.getAll("stock");let d=o?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],notes:"",supplierId:t||"",jobId:s||""}:c.getById("purchaseOrders",e);if(!d){M("Purchase Order not found","error");return}let l=[...d.lineItems||[]];const y=document.createElement("div");y.className="po-drawer-container";function v(){y.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${d.status!=="Draft"&&!o?"disabled":""}>
                <option value="">Select supplier...</option>
                ${i.map(m=>`<option value="${m.id}" ${d.supplierId===m.id?"selected":""}>${m.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${d.status!=="Draft"&&!o?"disabled":""}>
                <option value="">No specific job (Stock PO)</option>
                ${r.map(m=>`<option value="${m.id}" ${d.jobId===m.id?"selected":""}>#${m.number} - ${m.title}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${d.issueDate?d.issueDate.split("T")[0]:""}" ${d.status!=="Draft"&&!o?"disabled":""} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${f(d.notes||"")}" placeholder="e.g. Delivery instructions" ${d.status!=="Draft"&&!o?"disabled":""} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${o?"":`(${f(d.number)})`}</h4>
            ${d.status==="Draft"||o?`
            <div style="display:flex; gap:8px">
               <button class="btn btn-secondary btn-sm" id="btn-browse-stock"><span class="material-icons-outlined" style="font-size:16px">inventory_2</span> Browse Stock</button>
               <button class="btn btn-secondary btn-sm" id="btn-add-stock-new"><span class="material-icons-outlined" style="font-size:16px">add</span> Add New Stock</button>
            </div>
            `:`<span class="badge ${d.status==="Issued"?"badge-primary":"badge-success"}">${d.status}</span>`}
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
                ${l.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>':l.map((m,w)=>`
                  <tr data-idx="${w}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${f(m.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${w}" ${d.status!=="Draft"&&!o?"disabled":""} />
                       <datalist id="stock-list-${w}">
                          ${p.map(b=>`<option value="${f(b.name)}">${f(b.name)} - $${(b.costPrice||0).toFixed(2)}</option>`).join("")}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${m.qty||m.quantity}" min="1" style="width:100%" ${d.status!=="Draft"&&!o?"disabled":""} /></td>
                    <td><input type="number" class="form-input item-cost" value="${m.cost||m.unitCost}" step="0.01" style="width:100%" ${d.status!=="Draft"&&!o?"disabled":""} /></td>
                    <td style="text-align:right; font-weight:600">$${((m.qty||m.quantity||0)*(m.cost||m.unitCost||0)).toFixed(2)}</td>
                    <td>${d.status==="Draft"||o?'<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>':""}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${l.reduce((m,w)=>m+(w.qty||w.quantity||0)*(w.cost||w.unitCost||0),0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,n()}function n(){var m,w;(m=y.querySelector("#btn-add-stock-new"))==null||m.addEventListener("click",()=>{zt({onSave:b=>{l.push({description:b.name,qty:1,cost:b.costPrice||0,stockId:b.id}),v()}})}),(w=y.querySelector("#btn-browse-stock"))==null||w.addEventListener("click",()=>{var h;const b=document.createElement("div");b.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${p.map(L=>`
            <div class="stock-pick-item" data-id="${L.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${f(L.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${L.sku||"N/A"} — Cost: $${(L.costPrice||0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join("")}
        </div>
      `,we({title:"Select Stock",content:b,actions:[{label:"Close",className:"btn-secondary",onClick:L=>L()}]}),(h=b.querySelector("#btn-po-new-stock"))==null||h.addEventListener("click",()=>{zt({onSave:L=>{var x;l.push({description:L.name,qty:1,cost:L.costPrice||0,stockId:L.id}),v(),(x=document.querySelector(".modal-overlay"))==null||x.remove()}})}),b.querySelectorAll(".stock-pick-item").forEach(L=>{L.addEventListener("click",()=>{const x=p.find(T=>T.id===L.dataset.id);x&&(l.push({description:x.name,qty:1,cost:x.costPrice||0,stockId:x.id}),v(),M(`Added ${x.name}`,"success"))})})}),y.querySelectorAll("#po-items-body tr").forEach(b=>{var $;const h=parseInt(b.dataset.idx),L=b.querySelector(".item-desc"),x=b.querySelector(".item-qty"),T=b.querySelector(".item-cost");L==null||L.addEventListener("change",g=>{const q=g.target.value,D=p.find(E=>E.name===q);D?(l[h].description=D.name,l[h].cost=D.costPrice||0,l[h].stockId=D.id):l[h].description=q,v()}),x==null||x.addEventListener("input",()=>{const g=parseFloat(x.value)||0;l[h].qty=g,l[h].quantity=g}),T==null||T.addEventListener("input",()=>{const g=parseFloat(T.value)||0;l[h].cost=g,l[h].unitCost=g}),($=b.querySelector(".btn-remove-item"))==null||$.addEventListener("click",()=>{l.splice(h,1),v()})})}v();const u=[{label:"Cancel",className:"btn-secondary",onClick:m=>m()}];o||d.status==="Draft"?u.push({label:o?"Create & Issue PO":"Update & Issue PO",className:"btn-primary",onClick:m=>{const w=y.querySelector("#qa-po-supplier").value,b=y.querySelector("#qa-po-job").value;if(!w){M("Supplier is required","error");return}if(l.length===0){M("Please add at least one item","error");return}const h=i.find(T=>T.id===w),L=r.find(T=>T.id===b),x={number:d.number||`PO-${Date.now().toString().slice(-6)}`,supplierId:w,supplierName:(h==null?void 0:h.company)||"Unknown",jobId:b||null,jobNumber:(L==null?void 0:L.number)||"",issueDate:y.querySelector("#qa-po-date").value,notes:y.querySelector("#qa-po-notes").value,total:l.reduce((T,$)=>T+($.qty||$.quantity||0)*($.cost||$.unitCost||0),0),status:"Issued",lineItems:l};o?c.create("purchaseOrders",x):c.update("purchaseOrders",e,x),M(`Purchase Order ${x.number} issued`,"success"),a&&a(),m()}}):d.status==="Issued"&&u.push({label:"Mark as Received",className:"btn-success",onClick:m=>{c.update("purchaseOrders",e,{status:"Received",receivedDate:new Date().toISOString()}),l.forEach(w=>{if(w.stockId){const b=c.getById("stock",w.stockId);b&&c.update("stock",b.id,{quantity:(b.quantity||0)+(w.qty||w.quantity)})}}),M(`PO ${d.number} marked as Received`,"success"),a&&a(),m()}}),Ue({title:o?"New Purchase Order":"Manage Purchase Order",content:y,width:750,actions:u})}function Ys(e,{id:s}){const t=c.getById("customers",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}Ye(t.company);const a=c.getAll("jobs").filter(l=>l.customerId===s),o=c.getAll("quotes").filter(l=>l.customerId===s),i=c.getAll("invoices").filter(l=>l.customerId===s);let r="details";function p(){e.innerHTML=`
      ${at({title:f(t.company),icon:t.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${f(t.firstName)} ${f(t.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${f(t.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${f(t.phone)}</span>
          <span class="badge ${t.status==="Active"?"badge-success":"badge-neutral"}">${f(t.status)}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-edit-person">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-person">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `})}

      <div class="tabs" id="person-tabs">
        <button class="tab ${r==="details"?"active":""}" data-tab="details">Details</button>
        <button class="tab ${r==="contacts"?"active":""}" data-tab="contacts">Contacts (${(t.contacts||[]).length})</button>
        <button class="tab ${r==="sites"?"active":""}" data-tab="sites">Sites (${(t.sites||[]).length})</button>
        <button class="tab ${r==="assets"?"active":""}" data-tab="assets">Assets (${c.getAll("assets").filter(l=>l.ownerType==="Customer"&&l.customerId===s).length})</button>
        <button class="tab ${r==="communications"?"active":""}" data-tab="communications">Communications (${(t.communications||[]).length})</button>
        <button class="tab ${r==="jobs"?"active":""}" data-tab="jobs">Jobs (${a.length})</button>
        <button class="tab ${r==="quotes"?"active":""}" data-tab="quotes">Quotes (${o.length})</button>
        <button class="tab ${r==="invoices"?"active":""}" data-tab="invoices">Invoices (${i.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,d(),e.querySelectorAll(".tab").forEach(l=>{l.addEventListener("click",()=>{r=l.dataset.tab,e.querySelectorAll(".tab").forEach(y=>y.classList.remove("active")),l.classList.add("active"),d()})}),e.querySelector("#btn-edit-person").addEventListener("click",()=>{F.navigate(`/people/${s}/edit`)}),e.querySelector("#btn-delete-person").addEventListener("click",()=>{const l=document.createElement("div");l.innerHTML=`<p>Are you sure you want to delete <strong>${f(t.company)}</strong>? This action cannot be undone.</p>`,we({title:"Delete Customer",content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Delete",className:"btn-danger",onClick:y=>{c.delete("customers",s),M("Customer deleted successfully","success"),y(),F.navigate("/people")}}]})})}function d(){const l=e.querySelector("#tab-content");if(r==="details")l.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${He("Company",t.company)}
                  ${He("Contact",`${t.firstName} ${t.lastName}`)}
                  ${He("Email",t.email)}
                  ${He("Phone",t.phone)}
                  ${He("Type",t.type)}
                  ${He("Status",t.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${He("Address",t.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${He("Created",new Date(t.createdAt).toLocaleDateString())}
                  ${He("Last Updated",new Date(t.updatedAt).toLocaleDateString())}
                  ${He("Total Jobs",a.length)}
                  ${He("Total Quotes",o.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(r==="contacts"){const y=t.contacts||[];l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${y.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${y.map((v,n)=>`
                  <tr>
                    <td class="font-medium">${f(v.name)}</td>
                    <td>${f(v.role||"—")}</td>
                    <td><a href="mailto:${f(v.email)}" class="cell-link">${f(v.email)}</a></td>
                    <td><a href="tel:${f(v.phone)}" class="cell-link">${f(v.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${n}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${y.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,l.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const v=document.createElement("div");v.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,Ue({title:"Add Contact",content:v.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save",className:"btn-primary",onClick:n=>{const u=document.querySelector(".drawer-overlay"),m=u.querySelector("#new-c-name").value.trim();if(!m)return M("Name is required","error");t.contacts||(t.contacts=[]),t.contacts.push({name:m,role:u.querySelector("#new-c-role").value,email:u.querySelector("#new-c-email").value,phone:u.querySelector("#new-c-phone").value}),c.update("customers",s,{contacts:t.contacts}),M("Contact added","success"),d(),p(),n()}}]})}),l.querySelectorAll(".btn-delete-contact").forEach(v=>{v.addEventListener("click",()=>{t.contacts.splice(v.dataset.index,1),c.update("customers",s,{contacts:t.contacts}),M("Contact deleted","success"),d(),p()})})}else if(r==="sites"){const y=t.sites||[];l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${y.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${y.map((v,n)=>`
                  <tr>
                    <td class="font-medium">${f(v.name)}</td>
                    <td>${f(v.address)}</td>
                    <td class="text-secondary">${f(v.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${n}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${y.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,l.querySelector("#btn-toggle-site").addEventListener("click",()=>{const v=document.createElement("div");v.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,Ue({title:"Add Site",content:v.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save",className:"btn-primary",onClick:n=>{const u=document.querySelector(".drawer-overlay"),m=u.querySelector("#new-s-name").value.trim(),w=u.querySelector("#new-s-address").value.trim();if(!m||!w)return M("Name and Address are required","error");t.sites||(t.sites=[]),t.sites.push({name:m,address:w,notes:u.querySelector("#new-s-notes").value}),c.update("customers",s,{sites:t.sites}),M("Site added","success"),d(),p(),n()}}]})}),l.querySelectorAll(".btn-delete-site").forEach(v=>{v.addEventListener("click",()=>{t.sites.splice(v.dataset.index,1),c.update("customers",s,{sites:t.sites}),M("Site deleted","success"),d(),p()})})}else if(r==="assets"){t.assets&&t.assets.length>0&&(t.assets.forEach(v=>{c.create("assets",{name:v.name,serial:v.serial,site:v.site,installDate:v.installDate,ownerType:"Customer",customerId:s,status:"Active",type:"Equipment"})}),t.assets=[],c.update("customers",s,{assets:[]}));const y=c.getAll("assets").filter(v=>v.ownerType==="Customer"&&v.customerId===s);t.sites,l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${y.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${y.map((v,n)=>`
                  <tr>
                    <td class="font-medium">${f(v.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${f(v.serial||"—")}</td>
                    <td>${f(v.site||"—")}</td>
                    <td>${v.installDate?new Date(v.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${v.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${y.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,l.querySelector("#btn-toggle-asset").addEventListener("click",()=>{Gt({customerId:s,onSave:()=>{d(),p()}})}),l.querySelectorAll(".btn-delete-asset").forEach(v=>{v.addEventListener("click",()=>{const n=v.dataset.id;c.delete("assets",n),M("Asset disabled/deleted","success"),d(),p()})})}else if(r==="communications"){const v=[...t.communications||[]].sort((n,u)=>new Date(u.date)-new Date(n.date));l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${v.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${v.map((n,u)=>`
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
      `,l.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const n=document.createElement("div");n.innerHTML=`
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
        `,Ue({title:"Log Activity",content:n.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save",className:"btn-primary",onClick:u=>{const m=document.querySelector(".drawer-overlay"),w=m.querySelector("#new-comm-content").value.trim();if(!w)return M("Details are required","error");t.communications||(t.communications=[]),t.communications.push({id:Date.now().toString(),type:m.querySelector("#new-comm-type").value,date:m.querySelector("#new-comm-date").value,content:w}),c.update("customers",s,{communications:t.communications}),M("Activity logged","success"),d(),p(),u()}}]})})}else r==="jobs"?l.innerHTML=wt(a,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):r==="quotes"?(l.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${wt(o,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,l.querySelector("#btn-create-quote").addEventListener("click",()=>{F.navigate("/quotes/new?customerId="+s)})):r==="invoices"&&(l.innerHTML=wt(i,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}p()}function He(e,s){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${f(e)}</span>
      <span style="font-size:var(--font-size-base)">${f(s)}</span>
    </div>
  `}function wt(e,s,t,a){if(e.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${a}</h3></div></div>`;const o=i=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[i]||"neutral"}">${f(i)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${s.map(i=>`<th>${f(i.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.map(i=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${t}/${f(i.id)}'">
                ${s.map(r=>{let p=i[r.key];return r.badge?p=o(p):r.format==="currency"?p=`$${(p||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:r.format==="date"?p=p?new Date(p).toLocaleDateString():"—":p=f(p),`<td>${p}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Yt(e,{id:s}){const t=s&&s!=="new",a=t?c.getById("customers",s):{};e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{F.navigate(t?`/people/${s}`:"/people")}),e.querySelector("#btn-save").addEventListener("click",()=>{const o=e.querySelector("#person-form");if(!o.checkValidity()){o.reportValidity();return}const i=new FormData(o),r=Object.fromEntries(i);if(t)c.update("customers",s,r),M("Customer updated successfully","success"),F.navigate(`/people/${s}`);else{const p=c.create("customers",r);M("Customer created successfully","success"),F.navigate(`/people/${p.id}`)}})}function It(e){const s=c.getAll("leads");e.innerHTML=`
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
  `;let t=[...s];const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},o={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},r=Re({columns:[{key:"title",label:"Lead",render:p=>`<span class="cell-link font-medium">${f(p.title)}</span>`},{key:"customerName",label:"Customer",render:p=>`<span class="text-secondary">${f(p.customerName)}</span>`},{key:"source",label:"Source",render:p=>`<span class="text-secondary">${f(p.source)}</span>`},{key:"status",label:"Status",render:p=>`<span class="badge ${a[p.status]||"badge-neutral"}">${f(p.status)}</span>`},{key:"priority",label:"Priority",render:p=>`<span class="badge ${o[p.priority]||"badge-neutral"}">${f(p.priority)}</span>`},{key:"value",label:"Value",render:p=>`<span class="font-medium">$${(p.value||0).toLocaleString()}</span>`,getValue:p=>p.value},{key:"createdAt",label:"Created",render:p=>`<span class="text-secondary">${new Date(p.createdAt).toLocaleDateString()}</span>`,getValue:p=>new Date(p.createdAt).getTime()}],data:t,onRowClick:p=>F.navigate(`/leads/${p}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:p=>{Je({container:e,selectedIds:p,onClear:()=>r.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:d=>{const l=document.createElement("div");l.innerHTML=`
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
              `,ve(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Me);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:`Update ${d.length} Leads`,content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Apply",className:"btn-primary",onClick:v=>{const n=l.querySelector("#bulk-status").value;d.forEach(u=>c.update("leads",u,{status:n})),r.clearSelection(),It(e),ve(async()=>{const{showToast:u}=await Promise.resolve().then(()=>qe);return{showToast:u}},void 0).then(({showToast:u})=>u(`Updated ${d.length} leads to ${n}`,"success")),v()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{ve(async()=>{const{showModal:l}=await Promise.resolve().then(()=>Me);return{showModal:l}},void 0).then(({showModal:l})=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete ${d.length} leads? This action cannot be undone.</p>`,l({title:"Confirm Bulk Delete",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Delete",className:"btn-danger",onClick:v=>{d.forEach(n=>c.delete("leads",n)),r.clearSelection(),It(e),ve(async()=>{const{showToast:n}=await Promise.resolve().then(()=>qe);return{showToast:n}},void 0).then(({showToast:n})=>n(`Deleted ${d.length} leads`,"success")),v()}}]})})}}]})}});e.querySelector("#leads-table-container").appendChild(r),e.querySelector("#btn-new-lead").addEventListener("click",()=>F.navigate("/leads/new")),e.querySelectorAll(".toolbar-filter").forEach(p=>{p.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(l=>l.classList.remove("active")),p.classList.add("active");const d=p.dataset.filter;t=d==="all"?[...s]:s.filter(l=>l.status===d),r.updateData(t)})}),e.querySelector("#leads-search").addEventListener("input",p=>{const d=p.target.value.toLowerCase();t=s.filter(l=>l.title.toLowerCase().includes(d)||l.customerName.toLowerCase().includes(d)),r.updateData(t)})}function Ks(e,{id:s}){const t=c.getById("leads",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}Ye(t.title);const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"};e.innerHTML=`
    ${at({title:t.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
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
            ${Ge("Title",t.title)}
            ${Ge("Customer",t.customerName)}
            ${Ge("Contact",t.contactName)}
            ${Ge("Source",t.source)}
            ${Ge("Priority",t.priority)}
            ${Ge("Status",t.status)}
            ${Ge("Estimated Value","$"+(t.value||0).toLocaleString())}
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
  `,e.querySelector("#btn-convert-quote").addEventListener("click",()=>{const o=c.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,title:t.title,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0});c.update("leads",s,{status:"Won"}),M("Lead converted to quote successfully","success"),F.navigate(`/quotes/${o.id}`)}),e.querySelector("#btn-edit-lead").addEventListener("click",()=>F.navigate(`/leads/${s}/edit`)),e.querySelector("#btn-delete-lead").addEventListener("click",()=>{const o=document.createElement("div");o.innerHTML=`<p>Delete <strong>${f(t.title)}</strong>?</p>`,we({title:"Delete Lead",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{c.delete("leads",s),M("Lead deleted","success"),i(),F.navigate("/leads")}}]})})}function Ge(e,s){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function Kt(e,{id:s}){const t=s&&s!=="new",a=t?c.getById("leads",s):{},o=c.getAll("customers");e.innerHTML=`
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
                ${o.map(i=>`<option value="${i.id}" ${a.customerId===i.id?"selected":""}>${i.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(i=>`<option ${a.source===i?"selected":""}>${i}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(i=>`<option ${a.status===i?"selected":""}>${i}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(i=>`<option ${a.priority===i?"selected":""}>${i}</option>`).join("")}
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>F.navigate(t?`/leads/${s}`:"/leads")),e.querySelector("#btn-save").addEventListener("click",()=>{const i=e.querySelector("#lead-form");if(!i.checkValidity()){i.reportValidity();return}const r=Object.fromEntries(new FormData(i));r.value=parseFloat(r.value)||0;const p=o.find(d=>d.id===r.customerId);if(r.customerName=(p==null?void 0:p.company)||"",r.contactName=p?`${p.firstName} ${p.lastName}`:"",t)c.update("leads",s,r),M("Lead updated","success"),F.navigate(`/leads/${s}`);else{const d=c.create("leads",r);M("Lead created","success"),F.navigate(`/leads/${d.id}`)}})}function Xt(e){const s=c.getAll("notifications")||[];let t="",a="all";function o(){return s.filter(n=>{var b,h,L,x,T;const u=t.toLowerCase(),m=((b=n.title)==null?void 0:b.toLowerCase().includes(u))||((h=n.description)==null?void 0:h.toLowerCase().includes(u))||((L=n.createdBy)==null?void 0:L.toLowerCase().includes(u))||((x=n.type)==null?void 0:x.toLowerCase().includes(u))||((T=n.priority)==null?void 0:T.toLowerCase().includes(u)),w=a==="all"||n.status===a;return m&&w})}e.innerHTML=`
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
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${f(t)}" />
      </div>
    </div>
    
    <div id="notifications-table-container"></div>
  `;const r=Re({columns:[{key:"createdAt",label:"Date",render:n=>n.createdAt?new Date(n.createdAt).toLocaleDateString():"—",getValue:n=>n.createdAt?new Date(n.createdAt).getTime():0,width:"100px"},{key:"type",label:"Type",render:n=>`<span class="badge badge-neutral">${f(n.type||"Field Alert")}</span>`,width:"120px"},{key:"title",label:"Title / Job Name",render:n=>`
        <div style="font-weight:500">${f(n.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f(n.description)}</div>
      `},{key:"priority",label:"Priority",render:n=>`<span class="badge ${n.priority==="Urgent"||n.priority==="High"?"badge-danger":"badge-neutral"}">${f(n.priority||"Normal")}</span>`,width:"100px"},{key:"status",label:"Status",render:n=>`<span class="badge ${n.status==="Converted"?"badge-success":"badge-warning"}">${f(n.status)}</span>`,width:"110px"},{key:"createdBy",label:"Raised By",width:"150px"},{key:"actions",label:"",render:n=>`
        <div style="text-align:right">
          ${n.status!=="Converted"?`
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${n.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${n.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          `:""}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${n.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${n.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,width:"150px"}],data:o(),onRowClick:n=>{const u=s.find(m=>m.id===n);u&&l(u)},emptyMessage:"No notifications found",emptyIcon:"campaign"});e.querySelector("#notifications-table-container").appendChild(r),e.querySelector("#notif-search").addEventListener("input",n=>{t=n.target.value,r.updateData(o())}),e.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(u=>u.classList.remove("active")),n.classList.add("active"),a=n.dataset.filter,r.updateData(o())})}),e.querySelector("#btn-raise-notification").addEventListener("click",()=>d()),r.addEventListener("click",n=>{const u=n.target.closest("button");if(!u)return;n.stopPropagation();const m=u.dataset.id;if(u.classList.contains("btn-view-notification")){const w=s.find(b=>b.id===m);w&&l(w)}else if(u.classList.contains("btn-edit-notification")){const w=s.find(b=>b.id===m);w&&d(w)}else u.classList.contains("btn-convert-quote")?y(m):u.classList.contains("btn-convert-job")&&v(m)});function d(n=null){const u=c.getAll("jobs"),m=JSON.parse(localStorage.getItem("currentUser")||"{}");Ue({title:n?"Edit Notification":"Raise Notification",width:450,content:`
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
              ${u.map(w=>`<option value="${w.id}" ${(n==null?void 0:n.jobId)===w.id?"selected":""}>${f(w.number)} - ${f(w.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${f((n==null?void 0:n.title)||"")}" />
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
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${f((n==null?void 0:n.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:w=>w()},{label:n?"Save Changes":"Submit Notification",className:"btn-primary",onClick:w=>{const b=document.getElementById("notif-type").value,h=document.getElementById("notif-job").value,L=document.getElementById("notif-title").value.trim(),x=document.getElementById("notif-priority").value,T=document.getElementById("notif-desc").value.trim();if(!L||!T){M("Title and Description are required","error");return}n?(c.update("notifications",n.id,{type:b,jobId:h||null,title:L,priority:x,description:T}),M("Notification updated","success")):(c.create("notifications",{type:b,jobId:h||null,title:L,priority:x,description:T,status:"Pending",createdAt:new Date().toISOString(),createdBy:m.name||"Unknown"}),M("Notification raised successfully","success")),w(),Xt(e)}}]})}function l(n){Ue({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${n.status==="Converted"?"badge-success":"badge-warning"}">${f(n.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${f(n.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${f(n.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${f(n.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${f(n.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${n.createdAt?new Date(n.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${n.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${n.jobId}">${f(n.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:n.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:u=>u()},{label:"Edit",className:"btn-secondary",onClick:u=>{u(),d(n)}},{label:"Convert to Quote",className:"btn-secondary",onClick:u=>{u(),y(n.id)}},{label:"Convert to Job",className:"btn-primary",onClick:u=>{u(),v(n.id)}}]:[{label:"Close",className:"btn-secondary",onClick:u=>u()}]})}function y(n){const u=c.getById("notifications",n);if(!u)return;const m=c.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:u.title,description:u.description,priority:u.priority,status:"Draft",notes:`Generated from Notification: ${u.title}

${u.description}`,createdAt:new Date().toISOString()});c.update("notifications",n,{status:"Converted",convertedTo:`Quote ${m.number}`}),M("Converted to Quote successfully","success"),F.navigate(`/quotes/${m.id}`)}function v(n){const u=c.getById("notifications",n);if(!u)return;const m=c.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,title:u.title,description:u.description,priority:u.priority,status:"Pending",notes:`Generated from Notification: ${u.title}

${u.description}`,createdAt:new Date().toISOString()});c.update("notifications",n,{status:"Converted",convertedTo:`Job ${m.number}`}),M("Converted to Job successfully","success"),F.navigate(`/jobs/${m.id}`)}}function Lt(e){const s=c.getAll("quotes"),t=je("Quotes","create");e.innerHTML=`
    <div class="page-header">
      <h1>Quotes</h1>
      ${t?`
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
      </div>`:""}
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
  `;let a=[...s];const o={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},r=Re({columns:[{key:"number",label:"Quote #",render:d=>`<span class="cell-link font-medium">${f(d.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:d=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${f(d.title||"")}</span>`},{key:"status",label:"Status",render:d=>`<span class="badge ${o[d.status]||"badge-neutral"}">${f(d.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:d=>`<span class="font-semibold">$${(d.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:d=>d.total,width:"110px"},{key:"createdAt",label:"Date",render:d=>new Date(d.createdAt).toLocaleDateString(),getValue:d=>new Date(d.createdAt).getTime(),width:"100px"}],data:a,onRowClick:d=>F.navigate(`/quotes/${d}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:d=>{Je({container:e,selectedIds:d,onClear:()=>r.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:l=>{const y=document.createElement("div");y.innerHTML=`
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
              `,ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>Me);return{showModal:v}},void 0).then(({showModal:v})=>{v({title:`Update ${l.length} Quotes`,content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Apply",className:"btn-primary",onClick:n=>{const u=y.querySelector("#bulk-status").value;l.forEach(m=>c.update("quotes",m,{status:u})),r.clearSelection(),Lt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${l.length} quotes to ${u}`,"success")),n()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{ve(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Me);return{showModal:y}},void 0).then(({showModal:y})=>{const v=document.createElement("div");v.innerHTML=`<p>Are you sure you want to delete ${l.length} quotes? This action cannot be undone.</p>`,y({title:"Confirm Bulk Delete",content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{l.forEach(u=>c.delete("quotes",u)),r.clearSelection(),Lt(e),ve(async()=>{const{showToast:u}=await Promise.resolve().then(()=>qe);return{showToast:u}},void 0).then(({showToast:u})=>u(`Deleted ${l.length} quotes`,"success")),n()}}]})})}}]})}});e.querySelector("#quotes-table-container").appendChild(r);const p=e.querySelector("#btn-new-quote");p&&p.addEventListener("click",()=>F.navigate("/quotes/new")),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(y=>y.classList.remove("active")),d.classList.add("active");const l=d.dataset.filter;a=l==="all"?[...s]:s.filter(y=>y.status===l),r.updateData(a)})}),e.querySelector("#quotes-search").addEventListener("input",d=>{const l=d.target.value.toLowerCase();a=s.filter(y=>y.number.toLowerCase().includes(l)||y.customerName.toLowerCase().includes(l)||(y.title||"").toLowerCase().includes(l)),r.updateData(a)})}function Zt({type:e,data:s}){const t=document.createElement("div");t.className="modal-overlay",t.id="print-preview-overlay",t.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const a=document.createElement("div");a.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const o=document.createElement("div");o.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;",o.innerHTML=`
    <span style="font-weight:600;font-size:14px">${e==="quote"?"Quote":"Invoice"} Preview — ${s.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const i=document.createElement("div");i.id="print-document",i.className="print-document",i.innerHTML=Ht(e,s),a.appendChild(o),a.appendChild(i),t.appendChild(a),document.body.appendChild(t);const r=()=>t.remove();o.querySelector("#btn-close-preview").addEventListener("click",r),t.addEventListener("click",d=>{d.target===t&&r()}),o.querySelector("#btn-print-pdf").addEventListener("click",()=>{const d=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.number} — ${e==="quote"?"Quote":"Invoice"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${Xs()}</style>
      </head>
      <body>
        ${Ht(e,s)}
      </body>
      </html>
    `,l=`${e==="quote"?"Quote":"Invoice"} ${s.number}`;if(!c.getAll("documents").find(u=>u.entityId===s.id&&u.name===l)){const u=`data:text/html;charset=utf-8,${encodeURIComponent(d)}`;c.create("documents",{name:l,type:e==="quote"?"Quote PDF":"Invoice PDF",size:d.length,url:u,folder:e==="quote"?"Quotes":"Invoices",uploadedAt:new Date().toISOString(),entityType:e==="quote"?"Quote":"Invoice",entityId:s.id,entityName:s.customerName||"Unknown Customer"}),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>{m(`${l} saved to Documents`,"success")})}const n=window.open("","_blank","width=800,height=1000");n.document.write(d),n.document.close(),setTimeout(()=>{n.print()},500)});const p=d=>{d.key==="Escape"&&(r(),document.removeEventListener("keydown",p))};document.addEventListener("keydown",p)}function Ht(e,s){const t=e==="quote",o={Draft:"#6B7280",Finalised:"#1B6DE0",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[s.status]||"#6B7280",i=s.customerName||"Customer",r=s.contactName||"",p=s.lineItems||[],d=s.sections||[],l=c.getSettings(),y=l.logo?`<img src="${l.logo}" style="max-height:60px; max-width:240px; object-fit:contain" />`:'<div class="pdf-logo">F</div>';let v="";return d.length>0?d.forEach(n=>{v+=`
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${f(n.name||"Phase")}</td>
        </tr>
      `,n.lineItems.forEach(u=>{v+=`
          <tr>
            <td>${u.description?f(u.description):"—"}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(u.type||"other").charAt(0).toUpperCase()+(u.type||"other").slice(1)}</span></td>
            <td style="text-align:center">${u.qty||1}</td>
            <td style="text-align:right">$${(u.rate||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(u.total||0).toFixed(2)}</td>
          </tr>
        `}),v+=`
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(n.subtotal||0).toFixed(2)}</td>
        </tr>
      `}):v=p.map(n=>`
      <tr>
        <td>${n.description?f(n.description):"—"}</td>
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
          ${y}
          <div>
            <div class="pdf-company-name">${f(l.name||"FieldForge Demo Company")}</div>
            <div class="pdf-company-detail">ABN: ${f(l.abn||"12 345 678 901")}</div>
            <div class="pdf-company-detail">${f(l.address||"123 Business St, Melbourne VIC 3000")}</div>
            <div class="pdf-company-detail">Phone: ${f(l.phone||"1300 123 456")}</div>
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
          <div class="pdf-info-value-lg">${i}</div>
          ${r?`<div class="pdf-info-value">Attn: ${r}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${t?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${kt(t?s.createdAt:s.issueDate)}</span>
          </div>
          ${t?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${kt(s.validUntil)}</span>
            </div>
          `:`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${kt(s.dueDate)}</span>
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
          ${v}
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
          <div class="pdf-notes-text">${f(s.notes).replace(/\n/g,"<br>")}</div>
        </div>
      `:""}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div class="pdf-footer-text">
          ${t?"This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.":"Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business."}
        </div>
        <div class="pdf-footer-company">${f(l.name||"FieldForge Demo Company")} — ${f(l.email||"hello@fieldforge.io")} — ${f(l.phone||"1300 123 456")}</div>
      </div>
    </div>
  `}function kt(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return e}}function Xs(){return`
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
  `}function es(e,{id:s,customerId:t}){const a=s==="new";let o=a?{status:"Draft",version:1,sections:[{id:c.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:t||""}:c.getById("quotes",s);if(!o){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Quote not found</h3></div>';return}o.lineItems&&!o.sections&&(o.sections=[{id:c.generateId(),name:"Main Phase",lineItems:[...o.lineItems]}],delete o.lineItems),a||Ye(o.number+(o.version>1?` v${o.version}`:""));const i=c.getAll("customers"),r=c.getAll("stock"),p=c.getSettings(),d={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function l(){e.innerHTML=`
      ${at({title:`${a?"New Quote":o.number} ${o.version>1?`<span class="badge badge-neutral">v${o.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          <span class="badge ${d[o.status]||"badge-neutral"}">${o.status}</span>
        `,actionsHtml:`
          ${a?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!a&&o.status!=="Archived"&&je("Quotes","edit")?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!a&&o.status==="Accepted"&&je("Quotes","convert")?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!a&&o.status==="Draft"&&je("Quotes","edit")?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                ${je("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>':""}
                ${je("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>':""}
                ${!a&&je("Quotes","delete")?'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>':""}
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
                ${i.map(m=>`<option value="${m.id}" ${o.customerId===m.id?"selected":""}>${m.company}</option>`).join("")}
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
                ${["Draft","Finalised","Sent","Accepted","Declined","Archived"].map(m=>`<option ${o.status===m?"selected":""}>${m}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${o.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${p.laborRates.map(m=>`<option value="${m.id}" ${o.laborProfileId===m.id?"selected":""}>${m.name} ($${m.rate.toFixed(2)}/hr)</option>`).join("")}
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
        ${r.map(m=>`<option value="${m.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(o.sections||[]).map((m,w)=>y(m,w)).join("")}
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

      ${o.status!=="Archived"&&(a?je("Quotes","create"):je("Quotes","edit"))?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Back</button>
      </div>`}
    `,u()}function y(m,w){const b=o.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${w}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${m.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${b?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(m.subtotal||0).toFixed(2)}</span>
            ${b?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${w}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${w}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(m.lineItems||[]).map((h,L)=>v(h,w,L,b)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function v(m,w,b,h){return`
      <tr data-sidx="${w}" data-index="${b}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${m.description||""}" data-field="description" placeholder="Type item name..." ${h?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${h?"disabled":""}>
          <option value="labor" ${m.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${m.type==="material"?"selected":""}>Material</option>
          <option value="other" ${m.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${m.qty||1}" data-field="qty" min="1" ${h?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${m.rate||0}" data-field="rate" step="0.01" ${h?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(m.total||0).toFixed(2)}</td>
        <td>${h?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${w}" data-index="${b}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function n(){o.subtotal=0,o.totalInternalCost=0;let m=0;c.getSettings().laborRates.find(b=>b.id===o.laborProfileId),(o.sections||[]).forEach(b=>{b.subtotal=0,(b.lineItems||[]).forEach(h=>{h.total=(h.qty||0)*(h.rate||0),h.type==="labor"&&(m+=h.total),h.internalCost||(h.type==="labor"?h.internalCost=45:h.internalCost=h.rate*.7),o.totalInternalCost+=(h.qty||0)*(h.internalCost||0),b.subtotal+=h.total}),o.subtotal+=b.subtotal}),o.tax=o.subtotal*.1,o.total=o.subtotal+o.tax,l()}function u(){var w,b,h,L,x,T,$,g,q,D;(w=e.querySelector("#btn-preview-pdf"))==null||w.addEventListener("click",()=>{Zt({type:"quote",data:o})});const m=e.querySelector(".dropdown > .btn");m&&(m.addEventListener("click",E=>{E.stopPropagation();const C=m.nextElementSibling;C.style.display=C.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const E=e.querySelector(".dropdown-menu");E&&(E.style.display="none")})),(b=e.querySelector("#btn-create-revision"))==null||b.addEventListener("click",()=>{c.update("quotes",s,{status:"Archived"});const E=JSON.parse(JSON.stringify(o));delete E.id,E.version=(o.version||1)+1,E.status="Draft",E.createdAt=new Date().toISOString();const C=c.create("quotes",E);M(`Revision v${E.version} created`,"success"),F.navigate(`/quotes/${C.id}`)}),(h=e.querySelector("#btn-save-template"))==null||h.addEventListener("click",E=>{E.preventDefault();const C=document.createElement("div");C.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${o.title||"Custom Quote Template"}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `,we({title:"Save Quote as Template",content:C,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Save Template",className:"btn-primary",onClick:j=>{const H=C.querySelector("#tmpl-name").value,Y=C.querySelector("#tmpl-desc").value;if(!H){M("Template name is required","error");return}const re={name:H,description:Y,sections:JSON.parse(JSON.stringify(o.sections)),createdAt:new Date().toISOString()};c.create("quoteTemplates",re),M("Saved to Quote Templates","success"),j()}}]})}),(L=e.querySelector("#btn-import-template"))==null||L.addEventListener("click",E=>{E.preventDefault();const C=c.getAll("quoteTemplates"),j=document.createElement("div");j.innerHTML=`
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${C.length?C.map(H=>`
            <div class="import-item" data-id="${H.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${f(H.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${H.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${f(H.description||"No description.")}</div>
            </div>
          `).join(""):'<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `,we({title:"Import Quote Template",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:H=>H()}]}),j.querySelectorAll(".import-item").forEach(H=>{H.addEventListener("click",()=>{var re;const Y=C.find(J=>J.id===H.dataset.id);Y&&confirm(`Replace current quote sections with "${Y.name}"?`)&&(o.sections=JSON.parse(JSON.stringify(Y.sections)),o.sections.forEach(J=>{J.id=c.generateId(),J.lineItems.forEach(I=>I.id=c.generateId())}),n(),(re=document.querySelector(".modal-overlay"))==null||re.remove())})})}),e.querySelectorAll("#quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(E=>{E.addEventListener("change",()=>{const C=E.value;if(E.id==="quote-customer")o.customerId=C;else if(E.id==="quote-title")o.title=C;else if(E.id==="quote-status")o.status=C;else if(E.id==="quote-valid")o.validUntil=C;else if(E.id==="quote-labor-profile"){o.laborProfileId=C;const j=p.laborRates.find(H=>H.id===C);if(j){if(o.sections&&o.sections.forEach(H=>{H.lineItems.forEach(Y=>{Y.type==="labor"&&(Y.rate=j.rate)})}),j.minCallOutFee>0){const H=o.sections[0];H&&(H.lineItems.some(re=>re.description.includes("Call-out Fee"))||H.lineItems.unshift({description:"Call-out Fee",type:"other",qty:1,rate:j.minCallOutFee,total:j.minCallOutFee}))}n()}}})}),(x=e.querySelector("#btn-add-section"))==null||x.addEventListener("click",()=>{const E=p.laborRates.find(C=>C.id===o.laborProfileId)||p.laborRates.find(C=>C.isDefault);o.sections.push({id:c.generateId(),name:"New Phase",lineItems:[{description:"Labour",type:"labor",qty:1,rate:E?E.rate:85,total:E?E.rate:85}]}),n()}),e.querySelectorAll(".section-name-input").forEach((E,C)=>{E.addEventListener("change",()=>{o.sections[C].name=E.value})}),e.querySelectorAll(".btn-add-line").forEach(E=>{E.addEventListener("click",C=>{const j=parseInt(E.dataset.sidx);o.sections[j].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),l()})}),e.querySelectorAll(".btn-remove-section").forEach(E=>{E.addEventListener("click",()=>{const C=parseInt(E.dataset.sidx);confirm("Remove this entire phase?")&&(o.sections.splice(C,1),n())})}),e.querySelectorAll(".item-input").forEach(E=>{E.addEventListener("change",C=>{const j=E.closest("tr"),H=parseInt(j.dataset.sidx),Y=parseInt(j.dataset.index),re=E.dataset.field;let J=E.value;if((re==="qty"||re==="rate")&&(J=parseFloat(J)||0),o.sections[H].lineItems[Y][re]=J,re==="description"){const I=r.find(A=>A.name===J);if(I){const A=(I.category||"").toLowerCase().includes("labor");let N=0,S=0;if(A)N=I.unitPrice||85,S=I.costPrice||45;else{const k=I.costPrice||I.unitPrice||0;S=k,N=$t(k,p)}o.sections[H].lineItems[Y].type=A?"labor":"material",o.sections[H].lineItems[Y].rate=N,o.sections[H].lineItems[Y].internalCost=S}}n()})}),e.querySelectorAll(".btn-remove-line").forEach(E=>{E.addEventListener("click",()=>{const C=parseInt(E.dataset.sidx),j=parseInt(tr.dataset.index);o.sections[C].lineItems.splice(j,1),n()})}),(T=e.querySelector("#btn-cancel-quote"))==null||T.addEventListener("click",()=>F.navigate("/quotes")),($=e.querySelector("#btn-save-quote"))==null||$.addEventListener("click",()=>{const E=e.querySelector("#quote-customer").value,C=i.find(j=>j.id===E);if(o.customerId=E,o.customerName=(C==null?void 0:C.company)||"",o.contactName=C?`${C.firstName} ${C.lastName}`:"",o.title=e.querySelector("#quote-title").value,o.status=e.querySelector("#quote-status").value,o.validUntil=e.querySelector("#quote-valid").value,n(),a){const j=c.create("quotes",o);M("Quote created","success"),F.navigate(`/quotes/${j.id}`)}else c.update("quotes",s,o),M("Quote saved","success"),l()}),(g=e.querySelector("#btn-convert-job"))==null||g.addEventListener("click",()=>{const E=c.getAll("technicians"),C=E[Math.floor(Math.random()*E.length)];let j=0,H=0;(o.sections||[]).forEach(J=>{(J.lineItems||[]).forEach(I=>{I.type==="labor"&&(j+=I.total),I.type==="material"&&(H+=I.total)})});const Y=o.sections.map(J=>({id:c.generateId(),name:J.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),re=c.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:o.customerId,customerName:o.customerName,contactName:o.contactName,title:o.title,type:"Project",status:"Pending",priority:"Medium",technicianId:C==null?void 0:C.id,technicianName:C==null?void 0:C.name,quoteId:s,tasks:Y,phases:Y,laborCost:j,materialCost:H});M("Quote converted to project","success"),F.navigate(`/jobs/${re.id}`)}),(q=e.querySelector("#btn-send-quote"))==null||q.addEventListener("click",()=>{o.emailStatus="Sent",o.status==="Draft"&&(o.status="Sent"),c.update("quotes",s,{emailStatus:"Sent",status:o.status}),ve(async()=>{const{showToast:E,addSystemNotification:C}=await Promise.resolve().then(()=>qe);return{showToast:E,addSystemNotification:C}},void 0).then(({showToast:E,addSystemNotification:C})=>{E("Email sent to customer","success"),l(),setTimeout(()=>{const j=c.getById("quotes",s);j&&j.emailStatus==="Sent"&&(j.emailStatus="Opened/Viewed",c.update("quotes",s,{emailStatus:"Opened/Viewed"}),C("Quote Opened",`Quote ${j.number} was opened by ${j.customerName||"the customer"}.`,`/quotes/${s}`),window.location.hash.includes(`/quotes/${s}`)&&(o.emailStatus="Opened/Viewed",l()))},15e3)})}),(D=e.querySelector("#btn-delete-quote"))==null||D.addEventListener("click",()=>{const E=document.createElement("div");E.innerHTML=`<p>Delete quote <strong>${f(o.number)}</strong>?</p>`,we({title:"Delete Quote",content:E,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()},{label:"Delete",className:"btn-danger",onClick:C=>{c.delete("quotes",s),M("Quote deleted","success"),C(),F.navigate("/quotes")}}]})})}l()}function qt(e){const s=c.getAll("jobs"),t=je("Jobs","create");e.innerHTML=`
    <div class="page-header">
      <h1>Jobs</h1>
      ${t?`
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-job"><span class="material-icons-outlined">add</span> New Job</button>
      </div>`:""}
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
  `;let a=[...s];const o={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},i={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},p=Re({columns:[{key:"number",label:"Job #",render:l=>`<span class="cell-link font-medium">${f(l.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:l=>`<span class="truncate" style="max-width:200px;display:inline-block">${f(l.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:l=>{if(l.contractorId){const y=c.getById("contractors",l.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${y?f(y.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${l.technicians&&l.technicians.length>0?l.technicians.map(y=>f(y.name)).join(", "):f(l.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:l=>`<span class="badge ${o[l.status]||"badge-neutral"}">${f(l.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:l=>`<span class="badge ${i[l.priority]||"badge-neutral"}">${f(l.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:l=>l.scheduledDate?new Date(l.scheduledDate).toLocaleDateString():"—",getValue:l=>l.scheduledDate?new Date(l.scheduledDate).getTime():0,width:"100px"}],data:a,onRowClick:l=>F.navigate(`/jobs/${l}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:l=>{Je({container:e,selectedIds:l,onClear:()=>p.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:y=>{const v=document.createElement("div");v.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:n}=await Promise.resolve().then(()=>Me);return{showModal:n}},void 0).then(({showModal:n})=>{n({title:`Update ${y.length} Jobs`,content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{const m=v.querySelector("#bulk-status").value;y.forEach(w=>c.update("jobs",w,{status:m})),p.clearSelection(),qt(e),ve(async()=>{const{showToast:w}=await Promise.resolve().then(()=>qe);return{showToast:w}},void 0).then(({showToast:w})=>w(`Updated ${y.length} jobs to ${m}`,"success")),u()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:y=>{ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>Me);return{showModal:v}},void 0).then(({showModal:v})=>{const n=document.createElement("div");n.innerHTML=`<p>Are you sure you want to delete ${y.length} jobs? This cannot be undone.</p>`,v({title:"Confirm Bulk Delete",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Delete",className:"btn-danger",onClick:u=>{y.forEach(m=>c.delete("jobs",m)),p.clearSelection(),qt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${y.length} jobs`,"success")),u()}}]})})}}]})}});e.querySelector("#jobs-table-container").appendChild(p);const d=e.querySelector("#btn-new-job");d&&d.addEventListener("click",()=>F.navigate("/jobs/new")),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(v=>v.classList.remove("active")),l.classList.add("active");const y=l.dataset.filter;y==="all"?a=[...s]:y==="unscheduled"?a=s.filter(v=>!v.scheduledDate):a=s.filter(v=>v.status===y),p.updateData(a)})}),e.querySelector("#jobs-search").addEventListener("input",l=>{const y=l.target.value.toLowerCase();a=s.filter(v=>v.number.toLowerCase().includes(y)||v.title.toLowerCase().includes(y)||v.customerName.toLowerCase().includes(y)||(v.technicianName||"").toLowerCase().includes(y)),p.updateData(a)})}function Zs(e,{id:s}){const t=c.getById("jobs",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}Ye(t.number);const a={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},o={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let i="overview",r=[0],p=[],d=!1,l=null,y=[];function v(){return l||(l=c.getAll("stock").map(x=>`<option value="${x.id}">${f(x.name)} (Qty: ${x.quantity}) - $${x.costPrice||x.unitPrice}</option>`).join("")),l}function n(){(t.laborCost||0)+(t.materialCost||0),e.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${f(t.number)} — ${f(t.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${f(t.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${f(t.technicianName||"Unassigned")}</span>
              <span class="badge ${a[t.status]||"badge-neutral"}">${f(t.status)}</span>
              <span class="badge ${o[t.priority]||"badge-neutral"}">${f(t.priority)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <!-- Moved invoice creation to Invoices tab -->
          ${je("Jobs","edit")?'<button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>':""}
          ${je("Jobs","delete")?'<button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>':""}
        </div>
      </div>
      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${i==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${i==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        <button class="tab ${i==="costs"?"active":""}" data-tab="costs">Costs</button>
        <button class="tab ${i==="quotes"?"active":""}" data-tab="quotes">Quotes</button>
        <button class="tab ${i==="forms"?"active":""}" data-tab="forms">Forms</button>
        <button class="tab ${i==="pos"?"active":""}" data-tab="pos">POs</button>
        <button class="tab ${i==="activity"?"active":""}" data-tab="activity">Activity</button>
        <button class="tab ${i==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>
        <button class="tab ${i==="invoices"?"active":""}" data-tab="invoices">Invoices</button>
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,u(),m()}function u(){var C,j,H,Y,re,J,I,A,N,S,k,P,_,ee,le,R,Z,ce,ie,V,oe,ue;const x=e.querySelector("#tab-content");if((t.laborCost||0)+(t.materialCost||0),i==="forms"){b(x);return}if(i==="overview"){let B=0;if(t.tasks&&t.tasks.length>0){let W=0,z=0;t.tasks.forEach(te=>{const K=(parseFloat(te.estimatedHours)||1)*(parseInt(te.people)||1);W+=K,z+=K*((te.progress||0)/100)}),B=W>0?Math.round(z/W*100):0}const Q=t.technicians&&t.technicians.length>0?t.technicians.map(W=>`${f(W.name)} (${W.hours}h)`).join(", "):f(t.technicianName||"Unassigned");x.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${w("Job Number",f(t.number))}
                ${w("Title",f(t.title))}
                ${w("Type",f(t.type))}
                ${w("Status",f(t.status))}
                ${w("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${B}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${B}%</span></div>`)}
                ${w("Priority",f(t.priority))}
                ${w("Customer",f(t.customerName))}
                ${w("Contact",f(t.contactName||"—"))}
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
                ${w("Technicians",Q)}
                ${w("Scheduled",t.scheduledDate?new Date(t.scheduledDate).toLocaleDateString():"—")}
                ${w("Est. Hours",t.estimatedHours||"—")}
                ${w("Site Address",f(t.siteAddress||"—"))}
                ${w("Quote Ref",t.quoteId?`<a href="#/quotes/${f(t.quoteId)}">${f(t.quoteId)}</a>`:"—")}
                ${w("Created",new Date(t.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `,(C=x.querySelector("#btn-add-schedule"))==null||C.addEventListener("click",()=>{const W=c.getAll("technicians"),z=c.getAll("schedule").filter(he=>he.jobId===s),te=document.createElement("div");function K(he,G=[],pe=[]){let be=[];return he&&he.forEach((xe,de)=>{const ke=[...G,de].join("-"),Le=[...pe,xe.name].join(" > ");be.push({path:ke,name:Le,isLeaf:!xe.subTasks||xe.subTasks.length===0}),xe.subTasks&&(be=be.concat(K(xe.subTasks,[...G,de],[...pe,xe.name])))}),be}const ne=K(t.tasks||[]);function O(he){let G="";return he.forEach((pe,be)=>{G+='<div class="sched-entry" data-index="'+be+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',G+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',G+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(be+1)+"</span>",he.length>1&&(G+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+be+'" style="padding:2px 8px">✕ Remove</button>'),G+="</div>",G+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',G+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',G+='<select class="form-select sched-task" style="width:100%">',G+='<option value="">-- Select a Task --</option>',ne.forEach(de=>{G+=`<option value="${de.path}" ${pe.taskPath===de.path?"selected":""}>${f(de.name)}</option>`}),G+="</select></div>",G+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',G+='<input type="datetime-local" class="form-input sched-start" value="'+pe.start+'"></div>',G+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',G+='<input type="datetime-local" class="form-input sched-finish" value="'+pe.finish+'"></div>',G+="</div>",G+='<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>',G+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',W.forEach(de=>{const ke=pe.techIds.includes(de.id),Le=ke?"var(--color-primary)":"var(--border-color)",Ee=ke?"var(--color-primary-light)":"transparent",De=ke?"var(--color-primary)":"var(--text-secondary)";G+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Le+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ee+";color:"+De+';transition:all 0.15s">',G+='<input type="checkbox" class="tech-check" data-tech-id="'+de.id+'" '+(ke?"checked":"")+' style="display:none">',G+='<span class="material-icons-outlined" style="font-size:14px">person</span>',G+=f(de.name),G+="</label>"}),G+="</div></div>";const xe=c.getAll("assets").filter(de=>de.category==="Business");G+='<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>',G+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">',xe.forEach(de=>{const ke=pe.assetIds&&pe.assetIds.includes(de.id),Le=ke?"var(--color-primary)":"var(--border-color)",Ee=ke?"var(--color-primary-light)":"transparent",De=ke?"var(--color-primary)":"var(--text-secondary)";G+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Le+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ee+";color:"+De+';transition:all 0.15s">',G+='<input type="checkbox" class="asset-check" data-asset-id="'+de.id+'" '+(ke?"checked":"")+' style="display:none">',G+='<span class="material-icons-outlined" style="font-size:14px">handyman</span>',G+=f(de.name),G+="</label>"}),xe.length===0&&(G+='<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>'),G+="</div></div></div>"}),G}function U(he){if(!document.getElementById("sched-modal-styles")){const pe=document.createElement("style");pe.id="sched-modal-styles",pe.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(pe)}let G="";z.length>0&&(G+='<div style="margin-bottom:16px">',G+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',z.forEach(pe=>{const be=new Date(pe.startTime||pe.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});G+='<div class="sched-summary-row" style="flex-wrap:wrap">',G+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',G+='<span style="font-weight:500">'+f(pe.technicianName)+"</span>",G+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+f(pe.taskName||"General Task")+"</span>",G+='<span style="color:var(--text-tertiary);margin-left:auto">'+be+"</span>",G+='<span style="font-weight:600;margin-left:12px">'+pe.hours+"h</span>",G+="</div>"}),G+="</div>",G+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),G+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',G+='<div id="sched-entries">'+O(he)+"</div>",G+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',G+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',te.innerHTML=G,te.querySelectorAll(".tech-check").forEach(pe=>{const be=pe.closest("label");pe.addEventListener("change",()=>{pe.checked?(be.style.borderColor="var(--color-primary)",be.style.background="var(--color-primary-light)",be.style.color="var(--color-primary)"):(be.style.borderColor="var(--border-color)",be.style.background="transparent",be.style.color="var(--text-secondary)")})}),te.querySelectorAll(".asset-check").forEach(pe=>{const be=pe.closest("label");pe.addEventListener("change",()=>{pe.checked?(be.style.borderColor="var(--color-primary)",be.style.background="var(--color-primary-light)",be.style.color="var(--color-primary)"):(be.style.borderColor="var(--border-color)",be.style.background="transparent",be.style.color="var(--text-secondary)")})}),te.querySelectorAll(".btn-remove-entry").forEach(pe=>{pe.addEventListener("click",()=>{he.splice(parseInt(pe.dataset.index),1),U(he)})}),te.querySelector("#btn-add-entry").addEventListener("click",()=>{const pe=de=>de.toString().padStart(2,"0"),be=new Date;be.setDate(be.getDate()+1);const xe=`${be.getFullYear()}-${pe(be.getMonth()+1)}-${pe(be.getDate())}`;he.push({taskPath:"",start:`${xe}T08:00`,finish:`${xe}T16:00`,techIds:[],assetIds:[]}),U(he)})}const X=he=>he.toString().padStart(2,"0"),se=new Date,fe=`${se.getFullYear()}-${X(se.getMonth()+1)}-${X(se.getDate())}`,me=t.technicianId?[t.technicianId]:[],ge=[{taskPath:"",start:`${fe}T08:00`,finish:`${fe}T16:00`,techIds:me,assetIds:[]}];U(ge);function Te(){const he=[];return te.querySelectorAll(".sched-entry").forEach((G,pe)=>{var Ee,De,Pe;const be=(Ee=G.querySelector(".sched-task"))==null?void 0:Ee.value,xe=(De=G.querySelector(".sched-start"))==null?void 0:De.value,de=(Pe=G.querySelector(".sched-finish"))==null?void 0:Pe.value,ke=[...G.querySelectorAll(".tech-check:checked")].map(ae=>ae.dataset.techId),Le=[...G.querySelectorAll(".asset-check:checked")].map(ae=>ae.dataset.assetId);he.push({taskPath:be,start:xe,finish:de,techIds:ke,assetIds:Le})}),he}we({title:`Schedule Job: ${f(t.title||t.number)}`,content:te,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:he=>he()},{label:"Save Schedule",className:"btn-primary",onClick:he=>{const G=Te();let pe=0,be=[];if(G.forEach((xe,de)=>{var Pe;if(!xe.taskPath){be.push(`Entry ${de+1}: please select a task`);return}if(!xe.start||!xe.finish){be.push(`Entry ${de+1}: missing start or finish`);return}const ke=new Date(xe.start),Le=new Date(xe.finish);if(Le<=ke){be.push(`Entry ${de+1}: finish must be after start`);return}if(xe.techIds.length===0){be.push(`Entry ${de+1}: select at least one technician`);return}const Ee=Math.round((Le-ke)/36e5*100)/100,De=((Pe=ne.find(ae=>ae.path===xe.taskPath))==null?void 0:Pe.name)||"Unknown Task";xe.techIds.forEach(ae=>{const $e=W.find(Ce=>Ce.id===ae);$e&&(c.create("schedule",{jobId:s,jobNumber:t.number,taskPath:xe.taskPath,taskName:De,technicianId:ae,technicianName:$e.name,date:xe.start.split("T")[0],startTime:xe.start,finishTime:xe.finish,hours:Ee}),pe++)}),xe.assetIds&&xe.assetIds.length>0&&xe.assetIds.forEach(ae=>{const $e=c.getById("assets",ae);$e&&c.create("assetUsage",{jobId:s,assetId:ae,assetName:$e.name,taskPath:xe.taskPath,taskName:De,startTime:xe.start,finishTime:xe.finish,hours:Ee,recoveryRate:$e.recoveryRate||0})})}),be.length){M(be[0],"error");return}if(G.length>0&&G[0].start){const de=[...new Set(G.flatMap(ke=>ke.techIds))].map(ke=>{const Le=W.find(De=>De.id===ke),Ee=G.filter(De=>De.techIds.includes(ke)).reduce((De,Pe)=>{const ae=(new Date(Pe.finish)-new Date(Pe.start))/36e5;return De+(isNaN(ae)?0:ae)},0);return{id:ke,name:(Le==null?void 0:Le.name)||"",hours:Math.round(Ee*100)/100}});c.update("jobs",s,{scheduledDate:G[0].start.split("T")[0],technicians:de,technicianName:de.map(ke=>ke.name).join(", ")})}M(`${pe} schedule ${pe===1?"entry":"entries"} saved`,"success"),he(),u()}}]})})}else if(i==="tasks"){let W=function(O,U){let X=O[U[0]];if(!X)return null;for(let se=1;se<U.length;se++)if(!X.subTasks||(X=X.subTasks[U[se]],!X))return null;return X},z=function(O){return!O.subTasks||O.subTasks.length===0?(parseFloat(O.estimatedHours)||0)*(parseInt(O.people)||1):O.subTasks.reduce((U,X)=>U+z(X),0)},te=function(O,U){if(U.length<=1)return;const X=U.slice(0,-1),se=W(O,X);if(se&&se.subTasks&&se.subTasks.length>0){let fe=0,me=0;se.subTasks.forEach(ge=>{const Te=(parseFloat(ge.estimatedHours)||1)*(parseInt(ge.people)||1);fe+=Te,me+=Te*((ge.progress||0)/100)}),se.progress=fe>0?Math.round(me/fe*100):0,se.progress===100?se.status="Completed":se.progress>0?se.status="In Progress":se.status="Not Started",te(O,X)}};var T=W,$=z,g=te;const B=JSON.parse(localStorage.getItem("currentUser")||"{}");let Q=!0;if(B.userTypeId){const O=c.getById("userTypes",B.userTypeId);if(O&&O.permissions){const U=O.permissions.find(X=>X.module==="Jobs");U&&(Q=U.edit)}}else(B.role==="customer"||B.role==="technician")&&(Q=!1);t.tasks||(t.tasks=[{id:c.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}]),t.tasks.forEach(O=>{O.subTasks||(O.subTasks=[])});let K=!0,ne=t.tasks;for(let O=0;O<r.length;O++){if(!ne||!ne[r[O]]){K=!1;break}ne=ne[r[O]].subTasks}K||(r=[]),x.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${Q?'<button class="btn btn-sm btn-secondary" id="btn-import-tasklist"><span class="material-icons-outlined" style="font-size:14px">download</span> Import</button>':""}
              ${Q?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${Q?'<button class="btn btn-sm btn-primary" id="btn-save-tasks"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const O=p.length>0?W(t.tasks,p):null,U=O?O.subTasks||[]:t.tasks,X=O?f(O.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${p.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${X}">${X}</span>
                    </div>
                    ${Q?p.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${p.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${U.map((se,fe)=>{const me=[...p,fe],ge=me.join("-")===r.join("-");return`
                        <div class="task-list-item" data-path="${me.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${ge?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${ge?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(se.name)}">${f(se.name)}</span>
                          ${se.subTasks&&se.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${me.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${me.join("-")}" ${se.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${U.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${r.length>0?(()=>{const O=r,U=W(t.tasks,O);if(!U)return"";const X=U.subTasks&&U.subTasks.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${d?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(U.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${Q?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${O.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${Q?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${O.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${f(U.name)}" ${Q?"":"disabled"} />
                  </div>
                  ${X?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${z(U)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${U.startDate?U.startDate.split("T")[0]:""}" ${Q?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${U.estimatedHours||""}" min="0" step="0.5" ${Q?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${U.people||"1"}" min="1" step="1" ${Q?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${U.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${U.progress>50?"#fff":"#000"}">${U.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${Q?"":"disabled"}>${f(U.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(U.name)}">Info Panel: ${f(U.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${Q&&O.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${O.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      ${X?"":`<button class="btn btn-sm btn-secondary btn-book-time" data-path="${O.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>`}
                      ${Q?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                      ${Q?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${O.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${f(U.name)}</div>
                  </div>
                  ${X?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${z(U)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${U.startDate?U.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${U.estimatedHours?U.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${U.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${U.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${U.progress>50?"#fff":"#000"}">${U.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${f(U.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(j=x.querySelector(".btn-view-back"))==null||j.addEventListener("click",()=>{p.pop(),u()}),x.querySelectorAll(".btn-drill-down").forEach(O=>{O.addEventListener("click",U=>{U.stopPropagation(),p=O.dataset.path.split("-").map(Number),r=[...p],u()})}),x.querySelectorAll(".task-list-checkbox").forEach(O=>{O.addEventListener("change",U=>{const X=U.target.dataset.path.split("-").map(Number),se=W(t.tasks,X);se.progress=U.target.checked?100:0,se.status=U.target.checked?"Completed":"Not Started",te(t.tasks,X),u()}),O.addEventListener("click",U=>U.stopPropagation())}),x.querySelectorAll(".task-list-item").forEach(O=>{O.addEventListener("click",U=>{if(U.target.closest(".btn-drill-down"))return;r=U.currentTarget.dataset.path.split("-").map(Number),d=!1,u()})}),(H=x.querySelector(".btn-edit-info"))==null||H.addEventListener("click",()=>{d=!0,u()}),(Y=x.querySelector(".btn-done-info"))==null||Y.addEventListener("click",()=>{d=!1,u()}),(re=x.querySelector("#btn-add-main-task"))==null||re.addEventListener("click",()=>{t.tasks||(t.tasks=[]),t.tasks.push({id:c.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),r=[t.tasks.length-1],u()}),x.querySelectorAll(".btn-add-child-task").forEach(O=>{O.addEventListener("click",U=>{const X=U.currentTarget.dataset.path.split("-").map(Number),se=W(t.tasks,X);se.subTasks||(se.subTasks=[]),se.subTasks.push({id:c.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),r=[...X,se.subTasks.length-1],u()})}),x.querySelectorAll(".detail-input").forEach(O=>{O.addEventListener("change",U=>{const X=W(t.tasks,r),se=U.target.dataset.field;se==="progress-check"?(X.progress=U.target.checked?100:0,X.status=U.target.checked?"Completed":"Not Started"):se==="progress"?(X.progress=parseInt(U.target.value),X.progress===100?X.status="Completed":X.progress===0?X.status="Not Started":X.status="In Progress"):se==="estimatedHours"?X.estimatedHours=parseFloat(U.target.value)||0:X[se]=U.target.value,te(t.tasks,r),u()})}),x.querySelectorAll(".btn-remove-task").forEach(O=>{O.addEventListener("click",U=>{const X=O.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(X.length===1)t.tasks.splice(X[0],1);else{const se=X.slice(0,-1),fe=W(t.tasks,se);fe&&fe.subTasks&&fe.subTasks.splice(X[X.length-1],1),te(t.tasks,se)}r=X.slice(0,-1),d=!1,u()}})}),(J=x.querySelector("#btn-save-tasks"))==null||J.addEventListener("click",()=>{c.update("jobs",s,{tasks:t.tasks}),M("Tasks saved","success")}),(I=x.querySelector("#btn-save-tasklist-template"))==null||I.addEventListener("click",()=>{const O=document.createElement("div");O.innerHTML=`
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
         `,we({title:"Save Tasklist as Template",content:O,actions:[{label:"Cancel",className:"btn-secondary",onClick:U=>U()},{label:"Save Template",className:"btn-primary",onClick:U=>{const X=O.querySelector("#tmpl-name").value,se=O.querySelector("#tmpl-desc").value,fe=O.querySelector("#tmpl-tags").value.split(",").map(ge=>ge.trim()).filter(Boolean);if(!X){M("Template name is required","error");return}function me(ge){return ge.map(Te=>({...Te,id:c.generateId(),status:"Not Started",progress:0,subTasks:Te.subTasks||Te.subPhases?me(Te.subTasks||Te.subPhases):[]}))}c.create("taskTemplates",{name:X,description:se,tags:fe,tasks:me(t.tasks||t.phases||[]),createdAt:new Date().toISOString()}),M("Tasklist saved as template","success"),U()}}]})}),(A=x.querySelector("#btn-import-tasklist"))==null||A.addEventListener("click",()=>{const O=c.getAll("taskTemplates"),U=c.getAll("jobs").filter(me=>me.id!==s&&(me.tasks&&me.tasks.length>0||me.phases&&me.phases.length>0));let X="templates";const se=document.createElement("div");se.innerHTML=`
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;function fe(me=""){const ge=se.querySelector("#import-content"),Te=me.toLowerCase();if(X==="templates"){const he=O.filter(G=>G.name.toLowerCase().includes(Te)||(G.description||"").toLowerCase().includes(Te)||(G.tags||[]).some(pe=>pe.toLowerCase().includes(Te)));ge.innerHTML=he.length?he.map(G=>{const pe=G.tasks||G.phases||[];return`
               <div class="import-item" data-id="${G.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${f(G.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${pe.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${f(G.description||"No description.")}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(G.tags||[]).map(be=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${f(be)}</span>`).join("")}
                 </div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${me}"</div>`}else{const he=U.filter(G=>G.number.toLowerCase().includes(Te)||G.title.toLowerCase().includes(Te)||G.customerName.toLowerCase().includes(Te));ge.innerHTML=he.length?he.map(G=>{const pe=G.tasks||G.phases||[];return`
               <div class="import-item" data-id="${G.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${f(G.number)} - ${f(G.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${f(G.customerName)} · ${pe.length} tasks</div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${me}"</div>`}ge.querySelectorAll(".import-item").forEach(he=>{he.addEventListener("click",()=>{var Le;const G=he.dataset.id,pe=he.dataset.type,be=c.getAll("taskTemplates"),xe=c.getAll("jobs"),de=pe==="template"?be.find(Ee=>String(Ee.id)===String(G)):xe.find(Ee=>String(Ee.id)===String(G));if(de&&(de.tasks||de.phases)){if(confirm(`Replace current tasklist with "${de.name||de.number}"?`)){let Ee=function(De){return De.map(Pe=>({...Pe,id:c.generateId(),status:"Not Started",progress:0,subTasks:Pe.subTasks||Pe.subPhases?Ee(Pe.subTasks||Pe.subPhases):[]}))};var ke=Ee;t.tasks=Ee(de.tasks||de.phases),r=[0],p=[],M(`Imported ${de.name||de.number}`,"success"),u(),(Le=document.querySelector(".modal-overlay"))==null||Le.remove()}}else M("Could not find source data","error")})})}fe(),se.querySelectorAll(".tab").forEach(me=>{me.addEventListener("click",()=>{se.querySelectorAll(".tab").forEach(ge=>ge.classList.remove("active")),me.classList.add("active"),X=me.dataset.tab,se.querySelector("#import-search").placeholder=X==="templates"?"Search templates...":"Search jobs...",fe(se.querySelector("#import-search").value)})}),se.querySelector("#import-search").addEventListener("input",me=>{fe(me.target.value)}),we({title:"Import Tasklist",content:se,actions:[{label:"Cancel",className:"btn-secondary",onClick:me=>me()}]})}),x.querySelectorAll(".btn-duplicate-task").forEach(O=>{O.addEventListener("click",U=>{const X=U.currentTarget.dataset.path.split("-").map(Number),se=W(t.tasks,X);function fe(ge,Te){return{...ge,id:c.generateId(),name:ge.name+(Te?" (Copy)":""),progress:0,status:"Not Started",subTasks:ge.subTasks?ge.subTasks.map(he=>fe(he,!1)):[]}}const me=fe(se,!0);if(X.length===1)t.tasks.splice(X[0]+1,0,me);else{const ge=X.slice(0,-1);W(t.tasks,ge).subTasks.splice(X[X.length-1]+1,0,me),te(t.tasks,ge)}u()})}),x.querySelectorAll(".btn-book-time").forEach(O=>{O.addEventListener("click",U=>{const X=U.currentTarget.dataset.path.split("-").map(Number),se=W(t.tasks,X),fe=JSON.parse(localStorage.getItem("currentUser")||"{}"),me=c.getAll("timesheets").filter(de=>de.jobId===s),ge=c.getAll("technicians"),Te=new Date,he=de=>de.toString().padStart(2,"0"),G=`${Te.getFullYear()}-${he(Te.getMonth()+1)}-${he(Te.getDate())}`,pe=`${G}T09:00`,be=`${G}T10:00`,xe=document.createElement("div");xe.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${me.reduce((de,ke)=>de+(ke.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${me.length?me.map(de=>`
                      <tr>
                        <td>${de.startTime?new Date(de.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(de.date).toLocaleDateString()}</td>
                        <td>${f(de.technicianName)}</td>
                        <td>${f(de.taskName||de.phaseName||"—")}</td>
                        <td style="font-weight:600">${de.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${pe}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${be}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${ge.map(de=>`<option value="${de.id}" ${de.name===fe.name?"selected":""}>${de.name}</option>`).join("")}
              </select>
            </div>
            `,we({title:"Book Time: "+f(se.name),size:"modal-70",content:xe,actions:[{label:"Cancel",className:"btn-secondary",onClick:de=>de()},{label:"Log Time",className:"btn-primary",onClick:de=>{const ke=document.getElementById("bt-start").value,Le=document.getElementById("bt-finish").value,Ee=document.getElementById("bt-tech").value,De=se.name;if(!ke||!Le||!Ee){M("Please fill all required fields","error");return}const Pe=new Date(ke),ae=new Date(Le);if(ae<=Pe){M("Finish time must be after start time","error");return}const $e=Math.round((ae-Pe)/36e5*100)/100,Ce=ge.find(Ie=>Ie.id===Ee);c.create("timesheets",{jobId:s,jobNumber:t.number,taskId:se.id,taskName:se.name,phaseId:se.id,phaseName:se.name,technicianId:Ee,technicianName:Ce.name,date:ke.split("T")[0],startTime:ke,finishTime:Le,description:De,hours:$e,status:"Pending"}),M("Time booked successfully","success"),u(),de()}}]})})})}else if(i==="costs"){let Pe=function(){const ae=(t.materials||[]).reduce((Ie,Ae)=>Ie+Ae.quantity*(Ae.unitCost||0),0),$e=parseFloat(x.querySelector("#inp-material-cost").value)||0,Ce=ae+$e;x.querySelector("#sum-mat").textContent="$"+Ce.toFixed(2),x.querySelector("#sum-total").textContent="$"+(te+Ce).toFixed(2)};var q=Pe;if(!t.materials){const $e=c.getAll("quotes").filter(Ce=>Ce.jobId===s||t.quoteId===Ce.id).find(Ce=>Ce.status==="Accepted")||c.getById("quotes",t.quoteId);$e&&$e.sections&&(t.materials=[],$e.sections.forEach(Ce=>{(Ce.lineItems||[]).forEach(Ie=>{if(Ie.type==="material"){const Ae=c.getAll("stock").find(Ke=>Ke.name===Ie.description);t.materials.push({stockId:Ae?Ae.id:null,name:Ie.description||"Unknown Material",quantity:Ie.qty||1,unitCost:Ae&&(Ae.costPrice||Ae.unitPrice)||0,fromQuote:!0})}})}),c.update("jobs",s,{materials:t.materials}))}t.materials||(t.materials=[]);const B=c.getAll("timesheets").filter(ae=>ae.jobId===s),Q=c.getAll("technicians"),W={};let z=0,te=0;B.forEach(ae=>{if(!W[ae.technicianId]){const $e=Q.find(Ce=>Ce.id===ae.technicianId);W[ae.technicianId]={id:ae.technicianId,name:ae.technicianName||($e?$e.name:"Unknown Tech"),hours:0,rate:$e&&($e.payRate||$e.hourlyRate)||45}}W[ae.technicianId].hours+=ae.hours||0});const K=Object.values(W);K.forEach(ae=>{z+=ae.hours,te+=ae.hours*ae.rate});const ne=c.getAll("assetUsage").filter(ae=>ae.jobId===s),O=c.getAll("assets");let U=0;const X=ne.map(ae=>{const $e=O.find(Ae=>Ae.id===ae.assetId),Ce=ae.recoveryRate||($e?$e.recoveryRate:0)||0,Ie=ae.hours*Ce;return U+=Ie,{...ae,rate:Ce,cost:Ie}}),se=t.materials.reduce((ae,$e)=>ae+$e.quantity*($e.unitCost||0),0),fe=parseFloat(t.additionalMaterialCost||0),me=se+fe,ge=c.getSettings(),Te=Qt(t.materials,ge),he=$t(fe,ge),G=Te+(fe>0?he-fe:0)+fe;(t.laborCost!==te||t.estimatedHours!==z||t.materialCost!==me||t.assetCost!==U)&&(t.laborCost=te,t.estimatedHours=z,t.materialCost=me,t.assetCost=U,c.update("jobs",s,{laborCost:te,estimatedHours:z,materialCost:me,assetCost:U}));const pe=ge.laborRates.find(ae=>ae.id===t.laborRateProfileId)||ge.laborRates.find(ae=>ae.isDefault),be=z*(pe?pe.rate:85),xe=pe&&pe.minCallOutFee||0,de=Math.max(be,xe),ke=de+G,Le=te+me+U,Ee=ke-Le,De=ke>0?Ee/ke*100:0;x.innerHTML=`
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
                  ${K.map(ae=>`
                    <tr>
                      <td>${f(ae.name)}</td>
                      <td style="font-weight:600">${ae.hours.toFixed(2)}</td>
                      <td>$${(ae.payRate||ae.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(ae.hours*(ae.payRate||ae.rate)).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${K.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>':""}
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
                  ${X.map(ae=>`
                    <tr>
                      <td>${f(ae.assetName)}</td>
                      <td style="font-weight:600">${ae.hours.toFixed(2)}</td>
                      <td>$${ae.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${ae.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${X.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>':""}
                </tbody>
                ${X.length>0?`
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${U.toFixed(2)}</td>
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
                  ${ge.laborRates.map(ae=>`<option value="${ae.id}" ${pe.id===ae.id?"selected":""}>${ae.name} ($${ae.rate.toFixed(2)}/hr)</option>`).join("")}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${pe.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(pe.minCallOutFee||0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${de.toFixed(2)}</span>
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
                  ${t.materials.map((ae,$e)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${f(ae.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${ae.quantity} x $${(ae.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(ae.quantity*(ae.unitCost||0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${$e}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join("")}
                  ${t.materials.length===0?'<div class="text-secondary" style="font-size:14px">No materials added.</div>':""}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${v()}
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
                  <span class="text-secondary">Logged Hours</span><span class="font-medium">${z.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(te+me).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${ke.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${Ee>=0?"var(--color-success-bg)":"var(--color-danger-bg)"}; color:${Ee>=0?"var(--color-success)":"var(--color-danger)"}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${Ee.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${De.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      `,(N=x.querySelector("#inp-labor-profile"))==null||N.addEventListener("change",ae=>{t.laborRateProfileId=ae.target.value,c.update("jobs",s,{laborRateProfileId:t.laborRateProfileId}),u()}),x.addEventListener("click",ae=>{const $e=ae.target.closest(".btn-remove-mat");if($e){const Ce=parseInt($e.dataset.index);t.materials.splice(Ce,1),u()}}),(S=x.querySelector("#btn-refresh-materials"))==null||S.addEventListener("click",()=>{const $e=c.getAll("quotes").filter(Ae=>Ae.jobId===s||t.quoteId===Ae.id).find(Ae=>Ae.status==="Accepted")||c.getById("quotes",t.quoteId);if(!$e){M("No linked accepted quote found.","error");return}const Ce=(t.materials||[]).filter(Ae=>!Ae.fromQuote),Ie=[];$e.sections.forEach(Ae=>{(Ae.lineItems||[]).forEach(Ke=>{if(Ke.type==="material"){const ot=c.getAll("stock").find(cs=>cs.name===Ke.description);Ie.push({stockId:ot?ot.id:null,name:Ke.description||"Unknown Material",quantity:Ke.qty||1,unitCost:ot&&(ot.costPrice||ot.unitPrice)||0,fromQuote:!0})}})}),t.materials=[...Ie,...Ce],c.update("jobs",s,{materials:t.materials}),M("Materials refreshed from Quote","success"),u()}),(k=x.querySelector("#inp-material-cost"))==null||k.addEventListener("input",Pe),(P=x.querySelector("#btn-add-material"))==null||P.addEventListener("click",()=>{const ae=x.querySelector("#mat-select"),$e=parseInt(x.querySelector("#mat-qty").value)||1,Ce=ae.value;if(!Ce)return;const Ie=c.getById("stock",Ce);if(Ie){if(Ie.quantity<$e){M(`Not enough stock. Available: ${Ie.quantity}`,"error");return}c.update("stock",Ce,{quantity:Ie.quantity-$e}),l=null,t.materials.push({stockId:Ie.id,name:Ie.name,quantity:$e,unitCost:Ie.costPrice||Ie.unitPrice||0,fromQuote:!1}),M(`Added ${$e}x ${Ie.name}`,"success"),u()}}),(_=x.querySelector("#btn-save-costs"))==null||_.addEventListener("click",()=>{const ae=parseFloat(x.querySelector("#inp-material-cost").value)||0,Ce=(t.materials||[]).reduce((Ie,Ae)=>Ie+Ae.quantity*(Ae.unitCost||0),0)+ae;t.materialCost=Ce,t.additionalMaterialCost=ae,c.update("jobs",s,{materials:t.materials,materialCost:Ce,additionalMaterialCost:ae}),M("Additional costs saved","success"),u()})}else if(i==="quotes"){const B=c.getAll("quotes").filter(Q=>Q.jobId===s||t.quoteId===Q.id);x.innerHTML=`
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
                ${B.length?B.map(Q=>`
                  <tr>
                    <td><a href="#/quotes/${Q.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${f(Q.number)}</a></td>
                    <td>${f(Q.title||"Untitled Quote")}</td>
                    <td><span class="badge ${Q.status==="Accepted"?"badge-success":Q.status==="Declined"?"badge-danger":Q.status==="Sent"?"badge-info":"badge-neutral"}">${f(Q.status)}</span></td>
                    <td style="font-weight:600">$${(Q.total||0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${Q.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ee=x.querySelector("#btn-new-quote"))==null||ee.addEventListener("click",()=>{const Q=c.create("quotes",{customerId:t.customerId,customerName:t.customerName,title:t.title,jobId:t.id,status:"Draft",version:1,sections:[{id:c.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});M("Draft quote created","success"),F.navigate("/quotes/"+Q.id)})}else if(i==="activity")t.activityLog||(t.activityLog=[]),t.activityLog=t.activityLog.map(B=>B.type==="note"||B.type==="attachment"?{id:B.id,type:"combined",date:B.date,content:B.type==="note"?B.content:"",files:B.type==="attachment"?[B.file]:[]}:B),x.innerHTML=`
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
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${y.length?"16px":"0"}">
              ${y.map((B,Q)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${f(B.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${Q}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join("")}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${t.activityLog.length?t.activityLog.map((B,Q)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${B.files&&B.files.length?"attachment":"chat_bubble_outline"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(B.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${f(B.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${B.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${f(B.content)}</div>`:""}
                      ${B.files&&B.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${B.files.map(W=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${W.type&&W.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${f(W.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${f(W.name)}">${f(W.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(W.size/1024).toFixed(1)} KB</div>
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
      `,setTimeout(()=>{x.querySelectorAll(".activity-log-item").forEach(B=>{const Q=B.querySelector(".activity-content-wrapper"),W=B.querySelector(".expand-overlay");Q&&Q.scrollHeight>200&&(W.style.display="flex",B.style.paddingBottom="32px",W.addEventListener("click",()=>{B.dataset.expanded==="false"?(Q.style.maxHeight=Q.scrollHeight+"px",W.style.background="transparent",W.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',B.dataset.expanded="true"):(Q.style.maxHeight="200px",W.style.background="linear-gradient(transparent, var(--content-bg))",W.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',B.dataset.expanded="false")}))})},0),x.querySelectorAll(".btn-remove-staged").forEach(B=>{B.addEventListener("click",Q=>{const W=parseInt(Q.currentTarget.dataset.idx);y.splice(W,1),u()})}),(le=x.querySelector("#btn-add-note"))==null||le.addEventListener("click",()=>{const B=x.querySelector("#new-note-input").value.trim();!B&&!y.length||(t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:B,files:[...y],date:new Date().toISOString()}),c.update("jobs",s,{activityLog:t.activityLog}),y=[],u())}),(R=x.querySelector("#upload-attachment"))==null||R.addEventListener("change",B=>{const Q=Array.from(B.target.files);if(!Q.length)return;let W=0;Q.forEach(z=>{const te=new FileReader;te.onload=K=>{y.push({name:z.name,size:z.size,type:z.type,data:K.target.result}),W++,W===Q.length&&u()},te.readAsDataURL(z)})}),x.querySelectorAll(".btn-delete-activity").forEach(B=>{B.addEventListener("click",()=>{t.activityLog=t.activityLog.filter(Q=>Q.id!==B.dataset.id),c.update("jobs",s,{activityLog:t.activityLog}),u()})});else if(i==="timesheets"){const B=c.getAll("timesheets").filter(z=>z.jobId===s),Q=B.reduce((z,te)=>z+(te.hours||0),0),W=c.getAll("technicians");x.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${Q} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
              <tbody>
                ${B.length?B.map(z=>{const te=currentUser.role==="admin"||z.technicianId===currentUser.id&&z.status!=="Approved";return`
                  <tr>
                    <td>${new Date(z.date).toLocaleDateString()}</td>
                    <td>${f(z.technicianName)}</td>
                    <td class="text-secondary">${f(z.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${z.hours}</td>
                    <td><span class="badge ${z.status==="Approved"?"badge-success":z.status==="Rejected"?"badge-danger":"badge-warning"}">${z.status}</span></td>
                    <td style="text-align:right">
                      ${te?`
                        <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${z.id}">
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
      `,x.querySelectorAll(".btn-edit-ts-job").forEach(z=>{z.addEventListener("click",()=>{const te=z.dataset.id,K=c.getById("timesheets",te);if(!K)return;const ne=document.createElement("div");ne.innerHTML=`
            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" id="edit-ts-date" value="${K.date}" />
            </div>
            <div class="form-group">
              <label class="form-label">Hours</label>
              <input type="number" class="form-input" id="edit-ts-hours" value="${K.hours}" step="0.25" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-input" id="edit-ts-desc" rows="3">${f(K.description||"")}</textarea>
            </div>
          `,we({title:"Edit Timesheet Entry",content:ne,actions:[{label:"Cancel",className:"btn-secondary",onClick:O=>O()},{label:"Save Changes",className:"btn-primary",onClick:O=>{const U=document.getElementById("edit-ts-date").value,X=parseFloat(document.getElementById("edit-ts-hours").value),se=document.getElementById("edit-ts-desc").value;if(!U||isNaN(X)){M("Please enter valid date and hours","error");return}c.update("timesheets",te,{date:U,hours:X,description:se}),M("Timesheet updated","success"),O(),u()}}]})})}),(Z=x.querySelector("#btn-log-time-tab"))==null||Z.addEventListener("click",()=>{const z=JSON.parse(localStorage.getItem("currentUser")||"{}"),te=new Date,K=U=>U.toString().padStart(2,"0"),ne=`${te.getFullYear()}-${K(te.getMonth()+1)}-${K(te.getDate())}`,O=document.createElement("div");O.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${ne}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech">
                <option value="">Select tech...</option>
                ${W.map(U=>`<option value="${U.id}" ${U.name===z.name?"selected":""}>${U.name}</option>`).join("")}
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
        `,showDrawer({title:"Log Time",content:O.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:U=>U()},{label:"Save",className:"btn-primary",onClick:U=>{const X=document.querySelector(".drawer-overlay"),se=X.querySelector("#lt-date").value,fe=X.querySelector("#lt-tech").value,me=parseFloat(X.querySelector("#lt-hours").value),ge=X.querySelector("#lt-desc").value;if(!se||!fe||isNaN(me)){M("Please fill all required fields","error");return}const Te=W.find(he=>he.id===fe);c.create("timesheets",{jobId:s,jobNumber:t.number,technicianId:fe,technicianName:Te.name,date:se,hours:me,description:ge,status:"Pending"}),M("Time logged successfully","success"),u(),U()}}]})})}else if(i==="forms")t.forms=t.forms||[],x.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${t.forms.length?t.forms.map(B=>`
                  <tr>
                    <td class="font-medium">${f(B.type)}</td>
                    <td>${new Date(B.date).toLocaleString()}</td>
                    <td>${f(B.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ce=x.querySelector("#btn-add-form"))==null||ce.addEventListener("click",()=>{const B=document.createElement("div");B.innerHTML=`
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
          `,showDrawer({title:"Complete Form",content:B.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:Q=>Q()},{label:"Submit",className:"btn-primary",onClick:Q=>{const W=document.querySelector(".drawer-overlay");t.forms.push({type:W.querySelector("#new-form-type").value,notes:W.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),c.update("jobs",s,{forms:t.forms}),M("Form submitted successfully","success"),u(),Q()}}]})});else if(i==="pos"){const B=c.getAll("purchaseOrders").filter(Q=>Q.jobId===s);x.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${B.length?B.map(Q=>`
                  <tr>
                    <td><a href="#/purchase-orders/${f(Q.id)}">${f(Q.number)}</a></td>
                    <td>${f(Q.supplierName||"—")}</td>
                    <td>${Q.issueDate?new Date(Q.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(Q.total||0).toFixed(2)}</td>
                    <td><span class="badge ${Q.status==="Received"?"badge-success":Q.status==="Draft"?"badge-neutral":Q.status==="Cancelled"?"badge-danger":"badge-primary"}">${Q.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ie=x.querySelector("#btn-raise-po"))==null||ie.addEventListener("click",()=>{c.getAll("suppliers");const Q=c.getAll("stock"),W=document.createElement("div");W.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <input type="text" class="form-input" id="po-supplier" placeholder="e.g. Reece Plumbing" />
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${Q.map(z=>`<option value="${z.id}">${z.name} - $${z.costPrice||0}</option>`).join("")}
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
        `,showDrawer({title:"Quick Purchase Order",content:W.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:z=>z()},{label:"Create PO",className:"btn-primary",onClick:z=>{const te=document.querySelector(".drawer-overlay"),K=te.querySelector("#po-supplier").value,ne=te.querySelector("#po-part").value,O=parseInt(te.querySelector("#po-qty").value)||1,U=te.querySelector("#po-date").value;if(!K||!ne){M("Supplier and Part are required","error");return}const X=Q.find(se=>se.id===ne);c.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:s,supplierName:K,issueDate:new Date().toISOString(),expectedDate:U,status:"Draft",items:[{stockId:ne,name:X.name,quantity:O,unitCost:X.costPrice||0,total:(X.costPrice||0)*O}],total:(X.costPrice||0)*O}),M("Quick PO Created","success"),u(),z()}}]})})}else if(i==="invoices"){let Q=function(z,te,K){const ne=c.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:z,jobId:s,jobNumber:t.number,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,status:"Draft",sections:te,subtotal:K,tax:K*.1,total:K*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+2592e6).toISOString()});c.update("jobs",s,{status:"Invoiced"}),M(`${z} Invoice created`,"success"),F.navigate(`/invoices/${ne.id}`)},W=function(){let z=[],te=0;if(t.quoteId){const K=c.getById("quotes",t.quoteId);K&&K.sections&&K.sections.length>0?(z=JSON.parse(JSON.stringify(K.sections)),te=K.subtotal||0):K&&K.lineItems&&(z=[{id:c.generateId(),name:"Main Phase",lineItems:JSON.parse(JSON.stringify(K.lineItems))}],te=K.subtotal||0)}if(z.length===0){const K=t.tasks||t.phases||[];if(K.length>0){z=K.map(U=>({id:c.generateId(),name:U.name,lineItems:[{description:`${U.name} - Labor & Materials`,type:"other",qty:1,rate:0,total:0}],subtotal:0}));const ne=t.laborCost||0,O=t.materialCost||0;(ne>0||O>0)&&(z[0].lineItems.push({description:"Estimated Job Labor",type:"labor",qty:1,rate:ne,total:ne}),z[0].lineItems.push({description:"Estimated Job Materials",type:"material",qty:1,rate:O,total:O}))}else{const ne=t.laborCost||0,O=t.materialCost||0;z=[{id:c.generateId(),name:"General Items",lineItems:[{description:`${t.title} - Labor`,type:"labor",qty:1,rate:ne,total:ne},{description:`${t.title} - Materials`,type:"material",qty:1,rate:O,total:O}]}]}te=z.reduce((ne,O)=>ne+O.lineItems.reduce((U,X)=>U+(X.total||0),0),0)}return{sections:z,subtotal:te}};var D=Q,E=W;const B=c.getAll("invoices").filter(z=>z.jobId===s);x.innerHTML=`
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
                ${B.length?B.map(z=>`
                  <tr>
                    <td><a href="#/invoices/${f(z.id)}">${f(z.number)}</a></td>
                    <td><span class="badge badge-neutral">${f(z.invoiceType||"Standard")}</span></td>
                    <td>${z.issueDate?z.issueDate.split("T")[0]:"—"}</td>
                    <td>${z.dueDate?z.dueDate.split("T")[0]:"—"}</td>
                    <td style="font-weight:600;">$${(z.total||0).toFixed(2)}</td>
                    <td><span class="badge ${z.status==="Paid"?"badge-success":z.status==="Draft"?"badge-neutral":z.status==="Overdue"?"badge-danger":"badge-info"}">${z.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(V=x.querySelector("#btn-create-standard-invoice"))==null||V.addEventListener("click",()=>{const{sections:z,subtotal:te}=W();Q("Standard",z,te)}),(oe=x.querySelector("#btn-create-deposit-invoice"))==null||oe.addEventListener("click",()=>{const z=[{id:c.generateId(),name:"Deposit",lineItems:[{description:`Deposit for Job ${t.number}`,type:"other",qty:1,rate:0,total:0}],subtotal:0}];Q("Deposit",z,0)}),(ue=x.querySelector("#btn-create-progress-invoice"))==null||ue.addEventListener("click",()=>{const z=document.createElement("div");z.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,we({title:"Create Progress Invoice",content:z,actions:[{label:"Cancel",className:"btn-secondary",onClick:te=>te()},{label:"Create",className:"btn-primary",onClick:te=>{const K=parseFloat(document.getElementById("progress-percent").value)||0;if(K<=0||K>100){M("Enter a valid percentage (1-100)","error");return}const{subtotal:ne}=W(),O=ne*(K/100),U=[{id:c.generateId(),name:`Progress Payment (${K}%)`,lineItems:[{description:`Progress Payment (${K}% of job)`,type:"other",qty:1,rate:O,total:O}],subtotal:O}];Q("Progress",U,O),te()}}]})})}}function m(){var x,T;e.querySelectorAll(".tab").forEach($=>{$.addEventListener("click",()=>{i=$.dataset.tab,e.querySelectorAll(".tab").forEach(g=>g.classList.remove("active")),$.classList.add("active"),u()})}),(x=e.querySelector("#btn-edit-job"))==null||x.addEventListener("click",()=>F.navigate(`/jobs/${s}/edit`)),(T=e.querySelector("#btn-delete-job"))==null||T.addEventListener("click",()=>{const $=document.createElement("div");$.innerHTML=`<p>Delete job <strong>${f(t.number)}</strong>?</p>`,we({title:"Delete Job",content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Delete",className:"btn-danger",onClick:g=>{c.delete("jobs",s),M("Job deleted","success"),g(),F.navigate("/jobs")}}]})})}n();function w(x,T){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${x}</span><span>${T}</span></div>`}function b(x){const T=c.getAll("formInstances").filter(g=>g.jobId===s),$=c.getAll("formTemplates");x.innerHTML=`
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
              ${T.map(g=>{const q=$.find(C=>C.id===g.templateId),D=g.status==="Completed",E=g.submittedBy?c.getById("people",g.submittedBy):null;return`
                  <tr>
                    <td class="font-medium">${f((q==null?void 0:q.name)||"Unknown Form")}</td>
                    <td><span class="badge ${D?"badge-success":"badge-warning"}">${g.status}</span></td>
                    <td>${E?f(`${E.firstName} ${E.lastName}`):"—"}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${g.submittedAt?new Date(g.submittedAt).toLocaleDateString():"—"}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${D?"btn-secondary":"btn-primary"} btn-sm fill-form" data-id="${g.id}">
                          <span class="material-icons-outlined" style="font-size:16px">${D?"visibility":"edit_note"}</span>
                        </button>
                        ${D?"":`<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${g.id}" style="color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              ${T.length?"":'<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,x.querySelector("#btn-attach-form").addEventListener("click",()=>h()),x.querySelectorAll(".fill-form").forEach(g=>{g.addEventListener("click",()=>L(g.dataset.id))}),x.querySelectorAll(".remove-form-instance").forEach(g=>{g.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this form from the job?")){const q=g.dataset.id,D=c.getAll("formInstances");c.save("formInstances",D.filter(E=>E.id!==q)),b(x)}})})}function h(){const x=c.getAll("formTemplates"),$=c.getAll("formInstances").filter(q=>q.jobId===s).map(q=>q.templateId),g=document.createElement("div");g.style.minWidth="450px",g.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:12px">
        ${x.map(q=>{const D=$.includes(q.id);return`
            <div class="card attach-template-item ${D?"disabled":""}" data-id="${q.id}" style="cursor:${D?"not-allowed":"pointer"}; opacity:${D?"0.6":"1"}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${f(q.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(q.sections||[]).reduce((E,C)=>E+C.fields.length,0)} fields</div>
                </div>
                ${D?'<span class="badge badge-neutral">Already Attached</span>':'<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `}).join("")}
        ${x.length?"":'<div class="text-center text-tertiary">No templates available.</div>'}
      </div>
    `,g.querySelectorAll(".attach-template-item:not(.disabled)").forEach(q=>{q.addEventListener("click",()=>{var C;const D=q.dataset.id,E=c.getAll("formInstances");E.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:s,templateId:D,responses:{},status:"Pending",createdAt:new Date().toISOString()}),c.save("formInstances",E),M("Form attached to job","success"),(C=document.querySelector(".modal-overlay"))==null||C.remove(),b(e.querySelector("#tab-content"))})}),we({title:"Attach Compliance Form",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()}]})}function L(x){const $=c.getAll("formInstances").find(E=>E.id===x),g=c.getById("formTemplates",$.templateId),q=$.status==="Completed",D=document.createElement("div");D.style.minWidth="600px",D.innerHTML=`
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${f(g.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${f(g.description||"")}</div>
      </div>
      <form id="active-job-form">
        <div style="display:flex; flex-direction:column; gap:32px">
          ${(g.sections||[]).map(E=>`
            <div class="form-section">
              <div style="background:var(--bg-color); padding:8px 16px; border-radius:6px; margin-bottom:16px; border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${f(E.title)}</h4>
              </div>
              <div style="display:flex; flex-direction:column; gap:16px; padding:0 8px">
                ${E.fields.map(C=>{const j=$.responses[C.id]||"";let H="";return C.type==="text"?H=`<input class="form-input" name="${C.id}" value="${f(j)}" ${C.required?"required":""} ${q?"disabled":""} />`:C.type==="textarea"?H=`<textarea class="form-textarea" name="${C.id}" rows="3" ${C.required?"required":""} ${q?"disabled":""}>${f(j)}</textarea>`:C.type==="checkbox"?H=`
                       <label style="display:flex; align-items:center; gap:10px; cursor:pointer">
                         <input type="checkbox" name="${C.id}" ${j?"checked":""} ${q?"disabled":""} style="width:18px; height:18px" />
                         <span style="font-size:14px">${C.label}</span>
                       </label>`:C.type==="select"?H=`
                       <select class="form-select" name="${C.id}" ${C.required?"required":""} ${q?"disabled":""}>
                         <option value="">Select option...</option>
                         ${(C.options||[]).map(Y=>`<option value="${f(Y)}" ${j===Y?"selected":""}>${f(Y)}</option>`).join("")}
                       </select>`:C.type==="date"?H=`<input type="date" class="form-input" name="${C.id}" value="${j}" ${C.required?"required":""} ${q?"disabled":""} />`:C.type==="signature"&&(H=`
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${j?`<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${f(j)}</span>`:"Digitally Signed on submission"}
                       </div>`),`
                    <div class="form-group" style="margin:0">
                      ${C.type!=="checkbox"?`<label class="form-label" style="font-weight:500">${f(C.label)} ${C.required?'<span style="color:var(--color-danger)">*</span>':""}</label>`:""}
                      ${H}
                    </div>
                  `}).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </form>
    `,we({title:q?"View Form Response":"Complete Job Form",content:D,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},q?null:{label:"Submit Form",className:"btn-primary",onClick:E=>{var I,A;const C=D.querySelector("#active-job-form");if(!C.checkValidity())return C.reportValidity();const j=new FormData(C),H={};(g.sections||[]).forEach(N=>{N.fields.forEach(S=>{var k;S.type==="checkbox"?H[S.id]=j.has(S.id):H[S.id]=j.get(S.id),S.type==="signature"&&(H[S.id]=((k=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:k.name)||"Unknown")})});const Y=c.getAll("formInstances"),re=Y.findIndex(N=>N.id===x);Y[re]={...Y[re],responses:H,status:"Completed",submittedBy:(I=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:I.id,submittedAt:new Date().toISOString()},c.save("formInstances",Y),M("Form submitted successfully","success"),E(),b(e.querySelector("#tab-content"));const J=c.getAll("activity")||[];J.push({id:Date.now(),jobId:s,type:"form_submission",text:`Form "${g.name}" submitted.`,user:(A=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:A.name,timestamp:new Date().toISOString()}),c.save("activity",J)}}].filter(Boolean)})}}const ea=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function ts(e,{id:s}){const t=s&&s!=="new",a=t?c.getById("jobs",s):{},o=c.getAll("customers"),i=c.getAll("contractors").filter(S=>S.active);let r=a.tags?[...a.tags]:[];function p(S){return o.find(k=>k.id===S)||null}function d(S,k){const P=p(S);return!P||!P.sites||P.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+P.sites.map((_,ee)=>`<option value="${ee}" data-address="${f(_.address)}" data-name="${f(_.name)}" ${k===_.name?"selected":""}>${f(_.name)} — ${f(_.address)}</option>`).join("")}function l(S,k,P){const _=p(S);return!_||!_.contacts||_.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${P}</option>`+_.contacts.map((ee,le)=>`<option value="${le}" ${k===ee.name?"selected":""}>${f(ee.name)} (${f(ee.role||"")})</option>`).join("")}function y(){return ea.map(S=>`<button type="button" class="tag-pill ${r.includes(S)?"tag-pill-active":""}" data-tag="${f(S)}">${f(S)}</button>`).join("")}const v=a.customerId||"";e.innerHTML=`
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
            <input class="form-input" name="title" value="${f(a.title||"")}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${o.map(S=>`<option value="${S.id}" ${a.customerId===S.id?"selected":""}>${f(S.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(S=>`<option ${a.type===S?"selected":""}>${S}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${v?"":"disabled"}>
              ${d(v,a.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${a.siteAddress?f(a.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${v?"":"disabled"}>
                ${l(v,a.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${v?"":"disabled"}>
                ${l(v,a.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(S=>`<option ${a.status===S?"selected":""}>${S}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(S=>`<option ${a.priority===S?"selected":""}>${S}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${i.map(S=>`<option value="${S.id}" ${a.contractorId===S.id?"selected":""}>${f(S.businessName)}</option>`).join("")}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${y()}
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
  `,e.querySelectorAll("#job-form-tabs .tab").forEach(S=>{S.addEventListener("click",k=>{e.querySelectorAll("#job-form-tabs .tab").forEach(_=>_.classList.remove("active")),k.currentTarget.classList.add("active");const P=k.currentTarget.dataset.tab;e.querySelector("#jf-tab-details").style.display=P==="details"?"block":"none",e.querySelector("#jf-tab-tasks").style.display=P==="tasks"?"block":"none",e.querySelector("#jf-tab-forms").style.display=P==="forms"?"block":"none",P==="tasks"&&re(),P==="forms"&&N()})});const n=e.querySelector("#jf-customer"),u=e.querySelector("#jf-site"),m=e.querySelector("#jf-site-hint"),w=e.querySelector("#jf-primary-contact"),b=e.querySelector("#jf-additional-contact");function h(S){const k=!S;u.innerHTML=d(S,""),u.disabled=k,w.innerHTML=l(S,"","Select primary contact..."),w.disabled=k,b.innerHTML=l(S,"","None"),b.disabled=k,m.textContent=k?"Select a customer to enable jobsite selection":"Select a jobsite above"}n.addEventListener("change",S=>h(S.target.value)),u.addEventListener("change",S=>{const k=S.target.selectedOptions[0];m.textContent=(k==null?void 0:k.dataset.address)||""}),e.querySelector("#jf-tags").addEventListener("click",S=>{const k=S.target.closest(".tag-pill");if(!k)return;const P=k.dataset.tag;r.includes(P)?(r=r.filter(_=>_!==P),k.classList.remove("tag-pill-active")):(r.push(P),k.classList.add("tag-pill-active"))});const L=e.querySelector("#job-description-editor"),x=e.querySelector("#editor-toolbar");x.addEventListener("mousedown",S=>{const k=S.target.closest("button[data-cmd]");if(!k)return;S.preventDefault();const P=k.dataset.cmd,_=k.dataset.val||null;document.execCommand(P,!1,_),L.focus()}),e.querySelector("#editor-link-btn").addEventListener("click",()=>{const S=prompt("Enter URL:","https://");S&&document.execCommand("createLink",!1,S),L.focus()}),L.addEventListener("keyup",T),L.addEventListener("mouseup",T);function T(){x.querySelectorAll("button[data-cmd]").forEach(S=>{try{S.classList.toggle("active",document.queryCommandState(S.dataset.cmd))}catch{}})}const $=e.querySelector("#is-emergency"),g=e.querySelector("#emergency-dispatch-suggestion"),q=e.querySelector("#dispatch-reason"),D=e.querySelector("#job-priority");function E(S){if(S){D.value="Urgent",g.style.display="block";const k=c.getAll("people").filter(P=>P.type==="Staff");if(k.length>0){const P=k[Math.floor(Math.random()*k.length)],_=Math.floor(Math.random()*15)+5;q.innerHTML=`Based on current GPS location, <strong>${P.firstName} ${P.lastName}</strong> is the most suitable technician (approx. ${_} mins away).`}else q.innerHTML="No internal technicians available for dispatch."}else g.style.display="none"}if($==null||$.addEventListener("change",S=>E(S.target.checked)),a.isEmergency&&E(!0),!t){const S=e.querySelector("#is-recurring"),k=e.querySelector("#recurring-options");S==null||S.addEventListener("change",P=>{k.style.display=P.target.checked?"flex":"none"})}e.querySelector("#btn-cancel").addEventListener("click",()=>F.navigate(t?`/jobs/${s}`:"/jobs"));let C=a.tasks?JSON.parse(JSON.stringify(a.tasks)):[{id:c.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subTasks:[]}];C.forEach(S=>{S.subTasks||(S.subTasks=[])});let j=[0],H=[];function Y(S,k){let P=S[k[0]];if(!P)return null;for(let _=1;_<k.length;_++)if(!P.subTasks||(P=P.subTasks[k[_]],!P))return null;return P}function re(){var R,Z,ce,ie;const S=e.querySelector("#jf-task-container");if(!S)return;let k=!0,P=C;for(let V=0;V<j.length;V++){if(!P||!P[j[V]]){k=!1;break}P=P[j[V]].subTasks}k||(j=[]);const _=H.length>0?Y(C,H):null,ee=_?_.subTasks||[]:C,le=_?f(_.name):"Main Tasks";S.innerHTML=`
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
                ${H.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${le}">${le}</span>
              </div>
              ${H.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${H.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${ee.map((V,oe)=>{const ue=[...H,oe],B=ue.join("-")===j.join("-");return`
                  <div class="task-list-item" data-path="${ue.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${B?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${B?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(V.name)}">${f(V.name)}</span>
                    ${V.subTasks&&V.subTasks.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${ue.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${ee.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${j.length>0?(()=>{const V=j,oe=Y(C,V);if(!oe)return"";const ue=oe.subTasks&&oe.subTasks.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(oe.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${V.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${V.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${V.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${f(oe.name)}" />
                </div>
                ${ue?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${oe.startDate?oe.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${oe.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${oe.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${f(oe.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(R=S.querySelector(".btn-view-back"))==null||R.addEventListener("click",()=>{H.pop(),re()}),S.querySelectorAll(".btn-drill-down").forEach(V=>{V.addEventListener("click",oe=>{oe.stopPropagation(),H=V.dataset.path.split("-").map(Number),j=[...H],re()})}),S.querySelectorAll(".task-list-item").forEach(V=>{V.addEventListener("click",()=>{j=V.dataset.path.split("-").map(Number),re()})}),(Z=S.querySelector("#btn-add-main-task"))==null||Z.addEventListener("click",()=>{C.push({id:c.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),j=[C.length-1],re()}),S.querySelectorAll(".btn-add-child-task").forEach(V=>{V.addEventListener("click",()=>{const oe=V.dataset.path.split("-").map(Number),ue=Y(C,oe);ue&&(ue.subTasks||(ue.subTasks=[]),ue.subTasks.push({id:c.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),j=[...oe,ue.subTasks.length-1],H=[...oe],re())})}),S.querySelectorAll(".btn-remove-task").forEach(V=>{V.addEventListener("click",()=>{const oe=V.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(oe.length===1)C.splice(oe[0],1),j=C.length>0?[0]:[];else{const ue=Y(C,oe.slice(0,-1));ue&&ue.subTasks&&ue.subTasks.splice(oe[oe.length-1],1),j=[...oe.slice(0,-1)]}re()}})}),S.querySelectorAll(".detail-input").forEach(V=>{V.addEventListener("input",oe=>{const ue=oe.target.dataset.field,B=oe.target.value,Q=Y(C,j);if(Q&&(ue==="estimatedHours"?Q[ue]=parseFloat(B)||0:ue==="people"?Q[ue]=parseInt(B)||1:Q[ue]=B,ue==="name")){const W=S.querySelector(`.task-list-item[data-path="${j.join("-")}"] span:first-child`);W&&(W.textContent=B,W.title=B);const z=S.querySelector("h4[title]");z&&(z.textContent="Task Settings: "+B,z.title=B)}})}),(ce=e.querySelector("#btn-save-as-template"))==null||ce.addEventListener("click",()=>{const V=document.createElement("div");V.innerHTML=`
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
      `,we({title:"Save Tasklist as Template",content:V,actions:[{label:"Cancel",className:"btn-secondary",onClick:oe=>oe()},{label:"Save Template",className:"btn-primary",onClick:oe=>{const ue=V.querySelector("#tmpl-name").value,B=V.querySelector("#tmpl-desc").value,Q=V.querySelector("#tmpl-tags").value.split(",").map(z=>z.trim()).filter(Boolean);if(!ue){M("Template name is required","error");return}function W(z){return z.map(te=>({...te,id:c.generateId(),status:"Not Started",progress:0,subTasks:te.subTasks?W(te.subTasks):[]}))}c.create("taskTemplates",{name:ue,description:B,tags:Q,tasks:W(C),createdAt:new Date().toISOString()}),M("Tasklist saved as template","success"),oe()}}]})}),(ie=e.querySelector("#btn-import-tasklist"))==null||ie.addEventListener("click",()=>{const V=c.getAll("taskTemplates"),oe=c.getAll("jobs").filter(W=>W.id!==s&&W.tasks&&W.tasks.length>0);let ue="templates";const B=document.createElement("div");B.innerHTML=`
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
      `;function Q(W=""){const z=B.querySelector("#import-content"),te=W.toLowerCase();if(ue==="templates"){const K=V.filter(ne=>ne.name.toLowerCase().includes(te)||(ne.description||"").toLowerCase().includes(te)||(ne.tags||[]).some(O=>O.toLowerCase().includes(te)));z.innerHTML=K.length?K.map(ne=>`
            <div class="import-item" data-id="${ne.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${f(ne.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(ne.tasks||ne.phases||[]).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${f(ne.description||"No description.")}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(ne.tags||[]).map(O=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${f(O)}</span>`).join("")}
              </div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${W}"</div>`}else{const K=oe.filter(ne=>ne.number.toLowerCase().includes(te)||ne.title.toLowerCase().includes(te)||ne.customerName.toLowerCase().includes(te));z.innerHTML=K.length?K.map(ne=>`
            <div class="import-item" data-id="${ne.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${f(ne.number)} - ${f(ne.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${f(ne.customerName)} · ${(ne.tasks||ne.phases||[]).length} tasks</div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${W}"</div>`}z.querySelectorAll(".import-item").forEach(K=>{K.addEventListener("click",()=>{var me;const ne=K.dataset.id,O=K.dataset.type,U=c.getAll("taskTemplates"),X=c.getAll("jobs"),se=O==="template"?U.find(ge=>String(ge.id)===String(ne)):X.find(ge=>String(ge.id)===String(ne));if(se&&(se.tasks||se.phases)){const ge=se.tasks||se.phases;if(confirm(`Replace current tasklist with "${se.name||se.number}"?`)){let Te=function(he){return he.map(G=>({...G,id:c.generateId(),status:"Not Started",progress:0,subTasks:G.subTasks||G.subPhases?Te(G.subTasks||G.subPhases):[]}))};var fe=Te;C=Te(ge),j=[0],H=[],M(`Imported ${se.name||se.number}`,"success"),re(),(me=document.querySelector(".modal-overlay"))==null||me.remove()}}else M("Could not find source data","error")})})}Q(),B.querySelectorAll(".tab").forEach(W=>{W.addEventListener("click",()=>{B.querySelectorAll(".tab").forEach(z=>z.classList.remove("active")),W.classList.add("active"),ue=W.dataset.tab,B.querySelector("#import-search").placeholder=ue==="templates"?"Search templates...":"Search jobs...",Q(B.querySelector("#import-search").value)})}),B.querySelector("#import-search").addEventListener("input",W=>{Q(W.target.value)}),we({title:"Import Tasklist",content:B,actions:[{label:"Cancel",className:"btn-secondary",onClick:W=>W()}]})})}const J=c.getAll("formTemplates"),I=t?c.getAll("formInstances").filter(S=>S.jobId===s):[];let A=t?I.map(S=>S.templateId):[];function N(){const S=e.querySelector("#jf-forms-container");S&&(S.innerHTML=`
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${J.map(k=>{const P=A.includes(k.id);return`
            <div class="card form-template-selector ${P?"active":""}" data-id="${k.id}" style="cursor:pointer; border:2px solid ${P?"var(--color-primary)":"var(--border-color)"}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${P?"var(--color-primary)":"var(--text-tertiary)"}; background:${P?"var(--color-primary)":"transparent"}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${P?'<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>':""}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${f(k.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${f(k.description||"No description.")}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(k.sections||[]).reduce((_,ee)=>_+ee.fields.length,0)} Required Fields</div>
                </div>
              </div>
            </div>
          `}).join("")}
        ${J.length?"":'<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>'}
      </div>
    `,S.querySelectorAll(".form-template-selector").forEach(k=>{k.addEventListener("click",()=>{const P=k.dataset.id;A.includes(P)?A=A.filter(_=>_!==P):A.push(P),N()})}))}e.querySelector("#btn-save").addEventListener("click",()=>{var Q,W,z,te;const S=e.querySelector("#job-form");if(!S.checkValidity()){e.querySelectorAll("#job-form-tabs .tab").forEach(K=>K.classList.remove("active")),e.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),e.querySelector("#jf-tab-details").style.display="block",e.querySelector("#jf-tab-tasks").style.display="none",e.querySelector("#jf-tab-forms").style.display="none",S.reportValidity();return}const k=Object.fromEntries(new FormData(S)),P=k.customerId,_=o.find(K=>K.id===P);k.customerName=(_==null?void 0:_.company)||"";const ee=u.selectedOptions[0];k.siteAddress=(ee==null?void 0:ee.dataset.address)||"",k.siteName=(ee==null?void 0:ee.dataset.name)||"";const le=parseInt(k.primaryContactId),R=parseInt(k.additionalContactId),Z=isNaN(le)?null:(Q=_==null?void 0:_.contacts)==null?void 0:Q[le],ce=isNaN(R)?null:(W=_==null?void 0:_.contacts)==null?void 0:W[R];k.contactName=(Z==null?void 0:Z.name)||(_?`${_.firstName} ${_.lastName}`:""),k.primaryContactName=(Z==null?void 0:Z.name)||"",k.additionalContactName=(ce==null?void 0:ce.name)||"",delete k.primaryContactId,delete k.additionalContactId,k.tags=r,k.description=L.innerHTML,k.tasks=C,k.phases=C,k.tasks.forEach(K=>{K.subTasks||(K.subTasks=[]),K.subPhases=K.subTasks}),delete k.notes,k.number=a.number||`J-${Date.now().toString().slice(-6)}`;const ie=(z=e.querySelector("#is-emergency"))==null?void 0:z.checked;if(k.isEmergency=ie,t?ie&&!a.isEmergency?k.laborCost=(a.laborCost||0)+150:!ie&&a.isEmergency&&(k.laborCost=Math.max(0,(a.laborCost||0)-150)):(k.technicians=[],k.laborCost=ie?150:0,k.materialCost=0,k.estimatedHours=0),(te=e.querySelector("#is-recurring"))!=null&&te.checked){const K=e.querySelector("#recurring-freq").value,ne=e.querySelector("#recurring-start").value,O=e.querySelector("#recurring-end").value;if(!ne||!O){M("Recurring dates required","error");return}k.recurringConfig={freq:K,start:ne,end:O}}const V=t?c.update("jobs",s,k):c.create("jobs",k),oe=V.id;let B=(c.getAll("formInstances")||[]).filter(K=>{if(K.jobId!==oe)return!0;const ne=A.includes(K.templateId),O=K.responses&&Object.keys(K.responses).length>0;return ne||O});if(A.forEach(K=>{B.find(O=>O.jobId===oe&&O.templateId===K)||B.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:oe,templateId:K,responses:{},status:"Pending",createdAt:new Date().toISOString()})}),c.save("formInstances",B),!t&&k.recurringConfig){let K=new Date(k.recurringConfig.start);const ne=new Date(k.recurringConfig.end);let O=0;for(;K<=ne&&O<50;)c.create("notifications",{type:"Recurring Job Due",jobId:oe,title:`Recurring: ${V.title||V.number}`,dueDate:K.toISOString().split("T")[0],status:"Pending",createdAt:new Date().toISOString()}),k.recurringConfig.freq==="Daily"?K.setDate(K.getDate()+1):k.recurringConfig.freq==="Weekly"?K.setDate(K.getDate()+7):k.recurringConfig.freq==="Monthly"&&K.setMonth(K.getMonth()+1),O++}M(`Job ${t?"updated":"created"} successfully`,"success"),F.navigate(`/jobs/${oe}`)})}function ta(e){var w;const s=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),t=s.userTypeId?c.getById("userTypes",s.userTypeId):null,a=t?(w=t.permissions)==null?void 0:w.find(b=>b.module==="Timesheets"):null;let o="All",i="All";const r=new Date,p=new Date;p.setDate(r.getDate()-7);const d=b=>{const h=b.getFullYear(),L=String(b.getMonth()+1).padStart(2,"0"),x=String(b.getDate()).padStart(2,"0");return`${h}-${L}-${x}`};let l=d(p),y=d(r),v=[];function n(){var H,Y,re,J,I,A,N,S,k,P,_,ee,le;const b=c.getAll("timesheets").sort((R,Z)=>new Date(Z.date)-new Date(R.date)),h=c.getAll("technicians");let L=[...b];const x=["admin","manager","office"].includes(s.role)||a&&a.view,T=a&&a.view_own;!x&&T?L=L.filter(R=>String(R.technicianId)===String(s.id)):!x&&!T&&s.role!=="admin"&&(L=[]);let $=o==="All"?[...L]:L.filter(R=>R.status===o);x&&i!=="All"&&($=$.filter(R=>String(R.technicianId)===String(i))),l&&($=$.filter(R=>(R.date?R.date.split("T")[0]:"")>=l)),y&&($=$.filter(R=>(R.date?R.date.split("T")[0]:"")<=y));const g=$.filter(R=>R.status==="Pending").reduce((R,Z)=>R+(Z.hours||0),0),q=$.map(R=>R.id),D=q.length>0&&q.every(R=>v.includes(R)),E=v.length>0,C=[];$.forEach(R=>{const ce=new Date(R.date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});let ie=C.find(V=>V.dateStr===ce);ie||(ie={dateStr:ce,items:[],total:0},C.push(ie)),ie.items.push(R),ie.total+=R.hours||0}),e.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-approved" style="margin-right:8px">
            <span class="material-icons-outlined">download</span> Export Approved
          </button>
          ${["admin","manager","office"].includes(s.role)?`
            <button class="btn btn-secondary" id="btn-log-time" style="margin-right:8px">
              <span class="material-icons-outlined">add</span> Log Time on Behalf
            </button>
          `:""}
          ${s.role==="admin"||s.role==="manager"||a&&a.approve?`
            <button class="btn btn-primary" id="btn-approve-all-pending" ${L.some(R=>R.status==="Pending")?"":"disabled"}>
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

      <div class="page-toolbar" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:16px;">
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div class="toolbar-filters" style="margin:0">
            <button class="toolbar-filter ${o==="All"?"active":""}" data-status="All">All</button>
            <button class="toolbar-filter ${o==="Pending"?"active":""}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${o==="Approved"?"active":""}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${o==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
          </div>
          
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Date Range:</label>
            <input type="date" class="form-input" id="filter-date-start" value="${l}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
            <span style="font-size:12px; color:var(--text-secondary)">to</span>
            <input type="date" class="form-input" id="filter-date-end" value="${y}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
          </div>
        </div>

        ${x?`
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Filter by Staff:</label>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-prev" title="Previous technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_left</span>
              </button>
              <select class="form-select" id="filter-tech" style="width:180px; height:32px; padding:0 8px; font-size:13px; margin:0;">
                <option value="All">All Technicians</option>
                ${h.map(R=>`<option value="${R.id}" ${i===R.id?"selected":""}>${R.name}</option>`).join("")}
              </select>
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-next" title="Next technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_right</span>
              </button>
            </div>
          </div>
        `:""}
      </div>

      <div id="bulk-actions-bar" style="display:${E?"flex":"none"}; align-items:center; justify-content:space-between; background:var(--color-primary-light); border:1px solid var(--color-primary); padding:10px 16px; border-radius:var(--border-radius); margin-bottom:12px; transition: all 0.2s ease;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:600; color:var(--color-primary); font-size:14px;"><span id="selected-count">${v.length}</span> items selected</span>
          <button class="btn btn-ghost btn-sm" id="btn-bulk-deselect" style="color:var(--color-primary); padding:2px 8px; font-weight:600;">Deselect All</button>
        </div>
        <div style="display:flex; gap:8px;">
          ${s.role==="admin"||s.role==="manager"||a&&a.approve?`
            <button class="btn btn-sm btn-success" id="btn-bulk-approve" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:var(--color-success); border-color:var(--color-success); background:rgba(46, 204, 113, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">done</span> Approve Selected
            </button>
            <button class="btn btn-sm btn-danger" id="btn-bulk-reject" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:var(--color-danger); border-color:var(--color-danger); background:rgba(231, 76, 60, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">close</span> Reject Selected
            </button>
          `:""}
          <button class="btn btn-sm btn-secondary" id="btn-bulk-export" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px;">
            <span class="material-icons-outlined" style="font-size:16px">download</span> Export Selected
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${D?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
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
              ${C.length===0?'<tr><td colspan="8" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>':C.map(R=>`
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="4" style="color:var(--text-primary)">${R.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${R.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${R.items.map(Z=>{const ce=String(Z.technicianId)===String(s.id),ie=a?a.edit===!0:s.role==="technician"&&ce,V=["admin","manager","office"].includes(s.role)||ie&&Z.status!=="Approved",oe=v.includes(Z.id);return`
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${Z.id}" ${oe?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
                    <td class="text-secondary" style="font-size:12px">${new Date(Z.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${f(Z.technicianName)}</span></td>
                    <td><a href="#/jobs/${Z.jobId}" class="cell-link">${f(Z.jobNumber||Z.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:300px;display:inline-block">${f(Z.description||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${Z.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${Z.status==="Approved"?"badge-success":Z.status==="Rejected"?"badge-danger":"badge-warning"}">
                        ${f(Z.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      ${V?`
                        <div style="display:flex; justify-content:flex-end; gap:4px;">
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${Z.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:18px">edit</span>
                          </button>
                          ${["admin","manager"].includes(s.role)&&Z.status==="Pending"?`
                            <button class="btn btn-ghost btn-sm btn-icon btn-approve-single" data-id="${Z.id}" title="Approve entry" style="color:var(--color-success)">
                              <span class="material-icons-outlined" style="font-size:18px">check</span>
                            </button>
                            <button class="btn btn-ghost btn-sm btn-icon btn-reject-single" data-id="${Z.id}" title="Reject entry" style="color:var(--color-danger)">
                              <span class="material-icons-outlined" style="font-size:18px">close</span>
                            </button>
                          `:""}
                        </div>
                      `:""}
                    </td>
                  </tr>
                `}).join("")}
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,e.querySelectorAll(".toolbar-filter").forEach(R=>{R.addEventListener("click",()=>{o=R.dataset.status,n()})}),(H=e.querySelector("#filter-tech"))==null||H.addEventListener("change",R=>{i=R.target.value,n()});const j=["All",...h.map(R=>String(R.id))];(Y=e.querySelector("#btn-tech-prev"))==null||Y.addEventListener("click",()=>{const R=j.indexOf(String(i));if(R!==-1){const Z=(R-1+j.length)%j.length;i=j[Z],n()}}),(re=e.querySelector("#btn-tech-next"))==null||re.addEventListener("click",()=>{const R=j.indexOf(String(i));if(R!==-1){const Z=(R+1)%j.length;i=j[Z],n()}}),(J=e.querySelector("#filter-date-start"))==null||J.addEventListener("change",R=>{l=R.target.value,n()}),(I=e.querySelector("#filter-date-end"))==null||I.addEventListener("change",R=>{y=R.target.value,n()}),(A=e.querySelector("#th-select-all"))==null||A.addEventListener("change",R=>{R.target.checked?q.forEach(Z=>{v.includes(Z)||v.push(Z)}):v=v.filter(Z=>!q.includes(Z)),n()}),e.querySelectorAll(".row-checkbox").forEach(R=>{R.addEventListener("change",Z=>{const ce=R.dataset.id;Z.target.checked?v.includes(ce)||v.push(ce):v=v.filter(ie=>ie!==ce),n()})}),(N=e.querySelector("#btn-bulk-deselect"))==null||N.addEventListener("click",()=>{v=[],n()}),(S=e.querySelector("#btn-bulk-approve"))==null||S.addEventListener("click",()=>{v.length!==0&&(v.forEach(R=>{c.update("timesheets",R,{status:"Approved"})}),M(`Approved ${v.length} timesheets successfully`,"success"),v=[],n())}),(k=e.querySelector("#btn-bulk-reject"))==null||k.addEventListener("click",()=>{v.length!==0&&(v.forEach(R=>{c.update("timesheets",R,{status:"Rejected"})}),M(`Rejected ${v.length} timesheets`,"error"),v=[],n())}),(P=e.querySelector("#btn-bulk-export"))==null||P.addEventListener("click",()=>{if(v.length===0)return;const Z=c.getAll("timesheets").filter(W=>v.includes(W.id));if(Z.length===0){M("No entries found to export","error");return}const ie=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description","Status"].join(",")];Z.forEach(W=>{const z=W.startTime?new Date(W.startTime).toLocaleString():"",te=W.finishTime?new Date(W.finishTime).toLocaleString():"",K=[W.date||"",`"${(W.technicianName||"").replace(/"/g,'""')}"`,`"${(W.jobNumber||"").replace(/"/g,'""')}"`,`"${(W.taskName||"").replace(/"/g,'""')}"`,`"${z}"`,`"${te}"`,W.hours||0,`"${(W.description||"").replace(/"/g,'""')}"`,W.status||""];ie.push(K.join(","))});const V=ie.join(`
`),oe=new Blob([V],{type:"text/csv;charset=utf-8;"}),ue=URL.createObjectURL(oe),B=document.createElement("a");B.setAttribute("href",ue);const Q=new Date().toISOString().split("T")[0];B.setAttribute("download",`FieldForge_Selected_Timesheets_${Q}.csv`),B.style.visibility="hidden",document.body.appendChild(B),B.click(),document.body.removeChild(B),M(`Exported ${Z.length} selected timesheets to CSV!`,"success"),v=[],n()}),(_=e.querySelector("#btn-approve-all-pending"))==null||_.addEventListener("click",()=>{const R=L.filter(Z=>Z.status==="Pending");R.forEach(Z=>c.update("timesheets",Z.id,{status:"Approved"})),M(`Approved ${R.length} pending timesheets`,"success"),n()}),e.querySelectorAll(".btn-approve-single").forEach(R=>{R.addEventListener("click",()=>{c.update("timesheets",R.dataset.id,{status:"Approved"}),M("Timesheet entry approved","success"),n()})}),e.querySelectorAll(".btn-reject-single").forEach(R=>{R.addEventListener("click",()=>{c.update("timesheets",R.dataset.id,{status:"Rejected"}),M("Timesheet entry rejected","error"),n()})}),e.querySelectorAll(".btn-edit-timesheet").forEach(R=>{R.addEventListener("click",()=>{u(R.dataset.id)})}),(ee=e.querySelector("#btn-export-approved"))==null||ee.addEventListener("click",()=>{const R=c.getAll("timesheets"),Z=["admin","manager","office"].includes(s.role);let ce=R.filter(z=>z.status==="Approved");if(l&&(ce=ce.filter(z=>z.date>=l)),y&&(ce=ce.filter(z=>z.date<=y)),Z)i&&i!=="All"&&(ce=ce.filter(z=>z.technicianId===i));else{const te=c.getAll("technicians").find(ne=>ne.name===s.name),K=te?te.id:null;ce=ce.filter(ne=>ne.technicianId===K||ne.technicianName===s.name)}if(ce.length===0){M("No approved timesheets found to export","error");return}const V=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description"].join(",")];ce.forEach(z=>{const te=z.startTime?new Date(z.startTime).toLocaleString():"",K=z.finishTime?new Date(z.finishTime).toLocaleString():"",ne=[z.date||"",`"${(z.technicianName||"").replace(/"/g,'""')}"`,`"${(z.jobNumber||"").replace(/"/g,'""')}"`,`"${(z.taskName||"").replace(/"/g,'""')}"`,`"${te}"`,`"${K}"`,z.hours||0,`"${(z.description||"").replace(/"/g,'""')}"`];V.push(ne.join(","))});const oe=V.join(`
`),ue=new Blob([oe],{type:"text/csv;charset=utf-8;"}),B=URL.createObjectURL(ue),Q=document.createElement("a");Q.setAttribute("href",B);const W=new Date().toISOString().split("T")[0];Q.setAttribute("download",`FieldForge_Approved_Timesheets_${W}.csv`),Q.style.visibility="hidden",document.body.appendChild(Q),Q.click(),document.body.removeChild(Q),M(`Exported ${ce.length} approved timesheets to CSV!`,"success")}),(le=e.querySelector("#btn-log-time"))==null||le.addEventListener("click",()=>{m()})}function u(b){const h=c.getById("timesheets",b);if(!h)return;const L={};function x(I,A=[],N=[]){I&&I.forEach((S,k)=>{const P=[...A,k].join("-"),_=[...N,S.name].join(" > ");L[P]=_,S.subTasks&&x(S.subTasks,[...A,k],[...N,S.name])})}function T(I,A=[]){return!I||I.length===0?"":I.map((N,S)=>{const k=[...A,S],P=k.join("-"),_=N.subTasks&&N.subTasks.length>0;return`
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${_?"parent-node":"leaf-node"}" data-path="${P}" data-name="${f(N.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${_?`
                  <span class="material-icons-outlined tree-node-toggle" data-path="${P}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                `:`
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${_?"600":"400"}">${f(N.name)}</span>
              </div>
              ${_?`
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${N.subTasks.length} subtasks</span>
              `:""}
            </div>
            ${_?`
              <div class="tree-node-children" id="children-${P}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${T(N.subTasks,k)}
              </div>
            `:""}
          </div>
        `}).join("")}const $=h.startTime||`${h.date}T09:00`,g=h.finishTime||`${h.date}T10:00`,q=c.getAll("technicians"),D=c.getAll("jobs").filter(I=>I.status!=="Completed"&&I.status!=="Invoiced"),E=document.createElement("div");E.innerHTML=`
      <style>
        .tree-node-row {
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: var(--border-radius-sm);
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .tree-node-row.parent-node {
          cursor: pointer;
          color: var(--text-primary);
        }
        .tree-node-row.parent-node:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .tree-node-row.leaf-node {
          cursor: pointer;
          color: var(--color-primary);
        }
        .tree-node-row.leaf-node:hover {
          background: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
        }
        .tree-node-toggle {
          cursor: pointer;
          user-select: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .tree-node-toggle:hover {
          background: rgba(0,0,0,0.05);
        }
        .tree-node-toggle.expanded {
          transform: rotate(90deg);
        }
      </style>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Start Time *</label>
          <input type="datetime-local" class="form-input" id="lt-start" value="${$}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Finish Time *</label>
          <input type="datetime-local" class="form-input" id="lt-finish" value="${g}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${q.map(I=>`<option value="${I.id}" ${h.technicianId===I.id?"selected":""}>${I.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${D.map(I=>`<option value="${I.id}" ${h.jobId===I.id?"selected":""}>${I.number} - ${f(I.customerName)} (${f(I.title)})</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Task *</label>
        <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
          <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center;">
            <span>Select task...</span>
            <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>
          </button>
          <div class="tree-select-dropdown" id="lt-task-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); max-height:280px; overflow-y:auto; padding:8px;">
            <!-- Hierarchical task tree populated here -->
          </div>
          <input type="hidden" id="lt-task" value="${h.taskId||h.taskPath||""}" />
          <input type="hidden" id="lt-task-name" value="${f(h.taskName||"")}" />
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="lt-desc" value="${f(h.description||"")}" placeholder="Brief description..." style="width:100%" />
      </div>
    `;const C=E.querySelector("#lt-job"),j=E.querySelector("#lt-task-trigger"),H=E.querySelector("#lt-task-dropdown"),Y=E.querySelector("#lt-task"),re=E.querySelector("#lt-task-name");j.addEventListener("click",I=>{I.stopPropagation();const A=H.style.display==="block";H.style.display=A?"none":"block"}),document.addEventListener("click",I=>{E.contains(I.target)||(H.style.display="none")});function J(I,A){if(!I){j.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',j.disabled=!0,H.style.display="none",Y.value="",re.value="";return}const N=D.find(S=>S.id===I);if(!N||!N.tasks||N.tasks.length===0){j.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',j.disabled=!0,H.style.display="none",Y.value="",re.value="";return}for(const S in L)delete L[S];x(N.tasks),H.innerHTML=T(N.tasks),j.disabled=!1,A&&L[A]?(j.innerHTML=`<span>${f(L[A])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,Y.value=A,re.value=L[A]):(j.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',Y.value="",re.value=""),H.querySelectorAll(".tree-node-toggle").forEach(S=>{S.addEventListener("click",k=>{k.stopPropagation();const P=S.dataset.path,_=H.querySelector(`#children-${P}`);if(_){const ee=_.style.display==="none";_.style.display=ee?"block":"none",S.classList.toggle("expanded",ee)}})}),H.querySelectorAll(".tree-node-row").forEach(S=>{S.addEventListener("click",k=>{if(k.target.classList.contains("tree-node-toggle"))return;const P=S.dataset.path,_=P.split("-").map(Number);function ee(Z,ce){let ie=Z[ce[0]];for(let V=1;V<ce.length;V++){if(!ie||!ie.subTasks)return!1;ie=ie.subTasks[ce[V]]}return ie&&ie.subTasks&&ie.subTasks.length>0}if(ee(N.tasks||[],_)){const Z=H.querySelector(`#children-${P}`),ce=H.querySelector(`.tree-node-toggle[data-path="${P}"]`);if(Z){const ie=Z.style.display==="none";Z.style.display=ie?"block":"none",ce&&ce.classList.toggle("expanded",ie)}return}const R=L[P]||S.dataset.name;Y.value=P,re.value=R,j.innerHTML=`<span>${f(R)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,H.style.display="none"})})}J(h.jobId,h.taskId||h.taskPath),C.addEventListener("change",I=>{J(I.target.value,null)}),we({title:"Edit Timesheet Entry",content:E,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Save Changes",className:"btn-primary",onClick:I=>{const A=document.getElementById("lt-start").value,N=document.getElementById("lt-finish").value,S=document.getElementById("lt-tech").value,k=document.getElementById("lt-job").value,P=document.getElementById("lt-task").value,_=document.getElementById("lt-task-name").value,ee=document.getElementById("lt-desc").value;if(!A||!N||!S||!k||!P){M("Please fill all required fields, including the task","error");return}const le=new Date(A),R=new Date(N);if(R<=le){M("Finish time must be after start time","error");return}const Z=Math.round((R-le)/36e5*100)/100,ce=q.find(V=>V.id===S),ie=D.find(V=>V.id===k);c.update("timesheets",h.id,{jobId:ie.id,jobNumber:ie.number,taskId:P,taskPath:P,taskName:_,technicianId:S,technicianName:ce.name,date:A.split("T")[0],startTime:A,finishTime:N,hours:Z,description:ee||_}),M("Timesheet updated successfully","success"),I(),n()}}]})}function m(){const b={};function h(I,A=[],N=[]){I&&I.forEach((S,k)=>{const P=[...A,k].join("-"),_=[...N,S.name].join(" > ");b[P]=_,S.subTasks&&h(S.subTasks,[...A,k],[...N,S.name])})}function L(I,A=[]){return!I||I.length===0?"":I.map((N,S)=>{const k=[...A,S],P=k.join("-"),_=N.subTasks&&N.subTasks.length>0;return`
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${_?"parent-node":"leaf-node"}" data-path="${P}" data-name="${f(N.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${_?`
                  <span class="material-icons-outlined tree-node-toggle" data-path="${P}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                `:`
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${_?"600":"400"}">${f(N.name)}</span>
              </div>
              ${_?`
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${N.subTasks.length} subtasks</span>
              `:""}
            </div>
            ${_?`
              <div class="tree-node-children" id="children-${P}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${L(N.subTasks,k)}
              </div>
            `:""}
          </div>
        `}).join("")}const x=new Date,T=I=>I.toString().padStart(2,"0"),$=`${x.getFullYear()}-${T(x.getMonth()+1)}-${T(x.getDate())}`,g=`${$}T09:00`,q=`${$}T10:00`,D=c.getAll("technicians"),E=c.getAll("jobs").filter(I=>I.status!=="Completed"&&I.status!=="Invoiced"),C=document.createElement("div");C.innerHTML=`
      <style>
        .tree-node-row {
          display: flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: var(--border-radius-sm);
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .tree-node-row.parent-node {
          cursor: pointer;
          color: var(--text-primary);
        }
        .tree-node-row.parent-node:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .tree-node-row.leaf-node {
          cursor: pointer;
          color: var(--color-primary);
        }
        .tree-node-row.leaf-node:hover {
          background: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
        }
        .tree-node-toggle {
          cursor: pointer;
          user-select: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .tree-node-toggle:hover {
          background: rgba(0,0,0,0.05);
        }
        .tree-node-toggle.expanded {
          transform: rotate(90deg);
        }
      </style>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Start Time *</label>
          <input type="datetime-local" class="form-input" id="lt-start" value="${g}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Finish Time *</label>
          <input type="datetime-local" class="form-input" id="lt-finish" value="${q}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${D.map(I=>`<option value="${I.id}" ${i===I.id?"selected":""}>${I.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${E.map(I=>`<option value="${I.id}">${I.number} - ${f(I.customerName)} (${f(I.title)})</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Task *</label>
        <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
          <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center;" disabled>
            <span>Select a job first...</span>
            <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>
          </button>
          <div class="tree-select-dropdown" id="lt-task-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); max-height:280px; overflow-y:auto; padding:8px;">
            <!-- Hierarchical task tree populated here -->
          </div>
          <input type="hidden" id="lt-task" value="" />
          <input type="hidden" id="lt-task-name" value="" />
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="lt-desc" placeholder="Brief description..." style="width:100%" />
      </div>
    `;const j=C.querySelector("#lt-job"),H=C.querySelector("#lt-task-trigger"),Y=C.querySelector("#lt-task-dropdown"),re=C.querySelector("#lt-task"),J=C.querySelector("#lt-task-name");H.addEventListener("click",I=>{I.stopPropagation();const A=Y.style.display==="block";Y.style.display=A?"none":"block"}),document.addEventListener("click",I=>{C.contains(I.target)||(Y.style.display="none")}),j.addEventListener("change",I=>{const A=I.target.value;if(!A){H.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',H.disabled=!0,Y.style.display="none",re.value="",J.value="";return}const N=E.find(S=>S.id===A);if(!N||!N.tasks||N.tasks.length===0){H.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',H.disabled=!0,Y.style.display="none",re.value="",J.value="";return}for(const S in b)delete b[S];h(N.tasks),Y.innerHTML=L(N.tasks),H.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',H.disabled=!1,Y.querySelectorAll(".tree-node-toggle").forEach(S=>{S.addEventListener("click",k=>{k.stopPropagation();const P=S.dataset.path,_=Y.querySelector(`#children-${P}`);if(_){const ee=_.style.display==="none";_.style.display=ee?"block":"none",S.classList.toggle("expanded",ee)}})}),Y.querySelectorAll(".tree-node-row").forEach(S=>{S.addEventListener("click",k=>{if(k.target.classList.contains("tree-node-toggle"))return;const P=S.dataset.path,_=P.split("-").map(Number),ee=E.find(ce=>ce.id===A);function le(ce,ie){let V=ce[ie[0]];for(let oe=1;oe<ie.length;oe++){if(!V||!V.subTasks)return!1;V=V.subTasks[ie[oe]]}return V&&V.subTasks&&V.subTasks.length>0}if(le(ee.tasks||[],_)){const ce=Y.querySelector(`#children-${P}`),ie=Y.querySelector(`.tree-node-toggle[data-path="${P}"]`);if(ce){const V=ce.style.display==="none";ce.style.display=V?"block":"none",ie&&ie.classList.toggle("expanded",V)}return}const Z=b[P]||S.dataset.name;re.value=P,J.value=Z,H.innerHTML=`<span>${f(Z)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,Y.style.display="none"})})}),we({title:"Log Time on Behalf of Staff",content:C,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Log Time",className:"btn-primary",onClick:I=>{const A=document.getElementById("lt-start").value,N=document.getElementById("lt-finish").value,S=document.getElementById("lt-tech").value,k=document.getElementById("lt-job").value,P=document.getElementById("lt-task").value,_=document.getElementById("lt-task-name").value,ee=document.getElementById("lt-desc").value;if(!A||!N||!S||!k||!P){M("Please fill all required fields, including the task","error");return}const le=new Date(A),R=new Date(N);if(R<=le){M("Finish time must be after start time","error");return}const Z=Math.round((R-le)/36e5*100)/100,ce=D.find(V=>V.id===S),ie=E.find(V=>V.id===k);c.create("timesheets",{jobId:ie.id,jobNumber:ie.number,taskId:P,taskName:_,technicianId:S,technicianName:ce.name,date:A.split("T")[0],startTime:A,finishTime:N,hours:Z,description:ee||_,status:"Pending"}),M("Time logged successfully on behalf of staff","success"),I(),n()}}]})}n()}function sa(e){const s=c.getAll("technicians"),t=JSON.parse(localStorage.getItem("currentUser")||"{}"),a=t.role==="technician";let o="week",i="schedule",r=new Date;const p=Array.from({length:24},(J,I)=>I);let d=null,l=null,y=new Set(a?[t.id]:s.map(J=>J.id)),v=null,n=0,u=0;const m=32,w=m/4;function b(J){return Math.round(J*4)/4}function h(J){const I=Math.floor(J),A=Math.round((J-I)*60);return`${I.toString().padStart(2,"0")}:${A.toString().padStart(2,"0")}`}function L(){const J=document.getElementById("calendar-scroll");J&&(n=J.scrollTop,u=J.scrollLeft)}function x(){const J=document.getElementById("calendar-scroll");J&&(J.scrollTop=n,J.scrollLeft=u)}function T(){v&&(v.remove(),v=null)}document.addEventListener("click",T);function $(){const J=new Date(r);return o==="day"?[new Date(r)]:(J.setDate(J.getDate()-J.getDay()+1),Array.from({length:5},(I,A)=>{const N=new Date(J);return N.setDate(N.getDate()+A),N}))}function g(){const J=c.getAll("jobs"),I=c.getAll("schedule"),A=[],N=$();I.forEach(k=>{const P=J.find(ee=>ee.id===k.jobId);if(!P||P.status==="Completed"||P.status==="Invoiced")return;let _=null;if(k.date)_=new Date(k.date+"T12:00:00");else if(k.startTime)_=new Date(k.startTime);else if(k.dayOffset!==void 0){const ee=N[0];ee&&(_=new Date(ee),_.setDate(_.getDate()+k.dayOffset))}_&&N.forEach((ee,le)=>{if(_.toDateString()===ee.toDateString()){let R=8,Z=10;if(k.startTime&&k.finishTime){const ce=new Date(k.startTime),ie=new Date(k.finishTime);R=ce.getHours()+ce.getMinutes()/60,Z=ie.getHours()+ie.getMinutes()/60}else k.startHour!==void 0&&k.endHour!==void 0&&(R=k.startHour,Z=k.endHour);A.push({id:k.id,type:"schedule",jobId:P.id,jobNumber:P.number,customerName:P.customerName,title:P.title,technicianId:k.technicianId,dayIdx:le,startHour:R,endHour:Z,status:P.status,priority:P.priority})}})});const S=new Set(I.map(k=>k.jobId));return J.filter(k=>k.scheduledDate&&!S.has(k.id)&&k.status!=="Completed"&&k.status!=="Invoiced").forEach(k=>{const P=new Date(k.scheduledDate);N.forEach((_,ee)=>{if(P.toDateString()===_.toDateString()){const le=k.startHour!==void 0?k.startHour:7+Math.abs(q(k.id))%6;if(k.technicians&&k.technicians.length>0)k.technicians.forEach(R=>{const Z=R.hours||2;A.push({id:`legacy-${k.id}-${R.id}`,type:"legacy",jobId:k.id,jobNumber:k.number,customerName:k.customerName,title:k.title,technicianId:R.id,dayIdx:ee,startHour:le,endHour:le+Z,status:k.status,priority:k.priority})});else if(k.technicianId){const R=k.estimatedHours||2;A.push({id:`legacy-${k.id}`,type:"legacy",jobId:k.id,jobNumber:k.number,customerName:k.customerName,title:k.title,technicianId:k.technicianId,dayIdx:ee,startHour:le,endHour:le+R,status:k.status,priority:k.priority})}}})}),A}function q(J){let I=0;for(let A=0;A<J.length;A++)I=(I<<5)-I+J.charCodeAt(A),I|=0;return I}function D(){L();const J=$(),I=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],A=["January","February","March","April","May","June","July","August","September","October","November","December"];if(i==="activity"){re();return}const N=g(),S=s.filter(k=>y.has(k.id));e.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${A[r.getMonth()]} ${r.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${a?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${t.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${i==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${i==="activity"?"active":""}" data-cal="activity">Activities</button>
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
            ${y.size!==1?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${S.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${S.map(k=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${k.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${k.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${J.map((k,P)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${k.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${I[k.getDay()]}, ${k.getDate()} ${A[k.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${S.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${p.map(ee=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${ee.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${S.map(ee=>{const le=N.filter(R=>R.technicianId===ee.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${ee.id}" data-day="${P}" data-date="${J[P].getFullYear()}-${(J[P].getMonth()+1).toString().padStart(2,"0")}-${J[P].getDate().toString().padStart(2,"0")}">
                          ${p.map(R=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${R}"></div>`).join("")}
                          ${C(le,P,ee.color)}
                        </div>
                      `}).join("")}
                  </div>
                `).join("")}
            `:`
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${J.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${J.map(k=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${k.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${I[k.getDay()]} ${k.getDate()} ${A[k.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${J.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${p.map(k=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${k.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${J.map((k,P)=>{const _=s.find(le=>le.id===[...y][0]),ee=N.filter(le=>le.technicianId===_.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${_.id}" data-day="${P}" data-date="${J[P].getFullYear()}-${(J[P].getMonth()+1).toString().padStart(2,"0")}-${J[P].getDate().toString().padStart(2,"0")}">
                      ${p.map(le=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${le}"></div>`).join("")}
                      ${C(ee,P,_.color)}
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
                ${s.map(k=>`
                  <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                    <input type="checkbox" class="tech-visibility-checkbox" value="${k.id}" ${y.has(k.id)?"checked":""}>
                    <div style="width:10px; height:10px; border-radius:50%; background:${k.color};"></div>
                    <span style="color:var(--text-primary); font-weight:500;">${k.name}</span>
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
                ${E().map(k=>`
                  <div class="unscheduled-job" draggable="true" data-job-id="${k.id}" data-job-number="${k.number}" data-customer="${k.customerName}" data-title="${k.title}" data-hours="${k.estimatedHours||2}" data-priority="${k.priority}" style="padding:10px; background:var(--content-bg); border:1px solid var(--border-color); border-radius:4px; cursor:grab; transition:all 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span class="font-medium" style="font-size:var(--font-size-sm)">${k.number}</span>
                      <span class="badge ${k.priority==="High"||k.priority==="Urgent"?"badge-danger":"badge-neutral"}" style="font-size:9px">${k.priority}</span>
                    </div>
                    <div class="text-secondary" style="font-size:var(--font-size-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${k.customerName}</div>
                  </div>
                `).join("")||'<span class="text-secondary" style="font-size:var(--font-size-sm);">All jobs are scheduled</span>'}
              </div>
            </div>
          </div>
          `}

        </div>
      </div>
    `,j(),H(J),Y(),x()}function E(){return c.getAll("jobs").filter(I=>(!I.scheduledDate||!I.technicianId)&&I.status!=="Completed"&&I.status!=="Invoiced")}function C(J,I,A){const N={Urgent:"#EF4444",High:"#F59E0B"};return J.filter(S=>S.dayIdx===I).map(S=>{const k=S.startHour*m,P=Math.max((S.endHour-S.startHour)*m-2,w),_=N[S.priority]||A,ee=`${h(S.startHour)} — ${h(S.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${S.jobId}"
            data-schedule-id="${S.id}"
            data-block-type="${S.type}"
            data-start="${S.startHour}"
            data-end="${S.endHour}"
            style="
              top:${k}px;
              height:${P}px;
              background:${A}12;
              border-color:${_};
              color:${A};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${S.jobNumber}</div>
            ${P>20?`<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${S.customerName}</div>`:""}
            ${P>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${ee}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${S.jobId}" data-schedule-id="${S.id}" data-block-type="${S.type}" data-start="${S.startHour}" data-end="${S.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function j(){var J,I,A;(J=e.querySelector("#btn-prev"))==null||J.addEventListener("click",()=>{r.setDate(r.getDate()-(o==="week"?7:1)),D()}),(I=e.querySelector("#btn-next"))==null||I.addEventListener("click",()=>{r.setDate(r.getDate()+(o==="week"?7:1)),D()}),(A=e.querySelector("#btn-today"))==null||A.addEventListener("click",()=>{r=new Date,D()}),e.querySelectorAll("[data-view]").forEach(N=>{N.addEventListener("click",()=>{o=N.dataset.view,D()})}),e.querySelectorAll("[data-cal]").forEach(N=>{N.addEventListener("click",()=>{i=N.dataset.cal,D()})}),e.querySelectorAll(".tech-visibility-checkbox").forEach(N=>{N.addEventListener("change",S=>{S.target.checked?y.add(S.target.value):y.delete(S.target.value),D()})}),e.querySelectorAll(".schedule-block").forEach(N=>{N.addEventListener("click",S=>{if(S.defaultPrevented)return;if(N.dataset.resized==="true"){N.dataset.resized="false";return}const k=N.dataset.blockJobId,P=c.getById("jobs",k);P&&Ue({title:`Job Quick View: ${P.number}`,content:`
            <div style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label class="form-label">Title</label>
                <div class="font-medium" style="font-size:16px">${P.title||"Untitled"}</div>
              </div>
              <div>
                <label class="form-label">Customer</label>
                <div>${P.customerName||"N/A"}</div>
              </div>
              <div>
                <label class="form-label">Site Address</label>
                <div>${P.siteAddress||"No address provided"}</div>
              </div>
              <div>
                <label class="form-label">Priority</label>
                <div><span class="badge ${P.priority==="Urgent"||P.priority==="High"?"badge-danger":"badge-neutral"}">${P.priority||"Normal"}</span></div>
              </div>
              <div>
                <label class="form-label">Notes</label>
                <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${P.notes||"No notes available"}</div>
              </div>
            </div>
          `,actions:[{label:"Close",className:"btn-secondary",onClick:_=>_()},{label:"Open Full Job",className:"btn-primary",onClick:_=>{_(),F.navigate(`/jobs/${k}`)}}],width:450})}),N.addEventListener("contextmenu",S=>{S.preventDefault(),T();const k=N.dataset.blockJobId;v=document.createElement("div"),v.className="dropdown-menu",v.style.position="fixed",v.style.top=`${S.clientY}px`,v.style.left=`${S.clientX}px`,v.style.zIndex=1e3,v.style.background="var(--card-bg)",v.style.boxShadow="var(--shadow-md)",v.style.border="1px solid var(--border-color)",v.style.borderRadius="var(--border-radius)",v.style.padding="4px 0",v.style.minWidth="140px",v.innerHTML=`
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `,document.body.appendChild(v),v.querySelector("#ctx-view").addEventListener("click",()=>{T(),F.navigate(`/jobs/${k}`)}),v.querySelector("#ctx-unschedule").addEventListener("click",()=>{T(),jobs.find(_=>_.id===k)&&(c.update("jobs",k,{scheduledDate:null}),M("Job unscheduled","success"),D())})})})}function H(J){const I=document.getElementById("calendar-scroll");I&&(I.addEventListener("dragover",A=>{if(!d)return;const N=I.getBoundingClientRect(),S=60,k=15;A.clientY-N.top<S?I.scrollTop-=k:N.bottom-A.clientY<S&&(I.scrollTop+=k)}),I.addEventListener("wheel",A=>{d&&(I.scrollTop+=A.deltaY)},{passive:!0})),e.querySelectorAll(".unscheduled-job").forEach(A=>{A.addEventListener("dragstart",N=>{const S=A.getBoundingClientRect();d={type:"unscheduled",jobId:A.dataset.jobId,jobNumber:A.dataset.jobNumber,customerName:A.dataset.customer,title:A.dataset.title,hours:parseInt(A.dataset.hours)||2,offsetY:N.clientY-S.top},N.dataTransfer.effectAllowed="move",A.style.opacity="0.5"}),A.addEventListener("dragend",()=>{A.style.opacity="1",d=null,document.querySelectorAll(".schedule-drag-preview").forEach(N=>N.remove())})}),e.querySelectorAll(".schedule-block[draggable]").forEach(A=>{A.addEventListener("dragstart",N=>{N.stopPropagation();const S=A.getBoundingClientRect();d={type:"existing",blockType:A.dataset.blockType,scheduleId:A.dataset.scheduleId,jobId:A.dataset.blockJobId,startHour:parseFloat(A.dataset.start),endHour:parseFloat(A.dataset.end),offsetY:N.clientY-S.top},N.dataTransfer.effectAllowed="move",A.style.opacity="0.4"}),A.addEventListener("dragend",()=>{A.style.opacity="1",d=null,document.querySelectorAll(".schedule-drag-preview").forEach(N=>N.remove())})}),e.querySelectorAll(".schedule-day-col").forEach(A=>{A.addEventListener("dragover",N=>{if(N.preventDefault(),N.dataTransfer.dropEffect="move",A.style.background="rgba(27, 109, 224, 0.05)",!d)return;const S=A.getBoundingClientRect(),k=d.offsetY||0,_=(N.clientY-k-S.top)/m,ee=Math.min(23.75,Math.max(0,b(_)));let le=A.querySelector(".schedule-drag-preview");le||(le=document.createElement("div"),le.className="schedule-drag-preview",le.style.position="absolute",le.style.left="3px",le.style.right="3px",le.style.background="rgba(27, 109, 224, 0.15)",le.style.border="2px dashed var(--color-primary)",le.style.borderRadius="4px",le.style.pointerEvents="none",le.style.zIndex="10",A.appendChild(le));const R=d.type==="existing"?d.endHour-d.startHour:d.hours||2,Z=ee*m,ce=Math.max(R*m-2,w);le.style.top=Z+"px",le.style.height=ce+"px"}),A.addEventListener("dragleave",N=>{if(!A.contains(N.relatedTarget)){A.style.background="";const S=A.querySelector(".schedule-drag-preview");S&&S.remove()}}),A.addEventListener("drop",N=>{const S=c.getAll("jobs");N.preventDefault(),A.style.background="";const k=A.querySelector(".schedule-drag-preview");if(k&&k.remove(),!d)return;const P=A.dataset.tech,_=parseInt(A.dataset.day),ee=A.dataset.date?new Date(A.dataset.date+"T12:00:00"):J[_],le=A.getBoundingClientRect(),R=d.offsetY||0,ce=(N.clientY-R-le.top)/m,ie=Math.min(23.75,Math.max(0,b(ce))),V=s.find(ue=>ue.id===P),oe=S.find(ue=>ue.id===d.jobId);if(oe){const ue=d.type==="existing"?d.endHour-d.startHour:d.hours||oe.estimatedHours||2,B=ie+ue;if(g().some(fe=>fe.technicianId===P&&fe.dayIdx===_&&(d.scheduleId?fe.id!==d.scheduleId:fe.jobId!==oe.id)&&Math.max(fe.startHour,ie)<Math.min(fe.endHour,B))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){d=null;return}const z=fe=>fe.toString().padStart(2,"0"),te=`${ee.getFullYear()}-${z(ee.getMonth()+1)}-${z(ee.getDate())}`,K=Math.floor(ie),ne=Math.round((ie-K)*60),O=Math.floor(B),U=Math.round((B-O)*60),X=`${te}T${z(K)}:${z(ne)}`,se=`${te}T${z(O)}:${z(U)}`;d.type==="existing"&&d.blockType==="schedule"?(c.update("schedule",d.scheduleId,{technicianId:P,technicianName:(V==null?void 0:V.name)||"",date:te,startTime:X,finishTime:se,hours:ue}),M(`Moved ${oe.number} for ${V==null?void 0:V.name} to ${te}`,"success")):(c.create("schedule",{jobId:oe.id,jobNumber:oe.number,technicianId:P,technicianName:(V==null?void 0:V.name)||"",date:te,startTime:X,finishTime:se,hours:ue}),c.update("jobs",oe.id,{scheduledDate:te,startHour:ie,technicianId:P,technicianName:(V==null?void 0:V.name)||"",status:oe.status==="Pending"?"Scheduled":oe.status}),M(`Assigned ${oe.number} to ${V==null?void 0:V.name}`,"success"))}d=null,D()})})}function Y(){e.querySelectorAll(".schedule-resize-handle").forEach(J=>{J.addEventListener("mousedown",I=>{I.preventDefault(),I.stopPropagation();const A=J.closest(".schedule-block"),N=A.closest(".schedule-day-col"),S=parseFloat(J.dataset.start),k=parseFloat(J.dataset.end);N.getBoundingClientRect(),l={blockType:J.dataset.blockType,scheduleId:J.dataset.scheduleId,jobId:J.dataset.blockJobId,block:A,col:N,startHour:S,endHour:k},A.dataset.resized="false",A.style.opacity="0.85",A.style.userSelect="none",document.body.style.cursor="ns-resize";function P(ee){if(!l)return;const le=l.col.getBoundingClientRect(),Z=(ee.clientY-le.top)/m,ce=b(Z),ie=l.startHour+.25,V=Math.max(ce,ie);if(V!==l.endHour){l.endHour=V,l.block.dataset.resized="true";const oe=Math.max((V-l.startHour)*m-2,w);l.block.style.height=oe+"px";const ue=l.block.querySelector(".schedule-block-time");ue&&(ue.textContent=`${h(l.startHour)} — ${h(V)}`)}}function _(){var ce;if(document.removeEventListener("mousemove",P),document.removeEventListener("mouseup",_),document.body.style.cursor="",!l)return;const{jobId:ee,startHour:le,endHour:R}=l,Z=R-le;if(l.block.style.opacity="",l.block.style.userSelect="",Math.abs(R-k)>=.25)if(l.blockType==="schedule"){const ie=c.getById("schedule",l.scheduleId);if(ie){const V=ie.date||((ce=ie.startTime)==null?void 0:ce.split("T")[0])||new Date().toISOString().split("T")[0],oe=z=>z.toString().padStart(2,"0"),ue=Math.floor(le),B=Math.round((le-ue)*60),Q=Math.floor(R),W=Math.round((R-Q)*60);c.update("schedule",l.scheduleId,{startTime:`${V}T${oe(ue)}:${oe(B)}`,finishTime:`${V}T${oe(Q)}:${oe(W)}`,hours:Z}),M(`Time updated to ${h(le)} — ${h(R)}`,"success")}}else{const ie=c.getAll("jobs").find(V=>V.id===ee);if(ie){let V=ie.technicians||[];V.length>0&&(V=V.map(oe=>({...oe,hours:Z}))),c.update("jobs",ee,{startHour:le,estimatedHours:parseFloat(Z.toFixed(4)),technicians:V.length>0?V:ie.technicians}),M("Job time updated","success")}}l=null}document.addEventListener("mousemove",P),document.addEventListener("mouseup",_)})})}function re(){var S;const J=$(),I=["January","February","March","April","May","June","July","August","September","October","November","December"],A=JSON.parse(localStorage.getItem("currentUser")||"{}"),N=c.getAll("activities").filter(k=>k.assignedToId===A.id);e.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${I[r.getMonth()]} ${r.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
             <!-- Spacer -->
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${i==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${i==="activity"?"active":""}" data-cal="activity">Activities</button>
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
          ${J.map(k=>{const P=k.toISOString().split("T")[0],_=N.filter(ee=>ee.date===P);return`
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">${k.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}</h4>
                ${_.length===0?'<p style="color:var(--text-tertiary); font-size: 13px; margin: 0;">No activities.</p>':`
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${_.map(ee=>`
                      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                          <strong style="color:var(--text-primary);">${f(ee.title)}</strong>
                          <span style="font-size:12px; color:var(--text-secondary);">${ee.time?f(ee.time):""}</span>
                        </div>
                        ${ee.linkedTo?`<div style="font-size:12px; color:var(--text-secondary); margin-bottom:5px;">Linked to: ${f(ee.linkedTo)}</div>`:""}
                        ${ee.notes?`<div style="font-size:13px;">${f(ee.notes)}</div>`:""}
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>
            `}).join("")}
        </div>
      </div>
    `,j(),(S=e.querySelector("#btn-new-activity"))==null||S.addEventListener("click",()=>{const k=prompt("Activity Title:");if(!k)return;const P=prompt("Date (YYYY-MM-DD):",new Date().toISOString().split("T")[0]);if(!P)return;const _=prompt("Time (e.g. 10:00 AM):",""),ee=prompt("Linked To (Job/Customer Name):",""),le=prompt("Notes:","");c.create("activities",{title:k,date:P,time:_,linkedTo:ee,notes:le,assignedToId:A.id}),M("Activity added","success"),D()})}D()}function Ze(e){var v;const s=c.getAll("stock");e.innerHTML=`
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
  `;const t=e.querySelector("#location-filter"),a=[...new Set(s.map(n=>n.location||"Unassigned"))].sort(),o=a.filter(n=>n.toLowerCase().includes("warehouse")||n==="Main"),i=a.filter(n=>n.toLowerCase().includes("vehicle")||n.toLowerCase().includes("van")||n.toLowerCase().includes("truck")||n.toLowerCase().includes("van stock")),r=a.filter(n=>!o.includes(n)&&!i.includes(n));if(o.length>0){const n=document.createElement("optgroup");n.label="Warehouses",o.forEach(u=>{const m=new Option(u,u);n.appendChild(m)}),t.appendChild(n)}if(i.length>0){const n=document.createElement("optgroup");n.label="Vehicles / Vans",i.forEach(u=>{const m=new Option(u,u);n.appendChild(m)}),t.appendChild(n)}if(r.length>0){const n=document.createElement("optgroup");n.label="Other",r.forEach(u=>{const m=new Option(u,u);n.appendChild(m)}),t.appendChild(n)}let p={category:"all",location:"all",search:""};function d(){const n=p.search.toLowerCase(),u=s.filter(m=>{const w=p.category==="all"||m.category===p.category,b=p.location==="all"||m.location===p.location,h=!n||m.name.toLowerCase().includes(n)||m.sku.toLowerCase().includes(n)||m.category.toLowerCase().includes(n)||m.location&&m.location.toLowerCase().includes(n);return w&&b&&h});y.updateData(u)}const y=Re({columns:[{key:"name",label:"Item Name",render:n=>`<span class="cell-link font-medium">${f(n.name)}</span>`},{key:"sku",label:"SKU",render:n=>`<span class="text-secondary" style="font-family:monospace">${f(n.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:n=>`<span class="badge badge-neutral">${f(n.category)}</span>`,width:"110px"},{key:"quantity",label:"Qty",render:n=>{const u=n.quantity<=n.reorderLevel;return`<span style="font-weight:600;color:${u?"var(--color-danger)":"var(--text-primary)"}">${n.quantity}</span>${u?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:n=>n.quantity,width:"100px"},{key:"unitPrice",label:"Unit Price",render:n=>`$${n.unitPrice.toFixed(2)}`,getValue:n=>n.unitPrice,width:"100px"},{key:"location",label:"Location",render:n=>{var m,w;return`<div style="display:flex; align-items:center; gap:4px">
        <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary)">${((m=n.location)==null?void 0:m.toLowerCase().includes("vehicle"))||((w=n.location)==null?void 0:w.toLowerCase().includes("van"))?"local_shipping":"warehouse"}</span>
        <span class="text-secondary">${f(n.location)}</span>
      </div>`},width:"160px"},{key:"supplier",label:"Supplier",render:n=>`<span class="text-secondary">${f(n.supplier)}</span>`}],data:s,onRowClick:n=>F.navigate(`/stock/${n}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:n=>{Je({container:e,selectedIds:n,onClear:()=>y.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:u=>{const m=[...new Set(c.getAll("stock").map(b=>b.category))],w=document.createElement("div");w.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${m.map(b=>`<option value="${f(b)}">${f(b)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,w.querySelector("#bulk-category").addEventListener("change",b=>{w.querySelector("#new-cat-field").style.display=b.target.value==="NEW"?"block":"none"}),we({title:`Update ${u.length} Items`,content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{let h=w.querySelector("#bulk-category").value;h==="NEW"&&(h=w.querySelector("#bulk-new-category").value.trim()),h&&(u.forEach(L=>c.update("stock",L,{category:h})),y.clearSelection(),Ze(e),M(`Updated ${u.length} items to category: ${h}`,"success"),b())}}]})}},{label:"Adjust Price",icon:"payments",onClick:u=>{const m=document.createElement("div");m.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,we({title:`Adjust Price for ${u.length} Items`,content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:w=>w()},{label:"Apply",className:"btn-primary",onClick:w=>{const b=parseFloat(m.querySelector("#bulk-price-adjust").value);if(isNaN(b))return;const h=1+b/100;u.forEach(L=>{const x=c.getById("stock",L);x&&c.update("stock",L,{unitPrice:x.unitPrice*h})}),y.clearSelection(),Ze(e),M(`Adjusted prices for ${u.length} items by ${b}%`,"success"),w()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:u=>{we({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${u.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{u.forEach(w=>c.delete("stock",w)),y.clearSelection(),Ze(e),M(`Deleted ${u.length} stock items`,"success"),m()}}]})}}]})}});e.querySelector("#stock-table-container").appendChild(y),e.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(u=>u.classList.remove("active")),n.classList.add("active"),p.category=n.dataset.filter,d()})}),e.querySelector("#location-filter").addEventListener("change",n=>{p.location=n.target.value,d()}),e.querySelector("#stock-search").addEventListener("input",n=>{p.search=n.target.value,d()}),e.querySelector("#btn-new-stock").addEventListener("click",()=>{const n=c.getAll("technicians"),u=document.createElement("div");u.innerHTML=`
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
              ${n.map(m=>`<option value="Vehicle - ${f(m.name)}">Vehicle - ${f(m.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Cost Price ($) *</label>
        <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
      </div>
    `,Ue({title:"New Stock Item",content:u.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create",className:"btn-primary",onClick:m=>{const w=document.querySelector(".drawer-overlay"),b=w.querySelector("#new-stock-name").value.trim(),h=w.querySelector("#new-stock-category").value.trim()||"Uncategorized",L=w.querySelector("#new-stock-location").value,x=parseFloat(w.querySelector("#new-stock-cost").value);if(!b||isNaN(x)){M("Please fill all required fields correctly","error");return}c.create("stock",{name:b,sku:"SKU-"+Date.now().toString().slice(-6),category:h,quantity:0,unitPrice:x*1.5,costPrice:x,location:L,supplier:"Unknown"}),M("Stock item created","success"),Ze(e),m()}}]})}),(v=e.querySelector("#btn-transfer-stock"))==null||v.addEventListener("click",()=>{const n=c.getAll("stock"),u=c.getAll("technicians");if(n.length===0){M("No stock items available to transfer","error");return}const m=document.createElement("div");m.innerHTML=`
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${n.map(w=>`<option value="${f(w.id)}">${f(w.name)} (Qty: ${w.quantity}) - ${f(w.location)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select location...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              ${u.map(w=>`<option value="Vehicle - ${f(w.name)}">Vehicle - ${f(w.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" />
          </div>
        </div>
      `,Ue({title:"Transfer Stock",content:m.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:w=>w()},{label:"Transfer",className:"btn-primary",onClick:w=>{const b=document.querySelector(".drawer-overlay"),h=b.querySelector("#transfer-item").value,L=b.querySelector("#transfer-to").value,x=parseInt(b.querySelector("#transfer-qty").value)||0;if(!h||!L||x<=0){M("Please fill all fields correctly","error");return}const T=c.getById("stock",h);if(T.quantity<x){M("Insufficient quantity available","error");return}if(T.location===L){M("Cannot transfer to the same location","error");return}c.update("stock",T.id,{quantity:T.quantity-x});const $=n.find(g=>g.sku===T.sku&&g.location===L);if($)c.update("stock",$.id,{quantity:$.quantity+x});else{const g={...T,id:void 0,quantity:x,location:L};c.create("stock",g)}M("Stock transferred successfully","success"),Ze(e),w()}}]})})}function aa(e,{id:s}){const t=c.getById("stock",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}Ye(t.name);const a=t.quantity<=t.reorderLevel,o=t.unitPrice>0?((t.unitPrice-t.costPrice)/t.unitPrice*100).toFixed(1):0;e.innerHTML=`
    ${at({title:t.name,icon:"inventory_2",iconBgColor:a?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:a?"var(--color-danger)":"var(--color-success)",metaHtml:`
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
            ${Oe("Name",t.name)}
            ${Oe("SKU",t.sku)}
            ${Oe("Category",t.category)}
            ${Oe("Unit",t.unit)}
            ${Oe("Supplier",t.supplier)}
            ${Oe("Location",t.location)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Pricing</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Oe("Cost Price",`$${t.costPrice.toFixed(2)}`)}
            ${Oe("Sell Price",`$${t.unitPrice.toFixed(2)}`)}
            ${Oe("Margin",`${o}%`)}
            ${Oe("Total Value",`$${(t.quantity*t.unitPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit-stock").addEventListener("click",()=>F.navigate(`/stock/${s}/edit`)),e.querySelector("#btn-delete-stock").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`<p>Delete <strong>${f(t.name)}</strong>?</p>`,we({title:"Delete Stock Item",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Delete",className:"btn-danger",onClick:r=>{c.delete("stock",s),M("Item deleted","success"),r(),F.navigate("/stock")}}]})})}function Oe(e,s){return`<div style="display:flex;gap:8px"><span style="width:100px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function ss(e,{id:s}){const t=s&&s!=="new",a=t?c.getById("stock",s):{},o=c.getAll("assets");e.innerHTML=`
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
                ${["Electrical","Plumbing","HVAC","Fire Safety","Security","General"].map(i=>`<option ${a.category===i?"selected":""}>${i}</option>`).join("")}
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
                ${["Warehouse A","Warehouse B"].map(i=>`<option ${a.location===i?"selected":""}>${i}</option>`).join("")}
              </optgroup>
              <optgroup label="Vehicles">
                ${c.getAll("technicians").map(i=>{const r=`Vehicle - ${i.name}`;return`<option value="${r}" ${a.location===r?"selected":""}>${r}</option>`}).join("")}
              </optgroup>
              <optgroup label="Assets">
                ${o.map(i=>`<option value="${i.name}" ${a.location===i.name?"selected":""}>${i.name}</option>`).join("")}
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>F.navigate(t?`/stock/${s}`:"/stock")),e.querySelector("#btn-save").addEventListener("click",()=>{const i=e.querySelector("#stock-form");if(!i.checkValidity()){i.reportValidity();return}const r=Object.fromEntries(new FormData(i));if(r.quantity=parseInt(r.quantity)||0,r.costPrice=parseFloat(r.costPrice)||0,r.unitPrice=parseFloat(r.unitPrice)||0,r.reorderLevel=parseInt(r.reorderLevel)||10,t)c.update("stock",s,r),M("Item updated","success"),Ft(r),F.navigate(`/stock/${s}`);else{r.sku=r.sku||`SKU-${Date.now().toString().slice(-4)}`;const p=c.create("stock",r);M("Item created","success"),Ft(r),F.navigate(`/stock/${p.id}`)}})}function Ft(e){if(e.quantity<=e.reorderLevel){const s=JSON.parse(localStorage.getItem("currentUser")||"{}");let t=!1;if(s.role==="admin")t=!0;else if(s.userTypeId){const a=c.getById("userTypes",s.userTypeId);if(a&&a.permissions){const o=a.permissions.find(i=>i.module==="Stock");o&&(t=o.edit||o.create)}}t&&(ve(async()=>{const{showToast:a}=await Promise.resolve().then(()=>qe);return{showToast:a}},void 0).then(({showToast:a})=>{a(`Auto-Reorder Alert: ${e.name} is at or below its reorder level (${e.quantity} left).`,"warning")}),c.create("notifications",{title:"Stock Auto-Reorder",message:`${e.name} (SKU: ${e.sku}) has reached its reorder level. Current quantity: ${e.quantity}. Please reorder from ${e.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function vt(e){const s=c.getAll("invoices");e.innerHTML=`
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
  `;let t=[...s];const a={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},i=Re({columns:[{key:"number",label:"Invoice #",render:d=>`<span class="cell-link font-medium">${f(d.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:d=>d.jobNumber?`<span class="text-secondary">${f(d.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:d=>`<span class="badge ${a[d.status]||"badge-neutral"}">${f(d.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:d=>`<span class="font-semibold">$${(d.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:d=>d.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:d=>d.issueDate?new Date(d.issueDate).toLocaleDateString():"—",getValue:d=>d.issueDate?new Date(d.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:d=>d.dueDate?new Date(d.dueDate).toLocaleDateString():"—",getValue:d=>d.dueDate?new Date(d.dueDate).getTime():0,width:"100px"}],data:t,onRowClick:d=>F.navigate(`/invoices/${d}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:d=>{Je({container:e,selectedIds:d,onClear:()=>i.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:l=>{l.forEach(y=>c.update("invoices",y,{status:"Paid",datePaid:new Date().toISOString()})),i.clearSelection(),vt(e),ve(async()=>{const{showToast:y}=await Promise.resolve().then(()=>qe);return{showToast:y}},void 0).then(({showToast:y})=>y(`Marked ${l.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:l=>{const y=document.createElement("div");y.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>Me);return{showModal:v}},void 0).then(({showModal:v})=>{v({title:`Update ${l.length} Invoices`,content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Apply",className:"btn-primary",onClick:n=>{const u=y.querySelector("#bulk-status").value;l.forEach(m=>c.update("invoices",m,{status:u})),i.clearSelection(),vt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${l.length} invoices to ${u}`,"success")),n()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:l=>{ve(async()=>{const{showToast:y}=await Promise.resolve().then(()=>qe);return{showToast:y}},void 0).then(({showToast:y})=>y(`Sending reminders for ${l.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{ve(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Me);return{showModal:y}},void 0).then(({showModal:y})=>{const v=document.createElement("div");v.innerHTML=`<p>Are you sure you want to delete ${l.length} invoices? This action cannot be undone.</p>`,y({title:"Confirm Bulk Delete",content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{l.forEach(u=>c.delete("invoices",u)),i.clearSelection(),vt(e),ve(async()=>{const{showToast:u}=await Promise.resolve().then(()=>qe);return{showToast:u}},void 0).then(({showToast:u})=>u(`Deleted ${l.length} invoices`,"success")),n()}}]})})}}]})}});e.querySelector("#invoices-table-container").appendChild(i),e.querySelector("#btn-new-invoice").addEventListener("click",()=>F.navigate("/invoices/new"));const r=e.querySelector("#btn-export-accounting");function p(d){d.some(l=>l.status==="Paid")?r.style.display="inline-flex":r.style.display="none"}p(t),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(y=>y.classList.remove("active")),d.classList.add("active");const l=d.dataset.filter;t=l==="all"?[...s]:s.filter(y=>y.status===l),i.updateData(t),p(t)})}),r.addEventListener("click",()=>{const d=t.filter(n=>n.status==="Paid");if(d.length===0)return;let l="data:text/csv;charset=utf-8,";l+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,d.forEach(n=>{const u=[n.number,`"${n.customerName.replace(/"/g,'""')}"`,n.email||"",n.issueDate?n.issueDate.split("T")[0]:"",n.dueDate?n.dueDate.split("T")[0]:"",(n.total||0).toFixed(2),(n.tax||0).toFixed(2),"200"].join(",");l+=u+`
`});const y=encodeURI(l),v=document.createElement("a");v.setAttribute("href",y),v.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(v),v.click(),document.body.removeChild(v),ve(async()=>{const{showToast:n}=await Promise.resolve().then(()=>qe);return{showToast:n}},void 0).then(({showToast:n})=>{n(`Exported ${d.length} paid invoices`,"success")})}),e.querySelector("#invoices-search").addEventListener("input",d=>{const l=d.target.value.toLowerCase();t=s.filter(y=>y.number.toLowerCase().includes(l)||y.customerName.toLowerCase().includes(l)||(y.jobNumber||"").toLowerCase().includes(l)),i.updateData(t),p(t)})}function as(e,{id:s}){const t=s==="new";let a=t?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",sections:[{id:c.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:c.getById("invoices",s);if(!a){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}a.lineItems&&!a.sections&&(a.sections=[{id:c.generateId(),name:"Main Phase",lineItems:[...a.lineItems]}],delete a.lineItems),t||Ye(a.number);const o=c.getAll("customers"),i=c.getAll("stock"),r=c.getSettings(),p={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function d(){e.innerHTML=`
      ${at({title:`
          ${t?"New Invoice":a.number}
          ${a.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':a.invoiceType&&a.invoiceType!=="Standard"?`<span class="badge badge-primary">${a.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${a.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${a.customerName}</span>`:""}
          ${a.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${a.jobNumber}</span>`:""}
          <span class="badge ${p[a.status]||"badge-neutral"}">${a.status}</span>
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
                ${o.map(u=>`<option value="${u.id}" ${a.customerId===u.id?"selected":""}>${u.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${r.laborRates.map(u=>`<option value="${u.id}" ${a.laborProfileId===u.id?"selected":""}>${u.name} ($${u.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(u=>`<option ${a.invoiceType===u?"selected":""}>${u}</option>`).join("")}
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
                ${["Draft","Sent","Paid","Overdue","Void"].map(u=>`<option ${a.status===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${i.map(u=>`<option value="${u.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(a.sections||[]).map((u,m)=>l(u,m)).join("")}
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
    `,n()}function l(u,m){return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${m}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${u.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(u.subtotal||0).toFixed(2)}</span>
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${m}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${m}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(u.lineItems||[]).map((w,b)=>y(w,m,b)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function y(u,m,w){return`
      <tr data-sidx="${m}" data-index="${w}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${u.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${u.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${u.type==="material"?"selected":""}>Material</option>
          <option value="other" ${u.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${u.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${u.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(u.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${m}" data-index="${w}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function v(){a.subtotal=0,a.totalInternalCost=0;let u=0;c.getSettings().laborRates.find(w=>w.id===a.laborProfileId),(a.sections||[]).forEach(w=>{w.subtotal=0,(w.lineItems||[]).forEach(b=>{b.total=(b.qty||0)*(b.rate||0),b.type==="labor"&&(u+=b.total),b.internalCost||(b.type==="labor"?b.internalCost=45:b.internalCost=b.rate*.7),a.totalInternalCost+=(b.qty||0)*(b.internalCost||0),w.subtotal+=b.total}),a.subtotal+=w.subtotal}),a.invoiceType==="CreditNote"?a.subtotal=-Math.abs(a.subtotal):a.subtotal=Math.abs(a.subtotal),a.tax=a.subtotal*.1,a.total=a.subtotal+a.tax,d()}function n(){var m,w,b,h,L,x,T,$;(m=e.querySelector("#btn-preview-pdf"))==null||m.addEventListener("click",()=>{Zt({type:"invoice",data:a})});const u=e.querySelector(".dropdown > .btn");u&&(u.addEventListener("click",g=>{g.stopPropagation();const q=u.nextElementSibling;q.style.display=q.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const g=e.querySelector(".dropdown-menu");g&&(g.style.display="none")})),(w=e.querySelector("#inv-labor-profile"))==null||w.addEventListener("change",g=>{a.laborProfileId=g.target.value;const q=r.laborRates.find(D=>D.id===a.laborProfileId);q&&(a.sections.forEach(D=>{D.lineItems.forEach(E=>{E.type==="labor"&&(E.rate=q.rate)})}),v())}),(b=e.querySelector("#btn-add-section"))==null||b.addEventListener("click",()=>{a.sections.push({id:c.generateId(),name:"New Phase",lineItems:[]}),v()}),e.querySelectorAll(".section-name-input").forEach((g,q)=>{g.addEventListener("change",()=>{a.sections[q].name=g.value})}),e.querySelectorAll(".btn-add-line").forEach(g=>{g.addEventListener("click",()=>{const q=parseInt(g.dataset.sidx);a.sections[q].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),d()})}),e.querySelectorAll(".btn-remove-section").forEach(g=>{g.addEventListener("click",()=>{const q=parseInt(g.dataset.sidx);confirm("Remove this entire phase?")&&(a.sections.splice(q,1),v())})}),e.querySelectorAll(".item-input").forEach(g=>{g.addEventListener("change",()=>{const q=g.closest("tr"),D=parseInt(q.dataset.sidx),E=parseInt(q.dataset.index),C=g.dataset.field;let j=g.value;if((C==="qty"||C==="rate")&&(j=parseFloat(j)||0),a.sections[D].lineItems[E][C]=j,C==="description"){const H=i.find(Y=>Y.name===j);if(H){const Y=(H.category||"").toLowerCase().includes("labor");let re=0,J=0;if(Y)re=H.unitPrice||85,J=H.costPrice||45;else{const I=H.costPrice||H.unitPrice||0;J=I,re=$t(I,r)}a.sections[D].lineItems[E].type=Y?"labor":"material",a.sections[D].lineItems[E].rate=re,a.sections[D].lineItems[E].internalCost=J}}v()})}),e.querySelectorAll(".btn-remove-line").forEach(g=>{g.addEventListener("click",()=>{const q=parseInt(g.dataset.sidx),D=parseInt(g.dataset.index);a.sections[q].lineItems.splice(D,1),v()})}),(h=e.querySelector("#btn-save-inv"))==null||h.addEventListener("click",()=>{const g=e.querySelector("#inv-customer").value,q=o.find(D=>D.id===g);if(a.customerId=g,a.customerName=(q==null?void 0:q.company)||"",a.status=e.querySelector("#inv-status").value,a.issueDate=e.querySelector("#inv-issue").value,a.dueDate=e.querySelector("#inv-due").value,a.invoiceType=e.querySelector("#inv-type").value,v(),t){const D=c.create("invoices",a);M("Invoice created","success"),F.navigate(`/invoices/${D.id}`)}else c.update("invoices",s,a),M("Invoice saved","success"),d()}),(L=e.querySelector("#btn-send-invoice"))==null||L.addEventListener("click",()=>{c.update("invoices",s,{status:"Sent"}),a.status="Sent",M("Invoice sent to customer","success"),d()}),(x=e.querySelector("#btn-mark-paid"))==null||x.addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`
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
      `,Ue({title:"Mark Invoice as Paid",content:g.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:"Confirm Payment",className:"btn-primary",onClick:q=>{const D=document.querySelector(".drawer-overlay"),E=D.querySelector("#paid-date").value,C=D.querySelector("#paid-method").value;c.update("invoices",s,{status:"Paid",paidDate:E,paymentMethod:C}),a.status="Paid",a.paidDate=E,a.paymentMethod=C,M("Invoice marked as paid","success"),d(),q()}}],width:350})}),(T=e.querySelector("#btn-delete-invoice"))==null||T.addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`<p>Delete invoice <strong>${f(a.number)}</strong>?</p>`,we({title:"Delete Invoice",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:"Delete",className:"btn-danger",onClick:q=>{c.delete("invoices",s),M("Invoice deleted","success"),q(),F.navigate("/invoices")}}]})}),($=e.querySelector("#btn-cancel-inv"))==null||$.addEventListener("click",()=>F.navigate("/invoices"))}d()}function et(e){const s=c.getAll("purchaseOrders");e.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(i=>`<button class="toolbar-filter" data-filter="${i}">${i}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let t=[...s];const o=Re({columns:[{key:"number",label:"PO Number",render:i=>`<span class="cell-link font-medium">${f(i.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:i=>`<span class="text-secondary">${f(i.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:i=>i.jobId?`<a href="#/jobs/${i.jobId}" class="cell-link">${f(i.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:i=>i.issueDate?new Date(i.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:i=>`$${(i.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:i=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[i.status]||"badge-neutral"}">${f(i.status)}</span>`,width:"110px"}],data:t,onRowClick:i=>_t({id:i,onSave:()=>et(e)}),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:i=>{Je({container:e,selectedIds:i,onClear:()=>o.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:r=>{r.forEach(p=>c.update("purchaseOrders",p,{status:"Received",receivedDate:new Date().toISOString()})),o.clearSelection(),et(e),ve(async()=>{const{showToast:p}=await Promise.resolve().then(()=>qe);return{showToast:p}},void 0).then(({showToast:p})=>p(`Marked ${r.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:r=>{const p=document.createElement("div");p.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Me);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${r.length} Purchase Orders`,content:p,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Apply",className:"btn-primary",onClick:l=>{const y=p.querySelector("#bulk-status").value;r.forEach(v=>c.update("purchaseOrders",v,{status:y})),o.clearSelection(),et(e),ve(async()=>{const{showToast:v}=await Promise.resolve().then(()=>qe);return{showToast:v}},void 0).then(({showToast:v})=>v(`Updated ${r.length} POs to ${y}`,"success")),l()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{ve(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Me);return{showModal:p}},void 0).then(({showModal:p})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${r.length} purchase orders? This action cannot be undone.</p>`,p({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Delete",className:"btn-danger",onClick:l=>{r.forEach(y=>c.delete("purchaseOrders",y)),o.clearSelection(),et(e),ve(async()=>{const{showToast:y}=await Promise.resolve().then(()=>qe);return{showToast:y}},void 0).then(({showToast:y})=>y(`Deleted ${r.length} purchase orders`,"success")),l()}}]})})}}]})}});e.querySelector("#po-table-container").appendChild(o),e.querySelector("#btn-new-po").addEventListener("click",()=>{_t({onSave:()=>et(e)})}),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(p=>p.classList.remove("active")),i.classList.add("active");const r=i.dataset.filter;t=r==="all"?[...s]:s.filter(p=>p.status===r),o.updateData(t)})}),e.querySelector("#po-search").addEventListener("input",i=>{const r=i.target.value.toLowerCase();t=s.filter(p=>{var d,l,y;return((d=p.number)==null?void 0:d.toLowerCase().includes(r))||((l=p.supplierName)==null?void 0:l.toLowerCase().includes(r))||((y=p.jobNumber)==null?void 0:y.toLowerCase().includes(r))}),o.updateData(t)})}function oa(e,{id:s,jobId:t}){const a=s==="new";let o=a?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:t||"",jobNumber:""}:c.getById("purchaseOrders",s);if(!o){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(a&&t){const n=c.getById("jobs",t);n&&(o.jobNumber=n.number)}Ye(o.number||"New PO");const i=c.getAll("stock"),r=c.getAll("jobs"),p=[...new Set(i.map(n=>n.supplier).filter(Boolean))];p.length===0&&p.push("General Supplier");function d(){e.innerHTML=`
      ${at({title:o.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
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
                    ${p.map(n=>`<option value="${n}" ${o.supplierName===n?"selected":""}>${n}</option>`).join("")}
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
                    ${r.map(n=>`<option value="${n.id}" ${o.jobId===n.id?"selected":""}>${n.number} - ${n.title}</option>`).join("")}
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
                ${o.lineItems.map((n,u)=>`
                  <tr data-index="${u}">
                    <td>
                      ${o.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${i.map(m=>`<option value="${m.id}" ${n.stockId===m.id?"selected":""}>${m.name}</option>`).join("")}
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
    `,y()}function l(){let n=0;e.querySelectorAll("#line-items-body tr[data-index]").forEach(m=>{const w=parseFloat(m.querySelector(".item-cost").value)||0,b=parseFloat(m.querySelector(".item-qty").value)||0,h=w*b;m.querySelector(".item-total").textContent="$"+h.toFixed(2),n+=h}),o.total=n;const u=e.querySelector("#po-total");u&&(u.textContent="$"+n.toFixed(2))}function y(){var n,u,m,w;e.querySelector("#btn-cancel").addEventListener("click",()=>F.navigate("/purchase-orders")),(n=e.querySelector("#btn-save"))==null||n.addEventListener("click",()=>{v()}),(u=e.querySelector("#btn-issue"))==null||u.addEventListener("click",()=>{if(o.lineItems.length===0){M("Cannot issue a PO with no items","error");return}v("Issued")}),(m=e.querySelector("#btn-receive"))==null||m.addEventListener("click",()=>{let b=0;const h=c.getAll("stock"),L=new Map(h.map(x=>[x.id,x]));o.lineItems.forEach(x=>{if(x.stockId){const T=L.get(x.stockId);T&&(T.quantity=(T.quantity||0)+x.quantity,T.updatedAt=new Date().toISOString(),b++)}}),b>0&&c.save("stock",h),M(`Received ${b} items into stock.`,"success"),o.status="Received",c.update("purchaseOrders",o.id,{status:"Received"}),d()}),(w=e.querySelector("#btn-add-item"))==null||w.addEventListener("click",()=>{o.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),d()}),e.querySelectorAll(".item-select").forEach((b,h)=>{b.addEventListener("change",L=>{const x=L.target.value,T=L.target.closest("tr"),$=T.querySelector(".item-desc"),g=T.querySelector(".item-sku"),q=T.querySelector(".item-cost");if(x){const D=c.getById("stock",x);D&&($.style.display="none",$.value=D.name,g.value=D.sku,g.disabled=!0,q.value=D.costPrice||D.unitPrice)}else $.style.display="block",$.value="",g.value="",g.disabled=!1,q.value=0;l()})}),e.querySelectorAll(".item-cost, .item-qty").forEach(b=>{b.addEventListener("input",l)}),e.querySelectorAll(".btn-remove-item").forEach(b=>{b.addEventListener("click",h=>{const L=h.target.closest("tr"),x=parseInt(L.dataset.index);o.lineItems.splice(x,1),d()})})}function v(n=null){if(o.status!=="Draft"){M("Cannot modify an issued or received PO","error");return}const u=e.querySelector("#po-form");if(!u.checkValidity()){u.reportValidity();return}const m=Object.fromEntries(new FormData(u));if(m.jobId){const b=r.find(h=>h.id===m.jobId);m.jobNumber=b?b.number:""}else m.jobNumber="";o.lineItems=Array.from(e.querySelectorAll("#line-items-body tr[data-index]")).map(b=>{const h=b.querySelector(".item-select"),L=h?h.value:"",x=b.querySelector(".item-desc").value,T=L?h.options[h.selectedIndex].text:x;return{stockId:L,description:T,sku:b.querySelector(".item-sku").value,unitCost:parseFloat(b.querySelector(".item-cost").value)||0,quantity:parseInt(b.querySelector(".item-qty").value)||1}}),l();const w={...o,...m,total:o.total,lineItems:o.lineItems,status:n||o.status};if(a){w.number=`PO-${Date.now().toString().slice(-6)}`;const b=c.create("purchaseOrders",w);M(`PO ${n==="Issued"?"issued":"created"} successfully`,"success"),F.navigate(`/purchase-orders/${b.id}`)}else c.update("purchaseOrders",s,w),M(`PO ${n==="Issued"?"issued":"updated"} successfully`,"success"),n==="Issued"&&d()}d()}function na(e){let s="overview";const t=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function a(){const d=c.getAll("jobs"),l=c.getAll("quotes"),y=c.getAll("invoices"),v=c.getAll("customers"),n=c.getAll("stock"),u=c.getAll("technicians"),m=c.getAll("leads"),w=y.filter(I=>I.status==="Paid").reduce((I,A)=>I+(A.total||0),0),b=y.filter(I=>I.status==="Sent"||I.status==="Overdue").reduce((I,A)=>I+(A.total||0),0),h=d.length>0?d.reduce((I,A)=>I+(A.laborCost||0)+(A.materialCost||0),0)/d.length:0,L=l.length>0?l.filter(I=>I.status==="Accepted").length/l.length*100:0,x=m.length>0?m.filter(I=>I.status==="Won").length/m.length*100:0,T={};d.forEach(I=>{T[I.status]=(T[I.status]||0)+1});const $={};y.forEach(I=>{$[I.status]=($[I.status]||0)+1});const g=u.map(I=>{const A=d.filter(k=>k.technicianId===I.id),N=A.filter(k=>k.status==="Completed"||k.status==="Invoiced").length,S=A.reduce((k,P)=>k+(P.laborCost||0)+(P.materialCost||0),0);return{...I,totalJobs:A.length,completed:N,revenue:S}}),q={};y.filter(I=>I.status==="Paid").forEach(I=>{q[I.customerName]=(q[I.customerName]||0)+(I.total||0)});const D=Object.entries(q).sort((I,A)=>A[1]-I[1]).slice(0,10),E=n.reduce((I,A)=>I+A.quantity*A.costPrice,0),C=n.filter(I=>I.quantity<=I.reorderLevel),j=c.getAll("timesheets"),H={},Y={},re=c.getAll("people"),J={};return re.forEach(I=>{I.payRate&&(J[I.id]=I.payRate)}),j.forEach(I=>{H[I.jobId]=(H[I.jobId]||0)+(I.hours||0);const A=I.payRate||J[I.technicianId]||0;Y[I.jobId]=(Y[I.jobId]||0)+I.hours*A}),{jobs:d,quotes:l,invoices:y,customers:v,stock:n,technicians:u,leads:m,totalRevenue:w,totalOutstanding:b,avgJobValue:h,quoteWinRate:L,leadConvRate:x,jobsByStatus:T,invByStatus:$,techStats:g,topCustomers:D,totalStockValue:E,lowStockItems:C,timesheets:j,hoursByJob:H,internalLaborCostByJob:Y}}function o(){const d=a();e.innerHTML=`
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
              ${t.map(l=>`
                <button class="report-nav-item ${s===l.id?"active":""}" data-report="${l.id}" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${s===l.id?"var(--color-primary-light)":"transparent"};
                  color:${s===l.id?"var(--color-primary)":"var(--text-secondary)"};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${s===l.id?"600":"500"};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${l.icon}</span>
                  ${l.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `,i(d),r(d)}function i(d){const l=e.querySelector("#report-content");switch(s){case"overview":l.innerHTML=ia(d);break;case"revenue":l.innerHTML=la(d);break;case"jobs":l.innerHTML=ra(d);break;case"job_costing":l.innerHTML=da(d);break;case"technicians":l.innerHTML=ca(d);break;case"customers":l.innerHTML=pa(d);break;case"inventory":l.innerHTML=ua(d);break;default:l.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function r(d){var l;e.querySelectorAll("[data-report]").forEach(y=>{y.addEventListener("click",()=>{s=y.dataset.report,o()})}),(l=e.querySelector("#btn-export-csv"))==null||l.addEventListener("click",()=>p(d))}function p(d){let l="";if(s==="overview"||s==="revenue")l=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,d.invoices.forEach(u=>{l+=`"${u.number}","${u.customerName}","${u.status}",${u.total||0},"${u.issueDate||""}","${u.dueDate||""}"
`});else if(s==="job_costing"){const u=c.getSettings();l=`Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %
`,d.jobs.filter(w=>w.status==="Completed"||w.status==="Invoiced").map(w=>{const b=d.hoursByJob[w.id]||0,h=d.internalLaborCostByJob[w.id]||w.laborCost||0,L=u.laborRates.find(g=>g.id===w.laborRateProfileId)||u.laborRates.find(g=>g.isDefault),x=Math.max(b*((L==null?void 0:L.rate)||85),(L==null?void 0:L.minCallOutFee)||0),T=x-h,$=x>0?T/x*100:0;return{num:w.number,tech:w.technicianName||"",actualH:b,actualLabor:h,billableLabor:x,profit:T,margin:$}}).forEach(w=>{l+=`"${w.num}","${w.tech}",${w.actualH},${w.actualLabor.toFixed(2)},${w.billableLabor.toFixed(2)},${w.profit.toFixed(2)},${w.margin.toFixed(1)}%
`})}else s==="jobs"?(l=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,d.jobs.forEach(u=>{l+=`"${u.number}","${u.title}","${u.customerName}","${u.technicianName||""}","${u.status}","${u.priority}",${u.laborCost||0},${u.materialCost||0}
`})):s==="technicians"?(l=`Name,Role,Total Jobs,Completed,Revenue
`,d.techStats.forEach(u=>{l+=`"${u.name}","${u.role}",${u.totalJobs},${u.completed},${u.revenue}
`})):s==="customers"?(l=`Company,First Name,Last Name,Email,Phone,Status
`,d.customers.forEach(u=>{l+=`"${u.company}","${u.firstName}","${u.lastName}","${u.email}","${u.phone}","${u.status}"
`})):s==="inventory"&&(l=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,d.stock.forEach(u=>{l+=`"${u.name}","${u.sku}","${u.category}",${u.quantity},${u.costPrice},${u.unitPrice},"${u.location}","${u.supplier}"
`}));const y=new Blob([l],{type:"text/csv"}),v=URL.createObjectURL(y),n=document.createElement("a");n.href=v,n.download=`simpro_${s}_report.csv`,n.click(),URL.revokeObjectURL(v)}o()}function Ne(e,s,t,a){const o={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${e}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[a]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${o[a]}">${t}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${s}</div>
    </div>
  `}function Xe(e,s,t){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${t}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${s}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${e}</div>
        </div>
      </div>
    </div>
  `}function pt(e,s={},t="#1B6DE0"){const a=Object.entries(e);if(a.length===0)return'<div class="text-secondary text-sm">No data available</div>';const o=Math.max(...a.map(([,i])=>i));return a.map(([i,r])=>{const p=s[i]||t,d=o>0?r/o*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${i}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${d}%;background:${p};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof r=="number"&&r>=1e3?`$${(r/1e3).toFixed(1)}k`:r}</div>
      </div>
    `}).join("")}function rt(e,s,t,a){const o=t>0?s/t*100:0,i=typeof s=="number"?`$${s.toLocaleString("en-AU",{minimumFractionDigits:0})}`:s;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${e}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${i}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${o}%;background:${a};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function ia(e){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Ne("Total Revenue",`$${e.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${Ne("Outstanding",`$${e.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${Ne("Quote Win Rate",`${e.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${Ne("Lead Conversion",`${e.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${pt(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${pt(e.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
      </div>
    </div>
    <div class="grid-3">
      ${Xe("Total Jobs",e.jobs.length,"build")}
      ${Xe("Total Quotes",e.quotes.length,"request_quote")}
      ${Xe("Total Invoices",e.invoices.length,"receipt_long")}
      ${Xe("Total Customers",e.customers.length,"people")}
      ${Xe("Avg Job Value",`$${e.avgJobValue.toFixed(0)}`,"paid")}
      ${Xe("Stock Items",`${e.stock.length} (${e.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function la(e){const s=e.invoices.filter(r=>r.status==="Paid"),t={};s.forEach(r=>{const p=new Date(r.issueDate||r.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});t[p]=(t[p]||0)+(r.total||0)});const a=e.jobs.reduce((r,p)=>r+(p.materialCost||0),0),o=e.jobs.reduce((r,p)=>r+(p.laborCost||0),0),i=e.totalRevenue-a;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Ne("Gross Revenue",`$${e.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${Ne("Total Labor",`$${o.toFixed(0)}`,"engineering","blue")}
      ${Ne("Material Costs",`$${a.toFixed(0)}`,"inventory_2","orange")}
      ${Ne("Gross Profit",`$${i.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${pt(t,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${rt("Revenue",e.totalRevenue,e.totalRevenue,"#10B981")}
        ${rt("Labor Cost",o,e.totalRevenue,"#3B82F6")}
        ${rt("Material Cost",a,e.totalRevenue,"#F59E0B")}
        ${rt("Gross Profit",i,e.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function ra(e){const s=e.jobs.filter(a=>a.status==="Completed"||a.status==="Invoiced"),t=s.length>0?s.reduce((a,o)=>a+(o.estimatedHours||0),0)/s.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Ne("Total Jobs",e.jobs.length,"build","blue")}
      ${Ne("Completed",s.length,"check_circle","green")}
      ${Ne("In Progress",e.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${Ne("Avg Hours",t.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${pt(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
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
  `}function da(e){const s=c.getSettings(),a=e.jobs.filter(d=>d.status==="Completed"||d.status==="Invoiced").map(d=>{const l=e.hoursByJob[d.id]||0,y=e.internalLaborCostByJob[d.id]||d.laborCost||0,v=s.laborRates.find(w=>w.id===d.laborRateProfileId)||s.laborRates.find(w=>w.isDefault),n=Math.max(l*((v==null?void 0:v.rate)||85),(v==null?void 0:v.minCallOutFee)||0),u=n-y,m=n>0?u/n*100:0;return{...d,actualH:l,actualLabor:y,billableLabor:n,profit:u,margin:m}}),o=a.reduce((d,l)=>d+l.actualLabor,0),i=a.reduce((d,l)=>d+l.billableLabor,0),r=i-o,p=i>0?r/i*100:0;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Ne("Internal Labor Cost","$"+o.toLocaleString(),"engineering","orange")}
      ${Ne("Billable Labor Rev.","$"+i.toLocaleString(),"payments","green")}
      ${Ne("Labor Profitability",p.toFixed(1)+"% Margin","trending_up",p>=40?"green":"orange")}
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
            ${a.map(d=>`
              <tr>
                <td class="font-medium"><a href="#/jobs/${d.id}" class="cell-link">${d.number}</a></td>
                <td>${d.technicianName||"—"}</td>
                <td style="text-align:right">${d.actualH.toFixed(2)}</td>
                <td style="text-align:right">$${d.actualLabor.toFixed(2)}</td>
                <td style="text-align:right">$${d.billableLabor.toFixed(2)}</td>
                <td style="text-align:right;font-weight:600;color:${d.profit>=0?"var(--color-success)":"var(--color-danger)"}">
                  $${d.profit.toFixed(2)}
                </td>
                <td style="text-align:right">
                   <span class="badge ${d.margin>=40?"badge-success":d.margin>=20?"badge-warning":"badge-danger"}">
                    ${d.margin.toFixed(1)}%
                   </span>
                </td>
              </tr>
            `).join("")}
            ${a.length?"":'<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No completed jobs to analyze</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function ca(e){return`
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
        ${e.techStats.map(s=>rt(s.name,s.revenue,Math.max(...e.techStats.map(t=>t.revenue)),s.color)).join("")}
      </div>
    </div>
  `}function pa(e){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Ne("Total Customers",e.customers.length,"people","blue")}
      ${Ne("Active Customers",e.customers.filter(s=>s.status==="Active").length,"check_circle","green")}
      ${Ne("Total Leads",e.leads.length,"trending_up","orange")}
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
  `}function ua(e){const s=e.stock.reduce((t,a)=>t+a.quantity*a.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Ne("Total Items",e.stock.length,"inventory_2","blue")}
      ${Ne("Stock Value (Cost)",`$${e.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${Ne("Stock Value (Sell)",`$${s.toFixed(0)}`,"paid","green")}
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
        ${pt(e.stock.reduce((t,a)=>(t[a.category]=(t[a.category]||0)+a.quantity,t),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}function Fe(e){return Object.entries(dt).map(([s,t])=>{const a={module:s};return t.forEach(({key:o})=>{a[o]=e(s,o)}),a})}function ma(e){const t=new URLSearchParams(window.location.hash.split("?")[1]||window.location.search).get("tab");let a="company",o="tasklists";t==="forms"?(a="templates_forms",o="forms"):t==="tasks"||t==="tasklists"?(a="templates_forms",o="tasklists"):t==="quote_templates"||t==="quotes"?(a="templates_forms",o="quotes"):t&&(a=t),JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');function i(){e.innerHTML=`
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${a==="company"?"active":""}" data-tab="company">Company</button>
        <button class="tab ${a==="users"?"active":""}" data-tab="users">Users & Permissions</button>
        <button class="tab ${a==="materials"?"active":""}" data-tab="materials">Materials</button>
        <button class="tab ${a==="templates_forms"?"active":""}" data-tab="templates_forms">Templates &amp; Forms</button>
        <button class="tab ${a==="tax"?"active":""}" data-tab="tax">Tax &amp; Rates</button>
        <button class="tab ${a==="assets"?"active":""}" data-tab="assets">Assets</button>
        <button class="tab ${a==="system"?"active":""}" data-tab="system">System</button>
      </div>
      <div id="settings-content" style="padding-top:var(--space-lg)"></div>
    `,r(),e.querySelectorAll(".tab").forEach(m=>{m.addEventListener("click",()=>{a=m.dataset.tab,e.querySelectorAll(".tab").forEach(w=>w.classList.remove("active")),m.classList.add("active"),r()})})}function r(){var b,h,L;const m=e.querySelector("#settings-content");if(a==="templates_forms"){u(m);return}if(a==="company"){const x=c.getSettings();let T=x.logo;(()=>{var q;m.innerHTML=`
          <div class="card" style="max-width:800px">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 280px; gap:var(--space-lg)">
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${x.name||"FieldForge Demo Company"}" id="company-name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${x.abn||"12 345 678 901"}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${x.phone||"1300 123 456"}" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Company Domain</label>
                    <input class="form-input" value="${x.email||"fieldforge.io"}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2">${x.address||"123 Business St, Melbourne VIC 3000"}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; align-items:center; text-align:center">
                  <label class="form-label" style="align-self:flex-start">Company Logo</label>
                  <div id="logo-preview-container" style="width:100%; aspect-ratio:1; margin:12px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                    ${T?`<img src="${T}" style="max-width:90%; max-height:90%; object-fit:contain" />`:`
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
                    ${T?'<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>':""}
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
        `;const g=m.querySelector("#logo-upload");m.querySelector("#btn-upload-logo").addEventListener("click",()=>g.click()),g.addEventListener("change",D=>{const E=D.target.files[0];if(E){const C=new FileReader;C.onload=j=>{T=j.target.result;const H=m.querySelector("#logo-preview-container");H.innerHTML=`<img src="${T}" style="max-width:90%; max-height:90%; object-fit:contain" />`,m.querySelector("#unsaved-logo-hint").style.display="block",M("Logo preview updated. Click Save to apply.","info")},C.readAsDataURL(E)}}),(q=m.querySelector("#btn-remove-logo"))==null||q.addEventListener("click",()=>{T=null;const D=m.querySelector("#logo-preview-container");D.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `,m.querySelector("#unsaved-logo-hint").style.display="block",m.querySelector("#btn-remove-logo").style.display="none"}),m.querySelector("#btn-save-company").addEventListener("click",()=>{const D=c.getSettings();D.name=m.querySelector("#company-name").value,D.abn=m.querySelector("#company-abn").value,D.phone=m.querySelector("#company-phone").value,D.email=m.querySelector("#company-domain").value,D.address=m.querySelector("#company-address").value,D.logo=T,c.saveSettings(D),M("Company information saved permanently","success"),m.querySelector("#unsaved-logo-hint").style.display="none",window.dispatchEvent(new CustomEvent("simpro-settings-updated"))})})()}else if(a==="users"){const x=c.getAll("technicians");let T=c.getAll("userTypes");!T||T.length===0?(T=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:Fe(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:Fe(($,g)=>$==="Settings"?["view","edit_company"].includes(g):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs",permissions:Fe(($,g)=>$==="Dashboard"?g==="view":$==="Jobs"?["view","manage_tasks","book_time"].includes(g):$==="Timesheets"?["view_own","create"].includes(g):$==="Schedule"?["view_own"].includes(g):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Fe(($,g)=>$==="Settings"?!1:$==="Reports"?g==="view":!(["Invoices","Purchase Orders"].includes($)&&g==="delete"))}],c.save("userTypes",T)):T.some(g=>g.id==="ut_office")||(T.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Fe((g,q)=>g==="Settings"?!1:g==="Reports"?q==="view":!(["Invoices","Purchase Orders"].includes(g)&&q==="delete"))}),c.save("userTypes",T)),m.innerHTML=`
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
                ${x.filter($=>!$.deactivated).map($=>{const g=T.find(q=>q.id===$.userTypeId);return`
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${$.color}"></div></td>
                      <td class="font-medium">${$.name}</td>
                      <td class="text-secondary">${$.role}</td>
                      <td><span class="badge ${(g==null?void 0:g.id)==="ut_admin"?"badge-primary":"badge-neutral"}">${(g==null?void 0:g.name)||"Unassigned"}</span></td>
                      <td class="text-tertiary">${$.email||"-"}</td>
                      <td class="text-secondary">${$.payRate?`$${$.payRate.toFixed(2)}/hr`:"-"}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${$.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${$.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
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
                ${T.map($=>`
                  <tr>
                    <td class="font-medium">${$.name}</td>
                    <td class="text-secondary">${$.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${$.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${$.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${$.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${x.filter($=>$.deactivated).length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>':""}
                ${x.filter($=>$.deactivated).map($=>{const g=new Date($.deactivatedAt),D=new Date-g,C=30-Math.ceil(D/(1e3*60*60*24)),j=C<=0;return`
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${$.name}</td>
                      <td style="opacity:0.6">${$.role}</td>
                      <td class="text-tertiary">${g.toLocaleDateString()}</td>
                      <td>
                        ${j?'<span class="badge badge-success">Cooldown Complete</span>':`<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${C} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${$.id}" 
                                ${j?"":'disabled style="opacity:0.4; cursor:not-allowed"'}>
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,m.querySelector("#btn-add-user").addEventListener("click",()=>l()),m.querySelectorAll(".btn-edit-user").forEach($=>{$.addEventListener("click",g=>l(g.currentTarget.dataset.id))}),m.querySelectorAll(".btn-deactivate-user").forEach($=>{$.addEventListener("click",g=>{const q=g.currentTarget.dataset.id,D=c.getById("technicians",q);if(!D)return;const E=document.createElement("div");E.innerHTML=`<p>Are you sure you want to deactivate <strong>${D.name}</strong>? They will no longer be able to log in.</p>`,we({title:"Deactivate User",content:E,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()},{label:"Deactivate",className:"btn-danger",onClick:C=>{c.update("technicians",q,{deactivated:!0,deactivatedAt:new Date().toISOString()}),M(`${D.name} deactivated`,"info"),C(),r()}}]})})}),m.querySelectorAll(".btn-reactivate-user").forEach($=>{$.addEventListener("click",g=>{const q=g.currentTarget.dataset.id,D=c.getById("technicians",q);if(!D)return;const E=new Date(D.deactivatedAt),C=Math.ceil((new Date-E)/(1e3*60*60*24));if(C<30){M(`License Policy: Seat cooldown in progress (${30-C} days remaining)`,"error");return}const j=document.createElement("div");j.innerHTML=`<p>Reactivate <strong>${D.name}</strong>? They will regain access once a User Type is assigned.</p>`,we({title:"Reactivate User",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:H=>H()},{label:"Reactivate",className:"btn-primary",onClick:H=>{c.update("technicians",q,{deactivated:!1,deactivatedAt:null}),M(`${D.name} has been reactivated.`,"success"),H(),r()}}]})})}),(b=m.querySelector("#btn-add-usertype"))==null||b.addEventListener("click",()=>{p()}),m.querySelectorAll(".btn-edit-perms").forEach($=>{$.addEventListener("click",g=>{d(g.target.dataset.id)})}),m.querySelectorAll(".btn-edit-usertype").forEach($=>{$.addEventListener("click",g=>{p(g.target.dataset.id)})}),m.querySelectorAll(".btn-delete-usertype").forEach($=>{$.addEventListener("click",g=>{const q=g.target.dataset.id,D=c.getById("userTypes",q);if(!D)return;if(D.name.toLowerCase().includes("admin")){M("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const E=c.getAll("technicians").filter(j=>j.userTypeId===q),C=document.createElement("div");C.innerHTML=`<p>Are you sure you want to delete the user type <strong>${D.name}</strong>?${E.length>0?` <strong>${E.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,we({title:"Confirm Deletion",content:C,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Delete",className:"btn-danger",onClick:j=>{c.delete("userTypes",q),M("User Type deleted","success"),j(),r()}}]})})})}else if(a==="materials")n(m);else if(a==="tax"){let T=function($){return Array.from($.querySelectorAll(".labor-rate-card")).map(g=>{const q=g.dataset.id,D=g.querySelector(".rate-name").value,E=parseFloat(g.querySelector(".rate-val").value)||0,C=parseFloat(g.querySelector(".rate-multiplier").value)||1,j=g.querySelector(".rate-desc").value,H=parseFloat(g.querySelector(".rate-min-fee").value)||0,Y=g.querySelector(".btn-set-default")===null,re=Array.from(g.querySelectorAll(".rate-day:checked")).map(J=>J.dataset.day);return{id:q,name:D,rate:E,description:j,overtimeMultiplier:C,minCallOutFee:H,applicableDays:re,isDefault:Y}})};var w=T;const x=c.getSettings();m.innerHTML=`
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
                  <input class="form-input" id="global-markup" type="number" value="${x.markupPercent||20}" style="width:100px" /> <span class="text-secondary">%</span>
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
                  <option value="1" ${(x.laborRounding||15)===1?"selected":""}>None (Precise)</option>
                  <option value="5" ${(x.laborRounding||15)===5?"selected":""}>Nearest 5 Minutes</option>
                  <option value="15" ${(x.laborRounding||15)===15?"selected":""}>Nearest 15 Minutes</option>
                  <option value="30" ${(x.laborRounding||15)===30?"selected":""}>Nearest 30 Minutes</option>
                  <option value="60" ${(x.laborRounding||15)===60?"selected":""}>Nearest Hour</option>
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
              ${x.laborRates.map($=>{const g=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],q={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},D=$.applicableDays||["Mon","Tue","Wed","Thu","Fri"];return`
                <div class="labor-rate-card" data-id="${$.id}" style="border:2px solid ${$.isDefault?"var(--color-primary)":"var(--border-color)"}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${$.isDefault?"var(--color-primary-light)":"var(--bg-color)"}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${$.isDefault?"var(--color-primary)":"var(--text-tertiary)"}; font-size:20px">sell</span>
                      <input class="rate-name" value="${$.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${$.isDefault?'<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>':""}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${$.isDefault?"":`<button class="btn btn-ghost btn-sm btn-set-default" data-id="${$.id}" title="Set as default rate">Set Default</button>`}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${$.id}" title="Delete profile" ${$.isDefault?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
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
                        <input class="form-input rate-val" type="number" value="${$.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Overtime Multiplier</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <input class="form-input rate-multiplier" type="number" value="${($.overtimeMultiplier||1).toFixed(1)}" min="1" max="5" step="0.5" style="width:100px" />
                        <span class="text-secondary">× base pay</span>
                      </div>
                    </div>
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${($.minCallOutFee||0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Description</label>
                      <input class="form-input rate-desc" value="${$.description||""}" placeholder="When is this rate used?" />
                    </div>
                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${g.map(E=>`
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${E}" ${D.includes(E)?"checked":""} style="display:none" />
                            <span class="rate-day-pill" data-day="${E}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${D.includes(E)?"var(--color-primary)":"var(--border-color)"};background:${D.includes(E)?"var(--color-primary-light)":"transparent"};color:${D.includes(E)?"var(--color-primary)":"var(--text-secondary)"}">
                              ${q[E]}
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
              ${["Service","Project","Maintenance","Quote"].map($=>`
                <div class="form-group" style="margin:0">
                  <label class="form-label">${$} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${$}">
                    <option value="">-- Use Default --</option>
                    ${x.laborRates.map(g=>{var q;return`<option value="${g.id}" ${((q=x.rateMappings)==null?void 0:q[$])===g.id?"selected":""}>${g.name}</option>`}).join("")}
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `,m.addEventListener("click",$=>{const g=$.target.closest(".rate-day-pill");if(g){const q=g.dataset.day,E=g.closest(".labor-rate-card").querySelector(`.rate-day[data-day="${q}"]`);E.checked=!E.checked;const C=E.checked;g.style.border=`1px solid ${C?"var(--color-primary)":"var(--border-color)"}`,g.style.background=C?"var(--color-primary-light)":"transparent",g.style.color=C?"var(--color-primary)":"var(--text-secondary)"}}),m.querySelector("#add-rate-btn").addEventListener("click",()=>{const $="rate_"+Date.now().toString(36),g=m.querySelector("#labor-rates-container"),q=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],D={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},E=document.createElement("div");E.className="labor-rate-card",E.dataset.id=$,E.style.cssText="border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);",E.innerHTML=`
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${$}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${$}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${q.map(C=>`
                  <label style="cursor:pointer">
                    <input type="checkbox" class="rate-day" data-day="${C}" ${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"checked":""} style="display:none" />
                    <span class="rate-day-pill" data-day="${C}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"var(--color-primary)":"var(--border-color)"};background:${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"var(--color-primary-light)":"transparent"};color:${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"var(--color-primary)":"var(--text-secondary)"}">
                      ${D[C]}
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        `,g.appendChild(E)}),m.addEventListener("click",$=>{if($.target.closest(".remove-rate-btn")){const g=$.target.closest(".labor-rate-card");g&&g.remove()}}),m.addEventListener("click",$=>{if($.target.closest(".btn-set-default")){const g=$.target.closest(".btn-set-default").dataset.id,q=T(m);q.forEach(E=>E.isDefault=E.id===g);const D=m.querySelector("#labor-rates-container");D.innerHTML=q.map(E=>{m.querySelectorAll(".labor-rate-card").forEach(C=>{const j=C.dataset.id===g;C.style.border=`2px solid ${j?"var(--color-primary)":"var(--border-color)"}`;const H=C.querySelector('div[style*="padding:12px 16px"]');H&&(H.style.background=j?"var(--color-primary-light)":"var(--bg-color)");let Y=C.querySelector(".badge");if(j&&!Y){const J=C.querySelector('div[style*="flex:1"]'),I=document.createElement("span");I.className="badge",I.style.cssText="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600",I.textContent="DEFAULT",J.appendChild(I)}else!j&&Y&&Y.remove();let re=C.querySelector(".btn-set-default");if(j&&re)re.remove();else if(!j&&!re){const J=C.querySelector('div[style*="gap:8px"]'),I=document.createElement("button");I.className="btn btn-ghost btn-sm btn-set-default",I.dataset.id=C.dataset.id,I.textContent="Set Default",J.prepend(I)}})}),M("Default rate updated in view. Click Save to apply.","info")}}),m.querySelector("#save-tax-settings").addEventListener("click",()=>{const $=parseFloat(m.querySelector("#global-markup").value)||0,g=parseInt(m.querySelector("#labor-rounding").value)||15,q=T(m),D=c.getSettings();D.markupPercent=$,D.laborRounding=g,D.laborRates=q,D.rateMappings={},m.querySelectorAll(".rate-mapping").forEach(E=>{E.value&&(D.rateMappings[E.dataset.type]=E.value)}),c.saveSettings(D),M("Financial and Rate settings saved","success"),r()})}else if(a==="assets"){c.getSettings();const x=c.getAll("assets").filter(T=>T.category==="Business");m.innerHTML=`
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
                ${x.map(T=>`
                  <tr>
                    <td class="font-medium">${f(T.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${T.id}" value="${T.recoveryRate||0}" step="0.5" style="width:100px; height:32px" />
                      </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `).join("")}
                ${x.length===0?'<tr><td colspan="3" class="text-center text-tertiary" style="padding:24px">No business assets found. Add assets in the main Assets module.</td></tr>':""}
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="btn-save-asset-settings">Save Asset Recovery Rates</button>
          </div>
        </div>
      `,m.querySelector("#btn-save-asset-settings").addEventListener("click",()=>{m.querySelectorAll(".asset-rate-input").forEach(T=>{const $=T.dataset.id,g=parseFloat(T.value)||0;c.update("assets",$,{recoveryRate:g})}),M("Asset recovery rates updated across the system","success")})}else a==="system"&&(m.innerHTML=`
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
      `,(h=m.querySelector("#btn-reset-data"))==null||h.addEventListener("click",()=>{c.clearAll(),M("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(L=m.querySelector("#btn-clear-data"))==null||L.addEventListener("click",()=>{c.clearAll(),M("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)}))}function p(m=null){let w=m?c.getById("userTypes",m):{name:"",description:""};const b=document.createElement("div");b.innerHTML=`
        ${m?"":`
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
          <input class="form-input" id="ut-name" value="${w.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${w.description}" />
        </div>
    `;const h=b.querySelector("#ut-template"),L=b.querySelector("#ut-custom-edit-perms");h&&L&&(h.addEventListener("change",x=>{x.target.value==="Custom"?L.style.display="flex":L.style.display="none"}),L.addEventListener("click",()=>{var q;const x=b.querySelector("#ut-name").value,T=b.querySelector("#ut-desc").value;if(!x){M("Please enter a User Type Name first","error");return}const $=Fe(()=>!1),g=c.create("userTypes",{name:x,description:T,permissions:$});(q=document.getElementById("modal-close-btn"))==null||q.click(),d(g.id)})),we({title:m?"Edit User Type":"Add User Type",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Save",className:"btn-primary",onClick:x=>{var q;const T=document.getElementById("ut-name").value,$=document.getElementById("ut-desc").value,g=(q=document.getElementById("ut-template"))==null?void 0:q.value;if(!T){M("Name required","error");return}if(m)c.update("userTypes",m,{name:T,description:$});else{let D=[];g==="Admin"?D=Fe(()=>!0):g==="Manager"?D=Fe((E,C)=>E==="Settings"?["view","edit_company"].includes(C):!0):g==="Technician"?D=Fe((E,C)=>E==="Dashboard"?C==="view":E==="Jobs"?["view","manage_tasks","book_time"].includes(C):E==="Timesheets"?["view_own","create"].includes(C):E==="Schedule"?["view_own"].includes(C):!1):g==="Office Staff"?D=Fe((E,C)=>E==="Settings"?!1:E==="Reports"?C==="view":!(["Invoices","Purchase Orders"].includes(E)&&C==="delete")):D=Fe(()=>!1),c.create("userTypes",{name:T,description:$,permissions:D})}M("User Type saved","success"),r(),x()}}]})}function d(m){const w=c.getById("userTypes",m);if(!w)return;const b=w.permissions||[],h={};b.forEach(T=>{h[T.module]=T});const L=document.createElement("div"),x=Object.entries(dt).map(([T,$])=>{const g=h[T]||{},q=$.every(({key:E})=>g[E]),D=$.map(({key:E,label:C})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${T}" data-key="${E}" ${g[E]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${C}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${T}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${T}" ${q?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${D}
          </div>
        </div>
      `}).join("");L.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${x}
      </div>
    `,L.querySelector("#btn-select-all-perms").addEventListener("click",()=>{L.querySelectorAll(".perm-chk, .module-select-all").forEach(T=>T.checked=!0)}),L.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{L.querySelectorAll(".perm-chk, .module-select-all").forEach(T=>T.checked=!1)}),L.querySelectorAll(".module-select-all").forEach(T=>{T.addEventListener("change",$=>{const g=$.target.dataset.module;L.querySelectorAll(`.perm-chk[data-module="${g}"]`).forEach(q=>q.checked=$.target.checked)})}),L.querySelectorAll(".perm-chk").forEach(T=>{T.addEventListener("change",()=>{const $=T.dataset.module,q=(dt[$]||[]).every(({key:E})=>{const C=L.querySelector(`.perm-chk[data-module="${$}"][data-key="${E}"]`);return C&&C.checked}),D=L.querySelector(`.module-select-all[data-module="${$}"]`);D&&(D.checked=q)})}),we({title:`Edit Permissions: ${w.name}`,content:L,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Save Permissions",className:"btn-primary",onClick:T=>{const $=Object.entries(dt).map(([g,q])=>{const D={module:g};return q.forEach(({key:E})=>{const C=L.querySelector(`.perm-chk[data-module="${g}"][data-key="${E}"]`);D[E]=C?C.checked:!1}),D});c.update("userTypes",m,{permissions:$}),M("Permissions updated successfully","success"),r(),T()}}]})}function l(m=null){let w=m?c.getById("technicians",m):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const b=c.getAll("userTypes"),h=document.createElement("div");h.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${w.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${w.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${w.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${b.map(T=>`
              <option value="${T.id}" ${w.userTypeId===T.id?"selected":""}>${T.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary);font-size:15px">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${w.payRate||""}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary" style="font-size:var(--font-size-sm)">/hr — used in job cost &amp; P&amp;L calculations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(T=>`
            <div class="color-swatch" data-color="${T}" style="width:28px; height:28px; border-radius:50%; background:${T}; cursor:pointer; border:2px solid ${w.color.toUpperCase()===T.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${w.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const L=h.querySelector("#u-color"),x=h.querySelectorAll(".color-swatch");x.forEach(T=>{T.addEventListener("click",()=>{L.value=T.dataset.color,x.forEach($=>$.style.borderColor="transparent"),T.style.borderColor="var(--text-primary)"})}),L.addEventListener("input",()=>{x.forEach(T=>T.style.borderColor="transparent")}),we({title:m?"Edit User":"Add User",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Save",className:"btn-primary",onClick:T=>{const $=document.getElementById("u-name").value,g=document.getElementById("u-email").value,q=document.getElementById("u-role").value,D=document.getElementById("u-type").value,E=document.getElementById("u-color").value,C=parseFloat(document.getElementById("u-payrate").value)||null;if(!$){M("Name required","error");return}m?c.update("technicians",m,{name:$,email:g,role:q,userTypeId:D,color:E,payRate:C}):c.create("technicians",{name:$,email:g,role:q,userTypeId:D,color:E,payRate:C}),M("User saved","success"),r(),T()}}]})}document.addEventListener("save-settings",()=>M("Settings saved","success"));function y(m){const w=c.getAll("taskTemplates");m.innerHTML=`
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
              ${w.length?w.map(h=>`
                <tr>
                  <td class="font-medium">${f(h.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${f(h.description||"—")}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(h.tags||[]).map(L=>`<span class="badge badge-neutral" style="font-size:10px">${f(L)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-template" data-id="${h.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-template" data-id="${h.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="4" class="text-center text-tertiary" style="padding:32px">No templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-template").addEventListener("click",()=>{b()}),m.querySelectorAll(".btn-delete-template").forEach(h=>{h.addEventListener("click",()=>{confirm("Delete this template?")&&(c.delete("taskTemplates",h.dataset.id),r())})}),m.querySelectorAll(".btn-edit-template").forEach(h=>{h.addEventListener("click",()=>{b(h.dataset.id)})});function b(h=null){const L=h?c.getById("taskTemplates",h):{name:"",description:"",tags:[],tasks:[]},x=document.createElement("div");x.style.maxHeight="80vh",x.style.overflowY="auto",x.style.padding="4px";let T=JSON.parse(JSON.stringify(L.tasks||L.phases||[])).map(j=>{!j.subTasks&&j.subPhases&&(j.subTasks=j.subPhases,delete j.subPhases),j.tasks&&!j.subTasks&&(j.subTasks=j.tasks.map(Y=>({id:Y.id||c.generateId(),name:Y.name||"",estimatedHours:Y.estimatedHours||0,people:Y.people||1,status:"Not Started",progress:0})),delete j.tasks);function H(Y){Y.subPhases&&!Y.subTasks&&(Y.subTasks=Y.subPhases,delete Y.subPhases),Y.subTasks||(Y.subTasks=[]),Y.subTasks.forEach(H)}return H(j),j}),$=T.length>0?[0]:[],g=[],q=!1;function D(j,H){if(!H||H.length===0)return null;let Y=j[H[0]];if(!Y)return null;for(let re=1;re<H.length;re++)if(!Y.subTasks||(Y=Y.subTasks[H[re]],!Y))return null;return Y}function E(j){return!j.subTasks||j.subTasks.length===0?(parseFloat(j.estimatedHours)||0)*(parseInt(j.people)||1):j.subTasks.reduce((H,Y)=>H+E(Y),0)}const C=()=>{var j,H,Y,re,J,I;x.innerHTML=`
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${f(L.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${f(L.description||"")}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(L.tags||[]).join(", ")}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(()=>{const A=g.length>0?D(T,g):null,N=A?A.subTasks||[]:T,S=A?f(A.name):"Main Tasks";return`
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${g.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${S}">${S}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${N.map((k,P)=>{const _=[...g,P],ee=_.join("-")===$.join("-");return`
                        <div class="tmpl-task-list-item" data-path="${_.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${ee?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${ee?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(k.name)}">${f(k.name)}</span>
                          ${k.subTasks&&k.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${_.join("-")}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>`:""}
                        </div>
                      `}).join("")}
                    ${N.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${$.length>0?(()=>{const A=$,N=D(T,A);if(!N)return'<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';const S=N.subTasks&&N.subTasks.length>0;return`
                  ${q?`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${A.join("-")}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${A.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <label class="form-label" style="font-size:11px">Name *</label>
                      <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${f(N.name)}" style="font-size:13px" />
                    </div>
                    ${S?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:13px; font-weight:500">${E(N)} hrs</div>
                      </div>
                    `:`
                      <div class="form-row" style="margin-bottom:12px; gap:8px">
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">Est. Hours</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${N.estimatedHours||""}" min="0" step="0.5" style="font-size:13px" />
                        </div>
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">People</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${N.people||"1"}" min="1" step="1" style="font-size:13px" />
                        </div>
                      </div>
                    `}
                    <div class="form-group" style="margin-bottom:0">
                      <label class="form-label" style="font-size:11px">Description</label>
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${f(N.description||"")}</textarea>
                    </div>
                  `:`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${f(N.name)}">${f(N.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${A.length<3?`<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${A.join("-")}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>`:""}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${A.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${f(N.name)}</div>
                    </div>
                    ${S?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${E(N)} hrs</div>
                      </div>
                    `:`
                      <div style="display:flex; gap:16px; margin-bottom:12px">
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Estimated Hours</div>
                          <div style="font-size:14px; font-weight:500">${N.estimatedHours||0} hrs</div>
                        </div>
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">People</div>
                          <div style="font-size:14px; font-weight:500">${N.people||1}</div>
                        </div>
                      </div>
                    `}
                    <div style="margin-top:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Description</div>
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${f(N.description||"No description provided.")}</div>
                    </div>
                  `}
                `})():'<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `,(j=x.querySelector(".btn-view-back"))==null||j.addEventListener("click",()=>{g.pop(),C()}),x.querySelectorAll(".btn-drill-down-tmpl").forEach(A=>{A.addEventListener("click",N=>{N.stopPropagation(),g=A.dataset.path.split("-").map(Number),$=[...g],C()})}),x.querySelectorAll(".tmpl-task-list-item").forEach(A=>{A.addEventListener("click",N=>{N.target.closest(".btn-drill-down-tmpl")||($=A.dataset.path.split("-").map(Number),q=!1,C())})}),(H=x.querySelector(".btn-add-node"))==null||H.addEventListener("click",()=>{const A={id:c.generateId(),name:"New Task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]};if(g.length===0)T.push(A),$=[T.length-1];else{const N=D(T,g);N.subTasks||(N.subTasks=[]),N.subTasks.push(A),$=[...g,N.subTasks.length-1]}q=!0,C()}),(Y=x.querySelector(".btn-add-child-tmpl"))==null||Y.addEventListener("click",A=>{const N=A.currentTarget.dataset.path.split("-").map(Number),S=D(T,N);S.subTasks||(S.subTasks=[]),S.subTasks.push({id:c.generateId(),name:"New Sub-task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]}),$=[...N,S.subTasks.length-1],q=!0,C()}),(re=x.querySelector(".btn-edit-info-tmpl"))==null||re.addEventListener("click",()=>{q=!0,C()}),(J=x.querySelector(".btn-done-info-tmpl"))==null||J.addEventListener("click",()=>{q=!1,C()}),x.querySelectorAll(".tmpl-detail-input").forEach(A=>{A.addEventListener("input",N=>{const S=D(T,$);if(!S)return;const k=N.target.dataset.field;k==="estimatedHours"?S[k]=parseFloat(N.target.value)||0:k==="people"?S[k]=parseInt(N.target.value)||1:S[k]=N.target.value})}),x.querySelectorAll(".btn-remove-task-tmpl-item").forEach(A=>{A.addEventListener("click",N=>{const S=A.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this item and all its sub-tasks?")){if(S.length===1)T.splice(S[0],1);else{const k=S.slice(0,-1),P=D(T,k);P&&P.subTasks&&P.subTasks.splice(S[S.length-1],1)}$=S.slice(0,-1),q=!1,C()}})}),(I=x.querySelector(".btn-duplicate-task-tmpl"))==null||I.addEventListener("click",A=>{const N=A.currentTarget.dataset.path.split("-").map(Number),S=D(T,N);if(!S)return;function k(_,ee){return{..._,id:c.generateId(),name:_.name+(ee?" (Copy)":""),status:"Not Started",progress:0,subTasks:_.subTasks?_.subTasks.map(le=>k(le,!1)):[]}}const P=k(S,!0);if(N.length===1)T.splice(N[0]+1,0,P),$=[N[0]+1];else{const _=N.slice(0,-1);D(T,_).subTasks.splice(N[N.length-1]+1,0,P),$=[..._,N[N.length-1]+1]}q=!1,C()})};C(),we({title:h?"Edit Tasklist Template":"Create Tasklist Template",content:x,size:"modal-lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Save Template",className:"btn-primary",onClick:j=>{const H=x.querySelector("#edit-tmpl-name").value,Y=x.querySelector("#edit-tmpl-desc").value,re=x.querySelector("#edit-tmpl-tags").value.split(",").map(I=>I.trim()).filter(Boolean);if(!H){M("Name required","error");return}const J={name:H,description:Y,tags:re,tasks:T,phases:T};h?c.update("taskTemplates",h,J):c.create("taskTemplates",J),M("Tasklist template saved","success"),j(),r()}}]})}}function v(m){const w=c.getAll("quoteTemplates");m.innerHTML=`
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
              ${w.length?w.map(h=>`
                <tr>
                  <td class="font-medium">${f(h.name)}</td>
                  <td class="text-secondary">${f(h.description||"—")}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-quote-template" data-id="${h.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-quote-template" data-id="${h.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="3" class="text-center text-tertiary" style="padding:32px">No quote templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-quote-template").addEventListener("click",()=>{b()}),m.querySelectorAll(".btn-delete-quote-template").forEach(h=>{h.addEventListener("click",()=>{confirm("Delete this template?")&&(c.delete("quoteTemplates",h.dataset.id),r())})}),m.querySelectorAll(".btn-edit-quote-template").forEach(h=>{h.addEventListener("click",()=>{b(h.dataset.id)})});function b(h=null){const L=h?c.getById("quoteTemplates",h):{name:"",description:""},x=document.createElement("div");x.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="edit-qtmpl-name" value="${f(L.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="edit-qtmpl-desc" rows="3">${f(L.description||"")}</textarea>
        </div>
      `,we({title:h?"Edit Quote Template":"Create Quote Template",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Save Template",className:"btn-primary",onClick:T=>{const $=x.querySelector("#edit-qtmpl-name").value,g=x.querySelector("#edit-qtmpl-desc").value;if(!$){M("Name required","error");return}h?c.update("quoteTemplates",h,{name:$,description:g}):c.create("quoteTemplates",{name:$,description:g,sections:[]}),M("Quote template saved","success"),T(),r()}}]})}}function n(m){const w=c.getSettings(),b=w.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]},h=w.materialCategories||["General"];m.innerHTML=`
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${b.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${b.minMarkupAmount}" step="0.50" style="width:100px" />
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
                  <input type="checkbox" id="mat-use-tiers" ${b.useTiers?"checked":""} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${b.useTiers?"":"opacity:0.5;pointer-events:none"}">
                <table class="data-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="tier-rows">
                    ${(b.tiers||[]).map((x,T)=>`
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${T===0?"Up to":"From previous up to"} 
                            <div style="display:flex;align-items:center;gap:4px">
                              <span class="text-tertiary">$</span>
                              <input type="number" class="form-input tier-upto" value="${x.upTo||""}" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" class="form-input tier-percent" value="${x.percent}" style="height:28px;padding:2px 8px;width:80px" />
                            <span class="text-tertiary">%</span>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-icon btn-sm text-danger btn-remove-tier" data-idx="${T}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
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
              ${h.map(x=>`
                <div class="badge badge-neutral" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${x}
                  <span class="material-icons-outlined btn-remove-cat" data-name="${x}" style="font-size:14px;cursor:pointer">close</span>
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
    `;const L=()=>{const x=parseFloat(m.querySelector("#mat-default-markup").value),T=parseFloat(m.querySelector("#mat-min-markup").value),$=m.querySelector("#mat-use-tiers").checked,g=Array.from(m.querySelectorAll("#tier-rows tr")).map(E=>({upTo:parseFloat(E.querySelector(".tier-upto").value)||null,percent:parseFloat(E.querySelector(".tier-percent").value)||0})).sort((E,C)=>E.upTo===null?1:C.upTo===null?-1:E.upTo-C.upTo),q=Array.from(m.querySelectorAll(".btn-remove-cat")).map(E=>E.dataset.name),D={...w,materialMarkup:{defaultPercent:x,minMarkupAmount:T,useTiers:$,tiers:g},materialCategories:q};c.saveSettings(D),M("Material settings saved","success")};m.querySelector("#mat-use-tiers").addEventListener("change",x=>{m.querySelector("#tiers-container").style.opacity=x.target.checked?"1":"0.5",m.querySelector("#tiers-container").style.pointerEvents=x.target.checked?"auto":"none"}),m.querySelector("#btn-add-tier").addEventListener("click",()=>{const x=document.createElement("tr");x.innerHTML=`
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
      `,m.querySelector("#tier-rows").appendChild(x),x.querySelector(".btn-remove-tier").addEventListener("click",()=>x.remove())}),m.querySelectorAll(".btn-remove-tier").forEach(x=>{x.addEventListener("click",()=>x.closest("tr").remove())}),m.querySelector("#btn-add-category").addEventListener("click",()=>{const x=prompt("Enter category name:");if(x){const T=document.createElement("div");T.className="badge badge-neutral",T.style.cssText="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px",T.innerHTML=`
          ${x}
          <span class="material-icons-outlined btn-remove-cat" data-name="${x}" style="font-size:14px;cursor:pointer">close</span>
        `,m.querySelector("#categories-container").insertBefore(T,m.querySelector("#btn-add-category")),T.querySelector(".btn-remove-cat").addEventListener("click",()=>T.remove())}}),m.querySelectorAll(".btn-remove-cat").forEach(x=>{x.addEventListener("click",()=>x.closest(".badge").remove())}),m.querySelector("#btn-save-materials").addEventListener("click",L)}function u(m){m.innerHTML=`
      <div class="card" style="margin-bottom:var(--space-md)">
        <div class="card-body" style="padding: 8px; background:var(--bg-color); border-radius: 8px; display:flex; gap:8px">
          <button class="btn btn-sm" id="subtab-tasklists" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${o==="tasklists"?"var(--color-primary)":"transparent"}; color:${o==="tasklists"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">playlist_add_check</span> Tasklist Templates
          </button>
          <button class="btn btn-sm" id="subtab-forms" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${o==="forms"?"var(--color-primary)":"transparent"}; color:${o==="forms"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">assignment</span> Form Templates
          </button>
          <button class="btn btn-sm" id="subtab-quotes" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${o==="quotes"?"var(--color-primary)":"transparent"}; color:${o==="quotes"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">article</span> Quote Templates
          </button>
        </div>
      </div>
      <div id="templates-subcontent" style="margin-top:var(--space-md)"></div>
    `;const w=m.querySelector("#subtab-tasklists"),b=m.querySelector("#subtab-forms"),h=m.querySelector("#subtab-quotes");o==="tasklists"&&(w.style.color="white"),o==="forms"&&(b.style.color="white"),o==="quotes"&&(h.style.color="white");const L=m.querySelector("#templates-subcontent");o==="tasklists"?y(L):o==="forms"?os(L):o==="quotes"&&v(L),w.addEventListener("click",()=>{o="tasklists",u(m)}),b.addEventListener("click",()=>{o="forms",u(m)}),h.addEventListener("click",()=>{o="quotes",u(m)})}i()}function os(e){const s=c.getAll("formTemplates");e.innerHTML=`
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
                  <td class="font-medium">${f(t.name)}</td>
                  <td style="color:var(--text-secondary); font-size:13px">${f(t.description||"—")}</td>
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
    `,e.querySelector("#btn-add-form-template").addEventListener("click",()=>F.navigate("/settings/forms/new")),e.querySelectorAll(".edit-form-template").forEach(t=>{t.addEventListener("click",()=>F.navigate(`/settings/forms/${t.dataset.id}/edit`))}),e.querySelectorAll(".delete-form-template").forEach(t=>{t.addEventListener("click",()=>{if(confirm("Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.")){const a=t.dataset.id,o=c.getAll("formTemplates").filter(i=>i.id!==a);c.save("formTemplates",o),os(e)}})})}function ns(e,{id:s}){const t=s&&s!=="new",a=c.getAll("formTemplates"),o=t?a.find(l=>l.id===s):null;if(t&&!o){e.innerHTML='<div class="empty-state"><h3>Template not found</h3></div>';return}let i=o?JSON.parse(JSON.stringify(o.sections||[])):[{id:"sec_"+Math.random().toString(36).substr(2,5),title:"General Info",fields:[]}];function r(){e.innerHTML=`
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
                <input class="form-input" id="form-name" value="${f((o==null?void 0:o.name)||"")}" placeholder="e.g. Daily Safety Audit" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" id="form-desc" value="${f((o==null?void 0:o.description)||"")}" placeholder="Optional description..." />
              </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:20px">
              <h4 style="margin:0">Form Structure</h4>
              <button class="btn btn-secondary btn-sm" id="btn-add-section">
                <span class="material-icons-outlined" style="font-size:16px">library_add</span> Add Section
              </button>
            </div>

            <div id="sections-list" style="display:flex; flex-direction:column; gap:24px; padding-bottom:40px">
              ${i.map((l,y)=>`
                <div class="section-card" data-section-index="${y}" style="border:1px solid var(--border-color); border-radius:12px; background:var(--bg-color); overflow:hidden; box-shadow:var(--shadow-sm)">
                  <div style="padding:16px 20px; background:var(--content-bg); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:12px; flex:1">
                      <span class="material-icons-outlined" style="color:var(--text-tertiary); cursor:grab">drag_indicator</span>
                      <input class="form-input section-title" value="${f(l.title)}" placeholder="Section Title..." style="font-weight:600; font-size:16px; background:transparent; border:none; padding:4px; margin:0; width:100%" />
                    </div>
                    <div style="display:flex; gap:12px">
                      <button class="btn btn-secondary btn-sm btn-add-field-to-sec" data-section-index="${y}">
                        <span class="material-icons-outlined" style="font-size:16px">add</span> Add Field
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${y}" style="color:var(--color-danger)">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="fields-container" style="padding:20px; display:flex; flex-direction:column; gap:16px">
                    ${l.fields.map((v,n)=>{var u;return`
                      <div class="field-row" data-field-index="${n}" style="display:grid; grid-template-columns: 1fr 160px 100px 40px; gap:12px; align-items:flex-end; background:white; padding:16px; border-radius:8px; border:1px solid var(--border-color); position:relative">
                        <div class="form-group" style="margin:0">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Field Label</label>
                          <input class="form-input field-label" value="${f(v.label)}" placeholder="Enter question or label..." />
                        </div>
                        <div class="form-group" style="margin:0">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Type</label>
                          <select class="form-select field-type">
                            <option value="text" ${v.type==="text"?"selected":""}>Text</option>
                            <option value="textarea" ${v.type==="textarea"?"selected":""}>Long Text</option>
                            <option value="checkbox" ${v.type==="checkbox"?"selected":""}>Checkbox / Yes-No</option>
                            <option value="select" ${v.type==="select"?"selected":""}>Dropdown Menu</option>
                            <option value="date" ${v.type==="date"?"selected":""}>Date Picker</option>
                            <option value="signature" ${v.type==="signature"?"selected":""}>Signature Field</option>
                          </select>
                        </div>
                        <div class="form-group" style="margin:0; text-align:center">
                          <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Required</label>
                          <div style="height:38px; display:flex; align-items:center; justify-content:center">
                            <input type="checkbox" class="field-required" ${v.required?"checked":""} style="width:20px; height:20px; cursor:pointer" />
                          </div>
                        </div>
                        <button class="btn btn-ghost btn-icon btn-sm remove-field" data-section-index="${y}" data-field-index="${n}" style="color:var(--color-danger); height:38px">
                          <span class="material-icons-outlined">close</span>
                        </button>
                        
                        ${v.type==="select"?`
                          <div style="grid-column: 1 / -1; margin-top:8px; padding:12px; background:var(--bg-color); border-radius:4px">
                            <label class="form-label" style="font-size:11px">Dropdown Options (comma separated)</label>
                            <input class="form-input field-options" style="font-size:13px" value="${f(((u=v.options)==null?void 0:u.join(", "))||"")}" placeholder="e.g. Option 1, Option 2, Option 3" />
                          </div>
                        `:""}
                      </div>
                    `}).join("")}
                    ${l.fields.length?"":`
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
    `,d()}function p(){e.querySelectorAll(".section-card").forEach(l=>{const y=parseInt(l.dataset.sectionIndex);i[y].title=l.querySelector(".section-title").value,l.querySelectorAll(".field-row").forEach(v=>{var m;const n=parseInt(v.dataset.fieldIndex),u=i[y].fields[n];if(u.label=v.querySelector(".field-label").value,u.type=v.querySelector(".field-type").value,u.required=v.querySelector(".field-required").checked,u.type==="select"){const w=((m=v.querySelector(".field-options"))==null?void 0:m.value)||"";u.options=w.split(",").map(b=>b.trim()).filter(Boolean)}})})}function d(){e.querySelector("#btn-back").addEventListener("click",()=>F.navigate("/settings?tab=forms")),e.querySelector("#btn-cancel").addEventListener("click",()=>F.navigate("/settings?tab=forms")),e.querySelector("#btn-save").addEventListener("click",()=>{p();const l=e.querySelector("#form-name").value.trim(),y=e.querySelector("#form-desc").value.trim();if(!l){M("Form name is required","error"),e.querySelector("#form-name").focus();return}if(i.reduce((m,w)=>m+w.fields.length,0)===0){M("Please add at least one field to the form","error");return}const n={id:t?s:"fmt_"+Math.random().toString(36).substr(2,9),name:l,description:y,sections:i.map(m=>({...m}))},u=c.getAll("formTemplates");if(t){const m=u.findIndex(w=>w.id===s);u[m]=n}else u.push(n);c.save("formTemplates",u),M(`Form template "${l}" saved`,"success"),F.navigate("/settings?tab=forms")}),e.querySelector("#btn-add-section").addEventListener("click",()=>{p(),i.push({id:"sec_"+Math.random().toString(36).substr(2,5),title:"New Section",fields:[]}),r()}),e.querySelectorAll(".btn-add-field-to-sec").forEach(l=>{l.addEventListener("click",()=>{p();const y=parseInt(l.dataset.sectionIndex);i[y].fields.push({id:"f_"+Math.random().toString(36).substr(2,5),type:"text",label:"",required:!1}),r()})}),e.querySelectorAll(".remove-section").forEach(l=>{l.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this entire section and all its fields?")){const y=parseInt(l.dataset.sectionIndex);i.splice(y,1),r()}})}),e.querySelectorAll(".remove-field").forEach(l=>{l.addEventListener("click",()=>{const y=parseInt(l.dataset.sectionIndex),v=parseInt(l.dataset.fieldIndex);i[y].fields.splice(v,1),r()})}),e.querySelectorAll(".field-type").forEach(l=>{l.addEventListener("change",()=>{p(),r()})})}r()}const ba=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function va(e,s){if(e.role==="admin"||e.role==="manager")return"/";if(!e.userTypeId)return"/schedule";const t=s.getById("userTypes",e.userTypeId);if(!t||!t.permissions)return"/schedule";for(const{path:a,module:o}of ba){const i=t.permissions.find(r=>r.module===o);if(i&&(i.view||i.create||i.edit||i.delete))return a}return"/schedule"}function ya(e){var d;const s=document.querySelector(".sidebar"),t=document.querySelector(".topbar"),a=document.getElementById("breadcrumb");s&&(s.style.display="none"),t&&(t.style.display="none"),a&&(a.style.display="none");const o=c.getAll("technicians").filter(l=>!l.deactivated),i=c.getAll("userTypes");e.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">FieldForge</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${o.map(l=>{const y=i.find(v=>v.id===l.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${l.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${l.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${y?y.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${o.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const r=async l=>{const y=o.find(b=>b.id===l),v=i.find(b=>b.id===(y==null?void 0:y.userTypeId));let n="technician";if(v){const b=v.name.toLowerCase();b.includes("admin")?n="admin":b.includes("manager")?n="manager":b.includes("office")&&(n="office")}const u={id:y.id,name:y.name,role:n,userTypeName:v?v.name:"Unassigned",userTypeId:y.userTypeId,color:y.color};localStorage.setItem("currentUser",JSON.stringify(u)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),ve(async()=>{const{updateSidebarAccess:b}=await Promise.resolve().then(()=>Pt);return{updateSidebarAccess:b}},void 0).then(({updateSidebarAccess:b})=>{b&&b()}),ve(async()=>{const{updateTopbarAccess:b}=await Promise.resolve().then(()=>Mt);return{updateTopbarAccess:b}},void 0).then(({updateTopbarAccess:b})=>{b&&b()});const{store:m}=await ve(async()=>{const{store:b}=await Promise.resolve().then(()=>ms);return{store:b}},void 0),w=va(u,m);F.navigate(w)};e.querySelectorAll(".btn-login-user").forEach(l=>{l.addEventListener("click",y=>{const v=y.target.closest(".btn-login-user");r(v.dataset.id)})});const p=()=>{const l={id:"customer-user",name:"Customer User",role:"customer"},y=c.get("people").filter(v=>v.type==="Customer");y.length>0&&(l.customerId=y[0].id,l.name=y[0].firstName+" "+y[0].lastName),localStorage.setItem("currentUser",JSON.stringify(l)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),ve(async()=>{const{updateSidebarAccess:v}=await Promise.resolve().then(()=>Pt);return{updateSidebarAccess:v}},void 0).then(({updateSidebarAccess:v})=>{v&&v()}),ve(async()=>{const{updateTopbarAccess:v}=await Promise.resolve().then(()=>Mt);return{updateTopbarAccess:v}},void 0).then(({updateTopbarAccess:v})=>{v&&v()}),F.navigate("/portal")};(d=e.querySelector("#btn-login-customer"))==null||d.addEventListener("click",p)}function At(e){const s=JSON.parse(localStorage.getItem("currentUser")||"{}"),t=s.customerId;if(s.role!=="customer"||!t){e.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const a=c.getAll("jobs").filter(l=>l.customerId===t),o=c.getAll("quotes").filter(l=>l.customerId===t),i=c.getAll("invoices").filter(l=>l.customerId===t);e.innerHTML=`
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
            ${o.map(l=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${l.number} - ${l.title||"Quote"}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(l.total||0).toFixed(2)} | Status: <span class="badge ${l.status==="Approved"?"badge-success":"badge-neutral"}">${l.status}</span></div>
                </div>
                <div>
                  ${l.status!=="Approved"?`<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${l.id}">Approve</button>`:""}
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
            ${a.map(l=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${l.number} - ${l.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${l.status}</span></div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Invoices Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Invoices</h2>
        ${i.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${i.map(l=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${l.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(l.total||0).toFixed(2)} | Status: <span class="badge ${l.status==="Paid"?"badge-success":"badge-danger"}">${l.status}</span></div>
                </div>
                <div>
                  ${l.status!=="Paid"?`<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${l.id}">Pay Now</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;const r=e.querySelector("#portal-logout-btn");r&&r.addEventListener("click",()=>{localStorage.removeItem("currentUser"),ve(async()=>{const{router:l}=await Promise.resolve().then(()=>ps);return{router:l}},void 0).then(({router:l})=>{l.navigate("/login")})}),e.querySelectorAll(".btn-approve-quote").forEach(l=>{l.addEventListener("click",y=>{const v=y.target.dataset.id;c.update("quotes",v,{status:"Approved"}),alert("Quote approved successfully!"),At(e)})}),e.querySelectorAll(".btn-pay-invoice").forEach(l=>{l.addEventListener("click",y=>{const v=y.target.dataset.id;c.update("invoices",v,{status:"Paid"}),alert("Invoice paid successfully!"),At(e)})})}function yt(e){const s=c.getAll("contractors");e.innerHTML=`
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
  `;let t=[...s];const o=Re({columns:[{key:"businessName",label:"Business Name",render:i=>`<span class="cell-link font-medium">${f(i.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:i=>f(i.email||"—")},{key:"phone",label:"Phone",render:i=>f(i.phone||"—")},{key:"active",label:"Status",render:i=>`<span class="badge ${i.active?"badge-success":"badge-neutral"}">${i.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:i=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${i.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:t,onRowClick:i=>F.navigate(`/contractors/${i}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:i=>{Je({container:e,selectedIds:i,onClear:()=>o.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:r=>{r.forEach(p=>c.update("contractors",p,{active:!0})),o.clearSelection(),yt(e),ve(async()=>{const{showToast:p}=await Promise.resolve().then(()=>qe);return{showToast:p}},void 0).then(({showToast:p})=>p(`Activated ${r.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:r=>{r.forEach(p=>c.update("contractors",p,{active:!1})),o.clearSelection(),yt(e),ve(async()=>{const{showToast:p}=await Promise.resolve().then(()=>qe);return{showToast:p}},void 0).then(({showToast:p})=>p(`Deactivated ${r.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{ve(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Me);return{showModal:p}},void 0).then(({showModal:p})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${r.length} contractors? This action cannot be undone.</p>`,p({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Delete",className:"btn-danger",onClick:l=>{r.forEach(y=>c.delete("contractors",y)),o.clearSelection(),yt(e),ve(async()=>{const{showToast:y}=await Promise.resolve().then(()=>qe);return{showToast:y}},void 0).then(({showToast:y})=>y(`Deleted ${r.length} contractors`,"success")),l()}}]})})}}]})}});e.querySelector("#contractors-table-container").appendChild(o),e.querySelector("#btn-new-contractor").addEventListener("click",()=>F.navigate("/contractors/new")),e.querySelector("#contractors-search").addEventListener("input",i=>{const r=i.target.value.toLowerCase();t=s.filter(p=>p.businessName.toLowerCase().includes(r)||p.contactName.toLowerCase().includes(r)||(p.email||"").toLowerCase().includes(r)),o.updateData(t)}),e.addEventListener("click",i=>{const r=i.target.closest(".contractor-edit-btn");r&&(i.stopPropagation(),F.navigate(`/contractors/${r.dataset.id}/edit`))})}function is(e,s){const t=s.id==="new";let a=t?{active:!0}:c.getById("contractors",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{F.navigate(t?"/contractors":`/contractors/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const o={businessName:e.querySelector("#businessName").value,contactName:e.querySelector("#contactName").value,email:e.querySelector("#email").value,phone:e.querySelector("#phone").value,licenseNumber:e.querySelector("#licenseNumber").value,insuranceExpiry:e.querySelector("#insuranceExpiry").value,active:e.querySelector("#active").checked};if(!o.businessName||!o.contactName){alert("Business Name and Contact Name are required.");return}t?c.create("contractors",o):c.update("contractors",s.id,o),F.navigate("/contractors")})}function fa(e,s){const t=c.getById("contractors",s.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
    <div class="page-header">
      <div class="page-header-info">
        <h1 style="margin: 0;">${f(t.businessName)}</h1>
        <p class="text-secondary" style="margin: 5px 0 0 0;">Contact: ${f(t.contactName)}</p>
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
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Email</strong> ${f(t.email||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Phone</strong> ${f(t.phone||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">License</strong> ${f(t.licenseNumber||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Insurance Expiry</strong> ${f(t.insuranceExpiry||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Status</strong> <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span></div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{F.navigate(`/contractors/${s.id}/edit`)})}function ft(e){let s=c.getAll("assets");const t=c.getAll("fleet");s.length===0&&t.length>0&&(t.forEach(r=>{r.ownerType="Business",r.identifier=r.licensePlate,c.create("assets",r)}),s=c.getAll("assets")),e.innerHTML=`
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
  `;let a=[...s];const i=Re({columns:[{key:"name",label:"Name / ID",render:r=>`<span class="cell-link font-medium">${f(r.name)}</span>`},{key:"owner",label:"Owner Type",render:r=>{if(r.ownerType==="Customer"&&r.customerId){const p=c.getById("customers",r.customerId);return p?`<span class="badge badge-neutral">${f(p.company)}</span>`:"Customer"}return'<span class="badge badge-primary">My Business</span>'}},{key:"type",label:"Category",render:r=>f(r.type||"—")},{key:"service",label:"Service Status",render:r=>{const d=(r.logs||[]).filter(v=>v.type==="Service").sort((v,n)=>new Date(n.date)-new Date(v.date))[0];if(!d||!r.serviceIntervalMonths)return'<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';const l=new Date(d.date);l.setMonth(l.getMonth()+parseInt(r.serviceIntervalMonths));const y=l<new Date;return`<span style="color:${y?"var(--color-danger)":"var(--text-secondary)"}; font-size:12px; font-weight:${y?"600":"400"}">
          ${y?"OVERDUE":l.toLocaleDateString()}
        </span>`}},{key:"status",label:"Status",render:r=>`<span class="badge ${r.status==="Active"?"badge-success":r.status==="In Maintenance"?"badge-warning":"badge-neutral"}">${f(r.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:r=>{if(!r.assignedToId)return"—";const p=c.getById("technicians",r.assignedToId);return p?f(p.name):"—"}},{key:"actions",label:"",width:"80px",render:r=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:a,onRowClick:r=>F.navigate(`/assets/${r}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:r=>{Je({container:e,selectedIds:r,onClear:()=>i.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:p=>{const d=document.createElement("div");d.innerHTML=`
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
              `,ve(async()=>{const{showModal:l}=await Promise.resolve().then(()=>Me);return{showModal:l}},void 0).then(({showModal:l})=>{l({title:`Update ${p.length} Assets`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Apply",className:"btn-primary",onClick:y=>{const v=d.querySelector("#bulk-status").value;p.forEach(n=>c.update("assets",n,{status:v})),i.clearSelection(),ft(e),ve(async()=>{const{showToast:n}=await Promise.resolve().then(()=>qe);return{showToast:n}},void 0).then(({showToast:n})=>n(`Updated ${p.length} assets to ${v}`,"success")),y()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:p=>{ve(async()=>{const{showToast:d}=await Promise.resolve().then(()=>qe);return{showToast:d}},void 0).then(({showToast:d})=>d(`Generating tags for ${p.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:p=>{ve(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Me);return{showModal:d}},void 0).then(({showModal:d})=>{const l=document.createElement("div");l.innerHTML=`<p>Are you sure you want to delete ${p.length} assets? This action cannot be undone.</p>`,d({title:"Confirm Bulk Delete",content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Delete",className:"btn-danger",onClick:y=>{p.forEach(v=>c.delete("assets",v)),i.clearSelection(),ft(e),ve(async()=>{const{showToast:v}=await Promise.resolve().then(()=>qe);return{showToast:v}},void 0).then(({showToast:v})=>v(`Deleted ${p.length} assets`,"success")),y()}}]})})}}]})}});e.querySelector("#asset-table-container").appendChild(i),e.querySelector("#btn-new-asset").addEventListener("click",()=>{Gt({onSave:()=>ft(e)})}),e.querySelector("#asset-search").addEventListener("input",r=>{const p=r.target.value.toLowerCase();a=s.filter(d=>d.name.toLowerCase().includes(p)||(d.serial||d.identifier||d.licensePlate||"").toLowerCase().includes(p)||(d.type||"").toLowerCase().includes(p)),i.updateData(a)}),e.addEventListener("click",r=>{const p=r.target.closest(".asset-edit-btn");p&&(r.stopPropagation(),F.navigate(`/assets/${p.dataset.id}/edit`))})}function ls(e,s){const t=s.id==="new";let a=t?{status:"Active",ownerType:"Business",type:"Plant & Equipment",serviceIntervalMonths:6,currentMeter:0,recoveryRate:0}:c.getById("assets",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const o=c.getAll("people").filter(u=>u.type==="Staff"),i=c.getAll("customers");let r=[];if(a.customerId){const u=c.getById("customers",a.customerId);u&&u.sites&&(r=u.sites)}e.innerHTML=`
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
                ${i.map(u=>`<option value="${u.id}" ${a.customerId===u.id?"selected":""}>${u.company||u.firstName+" "+u.lastName}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type / Category</label>
              <select id="type" class="form-select">
                ${["Vehicle","Plant & Equipment","Specialized Tool","Fixed Asset (HVAC/Solar/Fire)","Other"].map(u=>`<option value="${u}" ${a.type===u?"selected":""}>${u}</option>`).join("")}
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
                 ${o.map(u=>`<option value="${u.id}" ${a.assignedToId===u.id?"selected":""}>${u.firstName} ${u.lastName}</option>`).join("")}
               </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Service Interval (Months)</label>
              <input type="number" id="serviceIntervalMonths" class="form-input" value="${a.serviceIntervalMonths||6}" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Current Meter Reading</label>
              <div style="display:flex; gap:8px;">
                <input type="number" id="currentMeter" class="form-input" value="${a.currentMeter||0}" step="1" style="flex:1" />
                <select id="meterUnit" class="form-select" style="width: 100px;">
                  <option value="hrs" ${a.meterUnit==="hrs"?"selected":""}>Hours</option>
                  <option value="kmls" ${a.meterUnit==="kmls"?"selected":""}>Kmls</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location / Site</label>
              <select id="site" class="form-select" ${a.ownerType==="Business"?"disabled":""}>
                <option value="">-- No specific site --</option>
                ${r.map(u=>`<option value="${u.name}" ${a.site===u.name?"selected":""}>${u.name}</option>`).join("")}
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
              ${["Active","In Maintenance","Commissioning","Decommissioned","Lost/Stolen"].map(u=>`<option value="${u}" ${a.status===u?"selected":""}>${u}</option>`).join("")}
            </select>
          </div>
        </form>
      </div>
    </div>
  `;const p=e.querySelector("#ownerType"),d=e.querySelector("#customer-select-group"),l=e.querySelector("#customerId"),y=e.querySelector("#site"),v=e.querySelector("#business-fields");p.addEventListener("change",u=>{const m=u.target.value==="Customer";d.style.display=m?"block":"none",v.style.display=m?"none":"flex",y.disabled=!m,m?n(l.value):y.innerHTML='<option value="">-- No specific site --</option>'}),l.addEventListener("change",u=>{n(u.target.value)});function n(u){if(!u){y.innerHTML='<option value="">-- No specific site --</option>';return}const m=c.getById("customers",u);if(!m||!m.sites||m.sites.length===0){y.innerHTML='<option value="">-- No specific site --</option>';return}y.innerHTML='<option value="">-- No specific site --</option>'+m.sites.map(w=>`<option value="${w.name}" ${a.site===w.name?"selected":""}>${w.name}</option>`).join("")}e.querySelector("#btn-cancel").addEventListener("click",()=>{F.navigate(t?"/assets":`/assets/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{var m;const u={name:e.querySelector("#name").value,description:e.querySelector("#description").value,serial:e.querySelector("#serial").value,identifier:e.querySelector("#serial").value,type:e.querySelector("#type").value,status:e.querySelector("#status").value,assignedToId:e.querySelector("#assignedToId").value,ownerType:e.querySelector("#ownerType").value,customerId:e.querySelector("#ownerType").value==="Customer"?e.querySelector("#customerId").value:null,site:e.querySelector("#site").value,installDate:e.querySelector("#installDate").value,recoveryRate:parseFloat(((m=e.querySelector("#recoveryRate"))==null?void 0:m.value)||0),serviceIntervalMonths:parseInt(e.querySelector("#serviceIntervalMonths").value||6),currentMeter:parseFloat(e.querySelector("#currentMeter").value||0),meterUnit:e.querySelector("#meterUnit").value};if(!u.name){alert("Asset Name is required.");return}t?(u.logs=[],c.create("assets",u)):c.update("assets",s.id,u),F.navigate("/assets")})}function rs(e,s){const t=c.getById("assets",s.id);if(!t){e.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}c.getSettings();let a="Unassigned";if(t.assignedToId){const n=c.getById("technicians",t.assignedToId);n&&(a=n.name)}let o="My Business",i="Internal Asset";if(t.ownerType==="Customer"&&t.customerId){const n=c.getById("customers",t.customerId);n&&(o=n.company),i="Customer Asset"}const r=t.logs||[],p=r.reduce((n,u)=>n+(parseFloat(u.cost)||0),0),d=r.filter(n=>n.type==="Service").sort((n,u)=>new Date(u.date)-new Date(n.date))[0];let l="Not Scheduled",y=!1;if(d&&t.serviceIntervalMonths){const n=new Date(d.date);n.setMonth(n.getMonth()+parseInt(t.serviceIntervalMonths)),l=n.toLocaleDateString(),y=n<new Date}e.innerHTML=`
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
          <span class="material-icons-outlined" style="color:var(--color-primary)">${t.type==="Vehicle"?"directions_car":"precision_manufacturing"}</span>
        </div>
        <div>
          <h1 style="margin: 0;">${f(t.name)}</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
            <span class="badge ${t.ownerType==="Business"?"badge-primary":"badge-neutral"}">${i}</span>
            <span class="text-tertiary" style="font-size:12px">• ${f(t.identifier||t.serial||"No ID")}</span>
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
          <div style="font-weight:600; font-size:16px; color:${y?"var(--color-danger)":"inherit"}">
            ${l}
            ${y?'<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">OVERDUE</span>':""}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">
            ${t.ownerType==="Business"?"Total Maintenance Spend":"Current Meter Reading"}
          </div>
          <div style="font-weight:600; font-size:16px">
            ${t.ownerType==="Business"?`$${p.toLocaleString()}`:`${t.currentMeter||0} ${t.meterUnit||"hrs"}`}
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
                <span class="font-medium">${f(t.type||"-")}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Owner</span>
                <span class="font-medium">${f(o)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Assigned To</span>
                <span class="font-medium">${f(a)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Location</span>
                <span class="font-medium">${f(t.site||"Main Office")}</span>
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
            ${f(t.description)}
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
                <th style="width:120px">Meter (${t.meterUnit||"hrs"})</th>
                <th style="width:120px">Type</th>
                <th>Notes</th>
                <th style="text-align:right">Cost</th>
              </tr>
            </thead>
            <tbody>
              ${r.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>':r.sort((n,u)=>new Date(u.date)-new Date(n.date)).map(n=>`
                  <tr>
                    <td class="font-medium">${new Date(n.date).toLocaleDateString()}</td>
                    <td class="text-secondary">${n.meter||"-"}</td>
                    <td>
                      <span class="badge ${n.type==="Service"?"badge-success":n.type==="Repair"?"badge-danger":"badge-neutral"}">
                        ${f(n.type)}
                      </span>
                    </td>
                    <td><span class="text-secondary" style="font-size:13px">${f(n.notes||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${n.cost>0?`$${parseFloat(n.cost).toFixed(2)}`:"—"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{F.navigate(`/assets/${s.id}/edit`)}),e.querySelector("#btn-add-log").addEventListener("click",()=>{v()});function v(){const n=document.createElement("div");n.innerHTML=`
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
          <label class="form-label">Current Meter Reading (${t.meterUnit||"hrs"})</label>
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
    `,ve(async()=>{const{showModal:u}=await Promise.resolve().then(()=>Me);return{showModal:u}},void 0).then(({showModal:u})=>{u({title:"Add Activity Log",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Save Log",className:"btn-primary",onClick:m=>{const w=n.querySelector("#log-date").value,b=n.querySelector("#log-type").value,h=parseFloat(n.querySelector("#log-meter").value),L=parseFloat(n.querySelector("#log-cost").value),x=n.querySelector("#log-notes").value;if(!w)return;const T={date:w,type:b,meter:h,cost:L,notes:x},$=[...t.logs||[],T];c.update("assets",t.id,{logs:$,currentMeter:h,status:b==="Repair"?"In Maintenance":t.status}),m(),rs(e,s)}}]})})}}function ga(e){let s="All Documents";const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),a=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];function o(){if(t.role==="admin"||t.role==="manager")return a;const r=["All Documents","Health & Safety","Job Attachments","Customer Attachments","Digital Forms","Purchase Orders"],p=t.userTypeId?c.getById("userTypes",t.userTypeId):null;if(p&&p.permissions){const d=p.permissions.find(y=>y.module==="Quotes"),l=p.permissions.find(y=>y.module==="Invoices");d&&d.view&&r.push("Quotes"),l&&l.view&&r.push("Invoices")}return a.filter(d=>r.includes(d))}function i(){const r=o();r.includes(s)||(s="All Documents");const p=[];c.getAll("documents").forEach(b=>{p.push({id:b.id,name:b.name,url:b.url,type:b.type,size:b.size,uploadedAt:b.uploadedAt,folder:b.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),c.getAll("jobs").forEach(b=>{b.attachments&&Array.isArray(b.attachments)&&b.attachments.forEach(h=>{p.push({id:h.id||Math.random().toString(36).substr(2,9),name:h.name,url:h.url||h.data||"#",type:h.type,size:h.size,uploadedAt:h.uploadedAt||h.date||b.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})}),b.activityLog&&Array.isArray(b.activityLog)&&b.activityLog.forEach(h=>{h.type==="attachment"&&h.file&&p.push({id:h.id,name:h.file.name,url:h.file.url||h.file.data||"#",type:h.file.type,size:h.file.size,uploadedAt:h.date,folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`}),h.type==="combined"&&Array.isArray(h.files)&&h.files.forEach((L,x)=>{p.push({id:`${h.id}_${x}`,name:L.name,url:L.url||L.data||"#",type:L.type,size:L.size,uploadedAt:h.date,folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})})}),b.forms&&Array.isArray(b.forms)&&b.forms.forEach((h,L)=>{p.push({id:`form_${b.id}_${L}`,name:`${h.type} - ${new Date(h.date).toLocaleDateString()}`,url:`#/jobs/${b.id}`,type:"Digital Form",size:null,uploadedAt:h.date,folder:"Digital Forms",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})})}),c.getAll("customers").forEach(b=>{b.attachments&&Array.isArray(b.attachments)&&b.attachments.forEach(h=>{p.push({id:h.id||Math.random().toString(36).substr(2,9),name:h.name,url:h.url||h.data||"#",type:h.type,size:h.size,uploadedAt:h.uploadedAt||b.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:b.id,entityName:b.company})})}),c.getAll("invoices").forEach(b=>{p.push({id:b.id,name:`Invoice ${b.number}.pdf`,url:`#/invoices/${b.id}`,type:"Invoice PDF",size:null,uploadedAt:b.issueDate,folder:"Invoices",entityType:"Invoice",entityId:b.id,entityName:`Inv ${b.number} - ${b.customerName}`})}),c.getAll("quotes").forEach(b=>{p.push({id:b.id,name:`Quote ${b.number}.pdf`,url:`#/quotes/${b.id}`,type:"Quote PDF",size:null,uploadedAt:b.createdAt,folder:"Quotes",entityType:"Quote",entityId:b.id,entityName:`Quote ${b.number} - ${b.customerName}`})}),c.getAll("purchaseOrders").forEach(b=>{p.push({id:b.id,name:`PO ${b.number}.pdf`,url:`#/purchase-orders/${b.id}`,type:"PO PDF",size:null,uploadedAt:b.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:b.id,entityName:`PO ${b.number} - ${b.supplierName}`})}),c.getAll("taskTemplates").forEach(b=>{p.push({id:`task_tmpl_${b.id}`,name:`${b.name} (Tasklist Template)`,url:"#/settings",type:"Tasklist Template",size:null,uploadedAt:b.createdAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:b.id,entityName:"Settings / Tasklist Templates"})}),c.getAll("formTemplates").forEach(b=>{p.push({id:`form_tmpl_${b.id}`,name:`${b.name} (Compliance Form Template)`,url:"#/settings",type:"Form Template",size:null,uploadedAt:b.createdAt||b.updatedAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:b.id,entityName:"Settings / Compliance Forms"})});const d=p.filter(b=>r.includes(b.folder));d.sort((b,h)=>new Date(h.uploadedAt)-new Date(b.uploadedAt));let l=d;s!=="All Documents"&&(l=d.filter(b=>b.folder===s));const y=r;e.innerHTML=`
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
              ${y.map(b=>{let h="folder";b==="All Documents"?h="dashboard":b==="Company Docs"?h="domain":b==="Health & Safety"?h="health_and_safety":b==="Templates"?h="file_copy":b==="Job Attachments"?h="build":b==="Customer Attachments"?h="people":b==="Digital Forms"?h="assignment":b==="Invoices"?h="receipt_long":b==="Quotes"?h="request_quote":b==="Purchase Orders"&&(h="shopping_cart");const L=s===b,x=b==="All Documents"?d.length:d.filter(T=>T.folder===b).length;return`
                <li>
                  <button class="btn btn-ghost ${L?"active":""}" data-folder="${b}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${L?"var(--color-primary-bg)":"transparent"}; color:${L?"var(--primary-color)":"var(--text-primary)"}; font-weight:${L?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${h}</span> ${b}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${x}</span>
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
    `,e.querySelectorAll("#folder-list button").forEach(b=>{b.addEventListener("click",()=>{s=b.dataset.folder,i()})});let v=[...l];const u=Re({columns:[{key:"name",label:"File Name",render:b=>{let h="insert_drive_file";return b.type==="Invoice PDF"||b.type==="Quote PDF"||b.type==="PO PDF"?h="picture_as_pdf":b.type==="Digital Form"?h="assignment":b.type&&b.type.includes("image")&&(h="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${h}</span> <span class="font-medium truncate" style="max-width:300px" title="${f(b.name)}">${f(b.name)}</span></div>`}},{key:"folder",label:"Category",render:b=>f(b.folder||"—")},{key:"size",label:"Size",render:b=>b.size?(b.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:b=>{if(b.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let h="#";return b.entityType==="Job"?h=`#/jobs/${b.entityId}`:b.entityType==="Customer"?h=`#/people/${b.entityId}`:b.entityType==="Invoice"?h=`#/invoices/${b.entityId}`:b.entityType==="Quote"?h=`#/quotes/${b.entityId}`:b.entityType==="PO"&&(h=`#/purchase-orders/${b.entityId}`),`<span class="badge badge-neutral">${b.entityType}</span> <a href="${h}">${f(b.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:b=>b.uploadedAt?new Date(b.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:b=>b.url&&b.url.startsWith("#/")?`<a href="${f(b.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`:`<a href="#/document/view" target="_blank" class="btn btn-sm btn-outline btn-view-doc" data-doc-id="${f(b.id)}" style="text-decoration:none">View</a>`}],data:v,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:b=>{Je({container:e.querySelector(".main-wrapper")||e,selectedIds:b,onClear:()=>u.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:h=>{const L=y.filter(T=>T!=="All Documents"),x=document.createElement("div");x.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${L.map(T=>`<option value="${T}">${T}</option>`).join("")}
                    </select>
                  </div>
                `,we({title:`Move ${h.length} Documents`,content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Move",className:"btn-primary",onClick:T=>{const $=x.querySelector("#bulk-folder").value;h.forEach(g=>{c.getById("documents",g)&&c.update("documents",g,{folder:$})}),u.clearSelection(),i(),M(`Moved ${h.length} documents to ${$}`,"success"),T()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:h=>{we({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${h.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:L=>L()},{label:"Delete",className:"btn-danger",onClick:L=>{h.forEach(x=>c.delete("documents",x)),u.clearSelection(),i(),M(`Deleted ${h.length} documents`,"success"),L()}}]})}}]})}});e.querySelector("#docs-table-container").appendChild(u);const m=e.querySelector("#docs-search");function w(){const b=m.value.toLowerCase();v=l.filter(h=>h.name.toLowerCase().includes(b)||h.entityName&&h.entityName.toLowerCase().includes(b)||h.folder&&h.folder.toLowerCase().includes(b)),u.updateData(v)}m.addEventListener("input",w),e.querySelector("#docs-table-container").addEventListener("click",b=>{const h=b.target.closest(".btn-view-doc");if(h){const L=h.dataset.docId,x=l.find(T=>T.id===L);x&&localStorage.setItem("currentDocumentView",JSON.stringify({name:x.name,url:x.url,type:x.type}))}}),e.querySelector("#btn-upload-doc").addEventListener("click",()=>{const b=y.filter(L=>L!=="All Documents"),h=document.createElement("div");h.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${b.map(L=>`<option value="${L}">${L}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,we({title:"Upload Global Document",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:L=>L()},{label:"Upload",className:"btn-primary",onClick:L=>{const x=document.getElementById("upload-file-input"),T=document.getElementById("upload-folder").value;if(!x.files.length){M("Please select a file","error");return}const $=x.files[0],g=new FileReader;g.onload=q=>{c.create("documents",{name:$.name,type:$.type||"unknown",size:$.size,url:q.target.result,folder:T,uploadedAt:new Date().toISOString()}),M("Document uploaded successfully","success"),i(),L()},g.readAsDataURL($)}}]})})}i()}function ha(e){let s=null;try{const i=localStorage.getItem("currentDocumentView");i&&(s=JSON.parse(i))}catch(i){console.error("Failed to parse document data:",i)}if(!s||!s.url){e.innerHTML=`
      <div class="empty-state" style="padding: 40px; margin-top: 40px;">
        <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary);">error_outline</span>
        <h3>Document Not Found</h3>
        <p class="text-secondary">The requested document could not be loaded or the session expired.</p>
        <button class="btn btn-primary" onclick="window.close()" style="margin-top: 20px;">Close Tab</button>
      </div>
    `;return}const t=s.type&&s.type.startsWith("image/"),a=s.type==="application/pdf"||s.name.toLowerCase().endsWith(".pdf");e.innerHTML=`
    <div style="display: flex; flex-direction: column; height: 100vh; background: var(--bg-color);">
      <div class="page-header" style="background: var(--content-bg); border-bottom: 1px solid var(--border-color); padding: 12px 24px; margin: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: var(--bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
              <span class="material-icons-outlined" style="color: var(--color-primary);">${t?"image":a?"picture_as_pdf":"description"}</span>
            </div>
            <div>
              <h2 style="margin: 0; font-size: 16px;">${f(s.name||"View Document")}</h2>
              <div class="text-secondary" style="font-size: 12px;">Read-Only View</div>
            </div>
          </div>
          <div>
            <button class="btn btn-secondary btn-sm" onclick="window.close()">Close</button>
          </div>
        </div>
      </div>
      
      <div style="flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 24px;">
        ${t?`
          <img src="${f(s.url)}" style="max-width: 100%; max-height: 100%; box-shadow: var(--shadow-md); border-radius: 4px;" alt="${f(s.name)}" />
        `:a?`
          <iframe src="${f(s.url)}" style="width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
        `:`
          <div class="card" style="padding: 40px; text-align: center; max-width: 400px;">
            <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px;">description</span>
            <h4>Cannot preview this file type</h4>
            <p class="text-secondary" style="margin-bottom: 24px;">This file type (${f(s.type||"Unknown")}) cannot be previewed in the browser.</p>
            <a href="${f(s.url)}" download="${f(s.name)}" class="btn btn-primary">Download File</a>
          </div>
        `}
      </div>
    </div>
  `,setTimeout(()=>{const i=document.querySelector(".sidebar"),r=document.querySelector(".topbar"),p=document.getElementById("breadcrumb"),d=document.getElementById("main-content");i&&(i.style.display="none"),r&&(r.style.display="none"),p&&(p.style.display="none"),d&&(d.style.padding="0",d.style.height="100vh",d.style.overflow="hidden")},0);const o=()=>{const i=document.querySelector(".sidebar"),r=document.querySelector(".topbar"),p=document.getElementById("breadcrumb"),d=document.getElementById("main-content");i&&(i.style.display=""),r&&(r.style.display=""),p&&(p.style.display=""),d&&(d.style.padding="",d.style.height="",d.style.overflow=""),window.removeEventListener("hashchange",o)};window.addEventListener("hashchange",o)}Ts();window.__fieldForge={router:F,store:c};const ds=document.getElementById("app"),xa=Ot(),ut=document.createElement("div");ut.className="main-wrapper";const $a=Ut(),Dt=document.createElement("div");Dt.className="breadcrumb";Dt.id="breadcrumb";const tt=document.createElement("main");tt.className="main-content";tt.id="main-content";ut.appendChild($a);ut.appendChild(Dt);ut.appendChild(tt);ds.appendChild(xa);ds.appendChild(ut);function ye(e){return s=>{tt.innerHTML="",tt.scrollTop=0,e(tt,s)}}F.register("/login",ye(ya));F.register("/portal",ye(At));F.register("/",ye(js));F.register("/people",ye(Et));F.register("/people/new",ye((e,s)=>Yt(e,{id:"new"})));F.register("/people/:id",ye(Ys));F.register("/people/:id/edit",ye((e,s)=>Yt(e,s)));F.register("/contractors",ye(yt));F.register("/contractors/new",ye((e,s)=>is(e,{id:"new"})));F.register("/contractors/:id",ye(fa));F.register("/contractors/:id/edit",ye((e,s)=>is(e,s)));F.register("/leads",ye(It));F.register("/leads/new",ye((e,s)=>Kt(e,{id:"new"})));F.register("/leads/:id",ye(Ks));F.register("/leads/:id/edit",ye((e,s)=>Kt(e,s)));F.register("/notifications",ye(Xt));F.register("/quotes",ye(Lt));F.register("/quotes/new",ye((e,s)=>es(e,{id:"new"})));F.register("/quotes/:id",ye(es));F.register("/jobs",ye(qt));F.register("/jobs/new",ye((e,s)=>ts(e,{id:"new"})));F.register("/jobs/:id",ye(Zs));F.register("/jobs/:id/edit",ye((e,s)=>ts(e,s)));F.register("/timesheets",ye(ta));F.register("/assets",ye(ft));F.register("/assets/new",ye((e,s)=>ls(e,{id:"new"})));F.register("/assets/:id",ye(rs));F.register("/assets/:id/edit",ye((e,s)=>ls(e,s)));F.register("/schedule",ye(sa));F.register("/stock",ye(Ze));F.register("/stock/new",ye((e,s)=>ss(e,{id:"new"})));F.register("/stock/:id",ye(aa));F.register("/stock/:id/edit",ye((e,s)=>ss(e,s)));F.register("/invoices",ye(vt));F.register("/invoices/new",ye((e,s)=>as(e,{id:"new"})));F.register("/invoices/:id",ye(as));F.register("/purchase-orders",ye(et));F.register("/purchase-orders/:id",ye(oa));F.register("/documents",ye(ga));F.register("/document/view",ye(ha));F.register("/reports",ye(na));F.register("/settings",ye(ma));F.register("/settings/forms/new",ye((e,s)=>ns(e,{id:"new"})));F.register("/settings/forms/:id/edit",ye((e,s)=>ns(e,s)));const wa=["/","/people","/contractors","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings","/settings/forms"];F.onNavigate=(e,s)=>{const t=JSON.parse(localStorage.getItem("currentUser")||"null"),a=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];if(!t&&e!=="/login")return F.navigate("/login"),!1;if(t){if(t.role==="customer"&&wa.includes(a))return F.navigate("/portal"),!1;if(t.role!=="customer"&&a==="/portal")return F.navigate("/"),!1;if(t.role!=="admin"&&t.role!=="customer"&&t.userTypeId&&e!=="/login"){const o=c.getById("userTypes",t.userTypeId);if(o&&o.permissions){const i={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},r=i[a];if(r){let p=!1;if(e==="/jobs/new"&&!je("Jobs","create")&&(p=!0),e.endsWith("/edit")&&a==="/jobs"&&!je("Jobs","edit")&&(p=!0),e==="/quotes/new"&&!je("Quotes","create")&&(p=!0),p){const l=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/assets","/documents","/settings"].find(y=>{const v=i[y];if(v==="Notifications"||v==="Dashboard")return!0;const n=o.permissions.find(u=>u.module===v);return n&&Object.entries(n).some(([u,m])=>u!=="module"&&m===!0)})||"/";return F.navigate(l),!1}if(!(r==="Notifications"||r==="Dashboard")){const d=o.permissions.find(l=>l.module===r);if(!d||Object.entries(d||{}).every(([l,y])=>l==="module"||!y)){const y=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/assets","/documents","/settings"].find(v=>{const n=i[v];if(n==="Notifications"||n==="Dashboard")return!0;const u=o.permissions.find(m=>m.module===n);return u&&Object.entries(u).some(([m,w])=>m!=="module"&&w===!0)})||"/";if(a!==y)return F.navigate(y),!1}}}}}}Bt(e),Ns(e)};window.addEventListener("fieldforge-logout",()=>{localStorage.removeItem("currentUser");const e=document.querySelector(".sidebar"),s=document.querySelector(".topbar"),t=document.getElementById("breadcrumb");e&&(e.style.display="none"),s&&(s.style.display="none"),t&&(t.style.display="none"),F.navigate("/login")});const ka=JSON.parse(localStorage.getItem("currentUser")||"null");!ka&&window.location.hash!=="#/login"&&(window.location.hash="#/login");F.resolve();
