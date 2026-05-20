(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))a(u);new MutationObserver(u=>{for(const l of u)if(l.type==="childList")for(const c of l.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function t(u){const l={};return u.integrity&&(l.integrity=u.integrity),u.referrerPolicy&&(l.referrerPolicy=u.referrerPolicy),u.crossOrigin==="use-credentials"?l.credentials="include":u.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function a(u){if(u.ep)return;u.ep=!0;const l=t(u);fetch(u.href,l)}})();class Kt{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(s,t){this.routes[s]=t}navigate(s){typeof window<"u"&&(window.location.hash=s)}resolve(s){let t=s||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const a=t.indexOf("?"),u={};if(a!==-1){const o=t.substring(a+1);t=t.substring(0,a),o.split("&").forEach(r=>{const[d,v]=r.split("=");d&&(u[d]=decodeURIComponent(v||""))})}const{handler:l,params:c}=this.matchRoute(t);if(l){this.currentRoute=t;const o={...c,...u};if(this.onNavigate&&this.onNavigate(t,o)===!1)return;l(o)}}matchRoute(s){if(this.routes[s])return{handler:this.routes[s],params:{}};for(const[t,a]of Object.entries(this.routes)){const u=t.split("/"),l=s.split("/");if(u.length!==l.length)continue;const c={};let o=!0;for(let r=0;r<u.length;r++)if(u[r].startsWith(":"))c[u[r].slice(1)]=l[r];else if(u[r]!==l[r]){o=!1;break}if(o)return{handler:a,params:c}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const R=new Kt,ks=Object.freeze(Object.defineProperty({__proto__:null,Router:Kt,router:R},Symbol.toStringTag,{value:"Module"})),yt="simpro_";class Ss{constructor(){this.listeners={}}_key(s){return yt+s}getAll(s){try{const t=localStorage.getItem(this._key(s));return t?JSON.parse(t):[]}catch{return[]}}getById(s,t){return this.getAll(s).find(u=>u.id===t)||null}save(s,t){localStorage.setItem(this._key(s),JSON.stringify(t)),this.emit(s,t)}create(s,t){const a=this.getAll(s);return t.id=t.id||this.generateId(),t.createdAt=t.createdAt||new Date().toISOString(),t.updatedAt=new Date().toISOString(),a.push(t),this.save(s,a),t}update(s,t,a){const u=this.getAll(s),l=u.findIndex(c=>c.id===t);return l===-1?null:(u[l]={...u[l],...a,updatedAt:new Date().toISOString()},this.save(s,u),u[l])}delete(s,t){const u=this.getAll(s).filter(l=>l.id!==t);this.save(s,u)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const s={markupPercent:20,materialMarkup:{defaultPercent:30,minMarkupAmount:5,useTiers:!0,tiers:[{upTo:50,percent:60},{upTo:200,percent:45},{upTo:1e3,percent:30},{upTo:null,percent:15}]},materialCategories:["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],laborRates:[{id:"rate_1",name:"Standard Rate",rate:85,description:"Normal business hours Mon–Fri",overtimeMultiplier:1,minCallOutFee:0,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!0},{id:"rate_2",name:"After Hours Rate",rate:127.5,description:"Evenings and early mornings",overtimeMultiplier:1.5,minCallOutFee:45,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!1},{id:"rate_3",name:"Saturday Rate",rate:127.5,description:"Saturday work",overtimeMultiplier:1.5,minCallOutFee:65,applicableDays:["Sat"],isDefault:!1},{id:"rate_4",name:"Sunday Rate",rate:170,description:"Sunday and public holidays",overtimeMultiplier:2,minCallOutFee:85,applicableDays:["Sun","PH"],isDefault:!1},{id:"rate_5",name:"Emergency Rate",rate:195,description:"Urgent call-outs any day",overtimeMultiplier:2,minCallOutFee:120,applicableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],isDefault:!1}]};try{const t=localStorage.getItem(this._key("settings"));return t?JSON.parse(t):s}catch{return s}}saveSettings(s){localStorage.setItem(this._key("settings"),JSON.stringify(s)),this.emit("settings",s)}on(s,t){this.listeners[s]||(this.listeners[s]=[]),this.listeners[s].push(t)}off(s,t){this.listeners[s]&&(this.listeners[s]=this.listeners[s].filter(a=>a!==t))}emit(s,t){this.listeners[s]&&this.listeners[s].forEach(a=>a(t))}isSeeded(){return localStorage.getItem(yt+"_seeded")==="true"}markSeeded(){localStorage.setItem(yt+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(s=>s.startsWith(yt)).forEach(s=>localStorage.removeItem(s))}}const p=new Ss,Ts=Object.freeze(Object.defineProperty({__proto__:null,store:p},Symbol.toStringTag,{value:"Module"}));function Te(e,s){const t=JSON.parse(localStorage.getItem("currentUser")||"null");if(!t)return!1;if(t.role==="admin")return!0;if(t.role==="customer")return!1;if(t.userTypeId){const a=p.getById("userTypes",t.userTypeId);if(a&&a.permissions){const u=a.permissions.find(l=>l.module===e);return u?!!u[s]:!1}}return t.role==="technician"?e==="Dashboard"?s==="view":e==="Jobs"?["view","manage_tasks","book_time"].includes(s):e==="Timesheets"?["view_own","create"].includes(s):e==="Schedule"?["view_own"].includes(s):!1:t.role==="manager"?e==="Settings"?["view","edit_company","manage_tax"].includes(s):!0:!1}const ot={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Tasklists"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs Tab"},{key:"view_quotes_tab",label:"View Quotes Tab"},{key:"view_pos_tab",label:"View POs Tab"},{key:"view_timesheets_tab",label:"View Timesheets Tab"},{key:"view_invoices_tab",label:"View Invoices Tab"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create / Submit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"edit_all",label:"Edit Any Timesheet"},{key:"export",label:"Export Timesheets"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Create Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View Full Schedule"},{key:"edit",label:"Manage Schedule (Drag/Drop)"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Create Contractors"},{key:"edit",label:"Edit Contractors"}],Suppliers:[{key:"view",label:"View Suppliers"},{key:"create",label:"Create Suppliers"},{key:"edit",label:"Edit Suppliers"},{key:"delete",label:"Delete Suppliers"}],Stock:[{key:"view",label:"View Inventory"},{key:"create",label:"Create Stock Items"},{key:"edit",label:"Manage Stock Levels"},{key:"delete",label:"Delete Stock"}],"Purchase Orders":[{key:"view",label:"View POs"},{key:"create",label:"Create POs"},{key:"approve",label:"Approve POs"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"send",label:"Send Invoices"},{key:"void",label:"Void Invoices"}],Reports:[{key:"view",label:"Access Reports"},{key:"export",label:"Export Data"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Files"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Profile"},{key:"manage_users",label:"Manage Users & Permissions"},{key:"manage_tax",label:"Manage Tax & Finance"}]};function rt(e){return Object.entries(ot).map(([s,t])=>{const a={module:s};return t.forEach(({key:u})=>{a[u]=e(s,u)}),a})}function Cs(){const e=p.getAll("userTypes");if(e&&e.length>0)return e;const s=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:rt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:rt((t,a)=>t==="Settings"?["view","edit_company","manage_tax"].includes(a):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:rt((t,a)=>t==="Dashboard"?a==="view":t==="Jobs"?["view","manage_tasks","book_time"].includes(a):t==="Timesheets"?["view_own","create"].includes(a):t==="Schedule"?["view_own"].includes(a):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:rt((t,a)=>t==="Settings"?!1:t==="Reports"?a==="view":!(["Invoices","Purchase Orders","Suppliers"].includes(t)&&a==="delete"))}];return p.save("userTypes",s),s}const Es=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],mt=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin",payRate:95},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager",payRate:85},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech",payRate:58},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech",payRate:62},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech",payRate:55},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office",payRate:42}],nt=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],It=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],ft=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function Ce(e){return e[Math.floor(Math.random()*e.length)]}function je(e,s=0){const t=new Date,a=Math.floor(Math.random()*(e+s))-e;return new Date(t.getTime()+a*864e5).toISOString()}function Qe(e,s){return Math.round((Math.random()*(s-e)+e)*100)/100}function Ls(){return Es.map((e,s)=>{const t=Ce(It),a=Ce(It);return{id:`cust_${s+1}`,company:e.company,firstName:e.first,lastName:e.last,email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${t}, ${Ce(ft)}, VIC 3000`,status:Ce(["Active","Active","Active","Inactive"]),type:Ce(["Company","Company","Individual"]),notes:"",createdAt:je(365),updatedAt:je(30),sites:[{name:"Main Office",address:`${t}, ${Ce(ft)}, VIC 3000`},{name:"Warehouse",address:`${a}, ${Ce(ft)}, VIC 3001`}],contacts:[{name:`${e.first} ${e.last}`,role:"Primary",email:`${e.first.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${Ce(["Alex","Sam","Jordan","Casey","Morgan"])} ${e.last}`,role:"Site Manager",email:`site@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function Ht(){return[{id:"cont_1",businessName:"EcoVolt Electrical Services",contactName:"Elena Rostova",email:"elena@ecovoltelectrical.com.au",phone:"0498 765 432",licenseNumber:"LIC-EL-88390",active:!0,hourlyRate:95,afterHoursRate:142.5,calloutFee:85,specialties:["Solar PV Installation","Battery Systems","Switchboard Upgrades"],notes:"Preferred subcontractor for large-scale solar rollouts. Highly reliable.",complianceDocs:[{id:"doc_1_1",type:"Public Liability Insurance",number:"PL-992110-A",expiryDate:"2026-10-15",verified:!0,notes:"Cover up to $20M"},{id:"doc_1_2",type:"Workers Compensation",number:"WC-883912",expiryDate:"2026-08-20",verified:!0,notes:"Active cover"},{id:"doc_1_3",type:"Electrical Contractor License",number:"REC-39021",expiryDate:"2027-02-15",verified:!0,notes:"A-Grade Electrical License"}]},{id:"cont_2",businessName:"Apex Plumbing & Drainage",contactName:"Gary Barlow",email:"gary@apexplumbing.com.au",phone:"0412 345 678",licenseNumber:"LIC-PL-99211",active:!0,hourlyRate:90,afterHoursRate:135,calloutFee:90,specialties:["Commercial Plumbing","Gas Fitting","Drain Blockages"],notes:"Quick response time. Has own high-pressure jetter and CCTV camera.",complianceDocs:[{id:"doc_2_1",type:"Public Liability Insurance",number:"PL-223401-B",expiryDate:"2026-06-30",verified:!0,notes:"Cover up to $10M"},{id:"doc_2_2",type:"Workers Compensation",number:"WC-449102",expiryDate:"2026-04-12",verified:!1,notes:"Requires updated certificate copy"},{id:"doc_2_3",type:"Plumbing Practitioner License",number:"PPL-1192",expiryDate:"2027-09-01",verified:!0,notes:"Licensed drainer and gasfitter"}]},{id:"cont_3",businessName:"Swift HVAC & Mechanical",contactName:"Marcus Sterling",email:"marcus@swifthvac.com.au",phone:"0423 556 789",licenseNumber:"LIC-HV-44012",active:!1,hourlyRate:105,afterHoursRate:157.5,calloutFee:120,specialties:["Chiller Maintenance","Commercial A/C","Duct Work"],notes:"Currently set to inactive due to expired public liability insurance. Do not dispatch.",complianceDocs:[{id:"doc_3_1",type:"Public Liability Insurance",number:"PL-771109-C",expiryDate:"2026-02-10",verified:!1,notes:"Expired! Contact Marcus for renewal"},{id:"doc_3_2",type:"Workers Compensation",number:"WC-110291",expiryDate:"2026-11-30",verified:!0,notes:"Cover active"},{id:"doc_3_3",type:"ARC Refrigerant License",number:"ARC-8891",expiryDate:"2027-05-18",verified:!0,notes:"Full handle license"}]}]}function Rt(){return[{id:"tmpl_elec_std",name:"Standard Electrical Inspection",description:"A comprehensive tasklist for residential or commercial electrical safety inspections.",tags:["Electrical","Maintenance","Compliance"],createdAt:new Date().toISOString(),tasks:[{id:"p1",name:"Main Board Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp1",name:"RCD Testing",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp2",name:"Terminal Tightness",estimatedHours:.5,people:1,status:"Not Started",progress:0}]},{id:"p2",name:"Circuit Testing",status:"Not Started",progress:0,subTasks:[{id:"sp3",name:"Insulation Resistance",estimatedHours:2,people:1,status:"Not Started",progress:0},{id:"sp4",name:"Earth Loop Impedance",estimatedHours:1.5,people:1,status:"Not Started",progress:0}]}]},{id:"tmpl_solar_maint",name:"Solar Panel Maintenance",description:"Annual maintenance checklist for PV solar systems.",tags:["Solar","Renewable","Maintenance"],createdAt:new Date().toISOString(),tasks:[{id:"p3",name:"Physical Inspection",status:"Not Started",progress:0,subTasks:[{id:"sp5",name:"Module Cleaning",estimatedHours:3,people:2,status:"Not Started",progress:0},{id:"sp6",name:"Mounting Hardware Check",estimatedHours:1,people:1,status:"Not Started",progress:0}]},{id:"p4",name:"Electrical Performance",status:"Not Started",progress:0,subTasks:[{id:"sp7",name:"Inverter Diagnostics",estimatedHours:1,people:1,status:"Not Started",progress:0},{id:"sp8",name:"String Voltage Testing",estimatedHours:2,people:1,status:"Not Started",progress:0}]}]}]}function Is(e){const s=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],t=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(a,u)=>{const l=Ce(e);return{id:`lead_${u+1}`,title:`${Ce(nt)} ${Ce(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:l.id,customerName:l.company,contactName:`${l.firstName} ${l.lastName}`,status:Ce(s),source:Ce(t),value:Qe(500,25e3),description:`Potential ${Ce(nt).toLowerCase()} work for ${l.company}.`,priority:Ce(["Low","Medium","High"]),createdAt:je(90),updatedAt:je(14)}})}function qs(e){const s=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(t,a)=>{const u=Ce(e),l=Qe(200,5e3),c=Qe(100,8e3),o=(l+c)*.1;return{id:`quote_${a+1}`,number:`Q-${String(2024e3+a+1)}`,customerId:u.id,customerName:u.company,contactName:`${u.firstName} ${u.lastName}`,title:`${Ce(nt)} - ${Ce(["Service Quote","Project Quote","Maintenance Quote"])}`,status:Ce(s),lineItems:[{description:`${Ce(nt)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:Qe(65,120),total:l},{description:`${Ce(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:Qe(15,200),total:c}],subtotal:l+c,tax:o,total:l+c+o,validUntil:je(-30,60),notes:"",createdAt:je(120),updatedAt:je(14)}})}function Ds(e,s){const t=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],a=["Low","Medium","High","Urgent"];return Array.from({length:20},(u,l)=>{var d;const c=Ce(e),o=Ce(mt),r=Ce(t);return{id:`job_${l+1}`,number:`J-${String(1e5+l+1)}`,customerId:c.id,customerName:c.company,contactName:`${c.firstName} ${c.lastName}`,siteAddress:c.address||`${Ce(It)}, ${Ce(ft)}, VIC 3000`,title:`${Ce(nt)} - ${Ce(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:Ce(nt),status:r,priority:Ce(a),technicianId:o.id,technicianName:o.name,quoteId:l<s.length?(d=s[l])==null?void 0:d.id:null,scheduledDate:je(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:Qe(200,4e3),materialCost:Qe(100,3e3),tasks:[{id:"p1",name:"Site Preparation",status:r==="Pending"?"Not Started":"Completed",progress:r==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:r==="Pending"?"Not Started":"Completed",progress:r==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:r==="Pending"?"Not Started":"Completed",progress:r==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Installation Phase",status:r==="Completed"||r==="Invoiced"?"Completed":r==="In Progress"?"In Progress":"Not Started",progress:r==="Completed"||r==="Invoiced"?100:r==="In Progress"?50:0,estimatedHours:12,people:2,subTasks:[{id:"sp3",name:"Main Installation",status:r==="Completed"||r==="Invoiced"?"Completed":r==="In Progress"?"In Progress":"Not Started",progress:r==="Completed"||r==="Invoiced"||r==="In Progress"?100:0,estimatedHours:8,people:2},{id:"sp4",name:"Final Commissioning",status:r==="Completed"||r==="Invoiced"?"Completed":"Not Started",progress:r==="Completed"||r==="Invoiced"?100:0,estimatedHours:4,people:2}]}],notes:"",createdAt:je(90),updatedAt:je(7)}})}function As(e){const s=["Draft","Sent","Paid","Overdue","Void"],t=e.filter(a=>a.status==="Completed"||a.status==="Invoiced");return Array.from({length:Math.max(8,t.length)},(a,u)=>{const l=t[u]||Ce(e),c=(l.laborCost||0)+(l.materialCost||0),o=c*.1;return{id:`inv_${u+1}`,number:`INV-${String(5e4+u+1)}`,jobId:l.id,jobNumber:l.number,customerId:l.customerId,customerName:l.customerName,contactName:l.contactName,status:Ce(s),lineItems:[{description:`${l.title} - Labor`,amount:l.laborCost||Qe(200,4e3)},{description:`${l.title} - Materials`,amount:l.materialCost||Qe(100,3e3)}],subtotal:c,tax:o,total:c+o,invoiceType:"Standard",issueDate:je(60),dueDate:je(-14,30),paidDate:null,notes:"",createdAt:je(60),updatedAt:je(7)}})}function Ns(){return[{id:"fmt_1",name:"Job Safety Analysis (JSA)",description:"Daily safety assessment before starting work.",sections:[{id:"sec_1",title:"Personal Protective Equipment",fields:[{id:"f1",type:"checkbox",label:"Gloves worn?",required:!0},{id:"f2",type:"checkbox",label:"Safety Glasses worn?",required:!0},{id:"f3",type:"checkbox",label:"Steel Cap Boots worn?",required:!0}]},{id:"sec_2",title:"Site Hazards",fields:[{id:"f4",type:"select",label:"Overall Site Risk",options:["Low","Medium","High"],required:!0},{id:"f5",type:"textarea",label:"Identified Hazards",placeholder:"Describe any trip hazards, live wires, etc."}]},{id:"sec_3",title:"Authorization",fields:[{id:"f6",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"fmt_2",name:"Site Assessment",description:"Detailed site inspection and requirements.",sections:[{id:"sec_4",title:"Client Details",fields:[{id:"f7",type:"text",label:"Customer Rep Name"},{id:"f8",type:"date",label:"Inspection Date"}]},{id:"sec_5",title:"Access & Logistics",fields:[{id:"f9",type:"checkbox",label:"Access keys provided?"},{id:"f10",type:"textarea",label:"Parking / Entry Instructions"}]}]}]}function Ps(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((s,t)=>{const a=["Warehouse A","Warehouse B","Main Warehouse","Vehicle - Mark Sullivan","Vehicle - Jake Patterson","Vehicle - Ryan Cooper"],u=Math.floor(Math.random()*2)+2,c=[...a].sort(()=>.5-Math.random()).slice(0,u).map(r=>({location:r,quantity:Math.floor(Math.random()*60)+5})),o=c.reduce((r,d)=>r+d.quantity,0);return{id:`stock_${t+1}`,name:s.name,sku:`SKU-${String(1e3+t)}`,category:s.cat,unit:s.unit,unitPrice:s.price,costPrice:s.price*.6,quantity:o,reorderLevel:Math.floor(Math.random()*20)+5,supplier:Ce(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:c[0].location,locations:c,createdAt:je(365),updatedAt:je(30)}})}function Ms(e){var t,a,u,l,c,o;return[{name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active"},{name:"Isuzu NPR Truck",type:"Vehicle",serial:"REG-888-FF",ownerType:"Business",recoveryRate:45,serviceIntervalMonths:6,currentMeter:12e4,status:"Active"},{name:"Scissor Lift 19ft",type:"Plant & Equipment",serial:"SN-SL-9920",ownerType:"Business",recoveryRate:15,serviceIntervalMonths:3,currentMeter:840,status:"Active"},{name:"Carrier Chiller Unit",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-CH-7721",ownerType:"Customer",customerId:e[0].id,site:(a=(t=e[0].sites)==null?void 0:t[0])==null?void 0:a.name,serviceIntervalMonths:12,currentMeter:15400,status:"Active"},{name:"Daikin Split System",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-DS-4410",ownerType:"Customer",customerId:e[1].id,site:(l=(u=e[1].sites)==null?void 0:u[0])==null?void 0:l.name,serviceIntervalMonths:12,currentMeter:3200,status:"Active"},{name:"Fire Alarm Panel v4",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-FP-2299",ownerType:"Customer",customerId:e[2].id,site:(o=(c=e[2].sites)==null?void 0:c[0])==null?void 0:o.name,serviceIntervalMonths:6,currentMeter:0,status:"Active"}].map((r,d)=>({id:`asset_${d+1}`,...r,logs:[{id:`log_${d}_1`,type:"Service",date:je(90),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]}))}function Ot(){return[{id:"sup_1",name:"ElectraTrade",contactName:"Robert Vance",email:"sales@electratrade.com.au",phone:"03 9822 1045",address:"22 Industrial Parkway, South Melbourne, VIC 3205",category:"Electrical",accountNumber:"FF-ET-10291",paymentTerms:"30 Days",active:!0,notes:"Primary supplier for electrical switchgear, cable, and general conduit fittings.",attachments:[{id:"att_sup_1_1",name:"ElectraTrade_Price_List_2026.pdf",type:"application/pdf",size:1245e3,uploadedAt:"2026-01-10T08:00:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_2",name:"PipeLine Supply",contactName:"Douglas Miller",email:"orders@pipelinesupply.com.au",phone:"03 9544 3300",address:"108 Pipeline Rd, Richmond, VIC 3121",category:"Plumbing",accountNumber:"FF-PL-99401",paymentTerms:"14 Days",active:!0,notes:"Main plumbing merchant. Provides rapid morning deliveries to metro sites.",attachments:[{id:"att_sup_2_1",name:"PipeLine_Product_Brochure.pdf",type:"application/pdf",size:345e4,uploadedAt:"2026-02-15T09:30:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_3",name:"CoolParts Wholesale",contactName:"Amanda Jenkins",email:"amanda@coolparts.com.au",phone:"03 9711 5050",address:"45 Cold Storage Lane, Clayton, VIC 3168",category:"HVAC",accountNumber:"FF-CP-39021",paymentTerms:"30 Days",active:!0,notes:"HVAC compressors, copper coils, ducting components, and split system units.",attachments:[]},{id:"sup_4",name:"SafeGuard Dist.",contactName:"Sarah Conner",email:"wholesale@safeguard.com.au",phone:"03 8990 1200",address:"90 Security Plaza, Collingwood, VIC 3066",category:"Fire Safety",accountNumber:"FF-SG-88301",paymentTerms:"COD",active:!0,notes:"Preferred supplier for smoke alarms, commercial fire panel zone cards, and extinguishers.",attachments:[{id:"att_sup_4_1",name:"SafeGuard_Compliance_Certificate.pdf",type:"application/pdf",size:954e3,uploadedAt:"2026-03-01T10:15:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_5",name:"AllTrade Supplies",contactName:"Kevin Higgins",email:"kevin@alltradesupplies.com.au",phone:"03 9205 6000",address:"15-19 Warehouse Lane, Dandenong, VIC 3175",category:"General",accountNumber:"FF-AT-22340",paymentTerms:"30 Days",active:!0,notes:"Consumables, cable ties, silicone, fasteners, and miscellaneous hand tools.",attachments:[]}]}function _s(e){const s=[];return e.filter(a=>a.status==="Scheduled"||a.status==="In Progress").forEach((a,u)=>{const l=Math.floor(Math.random()*5),c=7+Math.floor(Math.random()*8),o=1+Math.floor(Math.random()*4),r=mt.find(d=>d.id===a.technicianId)||Ce(mt);s.push({id:`sched_${u+1}`,jobId:a.id,jobNumber:a.number,title:a.title,technicianId:r.id,technicianName:r.name,color:r.color,dayOffset:l,startHour:c,endHour:Math.min(c+o,18),customerName:a.customerName,siteAddress:a.siteAddress})}),s}function zs(){var n,m,$,y,x,T,h,k,w,g,E,C;if(p.isSeeded()){const q=p.getAll("jobs");let I=!1;const _=q.map(H=>{let Z=!1;function V(W){const B={...W};return"subPhases"in B?(B.subTasks=(B.subPhases||[]).map(ae=>V(ae)),delete B.subPhases,Z=!0):B.subTasks&&(B.subTasks=B.subTasks.map(ae=>V(ae))),B}const se={...H};return"phases"in se?(se.tasks=(se.phases||[]).map(W=>V(W)),delete se.phases,Z=!0):se.tasks&&(se.tasks=se.tasks.map(W=>V(W))),Z&&(I=!0),se});I&&p.save("jobs",_);const J=p.getAll("taskTemplates");let N=!1;const U=J.map(H=>{let Z=!1;function V(W){const B={...W};return"subPhases"in B?(B.subTasks=(B.subPhases||[]).map(ae=>V(ae)),delete B.subPhases,Z=!0):B.subTasks&&(B.subTasks=B.subTasks.map(ae=>V(ae))),B}const se={...H};return"phases"in se?(se.tasks=(se.phases||[]).map(W=>V(W)),delete se.phases,Z=!0):se.tasks&&(se.tasks=se.tasks.map(W=>V(W))),Z&&(N=!0),se});N&&p.save("taskTemplates",U);const j=p.getAll("jobs");if(j.length>0&&!j[0].tasks){const H=j.map(Z=>{const V=Z.status;return{...Z,tasks:[{id:"p1",name:"Site Preparation",status:V==="Pending"?"Not Started":"Completed",progress:V==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:V==="Pending"?"Not Started":"Completed",progress:V==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:V==="Pending"?"Not Started":"Completed",progress:V==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Project Execution",status:V==="Completed"||V==="Invoiced"?"Completed":V==="In Progress"?"In Progress":"Not Started",progress:V==="Completed"||V==="Invoiced"?100:V==="In Progress"?50:0,estimatedHours:16,people:2,subTasks:[{id:"sp3",name:"Installation",status:V==="Completed"||V==="Invoiced"?"Completed":V==="In Progress"?"In Progress":"Not Started",progress:V==="Completed"||V==="Invoiced"||V==="In Progress"?100:0,estimatedHours:12,people:2},{id:"sp4",name:"Cleanup & Handover",status:V==="Completed"||V==="Invoiced"?"Completed":"Not Started",progress:V==="Completed"||V==="Invoiced"?100:0,estimatedHours:4,people:2}]}]}});p.save("jobs",H)}const P=p.getAll("userTypes");if(!P||P.length===0)Cs();else{P.some(V=>V.id==="ut_office")||(P.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:rt((V,se)=>V==="Settings"?!1:V==="Reports"?se==="view":!(["Invoices","Purchase Orders"].includes(V)&&se==="delete"))}),p.save("userTypes",P));let Z=!1;P.forEach(V=>{V.permissions||(V.permissions=[]),Object.entries(ot).forEach(([se,W])=>{let B=V.permissions.find(ae=>ae.module===se);B||(B={module:se},V.permissions.push(B),Z=!0),W.forEach(({key:ae})=>{B[ae]===void 0&&(V.id==="ut_admin"?B[ae]=!0:V.id==="ut_manager"?se==="Settings"?B[ae]=["view","edit_company","manage_tax"].includes(ae):B[ae]=!0:V.id==="ut_office"?se==="Settings"?B[ae]=!1:se==="Reports"?B[ae]=ae==="view":["Invoices","Purchase Orders","Suppliers"].includes(se)&&ae==="delete"?B[ae]=!1:B[ae]=!0:V.id==="ut_tech"?se==="Dashboard"?B[ae]=ae==="view":se==="Jobs"?B[ae]=["view","manage_tasks","book_time"].includes(ae):se==="Timesheets"?B[ae]=["view_own","create"].includes(ae):se==="Schedule"?B[ae]=["view_own"].includes(ae):B[ae]=!1:B[ae]=!1,Z=!0)})})}),Z&&p.save("userTypes",P)}const D=p.getAll("technicians"),M=p.getAll("userTypes");if(D.length>0&&M.length>0){const H=D[0];M.some(V=>V.id===H.userTypeId)||p.save("technicians",mt)}const L=p.getAll("taskTemplates");(!L||L.length===0)&&p.save("taskTemplates",Rt());const S=p.getAll("contractors"),F=S.some(H=>H.complianceDocs&&H.complianceDocs.length>0);(!S||S.length===0||!F)&&p.save("contractors",Ht());const O=p.getAll("suppliers");(!O||O.length===0)&&p.save("suppliers",Ot());const le=p.getAll("stock");if(le.some(H=>!H.locations||!Array.isArray(H.locations))){const H={};le.forEach(V=>{const se=V.sku||V.name;if(H[se]||(H[se]={...V,locations:V.locations&&Array.isArray(V.locations)?[...V.locations]:[]}),!V.locations||!Array.isArray(V.locations)){const W=V.location||"Main Warehouse",B=parseInt(V.quantity)||0,ae=H[se].locations.find(Q=>Q.location===W);ae?ae.quantity+=B:H[se].locations.push({location:W,quantity:B})}else V.locations.forEach(W=>{const B=H[se].locations.find(ae=>ae.location===W.location);B?B.quantity+=W.quantity:H[se].locations.push({...W})})});const Z=Object.values(H).map(V=>{var se;return V.quantity=V.locations.reduce((W,B)=>W+B.quantity,0),V.location=((se=V.locations[0])==null?void 0:se.location)||"Main Warehouse",V});p.save("stock",Z)}return}const e=Ls(),s=Is(e),t=qs(e),a=Ds(e,t),u=As(a),l=Ps(),c=Ms(e),o=_s(a),r=Ns();p.save("customers",e),p.save("leads",s),p.save("quotes",t),p.save("jobs",a),p.save("invoices",u),p.save("stock",l),p.save("assets",c),p.save("schedule",o),p.save("technicians",mt),p.save("taskTemplates",Rt()),p.save("formTemplates",r),p.save("formInstances",[]),p.save("contractors",Ht()),p.save("suppliers",Ot());const d=new Date,v=q=>q.toString().padStart(2,"0");function b(q){const I=new Date(d);return I.setDate(I.getDate()+q),`${I.getFullYear()}-${v(I.getMonth()+1)}-${v(I.getDate())}`}const i=[{id:"act_1",title:"Follow up on quote approval",type:"follow-up",date:b(0),time:"09:00",duration:15,priority:"high",status:"pending",assignedToId:"tech1",linkedType:"quote",linkedId:((n=t[0])==null?void 0:n.id)||"",linkedLabel:`Quote ${((m=t[0])==null?void 0:m.number)||""}`,notes:"Client requested revised pricing on switchboard section."},{id:"act_2",title:"Site inspection — Docklands",type:"site-visit",date:b(0),time:"13:00",duration:120,priority:"normal",status:"pending",assignedToId:"tech3",linkedType:"job",linkedId:(($=a[0])==null?void 0:$.id)||"",linkedLabel:`Job ${((y=a[0])==null?void 0:y.number)||""}`,notes:"Confirm conduit runs before ceiling close-in."},{id:"act_3",title:"Call supplier re: panel delivery",type:"call",date:b(-1),time:"10:30",duration:10,priority:"normal",status:"completed",assignedToId:"tech2",linkedType:"",linkedId:"",linkedLabel:"",notes:"Confirmed delivery for Friday."},{id:"act_4",title:"Team safety meeting",type:"meeting",date:b(1),time:"07:30",duration:30,priority:"normal",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:"Monthly toolbox talk — fire extinguisher training."},{id:"act_5",title:"Email updated scope to client",type:"email",date:b(0),time:"15:00",duration:15,priority:"low",status:"pending",assignedToId:"tech6",linkedType:"customer",linkedId:((x=e[1])==null?void 0:x.id)||"",linkedLabel:((T=e[1])==null?void 0:T.company)||"",notes:""},{id:"act_6",title:"Chase overdue invoice",type:"call",date:b(-2),time:"11:00",duration:10,priority:"high",status:"pending",assignedToId:"tech6",linkedType:"invoice",linkedId:((h=u[0])==null?void 0:h.id)||"",linkedLabel:`Invoice ${((k=u[0])==null?void 0:k.number)||""}`,notes:"60 days overdue. Escalate if no response."},{id:"act_7",title:"Pre-start meeting with builder",type:"meeting",date:b(2),time:"08:00",duration:60,priority:"normal",status:"pending",assignedToId:"tech2",linkedType:"job",linkedId:((w=a[1])==null?void 0:w.id)||"",linkedLabel:`Job ${((g=a[1])==null?void 0:g.number)||""}`,notes:"Coordinate access and power isolation with site foreman."},{id:"act_8",title:"Order fire panel spares",type:"task",date:b(1),time:"",duration:0,priority:"normal",status:"pending",assignedToId:"tech4",linkedType:"",linkedId:"",linkedLabel:"",notes:"Need 3x zone cards and 1x PSU."},{id:"act_9",title:"Review apprentice logbook",type:"task",date:b(3),time:"",duration:0,priority:"low",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:""},{id:"act_10",title:"Warranty follow-up call",type:"call",date:b(-3),time:"14:00",duration:15,priority:"normal",status:"completed",assignedToId:"tech5",linkedType:"customer",linkedId:((E=e[2])==null?void 0:E.id)||"",linkedLabel:((C=e[2])==null?void 0:C.company)||"",notes:"Issue resolved. Replacement sensor installed."}];p.save("activities",i),p.markSeeded()}const js=[{section:"MAIN"},{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{section:"WORKFLOW"},{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"},{section:"RESOURCES"},{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"suppliers",icon:"local_shipping",label:"Suppliers",path:"/suppliers"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"},{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{section:"ANALYTICS"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{section:"SYSTEM"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}];function Xt(){const e=document.createElement("aside");e.className="sidebar",e.id="sidebar";const s=localStorage.getItem("simpro_sidebar_expanded")==="true";s&&e.classList.add("expanded");const t=p.getSettings();let u=`
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
  `;JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),js.forEach(i=>{i.section?u+=`<div class="sidebar-section-label" data-section="${i.section}">${i.section}</div>`:u+=`
        <button class="sidebar-nav-item" data-path="${i.path}" data-id="${i.id}" id="nav-${i.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${i.icon}</span></span>
          <span class="nav-label">${i.label}</span>
        </button>
      `}),u+=`
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
  `,e.innerHTML=u,e.addEventListener("click",i=>{const n=i.target.closest(".sidebar-nav-item");if(n&&n.id!=="btn-logout"){const m=n.dataset.path;m&&R.navigate(m)}}),e.querySelector("#sidebar-logo").addEventListener("click",()=>R.navigate("/")),e.querySelector("#sidebar-toggle").addEventListener("click",()=>Hs(e));const o=e.querySelector("#sidebar-nav"),r=e.querySelector("#sidebar-scroll-up"),d=e.querySelector("#sidebar-scroll-down"),v=()=>{if(e.classList.contains("expanded")){r.classList.remove("visible"),d.classList.remove("visible");return}const{scrollTop:i,scrollHeight:n,clientHeight:m}=o;r.classList.toggle("visible",i>0),d.classList.toggle("visible",Math.ceil(i+m)<n)};o.addEventListener("scroll",v),r.addEventListener("click",()=>{o.scrollBy({top:-100,behavior:"smooth"})}),d.addEventListener("click",()=>{o.scrollBy({top:100,behavior:"smooth"})}),setTimeout(v,100);const b=e.querySelector("#btn-logout");return b&&b.addEventListener("click",i=>{i.stopPropagation(),window.dispatchEvent(new CustomEvent("fieldforge-logout"))}),window.addEventListener("simpro-settings-updated",()=>{const i=p.getSettings(),n=e.querySelector("#sidebar-logo");i.logo?n.innerHTML=`
        <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
          <img src="${i.logo}" class="custom-logo" style="max-height: 28px; max-width: ${e.classList.contains("expanded")?"140px":"32px"}; object-fit: contain;" />
          <span class="logo-text" style="${e.classList.contains("expanded")?"display: block;":"display: none;"}">${i.name||"FieldForge"}</span>
        </div>
      `:n.innerHTML=`
        <div class="logo-icon">F</div>
        <span class="logo-text">FieldForge</span>
      `}),e}function Fs(e){const s=e||document.getElementById("sidebar");if(!s)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');if(t.role==="customer")s.style.display="none";else{s.style.display="";let a=null;if(t.userTypeId){const o=p.getById("userTypes",t.userTypeId);o&&o.permissions&&(a=o.permissions)}s.querySelectorAll(".sidebar-nav-item").forEach(o=>{if(o.id==="btn-logout"){o.style.display="";return}const r=o.querySelector(".nav-label");if(!r)return;const d=r.textContent.trim();if(t.role==="admin"){o.style.display="";return}if(a){const v=a.find(i=>i.module===d);v&&Object.entries(v).some(([i,n])=>i!=="module"&&n===!0)||d==="Notifications"||d==="Dashboard"?o.style.display="":o.style.display="none"}else(d==="Settings"||d==="Reports"||d==="Invoices")&&(o.style.display="none")}),s.querySelectorAll(".sidebar-section-label").forEach(o=>{let r=!1,d=o.nextElementSibling;for(;d&&d.classList.contains("sidebar-nav-item");){if(d.style.display!=="none"){r=!0;break}d=d.nextElementSibling}o.style.display=r?"":"none"});const u=s.querySelector("#sidebar-nav"),l=s.querySelector("#sidebar-scroll-up"),c=s.querySelector("#sidebar-scroll-down");if(u&&l&&c&&!s.classList.contains("expanded")){const{scrollTop:o,scrollHeight:r,clientHeight:d}=u;l.classList.toggle("visible",o>0),c.classList.toggle("visible",Math.ceil(o+d)<r)}}}function Hs(e){e.classList.toggle("expanded");const s=e.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",s);const t=e.querySelector("#sidebar-toggle-icon");t.textContent=s?"chevron_left":"chevron_right";const a=e.querySelector(".custom-logo"),u=e.querySelector(".logo-text");a&&(a.style.maxWidth=s?"140px":"32px"),u&&(u.style.display=s?"block":"none");const l=e.querySelector("#sidebar-nav"),c=e.querySelector("#sidebar-scroll-up"),o=e.querySelector("#sidebar-scroll-down");if(l&&c&&o)if(s)c.classList.remove("visible"),o.classList.remove("visible");else{const{scrollTop:r,scrollHeight:d,clientHeight:v}=l;c.classList.toggle("visible",r>0),o.classList.toggle("visible",Math.ceil(r+v)<d)}}function Zt(e){const s=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(t=>{t.classList.toggle("active",t.dataset.path===s)})}const Bt=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:Xt,updateSidebarAccess:Fs,updateSidebarActive:Zt},Symbol.toStringTag,{value:"Module"}));function es(){const e=document.createElement("header");e.className="topbar",e.id="topbar",e.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${ss()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const s=e.querySelector("#global-search");let t;s.addEventListener("input",o=>{clearTimeout(t),t=setTimeout(()=>{const r=o.target.value.trim();r.length>=2?Os(r):wt()},300)}),s.addEventListener("blur",()=>{setTimeout(wt,200)}),e.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const r=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",r),localStorage.setItem("simpro_theme",r),e.querySelector("#theme-icon").textContent=r==="dark"?"light_mode":"dark_mode"}),Bs();const u=e.querySelector("#btn-notifications"),l=e.querySelector(".notification-dot");function c(){p.getAll("notifications").filter(d=>!d.read).length>0?l.style.display="block":l.style.display="none"}return p.on("notifications",c),c(),u.addEventListener("click",o=>{o.stopPropagation(),Rs(u)}),ts(e),e}function ts(e){const s=e||document.getElementById("topbar");if(!s)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),a=s.querySelector("#topbar-name"),u=s.querySelector("#topbar-role"),l=s.querySelector("#topbar-avatar");if(a&&(a.textContent=t.name||"Unknown User"),u){let c=t.userTypeName;if(!c&&t.userTypeId){const o=p.getById("userTypes",t.userTypeId);o&&(c=o.name)}c||(c={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[t.role]||t.role),u.textContent=c}if(l){const o=(t.name||"").split(" ").map(r=>r[0]).join("").substring(0,2).toUpperCase()||"U";l.textContent=o}}function Rs(e){let s=document.querySelector("#notifications-dropdown");if(s){s.remove();return}const t=p.getAll("notifications").sort((c,o)=>new Date(o.createdAt)-new Date(c.createdAt));s=document.createElement("div"),s.className="dropdown-menu",s.id="notifications-dropdown",s.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const a=document.createElement("div");a.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",a.innerHTML='<h4 style="margin:0">Notifications</h4>';const u=document.createElement("button");u.className="btn btn-ghost btn-sm",u.textContent="Mark all as read",u.onclick=()=>{const c=p.getAll("notifications");let o=!1;c.forEach(r=>{r.read||(r.read=!0,r.updatedAt=new Date().toISOString(),o=!0)}),o&&p.save("notifications",c),s.remove()},a.appendChild(u),s.appendChild(a),t.length===0?s.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':t.forEach(c=>{const o=document.createElement("div");o.className="dropdown-item",o.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${c.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,o.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${c.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${c.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(c.createdAt).toLocaleString()}</div>
        </div>
      `,o.addEventListener("click",()=>{if(p.update("notifications",c.id,{read:!0}),c.link){const{router:r}=window.__fieldForge||{};r&&r.navigate(c.link)}s.remove()}),s.appendChild(o)}),e.parentNode.style.position="relative",e.parentNode.appendChild(s);const l=c=>{!s.contains(c.target)&&c.target!==e&&!e.contains(c.target)&&(s.remove(),document.removeEventListener("click",l))};document.addEventListener("click",l)}function Os(e){wt();const{store:s}=window.__fieldForge||{};if(!s)return;const t=[],a=e.toLowerCase();if(s.getAll("customers").forEach(l=>{(l.company.toLowerCase().includes(a)||`${l.firstName} ${l.lastName}`.toLowerCase().includes(a))&&t.push({type:"Customer",label:l.company,icon:"people",path:`/people/${l.id}`})}),s.getAll("jobs").forEach(l=>{(l.number.toLowerCase().includes(a)||l.title.toLowerCase().includes(a)||l.customerName.toLowerCase().includes(a))&&t.push({type:"Job",label:`${l.number} — ${l.title}`,icon:"build",path:`/jobs/${l.id}`})}),s.getAll("quotes").forEach(l=>{var c;(l.number.toLowerCase().includes(a)||(c=l.title)!=null&&c.toLowerCase().includes(a)||l.customerName.toLowerCase().includes(a))&&t.push({type:"Quote",label:`${l.number} — ${l.customerName}`,icon:"request_quote",path:`/quotes/${l.id}`})}),s.getAll("invoices").forEach(l=>{(l.number.toLowerCase().includes(a)||l.customerName.toLowerCase().includes(a))&&t.push({type:"Invoice",label:`${l.number} — ${l.customerName}`,icon:"receipt_long",path:`/invoices/${l.id}`})}),t.length===0)return;const u=document.createElement("div");u.className="dropdown-menu",u.id="search-results",u.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",t.slice(0,12).forEach(l=>{const c=document.createElement("button");c.className="dropdown-item",c.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${l.icon}</span>
      <span style="flex:1" class="truncate">${l.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${l.type}</span>
    `,c.addEventListener("click",()=>{const{router:o}=window.__fieldForge||{};o&&o.navigate(l.path),wt(),document.querySelector("#global-search").value=""}),u.appendChild(c)}),document.querySelector(".topbar-search").appendChild(u)}function wt(){const e=document.querySelector("#search-results");e&&e.remove()}function ss(){return localStorage.getItem("simpro_theme")||"light"}function Bs(){ss()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const Jt=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:es,updateTopbarAccess:ts},Symbol.toStringTag,{value:"Module"})),Js={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function Us(e){const s=document.getElementById("breadcrumb");if(!s)return;if(e==="/"){s.style.display="none";return}s.style.display="flex";const t=e.split("/").filter(Boolean);let a=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,u="";t.forEach((l,c)=>{u+="/"+l;const o=c===t.length-1,r=Js[u]||decodeURIComponent(l);a+='<span class="breadcrumb-separator">›</span>',o?a+=`<span class="breadcrumb-item current">${r}</span>`:a+=`<span class="breadcrumb-item" data-path="${u}">${r}</span>`}),s.innerHTML=a,s.querySelectorAll(".breadcrumb-item[data-path]").forEach(l=>{l.addEventListener("click",()=>{const{router:c}=window.__fieldForge||{};c&&c.navigate(l.dataset.path)})})}function Ge(e){const s=document.getElementById("breadcrumb");if(!s)return;const t=s.querySelector(".breadcrumb-item.current");t&&(t.textContent=e)}const Vs="modulepreload",Ws=function(e){return"/"+e},Ut={},ve=function(s,t,a){let u=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),o=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));u=Promise.allSettled(t.map(r=>{if(r=Ws(r),r in Ut)return;Ut[r]=!0;const d=r.endsWith(".css"),v=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${v}`))return;const b=document.createElement("link");if(b.rel=d?"stylesheet":Vs,d||(b.as="script"),b.crossOrigin="",b.href=r,o&&b.setAttribute("nonce",o),document.head.appendChild(b),d)return new Promise((i,n)=>{b.addEventListener("load",i),b.addEventListener("error",()=>n(new Error(`Unable to preload CSS for ${r}`)))})}))}function l(c){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=c,window.dispatchEvent(o),!o.defaultPrevented)throw c}return u.then(c=>{for(const o of c||[])o.status==="rejected"&&l(o.reason);return s().catch(l)})};function Ct(e,s){if(!e||e<=0)return 0;const t=s.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]};let a=t.defaultPercent||30;if(t.useTiers&&t.tiers&&t.tiers.length>0){const c=t.tiers.find(o=>o.upTo===null||e<=o.upTo);c&&(a=c.percent)}const u=e*(a/100),l=Math.max(u,t.minMarkupAmount||0);return e+l}function as(e,s){return e.reduce((t,a)=>{const u=Ct(a.unitCost||0,s);return t+u*(a.quantity||1)},0)}function qt(){const e=Te("Jobs","create"),s=Te("Quotes","create");let t="";return e&&(t+=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>`),s&&(t+=`
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`),t}let We=!1;const dt={S:"module-s",M:"module-m",L:"module-l",XL:"module-xl"},ct={standard:"",tall:"module-tall",xtall:"module-xtall"};function kt(){const e=JSON.parse(localStorage.getItem("currentUser")||"null");return e?`dashboardLayout_v2_${e.id}`:"dashboardLayout_v2"}const St={"kpi-cards":{title:"KPI Cards",defaultW:"XL",defaultH:"standard",widths:["M","L","XL"],heights:["standard"],kpiStrip:!0,render:Ks},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Xs},"tech-map":{title:"Technician Map",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Zs},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:ea},"recent-leads":{title:"Recent Leads",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:ta},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:sa},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:oa},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Fe("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Fe("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>Fe("inventory","Inventory looks good")},"profitability-chart":{title:"Projected Profitability",defaultW:"L",defaultH:"tall",widths:["L","XL"],heights:["tall","xtall"],render:ia},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Fe("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Fe("schedule","No timesheet alerts")},"asset-status":{title:"Asset Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Fe("precision_manufacturing","All assets operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Fe("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Fe("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>Fe("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Fe("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>Fe("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Fe("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>Fe("wb_sunny","Sunny, 24°C")}},os=[{id:"kpi-cards",w:"XL",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"M",h:"tall"},{id:"recent-leads",w:"M",h:"tall"},{id:"cash-flow",w:"M",h:"standard"}];function Fe(e,s){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${e}</span>
    <span style="font-size:13px;">${s}</span>
  </div>`}function Qs(e){let s=JSON.parse(JSON.stringify(os));try{const u=localStorage.getItem(kt());u&&(s=JSON.parse(u))}catch{}s.forEach(u=>{u.instanceId||(u.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const t={jobs:p.getAll("jobs"),quotes:p.getAll("quotes"),invoices:p.getAll("invoices"),leads:p.getAll("leads"),people:p.getAll("people")};e.innerHTML=`
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          ${qt()}
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;const a=e.querySelector("#dashboard-grid");Ye(a,s,t),e.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{We=!0,Ye(a,s,t),Ys(e,a,s,t)})}function Ye(e,s,t){e.innerHTML="",s.forEach(a=>{const u=St[a.id];if(!u)return;const l=dt[a.w]||"module-m",c=ct[a.h]||"",o=["dashboard-module",l,c,We?"edit-mode":""].filter(Boolean).join(" "),r=u.widths.length>1,d=u.heights.length>1,v=We?`
      ${r?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${d?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${r&&d?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",b=`
      <div style="display:flex;align-items:center;gap:4px;">
        ${u.configurable?`
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${a.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${We?"":"opacity:0.5;"}">settings</span>
          </button>
        `:""}
        ${We?`
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${a.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>
        `:""}
      </div>`,i=We?"background:rgba(27,109,224,0.04);":"";e.insertAdjacentHTML("beforeend",`
      <div class="${o}" data-instance-id="${a.instanceId}" data-id="${a.id}" style="position:relative;">
        <div class="card ${u.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${i}">
            <span style="font-weight:600;font-size:14px;">${u.title}</span>
            ${b}
          </div>
          <div class="card-body">${u.render(t,a)}</div>
        </div>
        ${v}
      </div>`)}),Gs(e,s,t),We&&Dt(e,s,t)}function Gs(e,s,t){e.querySelectorAll(".btn-configure").forEach(a=>{a.addEventListener("click",u=>{const l=u.currentTarget.dataset.instanceId,c=s.find(r=>r.instanceId===l);if(c&&c.id==="pinned-job"){let v=function(b=""){const i=d.querySelector("#job-list-container"),n=r.filter(m=>m.number.toLowerCase().includes(b.toLowerCase())||m.title.toLowerCase().includes(b.toLowerCase())||m.customerName.toLowerCase().includes(b.toLowerCase()));i.innerHTML=n.length>0?n.map(m=>`
            <div class="job-option" data-job-id="${m.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${m.number} - ${m.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${m.customerName}</div>
            </div>
          `).join(""):'<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>',i.querySelectorAll(".job-option").forEach(m=>{m.addEventListener("click",()=>{var $;c.config={...c.config,jobId:m.dataset.jobId},We||localStorage.setItem(kt(),JSON.stringify(s)),($=document.querySelector(".modal-overlay"))==null||$.remove(),Ye(e,s,t)})})};var o=v;const r=t.jobs,d=document.createElement("div");d.innerHTML=`
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..." 
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            <!-- Jobs will be rendered here -->
          </div>
        `,v(),d.querySelector("#job-search").addEventListener("input",b=>{v(b.target.value)}),ve(async()=>{const{showModal:b}=await Promise.resolve().then(()=>ze);return{showModal:b}},void 0).then(({showModal:b})=>{b({title:"Select Job to Pin",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()}]})})}})})}function Dt(e,s,t){e.querySelectorAll(".btn-remove").forEach(a=>{a.addEventListener("click",u=>{const l=u.currentTarget.dataset.instanceId,c=s.findIndex(o=>o.instanceId===l);c!==-1&&(s.splice(c,1),Ye(e,s,t))})}),window.Sortable&&!e.sortableInstance&&(e.sortableInstance=new window.Sortable(e,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const a=Array.from(e.children).map(l=>l.dataset.instanceId),u=[];a.forEach(l=>{const c=s.find(o=>o.instanceId===l);c&&u.push(c)}),s.splice(0,s.length,...u)}})),e.sortableInstance&&e.sortableInstance.option("disabled",!1),e.querySelectorAll(".resize-handle").forEach(a=>{a.addEventListener("mousedown",u=>{u.preventDefault(),u.stopPropagation();const l=u.target.closest(".dashboard-module"),c=l.dataset.instanceId,o=s.find(w=>w.instanceId===c),r=St[o==null?void 0:o.id];if(!o||!r)return;const d=u.target.closest(".resize-handle"),v=d&&(d.classList.contains("resize-r")||d.classList.contains("resize-br")),b=d&&(d.classList.contains("resize-b")||d.classList.contains("resize-br"));let i=u.clientX,n=u.clientY,m=0,$=0;const y=60,x=["S","M","L","XL"].filter(w=>r.widths.includes(w)),T=["standard","tall","xtall"].filter(w=>r.heights.includes(w));function h(w){if(v){if(m+=w.clientX-i,m>y){let g=x.indexOf(o.w);g<x.length-1&&(o.w=x[g+1],l.className=["dashboard-module",dt[o.w]||"module-m",ct[o.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}else if(m<-y){let g=x.indexOf(o.w);g>0&&(o.w=x[g-1],l.className=["dashboard-module",dt[o.w]||"module-m",ct[o.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}}if(b){if($+=w.clientY-n,$>y){let g=T.indexOf(o.h);g<T.length-1&&(o.h=T[g+1],l.className=["dashboard-module",dt[o.w]||"module-m",ct[o.h]||"","edit-mode"].filter(Boolean).join(" ")),$=0}else if($<-y){let g=T.indexOf(o.h);g>0&&(o.h=T[g-1],l.className=["dashboard-module",dt[o.w]||"module-m",ct[o.h]||"","edit-mode"].filter(Boolean).join(" ")),$=0}}i=w.clientX,n=w.clientY}function k(){document.removeEventListener("mousemove",h),document.removeEventListener("mouseup",k),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",h),document.addEventListener("mouseup",k),document.body.style.cursor=window.getComputedStyle(u.target).cursor,document.body.style.userSelect="none"})})}function Ys(e,s,t,a){const u=e.querySelector("#dashboard-header-actions"),l=e.querySelector("#btn-edit-dashboard");l.style.display="none",u.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,u.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(t.splice(0,t.length,...JSON.parse(JSON.stringify(os))),Ye(s,t,a),Dt(s,t,a))}),u.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(kt(),JSON.stringify(t)),We=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),l.style.display="",u.innerHTML=qt(),Ye(s,t,a)}),u.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const c=localStorage.getItem(kt());c&&t.splice(0,t.length,...JSON.parse(c))}catch{}We=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),l.style.display="",u.innerHTML=qt(),Ye(s,t,a)}),u.querySelector("#btn-add-widget").addEventListener("click",()=>{const c=Object.entries(St),o=document.createElement("div");o.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${c.map(([r,d])=>`
            <div data-id="${r}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${d.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${d.defaultW} · ${d.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,ve(async()=>{const{showModal:r}=await Promise.resolve().then(()=>ze);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:"Add Widget",content:o,actions:[{label:"Close",className:"btn-secondary",onClick:d=>d()}]}),o.querySelectorAll("[data-id]").forEach(d=>{d.addEventListener("click",v=>{var n;const b=v.currentTarget.dataset.id,i=St[b];t.push({id:b,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:i.defaultW,h:i.defaultH}),(n=document.querySelector(".modal-overlay"))==null||n.remove(),Ye(s,t,a),Dt(s,t,a)})})})})}function Ks(e,s){const t=e.jobs.filter(c=>c.status==="In Progress"||c.status==="Scheduled").length,a=e.quotes.filter(c=>c.status==="Sent"||c.status==="Draft").length,u=e.invoices.filter(c=>c.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+e.invoices.filter(c=>c.status==="Paid").reduce((c,o)=>c+(o.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:t,icon:"build",color:"green",sub:`${e.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:a,icon:"request_quote",color:"orange",sub:`${e.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:u,icon:"warning",color:"red",sub:u>0?"Requires attention":"All on track",pos:u===0}].map(c=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${c.label}</div>
        <div class="stat-icon ${c.color}"><span class="material-icons-outlined">${c.icon}</span></div>
      </div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-change ${c.pos===!0?"positive":c.pos===!1?"negative":""}">
        <span style="font-size:12px;">${c.sub}</span>
      </div>
    </div>`).join("")}function Xs(e,s){const t={};e.jobs.forEach(l=>{t[l.status]=(t[l.status]||0)+1});const a=e.jobs.length||1,u={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(t).map(([l,c])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${l}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(c/a*100).toFixed(1)}%;height:100%;background:${u[l]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${c>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${c}</span>
      </div>`).join("")}
  </div>`}function Zs(e,s){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${e.people.filter(u=>u.type==="Staff").slice(0,4).map((u,l)=>{const c=15+l*22+Math.sin(l)*12,o=15+l*18+Math.cos(l)*18;return`<div style="position:absolute;top:${c}%;left:${o}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${u.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${u.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function ea(e,s){const t=[];return e.jobs.slice(0,4).forEach(a=>t.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${a.number}</strong> — ${a.title}`,sub:a.customerName,time:a.updatedAt})),e.quotes.slice(0,3).forEach(a=>t.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${a.number}</strong> ${a.status.toLowerCase()}`,sub:a.customerName,time:a.updatedAt})),e.invoices.slice(0,2).forEach(a=>t.push({icon:"receipt_long",color:a.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${a.number}</strong> — ${a.status}`,sub:a.customerName,time:a.updatedAt})),t.sort((a,u)=>new Date(u.time)-new Date(a.time)),t.map(a=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${a.color}20;color:${a.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${a.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${a.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.sub} · ${aa(a.time)}</div>
      </div>
    </div>`).join("")}function ta(e,s){const t={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${e.leads.slice(0,8).map(a=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${a.id}'">
        <td class="cell-link font-medium">${a.title}</td>
        <td style="color:var(--text-secondary);">${a.customerName}</td>
        <td><span class="badge ${t[a.status]||"badge-neutral"}">${a.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function sa(e,s){const t=e.jobs.filter(a=>a.status==="Scheduled"||a.status==="In Progress").slice(0,8);return t.length?t.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${a.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${a.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${a.technicianName} · ${a.customerName}</div>
      </div>
      <span class="badge ${a.status==="In Progress"?"badge-primary":"badge-warning"}">${a.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function aa(e){const s=Math.floor((Date.now()-new Date(e))/6e4);if(s<60)return`${s}m ago`;const t=Math.floor(s/60);return t<24?`${t}h ago`:`${Math.floor(t/24)}d ago`}function oa(e,s){var d;const t=(d=s.config)==null?void 0:d.jobId;if(!t)return Fe("push_pin","Click settings to pin a job");const a=e.jobs.find(v=>v.id===t);if(!a)return Fe("warning","Job not found");function u(v,b=0){let i=[];return v&&v.forEach(n=>{const m=n.subTasks&&n.subTasks.length>0||n.subPhases&&n.subPhases.length>0;i.push({...n,depth:b,isParent:m}),m&&(i=i.concat(u(n.subTasks||n.subPhases,b+1)))}),i}const l=a.tasks||a.phases||[],c=u(l),o=c.length;let r=0;if(l.length>0){const v=l.reduce((b,i)=>b+(i.progress||0),0);r=Math.round(v/l.length)}return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${a.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${r}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${r}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${o>0?c.map(v=>{const b=v.progress===100;return`
          <div style="display:flex;align-items:center;gap:8px;padding-left:${v.depth*14}px; opacity:${!v.isParent&&b?.6:1}">
            ${v.isParent?'<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>':`<span class="material-icons-outlined" style="font-size:16px;color:${b?"var(--color-success)":"var(--text-tertiary)"};">
                ${b?"check_circle":"radio_button_unchecked"}
              </span>`}
            <span style="font-size:12px;font-weight:${v.isParent?"700":"400"};text-decoration:${!v.isParent&&b?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${v.isParent?"var(--text-primary)":"var(--text-secondary)"};">
              ${v.name}
            </span>
            ${v.isParent?`<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);">${v.progress}%</span>`:""}
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
  `}function ia(e,s){const t=p.getSettings(),a=e.jobs.filter(r=>r.status!=="Invoiced"&&r.status!=="Archived");let u=0,l=0;a.forEach(r=>{const d=(r.materials||[]).reduce(($,y)=>$+y.quantity*(y.unitCost||0),0),v=r.laborCost||0;u+=d+v;const b=as(r.materials||[],t),i=t.laborRates.find($=>$.id===r.laborRateProfileId)||t.laborRates.find($=>$.isDefault),n=r.estimatedHours||0,m=Math.max(n*((i==null?void 0:i.rate)||85),(i==null?void 0:i.minCallOutFee)||0);l+=b+m});const c=l-u,o=l>0?c/l*100:0;return`
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${l.toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
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
            <span style="font-weight:600; color:var(--color-success);">+$${c.toLocaleString("en-AU",{minimumFractionDigits:2})}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(o,100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-primary);"></div>
            <span style="color:var(--text-secondary); flex:1;">Internal Costs (Labor + Mat)</span>
            <span style="font-weight:500;">$${u.toLocaleString()}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-success);"></div>
            <span style="color:var(--text-secondary); flex:1;">Tiered Markup (Proj. Profit)</span>
            <span style="font-weight:500;">$${c.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${a.length} active jobs using tiered material markups.
      </div>
    </div>
  `}function f(e){return e==null?"":String(e).replace(/[&<>"']/g,function(t){switch(t){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return t}})}function He({columns:e,data:s,onRowClick:t,getId:a,emptyMessage:u="No records found",emptyIcon:l="inbox",selectable:c=!1,onSelectionChange:o=null}){const r=document.createElement("div");r.className="card";let d=null,v="asc",b=1;const i=15,n=new Set;function m(){o&&o(Array.from(n))}function $(){let y=[...s];d&&y.sort((w,g)=>{const E=d.getValue?d.getValue(w):w[d.key],C=d.getValue?d.getValue(g):g[d.key];return E==null?1:C==null?-1:typeof E=="string"?v==="asc"?E.localeCompare(C):C.localeCompare(E):v==="asc"?E-C:C-E});const x=Math.ceil(y.length/i);b>x&&(b=x||1);const T=(b-1)*i,h=y.slice(T,T+i);if(s.length===0){r.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${f(l)}</span>
          <h3>${f(u)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let k='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(c){const w=h.length>0&&h.every(g=>n.has(String(a?a(g):g.id)));k+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${w?"checked":""}></th>`}if(e.forEach(w=>{const g=d&&d.key===w.key,E=g?" sorted":"",C=g?v==="asc"?"arrow_upward":"arrow_downward":"unfold_more";k+=`<th class="${E}" data-key="${w.key}" style="${w.width?"width:"+w.width:""}">
        ${f(w.label)}
        <span class="material-icons-outlined sort-icon">${C}</span>
      </th>`}),k+="</tr></thead><tbody>",h.forEach(w=>{const g=String(a?a(w):w.id),E=n.has(g);k+=`<tr data-id="${f(g)}" style="cursor:pointer" class="${E?"selected-row":""}">`,c&&(k+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${f(g)}" ${E?"checked":""}>
        </td>`),e.forEach(C=>{const q=C.render?C.render(w):f(w[C.key]??"");k+=`<td>${q}</td>`}),k+="</tr>"}),k+="</tbody></table></div>",x>1){k+=`<div class="pagination">
        <span class="pagination-info">Showing ${T+1}–${Math.min(T+i,y.length)} of ${y.length}</span>
        <div class="pagination-controls">
          <button ${b===1?"disabled":""} data-page="prev">‹</button>`;for(let w=1;w<=x;w++){if(x>7&&w>2&&w<x-1&&Math.abs(w-b)>1){(w===3||w===x-2)&&(k+="<button disabled>…</button>");continue}k+=`<button class="${w===b?"page-active":""}" data-page="${w}">${w}</button>`}k+=`<button ${b===x?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(r.innerHTML=k,r.querySelectorAll("th[data-key]").forEach(w=>{w.addEventListener("click",()=>{const g=e.find(E=>E.key===w.dataset.key);d===g?v=v==="asc"?"desc":"asc":(d=g,v="asc"),$()})}),t&&r.querySelectorAll("tbody tr[data-id]").forEach(w=>{w.addEventListener("click",g=>{g.target.closest(".dt-select-cell")||t(w.dataset.id)})}),c){r.querySelectorAll(".dt-select-row").forEach(g=>{g.addEventListener("change",E=>{E.target.checked?n.add(E.target.value):n.delete(E.target.value),m(),$()})});const w=r.querySelector(".dt-select-all");w&&w.addEventListener("change",g=>{const E=g.target.checked;h.forEach(C=>{const q=String(a?a(C):C.id);E?n.add(q):n.delete(q)}),m(),$()})}r.querySelectorAll(".pagination-controls button[data-page]").forEach(w=>{w.addEventListener("click",()=>{const g=w.dataset.page;g==="prev"?b--:g==="next"?b++:b=parseInt(g),$()})})}return $(),r.updateData=y=>{s=y,$()},r.clearSelection=()=>{n.clear(),m(),$()},r}let Ze=null;function na(){return(!Ze||!document.body.contains(Ze))&&(Ze=document.createElement("div"),Ze.className="toast-container",Ze.id="toast-container",document.body.appendChild(Ze)),Ze}function A(e,s="info",t=3500){const a=na(),u=document.createElement("div");u.className=`toast ${s}`;const l={success:"check_circle",error:"error",warning:"warning",info:"info"};u.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${s==="error"?"danger":s})">${l[s]||l.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${e}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,u.querySelector(".toast-close").addEventListener("click",()=>u.remove()),a.appendChild(u),setTimeout(()=>{u.parentNode&&(u.style.opacity="0",u.style.transform="translateX(20px)",u.style.transition="0.3s ease",setTimeout(()=>u.remove(),300))},t)}function la(e,s,t){p.create("notifications",{title:e,message:s,link:t,read:!1}),A(`${e}: ${s}`,"info")}const De=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:la,showToast:A},Symbol.toStringTag,{value:"Module"}));function Je({container:e,selectedIds:s,actions:t,onClear:a}){const u=e.querySelector(".bulk-action-bar");if(u&&u.remove(),!s||s.length===0)return;const l=document.createElement("div");l.className="bulk-action-bar slide-up";let c=`
    <div class="bulk-action-left">
      <span class="bulk-count">${s.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return t.forEach((o,r)=>{c+=`<button class="btn ${o.className||"btn-secondary"} btn-sm" data-action="${r}">
      ${o.icon?`<span class="material-icons-outlined" style="font-size:16px">${f(o.icon)}</span> `:""}
      ${f(o.label)}
    </button>`}),c+="</div>",l.innerHTML=c,l.querySelector("#btn-clear-selection").addEventListener("click",()=>{a&&a()}),l.querySelectorAll("button[data-action]").forEach(o=>{o.addEventListener("click",()=>{const r=o.dataset.action;t[r]&&t[r].onClick&&t[r].onClick(s)})}),e.appendChild(l),l}function At(e){const s=p.getAll("customers");e.innerHTML=`
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
        <button class="toolbar-filter" data-filter="Active">Active (${s.filter(l=>l.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${s.filter(l=>l.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let t=[...s];const u=He({columns:[{key:"company",label:"Company / Name",render:l=>`<span class="cell-link font-medium">${f(l.company)}</span>`},{key:"contact",label:"Contact",render:l=>`${f(l.firstName)} ${f(l.lastName)}`},{key:"email",label:"Email",render:l=>`<span class="text-secondary">${f(l.email)}</span>`},{key:"phone",label:"Phone",render:l=>`<span class="text-secondary">${f(l.phone)}</span>`},{key:"type",label:"Type",render:l=>`<span class="badge badge-neutral">${f(l.type)}</span>`},{key:"status",label:"Status",render:l=>`<span class="badge ${l.status==="Active"?"badge-success":"badge-neutral"}">${f(l.status)}</span>`}],data:t,onRowClick:l=>R.navigate(`/people/${l}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:l=>{Je({container:e,selectedIds:l,onClear:()=>u.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:c=>{const o=document.createElement("div");o.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:r}=await Promise.resolve().then(()=>ze);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:`Update ${c.length} Customers`,content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const v=o.querySelector("#bulk-status").value;c.forEach(b=>p.update("customers",b,{status:v})),u.clearSelection(),At(e),A(`Updated ${c.length} customers to ${v}`,"success"),d()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:c=>{ve(async()=>{const{showModal:o}=await Promise.resolve().then(()=>ze);return{showModal:o}},void 0).then(({showModal:o})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${c.length} customers? This cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{c.forEach(v=>p.delete("customers",v)),u.clearSelection(),At(e),A(`Deleted ${c.length} customers`,"success"),d()}}]})})}}]})}});e.querySelector("#people-table-container").appendChild(u),e.querySelector("#btn-new-person").addEventListener("click",()=>{R.navigate("/people/new")}),e.querySelector("#btn-export-people").addEventListener("click",()=>{A("Customer data exported successfully","success")}),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),l.classList.add("active");const c=l.dataset.filter;t=c==="all"?[...s]:s.filter(o=>o.status===c),u.updateData(t)})}),e.querySelector("#people-search").addEventListener("input",l=>{var r;const c=l.target.value.toLowerCase();t=s.filter(d=>d.company.toLowerCase().includes(c)||`${d.firstName} ${d.lastName}`.toLowerCase().includes(c)||d.email.toLowerCase().includes(c));const o=(r=e.querySelector(".toolbar-filter.active"))==null?void 0:r.dataset.filter;o&&o!=="all"&&(t=t.filter(d=>d.status===o)),u.updateData(t)})}function $e({title:e,content:s,size:t="",onClose:a,actions:u=[]}){const l=document.createElement("div");l.className="modal-overlay",l.id="modal-overlay";const c=document.createElement("div");c.className=`modal ${t}`;let o=`
    <div class="modal-header">
      <h3>${f(e)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof s=="string"?f(s):""}</div>
  `;u.length&&(o+='<div class="modal-footer">',u.forEach((v,b)=>{o+=`<button class="btn ${v.className||"btn-secondary"}" id="modal-action-${b}">${f(v.label)}</button>`}),o+="</div>"),c.innerHTML=o,typeof s!="string"&&(s instanceof HTMLElement||s instanceof DocumentFragment)&&(c.querySelector(".modal-body").innerHTML="",c.querySelector(".modal-body").appendChild(s)),l.appendChild(c),document.body.appendChild(l);const r=()=>{l.remove(),a&&a()};c.querySelector("#modal-close-btn").addEventListener("click",r),l.addEventListener("click",v=>{v.target===l&&r()}),u.forEach((v,b)=>{const i=c.querySelector(`#modal-action-${b}`);i&&v.onClick&&i.addEventListener("click",()=>v.onClick(r))});const d=v=>{v.key==="Escape"&&(r(),document.removeEventListener("keydown",d))};return document.addEventListener("keydown",d),{close:r,modal:c,overlay:l}}const ze=Object.freeze(Object.defineProperty({__proto__:null,showModal:$e},Symbol.toStringTag,{value:"Module"}));function Ke({title:e,icon:s,iconBgColor:t="var(--color-primary-light)",iconTextColor:a="var(--color-primary)",metaHtml:u="",actionsHtml:l=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${t};color:${a}">
          <span class="material-icons-outlined">${s}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${e}</h2></div>
          ${u?`<div class="detail-header-meta">${u}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${l}
      </div>
    </div>
  `}function Be({title:e,content:s,actions:t=[],width:a=400}){const u=document.querySelector(".drawer-overlay");u&&u.remove();const l=document.createElement("div");l.className="drawer-overlay";const c=document.createElement("div");c.className="drawer",c.style.width=typeof a=="number"?`${a}px`:a;const o=document.createElement("div");o.className="drawer-header",o.innerHTML=`
    <h3>${e}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const r=document.createElement("div");if(r.className="drawer-body",typeof s=="string"?r.innerHTML=s:r.appendChild(s),c.appendChild(o),c.appendChild(r),t.length>0){const v=document.createElement("div");v.className="drawer-footer",t.forEach(b=>{const i=document.createElement("button");i.className=`btn ${b.className||"btn-secondary"}`,i.innerHTML=b.label,i.onclick=()=>b.onClick(d),v.appendChild(i)}),c.appendChild(v)}l.appendChild(c),document.body.appendChild(l);function d(){c.style.animation="slideRightOut 0.2s ease forwards",l.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>l.remove(),200)}o.querySelector(".drawer-close").onclick=d,l.addEventListener("mousedown",v=>{v.target===l&&d()})}function is({customerId:e=null,site:s="",onSave:t=null}={}){const a=p.getAll("customers"),u=p.getAll("people").filter(m=>m.type==="Staff"),l=e?p.getById("customers",e):null,c=(l==null?void 0:l.sites)||[],o=document.createElement("div");o.innerHTML=`
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
            ${u.map(m=>`<option value="${m.id}">${m.firstName} ${m.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${e?"flex":"none"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${c.map(m=>`<option value="${f(m.name)}" ${s===m.name?"selected":""}>${f(m.name)}</option>`).join("")}
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
  `;const r=o.querySelector("#qa-owner-type"),d=o.querySelector("#qa-customer-group"),v=o.querySelector("#qa-business-fields"),b=o.querySelector("#qa-customer-fields"),i=o.querySelector("#qa-customer-id"),n=o.querySelector("#qa-asset-site");r.addEventListener("change",m=>{const $=m.target.value==="Customer";d.style.display=$?"block":"none",v.style.display=$?"none":"flex",b.style.display=$?"flex":"none"}),i.addEventListener("change",m=>{const $=m.target.value,y=p.getById("customers",$);y&&y.sites?n.innerHTML='<option value="">-- No specific site --</option>'+y.sites.map(x=>`<option value="${f(x.name)}">${f(x.name)}</option>`).join(""):n.innerHTML='<option value="">-- No specific site --</option>'}),$e({title:"Quick Add Asset",size:"modal-70",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create Asset",className:"btn-primary",onClick:m=>{const $=o.querySelector("#qa-asset-name").value.trim();if(!$)return A("Asset Name is required","error");const y=r.value,x=i.value;if(y==="Customer"&&!x)return A("Please select a customer","error");const T={name:$,description:o.querySelector("#qa-asset-desc").value.trim(),ownerType:y,customerId:y==="Customer"?x:null,type:o.querySelector("#qa-asset-type").value,serial:o.querySelector("#qa-asset-serial").value.trim(),status:"Active",serviceIntervalMonths:parseInt(o.querySelector("#qa-service-interval").value)||6,currentMeter:parseInt(o.querySelector("#qa-initial-meter").value)||0,meterUnit:o.querySelector("#qa-meter-unit").value,logs:[]};y==="Business"?(T.recoveryRate=parseFloat(o.querySelector("#qa-recovery-rate").value)||0,T.assignedToId=o.querySelector("#qa-assigned-to").value):(T.site=n.value,T.installDate=o.querySelector("#qa-install-date").value);const h=p.create("assets",T);A(`Asset "${$}" created successfully`,"success"),t&&t(h),m()}}]})}function Vt({onSave:e}={}){const s=p.getAll("assets"),a=p.getSettings().materialCategories||["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],u=document.createElement("div");u.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${a.map(l=>`<option>${l}</option>`).join("")}
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
            ${s.map(l=>`<option>${l.name}</option>`).join("")}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `,$e({title:"Create New Catalog Item",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Save to Catalog",className:"btn-primary",onClick:l=>{const c=u.querySelector("#qs-name").value,o=parseFloat(u.querySelector("#qs-cost").value)||0;let r=parseFloat(u.querySelector("#qs-sell").value);if(!c){A("Item name is required","error");return}if(o<=0){A("Cost price is required","error");return}(isNaN(r)||r===0)&&(r=o*1.3);const d=p.create("stock",{name:c,category:u.querySelector("#qs-category").value,sku:u.querySelector("#qs-sku").value||`SKU-${Date.now().toString().slice(-4)}`,unit:u.querySelector("#qs-unit").value,reorderLevel:parseInt(u.querySelector("#qs-reorder").value)||10,costPrice:o,unitPrice:r,location:u.querySelector("#qs-location").value,quantity:0,supplier:""});A(`Stock item "${c}" created`,"success"),e&&e(d),l()}}]})}function Wt({id:e=null,jobId:s=null,supplierId:t=null,onSave:a=null}={}){const u=!e,l=(p.getAll("suppliers")||[]).filter(m=>m.active!==!1),c=p.getAll("jobs").filter(m=>m.status!=="Completed"&&m.status!=="Invoiced"),o=p.getAll("stock");let r=u?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],notes:"",supplierId:t||"",jobId:s||""}:p.getById("purchaseOrders",e);if(!r){A("Purchase Order not found","error");return}let d=[...r.lineItems||[]];const v=document.createElement("div");v.className="po-drawer-container";function b(){v.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${r.status!=="Draft"&&!u?"disabled":""}>
                <option value="">Select supplier...</option>
                ${l.map(m=>`<option value="${m.id}" ${r.supplierId===m.id?"selected":""}>${f(m.name)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${r.status!=="Draft"&&!u?"disabled":""}>
                <option value="">No specific job (Stock PO)</option>
                ${c.map(m=>`<option value="${m.id}" ${r.jobId===m.id?"selected":""}>#${m.number} - ${m.title}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${r.issueDate?r.issueDate.split("T")[0]:""}" ${r.status!=="Draft"&&!u?"disabled":""} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${f(r.notes||"")}" placeholder="e.g. Delivery instructions" ${r.status!=="Draft"&&!u?"disabled":""} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${u?"":`(${f(r.number)})`}</h4>
            ${r.status==="Draft"||u?`
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
                ${d.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>':d.map((m,$)=>`
                  <tr data-idx="${$}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${f(m.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${$}" ${r.status!=="Draft"&&!u?"disabled":""} />
                       <datalist id="stock-list-${$}">
                          ${o.map(y=>`<option value="${f(y.name)}">${f(y.name)} - $${(y.costPrice||0).toFixed(2)}</option>`).join("")}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${m.qty||m.quantity}" min="1" style="width:100%" ${r.status!=="Draft"&&!u?"disabled":""} /></td>
                    <td><input type="number" class="form-input item-cost" value="${m.cost||m.unitCost}" step="0.01" style="width:100%" ${r.status!=="Draft"&&!u?"disabled":""} /></td>
                    <td style="text-align:right; font-weight:600">$${((m.qty||m.quantity||0)*(m.cost||m.unitCost||0)).toFixed(2)}</td>
                    <td>${r.status==="Draft"||u?'<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>':""}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${d.reduce((m,$)=>m+($.qty||$.quantity||0)*($.cost||$.unitCost||0),0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,i()}function i(){var m,$;(m=v.querySelector("#btn-add-stock-new"))==null||m.addEventListener("click",()=>{Vt({onSave:y=>{d.push({description:y.name,qty:1,cost:y.costPrice||0,stockId:y.id}),b()}})}),($=v.querySelector("#btn-browse-stock"))==null||$.addEventListener("click",()=>{var x;const y=document.createElement("div");y.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${o.map(T=>`
            <div class="stock-pick-item" data-id="${T.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${f(T.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${T.sku||"N/A"} — Cost: $${(T.costPrice||0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join("")}
        </div>
      `,$e({title:"Select Stock",content:y,actions:[{label:"Close",className:"btn-secondary",onClick:T=>T()}]}),(x=y.querySelector("#btn-po-new-stock"))==null||x.addEventListener("click",()=>{Vt({onSave:T=>{var h;d.push({description:T.name,qty:1,cost:T.costPrice||0,stockId:T.id}),b(),(h=document.querySelector(".modal-overlay"))==null||h.remove()}})}),y.querySelectorAll(".stock-pick-item").forEach(T=>{T.addEventListener("click",()=>{const h=o.find(k=>k.id===T.dataset.id);h&&(d.push({description:h.name,qty:1,cost:h.costPrice||0,stockId:h.id}),b(),A(`Added ${h.name}`,"success"))})})}),v.querySelectorAll("#po-items-body tr").forEach(y=>{var w;const x=parseInt(y.dataset.idx),T=y.querySelector(".item-desc"),h=y.querySelector(".item-qty"),k=y.querySelector(".item-cost");T==null||T.addEventListener("change",g=>{const E=g.target.value,C=o.find(q=>q.name===E);C?(d[x].description=C.name,d[x].cost=C.costPrice||0,d[x].stockId=C.id):d[x].description=E,b()}),h==null||h.addEventListener("input",()=>{const g=parseFloat(h.value)||0;d[x].qty=g,d[x].quantity=g}),k==null||k.addEventListener("input",()=>{const g=parseFloat(k.value)||0;d[x].cost=g,d[x].unitCost=g}),(w=y.querySelector(".btn-remove-item"))==null||w.addEventListener("click",()=>{d.splice(x,1),b()})})}b();const n=[{label:"Cancel",className:"btn-secondary",onClick:m=>m()}];u||r.status==="Draft"?n.push({label:u?"Create & Issue PO":"Update & Issue PO",className:"btn-primary",onClick:m=>{const $=v.querySelector("#qa-po-supplier").value,y=v.querySelector("#qa-po-job").value;if(!$){A("Supplier is required","error");return}if(d.length===0){A("Please add at least one item","error");return}const x=l.find(k=>k.id===$),T=c.find(k=>k.id===y),h={number:r.number||`PO-${Date.now().toString().slice(-6)}`,supplierId:$,supplierName:(x==null?void 0:x.name)||(x==null?void 0:x.company)||"Unknown",jobId:y||null,jobNumber:(T==null?void 0:T.number)||"",issueDate:v.querySelector("#qa-po-date").value,notes:v.querySelector("#qa-po-notes").value,total:d.reduce((k,w)=>k+(w.qty||w.quantity||0)*(w.cost||w.unitCost||0),0),status:"Issued",lineItems:d};u?p.create("purchaseOrders",h):p.update("purchaseOrders",e,h),A(`Purchase Order ${h.number} issued`,"success"),a&&a(),m()}}):r.status==="Issued"&&n.push({label:"Mark as Received",className:"btn-success",onClick:m=>{const $=p.getAll("technicians"),y=p.getAll("assets"),x=document.createElement("div");x.innerHTML=`
           <div class="form-group">
             <label class="form-label">Receive into Location *</label>
             <select class="form-select" id="receive-location-select" required>
               <option value="Main Warehouse">Main Warehouse</option>
               <optgroup label="Warehouses">
                 <option value="Warehouse A">Warehouse A</option>
                 <option value="Warehouse B">Warehouse B</option>
               </optgroup>
               <optgroup label="Vehicles">
                 ${$.map(T=>`<option value="Vehicle - ${f(T.name)}">Vehicle - ${f(T.name)}</option>`).join("")}
               </optgroup>
               <optgroup label="Assets">
                 ${y.map(T=>`<option value="${f(T.name)}">${f(T.name)}</option>`).join("")}
               </optgroup>
             </select>
           </div>
         `,$e({title:"Receive Purchase Order",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Receive Items",className:"btn-success",onClick:T=>{const h=x.querySelector("#receive-location-select").value;if(!h){A("Please select a valid location","error");return}let k=0;const w=p.getAll("stock");d.forEach(g=>{var C;const E=g.stockId;if(E){const q=w.find(I=>I.id===E);if(q){q.locations||(q.locations=[]);let I=q.locations.find(J=>J.location===h);const _=parseFloat(g.qty||g.quantity)||0;I?I.quantity+=_:q.locations.push({location:h,quantity:_}),q.quantity=q.locations.reduce((J,N)=>J+N.quantity,0),q.location=((C=q.locations[0])==null?void 0:C.location)||"Main Warehouse",q.updatedAt=new Date().toISOString(),k++}}}),k>0&&p.save("stock",w),p.update("purchaseOrders",e,{status:"Received",receivedDate:new Date().toISOString()}),A(`Received ${k} items into ${h}`,"success"),T(),a&&a(),m()}}]})}}),Be({title:u?"New Purchase Order":"Manage Purchase Order",content:v,width:750,actions:n})}function ra(e,{id:s}){const t=p.getById("customers",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}Ge(t.company);const a=p.getAll("jobs").filter(d=>d.customerId===s),u=p.getAll("quotes").filter(d=>d.customerId===s),l=p.getAll("invoices").filter(d=>d.customerId===s);let c="details";function o(){e.innerHTML=`
      ${Ke({title:f(t.company),icon:t.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
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
        <button class="tab ${c==="details"?"active":""}" data-tab="details">Details</button>
        <button class="tab ${c==="contacts"?"active":""}" data-tab="contacts">Contacts (${(t.contacts||[]).length})</button>
        <button class="tab ${c==="sites"?"active":""}" data-tab="sites">Sites (${(t.sites||[]).length})</button>
        <button class="tab ${c==="assets"?"active":""}" data-tab="assets">Assets (${p.getAll("assets").filter(d=>d.ownerType==="Customer"&&d.customerId===s).length})</button>
        <button class="tab ${c==="communications"?"active":""}" data-tab="communications">Communications (${(t.communications||[]).length})</button>
        <button class="tab ${c==="jobs"?"active":""}" data-tab="jobs">Jobs (${a.length})</button>
        <button class="tab ${c==="quotes"?"active":""}" data-tab="quotes">Quotes (${u.length})</button>
        <button class="tab ${c==="invoices"?"active":""}" data-tab="invoices">Invoices (${l.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,r(),e.querySelectorAll(".tab").forEach(d=>{d.addEventListener("click",()=>{c=d.dataset.tab,e.querySelectorAll(".tab").forEach(v=>v.classList.remove("active")),d.classList.add("active"),r()})}),e.querySelector("#btn-edit-person").addEventListener("click",()=>{R.navigate(`/people/${s}/edit`)}),e.querySelector("#btn-delete-person").addEventListener("click",()=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete <strong>${f(t.company)}</strong>? This action cannot be undone.</p>`,$e({title:"Delete Customer",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Delete",className:"btn-danger",onClick:v=>{p.delete("customers",s),A("Customer deleted successfully","success"),v(),R.navigate("/people")}}]})})}function r(){const d=e.querySelector("#tab-content");if(c==="details")d.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Re("Company",t.company)}
                  ${Re("Contact",`${t.firstName} ${t.lastName}`)}
                  ${Re("Email",t.email)}
                  ${Re("Phone",t.phone)}
                  ${Re("Type",t.type)}
                  ${Re("Status",t.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Re("Address",t.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Re("Created",new Date(t.createdAt).toLocaleDateString())}
                  ${Re("Last Updated",new Date(t.updatedAt).toLocaleDateString())}
                  ${Re("Total Jobs",a.length)}
                  ${Re("Total Quotes",u.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(c==="contacts"){const v=t.contacts||[];d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${v.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${v.map((b,i)=>`
                  <tr>
                    <td class="font-medium">${f(b.name)}</td>
                    <td>${f(b.role||"—")}</td>
                    <td><a href="mailto:${f(b.email)}" class="cell-link">${f(b.email)}</a></td>
                    <td><a href="tel:${f(b.phone)}" class="cell-link">${f(b.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${v.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,d.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const b=document.createElement("div");b.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,Be({title:"Add Contact",content:b.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const n=document.querySelector(".drawer-overlay"),m=n.querySelector("#new-c-name").value.trim();if(!m)return A("Name is required","error");t.contacts||(t.contacts=[]),t.contacts.push({name:m,role:n.querySelector("#new-c-role").value,email:n.querySelector("#new-c-email").value,phone:n.querySelector("#new-c-phone").value}),p.update("customers",s,{contacts:t.contacts}),A("Contact added","success"),r(),o(),i()}}]})}),d.querySelectorAll(".btn-delete-contact").forEach(b=>{b.addEventListener("click",()=>{t.contacts.splice(b.dataset.index,1),p.update("customers",s,{contacts:t.contacts}),A("Contact deleted","success"),r(),o()})})}else if(c==="sites"){const v=t.sites||[];d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${v.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${v.map((b,i)=>`
                  <tr>
                    <td class="font-medium">${f(b.name)}</td>
                    <td>${f(b.address)}</td>
                    <td class="text-secondary">${f(b.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${v.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,d.querySelector("#btn-toggle-site").addEventListener("click",()=>{const b=document.createElement("div");b.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,Be({title:"Add Site",content:b.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const n=document.querySelector(".drawer-overlay"),m=n.querySelector("#new-s-name").value.trim(),$=n.querySelector("#new-s-address").value.trim();if(!m||!$)return A("Name and Address are required","error");t.sites||(t.sites=[]),t.sites.push({name:m,address:$,notes:n.querySelector("#new-s-notes").value}),p.update("customers",s,{sites:t.sites}),A("Site added","success"),r(),o(),i()}}]})}),d.querySelectorAll(".btn-delete-site").forEach(b=>{b.addEventListener("click",()=>{t.sites.splice(b.dataset.index,1),p.update("customers",s,{sites:t.sites}),A("Site deleted","success"),r(),o()})})}else if(c==="assets"){t.assets&&t.assets.length>0&&(t.assets.forEach(b=>{p.create("assets",{name:b.name,serial:b.serial,site:b.site,installDate:b.installDate,ownerType:"Customer",customerId:s,status:"Active",type:"Equipment"})}),t.assets=[],p.update("customers",s,{assets:[]}));const v=p.getAll("assets").filter(b=>b.ownerType==="Customer"&&b.customerId===s);t.sites,d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${v.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${v.map((b,i)=>`
                  <tr>
                    <td class="font-medium">${f(b.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${f(b.serial||"—")}</td>
                    <td>${f(b.site||"—")}</td>
                    <td>${b.installDate?new Date(b.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${b.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${v.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,d.querySelector("#btn-toggle-asset").addEventListener("click",()=>{is({customerId:s,onSave:()=>{r(),o()}})}),d.querySelectorAll(".btn-delete-asset").forEach(b=>{b.addEventListener("click",()=>{const i=b.dataset.id;p.delete("assets",i),A("Asset disabled/deleted","success"),r(),o()})})}else if(c==="communications"){const b=[...t.communications||[]].sort((i,n)=>new Date(n.date)-new Date(i.date));d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${b.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${b.map((i,n)=>`
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
      `,d.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`
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
        `,Be({title:"Log Activity",content:i.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Save",className:"btn-primary",onClick:n=>{const m=document.querySelector(".drawer-overlay"),$=m.querySelector("#new-comm-content").value.trim();if(!$)return A("Details are required","error");t.communications||(t.communications=[]),t.communications.push({id:Date.now().toString(),type:m.querySelector("#new-comm-type").value,date:m.querySelector("#new-comm-date").value,content:$}),p.update("customers",s,{communications:t.communications}),A("Activity logged","success"),r(),o(),n()}}]})})}else c==="jobs"?d.innerHTML=Lt(a,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):c==="quotes"?(d.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${Lt(u,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,d.querySelector("#btn-create-quote").addEventListener("click",()=>{R.navigate("/quotes/new?customerId="+s)})):c==="invoices"&&(d.innerHTML=Lt(l,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}o()}function Re(e,s){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${f(e)}</span>
      <span style="font-size:var(--font-size-base)">${f(s)}</span>
    </div>
  `}function Lt(e,s,t,a){if(e.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${a}</h3></div></div>`;const u=l=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[l]||"neutral"}">${f(l)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${s.map(l=>`<th>${f(l.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.map(l=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${t}/${f(l.id)}'">
                ${s.map(c=>{let o=l[c.key];return c.badge?o=u(o):c.format==="currency"?o=`$${(o||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:c.format==="date"?o=o?new Date(o).toLocaleDateString():"—":o=f(o),`<td>${o}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function ns(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("customers",s):{};e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{R.navigate(t?`/people/${s}`:"/people")}),e.querySelector("#btn-save").addEventListener("click",()=>{const u=e.querySelector("#person-form");if(!u.checkValidity()){u.reportValidity();return}const l=new FormData(u),c=Object.fromEntries(l);if(t)p.update("customers",s,c),A("Customer updated successfully","success"),R.navigate(`/people/${s}`);else{const o=p.create("customers",c);A("Customer created successfully","success"),R.navigate(`/people/${o.id}`)}})}function Nt(e){const s=p.getAll("leads");e.innerHTML=`
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
  `;let t=[...s];const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},u={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},c=He({columns:[{key:"title",label:"Lead",render:o=>`<span class="cell-link font-medium">${f(o.title)}</span>`},{key:"customerName",label:"Customer",render:o=>`<span class="text-secondary">${f(o.customerName)}</span>`},{key:"source",label:"Source",render:o=>`<span class="text-secondary">${f(o.source)}</span>`},{key:"status",label:"Status",render:o=>`<span class="badge ${a[o.status]||"badge-neutral"}">${f(o.status)}</span>`},{key:"priority",label:"Priority",render:o=>`<span class="badge ${u[o.priority]||"badge-neutral"}">${f(o.priority)}</span>`},{key:"value",label:"Value",render:o=>`<span class="font-medium">$${(o.value||0).toLocaleString()}</span>`,getValue:o=>o.value},{key:"createdAt",label:"Created",render:o=>`<span class="text-secondary">${new Date(o.createdAt).toLocaleDateString()}</span>`,getValue:o=>new Date(o.createdAt).getTime()}],data:t,onRowClick:o=>R.navigate(`/leads/${o}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:o=>{Je({container:e,selectedIds:o,onClear:()=>c.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:r=>{const d=document.createElement("div");d.innerHTML=`
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
              `,ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>ze);return{showModal:v}},void 0).then(({showModal:v})=>{v({title:`Update ${r.length} Leads`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{const i=d.querySelector("#bulk-status").value;r.forEach(n=>p.update("leads",n,{status:i})),c.clearSelection(),Nt(e),ve(async()=>{const{showToast:n}=await Promise.resolve().then(()=>De);return{showToast:n}},void 0).then(({showToast:n})=>n(`Updated ${r.length} leads to ${i}`,"success")),b()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:r=>{ve(async()=>{const{showModal:d}=await Promise.resolve().then(()=>ze);return{showModal:d}},void 0).then(({showModal:d})=>{const v=document.createElement("div");v.innerHTML=`<p>Are you sure you want to delete ${r.length} leads? This action cannot be undone.</p>`,d({title:"Confirm Bulk Delete",content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{r.forEach(i=>p.delete("leads",i)),c.clearSelection(),Nt(e),ve(async()=>{const{showToast:i}=await Promise.resolve().then(()=>De);return{showToast:i}},void 0).then(({showToast:i})=>i(`Deleted ${r.length} leads`,"success")),b()}}]})})}}]})}});e.querySelector("#leads-table-container").appendChild(c),e.querySelector("#btn-new-lead").addEventListener("click",()=>R.navigate("/leads/new")),e.querySelectorAll(".toolbar-filter").forEach(o=>{o.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),o.classList.add("active");const r=o.dataset.filter;t=r==="all"?[...s]:s.filter(d=>d.status===r),c.updateData(t)})}),e.querySelector("#leads-search").addEventListener("input",o=>{const r=o.target.value.toLowerCase();t=s.filter(d=>d.title.toLowerCase().includes(r)||d.customerName.toLowerCase().includes(r)),c.updateData(t)})}function da(e,{id:s}){const t=p.getById("leads",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}Ge(t.title);const a={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"};e.innerHTML=`
    ${Ke({title:t.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
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
            ${et("Title",t.title)}
            ${et("Customer",t.customerName)}
            ${et("Contact",t.contactName)}
            ${et("Source",t.source)}
            ${et("Priority",t.priority)}
            ${et("Status",t.status)}
            ${et("Estimated Value","$"+(t.value||0).toLocaleString())}
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
  `,e.querySelector("#btn-convert-quote").addEventListener("click",()=>{const u=p.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,title:t.title,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0});p.update("leads",s,{status:"Won"}),A("Lead converted to quote successfully","success"),R.navigate(`/quotes/${u.id}`)}),e.querySelector("#btn-edit-lead").addEventListener("click",()=>R.navigate(`/leads/${s}/edit`)),e.querySelector("#btn-delete-lead").addEventListener("click",()=>{const u=document.createElement("div");u.innerHTML=`<p>Delete <strong>${f(t.title)}</strong>?</p>`,$e({title:"Delete Lead",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Delete",className:"btn-danger",onClick:l=>{p.delete("leads",s),A("Lead deleted","success"),l(),R.navigate("/leads")}}]})})}function et(e,s){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${s}</span></div>`}function ls(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("leads",s):{},u=p.getAll("customers");e.innerHTML=`
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
                ${u.map(l=>`<option value="${l.id}" ${a.customerId===l.id?"selected":""}>${l.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(l=>`<option ${a.source===l?"selected":""}>${l}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(l=>`<option ${a.status===l?"selected":""}>${l}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(l=>`<option ${a.priority===l?"selected":""}>${l}</option>`).join("")}
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>R.navigate(t?`/leads/${s}`:"/leads")),e.querySelector("#btn-save").addEventListener("click",()=>{const l=e.querySelector("#lead-form");if(!l.checkValidity()){l.reportValidity();return}const c=Object.fromEntries(new FormData(l));c.value=parseFloat(c.value)||0;const o=u.find(r=>r.id===c.customerId);if(c.customerName=(o==null?void 0:o.company)||"",c.contactName=o?`${o.firstName} ${o.lastName}`:"",t)p.update("leads",s,c),A("Lead updated","success"),R.navigate(`/leads/${s}`);else{const r=p.create("leads",c);A("Lead created","success"),R.navigate(`/leads/${r.id}`)}})}function rs(e){const s=p.getAll("notifications")||[];let t="",a="all";function u(){return s.filter(i=>{var y,x,T,h,k;const n=t.toLowerCase(),m=((y=i.title)==null?void 0:y.toLowerCase().includes(n))||((x=i.description)==null?void 0:x.toLowerCase().includes(n))||((T=i.createdBy)==null?void 0:T.toLowerCase().includes(n))||((h=i.type)==null?void 0:h.toLowerCase().includes(n))||((k=i.priority)==null?void 0:k.toLowerCase().includes(n)),$=a==="all"||i.status===a;return m&&$})}e.innerHTML=`
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
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${f(t)}" />
      </div>
    </div>
    
    <div id="notifications-table-container"></div>
  `;const c=He({columns:[{key:"createdAt",label:"Date",render:i=>i.createdAt?new Date(i.createdAt).toLocaleDateString():"—",getValue:i=>i.createdAt?new Date(i.createdAt).getTime():0,width:"100px"},{key:"type",label:"Type",render:i=>`<span class="badge badge-neutral">${f(i.type||"Field Alert")}</span>`,width:"120px"},{key:"title",label:"Title / Job Name",render:i=>`
        <div style="font-weight:500">${f(i.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f(i.description)}</div>
      `},{key:"priority",label:"Priority",render:i=>`<span class="badge ${i.priority==="Urgent"||i.priority==="High"?"badge-danger":"badge-neutral"}">${f(i.priority||"Normal")}</span>`,width:"100px"},{key:"status",label:"Status",render:i=>`<span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${f(i.status)}</span>`,width:"110px"},{key:"createdBy",label:"Raised By",width:"150px"},{key:"actions",label:"",render:i=>`
        <div style="text-align:right">
          ${i.status!=="Converted"?`
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${i.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${i.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          `:""}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${i.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${i.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,width:"150px"}],data:u(),onRowClick:i=>{const n=s.find(m=>m.id===i);n&&d(n)},emptyMessage:"No notifications found",emptyIcon:"campaign"});e.querySelector("#notifications-table-container").appendChild(c),e.querySelector("#notif-search").addEventListener("input",i=>{t=i.target.value,c.updateData(u())}),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(n=>n.classList.remove("active")),i.classList.add("active"),a=i.dataset.filter,c.updateData(u())})}),e.querySelector("#btn-raise-notification").addEventListener("click",()=>r()),c.addEventListener("click",i=>{const n=i.target.closest("button");if(!n)return;i.stopPropagation();const m=n.dataset.id;if(n.classList.contains("btn-view-notification")){const $=s.find(y=>y.id===m);$&&d($)}else if(n.classList.contains("btn-edit-notification")){const $=s.find(y=>y.id===m);$&&r($)}else n.classList.contains("btn-convert-quote")?v(m):n.classList.contains("btn-convert-job")&&b(m)});function r(i=null){const n=p.getAll("jobs"),m=JSON.parse(localStorage.getItem("currentUser")||"{}");Be({title:i?"Edit Notification":"Raise Notification",width:450,content:`
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
              ${n.map($=>`<option value="${$.id}" ${(i==null?void 0:i.jobId)===$.id?"selected":""}>${f($.number)} - ${f($.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${f((i==null?void 0:i.title)||"")}" />
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
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${f((i==null?void 0:i.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:i?"Save Changes":"Submit Notification",className:"btn-primary",onClick:$=>{const y=document.getElementById("notif-type").value,x=document.getElementById("notif-job").value,T=document.getElementById("notif-title").value.trim(),h=document.getElementById("notif-priority").value,k=document.getElementById("notif-desc").value.trim();if(!T||!k){A("Title and Description are required","error");return}i?(p.update("notifications",i.id,{type:y,jobId:x||null,title:T,priority:h,description:k}),A("Notification updated","success")):(p.create("notifications",{type:y,jobId:x||null,title:T,priority:h,description:k,status:"Pending",createdAt:new Date().toISOString(),createdBy:m.name||"Unknown"}),A("Notification raised successfully","success")),$(),rs(e)}}]})}function d(i){Be({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${f(i.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${f(i.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${f(i.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${f(i.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${f(i.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${i.createdAt?new Date(i.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${i.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${i.jobId}">${f(i.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:i.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:n=>n()},{label:"Edit",className:"btn-secondary",onClick:n=>{n(),r(i)}},{label:"Convert to Quote",className:"btn-secondary",onClick:n=>{n(),v(i.id)}},{label:"Convert to Job",className:"btn-primary",onClick:n=>{n(),b(i.id)}}]:[{label:"Close",className:"btn-secondary",onClick:n=>n()}]})}function v(i){const n=p.getById("notifications",i);if(!n)return;const m=p.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:n.title,description:n.description,priority:n.priority,status:"Draft",notes:`Generated from Notification: ${n.title}

${n.description}`,createdAt:new Date().toISOString()});p.update("notifications",i,{status:"Converted",convertedTo:`Quote ${m.number}`}),A("Converted to Quote successfully","success"),R.navigate(`/quotes/${m.id}`)}function b(i){const n=p.getById("notifications",i);if(!n)return;const m=p.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,title:n.title,description:n.description,priority:n.priority,status:"Pending",notes:`Generated from Notification: ${n.title}

${n.description}`,createdAt:new Date().toISOString()});p.update("notifications",i,{status:"Converted",convertedTo:`Job ${m.number}`}),A("Converted to Job successfully","success"),R.navigate(`/jobs/${m.id}`)}}function Pt(e){const s=p.getAll("quotes"),t=Te("Quotes","create");e.innerHTML=`
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
  `;let a=[...s];const u={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},c=He({columns:[{key:"number",label:"Quote #",render:r=>`<span class="cell-link font-medium">${f(r.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:r=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${f(r.title||"")}</span>`},{key:"status",label:"Status",render:r=>`<span class="badge ${u[r.status]||"badge-neutral"}">${f(r.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:r=>`<span class="font-semibold">$${(r.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:r=>r.total,width:"110px"},{key:"createdAt",label:"Date",render:r=>new Date(r.createdAt).toLocaleDateString(),getValue:r=>new Date(r.createdAt).getTime(),width:"100px"}],data:a,onRowClick:r=>R.navigate(`/quotes/${r}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:r=>{Je({container:e,selectedIds:r,onClear:()=>c.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:d=>{const v=document.createElement("div");v.innerHTML=`
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
              `,ve(async()=>{const{showModal:b}=await Promise.resolve().then(()=>ze);return{showModal:b}},void 0).then(({showModal:b})=>{b({title:`Update ${d.length} Quotes`,content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const n=v.querySelector("#bulk-status").value;d.forEach(m=>p.update("quotes",m,{status:n})),c.clearSelection(),Pt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>De);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${d.length} quotes to ${n}`,"success")),i()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>ze);return{showModal:v}},void 0).then(({showModal:v})=>{const b=document.createElement("div");b.innerHTML=`<p>Are you sure you want to delete ${d.length} quotes? This action cannot be undone.</p>`,v({title:"Confirm Bulk Delete",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{d.forEach(n=>p.delete("quotes",n)),c.clearSelection(),Pt(e),ve(async()=>{const{showToast:n}=await Promise.resolve().then(()=>De);return{showToast:n}},void 0).then(({showToast:n})=>n(`Deleted ${d.length} quotes`,"success")),i()}}]})})}}]})}});e.querySelector("#quotes-table-container").appendChild(c);const o=e.querySelector("#btn-new-quote");o&&o.addEventListener("click",()=>R.navigate("/quotes/new")),e.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(v=>v.classList.remove("active")),r.classList.add("active");const d=r.dataset.filter;a=d==="all"?[...s]:s.filter(v=>v.status===d),c.updateData(a)})}),e.querySelector("#quotes-search").addEventListener("input",r=>{const d=r.target.value.toLowerCase();a=s.filter(v=>v.number.toLowerCase().includes(d)||v.customerName.toLowerCase().includes(d)||(v.title||"").toLowerCase().includes(d)),c.updateData(a)})}function zt({type:e,data:s}){const t=document.createElement("div");t.className="modal-overlay",t.id="print-preview-overlay",t.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const a=document.createElement("div");a.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const u=document.createElement("div");u.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;",u.innerHTML=`
    <span style="font-weight:600;font-size:14px">${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} Preview — ${s.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const l=document.createElement("div");l.id="print-document",l.className="print-document",l.innerHTML=Qt(e,s),a.appendChild(u),a.appendChild(l),t.appendChild(a),document.body.appendChild(t);const c=()=>t.remove();u.querySelector("#btn-close-preview").addEventListener("click",c),t.addEventListener("click",r=>{r.target===t&&c()}),u.querySelector("#btn-print-pdf").addEventListener("click",()=>{const r=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.number} — ${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${pa()}</style>
      </head>
      <body>
        ${Qt(e,s)}
      </body>
      </html>
    `,d=`${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} ${s.number}`;if(!p.getAll("documents").find(n=>n.entityId===s.id&&n.name===d)){const n=`data:text/html;charset=utf-8,${encodeURIComponent(r)}`;p.create("documents",{name:d,type:e==="quote"?"Quote PDF":e==="invoice"?"Invoice PDF":"Form PDF",size:r.length,url:n,folder:e==="quote"?"Quotes":e==="invoice"?"Invoices":"Forms",uploadedAt:new Date().toISOString(),entityType:e==="quote"?"Quote":e==="invoice"?"Invoice":"Job",entityId:s.entityId||s.id,entityName:s.customerName||"Unknown Customer"}),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>De);return{showToast:m}},void 0).then(({showToast:m})=>{m(`${d} saved to Documents`,"success")})}const i=window.open("","_blank","width=800,height=1000");i.document.write(r),i.document.close(),setTimeout(()=>{i.print()},500)});const o=r=>{r.key==="Escape"&&(c(),document.removeEventListener("keydown",o))};document.addEventListener("keydown",o)}function Qt(e,s){if(e==="form")return ca(s);const t=e==="quote",u={Draft:"#6B7280",Finalised:"#1B6DE0",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[s.status]||"#6B7280",l=s.customerName||"Customer",c=s.contactName||"",o=s.lineItems||[],r=s.sections||[],d=p.getSettings(),v=d.logo?`<img src="${d.logo}" style="max-height:60px; max-width:240px; object-fit:contain" />`:'<div class="pdf-logo">F</div>';let b="";return r.length>0?r.forEach(i=>{b+=`
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${f(i.name||"Phase")}</td>
        </tr>
      `,i.lineItems.forEach(n=>{b+=`
          <tr>
            <td>${n.description?f(n.description):"—"}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(n.type||"other").charAt(0).toUpperCase()+(n.type||"other").slice(1)}</span></td>
            <td style="text-align:center">${n.qty||1}</td>
            <td style="text-align:right">$${(n.rate||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(n.total||0).toFixed(2)}</td>
          </tr>
        `}),b+=`
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(i.subtotal||0).toFixed(2)}</td>
        </tr>
      `}):b=o.map(i=>`
      <tr>
        <td>${i.description?f(i.description):"—"}</td>
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
          ${v}
          <div>
            <div class="pdf-company-name">${f(d.name||"FieldForge Demo Company")}</div>
            <div class="pdf-company-detail">ABN: ${f(d.abn||"12 345 678 901")}</div>
            <div class="pdf-company-detail">${f(d.address||"123 Business St, Melbourne VIC 3000")}</div>
            <div class="pdf-company-detail">Phone: ${f(d.phone||"1300 123 456")}</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${t?"QUOTE":"TAX INVOICE"}</div>
          <div class="pdf-doc-number">${s.number}</div>
          <div class="pdf-status" style="background:${u}15;color:${u};border:1px solid ${u}40">${s.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${t?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${l}</div>
          ${c?`<div class="pdf-info-value">Attn: ${c}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${t?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${ut(t?s.createdAt:s.issueDate)}</span>
          </div>
          ${t?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${ut(s.validUntil)}</span>
            </div>
          `:`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${ut(s.dueDate)}</span>
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
          ${b}
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
        <div class="pdf-footer-company">${f(d.name||"FieldForge Demo Company")} — ${f(d.email||"hello@fieldforge.io")} — ${f(d.phone||"1300 123 456")}</div>
      </div>
    </div>
  `}function ca(e){let s="";return(e.template.sections||[]).forEach(t=>{t.isSpacer||(s+=`
      <div style="margin-bottom:24px; border:1px solid #CBD5E1; border-radius:6px; overflow:hidden">
        <div style="background:#F8FAFC; padding:10px 16px; border-bottom:1px solid #CBD5E1; font-weight:700; color:#1E293B; font-size:14px; text-transform:uppercase; letter-spacing:0.5px">
          ${f(t.title)}
        </div>
        <div style="padding:16px; display:grid; grid-template-columns: 1fr 1fr; gap:16px">
    `,t.fields.forEach(a=>{if(a.type==="spacer")return;const u=a.width==="half";if(a.type==="info"){s+=`
          <div style="grid-column: span ${u?"1":"2"}; padding:12px; background:#EFF6FF; border-left:4px solid #3B82F6; color:#1E3A8A; font-size:12px; border-radius:4px">
            <div style="font-weight:600; margin-bottom:4px">Information</div>
            <div>${f(a.label).replace(/\n/g,"<br/>")}</div>
          </div>
        `;return}const l=e.responses[a.id];let c="";a.type==="signature"?c=l?`<div style="font-family:'Brush Script MT', cursive; font-size:24px; padding:10px; border:1px solid #E4E9F0; border-radius:4px; text-align:center">${f(l)}</div>`:'<div style="padding:10px; border:1px dashed #E4E9F0; color:#8A97A8; font-style:italic; text-align:center">No signature</div>':a.type==="checkbox"?c=`<div style="font-weight:600; color:${l?"#10B981":"#EF4444"}">${l?"YES / CHECKED":"NO / UNCHECKED"}</div>`:c=`<div style="padding:8px 12px; border:1px solid #E4E9F0; border-radius:4px; background:#F8FAFC; min-height:34px; font-size:12px">${l?f(l).replace(/\n/g,"<br/>"):'<span style="color:#8A97A8;font-style:italic">No response</span>'}</div>`,s+=`
        <div style="grid-column: span ${u?"1":"2"}; display:flex; flex-direction:column; gap:6px">
          <div style="font-size:11px; font-weight:700; color:#5A6B7F; text-transform:uppercase; letter-spacing:0.5px">${f(a.label)}</div>
          ${c}
        </div>
      `}),s+=`
        </div>
      </div>
    `)}),`
    <div class="pdf-page">
      <div style="margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #E4E9F0">
        <div style="font-size:22px; font-weight:800; color:#1A2332">${f(e.template.name)}</div>
        ${e.template.description?`<div style="font-size:13px; color:#5A6B7F; margin-top:6px; line-height:1.6">${f(e.template.description)}</div>`:""}
      </div>

      <div class="pdf-info-grid" style="margin-bottom:32px">
        <div class="pdf-info-col">
          <div class="pdf-info-label">Job Reference</div>
          <div class="pdf-info-value-lg">${f(e.jobNumber)}</div>
          <div class="pdf-info-value">Customer: ${f(e.customerName)}</div>
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">Submitted By</span>
            <span class="pdf-info-value">${f(e.submittedByName||"—")}</span>
          </div>
          <div class="pdf-info-row">
            <span class="pdf-info-label">Date Submitted</span>
            <span class="pdf-info-value">${ut(e.submittedAt)}</span>
          </div>
        </div>
      </div>

      ${s}
    </div>
  `}function ut(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return e}}function pa(){return`
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
  `}const ua=Object.freeze(Object.defineProperty({__proto__:null,formatDate:ut,showPrintPreview:zt},Symbol.toStringTag,{value:"Module"}));function Et(e,{id:s,customerId:t,type:a}){const u=a==="template",l=u?"quoteTemplates":"quotes",c=s==="new";let o;if(c?u?o={name:"New Quote Template",description:"",sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0}:o={status:"Draft",version:1,sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:t||""}:o=p.getById(l,s),!o){e.innerHTML=`<div class="empty-state"><span class="material-icons-outlined">error</span><h3>${u?"Template":"Quote"} not found</h3></div>`;return}o.lineItems&&!o.sections&&(o.sections=[{id:p.generateId(),name:"Main Phase",lineItems:[...o.lineItems]}],delete o.lineItems),c||Ge(o.number+(o.version>1?` v${o.version}`:""));const r=p.getAll("customers"),d=p.getAll("stock"),v=p.getSettings(),b={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function i(){e.innerHTML=`
      ${Ke({title:u?c?"New Quote Template":f(o.name):`${c?"New Quote":o.number} ${o.version>1?`<span class="badge badge-neutral">v${o.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:u?"":`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          <span class="badge ${b[o.status]||"badge-neutral"}">${o.status}</span>
        `,actionsHtml:u?`
          ${c?"":'<button class="btn btn-secondary" id="btn-delete-template" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span> Delete</button>'}
        `:`
          ${c?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!c&&o.status!=="Archived"&&Te("Quotes","edit")?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!c&&o.status==="Accepted"&&Te("Quotes","convert")?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!c&&o.status==="Draft"&&Te("Quotes","edit")?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                ${Te("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>':""}
                ${Te("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>':""}
                ${!c&&Te("Quotes","delete")?'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>':""}
             </div>
          </div>
        `})}

      ${u?`
      <!-- Template Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Template Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Template Name *</label>
              <input class="form-input" id="quote-name" value="${f(o.name||"")}" placeholder="Template Name..." />
            </div>
            <div class="form-group" style="flex:2">
              <label class="form-label">Description</label>
              <input class="form-input" id="quote-desc" value="${f(o.description||"")}" placeholder="Template Description..." />
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${v.laborRates.map(x=>`<option value="${x.id}" ${o.laborProfileId===x.id?"selected":""}>${x.name} ($${x.rate.toFixed(2)}/hr)</option>`).join("")}
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
                ${r.map(x=>`<option value="${x.id}" ${o.customerId===x.id?"selected":""}>${x.company}</option>`).join("")}
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
                ${["Draft","Finalised","Sent","Accepted","Declined","Archived"].map(x=>`<option ${o.status===x?"selected":""}>${x}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${o.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${v.laborRates.map(x=>`<option value="${x.id}" ${o.laborProfileId===x.id?"selected":""}>${x.name} ($${x.rate.toFixed(2)}/hr)</option>`).join("")}
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
        ${d.map(x=>`<option value="${x.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(o.sections||[]).map((x,T)=>n(x,T)).join("")}
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

      ${u?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Template</button>
      </div>
      `:o.status!=="Archived"&&(c?Te("Quotes","create"):Te("Quotes","edit"))?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Back</button>
      </div>`}
    `,y()}function n(x,T){const h=o.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${T}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${x.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${h?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(x.subtotal||0).toFixed(2)}</span>
            ${h?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${T}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${T}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(x.lineItems||[]).map((k,w)=>m(k,T,w,h)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function m(x,T,h,k){return`
      <tr data-sidx="${T}" data-index="${h}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${x.description||""}" data-field="description" placeholder="Type item name..." ${k?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${k?"disabled":""}>
          <option value="labor" ${x.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${x.type==="material"?"selected":""}>Material</option>
          <option value="other" ${x.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${x.qty||1}" data-field="qty" min="1" ${k?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${x.rate||0}" data-field="rate" step="0.01" ${k?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(x.total||0).toFixed(2)}</td>
        <td>${k?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${T}" data-index="${h}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function $(){o.subtotal=0,o.totalInternalCost=0;let x=0;p.getSettings().laborRates.find(h=>h.id===o.laborProfileId),(o.sections||[]).forEach(h=>{h.subtotal=0,(h.lineItems||[]).forEach(k=>{k.total=(k.qty||0)*(k.rate||0),k.type==="labor"&&(x+=k.total),k.internalCost||(k.type==="labor"?k.internalCost=45:k.internalCost=k.rate*.7),o.totalInternalCost+=(k.qty||0)*(k.internalCost||0),h.subtotal+=k.total}),o.subtotal+=h.subtotal}),o.tax=o.subtotal*.1,o.total=o.subtotal+o.tax,i()}function y(){var T,h,k,w,g,E,C,q,I,_,J;(T=e.querySelector("#btn-preview-pdf"))==null||T.addEventListener("click",()=>{zt({type:"quote",data:o})});const x=e.querySelector(".dropdown > .btn");x&&(x.addEventListener("click",N=>{N.stopPropagation();const U=x.nextElementSibling;U.style.display=U.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const N=e.querySelector(".dropdown-menu");N&&(N.style.display="none")})),(h=e.querySelector("#btn-create-revision"))==null||h.addEventListener("click",()=>{p.update("quotes",s,{status:"Archived"});const N=JSON.parse(JSON.stringify(o));delete N.id,N.version=(o.version||1)+1,N.status="Draft",N.createdAt=new Date().toISOString();const U=p.create("quotes",N);A(`Revision v${N.version} created`,"success"),R.navigate(`/quotes/${U.id}`)}),(k=e.querySelector("#btn-save-template"))==null||k.addEventListener("click",N=>{N.preventDefault();const U=document.createElement("div");U.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${o.title||"Custom Quote Template"}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `,$e({title:"Save Quote as Template",content:U,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Save Template",className:"btn-primary",onClick:j=>{const P=U.querySelector("#tmpl-name").value,D=U.querySelector("#tmpl-desc").value;if(!P){A("Template name is required","error");return}const M={name:P,description:D,sections:JSON.parse(JSON.stringify(o.sections)),createdAt:new Date().toISOString()};p.create("quoteTemplates",M),A("Saved to Quote Templates","success"),j()}}]})}),(w=e.querySelector("#btn-import-template"))==null||w.addEventListener("click",N=>{N.preventDefault();const U=p.getAll("quoteTemplates"),j=document.createElement("div");j.innerHTML=`
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${U.length?U.map(P=>`
            <div class="import-item" data-id="${P.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${f(P.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${P.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${f(P.description||"No description.")}</div>
            </div>
          `).join(""):'<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `,$e({title:"Import Quote Template",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:P=>P()}]}),j.querySelectorAll(".import-item").forEach(P=>{P.addEventListener("click",()=>{var M;const D=U.find(L=>L.id===P.dataset.id);D&&confirm(`Replace current quote sections with "${D.name}"?`)&&(o.sections=JSON.parse(JSON.stringify(D.sections)),o.sections.forEach(L=>{L.id=p.generateId(),L.lineItems.forEach(S=>S.id=p.generateId())}),$(),(M=document.querySelector(".modal-overlay"))==null||M.remove())})})}),e.querySelectorAll("#quote-name, #quote-desc, #quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(N=>{N.addEventListener("change",()=>{const U=N.value;if(N.id==="quote-name")o.name=U;else if(N.id==="quote-desc")o.description=U;else if(N.id==="quote-customer")o.customerId=U;else if(N.id==="quote-title")o.title=U;else if(N.id==="quote-status")o.status=U;else if(N.id==="quote-valid")o.validUntil=U;else if(N.id==="quote-labor-profile"){o.laborProfileId=U;const j=v.laborRates.find(P=>P.id===U);if(j){if(o.sections&&o.sections.forEach(P=>{P.lineItems.forEach(D=>{D.type==="labor"&&(D.rate=j.rate)})}),j.minCallOutFee>0){const P=o.sections[0];P&&(P.lineItems.some(M=>M.description.includes("Call-out Fee"))||P.lineItems.unshift({description:"Call-out Fee",type:"other",qty:1,rate:j.minCallOutFee,total:j.minCallOutFee}))}$()}}})}),(g=e.querySelector("#btn-add-section"))==null||g.addEventListener("click",()=>{const N=v.laborRates.find(U=>U.id===o.laborProfileId)||v.laborRates.find(U=>U.isDefault);o.sections.push({id:p.generateId(),name:"New Phase",lineItems:[{description:"Labour",type:"labor",qty:1,rate:N?N.rate:85,total:N?N.rate:85}]}),$()}),e.querySelectorAll(".section-name-input").forEach((N,U)=>{N.addEventListener("change",()=>{o.sections[U].name=N.value})}),e.querySelectorAll(".btn-add-line").forEach(N=>{N.addEventListener("click",U=>{const j=parseInt(N.dataset.sidx);o.sections[j].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),i()})}),e.querySelectorAll(".btn-remove-section").forEach(N=>{N.addEventListener("click",()=>{const U=parseInt(N.dataset.sidx);confirm("Remove this entire phase?")&&(o.sections.splice(U,1),$())})}),e.querySelectorAll(".item-input").forEach(N=>{N.addEventListener("change",U=>{const j=N.closest("tr"),P=parseInt(j.dataset.sidx),D=parseInt(j.dataset.index),M=N.dataset.field;let L=N.value;if((M==="qty"||M==="rate")&&(L=parseFloat(L)||0),o.sections[P].lineItems[D][M]=L,M==="description"){const S=d.find(F=>F.name===L);if(S){const F=(S.category||"").toLowerCase().includes("labor");let O=0,le=0;if(F)O=S.unitPrice||85,le=S.costPrice||45;else{const pe=S.costPrice||S.unitPrice||0;le=pe,O=Ct(pe,v)}o.sections[P].lineItems[D].type=F?"labor":"material",o.sections[P].lineItems[D].rate=O,o.sections[P].lineItems[D].internalCost=le}}$()})}),e.querySelectorAll(".btn-remove-line").forEach(N=>{N.addEventListener("click",()=>{const U=parseInt(N.dataset.sidx),j=parseInt(tr.dataset.index);o.sections[U].lineItems.splice(j,1),$()})}),(E=e.querySelector("#btn-cancel-quote"))==null||E.addEventListener("click",()=>{u?R.navigate("/settings?tab=quotes"):R.navigate("/quotes")}),(C=e.querySelector("#btn-save-quote"))==null||C.addEventListener("click",()=>{if(u)o.name=e.querySelector("#quote-name").value,o.description=e.querySelector("#quote-desc").value;else{const N=e.querySelector("#quote-customer").value,U=r.find(j=>j.id===N);o.customerId=N,o.customerName=(U==null?void 0:U.company)||"",o.contactName=U?`${U.firstName} ${U.lastName}`:"",o.title=e.querySelector("#quote-title").value,o.status=e.querySelector("#quote-status").value,o.validUntil=e.querySelector("#quote-valid").value}if($(),u)c?(p.create("quoteTemplates",o),A("Template created","success"),R.navigate("/settings?tab=quotes")):(p.update("quoteTemplates",s,o),A("Template saved","success"),i());else if(c){const N=p.create("quotes",o);A("Quote created","success"),R.navigate(`/quotes/${N.id}`)}else p.update("quotes",s,o),A("Quote saved","success"),i()}),(q=e.querySelector("#btn-convert-job"))==null||q.addEventListener("click",()=>{const N=p.getAll("technicians"),U=N[Math.floor(Math.random()*N.length)];let j=0,P=0;(o.sections||[]).forEach(L=>{(L.lineItems||[]).forEach(S=>{S.type==="labor"&&(j+=S.total),S.type==="material"&&(P+=S.total)})});const D=o.sections.map(L=>({id:p.generateId(),name:L.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),M=p.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:o.customerId,customerName:o.customerName,contactName:o.contactName,title:o.title,type:"Project",status:"Pending",priority:"Medium",technicianId:U==null?void 0:U.id,technicianName:U==null?void 0:U.name,quoteId:s,tasks:D,phases:D,laborCost:j,materialCost:P});A("Quote converted to project","success"),R.navigate(`/jobs/${M.id}`)}),(I=e.querySelector("#btn-send-quote"))==null||I.addEventListener("click",()=>{o.emailStatus="Sent",o.status==="Draft"&&(o.status="Sent"),p.update("quotes",s,{emailStatus:"Sent",status:o.status}),ve(async()=>{const{showToast:N,addSystemNotification:U}=await Promise.resolve().then(()=>De);return{showToast:N,addSystemNotification:U}},void 0).then(({showToast:N,addSystemNotification:U})=>{N("Email sent to customer","success"),i(),setTimeout(()=>{const j=p.getById("quotes",s);j&&j.emailStatus==="Sent"&&(j.emailStatus="Opened/Viewed",p.update("quotes",s,{emailStatus:"Opened/Viewed"}),U("Quote Opened",`Quote ${j.number} was opened by ${j.customerName||"the customer"}.`,`/quotes/${s}`),window.location.hash.includes(`/quotes/${s}`)&&(o.emailStatus="Opened/Viewed",i()))},15e3)})}),(_=e.querySelector("#btn-delete-quote"))==null||_.addEventListener("click",()=>{const N=document.createElement("div");N.innerHTML=`<p>Delete quote <strong>${f(o.number)}</strong>?</p>`,$e({title:"Delete Quote",content:N,actions:[{label:"Cancel",className:"btn-secondary",onClick:U=>U()},{label:"Delete",className:"btn-danger",onClick:U=>{p.delete("quotes",s),A("Quote deleted","success"),U(),R.navigate("/quotes")}}]})}),(J=e.querySelector("#btn-delete-template"))==null||J.addEventListener("click",()=>{confirm(`Delete template "${f(o.name)}"?`)&&(p.delete("quoteTemplates",s),A("Template deleted","success"),R.navigate("/settings?tab=quotes"))})}i()}function Mt(e){const s=p.getAll("jobs"),t=Te("Jobs","create");e.innerHTML=`
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
  `;let a=[...s];const u={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},l={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},o=He({columns:[{key:"number",label:"Job #",render:d=>`<span class="cell-link font-medium">${f(d.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:d=>`<span class="truncate" style="max-width:200px;display:inline-block">${f(d.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:d=>{if(d.contractorId){const v=p.getById("contractors",d.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${v?f(v.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${d.technicians&&d.technicians.length>0?d.technicians.map(v=>f(v.name)).join(", "):f(d.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:d=>`<span class="badge ${u[d.status]||"badge-neutral"}">${f(d.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:d=>`<span class="badge ${l[d.priority]||"badge-neutral"}">${f(d.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:d=>d.scheduledDate?new Date(d.scheduledDate).toLocaleDateString():"—",getValue:d=>d.scheduledDate?new Date(d.scheduledDate).getTime():0,width:"100px"}],data:a,onRowClick:d=>R.navigate(`/jobs/${d}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:d=>{Je({container:e,selectedIds:d,onClear:()=>o.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:v=>{const b=document.createElement("div");b.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:i}=await Promise.resolve().then(()=>ze);return{showModal:i}},void 0).then(({showModal:i})=>{i({title:`Update ${v.length} Jobs`,content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Apply",className:"btn-primary",onClick:n=>{const m=b.querySelector("#bulk-status").value;v.forEach($=>p.update("jobs",$,{status:m})),o.clearSelection(),Mt(e),ve(async()=>{const{showToast:$}=await Promise.resolve().then(()=>De);return{showToast:$}},void 0).then(({showToast:$})=>$(`Updated ${v.length} jobs to ${m}`,"success")),n()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:v=>{ve(async()=>{const{showModal:b}=await Promise.resolve().then(()=>ze);return{showModal:b}},void 0).then(({showModal:b})=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete ${v.length} jobs? This cannot be undone.</p>`,b({title:"Confirm Bulk Delete",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{v.forEach(m=>p.delete("jobs",m)),o.clearSelection(),Mt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>De);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${v.length} jobs`,"success")),n()}}]})})}}]})}});e.querySelector("#jobs-table-container").appendChild(o);const r=e.querySelector("#btn-new-job");r&&r.addEventListener("click",()=>R.navigate("/jobs/new")),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(b=>b.classList.remove("active")),d.classList.add("active");const v=d.dataset.filter;v==="all"?a=[...s]:v==="unscheduled"?a=s.filter(b=>!b.scheduledDate):a=s.filter(b=>b.status===v),o.updateData(a)})}),e.querySelector("#jobs-search").addEventListener("input",d=>{const v=d.target.value.toLowerCase();a=s.filter(b=>b.number.toLowerCase().includes(v)||b.title.toLowerCase().includes(v)||b.customerName.toLowerCase().includes(v)||(b.technicianName||"").toLowerCase().includes(v)),o.updateData(a)})}function ds(e,s){const t=p.getById("timesheets",e);if(!t)return;const a=JSON.parse(localStorage.getItem("currentUser")||"{}"),u={},l={};function c(h,k=[],w=[]){h&&h.forEach((g,E)=>{const C=[...k,E].join("-"),q=[...w,g.name].join(" > ");u[C]=q,g.id&&(l[g.id]=C),g.subTasks&&c(g.subTasks,[...k,E],[...w,g.name])})}function o(h,k=[]){return!h||h.length===0?"":h.map((w,g)=>{const E=[...k,g],C=E.join("-"),q=w.subTasks&&w.subTasks.length>0;return`
        <div class="tree-node" style="margin: 2px 0;">
          <div class="tree-node-row ${q?"parent-node":"leaf-node"}" data-path="${C}" data-name="${f(w.name)}" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; flex-grow:1;">
              ${q?`
                <span class="material-icons-outlined tree-node-toggle" data-path="${C}" style="font-size:16px; margin-right:4px;">chevron_right</span>
              `:`
                <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
              `}
              <span class="node-name" style="font-weight:${q?"600":"400"}">${f(w.name)}</span>
            </div>
            ${q?`
              <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${w.subTasks.length} subtasks</span>
            `:""}
          </div>
          ${q?`
            <div class="tree-node-children" id="children-${C}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
              ${o(w.subTasks,E)}
            </div>
          `:""}
        </div>
      `}).join("")}const r=t.startTime||`${t.date}T09:00`,d=t.finishTime||`${t.date}T10:00`,v=p.getAll("technicians"),b=p.getAll("jobs").filter(h=>h.status!=="Completed"&&h.status!=="Invoiced"||h.id===t.jobId),i=document.createElement("div");i.innerHTML=`
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
        <input type="datetime-local" class="form-input" id="lt-start" value="${r}" style="width:100%" />
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Finish Time *</label>
        <input type="datetime-local" class="form-input" id="lt-finish" value="${d}" style="width:100%" />
      </div>
    </div>
    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group" style="margin:0">
        <label class="form-label">Technician *</label>
        <select class="form-select" id="lt-tech" style="width:100%" ${a.role==="technician"?"disabled":""}>
          <option value="">Select technician...</option>
          ${v.map(h=>`<option value="${h.id}" ${t.technicianId===h.id?"selected":""}>${h.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Job *</label>
        <select class="form-select" id="lt-job" style="width:100%">
          <option value="">Select job...</option>
          ${b.map(h=>`<option value="${h.id}" ${t.jobId===h.id?"selected":""}>${h.number} - ${f(h.customerName)} (${f(h.title)})</option>`).join("")}
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
        <input type="hidden" id="lt-task-name" value="${f(t.taskName||"")}" />
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Description</label>
      <input type="text" class="form-input" id="lt-desc" value="${f(t.description||"")}" placeholder="Brief description..." style="width:100%" />
    </div>
  `;const n=i.querySelector("#lt-job"),m=i.querySelector("#lt-task-trigger"),$=i.querySelector("#lt-task-dropdown"),y=i.querySelector("#lt-task"),x=i.querySelector("#lt-task-name");m.addEventListener("click",h=>{h.stopPropagation();const k=$.style.display==="block";$.style.display=k?"none":"block"}),document.addEventListener("click",h=>{i.contains(h.target)||($.style.display="none")});function T(h,k){if(!h){m.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',m.disabled=!0,$.style.display="none",y.value="",x.value="";return}const w=b.find(E=>E.id===h);if(!w||!w.tasks||w.tasks.length===0){m.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',m.disabled=!0,$.style.display="none",y.value="",x.value="";return}for(const E in u)delete u[E];for(const E in l)delete l[E];c(w.tasks),$.innerHTML=o(w.tasks),m.disabled=!1;let g=k;g&&!u[g]&&l[g]&&(g=l[g]),g&&u[g]?(m.innerHTML=`<span>${f(u[g])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,y.value=g,x.value=u[g]):(m.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',y.value="",x.value=""),$.querySelectorAll(".tree-node-toggle").forEach(E=>{E.addEventListener("click",C=>{C.stopPropagation();const q=E.dataset.path,I=$.querySelector("#children-"+q);if(I){const _=I.style.display==="none";I.style.display=_?"block":"none",E.classList.toggle("expanded",_)}})}),$.querySelectorAll(".tree-node-row").forEach(E=>{E.addEventListener("click",C=>{if(C.target.classList.contains("tree-node-toggle"))return;const q=E.dataset.path,I=q.split("-").map(Number);function _(U,j){let P=U[j[0]];for(let D=1;D<j.length;D++){if(!P||!P.subTasks)return!1;P=P.subTasks[j[D]]}return P&&P.subTasks&&P.subTasks.length>0}if(_(w.tasks||[],I)){const U=$.querySelector("#children-"+q),j=$.querySelector('.tree-node-toggle[data-path="'+q+'"]');if(U){const P=U.style.display==="none";U.style.display=P?"block":"none",j&&j.classList.toggle("expanded",P)}return}const N=u[q]||E.dataset.name;y.value=q,x.value=N,m.innerHTML=`<span>${f(N)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,$.style.display="none"})})}T(t.jobId,t.taskPath||t.taskId),n.addEventListener("change",h=>{T(h.target.value,null)}),$e({title:"Edit Timesheet Entry",content:i,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:"Save Changes",className:"btn-primary",onClick:h=>{const k=document.getElementById("lt-start").value,w=document.getElementById("lt-finish").value,g=document.getElementById("lt-tech").value,E=document.getElementById("lt-job").value,C=document.getElementById("lt-task").value,q=document.getElementById("lt-task-name").value,I=document.getElementById("lt-desc").value;if(!k||!w||!g||!E||!C){A("Please fill all required fields, including the task","error");return}const _=new Date(k),J=new Date(w);if(J<=_){A("Finish time must be after start time","error");return}const N=Math.round((J-_)/36e5*100)/100,U=v.find(P=>P.id===g),j=b.find(P=>P.id===E);p.update("timesheets",t.id,{jobId:j.id,jobNumber:j.number,taskId:C,taskPath:C,taskName:q,technicianId:g,technicianName:U.name,date:k.split("T")[0],startTime:k,finishTime:w,hours:N,description:I||""}),A("Timesheet updated successfully","success"),h(),s&&s()}}]})}function ma(e,{id:s}){const t=p.getById("jobs",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}Ge(t.number);const a={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},u={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let l="overview",c=[0],o=[],r=!1,d=null,v=[];function b(){if(!d){const h=p.getAll("stock"),k=[];h.forEach(w=>{w.locations&&w.locations.length>0?w.locations.forEach(g=>{g.quantity>0&&k.push(`<option value="${w.id}::${f(g.location)}">${f(w.name)} [${f(g.location)}] (Qty: ${g.quantity}) - $${(w.costPrice||w.unitPrice||0).toFixed(2)}</option>`)}):w.quantity>0&&k.push(`<option value="${w.id}::${f(w.location||"Main Warehouse")}">${f(w.name)} [${f(w.location||"Main Warehouse")}] (Qty: ${w.quantity}) - $${(w.costPrice||w.unitPrice||0).toFixed(2)}</option>`)}),d=k.join("")}return d}function i(){(t.laborCost||0)+(t.materialCost||0),e.innerHTML=`
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
              <span class="badge ${u[t.priority]||"badge-neutral"}">${f(t.priority)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <!-- Moved invoice creation to Invoices tab -->
          ${Te("Jobs","edit")?'<button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>':""}
          ${Te("Jobs","delete")?'<button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>':""}
        </div>
      </div>
      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${l==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${l==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        ${Te("Jobs","view_costs")?`<button class="tab ${l==="costs"?"active":""}" data-tab="costs">Costs</button>`:""}
        ${Te("Jobs","view_quotes_tab")?`<button class="tab ${l==="quotes"?"active":""}" data-tab="quotes">Quotes</button>`:""}
        <button class="tab ${l==="forms"?"active":""}" data-tab="forms">Forms</button>
        ${Te("Jobs","view_pos_tab")?`<button class="tab ${l==="pos"?"active":""}" data-tab="pos">POs</button>`:""}
        <button class="tab ${l==="activity"?"active":""}" data-tab="activity">Activity</button>
        ${Te("Jobs","view_timesheets_tab")?`<button class="tab ${l==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>`:""}
        ${Te("Jobs","view_invoices_tab")?`<button class="tab ${l==="invoices"?"active":""}" data-tab="invoices">Invoices</button>`:""}
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,n(),m()}function n(){var I,_,J,N,U,j,P,D,M,L,S,F,O,le,pe,H,Z,V,se,W,B,ae;(l==="costs"&&!Te("Jobs","view_costs")||l==="quotes"&&!Te("Jobs","view_quotes_tab")||l==="pos"&&!Te("Jobs","view_pos_tab")||l==="timesheets"&&!Te("Jobs","view_timesheets_tab")||l==="invoices"&&!Te("Jobs","view_invoices_tab"))&&(l="overview");const h=e.querySelector("#tab-content");if((t.laborCost||0)+(t.materialCost||0),l==="forms"){y(h);return}if(l==="overview"){let Q=0;if(t.tasks&&t.tasks.length>0){let oe=0,z=0;t.tasks.forEach(ee=>{const Y=(parseFloat(ee.estimatedHours)||1)*(parseInt(ee.people)||1);oe+=Y,z+=Y*((ee.progress||0)/100)}),Q=oe>0?Math.round(z/oe*100):0}const K=t.technicians&&t.technicians.length>0?t.technicians.map(oe=>`${f(oe.name)} (${oe.hours}h)`).join(", "):f(t.technicianName||"Unassigned");h.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${$("Job Number",f(t.number))}
                ${$("Title",f(t.title))}
                ${$("Type",f(t.type))}
                ${$("Status",f(t.status))}
                ${$("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${Q}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${Q}%</span></div>`)}
                ${$("Priority",f(t.priority))}
                ${$("Customer",f(t.customerName))}
                ${$("Contact",f(t.contactName||"—"))}
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
                ${$("Technicians",K)}
                ${$("Scheduled",t.scheduledDate?new Date(t.scheduledDate).toLocaleDateString():"—")}
                ${$("Est. Hours",t.estimatedHours||"—")}
                ${$("Site Address",f(t.siteAddress||"—"))}
                ${$("Quote Ref",t.quoteId?`<a href="#/quotes/${f(t.quoteId)}">${f(t.quoteId)}</a>`:"—")}
                ${$("Created",new Date(t.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `,(I=h.querySelector("#btn-add-schedule"))==null||I.addEventListener("click",()=>{const oe=p.getAll("technicians"),z=p.getAll("schedule").filter(ue=>ue.jobId===s),ee=document.createElement("div");function Y(ue,te=[],me=[]){let ce=[];return ue&&ue.forEach((ge,ke)=>{const Se=[...te,ke].join("-"),he=[...me,ge.name].join(" > ");ce.push({path:Se,name:he,isLeaf:!ge.subTasks||ge.subTasks.length===0}),ge.subTasks&&(ce=ce.concat(Y(ge.subTasks,[...te,ke],[...me,ge.name])))}),ce}const re=Y(t.tasks||[]);function fe(ue){let te="";return ue.forEach((me,ce)=>{te+='<div class="sched-entry" data-index="'+ce+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',te+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',te+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(ce+1)+"</span>",ue.length>1&&(te+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+ce+'" style="padding:2px 8px">✕ Remove</button>'),te+="</div>",te+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',te+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',te+='<select class="form-select sched-task" style="width:100%">',te+='<option value="">-- Select a Task --</option>',re.forEach(ke=>{te+=`<option value="${ke.path}" ${me.taskPath===ke.path?"selected":""}>${f(ke.name)}</option>`}),te+="</select></div>",te+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',te+='<input type="datetime-local" class="form-input sched-start" value="'+me.start+'"></div>',te+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',te+='<input type="datetime-local" class="form-input sched-finish" value="'+me.finish+'"></div>',te+="</div>",te+='<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>',te+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',oe.forEach(ke=>{const Se=me.techIds.includes(ke.id),he=Se?"var(--color-primary)":"var(--border-color)",Ae=Se?"var(--color-primary-light)":"transparent",Ne=Se?"var(--color-primary)":"var(--text-secondary)";te+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+he+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ae+";color:"+Ne+';transition:all 0.15s">',te+='<input type="checkbox" class="tech-check" data-tech-id="'+ke.id+'" '+(Se?"checked":"")+' style="display:none">',te+='<span class="material-icons-outlined" style="font-size:14px">person</span>',te+=f(ke.name),te+="</label>"}),te+="</div></div>";const ge=p.getAll("assets").filter(ke=>ke.category==="Business");te+='<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>',te+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">',ge.forEach(ke=>{const Se=me.assetIds&&me.assetIds.includes(ke.id),he=Se?"var(--color-primary)":"var(--border-color)",Ae=Se?"var(--color-primary-light)":"transparent",Ne=Se?"var(--color-primary)":"var(--text-secondary)";te+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+he+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ae+";color:"+Ne+';transition:all 0.15s">',te+='<input type="checkbox" class="asset-check" data-asset-id="'+ke.id+'" '+(Se?"checked":"")+' style="display:none">',te+='<span class="material-icons-outlined" style="font-size:14px">handyman</span>',te+=f(ke.name),te+="</label>"}),ge.length===0&&(te+='<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>'),te+="</div></div></div>"}),te}function Ee(ue){if(!document.getElementById("sched-modal-styles")){const me=document.createElement("style");me.id="sched-modal-styles",me.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(me)}let te="";z.length>0&&(te+='<div style="margin-bottom:16px">',te+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',z.forEach(me=>{const ce=new Date(me.startTime||me.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});te+='<div class="sched-summary-row" style="flex-wrap:wrap">',te+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',te+='<span style="font-weight:500">'+f(me.technicianName)+"</span>",te+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+f(me.taskName||"General Task")+"</span>",te+='<span style="color:var(--text-tertiary);margin-left:auto">'+ce+"</span>",te+='<span style="font-weight:600;margin-left:12px">'+me.hours+"h</span>",te+="</div>"}),te+="</div>",te+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),te+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',te+='<div id="sched-entries">'+fe(ue)+"</div>",te+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',te+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',ee.innerHTML=te,ee.querySelectorAll(".tech-check").forEach(me=>{const ce=me.closest("label");me.addEventListener("change",()=>{me.checked?(ce.style.borderColor="var(--color-primary)",ce.style.background="var(--color-primary-light)",ce.style.color="var(--color-primary)"):(ce.style.borderColor="var(--border-color)",ce.style.background="transparent",ce.style.color="var(--text-secondary)")})}),ee.querySelectorAll(".asset-check").forEach(me=>{const ce=me.closest("label");me.addEventListener("change",()=>{me.checked?(ce.style.borderColor="var(--color-primary)",ce.style.background="var(--color-primary-light)",ce.style.color="var(--color-primary)"):(ce.style.borderColor="var(--border-color)",ce.style.background="transparent",ce.style.color="var(--text-secondary)")})}),ee.querySelectorAll(".btn-remove-entry").forEach(me=>{me.addEventListener("click",()=>{ue.splice(parseInt(me.dataset.index),1),Ee(ue)})}),ee.querySelector("#btn-add-entry").addEventListener("click",()=>{const me=ke=>ke.toString().padStart(2,"0"),ce=new Date;ce.setDate(ce.getDate()+1);const ge=`${ce.getFullYear()}-${me(ce.getMonth()+1)}-${me(ce.getDate())}`;ue.push({taskPath:"",start:`${ge}T08:00`,finish:`${ge}T16:00`,techIds:[],assetIds:[]}),Ee(ue)})}const ie=ue=>ue.toString().padStart(2,"0"),G=new Date,X=`${G.getFullYear()}-${ie(G.getMonth()+1)}-${ie(G.getDate())}`,ne=t.technicianId?[t.technicianId]:[],we=[{taskPath:"",start:`${X}T08:00`,finish:`${X}T16:00`,techIds:ne,assetIds:[]}];Ee(we);function be(){const ue=[];return ee.querySelectorAll(".sched-entry").forEach((te,me)=>{var Ae,Ne,Pe;const ce=(Ae=te.querySelector(".sched-task"))==null?void 0:Ae.value,ge=(Ne=te.querySelector(".sched-start"))==null?void 0:Ne.value,ke=(Pe=te.querySelector(".sched-finish"))==null?void 0:Pe.value,Se=[...te.querySelectorAll(".tech-check:checked")].map(de=>de.dataset.techId),he=[...te.querySelectorAll(".asset-check:checked")].map(de=>de.dataset.assetId);ue.push({taskPath:ce,start:ge,finish:ke,techIds:Se,assetIds:he})}),ue}$e({title:`Schedule Job: ${f(t.title||t.number)}`,content:ee,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:ue=>ue()},{label:"Save Schedule",className:"btn-primary",onClick:ue=>{const te=be();let me=0,ce=[];if(te.forEach((ge,ke)=>{var Pe;if(!ge.taskPath){ce.push(`Entry ${ke+1}: please select a task`);return}if(!ge.start||!ge.finish){ce.push(`Entry ${ke+1}: missing start or finish`);return}const Se=new Date(ge.start),he=new Date(ge.finish);if(he<=Se){ce.push(`Entry ${ke+1}: finish must be after start`);return}if(ge.techIds.length===0){ce.push(`Entry ${ke+1}: select at least one technician`);return}const Ae=Math.round((he-Se)/36e5*100)/100,Ne=((Pe=re.find(de=>de.path===ge.taskPath))==null?void 0:Pe.name)||"Unknown Task";ge.techIds.forEach(de=>{const xe=oe.find(Le=>Le.id===de);xe&&(p.create("schedule",{jobId:s,jobNumber:t.number,taskPath:ge.taskPath,taskName:Ne,technicianId:de,technicianName:xe.name,date:ge.start.split("T")[0],startTime:ge.start,finishTime:ge.finish,hours:Ae}),me++)}),ge.assetIds&&ge.assetIds.length>0&&ge.assetIds.forEach(de=>{const xe=p.getById("assets",de);xe&&p.create("assetUsage",{jobId:s,assetId:de,assetName:xe.name,taskPath:ge.taskPath,taskName:Ne,startTime:ge.start,finishTime:ge.finish,hours:Ae,recoveryRate:xe.recoveryRate||0})})}),ce.length){A(ce[0],"error");return}if(te.length>0&&te[0].start){const ke=[...new Set(te.flatMap(Se=>Se.techIds))].map(Se=>{const he=oe.find(Ne=>Ne.id===Se),Ae=te.filter(Ne=>Ne.techIds.includes(Se)).reduce((Ne,Pe)=>{const de=(new Date(Pe.finish)-new Date(Pe.start))/36e5;return Ne+(isNaN(de)?0:de)},0);return{id:Se,name:(he==null?void 0:he.name)||"",hours:Math.round(Ae*100)/100}});p.update("jobs",s,{scheduledDate:te[0].start.split("T")[0],technicians:ke,technicianName:ke.map(Se=>Se.name).join(", ")})}A(`${me} schedule ${me===1?"entry":"entries"} saved`,"success"),ue(),n()}}]})})}else if(l==="tasks"){let ee=function(ie,G){let X=ie[G[0]];if(!X)return null;for(let ne=1;ne<G.length;ne++)if(!X.subTasks||(X=X.subTasks[G[ne]],!X))return null;return X},Y=function(ie){return!ie.subTasks||ie.subTasks.length===0?(parseFloat(ie.estimatedHours)||0)*(parseInt(ie.people)||1):ie.subTasks.reduce((G,X)=>G+Y(X),0)},re=function(ie,G){if(G.length<=1)return;const X=G.slice(0,-1),ne=ee(ie,X);if(ne&&ne.subTasks&&ne.subTasks.length>0){let we=0,be=0;ne.subTasks.forEach(ue=>{const te=(parseFloat(ue.estimatedHours)||1)*(parseInt(ue.people)||1);we+=te,be+=te*((ue.progress||0)/100)}),ne.progress=we>0?Math.round(be/we*100):0,ne.progress===100?ne.status="Completed":ne.progress>0?ne.status="In Progress":ne.status="Not Started",re(ie,X)}};var k=ee,w=Y,g=re;const Q=JSON.parse(localStorage.getItem("currentUser")||"{}");let K=!0;if(Q.userTypeId){const ie=p.getById("userTypes",Q.userTypeId);if(ie&&ie.permissions){const G=ie.permissions.find(X=>X.module==="Jobs");G&&(K=G.edit)}}else(Q.role==="customer"||Q.role==="technician")&&(K=!1);t.tasks||(t.tasks=[{id:p.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}]),t.tasks.forEach(ie=>{ie.subTasks||(ie.subTasks=[])});const oe=ie=>{ie.forEach(G=>{G.assignedContractorId&&(!G.assignedContractorIds||G.assignedContractorIds.length===0)&&(G.assignedContractorIds=[G.assignedContractorId]),G.subTasks&&oe(G.subTasks)})};oe(t.tasks);const z=p.getAll("contractors").filter(ie=>ie.active);let fe=!0,Ee=t.tasks;for(let ie=0;ie<c.length;ie++){if(!Ee||!Ee[c[ie]]){fe=!1;break}Ee=Ee[c[ie]].subTasks}fe||(c=[]),h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${K?'<button class="btn btn-sm btn-secondary" id="btn-import-tasklist"><span class="material-icons-outlined" style="font-size:14px">download</span> Import</button>':""}
              ${K?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${K?'<button class="btn btn-sm btn-primary" id="btn-save-tasks"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const ie=o.length>0?ee(t.tasks,o):null,G=ie?ie.subTasks||[]:t.tasks,X=ie?f(ie.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${o.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${X}">${X}</span>
                    </div>
                    ${K?o.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${o.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${G.map((ne,we)=>{const be=[...o,we],ue=be.join("-")===c.join("-");return`
                        <div class="task-list-item" data-path="${be.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${ue?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${ue?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(ne.name)}">${f(ne.name)}</span>
                          ${ne.subTasks&&ne.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${be.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${be.join("-")}" ${ne.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${G.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${c.length>0?(()=>{const ie=c,G=ee(t.tasks,ie);if(!G)return"";const X=G.subTasks&&G.subTasks.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${r?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(G.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${K?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${ie.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${K?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${ie.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${f(G.name)}" ${K?"":"disabled"} />
                  </div>
                  ${X?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${Y(G)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${G.startDate?G.startDate.split("T")[0]:""}" ${K?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${G.estimatedHours||""}" min="0" step="0.5" ${K?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${G.people||"1"}" min="1" step="1" ${K?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${G.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${G.progress>50?"#fff":"#000"}">${G.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="margin-bottom:8px">Assigned Subcontractors</label>
                    <div style="border:1px solid var(--border-color); border-radius:6px; max-height:160px; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; background:var(--bg-color)">
                      ${z.map(ne=>{const we=(G.assignedContractorIds||[]).includes(ne.id);return`
                          <label class="contractor-checkbox-label" style="display:flex; align-items:center; gap:8px; margin:0; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:normal; transition:background 0.2s">
                            <input type="checkbox" class="contractor-assign-checkbox" value="${ne.id}" ${we?"checked":""} ${K?"":"disabled"} style="width:16px; height:16px; margin:0; cursor:pointer" />
                            <span style="font-weight:500; color:var(--text-primary)">${f(ne.businessName)}</span>
                            <span style="color:var(--text-tertiary); font-size:11px">(${f(ne.contactName)})</span>
                          </label>
                        `}).join("")}
                      ${z.length===0?'<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:12px">No active subcontractors found</div>':""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${K?"":"disabled"}>${f(G.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(G.name)}">Info Panel: ${f(G.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${K&&ie.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${ie.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      ${X?"":`<button class="btn btn-sm btn-secondary btn-book-time" data-path="${ie.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>`}
                      ${K?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                      ${K?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${ie.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${f(G.name)}</div>
                  </div>
                  ${X?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${Y(G)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${G.startDate?G.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${G.estimatedHours?G.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${G.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${G.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${G.progress>50?"#fff":"#000"}">${G.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:6px">Assigned Subcontractors</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px">
                      ${(()=>{const ne=G.assignedContractorIds||[];return ne.length===0?'<span style="color:var(--text-tertiary); font-style:italic; font-size:13px">Unassigned</span>':ne.map(we=>{const be=p.getById("contractors",we),ue=be?be.businessName:"Unknown Subcontractor";return`
                            <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600; display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:4px; font-size:12px">
                              <span class="material-icons-outlined" style="font-size:14px">engineering</span>
                              ${f(ue)}
                            </span>
                          `}).join("")})()}
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${f(G.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(_=h.querySelector(".btn-view-back"))==null||_.addEventListener("click",()=>{o.pop(),n()}),h.querySelectorAll(".btn-drill-down").forEach(ie=>{ie.addEventListener("click",G=>{G.stopPropagation(),o=ie.dataset.path.split("-").map(Number),c=[...o],n()})}),h.querySelectorAll(".task-list-checkbox").forEach(ie=>{ie.addEventListener("change",G=>{const X=G.target.dataset.path.split("-").map(Number),ne=ee(t.tasks,X);ne.progress=G.target.checked?100:0,ne.status=G.target.checked?"Completed":"Not Started",re(t.tasks,X),n()}),ie.addEventListener("click",G=>G.stopPropagation())}),h.querySelectorAll(".task-list-item").forEach(ie=>{ie.addEventListener("click",G=>{if(G.target.closest(".btn-drill-down"))return;c=G.currentTarget.dataset.path.split("-").map(Number),r=!1,n()})}),(J=h.querySelector(".btn-edit-info"))==null||J.addEventListener("click",()=>{r=!0,n()}),(N=h.querySelector(".btn-done-info"))==null||N.addEventListener("click",()=>{r=!1,n()}),(U=h.querySelector("#btn-add-main-task"))==null||U.addEventListener("click",()=>{t.tasks||(t.tasks=[]),t.tasks.push({id:p.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),c=[t.tasks.length-1],n()}),h.querySelectorAll(".btn-add-child-task").forEach(ie=>{ie.addEventListener("click",G=>{const X=G.currentTarget.dataset.path.split("-").map(Number),ne=ee(t.tasks,X);ne.subTasks||(ne.subTasks=[]),ne.subTasks.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),c=[...X,ne.subTasks.length-1],n()})}),h.querySelectorAll(".detail-input").forEach(ie=>{ie.addEventListener("change",G=>{const X=ee(t.tasks,c),ne=G.target.dataset.field;ne==="progress-check"?(X.progress=G.target.checked?100:0,X.status=G.target.checked?"Completed":"Not Started"):ne==="progress"?(X.progress=parseInt(G.target.value),X.progress===100?X.status="Completed":X.progress===0?X.status="Not Started":X.status="In Progress"):ne==="estimatedHours"?X.estimatedHours=parseFloat(G.target.value)||0:X[ne]=G.target.value,re(t.tasks,c),n()})}),h.querySelectorAll(".contractor-assign-checkbox").forEach(ie=>{ie.addEventListener("change",()=>{const G=ee(t.tasks,c);G.assignedContractorIds||(G.assignedContractorIds=[]);const X=Array.from(h.querySelectorAll(".contractor-assign-checkbox:checked")).map(ne=>ne.value);if(G.assignedContractorIds=X,X.length>0){G.assignedContractorId=X[0];const ne=p.getById("contractors",X[0]);G.assignedContractorName=ne?ne.businessName:""}else G.assignedContractorId=null,G.assignedContractorName="";re(t.tasks,c),n()})}),h.querySelectorAll(".btn-remove-task").forEach(ie=>{ie.addEventListener("click",G=>{const X=ie.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(X.length===1)t.tasks.splice(X[0],1);else{const ne=X.slice(0,-1),we=ee(t.tasks,ne);we&&we.subTasks&&we.subTasks.splice(X[X.length-1],1),re(t.tasks,ne)}c=X.slice(0,-1),r=!1,n()}})}),(j=h.querySelector("#btn-save-tasks"))==null||j.addEventListener("click",()=>{p.update("jobs",s,{tasks:t.tasks}),A("Tasks saved","success")}),(P=h.querySelector("#btn-save-tasklist-template"))==null||P.addEventListener("click",()=>{const ie=document.createElement("div");ie.innerHTML=`
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
         `,$e({title:"Save Tasklist as Template",content:ie,actions:[{label:"Cancel",className:"btn-secondary",onClick:G=>G()},{label:"Save Template",className:"btn-primary",onClick:G=>{const X=ie.querySelector("#tmpl-name").value,ne=ie.querySelector("#tmpl-desc").value,we=ie.querySelector("#tmpl-tags").value.split(",").map(ue=>ue.trim()).filter(Boolean);if(!X){A("Template name is required","error");return}function be(ue){return ue.map(te=>({...te,id:p.generateId(),status:"Not Started",progress:0,subTasks:te.subTasks||te.subPhases?be(te.subTasks||te.subPhases):[]}))}p.create("taskTemplates",{name:X,description:ne,tags:we,tasks:be(t.tasks||t.phases||[]),createdAt:new Date().toISOString()}),A("Tasklist saved as template","success"),G()}}]})}),(D=h.querySelector("#btn-import-tasklist"))==null||D.addEventListener("click",()=>{const ie=p.getAll("taskTemplates"),G=p.getAll("jobs").filter(be=>be.id!==s&&(be.tasks&&be.tasks.length>0||be.phases&&be.phases.length>0));let X="templates";const ne=document.createElement("div");ne.innerHTML=`
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;function we(be=""){const ue=ne.querySelector("#import-content"),te=be.toLowerCase();if(X==="templates"){const me=ie.filter(ce=>ce.name.toLowerCase().includes(te)||(ce.description||"").toLowerCase().includes(te)||(ce.tags||[]).some(ge=>ge.toLowerCase().includes(te)));ue.innerHTML=me.length?me.map(ce=>{const ge=ce.tasks||ce.phases||[];return`
               <div class="import-item" data-id="${ce.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${f(ce.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${ge.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${f(ce.description||"No description.")}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(ce.tags||[]).map(ke=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${f(ke)}</span>`).join("")}
                 </div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${be}"</div>`}else{const me=G.filter(ce=>ce.number.toLowerCase().includes(te)||ce.title.toLowerCase().includes(te)||ce.customerName.toLowerCase().includes(te));ue.innerHTML=me.length?me.map(ce=>{const ge=ce.tasks||ce.phases||[];return`
               <div class="import-item" data-id="${ce.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${f(ce.number)} - ${f(ce.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${f(ce.customerName)} · ${ge.length} tasks</div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${be}"</div>`}ue.querySelectorAll(".import-item").forEach(me=>{me.addEventListener("click",()=>{var Ne;const ce=me.dataset.id,ge=me.dataset.type,ke=p.getAll("taskTemplates"),Se=p.getAll("jobs"),he=ge==="template"?ke.find(Pe=>String(Pe.id)===String(ce)):Se.find(Pe=>String(Pe.id)===String(ce));if(he&&(he.tasks||he.phases)){if(confirm(`Replace current tasklist with "${he.name||he.number}"?`)){let Pe=function(de){return de.map(xe=>({...xe,id:p.generateId(),status:"Not Started",progress:0,subTasks:xe.subTasks||xe.subPhases?Pe(xe.subTasks||xe.subPhases):[]}))};var Ae=Pe;t.tasks=Pe(he.tasks||he.phases),c=[0],o=[],A(`Imported ${he.name||he.number}`,"success"),n(),(Ne=document.querySelector(".modal-overlay"))==null||Ne.remove()}}else A("Could not find source data","error")})})}we(),ne.querySelectorAll(".tab").forEach(be=>{be.addEventListener("click",()=>{ne.querySelectorAll(".tab").forEach(ue=>ue.classList.remove("active")),be.classList.add("active"),X=be.dataset.tab,ne.querySelector("#import-search").placeholder=X==="templates"?"Search templates...":"Search jobs...",we(ne.querySelector("#import-search").value)})}),ne.querySelector("#import-search").addEventListener("input",be=>{we(be.target.value)}),$e({title:"Import Tasklist",content:ne,actions:[{label:"Cancel",className:"btn-secondary",onClick:be=>be()}]})}),h.querySelectorAll(".btn-duplicate-task").forEach(ie=>{ie.addEventListener("click",G=>{const X=G.currentTarget.dataset.path.split("-").map(Number),ne=ee(t.tasks,X);function we(ue,te){return{...ue,id:p.generateId(),name:ue.name+(te?" (Copy)":""),progress:0,status:"Not Started",subTasks:ue.subTasks?ue.subTasks.map(me=>we(me,!1)):[]}}const be=we(ne,!0);if(X.length===1)t.tasks.splice(X[0]+1,0,be);else{const ue=X.slice(0,-1);ee(t.tasks,ue).subTasks.splice(X[X.length-1]+1,0,be),re(t.tasks,ue)}n()})}),h.querySelectorAll(".btn-book-time").forEach(ie=>{ie.addEventListener("click",G=>{const X=G.currentTarget.dataset.path.split("-").map(Number),ne=ee(t.tasks,X),we=JSON.parse(localStorage.getItem("currentUser")||"{}"),be=p.getAll("timesheets").filter(he=>he.jobId===s),ue=p.getAll("technicians"),te=new Date,me=he=>he.toString().padStart(2,"0"),ce=`${te.getFullYear()}-${me(te.getMonth()+1)}-${me(te.getDate())}`,ge=`${ce}T09:00`,ke=`${ce}T10:00`,Se=document.createElement("div");Se.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${be.reduce((he,Ae)=>he+(Ae.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${be.length?be.map(he=>`
                      <tr>
                        <td>${he.startTime?new Date(he.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(he.date).toLocaleDateString()}</td>
                        <td>${f(he.technicianName)}</td>
                        <td>${f(he.taskName||he.phaseName||"—")}</td>
                        <td style="font-weight:600">${he.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${ge}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${ke}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${ue.map(he=>`<option value="${he.id}" ${he.name===we.name?"selected":""}>${he.name}</option>`).join("")}
              </select>
            </div>
            `,$e({title:"Book Time: "+f(ne.name),size:"modal-70",content:Se,actions:[{label:"Cancel",className:"btn-secondary",onClick:he=>he()},{label:"Log Time",className:"btn-primary",onClick:he=>{const Ae=document.getElementById("bt-start").value,Ne=document.getElementById("bt-finish").value,Pe=document.getElementById("bt-tech").value,de=ne.name;if(!Ae||!Ne||!Pe){A("Please fill all required fields","error");return}const xe=new Date(Ae),Le=new Date(Ne);if(Le<=xe){A("Finish time must be after start time","error");return}const _e=Math.round((Le-xe)/36e5*100)/100,Ie=ue.find(qe=>qe.id===Pe);p.create("timesheets",{jobId:s,jobNumber:t.number,taskId:ne.id,taskPath:X.join("-"),taskName:ne.name,phaseId:ne.id,phaseName:ne.name,technicianId:Pe,technicianName:Ie.name,date:Ae.split("T")[0],startTime:Ae,finishTime:Ne,description:de,hours:_e,status:"Pending"}),A("Time booked successfully","success"),n(),he()}}]})})})}else if(l==="costs"){let Pe=function(){const de=(t.materials||[]).reduce((_e,Ie)=>_e+Ie.quantity*(Ie.unitCost||0),0),xe=parseFloat(h.querySelector("#inp-material-cost").value)||0,Le=de+xe;h.querySelector("#sum-mat").textContent="$"+Le.toFixed(2),h.querySelector("#sum-total").textContent="$"+(ee+Le).toFixed(2)};var E=Pe;if(!t.materials){const xe=p.getAll("quotes").filter(Le=>Le.jobId===s||t.quoteId===Le.id).find(Le=>Le.status==="Accepted")||p.getById("quotes",t.quoteId);xe&&xe.sections&&(t.materials=[],xe.sections.forEach(Le=>{(Le.lineItems||[]).forEach(_e=>{if(_e.type==="material"){const Ie=p.getAll("stock").find(qe=>qe.name===_e.description);t.materials.push({stockId:Ie?Ie.id:null,name:_e.description||"Unknown Material",quantity:_e.qty||1,unitCost:Ie&&(Ie.costPrice||Ie.unitPrice)||0,fromQuote:!0})}})}),p.update("jobs",s,{materials:t.materials}))}t.materials||(t.materials=[]);const Q=p.getAll("timesheets").filter(de=>de.jobId===s),K=p.getAll("technicians"),oe={};let z=0,ee=0;Q.forEach(de=>{if(!oe[de.technicianId]){const xe=K.find(Le=>Le.id===de.technicianId);oe[de.technicianId]={id:de.technicianId,name:de.technicianName||(xe?xe.name:"Unknown Tech"),hours:0,rate:xe&&(xe.payRate||xe.hourlyRate)||45}}oe[de.technicianId].hours+=de.hours||0});const Y=Object.values(oe);Y.forEach(de=>{z+=de.hours,ee+=de.hours*de.rate});const re=p.getAll("assetUsage").filter(de=>de.jobId===s),fe=p.getAll("assets");let Ee=0;const ie=re.map(de=>{const xe=fe.find(Ie=>Ie.id===de.assetId),Le=de.recoveryRate||(xe?xe.recoveryRate:0)||0,_e=de.hours*Le;return Ee+=_e,{...de,rate:Le,cost:_e}}),G=t.materials.reduce((de,xe)=>de+xe.quantity*(xe.unitCost||0),0),X=parseFloat(t.additionalMaterialCost||0),ne=G+X,we=p.getSettings(),be=as(t.materials,we),ue=Ct(X,we),te=be+(X>0?ue-X:0)+X;(t.laborCost!==ee||t.estimatedHours!==z||t.materialCost!==ne||t.assetCost!==Ee)&&(t.laborCost=ee,t.estimatedHours=z,t.materialCost=ne,t.assetCost=Ee,p.update("jobs",s,{laborCost:ee,estimatedHours:z,materialCost:ne,assetCost:Ee}));const me=we.laborRates.find(de=>de.id===t.laborRateProfileId)||we.laborRates.find(de=>de.isDefault),ce=z*(me?me.rate:85),ge=me&&me.minCallOutFee||0,ke=Math.max(ce,ge),Se=ke+te,he=ee+ne+Ee,Ae=Se-he,Ne=Se>0?Ae/Se*100:0;h.innerHTML=`
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
                  ${Y.map(de=>`
                    <tr>
                      <td>${f(de.name)}</td>
                      <td style="font-weight:600">${de.hours.toFixed(2)}</td>
                      <td>$${(de.payRate||de.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(de.hours*(de.payRate||de.rate)).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${Y.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>':""}
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
                  ${ie.map(de=>`
                    <tr>
                      <td>${f(de.assetName)}</td>
                      <td style="font-weight:600">${de.hours.toFixed(2)}</td>
                      <td>$${de.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${de.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${ie.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>':""}
                </tbody>
                ${ie.length>0?`
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${Ee.toFixed(2)}</td>
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
                  ${we.laborRates.map(de=>`<option value="${de.id}" ${me.id===de.id?"selected":""}>${de.name} ($${de.rate.toFixed(2)}/hr)</option>`).join("")}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${me.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(me.minCallOutFee||0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${ke.toFixed(2)}</span>
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
                  ${t.materials.map((de,xe)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${f(de.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${de.quantity} x $${(de.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(de.quantity*(de.unitCost||0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${xe}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join("")}
                  ${t.materials.length===0?'<div class="text-secondary" style="font-size:14px">No materials added.</div>':""}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${b()}
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
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(ee+ne).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${Se.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${Ae>=0?"var(--color-success-bg)":"var(--color-danger-bg)"}; color:${Ae>=0?"var(--color-success)":"var(--color-danger)"}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${Ae.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${Ne.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      `,(M=h.querySelector("#inp-labor-profile"))==null||M.addEventListener("change",de=>{t.laborRateProfileId=de.target.value,p.update("jobs",s,{laborRateProfileId:t.laborRateProfileId}),n()}),h.addEventListener("click",de=>{const xe=de.target.closest(".btn-remove-mat");if(xe){const Le=parseInt(xe.dataset.index);t.materials.splice(Le,1),n()}}),(L=h.querySelector("#btn-refresh-materials"))==null||L.addEventListener("click",()=>{const xe=p.getAll("quotes").filter(Ie=>Ie.jobId===s||t.quoteId===Ie.id).find(Ie=>Ie.status==="Accepted")||p.getById("quotes",t.quoteId);if(!xe){A("No linked accepted quote found.","error");return}const Le=(t.materials||[]).filter(Ie=>!Ie.fromQuote),_e=[];xe.sections.forEach(Ie=>{(Ie.lineItems||[]).forEach(qe=>{if(qe.type==="material"){const Ue=p.getAll("stock").find(Xe=>Xe.name===qe.description);_e.push({stockId:Ue?Ue.id:null,name:qe.description||"Unknown Material",quantity:qe.qty||1,unitCost:Ue&&(Ue.costPrice||Ue.unitPrice)||0,fromQuote:!0})}})}),t.materials=[..._e,...Le],p.update("jobs",s,{materials:t.materials}),A("Materials refreshed from Quote","success"),n()}),(S=h.querySelector("#inp-material-cost"))==null||S.addEventListener("input",Pe),(F=h.querySelector("#btn-add-material"))==null||F.addEventListener("click",()=>{var Ft;const de=h.querySelector("#mat-select"),xe=parseInt(h.querySelector("#mat-qty").value)||1,Le=de.value;if(!Le)return;const[_e,Ie]=Le.split("::"),qe=p.getById("stock",_e);if(!qe)return;let Ue=0,Xe=null;if(qe.locations&&Array.isArray(qe.locations)?(Xe=qe.locations.find(lt=>lt.location===Ie),Ue=Xe?Xe.quantity:0):Ue=qe.quantity||0,Ue<xe){A(`Not enough stock at ${Ie}. Available: ${Ue}`,"error");return}Xe?(Xe.quantity-=xe,qe.locations=qe.locations.filter(lt=>lt.quantity>0),qe.quantity=qe.locations.reduce((lt,ws)=>lt+ws.quantity,0),qe.location=((Ft=qe.locations[0])==null?void 0:Ft.location)||"Main Warehouse"):qe.quantity-=xe,p.update("stock",_e,qe),d=null,t.materials.push({stockId:qe.id,name:`${qe.name} (${Ie})`,quantity:xe,unitCost:qe.costPrice||qe.unitPrice||0,fromQuote:!1}),A(`Added ${xe}x ${qe.name} from ${Ie}`,"success"),n()}),(O=h.querySelector("#btn-save-costs"))==null||O.addEventListener("click",()=>{const de=parseFloat(h.querySelector("#inp-material-cost").value)||0,Le=(t.materials||[]).reduce((_e,Ie)=>_e+Ie.quantity*(Ie.unitCost||0),0)+de;t.materialCost=Le,t.additionalMaterialCost=de,p.update("jobs",s,{materials:t.materials,materialCost:Le,additionalMaterialCost:de}),A("Additional costs saved","success"),n()})}else if(l==="quotes"){const Q=p.getAll("quotes").filter(K=>K.jobId===s||t.quoteId===K.id);h.innerHTML=`
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
                ${Q.length?Q.map(K=>`
                  <tr>
                    <td><a href="#/quotes/${K.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${f(K.number)}</a></td>
                    <td>${f(K.title||"Untitled Quote")}</td>
                    <td><span class="badge ${K.status==="Accepted"?"badge-success":K.status==="Declined"?"badge-danger":K.status==="Sent"?"badge-info":"badge-neutral"}">${f(K.status)}</span></td>
                    <td style="font-weight:600">$${(K.total||0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${K.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(le=h.querySelector("#btn-new-quote"))==null||le.addEventListener("click",()=>{const K=p.create("quotes",{customerId:t.customerId,customerName:t.customerName,title:t.title,jobId:t.id,status:"Draft",version:1,sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});A("Draft quote created","success"),R.navigate("/quotes/"+K.id)})}else if(l==="activity")t.activityLog||(t.activityLog=[]),t.activityLog=t.activityLog.map(Q=>Q.type==="note"||Q.type==="attachment"?{id:Q.id,type:"combined",date:Q.date,content:Q.type==="note"?Q.content:"",files:Q.type==="attachment"?[Q.file]:[]}:Q),h.innerHTML=`
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
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${v.length?"16px":"0"}">
              ${v.map((Q,K)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${f(Q.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${K}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join("")}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${t.activityLog.length?t.activityLog.map((Q,K)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${Q.files&&Q.files.length?"attachment":"chat_bubble_outline"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(Q.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${f(Q.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${Q.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${f(Q.content)}</div>`:""}
                      ${Q.files&&Q.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${Q.files.map(oe=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${oe.type&&oe.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${f(oe.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${f(oe.name)}">${f(oe.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(oe.size/1024).toFixed(1)} KB</div>
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
      `,setTimeout(()=>{h.querySelectorAll(".activity-log-item").forEach(Q=>{const K=Q.querySelector(".activity-content-wrapper"),oe=Q.querySelector(".expand-overlay");K&&K.scrollHeight>200&&(oe.style.display="flex",Q.style.paddingBottom="32px",oe.addEventListener("click",()=>{Q.dataset.expanded==="false"?(K.style.maxHeight=K.scrollHeight+"px",oe.style.background="transparent",oe.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',Q.dataset.expanded="true"):(K.style.maxHeight="200px",oe.style.background="linear-gradient(transparent, var(--content-bg))",oe.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',Q.dataset.expanded="false")}))})},0),h.querySelectorAll(".btn-remove-staged").forEach(Q=>{Q.addEventListener("click",K=>{const oe=parseInt(K.currentTarget.dataset.idx);v.splice(oe,1),n()})}),(pe=h.querySelector("#btn-add-note"))==null||pe.addEventListener("click",()=>{const Q=h.querySelector("#new-note-input").value.trim();!Q&&!v.length||(t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:Q,files:[...v],date:new Date().toISOString()}),p.update("jobs",s,{activityLog:t.activityLog}),v=[],n())}),(H=h.querySelector("#upload-attachment"))==null||H.addEventListener("change",Q=>{const K=Array.from(Q.target.files);if(!K.length)return;let oe=0;K.forEach(z=>{const ee=new FileReader;ee.onload=Y=>{v.push({name:z.name,size:z.size,type:z.type,data:Y.target.result}),oe++,oe===K.length&&n()},ee.readAsDataURL(z)})}),h.querySelectorAll(".btn-delete-activity").forEach(Q=>{Q.addEventListener("click",()=>{t.activityLog=t.activityLog.filter(K=>K.id!==Q.dataset.id),p.update("jobs",s,{activityLog:t.activityLog}),n()})});else if(l==="timesheets"){const Q=p.getAll("timesheets").filter(z=>z.jobId===s),K=Q.reduce((z,ee)=>z+(ee.hours||0),0),oe=p.getAll("technicians");h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${K} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Task</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
                      ${Q.length?Q.map(z=>{const ee=String(z.technicianId)===String(currentUser.id),Y=["admin","manager","office"].includes(currentUser.role)||ee&&z.status!=="Approved",re=["admin","manager","office"].includes(currentUser.role)||ee&&z.status!=="Approved";return`
                  <tr>
                    <td>${new Date(z.date).toLocaleDateString()}</td>
                    <td>${f(z.technicianName)}</td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${f(z.taskName||"—")}</span></td>
                    <td class="text-secondary">${f(z.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${z.hours}</td>
                    <td><span class="badge ${z.status==="Approved"?"badge-success":z.status==="Rejected"?"badge-danger":"badge-warning"}">${z.status}</span></td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${Y?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${z.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:16px">edit</span>
                          </button>
                        `:""}
                        ${re?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-ts-job" data-id="${z.id}" title="Delete entry" style="color:var(--color-danger)">
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
      `,h.querySelectorAll(".btn-edit-ts-job").forEach(z=>{z.addEventListener("click",()=>{const ee=z.dataset.id;ds(ee,n)})}),h.querySelectorAll(".btn-delete-ts-job").forEach(z=>{z.addEventListener("click",()=>{const ee=z.dataset.id,Y=p.getById("timesheets",ee);Y&&$e({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${Y.hours} hrs</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:re=>re()},{label:"Delete",className:"btn-danger",onClick:re=>{p.delete("timesheets",ee),A("Timesheet entry deleted successfully","success"),re(),n()}}]})})}),(Z=h.querySelector("#btn-log-time-tab"))==null||Z.addEventListener("click",()=>{const z=JSON.parse(localStorage.getItem("currentUser")||"{}"),ee=new Date,Y=X=>X.toString().padStart(2,"0"),re=`${ee.getFullYear()}-${Y(ee.getMonth()+1)}-${Y(ee.getDate())}`;function fe(X,ne=[],we=[]){let be=[];return X&&X.forEach((ue,te)=>{const me=[...ne,te].join("-"),ce=[...we,ue.name].join(" > ");be.push({path:me,name:ce,isLeaf:!ue.subTasks||ue.subTasks.length===0}),ue.subTasks&&(be=be.concat(fe(ue.subTasks,[...ne,te],[...we,ue.name])))}),be}const ie=fe(t.tasks||[]).filter(X=>X.isLeaf),G=document.createElement("div");G.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${re}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech" ${z.role==="technician"?"disabled":""}>
                <option value="">Select tech...</option>
                ${oe.map(X=>`<option value="${X.id}" ${X.name===z.name?"selected":""}>${X.name}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: 1 / -1">
              <label class="form-label">Task *</label>
              <select class="form-select" id="lt-task" style="width:100%">
                <option value="">Select task...</option>
                ${ie.map(X=>`<option value="${X.path}">${f(X.name)}</option>`).join("")}
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
        `,showDrawer({title:"Log Time",content:G.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:X=>X()},{label:"Save",className:"btn-primary",onClick:X=>{const ne=document.querySelector(".drawer-overlay"),we=ne.querySelector("#lt-date").value,be=ne.querySelector("#lt-tech").value,ue=ne.querySelector("#lt-task").value,te=parseFloat(ne.querySelector("#lt-hours").value),me=ne.querySelector("#lt-desc").value;if(!we||!be||isNaN(te)||!ue){A("Please fill all required fields, including the task","error");return}const ce=oe.find(Se=>Se.id===be),ge=ie.find(Se=>Se.path===ue),ke=ge?ge.name:"";p.create("timesheets",{jobId:s,jobNumber:t.number,taskId:ue,taskName:ke,technicianId:be,technicianName:ce.name,date:we,hours:te,description:me,status:"Pending"}),A("Time logged successfully","success"),n(),X()}}]})})}else if(l==="forms")t.forms=t.forms||[],h.innerHTML=`
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
                    <td class="font-medium">${f(Q.type)}</td>
                    <td>${new Date(Q.date).toLocaleString()}</td>
                    <td>${f(Q.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(V=h.querySelector("#btn-add-form"))==null||V.addEventListener("click",()=>{const Q=document.createElement("div");Q.innerHTML=`
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
          `,showDrawer({title:"Complete Form",content:Q.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:K=>K()},{label:"Submit",className:"btn-primary",onClick:K=>{const oe=document.querySelector(".drawer-overlay");t.forms.push({type:oe.querySelector("#new-form-type").value,notes:oe.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),p.update("jobs",s,{forms:t.forms}),A("Form submitted successfully","success"),n(),K()}}]})});else if(l==="pos"){const Q=p.getAll("purchaseOrders").filter(K=>K.jobId===s);h.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${Q.length?Q.map(K=>`
                  <tr>
                    <td><a href="#/purchase-orders/${f(K.id)}">${f(K.number)}</a></td>
                    <td>${f(K.supplierName||"—")}</td>
                    <td>${K.issueDate?new Date(K.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(K.total||0).toFixed(2)}</td>
                    <td><span class="badge ${K.status==="Received"?"badge-success":K.status==="Draft"?"badge-neutral":K.status==="Cancelled"?"badge-danger":"badge-primary"}">${K.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(se=h.querySelector("#btn-raise-po"))==null||se.addEventListener("click",()=>{const oe=(p.getAll("suppliers")||[]).filter(Y=>Y.active!==!1),z=p.getAll("stock"),ee=document.createElement("div");ee.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select class="form-select" id="po-supplier">
              <option value="">Select supplier...</option>
              ${oe.map(Y=>`<option value="${f(Y.name)}">${f(Y.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${z.map(Y=>`<option value="${Y.id}">${Y.name} - $${Y.costPrice||0}</option>`).join("")}
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
        `,showDrawer({title:"Quick Purchase Order",content:ee.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:Y=>Y()},{label:"Create PO",className:"btn-primary",onClick:Y=>{const re=document.querySelector(".drawer-overlay"),fe=re.querySelector("#po-supplier").value,Ee=re.querySelector("#po-part").value,ie=parseInt(re.querySelector("#po-qty").value)||1,G=re.querySelector("#po-date").value;if(!fe||!Ee){A("Supplier and Part are required","error");return}const X=z.find(ne=>ne.id===Ee);p.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:s,supplierName:fe,issueDate:new Date().toISOString(),expectedDate:G,status:"Draft",items:[{stockId:Ee,name:X.name,quantity:ie,unitCost:X.costPrice||0,total:(X.costPrice||0)*ie}],total:(X.costPrice||0)*ie}),A("Quick PO Created","success"),n(),Y()}}]})})}else if(l==="invoices"){let K=function(z,ee,Y){const re=p.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:z,jobId:s,jobNumber:t.number,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,status:"Draft",sections:ee,subtotal:Y,tax:Y*.1,total:Y*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+2592e6).toISOString()});p.update("jobs",s,{status:"Invoiced"}),A(`${z} Invoice created`,"success"),R.navigate(`/invoices/${re.id}`)},oe=function(){let z=[],ee=0;if(t.quoteId){const Y=p.getById("quotes",t.quoteId);Y&&Y.sections&&Y.sections.length>0?(z=JSON.parse(JSON.stringify(Y.sections)),ee=Y.subtotal||0):Y&&Y.lineItems&&(z=[{id:p.generateId(),name:"Main Phase",lineItems:JSON.parse(JSON.stringify(Y.lineItems))}],ee=Y.subtotal||0)}if(z.length===0){const Y=t.tasks||t.phases||[];if(Y.length>0){z=Y.map(Ee=>({id:p.generateId(),name:Ee.name,lineItems:[{description:`${Ee.name} - Labor & Materials`,type:"other",qty:1,rate:0,total:0}],subtotal:0}));const re=t.laborCost||0,fe=t.materialCost||0;(re>0||fe>0)&&(z[0].lineItems.push({description:"Estimated Job Labor",type:"labor",qty:1,rate:re,total:re}),z[0].lineItems.push({description:"Estimated Job Materials",type:"material",qty:1,rate:fe,total:fe}))}else{const re=t.laborCost||0,fe=t.materialCost||0;z=[{id:p.generateId(),name:"General Items",lineItems:[{description:`${t.title} - Labor`,type:"labor",qty:1,rate:re,total:re},{description:`${t.title} - Materials`,type:"material",qty:1,rate:fe,total:fe}]}]}ee=z.reduce((re,fe)=>re+fe.lineItems.reduce((Ee,ie)=>Ee+(ie.total||0),0),0)}return{sections:z,subtotal:ee}};var C=K,q=oe;const Q=p.getAll("invoices").filter(z=>z.jobId===s);h.innerHTML=`
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
                ${Q.length?Q.map(z=>`
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
      `,(W=h.querySelector("#btn-create-standard-invoice"))==null||W.addEventListener("click",()=>{const{sections:z,subtotal:ee}=oe();K("Standard",z,ee)}),(B=h.querySelector("#btn-create-deposit-invoice"))==null||B.addEventListener("click",()=>{const z=[{id:p.generateId(),name:"Deposit",lineItems:[{description:`Deposit for Job ${t.number}`,type:"other",qty:1,rate:0,total:0}],subtotal:0}];K("Deposit",z,0)}),(ae=h.querySelector("#btn-create-progress-invoice"))==null||ae.addEventListener("click",()=>{const z=document.createElement("div");z.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,$e({title:"Create Progress Invoice",content:z,actions:[{label:"Cancel",className:"btn-secondary",onClick:ee=>ee()},{label:"Create",className:"btn-primary",onClick:ee=>{const Y=parseFloat(document.getElementById("progress-percent").value)||0;if(Y<=0||Y>100){A("Enter a valid percentage (1-100)","error");return}const{subtotal:re}=oe(),fe=re*(Y/100),Ee=[{id:p.generateId(),name:`Progress Payment (${Y}%)`,lineItems:[{description:`Progress Payment (${Y}% of job)`,type:"other",qty:1,rate:fe,total:fe}],subtotal:fe}];K("Progress",Ee,fe),ee()}}]})})}}function m(){var h,k;e.querySelectorAll(".tab").forEach(w=>{w.addEventListener("click",()=>{l=w.dataset.tab,e.querySelectorAll(".tab").forEach(g=>g.classList.remove("active")),w.classList.add("active"),n()})}),(h=e.querySelector("#btn-edit-job"))==null||h.addEventListener("click",()=>R.navigate(`/jobs/${s}/edit`)),(k=e.querySelector("#btn-delete-job"))==null||k.addEventListener("click",()=>{const w=document.createElement("div");w.innerHTML=`<p>Delete job <strong>${f(t.number)}</strong>?</p>`,$e({title:"Delete Job",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Delete",className:"btn-danger",onClick:g=>{p.delete("jobs",s),A("Job deleted","success"),g(),R.navigate("/jobs")}}]})})}i();function $(h,k){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${h}</span><span>${k}</span></div>`}function y(h){const k=p.getAll("formInstances").filter(g=>g.jobId===s),w=p.getAll("formTemplates");h.innerHTML=`
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
              ${k.map(g=>{const E=w.find(I=>I.id===g.templateId),C=g.status==="Completed",q=g.submittedBy?p.getById("people",g.submittedBy):null;return`
                  <tr>
                    <td class="font-medium">${f((E==null?void 0:E.name)||"Unknown Form")}</td>
                    <td><span class="badge ${C?"badge-success":"badge-warning"}">${g.status}</span></td>
                    <td>${q?f(`${q.firstName} ${q.lastName}`):"—"}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${g.submittedAt?new Date(g.submittedAt).toLocaleDateString():"—"}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${C?"btn-secondary":"btn-primary"} btn-sm fill-form" data-id="${g.id}" title="${C?"View / Edit":"Fill Form"}">
                          <span class="material-icons-outlined" style="font-size:16px">${C?"visibility":"edit_note"}</span>
                        </button>
                        ${C?`<button class="btn btn-secondary btn-icon btn-sm print-form" data-id="${g.id}" title="Print / PDF"><span class="material-icons-outlined" style="font-size:18px">print</span></button>`:""}
                        ${C?"":`<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${g.id}" style="color:var(--color-danger)" title="Remove Form"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              ${k.length?"":'<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,h.querySelector("#btn-attach-form").addEventListener("click",()=>x()),h.querySelectorAll(".fill-form").forEach(g=>{g.addEventListener("click",()=>T(g.dataset.id))}),h.querySelectorAll(".remove-form-instance").forEach(g=>{g.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this form from the job?")){const E=g.dataset.id,C=p.getAll("formInstances");p.save("formInstances",C.filter(q=>q.id!==E)),y(h)}})}),h.querySelectorAll(".print-form").forEach(g=>{g.addEventListener("click",()=>{const E=p.getById("formInstances",g.dataset.id),C=p.getById("formTemplates",E.templateId),q=E.submittedBy?p.getById("people",E.submittedBy):null;ve(async()=>{const{showPrintPreview:I}=await Promise.resolve().then(()=>ua);return{showPrintPreview:I}},void 0).then(({showPrintPreview:I})=>{var _;I({type:"form",data:{...E,template:C,jobNumber:t.number,customerName:((_=p.getById("people",t.customerId))==null?void 0:_.companyName)||"Unknown Customer",submittedByName:q?`${q.firstName} ${q.lastName}`:"Unknown Technician",number:`F-${t.number}-${E.id.slice(3,7).toUpperCase()}`}})})})})}function x(){const h=p.getAll("formTemplates"),w=p.getAll("formInstances").filter(E=>E.jobId===s).map(E=>E.templateId),g=document.createElement("div");g.style.minWidth="450px",g.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:12px">
        ${h.map(E=>{const C=w.includes(E.id);return`
            <div class="card attach-template-item ${C?"disabled":""}" data-id="${E.id}" style="cursor:${C?"not-allowed":"pointer"}; opacity:${C?"0.6":"1"}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${f(E.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(E.sections||[]).reduce((q,I)=>q+I.fields.length,0)} fields</div>
                </div>
                ${C?'<span class="badge badge-neutral">Already Attached</span>':'<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `}).join("")}
        ${h.length?"":'<div class="text-center text-tertiary">No templates available.</div>'}
      </div>
    `,g.querySelectorAll(".attach-template-item:not(.disabled)").forEach(E=>{E.addEventListener("click",()=>{var I;const C=E.dataset.id,q=p.getAll("formInstances");q.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:s,templateId:C,responses:{},status:"Pending",createdAt:new Date().toISOString()}),p.save("formInstances",q),A("Form attached to job","success"),(I=document.querySelector(".modal-overlay"))==null||I.remove(),y(e.querySelector("#tab-content"))})}),$e({title:"Attach Compliance Form",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()}]})}function T(h){const w=p.getAll("formInstances").find(q=>q.id===h),g=p.getById("formTemplates",w.templateId),E=w.status==="Completed",C=document.createElement("div");C.innerHTML=`
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${f(g.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${f(g.description||"")}</div>
      </div>
      <form id="active-job-form">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px">
          ${(g.sections||[]).map(q=>q.isSpacer?`<div style="grid-column: span ${q.width==="half"?"1":"2"}"></div>`:`
            <div class="form-section" style="grid-column: span ${q.width==="half"?"1":"2"}; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; overflow:hidden">
              <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color); border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${f(q.title)}</h4>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; padding:16px">
                ${q.fields.map(I=>{if(I.type==="spacer")return`<div style="grid-column: span ${I.width==="half"?"1":"2"}"></div>`;if(I.type==="info")return`
          <div class="form-group" style="margin:0; grid-column: span ${I.width==="half"?"1":"2"}; padding:16px; background:var(--color-primary-light); border-radius:6px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
            <div style="display:flex; gap:12px">
              <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0">info</span>
              <div>${f(I.label).replace(/\n/g,"<br/>")}</div>
            </div>
          </div>
        `;const _=w.responses[I.id]||"";let J="";return I.type==="text"?J=`<input class="form-input" name="${I.id}" value="${f(_)}" ${I.required?"required":""} />`:I.type==="textarea"?J=`<textarea class="form-textarea" name="${I.id}" rows="3" ${I.required?"required":""}>${f(_)}</textarea>`:I.type==="checkbox"?J=`
                       <label style="display:flex; align-items:center; gap:10px; cursor:pointer">
                         <input type="checkbox" name="${I.id}" ${_?"checked":""} style="width:18px; height:18px" />
                         <span style="font-size:14px">${I.label}</span>
                       </label>`:I.type==="select"?J=`
                       <select class="form-select" name="${I.id}" ${I.required?"required":""}>
                         <option value="">Select option...</option>
                         ${(I.options||[]).map(N=>`<option value="${f(N)}" ${_===N?"selected":""}>${f(N)}</option>`).join("")}
                       </select>`:I.type==="date"?J=`<input type="date" class="form-input" name="${I.id}" value="${_}" ${I.required?"required":""} />`:I.type==="signature"&&(J=`
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${_?`<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${f(_)}</span>`:"Digitally Signed on submission"}
                       </div>`),`
                    <div class="form-group" style="margin:0; grid-column: span ${I.width==="half"?"1":"2"}">
                      ${I.type!=="checkbox"?`<label class="form-label" style="font-weight:500">${f(I.label)} ${I.required?'<span style="color:var(--color-danger)">*</span>':""}</label>`:""}
                      ${J}
                    </div>
                  `}).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </form>
    `,$e({title:E?"Edit Form Response":"Complete Job Form",content:C,size:"modal-xl",actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:E?"Update Form":"Submit Form",className:"btn-primary",onClick:q=>{var P,D;const I=C.querySelector("#active-job-form");if(!I.checkValidity())return I.reportValidity();const _=new FormData(I),J={};(g.sections||[]).forEach(M=>{M.isSpacer||M.fields.forEach(L=>{var S;L.type==="spacer"||L.type==="info"||(L.type==="checkbox"?J[L.id]=_.has(L.id):J[L.id]=_.get(L.id),L.type==="signature"&&(J[L.id]=((S=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:S.name)||"Unknown"))})});const N=p.getAll("formInstances"),U=N.findIndex(M=>M.id===h);N[U]={...N[U],responses:J,status:"Completed",submittedBy:(P=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:P.id,submittedAt:new Date().toISOString()},p.save("formInstances",N),A(E?"Form updated successfully":"Form submitted successfully","success"),q(),y(e.querySelector("#tab-content"));const j=p.getAll("activity")||[];j.push({id:Date.now(),jobId:s,type:"form_submission",text:E?`Form "${g.name}" was updated.`:`Form "${g.name}" submitted.`,user:(D=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:D.name,timestamp:new Date().toISOString()}),p.save("activity",j)}}]})}}const ba=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function cs(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("jobs",s):{},u=p.getAll("customers"),l=p.getAll("contractors").filter(L=>L.active);let c=a.tags?[...a.tags]:[];function o(L){return u.find(S=>S.id===L)||null}function r(L,S){const F=o(L);return!F||!F.sites||F.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+F.sites.map((O,le)=>`<option value="${le}" data-address="${f(O.address)}" data-name="${f(O.name)}" ${S===O.name?"selected":""}>${f(O.name)} — ${f(O.address)}</option>`).join("")}function d(L,S,F){const O=o(L);return!O||!O.contacts||O.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${F}</option>`+O.contacts.map((le,pe)=>`<option value="${pe}" ${S===le.name?"selected":""}>${f(le.name)} (${f(le.role||"")})</option>`).join("")}function v(){return ba.map(L=>`<button type="button" class="tag-pill ${c.includes(L)?"tag-pill-active":""}" data-tag="${f(L)}">${f(L)}</button>`).join("")}const b=a.customerId||"";e.innerHTML=`
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
                ${u.map(L=>`<option value="${L.id}" ${a.customerId===L.id?"selected":""}>${f(L.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(L=>`<option ${a.type===L?"selected":""}>${L}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${b?"":"disabled"}>
              ${r(b,a.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${a.siteAddress?f(a.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${b?"":"disabled"}>
                ${d(b,a.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${b?"":"disabled"}>
                ${d(b,a.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(L=>`<option ${a.status===L?"selected":""}>${L}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(L=>`<option ${a.priority===L?"selected":""}>${L}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${l.map(L=>`<option value="${L.id}" ${a.contractorId===L.id?"selected":""}>${f(L.businessName)}</option>`).join("")}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${v()}
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
  `,e.querySelectorAll("#job-form-tabs .tab").forEach(L=>{L.addEventListener("click",S=>{e.querySelectorAll("#job-form-tabs .tab").forEach(O=>O.classList.remove("active")),S.currentTarget.classList.add("active");const F=S.currentTarget.dataset.tab;e.querySelector("#jf-tab-details").style.display=F==="details"?"block":"none",e.querySelector("#jf-tab-tasks").style.display=F==="tasks"?"block":"none",e.querySelector("#jf-tab-forms").style.display=F==="forms"?"block":"none",F==="tasks"&&U(),F==="forms"&&M()})});const i=e.querySelector("#jf-customer"),n=e.querySelector("#jf-site"),m=e.querySelector("#jf-site-hint"),$=e.querySelector("#jf-primary-contact"),y=e.querySelector("#jf-additional-contact");function x(L){const S=!L;n.innerHTML=r(L,""),n.disabled=S,$.innerHTML=d(L,"","Select primary contact..."),$.disabled=S,y.innerHTML=d(L,"","None"),y.disabled=S,m.textContent=S?"Select a customer to enable jobsite selection":"Select a jobsite above"}i.addEventListener("change",L=>x(L.target.value)),n.addEventListener("change",L=>{const S=L.target.selectedOptions[0];m.textContent=(S==null?void 0:S.dataset.address)||""}),e.querySelector("#jf-tags").addEventListener("click",L=>{const S=L.target.closest(".tag-pill");if(!S)return;const F=S.dataset.tag;c.includes(F)?(c=c.filter(O=>O!==F),S.classList.remove("tag-pill-active")):(c.push(F),S.classList.add("tag-pill-active"))});const T=e.querySelector("#job-description-editor"),h=e.querySelector("#editor-toolbar");h.addEventListener("mousedown",L=>{const S=L.target.closest("button[data-cmd]");if(!S)return;L.preventDefault();const F=S.dataset.cmd,O=S.dataset.val||null;document.execCommand(F,!1,O),T.focus()}),e.querySelector("#editor-link-btn").addEventListener("click",()=>{const L=prompt("Enter URL:","https://");L&&document.execCommand("createLink",!1,L),T.focus()}),T.addEventListener("keyup",k),T.addEventListener("mouseup",k);function k(){h.querySelectorAll("button[data-cmd]").forEach(L=>{try{L.classList.toggle("active",document.queryCommandState(L.dataset.cmd))}catch{}})}const w=e.querySelector("#is-emergency"),g=e.querySelector("#emergency-dispatch-suggestion"),E=e.querySelector("#dispatch-reason"),C=e.querySelector("#job-priority");function q(L){if(L){C.value="Urgent",g.style.display="block";const S=p.getAll("people").filter(F=>F.type==="Staff");if(S.length>0){const F=S[Math.floor(Math.random()*S.length)],O=Math.floor(Math.random()*15)+5;E.innerHTML=`Based on current GPS location, <strong>${F.firstName} ${F.lastName}</strong> is the most suitable technician (approx. ${O} mins away).`}else E.innerHTML="No internal technicians available for dispatch."}else g.style.display="none"}if(w==null||w.addEventListener("change",L=>q(L.target.checked)),a.isEmergency&&q(!0),!t){const L=e.querySelector("#is-recurring"),S=e.querySelector("#recurring-options");L==null||L.addEventListener("change",F=>{S.style.display=F.target.checked?"flex":"none"})}e.querySelector("#btn-cancel").addEventListener("click",()=>R.navigate(t?`/jobs/${s}`:"/jobs"));let I=a.tasks?JSON.parse(JSON.stringify(a.tasks)):[{id:p.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subTasks:[]}];I.forEach(L=>{L.subTasks||(L.subTasks=[])});let _=[0],J=[];function N(L,S){let F=L[S[0]];if(!F)return null;for(let O=1;O<S.length;O++)if(!F.subTasks||(F=F.subTasks[S[O]],!F))return null;return F}function U(){var H,Z,V,se;const L=e.querySelector("#jf-task-container");if(!L)return;let S=!0,F=I;for(let W=0;W<_.length;W++){if(!F||!F[_[W]]){S=!1;break}F=F[_[W]].subTasks}S||(_=[]);const O=J.length>0?N(I,J):null,le=O?O.subTasks||[]:I,pe=O?f(O.name):"Main Tasks";L.innerHTML=`
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
                ${J.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${pe}">${pe}</span>
              </div>
              ${J.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${J.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${le.map((W,B)=>{const ae=[...J,B],Q=ae.join("-")===_.join("-");return`
                  <div class="task-list-item" data-path="${ae.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${Q?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${Q?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(W.name)}">${f(W.name)}</span>
                    ${W.subTasks&&W.subTasks.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${ae.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${le.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${_.length>0?(()=>{const W=_,B=N(I,W);if(!B)return"";const ae=B.subTasks&&B.subTasks.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(B.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${W.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${W.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${W.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${f(B.name)}" />
                </div>
                ${ae?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${B.startDate?B.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${B.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${B.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${f(B.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(H=L.querySelector(".btn-view-back"))==null||H.addEventListener("click",()=>{J.pop(),U()}),L.querySelectorAll(".btn-drill-down").forEach(W=>{W.addEventListener("click",B=>{B.stopPropagation(),J=W.dataset.path.split("-").map(Number),_=[...J],U()})}),L.querySelectorAll(".task-list-item").forEach(W=>{W.addEventListener("click",()=>{_=W.dataset.path.split("-").map(Number),U()})}),(Z=L.querySelector("#btn-add-main-task"))==null||Z.addEventListener("click",()=>{I.push({id:p.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),_=[I.length-1],U()}),L.querySelectorAll(".btn-add-child-task").forEach(W=>{W.addEventListener("click",()=>{const B=W.dataset.path.split("-").map(Number),ae=N(I,B);ae&&(ae.subTasks||(ae.subTasks=[]),ae.subTasks.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),_=[...B,ae.subTasks.length-1],J=[...B],U())})}),L.querySelectorAll(".btn-remove-task").forEach(W=>{W.addEventListener("click",()=>{const B=W.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(B.length===1)I.splice(B[0],1),_=I.length>0?[0]:[];else{const ae=N(I,B.slice(0,-1));ae&&ae.subTasks&&ae.subTasks.splice(B[B.length-1],1),_=[...B.slice(0,-1)]}U()}})}),L.querySelectorAll(".detail-input").forEach(W=>{W.addEventListener("input",B=>{const ae=B.target.dataset.field,Q=B.target.value,K=N(I,_);if(K&&(ae==="estimatedHours"?K[ae]=parseFloat(Q)||0:ae==="people"?K[ae]=parseInt(Q)||1:K[ae]=Q,ae==="name")){const oe=L.querySelector(`.task-list-item[data-path="${_.join("-")}"] span:first-child`);oe&&(oe.textContent=Q,oe.title=Q);const z=L.querySelector("h4[title]");z&&(z.textContent="Task Settings: "+Q,z.title=Q)}})}),(V=e.querySelector("#btn-save-as-template"))==null||V.addEventListener("click",()=>{const W=document.createElement("div");W.innerHTML=`
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
      `,$e({title:"Save Tasklist as Template",content:W,actions:[{label:"Cancel",className:"btn-secondary",onClick:B=>B()},{label:"Save Template",className:"btn-primary",onClick:B=>{const ae=W.querySelector("#tmpl-name").value,Q=W.querySelector("#tmpl-desc").value,K=W.querySelector("#tmpl-tags").value.split(",").map(z=>z.trim()).filter(Boolean);if(!ae){A("Template name is required","error");return}function oe(z){return z.map(ee=>({...ee,id:p.generateId(),status:"Not Started",progress:0,subTasks:ee.subTasks?oe(ee.subTasks):[]}))}p.create("taskTemplates",{name:ae,description:Q,tags:K,tasks:oe(I),createdAt:new Date().toISOString()}),A("Tasklist saved as template","success"),B()}}]})}),(se=e.querySelector("#btn-import-tasklist"))==null||se.addEventListener("click",()=>{const W=p.getAll("taskTemplates"),B=p.getAll("jobs").filter(oe=>oe.id!==s&&oe.tasks&&oe.tasks.length>0);let ae="templates";const Q=document.createElement("div");Q.innerHTML=`
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
      `;function K(oe=""){const z=Q.querySelector("#import-content"),ee=oe.toLowerCase();if(ae==="templates"){const Y=W.filter(re=>re.name.toLowerCase().includes(ee)||(re.description||"").toLowerCase().includes(ee)||(re.tags||[]).some(fe=>fe.toLowerCase().includes(ee)));z.innerHTML=Y.length?Y.map(re=>`
            <div class="import-item" data-id="${re.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${f(re.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(re.tasks||re.phases||[]).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${f(re.description||"No description.")}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(re.tags||[]).map(fe=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${f(fe)}</span>`).join("")}
              </div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${oe}"</div>`}else{const Y=B.filter(re=>re.number.toLowerCase().includes(ee)||re.title.toLowerCase().includes(ee)||re.customerName.toLowerCase().includes(ee));z.innerHTML=Y.length?Y.map(re=>`
            <div class="import-item" data-id="${re.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${f(re.number)} - ${f(re.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${f(re.customerName)} · ${(re.tasks||re.phases||[]).length} tasks</div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${oe}"</div>`}z.querySelectorAll(".import-item").forEach(Y=>{Y.addEventListener("click",()=>{var ne;const re=Y.dataset.id,fe=Y.dataset.type,Ee=p.getAll("taskTemplates"),ie=p.getAll("jobs"),G=fe==="template"?Ee.find(we=>String(we.id)===String(re)):ie.find(we=>String(we.id)===String(re));if(G&&(G.tasks||G.phases)){const we=G.tasks||G.phases;if(confirm(`Replace current tasklist with "${G.name||G.number}"?`)){let be=function(ue){return ue.map(te=>({...te,id:p.generateId(),status:"Not Started",progress:0,subTasks:te.subTasks||te.subPhases?be(te.subTasks||te.subPhases):[]}))};var X=be;I=be(we),_=[0],J=[],A(`Imported ${G.name||G.number}`,"success"),U(),(ne=document.querySelector(".modal-overlay"))==null||ne.remove()}}else A("Could not find source data","error")})})}K(),Q.querySelectorAll(".tab").forEach(oe=>{oe.addEventListener("click",()=>{Q.querySelectorAll(".tab").forEach(z=>z.classList.remove("active")),oe.classList.add("active"),ae=oe.dataset.tab,Q.querySelector("#import-search").placeholder=ae==="templates"?"Search templates...":"Search jobs...",K(Q.querySelector("#import-search").value)})}),Q.querySelector("#import-search").addEventListener("input",oe=>{K(oe.target.value)}),$e({title:"Import Tasklist",content:Q,actions:[{label:"Cancel",className:"btn-secondary",onClick:oe=>oe()}]})})}const j=p.getAll("formTemplates"),P=t?p.getAll("formInstances").filter(L=>L.jobId===s):[];let D=t?P.map(L=>L.templateId):[];function M(){const L=e.querySelector("#jf-forms-container");L&&(L.innerHTML=`
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${j.map(S=>{const F=D.includes(S.id);return`
            <div class="card form-template-selector ${F?"active":""}" data-id="${S.id}" style="cursor:pointer; border:2px solid ${F?"var(--color-primary)":"var(--border-color)"}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${F?"var(--color-primary)":"var(--text-tertiary)"}; background:${F?"var(--color-primary)":"transparent"}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${F?'<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>':""}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${f(S.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${f(S.description||"No description.")}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(S.sections||[]).reduce((O,le)=>O+le.fields.length,0)} Required Fields</div>
                </div>
              </div>
            </div>
          `}).join("")}
        ${j.length?"":'<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>'}
      </div>
    `,L.querySelectorAll(".form-template-selector").forEach(S=>{S.addEventListener("click",()=>{const F=S.dataset.id;D.includes(F)?D=D.filter(O=>O!==F):D.push(F),M()})}))}e.querySelector("#btn-save").addEventListener("click",()=>{var K,oe,z,ee;const L=e.querySelector("#job-form");if(!L.checkValidity()){e.querySelectorAll("#job-form-tabs .tab").forEach(Y=>Y.classList.remove("active")),e.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),e.querySelector("#jf-tab-details").style.display="block",e.querySelector("#jf-tab-tasks").style.display="none",e.querySelector("#jf-tab-forms").style.display="none",L.reportValidity();return}const S=Object.fromEntries(new FormData(L)),F=S.customerId,O=u.find(Y=>Y.id===F);S.customerName=(O==null?void 0:O.company)||"";const le=n.selectedOptions[0];S.siteAddress=(le==null?void 0:le.dataset.address)||"",S.siteName=(le==null?void 0:le.dataset.name)||"";const pe=parseInt(S.primaryContactId),H=parseInt(S.additionalContactId),Z=isNaN(pe)?null:(K=O==null?void 0:O.contacts)==null?void 0:K[pe],V=isNaN(H)?null:(oe=O==null?void 0:O.contacts)==null?void 0:oe[H];S.contactName=(Z==null?void 0:Z.name)||(O?`${O.firstName} ${O.lastName}`:""),S.primaryContactName=(Z==null?void 0:Z.name)||"",S.additionalContactName=(V==null?void 0:V.name)||"",delete S.primaryContactId,delete S.additionalContactId,S.tags=c,S.description=T.innerHTML,S.tasks=I,S.phases=I,S.tasks.forEach(Y=>{Y.subTasks||(Y.subTasks=[]),Y.subPhases=Y.subTasks}),delete S.notes,S.number=a.number||`J-${Date.now().toString().slice(-6)}`;const se=(z=e.querySelector("#is-emergency"))==null?void 0:z.checked;if(S.isEmergency=se,t?se&&!a.isEmergency?S.laborCost=(a.laborCost||0)+150:!se&&a.isEmergency&&(S.laborCost=Math.max(0,(a.laborCost||0)-150)):(S.technicians=[],S.laborCost=se?150:0,S.materialCost=0,S.estimatedHours=0),(ee=e.querySelector("#is-recurring"))!=null&&ee.checked){const Y=e.querySelector("#recurring-freq").value,re=e.querySelector("#recurring-start").value,fe=e.querySelector("#recurring-end").value;if(!re||!fe){A("Recurring dates required","error");return}S.recurringConfig={freq:Y,start:re,end:fe}}const W=t?p.update("jobs",s,S):p.create("jobs",S),B=W.id;let Q=(p.getAll("formInstances")||[]).filter(Y=>{if(Y.jobId!==B)return!0;const re=D.includes(Y.templateId),fe=Y.responses&&Object.keys(Y.responses).length>0;return re||fe});if(D.forEach(Y=>{Q.find(fe=>fe.jobId===B&&fe.templateId===Y)||Q.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:B,templateId:Y,responses:{},status:"Pending",createdAt:new Date().toISOString()})}),p.save("formInstances",Q),!t&&S.recurringConfig){let Y=new Date(S.recurringConfig.start);const re=new Date(S.recurringConfig.end);let fe=0;for(;Y<=re&&fe<50;)p.create("notifications",{type:"Recurring Job Due",jobId:B,title:`Recurring: ${W.title||W.number}`,dueDate:Y.toISOString().split("T")[0],status:"Pending",createdAt:new Date().toISOString()}),S.recurringConfig.freq==="Daily"?Y.setDate(Y.getDate()+1):S.recurringConfig.freq==="Weekly"?Y.setDate(Y.getDate()+7):S.recurringConfig.freq==="Monthly"&&Y.setMonth(Y.getMonth()+1),fe++}A(`Job ${t?"updated":"created"} successfully`,"success"),R.navigate(`/jobs/${B}`)})}function va(e){var $;const s=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),t=s.userTypeId?p.getById("userTypes",s.userTypeId):null,a=t?($=t.permissions)==null?void 0:$.find(y=>y.module==="Timesheets"):null;let u="All",l="All";const c=new Date,o=new Date;o.setDate(c.getDate()-7);const r=y=>{const x=y.getFullYear(),T=String(y.getMonth()+1).padStart(2,"0"),h=String(y.getDate()).padStart(2,"0");return`${x}-${T}-${h}`};let d=r(o),v=r(c),b=[];function i(){var J,N,U,j,P,D,M,L,S,F,O,le,pe;const y=p.getAll("timesheets").sort((H,Z)=>new Date(Z.date)-new Date(H.date)),x=p.getAll("technicians");let T=[...y];const h=["admin","manager","office"].includes(s.role)||a&&a.view,k=a&&a.view_own;!h&&k?T=T.filter(H=>String(H.technicianId)===String(s.id)):!h&&!k&&s.role!=="admin"&&(T=[]);let w=u==="All"?[...T]:T.filter(H=>H.status===u);h&&l!=="All"&&(w=w.filter(H=>String(H.technicianId)===String(l))),d&&(w=w.filter(H=>(H.date?H.date.split("T")[0]:"")>=d)),v&&(w=w.filter(H=>(H.date?H.date.split("T")[0]:"")<=v));const g=w.filter(H=>H.status==="Pending").reduce((H,Z)=>H+(Z.hours||0),0),E=w.map(H=>H.id),C=E.length>0&&E.every(H=>b.includes(H)),q=b.length>0,I=[];w.forEach(H=>{const V=new Date(H.date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});let se=I.find(W=>W.dateStr===V);se||(se={dateStr:V,items:[],total:0},I.push(se)),se.items.push(H),se.total+=H.hours||0}),e.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          ${Te("Timesheets","export")?`
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
            <button class="btn btn-primary" id="btn-approve-all-pending" ${T.some(H=>H.status==="Pending")?"":"disabled"}>
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
            <button class="toolbar-filter ${u==="All"?"active":""}" data-status="All">All</button>
            <button class="toolbar-filter ${u==="Pending"?"active":""}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${u==="Approved"?"active":""}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${u==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
          </div>
          
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Date Range:</label>
            <input type="date" class="form-input" id="filter-date-start" value="${d}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
            <span style="font-size:12px; color:var(--text-secondary)">to</span>
            <input type="date" class="form-input" id="filter-date-end" value="${v}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
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
                ${x.map(H=>`<option value="${H.id}" ${l===H.id?"selected":""}>${H.name}</option>`).join("")}
              </select>
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-next" title="Next technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_right</span>
              </button>
            </div>
          </div>
        `:""}
      </div>

      <div id="bulk-actions-bar" style="display:${q?"flex":"none"}; align-items:center; justify-content:space-between; background:var(--color-primary-light); border:1px solid var(--color-primary); padding:10px 16px; border-radius:var(--border-radius); margin-bottom:12px; transition: all 0.2s ease;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:600; color:var(--color-primary); font-size:14px;"><span id="selected-count">${b.length}</span> items selected</span>
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
          ${Te("Timesheets","export")?`
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
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${C?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
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
              ${I.length===0?'<tr><td colspan="9" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>':I.map(H=>`
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="5" style="color:var(--text-primary)">${H.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${H.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${H.items.map(Z=>{const V=String(Z.technicianId)===String(s.id),se=a&&a.edit===!0||V,W=a&&a.delete===!0||V,B=["admin","manager","office"].includes(s.role)||se&&Z.status!=="Approved",ae=["admin","manager","office"].includes(s.role)||W&&Z.status!=="Approved",Q=b.includes(Z.id);return`
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${Z.id}" ${Q?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
                    <td class="text-secondary" style="font-size:12px">${new Date(Z.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${f(Z.technicianName)}</span></td>
                    <td><a href="#/jobs/${Z.jobId}" class="cell-link">${f(Z.jobNumber||Z.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${f(Z.taskName||"—")}</span></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${f(Z.description||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${Z.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${Z.status==="Approved"?"badge-success":Z.status==="Rejected"?"badge-danger":"badge-warning"}">
                        ${f(Z.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${B?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${Z.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:18px">edit</span>
                          </button>
                        `:""}
                        ${ae?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-timesheet" data-id="${Z.id}" title="Delete entry" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">delete</span>
                          </button>
                        `:""}
                        ${["admin","manager"].includes(s.role)&&Z.status==="Pending"?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-approve-single" data-id="${Z.id}" title="Approve entry" style="color:var(--color-success)">
                            <span class="material-icons-outlined" style="font-size:18px">check</span>
                          </button>
                          <button class="btn btn-ghost btn-sm btn-icon btn-reject-single" data-id="${Z.id}" title="Reject entry" style="color:var(--color-danger)">
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
    `,e.querySelectorAll(".toolbar-filter").forEach(H=>{H.addEventListener("click",()=>{u=H.dataset.status,i()})}),(J=e.querySelector("#filter-tech"))==null||J.addEventListener("change",H=>{l=H.target.value,i()});const _=["All",...x.map(H=>String(H.id))];(N=e.querySelector("#btn-tech-prev"))==null||N.addEventListener("click",()=>{const H=_.indexOf(String(l));if(H!==-1){const Z=(H-1+_.length)%_.length;l=_[Z],i()}}),(U=e.querySelector("#btn-tech-next"))==null||U.addEventListener("click",()=>{const H=_.indexOf(String(l));if(H!==-1){const Z=(H+1)%_.length;l=_[Z],i()}}),(j=e.querySelector("#filter-date-start"))==null||j.addEventListener("change",H=>{d=H.target.value,i()}),(P=e.querySelector("#filter-date-end"))==null||P.addEventListener("change",H=>{v=H.target.value,i()}),(D=e.querySelector("#th-select-all"))==null||D.addEventListener("change",H=>{H.target.checked?E.forEach(Z=>{b.includes(Z)||b.push(Z)}):b=b.filter(Z=>!E.includes(Z)),i()}),e.querySelectorAll(".row-checkbox").forEach(H=>{H.addEventListener("change",Z=>{const V=H.dataset.id;Z.target.checked?b.includes(V)||b.push(V):b=b.filter(se=>se!==V),i()})}),(M=e.querySelector("#btn-bulk-deselect"))==null||M.addEventListener("click",()=>{b=[],i()}),(L=e.querySelector("#btn-bulk-approve"))==null||L.addEventListener("click",()=>{b.length!==0&&(b.forEach(H=>{p.update("timesheets",H,{status:"Approved"})}),A(`Approved ${b.length} timesheets successfully`,"success"),b=[],i())}),(S=e.querySelector("#btn-bulk-reject"))==null||S.addEventListener("click",()=>{b.length!==0&&(b.forEach(H=>{p.update("timesheets",H,{status:"Rejected"})}),A(`Rejected ${b.length} timesheets`,"error"),b=[],i())}),(F=e.querySelector("#btn-bulk-export"))==null||F.addEventListener("click",()=>{if(b.length===0)return;const Z=p.getAll("timesheets").filter(oe=>b.includes(oe.id));if(Z.length===0){A("No entries found to export","error");return}const se=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description","Status"].join(",")];Z.forEach(oe=>{const z=oe.startTime?new Date(oe.startTime).toLocaleString():"",ee=oe.finishTime?new Date(oe.finishTime).toLocaleString():"",Y=[oe.date||"",`"${(oe.technicianName||"").replace(/"/g,'""')}"`,`"${(oe.jobNumber||"").replace(/"/g,'""')}"`,`"${(oe.taskName||"").replace(/"/g,'""')}"`,`"${z}"`,`"${ee}"`,oe.hours||0,`"${(oe.description||"").replace(/"/g,'""')}"`,oe.status||""];se.push(Y.join(","))});const W=se.join(`
`),B=new Blob([W],{type:"text/csv;charset=utf-8;"}),ae=URL.createObjectURL(B),Q=document.createElement("a");Q.setAttribute("href",ae);const K=new Date().toISOString().split("T")[0];Q.setAttribute("download",`FieldForge_Selected_Timesheets_${K}.csv`),Q.style.visibility="hidden",document.body.appendChild(Q),Q.click(),document.body.removeChild(Q),A(`Exported ${Z.length} selected timesheets to CSV!`,"success"),b=[],i()}),(O=e.querySelector("#btn-approve-all-pending"))==null||O.addEventListener("click",()=>{const H=T.filter(Z=>Z.status==="Pending");H.forEach(Z=>p.update("timesheets",Z.id,{status:"Approved"})),A(`Approved ${H.length} pending timesheets`,"success"),i()}),e.querySelectorAll(".btn-approve-single").forEach(H=>{H.addEventListener("click",()=>{p.update("timesheets",H.dataset.id,{status:"Approved"}),A("Timesheet entry approved","success"),i()})}),e.querySelectorAll(".btn-reject-single").forEach(H=>{H.addEventListener("click",()=>{p.update("timesheets",H.dataset.id,{status:"Rejected"}),A("Timesheet entry rejected","error"),i()})}),e.querySelectorAll(".btn-edit-timesheet").forEach(H=>{H.addEventListener("click",()=>{n(H.dataset.id)})}),e.querySelectorAll(".btn-delete-timesheet").forEach(H=>{H.addEventListener("click",()=>{const Z=H.dataset.id,V=p.getById("timesheets",Z);V&&$e({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${V.hours} hrs</strong> on <strong>${new Date(V.date).toLocaleDateString()}</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:se=>se()},{label:"Delete",className:"btn-danger",onClick:se=>{p.delete("timesheets",Z),A("Timesheet entry deleted successfully","success"),se(),i()}}]})})}),(le=e.querySelector("#btn-export-approved"))==null||le.addEventListener("click",()=>{const H=p.getAll("timesheets"),Z=["admin","manager","office"].includes(s.role);let V=H.filter(z=>z.status==="Approved");if(d&&(V=V.filter(z=>z.date>=d)),v&&(V=V.filter(z=>z.date<=v)),Z)l&&l!=="All"&&(V=V.filter(z=>z.technicianId===l));else{const ee=p.getAll("technicians").find(re=>re.name===s.name),Y=ee?ee.id:null;V=V.filter(re=>re.technicianId===Y||re.technicianName===s.name)}if(V.length===0){A("No approved timesheets found to export","error");return}const W=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description"].join(",")];V.forEach(z=>{const ee=z.startTime?new Date(z.startTime).toLocaleString():"",Y=z.finishTime?new Date(z.finishTime).toLocaleString():"",re=[z.date||"",`"${(z.technicianName||"").replace(/"/g,'""')}"`,`"${(z.jobNumber||"").replace(/"/g,'""')}"`,`"${(z.taskName||"").replace(/"/g,'""')}"`,`"${ee}"`,`"${Y}"`,z.hours||0,`"${(z.description||"").replace(/"/g,'""')}"`];W.push(re.join(","))});const B=W.join(`
`),ae=new Blob([B],{type:"text/csv;charset=utf-8;"}),Q=URL.createObjectURL(ae),K=document.createElement("a");K.setAttribute("href",Q);const oe=new Date().toISOString().split("T")[0];K.setAttribute("download",`FieldForge_Approved_Timesheets_${oe}.csv`),K.style.visibility="hidden",document.body.appendChild(K),K.click(),document.body.removeChild(K),A(`Exported ${V.length} approved timesheets to CSV!`,"success")}),(pe=e.querySelector("#btn-log-time"))==null||pe.addEventListener("click",()=>{m()})}function n(y){ds(y,i)}function m(){const y={},x={};function T(D,M=[],L=[]){D&&D.forEach((S,F)=>{const O=[...M,F].join("-"),le=[...L,S.name].join(" > ");y[O]=le,S.id&&(x[S.id]=O),S.subTasks&&T(S.subTasks,[...M,F],[...L,S.name])})}function h(D,M=[]){return!D||D.length===0?"":D.map((L,S)=>{const F=[...M,S],O=F.join("-"),le=L.subTasks&&L.subTasks.length>0;return`
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${le?"parent-node":"leaf-node"}" data-path="${O}" data-name="${f(L.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${le?`
                  <span class="material-icons-outlined tree-node-toggle" data-path="${O}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                `:`
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${le?"600":"400"}">${f(L.name)}</span>
              </div>
              ${le?`
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${L.subTasks.length} subtasks</span>
              `:""}
            </div>
            ${le?`
              <div class="tree-node-children" id="children-${O}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${h(L.subTasks,F)}
              </div>
            `:""}
          </div>
        `}).join("")}const k=new Date,w=D=>D.toString().padStart(2,"0"),g=`${k.getFullYear()}-${w(k.getMonth()+1)}-${w(k.getDate())}`,E=`${g}T09:00`,C=`${g}T10:00`,q=p.getAll("technicians"),I=p.getAll("jobs").filter(D=>D.status!=="Completed"&&D.status!=="Invoiced"),_=document.createElement("div");_.innerHTML=`
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
          <input type="datetime-local" class="form-input" id="lt-finish" value="${C}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${q.map(D=>`<option value="${D.id}" ${l===D.id?"selected":""}>${D.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${I.map(D=>`<option value="${D.id}">${D.number} - ${f(D.customerName)} (${f(D.title)})</option>`).join("")}
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
    `;const J=_.querySelector("#lt-job"),N=_.querySelector("#lt-task-trigger"),U=_.querySelector("#lt-task-dropdown"),j=_.querySelector("#lt-task"),P=_.querySelector("#lt-task-name");N.addEventListener("click",D=>{D.stopPropagation();const M=U.style.display==="block";U.style.display=M?"none":"block"}),document.addEventListener("click",D=>{_.contains(D.target)||(U.style.display="none")}),J.addEventListener("change",D=>{const M=D.target.value;if(!M){N.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',N.disabled=!0,U.style.display="none",j.value="",P.value="";return}const L=I.find(S=>S.id===M);if(!L||!L.tasks||L.tasks.length===0){N.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',N.disabled=!0,U.style.display="none",j.value="",P.value="";return}for(const S in y)delete y[S];for(const S in x)delete x[S];T(L.tasks),U.innerHTML=h(L.tasks),N.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',N.disabled=!1,U.querySelectorAll(".tree-node-toggle").forEach(S=>{S.addEventListener("click",F=>{F.stopPropagation();const O=S.dataset.path,le=U.querySelector(`#children-${O}`);if(le){const pe=le.style.display==="none";le.style.display=pe?"block":"none",S.classList.toggle("expanded",pe)}})}),U.querySelectorAll(".tree-node-row").forEach(S=>{S.addEventListener("click",F=>{if(F.target.classList.contains("tree-node-toggle"))return;const O=S.dataset.path,le=O.split("-").map(Number),pe=I.find(se=>se.id===M);function H(se,W){let B=se[W[0]];for(let ae=1;ae<W.length;ae++){if(!B||!B.subTasks)return!1;B=B.subTasks[W[ae]]}return B&&B.subTasks&&B.subTasks.length>0}if(H(pe.tasks||[],le)){const se=U.querySelector(`#children-${O}`),W=U.querySelector(`.tree-node-toggle[data-path="${O}"]`);if(se){const B=se.style.display==="none";se.style.display=B?"block":"none",W&&W.classList.toggle("expanded",B)}return}const V=y[O]||S.dataset.name;j.value=O,P.value=V,N.innerHTML=`<span>${f(V)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,U.style.display="none"})})}),$e({title:"Log Time on Behalf of Staff",content:_,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:D=>D()},{label:"Log Time",className:"btn-primary",onClick:D=>{const M=document.getElementById("lt-start").value,L=document.getElementById("lt-finish").value,S=document.getElementById("lt-tech").value,F=document.getElementById("lt-job").value,O=document.getElementById("lt-task").value,le=document.getElementById("lt-task-name").value,pe=document.getElementById("lt-desc").value;if(!M||!L||!S||!F||!O){A("Please fill all required fields, including the task","error");return}const H=new Date(M),Z=new Date(L);if(Z<=H){A("Finish time must be after start time","error");return}const V=Math.round((Z-H)/36e5*100)/100,se=q.find(B=>B.id===S),W=I.find(B=>B.id===F);p.create("timesheets",{jobId:W.id,jobNumber:W.number,taskId:O,taskName:le,technicianId:S,technicianName:se.name,date:M.split("T")[0],startTime:M,finishTime:L,hours:V,description:pe||"",status:"Pending"}),A("Time logged successfully on behalf of staff","success"),D(),i()}}]})}i()}const Tt=[{value:"call",label:"Call",icon:"phone",color:"#3B82F6"},{value:"meeting",label:"Meeting",icon:"groups",color:"#8B5CF6"},{value:"follow-up",label:"Follow-up",icon:"reply",color:"#F59E0B"},{value:"site-visit",label:"Site Visit",icon:"location_on",color:"#10B981"},{value:"email",label:"Email",icon:"email",color:"#06B6D4"},{value:"task",label:"Task",icon:"task_alt",color:"#64748B"},{value:"other",label:"Other",icon:"more_horiz",color:"#94A3B8"}];function ya(e){return Tt.find(s=>s.value===e)||Tt[6]}function Gt(e,s){if(!e||!s)return null;const t={job:"/jobs/",quote:"/quotes/",invoice:"/invoices/",customer:"/customers/",lead:"/leads/"};return t[e]?t[e]+s:null}function fa(e,{getWeekDays:s,viewMode:t,currentDate:a,calendarType:u,isTechnician:l,onNav:c,onToday:o,onViewMode:r,onCalType:d}){const v=s(),b=["January","February","March","April","May","June","July","August","September","October","November","December"],i=JSON.parse(localStorage.getItem("currentUser")||"{}"),n=p.getAll("technicians");let m="active",$=l?i.id:"all";function y(){let g=p.getAll("activities");$!=="all"&&(g=g.filter(C=>C.assignedToId===$));const E=new Date().toISOString().split("T")[0];return m==="active"?g=g.filter(C=>C.status!=="completed"):m==="completed"?g=g.filter(C=>C.status==="completed"):m==="overdue"&&(g=g.filter(C=>C.status!=="completed"&&C.date<E)),g}function x(){let g=p.getAll("activities");$!=="all"&&(g=g.filter(I=>I.assignedToId===$));const E=new Date().toISOString().split("T")[0],C=v.map(I=>I.toISOString().split("T")[0]),q=g.filter(I=>C.includes(I.date));return{total:q.length,completed:q.filter(I=>I.status==="completed").length,pending:q.filter(I=>I.status!=="completed").length,overdue:g.filter(I=>I.status!=="completed"&&I.date<E).length}}function T(g){var N;const E=ya(g.type),C=g.status==="completed",q=new Date().toISOString().split("T")[0],I=!C&&g.date<q,_=Gt(g.linkedType,g.linkedId),J=g.priority==="high"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#EF4444;margin-right:4px" title="High priority"></span>':g.priority==="low"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94A3B8;margin-right:4px" title="Low priority"></span>':"";return`
      <div class="activity-card ${C?"completed":""} ${I?"overdue":""}" data-id="${g.id}" style="
        background:var(--card-bg); border:1px solid ${I?"#FCA5A5":"var(--border-color)"};
        border-left:3px solid ${C?"#94A3B8":E.color}; border-radius:8px;
        padding:12px 14px; transition:all 0.2s; ${C?"opacity:0.6;":""}
        display:flex; gap:12px; align-items:flex-start; position:relative;
      ">
        <div style="width:32px;height:32px;border-radius:8px;background:${E.color}14;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
          <span class="material-icons-outlined" style="font-size:18px;color:${E.color}">${E.icon}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">
            <div style="font-weight:600;font-size:13px;${C?"text-decoration:line-through;color:var(--text-tertiary)":"color:var(--text-primary)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${J}${f(g.title)}
            </div>
            <div style="display:flex;gap:2px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm btn-icon act-toggle-complete" data-id="${g.id}" title="${C?"Mark pending":"Mark complete"}" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:${C?"#10B981":"var(--text-tertiary)"}">${C?"check_circle":"radio_button_unchecked"}</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-edit" data-id="${g.id}" title="Edit" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-delete" data-id="${g.id}" title="Delete" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:var(--color-danger)">close</span>
              </button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-secondary)">
            ${g.time?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">schedule</span>${f(g.time)}${g.duration?` (${g.duration}min)`:""}</span>`:""}
            <span style="display:flex;align-items:center;gap:3px;background:${E.color}14;color:${E.color};padding:1px 6px;border-radius:10px;font-weight:500">${E.label}</span>
            ${g.linkedLabel?`<span class="act-linked-record" data-type="${g.linkedType||""}" data-linked-id="${g.linkedId||""}" style="display:flex;align-items:center;gap:3px;cursor:${_?"pointer":"default"};${_?"color:var(--color-primary);text-decoration:underline;":""}"><span class="material-icons-outlined" style="font-size:13px">link</span>${f(g.linkedLabel)}</span>`:""}
            ${$==="all"?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">person</span>${f(((N=n.find(U=>U.id===g.assignedToId))==null?void 0:N.name)||"Unassigned")}</span>`:""}
          </div>
          ${g.notes?`<div style="margin-top:6px;font-size:12px;color:var(--text-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f(g.notes)}</div>`:""}
        </div>
      </div>`}function h(){const g=y(),E=x(),C=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];e.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">${b[a.getMonth()]} ${a.getFullYear()}</span>
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${u==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${u==="activity"?"active":""}" data-cal="activity">Activities</button>
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
            ${v.map(q=>{const I=q.toISOString().split("T")[0],_=I===new Date().toISOString().split("T")[0],J=g.filter(N=>N.date===I).sort((N,U)=>(N.time||"99:99").localeCompare(U.time||"99:99"));return`
                <div style="margin-bottom:20px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border-color)">
                    ${_?'<span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0"></span>':""}
                    <h4 style="margin:0;font-size:13px;${_?"color:var(--color-primary)":"color:var(--text-secondary)"}">${C[q.getDay()]}, ${q.getDate()} ${b[q.getMonth()]}</h4>
                    <span style="font-size:11px;color:var(--text-tertiary)">${J.length} ${J.length===1?"activity":"activities"}</span>
                  </div>
                  ${J.length===0?'<p style="color:var(--text-tertiary);font-size:12px;margin:0 0 0 16px">No activities scheduled.</p>':`
                    <div style="display:flex;flex-direction:column;gap:8px">${J.map(N=>T(N)).join("")}</div>
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
          ${l?"":`
          <!-- Team Filter -->
          <div style="padding:16px;border-bottom:1px solid var(--border-color)">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">people</span>View By
            </h4>
            <select class="form-select" id="act-tech-filter" style="width:100%">
              <option value="all" ${$==="all"?"selected":""}>All Team Members</option>
              ${n.map(q=>`<option value="${q.id}" ${$===q.id?"selected":""}>${q.name}</option>`).join("")}
            </select>
          </div>`}
          <!-- Quick Create -->
          <div style="padding:16px">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">bolt</span>Quick Add
            </h4>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${Tt.slice(0,5).map(q=>`
                <button class="btn btn-secondary btn-sm act-quick-add" data-type="${q.value}" style="justify-content:flex-start;gap:8px;text-align:left">
                  <span class="material-icons-outlined" style="font-size:16px;color:${q.color}">${q.icon}</span>${q.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>`,w()}function k(g=null){const E=!!g,C=g||{title:"",type:"call",date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""},q=p.getAll("jobs").filter(M=>M.status!=="Completed"&&M.status!=="Invoiced"),I=p.getAll("customers"),_=p.getAll("quotes"),J=document.createElement("div");J.innerHTML=`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="act-title" value="${f(C.title)}" placeholder="e.g. Follow up on quote..." style="width:100%" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Type</label>
          <select class="form-select" id="act-type" style="width:100%">
            ${Tt.map(M=>`<option value="${M.value}" ${C.type===M.value?"selected":""}>${M.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <select class="form-select" id="act-priority" style="width:100%">
            <option value="low" ${C.priority==="low"?"selected":""}>Low</option>
            <option value="normal" ${C.priority==="normal"?"selected":""}>Normal</option>
            <option value="high" ${C.priority==="high"?"selected":""}>High</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="act-date" value="${C.date}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="act-time" value="${C.time||""}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Duration (min)</label>
          <input type="number" class="form-input" id="act-duration" value="${C.duration||""}" min="0" step="5" style="width:100%" />
        </div>
      </div>
      ${l?"":`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Assign To</label>
        <select class="form-select" id="act-assignee" style="width:100%">
          ${n.map(M=>`<option value="${M.id}" ${C.assignedToId===M.id?"selected":""}>${M.name}</option>`).join("")}
        </select>
      </div>`}
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Link To</label>
          <select class="form-select" id="act-link-type" style="width:100%">
            <option value="">None</option>
            <option value="job" ${C.linkedType==="job"?"selected":""}>Job</option>
            <option value="customer" ${C.linkedType==="customer"?"selected":""}>Customer</option>
            <option value="quote" ${C.linkedType==="quote"?"selected":""}>Quote</option>
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Record</label>
          <select class="form-select" id="act-link-record" style="width:100%">
            <option value="">Select...</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="act-notes" rows="3" placeholder="Additional details..." style="width:100%">${f(C.notes||"")}</textarea>
      </div>
      ${E?"":`
      <div style="border:1px solid var(--border-color);border-radius:var(--border-radius);overflow:hidden">
        <label style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text-primary);background:var(--content-bg)">
          <input type="checkbox" id="act-recur-enabled" />
          <span class="material-icons-outlined" style="font-size:16px;color:var(--text-secondary)">repeat</span>
          Make this a recurring activity
        </label>
        <div id="act-recur-details" style="display:none;padding:12px 14px;border-top:1px solid var(--border-color);background:var(--card-bg)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label">Frequency</label>
              <select class="form-select" id="act-recur-freq" style="width:100%">
                <option value="daily">Daily</option>
                <option value="weekly" selected>Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Repeat for</label>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="form-input" id="act-recur-count" value="4" min="2" max="52" style="width:70px" />
                <span style="font-size:12px;color:var(--text-secondary)">occurrences</span>
              </div>
            </div>
          </div>
          <div id="act-recur-weekdays" style="display:flex;gap:4px;flex-wrap:wrap">
            ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((M,L)=>`
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 8px;border:1px solid var(--border-color);border-radius:4px;cursor:pointer">
                <input type="checkbox" class="recur-day-cb" value="${L+1}" ${L<5,""} />${M}
              </label>
            `).join("")}
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-tertiary)">For weekly/fortnightly, select which days. For daily/monthly the date field is used as the anchor.</div>
        </div>
      </div>`}
    `;function N(M,L){const S=J.querySelector("#act-link-record");let F='<option value="">Select...</option>';M==="job"?F+=q.map(O=>`<option value="${O.id}" data-label="Job ${O.number}" ${L===O.id?"selected":""}>${O.number} — ${f(O.title)}</option>`).join(""):M==="customer"?F+=I.map(O=>`<option value="${O.id}" data-label="${f(O.company||O.firstName+" "+O.lastName)}" ${L===O.id?"selected":""}>${f(O.company||O.firstName+" "+O.lastName)}</option>`).join(""):M==="quote"&&(F+=_.map(O=>`<option value="${O.id}" data-label="Quote ${O.number}" ${L===O.id?"selected":""}>${O.number} — ${f(O.customerName||"")}</option>`).join("")),S.innerHTML=F}N(C.linkedType,C.linkedId),J.querySelector("#act-link-type").addEventListener("change",M=>N(M.target.value,""));const U=J.querySelector("#act-recur-enabled"),j=J.querySelector("#act-recur-details"),P=J.querySelector("#act-recur-weekdays"),D=J.querySelector("#act-recur-freq");U&&(U.addEventListener("change",()=>{j.style.display=U.checked?"block":"none"}),D==null||D.addEventListener("change",()=>{P.style.display=D.value==="weekly"||D.value==="fortnightly"?"flex":"none"})),$e({title:E?"Edit Activity":"New Activity",content:J,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:M=>M()},{label:E?"Save Changes":"Create Activity",className:"btn-primary",onClick:M=>{var H,Z,V;const L=J.querySelector("#act-title").value.trim(),S=J.querySelector("#act-date").value;if(!L||!S){A("Title and date are required","error");return}const F=J.querySelector("#act-link-type").value,O=J.querySelector("#act-link-record"),le=O.options[O.selectedIndex],pe={title:L,type:J.querySelector("#act-type").value,priority:J.querySelector("#act-priority").value,date:S,time:J.querySelector("#act-time").value||"",duration:parseInt(J.querySelector("#act-duration").value)||0,assignedToId:l?i.id:((H=J.querySelector("#act-assignee"))==null?void 0:H.value)||i.id,linkedType:F,linkedId:O.value||"",linkedLabel:((Z=le==null?void 0:le.dataset)==null?void 0:Z.label)||"",notes:J.querySelector("#act-notes").value,status:E?C.status:"pending"};if(E)p.update("activities",C.id,pe),A("Activity updated","success");else if((V=J.querySelector("#act-recur-enabled"))==null?void 0:V.checked){const W=J.querySelector("#act-recur-freq").value,B=Math.min(parseInt(J.querySelector("#act-recur-count").value)||4,52),ae=[...J.querySelectorAll(".recur-day-cb:checked")].map(z=>parseInt(z.value)),Q=[],K=new Date(S+"T12:00:00");if(W==="daily")for(let z=0;z<B;z++){const ee=new Date(K);ee.setDate(ee.getDate()+z),Q.push(ee)}else if(W==="weekly"||W==="fortnightly"){const z=W==="fortnightly"?2:1,ee=ae.length>0?ae:[K.getDay()===0?7:K.getDay()];let Y=new Date(K);Y.setDate(Y.getDate()-(Y.getDay()+6)%7);let re=0;for(let fe=0;re<B&&fe<200;fe++){for(const Ee of ee){if(re>=B)break;const ie=new Date(Y);ie.setDate(ie.getDate()+(Ee-1)),ie>=K&&(Q.push(ie),re++)}Y.setDate(Y.getDate()+7*z)}}else if(W==="monthly")for(let z=0;z<B;z++){const ee=new Date(K);ee.setMonth(ee.getMonth()+z),Q.push(ee)}const oe=z=>z.toString().padStart(2,"0");Q.forEach(z=>{const ee=`${z.getFullYear()}-${oe(z.getMonth()+1)}-${oe(z.getDate())}`;p.create("activities",{...pe,date:ee,recurrenceGroup:pe.title+"_"+S})}),A(`Created ${Q.length} recurring activities`,"success")}else p.create("activities",pe),A("Activity created","success");M(),h()}}]})}function w(){var g,E,C,q,I;(g=e.querySelector("#btn-prev"))==null||g.addEventListener("click",()=>c(-1)),(E=e.querySelector("#btn-next"))==null||E.addEventListener("click",()=>c(1)),(C=e.querySelector("#btn-today"))==null||C.addEventListener("click",o),e.querySelectorAll("[data-view]").forEach(_=>_.addEventListener("click",()=>r(_.dataset.view))),e.querySelectorAll("[data-cal]").forEach(_=>_.addEventListener("click",()=>d(_.dataset.cal))),e.querySelectorAll(".act-filter").forEach(_=>_.addEventListener("click",()=>{m=_.dataset.filter,h()})),(q=e.querySelector("#act-tech-filter"))==null||q.addEventListener("change",_=>{$=_.target.value,h()}),(I=e.querySelector("#btn-new-activity"))==null||I.addEventListener("click",()=>k()),e.querySelectorAll(".act-quick-add").forEach(_=>_.addEventListener("click",()=>{const J=_.dataset.type;k({title:"",type:J,date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""})})),e.querySelectorAll(".act-toggle-complete").forEach(_=>_.addEventListener("click",J=>{J.stopPropagation();const N=p.getById("activities",_.dataset.id);N&&(p.update("activities",N.id,{status:N.status==="completed"?"pending":"completed"}),h())})),e.querySelectorAll(".act-edit").forEach(_=>_.addEventListener("click",J=>{J.stopPropagation();const N=p.getById("activities",_.dataset.id);N&&k(N)})),e.querySelectorAll(".act-delete").forEach(_=>_.addEventListener("click",J=>{J.stopPropagation(),$e({title:"Delete Activity",content:"<p>Are you sure you want to delete this activity?</p>",actions:[{label:"Cancel",className:"btn-secondary",onClick:N=>N()},{label:"Delete",className:"btn-danger",onClick:N=>{p.delete("activities",_.dataset.id),A("Activity deleted","success"),N(),h()}}]})})),e.querySelectorAll(".act-linked-record").forEach(_=>_.addEventListener("click",J=>{J.stopPropagation();const N=Gt(_.dataset.type,_.dataset.linkedId);N&&R.navigate(N)}))}h()}function ga(e){const s=p.getAll("technicians"),t=JSON.parse(localStorage.getItem("currentUser")||"{}"),a=t.role==="technician";let u="week",l="schedule",c=new Date;const o=Array.from({length:24},(j,P)=>P);let r=null,d=null,v=new Set(a?[t.id]:s.map(j=>j.id)),b=null,i=0,n=0;const m=32,$=m/4;function y(j){return Math.round(j*4)/4}function x(j){const P=Math.floor(j),D=Math.round((j-P)*60);return`${P.toString().padStart(2,"0")}:${D.toString().padStart(2,"0")}`}function T(){const j=document.getElementById("calendar-scroll");j&&(i=j.scrollTop,n=j.scrollLeft)}function h(){const j=document.getElementById("calendar-scroll");j&&(j.scrollTop=i,j.scrollLeft=n)}function k(){b&&(b.remove(),b=null)}document.addEventListener("click",k);function w(){const j=new Date(c);return u==="day"?[new Date(c)]:(j.setDate(j.getDate()-j.getDay()+1),Array.from({length:5},(P,D)=>{const M=new Date(j);return M.setDate(M.getDate()+D),M}))}function g(){const j=p.getAll("jobs"),P=p.getAll("schedule"),D=[],M=w();P.forEach(S=>{const F=j.find(le=>le.id===S.jobId);if(!F||F.status==="Completed"||F.status==="Invoiced")return;let O=null;if(S.date)O=new Date(S.date+"T12:00:00");else if(S.startTime)O=new Date(S.startTime);else if(S.dayOffset!==void 0){const le=M[0];le&&(O=new Date(le),O.setDate(O.getDate()+S.dayOffset))}O&&M.forEach((le,pe)=>{if(O.toDateString()===le.toDateString()){let H=8,Z=10;if(S.startTime&&S.finishTime){const V=new Date(S.startTime),se=new Date(S.finishTime);H=V.getHours()+V.getMinutes()/60,Z=se.getHours()+se.getMinutes()/60}else S.startHour!==void 0&&S.endHour!==void 0&&(H=S.startHour,Z=S.endHour);D.push({id:S.id,type:"schedule",jobId:F.id,jobNumber:F.number,customerName:F.customerName,title:F.title,technicianId:S.technicianId,dayIdx:pe,startHour:H,endHour:Z,status:F.status,priority:F.priority})}})});const L=new Set(P.map(S=>S.jobId));return j.filter(S=>S.scheduledDate&&!L.has(S.id)&&S.status!=="Completed"&&S.status!=="Invoiced").forEach(S=>{const F=new Date(S.scheduledDate);M.forEach((O,le)=>{if(F.toDateString()===O.toDateString()){const pe=S.startHour!==void 0?S.startHour:7+Math.abs(E(S.id))%6;if(S.technicians&&S.technicians.length>0)S.technicians.forEach(H=>{const Z=H.hours||2;D.push({id:`legacy-${S.id}-${H.id}`,type:"legacy",jobId:S.id,jobNumber:S.number,customerName:S.customerName,title:S.title,technicianId:H.id,dayIdx:le,startHour:pe,endHour:pe+Z,status:S.status,priority:S.priority})});else if(S.technicianId){const H=S.estimatedHours||2;D.push({id:`legacy-${S.id}`,type:"legacy",jobId:S.id,jobNumber:S.number,customerName:S.customerName,title:S.title,technicianId:S.technicianId,dayIdx:le,startHour:pe,endHour:pe+H,status:S.status,priority:S.priority})}}})}),D}function E(j){let P=0;for(let D=0;D<j.length;D++)P=(P<<5)-P+j.charCodeAt(D),P|=0;return P}function C(){T();const j=w(),P=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],D=["January","February","March","April","May","June","July","August","September","October","November","December"];if(l==="activity"){U();return}const M=g(),L=s.filter(S=>v.has(S.id));e.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${D[c.getMonth()]} ${c.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${a?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${t.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${l==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${l==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${u==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${u==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <!-- Calendar Grid + Right Sidebar -->
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 160px);overflow:hidden">
          
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${v.size!==1?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${L.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${L.map(S=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${S.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${S.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${j.map((S,F)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${S.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${P[S.getDay()]}, ${S.getDate()} ${D[S.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${L.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${o.map(le=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${le.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${L.map(le=>{const pe=M.filter(H=>H.technicianId===le.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${le.id}" data-day="${F}" data-date="${j[F].getFullYear()}-${(j[F].getMonth()+1).toString().padStart(2,"0")}-${j[F].getDate().toString().padStart(2,"0")}">
                          ${o.map(H=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${H}"></div>`).join("")}
                          ${I(pe,F,le.color)}
                        </div>
                      `}).join("")}
                  </div>
                `).join("")}
            `:`
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${j.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${j.map(S=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${S.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${P[S.getDay()]} ${S.getDate()} ${D[S.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${j.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${o.map(S=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${S.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${j.map((S,F)=>{const O=s.find(pe=>pe.id===[...v][0]),le=M.filter(pe=>pe.technicianId===O.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${O.id}" data-day="${F}" data-date="${j[F].getFullYear()}-${(j[F].getMonth()+1).toString().padStart(2,"0")}-${j[F].getDate().toString().padStart(2,"0")}">
                      ${o.map(pe=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${pe}"></div>`).join("")}
                      ${I(le,F,O.color)}
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
                ${s.map(S=>`
                  <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                    <input type="checkbox" class="tech-visibility-checkbox" value="${S.id}" ${v.has(S.id)?"checked":""}>
                    <div style="width:10px; height:10px; border-radius:50%; background:${S.color};"></div>
                    <span style="color:var(--text-primary); font-weight:500;">${S.name}</span>
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
                ${q().map(S=>`
                  <div class="unscheduled-job" draggable="true" data-job-id="${S.id}" data-job-number="${S.number}" data-customer="${S.customerName}" data-title="${S.title}" data-hours="${S.estimatedHours||2}" data-priority="${S.priority}" style="padding:10px; background:var(--content-bg); border:1px solid var(--border-color); border-radius:4px; cursor:grab; transition:all 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span class="font-medium" style="font-size:var(--font-size-sm)">${S.number}</span>
                      <span class="badge ${S.priority==="High"||S.priority==="Urgent"?"badge-danger":"badge-neutral"}" style="font-size:9px">${S.priority}</span>
                    </div>
                    <div class="text-secondary" style="font-size:var(--font-size-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${S.customerName}</div>
                  </div>
                `).join("")||'<span class="text-secondary" style="font-size:var(--font-size-sm);">All jobs are scheduled</span>'}
              </div>
            </div>
          </div>
          `}

        </div>
      </div>
    `,_(),J(j),N(),h()}function q(){return p.getAll("jobs").filter(P=>(!P.scheduledDate||!P.technicianId)&&P.status!=="Completed"&&P.status!=="Invoiced")}function I(j,P,D){const M={Urgent:"#EF4444",High:"#F59E0B"};return j.filter(L=>L.dayIdx===P).map(L=>{const S=L.startHour*m,F=Math.max((L.endHour-L.startHour)*m-2,$),O=M[L.priority]||D,le=`${x(L.startHour)} — ${x(L.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${L.jobId}"
            data-schedule-id="${L.id}"
            data-block-type="${L.type}"
            data-start="${L.startHour}"
            data-end="${L.endHour}"
            style="
              top:${S}px;
              height:${F}px;
              background:${D}12;
              border-color:${O};
              color:${D};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${L.jobNumber}</div>
            ${F>20?`<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${L.customerName}</div>`:""}
            ${F>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${le}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${L.jobId}" data-schedule-id="${L.id}" data-block-type="${L.type}" data-start="${L.startHour}" data-end="${L.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function _(){var j,P,D;(j=e.querySelector("#btn-prev"))==null||j.addEventListener("click",()=>{c.setDate(c.getDate()-(u==="week"?7:1)),C()}),(P=e.querySelector("#btn-next"))==null||P.addEventListener("click",()=>{c.setDate(c.getDate()+(u==="week"?7:1)),C()}),(D=e.querySelector("#btn-today"))==null||D.addEventListener("click",()=>{c=new Date,C()}),e.querySelectorAll("[data-view]").forEach(M=>{M.addEventListener("click",()=>{u=M.dataset.view,C()})}),e.querySelectorAll("[data-cal]").forEach(M=>{M.addEventListener("click",()=>{l=M.dataset.cal,C()})}),e.querySelectorAll(".tech-visibility-checkbox").forEach(M=>{M.addEventListener("change",L=>{L.target.checked?v.add(L.target.value):v.delete(L.target.value),C()})}),e.querySelectorAll(".schedule-block").forEach(M=>{M.addEventListener("click",L=>{if(L.defaultPrevented)return;if(M.dataset.resized==="true"){M.dataset.resized="false";return}const S=M.dataset.blockJobId,F=p.getById("jobs",S);F&&Be({title:`Job Quick View: ${F.number}`,content:`
            <div style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label class="form-label">Title</label>
                <div class="font-medium" style="font-size:16px">${F.title||"Untitled"}</div>
              </div>
              <div>
                <label class="form-label">Customer</label>
                <div>${F.customerName||"N/A"}</div>
              </div>
              <div>
                <label class="form-label">Site Address</label>
                <div>${F.siteAddress||"No address provided"}</div>
              </div>
              <div>
                <label class="form-label">Priority</label>
                <div><span class="badge ${F.priority==="Urgent"||F.priority==="High"?"badge-danger":"badge-neutral"}">${F.priority||"Normal"}</span></div>
              </div>
              <div>
                <label class="form-label">Notes</label>
                <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${F.notes||"No notes available"}</div>
              </div>
            </div>
          `,actions:[{label:"Close",className:"btn-secondary",onClick:O=>O()},{label:"Open Full Job",className:"btn-primary",onClick:O=>{O(),R.navigate(`/jobs/${S}`)}}],width:450})}),M.addEventListener("contextmenu",L=>{L.preventDefault(),k();const S=M.dataset.blockJobId;b=document.createElement("div"),b.className="dropdown-menu",b.style.position="fixed",b.style.top=`${L.clientY}px`,b.style.left=`${L.clientX}px`,b.style.zIndex=1e3,b.style.background="var(--card-bg)",b.style.boxShadow="var(--shadow-md)",b.style.border="1px solid var(--border-color)",b.style.borderRadius="var(--border-radius)",b.style.padding="4px 0",b.style.minWidth="140px",b.innerHTML=`
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `,document.body.appendChild(b),b.querySelector("#ctx-view").addEventListener("click",()=>{k(),R.navigate(`/jobs/${S}`)}),b.querySelector("#ctx-unschedule").addEventListener("click",()=>{k(),jobs.find(O=>O.id===S)&&(p.update("jobs",S,{scheduledDate:null}),A("Job unscheduled","success"),C())})})})}function J(j){const P=document.getElementById("calendar-scroll");P&&(P.addEventListener("dragover",D=>{if(!r)return;const M=P.getBoundingClientRect(),L=60,S=15;D.clientY-M.top<L?P.scrollTop-=S:M.bottom-D.clientY<L&&(P.scrollTop+=S)}),P.addEventListener("wheel",D=>{r&&(P.scrollTop+=D.deltaY)},{passive:!0})),e.querySelectorAll(".unscheduled-job").forEach(D=>{D.addEventListener("dragstart",M=>{const L=D.getBoundingClientRect();r={type:"unscheduled",jobId:D.dataset.jobId,jobNumber:D.dataset.jobNumber,customerName:D.dataset.customer,title:D.dataset.title,hours:parseInt(D.dataset.hours)||2,offsetY:M.clientY-L.top},M.dataTransfer.effectAllowed="move",D.style.opacity="0.5"}),D.addEventListener("dragend",()=>{D.style.opacity="1",r=null,document.querySelectorAll(".schedule-drag-preview").forEach(M=>M.remove())})}),e.querySelectorAll(".schedule-block[draggable]").forEach(D=>{D.addEventListener("dragstart",M=>{M.stopPropagation();const L=D.getBoundingClientRect();r={type:"existing",blockType:D.dataset.blockType,scheduleId:D.dataset.scheduleId,jobId:D.dataset.blockJobId,startHour:parseFloat(D.dataset.start),endHour:parseFloat(D.dataset.end),offsetY:M.clientY-L.top},M.dataTransfer.effectAllowed="move",D.style.opacity="0.4"}),D.addEventListener("dragend",()=>{D.style.opacity="1",r=null,document.querySelectorAll(".schedule-drag-preview").forEach(M=>M.remove())})}),e.querySelectorAll(".schedule-day-col").forEach(D=>{D.addEventListener("dragover",M=>{if(M.preventDefault(),M.dataTransfer.dropEffect="move",D.style.background="rgba(27, 109, 224, 0.05)",!r)return;const L=D.getBoundingClientRect(),S=r.offsetY||0,O=(M.clientY-S-L.top)/m,le=Math.min(23.75,Math.max(0,y(O)));let pe=D.querySelector(".schedule-drag-preview");pe||(pe=document.createElement("div"),pe.className="schedule-drag-preview",pe.style.position="absolute",pe.style.left="3px",pe.style.right="3px",pe.style.background="rgba(27, 109, 224, 0.15)",pe.style.border="2px dashed var(--color-primary)",pe.style.borderRadius="4px",pe.style.pointerEvents="none",pe.style.zIndex="10",D.appendChild(pe));const H=r.type==="existing"?r.endHour-r.startHour:r.hours||2,Z=le*m,V=Math.max(H*m-2,$);pe.style.top=Z+"px",pe.style.height=V+"px"}),D.addEventListener("dragleave",M=>{if(!D.contains(M.relatedTarget)){D.style.background="";const L=D.querySelector(".schedule-drag-preview");L&&L.remove()}}),D.addEventListener("drop",M=>{const L=p.getAll("jobs");M.preventDefault(),D.style.background="";const S=D.querySelector(".schedule-drag-preview");if(S&&S.remove(),!r)return;const F=D.dataset.tech,O=parseInt(D.dataset.day),le=D.dataset.date?new Date(D.dataset.date+"T12:00:00"):j[O],pe=D.getBoundingClientRect(),H=r.offsetY||0,V=(M.clientY-H-pe.top)/m,se=Math.min(23.75,Math.max(0,y(V))),W=s.find(ae=>ae.id===F),B=L.find(ae=>ae.id===r.jobId);if(B){const ae=r.type==="existing"?r.endHour-r.startHour:r.hours||B.estimatedHours||2,Q=se+ae;if(g().some(X=>X.technicianId===F&&X.dayIdx===O&&(r.scheduleId?X.id!==r.scheduleId:X.jobId!==B.id)&&Math.max(X.startHour,se)<Math.min(X.endHour,Q))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){r=null;return}const z=X=>X.toString().padStart(2,"0"),ee=`${le.getFullYear()}-${z(le.getMonth()+1)}-${z(le.getDate())}`,Y=Math.floor(se),re=Math.round((se-Y)*60),fe=Math.floor(Q),Ee=Math.round((Q-fe)*60),ie=`${ee}T${z(Y)}:${z(re)}`,G=`${ee}T${z(fe)}:${z(Ee)}`;r.type==="existing"&&r.blockType==="schedule"?(p.update("schedule",r.scheduleId,{technicianId:F,technicianName:(W==null?void 0:W.name)||"",date:ee,startTime:ie,finishTime:G,hours:ae}),A(`Moved ${B.number} for ${W==null?void 0:W.name} to ${ee}`,"success")):(p.create("schedule",{jobId:B.id,jobNumber:B.number,technicianId:F,technicianName:(W==null?void 0:W.name)||"",date:ee,startTime:ie,finishTime:G,hours:ae}),p.update("jobs",B.id,{scheduledDate:ee,startHour:se,technicianId:F,technicianName:(W==null?void 0:W.name)||"",status:B.status==="Pending"?"Scheduled":B.status}),A(`Assigned ${B.number} to ${W==null?void 0:W.name}`,"success"))}r=null,C()})})}function N(){e.querySelectorAll(".schedule-resize-handle").forEach(j=>{j.addEventListener("mousedown",P=>{P.preventDefault(),P.stopPropagation();const D=j.closest(".schedule-block"),M=D.closest(".schedule-day-col"),L=parseFloat(j.dataset.start),S=parseFloat(j.dataset.end);M.getBoundingClientRect(),d={blockType:j.dataset.blockType,scheduleId:j.dataset.scheduleId,jobId:j.dataset.blockJobId,block:D,col:M,startHour:L,endHour:S},D.dataset.resized="false",D.style.opacity="0.85",D.style.userSelect="none",document.body.style.cursor="ns-resize";function F(le){if(!d)return;const pe=d.col.getBoundingClientRect(),Z=(le.clientY-pe.top)/m,V=y(Z),se=d.startHour+.25,W=Math.max(V,se);if(W!==d.endHour){d.endHour=W,d.block.dataset.resized="true";const B=Math.max((W-d.startHour)*m-2,$);d.block.style.height=B+"px";const ae=d.block.querySelector(".schedule-block-time");ae&&(ae.textContent=`${x(d.startHour)} — ${x(W)}`)}}function O(){var V;if(document.removeEventListener("mousemove",F),document.removeEventListener("mouseup",O),document.body.style.cursor="",!d)return;const{jobId:le,startHour:pe,endHour:H}=d,Z=H-pe;if(d.block.style.opacity="",d.block.style.userSelect="",Math.abs(H-S)>=.25)if(d.blockType==="schedule"){const se=p.getById("schedule",d.scheduleId);if(se){const W=se.date||((V=se.startTime)==null?void 0:V.split("T")[0])||new Date().toISOString().split("T")[0],B=z=>z.toString().padStart(2,"0"),ae=Math.floor(pe),Q=Math.round((pe-ae)*60),K=Math.floor(H),oe=Math.round((H-K)*60);p.update("schedule",d.scheduleId,{startTime:`${W}T${B(ae)}:${B(Q)}`,finishTime:`${W}T${B(K)}:${B(oe)}`,hours:Z}),A(`Time updated to ${x(pe)} — ${x(H)}`,"success")}}else{const se=p.getAll("jobs").find(W=>W.id===le);if(se){let W=se.technicians||[];W.length>0&&(W=W.map(B=>({...B,hours:Z}))),p.update("jobs",le,{startHour:pe,estimatedHours:parseFloat(Z.toFixed(4)),technicians:W.length>0?W:se.technicians}),A("Job time updated","success")}}d=null}document.addEventListener("mousemove",F),document.addEventListener("mouseup",O)})})}function U(){fa(e,{getWeekDays:w,viewMode:u,currentDate:c,calendarType:l,isTechnician:a,onNav:j=>{c.setDate(c.getDate()+(u==="week"?7*j:j)),C()},onToday:()=>{c=new Date,C()},onViewMode:j=>{u=j,C()},onCalType:j=>{l=j,C()}})}C()}function st(e){var b;const s=p.getAll("stock");e.innerHTML=`
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
  `;const t=e.querySelector("#location-filter"),a=[...new Set(s.flatMap(i=>(i.locations||[]).map(n=>n.location||"Unassigned")))].sort(),u=a.filter(i=>i.toLowerCase().includes("warehouse")||i==="Main"||i==="Main Warehouse"),l=a.filter(i=>i.toLowerCase().includes("vehicle")||i.toLowerCase().includes("van")||i.toLowerCase().includes("truck")||i.toLowerCase().includes("van stock")),c=a.filter(i=>!u.includes(i)&&!l.includes(i));if(u.length>0){const i=document.createElement("optgroup");i.label="Warehouses",u.forEach(n=>{const m=new Option(n,n);i.appendChild(m)}),t.appendChild(i)}if(l.length>0){const i=document.createElement("optgroup");i.label="Vehicles / Vans",l.forEach(n=>{const m=new Option(n,n);i.appendChild(m)}),t.appendChild(i)}if(c.length>0){const i=document.createElement("optgroup");i.label="Other",c.forEach(n=>{const m=new Option(n,n);i.appendChild(m)}),t.appendChild(i)}let o={category:"all",location:"all",search:""};function r(){const i=o.search.toLowerCase(),n=s.filter(m=>{const $=o.category==="all"||m.category===o.category,y=o.location==="all"||(m.locations||[]).some(T=>T.location===o.location),x=!i||m.name.toLowerCase().includes(i)||m.sku.toLowerCase().includes(i)||m.category.toLowerCase().includes(i)||(m.locations||[]).some(T=>T.location.toLowerCase().includes(i));return $&&y&&x});v.updateData(n)}const v=He({columns:[{key:"name",label:"Item Name",render:i=>`<span class="cell-link font-medium">${f(i.name)}</span>`},{key:"sku",label:"SKU",render:i=>`<span class="text-secondary" style="font-family:monospace">${f(i.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:i=>`<span class="badge badge-neutral">${f(i.category)}</span>`,width:"110px"},{key:"quantity",label:"Total Qty",render:i=>{const n=(i.locations||[]).reduce(($,y)=>$+y.quantity,0),m=n<=i.reorderLevel;return`<span style="font-weight:600;color:${m?"var(--color-danger)":"var(--text-primary)"}">${n}</span>${m?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:i=>(i.locations||[]).reduce((n,m)=>n+m.quantity,0),width:"100px"},{key:"unitPrice",label:"Unit Price",render:i=>`$${i.unitPrice.toFixed(2)}`,getValue:i=>i.unitPrice,width:"100px"},{key:"locations",label:"Locations Breakdown",render:i=>!i.locations||i.locations.length===0?'<span class="text-tertiary" style="font-size: 12px;">No Stock</span>':`<div style="display:flex; flex-direction:column; gap:4px">
        ${i.locations.map(n=>`
            <div style="display:flex; align-items:center; gap:6px; font-size:12px">
              <span class="material-icons-outlined" style="font-size:14px; color:var(--text-tertiary)">${n.location.toLowerCase().includes("vehicle")||n.location.toLowerCase().includes("van")||n.location.toLowerCase().includes("truck")?"local_shipping":"warehouse"}</span>
              <span class="text-secondary" style="font-weight:500">${f(n.location)}:</span>
              <span style="font-weight:600; color:var(--text-primary)">${n.quantity}</span>
            </div>
          `).join("")}
      </div>`,width:"240px"},{key:"supplier",label:"Supplier",render:i=>`<span class="text-secondary">${f(i.supplier)}</span>`}],data:s,onRowClick:i=>R.navigate(`/stock/${i}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:i=>{Je({container:e,selectedIds:i,onClear:()=>v.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:n=>{const m=[...new Set(p.getAll("stock").map(y=>y.category))],$=document.createElement("div");$.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${m.map(y=>`<option value="${f(y)}">${f(y)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,$.querySelector("#bulk-category").addEventListener("change",y=>{$.querySelector("#new-cat-field").style.display=y.target.value==="NEW"?"block":"none"}),$e({title:`Update ${n.length} Items`,content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Apply",className:"btn-primary",onClick:y=>{let x=$.querySelector("#bulk-category").value;x==="NEW"&&(x=$.querySelector("#bulk-new-category").value.trim()),x&&(n.forEach(T=>p.update("stock",T,{category:x})),v.clearSelection(),st(e),A(`Updated ${n.length} items to category: ${x}`,"success"),y())}}]})}},{label:"Adjust Price",icon:"payments",onClick:n=>{const m=document.createElement("div");m.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,$e({title:`Adjust Price for ${n.length} Items`,content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Apply",className:"btn-primary",onClick:$=>{const y=parseFloat(m.querySelector("#bulk-price-adjust").value);if(isNaN(y))return;const x=1+y/100;n.forEach(T=>{const h=p.getById("stock",T);h&&p.update("stock",T,{unitPrice:h.unitPrice*x})}),v.clearSelection(),st(e),A(`Adjusted prices for ${n.length} items by ${y}%`,"success"),$()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:n=>{$e({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${n.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{n.forEach($=>p.delete("stock",$)),v.clearSelection(),st(e),A(`Deleted ${n.length} stock items`,"success"),m()}}]})}}]})}});e.querySelector("#stock-table-container").appendChild(v),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(n=>n.classList.remove("active")),i.classList.add("active"),o.category=i.dataset.filter,r()})}),e.querySelector("#location-filter").addEventListener("change",i=>{o.location=i.target.value,r()}),e.querySelector("#stock-search").addEventListener("input",i=>{o.search=i.target.value,r()}),e.querySelector("#btn-new-stock").addEventListener("click",()=>{const i=p.getAll("technicians"),n=document.createElement("div");n.innerHTML=`
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
              ${i.map(m=>`<option value="Vehicle - ${f(m.name)}">Vehicle - ${f(m.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cost Price ($) *</label>
          <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
        </div>
        <div class="form-group">
          <label class="form-label">Initial Stock Quantity *</label>
          <input type="number" class="form-input" id="new-stock-qty" min="0" value="0" />
        </div>
      </div>
    `,Be({title:"New Stock Item",content:n.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create",className:"btn-primary",onClick:m=>{const $=document.querySelector(".drawer-overlay"),y=$.querySelector("#new-stock-name").value.trim(),x=$.querySelector("#new-stock-category").value.trim()||"Uncategorized",T=$.querySelector("#new-stock-location").value,h=parseFloat($.querySelector("#new-stock-cost").value),k=parseInt($.querySelector("#new-stock-qty").value)||0;if(!y||isNaN(h)){A("Please fill all required fields correctly","error");return}p.create("stock",{name:y,sku:"SKU-"+Date.now().toString().slice(-6),category:x,quantity:k,unitPrice:h*1.5,costPrice:h,location:T,locations:[{location:T,quantity:k}],supplier:"Unknown"}),A("Stock item created","success"),st(e),m()}}]})}),(b=e.querySelector("#btn-transfer-stock"))==null||b.addEventListener("click",()=>{const i=p.getAll("stock"),n=p.getAll("technicians");if(i.length===0){A("No stock items available to transfer","error");return}const m=document.createElement("div");m.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${i.map($=>`<option value="${f($.id)}">${f($.name)} (${f($.sku)})</option>`).join("")}
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Source Location *</label>
            <select class="form-select" id="transfer-from" disabled>
              <option value="">Select an item first...</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select destination...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <optgroup label="Warehouses">
                <option value="Warehouse A">Warehouse A</option>
                <option value="Warehouse B">Warehouse B</option>
              </optgroup>
              <optgroup label="Vehicles">
                ${n.map($=>`<option value="Vehicle - ${f($.name)}">Vehicle - ${f($.name)}</option>`).join("")}
              </optgroup>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Quantity to Transfer *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" disabled />
            <small class="text-tertiary" id="transfer-available-info" style="display:none; margin-top:4px"></small>
          </div>
        </div>
      </div>
    `,Be({title:"Transfer Stock",content:m.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Transfer",className:"btn-primary",onClick:$=>{var C;const y=document.querySelector(".drawer-overlay"),x=y.querySelector("#transfer-item").value,T=y.querySelector("#transfer-from").value,h=y.querySelector("#transfer-to").value,k=parseInt(y.querySelector("#transfer-qty").value)||0;if(!x||!T||!h||k<=0){A("Please fill all fields correctly","error");return}if(T===h){A("Cannot transfer to the same location","error");return}const w=p.getById("stock",x);if(!w)return;const g=(w.locations||[]).find(q=>q.location===T);if(!g||g.quantity<k){A("Insufficient quantity at source location","error");return}g.quantity-=k,w.locations||(w.locations=[]);let E=w.locations.find(q=>q.location===h);E?E.quantity+=k:w.locations.push({location:h,quantity:k}),w.locations=w.locations.filter(q=>q.quantity>0),w.quantity=w.locations.reduce((q,I)=>q+I.quantity,0),w.location=((C=w.locations[0])==null?void 0:C.location)||"Main Warehouse",p.update("stock",w.id,w),A(`Successfully transferred ${k}x ${w.name} to ${h}`,"success"),st(e),$()}}]}),setTimeout(()=>{const $=document.querySelector(".drawer-overlay");if(!$)return;const y=$.querySelector("#transfer-item"),x=$.querySelector("#transfer-from"),T=$.querySelector("#transfer-qty"),h=$.querySelector("#transfer-available-info");y.addEventListener("change",()=>{const w=y.value;if(!w){x.innerHTML='<option value="">Select an item first...</option>',x.disabled=!0,T.disabled=!0,h.style.display="none";return}const g=i.find(C=>C.id===w);if(!g||!g.locations||g.locations.length===0){x.innerHTML='<option value="">No locations available</option>',x.disabled=!0,T.disabled=!0,h.style.display="none";return}const E=g.locations.filter(C=>C.quantity>0);if(E.length===0){x.innerHTML='<option value="">Out of stock everywhere</option>',x.disabled=!0,T.disabled=!0,h.style.display="none";return}x.innerHTML=E.map(C=>`
          <option value="${f(C.location)}" data-max="${C.quantity}">${f(C.location)} (Available: ${C.quantity})</option>
        `).join(""),x.disabled=!1,T.disabled=!1,k()}),x.addEventListener("change",k);function k(){const w=x.options[x.selectedIndex];if(!w)return;const g=parseInt(w.dataset.max)||0;T.max=g,T.value=Math.min(T.value||1,g),h.textContent=`Max available: ${g}`,h.style.display="block"}},100)})}function ha(e,{id:s}){const t=p.getById("stock",s);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}Ge(t.name);const a=(t.locations||[]).reduce((o,r)=>o+r.quantity,0),u=a<=t.reorderLevel,l=t.unitPrice>0?((t.unitPrice-t.costPrice)/t.unitPrice*100).toFixed(1):0,c=(t.locations||[]).map(o=>`
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-color)">
        <div style="display:flex; align-items:center; gap:8px">
          <span class="material-icons-outlined" style="font-size:20px; color:var(--text-tertiary)">${o.location.toLowerCase().includes("vehicle")||o.location.toLowerCase().includes("van")||o.location.toLowerCase().includes("truck")?"local_shipping":"warehouse"}</span>
          <span class="text-secondary" style="font-weight:500">${f(o.location)}</span>
        </div>
        <span style="font-weight:600; font-size:14px; color:var(--text-primary)">${o.quantity} ${f(t.unit||"each")}s</span>
      </div>
    `).join("")||'<div class="text-tertiary" style="padding:12px 0">No stock in any location</div>';e.innerHTML=`
    ${Ke({title:t.name,icon:"inventory_2",iconBgColor:u?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:u?"var(--color-danger)":"var(--color-success)",metaHtml:`
        <span style="font-family:monospace">${t.sku}</span>
        <span class="badge badge-neutral">${t.category}</span>
        ${u?'<span class="badge badge-danger">LOW STOCK</span>':'<span class="badge badge-success">IN STOCK</span>'}
      `,actionsHtml:`
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `})}

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Consolidated Stock</div>
        <div class="stat-value" style="color:${u?"var(--color-danger)":"var(--text-primary)"}">${a}</div>
        <div class="text-sm text-secondary">Reorder at ${t.reorderLevel} ${t.unit}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unit Price</div>
        <div class="stat-value">$${t.unitPrice.toFixed(2)}</div>
        <div class="text-sm text-secondary">Cost: $${t.costPrice.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profit Margin</div>
        <div class="stat-value">${l}%</div>
        <div class="text-sm text-secondary">Stock Value (Cost): $${(a*t.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="card">
          <div class="card-header"><h4>Location Stock Breakdown</h4></div>
          <div class="card-body" style="padding-top:0">
            ${c}
          </div>
        </div>
        
        <div class="card">
          <div class="card-header"><h4>Item Details</h4></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px">
              ${Ve("Name",t.name)}
              ${Ve("SKU",t.sku)}
              ${Ve("Category",t.category)}
              ${Ve("Unit",t.unit)}
              ${Ve("Supplier",t.supplier)}
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="height: fit-content;">
        <div class="card-header"><h4>Pricing & Value</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Ve("Cost Price",`$${t.costPrice.toFixed(2)}`)}
            ${Ve("Sell Price",`$${t.unitPrice.toFixed(2)}`)}
            ${Ve("Margin",`${l}%`)}
            ${Ve("Consolidated Value (Sell)",`$${(a*t.unitPrice).toFixed(2)}`)}
            ${Ve("Consolidated Value (Cost)",`$${(a*t.costPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit-stock").addEventListener("click",()=>R.navigate(`/stock/${s}/edit`)),e.querySelector("#btn-delete-stock").addEventListener("click",()=>{const o=document.createElement("div");o.innerHTML=`<p>Delete <strong>${f(t.name)}</strong>?</p>`,$e({title:"Delete Stock Item",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Delete",className:"btn-danger",onClick:r=>{p.delete("stock",s),A("Item deleted","success"),r(),R.navigate("/stock")}}]})})}function Ve(e,s){return`<div style="display:flex;gap:8px"><span style="width:180px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span style="font-weight:600">${s}</span></div>`}function ps(e,{id:s}){const t=s&&s!=="new",a=t?p.getById("stock",s):{},u=p.getAll("technicians"),l=p.getAll("assets"),c=p.getAll("suppliers").filter(i=>i.active!==!1);function o(i=""){let n='<option value="">Select location...</option>';return n+=`<option value="Main Warehouse" ${i==="Main Warehouse"?"selected":""}>Main Warehouse</option>`,n+='<optgroup label="Warehouses">',["Warehouse A","Warehouse B"].forEach(m=>{n+=`<option value="${m}" ${i===m?"selected":""}>${m}</option>`}),n+="</optgroup>",n+='<optgroup label="Vehicles">',u.forEach(m=>{const $=`Vehicle - ${m.name}`;n+=`<option value="${$}" ${i===$?"selected":""}>${$}</option>`}),n+="</optgroup>",n+='<optgroup label="Assets">',l.forEach(m=>{n+=`<option value="${m.name}" ${i===m.name?"selected":""}>${m.name}</option>`}),n+="</optgroup>",n+=`<option value="On Order" ${i==="On Order"?"selected":""}>On Order</option>`,n}function r(i="",n=0){return`
      <div class="location-row" style="display:flex; gap:12px; align-items:center; margin-bottom:10px">
        <div style="flex:1">
          <select class="form-select loc-select" required style="width:100%">
            ${o(i)}
          </select>
        </div>
        <div style="width:120px">
          <input type="number" class="form-input loc-qty" min="0" value="${n}" required style="width:100%" />
        </div>
        <div>
          <button type="button" class="btn btn-icon btn-danger btn-remove-loc" style="padding:6px"><span class="material-icons-outlined">delete</span></button>
        </div>
      </div>
    `}let d="";t&&a.locations&&a.locations.length>0?d=a.locations.map(i=>r(i.location,i.quantity)).join(""):d=r(a.location||"Warehouse A",a.quantity||0),e.innerHTML=`
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
              <input class="form-input" name="sku" value="${a.sku||""}" placeholder="e.g. SKU-1000" />
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
              <label class="form-label">Reorder Level</label>
              <input class="form-input" type="number" name="reorderLevel" value="${a.reorderLevel||"10"}" min="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cost Price ($) *</label>
              <input class="form-input" type="number" name="costPrice" value="${a.costPrice||""}" step="0.01" required min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Sell Price ($) *</label>
              <input class="form-input" type="number" name="unitPrice" value="${a.unitPrice||""}" step="0.01" required min="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Supplier</label>
            <select class="form-input" name="supplier">
              <option value="">Select a supplier...</option>
              ${c.map(i=>`<option value="${f(i.name)}" ${a.supplier===i.name?"selected":""}>${f(i.name)}</option>`).join("")}
              ${a.supplier&&!c.some(i=>i.name===a.supplier)?`<option value="${f(a.supplier)}" selected>${f(a.supplier)} (Inactive / Custom)</option>`:""}
            </select>
          </div>
          
          <div class="form-group" style="margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
              <label class="form-label" style="margin:0; font-weight:600">Stock Locations & Quantities *</label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-add-loc-row">
                <span class="material-icons-outlined" style="font-size:16px">add</span> Add Location
              </button>
            </div>
            <div id="locations-editor-container">
              ${d}
            </div>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Item</button>
      </div>
    </div>
  `;const v=e.querySelector("#locations-editor-container");e.querySelector("#btn-add-loc-row").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=r();const n=i.firstElementChild;v.appendChild(n),b(n)});function b(i){i.querySelector(".btn-remove-loc").addEventListener("click",()=>{v.querySelectorAll(".location-row").length>1?i.remove():A("At least one stock location is required","error")})}v.querySelectorAll(".location-row").forEach(b),e.querySelector("#btn-cancel").addEventListener("click",()=>R.navigate(t?`/stock/${s}`:"/stock")),e.querySelector("#btn-save").addEventListener("click",()=>{var x;const i=e.querySelector("#stock-form");if(!i.checkValidity()){i.reportValidity();return}const m=Array.from(v.querySelectorAll(".location-row")).map(T=>{const h=T.querySelector(".loc-select").value,k=parseInt(T.querySelector(".loc-qty").value)||0;return{location:h,quantity:k}}).filter(T=>T.location!=="");if(m.length===0){A("Please select at least one valid stock location","error");return}const $=m.map(T=>T.location);if(new Set($).size!==$.length){A("Duplicate locations detected. Please merge them into a single row.","error");return}const y=Object.fromEntries(new FormData(i));if(y.costPrice=parseFloat(y.costPrice)||0,y.unitPrice=parseFloat(y.unitPrice)||0,y.reorderLevel=parseInt(y.reorderLevel)||10,y.locations=m,y.quantity=m.reduce((T,h)=>T+h.quantity,0),y.location=((x=m[0])==null?void 0:x.location)||"Main Warehouse",t)p.update("stock",s,y),A("Item updated successfully","success"),Yt(y),R.navigate(`/stock/${s}`);else{y.sku=y.sku||`SKU-${Date.now().toString().slice(-4)}`;const T=p.create("stock",y);A("Item created successfully","success"),Yt(y),R.navigate(`/stock/${T.id}`)}})}function Yt(e){if(e.quantity<=e.reorderLevel){const s=JSON.parse(localStorage.getItem("currentUser")||"{}");let t=!1;if(s.role==="admin")t=!0;else if(s.userTypeId){const a=p.getById("userTypes",s.userTypeId);if(a&&a.permissions){const u=a.permissions.find(l=>l.module==="Stock");u&&(t=u.edit||u.create)}}t&&(ve(async()=>{const{showToast:a}=await Promise.resolve().then(()=>De);return{showToast:a}},void 0).then(({showToast:a})=>{a(`Auto-Reorder Alert: ${e.name} is at or below its reorder level (${e.quantity} left).`,"warning")}),p.create("notifications",{title:"Stock Auto-Reorder",message:`${e.name} (SKU: ${e.sku}) has reached its reorder level. Current quantity: ${e.quantity}. Please reorder from ${e.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function gt(e){const s=p.getAll("invoices");e.innerHTML=`
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
  `;let t=[...s];const a={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},l=He({columns:[{key:"number",label:"Invoice #",render:r=>`<span class="cell-link font-medium">${f(r.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:r=>r.jobNumber?`<span class="text-secondary">${f(r.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:r=>`<span class="badge ${a[r.status]||"badge-neutral"}">${f(r.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:r=>`<span class="font-semibold">$${(r.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:r=>r.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:r=>r.issueDate?new Date(r.issueDate).toLocaleDateString():"—",getValue:r=>r.issueDate?new Date(r.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():"—",getValue:r=>r.dueDate?new Date(r.dueDate).getTime():0,width:"100px"}],data:t,onRowClick:r=>R.navigate(`/invoices/${r}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:r=>{Je({container:e,selectedIds:r,onClear:()=>l.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:d=>{d.forEach(v=>p.update("invoices",v,{status:"Paid",datePaid:new Date().toISOString()})),l.clearSelection(),gt(e),ve(async()=>{const{showToast:v}=await Promise.resolve().then(()=>De);return{showToast:v}},void 0).then(({showToast:v})=>v(`Marked ${d.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:d=>{const v=document.createElement("div");v.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:b}=await Promise.resolve().then(()=>ze);return{showModal:b}},void 0).then(({showModal:b})=>{b({title:`Update ${d.length} Invoices`,content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const n=v.querySelector("#bulk-status").value;d.forEach(m=>p.update("invoices",m,{status:n})),l.clearSelection(),gt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>De);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${d.length} invoices to ${n}`,"success")),i()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:d=>{ve(async()=>{const{showToast:v}=await Promise.resolve().then(()=>De);return{showToast:v}},void 0).then(({showToast:v})=>v(`Sending reminders for ${d.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{ve(async()=>{const{showModal:v}=await Promise.resolve().then(()=>ze);return{showModal:v}},void 0).then(({showModal:v})=>{const b=document.createElement("div");b.innerHTML=`<p>Are you sure you want to delete ${d.length} invoices? This action cannot be undone.</p>`,v({title:"Confirm Bulk Delete",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{d.forEach(n=>p.delete("invoices",n)),l.clearSelection(),gt(e),ve(async()=>{const{showToast:n}=await Promise.resolve().then(()=>De);return{showToast:n}},void 0).then(({showToast:n})=>n(`Deleted ${d.length} invoices`,"success")),i()}}]})})}}]})}});e.querySelector("#invoices-table-container").appendChild(l),e.querySelector("#btn-new-invoice").addEventListener("click",()=>R.navigate("/invoices/new"));const c=e.querySelector("#btn-export-accounting");function o(r){r.some(d=>d.status==="Paid")?c.style.display="inline-flex":c.style.display="none"}o(t),e.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(v=>v.classList.remove("active")),r.classList.add("active");const d=r.dataset.filter;t=d==="all"?[...s]:s.filter(v=>v.status===d),l.updateData(t),o(t)})}),c.addEventListener("click",()=>{const r=t.filter(i=>i.status==="Paid");if(r.length===0)return;let d="data:text/csv;charset=utf-8,";d+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,r.forEach(i=>{const n=[i.number,`"${i.customerName.replace(/"/g,'""')}"`,i.email||"",i.issueDate?i.issueDate.split("T")[0]:"",i.dueDate?i.dueDate.split("T")[0]:"",(i.total||0).toFixed(2),(i.tax||0).toFixed(2),"200"].join(",");d+=n+`
`});const v=encodeURI(d),b=document.createElement("a");b.setAttribute("href",v),b.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(b),b.click(),document.body.removeChild(b),ve(async()=>{const{showToast:i}=await Promise.resolve().then(()=>De);return{showToast:i}},void 0).then(({showToast:i})=>{i(`Exported ${r.length} paid invoices`,"success")})}),e.querySelector("#invoices-search").addEventListener("input",r=>{const d=r.target.value.toLowerCase();t=s.filter(v=>v.number.toLowerCase().includes(d)||v.customerName.toLowerCase().includes(d)||(v.jobNumber||"").toLowerCase().includes(d)),l.updateData(t),o(t)})}function us(e,{id:s}){const t=s==="new";let a=t?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:p.getById("invoices",s);if(!a){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}a.lineItems&&!a.sections&&(a.sections=[{id:p.generateId(),name:"Main Phase",lineItems:[...a.lineItems]}],delete a.lineItems),t||Ge(a.number);const u=p.getAll("customers"),l=p.getAll("stock"),c=p.getSettings(),o={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function r(){e.innerHTML=`
      ${Ke({title:`
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
                ${u.map(n=>`<option value="${n.id}" ${a.customerId===n.id?"selected":""}>${n.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${c.laborRates.map(n=>`<option value="${n.id}" ${a.laborProfileId===n.id?"selected":""}>${n.name} ($${n.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(n=>`<option ${a.invoiceType===n?"selected":""}>${n}</option>`).join("")}
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
                ${["Draft","Sent","Paid","Overdue","Void"].map(n=>`<option ${a.status===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${l.map(n=>`<option value="${n.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(a.sections||[]).map((n,m)=>d(n,m)).join("")}
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
    `,i()}function d(n,m){return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${m}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${n.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(n.subtotal||0).toFixed(2)}</span>
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
              ${(n.lineItems||[]).map(($,y)=>v($,m,y)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function v(n,m,$){return`
      <tr data-sidx="${m}" data-index="${$}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${n.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${n.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${n.type==="material"?"selected":""}>Material</option>
          <option value="other" ${n.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${n.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${n.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(n.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${m}" data-index="${$}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function b(){a.subtotal=0,a.totalInternalCost=0;let n=0;p.getSettings().laborRates.find($=>$.id===a.laborProfileId),(a.sections||[]).forEach($=>{$.subtotal=0,($.lineItems||[]).forEach(y=>{y.total=(y.qty||0)*(y.rate||0),y.type==="labor"&&(n+=y.total),y.internalCost||(y.type==="labor"?y.internalCost=45:y.internalCost=y.rate*.7),a.totalInternalCost+=(y.qty||0)*(y.internalCost||0),$.subtotal+=y.total}),a.subtotal+=$.subtotal}),a.invoiceType==="CreditNote"?a.subtotal=-Math.abs(a.subtotal):a.subtotal=Math.abs(a.subtotal),a.tax=a.subtotal*.1,a.total=a.subtotal+a.tax,r()}function i(){var m,$,y,x,T,h,k,w;(m=e.querySelector("#btn-preview-pdf"))==null||m.addEventListener("click",()=>{zt({type:"invoice",data:a})});const n=e.querySelector(".dropdown > .btn");n&&(n.addEventListener("click",g=>{g.stopPropagation();const E=n.nextElementSibling;E.style.display=E.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const g=e.querySelector(".dropdown-menu");g&&(g.style.display="none")})),($=e.querySelector("#inv-labor-profile"))==null||$.addEventListener("change",g=>{a.laborProfileId=g.target.value;const E=c.laborRates.find(C=>C.id===a.laborProfileId);E&&(a.sections.forEach(C=>{C.lineItems.forEach(q=>{q.type==="labor"&&(q.rate=E.rate)})}),b())}),(y=e.querySelector("#btn-add-section"))==null||y.addEventListener("click",()=>{a.sections.push({id:p.generateId(),name:"New Phase",lineItems:[]}),b()}),e.querySelectorAll(".section-name-input").forEach((g,E)=>{g.addEventListener("change",()=>{a.sections[E].name=g.value})}),e.querySelectorAll(".btn-add-line").forEach(g=>{g.addEventListener("click",()=>{const E=parseInt(g.dataset.sidx);a.sections[E].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),r()})}),e.querySelectorAll(".btn-remove-section").forEach(g=>{g.addEventListener("click",()=>{const E=parseInt(g.dataset.sidx);confirm("Remove this entire phase?")&&(a.sections.splice(E,1),b())})}),e.querySelectorAll(".item-input").forEach(g=>{g.addEventListener("change",()=>{const E=g.closest("tr"),C=parseInt(E.dataset.sidx),q=parseInt(E.dataset.index),I=g.dataset.field;let _=g.value;if((I==="qty"||I==="rate")&&(_=parseFloat(_)||0),a.sections[C].lineItems[q][I]=_,I==="description"){const J=l.find(N=>N.name===_);if(J){const N=(J.category||"").toLowerCase().includes("labor");let U=0,j=0;if(N)U=J.unitPrice||85,j=J.costPrice||45;else{const P=J.costPrice||J.unitPrice||0;j=P,U=Ct(P,c)}a.sections[C].lineItems[q].type=N?"labor":"material",a.sections[C].lineItems[q].rate=U,a.sections[C].lineItems[q].internalCost=j}}b()})}),e.querySelectorAll(".btn-remove-line").forEach(g=>{g.addEventListener("click",()=>{const E=parseInt(g.dataset.sidx),C=parseInt(g.dataset.index);a.sections[E].lineItems.splice(C,1),b()})}),(x=e.querySelector("#btn-save-inv"))==null||x.addEventListener("click",()=>{const g=e.querySelector("#inv-customer").value,E=u.find(C=>C.id===g);if(a.customerId=g,a.customerName=(E==null?void 0:E.company)||"",a.status=e.querySelector("#inv-status").value,a.issueDate=e.querySelector("#inv-issue").value,a.dueDate=e.querySelector("#inv-due").value,a.invoiceType=e.querySelector("#inv-type").value,b(),t){const C=p.create("invoices",a);A("Invoice created","success"),R.navigate(`/invoices/${C.id}`)}else p.update("invoices",s,a),A("Invoice saved","success"),r()}),(T=e.querySelector("#btn-send-invoice"))==null||T.addEventListener("click",()=>{p.update("invoices",s,{status:"Sent"}),a.status="Sent",A("Invoice sent to customer","success"),r()}),(h=e.querySelector("#btn-mark-paid"))==null||h.addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`
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
      `,Be({title:"Mark Invoice as Paid",content:g.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Confirm Payment",className:"btn-primary",onClick:E=>{const C=document.querySelector(".drawer-overlay"),q=C.querySelector("#paid-date").value,I=C.querySelector("#paid-method").value;p.update("invoices",s,{status:"Paid",paidDate:q,paymentMethod:I}),a.status="Paid",a.paidDate=q,a.paymentMethod=I,A("Invoice marked as paid","success"),r(),E()}}],width:350})}),(k=e.querySelector("#btn-delete-invoice"))==null||k.addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`<p>Delete invoice <strong>${f(a.number)}</strong>?</p>`,$e({title:"Delete Invoice",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Delete",className:"btn-danger",onClick:E=>{p.delete("invoices",s),A("Invoice deleted","success"),E(),R.navigate("/invoices")}}]})}),(w=e.querySelector("#btn-cancel-inv"))==null||w.addEventListener("click",()=>R.navigate("/invoices"))}r()}function at(e){const s=p.getAll("purchaseOrders");e.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(l=>`<button class="toolbar-filter" data-filter="${l}">${l}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let t=[...s];const u=He({columns:[{key:"number",label:"PO Number",render:l=>`<span class="cell-link font-medium">${f(l.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:l=>`<span class="text-secondary">${f(l.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:l=>l.jobId?`<a href="#/jobs/${l.jobId}" class="cell-link">${f(l.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:l=>l.issueDate?new Date(l.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:l=>`$${(l.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:l=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[l.status]||"badge-neutral"}">${f(l.status)}</span>`,width:"110px"}],data:t,onRowClick:l=>Wt({id:l,onSave:()=>at(e)}),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:l=>{Je({container:e,selectedIds:l,onClear:()=>u.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:c=>{c.forEach(o=>p.update("purchaseOrders",o,{status:"Received",receivedDate:new Date().toISOString()})),u.clearSelection(),at(e),ve(async()=>{const{showToast:o}=await Promise.resolve().then(()=>De);return{showToast:o}},void 0).then(({showToast:o})=>o(`Marked ${c.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:c=>{const o=document.createElement("div");o.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,ve(async()=>{const{showModal:r}=await Promise.resolve().then(()=>ze);return{showModal:r}},void 0).then(({showModal:r})=>{r({title:`Update ${c.length} Purchase Orders`,content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const v=o.querySelector("#bulk-status").value;c.forEach(b=>p.update("purchaseOrders",b,{status:v})),u.clearSelection(),at(e),ve(async()=>{const{showToast:b}=await Promise.resolve().then(()=>De);return{showToast:b}},void 0).then(({showToast:b})=>b(`Updated ${c.length} POs to ${v}`,"success")),d()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:c=>{ve(async()=>{const{showModal:o}=await Promise.resolve().then(()=>ze);return{showModal:o}},void 0).then(({showModal:o})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${c.length} purchase orders? This action cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{c.forEach(v=>p.delete("purchaseOrders",v)),u.clearSelection(),at(e),ve(async()=>{const{showToast:v}=await Promise.resolve().then(()=>De);return{showToast:v}},void 0).then(({showToast:v})=>v(`Deleted ${c.length} purchase orders`,"success")),d()}}]})})}}]})}});e.querySelector("#po-table-container").appendChild(u),e.querySelector("#btn-new-po").addEventListener("click",()=>{Wt({onSave:()=>at(e)})}),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),l.classList.add("active");const c=l.dataset.filter;t=c==="all"?[...s]:s.filter(o=>o.status===c),u.updateData(t)})}),e.querySelector("#po-search").addEventListener("input",l=>{const c=l.target.value.toLowerCase();t=s.filter(o=>{var r,d,v;return((r=o.number)==null?void 0:r.toLowerCase().includes(c))||((d=o.supplierName)==null?void 0:d.toLowerCase().includes(c))||((v=o.jobNumber)==null?void 0:v.toLowerCase().includes(c))}),u.updateData(t)})}function xa(e,{id:s,jobId:t}){const a=s==="new";let u=a?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:t||"",jobNumber:""}:p.getById("purchaseOrders",s);if(!u){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(a&&t){const n=p.getById("jobs",t);n&&(u.jobNumber=n.number)}Ge(a?"New PO":u.number);const l=p.getAll("stock"),c=p.getAll("jobs"),o=p.getAll("suppliers").filter(n=>n.active!==!1),r=[...o];u.supplierName&&!o.some(n=>n.name===u.supplierName)&&r.push({name:u.supplierName}),r.length===0&&r.push({name:"General Supplier"});function d(){e.innerHTML=`
      ${Ke({title:u.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${u.status==="Draft"?"badge-neutral":u.status==="Issued"?"badge-primary":u.status==="Received"?"badge-success":"badge-danger"}">${u.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!a&&u.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!a&&u.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${u.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${r.map(n=>`<option value="${f(n.name)}" ${u.supplierName===n.name?"selected":""}>${f(n.name)}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${u.issueDate?u.issueDate.split("T")[0]:""}" ${u.status!=="Draft"?"disabled":""} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${u.status!=="Draft"?"disabled":""}>
                    <option value="">None</option>
                    ${c.map(n=>`<option value="${n.id}" ${u.jobId===n.id?"selected":""}>${n.number} - ${n.title}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${u.status!=="Draft"?"disabled":""}>${u.notes||""}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${u.status==="Draft"?'<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>':""}
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
                  ${u.status==="Draft"?'<th style="width:5%"></th>':""}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${u.lineItems.length===0?'<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>':""}
                ${u.lineItems.map((n,m)=>`
                  <tr data-index="${m}">
                    <td>
                      ${u.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${l.map($=>`<option value="${$.id}" ${n.stockId===$.id?"selected":""}>${$.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${n.stockId?"display:none":""}" value="${n.description||""}" placeholder="Description" />
                      `:`<div>${n.description}</div>`}
                    </td>
                    <td>
                      ${u.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${n.sku||""}" ${n.stockId?"disabled":""} />`:n.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${u.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${n.unitCost||0}" step="0.01" />`:`$${(n.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${u.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${n.quantity||1}" min="1" step="1" />`:n.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((n.unitCost||0)*(n.quantity||1)).toFixed(2)}
                    </td>
                    ${u.status==="Draft"?`
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>`:""}
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(u.total||0).toFixed(2)}</td>
                  ${u.status==="Draft"?"<td></td>":""}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,b()}function v(){let n=0;e.querySelectorAll("#line-items-body tr[data-index]").forEach($=>{const y=parseFloat($.querySelector(".item-cost").value)||0,x=parseFloat($.querySelector(".item-qty").value)||0,T=y*x;$.querySelector(".item-total").textContent="$"+T.toFixed(2),n+=T}),u.total=n;const m=e.querySelector("#po-total");m&&(m.textContent="$"+n.toFixed(2))}function b(){var n,m,$,y;e.querySelector("#btn-cancel").addEventListener("click",()=>R.navigate("/purchase-orders")),(n=e.querySelector("#btn-save"))==null||n.addEventListener("click",()=>{i()}),(m=e.querySelector("#btn-issue"))==null||m.addEventListener("click",()=>{if(u.lineItems.length===0){A("Cannot issue a PO with no items","error");return}i("Issued")}),($=e.querySelector("#btn-receive"))==null||$.addEventListener("click",()=>{const x=p.getAll("technicians"),T=p.getAll("assets"),h=document.createElement("div");h.innerHTML=`
        <div class="form-group">
          <label class="form-label">Receive into Location *</label>
          <select class="form-select" id="receive-location-select" required>
            <option value="Main Warehouse">Main Warehouse</option>
            <optgroup label="Warehouses">
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </optgroup>
            <optgroup label="Vehicles">
              ${x.map(k=>`<option value="Vehicle - ${f(k.name)}">Vehicle - ${f(k.name)}</option>`).join("")}
            </optgroup>
            <optgroup label="Assets">
              ${T.map(k=>`<option value="${f(k.name)}">${f(k.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      `,showModal({title:"Receive Purchase Order",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Receive Items",className:"btn-success",onClick:k=>{const w=h.querySelector("#receive-location-select").value;if(!w){A("Please select a valid location","error");return}let g=0;const E=p.getAll("stock");u.lineItems.forEach(C=>{var q;if(C.stockId){const I=E.find(_=>_.id===C.stockId);if(I){I.locations||(I.locations=[]);let _=I.locations.find(J=>J.location===w);_?_.quantity+=C.quantity:I.locations.push({location:w,quantity:C.quantity}),I.quantity=I.locations.reduce((J,N)=>J+N.quantity,0),I.location=((q=I.locations[0])==null?void 0:q.location)||"Main Warehouse",I.updatedAt=new Date().toISOString(),g++}}}),g>0&&p.save("stock",E),A(`Received ${g} items into ${w}`,"success"),u.status="Received",p.update("purchaseOrders",u.id,{status:"Received"}),k(),d()}}]})}),(y=e.querySelector("#btn-add-item"))==null||y.addEventListener("click",()=>{u.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),d()}),e.querySelectorAll(".item-select").forEach((x,T)=>{x.addEventListener("change",h=>{const k=h.target.value,w=h.target.closest("tr"),g=w.querySelector(".item-desc"),E=w.querySelector(".item-sku"),C=w.querySelector(".item-cost");if(k){const q=p.getById("stock",k);q&&(g.style.display="none",g.value=q.name,E.value=q.sku,E.disabled=!0,C.value=q.costPrice||q.unitPrice)}else g.style.display="block",g.value="",E.value="",E.disabled=!1,C.value=0;v()})}),e.querySelectorAll(".item-cost, .item-qty").forEach(x=>{x.addEventListener("input",v)}),e.querySelectorAll(".btn-remove-item").forEach(x=>{x.addEventListener("click",T=>{const h=T.target.closest("tr"),k=parseInt(h.dataset.index);u.lineItems.splice(k,1),d()})})}function i(n=null){if(u.status!=="Draft"){A("Cannot modify an issued or received PO","error");return}const m=e.querySelector("#po-form");if(!m.checkValidity()){m.reportValidity();return}const $=Object.fromEntries(new FormData(m));if($.jobId){const x=c.find(T=>T.id===$.jobId);$.jobNumber=x?x.number:""}else $.jobNumber="";u.lineItems=Array.from(e.querySelectorAll("#line-items-body tr[data-index]")).map(x=>{const T=x.querySelector(".item-select"),h=T?T.value:"",k=x.querySelector(".item-desc").value,w=h?T.options[T.selectedIndex].text:k;return{stockId:h,description:w,sku:x.querySelector(".item-sku").value,unitCost:parseFloat(x.querySelector(".item-cost").value)||0,quantity:parseInt(x.querySelector(".item-qty").value)||1}}),v();const y={...u,...$,total:u.total,lineItems:u.lineItems,status:n||u.status};if(a){y.number=`PO-${Date.now().toString().slice(-6)}`;const x=p.create("purchaseOrders",y);A(`PO ${n==="Issued"?"issued":"created"} successfully`,"success"),R.navigate(`/purchase-orders/${x.id}`)}else p.update("purchaseOrders",s,y),A(`PO ${n==="Issued"?"issued":"updated"} successfully`,"success"),n==="Issued"&&d()}d()}function $a(e){let s="overview";const t=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function a(){const r=p.getAll("jobs"),d=p.getAll("quotes"),v=p.getAll("invoices"),b=p.getAll("customers"),i=p.getAll("stock"),n=p.getAll("technicians"),m=p.getAll("leads"),$=v.filter(P=>P.status==="Paid").reduce((P,D)=>P+(D.total||0),0),y=v.filter(P=>P.status==="Sent"||P.status==="Overdue").reduce((P,D)=>P+(D.total||0),0),x=r.length>0?r.reduce((P,D)=>P+(D.laborCost||0)+(D.materialCost||0),0)/r.length:0,T=d.length>0?d.filter(P=>P.status==="Accepted").length/d.length*100:0,h=m.length>0?m.filter(P=>P.status==="Won").length/m.length*100:0,k={};r.forEach(P=>{k[P.status]=(k[P.status]||0)+1});const w={};v.forEach(P=>{w[P.status]=(w[P.status]||0)+1});const g=n.map(P=>{const D=r.filter(S=>S.technicianId===P.id),M=D.filter(S=>S.status==="Completed"||S.status==="Invoiced").length,L=D.reduce((S,F)=>S+(F.laborCost||0)+(F.materialCost||0),0);return{...P,totalJobs:D.length,completed:M,revenue:L}}),E={};v.filter(P=>P.status==="Paid").forEach(P=>{E[P.customerName]=(E[P.customerName]||0)+(P.total||0)});const C=Object.entries(E).sort((P,D)=>D[1]-P[1]).slice(0,10),q=i.reduce((P,D)=>P+D.quantity*D.costPrice,0),I=i.filter(P=>P.quantity<=P.reorderLevel),_=p.getAll("timesheets"),J={},N={},U=p.getAll("people"),j={};return U.forEach(P=>{P.payRate&&(j[P.id]=P.payRate)}),_.forEach(P=>{J[P.jobId]=(J[P.jobId]||0)+(P.hours||0);const D=P.payRate||j[P.technicianId]||0;N[P.jobId]=(N[P.jobId]||0)+P.hours*D}),{jobs:r,quotes:d,invoices:v,customers:b,stock:i,technicians:n,leads:m,totalRevenue:$,totalOutstanding:y,avgJobValue:x,quoteWinRate:T,leadConvRate:h,jobsByStatus:k,invByStatus:w,techStats:g,topCustomers:C,totalStockValue:q,lowStockItems:I,timesheets:_,hoursByJob:J,internalLaborCostByJob:N}}function u(){const r=a();e.innerHTML=`
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
              ${t.map(d=>`
                <button class="report-nav-item ${s===d.id?"active":""}" data-report="${d.id}" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${s===d.id?"var(--color-primary-light)":"transparent"};
                  color:${s===d.id?"var(--color-primary)":"var(--text-secondary)"};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${s===d.id?"600":"500"};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${d.icon}</span>
                  ${d.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `,l(r),c(r)}function l(r){const d=e.querySelector("#report-content");switch(s){case"overview":d.innerHTML=wa(r);break;case"revenue":d.innerHTML=ka(r);break;case"jobs":d.innerHTML=Sa(r);break;case"job_costing":d.innerHTML=Ta(r);break;case"technicians":d.innerHTML=Ca(r);break;case"customers":d.innerHTML=Ea(r);break;case"inventory":d.innerHTML=La(r);break;default:d.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function c(r){var d;e.querySelectorAll("[data-report]").forEach(v=>{v.addEventListener("click",()=>{s=v.dataset.report,u()})}),(d=e.querySelector("#btn-export-csv"))==null||d.addEventListener("click",()=>o(r))}function o(r){let d="";if(s==="overview"||s==="revenue")d=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,r.invoices.forEach(n=>{d+=`"${n.number}","${n.customerName}","${n.status}",${n.total||0},"${n.issueDate||""}","${n.dueDate||""}"
`});else if(s==="job_costing"){const n=p.getSettings();d=`Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %
`,r.jobs.filter($=>$.status==="Completed"||$.status==="Invoiced").map($=>{const y=r.hoursByJob[$.id]||0,x=r.internalLaborCostByJob[$.id]||$.laborCost||0,T=n.laborRates.find(g=>g.id===$.laborRateProfileId)||n.laborRates.find(g=>g.isDefault),h=Math.max(y*((T==null?void 0:T.rate)||85),(T==null?void 0:T.minCallOutFee)||0),k=h-x,w=h>0?k/h*100:0;return{num:$.number,tech:$.technicianName||"",actualH:y,actualLabor:x,billableLabor:h,profit:k,margin:w}}).forEach($=>{d+=`"${$.num}","${$.tech}",${$.actualH},${$.actualLabor.toFixed(2)},${$.billableLabor.toFixed(2)},${$.profit.toFixed(2)},${$.margin.toFixed(1)}%
`})}else s==="jobs"?(d=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,r.jobs.forEach(n=>{d+=`"${n.number}","${n.title}","${n.customerName}","${n.technicianName||""}","${n.status}","${n.priority}",${n.laborCost||0},${n.materialCost||0}
`})):s==="technicians"?(d=`Name,Role,Total Jobs,Completed,Revenue
`,r.techStats.forEach(n=>{d+=`"${n.name}","${n.role}",${n.totalJobs},${n.completed},${n.revenue}
`})):s==="customers"?(d=`Company,First Name,Last Name,Email,Phone,Status
`,r.customers.forEach(n=>{d+=`"${n.company}","${n.firstName}","${n.lastName}","${n.email}","${n.phone}","${n.status}"
`})):s==="inventory"&&(d=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,r.stock.forEach(n=>{d+=`"${n.name}","${n.sku}","${n.category}",${n.quantity},${n.costPrice},${n.unitPrice},"${n.location}","${n.supplier}"
`}));const v=new Blob([d],{type:"text/csv"}),b=URL.createObjectURL(v),i=document.createElement("a");i.href=b,i.download=`simpro_${s}_report.csv`,i.click(),URL.revokeObjectURL(b)}u()}function Me(e,s,t,a){const u={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${e}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[a]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${u[a]}">${t}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${s}</div>
    </div>
  `}function tt(e,s,t){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${t}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${s}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${e}</div>
        </div>
      </div>
    </div>
  `}function bt(e,s={},t="#1B6DE0"){const a=Object.entries(e);if(a.length===0)return'<div class="text-secondary text-sm">No data available</div>';const u=Math.max(...a.map(([,l])=>l));return a.map(([l,c])=>{const o=s[l]||t,r=u>0?c/u*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${l}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${r}%;background:${o};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof c=="number"&&c>=1e3?`$${(c/1e3).toFixed(1)}k`:c}</div>
      </div>
    `}).join("")}function pt(e,s,t,a){const u=t>0?s/t*100:0,l=typeof s=="number"?`$${s.toLocaleString("en-AU",{minimumFractionDigits:0})}`:s;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${e}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${l}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${u}%;background:${a};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function wa(e){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Me("Total Revenue",`$${e.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${Me("Outstanding",`$${e.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${Me("Quote Win Rate",`${e.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${Me("Lead Conversion",`${e.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${bt(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${bt(e.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
      </div>
    </div>
    <div class="grid-3">
      ${tt("Total Jobs",e.jobs.length,"build")}
      ${tt("Total Quotes",e.quotes.length,"request_quote")}
      ${tt("Total Invoices",e.invoices.length,"receipt_long")}
      ${tt("Total Customers",e.customers.length,"people")}
      ${tt("Avg Job Value",`$${e.avgJobValue.toFixed(0)}`,"paid")}
      ${tt("Stock Items",`${e.stock.length} (${e.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function ka(e){const s=e.invoices.filter(c=>c.status==="Paid"),t={};s.forEach(c=>{const o=new Date(c.issueDate||c.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});t[o]=(t[o]||0)+(c.total||0)});const a=e.jobs.reduce((c,o)=>c+(o.materialCost||0),0),u=e.jobs.reduce((c,o)=>c+(o.laborCost||0),0),l=e.totalRevenue-a;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Me("Gross Revenue",`$${e.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${Me("Total Labor",`$${u.toFixed(0)}`,"engineering","blue")}
      ${Me("Material Costs",`$${a.toFixed(0)}`,"inventory_2","orange")}
      ${Me("Gross Profit",`$${l.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${bt(t,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${pt("Revenue",e.totalRevenue,e.totalRevenue,"#10B981")}
        ${pt("Labor Cost",u,e.totalRevenue,"#3B82F6")}
        ${pt("Material Cost",a,e.totalRevenue,"#F59E0B")}
        ${pt("Gross Profit",l,e.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function Sa(e){const s=e.jobs.filter(a=>a.status==="Completed"||a.status==="Invoiced"),t=s.length>0?s.reduce((a,u)=>a+(u.estimatedHours||0),0)/s.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${Me("Total Jobs",e.jobs.length,"build","blue")}
      ${Me("Completed",s.length,"check_circle","green")}
      ${Me("In Progress",e.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${Me("Avg Hours",t.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${bt(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${e.jobs.sort((a,u)=>(u.laborCost||0)+(u.materialCost||0)-((a.laborCost||0)+(a.materialCost||0))).slice(0,8).map(a=>`
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
  `}function Ta(e){const s=p.getSettings(),a=e.jobs.filter(r=>r.status==="Completed"||r.status==="Invoiced").map(r=>{const d=e.hoursByJob[r.id]||0,v=e.internalLaborCostByJob[r.id]||r.laborCost||0,b=s.laborRates.find($=>$.id===r.laborRateProfileId)||s.laborRates.find($=>$.isDefault),i=Math.max(d*((b==null?void 0:b.rate)||85),(b==null?void 0:b.minCallOutFee)||0),n=i-v,m=i>0?n/i*100:0;return{...r,actualH:d,actualLabor:v,billableLabor:i,profit:n,margin:m}}),u=a.reduce((r,d)=>r+d.actualLabor,0),l=a.reduce((r,d)=>r+d.billableLabor,0),c=l-u,o=l>0?c/l*100:0;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Me("Internal Labor Cost","$"+u.toLocaleString(),"engineering","orange")}
      ${Me("Billable Labor Rev.","$"+l.toLocaleString(),"payments","green")}
      ${Me("Labor Profitability",o.toFixed(1)+"% Margin","trending_up",o>=40?"green":"orange")}
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
  `}function Ca(e){return`
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
        ${e.techStats.map(s=>pt(s.name,s.revenue,Math.max(...e.techStats.map(t=>t.revenue)),s.color)).join("")}
      </div>
    </div>
  `}function Ea(e){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Me("Total Customers",e.customers.length,"people","blue")}
      ${Me("Active Customers",e.customers.filter(s=>s.status==="Active").length,"check_circle","green")}
      ${Me("Total Leads",e.leads.length,"trending_up","orange")}
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
  `}function La(e){const s=e.stock.reduce((t,a)=>t+a.quantity*a.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${Me("Total Items",e.stock.length,"inventory_2","blue")}
      ${Me("Stock Value (Cost)",`$${e.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${Me("Stock Value (Sell)",`$${s.toFixed(0)}`,"paid","green")}
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
        ${bt(e.stock.reduce((t,a)=>(t[a.category]=(t[a.category]||0)+a.quantity,t),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}function Oe(e){return Object.entries(ot).map(([s,t])=>{const a={module:s};return t.forEach(({key:u})=>{a[u]=e(s,u)}),a})}function Ia(e){const t=new URLSearchParams(window.location.hash.split("?")[1]||window.location.search).get("tab");let a="company",u="tasklists";t==="forms"?(a="templates_forms",u="forms"):t==="tasks"||t==="tasklists"?(a="templates_forms",u="tasklists"):t==="quote_templates"||t==="quotes"?(a="templates_forms",u="quotes"):t&&(a=t),JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');function l(){e.innerHTML=`
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
    `,c(),e.querySelectorAll(".tab").forEach(m=>{m.addEventListener("click",()=>{a=m.dataset.tab,e.querySelectorAll(".tab").forEach($=>$.classList.remove("active")),m.classList.add("active"),c()})})}function c(){var y,x,T;const m=e.querySelector("#settings-content");if(a==="templates_forms"){n(m);return}if(a==="company"){const h=p.getSettings();let k=h.logo;(()=>{var E;m.innerHTML=`
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
                    ${k?`<img src="${k}" style="max-width:90%; max-height:90%; object-fit:contain" />`:`
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
                    ${k?'<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>':""}
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
        `;const g=m.querySelector("#logo-upload");m.querySelector("#btn-upload-logo").addEventListener("click",()=>g.click()),g.addEventListener("change",C=>{const q=C.target.files[0];if(q){const I=new FileReader;I.onload=_=>{k=_.target.result;const J=m.querySelector("#logo-preview-container");J.innerHTML=`<img src="${k}" style="max-width:90%; max-height:90%; object-fit:contain" />`,m.querySelector("#unsaved-logo-hint").style.display="block",A("Logo preview updated. Click Save to apply.","info")},I.readAsDataURL(q)}}),(E=m.querySelector("#btn-remove-logo"))==null||E.addEventListener("click",()=>{k=null;const C=m.querySelector("#logo-preview-container");C.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `,m.querySelector("#unsaved-logo-hint").style.display="block",m.querySelector("#btn-remove-logo").style.display="none"}),m.querySelector("#btn-save-company").addEventListener("click",()=>{const C=p.getSettings();C.name=m.querySelector("#company-name").value,C.abn=m.querySelector("#company-abn").value,C.phone=m.querySelector("#company-phone").value,C.email=m.querySelector("#company-domain").value,C.address=m.querySelector("#company-address").value,C.logo=k,p.saveSettings(C),A("Company information saved permanently","success"),m.querySelector("#unsaved-logo-hint").style.display="none",window.dispatchEvent(new CustomEvent("simpro-settings-updated"))})})()}else if(a==="users"){const h=p.getAll("technicians");let k=p.getAll("userTypes");!k||k.length===0?(k=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:Oe(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:Oe((w,g)=>w==="Settings"?["view","edit_company"].includes(g):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs",permissions:Oe((w,g)=>w==="Dashboard"?g==="view":w==="Jobs"?["view","manage_tasks","book_time"].includes(g):w==="Timesheets"?["view_own","create"].includes(g):w==="Schedule"?["view_own"].includes(g):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Oe((w,g)=>w==="Settings"?!1:w==="Reports"?g==="view":!(["Invoices","Purchase Orders"].includes(w)&&g==="delete"))}],p.save("userTypes",k)):k.some(g=>g.id==="ut_office")||(k.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Oe((g,E)=>g==="Settings"?!1:g==="Reports"?E==="view":!(["Invoices","Purchase Orders"].includes(g)&&E==="delete"))}),p.save("userTypes",k)),m.innerHTML=`
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
                ${h.filter(w=>!w.deactivated).map(w=>{const g=k.find(E=>E.id===w.userTypeId);return`
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${w.color}"></div></td>
                      <td class="font-medium">${w.name}</td>
                      <td class="text-secondary">${w.role}</td>
                      <td><span class="badge ${(g==null?void 0:g.id)==="ut_admin"?"badge-primary":"badge-neutral"}">${(g==null?void 0:g.name)||"Unassigned"}</span></td>
                      <td class="text-tertiary">${w.email||"-"}</td>
                      <td class="text-secondary">${w.payRate?`$${w.payRate.toFixed(2)}/hr`:"-"}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${w.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${w.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
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
                ${k.map(w=>`
                  <tr>
                    <td class="font-medium">${w.name}</td>
                    <td class="text-secondary">${w.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${w.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${w.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${w.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${h.filter(w=>w.deactivated).length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>':""}
                ${h.filter(w=>w.deactivated).map(w=>{const g=new Date(w.deactivatedAt),C=new Date-g,I=30-Math.ceil(C/(1e3*60*60*24)),_=I<=0;return`
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${w.name}</td>
                      <td style="opacity:0.6">${w.role}</td>
                      <td class="text-tertiary">${g.toLocaleDateString()}</td>
                      <td>
                        ${_?'<span class="badge badge-success">Cooldown Complete</span>':`<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${I} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${w.id}" 
                                ${_?"":'disabled style="opacity:0.4; cursor:not-allowed"'}>
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,m.querySelector("#btn-add-user").addEventListener("click",()=>d()),m.querySelectorAll(".btn-edit-user").forEach(w=>{w.addEventListener("click",g=>d(g.currentTarget.dataset.id))}),m.querySelectorAll(".btn-deactivate-user").forEach(w=>{w.addEventListener("click",g=>{const E=g.currentTarget.dataset.id,C=p.getById("technicians",E);if(!C)return;const q=document.createElement("div");q.innerHTML=`<p>Are you sure you want to deactivate <strong>${C.name}</strong>? They will no longer be able to log in.</p>`,$e({title:"Deactivate User",content:q,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Deactivate",className:"btn-danger",onClick:I=>{p.update("technicians",E,{deactivated:!0,deactivatedAt:new Date().toISOString()}),A(`${C.name} deactivated`,"info"),I(),c()}}]})})}),m.querySelectorAll(".btn-reactivate-user").forEach(w=>{w.addEventListener("click",g=>{const E=g.currentTarget.dataset.id,C=p.getById("technicians",E);if(!C)return;const q=new Date(C.deactivatedAt),I=Math.ceil((new Date-q)/(1e3*60*60*24));if(I<30){A(`License Policy: Seat cooldown in progress (${30-I} days remaining)`,"error");return}const _=document.createElement("div");_.innerHTML=`<p>Reactivate <strong>${C.name}</strong>? They will regain access once a User Type is assigned.</p>`,$e({title:"Reactivate User",content:_,actions:[{label:"Cancel",className:"btn-secondary",onClick:J=>J()},{label:"Reactivate",className:"btn-primary",onClick:J=>{p.update("technicians",E,{deactivated:!1,deactivatedAt:null}),A(`${C.name} has been reactivated.`,"success"),J(),c()}}]})})}),(y=m.querySelector("#btn-add-usertype"))==null||y.addEventListener("click",()=>{o()}),m.querySelectorAll(".btn-edit-perms").forEach(w=>{w.addEventListener("click",g=>{r(g.target.dataset.id)})}),m.querySelectorAll(".btn-edit-usertype").forEach(w=>{w.addEventListener("click",g=>{o(g.target.dataset.id)})}),m.querySelectorAll(".btn-delete-usertype").forEach(w=>{w.addEventListener("click",g=>{const E=g.target.dataset.id,C=p.getById("userTypes",E);if(!C)return;if(C.name.toLowerCase().includes("admin")){A("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const q=p.getAll("technicians").filter(_=>_.userTypeId===E),I=document.createElement("div");I.innerHTML=`<p>Are you sure you want to delete the user type <strong>${C.name}</strong>?${q.length>0?` <strong>${q.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,$e({title:"Confirm Deletion",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Delete",className:"btn-danger",onClick:_=>{p.delete("userTypes",E),A("User Type deleted","success"),_(),c()}}]})})})}else if(a==="materials")i(m);else if(a==="tax"){let k=function(w){return Array.from(w.querySelectorAll(".labor-rate-card")).map(g=>{const E=g.dataset.id,C=g.querySelector(".rate-name").value,q=parseFloat(g.querySelector(".rate-val").value)||0,I=parseFloat(g.querySelector(".rate-multiplier").value)||1,_=g.querySelector(".rate-desc").value,J=parseFloat(g.querySelector(".rate-min-fee").value)||0,N=g.querySelector(".btn-set-default")===null,U=Array.from(g.querySelectorAll(".rate-day:checked")).map(j=>j.dataset.day);return{id:E,name:C,rate:q,description:_,overtimeMultiplier:I,minCallOutFee:J,applicableDays:U,isDefault:N}})};var $=k;const h=p.getSettings();m.innerHTML=`
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
              ${h.laborRates.map(w=>{const g=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],E={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},C=w.applicableDays||["Mon","Tue","Wed","Thu","Fri"];return`
                <div class="labor-rate-card" data-id="${w.id}" style="border:2px solid ${w.isDefault?"var(--color-primary)":"var(--border-color)"}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${w.isDefault?"var(--color-primary-light)":"var(--bg-color)"}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${w.isDefault?"var(--color-primary)":"var(--text-tertiary)"}; font-size:20px">sell</span>
                      <input class="rate-name" value="${w.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${w.isDefault?'<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>':""}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${w.isDefault?"":`<button class="btn btn-ghost btn-sm btn-set-default" data-id="${w.id}" title="Set as default rate">Set Default</button>`}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${w.id}" title="Delete profile" ${w.isDefault?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
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
                        <input class="form-input rate-val" type="number" value="${w.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Overtime Multiplier</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <input class="form-input rate-multiplier" type="number" value="${(w.overtimeMultiplier||1).toFixed(1)}" min="1" max="5" step="0.5" style="width:100px" />
                        <span class="text-secondary">× base pay</span>
                      </div>
                    </div>
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${(w.minCallOutFee||0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Description</label>
                      <input class="form-input rate-desc" value="${w.description||""}" placeholder="When is this rate used?" />
                    </div>
                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${g.map(q=>`
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${q}" ${C.includes(q)?"checked":""} style="display:none" />
                            <span class="rate-day-pill" data-day="${q}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${C.includes(q)?"var(--color-primary)":"var(--border-color)"};background:${C.includes(q)?"var(--color-primary-light)":"transparent"};color:${C.includes(q)?"var(--color-primary)":"var(--text-secondary)"}">
                              ${E[q]}
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
              ${["Service","Project","Maintenance","Quote"].map(w=>`
                <div class="form-group" style="margin:0">
                  <label class="form-label">${w} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${w}">
                    <option value="">-- Use Default --</option>
                    ${h.laborRates.map(g=>{var E;return`<option value="${g.id}" ${((E=h.rateMappings)==null?void 0:E[w])===g.id?"selected":""}>${g.name}</option>`}).join("")}
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `,m.addEventListener("click",w=>{const g=w.target.closest(".rate-day-pill");if(g){const E=g.dataset.day,q=g.closest(".labor-rate-card").querySelector(`.rate-day[data-day="${E}"]`);q.checked=!q.checked;const I=q.checked;g.style.border=`1px solid ${I?"var(--color-primary)":"var(--border-color)"}`,g.style.background=I?"var(--color-primary-light)":"transparent",g.style.color=I?"var(--color-primary)":"var(--text-secondary)"}}),m.querySelector("#add-rate-btn").addEventListener("click",()=>{const w="rate_"+Date.now().toString(36),g=m.querySelector("#labor-rates-container"),E=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],C={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},q=document.createElement("div");q.className="labor-rate-card",q.dataset.id=w,q.style.cssText="border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);",q.innerHTML=`
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${w}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${w}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                      ${C[I]}
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        `,g.appendChild(q)}),m.addEventListener("click",w=>{if(w.target.closest(".remove-rate-btn")){const g=w.target.closest(".labor-rate-card");g&&g.remove()}}),m.addEventListener("click",w=>{if(w.target.closest(".btn-set-default")){const g=w.target.closest(".btn-set-default").dataset.id,E=k(m);E.forEach(q=>q.isDefault=q.id===g);const C=m.querySelector("#labor-rates-container");C.innerHTML=E.map(q=>{m.querySelectorAll(".labor-rate-card").forEach(I=>{const _=I.dataset.id===g;I.style.border=`2px solid ${_?"var(--color-primary)":"var(--border-color)"}`;const J=I.querySelector('div[style*="padding:12px 16px"]');J&&(J.style.background=_?"var(--color-primary-light)":"var(--bg-color)");let N=I.querySelector(".badge");if(_&&!N){const j=I.querySelector('div[style*="flex:1"]'),P=document.createElement("span");P.className="badge",P.style.cssText="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600",P.textContent="DEFAULT",j.appendChild(P)}else!_&&N&&N.remove();let U=I.querySelector(".btn-set-default");if(_&&U)U.remove();else if(!_&&!U){const j=I.querySelector('div[style*="gap:8px"]'),P=document.createElement("button");P.className="btn btn-ghost btn-sm btn-set-default",P.dataset.id=I.dataset.id,P.textContent="Set Default",j.prepend(P)}})}),A("Default rate updated in view. Click Save to apply.","info")}}),m.querySelector("#save-tax-settings").addEventListener("click",()=>{const w=parseFloat(m.querySelector("#global-markup").value)||0,g=parseInt(m.querySelector("#labor-rounding").value)||15,E=k(m),C=p.getSettings();C.markupPercent=w,C.laborRounding=g,C.laborRates=E,C.rateMappings={},m.querySelectorAll(".rate-mapping").forEach(q=>{q.value&&(C.rateMappings[q.dataset.type]=q.value)}),p.saveSettings(C),A("Financial and Rate settings saved","success"),c()})}else if(a==="assets"){p.getSettings();const h=p.getAll("assets").filter(k=>k.category==="Business");m.innerHTML=`
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
                ${h.map(k=>`
                  <tr>
                    <td class="font-medium">${f(k.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${k.id}" value="${k.recoveryRate||0}" step="0.5" style="width:100px; height:32px" />
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
      `,m.querySelector("#btn-save-asset-settings").addEventListener("click",()=>{m.querySelectorAll(".asset-rate-input").forEach(k=>{const w=k.dataset.id,g=parseFloat(k.value)||0;p.update("assets",w,{recoveryRate:g})}),A("Asset recovery rates updated across the system","success")})}else a==="system"&&(m.innerHTML=`
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
      `,(x=m.querySelector("#btn-reset-data"))==null||x.addEventListener("click",()=>{p.clearAll(),A("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(T=m.querySelector("#btn-clear-data"))==null||T.addEventListener("click",()=>{p.clearAll(),A("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)}))}function o(m=null){let $=m?p.getById("userTypes",m):{name:"",description:""};const y=document.createElement("div");y.innerHTML=`
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
    `;const x=y.querySelector("#ut-template"),T=y.querySelector("#ut-custom-edit-perms");x&&T&&(x.addEventListener("change",h=>{h.target.value==="Custom"?T.style.display="flex":T.style.display="none"}),T.addEventListener("click",()=>{var E;const h=y.querySelector("#ut-name").value,k=y.querySelector("#ut-desc").value;if(!h){A("Please enter a User Type Name first","error");return}const w=Oe(()=>!1),g=p.create("userTypes",{name:h,description:k,permissions:w});(E=document.getElementById("modal-close-btn"))==null||E.click(),r(g.id)})),$e({title:m?"Edit User Type":"Add User Type",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:"Save",className:"btn-primary",onClick:h=>{var E;const k=document.getElementById("ut-name").value,w=document.getElementById("ut-desc").value,g=(E=document.getElementById("ut-template"))==null?void 0:E.value;if(!k){A("Name required","error");return}if(m)p.update("userTypes",m,{name:k,description:w});else{let C=[];g==="Admin"?C=Oe(()=>!0):g==="Manager"?C=Oe((q,I)=>q==="Settings"?["view","edit_company"].includes(I):!0):g==="Technician"?C=Oe((q,I)=>q==="Dashboard"?I==="view":q==="Jobs"?["view","manage_tasks","book_time"].includes(I):q==="Timesheets"?["view_own","create"].includes(I):q==="Schedule"?["view_own"].includes(I):!1):g==="Office Staff"?C=Oe((q,I)=>q==="Settings"?!1:q==="Reports"?I==="view":!(["Invoices","Purchase Orders"].includes(q)&&I==="delete")):C=Oe(()=>!1),p.create("userTypes",{name:k,description:w,permissions:C})}A("User Type saved","success"),c(),h()}}]})}function r(m){const $=p.getById("userTypes",m);if(!$)return;const y=$.permissions||[],x={};y.forEach(k=>{x[k.module]=k});const T=document.createElement("div"),h=Object.entries(ot).map(([k,w])=>{const g=x[k]||{},E=w.every(({key:q})=>g[q]),C=w.map(({key:q,label:I})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${k}" data-key="${q}" ${g[q]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${I}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${k}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${k}" ${E?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${C}
          </div>
        </div>
      `}).join("");T.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${h}
      </div>
    `,T.querySelector("#btn-select-all-perms").addEventListener("click",()=>{T.querySelectorAll(".perm-chk, .module-select-all").forEach(k=>k.checked=!0)}),T.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{T.querySelectorAll(".perm-chk, .module-select-all").forEach(k=>k.checked=!1)}),T.querySelectorAll(".module-select-all").forEach(k=>{k.addEventListener("change",w=>{const g=w.target.dataset.module;T.querySelectorAll(`.perm-chk[data-module="${g}"]`).forEach(E=>E.checked=w.target.checked)})}),T.querySelectorAll(".perm-chk").forEach(k=>{k.addEventListener("change",()=>{const w=k.dataset.module,E=(ot[w]||[]).every(({key:q})=>{const I=T.querySelector(`.perm-chk[data-module="${w}"][data-key="${q}"]`);return I&&I.checked}),C=T.querySelector(`.module-select-all[data-module="${w}"]`);C&&(C.checked=E)})}),$e({title:`Edit Permissions: ${$.name}`,content:T,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Save Permissions",className:"btn-primary",onClick:k=>{const w=Object.entries(ot).map(([g,E])=>{const C={module:g};return E.forEach(({key:q})=>{const I=T.querySelector(`.perm-chk[data-module="${g}"][data-key="${q}"]`);C[q]=I?I.checked:!1}),C});p.update("userTypes",m,{permissions:w}),A("Permissions updated successfully","success"),c(),k()}}]})}function d(m=null){let $=m?p.getById("technicians",m):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const y=p.getAll("userTypes"),x=document.createElement("div");x.innerHTML=`
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
            ${y.map(k=>`
              <option value="${k.id}" ${$.userTypeId===k.id?"selected":""}>${k.name}</option>
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
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(k=>`
            <div class="color-swatch" data-color="${k}" style="width:28px; height:28px; border-radius:50%; background:${k}; cursor:pointer; border:2px solid ${$.color.toUpperCase()===k.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${$.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const T=x.querySelector("#u-color"),h=x.querySelectorAll(".color-swatch");h.forEach(k=>{k.addEventListener("click",()=>{T.value=k.dataset.color,h.forEach(w=>w.style.borderColor="transparent"),k.style.borderColor="var(--text-primary)"})}),T.addEventListener("input",()=>{h.forEach(k=>k.style.borderColor="transparent")}),$e({title:m?"Edit User":"Add User",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Save",className:"btn-primary",onClick:k=>{const w=document.getElementById("u-name").value,g=document.getElementById("u-email").value,E=document.getElementById("u-role").value,C=document.getElementById("u-type").value,q=document.getElementById("u-color").value,I=parseFloat(document.getElementById("u-payrate").value)||null;if(!w){A("Name required","error");return}m?p.update("technicians",m,{name:w,email:g,role:E,userTypeId:C,color:q,payRate:I}):p.create("technicians",{name:w,email:g,role:E,userTypeId:C,color:q,payRate:I}),A("User saved","success"),c(),k()}}]})}document.addEventListener("save-settings",()=>A("Settings saved","success"));function v(m){const $=p.getAll("taskTemplates");m.innerHTML=`
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
              ${$.length?$.map(x=>`
                <tr>
                  <td class="font-medium">${f(x.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${f(x.description||"—")}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(x.tags||[]).map(T=>`<span class="badge badge-neutral" style="font-size:10px">${f(T)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-template" data-id="${x.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-template" data-id="${x.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="4" class="text-center text-tertiary" style="padding:32px">No templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-template").addEventListener("click",()=>{y()}),m.querySelectorAll(".btn-delete-template").forEach(x=>{x.addEventListener("click",()=>{confirm("Delete this template?")&&(p.delete("taskTemplates",x.dataset.id),c())})}),m.querySelectorAll(".btn-edit-template").forEach(x=>{x.addEventListener("click",()=>{y(x.dataset.id)})});function y(x=null){const T=x?p.getById("taskTemplates",x):{name:"",description:"",tags:[],tasks:[]},h=document.createElement("div");h.style.maxHeight="80vh",h.style.overflowY="auto",h.style.padding="4px";let k=JSON.parse(JSON.stringify(T.tasks||T.phases||[])).map(_=>{!_.subTasks&&_.subPhases&&(_.subTasks=_.subPhases,delete _.subPhases),_.tasks&&!_.subTasks&&(_.subTasks=_.tasks.map(N=>({id:N.id||p.generateId(),name:N.name||"",estimatedHours:N.estimatedHours||0,people:N.people||1,status:"Not Started",progress:0})),delete _.tasks);function J(N){N.subPhases&&!N.subTasks&&(N.subTasks=N.subPhases,delete N.subPhases),N.subTasks||(N.subTasks=[]),N.subTasks.forEach(J)}return J(_),_}),w=k.length>0?[0]:[],g=[],E=!1;function C(_,J){if(!J||J.length===0)return null;let N=_[J[0]];if(!N)return null;for(let U=1;U<J.length;U++)if(!N.subTasks||(N=N.subTasks[J[U]],!N))return null;return N}function q(_){return!_.subTasks||_.subTasks.length===0?(parseFloat(_.estimatedHours)||0)*(parseInt(_.people)||1):_.subTasks.reduce((J,N)=>J+q(N),0)}const I=()=>{var _,J,N,U,j,P;h.innerHTML=`
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${f(T.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${f(T.description||"")}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(T.tags||[]).join(", ")}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(()=>{const D=g.length>0?C(k,g):null,M=D?D.subTasks||[]:k,L=D?f(D.name):"Main Tasks";return`
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${g.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${L}">${L}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${M.map((S,F)=>{const O=[...g,F],le=O.join("-")===w.join("-");return`
                        <div class="tmpl-task-list-item" data-path="${O.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${le?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${le?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(S.name)}">${f(S.name)}</span>
                          ${S.subTasks&&S.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${O.join("-")}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>`:""}
                        </div>
                      `}).join("")}
                    ${M.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${w.length>0?(()=>{const D=w,M=C(k,D);if(!M)return'<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';const L=M.subTasks&&M.subTasks.length>0;return`
                  ${E?`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${D.join("-")}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${D.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <label class="form-label" style="font-size:11px">Name *</label>
                      <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${f(M.name)}" style="font-size:13px" />
                    </div>
                    ${L?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:13px; font-weight:500">${q(M)} hrs</div>
                      </div>
                    `:`
                      <div class="form-row" style="margin-bottom:12px; gap:8px">
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">Est. Hours</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${M.estimatedHours||""}" min="0" step="0.5" style="font-size:13px" />
                        </div>
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">People</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${M.people||"1"}" min="1" step="1" style="font-size:13px" />
                        </div>
                      </div>
                    `}
                    <div class="form-group" style="margin-bottom:0">
                      <label class="form-label" style="font-size:11px">Description</label>
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${f(M.description||"")}</textarea>
                    </div>
                  `:`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${f(M.name)}">${f(M.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${D.length<3?`<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${D.join("-")}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>`:""}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${D.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${f(M.name)}</div>
                    </div>
                    ${L?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${q(M)} hrs</div>
                      </div>
                    `:`
                      <div style="display:flex; gap:16px; margin-bottom:12px">
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Estimated Hours</div>
                          <div style="font-size:14px; font-weight:500">${M.estimatedHours||0} hrs</div>
                        </div>
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">People</div>
                          <div style="font-size:14px; font-weight:500">${M.people||1}</div>
                        </div>
                      </div>
                    `}
                    <div style="margin-top:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Description</div>
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${f(M.description||"No description provided.")}</div>
                    </div>
                  `}
                `})():'<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `,(_=h.querySelector(".btn-view-back"))==null||_.addEventListener("click",()=>{g.pop(),I()}),h.querySelectorAll(".btn-drill-down-tmpl").forEach(D=>{D.addEventListener("click",M=>{M.stopPropagation(),g=D.dataset.path.split("-").map(Number),w=[...g],I()})}),h.querySelectorAll(".tmpl-task-list-item").forEach(D=>{D.addEventListener("click",M=>{M.target.closest(".btn-drill-down-tmpl")||(w=D.dataset.path.split("-").map(Number),E=!1,I())})}),(J=h.querySelector(".btn-add-node"))==null||J.addEventListener("click",()=>{const D={id:p.generateId(),name:"New Task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]};if(g.length===0)k.push(D),w=[k.length-1];else{const M=C(k,g);M.subTasks||(M.subTasks=[]),M.subTasks.push(D),w=[...g,M.subTasks.length-1]}E=!0,I()}),(N=h.querySelector(".btn-add-child-tmpl"))==null||N.addEventListener("click",D=>{const M=D.currentTarget.dataset.path.split("-").map(Number),L=C(k,M);L.subTasks||(L.subTasks=[]),L.subTasks.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]}),w=[...M,L.subTasks.length-1],E=!0,I()}),(U=h.querySelector(".btn-edit-info-tmpl"))==null||U.addEventListener("click",()=>{E=!0,I()}),(j=h.querySelector(".btn-done-info-tmpl"))==null||j.addEventListener("click",()=>{E=!1,I()}),h.querySelectorAll(".tmpl-detail-input").forEach(D=>{D.addEventListener("input",M=>{const L=C(k,w);if(!L)return;const S=M.target.dataset.field;S==="estimatedHours"?L[S]=parseFloat(M.target.value)||0:S==="people"?L[S]=parseInt(M.target.value)||1:L[S]=M.target.value})}),h.querySelectorAll(".btn-remove-task-tmpl-item").forEach(D=>{D.addEventListener("click",M=>{const L=D.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this item and all its sub-tasks?")){if(L.length===1)k.splice(L[0],1);else{const S=L.slice(0,-1),F=C(k,S);F&&F.subTasks&&F.subTasks.splice(L[L.length-1],1)}w=L.slice(0,-1),E=!1,I()}})}),(P=h.querySelector(".btn-duplicate-task-tmpl"))==null||P.addEventListener("click",D=>{const M=D.currentTarget.dataset.path.split("-").map(Number),L=C(k,M);if(!L)return;function S(O,le){return{...O,id:p.generateId(),name:O.name+(le?" (Copy)":""),status:"Not Started",progress:0,subTasks:O.subTasks?O.subTasks.map(pe=>S(pe,!1)):[]}}const F=S(L,!0);if(M.length===1)k.splice(M[0]+1,0,F),w=[M[0]+1];else{const O=M.slice(0,-1);C(k,O).subTasks.splice(M[M.length-1]+1,0,F),w=[...O,M[M.length-1]+1]}E=!1,I()})};I(),$e({title:x?"Edit Tasklist Template":"Create Tasklist Template",content:h,size:"modal-lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Save Template",className:"btn-primary",onClick:_=>{const J=h.querySelector("#edit-tmpl-name").value,N=h.querySelector("#edit-tmpl-desc").value,U=h.querySelector("#edit-tmpl-tags").value.split(",").map(P=>P.trim()).filter(Boolean);if(!J){A("Name required","error");return}const j={name:J,description:N,tags:U,tasks:k,phases:k};x?p.update("taskTemplates",x,j):p.create("taskTemplates",j),A("Tasklist template saved","success"),_(),c()}}]})}}function b(m){const $=p.getAll("quoteTemplates");m.innerHTML=`
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
              ${$.length?$.map(y=>`
                <tr>
                  <td class="font-medium">${f(y.name)}</td>
                  <td class="text-secondary">${f(y.description||"—")}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-quote-template" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-quote-template" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="3" class="text-center text-tertiary" style="padding:32px">No quote templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-quote-template").addEventListener("click",()=>{R.navigate("/settings/quote-templates/new")}),m.querySelectorAll(".btn-delete-quote-template").forEach(y=>{y.addEventListener("click",()=>{confirm("Delete this template?")&&(p.delete("quoteTemplates",y.dataset.id),c())})}),m.querySelectorAll(".btn-edit-quote-template").forEach(y=>{y.addEventListener("click",()=>{R.navigate(`/settings/quote-templates/${y.dataset.id}/edit`)})})}function i(m){const $=p.getSettings(),y=$.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]},x=$.materialCategories||["General"];m.innerHTML=`
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${y.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${y.minMarkupAmount}" step="0.50" style="width:100px" />
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
                  <input type="checkbox" id="mat-use-tiers" ${y.useTiers?"checked":""} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${y.useTiers?"":"opacity:0.5;pointer-events:none"}">
                <table class="data-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="tier-rows">
                    ${(y.tiers||[]).map((h,k)=>`
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${k===0?"Up to":"From previous up to"} 
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
                          <button class="btn btn-icon btn-sm text-danger btn-remove-tier" data-idx="${k}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
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
              ${x.map(h=>`
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
    `;const T=()=>{const h=parseFloat(m.querySelector("#mat-default-markup").value),k=parseFloat(m.querySelector("#mat-min-markup").value),w=m.querySelector("#mat-use-tiers").checked,g=Array.from(m.querySelectorAll("#tier-rows tr")).map(q=>({upTo:parseFloat(q.querySelector(".tier-upto").value)||null,percent:parseFloat(q.querySelector(".tier-percent").value)||0})).sort((q,I)=>q.upTo===null?1:I.upTo===null?-1:q.upTo-I.upTo),E=Array.from(m.querySelectorAll(".btn-remove-cat")).map(q=>q.dataset.name),C={...$,materialMarkup:{defaultPercent:h,minMarkupAmount:k,useTiers:w,tiers:g},materialCategories:E};p.saveSettings(C),A("Material settings saved","success")};m.querySelector("#mat-use-tiers").addEventListener("change",h=>{m.querySelector("#tiers-container").style.opacity=h.target.checked?"1":"0.5",m.querySelector("#tiers-container").style.pointerEvents=h.target.checked?"auto":"none"}),m.querySelector("#btn-add-tier").addEventListener("click",()=>{const h=document.createElement("tr");h.innerHTML=`
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
      `,m.querySelector("#tier-rows").appendChild(h),h.querySelector(".btn-remove-tier").addEventListener("click",()=>h.remove())}),m.querySelectorAll(".btn-remove-tier").forEach(h=>{h.addEventListener("click",()=>h.closest("tr").remove())}),m.querySelector("#btn-add-category").addEventListener("click",()=>{const h=prompt("Enter category name:");if(h){const k=document.createElement("div");k.className="badge badge-neutral",k.style.cssText="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px",k.innerHTML=`
          ${h}
          <span class="material-icons-outlined btn-remove-cat" data-name="${h}" style="font-size:14px;cursor:pointer">close</span>
        `,m.querySelector("#categories-container").insertBefore(k,m.querySelector("#btn-add-category")),k.querySelector(".btn-remove-cat").addEventListener("click",()=>k.remove())}}),m.querySelectorAll(".btn-remove-cat").forEach(h=>{h.addEventListener("click",()=>h.closest(".badge").remove())}),m.querySelector("#btn-save-materials").addEventListener("click",T)}function n(m){m.innerHTML=`
      <div class="card" style="margin-bottom:var(--space-md)">
        <div class="card-body" style="padding: 8px; background:var(--bg-color); border-radius: 8px; display:flex; gap:8px">
          <button class="btn btn-sm" id="subtab-tasklists" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${u==="tasklists"?"var(--color-primary)":"transparent"}; color:${u==="tasklists"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">playlist_add_check</span> Tasklist Templates
          </button>
          <button class="btn btn-sm" id="subtab-forms" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${u==="forms"?"var(--color-primary)":"transparent"}; color:${u==="forms"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">assignment</span> Form Templates
          </button>
          <button class="btn btn-sm" id="subtab-quotes" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${u==="quotes"?"var(--color-primary)":"transparent"}; color:${u==="quotes"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">article</span> Quote Templates
          </button>
        </div>
      </div>
      <div id="templates-subcontent" style="margin-top:var(--space-md)"></div>
    `;const $=m.querySelector("#subtab-tasklists"),y=m.querySelector("#subtab-forms"),x=m.querySelector("#subtab-quotes");u==="tasklists"&&($.style.color="white"),u==="forms"&&(y.style.color="white"),u==="quotes"&&(x.style.color="white");const T=m.querySelector("#templates-subcontent");u==="tasklists"?v(T):u==="forms"?ms(T):u==="quotes"&&b(T),$.addEventListener("click",()=>{u="tasklists",n(m)}),y.addEventListener("click",()=>{u="forms",n(m)}),x.addEventListener("click",()=>{u="quotes",n(m)})}l()}function ms(e){const s=p.getAll("formTemplates");e.innerHTML=`
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
                  <td><span class="badge badge-neutral">${(t.sections||[]).reduce((a,u)=>a+u.fields.length,0)} Fields</span></td>
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
    `,e.querySelector("#btn-add-form-template").addEventListener("click",()=>R.navigate("/settings/forms/new")),e.querySelectorAll(".edit-form-template").forEach(t=>{t.addEventListener("click",()=>R.navigate(`/settings/forms/${t.dataset.id}/edit`))}),e.querySelectorAll(".delete-form-template").forEach(t=>{t.addEventListener("click",()=>{if(confirm("Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.")){const a=t.dataset.id,u=p.getAll("formTemplates").filter(l=>l.id!==a);p.save("formTemplates",u),ms(e)}})})}function bs(e,{id:s}){const t=s&&s!=="new",a=p.getAll("formTemplates"),u=t?a.find(d=>d.id===s):null;if(t&&!u){e.innerHTML='<div class="empty-state"><h3>Template not found</h3></div>';return}let l=u?JSON.parse(JSON.stringify(u.sections||[])):[{id:"sec_"+Math.random().toString(36).substr(2,5),title:"General Info",width:"full",fields:[]}];l.forEach(d=>{d.width||(d.width="full"),(d.fields||[]).forEach(v=>{v.width||(v.width="full")})});function c(){e.innerHTML=`
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
                <input class="form-input" id="form-name" value="${f((u==null?void 0:u.name)||"")}" placeholder="e.g. Daily Safety Audit" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input class="form-input" id="form-desc" value="${f((u==null?void 0:u.description)||"")}" placeholder="Optional description..." />
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
              ${l.map((d,v)=>{const b=d.width==="half";return d.isSpacer?`
                    <div class="section-card" data-section-index="${v}" style="grid-column: span ${b?"1":"2"}; border:2px dashed var(--border-color); border-radius:12px; background:transparent; display:flex; align-items:center; justify-content:space-between; padding:16px; min-height:100px">
                      <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-up" data-section-index="${v}" ${v===0?"disabled":""}><span class="material-icons-outlined" style="font-size:18px">${b?"arrow_back":"keyboard_arrow_up"}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-down" data-section-index="${v}" ${v===l.length-1?"disabled":""}><span class="material-icons-outlined" style="font-size:18px">${b?"arrow_forward":"keyboard_arrow_down"}</span></button>
                      </div>
                      <div style="color:var(--text-tertiary); font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:13px; display:flex; align-items:center; gap:8px">
                        <span class="material-icons-outlined">space_bar</span> Empty Layout Spacer
                      </div>
                      <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-icon btn-sm toggle-sec-width" data-section-index="${v}" title="Toggle Half/Full Width"><span class="material-icons-outlined" style="font-size:18px">${b?"width_normal":"width_full"}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${v}" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span></button>
                      </div>
                    </div>
                  `:`
                <div class="section-card" data-section-index="${v}" style="grid-column: span ${b?"1":"2"}; border:1px solid var(--border-color); border-radius:12px; background:var(--bg-color); overflow:hidden; box-shadow:var(--shadow-sm)">
                  <div style="padding:16px 20px; background:var(--content-bg); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px">
                      <div style="display:flex; flex-direction:${b?"row":"column"}; gap:2px">
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-up" data-section-index="${v}" ${v===0?"disabled":""} style="height:24px; width:24px; padding:0"><span class="material-icons-outlined" style="font-size:18px">${b?"arrow_back":"keyboard_arrow_up"}</span></button>
                        <button class="btn btn-ghost btn-icon btn-sm move-sec-down" data-section-index="${v}" ${v===l.length-1?"disabled":""} style="height:24px; width:24px; padding:0"><span class="material-icons-outlined" style="font-size:18px">${b?"arrow_forward":"keyboard_arrow_down"}</span></button>
                      </div>
                      <input class="form-input section-title" value="${f(d.title)}" placeholder="Section Title..." style="font-weight:600; font-size:16px; background:transparent; border:none; padding:4px; margin:0; flex:1" />
                    </div>
                    <div style="display:flex; gap:8px; align-items:center">
                      <button class="btn btn-ghost btn-sm btn-icon toggle-sec-width" data-section-index="${v}" title="Toggle Half/Full Width">
                        <span class="material-icons-outlined" style="font-size:18px">${b?"width_normal":"width_full"}</span>
                      </button>
                      <button class="btn btn-secondary btn-sm btn-add-field-to-sec" data-section-index="${v}">
                        <span class="material-icons-outlined" style="font-size:16px">add</span> Add Field
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm remove-section" data-section-index="${v}" style="color:var(--color-danger)">
                        <span class="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <div class="fields-container" style="padding:20px; display:grid; grid-template-columns: 1fr 1fr; gap:16px">
                    ${d.fields.map((i,n)=>{var $;const m=i.width==="half";return`
                      <div class="field-row" data-field-index="${n}" style="grid-column: span ${m?"1":"2"}; display:flex; flex-direction:column; gap:12px; background:${i.type==="spacer"?"transparent":"white"}; padding:16px; border-radius:8px; border:${i.type==="spacer"?"2px dashed var(--border-color)":"1px solid var(--border-color)"}; position:relative; min-height:${i.type==="spacer"?"80px":"auto"}">
                        
                        ${i.type==="spacer"?`
                          <div style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-weight:600; text-transform:uppercase; font-size:12px; letter-spacing:1px; gap:8px">
                            <span class="material-icons-outlined">space_bar</span> Empty Spacer
                          </div>
                        `:`
                          <div style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap">
                            <div class="form-group" style="margin:0; flex:2; min-width:150px">
                              <label class="form-label" style="font-size:11px; text-transform:uppercase; color:var(--text-tertiary)">${i.type==="info"?"Instruction / Info Text":"Field Label"}</label>
                              ${i.type==="info"?`<textarea class="form-textarea field-label" placeholder="Enter instructional or informative text for the user..." style="min-height:50px">${f(i.label)}</textarea>`:`<input class="form-input field-label" value="${f(i.label)}" placeholder="Enter question or label..." />`}
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
                            <button class="btn btn-ghost btn-icon btn-sm move-field-up" data-section-index="${v}" data-field-index="${n}" ${n===0?"disabled":""} title="Move Left/Up"><span class="material-icons-outlined" style="font-size:18px">${m?"arrow_back":"arrow_upward"}</span></button>
                            <button class="btn btn-ghost btn-icon btn-sm move-field-down" data-section-index="${v}" data-field-index="${n}" ${n===d.fields.length-1?"disabled":""} title="Move Right/Down"><span class="material-icons-outlined" style="font-size:18px">${m?"arrow_forward":"arrow_downward"}</span></button>
                            <div style="width:1px; height:16px; background:var(--border-color); margin:0 4px"></div>
                            <button class="btn btn-ghost btn-icon btn-sm toggle-field-width" data-section-index="${v}" data-field-index="${n}" title="Toggle Half/Full Width"><span class="material-icons-outlined" style="font-size:18px">${m?"width_normal":"width_full"}</span></button>
                            <button class="btn btn-ghost btn-icon btn-sm remove-field" data-section-index="${v}" data-field-index="${n}" style="color:var(--color-danger)" title="Remove Field"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                          </div>
                        </div>
                        
                        ${i.type==="select"?`
                          <div style="margin-top:4px; padding:12px; background:var(--bg-color); border-radius:4px">
                            <label class="form-label" style="font-size:11px">Dropdown Options (comma separated)</label>
                            <input class="form-input field-options" style="font-size:13px" value="${f((($=i.options)==null?void 0:$.join(", "))||"")}" placeholder="e.g. Option 1, Option 2, Option 3" />
                          </div>
                        `:""}
                      </div>
                    `}).join("")}
                    ${d.fields.length?"":`
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
    `,r()}function o(){e.querySelectorAll(".section-card").forEach(d=>{const v=parseInt(d.dataset.sectionIndex);if(l[v].isSpacer)return;const b=d.querySelector(".section-title");b&&(l[v].title=b.value),d.querySelectorAll(".field-row").forEach(i=>{var T;const n=parseInt(i.dataset.fieldIndex),m=l[v].fields[n],$=i.querySelector(".field-type");$&&(m.type=$.value);const y=i.querySelector(".field-label");y&&(m.label=y.value);const x=i.querySelector(".field-required");if(x&&(m.required=x.checked),m.type==="select"){const h=((T=i.querySelector(".field-options"))==null?void 0:T.value)||"";m.options=h.split(",").map(k=>k.trim()).filter(Boolean)}})})}function r(){e.querySelector("#btn-back").addEventListener("click",()=>R.navigate("/settings?tab=forms")),e.querySelector("#btn-cancel").addEventListener("click",()=>R.navigate("/settings?tab=forms")),e.querySelector("#btn-save").addEventListener("click",()=>{o();const d=e.querySelector("#form-name").value.trim(),v=e.querySelector("#form-desc").value.trim();if(!d){A("Form name is required","error"),e.querySelector("#form-name").focus();return}if(l.reduce((m,$)=>m+$.fields.length,0)===0){A("Please add at least one field to the form","error");return}const i={id:t?s:"fmt_"+Math.random().toString(36).substr(2,9),name:d,description:v,sections:l.map(m=>({...m}))},n=p.getAll("formTemplates");if(t){const m=n.findIndex($=>$.id===s);n[m]=i}else n.push(i);p.save("formTemplates",n),A(`Form template "${d}" saved`,"success"),R.navigate("/settings?tab=forms")}),e.querySelector("#btn-add-section").addEventListener("click",()=>{o(),l.push({id:"sec_"+Math.random().toString(36).substr(2,5),title:"New Section",width:"full",fields:[]}),c()}),e.querySelector("#btn-add-spacer-section").addEventListener("click",()=>{o(),l.push({id:"sec_"+Math.random().toString(36).substr(2,5),title:"",isSpacer:!0,width:"half",fields:[]}),c()}),e.querySelectorAll(".btn-add-field-to-sec").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex);l[v].fields.push({id:"f_"+Math.random().toString(36).substr(2,5),type:"text",label:"",required:!1}),c()})}),e.querySelectorAll(".remove-section").forEach(d=>{d.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this entire section and all its fields?")){const v=parseInt(d.dataset.sectionIndex);l.splice(v,1),c()}})}),e.querySelectorAll(".remove-field").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex),b=parseInt(d.dataset.fieldIndex);l[v].fields.splice(b,1),c()})}),e.querySelectorAll(".toggle-sec-width").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex);l[v].width=l[v].width==="half"?"full":"half",c()})}),e.querySelectorAll(".toggle-field-width").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex),b=parseInt(d.dataset.fieldIndex);l[v].fields[b].width=l[v].fields[b].width==="half"?"full":"half",c()})}),e.querySelectorAll(".move-sec-up").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex);if(v>0){const b=l[v-1];l[v-1]=l[v],l[v]=b,c()}})}),e.querySelectorAll(".move-sec-down").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex);if(v<l.length-1){const b=l[v+1];l[v+1]=l[v],l[v]=b,c()}})}),e.querySelectorAll(".move-field-up").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex),b=parseInt(d.dataset.fieldIndex);if(b>0){const i=l[v].fields[b-1];l[v].fields[b-1]=l[v].fields[b],l[v].fields[b]=i,c()}})}),e.querySelectorAll(".move-field-down").forEach(d=>{d.addEventListener("click",()=>{o();const v=parseInt(d.dataset.sectionIndex),b=parseInt(d.dataset.fieldIndex);if(b<l[v].fields.length-1){const i=l[v].fields[b+1];l[v].fields[b+1]=l[v].fields[b],l[v].fields[b]=i,c()}})}),e.querySelectorAll(".field-type").forEach(d=>{d.addEventListener("change",()=>{o(),c()})})}c()}const qa=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function Da(e,s){if(e.role==="admin"||e.role==="manager")return"/";if(!e.userTypeId)return"/schedule";const t=s.getById("userTypes",e.userTypeId);if(!t||!t.permissions)return"/schedule";for(const{path:a,module:u}of qa){const l=t.permissions.find(c=>c.module===u);if(l&&(l.view||l.create||l.edit||l.delete))return a}return"/schedule"}function Aa(e){var r;const s=document.querySelector(".sidebar"),t=document.querySelector(".topbar"),a=document.getElementById("breadcrumb");s&&(s.style.display="none"),t&&(t.style.display="none"),a&&(a.style.display="none");const u=p.getAll("technicians").filter(d=>!d.deactivated),l=p.getAll("userTypes");e.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">FieldForge</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${u.map(d=>{const v=l.find(b=>b.id===d.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${d.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${d.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${v?v.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${u.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const c=async d=>{const v=u.find(y=>y.id===d),b=l.find(y=>y.id===(v==null?void 0:v.userTypeId));let i="technician";if(b){const y=b.name.toLowerCase();y.includes("admin")?i="admin":y.includes("manager")?i="manager":y.includes("office")&&(i="office")}const n={id:v.id,name:v.name,role:i,userTypeName:b?b.name:"Unassigned",userTypeId:v.userTypeId,color:v.color};localStorage.setItem("currentUser",JSON.stringify(n)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),ve(async()=>{const{updateSidebarAccess:y}=await Promise.resolve().then(()=>Bt);return{updateSidebarAccess:y}},void 0).then(({updateSidebarAccess:y})=>{y&&y()}),ve(async()=>{const{updateTopbarAccess:y}=await Promise.resolve().then(()=>Jt);return{updateTopbarAccess:y}},void 0).then(({updateTopbarAccess:y})=>{y&&y()});const{store:m}=await ve(async()=>{const{store:y}=await Promise.resolve().then(()=>Ts);return{store:y}},void 0),$=Da(n,m);R.navigate($)};e.querySelectorAll(".btn-login-user").forEach(d=>{d.addEventListener("click",v=>{const b=v.target.closest(".btn-login-user");c(b.dataset.id)})});const o=()=>{const d={id:"customer-user",name:"Customer User",role:"customer"},v=p.get("people").filter(b=>b.type==="Customer");v.length>0&&(d.customerId=v[0].id,d.name=v[0].firstName+" "+v[0].lastName),localStorage.setItem("currentUser",JSON.stringify(d)),s&&(s.style.display=""),t&&(t.style.display=""),a&&(a.style.display=""),ve(async()=>{const{updateSidebarAccess:b}=await Promise.resolve().then(()=>Bt);return{updateSidebarAccess:b}},void 0).then(({updateSidebarAccess:b})=>{b&&b()}),ve(async()=>{const{updateTopbarAccess:b}=await Promise.resolve().then(()=>Jt);return{updateTopbarAccess:b}},void 0).then(({updateTopbarAccess:b})=>{b&&b()}),R.navigate("/portal")};(r=e.querySelector("#btn-login-customer"))==null||r.addEventListener("click",o)}function _t(e){const s=JSON.parse(localStorage.getItem("currentUser")||"{}"),t=s.customerId;if(s.role!=="customer"||!t){e.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const a=p.getAll("jobs").filter(d=>d.customerId===t),u=p.getAll("quotes").filter(d=>d.customerId===t),l=p.getAll("invoices").filter(d=>d.customerId===t);e.innerHTML=`
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
        ${u.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${u.map(d=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${d.number} - ${d.title||"Quote"}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(d.total||0).toFixed(2)} | Status: <span class="badge ${d.status==="Approved"?"badge-success":"badge-neutral"}">${d.status}</span></div>
                </div>
                <div>
                  ${d.status!=="Approved"?`<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${d.id}">Approve</button>`:""}
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
            ${a.map(d=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${d.number} - ${d.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${d.status}</span></div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Invoices Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Invoices</h2>
        ${l.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${l.map(d=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${d.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(d.total||0).toFixed(2)} | Status: <span class="badge ${d.status==="Paid"?"badge-success":"badge-danger"}">${d.status}</span></div>
                </div>
                <div>
                  ${d.status!=="Paid"?`<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${d.id}">Pay Now</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;const c=e.querySelector("#portal-logout-btn");c&&c.addEventListener("click",()=>{localStorage.removeItem("currentUser"),ve(async()=>{const{router:d}=await Promise.resolve().then(()=>ks);return{router:d}},void 0).then(({router:d})=>{d.navigate("/login")})}),e.querySelectorAll(".btn-approve-quote").forEach(d=>{d.addEventListener("click",v=>{const b=v.target.dataset.id;p.update("quotes",b,{status:"Approved"}),alert("Quote approved successfully!"),_t(e)})}),e.querySelectorAll(".btn-pay-invoice").forEach(d=>{d.addEventListener("click",v=>{const b=v.target.dataset.id;p.update("invoices",b,{status:"Paid"}),alert("Invoice paid successfully!"),_t(e)})})}const Na=["Public Liability Insurance","Workers Compensation"];function vs(e){if(!e.expiryDate)return{status:"missing",label:"Missing Date",colorClass:"badge-neutral"};const s=new Date;s.setHours(0,0,0,0);const t=new Date(e.expiryDate);t.setHours(0,0,0,0);const a=t.getTime()-s.getTime(),u=Math.ceil(a/(1e3*60*60*24));return u<0?{status:"expired",label:"Expired",colorClass:"badge-danger"}:u<=30?{status:"expiring",label:`Expiring (${u}d)`,colorClass:"badge-warning"}:e.verified?{status:"active",label:"Active",colorClass:"badge-success"}:{status:"unverified",label:"Pending Verification",colorClass:"badge-neutral"}}function ys(e){if(!e.active)return{status:"inactive",label:"Inactive",badgeClass:"badge-neutral"};const s=e.complianceDocs||[];if(s.length===0)return{status:"non-compliant",label:"Missing Docs",badgeClass:"badge-danger"};const t=s.map(o=>o.type.toLowerCase().trim()),a=Na.filter(o=>!t.some(r=>r.includes(o.toLowerCase())));if(a.length>0)return{status:"non-compliant",label:"Missing critical docs",badgeClass:"badge-danger",reason:`Missing: ${a.join(", ")}`};let u=!1,l=!1,c=!1;return s.forEach(o=>{const r=vs(o);r.status==="expired"?u=!0:r.status==="expiring"?l=!0:r.status==="unverified"&&(c=!0)}),u?{status:"non-compliant",label:"Expired Credentials",badgeClass:"badge-danger"}:l?{status:"warning",label:"Expiring Credentials",badgeClass:"badge-warning"}:c?{status:"warning",label:"Pending Review",badgeClass:"badge-warning"}:{status:"compliant",label:"Compliant",badgeClass:"badge-success"}}function ht(e){const s=p.getAll("contractors");e.innerHTML=`
    <div class="page-header">
      <h1>Contractors</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-contractor"><span class="material-icons-outlined">add</span> Add Contractor</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search contractors by name, email or specialty..." id="contractors-search" />
      </div>
    </div>

    <div id="contractors-table-container"></div>
  `;let t=[...s];const u=He({columns:[{key:"businessName",label:"Business Name",render:l=>`<span class="cell-link font-medium">${f(l.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:l=>f(l.email||"—")},{key:"phone",label:"Phone",render:l=>f(l.phone||"—")},{key:"compliance",label:"Compliance",render:l=>{const c=ys(l),o=c.reason?c.reason:c.label;return`<span class="badge ${c.badgeClass}" title="${f(o)}" style="cursor:help">${f(c.label)}</span>`}},{key:"active",label:"Status",render:l=>`<span class="badge ${l.active?"badge-success":"badge-neutral"}">${l.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:l=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${l.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:t,onRowClick:l=>R.navigate(`/contractors/${l}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:l=>{Je({container:e,selectedIds:l,onClear:()=>u.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:c=>{c.forEach(o=>p.update("contractors",o,{active:!0})),u.clearSelection(),ht(e),ve(async()=>{const{showToast:o}=await Promise.resolve().then(()=>De);return{showToast:o}},void 0).then(({showToast:o})=>o(`Activated ${c.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:c=>{c.forEach(o=>p.update("contractors",o,{active:!1})),u.clearSelection(),ht(e),ve(async()=>{const{showToast:o}=await Promise.resolve().then(()=>De);return{showToast:o}},void 0).then(({showToast:o})=>o(`Deactivated ${c.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:c=>{ve(async()=>{const{showModal:o}=await Promise.resolve().then(()=>ze);return{showModal:o}},void 0).then(({showModal:o})=>{const r=document.createElement("div");r.innerHTML=`<p>Are you sure you want to delete ${c.length} contractors? This action cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{c.forEach(v=>p.delete("contractors",v)),u.clearSelection(),ht(e),ve(async()=>{const{showToast:v}=await Promise.resolve().then(()=>De);return{showToast:v}},void 0).then(({showToast:v})=>v(`Deleted ${c.length} contractors`,"success")),d()}}]})})}}]})}});e.querySelector("#contractors-table-container").appendChild(u),e.querySelector("#btn-new-contractor").addEventListener("click",()=>R.navigate("/contractors/new")),e.querySelector("#contractors-search").addEventListener("input",l=>{const c=l.target.value.toLowerCase();t=s.filter(o=>o.businessName.toLowerCase().includes(c)||o.contactName.toLowerCase().includes(c)||(o.email||"").toLowerCase().includes(c)||(o.specialties||[]).some(r=>r.toLowerCase().includes(c))),u.updateData(t)}),e.addEventListener("click",l=>{const c=l.target.closest(".contractor-edit-btn");c&&(l.stopPropagation(),R.navigate(`/contractors/${c.dataset.id}/edit`))})}function fs(e,s){const t=s.id==="new";let a=t?{active:!0,hourlyRate:85,afterHoursRate:127.5,calloutFee:90,specialties:[],complianceDocs:[]}:p.getById("contractors",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
    <div class="page-header">
      <h1>${t?"New Contractor Profile":"Edit Contractor Profile"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Profile</button>
      </div>
    </div>

    <div class="card" style="max-width: 700px; margin-bottom: var(--space-xl);">
      <div class="card-body">
        <form id="contractor-form" style="display: flex; flex-direction: column; gap: 18px;">
          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px;">Primary Contact Details</h4>
          
          <div class="form-group">
            <label class="form-label">Business Name *</label>
            <input type="text" id="businessName" class="form-input" value="${a.businessName||""}" placeholder="e.g. Acme Plumbing Pty Ltd" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Primary Contact Person *</label>
            <input type="text" id="contactName" class="form-input" value="${a.contactName||""}" placeholder="e.g. John Doe" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" value="${a.email||""}" placeholder="e.g. office@acmeplumbing.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="phone" class="form-input" value="${a.phone||""}" placeholder="e.g. 0412 345 678" />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">License & Specialties</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Trade License No.</label>
              <input type="text" id="licenseNumber" class="form-input" value="${a.licenseNumber||""}" placeholder="e.g. LIC-PL-1190" />
            </div>
            <div class="form-group">
              <label class="form-label">Primary Insurance Expiry</label>
              <input type="date" id="insuranceExpiry" class="form-input" value="${a.insuranceExpiry||""}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Specialties / Trade Skills (comma-separated)</label>
            <input type="text" id="specialties" class="form-input" value="${(a.specialties||[]).join(", ")}" placeholder="e.g. Gas Fitting, Excavation, Commercial Plumbing" />
            <p class="text-secondary" style="font-size:11px; margin: 3px 0 0 0;">Used to quickly search and filter subcontractors during dispatch.</p>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Subcontractor Charge Rates</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Std. Hourly Rate ($) *</label>
              <input type="number" id="hourlyRate" class="form-input" value="${a.hourlyRate!==void 0?a.hourlyRate:85}" step="0.5" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">After Hours Rate ($) *</label>
              <input type="number" id="afterHoursRate" class="form-input" value="${a.afterHoursRate!==void 0?a.afterHoursRate:127.5}" step="0.5" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Flat Call-out Fee ($) *</label>
              <input type="number" id="calloutFee" class="form-input" value="${a.calloutFee!==void 0?a.calloutFee:90}" step="0.5" min="0" required />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Administrative Information</h4>

          <div class="form-group">
            <label class="form-label">Internal Operations Notes</label>
            <textarea id="notes" class="form-input" rows="3" placeholder="Enter comments, standard response times, preferred technicians, or performance evaluations...">${a.notes||""}</textarea>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
            <input type="checkbox" id="active" ${a.active?"checked":""} style="width:16px; height:16px; cursor:pointer;" />
            <label for="active" style="margin: 0; cursor:pointer; font-weight:600;" class="form-label">Active & Dispatch-Ready</label>
          </div>
        </form>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{R.navigate(t?"/contractors":`/contractors/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const u=e.querySelector("#businessName").value.trim(),l=e.querySelector("#contactName").value.trim(),c=e.querySelector("#email").value.trim(),o=e.querySelector("#phone").value.trim(),r=e.querySelector("#licenseNumber").value.trim(),d=e.querySelector("#insuranceExpiry").value,v=e.querySelector("#active").checked,b=parseFloat(e.querySelector("#hourlyRate").value),i=parseFloat(e.querySelector("#afterHoursRate").value),n=parseFloat(e.querySelector("#calloutFee").value),m=e.querySelector("#specialties").value,$=m?m.split(",").map(T=>T.trim()).filter(Boolean):[],y=e.querySelector("#notes").value.trim();if(!u||!l){A("Business Name and Contact Name are required fields.","warning");return}if(isNaN(b)||isNaN(i)||isNaN(n)){A("Please enter valid numeric pay rates.","warning");return}const x={businessName:u,contactName:l,email:c,phone:o,licenseNumber:r,insuranceExpiry:d,active:v,hourlyRate:b,afterHoursRate:i,calloutFee:n,specialties:$,notes:y,complianceDocs:a.complianceDocs||[]};if(d){x.complianceDocs||(x.complianceDocs=[]);const T=x.complianceDocs.findIndex(h=>h.type.toLowerCase().includes("public liability"));T!==-1?(x.complianceDocs[T].expiryDate=d,x.complianceDocs[T].number=r?`PL-${r}`:x.complianceDocs[T].number):x.complianceDocs.push({id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:"Public Liability Insurance",number:r?`PL-${r}`:"PL-AUTO",expiryDate:d,verified:!0,notes:"Auto-synced from primary details"})}if(t){const T=p.create("contractors",x);A("Contractor profile created successfully","success"),R.navigate(`/contractors/${T.id}`)}else p.update("contractors",s.id,x),A("Contractor profile updated successfully","success"),R.navigate(`/contractors/${s.id}`)})}function Pa(e,s){const t=p.getById("contractors",s.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}Ge(t.businessName);const a=p.getAll("jobs").filter(b=>b.contractorId===s.id),u=p.getAll("jobs"),l=[];function c(b,i,n=[]){b&&b.forEach((m,$)=>{const y=[...n,$];((m.assignedContractorIds||[]).includes(s.id)||m.assignedContractorId===s.id)&&l.push({jobId:i.id,jobNumber:i.number,jobTitle:i.title,jobStatus:i.status,taskId:m.id,taskName:m.name,taskStatus:m.status||"Not Started",taskProgress:m.progress||0,taskEstimatedHours:m.estimatedHours||0,taskStartDate:m.startDate,path:y,isList:m.subTasks&&m.subTasks.length>0}),m.subTasks&&m.subTasks.length>0&&c(m.subTasks,i,y)})}u.forEach(b=>{b.tasks&&c(b.tasks,b)});let o="details";function r(){const b=ys(t);e.innerHTML=`
      ${Ke({title:f(t.businessName),icon:"engineering",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${f(t.contactName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${f(t.email||"—")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${f(t.phone||"—")}</span>
          <span class="badge ${b.badgeClass}" title="${f(b.reason||b.label)}" style="cursor:help">
            Compliance: ${f(b.label)}
          </span>
          <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-edit-contractor">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-contractor">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `})}

      <div class="tabs" id="contractor-tabs">
        <button class="tab ${o==="details"?"active":""}" data-tab="details">Overview & Details</button>
        <button class="tab ${o==="compliance"?"active":""}" data-tab="compliance">Compliance Registry (${(t.complianceDocs||[]).length})</button>
        <button class="tab ${o==="rates"?"active":""}" data-tab="rates">Financials & Rates</button>
        <button class="tab ${o==="jobs"?"active":""}" data-tab="jobs">Job Allocations (${a.length})</button>
        <button class="tab ${o==="tasks"?"active":""}" data-tab="tasks">Task Allocations (${l.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `,d(),e.querySelectorAll(".tab").forEach(i=>{i.addEventListener("click",()=>{o=i.dataset.tab,e.querySelectorAll(".tab").forEach(n=>n.classList.remove("active")),i.classList.add("active"),d()})}),e.querySelector("#btn-edit-contractor").addEventListener("click",()=>{R.navigate(`/contractors/${s.id}/edit`)}),e.querySelector("#btn-delete-contractor").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete <strong>${f(t.businessName)}</strong>? This action cannot be undone.</p>`,$e({title:"Delete Contractor",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{p.delete("contractors",s.id),A("Contractor deleted successfully","success"),n(),R.navigate("/contractors")}}]})})}function d(){const b=e.querySelector("#tab-content");if(b)if(o==="details"){const n=t.specialties||[];b.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Business & Contact Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${v("Business Name",t.businessName)}
                  ${v("Contact Name",t.contactName)}
                  ${v("Email Address",t.email||"Not set")}
                  ${v("Phone Number",t.phone||"Not set")}
                  ${v("Trade License No.",t.licenseNumber||"Not set")}
                  ${v("System Status",t.active?"Active (Ready for dispatch)":"Inactive (Do not dispatch)")}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Specialties & Trade Skills</h4>
                <div style="margin-bottom:var(--space-lg); display: flex; flex-wrap: wrap; gap: 6px;">
                  ${n.map(m=>`<span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600;">${f(m)}</span>`).join("")}
                  ${n.length===0?'<span class="text-secondary">No trade specialties listed. Click Edit to add.</span>':""}
                </div>

                <h4 style="margin-bottom:var(--space-base)">Administrative Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.5; white-space: pre-wrap;">${f(t.notes||"No administrative notes recorded for this contractor.")}</div>
              </div>
            </div>
          </div>
        </div>
      `}else if(o==="compliance"){const n=t.complianceDocs||[];b.innerHTML=`
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 20px;">
            <h4 style="margin:0">Credentials & Certificates Registry</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-doc">
              <span class="material-icons-outlined">add</span> Add Certificate
            </button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Credential Type</th>
                  <th>Policy / License No.</th>
                  <th>Expiry Date</th>
                  <th>Document Status</th>
                  <th>Verified?</th>
                  <th style="width:100px; text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${n.map((m,$)=>{const y=vs(m);return`
                    <tr>
                      <td class="font-medium">${f(m.type)}</td>
                      <td style="font-family:monospace" class="text-secondary">${f(m.number||"—")}</td>
                      <td>${m.expiryDate?new Date(m.expiryDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td><span class="badge ${y.colorClass}">${f(y.label)}</span></td>
                      <td>
                        <button class="btn btn-ghost btn-sm btn-toggle-verify" data-id="${m.id}" style="padding: 2px 6px;">
                          ${m.verified?'<span class="material-icons-outlined text-success" style="font-size:18px">check_circle</span> <span class="text-success" style="font-size:12px;font-weight:600">Verified</span>':'<span class="material-icons-outlined text-tertiary" style="font-size:18px">radio_button_unchecked</span> <span class="text-tertiary" style="font-size:12px">Click to verify</span>'}
                        </button>
                      </td>
                      <td style="text-align:right">
                        <button class="btn btn-icon btn-sm btn-ghost btn-delete-doc text-danger" data-id="${m.id}">
                          <span class="material-icons-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
                ${n.length===0?'<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No credentials or certificates uploaded.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `,b.querySelectorAll(".btn-toggle-verify").forEach(m=>{m.addEventListener("click",()=>{const $=m.dataset.id,y=n.map(x=>x.id===$?{...x,verified:!x.verified}:x);p.update("contractors",t.id,{complianceDocs:y}),t.complianceDocs=y,A("Certificate verification status updated","success"),r()})}),b.querySelectorAll(".btn-delete-doc").forEach(m=>{m.addEventListener("click",()=>{const $=m.dataset.id,y=document.createElement("div");y.innerHTML="<p>Are you sure you want to delete this compliance certificate? This cannot be undone.</p>",$e({title:"Delete Certificate",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Delete",className:"btn-danger",onClick:x=>{const T=n.filter(h=>h.id!==$);p.update("contractors",t.id,{complianceDocs:T}),t.complianceDocs=T,A("Certificate deleted","success"),x(),r()}}]})})}),b.querySelector("#btn-add-doc").addEventListener("click",()=>{Be({title:"Add Credential",content:`
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Certificate Type *</label>
            <select id="new-doc-type" class="form-select">
              <option value="Public Liability Insurance">Public Liability Insurance</option>
              <option value="Workers Compensation">Workers Compensation</option>
              <option value="Trade License">Trade License</option>
              <option value="White Card">White Card (Safety Induction)</option>
              <option value="Other Certification">Other Certification</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Policy / License Number *</label>
            <input type="text" id="new-doc-number" class="form-input" placeholder="e.g. PL-99201" required />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Expiry Date *</label>
            <input type="date" id="new-doc-expiry" class="form-input" required />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label">Notes</label>
            <textarea id="new-doc-notes" class="form-input" rows="3" placeholder="Additional coverage notes..."></textarea>
          </div>
        `,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Save Credential",className:"btn-primary",onClick:$=>{const y=document.querySelector(".drawer-overlay"),x=y.querySelector("#new-doc-type").value,T=y.querySelector("#new-doc-number").value.trim(),h=y.querySelector("#new-doc-expiry").value,k=y.querySelector("#new-doc-notes").value.trim();if(!T||!h){A("Please fill in all required fields","error");return}const w={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:x,number:T,expiryDate:h,verified:!1,notes:k},g=[...n,w];p.update("contractors",t.id,{complianceDocs:g}),t.complianceDocs=g,A("Credential added to registry","success"),$(),r()}}]})})}else if(o==="rates"){let w=function(){const g=parseFloat(y.value)||0,E=x.value==="standard"?n:m,C=T.checked?$:0,q=g*E+C;k.textContent=`$${q.toFixed(2)}`;const I=x.value==="standard"?`$${n.toFixed(2)}`:`$${m.toFixed(2)}`,_=T.checked?` + $${$.toFixed(2)}`:"";h.textContent=`${g} hrs × ${I}${_}`};var i=w;const n=t.hourlyRate||0,m=t.afterHoursRate||0,$=t.calloutFee||0;b.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <h4 style="margin:0">Contractor Pay Rates</h4>
            </div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom:8px">
                <div>
                  <strong>Standard Hourly Rate</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Applicable for normal business hours Mon–Fri</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${n.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom:8px">
                <div>
                  <strong>After Hours Hourly Rate</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Applicable for weekends, nights, and public holidays</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${m.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:4px">
                <div>
                  <strong>Call-out / Mobilisation Fee</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Flat fee applied per job dispatch</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${$.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h4 style="margin:0">Interactive Labor Cost Estimator</h4>
            </div>
            <div class="card-body">
              <div style="display:flex; flex-direction:column; gap:12px;">
                <p class="text-secondary" style="font-size:13px; margin:0 0 8px 0">Quickly estimate this contractor's billing for an upcoming work order allocation.</p>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px">Estimated Hours</label>
                  <input type="number" id="calc-hours" class="form-input" value="8" min="0" step="0.5" />
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:12px">Rate Type</label>
                  <select id="calc-rate-type" class="form-select">
                    <option value="standard">Standard Hourly ($${n.toFixed(2)})</option>
                    <option value="afterhours">After Hours ($${m.toFixed(2)})</option>
                  </select>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                  <input type="checkbox" id="calc-callout" checked />
                  <label for="calc-callout" class="form-label" style="margin:0; font-size:12px">Include Mobilisation Call-out Fee ($${$.toFixed(2)})</label>
                </div>

                <div style="background:var(--color-primary-light); color:var(--color-primary); padding: 15px; border-radius:6px; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:0.5px">Estimated Total Billing</strong>
                    <span style="font-size:13px; opacity:0.8" id="calc-formula">8 hrs × $${n.toFixed(2)} + $${$.toFixed(2)}</span>
                  </div>
                  <div class="font-bold" style="font-size:24px" id="calc-total">$${(8*n+$).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;const y=b.querySelector("#calc-hours"),x=b.querySelector("#calc-rate-type"),T=b.querySelector("#calc-callout"),h=b.querySelector("#calc-formula"),k=b.querySelector("#calc-total");y&&x&&T&&(y.addEventListener("input",w),y.addEventListener("change",w),x.addEventListener("change",w),T.addEventListener("change",w))}else o==="jobs"?b.innerHTML=`
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Job Allocations & Dispatch Log</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Title</th>
                  <th>Scheduled Date</th>
                  <th>Est. Hours</th>
                  <th>Job Status</th>
                  <th>Est. Subcontractor Bill</th>
                </tr>
              </thead>
              <tbody>
                ${a.map(n=>{const m=t.hourlyRate||0,$=t.calloutFee||0,y=(n.estimatedHours||0)*m+$,x={Completed:"badge-success",Invoiced:"badge-success","In Progress":"badge-primary",Scheduled:"badge-info",Pending:"badge-warning","On Hold":"badge-neutral"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/jobs/${n.id}'" title="Click to view Job Details">
                      <td class="font-medium cell-link">${f(n.number)}</td>
                      <td>${f(n.title)}</td>
                      <td>${n.scheduledDate?new Date(n.scheduledDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${n.estimatedHours||"—"} hrs</td>
                      <td><span class="badge ${x[n.status]||"badge-neutral"}">${f(n.status)}</span></td>
                      <td class="font-medium" style="color:var(--color-primary)">$${y.toFixed(2)}</td>
                    </tr>
                  `}).join("")}
                ${a.length===0?'<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No work orders currently dispatched to this subcontractor.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `:o==="tasks"&&(b.innerHTML=`
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Task Allocations & Subcontractor Deliverables</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Job Title</th>
                  <th>Task / Tasklist Name</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>Est. Hours</th>
                  <th>Status & Progress</th>
                </tr>
              </thead>
              <tbody>
                ${l.map(n=>{const m={Completed:"badge-success","In Progress":"badge-primary","Not Started":"badge-neutral"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/jobs/${n.jobId}'" title="Click to view Job Tasklist">
                      <td class="font-medium cell-link">${f(n.jobNumber)}</td>
                      <td>${f(n.jobTitle)}</td>
                      <td class="font-semibold">${f(n.taskName)}</td>
                      <td>
                        <span class="badge" style="${n.isList?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color); border:1px solid var(--border-color); color:var(--text-secondary)"}">
                          ${n.isList?"Tasklist":"Task"}
                        </span>
                      </td>
                      <td>${n.taskStartDate?new Date(n.taskStartDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${n.taskEstimatedHours||"—"} hrs</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="badge ${m[n.taskStatus]||"badge-neutral"}" style="margin:0">${f(n.taskStatus)}</span>
                          <div style="width:60px; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:inline-block" title="${n.taskProgress}% completed">
                            <div style="width:${n.taskProgress}%; background:var(--color-primary); height:100%"></div>
                          </div>
                          <span style="font-size:11px; font-weight:600; color:var(--text-secondary)">${n.taskProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  `}).join("")}
                ${l.length===0?'<tr><td colspan="7" style="text-align:center;padding:32px" class="text-secondary">No task-level allocations dispatched to this subcontractor.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `)}function v(b,i){return`
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${f(b)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${f(String(i))}</span>
      </div>
    `}r()}function xt(e){const s=p.getAll("suppliers"),t=Te("Suppliers","create"),a=Te("Suppliers","edit"),u=Te("Suppliers","delete");e.innerHTML=`
    <div class="page-header">
      <h1>Suppliers</h1>
      <div class="page-header-actions">
        ${t?'<button class="btn btn-primary" id="btn-new-supplier"><span class="material-icons-outlined">add</span> Add Supplier</button>':""}
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search suppliers by name, contact, category, or email..." id="suppliers-search" />
      </div>
    </div>

    <div id="suppliers-table-container"></div>
  `;let l=[...s];const c=[{key:"name",label:"Supplier Name",render:r=>`<span class="cell-link font-medium">${f(r.name)}</span>`},{key:"contactName",label:"Contact Person",render:r=>f(r.contactName||"—")},{key:"category",label:"Category",render:r=>`<span class="badge badge-neutral">${f(r.category||"General")}</span>`},{key:"email",label:"Email",render:r=>f(r.email||"—")},{key:"phone",label:"Phone",render:r=>f(r.phone||"—")},{key:"paymentTerms",label:"Payment Terms",render:r=>f(r.paymentTerms||"—")},{key:"active",label:"Status",render:r=>`<span class="badge ${r.active?"badge-success":"badge-neutral"}">${r.active?"Active":"Inactive"}</span>`}];a&&c.push({key:"actions",label:"",width:"80px",render:r=>`<button class="btn btn-ghost btn-sm supplier-edit-btn" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`});const o=He({columns:c,data:l,onRowClick:r=>R.navigate(`/suppliers/${r}`),emptyMessage:"No suppliers found",emptyIcon:"local_shipping",selectable:a||u,onSelectionChange:r=>{const d=[];a&&d.push({label:"Activate",icon:"check_circle",onClick:v=>{v.forEach(b=>p.update("suppliers",b,{active:!0})),o.clearSelection(),xt(e),ve(async()=>{const{showToast:b}=await Promise.resolve().then(()=>De);return{showToast:b}},void 0).then(({showToast:b})=>b(`Activated ${v.length} suppliers`,"success"))}},{label:"Deactivate",icon:"block",onClick:v=>{v.forEach(b=>p.update("suppliers",b,{active:!1})),o.clearSelection(),xt(e),ve(async()=>{const{showToast:b}=await Promise.resolve().then(()=>De);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deactivated ${v.length} suppliers`,"warning"))}}),u&&d.push({label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:v=>{ve(async()=>{const{showModal:b}=await Promise.resolve().then(()=>ze);return{showModal:b}},void 0).then(({showModal:b})=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete ${v.length} suppliers? This action cannot be undone.</p>`,b({title:"Confirm Bulk Delete",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{v.forEach(m=>p.delete("suppliers",m)),o.clearSelection(),xt(e),ve(async()=>{const{showToast:m}=await Promise.resolve().then(()=>De);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${v.length} suppliers`,"success")),n()}}]})})}}),Je({container:e,selectedIds:r,onClear:()=>o.clearSelection(),actions:d})}});e.querySelector("#suppliers-table-container").appendChild(o),t&&e.querySelector("#btn-new-supplier").addEventListener("click",()=>R.navigate("/suppliers/new")),e.querySelector("#suppliers-search").addEventListener("input",r=>{const d=r.target.value.toLowerCase();l=s.filter(v=>v.name.toLowerCase().includes(d)||(v.contactName||"").toLowerCase().includes(d)||(v.category||"").toLowerCase().includes(d)||(v.email||"").toLowerCase().includes(d)),o.updateData(l)}),a&&e.addEventListener("click",r=>{const d=r.target.closest(".supplier-edit-btn");d&&(r.stopPropagation(),R.navigate(`/suppliers/${d.dataset.id}/edit`))})}function gs(e,s){const t=s.id==="new";let a=t?{active:!0,category:"General",paymentTerms:"30 Days",attachments:[]}:p.getById("suppliers",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>';return}const u=["Electrical","Plumbing","HVAC","Fire Safety","Security","General"],l=["COD","7 Days","14 Days","30 Days"];e.innerHTML=`
    <div class="page-header">
      <h1>${t?"New Supplier Profile":"Edit Supplier Profile"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save Supplier</button>
      </div>
    </div>

    <div class="card" style="max-width: 700px; margin-bottom: var(--space-xl);">
      <div class="card-body">
        <form id="supplier-form" style="display: flex; flex-direction: column; gap: 18px;">
          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px;">Primary Contact Details</h4>
          
          <div class="form-group">
            <label class="form-label">Business Name *</label>
            <input type="text" id="name" class="form-input" value="${a.name||""}" placeholder="e.g. ElectraTrade" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Primary Contact Person</label>
            <input type="text" id="contactName" class="form-input" value="${a.contactName||""}" placeholder="e.g. Robert Vance" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" value="${a.email||""}" placeholder="e.g. sales@electratrade.com.au" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="phone" class="form-input" value="${a.phone||""}" placeholder="e.g. 03 9822 1045" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Physical Address</label>
            <input type="text" id="address" class="form-input" value="${a.address||""}" placeholder="e.g. 22 Industrial Parkway, South Melbourne, VIC 3205" />
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Classification & Terms</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier Category</label>
              <select id="category" class="form-input">
                ${u.map(c=>`<option value="${c}" ${a.category===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="paymentTerms" class="form-input">
                ${l.map(c=>`<option value="${c}" ${a.paymentTerms===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Account Number</label>
              <input type="text" id="accountNumber" class="form-input" value="${a.accountNumber||""}" placeholder="e.g. FF-ET-10291" />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Internal Notes</h4>

          <div class="form-group">
            <textarea id="notes" class="form-input" rows="3" placeholder="Enter comments or special notes about this supplier...">${a.notes||""}</textarea>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
            <input type="checkbox" id="active" ${a.active?"checked":""} style="width:16px; height:16px; cursor:pointer;" />
            <label for="active" style="margin: 0; cursor:pointer; font-weight:600;" class="form-label">Active (Visible in stock & purchase orders)</label>
          </div>
        </form>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{R.navigate(t?"/suppliers":`/suppliers/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const c=e.querySelector("#name").value.trim(),o=e.querySelector("#contactName").value.trim(),r=e.querySelector("#email").value.trim(),d=e.querySelector("#phone").value.trim(),v=e.querySelector("#address").value.trim(),b=e.querySelector("#category").value,i=e.querySelector("#paymentTerms").value,n=e.querySelector("#accountNumber").value.trim(),m=e.querySelector("#notes").value.trim(),$=e.querySelector("#active").checked;if(!c){A("Supplier Name is a required field.","warning");return}const y={...a,name:c,contactName:o,email:r,phone:d,address:v,category:b,paymentTerms:i,accountNumber:n,notes:m,active:$};if(t){const x=p.create("suppliers",y);A("Supplier profile created successfully","success"),R.navigate(`/suppliers/${x.id}`)}else p.update("suppliers",s.id,y),A("Supplier profile updated successfully","success"),R.navigate(`/suppliers/${s.id}`)})}function Ma(e,s){const t=p.getById("suppliers",s.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>';return}Ge(t.name);const a=Te("Suppliers","edit"),u=Te("Suppliers","delete"),l=p.getAll("stock").filter(b=>b.supplier===t.name),c=p.getAll("purchaseOrders").filter(b=>b.supplierName===t.name);let o="overview";function r(){e.innerHTML=`
      ${Ke({title:f(t.name),icon:"local_shipping",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">label</span> ${f(t.category||"General")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">payment</span> Terms: ${f(t.paymentTerms||"30 Days")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">credit_card</span> Account: ${f(t.accountNumber||"—")}</span>
          <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span>
        `,actionsHtml:`
          ${a?`
            <button class="btn btn-secondary" id="btn-edit-supplier">
              <span class="material-icons-outlined">edit</span> Edit
            </button>
          `:""}
          ${u?`
            <button class="btn btn-danger" id="btn-delete-supplier">
              <span class="material-icons-outlined">delete</span> Delete
            </button>
          `:""}
        `})}

      <div class="tabs" id="supplier-tabs">
        <button class="tab ${o==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${o==="catalogues"?"active":""}" data-tab="catalogues">Catalogues & Docs (${(t.attachments||[]).length})</button>
        <button class="tab ${o==="stock"?"active":""}" data-tab="stock">Stock Items (${l.length})</button>
        <button class="tab ${o==="pos"?"active":""}" data-tab="pos">Purchase Orders (${c.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `,d(),e.querySelectorAll(".tab").forEach(b=>{b.addEventListener("click",()=>{o=b.dataset.tab,e.querySelectorAll(".tab").forEach(i=>i.classList.remove("active")),b.classList.add("active"),d()})}),a&&e.querySelector("#btn-edit-supplier").addEventListener("click",()=>{R.navigate(`/suppliers/${t.id}/edit`)}),u&&e.querySelector("#btn-delete-supplier").addEventListener("click",()=>{const b=document.createElement("div");b.innerHTML=`<p>Are you sure you want to delete supplier <strong>${f(t.name)}</strong>? This action cannot be undone.</p>`,$e({title:"Delete Supplier",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{p.delete("suppliers",t.id),A("Supplier deleted successfully","success"),i(),R.navigate("/suppliers")}}]})})}function d(){const b=e.querySelector("#tab-content");if(b)if(o==="overview")b.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Supplier & Financial Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${v("Supplier Name",t.name)}
                  ${v("Contact Name",t.contactName||"Not set")}
                  ${v("Email Address",t.email||"Not set")}
                  ${v("Phone Number",t.phone||"Not set")}
                  ${v("Physical Address",t.address||"Not set")}
                  ${v("Account Number",t.accountNumber||"Not set")}
                  ${v("Payment Terms",t.paymentTerms||"30 Days")}
                  ${v("System Status",t.active?"Active (Available for stock & POs)":"Inactive")}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Internal Operations Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 16px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${f(t.notes||"No notes recorded for this supplier.")}</div>
              </div>
            </div>
          </div>
        </div>
      `;else if(o==="catalogues"){const i=t.attachments||[];if(b.innerHTML=`
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 20px;">
            <h4 style="margin:0">Catalogues & Documents Registry</h4>
            ${a?`
              <div style="position:relative">
                <input type="file" id="catalogue-file-input" style="display:none" />
                <button class="btn btn-primary btn-sm" id="btn-upload-file">
                  <span class="material-icons-outlined">upload_file</span> Upload Document
                </button>
              </div>
            `:""}
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>File Type</th>
                  <th>File Size</th>
                  <th>Uploaded Date</th>
                  <th style="width:180px; text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${i.map(n=>{const m=(n.size/1048576).toFixed(2),$=n.type==="application/pdf"||n.type&&n.type.startsWith("image/")||n.name.toLowerCase().endsWith(".pdf");return`
                    <tr>
                      <td class="font-medium">${f(n.name)}</td>
                      <td class="text-secondary" style="font-size:12px">${f(n.type||"Unknown")}</td>
                      <td>${m} MB</td>
                      <td>${n.uploadedAt?new Date(n.uploadedAt).toLocaleDateString("en-AU"):"—"}</td>
                      <td style="text-align:right">
                        <div style="display:inline-flex; gap:6px;">
                          ${$?`
                            <button class="btn btn-ghost btn-sm btn-preview-doc" data-id="${n.id}" title="Preview Document">
                              <span class="material-icons-outlined" style="font-size:18px">visibility</span>
                            </button>
                          `:""}
                          <a href="${n.url}" download="${f(n.name)}" class="btn btn-ghost btn-sm" title="Download File" style="display:inline-flex; align-items:center; justify-content:center; text-decoration:none; color:inherit;">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </a>
                          ${a?`
                            <button class="btn btn-ghost btn-sm btn-delete-doc text-danger" data-id="${n.id}" title="Delete Document">
                              <span class="material-icons-outlined" style="font-size:18px">delete</span>
                            </button>
                          `:""}
                        </div>
                      </td>
                    </tr>
                  `}).join("")}
                ${i.length===0?'<tr><td colspan="5" style="text-align:center;padding:32px" class="text-secondary">No catalogues, spec sheets, or price documents uploaded.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `,a){const n=b.querySelector("#catalogue-file-input"),m=b.querySelector("#btn-upload-file");m&&n&&(m.addEventListener("click",()=>n.click()),n.addEventListener("change",$=>{const y=$.target.files[0];if(!y)return;if(y.size>8*1024*1024){A("File is too large. Maximum size is 8MB.","error");return}const x=new FileReader;x.onload=function(T){const h={id:"att_sup_"+Date.now().toString(36)+Math.random().toString(36).substr(2,4),name:y.name,type:y.type,size:y.size,uploadedAt:new Date().toISOString(),url:T.target.result},k=[...t.attachments||[],h];p.update("suppliers",t.id,{attachments:k}),t.attachments=k,A("Document uploaded successfully","success"),r()},x.readAsDataURL(y)})),b.querySelectorAll(".btn-delete-doc").forEach($=>{$.addEventListener("click",()=>{const y=$.dataset.id,x=document.createElement("div");x.innerHTML="<p>Are you sure you want to delete this catalogue/document? This action cannot be undone.</p>",$e({title:"Confirm Delete Document",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Delete",className:"btn-danger",onClick:T=>{const h=(t.attachments||[]).filter(k=>k.id!==y);p.update("suppliers",t.id,{attachments:h}),t.attachments=h,A("Document deleted successfully","success"),T(),r()}}]})})})}b.querySelectorAll(".btn-preview-doc").forEach(n=>{n.addEventListener("click",()=>{const m=n.dataset.id,$=(t.attachments||[]).find(y=>y.id===m);$&&(localStorage.setItem("currentDocumentView",JSON.stringify({name:$.name,type:$.type,url:$.url})),window.open("#/document/view","_blank"))})})}else o==="stock"?b.innerHTML=`
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Catalogued Stock Supplied</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Default Unit Cost</th>
                  <th>Total Stock Level</th>
                </tr>
              </thead>
              <tbody>
                ${l.map(i=>`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/stock/${i.id}'" title="Click to view Stock Details">
                      <td class="font-medium cell-link">${f(i.name)}</td>
                      <td style="font-family:monospace">${f(i.sku||"—")}</td>
                      <td><span class="badge badge-neutral">${f(i.category||"General")}</span></td>
                      <td class="font-semibold" style="color:var(--color-primary)">$${(i.costPrice!==void 0?i.costPrice:0).toFixed(2)}</td>
                      <td>
                        <strong style="color: ${i.quantity<=(i.reorderLevel||0)?"var(--color-danger)":"inherit"}">
                          ${i.quantity||0} units
                        </strong>
                        ${i.quantity<=(i.reorderLevel||0)?'<span style="font-size:10px; color:var(--color-danger); font-weight:600; display:block">REORDER LEVEL REACHED</span>':""}
                      </td>
                    </tr>
                  `).join("")}
                ${l.length===0?'<tr><td colspan="5" style="text-align:center;padding:32px" class="text-secondary">No inventory parts catalogued under this supplier.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `:o==="pos"&&(b.innerHTML=`
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0">Purchase Orders Issued</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Order Date</th>
                  <th>Authorized By</th>
                  <th>Warehouse / Location</th>
                  <th>PO Status</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${c.map(i=>{const n=(i.items||[]).reduce(($,y)=>$+(parseFloat(y.quantity)||0)*(parseFloat(y.unitCost)||0),0),m={Draft:"badge-neutral","Pending Approval":"badge-warning","Approved / Sent":"badge-primary",Received:"badge-success",Cancelled:"badge-danger"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/purchase-orders/${i.id}'" title="Click to view Purchase Order">
                      <td class="font-medium cell-link">${f(i.number)}</td>
                      <td>${i.orderDate?new Date(i.orderDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${f(i.creatorName||"—")}</td>
                      <td>${f(i.warehouseName||"Main Warehouse")}</td>
                      <td><span class="badge ${m[i.status]||"badge-neutral"}">${f(i.status)}</span></td>
                      <td class="font-medium" style="color:var(--color-primary)">$${n.toFixed(2)}</td>
                    </tr>
                  `}).join("")}
                ${c.length===0?'<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No purchase orders raised for this supplier yet.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `)}function v(b,i){return`
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${f(b)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${f(String(i))}</span>
      </div>
    `}r()}function $t(e){let s=p.getAll("assets");const t=p.getAll("fleet");s.length===0&&t.length>0&&(t.forEach(c=>{c.ownerType="Business",c.identifier=c.licensePlate,p.create("assets",c)}),s=p.getAll("assets")),e.innerHTML=`
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
  `;let a=[...s];const l=He({columns:[{key:"name",label:"Name / ID",render:c=>`<span class="cell-link font-medium">${f(c.name)}</span>`},{key:"owner",label:"Owner Type",render:c=>{if(c.ownerType==="Customer"&&c.customerId){const o=p.getById("customers",c.customerId);return o?`<span class="badge badge-neutral">${f(o.company)}</span>`:"Customer"}return'<span class="badge badge-primary">My Business</span>'}},{key:"type",label:"Category",render:c=>f(c.type||"—")},{key:"service",label:"Service Status",render:c=>{const r=(c.logs||[]).filter(b=>b.type==="Service").sort((b,i)=>new Date(i.date)-new Date(b.date))[0];if(!r||!c.serviceIntervalMonths)return'<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';const d=new Date(r.date);d.setMonth(d.getMonth()+parseInt(c.serviceIntervalMonths));const v=d<new Date;return`<span style="color:${v?"var(--color-danger)":"var(--text-secondary)"}; font-size:12px; font-weight:${v?"600":"400"}">
          ${v?"OVERDUE":d.toLocaleDateString()}
        </span>`}},{key:"status",label:"Status",render:c=>`<span class="badge ${c.status==="Active"?"badge-success":c.status==="In Maintenance"?"badge-warning":"badge-neutral"}">${f(c.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:c=>{if(!c.assignedToId)return"—";const o=p.getById("technicians",c.assignedToId);return o?f(o.name):"—"}},{key:"actions",label:"",width:"80px",render:c=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${c.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:a,onRowClick:c=>R.navigate(`/assets/${c}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:c=>{Je({container:e,selectedIds:c,onClear:()=>l.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:o=>{const r=document.createElement("div");r.innerHTML=`
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
              `,ve(async()=>{const{showModal:d}=await Promise.resolve().then(()=>ze);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${o.length} Assets`,content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Apply",className:"btn-primary",onClick:v=>{const b=r.querySelector("#bulk-status").value;o.forEach(i=>p.update("assets",i,{status:b})),l.clearSelection(),$t(e),ve(async()=>{const{showToast:i}=await Promise.resolve().then(()=>De);return{showToast:i}},void 0).then(({showToast:i})=>i(`Updated ${o.length} assets to ${b}`,"success")),v()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:o=>{ve(async()=>{const{showToast:r}=await Promise.resolve().then(()=>De);return{showToast:r}},void 0).then(({showToast:r})=>r(`Generating tags for ${o.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:o=>{ve(async()=>{const{showModal:r}=await Promise.resolve().then(()=>ze);return{showModal:r}},void 0).then(({showModal:r})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${o.length} assets? This action cannot be undone.</p>`,r({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Delete",className:"btn-danger",onClick:v=>{o.forEach(b=>p.delete("assets",b)),l.clearSelection(),$t(e),ve(async()=>{const{showToast:b}=await Promise.resolve().then(()=>De);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deleted ${o.length} assets`,"success")),v()}}]})})}}]})}});e.querySelector("#asset-table-container").appendChild(l),e.querySelector("#btn-new-asset").addEventListener("click",()=>{is({onSave:()=>$t(e)})}),e.querySelector("#asset-search").addEventListener("input",c=>{const o=c.target.value.toLowerCase();a=s.filter(r=>r.name.toLowerCase().includes(o)||(r.serial||r.identifier||r.licensePlate||"").toLowerCase().includes(o)||(r.type||"").toLowerCase().includes(o)),l.updateData(a)}),e.addEventListener("click",c=>{const o=c.target.closest(".asset-edit-btn");o&&(c.stopPropagation(),R.navigate(`/assets/${o.dataset.id}/edit`))})}function hs(e,s){const t=s.id==="new";let a=t?{status:"Active",ownerType:"Business",type:"Plant & Equipment",serviceIntervalMonths:6,currentMeter:0,recoveryRate:0}:p.getById("assets",s.id);if(!a&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const u=p.getAll("people").filter(n=>n.type==="Staff"),l=p.getAll("customers");let c=[];if(a.customerId){const n=p.getById("customers",a.customerId);n&&n.sites&&(c=n.sites)}e.innerHTML=`
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
                ${l.map(n=>`<option value="${n.id}" ${a.customerId===n.id?"selected":""}>${n.company||n.firstName+" "+n.lastName}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type / Category</label>
              <select id="type" class="form-select">
                ${["Vehicle","Plant & Equipment","Specialized Tool","Fixed Asset (HVAC/Solar/Fire)","Other"].map(n=>`<option value="${n}" ${a.type===n?"selected":""}>${n}</option>`).join("")}
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
                 ${u.map(n=>`<option value="${n.id}" ${a.assignedToId===n.id?"selected":""}>${n.firstName} ${n.lastName}</option>`).join("")}
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
                ${c.map(n=>`<option value="${n.name}" ${a.site===n.name?"selected":""}>${n.name}</option>`).join("")}
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
              ${["Active","In Maintenance","Commissioning","Decommissioned","Lost/Stolen"].map(n=>`<option value="${n}" ${a.status===n?"selected":""}>${n}</option>`).join("")}
            </select>
          </div>
        </form>
      </div>
    </div>
  `;const o=e.querySelector("#ownerType"),r=e.querySelector("#customer-select-group"),d=e.querySelector("#customerId"),v=e.querySelector("#site"),b=e.querySelector("#business-fields");o.addEventListener("change",n=>{const m=n.target.value==="Customer";r.style.display=m?"block":"none",b.style.display=m?"none":"flex",v.disabled=!m,m?i(d.value):v.innerHTML='<option value="">-- No specific site --</option>'}),d.addEventListener("change",n=>{i(n.target.value)});function i(n){if(!n){v.innerHTML='<option value="">-- No specific site --</option>';return}const m=p.getById("customers",n);if(!m||!m.sites||m.sites.length===0){v.innerHTML='<option value="">-- No specific site --</option>';return}v.innerHTML='<option value="">-- No specific site --</option>'+m.sites.map($=>`<option value="${$.name}" ${a.site===$.name?"selected":""}>${$.name}</option>`).join("")}e.querySelector("#btn-cancel").addEventListener("click",()=>{R.navigate(t?"/assets":`/assets/${s.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{var m;const n={name:e.querySelector("#name").value,description:e.querySelector("#description").value,serial:e.querySelector("#serial").value,identifier:e.querySelector("#serial").value,type:e.querySelector("#type").value,status:e.querySelector("#status").value,assignedToId:e.querySelector("#assignedToId").value,ownerType:e.querySelector("#ownerType").value,customerId:e.querySelector("#ownerType").value==="Customer"?e.querySelector("#customerId").value:null,site:e.querySelector("#site").value,installDate:e.querySelector("#installDate").value,recoveryRate:parseFloat(((m=e.querySelector("#recoveryRate"))==null?void 0:m.value)||0),serviceIntervalMonths:parseInt(e.querySelector("#serviceIntervalMonths").value||6),currentMeter:parseFloat(e.querySelector("#currentMeter").value||0),meterUnit:e.querySelector("#meterUnit").value};if(!n.name){alert("Asset Name is required.");return}t?(n.logs=[],p.create("assets",n)):p.update("assets",s.id,n),R.navigate("/assets")})}function xs(e,s){const t=p.getById("assets",s.id);if(!t){e.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}p.getSettings();let a="Unassigned";if(t.assignedToId){const i=p.getById("technicians",t.assignedToId);i&&(a=i.name)}let u="My Business",l="Internal Asset";if(t.ownerType==="Customer"&&t.customerId){const i=p.getById("customers",t.customerId);i&&(u=i.company),l="Customer Asset"}const c=t.logs||[],o=c.reduce((i,n)=>i+(parseFloat(n.cost)||0),0),r=c.filter(i=>i.type==="Service").sort((i,n)=>new Date(n.date)-new Date(i.date))[0];let d="Not Scheduled",v=!1;if(r&&t.serviceIntervalMonths){const i=new Date(r.date);i.setMonth(i.getMonth()+parseInt(t.serviceIntervalMonths)),d=i.toLocaleDateString(),v=i<new Date}e.innerHTML=`
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
          <span class="material-icons-outlined" style="color:var(--color-primary)">${t.type==="Vehicle"?"directions_car":"precision_manufacturing"}</span>
        </div>
        <div>
          <h1 style="margin: 0;">${f(t.name)}</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
            <span class="badge ${t.ownerType==="Business"?"badge-primary":"badge-neutral"}">${l}</span>
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
          <div style="font-weight:600; font-size:16px; color:${v?"var(--color-danger)":"inherit"}">
            ${d}
            ${v?'<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">OVERDUE</span>':""}
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
                <span class="font-medium">${f(t.type||"-")}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Owner</span>
                <span class="font-medium">${f(u)}</span>
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
              ${c.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>':c.sort((i,n)=>new Date(n.date)-new Date(i.date)).map(i=>`
                  <tr>
                    <td class="font-medium">${new Date(i.date).toLocaleDateString()}</td>
                    <td class="text-secondary">${i.meter||"-"}</td>
                    <td>
                      <span class="badge ${i.type==="Service"?"badge-success":i.type==="Repair"?"badge-danger":"badge-neutral"}">
                        ${f(i.type)}
                      </span>
                    </td>
                    <td><span class="text-secondary" style="font-size:13px">${f(i.notes||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${i.cost>0?`$${parseFloat(i.cost).toFixed(2)}`:"—"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{R.navigate(`/assets/${s.id}/edit`)}),e.querySelector("#btn-add-log").addEventListener("click",()=>{b()});function b(){const i=document.createElement("div");i.innerHTML=`
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
    `,ve(async()=>{const{showModal:n}=await Promise.resolve().then(()=>ze);return{showModal:n}},void 0).then(({showModal:n})=>{n({title:"Add Activity Log",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Save Log",className:"btn-primary",onClick:m=>{const $=i.querySelector("#log-date").value,y=i.querySelector("#log-type").value,x=parseFloat(i.querySelector("#log-meter").value),T=parseFloat(i.querySelector("#log-cost").value),h=i.querySelector("#log-notes").value;if(!$)return;const k={date:$,type:y,meter:x,cost:T,notes:h},w=[...t.logs||[],k];p.update("assets",t.id,{logs:w,currentMeter:x,status:y==="Repair"?"In Maintenance":t.status}),m(),xs(e,s)}}]})})}}function _a(e){let s="All Documents";const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),a=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];function u(){if(t.role==="admin"||t.role==="manager")return a;const c=["All Documents","Health & Safety","Job Attachments","Customer Attachments","Digital Forms","Purchase Orders"],o=t.userTypeId?p.getById("userTypes",t.userTypeId):null;if(o&&o.permissions){const r=o.permissions.find(v=>v.module==="Quotes"),d=o.permissions.find(v=>v.module==="Invoices");r&&r.view&&c.push("Quotes"),d&&d.view&&c.push("Invoices")}return a.filter(r=>c.includes(r))}function l(){const c=u();c.includes(s)||(s="All Documents");const o=[];p.getAll("documents").forEach(y=>{o.push({id:y.id,name:y.name,url:y.url,type:y.type,size:y.size,uploadedAt:y.uploadedAt,folder:y.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),p.getAll("jobs").forEach(y=>{y.attachments&&Array.isArray(y.attachments)&&y.attachments.forEach(x=>{o.push({id:x.id||Math.random().toString(36).substr(2,9),name:x.name,url:x.url||x.data||"#",type:x.type,size:x.size,uploadedAt:x.uploadedAt||x.date||y.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:y.id,entityName:`${y.number} - ${y.title}`})}),y.activityLog&&Array.isArray(y.activityLog)&&y.activityLog.forEach(x=>{x.type==="attachment"&&x.file&&o.push({id:x.id,name:x.file.name,url:x.file.url||x.file.data||"#",type:x.file.type,size:x.file.size,uploadedAt:x.date,folder:"Job Attachments",entityType:"Job",entityId:y.id,entityName:`${y.number} - ${y.title}`}),x.type==="combined"&&Array.isArray(x.files)&&x.files.forEach((T,h)=>{o.push({id:`${x.id}_${h}`,name:T.name,url:T.url||T.data||"#",type:T.type,size:T.size,uploadedAt:x.date,folder:"Job Attachments",entityType:"Job",entityId:y.id,entityName:`${y.number} - ${y.title}`})})}),y.forms&&Array.isArray(y.forms)&&y.forms.forEach((x,T)=>{o.push({id:`form_${y.id}_${T}`,name:`${x.type} - ${new Date(x.date).toLocaleDateString()}`,url:`#/jobs/${y.id}`,type:"Digital Form",size:null,uploadedAt:x.date,folder:"Digital Forms",entityType:"Job",entityId:y.id,entityName:`${y.number} - ${y.title}`})})}),p.getAll("customers").forEach(y=>{y.attachments&&Array.isArray(y.attachments)&&y.attachments.forEach(x=>{o.push({id:x.id||Math.random().toString(36).substr(2,9),name:x.name,url:x.url||x.data||"#",type:x.type,size:x.size,uploadedAt:x.uploadedAt||y.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:y.id,entityName:y.company})})}),p.getAll("invoices").forEach(y=>{o.push({id:y.id,name:`Invoice ${y.number}.pdf`,url:`#/invoices/${y.id}`,type:"Invoice PDF",size:null,uploadedAt:y.issueDate,folder:"Invoices",entityType:"Invoice",entityId:y.id,entityName:`Inv ${y.number} - ${y.customerName}`})}),p.getAll("quotes").forEach(y=>{o.push({id:y.id,name:`Quote ${y.number}.pdf`,url:`#/quotes/${y.id}`,type:"Quote PDF",size:null,uploadedAt:y.createdAt,folder:"Quotes",entityType:"Quote",entityId:y.id,entityName:`Quote ${y.number} - ${y.customerName}`})}),p.getAll("purchaseOrders").forEach(y=>{o.push({id:y.id,name:`PO ${y.number}.pdf`,url:`#/purchase-orders/${y.id}`,type:"PO PDF",size:null,uploadedAt:y.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:y.id,entityName:`PO ${y.number} - ${y.supplierName}`})}),p.getAll("taskTemplates").forEach(y=>{o.push({id:`task_tmpl_${y.id}`,name:`${y.name} (Tasklist Template)`,url:"#/settings",type:"Tasklist Template",size:null,uploadedAt:y.createdAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:y.id,entityName:"Settings / Tasklist Templates"})}),p.getAll("formTemplates").forEach(y=>{o.push({id:`form_tmpl_${y.id}`,name:`${y.name} (Compliance Form Template)`,url:"#/settings",type:"Form Template",size:null,uploadedAt:y.createdAt||y.updatedAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:y.id,entityName:"Settings / Compliance Forms"})});const r=o.filter(y=>c.includes(y.folder));r.sort((y,x)=>new Date(x.uploadedAt)-new Date(y.uploadedAt));let d=r;s!=="All Documents"&&(d=r.filter(y=>y.folder===s));const v=c;e.innerHTML=`
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
              ${v.map(y=>{let x="folder";y==="All Documents"?x="dashboard":y==="Company Docs"?x="domain":y==="Health & Safety"?x="health_and_safety":y==="Templates"?x="file_copy":y==="Job Attachments"?x="build":y==="Customer Attachments"?x="people":y==="Digital Forms"?x="assignment":y==="Invoices"?x="receipt_long":y==="Quotes"?x="request_quote":y==="Purchase Orders"&&(x="shopping_cart");const T=s===y,h=y==="All Documents"?r.length:r.filter(k=>k.folder===y).length;return`
                <li>
                  <button class="btn btn-ghost ${T?"active":""}" data-folder="${y}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${T?"var(--color-primary-bg)":"transparent"}; color:${T?"var(--primary-color)":"var(--text-primary)"}; font-weight:${T?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${x}</span> ${y}
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
    `,e.querySelectorAll("#folder-list button").forEach(y=>{y.addEventListener("click",()=>{s=y.dataset.folder,l()})});let b=[...d];const n=He({columns:[{key:"name",label:"File Name",render:y=>{let x="insert_drive_file";return y.type==="Invoice PDF"||y.type==="Quote PDF"||y.type==="PO PDF"?x="picture_as_pdf":y.type==="Digital Form"?x="assignment":y.type&&y.type.includes("image")&&(x="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${x}</span> <span class="font-medium truncate" style="max-width:300px" title="${f(y.name)}">${f(y.name)}</span></div>`}},{key:"folder",label:"Category",render:y=>f(y.folder||"—")},{key:"size",label:"Size",render:y=>y.size?(y.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:y=>{if(y.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let x="#";return y.entityType==="Job"?x=`#/jobs/${y.entityId}`:y.entityType==="Customer"?x=`#/people/${y.entityId}`:y.entityType==="Invoice"?x=`#/invoices/${y.entityId}`:y.entityType==="Quote"?x=`#/quotes/${y.entityId}`:y.entityType==="PO"&&(x=`#/purchase-orders/${y.entityId}`),`<span class="badge badge-neutral">${y.entityType}</span> <a href="${x}">${f(y.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:y=>y.uploadedAt?new Date(y.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:y=>y.url&&y.url.startsWith("#/")?`<a href="${f(y.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`:`<a href="#/document/view" target="_blank" class="btn btn-sm btn-outline btn-view-doc" data-doc-id="${f(y.id)}" style="text-decoration:none">View</a>`}],data:b,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:y=>{Je({container:e.querySelector(".main-wrapper")||e,selectedIds:y,onClear:()=>n.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:x=>{const T=v.filter(k=>k!=="All Documents"),h=document.createElement("div");h.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${T.map(k=>`<option value="${k}">${k}</option>`).join("")}
                    </select>
                  </div>
                `,$e({title:`Move ${x.length} Documents`,content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Move",className:"btn-primary",onClick:k=>{const w=h.querySelector("#bulk-folder").value;x.forEach(g=>{p.getById("documents",g)&&p.update("documents",g,{folder:w})}),n.clearSelection(),l(),A(`Moved ${x.length} documents to ${w}`,"success"),k()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:x=>{$e({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${x.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Delete",className:"btn-danger",onClick:T=>{x.forEach(h=>p.delete("documents",h)),n.clearSelection(),l(),A(`Deleted ${x.length} documents`,"success"),T()}}]})}}]})}});e.querySelector("#docs-table-container").appendChild(n);const m=e.querySelector("#docs-search");function $(){const y=m.value.toLowerCase();b=d.filter(x=>x.name.toLowerCase().includes(y)||x.entityName&&x.entityName.toLowerCase().includes(y)||x.folder&&x.folder.toLowerCase().includes(y)),n.updateData(b)}m.addEventListener("input",$),e.querySelector("#docs-table-container").addEventListener("click",y=>{const x=y.target.closest(".btn-view-doc");if(x){const T=x.dataset.docId,h=d.find(k=>k.id===T);h&&localStorage.setItem("currentDocumentView",JSON.stringify({name:h.name,url:h.url,type:h.type}))}}),e.querySelector("#btn-upload-doc").addEventListener("click",()=>{const y=v.filter(T=>T!=="All Documents"),x=document.createElement("div");x.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${y.map(T=>`<option value="${T}">${T}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,$e({title:"Upload Global Document",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Upload",className:"btn-primary",onClick:T=>{const h=document.getElementById("upload-file-input"),k=document.getElementById("upload-folder").value;if(!h.files.length){A("Please select a file","error");return}const w=h.files[0],g=new FileReader;g.onload=E=>{p.create("documents",{name:w.name,type:w.type||"unknown",size:w.size,url:E.target.result,folder:k,uploadedAt:new Date().toISOString()}),A("Document uploaded successfully","success"),l(),T()},g.readAsDataURL(w)}}]})})}l()}function za(e){let s=null;try{const l=localStorage.getItem("currentDocumentView");l&&(s=JSON.parse(l))}catch(l){console.error("Failed to parse document data:",l)}if(!s||!s.url){e.innerHTML=`
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
  `,setTimeout(()=>{const l=document.querySelector(".sidebar"),c=document.querySelector(".topbar"),o=document.getElementById("breadcrumb"),r=document.getElementById("main-content");l&&(l.style.display="none"),c&&(c.style.display="none"),o&&(o.style.display="none"),r&&(r.style.padding="0",r.style.height="100vh",r.style.overflow="hidden")},0);const u=()=>{const l=document.querySelector(".sidebar"),c=document.querySelector(".topbar"),o=document.getElementById("breadcrumb"),r=document.getElementById("main-content");l&&(l.style.display=""),c&&(c.style.display=""),o&&(o.style.display=""),r&&(r.style.padding="",r.style.height="",r.style.overflow=""),window.removeEventListener("hashchange",u)};window.addEventListener("hashchange",u)}zs();window.__fieldForge={router:R,store:p};const $s=document.getElementById("app"),ja=Xt(),vt=document.createElement("div");vt.className="main-wrapper";const Fa=es(),jt=document.createElement("div");jt.className="breadcrumb";jt.id="breadcrumb";const it=document.createElement("main");it.className="main-content";it.id="main-content";vt.appendChild(Fa);vt.appendChild(jt);vt.appendChild(it);$s.appendChild(ja);$s.appendChild(vt);function ye(e){return s=>{it.innerHTML="",it.scrollTop=0,e(it,s)}}R.register("/login",ye(Aa));R.register("/portal",ye(_t));R.register("/",ye(Qs));R.register("/people",ye(At));R.register("/people/new",ye((e,s)=>ns(e,{id:"new"})));R.register("/people/:id",ye(ra));R.register("/people/:id/edit",ye((e,s)=>ns(e,s)));R.register("/contractors",ye(ht));R.register("/contractors/new",ye((e,s)=>fs(e,{id:"new"})));R.register("/contractors/:id",ye(Pa));R.register("/contractors/:id/edit",ye((e,s)=>fs(e,s)));R.register("/suppliers",ye(xt));R.register("/suppliers/new",ye((e,s)=>gs(e,{id:"new"})));R.register("/suppliers/:id",ye(Ma));R.register("/suppliers/:id/edit",ye((e,s)=>gs(e,s)));R.register("/leads",ye(Nt));R.register("/leads/new",ye((e,s)=>ls(e,{id:"new"})));R.register("/leads/:id",ye(da));R.register("/leads/:id/edit",ye((e,s)=>ls(e,s)));R.register("/notifications",ye(rs));R.register("/quotes",ye(Pt));R.register("/quotes/new",ye((e,s)=>Et(e,{id:"new"})));R.register("/quotes/:id",ye(Et));R.register("/jobs",ye(Mt));R.register("/jobs/new",ye((e,s)=>cs(e,{id:"new"})));R.register("/jobs/:id",ye(ma));R.register("/jobs/:id/edit",ye((e,s)=>cs(e,s)));R.register("/timesheets",ye(va));R.register("/assets",ye($t));R.register("/assets/new",ye((e,s)=>hs(e,{id:"new"})));R.register("/assets/:id",ye(xs));R.register("/assets/:id/edit",ye((e,s)=>hs(e,s)));R.register("/schedule",ye(ga));R.register("/stock",ye(st));R.register("/stock/new",ye((e,s)=>ps(e,{id:"new"})));R.register("/stock/:id",ye(ha));R.register("/stock/:id/edit",ye((e,s)=>ps(e,s)));R.register("/invoices",ye(gt));R.register("/invoices/new",ye((e,s)=>us(e,{id:"new"})));R.register("/invoices/:id",ye(us));R.register("/purchase-orders",ye(at));R.register("/purchase-orders/:id",ye(xa));R.register("/documents",ye(_a));R.register("/document/view",ye(za));R.register("/reports",ye($a));R.register("/settings",ye(Ia));R.register("/settings/forms/new",ye((e,s)=>bs(e,{id:"new"})));R.register("/settings/forms/:id/edit",ye((e,s)=>bs(e,s)));R.register("/settings/quote-templates/new",ye((e,s)=>Et(e,{id:"new",type:"template"})));R.register("/settings/quote-templates/:id/edit",ye((e,s)=>Et(e,{id:s.id,type:"template"})));const Ha=["/","/people","/contractors","/suppliers","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings","/settings/forms"];R.onNavigate=(e,s)=>{const t=JSON.parse(localStorage.getItem("currentUser")||"null"),a=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];if(!t&&e!=="/login")return R.navigate("/login"),!1;if(t){if(t.role==="customer"&&Ha.includes(a))return R.navigate("/portal"),!1;if(t.role!=="customer"&&a==="/portal")return R.navigate("/"),!1;if(t.role!=="admin"&&t.role!=="customer"&&t.userTypeId&&e!=="/login"){const u=p.getById("userTypes",t.userTypeId);if(u&&u.permissions){const l={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/suppliers":"Suppliers","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},c=l[a];if(c){let o=!1;if(e==="/jobs/new"&&!Te("Jobs","create")&&(o=!0),e.endsWith("/edit")&&a==="/jobs"&&!Te("Jobs","edit")&&(o=!0),e==="/quotes/new"&&!Te("Quotes","create")&&(o=!0),e==="/suppliers/new"&&!Te("Suppliers","create")&&(o=!0),e.endsWith("/edit")&&a==="/suppliers"&&!Te("Suppliers","edit")&&(o=!0),o){const d=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/suppliers","/assets","/documents","/settings"].find(v=>{const b=l[v];if(b==="Notifications"||b==="Dashboard")return!0;const i=u.permissions.find(n=>n.module===b);return i&&Object.entries(i).some(([n,m])=>n!=="module"&&m===!0)})||"/";return R.navigate(d),!1}if(!(c==="Notifications"||c==="Dashboard")){const r=u.permissions.find(d=>d.module===c);if(!r||Object.entries(r||{}).every(([d,v])=>d==="module"||!v)){const v=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/suppliers","/assets","/documents","/settings"].find(b=>{const i=l[b];if(i==="Notifications"||i==="Dashboard")return!0;const n=u.permissions.find(m=>m.module===i);return n&&Object.entries(n).some(([m,$])=>m!=="module"&&$===!0)})||"/";if(a!==v)return R.navigate(v),!1}}}}}}Zt(e),Us(e)};window.addEventListener("fieldforge-logout",()=>{localStorage.removeItem("currentUser");const e=document.querySelector(".sidebar"),s=document.querySelector(".topbar"),t=document.getElementById("breadcrumb");e&&(e.style.display="none"),s&&(s.style.display="none"),t&&(t.style.display="none"),R.navigate("/login")});const Ra=JSON.parse(localStorage.getItem("currentUser")||"null");!Ra&&window.location.hash!=="#/login"&&(window.location.hash="#/login");R.resolve();
