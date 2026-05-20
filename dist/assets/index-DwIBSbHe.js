(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))a(c);new MutationObserver(c=>{for(const n of c)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function t(c){const n={};return c.integrity&&(n.integrity=c.integrity),c.referrerPolicy&&(n.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?n.credentials="include":c.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(c){if(c.ep)return;c.ep=!0;const n=t(c);fetch(c.href,n)}})();class Ut{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(s,t){this.routes[s]=t}navigate(s){typeof window<"u"&&(window.location.hash=s)}resolve(s){let t=s||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const a=t.indexOf("?"),c={};if(a!==-1){const o=t.substring(a+1);t=t.substring(0,a),o.split("&").forEach(d=>{const[r,b]=d.split("=");r&&(c[r]=decodeURIComponent(b||""))})}const{handler:n,params:l}=this.matchRoute(t);if(n){this.currentRoute=t;const o={...l,...c};if(this.onNavigate&&this.onNavigate(t,o)===!1)return;n(o)}}matchRoute(s){if(this.routes[s])return{handler:this.routes[s],params:{}};for(const[t,a]of Object.entries(this.routes)){const c=t.split("/"),n=s.split("/");if(c.length!==n.length)continue;const l={};let o=!0;for(let d=0;d<c.length;d++)if(c[d].startsWith(":"))l[c[d].slice(1)]=n[d];else if(c[d]!==n[d]){o=!1;break}if(o)return{handler:a,params:l}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const B=new Ut,bs=Object.freeze(Object.defineProperty({__proto__:null,Router:Ut,router:B},Symbol.toStringTag,{value:"Module"})),bt="simpro_";class vs{constructor(){this.listeners={}}_key(s){return bt+s}getAll(s){try{const t=localStorage.getItem(this._key(s));return t?JSON.parse(t):[]}catch{return[]}}getById(s,t){return this.getAll(s).find(c=>c.id===t)||null}save(s,t){localStorage.setItem(this._key(s),JSON.stringify(t)),this.emit(s,t)}create(s,t){const a=this.getAll(s);return t.id=t.id||this.generateId(),t.createdAt=t.createdAt||new Date().toISOString(),t.updatedAt=new Date().toISOString(),a.push(t),this.save(s,a),t}update(s,t,a){const c=this.getAll(s),n=c.findIndex(l=>l.id===t);return n===-1?null:(c[n]={...c[n],...a,updatedAt:new Date().toISOString()},this.save(s,c),c[n])}delete(s,t){const c=this.getAll(s).filter(n=>n.id!==t);this.save(s,c)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const s={markupPercent:20,materialMarkup:{defaultPercent:30,minMarkupAmount:5,useTiers:!0,tiers:[{upTo:50,percent:60},{upTo:200,percent:45},{upTo:1e3,percent:30},{upTo:null,percent:15}]},materialCategories:["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],laborRates:[{id:"rate_1",name:"Standard Rate",rate:85,description:"Normal business hours Mon–Fri",overtimeMultiplier:1,minCallOutFee:0,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!0},{id:"rate_2",name:"After Hours Rate",rate:127.5,description:"Evenings and early mornings",overtimeMultiplier:1.5,minCallOutFee:45,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!1},{id:"rate_3",name:"Saturday Rate",rate:127.5,description:"Saturday work",overtimeMultiplier:1.5,minCallOutFee:65,applicableDays:["Sat"],isDefault:!1},{id:"rate_4",name:"Sunday Rate",rate:170,description:"Sunday and public holidays",overtimeMultiplier:2,minCallOutFee:85,applicableDays:["Sun","PH"],isDefault:!1},{id:"rate_5",name:"Emergency Rate",rate:195,description:"Urgent call-outs any day",overtimeMultiplier:2,minCallOutFee:120,applicableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],isDefault:!1}]};try{const t=localStorage.getItem(this._key("settings"));return t?JSON.parse(t):s}catch{return s}}saveSettings(s){localStorage.setItem(this._key("settings"),JSON.stringify(s)),this.emit("settings",s)}on(s,t){this.listeners[s]||(this.listeners[s]=[]),this.listeners[s].push(t)}off(s,t){this.listeners[s]&&(this.listeners[s]=this.listeners[s].filter(a=>a!==t))}emit(s,t){this.listeners[s]&&this.listeners[s].forEach(a=>a(t))}isSeeded(){return localStorage.getItem(bt+"_seeded")==="true"}markSeeded(){localStorage.setItem(bt+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(s=>s.startsWith(bt)).forEach(s=>localStorage.removeItem(s))}}const p=new vs,ys=Object.freeze(Object.defineProperty({__proto__:null,store:p},Symbol.toStringTag,{value:"Module"}));function Ee(e,s){const t=JSON.parse(localStorage.getItem("currentUser")||"null");if(!t)return!1;if(t.role==="admin")return!0;if(t.role==="customer")return!1;if(t.userTypeId){const a=p.getById("userTypes",t.userTypeId);if(a&&a.permissions){const c=a.permissions.find(n=>n.module===e);return c?!!c[s]:!1}}return t.role==="technician"?e==="Dashboard"?s==="view":e==="Jobs"?["view","manage_tasks","book_time"].includes(s):e==="Timesheets"?["view_own","create"].includes(s):e==="Schedule"?["view_own"].includes(s):!1:t.role==="manager"?e==="Settings"?["view","edit_company","manage_tax"].includes(s):!0:!1}const tt={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Tasklists"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs Tab"},{key:"view_quotes_tab",label:"View Quotes Tab"},{key:"view_pos_tab",label:"View POs Tab"},{key:"view_timesheets_tab",label:"View Timesheets Tab"},{key:"view_invoices_tab",label:"View Invoices Tab"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create / Submit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"edit_all",label:"Edit Any Timesheet"},{key:"export",label:"Export Timesheets"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Create Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View Full Schedule"},{key:"edit",label:"Manage Schedule (Drag/Drop)"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Create Contractors"},{key:"edit",label:"Edit Contractors"}],Stock:[{key:"view",label:"View Inventory"},{key:"create",label:"Create Stock Items"},{key:"edit",label:"Manage Stock Levels"},{key:"delete",label:"Delete Stock"}],"Purchase Orders":[{key:"view",label:"View POs"},{key:"create",label:"Create POs"},{key:"approve",label:"Approve POs"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"send",label:"Send Invoices"},{key:"void",label:"Void Invoices"}],Reports:[{key:"view",label:"Access Reports"},{key:"export",label:"Export Data"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Files"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Profile"},{key:"manage_users",label:"Manage Users & Permissions"},{key:"manage_tax",label:"Manage Tax & Finance"}]};function nt(e){return Object.entries(tt).map(([s,t])=>{const a={module:s};return t.forEach(({key:c})=>{a[c]=e(s,c)}),a})}function fs(){const e=p.getAll("userTypes");if(e&&e.length>0)return e;const s=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:nt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:nt((t,a)=>t==="Settings"?["view","edit_company","manage_tax"].includes(a):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:nt((t,a)=>t==="Dashboard"?a==="view":t==="Jobs"?["view","manage_tasks","book_time"].includes(a):t==="Timesheets"?["view_own","create"].includes(a):t==="Schedule"?["view_own"].includes(a):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:nt((t,a)=>t==="Settings"?!1:t==="Reports"?a==="view":!(["Invoices","Purchase Orders"].includes(t)&&a==="delete"))}];return p.save("userTypes",s),s}const gs=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],pt=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin",payRate:95},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager",payRate:85},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech",payRate:58},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech",payRate:62},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech",payRate:55},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office",payRate:42}],at=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],Ct=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],vt=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function Te(e){return e[Math.floor(Math.random()*e.length)]}function ze(e,s=0){const t=new Date,a=Math.floor(Math.random()*(e+s))-e;return new Date(t.getTime()+a*864e5).toISOString()}function Ve(e,s){return Math.round((Math.random()*(s-e)+e)*100)/100}function hs(){return gs.map((e,s)=>{const t=Te(Ct),a=Te(Ct);return{id:`cust_${s+1}`,company:e.company,firstName:e.first,lastName:e.last,email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${t}, ${Te(vt)}, VIC 3000`,status:Te(["Active","Active","Active","Inactive"]),type:Te(["Company","Company","Individual"]),notes:"",createdAt:ze(365),updatedAt:ze(30),sites:[{name:"Main Office",address:`${t}, ${Te(vt)}, VIC 3000`},{name:"Warehouse",address:`${a}, ${Te(vt)}, VIC 3001`}],contacts:[{name:`${e.first} ${e.last}`,role:"Primary",email:`${e.first.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${Te(["Alex","Sam","Jordan","Casey","Morgan"])} ${e.last}`,role:"Site Manager",email:`site@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function jt(){return[{id:"tmpl_elec_std",name:"Standard Electrical Inspection",description:"A comprehensive tasklist for residential or commercial electrical safety inspections.",tags:["Electrical","Maintenance","Compliance"],createdAt:new Date().toISOString(),tasks:[{id:"p1",name:"Main Board Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp1",name:"RCD Testing",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp2",name:"Terminal Tightness",estimatedHours:.5,people:1,status:"Not Started",progress:0}]},{id:"p2",name:"Circuit Testing",status:"Not Started",progress:0,subTasks:[{id:"sp3",name:"Insulation Resistance",estimatedHours:2,people:1,status:"Not Started",progress:0},{id:"sp4",name:"Earth Loop Impedance",estimatedHours:1.5,people:1,status:"Not Started",progress:0}]}]},{id:"tmpl_solar_maint",name:"Solar Panel Maintenance",description:"Annual maintenance checklist for PV solar systems.",tags:["Solar","Renewable","Maintenance"],createdAt:new Date().toISOString(),tasks:[{id:"p3",name:"Physical Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp5",name:"Module Cleaning",estimatedHours:3,people:2,status:"Not Started",progress:0},{id:"sp6",name:"Mounting Hardware Check",estimatedHours:1,people:1,status:"Not Started",progress:0}]},{id:"p4",name:"Electrical Performance",status:"Not Started",progress:0,subTasks:[{id:"sp7",name:"Inverter Diagnostics",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp8",name:"String Voltage Testing",estimatedHours:2,people:1,status:"Not Started",progress:0}]}]}]}function xs(e){const s=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],t=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(a,c)=>{const n=Te(e);return{id:`lead_${c+1}`,title:`${Te(at)} ${Te(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:n.id,customerName:n.company,contactName:`${n.firstName} ${n.lastName}`,status:Te(s),source:Te(t),value:Ve(500,25e3),description:`Potential ${Te(at).toLowerCase()} work for ${n.company}.`,priority:Te(["Low","Medium","High"]),createdAt:ze(90),updatedAt:ze(14)}})}function $s(e){const s=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(t,a)=>{const c=Te(e),n=Ve(200,5e3),l=Ve(100,8e3),o=(n+l)*.1;return{id:`quote_${a+1}`,number:`Q-${String(2024e3+a+1)}`,customerId:c.id,customerName:c.company,contactName:`${c.firstName} ${c.lastName}`,title:`${Te(at)} - ${Te(["Service Quote","Project Quote","Maintenance Quote"])}`,status:Te(s),lineItems:[{description:`${Te(at)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:Ve(65,120),total:n},{description:`${Te(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:Ve(15,200),total:l}],subtotal:n+l,tax:o,total:n+l+o,validUntil:ze(-30,60),notes:"",createdAt:ze(120),updatedAt:ze(14)}})}function ws(e,s){const t=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],a=["Low","Medium","High","Urgent"];return Array.from({length:20},(c,n)=>{var r;const l=Te(e),o=Te(pt),d=Te(t);return{id:`job_${n+1}`,number:`J-${String(1e5+n+1)}`,customerId:l.id,customerName:l.company,contactName:`${l.firstName} ${l.lastName}`,siteAddress:l.address||`${Te(Ct)}, ${Te(vt)}, VIC 3000`,title:`${Te(at)} - ${Te(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:Te(at),status:d,priority:Te(a),technicianId:o.id,technicianName:o.name,quoteId:n<s.length?(r=s[n])==null?void 0:r.id:null,scheduledDate:ze(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:Ve(200,4e3),materialCost:Ve(100,3e3),tasks:[{id:"p1",name:"Site Preparation",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Installation Phase",status:d==="Completed"||d==="Invoiced"?"Completed":d==="In Progress"?"In Progress":"Not Started",progress:d==="Completed"||d==="Invoiced"?100:d==="In Progress"?50:0,estimatedHours:12,people:2,subTasks:[{id:"sp3",name:"Main Installation",status:d==="Completed"||d==="Invoiced"?"Completed":d==="In Progress"?"In Progress":"Not Started",progress:d==="Completed"||d==="Invoiced"||d==="In Progress"?100:0,estimatedHours:8,people:2},{id:"sp4",name:"Final Commissioning",status:d==="Completed"||d==="Invoiced"?"Completed":"Not Started",progress:d==="Completed"||d==="Invoiced"?100:0,estimatedHours:4,people:2}]}],notes:"",createdAt:ze(90),updatedAt:ze(7)}})}function ks(e){const s=["Draft","Sent","Paid","Overdue","Void"],t=e.filter(a=>a.status==="Completed"||a.status==="Invoiced");return Array.from({length:Math.max(8,t.length)},(a,c)=>{const n=t[c]||Te(e),l=(n.laborCost||0)+(n.materialCost||0),o=l*.1;return{id:`inv_${c+1}`,number:`INV-${String(5e4+c+1)}`,jobId:n.id,jobNumber:n.number,customerId:n.customerId,customerName:n.customerName,contactName:n.contactName,status:Te(s),lineItems:[{description:`${n.title} - Labor`,amount:n.laborCost||Ve(200,4e3)},{description:`${n.title} - Materials`,amount:n.materialCost||Ve(100,3e3)}],subtotal:l,tax:o,total:l+o,invoiceType:"Standard",issueDate:ze(60),dueDate:ze(-14,30),paidDate:null,notes:"",createdAt:ze(60),updatedAt:ze(7)}})}function Ss(){return[{id:"fmt_1",name:"Job Safety Analysis (JSA)",description:"Daily safety assessment before starting work.",sections:[{id:"sec_1",title:"Personal Protective Equipment",fields:[{id:"f1",type:"checkbox",label:"Gloves worn?",required:!0},{id:"f2",type:"checkbox",label:"Safety Glasses worn?",required:!0},{id:"f3",type:"checkbox",label:"Steel Cap Boots worn?",required:!0}]},{id:"sec_2",title:"Site Hazards",fields:[{id:"f4",type:"select",label:"Overall Site Risk",options:["Low","Medium","High"],required:!0},{id:"f5",type:"textarea",label:"Identified Hazards",placeholder:"Describe any trip hazards, live wires, etc."}]},{id:"sec_3",title:"Authorization",fields:[{id:"f6",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"fmt_2",name:"Site Assessment",description:"Detailed site inspection and requirements.",sections:[{id:"sec_4",title:"Client Details",fields:[{id:"f7",type:"text",label:"Customer Rep Name"},{id:"f8",type:"date",label:"Inspection Date"}]},{id:"sec_5",title:"Access & Logistics",fields:[{id:"f9",type:"checkbox",label:"Access keys provided?"},{id:"f10",type:"textarea",label:"Parking / Entry Instructions"}]}]}]}function Ts(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((s,t)=>({id:`stock_${t+1}`,name:s.name,sku:`SKU-${String(1e3+t)}`,category:s.cat,unit:s.unit,unitPrice:s.price,costPrice:s.price*.6,quantity:Math.floor(Math.random()*200)+5,reorderLevel:Math.floor(Math.random()*20)+5,supplier:Te(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:Te(["Warehouse A","Warehouse B","Van Stock","On Order"]),createdAt:ze(365),updatedAt:ze(30)}))}function Cs(e){var t,a,c,n,l,o;return[{name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active"},{name:"Isuzu NPR Truck",type:"Vehicle",serial:"REG-888-FF",ownerType:"Business",recoveryRate:45,serviceIntervalMonths:6,currentMeter:12e4,status:"Active"},{name:"Scissor Lift 19ft",type:"Plant & Equipment",serial:"SN-SL-9920",ownerType:"Business",recoveryRate:15,serviceIntervalMonths:3,currentMeter:840,status:"Active"},{name:"Carrier Chiller Unit",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-CH-7721",ownerType:"Customer",customerId:e[0].id,site:(a=(t=e[0].sites)==null?void 0:t[0])==null?void 0:a.name,serviceIntervalMonths:12,currentMeter:15400,status:"Active"},{name:"Daikin Split System",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-DS-4410",ownerType:"Customer",customerId:e[1].id,site:(n=(c=e[1].sites)==null?void 0:c[0])==null?void 0:n.name,serviceIntervalMonths:12,currentMeter:3200,status:"Active"},{name:"Fire Alarm Panel v4",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-FP-2299",ownerType:"Customer",customerId:e[2].id,site:(o=(l=e[2].sites)==null?void 0:l[0])==null?void 0:o.name,serviceIntervalMonths:6,currentMeter:0,status:"Active"}].map((d,r)=>({id:`asset_${r+1}`,...d,logs:[{id:`log_${r}_1`,type:"Service",date:ze(90),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]}))}function Es(e){const s=[];return e.filter(a=>a.status==="Scheduled"||a.status==="In Progress").forEach((a,c)=>{const n=Math.floor(Math.random()*5),l=7+Math.floor(Math.random()*8),o=1+Math.floor(Math.random()*4),d=pt.find(r=>r.id===a.technicianId)||Te(pt);s.push({id:`sched_${c+1}`,jobId:a.id,jobNumber:a.number,title:a.title,technicianId:d.id,technicianName:d.name,color:d.color,dayOffset:n,startHour:l,endHour:Math.min(l+o,18),customerName:a.customerName,siteAddress:a.siteAddress})}),s}function Is(){var u,m,$,v,w,q,h,S,x,f,E,T;if(p.isSeeded()){const A=p.getAll("jobs");let I=!1;const j=A.map(k=>{let _=!1;function M(ne){const F={...ne};return"subPhases"in F?(F.subTasks=(F.subPhases||[]).map(J=>M(J)),delete F.subPhases,_=!0):F.subTasks&&(F.subTasks=F.subTasks.map(J=>M(J))),F}const V={...k};return"phases"in V?(V.tasks=(V.phases||[]).map(ne=>M(ne)),delete V.phases,_=!0):V.tasks&&(V.tasks=V.tasks.map(ne=>M(ne))),_&&(I=!0),V});I&&p.save("jobs",j);const U=p.getAll("taskTemplates");let P=!1;const O=U.map(k=>{let _=!1;function M(ne){const F={...ne};return"subPhases"in F?(F.subTasks=(F.subPhases||[]).map(J=>M(J)),delete F.subPhases,_=!0):F.subTasks&&(F.subTasks=F.subTasks.map(J=>M(J))),F}const V={...k};return"phases"in V?(V.tasks=(V.phases||[]).map(ne=>M(ne)),delete V.phases,_=!0):V.tasks&&(V.tasks=V.tasks.map(ne=>M(ne))),_&&(P=!0),V});P&&p.save("taskTemplates",O);const H=p.getAll("jobs");if(H.length>0&&!H[0].tasks){const k=H.map(_=>{const M=_.status;return{..._,tasks:[{id:"p1",name:"Site Preparation",status:M==="Pending"?"Not Started":"Completed",progress:M==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:M==="Pending"?"Not Started":"Completed",progress:M==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:M==="Pending"?"Not Started":"Completed",progress:M==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Project Execution",status:M==="Completed"||M==="Invoiced"?"Completed":M==="In Progress"?"In Progress":"Not Started",progress:M==="Completed"||M==="Invoiced"?100:M==="In Progress"?50:0,estimatedHours:16,people:2,subTasks:[{id:"sp3",name:"Installation",status:M==="Completed"||M==="Invoiced"?"Completed":M==="In Progress"?"In Progress":"Not Started",progress:M==="Completed"||M==="Invoiced"||M==="In Progress"?100:0,estimatedHours:12,people:2},{id:"sp4",name:"Cleanup & Handover",status:M==="Completed"||M==="Invoiced"?"Completed":"Not Started",progress:M==="Completed"||M==="Invoiced"?100:0,estimatedHours:4,people:2}]}]}});p.save("jobs",k)}const D=p.getAll("userTypes");if(!D||D.length===0)fs();else{D.some(M=>M.id==="ut_office")||(D.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:nt((M,V)=>M==="Settings"?!1:M==="Reports"?V==="view":!(["Invoices","Purchase Orders"].includes(M)&&V==="delete"))}),p.save("userTypes",D));let _=!1;D.forEach(M=>{M.permissions||(M.permissions=[]),Object.entries(tt).forEach(([V,ne])=>{let F=M.permissions.find(J=>J.module===V);F||(F={module:V},M.permissions.push(F),_=!0),ne.forEach(({key:J})=>{F[J]===void 0&&(M.id==="ut_admin"?F[J]=!0:M.id==="ut_manager"?V==="Settings"?F[J]=["view","edit_company","manage_tax"].includes(J):F[J]=!0:M.id==="ut_office"?V==="Settings"?F[J]=!1:V==="Reports"?F[J]=J==="view":["Invoices","Purchase Orders"].includes(V)&&J==="delete"?F[J]=!1:F[J]=!0:M.id==="ut_tech"?V==="Dashboard"?F[J]=J==="view":V==="Jobs"?F[J]=["view","manage_tasks","book_time"].includes(J):V==="Timesheets"?F[J]=["view_own","create"].includes(J):V==="Schedule"?F[J]=["view_own"].includes(J):F[J]=!1:F[J]=!1,_=!0)})})}),_&&p.save("userTypes",D)}const L=p.getAll("technicians"),N=p.getAll("userTypes");if(L.length>0&&N.length>0){const k=L[0];N.some(M=>M.id===k.userTypeId)||p.save("technicians",pt)}const C=p.getAll("taskTemplates");(!C||C.length===0)&&p.save("taskTemplates",jt());return}const e=hs(),s=xs(e),t=$s(e),a=ws(e,t),c=ks(a),n=Ts(),l=Cs(e),o=Es(a),d=Ss();p.save("customers",e),p.save("leads",s),p.save("quotes",t),p.save("jobs",a),p.save("invoices",c),p.save("stock",n),p.save("assets",l),p.save("schedule",o),p.save("technicians",pt),p.save("taskTemplates",jt()),p.save("formTemplates",d),p.save("formInstances",[]);const r=new Date,b=A=>A.toString().padStart(2,"0");function y(A){const I=new Date(r);return I.setDate(I.getDate()+A),`${I.getFullYear()}-${b(I.getMonth()+1)}-${b(I.getDate())}`}const i=[{id:"act_1",title:"Follow up on quote approval",type:"follow-up",date:y(0),time:"09:00",duration:15,priority:"high",status:"pending",assignedToId:"tech1",linkedType:"quote",linkedId:((u=t[0])==null?void 0:u.id)||"",linkedLabel:`Quote ${((m=t[0])==null?void 0:m.number)||""}`,notes:"Client requested revised pricing on switchboard section."},{id:"act_2",title:"Site inspection — Docklands",type:"site-visit",date:y(0),time:"13:00",duration:120,priority:"normal",status:"pending",assignedToId:"tech3",linkedType:"job",linkedId:(($=a[0])==null?void 0:$.id)||"",linkedLabel:`Job ${((v=a[0])==null?void 0:v.number)||""}`,notes:"Confirm conduit runs before ceiling close-in."},{id:"act_3",title:"Call supplier re: panel delivery",type:"call",date:y(-1),time:"10:30",duration:10,priority:"normal",status:"completed",assignedToId:"tech2",linkedType:"",linkedId:"",linkedLabel:"",notes:"Confirmed delivery for Friday."},{id:"act_4",title:"Team safety meeting",type:"meeting",date:y(1),time:"07:30",duration:30,priority:"normal",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:"Monthly toolbox talk — fire extinguisher training."},{id:"act_5",title:"Email updated scope to client",type:"email",date:y(0),time:"15:00",duration:15,priority:"low",status:"pending",assignedToId:"tech6",linkedType:"customer",linkedId:((w=e[1])==null?void 0:w.id)||"",linkedLabel:((q=e[1])==null?void 0:q.company)||"",notes:""},{id:"act_6",title:"Chase overdue invoice",type:"call",date:y(-2),time:"11:00",duration:10,priority:"high",status:"pending",assignedToId:"tech6",linkedType:"invoice",linkedId:((h=c[0])==null?void 0:h.id)||"",linkedLabel:`Invoice ${((S=c[0])==null?void 0:S.number)||""}`,notes:"60 days overdue. Escalate if no response."},{id:"act_7",title:"Pre-start meeting with builder",type:"meeting",date:y(2),time:"08:00",duration:60,priority:"normal",status:"pending",assignedToId:"tech2",linkedType:"job",linkedId:((x=a[1])==null?void 0:x.id)||"",linkedLabel:`Job ${((f=a[1])==null?void 0:f.number)||""}`,notes:"Coordinate access and power isolation with site foreman."},{id:"act_8",title:"Order fire panel spares",type:"task",date:y(1),time:"",duration:0,priority:"normal",status:"pending",assignedToId:"tech4",linkedType:"",linkedId:"",linkedLabel:"",notes:"Need 3x zone cards and 1x PSU."},{id:"act_9",title:"Review apprentice logbook",type:"task",date:y(3),time:"",duration:0,priority:"low",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:""},{id:"act_10",title:"Warranty follow-up call",type:"call",date:y(-3),time:"14:00",duration:15,priority:"normal",status:"completed",assignedToId:"tech5",linkedType:"customer",linkedId:((E=e[2])==null?void 0:E.id)||"",linkedLabel:((T=e[2])==null?void 0:T.company)||"",notes:"Issue resolved. Replacement sensor installed."}];p.save("activities",i),p.markSeeded()}const Ls=[{section:"MAIN"},{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{section:"WORKFLOW"},{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"},{section:"RESOURCES"},{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"},{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{section:"ANALYTICS"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{section:"SYSTEM"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}];function Vt(){const e=document.createElement("aside");e.className="sidebar",e.id="sidebar";const s=localStorage.getItem("simpro_sidebar_expanded")==="true";s&&e.classList.add("expanded");const t=p.getSettings();let c=`
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
  `;JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),Ls.forEach(i=>{i.section?c+=`<div class="sidebar-section-label" data-section="${i.section}">${i.section}</div>`:c+=`
        <button class="sidebar-nav-item" data-path="${i.path}" data-id="${i.id}" id="nav-${i.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${i.icon}</span></span>
          <span class="nav-label">${i.label}</span>
        </button>
      `}),c+=`
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
  `,e.innerHTML=c,e.addEventListener("click",i=>{const u=i.target.closest(".sidebar-nav-item");if(u&&u.id!=="btn-logout"){const m=u.dataset.path;m&&B.navigate(m)}}),e.querySelector("#sidebar-logo").addEventListener("click",()=>B.navigate("/")),e.querySelector("#sidebar-toggle").addEventListener("click",()=>As(e));const o=e.querySelector("#sidebar-nav"),d=e.querySelector("#sidebar-scroll-up"),r=e.querySelector("#sidebar-scroll-down"),b=()=>{if(e.classList.contains("expanded")){d.classList.remove("visible"),r.classList.remove("visible");return}const{scrollTop:i,scrollHeight:u,clientHeight:m}=o;d.classList.toggle("visible",i>0),r.classList.toggle("visible",Math.ceil(i+m)<u)};o.addEventListener("scroll",b),d.addEventListener("click",()=>{o.scrollBy({top:-100,behavior:"smooth"})}),r.addEventListener("click",()=>{o.scrollBy({top:100,behavior:"smooth"})}),setTimeout(b,100);const y=e.querySelector("#btn-logout");return y&&y.addEventListener("click",i=>{i.stopPropagation(),window.dispatchEvent(new CustomEvent("fieldforge-logout"))}),window.addEventListener("simpro-settings-updated",()=>{const i=p.getSettings(),u=e.querySelector("#sidebar-logo");i.logo?u.innerHTML=`
        <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
          <img src="${i.logo}" class="custom-logo" style="max-height: 28px; max-width: ${e.classList.contains("expanded")?"140px":"32px"}; object-fit: contain;" />
          <span class="logo-text" style="${e.classList.contains("expanded")?"display: block;":"display: none;"}">${i.name||"FieldForge"}</span>
        </div>
      `:u.innerHTML=`
        <div class="logo-icon">F</div>
        <span class="logo-text">FieldForge</span>
      `}),e}function qs(e){const s=e||document.getElementById("sidebar");if(!s)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');if(t.role==="customer")s.style.display="none";else{s.style.display="";let a=null;if(t.userTypeId){const o=p.getById("userTypes",t.userTypeId);o&&o.permissions&&(a=o.permissions)}s.querySelectorAll(".sidebar-nav-item").forEach(o=>{if(o.id==="btn-logout"){o.style.display="";return}const d=o.querySelector(".nav-label");if(!d)return;const r=d.textContent.trim();if(t.role==="admin"){o.style.display="";return}if(a){const b=a.find(i=>i.module===r);b&&Object.entries(b).some(([i,u])=>i!=="module"&&u===!0)||r==="Notifications"||r==="Dashboard"?o.style.display="":o.style.display="none"}else(r==="Settings"||r==="Reports"||r==="Invoices")&&(o.style.display="none")}),s.querySelectorAll(".sidebar-section-label").forEach(o=>{let d=!1,r=o.nextElementSibling;for(;r&&r.classList.contains("sidebar-nav-item");){if(r.style.display!=="none"){d=!0;break}r=r.nextElementSibling}o.style.display=d?"":"none"});const c=s.querySelector("#sidebar-nav"),n=s.querySelector("#sidebar-scroll-up"),l=s.querySelector("#sidebar-scroll-down");if(c&&n&&l&&!s.classList.contains("expanded")){const{scrollTop:o,scrollHeight:d,clientHeight:r}=c;n.classList.toggle("visible",o>0),l.classList.toggle("visible",Math.ceil(o+r)<d)}}}function As(e){e.classList.toggle("expanded");const s=e.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",s);const t=e.querySelector("#sidebar-toggle-icon");t.textContent=s?"chevron_left":"chevron_right";const a=e.querySelector(".custom-logo"),c=e.querySelector(".logo-text");a&&(a.style.maxWidth=s?"140px":"32px"),c&&(c.style.display=s?"block":"none");const n=e.querySelector("#sidebar-nav"),l=e.querySelector("#sidebar-scroll-up"),o=e.querySelector("#sidebar-scroll-down");if(n&&l&&o)if(s)l.classList.remove("visible"),o.classList.remove("visible");else{const{scrollTop:d,scrollHeight:r,clientHeight:b}=n;l.classList.toggle("visible",d>0),o.classList.toggle("visible",Math.ceil(d+b)<r)}}function Qt(e){const s=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(t=>{t.classList.toggle("active",t.dataset.path===s)})}const zt=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:Vt,updateSidebarAccess:qs,updateSidebarActive:Qt},Symbol.toStringTag,{value:"Module"}));function Wt(){const e=document.createElement("header");e.className="topbar",e.id="topbar",e.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${Yt()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const s=e.querySelector("#global-search");let t;s.addEventListener("input",o=>{clearTimeout(t),t=setTimeout(()=>{const d=o.target.value.trim();d.length>=2?Ns(d):ht()},300)}),s.addEventListener("blur",()=>{setTimeout(ht,200)}),e.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const d=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",d),localStorage.setItem("simpro_theme",d),e.querySelector("#theme-icon").textContent=d==="dark"?"light_mode":"dark_mode"}),Ps();const c=e.querySelector("#btn-notifications"),n=e.querySelector(".notification-dot");function l(){p.getAll("notifications").filter(r=>!r.read).length>0?n.style.display="block":n.style.display="none"}return p.on("notifications",l),l(),c.addEventListener("click",o=>{o.stopPropagation(),Ds(c)}),Gt(e),e}function Gt(e){const s=e||document.getElementById("topbar");if(!s)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),a=s.querySelector("#topbar-name"),c=s.querySelector("#topbar-role"),n=s.querySelector("#topbar-avatar");if(a&&(a.textContent=t.name||"Unknown User"),c){let l=t.userTypeName;if(!l&&t.userTypeId){const o=p.getById("userTypes",t.userTypeId);o&&(l=o.name)}l||(l={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[t.role]||t.role),c.textContent=l}if(n){const o=(t.name||"").split(" ").map(d=>d[0]).join("").substring(0,2).toUpperCase()||"U";n.textContent=o}}function Ds(e){let s=document.querySelector("#notifications-dropdown");if(s){s.remove();return}const t=p.getAll("notifications").sort((l,o)=>new Date(o.createdAt)-new Date(l.createdAt));s=document.createElement("div"),s.className="dropdown-menu",s.id="notifications-dropdown",s.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const a=document.createElement("div");a.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",a.innerHTML='<h4 style="margin:0">Notifications</h4>';const c=document.createElement("button");c.className="btn btn-ghost btn-sm",c.textContent="Mark all as read",c.onclick=()=>{const l=p.getAll("notifications");let o=!1;l.forEach(d=>{d.read||(d.read=!0,d.updatedAt=new Date().toISOString(),o=!0)}),o&&p.save("notifications",l),s.remove()},a.appendChild(c),s.appendChild(a),t.length===0?s.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':t.forEach(l=>{const o=document.createElement("div");o.className="dropdown-item",o.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${l.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,o.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${l.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${l.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(l.createdAt).toLocaleString()}</div>
        </div>
      `,o.addEventListener("click",()=>{if(p.update("notifications",l.id,{read:!0}),l.link){const{router:d}=window.__fieldForge||{};d&&d.navigate(l.link)}s.remove()}),s.appendChild(o)}),e.parentNode.style.position="relative",e.parentNode.appendChild(s);const n=l=>{!s.contains(l.target)&&l.target!==e&&!e.contains(l.target)&&(s.remove(),document.removeEventListener("click",n))};document.addEventListener("click",n)}function Ns(e){ht();const{store:s}=window.__fieldForge||{};if(!s)return;const t=[],a=e.toLowerCase();if(s.getAll("customers").forEach(n=>{(n.company.toLowerCase().includes(a)||`${n.firstName} ${n.lastName}`.toLowerCase().includes(a))&&t.push({type:"Customer",label:n.company,icon:"people",path:`/people/${n.id}`})}),s.getAll("jobs").forEach(n=>{(n.number.toLowerCase().includes(a)||n.title.toLowerCase().includes(a)||n.customerName.toLowerCase().includes(a))&&t.push({type:"Job",label:`${n.number} — ${n.title}`,icon:"build",path:`/jobs/${n.id}`})}),s.getAll("quotes").forEach(n=>{var l;(n.number.toLowerCase().includes(a)||(l=n.title)!=null&&l.toLowerCase().includes(a)||n.customerName.toLowerCase().includes(a))&&t.push({type:"Quote",label:`${n.number} — ${n.customerName}`,icon:"request_quote",path:`/quotes/${n.id}`})}),s.getAll("invoices").forEach(n=>{(n.number.toLowerCase().includes(a)||n.customerName.toLowerCase().includes(a))&&t.push({type:"Invoice",label:`${n.number} — ${n.customerName}`,icon:"receipt_long",path:`/invoices/${n.id}`})}),t.length===0)return;const c=document.createElement("div");c.className="dropdown-menu",c.id="search-results",c.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",t.slice(0,12).forEach(n=>{const l=document.createElement("button");l.className="dropdown-item",l.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${n.icon}</span>
      <span style="flex:1" class="truncate">${n.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${n.type}</span>
    `,l.addEventListener("click",()=>{const{router:o}=window.__fieldForge||{};o&&o.navigate(n.path),ht(),document.querySelector("#global-search").value=""}),c.appendChild(l)}),document.querySelector(".topbar-search").appendChild(c)}function ht(){const e=document.querySelector("#search-results");e&&e.remove()}function Yt(){return localStorage.getItem("simpro_theme")||"light"}function Ps(){Yt()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const _t=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:Wt,updateTopbarAccess:Gt},Symbol.toStringTag,{value:"Module"})),Ms={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function js(e){const s=document.getElementById("breadcrumb");if(!s)return;if(e==="/"){s.style.display="none";return}s.style.display="flex";const t=e.split("/").filter(Boolean);let a=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,c="";t.forEach((n,l)=>{c+="/"+n;const o=l===t.length-1,d=Ms[c]||decodeURIComponent(n);a+='<span class="breadcrumb-separator">›</span>',o?a+=`<span class="breadcrumb-item current">${d}</span>`:a+=`<span class="breadcrumb-item" data-path="${c}">${d}</span>`}),s.innerHTML=a,s.querySelectorAll(".breadcrumb-item[data-path]").forEach(n=>{n.addEventListener("click",()=>{const{router:l}=window.__fieldForge||{};l&&l.navigate(n.dataset.path)})})}function Ye(e){const s=document.getElementById("breadcrumb");if(!s)return;const t=s.querySelector(".breadcrumb-item.current");t&&(t.textContent=e)}const zs="modulepreload",_s=function(e){return"/"+e},Ft={},fe=function(s,t,a){let c=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),o=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));c=Promise.allSettled(t.map(d=>{if(d=_s(d),d in Ft)return;Ft[d]=!0;const r=d.endsWith(".css"),b=r?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${b}`))return;const y=document.createElement("link");if(y.rel=r?"stylesheet":zs,r||(y.as="script"),y.crossOrigin="",y.href=d,o&&y.setAttribute("nonce",o),document.head.appendChild(y),r)return new Promise((i,u)=>{y.addEventListener("load",i),y.addEventListener("error",()=>u(new Error(`Unable to preload CSS for ${d}`)))})}))}function n(l){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=l,window.dispatchEvent(o),!o.defaultPrevented)throw l}return c.then(l=>{for(const o of l||[])o.status==="rejected"&&n(o.reason);return s().catch(n)})};function kt(e,s){if(!e||e<=0)return 0;const t=s.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]};let a=t.defaultPercent||30;if(t.useTiers&&t.tiers&&t.tiers.length>0){const l=t.tiers.find(o=>o.upTo===null||e<=o.upTo);l&&(a=l.percent)}const c=e*(a/100),n=Math.max(c,t.minMarkupAmount||0);return e+n}function Kt(e,s){return e.reduce((t,a)=>{const c=kt(a.unitCost||0,s);return t+c*(a.quantity||1)},0)}function Et(){const e=Ee("Jobs","create"),s=Ee("Quotes","create");let t="";return e&&(t+=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>`),s&&(t+=`
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`),t}let Be=!1;const lt={S:"module-s",M:"module-m",L:"module-l",XL:"module-xl"},rt={standard:"",tall:"module-tall",xtall:"module-xtall"};function xt(){const e=JSON.parse(localStorage.getItem("currentUser")||"null");return e?`dashboardLayout_v2_${e.id}`:"dashboardLayout_v2"}const $t={"kpi-cards":{title:"KPI Cards",defaultW:"XL",defaultH:"standard",widths:["M","L","XL"],heights:["standard"],kpiStrip:!0,render:Rs},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Bs},"tech-map":{title:"Technician Map",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Js},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Us},"recent-leads":{title:"Recent Leads",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Vs},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Qs},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:Gs},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>_e("inventory","Inventory looks good")},"profitability-chart":{title:"Projected Profitability",defaultW:"L",defaultH:"tall",widths:["L","XL"],heights:["tall","xtall"],render:Ys},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("schedule","No timesheet alerts")},"asset-status":{title:"Asset Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("precision_manufacturing","All assets operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>_e("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>_e("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>_e("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>_e("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>_e("wb_sunny","Sunny, 24°C")}},Xt=[{id:"kpi-cards",w:"XL",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"M",h:"tall"},{id:"recent-leads",w:"M",h:"tall"},{id:"cash-flow",w:"M",h:"standard"}];function _e(e,s){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${e}</span>
    <span style="font-size:13px;">${s}</span>
  </div>`}function Fs(e){let s=JSON.parse(JSON.stringify(Xt));try{const c=localStorage.getItem(xt());c&&(s=JSON.parse(c))}catch{}s.forEach(c=>{c.instanceId||(c.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const t={jobs:p.getAll("jobs"),quotes:p.getAll("quotes"),invoices:p.getAll("invoices"),leads:p.getAll("leads"),people:p.getAll("people")};e.innerHTML=`
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          ${Et()}
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;const a=e.querySelector("#dashboard-grid");Qe(a,s,t),e.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{Be=!0,Qe(a,s,t),Os(e,a,s,t)})}function Qe(e,s,t){e.innerHTML="",s.forEach(a=>{const c=$t[a.id];if(!c)return;const n=lt[a.w]||"module-m",l=rt[a.h]||"",o=["dashboard-module",n,l,Be?"edit-mode":""].filter(Boolean).join(" "),d=c.widths.length>1,r=c.heights.length>1,b=Be?`
      ${d?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${r?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${d&&r?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",y=`
      <div style="display:flex;align-items:center;gap:4px;">
        ${c.configurable?`
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${a.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${Be?"":"opacity:0.5;"}">settings</span>
          </button>
        `:""}
        ${Be?`
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${a.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>
        `:""}
      </div>`,i=Be?"background:rgba(27,109,224,0.04);":"";e.insertAdjacentHTML("beforeend",`
      <div class="${o}" data-instance-id="${a.instanceId}" data-id="${a.id}" style="position:relative;">
        <div class="card ${c.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${i}">
            <span style="font-weight:600;font-size:14px;">${c.title}</span>
            ${y}
          </div>
          <div class="card-body">${c.render(t,a)}</div>
        </div>
        ${b}
      </div>`)}),Hs(e,s,t),Be&&It(e,s,t)}function Hs(e,s,t){e.querySelectorAll(".btn-configure").forEach(a=>{a.addEventListener("click",c=>{const n=c.currentTarget.dataset.instanceId,l=s.find(d=>d.instanceId===n);if(l&&l.id==="pinned-job"){let b=function(y=""){const i=r.querySelector("#job-list-container"),u=d.filter(m=>m.number.toLowerCase().includes(y.toLowerCase())||m.title.toLowerCase().includes(y.toLowerCase())||m.customerName.toLowerCase().includes(y.toLowerCase()));i.innerHTML=u.length>0?u.map(m=>`
            <div class="job-option" data-job-id="${m.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${m.number} - ${m.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${m.customerName}</div>
            </div>
          `).join(""):'<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>',i.querySelectorAll(".job-option").forEach(m=>{m.addEventListener("click",()=>{var $;l.config={...l.config,jobId:m.dataset.jobId},Be||localStorage.setItem(xt(),JSON.stringify(s)),($=document.querySelector(".modal-overlay"))==null||$.remove(),Qe(e,s,t)})})};var o=b;const d=t.jobs,r=document.createElement("div");r.innerHTML=`
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..." 
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            <!-- Jobs will be rendered here -->
          </div>
        `,b(),r.querySelector("#job-search").addEventListener("input",y=>{b(y.target.value)}),fe(async()=>{const{showModal:y}=await Promise.resolve().then(()=>je);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:"Select Job to Pin",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()}]})})}})})}function It(e,s,t){e.querySelectorAll(".btn-remove").forEach(a=>{a.addEventListener("click",c=>{const n=c.currentTarget.dataset.instanceId,l=s.findIndex(o=>o.instanceId===n);l!==-1&&(s.splice(l,1),Qe(e,s,t))})}),window.Sortable&&!e.sortableInstance&&(e.sortableInstance=new window.Sortable(e,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const a=Array.from(e.children).map(n=>n.dataset.instanceId),c=[];a.forEach(n=>{const l=s.find(o=>o.instanceId===n);l&&c.push(l)}),s.splice(0,s.length,...c)}})),e.sortableInstance&&e.sortableInstance.option("disabled",!1),e.querySelectorAll(".resize-handle").forEach(a=>{a.addEventListener("mousedown",c=>{c.preventDefault(),c.stopPropagation();const n=c.target.closest(".dashboard-module"),l=n.dataset.instanceId,o=s.find(x=>x.instanceId===l),d=$t[o==null?void 0:o.id];if(!o||!d)return;const r=c.target.closest(".resize-handle"),b=r&&(r.classList.contains("resize-r")||r.classList.contains("resize-br")),y=r&&(r.classList.contains("resize-b")||r.classList.contains("resize-br"));let i=c.clientX,u=c.clientY,m=0,$=0;const v=60,w=["S","M","L","XL"].filter(x=>d.widths.includes(x)),q=["standard","tall","xtall"].filter(x=>d.heights.includes(x));function h(x){if(b){if(m+=x.clientX-i,m>v){let f=w.indexOf(o.w);f<w.length-1&&(o.w=w[f+1],n.className=["dashboard-module",lt[o.w]||"module-m",rt[o.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}else if(m<-v){let f=w.indexOf(o.w);f>0&&(o.w=w[f-1],n.className=["dashboard-module",lt[o.w]||"module-m",rt[o.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}}if(y){if($+=x.clientY-u,$>v){let f=q.indexOf(o.h);f<q.length-1&&(o.h=q[f+1],n.className=["dashboard-module",lt[o.w]||"module-m",rt[o.h]||"","edit-mode"].filter(Boolean).join(" ")),$=0}else if($<-v){let f=q.indexOf(o.h);f>0&&(o.h=q[f-1],n.className=["dashboard-module",lt[o.w]||"module-m",rt[o.h]||"","edit-mode"].filter(Boolean).join(" ")),$=0}}i=x.clientX,u=x.clientY}function S(){document.removeEventListener("mousemove",h),document.removeEventListener("mouseup",S),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",h),document.addEventListener("mouseup",S),document.body.style.cursor=window.getComputedStyle(c.target).cursor,document.body.style.userSelect="none"})})}function Os(e,s,t,a){const c=e.querySelector("#dashboard-header-actions"),n=e.querySelector("#btn-edit-dashboard");n.style.display="none",c.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,c.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(t.splice(0,t.length,...JSON.parse(JSON.stringify(Xt))),Qe(s,t,a),It(s,t,a))}),c.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(xt(),JSON.stringify(t)),Be=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),n.style.display="",c.innerHTML=Et(),Qe(s,t,a)}),c.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const l=localStorage.getItem(xt());l&&t.splice(0,t.length,...JSON.parse(l))}catch{}Be=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),n.style.display="",c.innerHTML=Et(),Qe(s,t,a)}),c.querySelector("#btn-add-widget").addEventListener("click",()=>{const l=Object.entries($t),o=document.createElement("div");o.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${l.map(([d,r])=>`
            <div data-id="${d}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${r.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${r.defaultW} · ${r.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,fe(async()=>{const{showModal:d}=await Promise.resolve().then(()=>je);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:"Add Widget",content:o,actions:[{label:"Close",className:"btn-secondary",onClick:r=>r()}]}),o.querySelectorAll("[data-id]").forEach(r=>{r.addEventListener("click",b=>{var u;const y=b.currentTarget.dataset.id,i=$t[y];t.push({id:y,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:i.defaultW,h:i.defaultH}),(u=document.querySelector(".modal-overlay"))==null||u.remove(),Qe(s,t,a),It(s,t,a)})})})})}function Rs(e,s){const t=e.jobs.filter(l=>l.status==="In Progress"||l.status==="Scheduled").length,a=e.quotes.filter(l=>l.status==="Sent"||l.status==="Draft").length,c=e.invoices.filter(l=>l.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+e.invoices.filter(l=>l.status==="Paid").reduce((l,o)=>l+(o.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:t,icon:"build",color:"green",sub:`${e.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:a,icon:"request_quote",color:"orange",sub:`${e.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:c,icon:"warning",color:"red",sub:c>0?"Requires attention":"All on track",pos:c===0}].map(l=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${l.label}</div>
        <div class="stat-icon ${l.color}"><span class="material-icons-outlined">${l.icon}</span></div>
      </div>
      <div class="stat-value">${l.value}</div>
      <div class="stat-change ${l.pos===!0?"positive":l.pos===!1?"negative":""}">
        <span style="font-size:12px;">${l.sub}</span>
      </div>
    </div>`).join("")}function Bs(e,s){const t={};e.jobs.forEach(n=>{t[n.status]=(t[n.status]||0)+1});const a=e.jobs.length||1,c={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(t).map(([n,l])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${n}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(l/a*100).toFixed(1)}%;height:100%;background:${c[n]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${l>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${l}</span>
      </div>`).join("")}
  </div>`}function Js(e,s){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${e.people.filter(c=>c.type==="Staff").slice(0,4).map((c,n)=>{const l=15+n*22+Math.sin(n)*12,o=15+n*18+Math.cos(n)*18;return`<div style="position:absolute;top:${l}%;left:${o}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${c.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${c.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function Us(e,s){const t=[];return e.jobs.slice(0,4).forEach(a=>t.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${a.number}</strong> — ${a.title}`,sub:a.customerName,time:a.updatedAt})),e.quotes.slice(0,3).forEach(a=>t.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${a.number}</strong> ${a.status.toLowerCase()}`,sub:a.customerName,time:a.updatedAt})),e.invoices.slice(0,2).forEach(a=>t.push({icon:"receipt_long",color:a.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${a.number}</strong> — ${a.status}`,sub:a.customerName,time:a.updatedAt})),t.sort((a,c)=>new Date(c.time)-new Date(a.time)),t.map(a=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${a.color}20;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${a.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.sub} · ${Ws(a.time)}</div>
      </div>
    </div>`).join("")}function Vs(e,s){const t={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${e.leads.slice(0,8).map(a=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${a.id}'">
        <td class="cell-link font-medium">${a.title}</td>
        <td style="color:var(--text-secondary);">${a.customerName}</td>
        <td><span class="badge ${t[a.status]||"badge-neutral"}">${a.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function Qs(e,s){const t=e.jobs.filter(a=>a.status==="Scheduled"||a.status==="In Progress").slice(0,8);return t.length?t.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${a.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${a.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.technicianName} · ${a.customerName}</div>
      </div>
      <span class="badge ${a.status==="In Progress"?"badge-primary":"badge-warning"}">${a.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function Ws(e){const s=Math.floor((Date.now()-new Date(e))/6e4);if(s<60)return`${s}m ago`;const t=Math.floor(s/60);return t<24?`${t}h ago`:`${Math.floor(t/24)}d ago`}function Gs(e,s){var r;const t=(r=s.config)==null?void 0:r.jobId;if(!t)return _e("push_pin","Click settings to pin a job");const a=e.jobs.find(b=>b.id===t);if(!a)return _e("warning","Job not found");function c(b,y=0){let i=[];return b&&b.forEach(u=>{const m=u.subTasks&&u.subTasks.length>0||u.subPhases&&u.subPhases.length>0;i.push({...u,depth:y,isParent:m}),m&&(i=i.concat(c(u.subTasks||u.subPhases,y+1)))}),i}const n=a.tasks||a.phases||[],l=c(n),o=l.length;let d=0;if(n.length>0){const b=n.reduce((y,i)=>y+(i.progress||0),0);d=Math.round(b/n.length)}return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${a.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${d}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${d}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${o>0?l.map(b=>{const y=b.progress===100;return`
          <div style="display:flex;align-items:center;gap:8px;padding-left:${b.depth*14}px; opacity:${!b.isParent&&y?.6:1}">
            ${b.isParent?'<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>':`<span class="material-icons-outlined" style="font-size:16px;color:${y?"var(--color-success)":"var(--text-tertiary)"};">
                ${y?"check_circle":"radio_button_unchecked"}
              </span>`}
            <span style="font-size:12px;font-weight:${b.isParent?"700":"400"};text-decoration:${!b.isParent&&y?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${b.isParent?"var(--text-primary)":"var(--text-secondary)"};">
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
  `}function Ys(e,s){const t=p.getSettings(),a=e.jobs.filter(d=>d.status!=="Invoiced"&&d.status!=="Archived");let c=0,n=0;a.forEach(d=>{const r=(d.materials||[]).reduce(($,v)=>$+v.quantity*(v.unitCost||0),0),b=d.laborCost||0;c+=r+b;const y=Kt(d.materials||[],t),i=t.laborRates.find($=>$.id===d.laborRateProfileId)||t.laborRates.find($=>$.isDefault),u=d.estimatedHours||0,m=Math.max(u*((i==null?void 0:i.rate)||85),(i==null?void 0:i.minCallOutFee)||0);n+=y+m});const l=n-c,o=n>0?l/n*100:0;return`
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${n.toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Avg. Margin</div>
          <div style="font-size:18px; font-weight:700; color:${o>=30?"var(--color-success)":"var(--color-warning)"};">${o.toFixed(1)}%</div>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:var(--text-secondary);">Projected Profit</span>
            <span style="font-weight:600; color:var(--color-success);">+$${l.toLocaleString("en-AU",{minimumFractionDigits:2})}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(o,100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-primary);"></div>
            <span style="color:var(--text-secondary); flex:1;">Internal Costs (Labor + Mat)</span>
            <span style="font-weight:500;">$${c.toLocaleString()}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-success);"></div>
            <span style="color:var(--text-secondary); flex:1;">Tiered Markup (Proj. Profit)</span>
            <span style="font-weight:500;">$${l.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${a.length} active jobs using tiered material markups.
      </div>
    </div>
  `}function g(e){return e==null?"":String(e).replace(/[&<>"']/g,function(t){switch(t){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return t}})}function Oe({columns:e,data:s,onRowClick:t,getId:a,emptyMessage:c="No records found",emptyIcon:n="inbox",selectable:l=!1,onSelectionChange:o=null}){const d=document.createElement("div");d.className="card";let r=null,b="asc",y=1;const i=15,u=new Set;function m(){o&&o(Array.from(u))}function $(){let v=[...s];r&&v.sort((x,f)=>{const E=r.getValue?r.getValue(x):x[r.key],T=r.getValue?r.getValue(f):f[r.key];return E==null?1:T==null?-1:typeof E=="string"?b==="asc"?E.localeCompare(T):T.localeCompare(E):b==="asc"?E-T:T-E});const w=Math.ceil(v.length/i);y>w&&(y=w||1);const q=(y-1)*i,h=v.slice(q,q+i);if(s.length===0){d.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${g(n)}</span>
          <h3>${g(c)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let S='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(l){const x=h.length>0&&h.every(f=>u.has(String(a?a(f):f.id)));S+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${x?"checked":""}></th>`}if(e.forEach(x=>{const f=r&&r.key===x.key,E=f?" sorted":"",T=f?b==="asc"?"arrow_upward":"arrow_downward":"unfold_more";S+=`<th class="${E}" data-key="${x.key}" style="${x.width?"width:"+x.width:""}">
        ${g(x.label)}
        <span class="material-icons-outlined sort-icon">${T}</span>
      </th>`}),S+="</tr></thead><tbody>",h.forEach(x=>{const f=String(a?a(x):x.id),E=u.has(f);S+=`<tr data-id="${g(f)}" style="cursor:pointer" class="${E?"selected-row":""}">`,l&&(S+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${g(f)}" ${E?"checked":""}>
        </td>`),e.forEach(T=>{const A=T.render?T.render(x):g(x[T.key]??"");S+=`<td>${A}</td>`}),S+="</tr>"}),S+="</tbody></table></div>",w>1){S+=`<div class="pagination">
        <span class="pagination-info">Showing ${q+1}–${Math.min(q+i,v.length)} of ${v.length}</span>
        <div class="pagination-controls">
          <button ${y===1?"disabled":""} data-page="prev">‹</button>`;for(let x=1;x<=w;x++){if(w>7&&x>2&&x<w-1&&Math.abs(x-y)>1){(x===3||x===w-2)&&(S+="<button disabled>…</button>");continue}S+=`<button class="${x===y?"page-active":""}" data-page="${x}">${x}</button>`}S+=`<button ${y===w?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(d.innerHTML=S,d.querySelectorAll("th[data-key]").forEach(x=>{x.addEventListener("click",()=>{const f=e.find(E=>E.key===x.dataset.key);r===f?b=b==="asc"?"desc":"asc":(r=f,b="asc"),$()})}),t&&d.querySelectorAll("tbody tr[data-id]").forEach(x=>{x.addEventListener("click",f=>{f.target.closest(".dt-select-cell")||t(x.dataset.id)})}),l){d.querySelectorAll(".dt-select-row").forEach(f=>{f.addEventListener("change",E=>{E.target.checked?u.add(E.target.value):u.delete(E.target.value),m(),$()})});const x=d.querySelector(".dt-select-all");x&&x.addEventListener("change",f=>{const E=f.target.checked;h.forEach(T=>{const A=String(a?a(T):T.id);E?u.add(A):u.delete(A)}),m(),$()})}d.querySelectorAll(".pagination-controls button[data-page]").forEach(x=>{x.addEventListener("click",()=>{const f=x.dataset.page;f==="prev"?y--:f==="next"?y++:y=parseInt(f),$()})})}return $(),d.updateData=v=>{s=v,$()},d.clearSelection=()=>{u.clear(),m(),$()},d}let We=null;function Ks(){return(!We||!document.body.contains(We))&&(We=document.createElement("div"),We.className="toast-container",We.id="toast-container",document.body.appendChild(We)),We}function z(e,s="info",t=3500){const a=Ks(),c=document.createElement("div");c.className=`toast ${s}`;const n={success:"check_circle",error:"error",warning:"warning",info:"info"};c.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${s==="error"?"danger":s})">${n[s]||n.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${e}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,c.querySelector(".toast-close").addEventListener("click",()=>c.remove()),a.appendChild(c),setTimeout(()=>{c.parentNode&&(c.style.opacity="0",c.style.transform="translateX(20px)",c.style.transition="0.3s ease",setTimeout(()=>c.remove(),300))},t)}function Xs(e,s,t){p.create("notifications",{title:e,message:s,link:t,read:!1}),z(`${e}: ${s}`,"info")}const Ae=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:Xs,showToast:z},Symbol.toStringTag,{value:"Module"}));function Ue({container:e,selectedIds:s,actions:t,onClear:a}){const c=e.querySelector(".bulk-action-bar");if(c&&c.remove(),!s||s.length===0)return;const n=document.createElement("div");n.className="bulk-action-bar slide-up";let l=`
    <div class="bulk-action-left">
      <span class="bulk-count">${s.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return t.forEach((o,d)=>{l+=`<button class="btn ${o.className||"btn-secondary"} btn-sm" data-action="${d}">
      ${o.icon?`<span class="material-icons-outlined" style="font-size:16px">${g(o.icon)}</span> `:""}
      ${g(o.label)}
    </button>`}),l+="</div>",n.innerHTML=l,n.querySelector("#btn-clear-selection").addEventListener("click",()=>{a&&a()}),n.querySelectorAll("button[data-action]").forEach(o=>{o.addEventListener("click",()=>{const d=o.dataset.action;t[d]&&t[d].onClick&&t[d].onClick(s)})}),e.appendChild(n),n}function Lt(e){const s=p.getAll("customers");e.innerHTML=`
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
        <button class="toolbar-filter" data-filter="Active">Active (${s.filter(n=>n.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${s.filter(n=>n.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let t=[...s];const c=Oe({columns:[{key:"company",label:"Company / Name",render:n=>`<span class="cell-link font-medium">${g(n.company)}</span>`},{key:"contact",label:"Contact",render:n=>`${g(n.firstName)} ${g(n.lastName)}`},{key:"email",label:"Email",render:n=>`<span class="text-secondary">${g(n.email)}</span>`},{key:"phone",label:"Phone",render:n=>`<span class="text-secondary">${g(n.phone)}</span>`},{key:"type",label:"Type",render:n=>`<span class="badge badge-neutral">${g(n.type)}</span>`},{key:"status",label:"Status",render:n=>`<span class="badge ${n.status==="Active"?"badge-success":"badge-neutral"}">${g(n.status)}</span>`}],data:t,onRowClick:n=>B.navigate(`/people/${n}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:n=>{Ue({container:e,selectedIds:n,onClear:()=>c.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:l=>{const o=document.createElement("div");o.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,fe(async()=>{const{showModal:d}=await Promise.resolve().then(()=>je);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${l.length} Customers`,content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Apply",className:"btn-primary",onClick:r=>{const b=o.querySelector("#bulk-status").value;l.forEach(y=>p.update("customers",y,{status:b})),c.clearSelection(),Lt(e),z(`Updated ${l.length} customers to ${b}`,"success"),r()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{fe(async()=>{const{showModal:o}=await Promise.resolve().then(()=>je);return{showModal:o}},void 0).then(({showModal:o})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${l.length} customers? This cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Delete",className:"btn-danger",onClick:r=>{l.forEach(b=>p.delete("customers",b)),c.clearSelection(),Lt(e),z(`Deleted ${l.length} customers`,"success"),r()}}]})})}}]})}});e.querySelector("#people-table-container").appendChild(c),e.querySelector("#btn-new-person").addEventListener("click",()=>{B.navigate("/people/new")}),e.querySelector("#btn-export-people").addEventListener("click",()=>{z("Customer data exported successfully","success")}),e.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),n.classList.add("active");const l=n.dataset.filter;t=l==="all"?[...s]:s.filter(o=>o.status===l),c.updateData(t)})}),e.querySelector("#people-search").addEventListener("input",n=>{var d;const l=n.target.value.toLowerCase();t=s.filter(r=>r.company.toLowerCase().includes(l)||`${r.firstName} ${r.lastName}`.toLowerCase().includes(l)||r.email.toLowerCase().includes(l));const o=(d=e.querySelector(".toolbar-filter.active"))==null?void 0:d.dataset.filter;o&&o!=="all"&&(t=t.filter(r=>r.status===o)),c.updateData(t)})}function Se({title:e,content:s,size:t="",onClose:a,actions:c=[]}){const n=document.createElement("div");n.className="modal-overlay",n.id="modal-overlay";const l=document.createElement("div");l.className=`modal ${t}`;let o=`
    <div class="modal-header">
      <h3>${g(e)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof s=="string"?g(s):""}</div>
  `;c.length&&(o+='<div class="modal-footer">',c.forEach((b,y)=>{o+=`<button class="btn ${b.className||"btn-secondary"}" id="modal-action-${y}">${g(b.label)}</button>`}),o+="</div>"),l.innerHTML=o,typeof s!="string"&&(s instanceof HTMLElement||s instanceof DocumentFragment)&&(l.querySelector(".modal-body").innerHTML="",l.querySelector(".modal-body").appendChild(s)),n.appendChild(l),document.body.appendChild(n);const d=()=>{n.remove(),a&&a()};l.querySelector("#modal-close-btn").addEventListener("click",d),n.addEventListener("click",b=>{b.target===n&&d()}),c.forEach((b,y)=>{const i=l.querySelector(`#modal-action-${y}`);i&&b.onClick&&i.addEventListener("click",()=>b.onClick(d))});const r=b=>{b.key==="Escape"&&(d(),document.removeEventListener("keydown",r))};return document.addEventListener("keydown",r),{close:d,modal:l,overlay:n}}const je=Object.freeze(Object.defineProperty({__proto__:null,showModal:Se},Symbol.toStringTag,{value:"Module"}));function ot({title:e,icon:s,iconBgColor:t="var(--color-primary-light)",iconTextColor:a="var(--color-primary)",metaHtml:c="",actionsHtml:n=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${t};color:${a}">
          <span class="material-icons-outlined">${s}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${e}</h2></div>
          ${c?`<div class="detail-header-meta">${c}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${n}
      </div>
    </div>
  `}function Je({title:e,content:s,actions:t=[],width:a=400}){const c=document.querySelector(".drawer-overlay");c&&c.remove();const n=document.createElement("div");n.className="drawer-overlay";const l=document.createElement("div");l.className="drawer",l.style.width=typeof a=="number"?`${a}px`:a;const o=document.createElement("div");o.className="drawer-header",o.innerHTML=`
    <h3>${e}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const d=document.createElement("div");if(d.className="drawer-body",typeof s=="string"?d.innerHTML=s:d.appendChild(s),l.appendChild(o),l.appendChild(d),t.length>0){const b=document.createElement("div");b.className="drawer-footer",t.forEach(y=>{const i=document.createElement("button");i.className=`btn ${y.className||"btn-secondary"}`,i.innerHTML=y.label,i.onclick=()=>y.onClick(r),b.appendChild(i)}),l.appendChild(b)}n.appendChild(l),document.body.appendChild(n);function r(){l.style.animation="slideRightOut 0.2s ease forwards",n.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>n.remove(),200)}o.querySelector(".drawer-close").onclick=r,n.addEventListener("mousedown",b=>{b.target===n&&r()})}function Zt({customerId:e=null,site:s="",onSave:t=null}={}){const a=p.getAll("customers"),c=p.getAll("people").filter(m=>m.type==="Staff"),n=e?p.getById("customers",e):null,l=(n==null?void 0:n.sites)||[],o=document.createElement("div");o.innerHTML=`
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
            ${c.map(m=>`<option value="${m.id}">${m.firstName} ${m.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${e?"flex":"none"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${l.map(m=>`<option value="${g(m.name)}" ${s===m.name?"selected":""}>${g(m.name)}</option>`).join("")}
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
  `;const d=o.querySelector("#qa-owner-type"),r=o.querySelector("#qa-customer-group"),b=o.querySelector("#qa-business-fields"),y=o.querySelector("#qa-customer-fields"),i=o.querySelector("#qa-customer-id"),u=o.querySelector("#qa-asset-site");d.addEventListener("change",m=>{const $=m.target.value==="Customer";r.style.display=$?"block":"none",b.style.display=$?"none":"flex",y.style.display=$?"flex":"none"}),i.addEventListener("change",m=>{const $=m.target.value,v=p.getById("customers",$);v&&v.sites?u.innerHTML='<option value="">-- No specific site --</option>'+v.sites.map(w=>`<option value="${g(w.name)}">${g(w.name)}</option>`).join(""):u.innerHTML='<option value="">-- No specific site --</option>'}),Se({title:"Quick Add Asset",size:"modal-70",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create Asset",className:"btn-primary",onClick:m=>{const $=o.querySelector("#qa-asset-name").value.trim();if(!$)return z("Asset Name is required","error");const v=d.value,w=i.value;if(v==="Customer"&&!w)return z("Please select a customer","error");const q={name:$,description:o.querySelector("#qa-asset-desc").value.trim(),ownerType:v,customerId:v==="Customer"?w:null,type:o.querySelector("#qa-asset-type").value,serial:o.querySelector("#qa-asset-serial").value.trim(),status:"Active",serviceIntervalMonths:parseInt(o.querySelector("#qa-service-interval").value)||6,currentMeter:parseInt(o.querySelector("#qa-initial-meter").value)||0,meterUnit:o.querySelector("#qa-meter-unit").value,logs:[]};v==="Business"?(q.recoveryRate=parseFloat(o.querySelector("#qa-recovery-rate").value)||0,q.assignedToId=o.querySelector("#qa-assigned-to").value):(q.site=u.value,q.installDate=o.querySelector("#qa-install-date").value);const h=p.create("assets",q);z(`Asset "${$}" created successfully`,"success"),t&&t(h),m()}}]})}function Ht({onSave:e}={}){const s=p.getAll("assets"),a=p.getSettings().materialCategories||["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],c=document.createElement("div");c.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${a.map(n=>`<option>${n}</option>`).join("")}
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
            ${s.map(n=>`<option>${n.name}</option>`).join("")}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `,Se({title:"Create New Catalog Item",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save to Catalog",className:"btn-primary",onClick:n=>{const l=c.querySelector("#qs-name").value,o=parseFloat(c.querySelector("#qs-cost").value)||0;let d=parseFloat(c.querySelector("#qs-sell").value);if(!l){z("Item name is required","error");return}if(o<=0){z("Cost price is required","error");return}(isNaN(d)||d===0)&&(d=o*1.3);const r=p.create("stock",{name:l,category:c.querySelector("#qs-category").value,sku:c.querySelector("#qs-sku").value||`SKU-${Date.now().toString().slice(-4)}`,unit:c.querySelector("#qs-unit").value,reorderLevel:parseInt(c.querySelector("#qs-reorder").value)||10,costPrice:o,unitPrice:d,location:c.querySelector("#qs-location").value,quantity:0,supplier:""});z(`Stock item "${l}" created`,"success"),e&&e(r),n()}}]})}function Ot({id:e=null,jobId:s=null,supplierId:t=null,onSave:a=null}={}){const c=!e,n=p.getAll("contractors").filter(m=>m.isSupplier!==!1),l=p.getAll("jobs").filter(m=>m.status!=="Completed"&&m.status!=="Invoiced"),o=p.getAll("stock");let d=c?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],notes:"",supplierId:t||"",jobId:s||""}:p.getById("purchaseOrders",e);if(!d){z("Purchase Order not found","error");return}let r=[...d.lineItems||[]];const b=document.createElement("div");b.className="po-drawer-container";function y(){b.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${d.status!=="Draft"&&!c?"disabled":""}>
                <option value="">Select supplier...</option>
                ${n.map(m=>`<option value="${m.id}" ${d.supplierId===m.id?"selected":""}>${m.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${d.status!=="Draft"&&!c?"disabled":""}>
                <option value="">No specific job (Stock PO)</option>
                ${l.map(m=>`<option value="${m.id}" ${d.jobId===m.id?"selected":""}>#${m.number} - ${m.title}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${d.issueDate?d.issueDate.split("T")[0]:""}" ${d.status!=="Draft"&&!c?"disabled":""} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${g(d.notes||"")}" placeholder="e.g. Delivery instructions" ${d.status!=="Draft"&&!c?"disabled":""} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${c?"":`(${g(d.number)})`}</h4>
            ${d.status==="Draft"||c?`
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
                ${r.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>':r.map((m,$)=>`
                  <tr data-idx="${$}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${g(m.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${$}" ${d.status!=="Draft"&&!c?"disabled":""} />
                       <datalist id="stock-list-${$}">
                          ${o.map(v=>`<option value="${g(v.name)}">${g(v.name)} - $${(v.costPrice||0).toFixed(2)}</option>`).join("")}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${m.qty||m.quantity}" min="1" style="width:100%" ${d.status!=="Draft"&&!c?"disabled":""} /></td>
                    <td><input type="number" class="form-input item-cost" value="${m.cost||m.unitCost}" step="0.01" style="width:100%" ${d.status!=="Draft"&&!c?"disabled":""} /></td>
                    <td style="text-align:right; font-weight:600">$${((m.qty||m.quantity||0)*(m.cost||m.unitCost||0)).toFixed(2)}</td>
                    <td>${d.status==="Draft"||c?'<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>':""}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${r.reduce((m,$)=>m+($.qty||$.quantity||0)*($.cost||$.unitCost||0),0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,i()}function i(){var m,$;(m=b.querySelector("#btn-add-stock-new"))==null||m.addEventListener("click",()=>{Ht({onSave:v=>{r.push({description:v.name,qty:1,cost:v.costPrice||0,stockId:v.id}),y()}})}),($=b.querySelector("#btn-browse-stock"))==null||$.addEventListener("click",()=>{var w;const v=document.createElement("div");v.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${o.map(q=>`
            <div class="stock-pick-item" data-id="${q.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${g(q.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${q.sku||"N/A"} — Cost: $${(q.costPrice||0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join("")}
        </div>
      `,Se({title:"Select Stock",content:v,actions:[{label:"Close",className:"btn-secondary",onClick:q=>q()}]}),(w=v.querySelector("#btn-po-new-stock"))==null||w.addEventListener("click",()=>{Ht({onSave:q=>{var h;r.push({description:q.name,qty:1,cost:q.costPrice||0,stockId:q.id}),y(),(h=document.querySelector(".modal-overlay"))==null||h.remove()}})}),v.querySelectorAll(".stock-pick-item").forEach(q=>{q.addEventListener("click",()=>{const h=o.find(S=>S.id===q.dataset.id);h&&(r.push({description:h.name,qty:1,cost:h.costPrice||0,stockId:h.id}),y(),z(`Added ${h.name}`,"success"))})})}),b.querySelectorAll("#po-items-body tr").forEach(v=>{var x;const w=parseInt(v.dataset.idx),q=v.querySelector(".item-desc"),h=v.querySelector(".item-qty"),S=v.querySelector(".item-cost");q==null||q.addEventListener("change",f=>{const E=f.target.value,T=o.find(A=>A.name===E);T?(r[w].description=T.name,r[w].cost=T.costPrice||0,r[w].stockId=T.id):r[w].description=E,y()}),h==null||h.addEventListener("input",()=>{const f=parseFloat(h.value)||0;r[w].qty=f,r[w].quantity=f}),S==null||S.addEventListener("input",()=>{const f=parseFloat(S.value)||0;r[w].cost=f,r[w].unitCost=f}),(x=v.querySelector(".btn-remove-item"))==null||x.addEventListener("click",()=>{r.splice(w,1),y()})})}y();const u=[{label:"Cancel",className:"btn-secondary",onClick:m=>m()}];c||d.status==="Draft"?u.push({label:c?"Create & Issue PO":"Update & Issue PO",className:"btn-primary",onClick:m=>{const $=b.querySelector("#qa-po-supplier").value,v=b.querySelector("#qa-po-job").value;if(!$){z("Supplier is required","error");return}if(r.length===0){z("Please add at least one item","error");return}const w=n.find(S=>S.id===$),q=l.find(S=>S.id===v),h={number:d.number||`PO-${Date.now().toString().slice(-6)}`,supplierId:$,supplierName:(w==null?void 0:w.company)||"Unknown",jobId:v||null,jobNumber:(q==null?void 0:q.number)||"",issueDate:b.querySelector("#qa-po-date").value,notes:b.querySelector("#qa-po-notes").value,total:r.reduce((S,x)=>S+(x.qty||x.quantity||0)*(x.cost||x.unitCost||0),0),status:"Issued",lineItems:r};c?p.create("purchaseOrders",h):p.update("purchaseOrders",e,h),z(`Purchase Order ${h.number} issued`,"success"),a&&a(),m()}}):d.status==="Issued"&&u.push({label:"Mark as Received",className:"btn-success",onClick:m=>{p.update("purchaseOrders",e,{status:"Received",receivedDate:new Date().toISOString()}),r.forEach($=>{if($.stockId){const v=p.getById("stock",$.stockId);v&&p.update("stock",v.id,{quantity:(v.quantity||0)+($.qty||$.quantity)})}}),z(`PO ${d.number} marked as Received`,"success"),a&&a(),m()}}),Je({title:c?"New Purchase Order":"Manage Purchase Order",content:b,width:750,actions:u})}function Zs(e,{id:s}){const t=p.getById("customers",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}Ye(t.company);const a=p.getAll("jobs").filter(r=>r.customerId===s),c=p.getAll("quotes").filter(r=>r.customerId===s),n=p.getAll("invoices").filter(r=>r.customerId===s);let l="details";function o(){e.innerHTML=`
      ${ot({title:g(t.company),icon:t.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${g(t.firstName)} ${g(t.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${g(t.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${g(t.phone)}</span>
          <span class="badge ${t.status==="Active"?"badge-success":"badge-neutral"}">${g(t.status)}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-edit-person">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-person">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `})}

      <div class="tabs" id="person-tabs">
        <button class="tab ${l==="details"?"active":""}" data-tab="details">Details</button>
        <button class="tab ${l==="contacts"?"active":""}" data-tab="contacts">Contacts (${(t.contacts||[]).length})</button>
        <button class="tab ${l==="sites"?"active":""}" data-tab="sites">Sites (${(t.sites||[]).length})</button>
        <button class="tab ${l==="assets"?"active":""}" data-tab="assets">Assets (${p.getAll("assets").filter(r=>r.ownerType==="Customer"&&r.customerId===s).length})</button>
        <button class="tab ${l==="communications"?"active":""}" data-tab="communications">Communications (${(t.communications||[]).length})</button>
        <button class="tab ${l==="jobs"?"active":""}" data-tab="jobs">Jobs (${a.length})</button>
        <button class="tab ${l==="quotes"?"active":""}" data-tab="quotes">Quotes (${c.length})</button>
        <button class="tab ${l==="invoices"?"active":""}" data-tab="invoices">Invoices (${n.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,d(),e.querySelectorAll(".tab").forEach(r=>{r.addEventListener("click",()=>{l=r.dataset.tab,e.querySelectorAll(".tab").forEach(b=>b.classList.remove("active")),r.classList.add("active"),d()})}),e.querySelector("#btn-edit-person").addEventListener("click",()=>{B.navigate(`/people/${s}/edit`)}),e.querySelector("#btn-delete-person").addEventListener("click",()=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete <strong>${g(t.company)}</strong>? This action cannot be undone.</p>`,Se({title:"Delete Customer",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{p.delete("customers",s),z("Customer deleted successfully","success"),b(),B.navigate("/people")}}]})})}function d(){const r=e.querySelector("#tab-content");if(l==="details")r.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Fe("Company",t.company)}
                  ${Fe("Contact",`${t.firstName} ${t.lastName}`)}
                  ${Fe("Email",t.email)}
                  ${Fe("Phone",t.phone)}
                  ${Fe("Type",t.type)}
                  ${Fe("Status",t.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Fe("Address",t.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Fe("Created",new Date(t.createdAt).toLocaleDateString())}
                  ${Fe("Last Updated",new Date(t.updatedAt).toLocaleDateString())}
                  ${Fe("Total Jobs",a.length)}
                  ${Fe("Total Quotes",c.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(l==="contacts"){const b=t.contacts||[];r.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${b.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${b.map((y,i)=>`
                  <tr>
                    <td class="font-medium">${g(y.name)}</td>
                    <td>${g(y.role||"—")}</td>
                    <td><a href="mailto:${g(y.email)}" class="cell-link">${g(y.email)}</a></td>
                    <td><a href="tel:${g(y.phone)}" class="cell-link">${g(y.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${b.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,r.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,Je({title:"Add Contact",content:y.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const u=document.querySelector(".drawer-overlay"),m=u.querySelector("#new-c-name").value.trim();if(!m)return z("Name is required","error");t.contacts||(t.contacts=[]),t.contacts.push({name:m,role:u.querySelector("#new-c-role").value,email:u.querySelector("#new-c-email").value,phone:u.querySelector("#new-c-phone").value}),p.update("customers",s,{contacts:t.contacts}),z("Contact added","success"),d(),o(),i()}}]})}),r.querySelectorAll(".btn-delete-contact").forEach(y=>{y.addEventListener("click",()=>{t.contacts.splice(y.dataset.index,1),p.update("customers",s,{contacts:t.contacts}),z("Contact deleted","success"),d(),o()})})}else if(l==="sites"){const b=t.sites||[];r.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${b.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${b.map((y,i)=>`
                  <tr>
                    <td class="font-medium">${g(y.name)}</td>
                    <td>${g(y.address)}</td>
                    <td class="text-secondary">${g(y.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${b.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,r.querySelector("#btn-toggle-site").addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,Je({title:"Add Site",content:y.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const u=document.querySelector(".drawer-overlay"),m=u.querySelector("#new-s-name").value.trim(),$=u.querySelector("#new-s-address").value.trim();if(!m||!$)return z("Name and Address are required","error");t.sites||(t.sites=[]),t.sites.push({name:m,address:$,notes:u.querySelector("#new-s-notes").value}),p.update("customers",s,{sites:t.sites}),z("Site added","success"),d(),o(),i()}}]})}),r.querySelectorAll(".btn-delete-site").forEach(y=>{y.addEventListener("click",()=>{t.sites.splice(y.dataset.index,1),p.update("customers",s,{sites:t.sites}),z("Site deleted","success"),d(),o()})})}else if(l==="assets"){t.assets&&t.assets.length>0&&(t.assets.forEach(y=>{p.create("assets",{name:y.name,serial:y.serial,site:y.site,installDate:y.installDate,ownerType:"Customer",customerId:s,status:"Active",type:"Equipment"})}),t.assets=[],p.update("customers",s,{assets:[]}));const b=p.getAll("assets").filter(y=>y.ownerType==="Customer"&&y.customerId===s);t.sites,r.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${b.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${b.map((y,i)=>`
                  <tr>
                    <td class="font-medium">${g(y.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${g(y.serial||"—")}</td>
                    <td>${g(y.site||"—")}</td>
                    <td>${y.installDate?new Date(y.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${b.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,r.querySelector("#btn-toggle-asset").addEventListener("click",()=>{Zt({customerId:s,onSave:()=>{d(),o()}})}),r.querySelectorAll(".btn-delete-asset").forEach(y=>{y.addEventListener("click",()=>{const i=y.dataset.id;p.delete("assets",i),z("Asset disabled/deleted","success"),d(),o()})})}else if(l==="communications"){const y=[...t.communications||[]].sort((i,u)=>new Date(u.date)-new Date(i.date));r.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${y.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${y.map((i,u)=>`
                  <div style="display:flex;gap:12px;border-bottom:1px solid var(--border-color);padding-bottom:12px">
                    <div style="background:var(--color-${i.type==="Email"?"info":i.type==="Call"?"success":"neutral"}-bg);color:var(--color-${i.type==="Email"?"info":i.type==="Call"?"success":"neutral"});padding:8px;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span class="material-icons-outlined" style="font-size:20px">${i.type==="Email"?"mail":i.type==="Call"?"phone":"sticky_note_2"}</span>
                    </div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                        <strong style="font-size:var(--font-size-md)">${i.type}</strong>
                        <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">${new Date(i.date).toLocaleDateString()}</span>
                      </div>
                      <div style="color:var(--text-secondary);white-space:pre-wrap;font-size:var(--font-size-sm)">${i.content}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      `,r.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`
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
        `,Je({title:"Log Activity",content:i.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save",className:"btn-primary",onClick:u=>{const m=document.querySelector(".drawer-overlay"),$=m.querySelector("#new-comm-content").value.trim();if(!$)return z("Details are required","error");t.communications||(t.communications=[]),t.communications.push({id:Date.now().toString(),type:m.querySelector("#new-comm-type").value,date:m.querySelector("#new-comm-date").value,content:$}),p.update("customers",s,{communications:t.communications}),z("Activity logged","success"),d(),o(),u()}}]})})}else l==="jobs"?r.innerHTML=Tt(a,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):l==="quotes"?(r.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${Tt(c,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,r.querySelector("#btn-create-quote").addEventListener("click",()=>{B.navigate("/quotes/new?customerId="+s)})):l==="invoices"&&(r.innerHTML=Tt(n,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}o()}function Fe(e,s){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${g(e)}</span>
      <span style="font-size:var(--font-size-base)">${g(s)}</span>
    </div>
  `}function Tt(e,s,t,a){if(e.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${a}</h3></div></div>`;const c=n=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[n]||"neutral"}">${g(n)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${s.map(n=>`<th>${g(n.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.map(n=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${t}/${g(n.id)}'">
                ${s.map(l=>{let o=n[l.key];return l.badge?o=c(o):l.format==="currency"?o=`$${(o||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:l.format==="date"?o=o?new Date(o).toLocaleDateString():"—":o=g(o),`<td>${o}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function es(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("customers",s):{};e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{B.navigate(t?`/people/${s}`:"/people")}),e.querySelector("#btn-save").addEventListener("click",()=>{const c=e.querySelector("#person-form");if(!c.checkValidity()){c.reportValidity();return}const n=new FormData(c),l=Object.fromEntries(n);if(t)p.update("customers",s,l),z("Customer updated successfully","success"),B.navigate(`/people/${s}`);else{const o=p.create("customers",l);z("Customer created successfully","success"),B.navigate(`/people/${o.id}`)}})}function qt(e){const s=p.getAll("leads");e.innerHTML=`
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
  `;let t=[...s];const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},c={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},l=Oe({columns:[{key:"title",label:"Lead",render:o=>`<span class="cell-link font-medium">${g(o.title)}</span>`},{key:"customerName",label:"Customer",render:o=>`<span class="text-secondary">${g(o.customerName)}</span>`},{key:"source",label:"Source",render:o=>`<span class="text-secondary">${g(o.source)}</span>`},{key:"status",label:"Status",render:o=>`<span class="badge ${a[o.status]||"badge-neutral"}">${g(o.status)}</span>`},{key:"priority",label:"Priority",render:o=>`<span class="badge ${c[o.priority]||"badge-neutral"}">${g(o.priority)}</span>`},{key:"value",label:"Value",render:o=>`<span class="font-medium">$${(o.value||0).toLocaleString()}</span>`,getValue:o=>o.value},{key:"createdAt",label:"Created",render:o=>`<span class="text-secondary">${new Date(o.createdAt).toLocaleDateString()}</span>`,getValue:o=>new Date(o.createdAt).getTime()}],data:t,onRowClick:o=>B.navigate(`/leads/${o}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:o=>{Ue({container:e,selectedIds:o,onClear:()=>l.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:d=>{const r=document.createElement("div");r.innerHTML=`
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
              `,fe(async()=>{const{showModal:b}=await Promise.resolve().then(()=>je);return{showModal:b}},void 0).then(({showModal:b})=>{b({title:`Update ${d.length} Leads`,content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Apply",className:"btn-primary",onClick:y=>{const i=r.querySelector("#bulk-status").value;d.forEach(u=>p.update("leads",u,{status:i})),l.clearSelection(),qt(e),fe(async()=>{const{showToast:u}=await Promise.resolve().then(()=>Ae);return{showToast:u}},void 0).then(({showToast:u})=>u(`Updated ${d.length} leads to ${i}`,"success")),y()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{fe(async()=>{const{showModal:r}=await Promise.resolve().then(()=>je);return{showModal:r}},void 0).then(({showModal:r})=>{const b=document.createElement("div");b.innerHTML=`<p>Are you sure you want to delete ${d.length} leads? This action cannot be undone.</p>`,r({title:"Confirm Bulk Delete",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Delete",className:"btn-danger",onClick:y=>{d.forEach(i=>p.delete("leads",i)),l.clearSelection(),qt(e),fe(async()=>{const{showToast:i}=await Promise.resolve().then(()=>Ae);return{showToast:i}},void 0).then(({showToast:i})=>i(`Deleted ${d.length} leads`,"success")),y()}}]})})}}]})}});e.querySelector("#leads-table-container").appendChild(l),e.querySelector("#btn-new-lead").addEventListener("click",()=>B.navigate("/leads/new")),e.querySelectorAll(".toolbar-filter").forEach(o=>{o.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(r=>r.classList.remove("active")),o.classList.add("active");const d=o.dataset.filter;t=d==="all"?[...s]:s.filter(r=>r.status===d),l.updateData(t)})}),e.querySelector("#leads-search").addEventListener("input",o=>{const d=o.target.value.toLowerCase();t=s.filter(r=>r.title.toLowerCase().includes(d)||r.customerName.toLowerCase().includes(d)),l.updateData(t)})}function ea(e,{id:s}){const t=p.getById("leads",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}Ye(t.title);const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"};e.innerHTML=`
    ${ot({title:t.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
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
  `,e.querySelector("#btn-convert-quote").addEventListener("click",()=>{const c=p.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,title:t.title,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0});p.update("leads",s,{status:"Won"}),z("Lead converted to quote successfully","success"),B.navigate(`/quotes/${c.id}`)}),e.querySelector("#btn-edit-lead").addEventListener("click",()=>B.navigate(`/leads/${s}/edit`)),e.querySelector("#btn-delete-lead").addEventListener("click",()=>{const c=document.createElement("div");c.innerHTML=`<p>Delete <strong>${g(t.title)}</strong>?</p>`,Se({title:"Delete Lead",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{p.delete("leads",s),z("Lead deleted","success"),n(),B.navigate("/leads")}}]})})}function Ge(e,s){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function ts(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("leads",s):{},c=p.getAll("customers");e.innerHTML=`
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
                ${c.map(n=>`<option value="${n.id}" ${a.customerId===n.id?"selected":""}>${n.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(n=>`<option ${a.source===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(n=>`<option ${a.status===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(n=>`<option ${a.priority===n?"selected":""}>${n}</option>`).join("")}
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>B.navigate(t?`/leads/${s}`:"/leads")),e.querySelector("#btn-save").addEventListener("click",()=>{const n=e.querySelector("#lead-form");if(!n.checkValidity()){n.reportValidity();return}const l=Object.fromEntries(new FormData(n));l.value=parseFloat(l.value)||0;const o=c.find(d=>d.id===l.customerId);if(l.customerName=(o==null?void 0:o.company)||"",l.contactName=o?`${o.firstName} ${o.lastName}`:"",t)p.update("leads",s,l),z("Lead updated","success"),B.navigate(`/leads/${s}`);else{const d=p.create("leads",l);z("Lead created","success"),B.navigate(`/leads/${d.id}`)}})}function ss(e){const s=p.getAll("notifications")||[];let t="",a="all";function c(){return s.filter(i=>{var v,w,q,h,S;const u=t.toLowerCase(),m=((v=i.title)==null?void 0:v.toLowerCase().includes(u))||((w=i.description)==null?void 0:w.toLowerCase().includes(u))||((q=i.createdBy)==null?void 0:q.toLowerCase().includes(u))||((h=i.type)==null?void 0:h.toLowerCase().includes(u))||((S=i.priority)==null?void 0:S.toLowerCase().includes(u)),$=a==="all"||i.status===a;return m&&$})}e.innerHTML=`
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
        <button class="toolbar-filter ${a==="Pending"?"active":""}" data-filter="Pending">Pending (${s.filter(i=>i.status==="Pending").length})</button>
        <button class="toolbar-filter ${a==="Converted"?"active":""}" data-filter="Converted">Converted (${s.filter(i=>i.status==="Converted").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${g(t)}" />
      </div>
    </div>
    
    <div id="notifications-table-container"></div>
  `;const l=Oe({columns:[{key:"createdAt",label:"Date",render:i=>i.createdAt?new Date(i.createdAt).toLocaleDateString():"—",getValue:i=>i.createdAt?new Date(i.createdAt).getTime():0,width:"100px"},{key:"type",label:"Type",render:i=>`<span class="badge badge-neutral">${g(i.type||"Field Alert")}</span>`,width:"120px"},{key:"title",label:"Title / Job Name",render:i=>`
        <div style="font-weight:500">${g(i.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g(i.description)}</div>
      `},{key:"priority",label:"Priority",render:i=>`<span class="badge ${i.priority==="Urgent"||i.priority==="High"?"badge-danger":"badge-neutral"}">${g(i.priority||"Normal")}</span>`,width:"100px"},{key:"status",label:"Status",render:i=>`<span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${g(i.status)}</span>`,width:"110px"},{key:"createdBy",label:"Raised By",width:"150px"},{key:"actions",label:"",render:i=>`
        <div style="text-align:right">
          ${i.status!=="Converted"?`
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${i.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${i.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          `:""}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${i.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${i.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,width:"150px"}],data:c(),onRowClick:i=>{const u=s.find(m=>m.id===i);u&&r(u)},emptyMessage:"No notifications found",emptyIcon:"campaign"});e.querySelector("#notifications-table-container").appendChild(l),e.querySelector("#notif-search").addEventListener("input",i=>{t=i.target.value,l.updateData(c())}),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(u=>u.classList.remove("active")),i.classList.add("active"),a=i.dataset.filter,l.updateData(c())})}),e.querySelector("#btn-raise-notification").addEventListener("click",()=>d()),l.addEventListener("click",i=>{const u=i.target.closest("button");if(!u)return;i.stopPropagation();const m=u.dataset.id;if(u.classList.contains("btn-view-notification")){const $=s.find(v=>v.id===m);$&&r($)}else if(u.classList.contains("btn-edit-notification")){const $=s.find(v=>v.id===m);$&&d($)}else u.classList.contains("btn-convert-quote")?b(m):u.classList.contains("btn-convert-job")&&y(m)});function d(i=null){const u=p.getAll("jobs"),m=JSON.parse(localStorage.getItem("currentUser")||"{}");Je({title:i?"Edit Notification":"Raise Notification",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="notif-type">
              <option value="Field Fault" ${(i==null?void 0:i.type)==="Field Fault"?"selected":""}>Field Fault</option>
              <option value="Client Request" ${(i==null?void 0:i.type)==="Client Request"?"selected":""}>Client Request</option>
              <option value="Safety Hazard" ${(i==null?void 0:i.type)==="Safety Hazard"?"selected":""}>Safety Hazard</option>
              <option value="Recurring Job Due" ${(i==null?void 0:i.type)==="Recurring Job Due"?"selected":""}>Recurring Job Due</option>
              <option value="Other" ${(i==null?void 0:i.type)==="Other"?"selected":""}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Related Job (Optional)</label>
            <select class="form-select" id="notif-job">
              <option value="">-- None --</option>
              ${u.map($=>`<option value="${$.id}" ${(i==null?void 0:i.jobId)===$.id?"selected":""}>${g($.number)} - ${g($.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${g((i==null?void 0:i.title)||"")}" />
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="notif-priority">
              <option value="Low" ${(i==null?void 0:i.priority)==="Low"?"selected":""}>Low</option>
              <option value="Normal" ${!i||(i==null?void 0:i.priority)==="Normal"?"selected":""}>Normal</option>
              <option value="High" ${(i==null?void 0:i.priority)==="High"?"selected":""}>High</option>
              <option value="Urgent" ${(i==null?void 0:i.priority)==="Urgent"?"selected":""}>Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fault / Description <span class="text-danger">*</span></label>
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${g((i==null?void 0:i.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:i?"Save Changes":"Submit Notification",className:"btn-primary",onClick:$=>{const v=document.getElementById("notif-type").value,w=document.getElementById("notif-job").value,q=document.getElementById("notif-title").value.trim(),h=document.getElementById("notif-priority").value,S=document.getElementById("notif-desc").value.trim();if(!q||!S){z("Title and Description are required","error");return}i?(p.update("notifications",i.id,{type:v,jobId:w||null,title:q,priority:h,description:S}),z("Notification updated","success")):(p.create("notifications",{type:v,jobId:w||null,title:q,priority:h,description:S,status:"Pending",createdAt:new Date().toISOString(),createdBy:m.name||"Unknown"}),z("Notification raised successfully","success")),$(),ss(e)}}]})}function r(i){Je({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${g(i.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${g(i.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${g(i.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${g(i.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${g(i.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${i.createdAt?new Date(i.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${i.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${i.jobId}">${g(i.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:i.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:u=>u()},{label:"Edit",className:"btn-secondary",onClick:u=>{u(),d(i)}},{label:"Convert to Quote",className:"btn-secondary",onClick:u=>{u(),b(i.id)}},{label:"Convert to Job",className:"btn-primary",onClick:u=>{u(),y(i.id)}}]:[{label:"Close",className:"btn-secondary",onClick:u=>u()}]})}function b(i){const u=p.getById("notifications",i);if(!u)return;const m=p.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:u.title,description:u.description,priority:u.priority,status:"Draft",notes:`Generated from Notification: ${u.title}

${u.description}`,createdAt:new Date().toISOString()});p.update("notifications",i,{status:"Converted",convertedTo:`Quote ${m.number}`}),z("Converted to Quote successfully","success"),B.navigate(`/quotes/${m.id}`)}function y(i){const u=p.getById("notifications",i);if(!u)return;const m=p.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,title:u.title,description:u.description,priority:u.priority,status:"Pending",notes:`Generated from Notification: ${u.title}

${u.description}`,createdAt:new Date().toISOString()});p.update("notifications",i,{status:"Converted",convertedTo:`Job ${m.number}`}),z("Converted to Job successfully","success"),B.navigate(`/jobs/${m.id}`)}}function At(e){const s=p.getAll("quotes"),t=Ee("Quotes","create");e.innerHTML=`
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
  `;let a=[...s];const c={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},l=Oe({columns:[{key:"number",label:"Quote #",render:d=>`<span class="cell-link font-medium">${g(d.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:d=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${g(d.title||"")}</span>`},{key:"status",label:"Status",render:d=>`<span class="badge ${c[d.status]||"badge-neutral"}">${g(d.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:d=>`<span class="font-semibold">$${(d.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:d=>d.total,width:"110px"},{key:"createdAt",label:"Date",render:d=>new Date(d.createdAt).toLocaleDateString(),getValue:d=>new Date(d.createdAt).getTime(),width:"100px"}],data:a,onRowClick:d=>B.navigate(`/quotes/${d}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:d=>{Ue({container:e,selectedIds:d,onClear:()=>l.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:r=>{const b=document.createElement("div");b.innerHTML=`
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
              `,fe(async()=>{const{showModal:y}=await Promise.resolve().then(()=>je);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:`Update ${r.length} Quotes`,content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const u=b.querySelector("#bulk-status").value;r.forEach(m=>p.update("quotes",m,{status:u})),l.clearSelection(),At(e),fe(async()=>{const{showToast:m}=await Promise.resolve().then(()=>Ae);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${r.length} quotes to ${u}`,"success")),i()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{fe(async()=>{const{showModal:b}=await Promise.resolve().then(()=>je);return{showModal:b}},void 0).then(({showModal:b})=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete ${r.length} quotes? This action cannot be undone.</p>`,b({title:"Confirm Bulk Delete",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{r.forEach(u=>p.delete("quotes",u)),l.clearSelection(),At(e),fe(async()=>{const{showToast:u}=await Promise.resolve().then(()=>Ae);return{showToast:u}},void 0).then(({showToast:u})=>u(`Deleted ${r.length} quotes`,"success")),i()}}]})})}}]})}});e.querySelector("#quotes-table-container").appendChild(l);const o=e.querySelector("#btn-new-quote");o&&o.addEventListener("click",()=>B.navigate("/quotes/new")),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(b=>b.classList.remove("active")),d.classList.add("active");const r=d.dataset.filter;a=r==="all"?[...s]:s.filter(b=>b.status===r),l.updateData(a)})}),e.querySelector("#quotes-search").addEventListener("input",d=>{const r=d.target.value.toLowerCase();a=s.filter(b=>b.number.toLowerCase().includes(r)||b.customerName.toLowerCase().includes(r)||(b.title||"").toLowerCase().includes(r)),l.updateData(a)})}function Pt({type:e,data:s}){const t=document.createElement("div");t.className="modal-overlay",t.id="print-preview-overlay",t.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const a=document.createElement("div");a.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const c=document.createElement("div");c.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;",c.innerHTML=`
    <span style="font-weight:600;font-size:14px">${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} Preview — ${s.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const n=document.createElement("div");n.id="print-document",n.className="print-document",n.innerHTML=Rt(e,s),a.appendChild(c),a.appendChild(n),t.appendChild(a),document.body.appendChild(t);const l=()=>t.remove();c.querySelector("#btn-close-preview").addEventListener("click",l),t.addEventListener("click",d=>{d.target===t&&l()}),c.querySelector("#btn-print-pdf").addEventListener("click",()=>{const d=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.number} — ${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${sa()}</style>
      </head>
      <body>
        ${Rt(e,s)}
      </body>
      </html>
    `,r=`${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} ${s.number}`;if(!p.getAll("documents").find(u=>u.entityId===s.id&&u.name===r)){const u=`data:text/html;charset=utf-8,${encodeURIComponent(d)}`;p.create("documents",{name:r,type:e==="quote"?"Quote PDF":e==="invoice"?"Invoice PDF":"Form PDF",size:d.length,url:u,folder:e==="quote"?"Quotes":e==="invoice"?"Invoices":"Forms",uploadedAt:new Date().toISOString(),entityType:e==="quote"?"Quote":e==="invoice"?"Invoice":"Job",entityId:s.entityId||s.id,entityName:s.customerName||"Unknown Customer"}),fe(async()=>{const{showToast:m}=await Promise.resolve().then(()=>Ae);return{showToast:m}},void 0).then(({showToast:m})=>{m(`${r} saved to Documents`,"success")})}const i=window.open("","_blank","width=800,height=1000");i.document.write(d),i.document.close(),setTimeout(()=>{i.print()},500)});const o=d=>{d.key==="Escape"&&(l(),document.removeEventListener("keydown",o))};document.addEventListener("keydown",o)}function Rt(e,s){if(e==="form")return ta(s);const t=e==="quote",c={Draft:"#6B7280",Finalised:"#1B6DE0",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[s.status]||"#6B7280",n=s.customerName||"Customer",l=s.contactName||"",o=s.lineItems||[],d=s.sections||[],r=p.getSettings(),b=r.logo?`<img src="${r.logo}" style="max-height:60px; max-width:240px; object-fit:contain" />`:'<div class="pdf-logo">F</div>';let y="";return d.length>0?d.forEach(i=>{y+=`
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${g(i.name||"Phase")}</td>
        </tr>
      `,i.lineItems.forEach(u=>{y+=`
          <tr>
            <td>${u.description?g(u.description):"—"}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(u.type||"other").charAt(0).toUpperCase()+(u.type||"other").slice(1)}</span></td>
            <td style="text-align:center">${u.qty||1}</td>
            <td style="text-align:right">$${(u.rate||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(u.total||0).toFixed(2)}</td>
          </tr>
        `}),y+=`
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(i.subtotal||0).toFixed(2)}</td>
        </tr>
      `}):y=o.map(i=>`
      <tr>
        <td>${i.description?g(i.description):"—"}</td>
        <td style="text-align:center"><span class="pdf-type-tag">${(i.type||"other").charAt(0).toUpperCase()+(i.type||"other").slice(1)}</span></td>
        <td style="text-align:center">${i.qty||1}</td>
        <td style="text-align:right">$${(i.rate||0).toFixed(2)}</td>
        <td style="text-align:right;font-weight:600">$${(i.total||0).toFixed(2)}</td>
      </tr>
    `).join(""),`
    <div class="pdf-page">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-company">
          ${b}
          <div>
            <div class="pdf-company-name">${g(r.name||"FieldForge Demo Company")}</div>
            <div class="pdf-company-detail">ABN: ${g(r.abn||"12 345 678 901")}</div>
            <div class="pdf-company-detail">${g(r.address||"123 Business St, Melbourne VIC 3000")}</div>
            <div class="pdf-company-detail">Phone: ${g(r.phone||"1300 123 456")}</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${t?"QUOTE":"TAX INVOICE"}</div>
          <div class="pdf-doc-number">${s.number}</div>
          <div class="pdf-status" style="background:${c}15;color:${c};border:1px solid ${c}40">${s.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${t?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${n}</div>
          ${l?`<div class="pdf-info-value">Attn: ${l}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${t?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${ct(t?s.createdAt:s.issueDate)}</span>
          </div>
          ${t?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${ct(s.validUntil)}</span>
            </div>
          `:`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${ct(s.dueDate)}</span>
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
          ${y}
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
          <div class="pdf-notes-text">${g(s.notes).replace(/\n/g,"<br>")}</div>
        </div>
      `:""}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div class="pdf-footer-text">
          ${t?"This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.":"Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business."}
        </div>
        <div class="pdf-footer-company">${g(r.name||"FieldForge Demo Company")} — ${g(r.email||"hello@fieldforge.io")} — ${g(r.phone||"1300 123 456")}</div>
      </div>
    </div>
  `}function ta(e){let s="";return(e.template.sections||[]).forEach(t=>{t.isSpacer||(s+=`
      <div style="margin-bottom:24px; border:1px solid #CBD5E1; border-radius:6px; overflow:hidden">
        <div style="background:#F8FAFC; padding:10px 16px; border-bottom:1px solid #CBD5E1; font-weight:700; color:#1E293B; font-size:14px; text-transform:uppercase; letter-spacing:0.5px">
          ${g(t.title)}
        </div>
        <div style="padding:16px; display:grid; grid-template-columns: 1fr 1fr; gap:16px">
    `,t.fields.forEach(a=>{if(a.type==="spacer")return;const c=a.width==="half";if(a.type==="info"){s+=`
          <div style="grid-column: span ${c?"1":"2"}; padding:12px; background:#EFF6FF; border-left:4px solid #3B82F6; color:#1E3A8A; font-size:12px; border-radius:4px">
            <div style="font-weight:600; margin-bottom:4px">Information</div>
            <div>${g(a.label).replace(/\n/g,"<br/>")}</div>
          </div>
        `;return}const n=e.responses[a.id];let l="";a.type==="signature"?l=n?`<div style="font-family:'Brush Script MT', cursive; font-size:24px; padding:10px; border:1px solid #E4E9F0; border-radius:4px; text-align:center">${g(n)}</div>`:'<div style="padding:10px; border:1px dashed #E4E9F0; color:#8A97A8; font-style:italic; text-align:center">No signature</div>':a.type==="checkbox"?l=`<div style="font-weight:600; color:${n?"#10B981":"#EF4444"}">${n?"YES / CHECKED":"NO / UNCHECKED"}</div>`:l=`<div style="padding:8px 12px; border:1px solid #E4E9F0; border-radius:4px; background:#F8FAFC; min-height:34px; font-size:12px">${n?g(n).replace(/\n/g,"<br/>"):'<span style="color:#8A97A8;font-style:italic">No response</span>'}</div>`,s+=`
        <div style="grid-column: span ${c?"1":"2"}; display:flex; flex-direction:column; gap:6px">
          <div style="font-size:11px; font-weight:700; color:#5A6B7F; text-transform:uppercase; letter-spacing:0.5px">${g(a.label)}</div>
          ${l}
        </div>
      `}),s+=`
        </div>
      </div>
    `)}),`
    <div class="pdf-page">
      <div style="margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #E4E9F0">
        <div style="font-size:22px; font-weight:800; color:#1A2332">${g(e.template.name)}</div>
        ${e.template.description?`<div style="font-size:13px; color:#5A6B7F; margin-top:6px; line-height:1.6">${g(e.template.description)}</div>`:""}
      </div>

      <div class="pdf-info-grid" style="margin-bottom:32px">
        <div class="pdf-info-col">
          <div class="pdf-info-label">Job Reference</div>
          <div class="pdf-info-value-lg">${g(e.jobNumber)}</div>
          <div class="pdf-info-value">Customer: ${g(e.customerName)}</div>
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">Submitted By</span>
            <span class="pdf-info-value">${g(e.submittedByName||"—")}</span>
          </div>
          <div class="pdf-info-row">
            <span class="pdf-info-label">Date Submitted</span>
            <span class="pdf-info-value">${ct(e.submittedAt)}</span>
          </div>
        </div>
      </div>

      ${s}
    </div>
  `}function ct(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return e}}function sa(){return`
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
  `}const aa=Object.freeze(Object.defineProperty({__proto__:null,formatDate:ct,showPrintPreview:Pt},Symbol.toStringTag,{value:"Module"}));function St(e,{id:s,customerId:t,type:a}){const c=a==="template",n=c?"quoteTemplates":"quotes",l=s==="new";let o;if(l?c?o={name:"New Quote Template",description:"",sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0}:o={status:"Draft",version:1,sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:t||""}:o=p.getById(n,s),!o){e.innerHTML=`<div class="empty-state"><span class="material-icons-outlined">error</span><h3>${c?"Template":"Quote"} not found</h3></div>`;return}o.lineItems&&!o.sections&&(o.sections=[{id:p.generateId(),name:"Main Phase",lineItems:[...o.lineItems]}],delete o.lineItems),l||Ye(o.number+(o.version>1?` v${o.version}`:""));const d=p.getAll("customers"),r=p.getAll("stock"),b=p.getSettings(),y={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function i(){e.innerHTML=`
      ${ot({title:c?l?"New Quote Template":g(o.name):`${l?"New Quote":o.number} ${o.version>1?`<span class="badge badge-neutral">v${o.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:c?"":`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          <span class="badge ${y[o.status]||"badge-neutral"}">${o.status}</span>
        `,actionsHtml:c?`
          ${l?"":'<button class="btn btn-secondary" id="btn-delete-template" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span> Delete</button>'}
        `:`
          ${l?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!l&&o.status!=="Archived"&&Ee("Quotes","edit")?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!l&&o.status==="Accepted"&&Ee("Quotes","convert")?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!l&&o.status==="Draft"&&Ee("Quotes","edit")?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                ${Ee("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>':""}
                ${Ee("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>':""}
                ${!l&&Ee("Quotes","delete")?'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>':""}
             </div>
          </div>
        `})}

      ${c?`
      <!-- Template Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Template Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Template Name *</label>
              <input class="form-input" id="quote-name" value="${g(o.name||"")}" placeholder="Template Name..." />
            </div>
            <div class="form-group" style="flex:2">
              <label class="form-label">Description</label>
              <input class="form-input" id="quote-desc" value="${g(o.description||"")}" placeholder="Template Description..." />
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${b.laborRates.map(w=>`<option value="${w.id}" ${o.laborProfileId===w.id?"selected":""}>${w.name} ($${w.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>
      `:`
      <!-- Quote Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Quote Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="quote-customer" ${o.status==="Archived"?"disabled":""}>
                <option value="">Select customer...</option>
                ${d.map(w=>`<option value="${w.id}" ${o.customerId===w.id?"selected":""}>${w.company}</option>`).join("")}
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
                ${["Draft","Finalised","Sent","Accepted","Declined","Archived"].map(w=>`<option ${o.status===w?"selected":""}>${w}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${o.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${b.laborRates.map(w=>`<option value="${w.id}" ${o.laborProfileId===w.id?"selected":""}>${w.name} ($${w.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input class="form-input" type="date" id="quote-valid" value="${o.validUntil?o.validUntil.split("T")[0]:""}" ${o.status==="Archived"?"disabled":""} />
            </div>
          </div>
        </div>
      </div>
      `}

      <datalist id="stock-items-list">
        ${r.map(w=>`<option value="${w.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(o.sections||[]).map((w,q)=>u(w,q)).join("")}
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

      ${c?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Template</button>
      </div>
      `:o.status!=="Archived"&&(l?Ee("Quotes","create"):Ee("Quotes","edit"))?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Back</button>
      </div>`}
    `,v()}function u(w,q){const h=o.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${q}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${w.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${h?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(w.subtotal||0).toFixed(2)}</span>
            ${h?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${q}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${q}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(w.lineItems||[]).map((S,x)=>m(S,q,x,h)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function m(w,q,h,S){return`
      <tr data-sidx="${q}" data-index="${h}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${w.description||""}" data-field="description" placeholder="Type item name..." ${S?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${S?"disabled":""}>
          <option value="labor" ${w.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${w.type==="material"?"selected":""}>Material</option>
          <option value="other" ${w.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${w.qty||1}" data-field="qty" min="1" ${S?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${w.rate||0}" data-field="rate" step="0.01" ${S?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(w.total||0).toFixed(2)}</td>
        <td>${S?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${q}" data-index="${h}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function $(){o.subtotal=0,o.totalInternalCost=0;let w=0;p.getSettings().laborRates.find(h=>h.id===o.laborProfileId),(o.sections||[]).forEach(h=>{h.subtotal=0,(h.lineItems||[]).forEach(S=>{S.total=(S.qty||0)*(S.rate||0),S.type==="labor"&&(w+=S.total),S.internalCost||(S.type==="labor"?S.internalCost=45:S.internalCost=S.rate*.7),o.totalInternalCost+=(S.qty||0)*(S.internalCost||0),h.subtotal+=S.total}),o.subtotal+=h.subtotal}),o.tax=o.subtotal*.1,o.total=o.subtotal+o.tax,i()}function v(){var q,h,S,x,f,E,T,A,I,j,U;(q=e.querySelector("#btn-preview-pdf"))==null||q.addEventListener("click",()=>{Pt({type:"quote",data:o})});const w=e.querySelector(".dropdown > .btn");w&&(w.addEventListener("click",P=>{P.stopPropagation();const O=w.nextElementSibling;O.style.display=O.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const P=e.querySelector(".dropdown-menu");P&&(P.style.display="none")})),(h=e.querySelector("#btn-create-revision"))==null||h.addEventListener("click",()=>{p.update("quotes",s,{status:"Archived"});const P=JSON.parse(JSON.stringify(o));delete P.id,P.version=(o.version||1)+1,P.status="Draft",P.createdAt=new Date().toISOString();const O=p.create("quotes",P);z(`Revision v${P.version} created`,"success"),B.navigate(`/quotes/${O.id}`)}),(S=e.querySelector("#btn-save-template"))==null||S.addEventListener("click",P=>{P.preventDefault();const O=document.createElement("div");O.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${o.title||"Custom Quote Template"}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `,Se({title:"Save Quote as Template",content:O,actions:[{label:"Cancel",className:"btn-secondary",onClick:H=>H()},{label:"Save Template",className:"btn-primary",onClick:H=>{const D=O.querySelector("#tmpl-name").value,L=O.querySelector("#tmpl-desc").value;if(!D){z("Template name is required","error");return}const N={name:D,description:L,sections:JSON.parse(JSON.stringify(o.sections)),createdAt:new Date().toISOString()};p.create("quoteTemplates",N),z("Saved to Quote Templates","success"),H()}}]})}),(x=e.querySelector("#btn-import-template"))==null||x.addEventListener("click",P=>{P.preventDefault();const O=p.getAll("quoteTemplates"),H=document.createElement("div");H.innerHTML=`
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${O.length?O.map(D=>`
            <div class="import-item" data-id="${D.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${g(D.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${D.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${g(D.description||"No description.")}</div>
            </div>
          `).join(""):'<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `,Se({title:"Import Quote Template",content:H,actions:[{label:"Cancel",className:"btn-secondary",onClick:D=>D()}]}),H.querySelectorAll(".import-item").forEach(D=>{D.addEventListener("click",()=>{var N;const L=O.find(C=>C.id===D.dataset.id);L&&confirm(`Replace current quote sections with "${L.name}"?`)&&(o.sections=JSON.parse(JSON.stringify(L.sections)),o.sections.forEach(C=>{C.id=p.generateId(),C.lineItems.forEach(k=>k.id=p.generateId())}),$(),(N=document.querySelector(".modal-overlay"))==null||N.remove())})})}),e.querySelectorAll("#quote-name, #quote-desc, #quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(P=>{P.addEventListener("change",()=>{const O=P.value;if(P.id==="quote-name")o.name=O;else if(P.id==="quote-desc")o.description=O;else if(P.id==="quote-customer")o.customerId=O;else if(P.id==="quote-title")o.title=O;else if(P.id==="quote-status")o.status=O;else if(P.id==="quote-valid")o.validUntil=O;else if(P.id==="quote-labor-profile"){o.laborProfileId=O;const H=b.laborRates.find(D=>D.id===O);if(H){if(o.sections&&o.sections.forEach(D=>{D.lineItems.forEach(L=>{L.type==="labor"&&(L.rate=H.rate)})}),H.minCallOutFee>0){const D=o.sections[0];D&&(D.lineItems.some(N=>N.description.includes("Call-out Fee"))||D.lineItems.unshift({description:"Call-out Fee",type:"other",qty:1,rate:H.minCallOutFee,total:H.minCallOutFee}))}$()}}})}),(f=e.querySelector("#btn-add-section"))==null||f.addEventListener("click",()=>{const P=b.laborRates.find(O=>O.id===o.laborProfileId)||b.laborRates.find(O=>O.isDefault);o.sections.push({id:p.generateId(),name:"New Phase",lineItems:[{description:"Labour",type:"labor",qty:1,rate:P?P.rate:85,total:P?P.rate:85}]}),$()}),e.querySelectorAll(".section-name-input").forEach((P,O)=>{P.addEventListener("change",()=>{o.sections[O].name=P.value})}),e.querySelectorAll(".btn-add-line").forEach(P=>{P.addEventListener("click",O=>{const H=parseInt(P.dataset.sidx);o.sections[H].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),i()})}),e.querySelectorAll(".btn-remove-section").forEach(P=>{P.addEventListener("click",()=>{const O=parseInt(P.dataset.sidx);confirm("Remove this entire phase?")&&(o.sections.splice(O,1),$())})}),e.querySelectorAll(".item-input").forEach(P=>{P.addEventListener("change",O=>{const H=P.closest("tr"),D=parseInt(H.dataset.sidx),L=parseInt(H.dataset.index),N=P.dataset.field;let C=P.value;if((N==="qty"||N==="rate")&&(C=parseFloat(C)||0),o.sections[D].lineItems[L][N]=C,N==="description"){const k=r.find(_=>_.name===C);if(k){const _=(k.category||"").toLowerCase().includes("labor");let M=0,V=0;if(_)M=k.unitPrice||85,V=k.costPrice||45;else{const ne=k.costPrice||k.unitPrice||0;V=ne,M=kt(ne,b)}o.sections[D].lineItems[L].type=_?"labor":"material",o.sections[D].lineItems[L].rate=M,o.sections[D].lineItems[L].internalCost=V}}$()})}),e.querySelectorAll(".btn-remove-line").forEach(P=>{P.addEventListener("click",()=>{const O=parseInt(P.dataset.sidx),H=parseInt(tr.dataset.index);o.sections[O].lineItems.splice(H,1),$()})}),(E=e.querySelector("#btn-cancel-quote"))==null||E.addEventListener("click",()=>{c?B.navigate("/settings?tab=quotes"):B.navigate("/quotes")}),(T=e.querySelector("#btn-save-quote"))==null||T.addEventListener("click",()=>{if(c)o.name=e.querySelector("#quote-name").value,o.description=e.querySelector("#quote-desc").value;else{const P=e.querySelector("#quote-customer").value,O=d.find(H=>H.id===P);o.customerId=P,o.customerName=(O==null?void 0:O.company)||"",o.contactName=O?`${O.firstName} ${O.lastName}`:"",o.title=e.querySelector("#quote-title").value,o.status=e.querySelector("#quote-status").value,o.validUntil=e.querySelector("#quote-valid").value}if($(),c)l?(p.create("quoteTemplates",o),z("Template created","success"),B.navigate("/settings?tab=quotes")):(p.update("quoteTemplates",s,o),z("Template saved","success"),i());else if(l){const P=p.create("quotes",o);z("Quote created","success"),B.navigate(`/quotes/${P.id}`)}else p.update("quotes",s,o),z("Quote saved","success"),i()}),(A=e.querySelector("#btn-convert-job"))==null||A.addEventListener("click",()=>{const P=p.getAll("technicians"),O=P[Math.floor(Math.random()*P.length)];let H=0,D=0;(o.sections||[]).forEach(C=>{(C.lineItems||[]).forEach(k=>{k.type==="labor"&&(H+=k.total),k.type==="material"&&(D+=k.total)})});const L=o.sections.map(C=>({id:p.generateId(),name:C.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),N=p.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:o.customerId,customerName:o.customerName,contactName:o.contactName,title:o.title,type:"Project",status:"Pending",priority:"Medium",technicianId:O==null?void 0:O.id,technicianName:O==null?void 0:O.name,quoteId:s,tasks:L,phases:L,laborCost:H,materialCost:D});z("Quote converted to project","success"),B.navigate(`/jobs/${N.id}`)}),(I=e.querySelector("#btn-send-quote"))==null||I.addEventListener("click",()=>{o.emailStatus="Sent",o.status==="Draft"&&(o.status="Sent"),p.update("quotes",s,{emailStatus:"Sent",status:o.status}),fe(async()=>{const{showToast:P,addSystemNotification:O}=await Promise.resolve().then(()=>Ae);return{showToast:P,addSystemNotification:O}},void 0).then(({showToast:P,addSystemNotification:O})=>{P("Email sent to customer","success"),i(),setTimeout(()=>{const H=p.getById("quotes",s);H&&H.emailStatus==="Sent"&&(H.emailStatus="Opened/Viewed",p.update("quotes",s,{emailStatus:"Opened/Viewed"}),O("Quote Opened",`Quote ${H.number} was opened by ${H.customerName||"the customer"}.`,`/quotes/${s}`),window.location.hash.includes(`/quotes/${s}`)&&(o.emailStatus="Opened/Viewed",i()))},15e3)})}),(j=e.querySelector("#btn-delete-quote"))==null||j.addEventListener("click",()=>{const P=document.createElement("div");P.innerHTML=`<p>Delete quote <strong>${g(o.number)}</strong>?</p>`,Se({title:"Delete Quote",content:P,actions:[{label:"Cancel",className:"btn-secondary",onClick:O=>O()},{label:"Delete",className:"btn-danger",onClick:O=>{p.delete("quotes",s),z("Quote deleted","success"),O(),B.navigate("/quotes")}}]})}),(U=e.querySelector("#btn-delete-template"))==null||U.addEventListener("click",()=>{confirm(`Delete template "${g(o.name)}"?`)&&(p.delete("quoteTemplates",s),z("Template deleted","success"),B.navigate("/settings?tab=quotes"))})}i()}function Dt(e){const s=p.getAll("jobs"),t=Ee("Jobs","create");e.innerHTML=`
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
  `;let a=[...s];const c={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},n={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},o=Oe({columns:[{key:"number",label:"Job #",render:r=>`<span class="cell-link font-medium">${g(r.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:r=>`<span class="truncate" style="max-width:200px;display:inline-block">${g(r.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:r=>{if(r.contractorId){const b=p.getById("contractors",r.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${b?g(b.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${r.technicians&&r.technicians.length>0?r.technicians.map(b=>g(b.name)).join(", "):g(r.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:r=>`<span class="badge ${c[r.status]||"badge-neutral"}">${g(r.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:r=>`<span class="badge ${n[r.priority]||"badge-neutral"}">${g(r.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:r=>r.scheduledDate?new Date(r.scheduledDate).toLocaleDateString():"—",getValue:r=>r.scheduledDate?new Date(r.scheduledDate).getTime():0,width:"100px"}],data:a,onRowClick:r=>B.navigate(`/jobs/${r}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:r=>{Ue({container:e,selectedIds:r,onClear:()=>o.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:b=>{const y=document.createElement("div");y.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,fe(async()=>{const{showModal:i}=await Promise.resolve().then(()=>je);return{showModal:i}},void 0).then(({showModal:i})=>{i({title:`Update ${b.length} Jobs`,content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{const m=y.querySelector("#bulk-status").value;b.forEach($=>p.update("jobs",$,{status:m})),o.clearSelection(),Dt(e),fe(async()=>{const{showToast:$}=await Promise.resolve().then(()=>Ae);return{showToast:$}},void 0).then(({showToast:$})=>$(`Updated ${b.length} jobs to ${m}`,"success")),u()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:b=>{fe(async()=>{const{showModal:y}=await Promise.resolve().then(()=>je);return{showModal:y}},void 0).then(({showModal:y})=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete ${b.length} jobs? This cannot be undone.</p>`,y({title:"Confirm Bulk Delete",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Delete",className:"btn-danger",onClick:u=>{b.forEach(m=>p.delete("jobs",m)),o.clearSelection(),Dt(e),fe(async()=>{const{showToast:m}=await Promise.resolve().then(()=>Ae);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${b.length} jobs`,"success")),u()}}]})})}}]})}});e.querySelector("#jobs-table-container").appendChild(o);const d=e.querySelector("#btn-new-job");d&&d.addEventListener("click",()=>B.navigate("/jobs/new")),e.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(y=>y.classList.remove("active")),r.classList.add("active");const b=r.dataset.filter;b==="all"?a=[...s]:b==="unscheduled"?a=s.filter(y=>!y.scheduledDate):a=s.filter(y=>y.status===b),o.updateData(a)})}),e.querySelector("#jobs-search").addEventListener("input",r=>{const b=r.target.value.toLowerCase();a=s.filter(y=>y.number.toLowerCase().includes(b)||y.title.toLowerCase().includes(b)||y.customerName.toLowerCase().includes(b)||(y.technicianName||"").toLowerCase().includes(b)),o.updateData(a)})}function as(e,s){const t=p.getById("timesheets",e);if(!t)return;const a=JSON.parse(localStorage.getItem("currentUser")||"{}"),c={},n={};function l(h,S=[],x=[]){h&&h.forEach((f,E)=>{const T=[...S,E].join("-"),A=[...x,f.name].join(" > ");c[T]=A,f.id&&(n[f.id]=T),f.subTasks&&l(f.subTasks,[...S,E],[...x,f.name])})}function o(h,S=[]){return!h||h.length===0?"":h.map((x,f)=>{const E=[...S,f],T=E.join("-"),A=x.subTasks&&x.subTasks.length>0;return`
        <div class="tree-node" style="margin: 2px 0;">
          <div class="tree-node-row ${A?"parent-node":"leaf-node"}" data-path="${T}" data-name="${g(x.name)}" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; flex-grow:1;">
              ${A?`
                <span class="material-icons-outlined tree-node-toggle" data-path="${T}" style="font-size:16px; margin-right:4px;">chevron_right</span>
              `:`
                <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
              `}
              <span class="node-name" style="font-weight:${A?"600":"400"}">${g(x.name)}</span>
            </div>
            ${A?`
              <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${x.subTasks.length} subtasks</span>
            `:""}
          </div>
          ${A?`
            <div class="tree-node-children" id="children-${T}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
              ${o(x.subTasks,E)}
            </div>
          `:""}
        </div>
      `}).join("")}const d=t.startTime||`${t.date}T09:00`,r=t.finishTime||`${t.date}T10:00`,b=p.getAll("technicians"),y=p.getAll("jobs").filter(h=>h.status!=="Completed"&&h.status!=="Invoiced"||h.id===t.jobId),i=document.createElement("div");i.innerHTML=`
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
        <input type="datetime-local" class="form-input" id="lt-start" value="${d}" style="width:100%" />
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Finish Time *</label>
        <input type="datetime-local" class="form-input" id="lt-finish" value="${r}" style="width:100%" />
      </div>
    </div>
    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group" style="margin:0">
        <label class="form-label">Technician *</label>
        <select class="form-select" id="lt-tech" style="width:100%" ${a.role==="technician"?"disabled":""}>
          <option value="">Select technician...</option>
          ${b.map(h=>`<option value="${h.id}" ${t.technicianId===h.id?"selected":""}>${h.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Job *</label>
        <select class="form-select" id="lt-job" style="width:100%">
          <option value="">Select job...</option>
          ${y.map(h=>`<option value="${h.id}" ${t.jobId===h.id?"selected":""}>${h.number} - ${g(h.customerName)} (${g(h.title)})</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-bottom:12px">
      <label class="form-label">Task *</label>
      <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
        <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; background-image:none;">
          <span>Select task...</span>
          <span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>
        </button>
        <div class="tree-select-dropdown" id="lt-task-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--card-bg); border:1px solid var(--border-color); border-radius:var(--border-radius); box-shadow:var(--shadow-lg); max-height:280px; overflow-y:auto; padding:8px;">
          <!-- Hierarchical task tree populated here -->
        </div>
        <input type="hidden" id="lt-task" value="${t.taskId||t.taskPath||""}" />
        <input type="hidden" id="lt-task-name" value="${g(t.taskName||"")}" />
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Description</label>
      <input type="text" class="form-input" id="lt-desc" value="${g(t.description||"")}" placeholder="Brief description..." style="width:100%" />
    </div>
  `;const u=i.querySelector("#lt-job"),m=i.querySelector("#lt-task-trigger"),$=i.querySelector("#lt-task-dropdown"),v=i.querySelector("#lt-task"),w=i.querySelector("#lt-task-name");m.addEventListener("click",h=>{h.stopPropagation();const S=$.style.display==="block";$.style.display=S?"none":"block"}),document.addEventListener("click",h=>{i.contains(h.target)||($.style.display="none")});function q(h,S){if(!h){m.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',m.disabled=!0,$.style.display="none",v.value="",w.value="";return}const x=y.find(E=>E.id===h);if(!x||!x.tasks||x.tasks.length===0){m.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',m.disabled=!0,$.style.display="none",v.value="",w.value="";return}for(const E in c)delete c[E];for(const E in n)delete n[E];l(x.tasks),$.innerHTML=o(x.tasks),m.disabled=!1;let f=S;f&&!c[f]&&n[f]&&(f=n[f]),f&&c[f]?(m.innerHTML=`<span>${g(c[f])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,v.value=f,w.value=c[f]):(m.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',v.value="",w.value=""),$.querySelectorAll(".tree-node-toggle").forEach(E=>{E.addEventListener("click",T=>{T.stopPropagation();const A=E.dataset.path,I=$.querySelector("#children-"+A);if(I){const j=I.style.display==="none";I.style.display=j?"block":"none",E.classList.toggle("expanded",j)}})}),$.querySelectorAll(".tree-node-row").forEach(E=>{E.addEventListener("click",T=>{if(T.target.classList.contains("tree-node-toggle"))return;const A=E.dataset.path,I=A.split("-").map(Number);function j(O,H){let D=O[H[0]];for(let L=1;L<H.length;L++){if(!D||!D.subTasks)return!1;D=D.subTasks[H[L]]}return D&&D.subTasks&&D.subTasks.length>0}if(j(x.tasks||[],I)){const O=$.querySelector("#children-"+A),H=$.querySelector('.tree-node-toggle[data-path="'+A+'"]');if(O){const D=O.style.display==="none";O.style.display=D?"block":"none",H&&H.classList.toggle("expanded",D)}return}const P=c[A]||E.dataset.name;v.value=A,w.value=P,m.innerHTML=`<span>${g(P)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,$.style.display="none"})})}q(t.jobId,t.taskPath||t.taskId),u.addEventListener("change",h=>{q(h.target.value,null)}),Se({title:"Edit Timesheet Entry",content:i,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:"Save Changes",className:"btn-primary",onClick:h=>{const S=document.getElementById("lt-start").value,x=document.getElementById("lt-finish").value,f=document.getElementById("lt-tech").value,E=document.getElementById("lt-job").value,T=document.getElementById("lt-task").value,A=document.getElementById("lt-task-name").value,I=document.getElementById("lt-desc").value;if(!S||!x||!f||!E||!T){z("Please fill all required fields, including the task","error");return}const j=new Date(S),U=new Date(x);if(U<=j){z("Finish time must be after start time","error");return}const P=Math.round((U-j)/36e5*100)/100,O=b.find(D=>D.id===f),H=y.find(D=>D.id===E);p.update("timesheets",t.id,{jobId:H.id,jobNumber:H.number,taskId:T,taskPath:T,taskName:A,technicianId:f,technicianName:O.name,date:S.split("T")[0],startTime:S,finishTime:x,hours:P,description:I||""}),z("Timesheet updated successfully","success"),h(),s&&s()}}]})}function oa(e,{id:s}){const t=p.getById("jobs",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}Ye(t.number);const a={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},c={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let n="overview",l=[0],o=[],d=!1,r=null,b=[];function y(){return r||(r=p.getAll("stock").map(h=>`<option value="${h.id}">${g(h.name)} (Qty: ${h.quantity}) - $${h.costPrice||h.unitPrice}</option>`).join("")),r}function i(){(t.laborCost||0)+(t.materialCost||0),e.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${g(t.number)} — ${g(t.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${g(t.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${g(t.technicianName||"Unassigned")}</span>
              <span class="badge ${a[t.status]||"badge-neutral"}">${g(t.status)}</span>
              <span class="badge ${c[t.priority]||"badge-neutral"}">${g(t.priority)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <!-- Moved invoice creation to Invoices tab -->
          ${Ee("Jobs","edit")?'<button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>':""}
          ${Ee("Jobs","delete")?'<button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>':""}
        </div>
      </div>
      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${n==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${n==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        ${Ee("Jobs","view_costs")?`<button class="tab ${n==="costs"?"active":""}" data-tab="costs">Costs</button>`:""}
        ${Ee("Jobs","view_quotes_tab")?`<button class="tab ${n==="quotes"?"active":""}" data-tab="quotes">Quotes</button>`:""}
        <button class="tab ${n==="forms"?"active":""}" data-tab="forms">Forms</button>
        ${Ee("Jobs","view_pos_tab")?`<button class="tab ${n==="pos"?"active":""}" data-tab="pos">POs</button>`:""}
        <button class="tab ${n==="activity"?"active":""}" data-tab="activity">Activity</button>
        ${Ee("Jobs","view_timesheets_tab")?`<button class="tab ${n==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>`:""}
        ${Ee("Jobs","view_invoices_tab")?`<button class="tab ${n==="invoices"?"active":""}" data-tab="invoices">Invoices</button>`:""}
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,u(),m()}function u(){var I,j,U,P,O,H,D,L,N,C,k,_,M,V,ne,F,J,be,ce,ee,se,pe;(n==="costs"&&!Ee("Jobs","view_costs")||n==="quotes"&&!Ee("Jobs","view_quotes_tab")||n==="pos"&&!Ee("Jobs","view_pos_tab")||n==="timesheets"&&!Ee("Jobs","view_timesheets_tab")||n==="invoices"&&!Ee("Jobs","view_invoices_tab"))&&(n="overview");const h=e.querySelector("#tab-content");if((t.laborCost||0)+(t.materialCost||0),n==="forms"){v(h);return}if(n==="overview"){let Q=0;if(t.tasks&&t.tasks.length>0){let K=0,R=0;t.tasks.forEach(te=>{const Z=(parseFloat(te.estimatedHours)||1)*(parseInt(te.people)||1);K+=Z,R+=Z*((te.progress||0)/100)}),Q=K>0?Math.round(R/K*100):0}const Y=t.technicians&&t.technicians.length>0?t.technicians.map(K=>`${g(K.name)} (${K.hours}h)`).join(", "):g(t.technicianName||"Unassigned");h.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${$("Job Number",g(t.number))}
                ${$("Title",g(t.title))}
                ${$("Type",g(t.type))}
                ${$("Status",g(t.status))}
                ${$("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${Q}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${Q}%</span></div>`)}
                ${$("Priority",g(t.priority))}
                ${$("Customer",g(t.customerName))}
                ${$("Contact",g(t.contactName||"—"))}
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
                ${$("Technicians",Y)}
                ${$("Scheduled",t.scheduledDate?new Date(t.scheduledDate).toLocaleDateString():"—")}
                ${$("Est. Hours",t.estimatedHours||"—")}
                ${$("Site Address",g(t.siteAddress||"—"))}
                ${$("Quote Ref",t.quoteId?`<a href="#/quotes/${g(t.quoteId)}">${g(t.quoteId)}</a>`:"—")}
                ${$("Created",new Date(t.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `,(I=h.querySelector("#btn-add-schedule"))==null||I.addEventListener("click",()=>{const K=p.getAll("technicians"),R=p.getAll("schedule").filter(ve=>ve.jobId===s),te=document.createElement("div");function Z(ve,W=[],de=[]){let ye=[];return ve&&ve.forEach((xe,re)=>{const $e=[...W,re].join("-"),qe=[...de,xe.name].join(" > ");ye.push({path:$e,name:qe,isLeaf:!xe.subTasks||xe.subTasks.length===0}),xe.subTasks&&(ye=ye.concat(Z(xe.subTasks,[...W,re],[...de,xe.name])))}),ye}const le=Z(t.tasks||[]);function G(ve){let W="";return ve.forEach((de,ye)=>{W+='<div class="sched-entry" data-index="'+ye+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',W+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',W+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(ye+1)+"</span>",ve.length>1&&(W+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+ye+'" style="padding:2px 8px">✕ Remove</button>'),W+="</div>",W+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',W+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',W+='<select class="form-select sched-task" style="width:100%">',W+='<option value="">-- Select a Task --</option>',le.forEach(re=>{W+=`<option value="${re.path}" ${de.taskPath===re.path?"selected":""}>${g(re.name)}</option>`}),W+="</select></div>",W+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',W+='<input type="datetime-local" class="form-input sched-start" value="'+de.start+'"></div>',W+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',W+='<input type="datetime-local" class="form-input sched-finish" value="'+de.finish+'"></div>',W+="</div>",W+='<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>',W+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',K.forEach(re=>{const $e=de.techIds.includes(re.id),qe=$e?"var(--color-primary)":"var(--border-color)",Ie=$e?"var(--color-primary-light)":"transparent",Ne=$e?"var(--color-primary)":"var(--text-secondary)";W+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+qe+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ie+";color:"+Ne+';transition:all 0.15s">',W+='<input type="checkbox" class="tech-check" data-tech-id="'+re.id+'" '+($e?"checked":"")+' style="display:none">',W+='<span class="material-icons-outlined" style="font-size:14px">person</span>',W+=g(re.name),W+="</label>"}),W+="</div></div>";const xe=p.getAll("assets").filter(re=>re.category==="Business");W+='<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>',W+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">',xe.forEach(re=>{const $e=de.assetIds&&de.assetIds.includes(re.id),qe=$e?"var(--color-primary)":"var(--border-color)",Ie=$e?"var(--color-primary-light)":"transparent",Ne=$e?"var(--color-primary)":"var(--text-secondary)";W+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+qe+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ie+";color:"+Ne+';transition:all 0.15s">',W+='<input type="checkbox" class="asset-check" data-asset-id="'+re.id+'" '+($e?"checked":"")+' style="display:none">',W+='<span class="material-icons-outlined" style="font-size:14px">handyman</span>',W+=g(re.name),W+="</label>"}),xe.length===0&&(W+='<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>'),W+="</div></div></div>"}),W}function X(ve){if(!document.getElementById("sched-modal-styles")){const de=document.createElement("style");de.id="sched-modal-styles",de.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(de)}let W="";R.length>0&&(W+='<div style="margin-bottom:16px">',W+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',R.forEach(de=>{const ye=new Date(de.startTime||de.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});W+='<div class="sched-summary-row" style="flex-wrap:wrap">',W+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',W+='<span style="font-weight:500">'+g(de.technicianName)+"</span>",W+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+g(de.taskName||"General Task")+"</span>",W+='<span style="color:var(--text-tertiary);margin-left:auto">'+ye+"</span>",W+='<span style="font-weight:600;margin-left:12px">'+de.hours+"h</span>",W+="</div>"}),W+="</div>",W+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),W+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',W+='<div id="sched-entries">'+G(ve)+"</div>",W+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',W+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',te.innerHTML=W,te.querySelectorAll(".tech-check").forEach(de=>{const ye=de.closest("label");de.addEventListener("change",()=>{de.checked?(ye.style.borderColor="var(--color-primary)",ye.style.background="var(--color-primary-light)",ye.style.color="var(--color-primary)"):(ye.style.borderColor="var(--border-color)",ye.style.background="transparent",ye.style.color="var(--text-secondary)")})}),te.querySelectorAll(".asset-check").forEach(de=>{const ye=de.closest("label");de.addEventListener("change",()=>{de.checked?(ye.style.borderColor="var(--color-primary)",ye.style.background="var(--color-primary-light)",ye.style.color="var(--color-primary)"):(ye.style.borderColor="var(--border-color)",ye.style.background="transparent",ye.style.color="var(--text-secondary)")})}),te.querySelectorAll(".btn-remove-entry").forEach(de=>{de.addEventListener("click",()=>{ve.splice(parseInt(de.dataset.index),1),X(ve)})}),te.querySelector("#btn-add-entry").addEventListener("click",()=>{const de=re=>re.toString().padStart(2,"0"),ye=new Date;ye.setDate(ye.getDate()+1);const xe=`${ye.getFullYear()}-${de(ye.getMonth()+1)}-${de(ye.getDate())}`;ve.push({taskPath:"",start:`${xe}T08:00`,finish:`${xe}T16:00`,techIds:[],assetIds:[]}),X(ve)})}const ae=ve=>ve.toString().padStart(2,"0"),ie=new Date,ue=`${ie.getFullYear()}-${ae(ie.getMonth()+1)}-${ae(ie.getDate())}`,me=t.technicianId?[t.technicianId]:[],ge=[{taskPath:"",start:`${ue}T08:00`,finish:`${ue}T16:00`,techIds:me,assetIds:[]}];X(ge);function we(){const ve=[];return te.querySelectorAll(".sched-entry").forEach((W,de)=>{var Ie,Ne,Me;const ye=(Ie=W.querySelector(".sched-task"))==null?void 0:Ie.value,xe=(Ne=W.querySelector(".sched-start"))==null?void 0:Ne.value,re=(Me=W.querySelector(".sched-finish"))==null?void 0:Me.value,$e=[...W.querySelectorAll(".tech-check:checked")].map(oe=>oe.dataset.techId),qe=[...W.querySelectorAll(".asset-check:checked")].map(oe=>oe.dataset.assetId);ve.push({taskPath:ye,start:xe,finish:re,techIds:$e,assetIds:qe})}),ve}Se({title:`Schedule Job: ${g(t.title||t.number)}`,content:te,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:ve=>ve()},{label:"Save Schedule",className:"btn-primary",onClick:ve=>{const W=we();let de=0,ye=[];if(W.forEach((xe,re)=>{var Me;if(!xe.taskPath){ye.push(`Entry ${re+1}: please select a task`);return}if(!xe.start||!xe.finish){ye.push(`Entry ${re+1}: missing start or finish`);return}const $e=new Date(xe.start),qe=new Date(xe.finish);if(qe<=$e){ye.push(`Entry ${re+1}: finish must be after start`);return}if(xe.techIds.length===0){ye.push(`Entry ${re+1}: select at least one technician`);return}const Ie=Math.round((qe-$e)/36e5*100)/100,Ne=((Me=le.find(oe=>oe.path===xe.taskPath))==null?void 0:Me.name)||"Unknown Task";xe.techIds.forEach(oe=>{const ke=K.find(Ce=>Ce.id===oe);ke&&(p.create("schedule",{jobId:s,jobNumber:t.number,taskPath:xe.taskPath,taskName:Ne,technicianId:oe,technicianName:ke.name,date:xe.start.split("T")[0],startTime:xe.start,finishTime:xe.finish,hours:Ie}),de++)}),xe.assetIds&&xe.assetIds.length>0&&xe.assetIds.forEach(oe=>{const ke=p.getById("assets",oe);ke&&p.create("assetUsage",{jobId:s,assetId:oe,assetName:ke.name,taskPath:xe.taskPath,taskName:Ne,startTime:xe.start,finishTime:xe.finish,hours:Ie,recoveryRate:ke.recoveryRate||0})})}),ye.length){z(ye[0],"error");return}if(W.length>0&&W[0].start){const re=[...new Set(W.flatMap($e=>$e.techIds))].map($e=>{const qe=K.find(Ne=>Ne.id===$e),Ie=W.filter(Ne=>Ne.techIds.includes($e)).reduce((Ne,Me)=>{const oe=(new Date(Me.finish)-new Date(Me.start))/36e5;return Ne+(isNaN(oe)?0:oe)},0);return{id:$e,name:(qe==null?void 0:qe.name)||"",hours:Math.round(Ie*100)/100}});p.update("jobs",s,{scheduledDate:W[0].start.split("T")[0],technicians:re,technicianName:re.map($e=>$e.name).join(", ")})}z(`${de} schedule ${de===1?"entry":"entries"} saved`,"success"),ve(),u()}}]})})}else if(n==="tasks"){let K=function(G,X){let ae=G[X[0]];if(!ae)return null;for(let ie=1;ie<X.length;ie++)if(!ae.subTasks||(ae=ae.subTasks[X[ie]],!ae))return null;return ae},R=function(G){return!G.subTasks||G.subTasks.length===0?(parseFloat(G.estimatedHours)||0)*(parseInt(G.people)||1):G.subTasks.reduce((X,ae)=>X+R(ae),0)},te=function(G,X){if(X.length<=1)return;const ae=X.slice(0,-1),ie=K(G,ae);if(ie&&ie.subTasks&&ie.subTasks.length>0){let ue=0,me=0;ie.subTasks.forEach(ge=>{const we=(parseFloat(ge.estimatedHours)||1)*(parseInt(ge.people)||1);ue+=we,me+=we*((ge.progress||0)/100)}),ie.progress=ue>0?Math.round(me/ue*100):0,ie.progress===100?ie.status="Completed":ie.progress>0?ie.status="In Progress":ie.status="Not Started",te(G,ae)}};var S=K,x=R,f=te;const Q=JSON.parse(localStorage.getItem("currentUser")||"{}");let Y=!0;if(Q.userTypeId){const G=p.getById("userTypes",Q.userTypeId);if(G&&G.permissions){const X=G.permissions.find(ae=>ae.module==="Jobs");X&&(Y=X.edit)}}else(Q.role==="customer"||Q.role==="technician")&&(Y=!1);t.tasks||(t.tasks=[{id:p.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}]),t.tasks.forEach(G=>{G.subTasks||(G.subTasks=[])});let Z=!0,le=t.tasks;for(let G=0;G<l.length;G++){if(!le||!le[l[G]]){Z=!1;break}le=le[l[G]].subTasks}Z||(l=[]),h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${Y?'<button class="btn btn-sm btn-secondary" id="btn-import-tasklist"><span class="material-icons-outlined" style="font-size:14px">download</span> Import</button>':""}
              ${Y?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${Y?'<button class="btn btn-sm btn-primary" id="btn-save-tasks"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const G=o.length>0?K(t.tasks,o):null,X=G?G.subTasks||[]:t.tasks,ae=G?g(G.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${o.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${ae}">${ae}</span>
                    </div>
                    ${Y?o.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${o.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${X.map((ie,ue)=>{const me=[...o,ue],ge=me.join("-")===l.join("-");return`
                        <div class="task-list-item" data-path="${me.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${ge?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${ge?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${g(ie.name)}">${g(ie.name)}</span>
                          ${ie.subTasks&&ie.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${me.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${me.join("-")}" ${ie.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${X.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${l.length>0?(()=>{const G=l,X=K(t.tasks,G);if(!X)return"";const ae=X.subTasks&&X.subTasks.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${d?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${g(X.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${Y?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${G.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${Y?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${G.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${g(X.name)}" ${Y?"":"disabled"} />
                  </div>
                  ${ae?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${R(X)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${X.startDate?X.startDate.split("T")[0]:""}" ${Y?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${X.estimatedHours||""}" min="0" step="0.5" ${Y?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${X.people||"1"}" min="1" step="1" ${Y?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${X.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${X.progress>50?"#fff":"#000"}">${X.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${Y?"":"disabled"}>${g(X.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${g(X.name)}">Info Panel: ${g(X.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${Y&&G.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${G.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      ${ae?"":`<button class="btn btn-sm btn-secondary btn-book-time" data-path="${G.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>`}
                      ${Y?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                      ${Y?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${G.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${g(X.name)}</div>
                  </div>
                  ${ae?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${R(X)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${X.startDate?X.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${X.estimatedHours?X.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${X.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${X.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${X.progress>50?"#fff":"#000"}">${X.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${g(X.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(j=h.querySelector(".btn-view-back"))==null||j.addEventListener("click",()=>{o.pop(),u()}),h.querySelectorAll(".btn-drill-down").forEach(G=>{G.addEventListener("click",X=>{X.stopPropagation(),o=G.dataset.path.split("-").map(Number),l=[...o],u()})}),h.querySelectorAll(".task-list-checkbox").forEach(G=>{G.addEventListener("change",X=>{const ae=X.target.dataset.path.split("-").map(Number),ie=K(t.tasks,ae);ie.progress=X.target.checked?100:0,ie.status=X.target.checked?"Completed":"Not Started",te(t.tasks,ae),u()}),G.addEventListener("click",X=>X.stopPropagation())}),h.querySelectorAll(".task-list-item").forEach(G=>{G.addEventListener("click",X=>{if(X.target.closest(".btn-drill-down"))return;l=X.currentTarget.dataset.path.split("-").map(Number),d=!1,u()})}),(U=h.querySelector(".btn-edit-info"))==null||U.addEventListener("click",()=>{d=!0,u()}),(P=h.querySelector(".btn-done-info"))==null||P.addEventListener("click",()=>{d=!1,u()}),(O=h.querySelector("#btn-add-main-task"))==null||O.addEventListener("click",()=>{t.tasks||(t.tasks=[]),t.tasks.push({id:p.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),l=[t.tasks.length-1],u()}),h.querySelectorAll(".btn-add-child-task").forEach(G=>{G.addEventListener("click",X=>{const ae=X.currentTarget.dataset.path.split("-").map(Number),ie=K(t.tasks,ae);ie.subTasks||(ie.subTasks=[]),ie.subTasks.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),l=[...ae,ie.subTasks.length-1],u()})}),h.querySelectorAll(".detail-input").forEach(G=>{G.addEventListener("change",X=>{const ae=K(t.tasks,l),ie=X.target.dataset.field;ie==="progress-check"?(ae.progress=X.target.checked?100:0,ae.status=X.target.checked?"Completed":"Not Started"):ie==="progress"?(ae.progress=parseInt(X.target.value),ae.progress===100?ae.status="Completed":ae.progress===0?ae.status="Not Started":ae.status="In Progress"):ie==="estimatedHours"?ae.estimatedHours=parseFloat(X.target.value)||0:ae[ie]=X.target.value,te(t.tasks,l),u()})}),h.querySelectorAll(".btn-remove-task").forEach(G=>{G.addEventListener("click",X=>{const ae=G.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(ae.length===1)t.tasks.splice(ae[0],1);else{const ie=ae.slice(0,-1),ue=K(t.tasks,ie);ue&&ue.subTasks&&ue.subTasks.splice(ae[ae.length-1],1),te(t.tasks,ie)}l=ae.slice(0,-1),d=!1,u()}})}),(H=h.querySelector("#btn-save-tasks"))==null||H.addEventListener("click",()=>{p.update("jobs",s,{tasks:t.tasks}),z("Tasks saved","success")}),(D=h.querySelector("#btn-save-tasklist-template"))==null||D.addEventListener("click",()=>{const G=document.createElement("div");G.innerHTML=`
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
         `,Se({title:"Save Tasklist as Template",content:G,actions:[{label:"Cancel",className:"btn-secondary",onClick:X=>X()},{label:"Save Template",className:"btn-primary",onClick:X=>{const ae=G.querySelector("#tmpl-name").value,ie=G.querySelector("#tmpl-desc").value,ue=G.querySelector("#tmpl-tags").value.split(",").map(ge=>ge.trim()).filter(Boolean);if(!ae){z("Template name is required","error");return}function me(ge){return ge.map(we=>({...we,id:p.generateId(),status:"Not Started",progress:0,subTasks:we.subTasks||we.subPhases?me(we.subTasks||we.subPhases):[]}))}p.create("taskTemplates",{name:ae,description:ie,tags:ue,tasks:me(t.tasks||t.phases||[]),createdAt:new Date().toISOString()}),z("Tasklist saved as template","success"),X()}}]})}),(L=h.querySelector("#btn-import-tasklist"))==null||L.addEventListener("click",()=>{const G=p.getAll("taskTemplates"),X=p.getAll("jobs").filter(me=>me.id!==s&&(me.tasks&&me.tasks.length>0||me.phases&&me.phases.length>0));let ae="templates";const ie=document.createElement("div");ie.innerHTML=`
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;function ue(me=""){const ge=ie.querySelector("#import-content"),we=me.toLowerCase();if(ae==="templates"){const ve=G.filter(W=>W.name.toLowerCase().includes(we)||(W.description||"").toLowerCase().includes(we)||(W.tags||[]).some(de=>de.toLowerCase().includes(we)));ge.innerHTML=ve.length?ve.map(W=>{const de=W.tasks||W.phases||[];return`
               <div class="import-item" data-id="${W.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${g(W.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${de.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${g(W.description||"No description.")}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(W.tags||[]).map(ye=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${g(ye)}</span>`).join("")}
                 </div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${me}"</div>`}else{const ve=X.filter(W=>W.number.toLowerCase().includes(we)||W.title.toLowerCase().includes(we)||W.customerName.toLowerCase().includes(we));ge.innerHTML=ve.length?ve.map(W=>{const de=W.tasks||W.phases||[];return`
               <div class="import-item" data-id="${W.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${g(W.number)} - ${g(W.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${g(W.customerName)} · ${de.length} tasks</div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${me}"</div>`}ge.querySelectorAll(".import-item").forEach(ve=>{ve.addEventListener("click",()=>{var qe;const W=ve.dataset.id,de=ve.dataset.type,ye=p.getAll("taskTemplates"),xe=p.getAll("jobs"),re=de==="template"?ye.find(Ie=>String(Ie.id)===String(W)):xe.find(Ie=>String(Ie.id)===String(W));if(re&&(re.tasks||re.phases)){if(confirm(`Replace current tasklist with "${re.name||re.number}"?`)){let Ie=function(Ne){return Ne.map(Me=>({...Me,id:p.generateId(),status:"Not Started",progress:0,subTasks:Me.subTasks||Me.subPhases?Ie(Me.subTasks||Me.subPhases):[]}))};var $e=Ie;t.tasks=Ie(re.tasks||re.phases),l=[0],o=[],z(`Imported ${re.name||re.number}`,"success"),u(),(qe=document.querySelector(".modal-overlay"))==null||qe.remove()}}else z("Could not find source data","error")})})}ue(),ie.querySelectorAll(".tab").forEach(me=>{me.addEventListener("click",()=>{ie.querySelectorAll(".tab").forEach(ge=>ge.classList.remove("active")),me.classList.add("active"),ae=me.dataset.tab,ie.querySelector("#import-search").placeholder=ae==="templates"?"Search templates...":"Search jobs...",ue(ie.querySelector("#import-search").value)})}),ie.querySelector("#import-search").addEventListener("input",me=>{ue(me.target.value)}),Se({title:"Import Tasklist",content:ie,actions:[{label:"Cancel",className:"btn-secondary",onClick:me=>me()}]})}),h.querySelectorAll(".btn-duplicate-task").forEach(G=>{G.addEventListener("click",X=>{const ae=X.currentTarget.dataset.path.split("-").map(Number),ie=K(t.tasks,ae);function ue(ge,we){return{...ge,id:p.generateId(),name:ge.name+(we?" (Copy)":""),progress:0,status:"Not Started",subTasks:ge.subTasks?ge.subTasks.map(ve=>ue(ve,!1)):[]}}const me=ue(ie,!0);if(ae.length===1)t.tasks.splice(ae[0]+1,0,me);else{const ge=ae.slice(0,-1);K(t.tasks,ge).subTasks.splice(ae[ae.length-1]+1,0,me),te(t.tasks,ge)}u()})}),h.querySelectorAll(".btn-book-time").forEach(G=>{G.addEventListener("click",X=>{const ae=X.currentTarget.dataset.path.split("-").map(Number),ie=K(t.tasks,ae),ue=JSON.parse(localStorage.getItem("currentUser")||"{}"),me=p.getAll("timesheets").filter(re=>re.jobId===s),ge=p.getAll("technicians"),we=new Date,ve=re=>re.toString().padStart(2,"0"),W=`${we.getFullYear()}-${ve(we.getMonth()+1)}-${ve(we.getDate())}`,de=`${W}T09:00`,ye=`${W}T10:00`,xe=document.createElement("div");xe.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${me.reduce((re,$e)=>re+($e.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${me.length?me.map(re=>`
                      <tr>
                        <td>${re.startTime?new Date(re.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(re.date).toLocaleDateString()}</td>
                        <td>${g(re.technicianName)}</td>
                        <td>${g(re.taskName||re.phaseName||"—")}</td>
                        <td style="font-weight:600">${re.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${de}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${ye}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${ge.map(re=>`<option value="${re.id}" ${re.name===ue.name?"selected":""}>${re.name}</option>`).join("")}
              </select>
            </div>
            `,Se({title:"Book Time: "+g(ie.name),size:"modal-70",content:xe,actions:[{label:"Cancel",className:"btn-secondary",onClick:re=>re()},{label:"Log Time",className:"btn-primary",onClick:re=>{const $e=document.getElementById("bt-start").value,qe=document.getElementById("bt-finish").value,Ie=document.getElementById("bt-tech").value,Ne=ie.name;if(!$e||!qe||!Ie){z("Please fill all required fields","error");return}const Me=new Date($e),oe=new Date(qe);if(oe<=Me){z("Finish time must be after start time","error");return}const ke=Math.round((oe-Me)/36e5*100)/100,Ce=ge.find(Le=>Le.id===Ie);p.create("timesheets",{jobId:s,jobNumber:t.number,taskId:ie.id,taskPath:ae.join("-"),taskName:ie.name,phaseId:ie.id,phaseName:ie.name,technicianId:Ie,technicianName:Ce.name,date:$e.split("T")[0],startTime:$e,finishTime:qe,description:Ne,hours:ke,status:"Pending"}),z("Time booked successfully","success"),u(),re()}}]})})})}else if(n==="costs"){let Me=function(){const oe=(t.materials||[]).reduce((Le,De)=>Le+De.quantity*(De.unitCost||0),0),ke=parseFloat(h.querySelector("#inp-material-cost").value)||0,Ce=oe+ke;h.querySelector("#sum-mat").textContent="$"+Ce.toFixed(2),h.querySelector("#sum-total").textContent="$"+(te+Ce).toFixed(2)};var E=Me;if(!t.materials){const ke=p.getAll("quotes").filter(Ce=>Ce.jobId===s||t.quoteId===Ce.id).find(Ce=>Ce.status==="Accepted")||p.getById("quotes",t.quoteId);ke&&ke.sections&&(t.materials=[],ke.sections.forEach(Ce=>{(Ce.lineItems||[]).forEach(Le=>{if(Le.type==="material"){const De=p.getAll("stock").find(Ke=>Ke.name===Le.description);t.materials.push({stockId:De?De.id:null,name:Le.description||"Unknown Material",quantity:Le.qty||1,unitCost:De&&(De.costPrice||De.unitPrice)||0,fromQuote:!0})}})}),p.update("jobs",s,{materials:t.materials}))}t.materials||(t.materials=[]);const Q=p.getAll("timesheets").filter(oe=>oe.jobId===s),Y=p.getAll("technicians"),K={};let R=0,te=0;Q.forEach(oe=>{if(!K[oe.technicianId]){const ke=Y.find(Ce=>Ce.id===oe.technicianId);K[oe.technicianId]={id:oe.technicianId,name:oe.technicianName||(ke?ke.name:"Unknown Tech"),hours:0,rate:ke&&(ke.payRate||ke.hourlyRate)||45}}K[oe.technicianId].hours+=oe.hours||0});const Z=Object.values(K);Z.forEach(oe=>{R+=oe.hours,te+=oe.hours*oe.rate});const le=p.getAll("assetUsage").filter(oe=>oe.jobId===s),G=p.getAll("assets");let X=0;const ae=le.map(oe=>{const ke=G.find(De=>De.id===oe.assetId),Ce=oe.recoveryRate||(ke?ke.recoveryRate:0)||0,Le=oe.hours*Ce;return X+=Le,{...oe,rate:Ce,cost:Le}}),ie=t.materials.reduce((oe,ke)=>oe+ke.quantity*(ke.unitCost||0),0),ue=parseFloat(t.additionalMaterialCost||0),me=ie+ue,ge=p.getSettings(),we=Kt(t.materials,ge),ve=kt(ue,ge),W=we+(ue>0?ve-ue:0)+ue;(t.laborCost!==te||t.estimatedHours!==R||t.materialCost!==me||t.assetCost!==X)&&(t.laborCost=te,t.estimatedHours=R,t.materialCost=me,t.assetCost=X,p.update("jobs",s,{laborCost:te,estimatedHours:R,materialCost:me,assetCost:X}));const de=ge.laborRates.find(oe=>oe.id===t.laborRateProfileId)||ge.laborRates.find(oe=>oe.isDefault),ye=R*(de?de.rate:85),xe=de&&de.minCallOutFee||0,re=Math.max(ye,xe),$e=re+W,qe=te+me+X,Ie=$e-qe,Ne=$e>0?Ie/$e*100:0;h.innerHTML=`
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
                  ${Z.map(oe=>`
                    <tr>
                      <td>${g(oe.name)}</td>
                      <td style="font-weight:600">${oe.hours.toFixed(2)}</td>
                      <td>$${(oe.payRate||oe.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(oe.hours*(oe.payRate||oe.rate)).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${Z.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>':""}
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
                  ${ae.map(oe=>`
                    <tr>
                      <td>${g(oe.assetName)}</td>
                      <td style="font-weight:600">${oe.hours.toFixed(2)}</td>
                      <td>$${oe.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${oe.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${ae.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>':""}
                </tbody>
                ${ae.length>0?`
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${X.toFixed(2)}</td>
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
                  ${ge.laborRates.map(oe=>`<option value="${oe.id}" ${de.id===oe.id?"selected":""}>${oe.name} ($${oe.rate.toFixed(2)}/hr)</option>`).join("")}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${de.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(de.minCallOutFee||0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${re.toFixed(2)}</span>
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
                  ${t.materials.map((oe,ke)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${g(oe.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${oe.quantity} x $${(oe.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(oe.quantity*(oe.unitCost||0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${ke}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join("")}
                  ${t.materials.length===0?'<div class="text-secondary" style="font-size:14px">No materials added.</div>':""}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${y()}
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
                  <span class="text-secondary">Logged Hours</span><span class="font-medium">${R.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(te+me).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${$e.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${Ie>=0?"var(--color-success-bg)":"var(--color-danger-bg)"}; color:${Ie>=0?"var(--color-success)":"var(--color-danger)"}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${Ie.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${Ne.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      `,(N=h.querySelector("#inp-labor-profile"))==null||N.addEventListener("change",oe=>{t.laborRateProfileId=oe.target.value,p.update("jobs",s,{laborRateProfileId:t.laborRateProfileId}),u()}),h.addEventListener("click",oe=>{const ke=oe.target.closest(".btn-remove-mat");if(ke){const Ce=parseInt(ke.dataset.index);t.materials.splice(Ce,1),u()}}),(C=h.querySelector("#btn-refresh-materials"))==null||C.addEventListener("click",()=>{const ke=p.getAll("quotes").filter(De=>De.jobId===s||t.quoteId===De.id).find(De=>De.status==="Accepted")||p.getById("quotes",t.quoteId);if(!ke){z("No linked accepted quote found.","error");return}const Ce=(t.materials||[]).filter(De=>!De.fromQuote),Le=[];ke.sections.forEach(De=>{(De.lineItems||[]).forEach(Ke=>{if(Ke.type==="material"){const it=p.getAll("stock").find(ms=>ms.name===Ke.description);Le.push({stockId:it?it.id:null,name:Ke.description||"Unknown Material",quantity:Ke.qty||1,unitCost:it&&(it.costPrice||it.unitPrice)||0,fromQuote:!0})}})}),t.materials=[...Le,...Ce],p.update("jobs",s,{materials:t.materials}),z("Materials refreshed from Quote","success"),u()}),(k=h.querySelector("#inp-material-cost"))==null||k.addEventListener("input",Me),(_=h.querySelector("#btn-add-material"))==null||_.addEventListener("click",()=>{const oe=h.querySelector("#mat-select"),ke=parseInt(h.querySelector("#mat-qty").value)||1,Ce=oe.value;if(!Ce)return;const Le=p.getById("stock",Ce);if(Le){if(Le.quantity<ke){z(`Not enough stock. Available: ${Le.quantity}`,"error");return}p.update("stock",Ce,{quantity:Le.quantity-ke}),r=null,t.materials.push({stockId:Le.id,name:Le.name,quantity:ke,unitCost:Le.costPrice||Le.unitPrice||0,fromQuote:!1}),z(`Added ${ke}x ${Le.name}`,"success"),u()}}),(M=h.querySelector("#btn-save-costs"))==null||M.addEventListener("click",()=>{const oe=parseFloat(h.querySelector("#inp-material-cost").value)||0,Ce=(t.materials||[]).reduce((Le,De)=>Le+De.quantity*(De.unitCost||0),0)+oe;t.materialCost=Ce,t.additionalMaterialCost=oe,p.update("jobs",s,{materials:t.materials,materialCost:Ce,additionalMaterialCost:oe}),z("Additional costs saved","success"),u()})}else if(n==="quotes"){const Q=p.getAll("quotes").filter(Y=>Y.jobId===s||t.quoteId===Y.id);h.innerHTML=`
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
                ${Q.length?Q.map(Y=>`
                  <tr>
                    <td><a href="#/quotes/${Y.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${g(Y.number)}</a></td>
                    <td>${g(Y.title||"Untitled Quote")}</td>
                    <td><span class="badge ${Y.status==="Accepted"?"badge-success":Y.status==="Declined"?"badge-danger":Y.status==="Sent"?"badge-info":"badge-neutral"}">${g(Y.status)}</span></td>
                    <td style="font-weight:600">$${(Y.total||0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${Y.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(V=h.querySelector("#btn-new-quote"))==null||V.addEventListener("click",()=>{const Y=p.create("quotes",{customerId:t.customerId,customerName:t.customerName,title:t.title,jobId:t.id,status:"Draft",version:1,sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});z("Draft quote created","success"),B.navigate("/quotes/"+Y.id)})}else if(n==="activity")t.activityLog||(t.activityLog=[]),t.activityLog=t.activityLog.map(Q=>Q.type==="note"||Q.type==="attachment"?{id:Q.id,type:"combined",date:Q.date,content:Q.type==="note"?Q.content:"",files:Q.type==="attachment"?[Q.file]:[]}:Q),h.innerHTML=`
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
              ${b.map((Q,Y)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${g(Q.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${Y}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join("")}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${t.activityLog.length?t.activityLog.map((Q,Y)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${Q.files&&Q.files.length?"attachment":"chat_bubble_outline"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(Q.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${g(Q.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${Q.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${g(Q.content)}</div>`:""}
                      ${Q.files&&Q.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${Q.files.map(K=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${K.type&&K.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${g(K.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${g(K.name)}">${g(K.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(K.size/1024).toFixed(1)} KB</div>
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
      `,setTimeout(()=>{h.querySelectorAll(".activity-log-item").forEach(Q=>{const Y=Q.querySelector(".activity-content-wrapper"),K=Q.querySelector(".expand-overlay");Y&&Y.scrollHeight>200&&(K.style.display="flex",Q.style.paddingBottom="32px",K.addEventListener("click",()=>{Q.dataset.expanded==="false"?(Y.style.maxHeight=Y.scrollHeight+"px",K.style.background="transparent",K.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',Q.dataset.expanded="true"):(Y.style.maxHeight="200px",K.style.background="linear-gradient(transparent, var(--content-bg))",K.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',Q.dataset.expanded="false")}))})},0),h.querySelectorAll(".btn-remove-staged").forEach(Q=>{Q.addEventListener("click",Y=>{const K=parseInt(Y.currentTarget.dataset.idx);b.splice(K,1),u()})}),(ne=h.querySelector("#btn-add-note"))==null||ne.addEventListener("click",()=>{const Q=h.querySelector("#new-note-input").value.trim();!Q&&!b.length||(t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:Q,files:[...b],date:new Date().toISOString()}),p.update("jobs",s,{activityLog:t.activityLog}),b=[],u())}),(F=h.querySelector("#upload-attachment"))==null||F.addEventListener("change",Q=>{const Y=Array.from(Q.target.files);if(!Y.length)return;let K=0;Y.forEach(R=>{const te=new FileReader;te.onload=Z=>{b.push({name:R.name,size:R.size,type:R.type,data:Z.target.result}),K++,K===Y.length&&u()},te.readAsDataURL(R)})}),h.querySelectorAll(".btn-delete-activity").forEach(Q=>{Q.addEventListener("click",()=>{t.activityLog=t.activityLog.filter(Y=>Y.id!==Q.dataset.id),p.update("jobs",s,{activityLog:t.activityLog}),u()})});else if(n==="timesheets"){const Q=p.getAll("timesheets").filter(R=>R.jobId===s),Y=Q.reduce((R,te)=>R+(te.hours||0),0),K=p.getAll("technicians");h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${Y} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Task</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
                      ${Q.length?Q.map(R=>{const te=String(R.technicianId)===String(currentUser.id),Z=["admin","manager","office"].includes(currentUser.role)||te&&R.status!=="Approved",le=["admin","manager","office"].includes(currentUser.role)||te&&R.status!=="Approved";return`
                  <tr>
                    <td>${new Date(R.date).toLocaleDateString()}</td>
                    <td>${g(R.technicianName)}</td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${g(R.taskName||"—")}</span></td>
                    <td class="text-secondary">${g(R.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${R.hours}</td>
                    <td><span class="badge ${R.status==="Approved"?"badge-success":R.status==="Rejected"?"badge-danger":"badge-warning"}">${R.status}</span></td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${Z?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${R.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:16px">edit</span>
                          </button>
                        `:""}
                        ${le?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-ts-job" data-id="${R.id}" title="Delete entry" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:16px">delete</span>
                          </button>
                        `:""}
                      </div>
                    </td>
                  </tr>
                `}).join(""):'<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,h.querySelectorAll(".btn-edit-ts-job").forEach(R=>{R.addEventListener("click",()=>{const te=R.dataset.id;as(te,u)})}),h.querySelectorAll(".btn-delete-ts-job").forEach(R=>{R.addEventListener("click",()=>{const te=R.dataset.id,Z=p.getById("timesheets",te);Z&&Se({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${Z.hours} hrs</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:le=>le()},{label:"Delete",className:"btn-danger",onClick:le=>{p.delete("timesheets",te),z("Timesheet entry deleted successfully","success"),le(),u()}}]})})}),(J=h.querySelector("#btn-log-time-tab"))==null||J.addEventListener("click",()=>{const R=JSON.parse(localStorage.getItem("currentUser")||"{}"),te=new Date,Z=ue=>ue.toString().padStart(2,"0"),le=`${te.getFullYear()}-${Z(te.getMonth()+1)}-${Z(te.getDate())}`;function G(ue,me=[],ge=[]){let we=[];return ue&&ue.forEach((ve,W)=>{const de=[...me,W].join("-"),ye=[...ge,ve.name].join(" > ");we.push({path:de,name:ye,isLeaf:!ve.subTasks||ve.subTasks.length===0}),ve.subTasks&&(we=we.concat(G(ve.subTasks,[...me,W],[...ge,ve.name])))}),we}const ae=G(t.tasks||[]).filter(ue=>ue.isLeaf),ie=document.createElement("div");ie.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${le}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech" ${R.role==="technician"?"disabled":""}>
                <option value="">Select tech...</option>
                ${K.map(ue=>`<option value="${ue.id}" ${ue.name===R.name?"selected":""}>${ue.name}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: 1 / -1">
              <label class="form-label">Task *</label>
              <select class="form-select" id="lt-task" style="width:100%">
                <option value="">Select task...</option>
                ${ae.map(ue=>`<option value="${ue.path}">${g(ue.name)}</option>`).join("")}
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
        `,showDrawer({title:"Log Time",content:ie.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:ue=>ue()},{label:"Save",className:"btn-primary",onClick:ue=>{const me=document.querySelector(".drawer-overlay"),ge=me.querySelector("#lt-date").value,we=me.querySelector("#lt-tech").value,ve=me.querySelector("#lt-task").value,W=parseFloat(me.querySelector("#lt-hours").value),de=me.querySelector("#lt-desc").value;if(!ge||!we||isNaN(W)||!ve){z("Please fill all required fields, including the task","error");return}const ye=K.find($e=>$e.id===we),xe=ae.find($e=>$e.path===ve),re=xe?xe.name:"";p.create("timesheets",{jobId:s,jobNumber:t.number,taskId:ve,taskName:re,technicianId:we,technicianName:ye.name,date:ge,hours:W,description:de,status:"Pending"}),z("Time logged successfully","success"),u(),ue()}}]})})}else if(n==="forms")t.forms=t.forms||[],h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${t.forms.length?t.forms.map(Q=>`
                  <tr>
                    <td class="font-medium">${g(Q.type)}</td>
                    <td>${new Date(Q.date).toLocaleString()}</td>
                    <td>${g(Q.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(be=h.querySelector("#btn-add-form"))==null||be.addEventListener("click",()=>{const Q=document.createElement("div");Q.innerHTML=`
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
          `,showDrawer({title:"Complete Form",content:Q.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:Y=>Y()},{label:"Submit",className:"btn-primary",onClick:Y=>{const K=document.querySelector(".drawer-overlay");t.forms.push({type:K.querySelector("#new-form-type").value,notes:K.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),p.update("jobs",s,{forms:t.forms}),z("Form submitted successfully","success"),u(),Y()}}]})});else if(n==="pos"){const Q=p.getAll("purchaseOrders").filter(Y=>Y.jobId===s);h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${Q.length?Q.map(Y=>`
                  <tr>
                    <td><a href="#/purchase-orders/${g(Y.id)}">${g(Y.number)}</a></td>
                    <td>${g(Y.supplierName||"—")}</td>
                    <td>${Y.issueDate?new Date(Y.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(Y.total||0).toFixed(2)}</td>
                    <td><span class="badge ${Y.status==="Received"?"badge-success":Y.status==="Draft"?"badge-neutral":Y.status==="Cancelled"?"badge-danger":"badge-primary"}">${Y.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ce=h.querySelector("#btn-raise-po"))==null||ce.addEventListener("click",()=>{p.getAll("suppliers");const Y=p.getAll("stock"),K=document.createElement("div");K.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <input type="text" class="form-input" id="po-supplier" placeholder="e.g. Reece Plumbing" />
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${Y.map(R=>`<option value="${R.id}">${R.name} - $${R.costPrice||0}</option>`).join("")}
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
        `,showDrawer({title:"Quick Purchase Order",content:K.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Create PO",className:"btn-primary",onClick:R=>{const te=document.querySelector(".drawer-overlay"),Z=te.querySelector("#po-supplier").value,le=te.querySelector("#po-part").value,G=parseInt(te.querySelector("#po-qty").value)||1,X=te.querySelector("#po-date").value;if(!Z||!le){z("Supplier and Part are required","error");return}const ae=Y.find(ie=>ie.id===le);p.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:s,supplierName:Z,issueDate:new Date().toISOString(),expectedDate:X,status:"Draft",items:[{stockId:le,name:ae.name,quantity:G,unitCost:ae.costPrice||0,total:(ae.costPrice||0)*G}],total:(ae.costPrice||0)*G}),z("Quick PO Created","success"),u(),R()}}]})})}else if(n==="invoices"){let Y=function(R,te,Z){const le=p.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:R,jobId:s,jobNumber:t.number,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,status:"Draft",sections:te,subtotal:Z,tax:Z*.1,total:Z*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+2592e6).toISOString()});p.update("jobs",s,{status:"Invoiced"}),z(`${R} Invoice created`,"success"),B.navigate(`/invoices/${le.id}`)},K=function(){let R=[],te=0;if(t.quoteId){const Z=p.getById("quotes",t.quoteId);Z&&Z.sections&&Z.sections.length>0?(R=JSON.parse(JSON.stringify(Z.sections)),te=Z.subtotal||0):Z&&Z.lineItems&&(R=[{id:p.generateId(),name:"Main Phase",lineItems:JSON.parse(JSON.stringify(Z.lineItems))}],te=Z.subtotal||0)}if(R.length===0){const Z=t.tasks||t.phases||[];if(Z.length>0){R=Z.map(X=>({id:p.generateId(),name:X.name,lineItems:[{description:`${X.name} - Labor & Materials`,type:"other",qty:1,rate:0,total:0}],subtotal:0}));const le=t.laborCost||0,G=t.materialCost||0;(le>0||G>0)&&(R[0].lineItems.push({description:"Estimated Job Labor",type:"labor",qty:1,rate:le,total:le}),R[0].lineItems.push({description:"Estimated Job Materials",type:"material",qty:1,rate:G,total:G}))}else{const le=t.laborCost||0,G=t.materialCost||0;R=[{id:p.generateId(),name:"General Items",lineItems:[{description:`${t.title} - Labor`,type:"labor",qty:1,rate:le,total:le},{description:`${t.title} - Materials`,type:"material",qty:1,rate:G,total:G}]}]}te=R.reduce((le,G)=>le+G.lineItems.reduce((X,ae)=>X+(ae.total||0),0),0)}return{sections:R,subtotal:te}};var T=Y,A=K;const Q=p.getAll("invoices").filter(R=>R.jobId===s);h.innerHTML=`
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
                ${Q.length?Q.map(R=>`
                  <tr>
                    <td><a href="#/invoices/${g(R.id)}">${g(R.number)}</a></td>
                    <td><span class="badge badge-neutral">${g(R.invoiceType||"Standard")}</span></td>
                    <td>${R.issueDate?R.issueDate.split("T")[0]:"—"}</td>
                    <td>${R.dueDate?R.dueDate.split("T")[0]:"—"}</td>
                    <td style="font-weight:600;">$${(R.total||0).toFixed(2)}</td>
                    <td><span class="badge ${R.status==="Paid"?"badge-success":R.status==="Draft"?"badge-neutral":R.status==="Overdue"?"badge-danger":"badge-info"}">${R.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ee=h.querySelector("#btn-create-standard-invoice"))==null||ee.addEventListener("click",()=>{const{sections:R,subtotal:te}=K();Y("Standard",R,te)}),(se=h.querySelector("#btn-create-deposit-invoice"))==null||se.addEventListener("click",()=>{const R=[{id:p.generateId(),name:"Deposit",lineItems:[{description:`Deposit for Job ${t.number}`,type:"other",qty:1,rate:0,total:0}],subtotal:0}];Y("Deposit",R,0)}),(pe=h.querySelector("#btn-create-progress-invoice"))==null||pe.addEventListener("click",()=>{const R=document.createElement("div");R.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,Se({title:"Create Progress Invoice",content:R,actions:[{label:"Cancel",className:"btn-secondary",onClick:te=>te()},{label:"Create",className:"btn-primary",onClick:te=>{const Z=parseFloat(document.getElementById("progress-percent").value)||0;if(Z<=0||Z>100){z("Enter a valid percentage (1-100)","error");return}const{subtotal:le}=K(),G=le*(Z/100),X=[{id:p.generateId(),name:`Progress Payment (${Z}%)`,lineItems:[{description:`Progress Payment (${Z}% of job)`,type:"other",qty:1,rate:G,total:G}],subtotal:G}];Y("Progress",X,G),te()}}]})})}}function m(){var h,S;e.querySelectorAll(".tab").forEach(x=>{x.addEventListener("click",()=>{n=x.dataset.tab,e.querySelectorAll(".tab").forEach(f=>f.classList.remove("active")),x.classList.add("active"),u()})}),(h=e.querySelector("#btn-edit-job"))==null||h.addEventListener("click",()=>B.navigate(`/jobs/${s}/edit`)),(S=e.querySelector("#btn-delete-job"))==null||S.addEventListener("click",()=>{const x=document.createElement("div");x.innerHTML=`<p>Delete job <strong>${g(t.number)}</strong>?</p>`,Se({title:"Delete Job",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Delete",className:"btn-danger",onClick:f=>{p.delete("jobs",s),z("Job deleted","success"),f(),B.navigate("/jobs")}}]})})}i();function $(h,S){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${h}</span><span>${S}</span></div>`}function v(h){const S=p.getAll("formInstances").filter(f=>f.jobId===s),x=p.getAll("formTemplates");h.innerHTML=`
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
              ${S.map(f=>{const E=x.find(I=>I.id===f.templateId),T=f.status==="Completed",A=f.submittedBy?p.getById("people",f.submittedBy):null;return`
                  <tr>
                    <td class="font-medium">${g((E==null?void 0:E.name)||"Unknown Form")}</td>
                    <td><span class="badge ${T?"badge-success":"badge-warning"}">${f.status}</span></td>
                    <td>${A?g(`${A.firstName} ${A.lastName}`):"—"}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${f.submittedAt?new Date(f.submittedAt).toLocaleDateString():"—"}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${T?"btn-secondary":"btn-primary"} btn-sm fill-form" data-id="${f.id}" title="${T?"View / Edit":"Fill Form"}">
                          <span class="material-icons-outlined" style="font-size:16px">${T?"visibility":"edit_note"}</span>
                        </button>
                        ${T?`<button class="btn btn-secondary btn-icon btn-sm print-form" data-id="${f.id}" title="Print / PDF"><span class="material-icons-outlined" style="font-size:18px">print</span></button>`:""}
                        ${T?"":`<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${f.id}" style="color:var(--color-danger)" title="Remove Form"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              ${S.length?"":'<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,h.querySelector("#btn-attach-form").addEventListener("click",()=>w()),h.querySelectorAll(".fill-form").forEach(f=>{f.addEventListener("click",()=>q(f.dataset.id))}),h.querySelectorAll(".remove-form-instance").forEach(f=>{f.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this form from the job?")){const E=f.dataset.id,T=p.getAll("formInstances");p.save("formInstances",T.filter(A=>A.id!==E)),v(h)}})}),h.querySelectorAll(".print-form").forEach(f=>{f.addEventListener("click",()=>{const E=p.getById("formInstances",f.dataset.id),T=p.getById("formTemplates",E.templateId),A=E.submittedBy?p.getById("people",E.submittedBy):null;fe(async()=>{const{showPrintPreview:I}=await Promise.resolve().then(()=>aa);return{showPrintPreview:I}},void 0).then(({showPrintPreview:I})=>{var j;I({type:"form",data:{...E,template:T,jobNumber:t.number,customerName:((j=p.getById("people",t.customerId))==null?void 0:j.companyName)||"Unknown Customer",submittedByName:A?`${A.firstName} ${A.lastName}`:"Unknown Technician",number:`F-${t.number}-${E.id.slice(3,7).toUpperCase()}`}})})})})}function w(){const h=p.getAll("formTemplates"),x=p.getAll("formInstances").filter(E=>E.jobId===s).map(E=>E.templateId),f=document.createElement("div");f.style.minWidth="450px",f.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:12px">
        ${h.map(E=>{const T=x.includes(E.id);return`
            <div class="card attach-template-item ${T?"disabled":""}" data-id="${E.id}" style="cursor:${T?"not-allowed":"pointer"}; opacity:${T?"0.6":"1"}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${g(E.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(E.sections||[]).reduce((A,I)=>A+I.fields.length,0)} fields</div>
                </div>
                ${T?'<span class="badge badge-neutral">Already Attached</span>':'<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `}).join("")}
        ${h.length?"":'<div class="text-center text-tertiary">No templates available.</div>'}
      </div>
    `,f.querySelectorAll(".attach-template-item:not(.disabled)").forEach(E=>{E.addEventListener("click",()=>{var I;const T=E.dataset.id,A=p.getAll("formInstances");A.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:s,templateId:T,responses:{},status:"Pending",createdAt:new Date().toISOString()}),p.save("formInstances",A),z("Form attached to job","success"),(I=document.querySelector(".modal-overlay"))==null||I.remove(),v(e.querySelector("#tab-content"))})}),Se({title:"Attach Compliance Form",content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()}]})}function q(h){const x=p.getAll("formInstances").find(A=>A.id===h),f=p.getById("formTemplates",x.templateId),E=x.status==="Completed",T=document.createElement("div");T.innerHTML=`
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${g(f.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${g(f.description||"")}</div>
      </div>
      <form id="active-job-form">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px">
          ${(f.sections||[]).map(A=>A.isSpacer?`<div style="grid-column: span ${A.width==="half"?"1":"2"}"></div>`:`
            <div class="form-section" style="grid-column: span ${A.width==="half"?"1":"2"}; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; overflow:hidden">
              <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color); border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${g(A.title)}</h4>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; padding:16px">
                ${A.fields.map(I=>{if(I.type==="spacer")return`<div style="grid-column: span ${I.width==="half"?"1":"2"}"></div>`;if(I.type==="info")return`
          <div class="form-group" style="margin:0; grid-column: span ${I.width==="half"?"1":"2"}; padding:16px; background:var(--color-primary-light); border-radius:6px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
            <div style="display:flex; gap:12px">
              <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0">info</span>
              <div>${g(I.label).replace(/\n/g,"<br/>")}</div>
            </div>
          </div>
        `;const j=x.responses[I.id]||"";let U="";return I.type==="text"?U=`<input class="form-input" name="${I.id}" value="${g(j)}" ${I.required?"required":""} />`:I.type==="textarea"?U=`<textarea class="form-textarea" name="${I.id}" rows="3" ${I.required?"required":""}>${g(j)}</textarea>`:I.type==="checkbox"?U=`
                       <label style="display:flex; align-items:center; gap:10px; cursor:pointer">
                         <input type="checkbox" name="${I.id}" ${j?"checked":""} style="width:18px; height:18px" />
                         <span style="font-size:14px">${I.label}</span>
                       </label>`:I.type==="select"?U=`
                       <select class="form-select" name="${I.id}" ${I.required?"required":""}>
                         <option value="">Select option...</option>
                         ${(I.options||[]).map(P=>`<option value="${g(P)}" ${j===P?"selected":""}>${g(P)}</option>`).join("")}
                       </select>`:I.type==="date"?U=`<input type="date" class="form-input" name="${I.id}" value="${j}" ${I.required?"required":""} />`:I.type==="signature"&&(U=`
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${j?`<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${g(j)}</span>`:"Digitally Signed on submission"}
                       </div>`),`
                    <div class="form-group" style="margin:0; grid-column: span ${I.width==="half"?"1":"2"}">
                      ${I.type!=="checkbox"?`<label class="form-label" style="font-weight:500">${g(I.label)} ${I.required?'<span style="color:var(--color-danger)">*</span>':""}</label>`:""}
                      ${U}
                    </div>
                  `}).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </form>
    `,Se({title:E?"Edit Form Response":"Complete Job Form",content:T,size:"modal-xl",actions:[{label:"Cancel",className:"btn-secondary",onClick:A=>A()},{label:E?"Update Form":"Submit Form",className:"btn-primary",onClick:A=>{var D,L;const I=T.querySelector("#active-job-form");if(!I.checkValidity())return I.reportValidity();const j=new FormData(I),U={};(f.sections||[]).forEach(N=>{N.isSpacer||N.fields.forEach(C=>{var k;C.type==="spacer"||C.type==="info"||(C.type==="checkbox"?U[C.id]=j.has(C.id):U[C.id]=j.get(C.id),C.type==="signature"&&(U[C.id]=((k=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:k.name)||"Unknown"))})});const P=p.getAll("formInstances"),O=P.findIndex(N=>N.id===h);P[O]={...P[O],responses:U,status:"Completed",submittedBy:(D=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:D.id,submittedAt:new Date().toISOString()},p.save("formInstances",P),z(E?"Form updated successfully":"Form submitted successfully","success"),A(),v(e.querySelector("#tab-content"));const H=p.getAll("activity")||[];H.push({id:Date.now(),jobId:s,type:"form_submission",text:E?`Form "${f.name}" was updated.`:`Form "${f.name}" submitted.`,user:(L=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:L.name,timestamp:new Date().toISOString()}),p.save("activity",H)}}]})}}const ia=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function os(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("jobs",s):{},c=p.getAll("customers"),n=p.getAll("contractors").filter(C=>C.active);let l=a.tags?[...a.tags]:[];function o(C){return c.find(k=>k.id===C)||null}function d(C,k){const _=o(C);return!_||!_.sites||_.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+_.sites.map((M,V)=>`<option value="${V}" data-address="${g(M.address)}" data-name="${g(M.name)}" ${k===M.name?"selected":""}>${g(M.name)} — ${g(M.address)}</option>`).join("")}function r(C,k,_){const M=o(C);return!M||!M.contacts||M.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${_}</option>`+M.contacts.map((V,ne)=>`<option value="${ne}" ${k===V.name?"selected":""}>${g(V.name)} (${g(V.role||"")})</option>`).join("")}function b(){return ia.map(C=>`<button type="button" class="tag-pill ${l.includes(C)?"tag-pill-active":""}" data-tag="${g(C)}">${g(C)}</button>`).join("")}const y=a.customerId||"";e.innerHTML=`
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
            <input class="form-input" name="title" value="${g(a.title||"")}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${c.map(C=>`<option value="${C.id}" ${a.customerId===C.id?"selected":""}>${g(C.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(C=>`<option ${a.type===C?"selected":""}>${C}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${y?"":"disabled"}>
              ${d(y,a.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${a.siteAddress?g(a.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${y?"":"disabled"}>
                ${r(y,a.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${y?"":"disabled"}>
                ${r(y,a.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(C=>`<option ${a.status===C?"selected":""}>${C}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(C=>`<option ${a.priority===C?"selected":""}>${C}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${n.map(C=>`<option value="${C.id}" ${a.contractorId===C.id?"selected":""}>${g(C.businessName)}</option>`).join("")}
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
  `,e.querySelectorAll("#job-form-tabs .tab").forEach(C=>{C.addEventListener("click",k=>{e.querySelectorAll("#job-form-tabs .tab").forEach(M=>M.classList.remove("active")),k.currentTarget.classList.add("active");const _=k.currentTarget.dataset.tab;e.querySelector("#jf-tab-details").style.display=_==="details"?"block":"none",e.querySelector("#jf-tab-tasks").style.display=_==="tasks"?"block":"none",e.querySelector("#jf-tab-forms").style.display=_==="forms"?"block":"none",_==="tasks"&&O(),_==="forms"&&N()})});const i=e.querySelector("#jf-customer"),u=e.querySelector("#jf-site"),m=e.querySelector("#jf-site-hint"),$=e.querySelector("#jf-primary-contact"),v=e.querySelector("#jf-additional-contact");function w(C){const k=!C;u.innerHTML=d(C,""),u.disabled=k,$.innerHTML=r(C,"","Select primary contact..."),$.disabled=k,v.innerHTML=r(C,"","None"),v.disabled=k,m.textContent=k?"Select a customer to enable jobsite selection":"Select a jobsite above"}i.addEventListener("change",C=>w(C.target.value)),u.addEventListener("change",C=>{const k=C.target.selectedOptions[0];m.textContent=(k==null?void 0:k.dataset.address)||""}),e.querySelector("#jf-tags").addEventListener("click",C=>{const k=C.target.closest(".tag-pill");if(!k)return;const _=k.dataset.tag;l.includes(_)?(l=l.filter(M=>M!==_),k.classList.remove("tag-pill-active")):(l.push(_),k.classList.add("tag-pill-active"))});const q=e.querySelector("#job-description-editor"),h=e.querySelector("#editor-toolbar");h.addEventListener("mousedown",C=>{const k=C.target.closest("button[data-cmd]");if(!k)return;C.preventDefault();const _=k.dataset.cmd,M=k.dataset.val||null;document.execCommand(_,!1,M),q.focus()}),e.querySelector("#editor-link-btn").addEventListener("click",()=>{const C=prompt("Enter URL:","https://");C&&document.execCommand("createLink",!1,C),q.focus()}),q.addEventListener("keyup",S),q.addEventListener("mouseup",S);function S(){h.querySelectorAll("button[data-cmd]").forEach(C=>{try{C.classList.toggle("active",document.queryCommandState(C.dataset.cmd))}catch{}})}const x=e.querySelector("#is-emergency"),f=e.querySelector("#emergency-dispatch-suggestion"),E=e.querySelector("#dispatch-reason"),T=e.querySelector("#job-priority");function A(C){if(C){T.value="Urgent",f.style.display="block";const k=p.getAll("people").filter(_=>_.type==="Staff");if(k.length>0){const _=k[Math.floor(Math.random()*k.length)],M=Math.floor(Math.random()*15)+5;E.innerHTML=`Based on current GPS location, <strong>${_.firstName} ${_.lastName}</strong> is the most suitable technician (approx. ${M} mins away).`}else E.innerHTML="No internal technicians available for dispatch."}else f.style.display="none"}if(x==null||x.addEventListener("change",C=>A(C.target.checked)),a.isEmergency&&A(!0),!t){const C=e.querySelector("#is-recurring"),k=e.querySelector("#recurring-options");C==null||C.addEventListener("change",_=>{k.style.display=_.target.checked?"flex":"none"})}e.querySelector("#btn-cancel").addEventListener("click",()=>B.navigate(t?`/jobs/${s}`:"/jobs"));let I=a.tasks?JSON.parse(JSON.stringify(a.tasks)):[{id:p.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subTasks:[]}];I.forEach(C=>{C.subTasks||(C.subTasks=[])});let j=[0],U=[];function P(C,k){let _=C[k[0]];if(!_)return null;for(let M=1;M<k.length;M++)if(!_.subTasks||(_=_.subTasks[k[M]],!_))return null;return _}function O(){var F,J,be,ce;const C=e.querySelector("#jf-task-container");if(!C)return;let k=!0,_=I;for(let ee=0;ee<j.length;ee++){if(!_||!_[j[ee]]){k=!1;break}_=_[j[ee]].subTasks}k||(j=[]);const M=U.length>0?P(I,U):null,V=M?M.subTasks||[]:I,ne=M?g(M.name):"Main Tasks";C.innerHTML=`
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
                ${U.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${ne}">${ne}</span>
              </div>
              ${U.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${U.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${V.map((ee,se)=>{const pe=[...U,se],Q=pe.join("-")===j.join("-");return`
                  <div class="task-list-item" data-path="${pe.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${Q?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${Q?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${g(ee.name)}">${g(ee.name)}</span>
                    ${ee.subTasks&&ee.subTasks.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${pe.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${V.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${j.length>0?(()=>{const ee=j,se=P(I,ee);if(!se)return"";const pe=se.subTasks&&se.subTasks.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${g(se.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${ee.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${ee.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${ee.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${g(se.name)}" />
                </div>
                ${pe?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${se.startDate?se.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${se.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${se.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${g(se.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(F=C.querySelector(".btn-view-back"))==null||F.addEventListener("click",()=>{U.pop(),O()}),C.querySelectorAll(".btn-drill-down").forEach(ee=>{ee.addEventListener("click",se=>{se.stopPropagation(),U=ee.dataset.path.split("-").map(Number),j=[...U],O()})}),C.querySelectorAll(".task-list-item").forEach(ee=>{ee.addEventListener("click",()=>{j=ee.dataset.path.split("-").map(Number),O()})}),(J=C.querySelector("#btn-add-main-task"))==null||J.addEventListener("click",()=>{I.push({id:p.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),j=[I.length-1],O()}),C.querySelectorAll(".btn-add-child-task").forEach(ee=>{ee.addEventListener("click",()=>{const se=ee.dataset.path.split("-").map(Number),pe=P(I,se);pe&&(pe.subTasks||(pe.subTasks=[]),pe.subTasks.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),j=[...se,pe.subTasks.length-1],U=[...se],O())})}),C.querySelectorAll(".btn-remove-task").forEach(ee=>{ee.addEventListener("click",()=>{const se=ee.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(se.length===1)I.splice(se[0],1),j=I.length>0?[0]:[];else{const pe=P(I,se.slice(0,-1));pe&&pe.subTasks&&pe.subTasks.splice(se[se.length-1],1),j=[...se.slice(0,-1)]}O()}})}),C.querySelectorAll(".detail-input").forEach(ee=>{ee.addEventListener("input",se=>{const pe=se.target.dataset.field,Q=se.target.value,Y=P(I,j);if(Y&&(pe==="estimatedHours"?Y[pe]=parseFloat(Q)||0:pe==="people"?Y[pe]=parseInt(Q)||1:Y[pe]=Q,pe==="name")){const K=C.querySelector(`.task-list-item[data-path="${j.join("-")}"] span:first-child`);K&&(K.textContent=Q,K.title=Q);const R=C.querySelector("h4[title]");R&&(R.textContent="Task Settings: "+Q,R.title=Q)}})}),(be=e.querySelector("#btn-save-as-template"))==null||be.addEventListener("click",()=>{const ee=document.createElement("div");ee.innerHTML=`
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
      `,Se({title:"Save Tasklist as Template",content:ee,actions:[{label:"Cancel",className:"btn-secondary",onClick:se=>se()},{label:"Save Template",className:"btn-primary",onClick:se=>{const pe=ee.querySelector("#tmpl-name").value,Q=ee.querySelector("#tmpl-desc").value,Y=ee.querySelector("#tmpl-tags").value.split(",").map(R=>R.trim()).filter(Boolean);if(!pe){z("Template name is required","error");return}function K(R){return R.map(te=>({...te,id:p.generateId(),status:"Not Started",progress:0,subTasks:te.subTasks?K(te.subTasks):[]}))}p.create("taskTemplates",{name:pe,description:Q,tags:Y,tasks:K(I),createdAt:new Date().toISOString()}),z("Tasklist saved as template","success"),se()}}]})}),(ce=e.querySelector("#btn-import-tasklist"))==null||ce.addEventListener("click",()=>{const ee=p.getAll("taskTemplates"),se=p.getAll("jobs").filter(K=>K.id!==s&&K.tasks&&K.tasks.length>0);let pe="templates";const Q=document.createElement("div");Q.innerHTML=`
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
      `;function Y(K=""){const R=Q.querySelector("#import-content"),te=K.toLowerCase();if(pe==="templates"){const Z=ee.filter(le=>le.name.toLowerCase().includes(te)||(le.description||"").toLowerCase().includes(te)||(le.tags||[]).some(G=>G.toLowerCase().includes(te)));R.innerHTML=Z.length?Z.map(le=>`
            <div class="import-item" data-id="${le.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${g(le.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(le.tasks||le.phases||[]).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${g(le.description||"No description.")}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(le.tags||[]).map(G=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${g(G)}</span>`).join("")}
              </div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${K}"</div>`}else{const Z=se.filter(le=>le.number.toLowerCase().includes(te)||le.title.toLowerCase().includes(te)||le.customerName.toLowerCase().includes(te));R.innerHTML=Z.length?Z.map(le=>`
            <div class="import-item" data-id="${le.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${g(le.number)} - ${g(le.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${g(le.customerName)} · ${(le.tasks||le.phases||[]).length} tasks</div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${K}"</div>`}R.querySelectorAll(".import-item").forEach(Z=>{Z.addEventListener("click",()=>{var me;const le=Z.dataset.id,G=Z.dataset.type,X=p.getAll("taskTemplates"),ae=p.getAll("jobs"),ie=G==="template"?X.find(ge=>String(ge.id)===String(le)):ae.find(ge=>String(ge.id)===String(le));if(ie&&(ie.tasks||ie.phases)){const ge=ie.tasks||ie.phases;if(confirm(`Replace current tasklist with "${ie.name||ie.number}"?`)){let we=function(ve){return ve.map(W=>({...W,id:p.generateId(),status:"Not Started",progress:0,subTasks:W.subTasks||W.subPhases?we(W.subTasks||W.subPhases):[]}))};var ue=we;I=we(ge),j=[0],U=[],z(`Imported ${ie.name||ie.number}`,"success"),O(),(me=document.querySelector(".modal-overlay"))==null||me.remove()}}else z("Could not find source data","error")})})}Y(),Q.querySelectorAll(".tab").forEach(K=>{K.addEventListener("click",()=>{Q.querySelectorAll(".tab").forEach(R=>R.classList.remove("active")),K.classList.add("active"),pe=K.dataset.tab,Q.querySelector("#import-search").placeholder=pe==="templates"?"Search templates...":"Search jobs...",Y(Q.querySelector("#import-search").value)})}),Q.querySelector("#import-search").addEventListener("input",K=>{Y(K.target.value)}),Se({title:"Import Tasklist",content:Q,actions:[{label:"Cancel",className:"btn-secondary",onClick:K=>K()}]})})}const H=p.getAll("formTemplates"),D=t?p.getAll("formInstances").filter(C=>C.jobId===s):[];let L=t?D.map(C=>C.templateId):[];function N(){const C=e.querySelector("#jf-forms-container");C&&(C.innerHTML=`
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${H.map(k=>{const _=L.includes(k.id);return`
            <div class="card form-template-selector ${_?"active":""}" data-id="${k.id}" style="cursor:pointer; border:2px solid ${_?"var(--color-primary)":"var(--border-color)"}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${_?"var(--color-primary)":"var(--text-tertiary)"}; background:${_?"var(--color-primary)":"transparent"}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${_?'<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>':""}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${g(k.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${g(k.description||"No description.")}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(k.sections||[]).reduce((M,V)=>M+V.fields.length,0)} Required Fields</div>
                </div>
              </div>
            </div>
          `}).join("")}
        ${H.length?"":'<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>'}
      </div>
    `,C.querySelectorAll(".form-template-selector").forEach(k=>{k.addEventListener("click",()=>{const _=k.dataset.id;L.includes(_)?L=L.filter(M=>M!==_):L.push(_),N()})}))}e.querySelector("#btn-save").addEventListener("click",()=>{var Y,K,R,te;const C=e.querySelector("#job-form");if(!C.checkValidity()){e.querySelectorAll("#job-form-tabs .tab").forEach(Z=>Z.classList.remove("active")),e.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),e.querySelector("#jf-tab-details").style.display="block",e.querySelector("#jf-tab-tasks").style.display="none",e.querySelector("#jf-tab-forms").style.display="none",C.reportValidity();return}const k=Object.fromEntries(new FormData(C)),_=k.customerId,M=c.find(Z=>Z.id===_);k.customerName=(M==null?void 0:M.company)||"";const V=u.selectedOptions[0];k.siteAddress=(V==null?void 0:V.dataset.address)||"",k.siteName=(V==null?void 0:V.dataset.name)||"";const ne=parseInt(k.primaryContactId),F=parseInt(k.additionalContactId),J=isNaN(ne)?null:(Y=M==null?void 0:M.contacts)==null?void 0:Y[ne],be=isNaN(F)?null:(K=M==null?void 0:M.contacts)==null?void 0:K[F];k.contactName=(J==null?void 0:J.name)||(M?`${M.firstName} ${M.lastName}`:""),k.primaryContactName=(J==null?void 0:J.name)||"",k.additionalContactName=(be==null?void 0:be.name)||"",delete k.primaryContactId,delete k.additionalContactId,k.tags=l,k.description=q.innerHTML,k.tasks=I,k.phases=I,k.tasks.forEach(Z=>{Z.subTasks||(Z.subTasks=[]),Z.subPhases=Z.subTasks}),delete k.notes,k.number=a.number||`J-${Date.now().toString().slice(-6)}`;const ce=(R=e.querySelector("#is-emergency"))==null?void 0:R.checked;if(k.isEmergency=ce,t?ce&&!a.isEmergency?k.laborCost=(a.laborCost||0)+150:!ce&&a.isEmergency&&(k.laborCost=Math.max(0,(a.laborCost||0)-150)):(k.technicians=[],k.laborCost=ce?150:0,k.materialCost=0,k.estimatedHours=0),(te=e.querySelector("#is-recurring"))!=null&&te.checked){const Z=e.querySelector("#recurring-freq").value,le=e.querySelector("#recurring-start").value,G=e.querySelector("#recurring-end").value;if(!le||!G){z("Recurring dates required","error");return}k.recurringConfig={freq:Z,start:le,end:G}}const ee=t?p.update("jobs",s,k):p.create("jobs",k),se=ee.id;let Q=(p.getAll("formInstances")||[]).filter(Z=>{if(Z.jobId!==se)return!0;const le=L.includes(Z.templateId),G=Z.responses&&Object.keys(Z.responses).length>0;return le||G});if(L.forEach(Z=>{Q.find(G=>G.jobId===se&&G.templateId===Z)||Q.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:se,templateId:Z,responses:{},status:"Pending",createdAt:new Date().toISOString()})}),p.save("formInstances",Q),!t&&k.recurringConfig){let Z=new Date(k.recurringConfig.start);const le=new Date(k.recurringConfig.end);let G=0;for(;Z<=le&&G<50;)p.create("notifications",{type:"Recurring Job Due",jobId:se,title:`Recurring: ${ee.title||ee.number}`,dueDate:Z.toISOString().split("T")[0],status:"Pending",createdAt:new Date().toISOString()}),k.recurringConfig.freq==="Daily"?Z.setDate(Z.getDate()+1):k.recurringConfig.freq==="Weekly"?Z.setDate(Z.getDate()+7):k.recurringConfig.freq==="Monthly"&&Z.setMonth(Z.getMonth()+1),G++}z(`Job ${t?"updated":"created"} successfully`,"success"),B.navigate(`/jobs/${se}`)})}function na(e){var $;const s=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),t=s.userTypeId?p.getById("userTypes",s.userTypeId):null,a=t?($=t.permissions)==null?void 0:$.find(v=>v.module==="Timesheets"):null;let c="All",n="All";const l=new Date,o=new Date;o.setDate(l.getDate()-7);const d=v=>{const w=v.getFullYear(),q=String(v.getMonth()+1).padStart(2,"0"),h=String(v.getDate()).padStart(2,"0");return`${w}-${q}-${h}`};let r=d(o),b=d(l),y=[];function i(){var U,P,O,H,D,L,N,C,k,_,M,V,ne;const v=p.getAll("timesheets").sort((F,J)=>new Date(J.date)-new Date(F.date)),w=p.getAll("technicians");let q=[...v];const h=["admin","manager","office"].includes(s.role)||a&&a.view,S=a&&a.view_own;!h&&S?q=q.filter(F=>String(F.technicianId)===String(s.id)):!h&&!S&&s.role!=="admin"&&(q=[]);let x=c==="All"?[...q]:q.filter(F=>F.status===c);h&&n!=="All"&&(x=x.filter(F=>String(F.technicianId)===String(n))),r&&(x=x.filter(F=>(F.date?F.date.split("T")[0]:"")>=r)),b&&(x=x.filter(F=>(F.date?F.date.split("T")[0]:"")<=b));const f=x.filter(F=>F.status==="Pending").reduce((F,J)=>F+(J.hours||0),0),E=x.map(F=>F.id),T=E.length>0&&E.every(F=>y.includes(F)),A=y.length>0,I=[];x.forEach(F=>{const be=new Date(F.date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});let ce=I.find(ee=>ee.dateStr===be);ce||(ce={dateStr:be,items:[],total:0},I.push(ce)),ce.items.push(F),ce.total+=F.hours||0}),e.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          ${Ee("Timesheets","export")?`
            <button class="btn btn-secondary" id="btn-export-approved" style="margin-right:8px">
              <span class="material-icons-outlined">download</span> Export Approved
            </button>
          `:""}
          ${["admin","manager","office"].includes(s.role)?`
            <button class="btn btn-secondary" id="btn-log-time" style="margin-right:8px">
              <span class="material-icons-outlined">add</span> Log Time on Behalf
            </button>
          `:""}
          ${s.role==="admin"||s.role==="manager"||a&&a.approve?`
            <button class="btn btn-primary" id="btn-approve-all-pending" ${q.some(F=>F.status==="Pending")?"":"disabled"}>
              <span class="material-icons-outlined">done_all</span> Approve All Pending
            </button>
          `:""}
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${f.toFixed(2)} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="page-toolbar" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:16px;">
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div class="toolbar-filters" style="margin:0">
            <button class="toolbar-filter ${c==="All"?"active":""}" data-status="All">All</button>
            <button class="toolbar-filter ${c==="Pending"?"active":""}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${c==="Approved"?"active":""}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${c==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
          </div>
          
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Date Range:</label>
            <input type="date" class="form-input" id="filter-date-start" value="${r}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
            <span style="font-size:12px; color:var(--text-secondary)">to</span>
            <input type="date" class="form-input" id="filter-date-end" value="${b}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
          </div>
        </div>

        ${h?`
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Filter by Staff:</label>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-prev" title="Previous technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_left</span>
              </button>
              <select class="form-select" id="filter-tech" style="width:180px; height:32px; padding:0 8px; font-size:13px; margin:0;">
                <option value="All">All Technicians</option>
                ${w.map(F=>`<option value="${F.id}" ${n===F.id?"selected":""}>${F.name}</option>`).join("")}
              </select>
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-next" title="Next technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_right</span>
              </button>
            </div>
          </div>
        `:""}
      </div>

      <div id="bulk-actions-bar" style="display:${A?"flex":"none"}; align-items:center; justify-content:space-between; background:var(--color-primary-light); border:1px solid var(--color-primary); padding:10px 16px; border-radius:var(--border-radius); margin-bottom:12px; transition: all 0.2s ease;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:600; color:var(--color-primary); font-size:14px;"><span id="selected-count">${y.length}</span> items selected</span>
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
          ${Ee("Timesheets","export")?`
            <button class="btn btn-sm btn-secondary" id="btn-bulk-export" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px;">
              <span class="material-icons-outlined" style="font-size:16px">download</span> Export Selected
            </button>
          `:""}
        </div>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${T?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
                <th style="width:120px">Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Task</th>
                <th>Description</th>
                <th style="text-align:right; width:80px">Hours</th>
                <th style="width:110px">Status</th>
                <th style="width:60px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${I.length===0?'<tr><td colspan="9" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>':I.map(F=>`
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="5" style="color:var(--text-primary)">${F.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${F.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${F.items.map(J=>{const be=String(J.technicianId)===String(s.id),ce=a&&a.edit===!0||be,ee=a&&a.delete===!0||be,se=["admin","manager","office"].includes(s.role)||ce&&J.status!=="Approved",pe=["admin","manager","office"].includes(s.role)||ee&&J.status!=="Approved",Q=y.includes(J.id);return`
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${J.id}" ${Q?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
                    <td class="text-secondary" style="font-size:12px">${new Date(J.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${g(J.technicianName)}</span></td>
                    <td><a href="#/jobs/${J.jobId}" class="cell-link">${g(J.jobNumber||J.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${g(J.taskName||"—")}</span></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${g(J.description||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${J.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${J.status==="Approved"?"badge-success":J.status==="Rejected"?"badge-danger":"badge-warning"}">
                        ${g(J.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${se?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${J.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:18px">edit</span>
                          </button>
                        `:""}
                        ${pe?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-timesheet" data-id="${J.id}" title="Delete entry" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">delete</span>
                          </button>
                        `:""}
                        ${["admin","manager"].includes(s.role)&&J.status==="Pending"?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-approve-single" data-id="${J.id}" title="Approve entry" style="color:var(--color-success)">
                            <span class="material-icons-outlined" style="font-size:18px">check</span>
                          </button>
                          <button class="btn btn-ghost btn-sm btn-icon btn-reject-single" data-id="${J.id}" title="Reject entry" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">close</span>
                          </button>
                        `:""}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `,e.querySelectorAll(".toolbar-filter").forEach(F=>{F.addEventListener("click",()=>{c=F.dataset.status,i()})}),(U=e.querySelector("#filter-tech"))==null||U.addEventListener("change",F=>{n=F.target.value,i()});const j=["All",...w.map(F=>String(F.id))];(P=e.querySelector("#btn-tech-prev"))==null||P.addEventListener("click",()=>{const F=j.indexOf(String(n));if(F!==-1){const J=(F-1+j.length)%j.length;n=j[J],i()}}),(O=e.querySelector("#btn-tech-next"))==null||O.addEventListener("click",()=>{const F=j.indexOf(String(n));if(F!==-1){const J=(F+1)%j.length;n=j[J],i()}}),(H=e.querySelector("#filter-date-start"))==null||H.addEventListener("change",F=>{r=F.target.value,i()}),(D=e.querySelector("#filter-date-end"))==null||D.addEventListener("change",F=>{b=F.target.value,i()}),(L=e.querySelector("#th-select-all"))==null||L.addEventListener("change",F=>{F.target.checked?E.forEach(J=>{y.includes(J)||y.push(J)}):y=y.filter(J=>!E.includes(J)),i()}),e.querySelectorAll(".row-checkbox").forEach(F=>{F.addEventListener("change",J=>{const be=F.dataset.id;J.target.checked?y.includes(be)||y.push(be):y=y.filter(ce=>ce!==be),i()})}),(N=e.querySelector("#btn-bulk-deselect"))==null||N.addEventListener("click",()=>{y=[],i()}),(C=e.querySelector("#btn-bulk-approve"))==null||C.addEventListener("click",()=>{y.length!==0&&(y.forEach(F=>{p.update("timesheets",F,{status:"Approved"})}),z(`Approved ${y.length} timesheets successfully`,"success"),y=[],i())}),(k=e.querySelector("#btn-bulk-reject"))==null||k.addEventListener("click",()=>{y.length!==0&&(y.forEach(F=>{p.update("timesheets",F,{status:"Rejected"})}),z(`Rejected ${y.length} timesheets`,"error"),y=[],i())}),(_=e.querySelector("#btn-bulk-export"))==null||_.addEventListener("click",()=>{if(y.length===0)return;const J=p.getAll("timesheets").filter(K=>y.includes(K.id));if(J.length===0){z("No entries found to export","error");return}const ce=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description","Status"].join(",")];J.forEach(K=>{const R=K.startTime?new Date(K.startTime).toLocaleString():"",te=K.finishTime?new Date(K.finishTime).toLocaleString():"",Z=[K.date||"",`"${(K.technicianName||"").replace(/"/g,'""')}"`,`"${(K.jobNumber||"").replace(/"/g,'""')}"`,`"${(K.taskName||"").replace(/"/g,'""')}"`,`"${R}"`,`"${te}"`,K.hours||0,`"${(K.description||"").replace(/"/g,'""')}"`,K.status||""];ce.push(Z.join(","))});const ee=ce.join(`
`),se=new Blob([ee],{type:"text/csv;charset=utf-8;"}),pe=URL.createObjectURL(se),Q=document.createElement("a");Q.setAttribute("href",pe);const Y=new Date().toISOString().split("T")[0];Q.setAttribute("download",`FieldForge_Selected_Timesheets_${Y}.csv`),Q.style.visibility="hidden",document.body.appendChild(Q),Q.click(),document.body.removeChild(Q),z(`Exported ${J.length} selected timesheets to CSV!`,"success"),y=[],i()}),(M=e.querySelector("#btn-approve-all-pending"))==null||M.addEventListener("click",()=>{const F=q.filter(J=>J.status==="Pending");F.forEach(J=>p.update("timesheets",J.id,{status:"Approved"})),z(`Approved ${F.length} pending timesheets`,"success"),i()}),e.querySelectorAll(".btn-approve-single").forEach(F=>{F.addEventListener("click",()=>{p.update("timesheets",F.dataset.id,{status:"Approved"}),z("Timesheet entry approved","success"),i()})}),e.querySelectorAll(".btn-reject-single").forEach(F=>{F.addEventListener("click",()=>{p.update("timesheets",F.dataset.id,{status:"Rejected"}),z("Timesheet entry rejected","error"),i()})}),e.querySelectorAll(".btn-edit-timesheet").forEach(F=>{F.addEventListener("click",()=>{u(F.dataset.id)})}),e.querySelectorAll(".btn-delete-timesheet").forEach(F=>{F.addEventListener("click",()=>{const J=F.dataset.id,be=p.getById("timesheets",J);be&&Se({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${be.hours} hrs</strong> on <strong>${new Date(be.date).toLocaleDateString()}</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:ce=>ce()},{label:"Delete",className:"btn-danger",onClick:ce=>{p.delete("timesheets",J),z("Timesheet entry deleted successfully","success"),ce(),i()}}]})})}),(V=e.querySelector("#btn-export-approved"))==null||V.addEventListener("click",()=>{const F=p.getAll("timesheets"),J=["admin","manager","office"].includes(s.role);let be=F.filter(R=>R.status==="Approved");if(r&&(be=be.filter(R=>R.date>=r)),b&&(be=be.filter(R=>R.date<=b)),J)n&&n!=="All"&&(be=be.filter(R=>R.technicianId===n));else{const te=p.getAll("technicians").find(le=>le.name===s.name),Z=te?te.id:null;be=be.filter(le=>le.technicianId===Z||le.technicianName===s.name)}if(be.length===0){z("No approved timesheets found to export","error");return}const ee=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description"].join(",")];be.forEach(R=>{const te=R.startTime?new Date(R.startTime).toLocaleString():"",Z=R.finishTime?new Date(R.finishTime).toLocaleString():"",le=[R.date||"",`"${(R.technicianName||"").replace(/"/g,'""')}"`,`"${(R.jobNumber||"").replace(/"/g,'""')}"`,`"${(R.taskName||"").replace(/"/g,'""')}"`,`"${te}"`,`"${Z}"`,R.hours||0,`"${(R.description||"").replace(/"/g,'""')}"`];ee.push(le.join(","))});const se=ee.join(`
`),pe=new Blob([se],{type:"text/csv;charset=utf-8;"}),Q=URL.createObjectURL(pe),Y=document.createElement("a");Y.setAttribute("href",Q);const K=new Date().toISOString().split("T")[0];Y.setAttribute("download",`FieldForge_Approved_Timesheets_${K}.csv`),Y.style.visibility="hidden",document.body.appendChild(Y),Y.click(),document.body.removeChild(Y),z(`Exported ${be.length} approved timesheets to CSV!`,"success")}),(ne=e.querySelector("#btn-log-time"))==null||ne.addEventListener("click",()=>{m()})}function u(v){as(v,i)}function m(){const v={},w={};function q(L,N=[],C=[]){L&&L.forEach((k,_)=>{const M=[...N,_].join("-"),V=[...C,k.name].join(" > ");v[M]=V,k.id&&(w[k.id]=M),k.subTasks&&q(k.subTasks,[...N,_],[...C,k.name])})}function h(L,N=[]){return!L||L.length===0?"":L.map((C,k)=>{const _=[...N,k],M=_.join("-"),V=C.subTasks&&C.subTasks.length>0;return`
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${V?"parent-node":"leaf-node"}" data-path="${M}" data-name="${g(C.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${V?`
                  <span class="material-icons-outlined tree-node-toggle" data-path="${M}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                `:`
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${V?"600":"400"}">${g(C.name)}</span>
              </div>
              ${V?`
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${C.subTasks.length} subtasks</span>
              `:""}
            </div>
            ${V?`
              <div class="tree-node-children" id="children-${M}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${h(C.subTasks,_)}
              </div>
            `:""}
          </div>
        `}).join("")}const S=new Date,x=L=>L.toString().padStart(2,"0"),f=`${S.getFullYear()}-${x(S.getMonth()+1)}-${x(S.getDate())}`,E=`${f}T09:00`,T=`${f}T10:00`,A=p.getAll("technicians"),I=p.getAll("jobs").filter(L=>L.status!=="Completed"&&L.status!=="Invoiced"),j=document.createElement("div");j.innerHTML=`
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
          <input type="datetime-local" class="form-input" id="lt-start" value="${E}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Finish Time *</label>
          <input type="datetime-local" class="form-input" id="lt-finish" value="${T}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${A.map(L=>`<option value="${L.id}" ${n===L.id?"selected":""}>${L.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${I.map(L=>`<option value="${L.id}">${L.number} - ${g(L.customerName)} (${g(L.title)})</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Task *</label>
        <div class="custom-tree-select" id="lt-task-container" style="position:relative;">
          <button class="form-select" id="lt-task-trigger" type="button" style="width:100%; text-align:left; display:flex; justify-content:space-between; align-items:center; background-image:none;" disabled>
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
    `;const U=j.querySelector("#lt-job"),P=j.querySelector("#lt-task-trigger"),O=j.querySelector("#lt-task-dropdown"),H=j.querySelector("#lt-task"),D=j.querySelector("#lt-task-name");P.addEventListener("click",L=>{L.stopPropagation();const N=O.style.display==="block";O.style.display=N?"none":"block"}),document.addEventListener("click",L=>{j.contains(L.target)||(O.style.display="none")}),U.addEventListener("change",L=>{const N=L.target.value;if(!N){P.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',P.disabled=!0,O.style.display="none",H.value="",D.value="";return}const C=I.find(k=>k.id===N);if(!C||!C.tasks||C.tasks.length===0){P.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',P.disabled=!0,O.style.display="none",H.value="",D.value="";return}for(const k in v)delete v[k];for(const k in w)delete w[k];q(C.tasks),O.innerHTML=h(C.tasks),P.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',P.disabled=!1,O.querySelectorAll(".tree-node-toggle").forEach(k=>{k.addEventListener("click",_=>{_.stopPropagation();const M=k.dataset.path,V=O.querySelector(`#children-${M}`);if(V){const ne=V.style.display==="none";V.style.display=ne?"block":"none",k.classList.toggle("expanded",ne)}})}),O.querySelectorAll(".tree-node-row").forEach(k=>{k.addEventListener("click",_=>{if(_.target.classList.contains("tree-node-toggle"))return;const M=k.dataset.path,V=M.split("-").map(Number),ne=I.find(ce=>ce.id===N);function F(ce,ee){let se=ce[ee[0]];for(let pe=1;pe<ee.length;pe++){if(!se||!se.subTasks)return!1;se=se.subTasks[ee[pe]]}return se&&se.subTasks&&se.subTasks.length>0}if(F(ne.tasks||[],V)){const ce=O.querySelector(`#children-${M}`),ee=O.querySelector(`.tree-node-toggle[data-path="${M}"]`);if(ce){const se=ce.style.display==="none";ce.style.display=se?"block":"none",ee&&ee.classList.toggle("expanded",se)}return}const be=v[M]||k.dataset.name;H.value=M,D.value=be,P.innerHTML=`<span>${g(be)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,O.style.display="none"})})}),Se({title:"Log Time on Behalf of Staff",content:j,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:L=>L()},{label:"Log Time",className:"btn-primary",onClick:L=>{const N=document.getElementById("lt-start").value,C=document.getElementById("lt-finish").value,k=document.getElementById("lt-tech").value,_=document.getElementById("lt-job").value,M=document.getElementById("lt-task").value,V=document.getElementById("lt-task-name").value,ne=document.getElementById("lt-desc").value;if(!N||!C||!k||!_||!M){z("Please fill all required fields, including the task","error");return}const F=new Date(N),J=new Date(C);if(J<=F){z("Finish time must be after start time","error");return}const be=Math.round((J-F)/36e5*100)/100,ce=A.find(se=>se.id===k),ee=I.find(se=>se.id===_);p.create("timesheets",{jobId:ee.id,jobNumber:ee.number,taskId:M,taskName:V,technicianId:k,technicianName:ce.name,date:N.split("T")[0],startTime:N,finishTime:C,hours:be,description:ne||"",status:"Pending"}),z("Time logged successfully on behalf of staff","success"),L(),i()}}]})}i()}const wt=[{value:"call",label:"Call",icon:"phone",color:"#3B82F6"},{value:"meeting",label:"Meeting",icon:"groups",color:"#8B5CF6"},{value:"follow-up",label:"Follow-up",icon:"reply",color:"#F59E0B"},{value:"site-visit",label:"Site Visit",icon:"location_on",color:"#10B981"},{value:"email",label:"Email",icon:"email",color:"#06B6D4"},{value:"task",label:"Task",icon:"task_alt",color:"#64748B"},{value:"other",label:"Other",icon:"more_horiz",color:"#94A3B8"}];function la(e){return wt.find(s=>s.value===e)||wt[6]}function Bt(e,s){if(!e||!s)return null;const t={job:"/jobs/",quote:"/quotes/",invoice:"/invoices/",customer:"/customers/",lead:"/leads/"};return t[e]?t[e]+s:null}function ra(e,{getWeekDays:s,viewMode:t,currentDate:a,calendarType:c,isTechnician:n,onNav:l,onToday:o,onViewMode:d,onCalType:r}){const b=s(),y=["January","February","March","April","May","June","July","August","September","October","November","December"],i=JSON.parse(localStorage.getItem("currentUser")||"{}"),u=p.getAll("technicians");let m="active",$=n?i.id:"all";function v(){let f=p.getAll("activities");$!=="all"&&(f=f.filter(T=>T.assignedToId===$));const E=new Date().toISOString().split("T")[0];return m==="active"?f=f.filter(T=>T.status!=="completed"):m==="completed"?f=f.filter(T=>T.status==="completed"):m==="overdue"&&(f=f.filter(T=>T.status!=="completed"&&T.date<E)),f}function w(){let f=p.getAll("activities");$!=="all"&&(f=f.filter(I=>I.assignedToId===$));const E=new Date().toISOString().split("T")[0],T=b.map(I=>I.toISOString().split("T")[0]),A=f.filter(I=>T.includes(I.date));return{total:A.length,completed:A.filter(I=>I.status==="completed").length,pending:A.filter(I=>I.status!=="completed").length,overdue:f.filter(I=>I.status!=="completed"&&I.date<E).length}}function q(f){var P;const E=la(f.type),T=f.status==="completed",A=new Date().toISOString().split("T")[0],I=!T&&f.date<A,j=Bt(f.linkedType,f.linkedId),U=f.priority==="high"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#EF4444;margin-right:4px" title="High priority"></span>':f.priority==="low"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94A3B8;margin-right:4px" title="Low priority"></span>':"";return`
      <div class="activity-card ${T?"completed":""} ${I?"overdue":""}" data-id="${f.id}" style="
        background:var(--card-bg); border:1px solid ${I?"#FCA5A5":"var(--border-color)"};
        border-left:3px solid ${T?"#94A3B8":E.color}; border-radius:8px;
        padding:12px 14px; transition:all 0.2s; ${T?"opacity:0.6;":""}
        display:flex; gap:12px; align-items:flex-start; position:relative;
      ">
        <div style="width:32px;height:32px;border-radius:8px;background:${E.color}14;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
          <span class="material-icons-outlined" style="font-size:18px;color:${E.color}">${E.icon}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">
            <div style="font-weight:600;font-size:13px;${T?"text-decoration:line-through;color:var(--text-tertiary)":"color:var(--text-primary)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${U}${g(f.title)}
            </div>
            <div style="display:flex;gap:2px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm btn-icon act-toggle-complete" data-id="${f.id}" title="${T?"Mark pending":"Mark complete"}" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:${T?"#10B981":"var(--text-tertiary)"}">${T?"check_circle":"radio_button_unchecked"}</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-edit" data-id="${f.id}" title="Edit" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-delete" data-id="${f.id}" title="Delete" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:var(--color-danger)">close</span>
              </button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-secondary)">
            ${f.time?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">schedule</span>${g(f.time)}${f.duration?` (${f.duration}min)`:""}</span>`:""}
            <span style="display:flex;align-items:center;gap:3px;background:${E.color}14;color:${E.color};padding:1px 6px;border-radius:10px;font-weight:500">${E.label}</span>
            ${f.linkedLabel?`<span class="act-linked-record" data-type="${f.linkedType||""}" data-linked-id="${f.linkedId||""}" style="display:flex;align-items:center;gap:3px;cursor:${j?"pointer":"default"};${j?"color:var(--color-primary);text-decoration:underline;":""}"><span class="material-icons-outlined" style="font-size:13px">link</span>${g(f.linkedLabel)}</span>`:""}
            ${$==="all"?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">person</span>${g(((P=u.find(O=>O.id===f.assignedToId))==null?void 0:P.name)||"Unassigned")}</span>`:""}
          </div>
          ${f.notes?`<div style="margin-top:6px;font-size:12px;color:var(--text-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g(f.notes)}</div>`:""}
        </div>
      </div>`}function h(){const f=v(),E=w(),T=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];e.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">${y[a.getMonth()]} ${a.getFullYear()}</span>
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${c==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${c==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${t==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${t==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:16px;height:calc(100vh - 160px);overflow:hidden">
        <!-- Main Content -->
        <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;gap:6px">
              <button class="toolbar-filter act-filter ${m==="active"?"active":""}" data-filter="active">Active</button>
              <button class="toolbar-filter act-filter ${m==="all"?"active":""}" data-filter="all">All</button>
              <button class="toolbar-filter act-filter ${m==="completed"?"active":""}" data-filter="completed">Completed</button>
              <button class="toolbar-filter act-filter ${m==="overdue"?"active":""}" data-filter="overdue" style="${E.overdue>0?"color:var(--color-danger)":""}">Overdue${E.overdue>0?` (${E.overdue})`:""}</button>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-new-activity"><span class="material-icons-outlined" style="font-size:16px;margin-right:4px">add</span>New Activity</button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:16px">
            ${b.map(A=>{const I=A.toISOString().split("T")[0],j=I===new Date().toISOString().split("T")[0],U=f.filter(P=>P.date===I).sort((P,O)=>(P.time||"99:99").localeCompare(O.time||"99:99"));return`
                <div style="margin-bottom:20px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border-color)">
                    ${j?'<span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0"></span>':""}
                    <h4 style="margin:0;font-size:13px;${j?"color:var(--color-primary)":"color:var(--text-secondary)"}">${T[A.getDay()]}, ${A.getDate()} ${y[A.getMonth()]}</h4>
                    <span style="font-size:11px;color:var(--text-tertiary)">${U.length} ${U.length===1?"activity":"activities"}</span>
                  </div>
                  ${U.length===0?'<p style="color:var(--text-tertiary);font-size:12px;margin:0 0 0 16px">No activities scheduled.</p>':`
                    <div style="display:flex;flex-direction:column;gap:8px">${U.map(P=>q(P)).join("")}</div>
                  `}
                </div>`}).join("")}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="card" style="width:280px;flex-shrink:0;display:flex;flex-direction:column;overflow-y:auto">
          <!-- Stats -->
          <div style="padding:16px;border-bottom:1px solid var(--border-color)">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">insights</span>This Week
            </h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div style="text-align:center;padding:10px;background:var(--content-bg);border-radius:8px">
                <div style="font-size:20px;font-weight:700;color:var(--color-primary)">${E.pending}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Pending</div>
              </div>
              <div style="text-align:center;padding:10px;background:var(--content-bg);border-radius:8px">
                <div style="font-size:20px;font-weight:700;color:#10B981">${E.completed}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Done</div>
              </div>
              ${E.overdue>0?`
              <div style="text-align:center;padding:10px;background:#FEF2F2;border-radius:8px;grid-column:span 2">
                <div style="font-size:20px;font-weight:700;color:#EF4444">${E.overdue}</div>
                <div style="font-size:10px;color:#EF4444;text-transform:uppercase;font-weight:600">Overdue</div>
              </div>`:""}
            </div>
          </div>
          ${n?"":`
          <!-- Team Filter -->
          <div style="padding:16px;border-bottom:1px solid var(--border-color)">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">people</span>View By
            </h4>
            <select class="form-select" id="act-tech-filter" style="width:100%">
              <option value="all" ${$==="all"?"selected":""}>All Team Members</option>
              ${u.map(A=>`<option value="${A.id}" ${$===A.id?"selected":""}>${A.name}</option>`).join("")}
            </select>
          </div>`}
          <!-- Quick Create -->
          <div style="padding:16px">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">bolt</span>Quick Add
            </h4>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${wt.slice(0,5).map(A=>`
                <button class="btn btn-secondary btn-sm act-quick-add" data-type="${A.value}" style="justify-content:flex-start;gap:8px;text-align:left">
                  <span class="material-icons-outlined" style="font-size:16px;color:${A.color}">${A.icon}</span>${A.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>`,x()}function S(f=null){const E=!!f,T=f||{title:"",type:"call",date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""},A=p.getAll("jobs").filter(O=>O.status!=="Completed"&&O.status!=="Invoiced"),I=p.getAll("customers"),j=p.getAll("quotes"),U=document.createElement("div");U.innerHTML=`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="act-title" value="${g(T.title)}" placeholder="e.g. Follow up on quote..." style="width:100%" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Type</label>
          <select class="form-select" id="act-type" style="width:100%">
            ${wt.map(O=>`<option value="${O.value}" ${T.type===O.value?"selected":""}>${O.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <select class="form-select" id="act-priority" style="width:100%">
            <option value="low" ${T.priority==="low"?"selected":""}>Low</option>
            <option value="normal" ${T.priority==="normal"?"selected":""}>Normal</option>
            <option value="high" ${T.priority==="high"?"selected":""}>High</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="act-date" value="${T.date}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="act-time" value="${T.time||""}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Duration (min)</label>
          <input type="number" class="form-input" id="act-duration" value="${T.duration||""}" min="0" step="5" style="width:100%" />
        </div>
      </div>
      ${n?"":`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Assign To</label>
        <select class="form-select" id="act-assignee" style="width:100%">
          ${u.map(O=>`<option value="${O.id}" ${T.assignedToId===O.id?"selected":""}>${O.name}</option>`).join("")}
        </select>
      </div>`}
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Link To</label>
          <select class="form-select" id="act-link-type" style="width:100%">
            <option value="">None</option>
            <option value="job" ${T.linkedType==="job"?"selected":""}>Job</option>
            <option value="customer" ${T.linkedType==="customer"?"selected":""}>Customer</option>
            <option value="quote" ${T.linkedType==="quote"?"selected":""}>Quote</option>
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Record</label>
          <select class="form-select" id="act-link-record" style="width:100%">
            <option value="">Select...</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="act-notes" rows="3" placeholder="Additional details..." style="width:100%">${g(T.notes||"")}</textarea>
      </div>`;function P(O,H){const D=U.querySelector("#act-link-record");let L='<option value="">Select...</option>';O==="job"?L+=A.map(N=>`<option value="${N.id}" data-label="Job ${N.number}" ${H===N.id?"selected":""}>${N.number} — ${g(N.title)}</option>`).join(""):O==="customer"?L+=I.map(N=>`<option value="${N.id}" data-label="${g(N.company||N.firstName+" "+N.lastName)}" ${H===N.id?"selected":""}>${g(N.company||N.firstName+" "+N.lastName)}</option>`).join(""):O==="quote"&&(L+=j.map(N=>`<option value="${N.id}" data-label="Quote ${N.number}" ${H===N.id?"selected":""}>${N.number} — ${g(N.customerName||"")}</option>`).join("")),D.innerHTML=L}P(T.linkedType,T.linkedId),U.querySelector("#act-link-type").addEventListener("change",O=>P(O.target.value,"")),Se({title:E?"Edit Activity":"New Activity",content:U,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:O=>O()},{label:E?"Save Changes":"Create Activity",className:"btn-primary",onClick:O=>{var _,M;const H=U.querySelector("#act-title").value.trim(),D=U.querySelector("#act-date").value;if(!H||!D){z("Title and date are required","error");return}const L=U.querySelector("#act-link-type").value,N=U.querySelector("#act-link-record"),C=N.options[N.selectedIndex],k={title:H,type:U.querySelector("#act-type").value,priority:U.querySelector("#act-priority").value,date:D,time:U.querySelector("#act-time").value||"",duration:parseInt(U.querySelector("#act-duration").value)||0,assignedToId:n?i.id:((_=U.querySelector("#act-assignee"))==null?void 0:_.value)||i.id,linkedType:L,linkedId:N.value||"",linkedLabel:((M=C==null?void 0:C.dataset)==null?void 0:M.label)||"",notes:U.querySelector("#act-notes").value,status:E?T.status:"pending"};E?(p.update("activities",T.id,k),z("Activity updated","success")):(p.create("activities",k),z("Activity created","success")),O(),h()}}]})}function x(){var f,E,T,A,I;(f=e.querySelector("#btn-prev"))==null||f.addEventListener("click",()=>l(-1)),(E=e.querySelector("#btn-next"))==null||E.addEventListener("click",()=>l(1)),(T=e.querySelector("#btn-today"))==null||T.addEventListener("click",o),e.querySelectorAll("[data-view]").forEach(j=>j.addEventListener("click",()=>d(j.dataset.view))),e.querySelectorAll("[data-cal]").forEach(j=>j.addEventListener("click",()=>r(j.dataset.cal))),e.querySelectorAll(".act-filter").forEach(j=>j.addEventListener("click",()=>{m=j.dataset.filter,h()})),(A=e.querySelector("#act-tech-filter"))==null||A.addEventListener("change",j=>{$=j.target.value,h()}),(I=e.querySelector("#btn-new-activity"))==null||I.addEventListener("click",()=>S()),e.querySelectorAll(".act-quick-add").forEach(j=>j.addEventListener("click",()=>{const U=j.dataset.type;S({title:"",type:U,date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""})})),e.querySelectorAll(".act-toggle-complete").forEach(j=>j.addEventListener("click",U=>{U.stopPropagation();const P=p.getById("activities",j.dataset.id);P&&(p.update("activities",P.id,{status:P.status==="completed"?"pending":"completed"}),h())})),e.querySelectorAll(".act-edit").forEach(j=>j.addEventListener("click",U=>{U.stopPropagation();const P=p.getById("activities",j.dataset.id);P&&S(P)})),e.querySelectorAll(".act-delete").forEach(j=>j.addEventListener("click",U=>{U.stopPropagation(),Se({title:"Delete Activity",content:"<p>Are you sure you want to delete this activity?</p>",actions:[{label:"Cancel",className:"btn-secondary",onClick:P=>P()},{label:"Delete",className:"btn-danger",onClick:P=>{p.delete("activities",j.dataset.id),z("Activity deleted","success"),P(),h()}}]})})),e.querySelectorAll(".act-linked-record").forEach(j=>j.addEventListener("click",U=>{U.stopPropagation();const P=Bt(j.dataset.type,j.dataset.linkedId);P&&B.navigate(P)}))}h()}function da(e){const s=p.getAll("technicians"),t=JSON.parse(localStorage.getItem("currentUser")||"{}"),a=t.role==="technician";let c="week",n="schedule",l=new Date;const o=Array.from({length:24},(H,D)=>D);let d=null,r=null,b=new Set(a?[t.id]:s.map(H=>H.id)),y=null,i=0,u=0;const m=32,$=m/4;function v(H){return Math.round(H*4)/4}function w(H){const D=Math.floor(H),L=Math.round((H-D)*60);return`${D.toString().padStart(2,"0")}:${L.toString().padStart(2,"0")}`}function q(){const H=document.getElementById("calendar-scroll");H&&(i=H.scrollTop,u=H.scrollLeft)}function h(){const H=document.getElementById("calendar-scroll");H&&(H.scrollTop=i,H.scrollLeft=u)}function S(){y&&(y.remove(),y=null)}document.addEventListener("click",S);function x(){const H=new Date(l);return c==="day"?[new Date(l)]:(H.setDate(H.getDate()-H.getDay()+1),Array.from({length:5},(D,L)=>{const N=new Date(H);return N.setDate(N.getDate()+L),N}))}function f(){const H=p.getAll("jobs"),D=p.getAll("schedule"),L=[],N=x();D.forEach(k=>{const _=H.find(V=>V.id===k.jobId);if(!_||_.status==="Completed"||_.status==="Invoiced")return;let M=null;if(k.date)M=new Date(k.date+"T12:00:00");else if(k.startTime)M=new Date(k.startTime);else if(k.dayOffset!==void 0){const V=N[0];V&&(M=new Date(V),M.setDate(M.getDate()+k.dayOffset))}M&&N.forEach((V,ne)=>{if(M.toDateString()===V.toDateString()){let F=8,J=10;if(k.startTime&&k.finishTime){const be=new Date(k.startTime),ce=new Date(k.finishTime);F=be.getHours()+be.getMinutes()/60,J=ce.getHours()+ce.getMinutes()/60}else k.startHour!==void 0&&k.endHour!==void 0&&(F=k.startHour,J=k.endHour);L.push({id:k.id,type:"schedule",jobId:_.id,jobNumber:_.number,customerName:_.customerName,title:_.title,technicianId:k.technicianId,dayIdx:ne,startHour:F,endHour:J,status:_.status,priority:_.priority})}})});const C=new Set(D.map(k=>k.jobId));return H.filter(k=>k.scheduledDate&&!C.has(k.id)&&k.status!=="Completed"&&k.status!=="Invoiced").forEach(k=>{const _=new Date(k.scheduledDate);N.forEach((M,V)=>{if(_.toDateString()===M.toDateString()){const ne=k.startHour!==void 0?k.startHour:7+Math.abs(E(k.id))%6;if(k.technicians&&k.technicians.length>0)k.technicians.forEach(F=>{const J=F.hours||2;L.push({id:`legacy-${k.id}-${F.id}`,type:"legacy",jobId:k.id,jobNumber:k.number,customerName:k.customerName,title:k.title,technicianId:F.id,dayIdx:V,startHour:ne,endHour:ne+J,status:k.status,priority:k.priority})});else if(k.technicianId){const F=k.estimatedHours||2;L.push({id:`legacy-${k.id}`,type:"legacy",jobId:k.id,jobNumber:k.number,customerName:k.customerName,title:k.title,technicianId:k.technicianId,dayIdx:V,startHour:ne,endHour:ne+F,status:k.status,priority:k.priority})}}})}),L}function E(H){let D=0;for(let L=0;L<H.length;L++)D=(D<<5)-D+H.charCodeAt(L),D|=0;return D}function T(){q();const H=x(),D=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],L=["January","February","March","April","May","June","July","August","September","October","November","December"];if(n==="activity"){O();return}const N=f(),C=s.filter(k=>b.has(k.id));e.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${L[l.getMonth()]} ${l.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${a?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${t.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${n==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${n==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${c==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${c==="week"?"active":""}" data-view="week">Week</button>
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
              <div style="display:grid;grid-template-columns:56px repeat(${C.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${C.map(k=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${k.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${k.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${H.map((k,_)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${k.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${D[k.getDay()]}, ${k.getDate()} ${L[k.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${C.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${o.map(V=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${V.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${C.map(V=>{const ne=N.filter(F=>F.technicianId===V.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${V.id}" data-day="${_}" data-date="${H[_].getFullYear()}-${(H[_].getMonth()+1).toString().padStart(2,"0")}-${H[_].getDate().toString().padStart(2,"0")}">
                          ${o.map(F=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${F}"></div>`).join("")}
                          ${I(ne,_,V.color)}
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
                ${H.map(k=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${k.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${D[k.getDay()]} ${k.getDate()} ${L[k.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${H.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${o.map(k=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${k.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${H.map((k,_)=>{const M=s.find(ne=>ne.id===[...b][0]),V=N.filter(ne=>ne.technicianId===M.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${M.id}" data-day="${_}" data-date="${H[_].getFullYear()}-${(H[_].getMonth()+1).toString().padStart(2,"0")}-${H[_].getDate().toString().padStart(2,"0")}">
                      ${o.map(ne=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${ne}"></div>`).join("")}
                      ${I(V,_,M.color)}
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
                    <input type="checkbox" class="tech-visibility-checkbox" value="${k.id}" ${b.has(k.id)?"checked":""}>
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
                ${A().map(k=>`
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
    `,j(),U(H),P(),h()}function A(){return p.getAll("jobs").filter(D=>(!D.scheduledDate||!D.technicianId)&&D.status!=="Completed"&&D.status!=="Invoiced")}function I(H,D,L){const N={Urgent:"#EF4444",High:"#F59E0B"};return H.filter(C=>C.dayIdx===D).map(C=>{const k=C.startHour*m,_=Math.max((C.endHour-C.startHour)*m-2,$),M=N[C.priority]||L,V=`${w(C.startHour)} — ${w(C.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${C.jobId}"
            data-schedule-id="${C.id}"
            data-block-type="${C.type}"
            data-start="${C.startHour}"
            data-end="${C.endHour}"
            style="
              top:${k}px;
              height:${_}px;
              background:${L}12;
              border-color:${M};
              color:${L};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${C.jobNumber}</div>
            ${_>20?`<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${C.customerName}</div>`:""}
            ${_>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${V}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${C.jobId}" data-schedule-id="${C.id}" data-block-type="${C.type}" data-start="${C.startHour}" data-end="${C.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function j(){var H,D,L;(H=e.querySelector("#btn-prev"))==null||H.addEventListener("click",()=>{l.setDate(l.getDate()-(c==="week"?7:1)),T()}),(D=e.querySelector("#btn-next"))==null||D.addEventListener("click",()=>{l.setDate(l.getDate()+(c==="week"?7:1)),T()}),(L=e.querySelector("#btn-today"))==null||L.addEventListener("click",()=>{l=new Date,T()}),e.querySelectorAll("[data-view]").forEach(N=>{N.addEventListener("click",()=>{c=N.dataset.view,T()})}),e.querySelectorAll("[data-cal]").forEach(N=>{N.addEventListener("click",()=>{n=N.dataset.cal,T()})}),e.querySelectorAll(".tech-visibility-checkbox").forEach(N=>{N.addEventListener("change",C=>{C.target.checked?b.add(C.target.value):b.delete(C.target.value),T()})}),e.querySelectorAll(".schedule-block").forEach(N=>{N.addEventListener("click",C=>{if(C.defaultPrevented)return;if(N.dataset.resized==="true"){N.dataset.resized="false";return}const k=N.dataset.blockJobId,_=p.getById("jobs",k);_&&Je({title:`Job Quick View: ${_.number}`,content:`
            <div style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label class="form-label">Title</label>
                <div class="font-medium" style="font-size:16px">${_.title||"Untitled"}</div>
              </div>
              <div>
                <label class="form-label">Customer</label>
                <div>${_.customerName||"N/A"}</div>
              </div>
              <div>
                <label class="form-label">Site Address</label>
                <div>${_.siteAddress||"No address provided"}</div>
              </div>
              <div>
                <label class="form-label">Priority</label>
                <div><span class="badge ${_.priority==="Urgent"||_.priority==="High"?"badge-danger":"badge-neutral"}">${_.priority||"Normal"}</span></div>
              </div>
              <div>
                <label class="form-label">Notes</label>
                <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${_.notes||"No notes available"}</div>
              </div>
            </div>
          `,actions:[{label:"Close",className:"btn-secondary",onClick:M=>M()},{label:"Open Full Job",className:"btn-primary",onClick:M=>{M(),B.navigate(`/jobs/${k}`)}}],width:450})}),N.addEventListener("contextmenu",C=>{C.preventDefault(),S();const k=N.dataset.blockJobId;y=document.createElement("div"),y.className="dropdown-menu",y.style.position="fixed",y.style.top=`${C.clientY}px`,y.style.left=`${C.clientX}px`,y.style.zIndex=1e3,y.style.background="var(--card-bg)",y.style.boxShadow="var(--shadow-md)",y.style.border="1px solid var(--border-color)",y.style.borderRadius="var(--border-radius)",y.style.padding="4px 0",y.style.minWidth="140px",y.innerHTML=`
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `,document.body.appendChild(y),y.querySelector("#ctx-view").addEventListener("click",()=>{S(),B.navigate(`/jobs/${k}`)}),y.querySelector("#ctx-unschedule").addEventListener("click",()=>{S(),jobs.find(M=>M.id===k)&&(p.update("jobs",k,{scheduledDate:null}),z("Job unscheduled","success"),T())})})})}function U(H){const D=document.getElementById("calendar-scroll");D&&(D.addEventListener("dragover",L=>{if(!d)return;const N=D.getBoundingClientRect(),C=60,k=15;L.clientY-N.top<C?D.scrollTop-=k:N.bottom-L.clientY<C&&(D.scrollTop+=k)}),D.addEventListener("wheel",L=>{d&&(D.scrollTop+=L.deltaY)},{passive:!0})),e.querySelectorAll(".unscheduled-job").forEach(L=>{L.addEventListener("dragstart",N=>{const C=L.getBoundingClientRect();d={type:"unscheduled",jobId:L.dataset.jobId,jobNumber:L.dataset.jobNumber,customerName:L.dataset.customer,title:L.dataset.title,hours:parseInt(L.dataset.hours)||2,offsetY:N.clientY-C.top},N.dataTransfer.effectAllowed="move",L.style.opacity="0.5"}),L.addEventListener("dragend",()=>{L.style.opacity="1",d=null,document.querySelectorAll(".schedule-drag-preview").forEach(N=>N.remove())})}),e.querySelectorAll(".schedule-block[draggable]").forEach(L=>{L.addEventListener("dragstart",N=>{N.stopPropagation();const C=L.getBoundingClientRect();d={type:"existing",blockType:L.dataset.blockType,scheduleId:L.dataset.scheduleId,jobId:L.dataset.blockJobId,startHour:parseFloat(L.dataset.start),endHour:parseFloat(L.dataset.end),offsetY:N.clientY-C.top},N.dataTransfer.effectAllowed="move",L.style.opacity="0.4"}),L.addEventListener("dragend",()=>{L.style.opacity="1",d=null,document.querySelectorAll(".schedule-drag-preview").forEach(N=>N.remove())})}),e.querySelectorAll(".schedule-day-col").forEach(L=>{L.addEventListener("dragover",N=>{if(N.preventDefault(),N.dataTransfer.dropEffect="move",L.style.background="rgba(27, 109, 224, 0.05)",!d)return;const C=L.getBoundingClientRect(),k=d.offsetY||0,M=(N.clientY-k-C.top)/m,V=Math.min(23.75,Math.max(0,v(M)));let ne=L.querySelector(".schedule-drag-preview");ne||(ne=document.createElement("div"),ne.className="schedule-drag-preview",ne.style.position="absolute",ne.style.left="3px",ne.style.right="3px",ne.style.background="rgba(27, 109, 224, 0.15)",ne.style.border="2px dashed var(--color-primary)",ne.style.borderRadius="4px",ne.style.pointerEvents="none",ne.style.zIndex="10",L.appendChild(ne));const F=d.type==="existing"?d.endHour-d.startHour:d.hours||2,J=V*m,be=Math.max(F*m-2,$);ne.style.top=J+"px",ne.style.height=be+"px"}),L.addEventListener("dragleave",N=>{if(!L.contains(N.relatedTarget)){L.style.background="";const C=L.querySelector(".schedule-drag-preview");C&&C.remove()}}),L.addEventListener("drop",N=>{const C=p.getAll("jobs");N.preventDefault(),L.style.background="";const k=L.querySelector(".schedule-drag-preview");if(k&&k.remove(),!d)return;const _=L.dataset.tech,M=parseInt(L.dataset.day),V=L.dataset.date?new Date(L.dataset.date+"T12:00:00"):H[M],ne=L.getBoundingClientRect(),F=d.offsetY||0,be=(N.clientY-F-ne.top)/m,ce=Math.min(23.75,Math.max(0,v(be))),ee=s.find(pe=>pe.id===_),se=C.find(pe=>pe.id===d.jobId);if(se){const pe=d.type==="existing"?d.endHour-d.startHour:d.hours||se.estimatedHours||2,Q=ce+pe;if(f().some(ue=>ue.technicianId===_&&ue.dayIdx===M&&(d.scheduleId?ue.id!==d.scheduleId:ue.jobId!==se.id)&&Math.max(ue.startHour,ce)<Math.min(ue.endHour,Q))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){d=null;return}const R=ue=>ue.toString().padStart(2,"0"),te=`${V.getFullYear()}-${R(V.getMonth()+1)}-${R(V.getDate())}`,Z=Math.floor(ce),le=Math.round((ce-Z)*60),G=Math.floor(Q),X=Math.round((Q-G)*60),ae=`${te}T${R(Z)}:${R(le)}`,ie=`${te}T${R(G)}:${R(X)}`;d.type==="existing"&&d.blockType==="schedule"?(p.update("schedule",d.scheduleId,{technicianId:_,technicianName:(ee==null?void 0:ee.name)||"",date:te,startTime:ae,finishTime:ie,hours:pe}),z(`Moved ${se.number} for ${ee==null?void 0:ee.name} to ${te}`,"success")):(p.create("schedule",{jobId:se.id,jobNumber:se.number,technicianId:_,technicianName:(ee==null?void 0:ee.name)||"",date:te,startTime:ae,finishTime:ie,hours:pe}),p.update("jobs",se.id,{scheduledDate:te,startHour:ce,technicianId:_,technicianName:(ee==null?void 0:ee.name)||"",status:se.status==="Pending"?"Scheduled":se.status}),z(`Assigned ${se.number} to ${ee==null?void 0:ee.name}`,"success"))}d=null,T()})})}function P(){e.querySelectorAll(".schedule-resize-handle").forEach(H=>{H.addEventListener("mousedown",D=>{D.preventDefault(),D.stopPropagation();const L=H.closest(".schedule-block"),N=L.closest(".schedule-day-col"),C=parseFloat(H.dataset.start),k=parseFloat(H.dataset.end);N.getBoundingClientRect(),r={blockType:H.dataset.blockType,scheduleId:H.dataset.scheduleId,jobId:H.dataset.blockJobId,block:L,col:N,startHour:C,endHour:k},L.dataset.resized="false",L.style.opacity="0.85",L.style.userSelect="none",document.body.style.cursor="ns-resize";function _(V){if(!r)return;const ne=r.col.getBoundingClientRect(),J=(V.clientY-ne.top)/m,be=v(J),ce=r.startHour+.25,ee=Math.max(be,ce);if(ee!==r.endHour){r.endHour=ee,r.block.dataset.resized="true";const se=Math.max((ee-r.startHour)*m-2,$);r.block.style.height=se+"px";const pe=r.block.querySelector(".schedule-block-time");pe&&(pe.textContent=`${w(r.startHour)} — ${w(ee)}`)}}function M(){var be;if(document.removeEventListener("mousemove",_),document.removeEventListener("mouseup",M),document.body.style.cursor="",!r)return;const{jobId:V,startHour:ne,endHour:F}=r,J=F-ne;if(r.block.style.opacity="",r.block.style.userSelect="",Math.abs(F-k)>=.25)if(r.blockType==="schedule"){const ce=p.getById("schedule",r.scheduleId);if(ce){const ee=ce.date||((be=ce.startTime)==null?void 0:be.split("T")[0])||new Date().toISOString().split("T")[0],se=R=>R.toString().padStart(2,"0"),pe=Math.floor(ne),Q=Math.round((ne-pe)*60),Y=Math.floor(F),K=Math.round((F-Y)*60);p.update("schedule",r.scheduleId,{startTime:`${ee}T${se(pe)}:${se(Q)}`,finishTime:`${ee}T${se(Y)}:${se(K)}`,hours:J}),z(`Time updated to ${w(ne)} — ${w(F)}`,"success")}}else{const ce=p.getAll("jobs").find(ee=>ee.id===V);if(ce){let ee=ce.technicians||[];ee.length>0&&(ee=ee.map(se=>({...se,hours:J}))),p.update("jobs",V,{startHour:ne,estimatedHours:parseFloat(J.toFixed(4)),technicians:ee.length>0?ee:ce.technicians}),z("Job time updated","success")}}r=null}document.addEventListener("mousemove",_),document.addEventListener("mouseup",M)})})}function O(){ra(e,{getWeekDays:x,viewMode:c,currentDate:l,calendarType:n,isTechnician:a,onNav:H=>{l.setDate(l.getDate()+(c==="week"?7*H:H)),T()},onToday:()=>{l=new Date,T()},onViewMode:H=>{c=H,T()},onCalType:H=>{n=H,T()}})}T()}function Ze(e){var y;const s=p.getAll("stock");e.innerHTML=`
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
          ${[...new Set(s.map(i=>i.category))].map(i=>`<button class="toolbar-filter" data-filter="${i}">${i}</button>`).join("")}
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
  `;const t=e.querySelector("#location-filter"),a=[...new Set(s.map(i=>i.location||"Unassigned"))].sort(),c=a.filter(i=>i.toLowerCase().includes("warehouse")||i==="Main"),n=a.filter(i=>i.toLowerCase().includes("vehicle")||i.toLowerCase().includes("van")||i.toLowerCase().includes("truck")||i.toLowerCase().includes("van stock")),l=a.filter(i=>!c.includes(i)&&!n.includes(i));if(c.length>0){const i=document.createElement("optgroup");i.label="Warehouses",c.forEach(u=>{const m=new Option(u,u);i.appendChild(m)}),t.appendChild(i)}if(n.length>0){const i=document.createElement("optgroup");i.label="Vehicles / Vans",n.forEach(u=>{const m=new Option(u,u);i.appendChild(m)}),t.appendChild(i)}if(l.length>0){const i=document.createElement("optgroup");i.label="Other",l.forEach(u=>{const m=new Option(u,u);i.appendChild(m)}),t.appendChild(i)}let o={category:"all",location:"all",search:""};function d(){const i=o.search.toLowerCase(),u=s.filter(m=>{const $=o.category==="all"||m.category===o.category,v=o.location==="all"||m.location===o.location,w=!i||m.name.toLowerCase().includes(i)||m.sku.toLowerCase().includes(i)||m.category.toLowerCase().includes(i)||m.location&&m.location.toLowerCase().includes(i);return $&&v&&w});b.updateData(u)}const b=Oe({columns:[{key:"name",label:"Item Name",render:i=>`<span class="cell-link font-medium">${g(i.name)}</span>`},{key:"sku",label:"SKU",render:i=>`<span class="text-secondary" style="font-family:monospace">${g(i.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:i=>`<span class="badge badge-neutral">${g(i.category)}</span>`,width:"110px"},{key:"quantity",label:"Qty",render:i=>{const u=i.quantity<=i.reorderLevel;return`<span style="font-weight:600;color:${u?"var(--color-danger)":"var(--text-primary)"}">${i.quantity}</span>${u?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:i=>i.quantity,width:"100px"},{key:"unitPrice",label:"Unit Price",render:i=>`$${i.unitPrice.toFixed(2)}`,getValue:i=>i.unitPrice,width:"100px"},{key:"location",label:"Location",render:i=>{var m,$;return`<div style="display:flex; align-items:center; gap:4px">
        <span class="material-icons-outlined" style="font-size:16px; color:var(--text-tertiary)">${((m=i.location)==null?void 0:m.toLowerCase().includes("vehicle"))||(($=i.location)==null?void 0:$.toLowerCase().includes("van"))?"local_shipping":"warehouse"}</span>
        <span class="text-secondary">${g(i.location)}</span>
      </div>`},width:"160px"},{key:"supplier",label:"Supplier",render:i=>`<span class="text-secondary">${g(i.supplier)}</span>`}],data:s,onRowClick:i=>B.navigate(`/stock/${i}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:i=>{Ue({container:e,selectedIds:i,onClear:()=>b.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:u=>{const m=[...new Set(p.getAll("stock").map(v=>v.category))],$=document.createElement("div");$.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${m.map(v=>`<option value="${g(v)}">${g(v)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,$.querySelector("#bulk-category").addEventListener("change",v=>{$.querySelector("#new-cat-field").style.display=v.target.value==="NEW"?"block":"none"}),Se({title:`Update ${u.length} Items`,content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Apply",className:"btn-primary",onClick:v=>{let w=$.querySelector("#bulk-category").value;w==="NEW"&&(w=$.querySelector("#bulk-new-category").value.trim()),w&&(u.forEach(q=>p.update("stock",q,{category:w})),b.clearSelection(),Ze(e),z(`Updated ${u.length} items to category: ${w}`,"success"),v())}}]})}},{label:"Adjust Price",icon:"payments",onClick:u=>{const m=document.createElement("div");m.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,Se({title:`Adjust Price for ${u.length} Items`,content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Apply",className:"btn-primary",onClick:$=>{const v=parseFloat(m.querySelector("#bulk-price-adjust").value);if(isNaN(v))return;const w=1+v/100;u.forEach(q=>{const h=p.getById("stock",q);h&&p.update("stock",q,{unitPrice:h.unitPrice*w})}),b.clearSelection(),Ze(e),z(`Adjusted prices for ${u.length} items by ${v}%`,"success"),$()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:u=>{Se({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${u.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{u.forEach($=>p.delete("stock",$)),b.clearSelection(),Ze(e),z(`Deleted ${u.length} stock items`,"success"),m()}}]})}}]})}});e.querySelector("#stock-table-container").appendChild(b),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(u=>u.classList.remove("active")),i.classList.add("active"),o.category=i.dataset.filter,d()})}),e.querySelector("#location-filter").addEventListener("change",i=>{o.location=i.target.value,d()}),e.querySelector("#stock-search").addEventListener("input",i=>{o.search=i.target.value,d()}),e.querySelector("#btn-new-stock").addEventListener("click",()=>{const i=p.getAll("technicians"),u=document.createElement("div");u.innerHTML=`
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
              ${i.map(m=>`<option value="Vehicle - ${g(m.name)}">Vehicle - ${g(m.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Cost Price ($) *</label>
        <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
      </div>
    `,Je({title:"New Stock Item",content:u.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create",className:"btn-primary",onClick:m=>{const $=document.querySelector(".drawer-overlay"),v=$.querySelector("#new-stock-name").value.trim(),w=$.querySelector("#new-stock-category").value.trim()||"Uncategorized",q=$.querySelector("#new-stock-location").value,h=parseFloat($.querySelector("#new-stock-cost").value);if(!v||isNaN(h)){z("Please fill all required fields correctly","error");return}p.create("stock",{name:v,sku:"SKU-"+Date.now().toString().slice(-6),category:w,quantity:0,unitPrice:h*1.5,costPrice:h,location:q,supplier:"Unknown"}),z("Stock item created","success"),Ze(e),m()}}]})}),(y=e.querySelector("#btn-transfer-stock"))==null||y.addEventListener("click",()=>{const i=p.getAll("stock"),u=p.getAll("technicians");if(i.length===0){z("No stock items available to transfer","error");return}const m=document.createElement("div");m.innerHTML=`
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${i.map($=>`<option value="${g($.id)}">${g($.name)} (Qty: ${$.quantity}) - ${g($.location)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select location...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              ${u.map($=>`<option value="Vehicle - ${g($.name)}">Vehicle - ${g($.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" />
          </div>
        </div>
      `,Je({title:"Transfer Stock",content:m.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Transfer",className:"btn-primary",onClick:$=>{const v=document.querySelector(".drawer-overlay"),w=v.querySelector("#transfer-item").value,q=v.querySelector("#transfer-to").value,h=parseInt(v.querySelector("#transfer-qty").value)||0;if(!w||!q||h<=0){z("Please fill all fields correctly","error");return}const S=p.getById("stock",w);if(S.quantity<h){z("Insufficient quantity available","error");return}if(S.location===q){z("Cannot transfer to the same location","error");return}p.update("stock",S.id,{quantity:S.quantity-h});const x=i.find(f=>f.sku===S.sku&&f.location===q);if(x)p.update("stock",x.id,{quantity:x.quantity+h});else{const f={...S,id:void 0,quantity:h,location:q};p.create("stock",f)}z("Stock transferred successfully","success"),Ze(e),$()}}]})})}function ca(e,{id:s}){const t=p.getById("stock",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}Ye(t.name);const a=t.quantity<=t.reorderLevel,c=t.unitPrice>0?((t.unitPrice-t.costPrice)/t.unitPrice*100).toFixed(1):0;e.innerHTML=`
    ${ot({title:t.name,icon:"inventory_2",iconBgColor:a?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:a?"var(--color-danger)":"var(--color-success)",metaHtml:`
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
        <div class="stat-value">${c}%</div>
        <div class="text-sm text-secondary">Stock value: $${(t.quantity*t.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Item Details</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Re("Name",t.name)}
            ${Re("SKU",t.sku)}
            ${Re("Category",t.category)}
            ${Re("Unit",t.unit)}
            ${Re("Supplier",t.supplier)}
            ${Re("Location",t.location)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Pricing</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Re("Cost Price",`$${t.costPrice.toFixed(2)}`)}
            ${Re("Sell Price",`$${t.unitPrice.toFixed(2)}`)}
            ${Re("Margin",`${c}%`)}
            ${Re("Total Value",`$${(t.quantity*t.unitPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit-stock").addEventListener("click",()=>B.navigate(`/stock/${s}/edit`)),e.querySelector("#btn-delete-stock").addEventListener("click",()=>{const n=document.createElement("div");n.innerHTML=`<p>Delete <strong>${g(t.name)}</strong>?</p>`,Se({title:"Delete Stock Item",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Delete",className:"btn-danger",onClick:l=>{p.delete("stock",s),z("Item deleted","success"),l(),B.navigate("/stock")}}]})})}function Re(e,s){return`<div style="display:flex;gap:8px"><span style="width:100px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function is(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("stock",s):{},c=p.getAll("assets");e.innerHTML=`
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
                ${["Electrical","Plumbing","HVAC","Fire Safety","Security","General"].map(n=>`<option ${a.category===n?"selected":""}>${n}</option>`).join("")}
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
                ${["Warehouse A","Warehouse B"].map(n=>`<option ${a.location===n?"selected":""}>${n}</option>`).join("")}
              </optgroup>
              <optgroup label="Vehicles">
                ${p.getAll("technicians").map(n=>{const l=`Vehicle - ${n.name}`;return`<option value="${l}" ${a.location===l?"selected":""}>${l}</option>`}).join("")}
              </optgroup>
              <optgroup label="Assets">
                ${c.map(n=>`<option value="${n.name}" ${a.location===n.name?"selected":""}>${n.name}</option>`).join("")}
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>B.navigate(t?`/stock/${s}`:"/stock")),e.querySelector("#btn-save").addEventListener("click",()=>{const n=e.querySelector("#stock-form");if(!n.checkValidity()){n.reportValidity();return}const l=Object.fromEntries(new FormData(n));if(l.quantity=parseInt(l.quantity)||0,l.costPrice=parseFloat(l.costPrice)||0,l.unitPrice=parseFloat(l.unitPrice)||0,l.reorderLevel=parseInt(l.reorderLevel)||10,t)p.update("stock",s,l),z("Item updated","success"),Jt(l),B.navigate(`/stock/${s}`);else{l.sku=l.sku||`SKU-${Date.now().toString().slice(-4)}`;const o=p.create("stock",l);z("Item created","success"),Jt(l),B.navigate(`/stock/${o.id}`)}})}function Jt(e){if(e.quantity<=e.reorderLevel){const s=JSON.parse(localStorage.getItem("currentUser")||"{}");let t=!1;if(s.role==="admin")t=!0;else if(s.userTypeId){const a=p.getById("userTypes",s.userTypeId);if(a&&a.permissions){const c=a.permissions.find(n=>n.module==="Stock");c&&(t=c.edit||c.create)}}t&&(fe(async()=>{const{showToast:a}=await Promise.resolve().then(()=>Ae);return{showToast:a}},void 0).then(({showToast:a})=>{a(`Auto-Reorder Alert: ${e.name} is at or below its reorder level (${e.quantity} left).`,"warning")}),p.create("notifications",{title:"Stock Auto-Reorder",message:`${e.name} (SKU: ${e.sku}) has reached its reorder level. Current quantity: ${e.quantity}. Please reorder from ${e.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function yt(e){const s=p.getAll("invoices");e.innerHTML=`
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
  `;let t=[...s];const a={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},n=Oe({columns:[{key:"number",label:"Invoice #",render:d=>`<span class="cell-link font-medium">${g(d.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:d=>d.jobNumber?`<span class="text-secondary">${g(d.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:d=>`<span class="badge ${a[d.status]||"badge-neutral"}">${g(d.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:d=>`<span class="font-semibold">$${(d.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:d=>d.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:d=>d.issueDate?new Date(d.issueDate).toLocaleDateString():"—",getValue:d=>d.issueDate?new Date(d.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:d=>d.dueDate?new Date(d.dueDate).toLocaleDateString():"—",getValue:d=>d.dueDate?new Date(d.dueDate).getTime():0,width:"100px"}],data:t,onRowClick:d=>B.navigate(`/invoices/${d}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:d=>{Ue({container:e,selectedIds:d,onClear:()=>n.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:r=>{r.forEach(b=>p.update("invoices",b,{status:"Paid",datePaid:new Date().toISOString()})),n.clearSelection(),yt(e),fe(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ae);return{showToast:b}},void 0).then(({showToast:b})=>b(`Marked ${r.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:r=>{const b=document.createElement("div");b.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,fe(async()=>{const{showModal:y}=await Promise.resolve().then(()=>je);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:`Update ${r.length} Invoices`,content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const u=b.querySelector("#bulk-status").value;r.forEach(m=>p.update("invoices",m,{status:u})),n.clearSelection(),yt(e),fe(async()=>{const{showToast:m}=await Promise.resolve().then(()=>Ae);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${r.length} invoices to ${u}`,"success")),i()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:r=>{fe(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ae);return{showToast:b}},void 0).then(({showToast:b})=>b(`Sending reminders for ${r.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{fe(async()=>{const{showModal:b}=await Promise.resolve().then(()=>je);return{showModal:b}},void 0).then(({showModal:b})=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete ${r.length} invoices? This action cannot be undone.</p>`,b({title:"Confirm Bulk Delete",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{r.forEach(u=>p.delete("invoices",u)),n.clearSelection(),yt(e),fe(async()=>{const{showToast:u}=await Promise.resolve().then(()=>Ae);return{showToast:u}},void 0).then(({showToast:u})=>u(`Deleted ${r.length} invoices`,"success")),i()}}]})})}}]})}});e.querySelector("#invoices-table-container").appendChild(n),e.querySelector("#btn-new-invoice").addEventListener("click",()=>B.navigate("/invoices/new"));const l=e.querySelector("#btn-export-accounting");function o(d){d.some(r=>r.status==="Paid")?l.style.display="inline-flex":l.style.display="none"}o(t),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(b=>b.classList.remove("active")),d.classList.add("active");const r=d.dataset.filter;t=r==="all"?[...s]:s.filter(b=>b.status===r),n.updateData(t),o(t)})}),l.addEventListener("click",()=>{const d=t.filter(i=>i.status==="Paid");if(d.length===0)return;let r="data:text/csv;charset=utf-8,";r+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,d.forEach(i=>{const u=[i.number,`"${i.customerName.replace(/"/g,'""')}"`,i.email||"",i.issueDate?i.issueDate.split("T")[0]:"",i.dueDate?i.dueDate.split("T")[0]:"",(i.total||0).toFixed(2),(i.tax||0).toFixed(2),"200"].join(",");r+=u+`
`});const b=encodeURI(r),y=document.createElement("a");y.setAttribute("href",b),y.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(y),y.click(),document.body.removeChild(y),fe(async()=>{const{showToast:i}=await Promise.resolve().then(()=>Ae);return{showToast:i}},void 0).then(({showToast:i})=>{i(`Exported ${d.length} paid invoices`,"success")})}),e.querySelector("#invoices-search").addEventListener("input",d=>{const r=d.target.value.toLowerCase();t=s.filter(b=>b.number.toLowerCase().includes(r)||b.customerName.toLowerCase().includes(r)||(b.jobNumber||"").toLowerCase().includes(r)),n.updateData(t),o(t)})}function ns(e,{id:s}){const t=s==="new";let a=t?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:p.getById("invoices",s);if(!a){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}a.lineItems&&!a.sections&&(a.sections=[{id:p.generateId(),name:"Main Phase",lineItems:[...a.lineItems]}],delete a.lineItems),t||Ye(a.number);const c=p.getAll("customers"),n=p.getAll("stock"),l=p.getSettings(),o={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function d(){e.innerHTML=`
      ${ot({title:`
          ${t?"New Invoice":a.number}
          ${a.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':a.invoiceType&&a.invoiceType!=="Standard"?`<span class="badge badge-primary">${a.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${a.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${a.customerName}</span>`:""}
          ${a.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${a.jobNumber}</span>`:""}
          <span class="badge ${o[a.status]||"badge-neutral"}">${a.status}</span>
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
                ${c.map(u=>`<option value="${u.id}" ${a.customerId===u.id?"selected":""}>${u.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${l.laborRates.map(u=>`<option value="${u.id}" ${a.laborProfileId===u.id?"selected":""}>${u.name} ($${u.rate.toFixed(2)}/hr)</option>`).join("")}
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
        ${n.map(u=>`<option value="${u.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(a.sections||[]).map((u,m)=>r(u,m)).join("")}
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
    `,i()}function r(u,m){return`
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
              ${(u.lineItems||[]).map(($,v)=>b($,m,v)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function b(u,m,$){return`
      <tr data-sidx="${m}" data-index="${$}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${u.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${u.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${u.type==="material"?"selected":""}>Material</option>
          <option value="other" ${u.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${u.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${u.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(u.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${m}" data-index="${$}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function y(){a.subtotal=0,a.totalInternalCost=0;let u=0;p.getSettings().laborRates.find($=>$.id===a.laborProfileId),(a.sections||[]).forEach($=>{$.subtotal=0,($.lineItems||[]).forEach(v=>{v.total=(v.qty||0)*(v.rate||0),v.type==="labor"&&(u+=v.total),v.internalCost||(v.type==="labor"?v.internalCost=45:v.internalCost=v.rate*.7),a.totalInternalCost+=(v.qty||0)*(v.internalCost||0),$.subtotal+=v.total}),a.subtotal+=$.subtotal}),a.invoiceType==="CreditNote"?a.subtotal=-Math.abs(a.subtotal):a.subtotal=Math.abs(a.subtotal),a.tax=a.subtotal*.1,a.total=a.subtotal+a.tax,d()}function i(){var m,$,v,w,q,h,S,x;(m=e.querySelector("#btn-preview-pdf"))==null||m.addEventListener("click",()=>{Pt({type:"invoice",data:a})});const u=e.querySelector(".dropdown > .btn");u&&(u.addEventListener("click",f=>{f.stopPropagation();const E=u.nextElementSibling;E.style.display=E.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const f=e.querySelector(".dropdown-menu");f&&(f.style.display="none")})),($=e.querySelector("#inv-labor-profile"))==null||$.addEventListener("change",f=>{a.laborProfileId=f.target.value;const E=l.laborRates.find(T=>T.id===a.laborProfileId);E&&(a.sections.forEach(T=>{T.lineItems.forEach(A=>{A.type==="labor"&&(A.rate=E.rate)})}),y())}),(v=e.querySelector("#btn-add-section"))==null||v.addEventListener("click",()=>{a.sections.push({id:p.generateId(),name:"New Phase",lineItems:[]}),y()}),e.querySelectorAll(".section-name-input").forEach((f,E)=>{f.addEventListener("change",()=>{a.sections[E].name=f.value})}),e.querySelectorAll(".btn-add-line").forEach(f=>{f.addEventListener("click",()=>{const E=parseInt(f.dataset.sidx);a.sections[E].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),d()})}),e.querySelectorAll(".btn-remove-section").forEach(f=>{f.addEventListener("click",()=>{const E=parseInt(f.dataset.sidx);confirm("Remove this entire phase?")&&(a.sections.splice(E,1),y())})}),e.querySelectorAll(".item-input").forEach(f=>{f.addEventListener("change",()=>{const E=f.closest("tr"),T=parseInt(E.dataset.sidx),A=parseInt(E.dataset.index),I=f.dataset.field;let j=f.value;if((I==="qty"||I==="rate")&&(j=parseFloat(j)||0),a.sections[T].lineItems[A][I]=j,I==="description"){const U=n.find(P=>P.name===j);if(U){const P=(U.category||"").toLowerCase().includes("labor");let O=0,H=0;if(P)O=U.unitPrice||85,H=U.costPrice||45;else{const D=U.costPrice||U.unitPrice||0;H=D,O=kt(D,l)}a.sections[T].lineItems[A].type=P?"labor":"material",a.sections[T].lineItems[A].rate=O,a.sections[T].lineItems[A].internalCost=H}}y()})}),e.querySelectorAll(".btn-remove-line").forEach(f=>{f.addEventListener("click",()=>{const E=parseInt(f.dataset.sidx),T=parseInt(f.dataset.index);a.sections[E].lineItems.splice(T,1),y()})}),(w=e.querySelector("#btn-save-inv"))==null||w.addEventListener("click",()=>{const f=e.querySelector("#inv-customer").value,E=c.find(T=>T.id===f);if(a.customerId=f,a.customerName=(E==null?void 0:E.company)||"",a.status=e.querySelector("#inv-status").value,a.issueDate=e.querySelector("#inv-issue").value,a.dueDate=e.querySelector("#inv-due").value,a.invoiceType=e.querySelector("#inv-type").value,y(),t){const T=p.create("invoices",a);z("Invoice created","success"),B.navigate(`/invoices/${T.id}`)}else p.update("invoices",s,a),z("Invoice saved","success"),d()}),(q=e.querySelector("#btn-send-invoice"))==null||q.addEventListener("click",()=>{p.update("invoices",s,{status:"Sent"}),a.status="Sent",z("Invoice sent to customer","success"),d()}),(h=e.querySelector("#btn-mark-paid"))==null||h.addEventListener("click",()=>{const f=document.createElement("div");f.innerHTML=`
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
      `,Je({title:"Mark Invoice as Paid",content:f.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Confirm Payment",className:"btn-primary",onClick:E=>{const T=document.querySelector(".drawer-overlay"),A=T.querySelector("#paid-date").value,I=T.querySelector("#paid-method").value;p.update("invoices",s,{status:"Paid",paidDate:A,paymentMethod:I}),a.status="Paid",a.paidDate=A,a.paymentMethod=I,z("Invoice marked as paid","success"),d(),E()}}],width:350})}),(S=e.querySelector("#btn-delete-invoice"))==null||S.addEventListener("click",()=>{const f=document.createElement("div");f.innerHTML=`<p>Delete invoice <strong>${g(a.number)}</strong>?</p>`,Se({title:"Delete Invoice",content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Delete",className:"btn-danger",onClick:E=>{p.delete("invoices",s),z("Invoice deleted","success"),E(),B.navigate("/invoices")}}]})}),(x=e.querySelector("#btn-cancel-inv"))==null||x.addEventListener("click",()=>B.navigate("/invoices"))}d()}function et(e){const s=p.getAll("purchaseOrders");e.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(n=>`<button class="toolbar-filter" data-filter="${n}">${n}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let t=[...s];const c=Oe({columns:[{key:"number",label:"PO Number",render:n=>`<span class="cell-link font-medium">${g(n.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:n=>`<span class="text-secondary">${g(n.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:n=>n.jobId?`<a href="#/jobs/${n.jobId}" class="cell-link">${g(n.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:n=>n.issueDate?new Date(n.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:n=>`$${(n.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:n=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[n.status]||"badge-neutral"}">${g(n.status)}</span>`,width:"110px"}],data:t,onRowClick:n=>Ot({id:n,onSave:()=>et(e)}),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:n=>{Ue({container:e,selectedIds:n,onClear:()=>c.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:l=>{l.forEach(o=>p.update("purchaseOrders",o,{status:"Received",receivedDate:new Date().toISOString()})),c.clearSelection(),et(e),fe(async()=>{const{showToast:o}=await Promise.resolve().then(()=>Ae);return{showToast:o}},void 0).then(({showToast:o})=>o(`Marked ${l.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:l=>{const o=document.createElement("div");o.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,fe(async()=>{const{showModal:d}=await Promise.resolve().then(()=>je);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${l.length} Purchase Orders`,content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Apply",className:"btn-primary",onClick:r=>{const b=o.querySelector("#bulk-status").value;l.forEach(y=>p.update("purchaseOrders",y,{status:b})),c.clearSelection(),et(e),fe(async()=>{const{showToast:y}=await Promise.resolve().then(()=>Ae);return{showToast:y}},void 0).then(({showToast:y})=>y(`Updated ${l.length} POs to ${b}`,"success")),r()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{fe(async()=>{const{showModal:o}=await Promise.resolve().then(()=>je);return{showModal:o}},void 0).then(({showModal:o})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${l.length} purchase orders? This action cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Delete",className:"btn-danger",onClick:r=>{l.forEach(b=>p.delete("purchaseOrders",b)),c.clearSelection(),et(e),fe(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ae);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deleted ${l.length} purchase orders`,"success")),r()}}]})})}}]})}});e.querySelector("#po-table-container").appendChild(c),e.querySelector("#btn-new-po").addEventListener("click",()=>{Ot({onSave:()=>et(e)})}),e.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),n.classList.add("active");const l=n.dataset.filter;t=l==="all"?[...s]:s.filter(o=>o.status===l),c.updateData(t)})}),e.querySelector("#po-search").addEventListener("input",n=>{const l=n.target.value.toLowerCase();t=s.filter(o=>{var d,r,b;return((d=o.number)==null?void 0:d.toLowerCase().includes(l))||((r=o.supplierName)==null?void 0:r.toLowerCase().includes(l))||((b=o.jobNumber)==null?void 0:b.toLowerCase().includes(l))}),c.updateData(t)})}function pa(e,{id:s,jobId:t}){const a=s==="new";let c=a?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:t||"",jobNumber:""}:p.getById("purchaseOrders",s);if(!c){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(a&&t){const i=p.getById("jobs",t);i&&(c.jobNumber=i.number)}Ye(c.number||"New PO");const n=p.getAll("stock"),l=p.getAll("jobs"),o=[...new Set(n.map(i=>i.supplier).filter(Boolean))];o.length===0&&o.push("General Supplier");function d(){e.innerHTML=`
      ${ot({title:c.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${c.status==="Draft"?"badge-neutral":c.status==="Issued"?"badge-primary":c.status==="Received"?"badge-success":"badge-danger"}">${c.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!a&&c.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!a&&c.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${c.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${o.map(i=>`<option value="${i}" ${c.supplierName===i?"selected":""}>${i}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${c.issueDate?c.issueDate.split("T")[0]:""}" ${c.status!=="Draft"?"disabled":""} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${c.status!=="Draft"?"disabled":""}>
                    <option value="">None</option>
                    ${l.map(i=>`<option value="${i.id}" ${c.jobId===i.id?"selected":""}>${i.number} - ${i.title}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${c.status!=="Draft"?"disabled":""}>${c.notes||""}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${c.status==="Draft"?'<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>':""}
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
                  ${c.status==="Draft"?'<th style="width:5%"></th>':""}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${c.lineItems.length===0?'<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>':""}
                ${c.lineItems.map((i,u)=>`
                  <tr data-index="${u}">
                    <td>
                      ${c.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${n.map(m=>`<option value="${m.id}" ${i.stockId===m.id?"selected":""}>${m.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${i.stockId?"display:none":""}" value="${i.description||""}" placeholder="Description" />
                      `:`<div>${i.description}</div>`}
                    </td>
                    <td>
                      ${c.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${i.sku||""}" ${i.stockId?"disabled":""} />`:i.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${c.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${i.unitCost||0}" step="0.01" />`:`$${(i.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${c.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${i.quantity||1}" min="1" step="1" />`:i.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((i.unitCost||0)*(i.quantity||1)).toFixed(2)}
                    </td>
                    ${c.status==="Draft"?`
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>`:""}
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(c.total||0).toFixed(2)}</td>
                  ${c.status==="Draft"?"<td></td>":""}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,b()}function r(){let i=0;e.querySelectorAll("#line-items-body tr[data-index]").forEach(m=>{const $=parseFloat(m.querySelector(".item-cost").value)||0,v=parseFloat(m.querySelector(".item-qty").value)||0,w=$*v;m.querySelector(".item-total").textContent="$"+w.toFixed(2),i+=w}),c.total=i;const u=e.querySelector("#po-total");u&&(u.textContent="$"+i.toFixed(2))}function b(){var i,u,m,$;e.querySelector("#btn-cancel").addEventListener("click",()=>B.navigate("/purchase-orders")),(i=e.querySelector("#btn-save"))==null||i.addEventListener("click",()=>{y()}),(u=e.querySelector("#btn-issue"))==null||u.addEventListener("click",()=>{if(c.lineItems.length===0){z("Cannot issue a PO with no items","error");return}y("Issued")}),(m=e.querySelector("#btn-receive"))==null||m.addEventListener("click",()=>{let v=0;const w=p.getAll("stock"),q=new Map(w.map(h=>[h.id,h]));c.lineItems.forEach(h=>{if(h.stockId){const S=q.get(h.stockId);S&&(S.quantity=(S.quantity||0)+h.quantity,S.updatedAt=new Date().toISOString(),v++)}}),v>0&&p.save("stock",w),z(`Received ${v} items into stock.`,"success"),c.status="Received",p.update("purchaseOrders",c.id,{status:"Received"}),d()}),($=e.querySelector("#btn-add-item"))==null||$.addEventListener("click",()=>{c.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),d()}),e.querySelectorAll(".item-select").forEach((v,w)=>{v.addEventListener("change",q=>{const h=q.target.value,S=q.target.closest("tr"),x=S.querySelector(".item-desc"),f=S.querySelector(".item-sku"),E=S.querySelector(".item-cost");if(h){const T=p.getById("stock",h);T&&(x.style.display="none",x.value=T.name,f.value=T.sku,f.disabled=!0,E.value=T.costPrice||T.unitPrice)}else x.style.display="block",x.value="",f.value="",f.disabled=!1,E.value=0;r()})}),e.querySelectorAll(".item-cost, .item-qty").forEach(v=>{v.addEventListener("input",r)}),e.querySelectorAll(".btn-remove-item").forEach(v=>{v.addEventListener("click",w=>{const q=w.target.closest("tr"),h=parseInt(q.dataset.index);c.lineItems.splice(h,1),d()})})}function y(i=null){if(c.status!=="Draft"){z("Cannot modify an issued or received PO","error");return}const u=e.querySelector("#po-form");if(!u.checkValidity()){u.reportValidity();return}const m=Object.fromEntries(new FormData(u));if(m.jobId){const v=l.find(w=>w.id===m.jobId);m.jobNumber=v?v.number:""}else m.jobNumber="";c.lineItems=Array.from(e.querySelectorAll("#line-items-body tr[data-index]")).map(v=>{const w=v.querySelector(".item-select"),q=w?w.value:"",h=v.querySelector(".item-desc").value,S=q?w.options[w.selectedIndex].text:h;return{stockId:q,description:S,sku:v.querySelector(".item-sku").value,unitCost:parseFloat(v.querySelector(".item-cost").value)||0,quantity:parseInt(v.querySelector(".item-qty").value)||1}}),r();const $={...c,...m,total:c.total,lineItems:c.lineItems,status:i||c.status};if(a){$.number=`PO-${Date.now().toString().slice(-6)}`;const v=p.create("purchaseOrders",$);z(`PO ${i==="Issued"?"issued":"created"} successfully`,"success"),B.navigate(`/purchase-orders/${v.id}`)}else p.update("purchaseOrders",s,$),z(`PO ${i==="Issued"?"issued":"updated"} successfully`,"success"),i==="Issued"&&d()}d()}function ua(e){let s="overview";const t=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function a(){const d=p.getAll("jobs"),r=p.getAll("quotes"),b=p.getAll("invoices"),y=p.getAll("customers"),i=p.getAll("stock"),u=p.getAll("technicians"),m=p.getAll("leads"),$=b.filter(D=>D.status==="Paid").reduce((D,L)=>D+(L.total||0),0),v=b.filter(D=>D.status==="Sent"||D.status==="Overdue").reduce((D,L)=>D+(L.total||0),0),w=d.length>0?d.reduce((D,L)=>D+(L.laborCost||0)+(L.materialCost||0),0)/d.length:0,q=r.length>0?r.filter(D=>D.status==="Accepted").length/r.length*100:0,h=m.length>0?m.filter(D=>D.status==="Won").length/m.length*100:0,S={};d.forEach(D=>{S[D.status]=(S[D.status]||0)+1});const x={};b.forEach(D=>{x[D.status]=(x[D.status]||0)+1});const f=u.map(D=>{const L=d.filter(k=>k.technicianId===D.id),N=L.filter(k=>k.status==="Completed"||k.status==="Invoiced").length,C=L.reduce((k,_)=>k+(_.laborCost||0)+(_.materialCost||0),0);return{...D,totalJobs:L.length,completed:N,revenue:C}}),E={};b.filter(D=>D.status==="Paid").forEach(D=>{E[D.customerName]=(E[D.customerName]||0)+(D.total||0)});const T=Object.entries(E).sort((D,L)=>L[1]-D[1]).slice(0,10),A=i.reduce((D,L)=>D+L.quantity*L.costPrice,0),I=i.filter(D=>D.quantity<=D.reorderLevel),j=p.getAll("timesheets"),U={},P={},O=p.getAll("people"),H={};return O.forEach(D=>{D.payRate&&(H[D.id]=D.payRate)}),j.forEach(D=>{U[D.jobId]=(U[D.jobId]||0)+(D.hours||0);const L=D.payRate||H[D.technicianId]||0;P[D.jobId]=(P[D.jobId]||0)+D.hours*L}),{jobs:d,quotes:r,invoices:b,customers:y,stock:i,technicians:u,leads:m,totalRevenue:$,totalOutstanding:v,avgJobValue:w,quoteWinRate:q,leadConvRate:h,jobsByStatus:S,invByStatus:x,techStats:f,topCustomers:T,totalStockValue:A,lowStockItems:I,timesheets:j,hoursByJob:U,internalLaborCostByJob:P}}function c(){const d=a();e.innerHTML=`
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
              ${t.map(r=>`
                <button class="report-nav-item ${s===r.id?"active":""}" data-report="${r.id}" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${s===r.id?"var(--color-primary-light)":"transparent"};
                  color:${s===r.id?"var(--color-primary)":"var(--text-secondary)"};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${s===r.id?"600":"500"};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${r.icon}</span>
                  ${r.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `,n(d),l(d)}function n(d){const r=e.querySelector("#report-content");switch(s){case"overview":r.innerHTML=ma(d);break;case"revenue":r.innerHTML=ba(d);break;case"jobs":r.innerHTML=va(d);break;case"job_costing":r.innerHTML=ya(d);break;case"technicians":r.innerHTML=fa(d);break;case"customers":r.innerHTML=ga(d);break;case"inventory":r.innerHTML=ha(d);break;default:r.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function l(d){var r;e.querySelectorAll("[data-report]").forEach(b=>{b.addEventListener("click",()=>{s=b.dataset.report,c()})}),(r=e.querySelector("#btn-export-csv"))==null||r.addEventListener("click",()=>o(d))}function o(d){let r="";if(s==="overview"||s==="revenue")r=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,d.invoices.forEach(u=>{r+=`"${u.number}","${u.customerName}","${u.status}",${u.total||0},"${u.issueDate||""}","${u.dueDate||""}"
`});else if(s==="job_costing"){const u=p.getSettings();r=`Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %
`,d.jobs.filter($=>$.status==="Completed"||$.status==="Invoiced").map($=>{const v=d.hoursByJob[$.id]||0,w=d.internalLaborCostByJob[$.id]||$.laborCost||0,q=u.laborRates.find(f=>f.id===$.laborRateProfileId)||u.laborRates.find(f=>f.isDefault),h=Math.max(v*((q==null?void 0:q.rate)||85),(q==null?void 0:q.minCallOutFee)||0),S=h-w,x=h>0?S/h*100:0;return{num:$.number,tech:$.technicianName||"",actualH:v,actualLabor:w,billableLabor:h,profit:S,margin:x}}).forEach($=>{r+=`"${$.num}","${$.tech}",${$.actualH},${$.actualLabor.toFixed(2)},${$.billableLabor.toFixed(2)},${$.profit.toFixed(2)},${$.margin.toFixed(1)}%
`})}else s==="jobs"?(r=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,d.jobs.forEach(u=>{r+=`"${u.number}","${u.title}","${u.customerName}","${u.technicianName||""}","${u.status}","${u.priority}",${u.laborCost||0},${u.materialCost||0}
`})):s==="technicians"?(r=`Name,Role,Total Jobs,Completed,Revenue
`,d.techStats.forEach(u=>{r+=`"${u.name}","${u.role}",${u.totalJobs},${u.completed},${u.revenue}
`})):s==="customers"?(r=`Company,First Name,Last Name,Email,Phone,Status
`,d.customers.forEach(u=>{r+=`"${u.company}","${u.firstName}","${u.lastName}","${u.email}","${u.phone}","${u.status}"
`})):s==="inventory"&&(r=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,d.stock.forEach(u=>{r+=`"${u.name}","${u.sku}","${u.category}",${u.quantity},${u.costPrice},${u.unitPrice},"${u.location}","${u.supplier}"
`}));const b=new Blob([r],{type:"text/csv"}),y=URL.createObjectURL(b),i=document.createElement("a");i.href=y,i.download=`simpro_${s}_report.csv`,i.click(),URL.revokeObjectURL(y)}c()}function Pe(e,s,t,a){const c={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${e}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[a]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${c[a]}">${t}</span>
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
  `}function ut(e,s={},t="#1B6DE0"){const a=Object.entries(e);if(a.length===0)return'<div class="text-secondary text-sm">No data available</div>';const c=Math.max(...a.map(([,n])=>n));return a.map(([n,l])=>{const o=s[n]||t,d=c>0?l/c*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${n}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${d}%;background:${o};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof l=="number"&&l>=1e3?`$${(l/1e3).toFixed(1)}k`:l}</div>
      </div>
    `}).join("")}function dt(e,s,t,a){const c=t>0?s/t*100:0,n=typeof s=="number"?`$${s.toLocaleString("en-AU",{minimumFractionDigits:0})}`:s;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${e}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${n}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${c}%;background:${a};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function ma(e){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Pe("Total Revenue",`$${e.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${Pe("Outstanding",`$${e.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${Pe("Quote Win Rate",`${e.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${Pe("Lead Conversion",`${e.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${ut(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${ut(e.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
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
  `}function ba(e){const s=e.invoices.filter(l=>l.status==="Paid"),t={};s.forEach(l=>{const o=new Date(l.issueDate||l.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});t[o]=(t[o]||0)+(l.total||0)});const a=e.jobs.reduce((l,o)=>l+(o.materialCost||0),0),c=e.jobs.reduce((l,o)=>l+(o.laborCost||0),0),n=e.totalRevenue-a;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Pe("Gross Revenue",`$${e.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${Pe("Total Labor",`$${c.toFixed(0)}`,"engineering","blue")}
      ${Pe("Material Costs",`$${a.toFixed(0)}`,"inventory_2","orange")}
      ${Pe("Gross Profit",`$${n.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${ut(t,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${dt("Revenue",e.totalRevenue,e.totalRevenue,"#10B981")}
        ${dt("Labor Cost",c,e.totalRevenue,"#3B82F6")}
        ${dt("Material Cost",a,e.totalRevenue,"#F59E0B")}
        ${dt("Gross Profit",n,e.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function va(e){const s=e.jobs.filter(a=>a.status==="Completed"||a.status==="Invoiced"),t=s.length>0?s.reduce((a,c)=>a+(c.estimatedHours||0),0)/s.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Pe("Total Jobs",e.jobs.length,"build","blue")}
      ${Pe("Completed",s.length,"check_circle","green")}
      ${Pe("In Progress",e.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${Pe("Avg Hours",t.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${ut(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${e.jobs.sort((a,c)=>(c.laborCost||0)+(c.materialCost||0)-((a.laborCost||0)+(a.materialCost||0))).slice(0,8).map(a=>`
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
  `}function ya(e){const s=p.getSettings(),a=e.jobs.filter(d=>d.status==="Completed"||d.status==="Invoiced").map(d=>{const r=e.hoursByJob[d.id]||0,b=e.internalLaborCostByJob[d.id]||d.laborCost||0,y=s.laborRates.find($=>$.id===d.laborRateProfileId)||s.laborRates.find($=>$.isDefault),i=Math.max(r*((y==null?void 0:y.rate)||85),(y==null?void 0:y.minCallOutFee)||0),u=i-b,m=i>0?u/i*100:0;return{...d,actualH:r,actualLabor:b,billableLabor:i,profit:u,margin:m}}),c=a.reduce((d,r)=>d+r.actualLabor,0),n=a.reduce((d,r)=>d+r.billableLabor,0),l=n-c,o=n>0?l/n*100:0;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Pe("Internal Labor Cost","$"+c.toLocaleString(),"engineering","orange")}
      ${Pe("Billable Labor Rev.","$"+n.toLocaleString(),"payments","green")}
      ${Pe("Labor Profitability",o.toFixed(1)+"% Margin","trending_up",o>=40?"green":"orange")}
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
  `}function fa(e){return`
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
        ${e.techStats.map(s=>dt(s.name,s.revenue,Math.max(...e.techStats.map(t=>t.revenue)),s.color)).join("")}
      </div>
    </div>
  `}function ga(e){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Pe("Total Customers",e.customers.length,"people","blue")}
      ${Pe("Active Customers",e.customers.filter(s=>s.status==="Active").length,"check_circle","green")}
      ${Pe("Total Leads",e.leads.length,"trending_up","orange")}
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
  `}function ha(e){const s=e.stock.reduce((t,a)=>t+a.quantity*a.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Pe("Total Items",e.stock.length,"inventory_2","blue")}
      ${Pe("Stock Value (Cost)",`$${e.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${Pe("Stock Value (Sell)",`$${s.toFixed(0)}`,"paid","green")}
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
        ${ut(e.stock.reduce((t,a)=>(t[a.category]=(t[a.category]||0)+a.quantity,t),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}function He(e){return Object.entries(tt).map(([s,t])=>{const a={module:s};return t.forEach(({key:c})=>{a[c]=e(s,c)}),a})}function xa(e){const t=new URLSearchParams(window.location.hash.split("?")[1]||window.location.search).get("tab");let a="company",c="tasklists";t==="forms"?(a="templates_forms",c="forms"):t==="tasks"||t==="tasklists"?(a="templates_forms",c="tasklists"):t==="quote_templates"||t==="quotes"?(a="templates_forms",c="quotes"):t&&(a=t),JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');function n(){e.innerHTML=`
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
    `,l(),e.querySelectorAll(".tab").forEach(m=>{m.addEventListener("click",()=>{a=m.dataset.tab,e.querySelectorAll(".tab").forEach($=>$.classList.remove("active")),m.classList.add("active"),l()})})}function l(){var v,w,q;const m=e.querySelector("#settings-content");if(a==="templates_forms"){u(m);return}if(a==="company"){const h=p.getSettings();let S=h.logo;(()=>{var E;m.innerHTML=`
          <div class="card" style="max-width:800px">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 280px; gap:var(--space-lg)">
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${h.name||"FieldForge Demo Company"}" id="company-name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${h.abn||"12 345 678 901"}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${h.phone||"1300 123 456"}" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Company Domain</label>
                    <input class="form-input" value="${h.email||"fieldforge.io"}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2">${h.address||"123 Business St, Melbourne VIC 3000"}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; align-items:center; text-align:center">
                  <label class="form-label" style="align-self:flex-start">Company Logo</label>
                  <div id="logo-preview-container" style="width:100%; aspect-ratio:1; margin:12px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                    ${S?`<img src="${S}" style="max-width:90%; max-height:90%; object-fit:contain" />`:`
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
                    ${S?'<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>':""}
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
        `;const f=m.querySelector("#logo-upload");m.querySelector("#btn-upload-logo").addEventListener("click",()=>f.click()),f.addEventListener("change",T=>{const A=T.target.files[0];if(A){const I=new FileReader;I.onload=j=>{S=j.target.result;const U=m.querySelector("#logo-preview-container");U.innerHTML=`<img src="${S}" style="max-width:90%; max-height:90%; object-fit:contain" />`,m.querySelector("#unsaved-logo-hint").style.display="block",z("Logo preview updated. Click Save to apply.","info")},I.readAsDataURL(A)}}),(E=m.querySelector("#btn-remove-logo"))==null||E.addEventListener("click",()=>{S=null;const T=m.querySelector("#logo-preview-container");T.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `,m.querySelector("#unsaved-logo-hint").style.display="block",m.querySelector("#btn-remove-logo").style.display="none"}),m.querySelector("#btn-save-company").addEventListener("click",()=>{const T=p.getSettings();T.name=m.querySelector("#company-name").value,T.abn=m.querySelector("#company-abn").value,T.phone=m.querySelector("#company-phone").value,T.email=m.querySelector("#company-domain").value,T.address=m.querySelector("#company-address").value,T.logo=S,p.saveSettings(T),z("Company information saved permanently","success"),m.querySelector("#unsaved-logo-hint").style.display="none",window.dispatchEvent(new CustomEvent("simpro-settings-updated"))})})()}else if(a==="users"){const h=p.getAll("technicians");let S=p.getAll("userTypes");!S||S.length===0?(S=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:He(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:He((x,f)=>x==="Settings"?["view","edit_company"].includes(f):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs",permissions:He((x,f)=>x==="Dashboard"?f==="view":x==="Jobs"?["view","manage_tasks","book_time"].includes(f):x==="Timesheets"?["view_own","create"].includes(f):x==="Schedule"?["view_own"].includes(f):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:He((x,f)=>x==="Settings"?!1:x==="Reports"?f==="view":!(["Invoices","Purchase Orders"].includes(x)&&f==="delete"))}],p.save("userTypes",S)):S.some(f=>f.id==="ut_office")||(S.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:He((f,E)=>f==="Settings"?!1:f==="Reports"?E==="view":!(["Invoices","Purchase Orders"].includes(f)&&E==="delete"))}),p.save("userTypes",S)),m.innerHTML=`
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
                ${h.filter(x=>!x.deactivated).map(x=>{const f=S.find(E=>E.id===x.userTypeId);return`
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${x.color}"></div></td>
                      <td class="font-medium">${x.name}</td>
                      <td class="text-secondary">${x.role}</td>
                      <td><span class="badge ${(f==null?void 0:f.id)==="ut_admin"?"badge-primary":"badge-neutral"}">${(f==null?void 0:f.name)||"Unassigned"}</span></td>
                      <td class="text-tertiary">${x.email||"-"}</td>
                      <td class="text-secondary">${x.payRate?`$${x.payRate.toFixed(2)}/hr`:"-"}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${x.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${x.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
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
                ${S.map(x=>`
                  <tr>
                    <td class="font-medium">${x.name}</td>
                    <td class="text-secondary">${x.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${x.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${x.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${x.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${h.filter(x=>x.deactivated).length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>':""}
                ${h.filter(x=>x.deactivated).map(x=>{const f=new Date(x.deactivatedAt),T=new Date-f,I=30-Math.ceil(T/(1e3*60*60*24)),j=I<=0;return`
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${x.name}</td>
                      <td style="opacity:0.6">${x.role}</td>
                      <td class="text-tertiary">${f.toLocaleDateString()}</td>
                      <td>
                        ${j?'<span class="badge badge-success">Cooldown Complete</span>':`<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${I} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${x.id}" 
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
      `,m.querySelector("#btn-add-user").addEventListener("click",()=>r()),m.querySelectorAll(".btn-edit-user").forEach(x=>{x.addEventListener("click",f=>r(f.currentTarget.dataset.id))}),m.querySelectorAll(".btn-deactivate-user").forEach(x=>{x.addEventListener("click",f=>{const E=f.currentTarget.dataset.id,T=p.getById("technicians",E);if(!T)return;const A=document.createElement("div");A.innerHTML=`<p>Are you sure you want to deactivate <strong>${T.name}</strong>? They will no longer be able to log in.</p>`,Se({title:"Deactivate User",content:A,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Deactivate",className:"btn-danger",onClick:I=>{p.update("technicians",E,{deactivated:!0,deactivatedAt:new Date().toISOString()}),z(`${T.name} deactivated`,"info"),I(),l()}}]})})}),m.querySelectorAll(".btn-reactivate-user").forEach(x=>{x.addEventListener("click",f=>{const E=f.currentTarget.dataset.id,T=p.getById("technicians",E);if(!T)return;const A=new Date(T.deactivatedAt),I=Math.ceil((new Date-A)/(1e3*60*60*24));if(I<30){z(`License Policy: Seat cooldown in progress (${30-I} days remaining)`,"error");return}const j=document.createElement("div");j.innerHTML=`<p>Reactivate <strong>${T.name}</strong>? They will regain access once a User Type is assigned.</p>`,Se({title:"Reactivate User",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:U=>U()},{label:"Reactivate",className:"btn-primary",onClick:U=>{p.update("technicians",E,{deactivated:!1,deactivatedAt:null}),z(`${T.name} has been reactivated.`,"success"),U(),l()}}]})})}),(v=m.querySelector("#btn-add-usertype"))==null||v.addEventListener("click",()=>{o()}),m.querySelectorAll(".btn-edit-perms").forEach(x=>{x.addEventListener("click",f=>{d(f.target.dataset.id)})}),m.querySelectorAll(".btn-edit-usertype").forEach(x=>{x.addEventListener("click",f=>{o(f.target.dataset.id)})}),m.querySelectorAll(".btn-delete-usertype").forEach(x=>{x.addEventListener("click",f=>{const E=f.target.dataset.id,T=p.getById("userTypes",E);if(!T)return;if(T.name.toLowerCase().includes("admin")){z("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const A=p.getAll("technicians").filter(j=>j.userTypeId===E),I=document.createElement("div");I.innerHTML=`<p>Are you sure you want to delete the user type <strong>${T.name}</strong>?${A.length>0?` <strong>${A.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,Se({title:"Confirm Deletion",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Delete",className:"btn-danger",onClick:j=>{p.delete("userTypes",E),z("User Type deleted","success"),j(),l()}}]})})})}else if(a==="materials")i(m);else if(a==="tax"){let S=function(x){return Array.from(x.querySelectorAll(".labor-rate-card")).map(f=>{const E=f.dataset.id,T=f.querySelector(".rate-name").value,A=parseFloat(f.querySelector(".rate-val").value)||0,I=parseFloat(f.querySelector(".rate-multiplier").value)||1,j=f.querySelector(".rate-desc").value,U=parseFloat(f.querySelector(".rate-min-fee").value)||0,P=f.querySelector(".btn-set-default")===null,O=Array.from(f.querySelectorAll(".rate-day:checked")).map(H=>H.dataset.day);return{id:E,name:T,rate:A,description:j,overtimeMultiplier:I,minCallOutFee:U,applicableDays:O,isDefault:P}})};var $=S;const h=p.getSettings();m.innerHTML=`
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
                  <input class="form-input" id="global-markup" type="number" value="${h.markupPercent||20}" style="width:100px" /> <span class="text-secondary">%</span>
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
                  <option value="1" ${(h.laborRounding||15)===1?"selected":""}>None (Precise)</option>
                  <option value="5" ${(h.laborRounding||15)===5?"selected":""}>Nearest 5 Minutes</option>
                  <option value="15" ${(h.laborRounding||15)===15?"selected":""}>Nearest 15 Minutes</option>
                  <option value="30" ${(h.laborRounding||15)===30?"selected":""}>Nearest 30 Minutes</option>
                  <option value="60" ${(h.laborRounding||15)===60?"selected":""}>Nearest Hour</option>
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
              ${h.laborRates.map(x=>{const f=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],E={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},T=x.applicableDays||["Mon","Tue","Wed","Thu","Fri"];return`
                <div class="labor-rate-card" data-id="${x.id}" style="border:2px solid ${x.isDefault?"var(--color-primary)":"var(--border-color)"}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${x.isDefault?"var(--color-primary-light)":"var(--bg-color)"}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${x.isDefault?"var(--color-primary)":"var(--text-tertiary)"}; font-size:20px">sell</span>
                      <input class="rate-name" value="${x.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${x.isDefault?'<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>':""}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${x.isDefault?"":`<button class="btn btn-ghost btn-sm btn-set-default" data-id="${x.id}" title="Set as default rate">Set Default</button>`}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${x.id}" title="Delete profile" ${x.isDefault?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
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
                        <input class="form-input rate-val" type="number" value="${x.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Overtime Multiplier</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <input class="form-input rate-multiplier" type="number" value="${(x.overtimeMultiplier||1).toFixed(1)}" min="1" max="5" step="0.5" style="width:100px" />
                        <span class="text-secondary">× base pay</span>
                      </div>
                    </div>
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${(x.minCallOutFee||0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Description</label>
                      <input class="form-input rate-desc" value="${x.description||""}" placeholder="When is this rate used?" />
                    </div>
                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${f.map(A=>`
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${A}" ${T.includes(A)?"checked":""} style="display:none" />
                            <span class="rate-day-pill" data-day="${A}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${T.includes(A)?"var(--color-primary)":"var(--border-color)"};background:${T.includes(A)?"var(--color-primary-light)":"transparent"};color:${T.includes(A)?"var(--color-primary)":"var(--text-secondary)"}">
                              ${E[A]}
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
              ${["Service","Project","Maintenance","Quote"].map(x=>`
                <div class="form-group" style="margin:0">
                  <label class="form-label">${x} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${x}">
                    <option value="">-- Use Default --</option>
                    ${h.laborRates.map(f=>{var E;return`<option value="${f.id}" ${((E=h.rateMappings)==null?void 0:E[x])===f.id?"selected":""}>${f.name}</option>`}).join("")}
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `,m.addEventListener("click",x=>{const f=x.target.closest(".rate-day-pill");if(f){const E=f.dataset.day,A=f.closest(".labor-rate-card").querySelector(`.rate-day[data-day="${E}"]`);A.checked=!A.checked;const I=A.checked;f.style.border=`1px solid ${I?"var(--color-primary)":"var(--border-color)"}`,f.style.background=I?"var(--color-primary-light)":"transparent",f.style.color=I?"var(--color-primary)":"var(--text-secondary)"}}),m.querySelector("#add-rate-btn").addEventListener("click",()=>{const x="rate_"+Date.now().toString(36),f=m.querySelector("#labor-rates-container"),E=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],T={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},A=document.createElement("div");A.className="labor-rate-card",A.dataset.id=x,A.style.cssText="border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);",A.innerHTML=`
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${x}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${x}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${E.map(I=>`
                  <label style="cursor:pointer">
                    <input type="checkbox" class="rate-day" data-day="${I}" ${["Mon","Tue","Wed","Thu","Fri"].includes(I)?"checked":""} style="display:none" />
                    <span class="rate-day-pill" data-day="${I}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${["Mon","Tue","Wed","Thu","Fri"].includes(I)?"var(--color-primary)":"var(--border-color)"};background:${["Mon","Tue","Wed","Thu","Fri"].includes(I)?"var(--color-primary-light)":"transparent"};color:${["Mon","Tue","Wed","Thu","Fri"].includes(I)?"var(--color-primary)":"var(--text-secondary)"}">
                      ${T[I]}
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        `,f.appendChild(A)}),m.addEventListener("click",x=>{if(x.target.closest(".remove-rate-btn")){const f=x.target.closest(".labor-rate-card");f&&f.remove()}}),m.addEventListener("click",x=>{if(x.target.closest(".btn-set-default")){const f=x.target.closest(".btn-set-default").dataset.id,E=S(m);E.forEach(A=>A.isDefault=A.id===f);const T=m.querySelector("#labor-rates-container");T.innerHTML=E.map(A=>{m.querySelectorAll(".labor-rate-card").forEach(I=>{const j=I.dataset.id===f;I.style.border=`2px solid ${j?"var(--color-primary)":"var(--border-color)"}`;const U=I.querySelector('div[style*="padding:12px 16px"]');U&&(U.style.background=j?"var(--color-primary-light)":"var(--bg-color)");let P=I.querySelector(".badge");if(j&&!P){const H=I.querySelector('div[style*="flex:1"]'),D=document.createElement("span");D.className="badge",D.style.cssText="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600",D.textContent="DEFAULT",H.appendChild(D)}else!j&&P&&P.remove();let O=I.querySelector(".btn-set-default");if(j&&O)O.remove();else if(!j&&!O){const H=I.querySelector('div[style*="gap:8px"]'),D=document.createElement("button");D.className="btn btn-ghost btn-sm btn-set-default",D.dataset.id=I.dataset.id,D.textContent="Set Default",H.prepend(D)}})}),z("Default rate updated in view. Click Save to apply.","info")}}),m.querySelector("#save-tax-settings").addEventListener("click",()=>{const x=parseFloat(m.querySelector("#global-markup").value)||0,f=parseInt(m.querySelector("#labor-rounding").value)||15,E=S(m),T=p.getSettings();T.markupPercent=x,T.laborRounding=f,T.laborRates=E,T.rateMappings={},m.querySelectorAll(".rate-mapping").forEach(A=>{A.value&&(T.rateMappings[A.dataset.type]=A.value)}),p.saveSettings(T),z("Financial and Rate settings saved","success"),l()})}else if(a==="assets"){p.getSettings();const h=p.getAll("assets").filter(S=>S.category==="Business");m.innerHTML=`
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
                ${h.map(S=>`
                  <tr>
                    <td class="font-medium">${g(S.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${S.id}" value="${S.recoveryRate||0}" step="0.5" style="width:100px; height:32px" />
                      </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `).join("")}
                ${h.length===0?'<tr><td colspan="3" class="text-center text-tertiary" style="padding:24px">No business assets found. Add assets in the main Assets module.</td></tr>':""}
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="btn-save-asset-settings">Save Asset Recovery Rates</button>
          </div>
        </div>
      `,m.querySelector("#btn-save-asset-settings").addEventListener("click",()=>{m.querySelectorAll(".asset-rate-input").forEach(S=>{const x=S.dataset.id,f=parseFloat(S.value)||0;p.update("assets",x,{recoveryRate:f})}),z("Asset recovery rates updated across the system","success")})}else a==="system"&&(m.innerHTML=`
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
      `,(w=m.querySelector("#btn-reset-data"))==null||w.addEventListener("click",()=>{p.clearAll(),z("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(q=m.querySelector("#btn-clear-data"))==null||q.addEventListener("click",()=>{p.clearAll(),z("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)}))}function o(m=null){let $=m?p.getById("userTypes",m):{name:"",description:""};const v=document.createElement("div");v.innerHTML=`
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
          <input class="form-input" id="ut-name" value="${$.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${$.description}" />
        </div>
    `;const w=v.querySelector("#ut-template"),q=v.querySelector("#ut-custom-edit-perms");w&&q&&(w.addEventListener("change",h=>{h.target.value==="Custom"?q.style.display="flex":q.style.display="none"}),q.addEventListener("click",()=>{var E;const h=v.querySelector("#ut-name").value,S=v.querySelector("#ut-desc").value;if(!h){z("Please enter a User Type Name first","error");return}const x=He(()=>!1),f=p.create("userTypes",{name:h,description:S,permissions:x});(E=document.getElementById("modal-close-btn"))==null||E.click(),d(f.id)})),Se({title:m?"Edit User Type":"Add User Type",content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:"Save",className:"btn-primary",onClick:h=>{var E;const S=document.getElementById("ut-name").value,x=document.getElementById("ut-desc").value,f=(E=document.getElementById("ut-template"))==null?void 0:E.value;if(!S){z("Name required","error");return}if(m)p.update("userTypes",m,{name:S,description:x});else{let T=[];f==="Admin"?T=He(()=>!0):f==="Manager"?T=He((A,I)=>A==="Settings"?["view","edit_company"].includes(I):!0):f==="Technician"?T=He((A,I)=>A==="Dashboard"?I==="view":A==="Jobs"?["view","manage_tasks","book_time"].includes(I):A==="Timesheets"?["view_own","create"].includes(I):A==="Schedule"?["view_own"].includes(I):!1):f==="Office Staff"?T=He((A,I)=>A==="Settings"?!1:A==="Reports"?I==="view":!(["Invoices","Purchase Orders"].includes(A)&&I==="delete")):T=He(()=>!1),p.create("userTypes",{name:S,description:x,permissions:T})}z("User Type saved","success"),l(),h()}}]})}function d(m){const $=p.getById("userTypes",m);if(!$)return;const v=$.permissions||[],w={};v.forEach(S=>{w[S.module]=S});const q=document.createElement("div"),h=Object.entries(tt).map(([S,x])=>{const f=w[S]||{},E=x.every(({key:A})=>f[A]),T=x.map(({key:A,label:I})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${S}" data-key="${A}" ${f[A]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${I}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${S}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${S}" ${E?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${T}
          </div>
        </div>
      `}).join("");q.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${h}
      </div>
    `,q.querySelector("#btn-select-all-perms").addEventListener("click",()=>{q.querySelectorAll(".perm-chk, .module-select-all").forEach(S=>S.checked=!0)}),q.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{q.querySelectorAll(".perm-chk, .module-select-all").forEach(S=>S.checked=!1)}),q.querySelectorAll(".module-select-all").forEach(S=>{S.addEventListener("change",x=>{const f=x.target.dataset.module;q.querySelectorAll(`.perm-chk[data-module="${f}"]`).forEach(E=>E.checked=x.target.checked)})}),q.querySelectorAll(".perm-chk").forEach(S=>{S.addEventListener("change",()=>{const x=S.dataset.module,E=(tt[x]||[]).every(({key:A})=>{const I=q.querySelector(`.perm-chk[data-module="${x}"][data-key="${A}"]`);return I&&I.checked}),T=q.querySelector(`.module-select-all[data-module="${x}"]`);T&&(T.checked=E)})}),Se({title:`Edit Permissions: ${$.name}`,content:q,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Save Permissions",className:"btn-primary",onClick:S=>{const x=Object.entries(tt).map(([f,E])=>{const T={module:f};return E.forEach(({key:A})=>{const I=q.querySelector(`.perm-chk[data-module="${f}"][data-key="${A}"]`);T[A]=I?I.checked:!1}),T});p.update("userTypes",m,{permissions:x}),z("Permissions updated successfully","success"),l(),S()}}]})}function r(m=null){let $=m?p.getById("technicians",m):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const v=p.getAll("userTypes"),w=document.createElement("div");w.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${$.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${$.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${$.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${v.map(S=>`
              <option value="${S.id}" ${$.userTypeId===S.id?"selected":""}>${S.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary);font-size:15px">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${$.payRate||""}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary" style="font-size:var(--font-size-sm)">/hr — used in job cost &amp; P&amp;L calculations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(S=>`
            <div class="color-swatch" data-color="${S}" style="width:28px; height:28px; border-radius:50%; background:${S}; cursor:pointer; border:2px solid ${$.color.toUpperCase()===S.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${$.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const q=w.querySelector("#u-color"),h=w.querySelectorAll(".color-swatch");h.forEach(S=>{S.addEventListener("click",()=>{q.value=S.dataset.color,h.forEach(x=>x.style.borderColor="transparent"),S.style.borderColor="var(--text-primary)"})}),q.addEventListener("input",()=>{h.forEach(S=>S.style.borderColor="transparent")}),Se({title:m?"Edit User":"Add User",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Save",className:"btn-primary",onClick:S=>{const x=document.getElementById("u-name").value,f=document.getElementById("u-email").value,E=document.getElementById("u-role").value,T=document.getElementById("u-type").value,A=document.getElementById("u-color").value,I=parseFloat(document.getElementById("u-payrate").value)||null;if(!x){z("Name required","error");return}m?p.update("technicians",m,{name:x,email:f,role:E,userTypeId:T,color:A,payRate:I}):p.create("technicians",{name:x,email:f,role:E,userTypeId:T,color:A,payRate:I}),z("User saved","success"),l(),S()}}]})}document.addEventListener("save-settings",()=>z("Settings saved","success"));function b(m){const $=p.getAll("taskTemplates");m.innerHTML=`
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
              ${$.length?$.map(w=>`
                <tr>
                  <td class="font-medium">${g(w.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${g(w.description||"—")}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(w.tags||[]).map(q=>`<span class="badge badge-neutral" style="font-size:10px">${g(q)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-template" data-id="${w.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-template" data-id="${w.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="4" class="text-center text-tertiary" style="padding:32px">No templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-template").addEventListener("click",()=>{v()}),m.querySelectorAll(".btn-delete-template").forEach(w=>{w.addEventListener("click",()=>{confirm("Delete this template?")&&(p.delete("taskTemplates",w.dataset.id),l())})}),m.querySelectorAll(".btn-edit-template").forEach(w=>{w.addEventListener("click",()=>{v(w.dataset.id)})});function v(w=null){const q=w?p.getById("taskTemplates",w):{name:"",description:"",tags:[],tasks:[]},h=document.createElement("div");h.style.maxHeight="80vh",h.style.overflowY="auto",h.style.padding="4px";let S=JSON.parse(JSON.stringify(q.tasks||q.phases||[])).map(j=>{!j.subTasks&&j.subPhases&&(j.subTasks=j.subPhases,delete j.subPhases),j.tasks&&!j.subTasks&&(j.subTasks=j.tasks.map(P=>({id:P.id||p.generateId(),name:P.name||"",estimatedHours:P.estimatedHours||0,people:P.people||1,status:"Not Started",progress:0})),delete j.tasks);function U(P){P.subPhases&&!P.subTasks&&(P.subTasks=P.subPhases,delete P.subPhases),P.subTasks||(P.subTasks=[]),P.subTasks.forEach(U)}return U(j),j}),x=S.length>0?[0]:[],f=[],E=!1;function T(j,U){if(!U||U.length===0)return null;let P=j[U[0]];if(!P)return null;for(let O=1;O<U.length;O++)if(!P.subTasks||(P=P.subTasks[U[O]],!P))return null;return P}function A(j){return!j.subTasks||j.subTasks.length===0?(parseFloat(j.estimatedHours)||0)*(parseInt(j.people)||1):j.subTasks.reduce((U,P)=>U+A(P),0)}const I=()=>{var j,U,P,O,H,D;h.innerHTML=`
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${g(q.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${g(q.description||"")}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(q.tags||[]).join(", ")}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(()=>{const L=f.length>0?T(S,f):null,N=L?L.subTasks||[]:S,C=L?g(L.name):"Main Tasks";return`
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${f.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${C}">${C}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${N.map((k,_)=>{const M=[...f,_],V=M.join("-")===x.join("-");return`
                        <div class="tmpl-task-list-item" data-path="${M.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${V?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${V?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${g(k.name)}">${g(k.name)}</span>
                          ${k.subTasks&&k.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${M.join("-")}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>`:""}
                        </div>
                      `}).join("")}
                    ${N.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${x.length>0?(()=>{const L=x,N=T(S,L);if(!N)return'<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';const C=N.subTasks&&N.subTasks.length>0;return`
                  ${E?`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${L.join("-")}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${L.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <label class="form-label" style="font-size:11px">Name *</label>
                      <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${g(N.name)}" style="font-size:13px" />
                    </div>
                    ${C?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:13px; font-weight:500">${A(N)} hrs</div>
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
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${g(N.description||"")}</textarea>
                    </div>
                  `:`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${g(N.name)}">${g(N.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${L.length<3?`<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${L.join("-")}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>`:""}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${L.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${g(N.name)}</div>
                    </div>
                    ${C?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${A(N)} hrs</div>
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
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${g(N.description||"No description provided.")}</div>
                    </div>
                  `}
                `})():'<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `,(j=h.querySelector(".btn-view-back"))==null||j.addEventListener("click",()=>{f.pop(),I()}),h.querySelectorAll(".btn-drill-down-tmpl").forEach(L=>{L.addEventListener("click",N=>{N.stopPropagation(),f=L.dataset.path.split("-").map(Number),x=[...f],I()})}),h.querySelectorAll(".tmpl-task-list-item").forEach(L=>{L.addEventListener("click",N=>{N.target.closest(".btn-drill-down-tmpl")||(x=L.dataset.path.split("-").map(Number),E=!1,I())})}),(U=h.querySelector(".btn-add-node"))==null||U.addEventListener("click",()=>{const L={id:p.generateId(),name:"New Task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]};if(f.length===0)S.push(L),x=[S.length-1];else{const N=T(S,f);N.subTasks||(N.subTasks=[]),N.subTasks.push(L),x=[...f,N.subTasks.length-1]}E=!0,I()}),(P=h.querySelector(".btn-add-child-tmpl"))==null||P.addEventListener("click",L=>{const N=L.currentTarget.dataset.path.split("-").map(Number),C=T(S,N);C.subTasks||(C.subTasks=[]),C.subTasks.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]}),x=[...N,C.subTasks.length-1],E=!0,I()}),(O=h.querySelector(".btn-edit-info-tmpl"))==null||O.addEventListener("click",()=>{E=!0,I()}),(H=h.querySelector(".btn-done-info-tmpl"))==null||H.addEventListener("click",()=>{E=!1,I()}),h.querySelectorAll(".tmpl-detail-input").forEach(L=>{L.addEventListener("input",N=>{const C=T(S,x);if(!C)return;const k=N.target.dataset.field;k==="estimatedHours"?C[k]=parseFloat(N.target.value)||0:k==="people"?C[k]=parseInt(N.target.value)||1:C[k]=N.target.value})}),h.querySelectorAll(".btn-remove-task-tmpl-item").forEach(L=>{L.addEventListener("click",N=>{const C=L.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this item and all its sub-tasks?")){if(C.length===1)S.splice(C[0],1);else{const k=C.slice(0,-1),_=T(S,k);_&&_.subTasks&&_.subTasks.splice(C[C.length-1],1)}x=C.slice(0,-1),E=!1,I()}})}),(D=h.querySelector(".btn-duplicate-task-tmpl"))==null||D.addEventListener("click",L=>{const N=L.currentTarget.dataset.path.split("-").map(Number),C=T(S,N);if(!C)return;function k(M,V){return{...M,id:p.generateId(),name:M.name+(V?" (Copy)":""),status:"Not Started",progress:0,subTasks:M.subTasks?M.subTasks.map(ne=>k(ne,!1)):[]}}const _=k(C,!0);if(N.length===1)S.splice(N[0]+1,0,_),x=[N[0]+1];else{const M=N.slice(0,-1);T(S,M).subTasks.splice(N[N.length-1]+1,0,_),x=[...M,N[N.length-1]+1]}E=!1,I()})};I(),Se({title:w?"Edit Tasklist Template":"Create Tasklist Template",content:h,size:"modal-lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Save Template",className:"btn-primary",onClick:j=>{const U=h.querySelector("#edit-tmpl-name").value,P=h.querySelector("#edit-tmpl-desc").value,O=h.querySelector("#edit-tmpl-tags").value.split(",").map(D=>D.trim()).filter(Boolean);if(!U){z("Name required","error");return}const H={name:U,description:P,tags:O,tasks:S,phases:S};w?p.update("taskTemplates",w,H):p.create("taskTemplates",H),z("Tasklist template saved","success"),j(),l()}}]})}}function y(m){const $=p.getAll("quoteTemplates");m.innerHTML=`
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
              ${$.length?$.map(v=>`
                <tr>
                  <td class="font-medium">${g(v.name)}</td>
                  <td class="text-secondary">${g(v.description||"—")}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-quote-template" data-id="${v.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-quote-template" data-id="${v.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="3" class="text-center text-tertiary" style="padding:32px">No quote templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-quote-template").addEventListener("click",()=>{B.navigate("/settings/quote-templates/new")}),m.querySelectorAll(".btn-delete-quote-template").forEach(v=>{v.addEventListener("click",()=>{confirm("Delete this template?")&&(p.delete("quoteTemplates",v.dataset.id),l())})}),m.querySelectorAll(".btn-edit-quote-template").forEach(v=>{v.addEventListener("click",()=>{B.navigate(`/settings/quote-templates/${v.dataset.id}/edit`)})})}function i(m){const $=p.getSettings(),v=$.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]},w=$.materialCategories||["General"];m.innerHTML=`
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${v.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${v.minMarkupAmount}" step="0.50" style="width:100px" />
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
                  <input type="checkbox" id="mat-use-tiers" ${v.useTiers?"checked":""} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${v.useTiers?"":"opacity:0.5;pointer-events:none"}">
                <table class="data-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="tier-rows">
                    ${(v.tiers||[]).map((h,S)=>`
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${S===0?"Up to":"From previous up to"} 
                            <div style="display:flex;align-items:center;gap:4px">
                              <span class="text-tertiary">$</span>
                              <input type="number" class="form-input tier-upto" value="${h.upTo||""}" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" class="form-input tier-percent" value="${h.percent}" style="height:28px;padding:2px 8px;width:80px" />
                            <span class="text-tertiary">%</span>
                          </div>
                        </td>
                        <td>
                          <button class="btn btn-icon btn-sm text-danger btn-remove-tier" data-idx="${S}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
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
              ${w.map(h=>`
                <div class="badge badge-neutral" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${h}
                  <span class="material-icons-outlined btn-remove-cat" data-name="${h}" style="font-size:14px;cursor:pointer">close</span>
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
    `;const q=()=>{const h=parseFloat(m.querySelector("#mat-default-markup").value),S=parseFloat(m.querySelector("#mat-min-markup").value),x=m.querySelector("#mat-use-tiers").checked,f=Array.from(m.querySelectorAll("#tier-rows tr")).map(A=>({upTo:parseFloat(A.querySelector(".tier-upto").value)||null,percent:parseFloat(A.querySelector(".tier-percent").value)||0})).sort((A,I)=>A.upTo===null?1:I.upTo===null?-1:A.upTo-I.upTo),E=Array.from(m.querySelectorAll(".btn-remove-cat")).map(A=>A.dataset.name),T={...$,materialMarkup:{defaultPercent:h,minMarkupAmount:S,useTiers:x,tiers:f},materialCategories:E};p.saveSettings(T),z("Material settings saved","success")};m.querySelector("#mat-use-tiers").addEventListener("change",h=>{m.querySelector("#tiers-container").style.opacity=h.target.checked?"1":"0.5",m.querySelector("#tiers-container").style.pointerEvents=h.target.checked?"auto":"none"}),m.querySelector("#btn-add-tier").addEventListener("click",()=>{const h=document.createElement("tr");h.innerHTML=`
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
      `,m.querySelector("#tier-rows").appendChild(h),h.querySelector(".btn-remove-tier").addEventListener("click",()=>h.remove())}),m.querySelectorAll(".btn-remove-tier").forEach(h=>{h.addEventListener("click",()=>h.closest("tr").remove())}),m.querySelector("#btn-add-category").addEventListener("click",()=>{const h=prompt("Enter category name:");if(h){const S=document.createElement("div");S.className="badge badge-neutral",S.style.cssText="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px",S.innerHTML=`
          ${h}
          <span class="material-icons-outlined btn-remove-cat" data-name="${h}" style="font-size:14px;cursor:pointer">close</span>
        `,m.querySelector("#categories-container").insertBefore(S,m.querySelector("#btn-add-category")),S.querySelector(".btn-remove-cat").addEventListener("click",()=>S.remove())}}),m.querySelectorAll(".btn-remove-cat").forEach(h=>{h.addEventListener("click",()=>h.closest(".badge").remove())}),m.querySelector("#btn-save-materials").addEventListener("click",q)}function u(m){m.innerHTML=`
      <div class="card" style="margin-bottom:var(--space-md)">
        <div class="card-body" style="padding: 8px; background:var(--bg-color); border-radius: 8px; display:flex; gap:8px">
          <button class="btn btn-sm" id="subtab-tasklists" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${c==="tasklists"?"var(--color-primary)":"transparent"}; color:${c==="tasklists"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">playlist_add_check</span> Tasklist Templates
          </button>
          <button class="btn btn-sm" id="subtab-forms" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${c==="forms"?"var(--color-primary)":"transparent"}; color:${c==="forms"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">assignment</span> Form Templates
          </button>
          <button class="btn btn-sm" id="subtab-quotes" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${c==="quotes"?"var(--color-primary)":"transparent"}; color:${c==="quotes"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">article</span> Quote Templates
          </button>
        </div>
      </div>
      <div id="templates-subcontent" style="margin-top:var(--space-md)"></div>
    `;const $=m.querySelector("#subtab-tasklists"),v=m.querySelector("#subtab-forms"),w=m.querySelector("#subtab-quotes");c==="tasklists"&&($.style.color="white"),c==="forms"&&(v.style.color="white"),c==="quotes"&&(w.style.color="white");const q=m.querySelector("#templates-subcontent");c==="tasklists"?b(q):c==="forms"?ls(q):c==="quotes"&&y(q),$.addEventListener("click",()=>{c="tasklists",u(m)}),v.addEventListener("click",()=>{c="forms",u(m)}),w.addEventListener("click",()=>{c="quotes",u(m)})}n()}function ls(e){const s=p.getAll("formTemplates");e.innerHTML=`
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
                  <td class="font-medium">${g(t.name)}</td>
                  <td style="color:var(--text-secondary); font-size:13px">${g(t.description||"—")}</td>
                  <td><span class="badge badge-neutral">${(t.sections||[]).reduce((a,c)=>a+c.fields.length,0)} Fields</span></td>
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
    `,e.querySelector("#btn-add-form-template").addEventListener("click",()=>B.navigate("/settings/forms/new")),e.querySelectorAll(".edit-form-template").forEach(t=>{t.addEventListener("click",()=>B.navigate(`/settings/forms/${t.dataset.id}/edit`))}),e.querySelectorAll(".delete-form-template").forEach(t=>{t.addEventListener("click",()=>{if(confirm("Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.")){const a=t.dataset.id,c=p.getAll("formTemplates").filter(n=>n.id!==a);p.save("formTemplates",c),ls(e)}})})}function rs(e,{id:s}){const t=s&&s!=="new",a=p.getAll("formTemplates"),c=t?a.find(r=>r.id===s):null;if(t&&!c){e.innerHTML='<div class="empty-state"><h3>Template not found</h3></div>';return}let n=c?JSON.parse(JSON.stringify(c.sections||[])):[{id:"sec_"+Math.random().toString(36).substr(2,5),title:"General Info",width:"full",fields:[]}];n.forEach(r=>{r.width||(r.width="full"),(r.fields||[]).forEach(b=>{b.width||(b.width="full")})});function l(){e.innerHTML=`
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
                <input class="form-input" id="form-name" value="${g((c==null?void 0:c.name)||"")}" placeholder="e.g. Daily Safety Audit" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" id="form-desc" value="${g((c==null?void 0:c.description)||"")}" placeholder="Optional description..." />
              </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:20px">
              <h4 style="margin:0">Form Structure</h4>
              <div style="display:flex; gap:8px">
                <button class="btn btn-secondary btn-sm" id="btn-add-spacer-section">
                  <span class="material-icons-outlined" style="font-size:16px">space_bar</span> Add Spacer Block
                </button>
                <button class="btn btn-primary btn-sm" id="btn-add-section">
                  <span class="material-icons-outlined" style="font-size:16px">library_add</span> Add Section
                </button>
              </div>
            </div>

            <div id="sections-list" style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; padding-bottom:40px">
              ${n.map((r,b)=>{const y=r.width==="half";return r.isSpacer?`
                    <div class="section-card" data-section-index="${b}" style="grid-column: span ${y?"1":"2"}; border:2px dashed var(--border-color); border-radius:12px; background:transparent; display:flex; align-items:center; justify-content:space-between; padding:16px; min-height:100px">
                      <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-up" data-section-index="${b}" ${b===0?"disabled":""}><span class="material-icons-outlined" style="font-size:18px">${y?"arrow_back":"keyboard_arrow_up"}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-down" data-section-index="${b}" ${b===n.length-1?"disabled":""}><span class="material-icons-outlined" style="font-size:18px">${y?"arrow_forward":"keyboard_arrow_down"}</span></button>
                      </div>
                      <div style="color:var(--text-tertiary); font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:13px; display:flex; align-items:center; gap:8px">
                        <span class="material-icons-outlined">space_bar</span> Empty Layout Spacer
                      </div>
                      <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-icon btn-sm toggle-sec-width" data-section-index="${b}" title="Toggle Half/Full Width"><span class="material-icons-outlined" style="font-size:18px">${y?"width_normal":"width_full"}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${b}" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span></button>
                      </div>
                    </div>
                  `:`
                <div class="section-card" data-section-index="${b}" style="grid-column: span ${y?"1":"2"}; border:1px solid var(--border-color); border-radius:12px; background:var(--bg-color); overflow:hidden; box-shadow:var(--shadow-sm)">
                  <div style="padding:16px 20px; background:var(--content-bg); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px">
                      <div style="display:flex; flex-direction:${y?"row":"column"}; gap:2px">
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-up" data-section-index="${b}" ${b===0?"disabled":""} style="height:24px; width:24px; padding:0"><span class="material-icons-outlined" style="font-size:18px">${y?"arrow_back":"keyboard_arrow_up"}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-down" data-section-index="${b}" ${b===n.length-1?"disabled":""} style="height:24px; width:24px; padding:0"><span class="material-icons-outlined" style="font-size:18px">${y?"arrow_forward":"keyboard_arrow_down"}</span></button>
                      </div>
                      <input class="form-input section-title" value="${g(r.title)}" placeholder="Section Title..." style="font-weight:600; font-size:16px; background:transparent; border:none; padding:4px; margin:0; flex:1" />
                    </div>
                    <div style="display:flex; gap:8px; align-items:center">
                      <button class="btn btn-ghost btn-sm btn-icon toggle-sec-width" data-section-index="${b}" title="Toggle Half/Full Width">
                        <span class="material-icons-outlined" style="font-size:18px">${y?"width_normal":"width_full"}</span>
                      </button>
                      <button class="btn btn-secondary btn-sm btn-add-field-to-sec" data-section-index="${b}">
                        <span class="material-icons-outlined" style="font-size:16px">add</span> Add Field
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${b}" style="color:var(--color-danger)">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="fields-container" style="padding:20px; display:grid; grid-template-columns: 1fr 1fr; gap:16px">
                    ${r.fields.map((i,u)=>{var $;const m=i.width==="half";return`
                      <div class="field-row" data-field-index="${u}" style="grid-column: span ${m?"1":"2"}; display:flex; flex-direction:column; gap:12px; background:${i.type==="spacer"?"transparent":"white"}; padding:16px; border-radius:8px; border:${i.type==="spacer"?"2px dashed var(--border-color)":"1px solid var(--border-color)"}; position:relative; min-height:${i.type==="spacer"?"80px":"auto"}">
                        
                        ${i.type==="spacer"?`
                          <div style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-weight:600; text-transform:uppercase; font-size:12px; letter-spacing:1px; gap:8px">
                            <span class="material-icons-outlined">space_bar</span> Empty Spacer
                          </div>
                        `:`
                          <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap">
                            <div class="form-group" style="margin:0; flex:2; min-width:150px">
                              <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">${i.type==="info"?"Instruction / Info Text":"Field Label"}</label>
                              ${i.type==="info"?`<textarea class="form-textarea field-label" placeholder="Enter instructional or informative text for the user..." style="min-height:50px">${g(i.label)}</textarea>`:`<input class="form-input field-label" value="${g(i.label)}" placeholder="Enter question or label..." />`}
                            </div>
                            <div class="form-group" style="margin:0; flex:1; min-width:120px">
                              <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">Type</label>
                              <select class="form-select field-type">
                                <option value="text" ${i.type==="text"?"selected":""}>Text Input</option>
                                <option value="textarea" ${i.type==="textarea"?"selected":""}>Long Text</option>
                                <option value="checkbox" ${i.type==="checkbox"?"selected":""}>Checkbox / Yes-No</option>
                                <option value="select" ${i.type==="select"?"selected":""}>Dropdown Menu</option>
                                <option value="date" ${i.type==="date"?"selected":""}>Date Picker</option>
                                <option value="signature" ${i.type==="signature"?"selected":""}>Signature Field</option>
                                <option value="info" ${i.type==="info"?"selected":""}>Information Box</option>
                                <option value="spacer" ${i.type==="spacer"?"selected":""}>Empty Spacer</option>
                              </select>
                            </div>
                          </div>
                        `}

                        ${i.type==="spacer"?`
                          <select class="form-select field-type" style="display:none"><option value="spacer" selected></option></select>
                        `:""}
                        
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:12px">
                          <div style="display:flex; align-items:center; gap:12px">
                            ${i.type!=="info"&&i.type!=="spacer"?`
                              <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer">
                                <input type="checkbox" class="field-required" ${i.required?"checked":""} style="width:16px; height:16px; margin:0" /> Required
                              </label>
                            `:'<input type="checkbox" class="field-required" style="display:none" />'}
                          </div>
                          <div style="display:flex; gap:4px; align-items:center">
                            <button class="btn btn-ghost btn-icon btn-sm move-field-up" data-section-index="${b}" data-field-index="${u}" ${u===0?"disabled":""} title="Move Left/Up"><span class="material-icons-outlined" style="font-size:18px">${m?"arrow_back":"arrow_upward"}</span></button>
                            <button class="btn btn-ghost btn-icon btn-sm move-field-down" data-section-index="${b}" data-field-index="${u}" ${u===r.fields.length-1?"disabled":""} title="Move Right/Down"><span class="material-icons-outlined" style="font-size:18px">${m?"arrow_forward":"arrow_downward"}</span></button>
                            <div style="width:1px; height:16px; background:var(--border-color); margin:0 4px"></div>
                            <button class="btn btn-ghost btn-icon btn-sm toggle-field-width" data-section-index="${b}" data-field-index="${u}" title="Toggle Half/Full Width"><span class="material-icons-outlined" style="font-size:18px">${m?"width_normal":"width_full"}</span></button>
                            <button class="btn btn-ghost btn-icon btn-sm remove-field" data-section-index="${b}" data-field-index="${u}" style="color:var(--color-danger)" title="Remove Field"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                          </div>
                        </div>
                        
                        ${i.type==="select"?`
                          <div style="margin-top:4px; padding:12px; background:var(--bg-color); border-radius:4px">
                            <label class="form-label" style="font-size:11px">Dropdown Options (comma separated)</label>
                            <input class="form-input field-options" style="font-size:13px" value="${g((($=i.options)==null?void 0:$.join(", "))||"")}" placeholder="e.g. Option 1, Option 2, Option 3" />
                          </div>
                        `:""}
                      </div>
                    `}).join("")}
                    ${r.fields.length?"":`
                      <div style="grid-column: 1 / -1; text-align:center; color:var(--text-tertiary); padding:30px; border:2px dashed var(--border-color); border-radius:8px">
                        <span class="material-icons-outlined" style="font-size:32px; display:block; margin-bottom:8px">post_add</span>
                        No fields in this section yet. Click "Add Field" to start.
                      </div>
                    `}
                  </div>
                </div>
              `}).join("")}
            </div>
          </div>
        </div>
      </div>
    `,d()}function o(){e.querySelectorAll(".section-card").forEach(r=>{const b=parseInt(r.dataset.sectionIndex);if(n[b].isSpacer)return;const y=r.querySelector(".section-title");y&&(n[b].title=y.value),r.querySelectorAll(".field-row").forEach(i=>{var q;const u=parseInt(i.dataset.fieldIndex),m=n[b].fields[u],$=i.querySelector(".field-type");$&&(m.type=$.value);const v=i.querySelector(".field-label");v&&(m.label=v.value);const w=i.querySelector(".field-required");if(w&&(m.required=w.checked),m.type==="select"){const h=((q=i.querySelector(".field-options"))==null?void 0:q.value)||"";m.options=h.split(",").map(S=>S.trim()).filter(Boolean)}})})}function d(){e.querySelector("#btn-back").addEventListener("click",()=>B.navigate("/settings?tab=forms")),e.querySelector("#btn-cancel").addEventListener("click",()=>B.navigate("/settings?tab=forms")),e.querySelector("#btn-save").addEventListener("click",()=>{o();const r=e.querySelector("#form-name").value.trim(),b=e.querySelector("#form-desc").value.trim();if(!r){z("Form name is required","error"),e.querySelector("#form-name").focus();return}if(n.reduce((m,$)=>m+$.fields.length,0)===0){z("Please add at least one field to the form","error");return}const i={id:t?s:"fmt_"+Math.random().toString(36).substr(2,9),name:r,description:b,sections:n.map(m=>({...m}))},u=p.getAll("formTemplates");if(t){const m=u.findIndex($=>$.id===s);u[m]=i}else u.push(i);p.save("formTemplates",u),z(`Form template "${r}" saved`,"success"),B.navigate("/settings?tab=forms")}),e.querySelector("#btn-add-section").addEventListener("click",()=>{o(),n.push({id:"sec_"+Math.random().toString(36).substr(2,5),title:"New Section",width:"full",fields:[]}),l()}),e.querySelector("#btn-add-spacer-section").addEventListener("click",()=>{o(),n.push({id:"sec_"+Math.random().toString(36).substr(2,5),title:"",isSpacer:!0,width:"half",fields:[]}),l()}),e.querySelectorAll(".btn-add-field-to-sec").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex);n[b].fields.push({id:"f_"+Math.random().toString(36).substr(2,5),type:"text",label:"",required:!1}),l()})}),e.querySelectorAll(".remove-section").forEach(r=>{r.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this entire section and all its fields?")){const b=parseInt(r.dataset.sectionIndex);n.splice(b,1),l()}})}),e.querySelectorAll(".remove-field").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex),y=parseInt(r.dataset.fieldIndex);n[b].fields.splice(y,1),l()})}),e.querySelectorAll(".toggle-sec-width").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex);n[b].width=n[b].width==="half"?"full":"half",l()})}),e.querySelectorAll(".toggle-field-width").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex),y=parseInt(r.dataset.fieldIndex);n[b].fields[y].width=n[b].fields[y].width==="half"?"full":"half",l()})}),e.querySelectorAll(".move-sec-up").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex);if(b>0){const y=n[b-1];n[b-1]=n[b],n[b]=y,l()}})}),e.querySelectorAll(".move-sec-down").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex);if(b<n.length-1){const y=n[b+1];n[b+1]=n[b],n[b]=y,l()}})}),e.querySelectorAll(".move-field-up").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex),y=parseInt(r.dataset.fieldIndex);if(y>0){const i=n[b].fields[y-1];n[b].fields[y-1]=n[b].fields[y],n[b].fields[y]=i,l()}})}),e.querySelectorAll(".move-field-down").forEach(r=>{r.addEventListener("click",()=>{o();const b=parseInt(r.dataset.sectionIndex),y=parseInt(r.dataset.fieldIndex);if(y<n[b].fields.length-1){const i=n[b].fields[y+1];n[b].fields[y+1]=n[b].fields[y],n[b].fields[y]=i,l()}})}),e.querySelectorAll(".field-type").forEach(r=>{r.addEventListener("change",()=>{o(),l()})})}l()}const $a=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function wa(e,s){if(e.role==="admin"||e.role==="manager")return"/";if(!e.userTypeId)return"/schedule";const t=s.getById("userTypes",e.userTypeId);if(!t||!t.permissions)return"/schedule";for(const{path:a,module:c}of $a){const n=t.permissions.find(l=>l.module===c);if(n&&(n.view||n.create||n.edit||n.delete))return a}return"/schedule"}function ka(e){var d;const s=document.querySelector(".sidebar"),t=document.querySelector(".topbar"),a=document.getElementById("breadcrumb");s&&(s.style.display="none"),t&&(t.style.display="none"),a&&(a.style.display="none");const c=p.getAll("technicians").filter(r=>!r.deactivated),n=p.getAll("userTypes");e.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">FieldForge</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${c.map(r=>{const b=n.find(y=>y.id===r.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${r.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${r.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${b?b.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${c.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const l=async r=>{const b=c.find(v=>v.id===r),y=n.find(v=>v.id===(b==null?void 0:b.userTypeId));let i="technician";if(y){const v=y.name.toLowerCase();v.includes("admin")?i="admin":v.includes("manager")?i="manager":v.includes("office")&&(i="office")}const u={id:b.id,name:b.name,role:i,userTypeName:y?y.name:"Unassigned",userTypeId:b.userTypeId,color:b.color};localStorage.setItem("currentUser",JSON.stringify(u)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),fe(async()=>{const{updateSidebarAccess:v}=await Promise.resolve().then(()=>zt);return{updateSidebarAccess:v}},void 0).then(({updateSidebarAccess:v})=>{v&&v()}),fe(async()=>{const{updateTopbarAccess:v}=await Promise.resolve().then(()=>_t);return{updateTopbarAccess:v}},void 0).then(({updateTopbarAccess:v})=>{v&&v()});const{store:m}=await fe(async()=>{const{store:v}=await Promise.resolve().then(()=>ys);return{store:v}},void 0),$=wa(u,m);B.navigate($)};e.querySelectorAll(".btn-login-user").forEach(r=>{r.addEventListener("click",b=>{const y=b.target.closest(".btn-login-user");l(y.dataset.id)})});const o=()=>{const r={id:"customer-user",name:"Customer User",role:"customer"},b=p.get("people").filter(y=>y.type==="Customer");b.length>0&&(r.customerId=b[0].id,r.name=b[0].firstName+" "+b[0].lastName),localStorage.setItem("currentUser",JSON.stringify(r)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),fe(async()=>{const{updateSidebarAccess:y}=await Promise.resolve().then(()=>zt);return{updateSidebarAccess:y}},void 0).then(({updateSidebarAccess:y})=>{y&&y()}),fe(async()=>{const{updateTopbarAccess:y}=await Promise.resolve().then(()=>_t);return{updateTopbarAccess:y}},void 0).then(({updateTopbarAccess:y})=>{y&&y()}),B.navigate("/portal")};(d=e.querySelector("#btn-login-customer"))==null||d.addEventListener("click",o)}function Nt(e){const s=JSON.parse(localStorage.getItem("currentUser")||"{}"),t=s.customerId;if(s.role!=="customer"||!t){e.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const a=p.getAll("jobs").filter(r=>r.customerId===t),c=p.getAll("quotes").filter(r=>r.customerId===t),n=p.getAll("invoices").filter(r=>r.customerId===t);e.innerHTML=`
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
        ${c.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${c.map(r=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${r.number} - ${r.title||"Quote"}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(r.total||0).toFixed(2)} | Status: <span class="badge ${r.status==="Approved"?"badge-success":"badge-neutral"}">${r.status}</span></div>
                </div>
                <div>
                  ${r.status!=="Approved"?`<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${r.id}">Approve</button>`:""}
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
            ${a.map(r=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${r.number} - ${r.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${r.status}</span></div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Invoices Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Invoices</h2>
        ${n.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${n.map(r=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${r.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(r.total||0).toFixed(2)} | Status: <span class="badge ${r.status==="Paid"?"badge-success":"badge-danger"}">${r.status}</span></div>
                </div>
                <div>
                  ${r.status!=="Paid"?`<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${r.id}">Pay Now</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;const l=e.querySelector("#portal-logout-btn");l&&l.addEventListener("click",()=>{localStorage.removeItem("currentUser"),fe(async()=>{const{router:r}=await Promise.resolve().then(()=>bs);return{router:r}},void 0).then(({router:r})=>{r.navigate("/login")})}),e.querySelectorAll(".btn-approve-quote").forEach(r=>{r.addEventListener("click",b=>{const y=b.target.dataset.id;p.update("quotes",y,{status:"Approved"}),alert("Quote approved successfully!"),Nt(e)})}),e.querySelectorAll(".btn-pay-invoice").forEach(r=>{r.addEventListener("click",b=>{const y=b.target.dataset.id;p.update("invoices",y,{status:"Paid"}),alert("Invoice paid successfully!"),Nt(e)})})}function ft(e){const s=p.getAll("contractors");e.innerHTML=`
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
  `;let t=[...s];const c=Oe({columns:[{key:"businessName",label:"Business Name",render:n=>`<span class="cell-link font-medium">${g(n.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:n=>g(n.email||"—")},{key:"phone",label:"Phone",render:n=>g(n.phone||"—")},{key:"active",label:"Status",render:n=>`<span class="badge ${n.active?"badge-success":"badge-neutral"}">${n.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:n=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${n.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:t,onRowClick:n=>B.navigate(`/contractors/${n}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:n=>{Ue({container:e,selectedIds:n,onClear:()=>c.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:l=>{l.forEach(o=>p.update("contractors",o,{active:!0})),c.clearSelection(),ft(e),fe(async()=>{const{showToast:o}=await Promise.resolve().then(()=>Ae);return{showToast:o}},void 0).then(({showToast:o})=>o(`Activated ${l.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:l=>{l.forEach(o=>p.update("contractors",o,{active:!1})),c.clearSelection(),ft(e),fe(async()=>{const{showToast:o}=await Promise.resolve().then(()=>Ae);return{showToast:o}},void 0).then(({showToast:o})=>o(`Deactivated ${l.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:l=>{fe(async()=>{const{showModal:o}=await Promise.resolve().then(()=>je);return{showModal:o}},void 0).then(({showModal:o})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${l.length} contractors? This action cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Delete",className:"btn-danger",onClick:r=>{l.forEach(b=>p.delete("contractors",b)),c.clearSelection(),ft(e),fe(async()=>{const{showToast:b}=await Promise.resolve().then(()=>Ae);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deleted ${l.length} contractors`,"success")),r()}}]})})}}]})}});e.querySelector("#contractors-table-container").appendChild(c),e.querySelector("#btn-new-contractor").addEventListener("click",()=>B.navigate("/contractors/new")),e.querySelector("#contractors-search").addEventListener("input",n=>{const l=n.target.value.toLowerCase();t=s.filter(o=>o.businessName.toLowerCase().includes(l)||o.contactName.toLowerCase().includes(l)||(o.email||"").toLowerCase().includes(l)),c.updateData(t)}),e.addEventListener("click",n=>{const l=n.target.closest(".contractor-edit-btn");l&&(n.stopPropagation(),B.navigate(`/contractors/${l.dataset.id}/edit`))})}function ds(e,s){const t=s.id==="new";let a=t?{active:!0}:p.getById("contractors",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{B.navigate(t?"/contractors":`/contractors/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const c={businessName:e.querySelector("#businessName").value,contactName:e.querySelector("#contactName").value,email:e.querySelector("#email").value,phone:e.querySelector("#phone").value,licenseNumber:e.querySelector("#licenseNumber").value,insuranceExpiry:e.querySelector("#insuranceExpiry").value,active:e.querySelector("#active").checked};if(!c.businessName||!c.contactName){alert("Business Name and Contact Name are required.");return}t?p.create("contractors",c):p.update("contractors",s.id,c),B.navigate("/contractors")})}function Sa(e,s){const t=p.getById("contractors",s.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
    <div class="page-header">
      <div class="page-header-info">
        <h1 style="margin: 0;">${g(t.businessName)}</h1>
        <p class="text-secondary" style="margin: 5px 0 0 0;">Contact: ${g(t.contactName)}</p>
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
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Email</strong> ${g(t.email||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Phone</strong> ${g(t.phone||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">License</strong> ${g(t.licenseNumber||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Insurance Expiry</strong> ${g(t.insuranceExpiry||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Status</strong> <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span></div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{B.navigate(`/contractors/${s.id}/edit`)})}function gt(e){let s=p.getAll("assets");const t=p.getAll("fleet");s.length===0&&t.length>0&&(t.forEach(l=>{l.ownerType="Business",l.identifier=l.licensePlate,p.create("assets",l)}),s=p.getAll("assets")),e.innerHTML=`
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
  `;let a=[...s];const n=Oe({columns:[{key:"name",label:"Name / ID",render:l=>`<span class="cell-link font-medium">${g(l.name)}</span>`},{key:"owner",label:"Owner Type",render:l=>{if(l.ownerType==="Customer"&&l.customerId){const o=p.getById("customers",l.customerId);return o?`<span class="badge badge-neutral">${g(o.company)}</span>`:"Customer"}return'<span class="badge badge-primary">My Business</span>'}},{key:"type",label:"Category",render:l=>g(l.type||"—")},{key:"service",label:"Service Status",render:l=>{const d=(l.logs||[]).filter(y=>y.type==="Service").sort((y,i)=>new Date(i.date)-new Date(y.date))[0];if(!d||!l.serviceIntervalMonths)return'<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';const r=new Date(d.date);r.setMonth(r.getMonth()+parseInt(l.serviceIntervalMonths));const b=r<new Date;return`<span style="color:${b?"var(--color-danger)":"var(--text-secondary)"}; font-size:12px; font-weight:${b?"600":"400"}">
          ${b?"OVERDUE":r.toLocaleDateString()}
        </span>`}},{key:"status",label:"Status",render:l=>`<span class="badge ${l.status==="Active"?"badge-success":l.status==="In Maintenance"?"badge-warning":"badge-neutral"}">${g(l.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:l=>{if(!l.assignedToId)return"—";const o=p.getById("technicians",l.assignedToId);return o?g(o.name):"—"}},{key:"actions",label:"",width:"80px",render:l=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${l.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:a,onRowClick:l=>B.navigate(`/assets/${l}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:l=>{Ue({container:e,selectedIds:l,onClear:()=>n.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:o=>{const d=document.createElement("div");d.innerHTML=`
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
              `,fe(async()=>{const{showModal:r}=await Promise.resolve().then(()=>je);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:`Update ${o.length} Assets`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{const y=d.querySelector("#bulk-status").value;o.forEach(i=>p.update("assets",i,{status:y})),n.clearSelection(),gt(e),fe(async()=>{const{showToast:i}=await Promise.resolve().then(()=>Ae);return{showToast:i}},void 0).then(({showToast:i})=>i(`Updated ${o.length} assets to ${y}`,"success")),b()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:o=>{fe(async()=>{const{showToast:d}=await Promise.resolve().then(()=>Ae);return{showToast:d}},void 0).then(({showToast:d})=>d(`Generating tags for ${o.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:o=>{fe(async()=>{const{showModal:d}=await Promise.resolve().then(()=>je);return{showModal:d}},void 0).then(({showModal:d})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${o.length} assets? This action cannot be undone.</p>`,d({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{o.forEach(y=>p.delete("assets",y)),n.clearSelection(),gt(e),fe(async()=>{const{showToast:y}=await Promise.resolve().then(()=>Ae);return{showToast:y}},void 0).then(({showToast:y})=>y(`Deleted ${o.length} assets`,"success")),b()}}]})})}}]})}});e.querySelector("#asset-table-container").appendChild(n),e.querySelector("#btn-new-asset").addEventListener("click",()=>{Zt({onSave:()=>gt(e)})}),e.querySelector("#asset-search").addEventListener("input",l=>{const o=l.target.value.toLowerCase();a=s.filter(d=>d.name.toLowerCase().includes(o)||(d.serial||d.identifier||d.licensePlate||"").toLowerCase().includes(o)||(d.type||"").toLowerCase().includes(o)),n.updateData(a)}),e.addEventListener("click",l=>{const o=l.target.closest(".asset-edit-btn");o&&(l.stopPropagation(),B.navigate(`/assets/${o.dataset.id}/edit`))})}function cs(e,s){const t=s.id==="new";let a=t?{status:"Active",ownerType:"Business",type:"Plant & Equipment",serviceIntervalMonths:6,currentMeter:0,recoveryRate:0}:p.getById("assets",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const c=p.getAll("people").filter(u=>u.type==="Staff"),n=p.getAll("customers");let l=[];if(a.customerId){const u=p.getById("customers",a.customerId);u&&u.sites&&(l=u.sites)}e.innerHTML=`
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
                ${n.map(u=>`<option value="${u.id}" ${a.customerId===u.id?"selected":""}>${u.company||u.firstName+" "+u.lastName}</option>`).join("")}
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
                 ${c.map(u=>`<option value="${u.id}" ${a.assignedToId===u.id?"selected":""}>${u.firstName} ${u.lastName}</option>`).join("")}
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
                ${l.map(u=>`<option value="${u.name}" ${a.site===u.name?"selected":""}>${u.name}</option>`).join("")}
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
  `;const o=e.querySelector("#ownerType"),d=e.querySelector("#customer-select-group"),r=e.querySelector("#customerId"),b=e.querySelector("#site"),y=e.querySelector("#business-fields");o.addEventListener("change",u=>{const m=u.target.value==="Customer";d.style.display=m?"block":"none",y.style.display=m?"none":"flex",b.disabled=!m,m?i(r.value):b.innerHTML='<option value="">-- No specific site --</option>'}),r.addEventListener("change",u=>{i(u.target.value)});function i(u){if(!u){b.innerHTML='<option value="">-- No specific site --</option>';return}const m=p.getById("customers",u);if(!m||!m.sites||m.sites.length===0){b.innerHTML='<option value="">-- No specific site --</option>';return}b.innerHTML='<option value="">-- No specific site --</option>'+m.sites.map($=>`<option value="${$.name}" ${a.site===$.name?"selected":""}>${$.name}</option>`).join("")}e.querySelector("#btn-cancel").addEventListener("click",()=>{B.navigate(t?"/assets":`/assets/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{var m;const u={name:e.querySelector("#name").value,description:e.querySelector("#description").value,serial:e.querySelector("#serial").value,identifier:e.querySelector("#serial").value,type:e.querySelector("#type").value,status:e.querySelector("#status").value,assignedToId:e.querySelector("#assignedToId").value,ownerType:e.querySelector("#ownerType").value,customerId:e.querySelector("#ownerType").value==="Customer"?e.querySelector("#customerId").value:null,site:e.querySelector("#site").value,installDate:e.querySelector("#installDate").value,recoveryRate:parseFloat(((m=e.querySelector("#recoveryRate"))==null?void 0:m.value)||0),serviceIntervalMonths:parseInt(e.querySelector("#serviceIntervalMonths").value||6),currentMeter:parseFloat(e.querySelector("#currentMeter").value||0),meterUnit:e.querySelector("#meterUnit").value};if(!u.name){alert("Asset Name is required.");return}t?(u.logs=[],p.create("assets",u)):p.update("assets",s.id,u),B.navigate("/assets")})}function ps(e,s){const t=p.getById("assets",s.id);if(!t){e.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}p.getSettings();let a="Unassigned";if(t.assignedToId){const i=p.getById("technicians",t.assignedToId);i&&(a=i.name)}let c="My Business",n="Internal Asset";if(t.ownerType==="Customer"&&t.customerId){const i=p.getById("customers",t.customerId);i&&(c=i.company),n="Customer Asset"}const l=t.logs||[],o=l.reduce((i,u)=>i+(parseFloat(u.cost)||0),0),d=l.filter(i=>i.type==="Service").sort((i,u)=>new Date(u.date)-new Date(i.date))[0];let r="Not Scheduled",b=!1;if(d&&t.serviceIntervalMonths){const i=new Date(d.date);i.setMonth(i.getMonth()+parseInt(t.serviceIntervalMonths)),r=i.toLocaleDateString(),b=i<new Date}e.innerHTML=`
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
          <span class="material-icons-outlined" style="color:var(--color-primary)">${t.type==="Vehicle"?"directions_car":"precision_manufacturing"}</span>
        </div>
        <div>
          <h1 style="margin: 0;">${g(t.name)}</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
            <span class="badge ${t.ownerType==="Business"?"badge-primary":"badge-neutral"}">${n}</span>
            <span class="text-tertiary" style="font-size:12px">• ${g(t.identifier||t.serial||"No ID")}</span>
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
            ${r}
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
            ${t.ownerType==="Business"?`$${o.toLocaleString()}`:`${t.currentMeter||0} ${t.meterUnit||"hrs"}`}
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
                <span class="font-medium">${g(t.type||"-")}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Owner</span>
                <span class="font-medium">${g(c)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Assigned To</span>
                <span class="font-medium">${g(a)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Location</span>
                <span class="font-medium">${g(t.site||"Main Office")}</span>
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
            ${g(t.description)}
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
              ${l.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>':l.sort((i,u)=>new Date(u.date)-new Date(i.date)).map(i=>`
                  <tr>
                    <td class="font-medium">${new Date(i.date).toLocaleDateString()}</td>
                    <td class="text-secondary">${i.meter||"-"}</td>
                    <td>
                      <span class="badge ${i.type==="Service"?"badge-success":i.type==="Repair"?"badge-danger":"badge-neutral"}">
                        ${g(i.type)}
                      </span>
                    </td>
                    <td><span class="text-secondary" style="font-size:13px">${g(i.notes||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${i.cost>0?`$${parseFloat(i.cost).toFixed(2)}`:"—"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{B.navigate(`/assets/${s.id}/edit`)}),e.querySelector("#btn-add-log").addEventListener("click",()=>{y()});function y(){const i=document.createElement("div");i.innerHTML=`
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
    `,fe(async()=>{const{showModal:u}=await Promise.resolve().then(()=>je);return{showModal:u}},void 0).then(({showModal:u})=>{u({title:"Add Activity Log",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Save Log",className:"btn-primary",onClick:m=>{const $=i.querySelector("#log-date").value,v=i.querySelector("#log-type").value,w=parseFloat(i.querySelector("#log-meter").value),q=parseFloat(i.querySelector("#log-cost").value),h=i.querySelector("#log-notes").value;if(!$)return;const S={date:$,type:v,meter:w,cost:q,notes:h},x=[...t.logs||[],S];p.update("assets",t.id,{logs:x,currentMeter:w,status:v==="Repair"?"In Maintenance":t.status}),m(),ps(e,s)}}]})})}}function Ta(e){let s="All Documents";const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),a=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];function c(){if(t.role==="admin"||t.role==="manager")return a;const l=["All Documents","Health & Safety","Job Attachments","Customer Attachments","Digital Forms","Purchase Orders"],o=t.userTypeId?p.getById("userTypes",t.userTypeId):null;if(o&&o.permissions){const d=o.permissions.find(b=>b.module==="Quotes"),r=o.permissions.find(b=>b.module==="Invoices");d&&d.view&&l.push("Quotes"),r&&r.view&&l.push("Invoices")}return a.filter(d=>l.includes(d))}function n(){const l=c();l.includes(s)||(s="All Documents");const o=[];p.getAll("documents").forEach(v=>{o.push({id:v.id,name:v.name,url:v.url,type:v.type,size:v.size,uploadedAt:v.uploadedAt,folder:v.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),p.getAll("jobs").forEach(v=>{v.attachments&&Array.isArray(v.attachments)&&v.attachments.forEach(w=>{o.push({id:w.id||Math.random().toString(36).substr(2,9),name:w.name,url:w.url||w.data||"#",type:w.type,size:w.size,uploadedAt:w.uploadedAt||w.date||v.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:v.id,entityName:`${v.number} - ${v.title}`})}),v.activityLog&&Array.isArray(v.activityLog)&&v.activityLog.forEach(w=>{w.type==="attachment"&&w.file&&o.push({id:w.id,name:w.file.name,url:w.file.url||w.file.data||"#",type:w.file.type,size:w.file.size,uploadedAt:w.date,folder:"Job Attachments",entityType:"Job",entityId:v.id,entityName:`${v.number} - ${v.title}`}),w.type==="combined"&&Array.isArray(w.files)&&w.files.forEach((q,h)=>{o.push({id:`${w.id}_${h}`,name:q.name,url:q.url||q.data||"#",type:q.type,size:q.size,uploadedAt:w.date,folder:"Job Attachments",entityType:"Job",entityId:v.id,entityName:`${v.number} - ${v.title}`})})}),v.forms&&Array.isArray(v.forms)&&v.forms.forEach((w,q)=>{o.push({id:`form_${v.id}_${q}`,name:`${w.type} - ${new Date(w.date).toLocaleDateString()}`,url:`#/jobs/${v.id}`,type:"Digital Form",size:null,uploadedAt:w.date,folder:"Digital Forms",entityType:"Job",entityId:v.id,entityName:`${v.number} - ${v.title}`})})}),p.getAll("customers").forEach(v=>{v.attachments&&Array.isArray(v.attachments)&&v.attachments.forEach(w=>{o.push({id:w.id||Math.random().toString(36).substr(2,9),name:w.name,url:w.url||w.data||"#",type:w.type,size:w.size,uploadedAt:w.uploadedAt||v.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:v.id,entityName:v.company})})}),p.getAll("invoices").forEach(v=>{o.push({id:v.id,name:`Invoice ${v.number}.pdf`,url:`#/invoices/${v.id}`,type:"Invoice PDF",size:null,uploadedAt:v.issueDate,folder:"Invoices",entityType:"Invoice",entityId:v.id,entityName:`Inv ${v.number} - ${v.customerName}`})}),p.getAll("quotes").forEach(v=>{o.push({id:v.id,name:`Quote ${v.number}.pdf`,url:`#/quotes/${v.id}`,type:"Quote PDF",size:null,uploadedAt:v.createdAt,folder:"Quotes",entityType:"Quote",entityId:v.id,entityName:`Quote ${v.number} - ${v.customerName}`})}),p.getAll("purchaseOrders").forEach(v=>{o.push({id:v.id,name:`PO ${v.number}.pdf`,url:`#/purchase-orders/${v.id}`,type:"PO PDF",size:null,uploadedAt:v.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:v.id,entityName:`PO ${v.number} - ${v.supplierName}`})}),p.getAll("taskTemplates").forEach(v=>{o.push({id:`task_tmpl_${v.id}`,name:`${v.name} (Tasklist Template)`,url:"#/settings",type:"Tasklist Template",size:null,uploadedAt:v.createdAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:v.id,entityName:"Settings / Tasklist Templates"})}),p.getAll("formTemplates").forEach(v=>{o.push({id:`form_tmpl_${v.id}`,name:`${v.name} (Compliance Form Template)`,url:"#/settings",type:"Form Template",size:null,uploadedAt:v.createdAt||v.updatedAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:v.id,entityName:"Settings / Compliance Forms"})});const d=o.filter(v=>l.includes(v.folder));d.sort((v,w)=>new Date(w.uploadedAt)-new Date(v.uploadedAt));let r=d;s!=="All Documents"&&(r=d.filter(v=>v.folder===s));const b=l;e.innerHTML=`
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
              ${b.map(v=>{let w="folder";v==="All Documents"?w="dashboard":v==="Company Docs"?w="domain":v==="Health & Safety"?w="health_and_safety":v==="Templates"?w="file_copy":v==="Job Attachments"?w="build":v==="Customer Attachments"?w="people":v==="Digital Forms"?w="assignment":v==="Invoices"?w="receipt_long":v==="Quotes"?w="request_quote":v==="Purchase Orders"&&(w="shopping_cart");const q=s===v,h=v==="All Documents"?d.length:d.filter(S=>S.folder===v).length;return`
                <li>
                  <button class="btn btn-ghost ${q?"active":""}" data-folder="${v}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${q?"var(--color-primary-bg)":"transparent"}; color:${q?"var(--primary-color)":"var(--text-primary)"}; font-weight:${q?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${w}</span> ${v}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${h}</span>
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
    `,e.querySelectorAll("#folder-list button").forEach(v=>{v.addEventListener("click",()=>{s=v.dataset.folder,n()})});let y=[...r];const u=Oe({columns:[{key:"name",label:"File Name",render:v=>{let w="insert_drive_file";return v.type==="Invoice PDF"||v.type==="Quote PDF"||v.type==="PO PDF"?w="picture_as_pdf":v.type==="Digital Form"?w="assignment":v.type&&v.type.includes("image")&&(w="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${w}</span> <span class="font-medium truncate" style="max-width:300px" title="${g(v.name)}">${g(v.name)}</span></div>`}},{key:"folder",label:"Category",render:v=>g(v.folder||"—")},{key:"size",label:"Size",render:v=>v.size?(v.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:v=>{if(v.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let w="#";return v.entityType==="Job"?w=`#/jobs/${v.entityId}`:v.entityType==="Customer"?w=`#/people/${v.entityId}`:v.entityType==="Invoice"?w=`#/invoices/${v.entityId}`:v.entityType==="Quote"?w=`#/quotes/${v.entityId}`:v.entityType==="PO"&&(w=`#/purchase-orders/${v.entityId}`),`<span class="badge badge-neutral">${v.entityType}</span> <a href="${w}">${g(v.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:v=>v.uploadedAt?new Date(v.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:v=>v.url&&v.url.startsWith("#/")?`<a href="${g(v.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`:`<a href="#/document/view" target="_blank" class="btn btn-sm btn-outline btn-view-doc" data-doc-id="${g(v.id)}" style="text-decoration:none">View</a>`}],data:y,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:v=>{Ue({container:e.querySelector(".main-wrapper")||e,selectedIds:v,onClear:()=>u.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:w=>{const q=b.filter(S=>S!=="All Documents"),h=document.createElement("div");h.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${q.map(S=>`<option value="${S}">${S}</option>`).join("")}
                    </select>
                  </div>
                `,Se({title:`Move ${w.length} Documents`,content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Move",className:"btn-primary",onClick:S=>{const x=h.querySelector("#bulk-folder").value;w.forEach(f=>{p.getById("documents",f)&&p.update("documents",f,{folder:x})}),u.clearSelection(),n(),z(`Moved ${w.length} documents to ${x}`,"success"),S()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:w=>{Se({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${w.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:"Delete",className:"btn-danger",onClick:q=>{w.forEach(h=>p.delete("documents",h)),u.clearSelection(),n(),z(`Deleted ${w.length} documents`,"success"),q()}}]})}}]})}});e.querySelector("#docs-table-container").appendChild(u);const m=e.querySelector("#docs-search");function $(){const v=m.value.toLowerCase();y=r.filter(w=>w.name.toLowerCase().includes(v)||w.entityName&&w.entityName.toLowerCase().includes(v)||w.folder&&w.folder.toLowerCase().includes(v)),u.updateData(y)}m.addEventListener("input",$),e.querySelector("#docs-table-container").addEventListener("click",v=>{const w=v.target.closest(".btn-view-doc");if(w){const q=w.dataset.docId,h=r.find(S=>S.id===q);h&&localStorage.setItem("currentDocumentView",JSON.stringify({name:h.name,url:h.url,type:h.type}))}}),e.querySelector("#btn-upload-doc").addEventListener("click",()=>{const v=b.filter(q=>q!=="All Documents"),w=document.createElement("div");w.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${v.map(q=>`<option value="${q}">${q}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,Se({title:"Upload Global Document",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:"Upload",className:"btn-primary",onClick:q=>{const h=document.getElementById("upload-file-input"),S=document.getElementById("upload-folder").value;if(!h.files.length){z("Please select a file","error");return}const x=h.files[0],f=new FileReader;f.onload=E=>{p.create("documents",{name:x.name,type:x.type||"unknown",size:x.size,url:E.target.result,folder:S,uploadedAt:new Date().toISOString()}),z("Document uploaded successfully","success"),n(),q()},f.readAsDataURL(x)}}]})})}n()}function Ca(e){let s=null;try{const n=localStorage.getItem("currentDocumentView");n&&(s=JSON.parse(n))}catch(n){console.error("Failed to parse document data:",n)}if(!s||!s.url){e.innerHTML=`
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
              <h2 style="margin: 0; font-size: 16px;">${g(s.name||"View Document")}</h2>
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
          <img src="${g(s.url)}" style="max-width: 100%; max-height: 100%; box-shadow: var(--shadow-md); border-radius: 4px;" alt="${g(s.name)}" />
        `:a?`
          <iframe src="${g(s.url)}" style="width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
        `:`
          <div class="card" style="padding: 40px; text-align: center; max-width: 400px;">
            <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px;">description</span>
            <h4>Cannot preview this file type</h4>
            <p class="text-secondary" style="margin-bottom: 24px;">This file type (${g(s.type||"Unknown")}) cannot be previewed in the browser.</p>
            <a href="${g(s.url)}" download="${g(s.name)}" class="btn btn-primary">Download File</a>
          </div>
        `}
      </div>
    </div>
  `,setTimeout(()=>{const n=document.querySelector(".sidebar"),l=document.querySelector(".topbar"),o=document.getElementById("breadcrumb"),d=document.getElementById("main-content");n&&(n.style.display="none"),l&&(l.style.display="none"),o&&(o.style.display="none"),d&&(d.style.padding="0",d.style.height="100vh",d.style.overflow="hidden")},0);const c=()=>{const n=document.querySelector(".sidebar"),l=document.querySelector(".topbar"),o=document.getElementById("breadcrumb"),d=document.getElementById("main-content");n&&(n.style.display=""),l&&(l.style.display=""),o&&(o.style.display=""),d&&(d.style.padding="",d.style.height="",d.style.overflow=""),window.removeEventListener("hashchange",c)};window.addEventListener("hashchange",c)}Is();window.__fieldForge={router:B,store:p};const us=document.getElementById("app"),Ea=Vt(),mt=document.createElement("div");mt.className="main-wrapper";const Ia=Wt(),Mt=document.createElement("div");Mt.className="breadcrumb";Mt.id="breadcrumb";const st=document.createElement("main");st.className="main-content";st.id="main-content";mt.appendChild(Ia);mt.appendChild(Mt);mt.appendChild(st);us.appendChild(Ea);us.appendChild(mt);function he(e){return s=>{st.innerHTML="",st.scrollTop=0,e(st,s)}}B.register("/login",he(ka));B.register("/portal",he(Nt));B.register("/",he(Fs));B.register("/people",he(Lt));B.register("/people/new",he((e,s)=>es(e,{id:"new"})));B.register("/people/:id",he(Zs));B.register("/people/:id/edit",he((e,s)=>es(e,s)));B.register("/contractors",he(ft));B.register("/contractors/new",he((e,s)=>ds(e,{id:"new"})));B.register("/contractors/:id",he(Sa));B.register("/contractors/:id/edit",he((e,s)=>ds(e,s)));B.register("/leads",he(qt));B.register("/leads/new",he((e,s)=>ts(e,{id:"new"})));B.register("/leads/:id",he(ea));B.register("/leads/:id/edit",he((e,s)=>ts(e,s)));B.register("/notifications",he(ss));B.register("/quotes",he(At));B.register("/quotes/new",he((e,s)=>St(e,{id:"new"})));B.register("/quotes/:id",he(St));B.register("/jobs",he(Dt));B.register("/jobs/new",he((e,s)=>os(e,{id:"new"})));B.register("/jobs/:id",he(oa));B.register("/jobs/:id/edit",he((e,s)=>os(e,s)));B.register("/timesheets",he(na));B.register("/assets",he(gt));B.register("/assets/new",he((e,s)=>cs(e,{id:"new"})));B.register("/assets/:id",he(ps));B.register("/assets/:id/edit",he((e,s)=>cs(e,s)));B.register("/schedule",he(da));B.register("/stock",he(Ze));B.register("/stock/new",he((e,s)=>is(e,{id:"new"})));B.register("/stock/:id",he(ca));B.register("/stock/:id/edit",he((e,s)=>is(e,s)));B.register("/invoices",he(yt));B.register("/invoices/new",he((e,s)=>ns(e,{id:"new"})));B.register("/invoices/:id",he(ns));B.register("/purchase-orders",he(et));B.register("/purchase-orders/:id",he(pa));B.register("/documents",he(Ta));B.register("/document/view",he(Ca));B.register("/reports",he(ua));B.register("/settings",he(xa));B.register("/settings/forms/new",he((e,s)=>rs(e,{id:"new"})));B.register("/settings/forms/:id/edit",he((e,s)=>rs(e,s)));B.register("/settings/quote-templates/new",he((e,s)=>St(e,{id:"new",type:"template"})));B.register("/settings/quote-templates/:id/edit",he((e,s)=>St(e,{id:s.id,type:"template"})));const La=["/","/people","/contractors","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings","/settings/forms"];B.onNavigate=(e,s)=>{const t=JSON.parse(localStorage.getItem("currentUser")||"null"),a=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];if(!t&&e!=="/login")return B.navigate("/login"),!1;if(t){if(t.role==="customer"&&La.includes(a))return B.navigate("/portal"),!1;if(t.role!=="customer"&&a==="/portal")return B.navigate("/"),!1;if(t.role!=="admin"&&t.role!=="customer"&&t.userTypeId&&e!=="/login"){const c=p.getById("userTypes",t.userTypeId);if(c&&c.permissions){const n={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},l=n[a];if(l){let o=!1;if(e==="/jobs/new"&&!Ee("Jobs","create")&&(o=!0),e.endsWith("/edit")&&a==="/jobs"&&!Ee("Jobs","edit")&&(o=!0),e==="/quotes/new"&&!Ee("Quotes","create")&&(o=!0),o){const r=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/assets","/documents","/settings"].find(b=>{const y=n[b];if(y==="Notifications"||y==="Dashboard")return!0;const i=c.permissions.find(u=>u.module===y);return i&&Object.entries(i).some(([u,m])=>u!=="module"&&m===!0)})||"/";return B.navigate(r),!1}if(!(l==="Notifications"||l==="Dashboard")){const d=c.permissions.find(r=>r.module===l);if(!d||Object.entries(d||{}).every(([r,b])=>r==="module"||!b)){const b=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/assets","/documents","/settings"].find(y=>{const i=n[y];if(i==="Notifications"||i==="Dashboard")return!0;const u=c.permissions.find(m=>m.module===i);return u&&Object.entries(u).some(([m,$])=>m!=="module"&&$===!0)})||"/";if(a!==b)return B.navigate(b),!1}}}}}}Qt(e),js(e)};window.addEventListener("fieldforge-logout",()=>{localStorage.removeItem("currentUser");const e=document.querySelector(".sidebar"),s=document.querySelector(".topbar"),t=document.getElementById("breadcrumb");e&&(e.style.display="none"),s&&(s.style.display="none"),t&&(t.style.display="none"),B.navigate("/login")});const qa=JSON.parse(localStorage.getItem("currentUser")||"null");!qa&&window.location.hash!=="#/login"&&(window.location.hash="#/login");B.resolve();
