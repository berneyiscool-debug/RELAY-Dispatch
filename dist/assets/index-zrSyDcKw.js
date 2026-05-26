(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function t(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=t(n);fetch(n.href,r)}})();class xa{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(a,t){this.routes[a]=t}navigate(a){typeof window<"u"&&(window.location.hash=a)}resolve(a){let t=a||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const s=t.indexOf("?"),n={};if(s!==-1){const o=t.substring(s+1);t=t.substring(0,s),o.split("&").forEach(d=>{const[u,g]=d.split("=");u&&(n[u]=decodeURIComponent(g||""))})}const{handler:r,params:c}=this.matchRoute(t);if(r){this.currentRoute=t;const o={...c,...n};if(this.onNavigate&&this.onNavigate(t,o)===!1)return;r(o)}}matchRoute(a){if(this.routes[a])return{handler:this.routes[a],params:{}};for(const[t,s]of Object.entries(this.routes)){const n=t.split("/"),r=a.split("/");if(n.length!==r.length)continue;const c={};let o=!0;for(let d=0;d<n.length;d++)if(n[d].startsWith(":"))c[n[d].slice(1)]=r[d];else if(n[d]!==r[d]){o=!1;break}if(o)return{handler:s,params:c}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const Y=new xa,Qa=Object.freeze(Object.defineProperty({__proto__:null,Router:xa,router:Y},Symbol.toStringTag,{value:"Module"})),Pt="simpro_";class Wa{constructor(){this.listeners={}}_key(a){return Pt+a}getAll(a){try{const t=localStorage.getItem(this._key(a));return t?JSON.parse(t):[]}catch{return[]}}getById(a,t){return this.getAll(a).find(n=>n.id===t)||null}save(a,t){localStorage.setItem(this._key(a),JSON.stringify(t)),this.emit(a,t)}create(a,t){const s=this.getAll(a);return t.id=t.id||this.generateId(),t.createdAt=t.createdAt||new Date().toISOString(),t.updatedAt=new Date().toISOString(),s.push(t),this.save(a,s),t}update(a,t,s){const n=this.getAll(a),r=n.findIndex(c=>c.id===t);return r===-1?null:(n[r]={...n[r],...s,updatedAt:new Date().toISOString()},this.save(a,n),n[r])}delete(a,t){const n=this.getAll(a).filter(r=>r.id!==t);this.save(a,n)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const a={markupPercent:20,materialMarkup:{defaultPercent:30,minMarkupAmount:5,useTiers:!0,tiers:[{upTo:50,percent:60},{upTo:200,percent:45},{upTo:1e3,percent:30},{upTo:null,percent:15}]},materialCategories:["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],laborRates:[{id:"rate_1",name:"Standard Rate",rate:85,description:"Normal business hours Mon–Fri",overtimeMultiplier:1,minCallOutFee:0,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!0},{id:"rate_2",name:"After Hours Rate",rate:127.5,description:"Evenings and early mornings",overtimeMultiplier:1.5,minCallOutFee:45,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!1},{id:"rate_3",name:"Saturday Rate",rate:127.5,description:"Saturday work",overtimeMultiplier:1.5,minCallOutFee:65,applicableDays:["Sat"],isDefault:!1},{id:"rate_4",name:"Sunday Rate",rate:170,description:"Sunday and public holidays",overtimeMultiplier:2,minCallOutFee:85,applicableDays:["Sun","PH"],isDefault:!1},{id:"rate_5",name:"Emergency Rate",rate:195,description:"Urgent call-outs any day",overtimeMultiplier:2,minCallOutFee:120,applicableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],isDefault:!1}]};try{const t=localStorage.getItem(this._key("settings"));return t?JSON.parse(t):a}catch{return a}}saveSettings(a){localStorage.setItem(this._key("settings"),JSON.stringify(a)),this.emit("settings",a)}on(a,t){this.listeners[a]||(this.listeners[a]=[]),this.listeners[a].push(t)}off(a,t){this.listeners[a]&&(this.listeners[a]=this.listeners[a].filter(s=>s!==t))}emit(a,t){this.listeners[a]&&this.listeners[a].forEach(s=>s(t))}isSeeded(){return localStorage.getItem(Pt+"_seeded")==="true"}markSeeded(){localStorage.setItem(Pt+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(a=>a.startsWith(Pt)).forEach(a=>localStorage.removeItem(a))}}const l=new Wa,Ga=Object.freeze(Object.defineProperty({__proto__:null,store:l},Symbol.toStringTag,{value:"Module"}));function Le(e,a){const t=JSON.parse(localStorage.getItem("currentUser")||"null");if(!t)return!1;if(t.role==="admin")return!0;if(t.role==="customer")return!1;if(t.userTypeId){const s=l.getById("userTypes",t.userTypeId);if(s&&s.permissions){const n=s.permissions.find(r=>r.module===e);return n?!!n[a]:!1}}return t.role==="technician"?e==="Dashboard"?a==="view":e==="Jobs"?["view","manage_tasks","book_time"].includes(a):e==="Timesheets"?["view_own","create"].includes(a):e==="Schedule"?["view_own"].includes(a):!1:t.role==="manager"?e==="Settings"?["view","edit_company","manage_tax"].includes(a):!0:!1}const wt={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Tasklists"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs Tab"},{key:"view_quotes_tab",label:"View Quotes Tab"},{key:"view_pos_tab",label:"View POs Tab"},{key:"view_timesheets_tab",label:"View Timesheets Tab"},{key:"view_invoices_tab",label:"View Invoices Tab"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create / Submit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"edit_all",label:"Edit Any Timesheet"},{key:"export",label:"Export Timesheets"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Create Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View Full Schedule"},{key:"edit",label:"Manage Schedule (Drag/Drop)"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Create Contractors"},{key:"edit",label:"Edit Contractors"}],Suppliers:[{key:"view",label:"View Suppliers"},{key:"create",label:"Create Suppliers"},{key:"edit",label:"Edit Suppliers"},{key:"delete",label:"Delete Suppliers"}],Stock:[{key:"view",label:"View Inventory"},{key:"create",label:"Create Stock Items"},{key:"edit",label:"Manage Stock Levels"},{key:"delete",label:"Delete Stock"}],"Purchase Orders":[{key:"view",label:"View POs"},{key:"create",label:"Create POs"},{key:"approve",label:"Approve POs"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"send",label:"Send Invoices"},{key:"void",label:"Void Invoices"}],Reports:[{key:"view",label:"Access Reports"},{key:"export",label:"Export Data"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Files"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Profile"},{key:"manage_users",label:"Manage Users & Permissions"},{key:"manage_tax",label:"Manage Tax & Finance"}]};function Tt(e){return Object.entries(wt).map(([a,t])=>{const s={module:a};return t.forEach(({key:n})=>{s[n]=e(a,n)}),s})}function Ya(){const e=l.getAll("userTypes");if(e&&e.length>0)return e;const a=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:Tt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:Tt((t,s)=>t==="Settings"?["view","edit_company","manage_tax"].includes(s):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:Tt((t,s)=>t==="Dashboard"?s==="view":t==="Jobs"?["view","manage_tasks","book_time"].includes(s):t==="Timesheets"?["view_own","create"].includes(s):t==="Schedule"?["view_own"].includes(s):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Tt((t,s)=>t==="Settings"?!1:t==="Reports"?s==="view":!(["Invoices","Purchase Orders","Suppliers"].includes(t)&&s==="delete"))}];return l.save("userTypes",a),a}const Ka=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],qt=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin",payRate:95},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager",payRate:85},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech",payRate:58},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech",payRate:62},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech",payRate:55},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office",payRate:42}],St=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],Yt=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],zt=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function De(e){return e[Math.floor(Math.random()*e.length)]}function Be(e,a=0){const t=new Date,s=Math.floor(Math.random()*(e+a))-e;return new Date(t.getTime()+s*864e5).toISOString()}function dt(e,a){return Math.round((Math.random()*(a-e)+e)*100)/100}function Xa(){return Ka.map((e,a)=>{const t=De(Yt),s=De(Yt);return{id:`cust_${a+1}`,company:e.company,firstName:e.first,lastName:e.last,email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${t}, ${De(zt)}, VIC 3000`,status:De(["Active","Active","Active","Inactive"]),type:De(["Company","Company","Individual"]),notes:"",createdAt:Be(365),updatedAt:Be(30),sites:[{name:"Main Office",address:`${t}, ${De(zt)}, VIC 3000`},{name:"Warehouse",address:`${s}, ${De(zt)}, VIC 3001`}],contacts:[{name:`${e.first} ${e.last}`,role:"Primary",email:`${e.first.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${De(["Alex","Sam","Jordan","Casey","Morgan"])} ${e.last}`,role:"Site Manager",email:`site@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function la(){return[{id:"cont_1",businessName:"EcoVolt Electrical Services",contactName:"Elena Rostova",email:"elena@ecovoltelectrical.com.au",phone:"0498 765 432",licenseNumber:"LIC-EL-88390",active:!0,hourlyRate:95,afterHoursRate:142.5,calloutFee:85,specialties:["Solar PV Installation","Battery Systems","Switchboard Upgrades"],notes:"Preferred subcontractor for large-scale solar rollouts. Highly reliable.",portalToken:"c_pt_ecovolt",complianceDocs:[{id:"doc_1_1",type:"Public Liability Insurance",number:"PL-992110-A",expiryDate:"2026-10-15",verified:!0,notes:"Cover up to $20M"},{id:"doc_1_2",type:"Workers Compensation",number:"WC-883912",expiryDate:"2026-08-20",verified:!0,notes:"Active cover"},{id:"doc_1_3",type:"Electrical Contractor License",number:"REC-39021",expiryDate:"2027-02-15",verified:!0,notes:"A-Grade Electrical License"}]},{id:"cont_2",businessName:"Apex Plumbing & Drainage",contactName:"Gary Barlow",email:"gary@apexplumbing.com.au",phone:"0412 345 678",licenseNumber:"LIC-PL-99211",active:!0,hourlyRate:90,afterHoursRate:135,calloutFee:90,specialties:["Commercial Plumbing","Gas Fitting","Drain Blockages"],notes:"Quick response time. Has own high-pressure jetter and CCTV camera.",portalToken:"c_pt_apex",complianceDocs:[{id:"doc_2_1",type:"Public Liability Insurance",number:"PL-223401-B",expiryDate:"2026-06-30",verified:!0,notes:"Cover up to $10M"},{id:"doc_2_2",type:"Workers Compensation",number:"WC-449102",expiryDate:"2026-04-12",verified:!1,notes:"Requires updated certificate copy"},{id:"doc_2_3",type:"Plumbing Practitioner License",number:"PPL-1192",expiryDate:"2027-09-01",verified:!0,notes:"Licensed drainer and gasfitter"}]},{id:"cont_3",businessName:"Swift HVAC & Mechanical",contactName:"Marcus Sterling",email:"marcus@swifthvac.com.au",phone:"0423 556 789",licenseNumber:"LIC-HV-44012",active:!1,hourlyRate:105,afterHoursRate:157.5,calloutFee:120,specialties:["Chiller Maintenance","Commercial A/C","Duct Work"],notes:"Currently set to inactive due to expired public liability insurance. Do not dispatch.",portalToken:"c_pt_swift",complianceDocs:[{id:"doc_3_1",type:"Public Liability Insurance",number:"PL-771109-C",expiryDate:"2026-02-10",verified:!1,notes:"Expired! Contact Marcus for renewal"},{id:"doc_3_2",type:"Workers Compensation",number:"WC-110291",expiryDate:"2026-11-30",verified:!0,notes:"Cover active"},{id:"doc_3_3",type:"ARC Refrigerant License",number:"ARC-8891",expiryDate:"2027-05-18",verified:!0,notes:"Full handle license"}]}]}function da(){return[{id:"tmpl_elec_std",name:"Standard Electrical Inspection",description:"A comprehensive tasklist for residential or commercial electrical safety inspections.",tags:["Electrical","Maintenance","Compliance"],createdAt:new Date().toISOString(),tasks:[{id:"p1",name:"Main Board Inspection",status:"Not Started",progress:0,description:"Visually inspect main board, terminal blocks, enclosure, and general wiring integrity.",subTasks:[{id:"sp1",name:"RCD Testing",estimatedHours:1,people:1,status:"Not Started",progress:0,description:"Perform trip time and trip current test on safety switches."},{id:"sp2",name:"Terminal Tightness",estimatedHours:.5,people:1,status:"Not Started",progress:0,description:"Verify all terminal screws are properly torqued to specifications."}]},{id:"p2",name:"Circuit Testing",status:"Not Started",progress:0,description:"Test subcircuits for safety, load rating compliance, and continuous grounding.",subTasks:[{id:"sp3",name:"Insulation Resistance",estimatedHours:2,people:1,status:"Not Started",progress:0,description:"Measure insulation resistance between active, neutral, and earth conductors."},{id:"sp4",name:"Earth Loop Impedance",estimatedHours:1.5,people:1,status:"Not Started",progress:0,description:"Measure the impedance of the earth fault loop to verify breaker trip time."}]}]},{id:"tmpl_solar_maint",name:"Solar Panel Maintenance",description:"Annual maintenance checklist for PV solar systems.",tags:["Solar","Renewable","Maintenance"],createdAt:new Date().toISOString(),tasks:[{id:"p3",name:"Physical Inspection",status:"Not Started",progress:0,description:"Assess physical condition of panels, mounting frames, and external conduits.",subTasks:[{id:"sp5",name:"Module Cleaning",estimatedHours:3,people:2,status:"Not Started",progress:0,description:"Clean modules with de-ionized water to remove dirt, debris, or bird droppings."},{id:"sp6",name:"Mounting Hardware Check",estimatedHours:1,people:1,status:"Not Started",progress:0,description:"Ensure all mounting brackets, rails, and bolts are securely fastened."}]},{id:"p4",name:"Electrical Performance",status:"Not Started",progress:0,description:"Measure solar production efficiency, inverter outputs, and string voltage stability.",subTasks:[{id:"sp7",name:"Inverter Diagnostics",estimatedHours:1,people:1,status:"Not Started",progress:0,description:"Read fault log history, check operational status, and inspect ventilation/heatsinks."},{id:"sp8",name:"String Voltage Testing",estimatedHours:2,people:1,status:"Not Started",progress:0,description:"Measure open circuit voltage and short circuit current on each solar string."}]}]}]}function Za(e){const a=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],t=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(s,n)=>{const r=De(e);return{id:`lead_${n+1}`,title:`${De(St)} ${De(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:r.id,customerName:r.company,contactName:`${r.firstName} ${r.lastName}`,status:De(a),source:De(t),value:dt(500,25e3),description:`Potential ${De(St).toLowerCase()} work for ${r.company}.`,priority:De(["Low","Medium","High"]),createdAt:Be(90),updatedAt:Be(14)}})}function es(e){const a=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(t,s)=>{const n=De(e),r=dt(200,5e3),c=dt(100,8e3),o=(r+c)*.1;return{id:`quote_${s+1}`,number:`Q-${String(2024e3+s+1)}`,customerId:n.id,customerName:n.company,contactName:`${n.firstName} ${n.lastName}`,title:`${De(St)} - ${De(["Service Quote","Project Quote","Maintenance Quote"])}`,status:De(a),lineItems:[{description:`${De(St)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:dt(65,120),total:r},{description:`${De(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:dt(15,200),total:c}],subtotal:r+c,tax:o,total:r+c+o,validUntil:Be(-30,60),notes:"",createdAt:Be(120),updatedAt:Be(14)}})}function ts(e,a){const t=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],s=["Low","Medium","High","Urgent"];return Array.from({length:20},(n,r)=>{var g;const c=De(e),o=De(qt),d=r===0?"Scheduled":r===1?"In Progress":r===2?"Pending":De(t),u=r===0||r===1?"cont_1":r===2?"cont_2":null;return{id:`job_${r+1}`,number:`J-${String(1e5+r+1)}`,customerId:c.id,customerName:c.company,contactName:`${c.firstName} ${c.lastName}`,siteAddress:c.address||`${De(Yt)}, ${De(zt)}, VIC 3000`,title:`${De(St)} - ${De(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:De(St),status:d,priority:De(s),technicianId:o.id,technicianName:o.name,contractorId:u,quoteId:r<a.length?(g=a[r])==null?void 0:g.id:null,scheduledDate:Be(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:dt(200,4e3),materialCost:dt(100,3e3),tasks:[{id:"p1",name:"Site Preparation",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:4,people:1,assignedContractorIds:r===2?["cont_1"]:[],subTasks:[{id:"sp1",name:"Safety Audit",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:1,people:1,assignedContractorIds:r===2?["cont_1"]:[]},{id:"sp2",name:"Site Setup",status:d==="Pending"?"Not Started":"Completed",progress:d==="Pending"?0:100,estimatedHours:3,people:1,assignedContractorIds:r===2?["cont_1"]:[]}]},{id:"p2",name:"Installation Phase",status:d==="Completed"||d==="Invoiced"?"Completed":d==="In Progress"?"In Progress":"Not Started",progress:d==="Completed"||d==="Invoiced"?100:d==="In Progress"?50:0,estimatedHours:12,people:2,assignedContractorIds:r===2?["cont_2"]:[],subTasks:[{id:"sp3",name:"Main Installation",status:d==="Completed"||d==="Invoiced"?"Completed":d==="In Progress"?"In Progress":"Not Started",progress:d==="Completed"||d==="Invoiced"||d==="In Progress"?100:0,estimatedHours:8,people:2,assignedContractorIds:r===2?["cont_2"]:[]},{id:"sp4",name:"Final Commissioning",status:d==="Completed"||d==="Invoiced"?"Completed":"Not Started",progress:d==="Completed"||d==="Invoiced"?100:0,estimatedHours:4,people:2,assignedContractorIds:r===2?["cont_2"]:[]}]}],notes:"",createdAt:Be(90),updatedAt:Be(7)}})}function as(e){const a=["Draft","Sent","Paid","Overdue","Void"],t=e.filter(s=>s.status==="Completed"||s.status==="Invoiced");return Array.from({length:Math.max(8,t.length)},(s,n)=>{const r=t[n]||De(e),c=(r.laborCost||0)+(r.materialCost||0),o=c*.1;return{id:`inv_${n+1}`,number:`INV-${String(5e4+n+1)}`,jobId:r.id,jobNumber:r.number,customerId:r.customerId,customerName:r.customerName,contactName:r.contactName,status:De(a),lineItems:[{description:`${r.title} - Labor`,amount:r.laborCost||dt(200,4e3)},{description:`${r.title} - Materials`,amount:r.materialCost||dt(100,3e3)}],subtotal:c,tax:o,total:c+o,invoiceType:"Standard",issueDate:Be(60),dueDate:Be(-14,30),paidDate:null,notes:"",createdAt:Be(60),updatedAt:Be(7)}})}function ss(){return[{id:"fmt_1",name:"Job Safety Analysis (JSA)",description:"Daily safety assessment before starting work.",sections:[{id:"sec_1",title:"Personal Protective Equipment",fields:[{id:"f1",type:"checkbox",label:"Gloves worn?",required:!0},{id:"f2",type:"checkbox",label:"Safety Glasses worn?",required:!0},{id:"f3",type:"checkbox",label:"Steel Cap Boots worn?",required:!0}]},{id:"sec_2",title:"Site Hazards",fields:[{id:"f4",type:"select",label:"Overall Site Risk",options:["Low","Medium","High"],required:!0},{id:"f5",type:"textarea",label:"Identified Hazards",placeholder:"Describe any trip hazards, live wires, etc."}]},{id:"sec_3",title:"Authorization",fields:[{id:"f6",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"fmt_2",name:"Site Assessment",description:"Detailed site inspection and requirements.",sections:[{id:"sec_4",title:"Client Details",fields:[{id:"f7",type:"text",label:"Customer Rep Name"},{id:"f8",type:"date",label:"Inspection Date"}]},{id:"sec_5",title:"Access & Logistics",fields:[{id:"f9",type:"checkbox",label:"Access keys provided?"},{id:"f10",type:"textarea",label:"Parking / Entry Instructions"}]}]}]}function os(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((a,t)=>{const s=["Warehouse A","Warehouse B","Main Warehouse","Vehicle - Mark Sullivan","Vehicle - Jake Patterson","Vehicle - Ryan Cooper"],n=Math.floor(Math.random()*2)+2,c=[...s].sort(()=>.5-Math.random()).slice(0,n).map(d=>({location:d,quantity:Math.floor(Math.random()*60)+5})),o=c.reduce((d,u)=>d+u.quantity,0);return{id:`stock_${t+1}`,name:a.name,sku:`SKU-${String(1e3+t)}`,category:a.cat,unit:a.unit,unitPrice:a.price,costPrice:a.price*.6,quantity:o,reorderLevel:Math.floor(Math.random()*20)+5,supplier:De(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:c[0].location,locations:c,createdAt:Be(365),updatedAt:Be(30)}})}function is(e){var t,s,n,r,c,o;return[{name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active"},{name:"Isuzu NPR Truck",type:"Vehicle",serial:"REG-888-FF",ownerType:"Business",recoveryRate:45,serviceIntervalMonths:6,currentMeter:12e4,status:"Active"},{name:"Scissor Lift 19ft",type:"Plant & Equipment",serial:"SN-SL-9920",ownerType:"Business",recoveryRate:15,serviceIntervalMonths:3,currentMeter:840,status:"Active"},{name:"Carrier Chiller Unit",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-CH-7721",ownerType:"Customer",customerId:e[0].id,site:(s=(t=e[0].sites)==null?void 0:t[0])==null?void 0:s.name,serviceIntervalMonths:12,currentMeter:15400,status:"Active"},{name:"Daikin Split System",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-DS-4410",ownerType:"Customer",customerId:e[1].id,site:(r=(n=e[1].sites)==null?void 0:n[0])==null?void 0:r.name,serviceIntervalMonths:12,currentMeter:3200,status:"Active"},{name:"Fire Alarm Panel v4",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-FP-2299",ownerType:"Customer",customerId:e[2].id,site:(o=(c=e[2].sites)==null?void 0:c[0])==null?void 0:o.name,serviceIntervalMonths:6,currentMeter:0,status:"Active"}].map((d,u)=>({id:`asset_${u+1}`,...d,logs:[{id:`log_${u}_1`,type:"Service",date:Be(90),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]}))}function ca(){return[{id:"sup_1",name:"ElectraTrade",contactName:"Robert Vance",email:"sales@electratrade.com.au",phone:"03 9822 1045",address:"22 Industrial Parkway, South Melbourne, VIC 3205",category:"Electrical",accountNumber:"FF-ET-10291",paymentTerms:"30 Days",active:!0,notes:"Primary supplier for electrical switchgear, cable, and general conduit fittings.",attachments:[{id:"att_sup_1_1",name:"ElectraTrade_Price_List_2026.pdf",type:"application/pdf",size:1245e3,uploadedAt:"2026-01-10T08:00:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_2",name:"PipeLine Supply",contactName:"Douglas Miller",email:"orders@pipelinesupply.com.au",phone:"03 9544 3300",address:"108 Pipeline Rd, Richmond, VIC 3121",category:"Plumbing",accountNumber:"FF-PL-99401",paymentTerms:"14 Days",active:!0,notes:"Main plumbing merchant. Provides rapid morning deliveries to metro sites.",attachments:[{id:"att_sup_2_1",name:"PipeLine_Product_Brochure.pdf",type:"application/pdf",size:345e4,uploadedAt:"2026-02-15T09:30:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_3",name:"CoolParts Wholesale",contactName:"Amanda Jenkins",email:"amanda@coolparts.com.au",phone:"03 9711 5050",address:"45 Cold Storage Lane, Clayton, VIC 3168",category:"HVAC",accountNumber:"FF-CP-39021",paymentTerms:"30 Days",active:!0,notes:"HVAC compressors, copper coils, ducting components, and split system units.",attachments:[]},{id:"sup_4",name:"SafeGuard Dist.",contactName:"Sarah Conner",email:"wholesale@safeguard.com.au",phone:"03 8990 1200",address:"90 Security Plaza, Collingwood, VIC 3066",category:"Fire Safety",accountNumber:"FF-SG-88301",paymentTerms:"COD",active:!0,notes:"Preferred supplier for smoke alarms, commercial fire panel zone cards, and extinguishers.",attachments:[{id:"att_sup_4_1",name:"SafeGuard_Compliance_Certificate.pdf",type:"application/pdf",size:954e3,uploadedAt:"2026-03-01T10:15:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_5",name:"AllTrade Supplies",contactName:"Kevin Higgins",email:"kevin@alltradesupplies.com.au",phone:"03 9205 6000",address:"15-19 Warehouse Lane, Dandenong, VIC 3175",category:"General",accountNumber:"FF-AT-22340",paymentTerms:"30 Days",active:!0,notes:"Consumables, cable ties, silicone, fasteners, and miscellaneous hand tools.",attachments:[]}]}function ns(e){const a=[];return e.filter(s=>s.status==="Scheduled"||s.status==="In Progress").forEach((s,n)=>{const r=Math.floor(Math.random()*5),c=7+Math.floor(Math.random()*8),o=1+Math.floor(Math.random()*4),d=qt.find(u=>u.id===s.technicianId)||De(qt);a.push({id:`sched_${n+1}`,jobId:s.id,jobNumber:s.number,title:s.title,technicianId:d.id,technicianName:d.name,color:d.color,dayOffset:r,startHour:c,endHour:Math.min(c+o,18),customerName:s.customerName,siteAddress:s.siteAddress})}),a}function rs(){var m,h,b,w,I,x,E,k,S,D,M,N;if(l.isSeeded()){let ee=function(F){let W=!1;return F.description||(F.description=re[F.name]||`Standard operational procedures, verification checks, and safety guidelines for "${F.name}".`,W=!0),F.subTasks&&F.subTasks.forEach(B=>{ee(B)&&(W=!0)}),W};var p=ee;const $=l.getAll("jobs");let f=!1;const T=$.map(F=>{let W=!1;function B(ue){const pe={...ue};return"subPhases"in pe?(pe.subTasks=(pe.subPhases||[]).map(X=>B(X)),delete pe.subPhases,W=!0):pe.subTasks&&(pe.subTasks=pe.subTasks.map(X=>B(X))),pe}const te={...F};return"phases"in te?(te.tasks=(te.phases||[]).map(ue=>B(ue)),delete te.phases,W=!0):te.tasks&&(te.tasks=te.tasks.map(ue=>B(ue))),W&&(f=!0),te});f&&l.save("jobs",T);const C=l.getAll("taskTemplates");let z=!1;const J=C.map(F=>{let W=!1;function B(ue){const pe={...ue};return"subPhases"in pe?(pe.subTasks=(pe.subPhases||[]).map(X=>B(X)),delete pe.subPhases,W=!0):pe.subTasks&&(pe.subTasks=pe.subTasks.map(X=>B(X))),pe}const te={...F};return"phases"in te?(te.tasks=(te.phases||[]).map(ue=>B(ue)),delete te.phases,W=!0):te.tasks&&(te.tasks=te.tasks.map(ue=>B(ue))),W&&(z=!0),te});z&&l.save("taskTemplates",J);const L=l.getAll("jobs");if(L.length>0&&!L[0].tasks){const F=L.map(W=>{const B=W.status;return{...W,tasks:[{id:"p1",name:"Site Preparation",status:B==="Pending"?"Not Started":"Completed",progress:B==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:B==="Pending"?"Not Started":"Completed",progress:B==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:B==="Pending"?"Not Started":"Completed",progress:B==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Project Execution",status:B==="Completed"||B==="Invoiced"?"Completed":B==="In Progress"?"In Progress":"Not Started",progress:B==="Completed"||B==="Invoiced"?100:B==="In Progress"?50:0,estimatedHours:16,people:2,subTasks:[{id:"sp3",name:"Installation",status:B==="Completed"||B==="Invoiced"?"Completed":B==="In Progress"?"In Progress":"Not Started",progress:B==="Completed"||B==="Invoiced"||B==="In Progress"?100:0,estimatedHours:12,people:2},{id:"sp4",name:"Cleanup & Handover",status:B==="Completed"||B==="Invoiced"?"Completed":"Not Started",progress:B==="Completed"||B==="Invoiced"?100:0,estimatedHours:4,people:2}]}]}});l.save("jobs",F)}const j=l.getAll("userTypes");if(!j||j.length===0)Ya();else{j.some(B=>B.id==="ut_office")||(j.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Tt((B,te)=>B==="Settings"?!1:B==="Reports"?te==="view":!(["Invoices","Purchase Orders"].includes(B)&&te==="delete"))}),l.save("userTypes",j));let W=!1;j.forEach(B=>{B.permissions||(B.permissions=[]),Object.entries(wt).forEach(([te,ue])=>{let pe=B.permissions.find(X=>X.module===te);pe||(pe={module:te},B.permissions.push(pe),W=!0),ue.forEach(({key:X})=>{pe[X]===void 0&&(B.id==="ut_admin"?pe[X]=!0:B.id==="ut_manager"?te==="Settings"?pe[X]=["view","edit_company","manage_tax"].includes(X):pe[X]=!0:B.id==="ut_office"?te==="Settings"?pe[X]=!1:te==="Reports"?pe[X]=X==="view":["Invoices","Purchase Orders","Suppliers"].includes(te)&&X==="delete"?pe[X]=!1:pe[X]=!0:B.id==="ut_tech"?te==="Dashboard"?pe[X]=X==="view":te==="Jobs"?pe[X]=["view","manage_tasks","book_time"].includes(X):te==="Timesheets"?pe[X]=["view_own","create"].includes(X):te==="Schedule"?pe[X]=["view_own"].includes(X):pe[X]=!1:pe[X]=!1,W=!0)})})}),W&&l.save("userTypes",j)}const q=l.getAll("technicians"),A=l.getAll("userTypes");if(q.length>0&&A.length>0){const F=q[0];A.some(B=>B.id===F.userTypeId)||l.save("technicians",qt)}const _=l.getAll("taskTemplates");(!_||_.length===0)&&l.save("taskTemplates",da());const H=l.getAll("contractors"),R=H.some(F=>F.complianceDocs&&F.complianceDocs.length>0);(!H||H.length===0||!R)&&l.save("contractors",la());const V=l.getAll("suppliers");(!V||V.length===0)&&l.save("suppliers",ca());const se=l.getAll("stock");if(se.some(F=>!F.locations||!Array.isArray(F.locations))){const F={};se.forEach(B=>{const te=B.sku||B.name;if(F[te]||(F[te]={...B,locations:B.locations&&Array.isArray(B.locations)?[...B.locations]:[]}),!B.locations||!Array.isArray(B.locations)){const ue=B.location||"Main Warehouse",pe=parseInt(B.quantity)||0,X=F[te].locations.find(oe=>oe.location===ue);X?X.quantity+=pe:F[te].locations.push({location:ue,quantity:pe})}else B.locations.forEach(ue=>{const pe=F[te].locations.find(X=>X.location===ue.location);pe?pe.quantity+=ue.quantity:F[te].locations.push({...ue})})});const W=Object.values(F).map(B=>{var te;return B.quantity=B.locations.reduce((ue,pe)=>ue+pe.quantity,0),B.location=((te=B.locations[0])==null?void 0:te.location)||"Main Warehouse",B});l.save("stock",W)}const P=l.getAll("jobs");let Z=!1;const re={"Site Preparation":"Establish site perimeter, prepare tools, and ensure safety barriers are erected.","Safety Audit":"Perform JSA/SWMS audit, verify PPE, and sign off the site hazard checklist.","Site Setup":"Lay down drop sheets, set up safety signage, and deploy service vehicles.","Project Execution":"Execute primary wiring, mount physical hardware components, and run routing paths.","Installation Phase":"Execute primary wiring, mount physical hardware components, and run routing paths.","Main Installation":"Fit electrical panels, run armored cabling, connect central distribution points.","Final Commissioning":"Perform insulation resistance checks, load tests, and sign off safety compliance reports.",Installation:"Fit electrical panels, run armored cabling, connect central distribution points.","Cleanup & Handover":"Perform insulation resistance checks, load tests, and sign off safety compliance reports."};!P.some(F=>F.contractorId==="cont_1"||F.contractorId==="cont_2")&&P.length>=3&&(P[0].contractorId="cont_1",P[0].status="Scheduled",P[1].contractorId="cont_1",P[1].status="In Progress",P[2].contractorId="cont_2",P[2].status="Pending",P[2].tasks&&P[2].tasks[0]&&(P[2].tasks[0].assignedContractorIds=["cont_1"],P[2].tasks[0].subTasks&&P[2].tasks[0].subTasks.forEach(F=>{F.assignedContractorIds=["cont_1"]})),Z=!0);const ne=P.map(F=>{let W=!1;return F.tasks&&F.tasks.forEach(B=>{ee(B)&&(W=!0)}),W&&(Z=!0),F});Z&&l.save("jobs",ne);const Q=l.getAll("taskTemplates");let K=!1;const ae=Q.map(F=>{let W=!1;return F.tasks&&F.tasks.forEach(B=>{ee(B)&&(W=!0)}),W&&(K=!0),F});K&&l.save("taskTemplates",ae);return}const e=Xa(),a=Za(e),t=es(e),s=ts(e,t),n=as(s),r=os(),c=is(e),o=ns(s),d=ss();l.save("customers",e),l.save("leads",a),l.save("quotes",t),l.save("jobs",s),l.save("invoices",n),l.save("stock",r),l.save("assets",c),l.save("schedule",o),l.save("technicians",qt),l.save("taskTemplates",da()),l.save("formTemplates",d),l.save("formInstances",[]),l.save("contractors",la()),l.save("suppliers",ca());const u=new Date,g=$=>$.toString().padStart(2,"0");function y($){const f=new Date(u);return f.setDate(f.getDate()+$),`${f.getFullYear()}-${g(f.getMonth()+1)}-${g(f.getDate())}`}const i=[{id:"act_1",title:"Follow up on quote approval",type:"follow-up",date:y(0),time:"09:00",duration:15,priority:"high",status:"pending",assignedToId:"tech1",linkedType:"quote",linkedId:((m=t[0])==null?void 0:m.id)||"",linkedLabel:`Quote ${((h=t[0])==null?void 0:h.number)||""}`,notes:"Client requested revised pricing on switchboard section."},{id:"act_2",title:"Site inspection — Docklands",type:"site-visit",date:y(0),time:"13:00",duration:120,priority:"normal",status:"pending",assignedToId:"tech3",linkedType:"job",linkedId:((b=s[0])==null?void 0:b.id)||"",linkedLabel:`Job ${((w=s[0])==null?void 0:w.number)||""}`,notes:"Confirm conduit runs before ceiling close-in."},{id:"act_3",title:"Call supplier re: panel delivery",type:"call",date:y(-1),time:"10:30",duration:10,priority:"normal",status:"completed",assignedToId:"tech2",linkedType:"",linkedId:"",linkedLabel:"",notes:"Confirmed delivery for Friday."},{id:"act_4",title:"Team safety meeting",type:"meeting",date:y(1),time:"07:30",duration:30,priority:"normal",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:"Monthly toolbox talk — fire extinguisher training."},{id:"act_5",title:"Email updated scope to client",type:"email",date:y(0),time:"15:00",duration:15,priority:"low",status:"pending",assignedToId:"tech6",linkedType:"customer",linkedId:((I=e[1])==null?void 0:I.id)||"",linkedLabel:((x=e[1])==null?void 0:x.company)||"",notes:""},{id:"act_6",title:"Chase overdue invoice",type:"call",date:y(-2),time:"11:00",duration:10,priority:"high",status:"pending",assignedToId:"tech6",linkedType:"invoice",linkedId:((E=n[0])==null?void 0:E.id)||"",linkedLabel:`Invoice ${((k=n[0])==null?void 0:k.number)||""}`,notes:"60 days overdue. Escalate if no response."},{id:"act_7",title:"Pre-start meeting with builder",type:"meeting",date:y(2),time:"08:00",duration:60,priority:"normal",status:"pending",assignedToId:"tech2",linkedType:"job",linkedId:((S=s[1])==null?void 0:S.id)||"",linkedLabel:`Job ${((D=s[1])==null?void 0:D.number)||""}`,notes:"Coordinate access and power isolation with site foreman."},{id:"act_8",title:"Order fire panel spares",type:"task",date:y(1),time:"",duration:0,priority:"normal",status:"pending",assignedToId:"tech4",linkedType:"",linkedId:"",linkedLabel:"",notes:"Need 3x zone cards and 1x PSU."},{id:"act_9",title:"Review apprentice logbook",type:"task",date:y(3),time:"",duration:0,priority:"low",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:""},{id:"act_10",title:"Warranty follow-up call",type:"call",date:y(-3),time:"14:00",duration:15,priority:"normal",status:"completed",assignedToId:"tech5",linkedType:"customer",linkedId:((M=e[2])==null?void 0:M.id)||"",linkedLabel:((N=e[2])==null?void 0:N.company)||"",notes:"Issue resolved. Replacement sensor installed."}];l.save("activities",i),l.markSeeded()}const ls=[{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{category:"Workflow",id:"cat-workflow",icon:"account_tree",items:[{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"}]},{category:"People",id:"cat-people",icon:"groups",items:[{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"suppliers",icon:"local_shipping",label:"Suppliers",path:"/suppliers"}]},{category:"Resources",id:"cat-resources",icon:"widgets",items:[{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"}]},{category:"Admin",id:"cat-admin",icon:"admin_panel_settings",items:[{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}]}];function $a(){const e=document.createElement("aside");e.className="sidebar",e.id="sidebar";const a=localStorage.getItem("simpro_sidebar_expanded")==="true";a&&e.classList.add("expanded");const t=l.getSettings();let n=`
    <div class="sidebar-logo" id="sidebar-logo">
      ${t.logo?`<div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
         <img src="${t.logo}" class="custom-logo" id="sidebar-logo-img" style="max-height: 28px; max-width: ${a?"140px":"32px"}; object-fit: contain;" />
         <span class="logo-text" style="${a?"display: block;":"display: none;"}">${t.name||"FieldForge"}</span>
       </div>`:`
      <div class="logo-icon">F</div>
      <span class="logo-text">FieldForge</span>
    `}
    </div>
    <div class="sidebar-scroll-arrow up" id="sidebar-scroll-up">
      <span class="material-icons-outlined">keyboard_arrow_up</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
  `,r={};try{r=JSON.parse(localStorage.getItem("simpro_sidebar_collapsed_categories")||"{}")}catch{}const c=window.location.hash.slice(1)||"/",o=c==="/"?"/":"/"+c.split("/").filter(Boolean)[0];ls.forEach(h=>{if(h.category){const b=h.items.some(I=>I.path===o);let w=r[h.id]===!0;b&&(w=!1),n+=`
        <div class="sidebar-category-container" data-category-id="${h.id}">
          <button class="sidebar-category-header" data-category-id="${h.id}" id="cat-header-${h.id}">
            <span class="category-chevron">
              <span class="material-icons-outlined">${w?"keyboard_arrow_right":"expand_more"}</span>
            </span>
            <span class="category-icon">
              <span class="material-icons-outlined">${h.icon}</span>
            </span>
            <span class="category-label">${h.category}</span>
          </button>
          <div class="sidebar-category-items ${w?"collapsed":""}" id="cat-items-${h.id}">
      `,h.items.forEach(I=>{n+=`
          <button class="sidebar-nav-item sub-item" data-path="${I.path}" data-id="${I.id}" id="nav-${I.id}">
            <span class="nav-icon"><span class="material-icons-outlined">${I.icon}</span></span>
            <span class="nav-label">${I.label}</span>
          </button>
        `}),n+=`
          </div>
        </div>
      `}else n+=`
        <button class="sidebar-nav-item" data-path="${h.path}" data-id="${h.id}" id="nav-${h.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${h.icon}</span></span>
          <span class="nav-label">${h.label}</span>
        </button>
      `}),n+=`
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
      <span class="material-icons-outlined" id="sidebar-toggle-icon">${a?"chevron_left":"chevron_right"}</span>
    </button>
  `,e.innerHTML=n,e.addEventListener("click",h=>{const b=h.target.closest(".sidebar-category-header");if(b){if(!e.classList.contains("expanded"))return;const I=b.dataset.categoryId,x=e.querySelector(`#cat-items-${I}`),E=b.querySelector(".category-chevron .material-icons-outlined");if(x&&E){x.classList.toggle("collapsed");const k=x.classList.contains("collapsed");E.textContent=k?"keyboard_arrow_right":"expand_more";try{const S=JSON.parse(localStorage.getItem("simpro_sidebar_collapsed_categories")||"{}");S[I]=k,localStorage.setItem("simpro_sidebar_collapsed_categories",JSON.stringify(S))}catch{}}return}const w=h.target.closest(".sidebar-nav-item");if(w&&w.id!=="btn-logout"){const I=w.dataset.path;I&&Y.navigate(I)}}),e.querySelector("#sidebar-logo").addEventListener("click",()=>Y.navigate("/")),e.querySelector("#sidebar-toggle").addEventListener("click",()=>wa(e));const g=e.querySelector("#sidebar-nav"),y=e.querySelector("#sidebar-scroll-up"),i=e.querySelector("#sidebar-scroll-down"),p=()=>{if(e.classList.contains("expanded")){y.classList.remove("visible"),i.classList.remove("visible");return}const{scrollTop:h,scrollHeight:b,clientHeight:w}=g;y.classList.toggle("visible",h>0),i.classList.toggle("visible",Math.ceil(h+w)<b)};g.addEventListener("scroll",p),y.addEventListener("click",()=>{g.scrollBy({top:-100,behavior:"smooth"})}),i.addEventListener("click",()=>{g.scrollBy({top:100,behavior:"smooth"})}),setTimeout(p,100);const m=e.querySelector("#btn-logout");return m&&m.addEventListener("click",h=>{h.stopPropagation(),window.dispatchEvent(new CustomEvent("fieldforge-logout"))}),e.querySelectorAll(".sidebar-category-container").forEach(h=>{let b=null,w=null;function I(){b&&(b.remove(),b=null)}h.addEventListener("mouseenter",()=>{if(e.classList.contains("expanded")||(w&&(clearTimeout(w),w=null),b))return;const x=h.dataset.categoryId,E=h.querySelector(".sidebar-category-header"),k=h.querySelector(".sidebar-category-items");if(!E||!k)return;const S=Array.from(k.querySelectorAll(".sidebar-nav-item")).filter(N=>N.style.display!=="none");if(S.length===0)return;b=document.createElement("div"),b.className="sidebar-collapsed-flyout",b.id=`flyout-${x}`;let D="";S.forEach(N=>{const $=N.classList.contains("active");D+=`
          <button class="sidebar-nav-item sub-item ${$?"active":""}" data-path="${N.dataset.path}" data-id="${N.dataset.id}">
            <span class="nav-icon">${N.querySelector(".nav-icon").innerHTML}</span>
            <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">${N.querySelector(".nav-label").textContent}</span>
          </button>
        `}),b.innerHTML=D,document.body.appendChild(b);const M=E.getBoundingClientRect();b.style.position="fixed",b.style.left=`${M.right+2}px`,b.style.top=`${M.top}px`,b.style.zIndex="99999",b.addEventListener("click",N=>{const $=N.target.closest(".sidebar-nav-item");if($){const f=$.dataset.path;f&&(Y.navigate(f),I())}}),b.addEventListener("mouseenter",()=>{w&&(clearTimeout(w),w=null)}),b.addEventListener("mouseleave",()=>{w=setTimeout(I,120)})}),h.addEventListener("mouseleave",()=>{e.classList.contains("expanded")||(w=setTimeout(I,120))})}),window.addEventListener("simpro-settings-updated",()=>{const h=l.getSettings(),b=e.querySelector("#sidebar-logo");h.logo?b.innerHTML=`
        <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
          <img src="${h.logo}" class="custom-logo" style="max-height: 28px; max-width: ${e.classList.contains("expanded")?"140px":"32px"}; object-fit: contain;" />
          <span class="logo-text" style="${e.classList.contains("expanded")?"display: block;":"display: none;"}">${h.name||"FieldForge"}</span>
        </div>
      `:b.innerHTML=`
        <div class="logo-icon">F</div>
        <span class="logo-text">FieldForge</span>
      `}),e}function ds(e){const a=e||document.getElementById("sidebar");if(!a)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');if(t.role==="customer")a.style.display="none";else{a.style.display="";let s=null;if(t.userTypeId){const o=l.getById("userTypes",t.userTypeId);o&&o.permissions&&(s=o.permissions)}a.querySelectorAll(".sidebar-nav-item").forEach(o=>{if(o.id==="btn-logout"){o.style.display="";return}const d=o.querySelector(".nav-label");if(!d)return;const u=d.textContent.trim();if(t.role==="admin"){o.style.display="";return}if(s){const g=s.find(i=>i.module===u);g&&Object.entries(g).some(([i,p])=>i!=="module"&&p===!0)||u==="Notifications"||u==="Dashboard"?o.style.display="":o.style.display="none"}else(u==="Settings"||u==="Reports"||u==="Invoices")&&(o.style.display="none")}),a.querySelectorAll(".sidebar-category-container").forEach(o=>{const d=o.querySelectorAll(".sidebar-nav-item");let u=!1;d.forEach(g=>{g.style.display!=="none"&&(u=!0)}),o.style.display=u?"":"none"});const n=a.querySelector("#sidebar-nav"),r=a.querySelector("#sidebar-scroll-up"),c=a.querySelector("#sidebar-scroll-down");if(n&&r&&c&&!a.classList.contains("expanded")){const{scrollTop:o,scrollHeight:d,clientHeight:u}=n;r.classList.toggle("visible",o>0),c.classList.toggle("visible",Math.ceil(o+u)<d)}}}function wa(e){e.classList.toggle("expanded");const a=e.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",a);const t=e.querySelector("#sidebar-toggle-icon");t.textContent=a?"chevron_left":"chevron_right";const s=e.querySelector(".custom-logo"),n=e.querySelector(".logo-text");s&&(s.style.maxWidth=a?"140px":"32px"),n&&(n.style.display=a?"block":"none");const r=e.querySelector("#sidebar-nav"),c=e.querySelector("#sidebar-scroll-up"),o=e.querySelector("#sidebar-scroll-down");if(r&&c&&o)if(a)c.classList.remove("visible"),o.classList.remove("visible");else{const{scrollTop:d,scrollHeight:u,clientHeight:g}=r;c.classList.toggle("visible",d>0),o.classList.toggle("visible",Math.ceil(d+g)<u)}}function ka(e){const a=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(t=>{t.classList.toggle("active",t.dataset.path===a)})}const pa=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:$a,toggleSidebar:wa,updateSidebarAccess:ds,updateSidebarActive:ka},Symbol.toStringTag,{value:"Module"}));function Sa(){const e=document.createElement("header");e.className="topbar",e.id="topbar",e.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${Ca()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const a=e.querySelector("#global-search");let t;a.addEventListener("input",o=>{clearTimeout(t),t=setTimeout(()=>{const d=o.target.value.trim();d.length>=2?ps(d):Ot()},300)}),a.addEventListener("blur",()=>{setTimeout(Ot,200)}),e.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const d=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",d),localStorage.setItem("simpro_theme",d),e.querySelector("#theme-icon").textContent=d==="dark"?"light_mode":"dark_mode"}),us();const n=e.querySelector("#btn-notifications"),r=e.querySelector(".notification-dot");function c(){l.getAll("notifications").filter(u=>!u.read).length>0?r.style.display="block":r.style.display="none"}return l.on("notifications",c),c(),n.addEventListener("click",o=>{o.stopPropagation(),cs(n)}),Ta(e),e}function Ta(e){const a=e||document.getElementById("topbar");if(!a)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),s=a.querySelector("#topbar-name"),n=a.querySelector("#topbar-role"),r=a.querySelector("#topbar-avatar");if(s&&(s.textContent=t.name||"Unknown User"),n){let c=t.userTypeName;if(!c&&t.userTypeId){const o=l.getById("userTypes",t.userTypeId);o&&(c=o.name)}c||(c={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[t.role]||t.role),n.textContent=c}if(r){const o=(t.name||"").split(" ").map(d=>d[0]).join("").substring(0,2).toUpperCase()||"U";r.textContent=o}}function cs(e){let a=document.querySelector("#notifications-dropdown");if(a){a.remove();return}const t=l.getAll("notifications").sort((c,o)=>new Date(o.createdAt)-new Date(c.createdAt));a=document.createElement("div"),a.className="dropdown-menu",a.id="notifications-dropdown",a.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const s=document.createElement("div");s.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",s.innerHTML='<h4 style="margin:0">Notifications</h4>';const n=document.createElement("button");n.className="btn btn-ghost btn-sm",n.textContent="Mark all as read",n.onclick=()=>{const c=l.getAll("notifications");let o=!1;c.forEach(d=>{d.read||(d.read=!0,d.updatedAt=new Date().toISOString(),o=!0)}),o&&l.save("notifications",c),a.remove()},s.appendChild(n),a.appendChild(s),t.length===0?a.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':t.forEach(c=>{const o=document.createElement("div");o.className="dropdown-item",o.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${c.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,o.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${c.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${c.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(c.createdAt).toLocaleString()}</div>
        </div>
      `,o.addEventListener("click",()=>{if(l.update("notifications",c.id,{read:!0}),c.link){const{router:d}=window.__fieldForge||{};d&&d.navigate(c.link)}a.remove()}),a.appendChild(o)}),e.parentNode.style.position="relative",e.parentNode.appendChild(a);const r=c=>{!a.contains(c.target)&&c.target!==e&&!e.contains(c.target)&&(a.remove(),document.removeEventListener("click",r))};document.addEventListener("click",r)}function ps(e){Ot();const{store:a}=window.__fieldForge||{};if(!a)return;const t=[],s=e.toLowerCase();if(a.getAll("customers").forEach(r=>{(r.company.toLowerCase().includes(s)||`${r.firstName} ${r.lastName}`.toLowerCase().includes(s))&&t.push({type:"Customer",label:r.company,icon:"people",path:`/people/${r.id}`})}),a.getAll("jobs").forEach(r=>{(r.number.toLowerCase().includes(s)||r.title.toLowerCase().includes(s)||r.customerName.toLowerCase().includes(s))&&t.push({type:"Job",label:`${r.number} — ${r.title}`,icon:"build",path:`/jobs/${r.id}`})}),a.getAll("quotes").forEach(r=>{var c;(r.number.toLowerCase().includes(s)||(c=r.title)!=null&&c.toLowerCase().includes(s)||r.customerName.toLowerCase().includes(s))&&t.push({type:"Quote",label:`${r.number} — ${r.customerName}`,icon:"request_quote",path:`/quotes/${r.id}`})}),a.getAll("invoices").forEach(r=>{(r.number.toLowerCase().includes(s)||r.customerName.toLowerCase().includes(s))&&t.push({type:"Invoice",label:`${r.number} — ${r.customerName}`,icon:"receipt_long",path:`/invoices/${r.id}`})}),t.length===0)return;const n=document.createElement("div");n.className="dropdown-menu",n.id="search-results",n.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",t.slice(0,12).forEach(r=>{const c=document.createElement("button");c.className="dropdown-item",c.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${r.icon}</span>
      <span style="flex:1" class="truncate">${r.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${r.type}</span>
    `,c.addEventListener("click",()=>{const{router:o}=window.__fieldForge||{};o&&o.navigate(r.path),Ot(),document.querySelector("#global-search").value=""}),n.appendChild(c)}),document.querySelector(".topbar-search").appendChild(n)}function Ot(){const e=document.querySelector("#search-results");e&&e.remove()}function Ca(){return localStorage.getItem("simpro_theme")||"light"}function us(){Ca()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const ua=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:Sa,updateTopbarAccess:Ta},Symbol.toStringTag,{value:"Module"})),ms={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function bs(e){const a=document.getElementById("breadcrumb");if(!a)return;if(e==="/"){a.style.display="none";return}a.style.display="flex";const t=e.split("/").filter(Boolean);let s=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,n="";t.forEach((r,c)=>{n+="/"+r;const o=c===t.length-1,d=ms[n]||decodeURIComponent(r);s+='<span class="breadcrumb-separator">›</span>',o?s+=`<span class="breadcrumb-item current">${d}</span>`:s+=`<span class="breadcrumb-item" data-path="${n}">${d}</span>`}),a.innerHTML=s,a.querySelectorAll(".breadcrumb-item[data-path]").forEach(r=>{r.addEventListener("click",()=>{const{router:c}=window.__fieldForge||{};c&&c.navigate(r.dataset.path)})})}function ct(e){const a=document.getElementById("breadcrumb");if(!a)return;const t=a.querySelector(".breadcrumb-item.current");t&&(t.textContent=e)}const vs="modulepreload",fs=function(e){return"/"+e},ma={},me=function(a,t,s){let n=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),o=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));n=Promise.allSettled(t.map(d=>{if(d=fs(d),d in ma)return;ma[d]=!0;const u=d.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${g}`))return;const y=document.createElement("link");if(y.rel=u?"stylesheet":vs,u||(y.as="script"),y.crossOrigin="",y.href=d,o&&y.setAttribute("nonce",o),document.head.appendChild(y),u)return new Promise((i,p)=>{y.addEventListener("load",i),y.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${d}`)))})}))}function r(c){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=c,window.dispatchEvent(o),!o.defaultPrevented)throw c}return n.then(c=>{for(const o of c||[])o.status==="rejected"&&r(o.reason);return a().catch(r)})};function Qt(e,a){if(!e||e<=0)return 0;const t=a.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]};let s=t.defaultPercent||30;if(t.useTiers&&t.tiers&&t.tiers.length>0){const c=t.tiers.find(o=>o.upTo===null||e<=o.upTo);c&&(s=c.percent)}const n=e*(s/100),r=Math.max(n,t.minMarkupAmount||0);return e+r}function Ia(e,a){return e.reduce((t,s)=>{const n=Qt(s.unitCost||0,a);return t+n*(s.quantity||1)},0)}function Kt(){const e=Le("Jobs","create"),a=Le("Quotes","create");let t="";return e&&(t+=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>`),a&&(t+=`
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`),t}let nt=!1;const Ct={S:"module-s",M:"module-m",L:"module-l",XL:"module-l"},It={standard:"",tall:"module-tall",xtall:"module-xtall"};function Bt(){const e=JSON.parse(localStorage.getItem("currentUser")||"null");return e?`dashboardLayout_v3_${e.id}`:"dashboardLayout_v3"}const Vt={"kpi-cards":{title:"KPI Cards",defaultW:"L",defaultH:"standard",widths:["M","L"],heights:["standard"],kpiStrip:!0,render:xs},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:$s},"tech-map":{title:"Technician Map",defaultW:"S",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:ws},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:ks},"recent-leads":{title:"Recent Leads",defaultW:"S",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Ss},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Ts},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:Is},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>We("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>We("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>We("inventory","Inventory looks good")},"profitability-chart":{title:"Projected Profitability",defaultW:"L",defaultH:"tall",widths:["L"],heights:["tall","xtall"],render:Es},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>We("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>We("schedule","No timesheet alerts")},"asset-status":{title:"Asset Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>We("precision_manufacturing","All assets operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>We("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>We("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>We("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>We("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>We("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"S",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>We("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>We("wb_sunny","Sunny, 24°C")}},Ea=[{id:"kpi-cards",w:"L",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"cash-flow",w:"S",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-leads",w:"S",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"S",h:"tall"}];function We(e,a){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${e}</span>
    <span style="font-size:13px;">${a}</span>
  </div>`}function gs(e){let a=JSON.parse(JSON.stringify(Ea));try{const n=localStorage.getItem(Bt());n&&(a=JSON.parse(n))}catch{}a.forEach(n=>{n.instanceId||(n.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const t={jobs:l.getAll("jobs"),quotes:l.getAll("quotes"),invoices:l.getAll("invoices"),leads:l.getAll("leads"),people:l.getAll("people")};e.innerHTML=`
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          ${Kt()}
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;const s=e.querySelector("#dashboard-grid");ut(s,a,t),e.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{nt=!0,ut(s,a,t),hs(e,s,a,t)})}function ut(e,a,t){e.innerHTML="",a.forEach(s=>{const n=Vt[s.id];if(!n)return;const r=Ct[s.w]||"module-m",c=It[s.h]||"",o=["dashboard-module",r,c,nt?"edit-mode":""].filter(Boolean).join(" "),d=n.widths.length>1,u=n.heights.length>1,g=nt?`
      ${d?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${u?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${d&&u?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",y=`
      <div style="display:flex;align-items:center;gap:4px;">
        ${n.configurable?`
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${s.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;${nt?"":"opacity:0.5;"}">settings</span>
          </button>
        `:""}
        ${nt?`
          <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${s.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">close</span>
          </button>
        `:""}
      </div>`,i=nt?"background:rgba(27,109,224,0.04);":"";e.insertAdjacentHTML("beforeend",`
      <div class="${o}" data-instance-id="${s.instanceId}" data-id="${s.id}" style="position:relative;">
        <div class="card ${n.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${i}">
            <span style="font-weight:600;font-size:14px;">${n.title}</span>
            ${y}
          </div>
          <div class="card-body">${n.render(t,s)}</div>
        </div>
        ${g}
      </div>`)}),ys(e,a,t),nt&&Xt(e,a,t)}function ys(e,a,t){e.querySelectorAll(".btn-configure").forEach(s=>{s.addEventListener("click",n=>{const r=n.currentTarget.dataset.instanceId,c=a.find(d=>d.instanceId===r);if(c&&c.id==="pinned-job"){let g=function(y=""){const i=u.querySelector("#job-list-container"),p=d.filter(m=>m.number.toLowerCase().includes(y.toLowerCase())||m.title.toLowerCase().includes(y.toLowerCase())||m.customerName.toLowerCase().includes(y.toLowerCase()));i.innerHTML=p.length>0?p.map(m=>`
            <div class="job-option" data-job-id="${m.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${m.number} - ${m.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${m.customerName}</div>
            </div>
          `).join(""):'<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>',i.querySelectorAll(".job-option").forEach(m=>{m.addEventListener("click",()=>{var h;c.config={...c.config,jobId:m.dataset.jobId},nt||localStorage.setItem(Bt(),JSON.stringify(a)),(h=document.querySelector(".modal-overlay"))==null||h.remove(),ut(e,a,t)})})};var o=g;const d=t.jobs,u=document.createElement("div");u.innerHTML=`
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..." 
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            <!-- Jobs will be rendered here -->
          </div>
        `,g(),u.querySelector("#job-search").addEventListener("input",y=>{g(y.target.value)}),me(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Re);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:"Select Job to Pin",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()}]})})}})})}function Xt(e,a,t){e.querySelectorAll(".btn-remove").forEach(s=>{s.addEventListener("click",n=>{const r=n.currentTarget.dataset.instanceId,c=a.findIndex(o=>o.instanceId===r);c!==-1&&(a.splice(c,1),ut(e,a,t))})}),window.Sortable&&!e.sortableInstance&&(e.sortableInstance=new window.Sortable(e,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const s=Array.from(e.children).map(r=>r.dataset.instanceId),n=[];s.forEach(r=>{const c=a.find(o=>o.instanceId===r);c&&n.push(c)}),a.splice(0,a.length,...n)}})),e.sortableInstance&&e.sortableInstance.option("disabled",!1),e.querySelectorAll(".resize-handle").forEach(s=>{s.addEventListener("mousedown",n=>{n.preventDefault(),n.stopPropagation();const r=n.target.closest(".dashboard-module"),c=r.dataset.instanceId,o=a.find(k=>k.instanceId===c),d=Vt[o==null?void 0:o.id];if(!o||!d)return;const u=n.target.closest(".resize-handle"),g=u&&(u.classList.contains("resize-r")||u.classList.contains("resize-br")),y=u&&(u.classList.contains("resize-b")||u.classList.contains("resize-br"));let i=n.clientX,p=n.clientY,m=0,h=0;const b=60,w=["S","M","L","XL"].filter(k=>d.widths.includes(k)),I=["standard","tall","xtall"].filter(k=>d.heights.includes(k));function x(k){if(g){if(m+=k.clientX-i,m>b){let S=w.indexOf(o.w);S<w.length-1&&(o.w=w[S+1],r.className=["dashboard-module",Ct[o.w]||"module-m",It[o.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}else if(m<-b){let S=w.indexOf(o.w);S>0&&(o.w=w[S-1],r.className=["dashboard-module",Ct[o.w]||"module-m",It[o.h]||"","edit-mode"].filter(Boolean).join(" ")),m=0}}if(y){if(h+=k.clientY-p,h>b){let S=I.indexOf(o.h);S<I.length-1&&(o.h=I[S+1],r.className=["dashboard-module",Ct[o.w]||"module-m",It[o.h]||"","edit-mode"].filter(Boolean).join(" ")),h=0}else if(h<-b){let S=I.indexOf(o.h);S>0&&(o.h=I[S-1],r.className=["dashboard-module",Ct[o.w]||"module-m",It[o.h]||"","edit-mode"].filter(Boolean).join(" ")),h=0}}i=k.clientX,p=k.clientY}function E(){document.removeEventListener("mousemove",x),document.removeEventListener("mouseup",E),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",x),document.addEventListener("mouseup",E),document.body.style.cursor=window.getComputedStyle(n.target).cursor,document.body.style.userSelect="none"})})}function hs(e,a,t,s){const n=e.querySelector("#dashboard-header-actions"),r=e.querySelector("#btn-edit-dashboard");r.style.display="none",n.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,n.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(t.splice(0,t.length,...JSON.parse(JSON.stringify(Ea))),ut(a,t,s),Xt(a,t,s))}),n.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(Bt(),JSON.stringify(t)),nt=!1,a.sortableInstance&&a.sortableInstance.option("disabled",!0),r.style.display="",n.innerHTML=Kt(),ut(a,t,s)}),n.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const c=localStorage.getItem(Bt());c&&t.splice(0,t.length,...JSON.parse(c))}catch{}nt=!1,a.sortableInstance&&a.sortableInstance.option("disabled",!0),r.style.display="",n.innerHTML=Kt(),ut(a,t,s)}),n.querySelector("#btn-add-widget").addEventListener("click",()=>{const c=Object.entries(Vt),o=document.createElement("div");o.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${c.map(([d,u])=>`
            <div data-id="${d}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${u.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${u.defaultW} · ${u.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,me(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Re);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:"Add Widget",content:o,actions:[{label:"Close",className:"btn-secondary",onClick:u=>u()}]}),o.querySelectorAll("[data-id]").forEach(u=>{u.addEventListener("click",g=>{var p;const y=g.currentTarget.dataset.id,i=Vt[y];t.push({id:y,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:i.defaultW,h:i.defaultH}),(p=document.querySelector(".modal-overlay"))==null||p.remove(),ut(a,t,s),Xt(a,t,s)})})})})}function xs(e,a){const t=e.jobs.filter(c=>c.status==="In Progress"||c.status==="Scheduled").length,s=e.quotes.filter(c=>c.status==="Sent"||c.status==="Draft").length,n=e.invoices.filter(c=>c.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+e.invoices.filter(c=>c.status==="Paid").reduce((c,o)=>c+(o.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:t,icon:"build",color:"green",sub:`${e.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:s,icon:"request_quote",color:"orange",sub:`${e.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:n,icon:"warning",color:"red",sub:n>0?"Requires attention":"All on track",pos:n===0}].map(c=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${c.label}</div>
        <div class="stat-icon ${c.color}"><span class="material-icons-outlined">${c.icon}</span></div>
      </div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-change ${c.pos===!0?"positive":c.pos===!1?"negative":""}">
        <span style="font-size:12px;">${c.sub}</span>
      </div>
    </div>`).join("")}function $s(e,a){const t={};e.jobs.forEach(r=>{t[r.status]=(t[r.status]||0)+1});const s=e.jobs.length||1,n={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(t).map(([r,c])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${r}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(c/s*100).toFixed(1)}%;height:100%;background:${n[r]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${c>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${c}</span>
      </div>`).join("")}
  </div>`}function ws(e,a){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${e.people.filter(n=>n.type==="Staff").slice(0,4).map((n,r)=>{const c=15+r*22+Math.sin(r)*12,o=15+r*18+Math.cos(r)*18;return`<div style="position:absolute;top:${c}%;left:${o}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${n.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${n.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function ks(e,a){const t=[];return e.jobs.slice(0,4).forEach(s=>t.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${s.number}</strong> — ${s.title}`,sub:s.customerName,time:s.updatedAt})),e.quotes.slice(0,3).forEach(s=>t.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${s.number}</strong> ${s.status.toLowerCase()}`,sub:s.customerName,time:s.updatedAt})),e.invoices.slice(0,2).forEach(s=>t.push({icon:"receipt_long",color:s.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${s.number}</strong> — ${s.status}`,sub:s.customerName,time:s.updatedAt})),t.sort((s,n)=>new Date(n.time)-new Date(s.time)),t.map(s=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${s.color}20;color:${s.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${s.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${s.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${s.sub} · ${Cs(s.time)}</div>
      </div>
    </div>`).join("")}function Ss(e,a){const t={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${e.leads.slice(0,8).map(s=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${s.id}'">
        <td class="cell-link font-medium">${s.title}</td>
        <td style="color:var(--text-secondary);">${s.customerName}</td>
        <td><span class="badge ${t[s.status]||"badge-neutral"}">${s.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function Ts(e,a){const t=e.jobs.filter(s=>s.status==="Scheduled"||s.status==="In Progress").slice(0,8);return t.length?t.map(s=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${s.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${s.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${s.technicianName} · ${s.customerName}</div>
      </div>
      <span class="badge ${s.status==="In Progress"?"badge-primary":"badge-warning"}">${s.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function Cs(e){const a=Math.floor((Date.now()-new Date(e))/6e4);if(a<60)return`${a}m ago`;const t=Math.floor(a/60);return t<24?`${t}h ago`:`${Math.floor(t/24)}d ago`}function Is(e,a){var u;const t=(u=a.config)==null?void 0:u.jobId;if(!t)return We("push_pin","Click settings to pin a job");const s=e.jobs.find(g=>g.id===t);if(!s)return We("warning","Job not found");function n(g,y=0){let i=[];return g&&g.forEach(p=>{const m=p.subTasks&&p.subTasks.length>0||p.subPhases&&p.subPhases.length>0;i.push({...p,depth:y,isParent:m}),m&&(i=i.concat(n(p.subTasks||p.subPhases,y+1)))}),i}const r=s.tasks||s.phases||[],c=n(r),o=c.length;let d=0;if(r.length>0){const g=r.reduce((y,i)=>y+(i.progress||0),0);d=Math.round(g/r.length)}return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${s.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${d}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${d}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${o>0?c.map(g=>{const y=g.progress===100;return`
          <div style="display:flex;align-items:center;gap:8px;padding-left:${g.depth*14}px; opacity:${!g.isParent&&y?.6:1}">
            ${g.isParent?'<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>':`<span class="material-icons-outlined" style="font-size:16px;color:${y?"var(--color-success)":"var(--text-tertiary)"};">
                ${y?"check_circle":"radio_button_unchecked"}
              </span>`}
            <span style="font-size:12px;font-weight:${g.isParent?"700":"400"};text-decoration:${!g.isParent&&y?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${g.isParent?"var(--text-primary)":"var(--text-secondary)"};">
              ${g.name}
            </span>
            ${g.isParent?`<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);">${g.progress}%</span>`:""}
          </div>`}).join(""):'<div style="font-size:12px;color:var(--text-tertiary);text-align:center;padding:10px;">No tasks assigned</div>'}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-primary);padding:8px;border-radius:6px;border:1px dashed var(--border-color);">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:12px;color:var(--text-primary);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${s.customerName}</div>
        </div>
        <button class="btn btn-ghost btn-icon btn-sm" onclick="window.location.hash='/jobs/${s.id}'" title="View Job Details" style="margin-left:8px;">
          <span class="material-icons-outlined" style="font-size:18px;color:var(--color-primary);">open_in_new</span>
        </button>
      </div>
    </div>
  `}function Es(e,a){const t=l.getSettings(),s=e.jobs.filter(d=>d.status!=="Invoiced"&&d.status!=="Archived");let n=0,r=0;s.forEach(d=>{const u=(d.materials||[]).reduce((h,b)=>h+b.quantity*(b.unitCost||0),0),g=d.laborCost||0;n+=u+g;const y=Ia(d.materials||[],t),i=t.laborRates.find(h=>h.id===d.laborRateProfileId)||t.laborRates.find(h=>h.isDefault),p=d.estimatedHours||0,m=Math.max(p*((i==null?void 0:i.rate)||85),(i==null?void 0:i.minCallOutFee)||0);r+=y+m});const c=r-n,o=r>0?c/r*100:0;return`
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${r.toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
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
            <span style="font-weight:500;">$${n.toLocaleString()}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px;">
            <div style="width:10px; height:10px; border-radius:2px; background:var(--color-success);"></div>
            <span style="color:var(--text-secondary); flex:1;">Tiered Markup (Proj. Profit)</span>
            <span style="font-weight:500;">$${c.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${s.length} active jobs using tiered material markups.
      </div>
    </div>
  `}function v(e){return e==null?"":String(e).replace(/[&<>"']/g,function(t){switch(t){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return t}})}function Xe({columns:e,data:a,onRowClick:t,getId:s,emptyMessage:n="No records found",emptyIcon:r="inbox",selectable:c=!1,onSelectionChange:o=null}){const d=document.createElement("div");d.className="card";let u=null,g="asc",y=1;const i=15,p=new Set;function m(){o&&o(Array.from(p))}function h(){let b=[...a];u&&b.sort((k,S)=>{const D=u.getValue?u.getValue(k):k[u.key],M=u.getValue?u.getValue(S):S[u.key];return D==null?1:M==null?-1:typeof D=="string"?g==="asc"?D.localeCompare(M):M.localeCompare(D):g==="asc"?D-M:M-D});const w=Math.ceil(b.length/i);y>w&&(y=w||1);const I=(y-1)*i,x=b.slice(I,I+i);if(a.length===0){d.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${v(r)}</span>
          <h3>${v(n)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let E='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(c){const k=x.length>0&&x.every(S=>p.has(String(s?s(S):S.id)));E+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${k?"checked":""}></th>`}if(e.forEach(k=>{const S=u&&u.key===k.key,D=S?" sorted":"",M=S?g==="asc"?"arrow_upward":"arrow_downward":"unfold_more";E+=`<th class="${D}" data-key="${k.key}" style="${k.width?"width:"+k.width:""}">
        ${v(k.label)}
        <span class="material-icons-outlined sort-icon">${M}</span>
      </th>`}),E+="</tr></thead><tbody>",x.forEach(k=>{const S=String(s?s(k):k.id),D=p.has(S);E+=`<tr data-id="${v(S)}" style="cursor:pointer" class="${D?"selected-row":""}">`,c&&(E+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${v(S)}" ${D?"checked":""}>
        </td>`),e.forEach(M=>{const N=M.render?M.render(k):v(k[M.key]??"");E+=`<td>${N}</td>`}),E+="</tr>"}),E+="</tbody></table></div>",w>1){E+=`<div class="pagination">
        <span class="pagination-info">Showing ${I+1}–${Math.min(I+i,b.length)} of ${b.length}</span>
        <div class="pagination-controls">
          <button ${y===1?"disabled":""} data-page="prev">‹</button>`;for(let k=1;k<=w;k++){if(w>7&&k>2&&k<w-1&&Math.abs(k-y)>1){(k===3||k===w-2)&&(E+="<button disabled>…</button>");continue}E+=`<button class="${k===y?"page-active":""}" data-page="${k}">${k}</button>`}E+=`<button ${y===w?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(d.innerHTML=E,d.querySelectorAll("th[data-key]").forEach(k=>{k.addEventListener("click",()=>{const S=e.find(D=>D.key===k.dataset.key);u===S?g=g==="asc"?"desc":"asc":(u=S,g="asc"),h()})}),t&&d.querySelectorAll("tbody tr[data-id]").forEach(k=>{k.addEventListener("click",S=>{S.target.closest(".dt-select-cell")||t(k.dataset.id)})}),c){d.querySelectorAll(".dt-select-row").forEach(S=>{S.addEventListener("change",D=>{D.target.checked?p.add(D.target.value):p.delete(D.target.value),m(),h()})});const k=d.querySelector(".dt-select-all");k&&k.addEventListener("change",S=>{const D=S.target.checked;x.forEach(M=>{const N=String(s?s(M):M.id);D?p.add(N):p.delete(N)}),m(),h()})}d.querySelectorAll(".pagination-controls button[data-page]").forEach(k=>{k.addEventListener("click",()=>{const S=k.dataset.page;S==="prev"?y--:S==="next"?y++:y=parseInt(S),h()})})}return h(),d.updateData=b=>{a=b,h()},d.clearSelection=()=>{p.clear(),m(),h()},d}let ft=null;function Ls(){return(!ft||!document.body.contains(ft))&&(ft=document.createElement("div"),ft.className="toast-container",ft.id="toast-container",document.body.appendChild(ft)),ft}function O(e,a="info",t=3500){const s=Ls(),n=document.createElement("div");n.className=`toast ${a}`;const r={success:"check_circle",error:"error",warning:"warning",info:"info"};n.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${a==="error"?"danger":a})">${r[a]||r.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${e}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,n.querySelector(".toast-close").addEventListener("click",()=>n.remove()),s.appendChild(n),setTimeout(()=>{n.parentNode&&(n.style.opacity="0",n.style.transform="translateX(20px)",n.style.transition="0.3s ease",setTimeout(()=>n.remove(),300))},t)}function qs(e,a,t){l.create("notifications",{title:e,message:a,link:t,read:!1}),O(`${e}: ${a}`,"info")}const qe=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:qs,showToast:O},Symbol.toStringTag,{value:"Module"}));function st({container:e,selectedIds:a,actions:t,onClear:s}){const n=e.querySelector(".bulk-action-bar");if(n&&n.remove(),!a||a.length===0)return;const r=document.createElement("div");r.className="bulk-action-bar slide-up";let c=`
    <div class="bulk-action-left">
      <span class="bulk-count">${a.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return t.forEach((o,d)=>{c+=`<button class="btn ${o.className||"btn-secondary"} btn-sm" data-action="${d}">
      ${o.icon?`<span class="material-icons-outlined" style="font-size:16px">${v(o.icon)}</span> `:""}
      ${v(o.label)}
    </button>`}),c+="</div>",r.innerHTML=c,r.querySelector("#btn-clear-selection").addEventListener("click",()=>{s&&s()}),r.querySelectorAll("button[data-action]").forEach(o=>{o.addEventListener("click",()=>{const d=o.dataset.action;t[d]&&t[d].onClick&&t[d].onClick(a)})}),e.appendChild(r),r}function Zt(e){const a=l.getAll("customers");e.innerHTML=`
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
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
        <button class="toolbar-filter" data-filter="Active">Active (${a.filter(r=>r.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${a.filter(r=>r.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let t=[...a];const n=Xe({columns:[{key:"company",label:"Company / Name",render:r=>`<span class="cell-link font-medium">${v(r.company)}</span>`},{key:"contact",label:"Contact",render:r=>`${v(r.firstName)} ${v(r.lastName)}`},{key:"email",label:"Email",render:r=>`<span class="text-secondary">${v(r.email)}</span>`},{key:"phone",label:"Phone",render:r=>`<span class="text-secondary">${v(r.phone)}</span>`},{key:"type",label:"Type",render:r=>`<span class="badge badge-neutral">${v(r.type)}</span>`},{key:"status",label:"Status",render:r=>`<span class="badge ${r.status==="Active"?"badge-success":"badge-neutral"}">${v(r.status)}</span>`}],data:t,onRowClick:r=>Y.navigate(`/people/${r}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:r=>{st({container:e,selectedIds:r,onClear:()=>n.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:c=>{const o=document.createElement("div");o.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Re);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${c.length} Customers`,content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{const g=o.querySelector("#bulk-status").value;c.forEach(y=>l.update("customers",y,{status:g})),n.clearSelection(),Zt(e),O(`Updated ${c.length} customers to ${g}`,"success"),u()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:c=>{me(async()=>{const{showModal:o}=await Promise.resolve().then(()=>Re);return{showModal:o}},void 0).then(({showModal:o})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${c.length} customers? This cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Delete",className:"btn-danger",onClick:u=>{c.forEach(g=>l.delete("customers",g)),n.clearSelection(),Zt(e),O(`Deleted ${c.length} customers`,"success"),u()}}]})})}}]})}});e.querySelector("#people-table-container").appendChild(n),e.querySelector("#btn-new-person").addEventListener("click",()=>{Y.navigate("/people/new")}),e.querySelector("#btn-export-people").addEventListener("click",()=>{O("Customer data exported successfully","success")}),e.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),r.classList.add("active");const c=r.dataset.filter;t=c==="all"?[...a]:a.filter(o=>o.status===c),n.updateData(t)})}),e.querySelector("#people-search").addEventListener("input",r=>{var d;const c=r.target.value.toLowerCase();t=a.filter(u=>u.company.toLowerCase().includes(c)||`${u.firstName} ${u.lastName}`.toLowerCase().includes(c)||u.email.toLowerCase().includes(c));const o=(d=e.querySelector(".toolbar-filter.active"))==null?void 0:d.dataset.filter;o&&o!=="all"&&(t=t.filter(u=>u.status===o)),n.updateData(t)})}function $e({title:e,content:a,size:t="",onClose:s,actions:n=[]}){const r=document.createElement("div");r.className="modal-overlay",r.id="modal-overlay";const c=document.createElement("div");c.className=`modal ${t}`;let o=`
    <div class="modal-header">
      <h3>${v(e)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof a=="string"?v(a):""}</div>
  `;n.length&&(o+='<div class="modal-footer">',n.forEach((g,y)=>{o+=`<button class="btn ${g.className||"btn-secondary"}" id="modal-action-${y}">${v(g.label)}</button>`}),o+="</div>"),c.innerHTML=o,typeof a!="string"&&(a instanceof HTMLElement||a instanceof DocumentFragment)&&(c.querySelector(".modal-body").innerHTML="",c.querySelector(".modal-body").appendChild(a)),r.appendChild(c),document.body.appendChild(r);const d=()=>{r.remove(),s&&s()};c.querySelector("#modal-close-btn").addEventListener("click",d),r.addEventListener("click",g=>{g.target===r&&d()}),n.forEach((g,y)=>{const i=c.querySelector(`#modal-action-${y}`);i&&g.onClick&&i.addEventListener("click",()=>g.onClick(d))});const u=g=>{g.key==="Escape"&&(d(),document.removeEventListener("keydown",u))};return document.addEventListener("keydown",u),{close:d,modal:c,overlay:r}}const Re=Object.freeze(Object.defineProperty({__proto__:null,showModal:$e},Symbol.toStringTag,{value:"Module"}));function mt({title:e,icon:a,iconBgColor:t="var(--color-primary-light)",iconTextColor:s="var(--color-primary)",metaHtml:n="",actionsHtml:r=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${t};color:${s}">
          <span class="material-icons-outlined">${a}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${e}</h2></div>
          ${n?`<div class="detail-header-meta">${n}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${r}
      </div>
    </div>
  `}function He({title:e,content:a,actions:t=[],width:s=400}){const n=document.querySelector(".drawer-overlay");n&&n.remove();const r=document.createElement("div");r.className="drawer-overlay";const c=document.createElement("div");c.className="drawer",c.style.width=typeof s=="number"?`${s}px`:s;const o=document.createElement("div");o.className="drawer-header",o.innerHTML=`
    <h3>${e}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const d=document.createElement("div");if(d.className="drawer-body",typeof a=="string"?d.innerHTML=a:d.appendChild(a),c.appendChild(o),c.appendChild(d),t.length>0){const g=document.createElement("div");g.className="drawer-footer",t.forEach(y=>{const i=document.createElement("button");i.className=`btn ${y.className||"btn-secondary"}`,i.innerHTML=y.label,i.onclick=()=>y.onClick(u),g.appendChild(i)}),c.appendChild(g)}r.appendChild(c),document.body.appendChild(r);function u(){c.style.animation="slideRightOut 0.2s ease forwards",r.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>r.remove(),200)}o.querySelector(".drawer-close").onclick=u,r.addEventListener("mousedown",g=>{g.target===r&&u()})}function La({customerId:e=null,site:a="",onSave:t=null}={}){const s=l.getAll("customers"),n=l.getAll("people").filter(m=>m.type==="Staff"),r=e?l.getById("customers",e):null,c=(r==null?void 0:r.sites)||[],o=document.createElement("div");o.innerHTML=`
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
            ${s.map(m=>`<option value="${m.id}" ${e===m.id?"selected":""}>${m.company||m.firstName+" "+m.lastName}</option>`).join("")}
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
            ${n.map(m=>`<option value="${m.id}">${m.firstName} ${m.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${e?"flex":"none"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${c.map(m=>`<option value="${v(m.name)}" ${a===m.name?"selected":""}>${v(m.name)}</option>`).join("")}
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
  `;const d=o.querySelector("#qa-owner-type"),u=o.querySelector("#qa-customer-group"),g=o.querySelector("#qa-business-fields"),y=o.querySelector("#qa-customer-fields"),i=o.querySelector("#qa-customer-id"),p=o.querySelector("#qa-asset-site");d.addEventListener("change",m=>{const h=m.target.value==="Customer";u.style.display=h?"block":"none",g.style.display=h?"none":"flex",y.style.display=h?"flex":"none"}),i.addEventListener("change",m=>{const h=m.target.value,b=l.getById("customers",h);b&&b.sites?p.innerHTML='<option value="">-- No specific site --</option>'+b.sites.map(w=>`<option value="${v(w.name)}">${v(w.name)}</option>`).join(""):p.innerHTML='<option value="">-- No specific site --</option>'}),$e({title:"Quick Add Asset",size:"modal-70",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create Asset",className:"btn-primary",onClick:m=>{const h=o.querySelector("#qa-asset-name").value.trim();if(!h)return O("Asset Name is required","error");const b=d.value,w=i.value;if(b==="Customer"&&!w)return O("Please select a customer","error");const I={name:h,description:o.querySelector("#qa-asset-desc").value.trim(),ownerType:b,customerId:b==="Customer"?w:null,type:o.querySelector("#qa-asset-type").value,serial:o.querySelector("#qa-asset-serial").value.trim(),status:"Active",serviceIntervalMonths:parseInt(o.querySelector("#qa-service-interval").value)||6,currentMeter:parseInt(o.querySelector("#qa-initial-meter").value)||0,meterUnit:o.querySelector("#qa-meter-unit").value,logs:[]};b==="Business"?(I.recoveryRate=parseFloat(o.querySelector("#qa-recovery-rate").value)||0,I.assignedToId=o.querySelector("#qa-assigned-to").value):(I.site=p.value,I.installDate=o.querySelector("#qa-install-date").value);const x=l.create("assets",I);O(`Asset "${h}" created successfully`,"success"),t&&t(x),m()}}]})}function ba({onSave:e}={}){const a=l.getAll("assets"),s=l.getSettings().materialCategories||["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],n=document.createElement("div");n.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${s.map(r=>`<option>${r}</option>`).join("")}
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
            ${a.map(r=>`<option>${r.name}</option>`).join("")}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `,$e({title:"Create New Catalog Item",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Save to Catalog",className:"btn-primary",onClick:r=>{const c=n.querySelector("#qs-name").value,o=parseFloat(n.querySelector("#qs-cost").value)||0;let d=parseFloat(n.querySelector("#qs-sell").value);if(!c){O("Item name is required","error");return}if(o<=0){O("Cost price is required","error");return}(isNaN(d)||d===0)&&(d=o*1.3);const u=l.create("stock",{name:c,category:n.querySelector("#qs-category").value,sku:n.querySelector("#qs-sku").value||`SKU-${Date.now().toString().slice(-4)}`,unit:n.querySelector("#qs-unit").value,reorderLevel:parseInt(n.querySelector("#qs-reorder").value)||10,costPrice:o,unitPrice:d,location:n.querySelector("#qs-location").value,quantity:0,supplier:""});O(`Stock item "${c}" created`,"success"),e&&e(u),r()}}]})}function va({id:e=null,jobId:a=null,supplierId:t=null,onSave:s=null}={}){const n=!e,r=(l.getAll("suppliers")||[]).filter(m=>m.active!==!1),c=l.getAll("jobs").filter(m=>m.status!=="Completed"&&m.status!=="Invoiced"),o=l.getAll("stock");let d=n?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],notes:"",supplierId:t||"",jobId:a||""}:l.getById("purchaseOrders",e);if(!d){O("Purchase Order not found","error");return}let u=[...d.lineItems||[]];const g=document.createElement("div");g.className="po-drawer-container";function y(){g.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${d.status!=="Draft"&&!n?"disabled":""}>
                <option value="">Select supplier...</option>
                ${r.map(m=>`<option value="${m.id}" ${d.supplierId===m.id?"selected":""}>${v(m.name)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${d.status!=="Draft"&&!n?"disabled":""}>
                <option value="">No specific job (Stock PO)</option>
                ${c.map(m=>`<option value="${m.id}" ${d.jobId===m.id?"selected":""}>#${m.number} - ${m.title}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${d.issueDate?d.issueDate.split("T")[0]:""}" ${d.status!=="Draft"&&!n?"disabled":""} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${v(d.notes||"")}" placeholder="e.g. Delivery instructions" ${d.status!=="Draft"&&!n?"disabled":""} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${n?"":`(${v(d.number)})`}</h4>
            ${d.status==="Draft"||n?`
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
                ${u.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>':u.map((m,h)=>`
                  <tr data-idx="${h}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${v(m.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${h}" ${d.status!=="Draft"&&!n?"disabled":""} />
                       <datalist id="stock-list-${h}">
                          ${o.map(b=>`<option value="${v(b.name)}">${v(b.name)} - $${(b.costPrice||0).toFixed(2)}</option>`).join("")}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${m.qty||m.quantity}" min="1" style="width:100%" ${d.status!=="Draft"&&!n?"disabled":""} /></td>
                    <td><input type="number" class="form-input item-cost" value="${m.cost||m.unitCost}" step="0.01" style="width:100%" ${d.status!=="Draft"&&!n?"disabled":""} /></td>
                    <td style="text-align:right; font-weight:600">$${((m.qty||m.quantity||0)*(m.cost||m.unitCost||0)).toFixed(2)}</td>
                    <td>${d.status==="Draft"||n?'<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>':""}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${u.reduce((m,h)=>m+(h.qty||h.quantity||0)*(h.cost||h.unitCost||0),0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,i()}function i(){var m,h;(m=g.querySelector("#btn-add-stock-new"))==null||m.addEventListener("click",()=>{ba({onSave:b=>{u.push({description:b.name,qty:1,cost:b.costPrice||0,stockId:b.id}),y()}})}),(h=g.querySelector("#btn-browse-stock"))==null||h.addEventListener("click",()=>{var w;const b=document.createElement("div");b.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${o.map(I=>`
            <div class="stock-pick-item" data-id="${I.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${v(I.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${I.sku||"N/A"} — Cost: $${(I.costPrice||0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join("")}
        </div>
      `,$e({title:"Select Stock",content:b,actions:[{label:"Close",className:"btn-secondary",onClick:I=>I()}]}),(w=b.querySelector("#btn-po-new-stock"))==null||w.addEventListener("click",()=>{ba({onSave:I=>{var x;u.push({description:I.name,qty:1,cost:I.costPrice||0,stockId:I.id}),y(),(x=document.querySelector(".modal-overlay"))==null||x.remove()}})}),b.querySelectorAll(".stock-pick-item").forEach(I=>{I.addEventListener("click",()=>{const x=o.find(E=>E.id===I.dataset.id);x&&(u.push({description:x.name,qty:1,cost:x.costPrice||0,stockId:x.id}),y(),O(`Added ${x.name}`,"success"))})})}),g.querySelectorAll("#po-items-body tr").forEach(b=>{var k;const w=parseInt(b.dataset.idx),I=b.querySelector(".item-desc"),x=b.querySelector(".item-qty"),E=b.querySelector(".item-cost");I==null||I.addEventListener("change",S=>{const D=S.target.value,M=o.find(N=>N.name===D);M?(u[w].description=M.name,u[w].cost=M.costPrice||0,u[w].stockId=M.id):u[w].description=D,y()}),x==null||x.addEventListener("input",()=>{const S=parseFloat(x.value)||0;u[w].qty=S,u[w].quantity=S}),E==null||E.addEventListener("input",()=>{const S=parseFloat(E.value)||0;u[w].cost=S,u[w].unitCost=S}),(k=b.querySelector(".btn-remove-item"))==null||k.addEventListener("click",()=>{u.splice(w,1),y()})})}y();const p=[{label:"Cancel",className:"btn-secondary",onClick:m=>m()}];n||d.status==="Draft"?p.push({label:n?"Create & Issue PO":"Update & Issue PO",className:"btn-primary",onClick:m=>{const h=g.querySelector("#qa-po-supplier").value,b=g.querySelector("#qa-po-job").value;if(!h){O("Supplier is required","error");return}if(u.length===0){O("Please add at least one item","error");return}const w=r.find(E=>E.id===h),I=c.find(E=>E.id===b),x={number:d.number||`PO-${Date.now().toString().slice(-6)}`,supplierId:h,supplierName:(w==null?void 0:w.name)||(w==null?void 0:w.company)||"Unknown",jobId:b||null,jobNumber:(I==null?void 0:I.number)||"",issueDate:g.querySelector("#qa-po-date").value,notes:g.querySelector("#qa-po-notes").value,total:u.reduce((E,k)=>E+(k.qty||k.quantity||0)*(k.cost||k.unitCost||0),0),status:"Issued",lineItems:u};n?l.create("purchaseOrders",x):l.update("purchaseOrders",e,x),O(`Purchase Order ${x.number} issued`,"success"),s&&s(),m()}}):d.status==="Issued"&&p.push({label:"Mark as Received",className:"btn-success",onClick:m=>{const h=l.getAll("technicians"),b=l.getAll("assets"),w=document.createElement("div");w.innerHTML=`
           <div class="form-group">
             <label class="form-label">Receive into Location *</label>
             <select class="form-select" id="receive-location-select" required>
               <option value="Main Warehouse">Main Warehouse</option>
               <optgroup label="Warehouses">
                 <option value="Warehouse A">Warehouse A</option>
                 <option value="Warehouse B">Warehouse B</option>
               </optgroup>
               <optgroup label="Vehicles">
                 ${h.map(I=>`<option value="Vehicle - ${v(I.name)}">Vehicle - ${v(I.name)}</option>`).join("")}
               </optgroup>
               <optgroup label="Assets">
                 ${b.map(I=>`<option value="${v(I.name)}">${v(I.name)}</option>`).join("")}
               </optgroup>
             </select>
           </div>
         `,$e({title:"Receive Purchase Order",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Receive Items",className:"btn-success",onClick:I=>{const x=w.querySelector("#receive-location-select").value;if(!x){O("Please select a valid location","error");return}let E=0;const k=l.getAll("stock");u.forEach(S=>{var M;const D=S.stockId;if(D){const N=k.find($=>$.id===D);if(N){N.locations||(N.locations=[]);let $=N.locations.find(T=>T.location===x);const f=parseFloat(S.qty||S.quantity)||0;$?$.quantity+=f:N.locations.push({location:x,quantity:f}),N.quantity=N.locations.reduce((T,C)=>T+C.quantity,0),N.location=((M=N.locations[0])==null?void 0:M.location)||"Main Warehouse",N.updatedAt=new Date().toISOString(),E++}}}),E>0&&l.save("stock",k),l.update("purchaseOrders",e,{status:"Received",receivedDate:new Date().toISOString()}),O(`Received ${E} items into ${x}`,"success"),I(),s&&s(),m()}}]})}}),He({title:n?"New Purchase Order":"Manage Purchase Order",content:g,width:750,actions:p})}function As(e,{id:a}){const t=l.getById("customers",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}ct(t.company);const s=l.getAll("jobs").filter(u=>u.customerId===a),n=l.getAll("quotes").filter(u=>u.customerId===a),r=l.getAll("invoices").filter(u=>u.customerId===a);let c="details";function o(){e.innerHTML=`
      ${mt({title:v(t.company),icon:t.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${v(t.firstName)} ${v(t.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${v(t.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${v(t.phone)}</span>
          <span class="badge ${t.status==="Active"?"badge-success":"badge-neutral"}">${v(t.status)}</span>
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
        <button class="tab ${c==="assets"?"active":""}" data-tab="assets">Assets (${l.getAll("assets").filter(u=>u.ownerType==="Customer"&&u.customerId===a).length})</button>
        <button class="tab ${c==="communications"?"active":""}" data-tab="communications">Communications (${(t.communications||[]).length})</button>
        <button class="tab ${c==="jobs"?"active":""}" data-tab="jobs">Jobs (${s.length})</button>
        <button class="tab ${c==="quotes"?"active":""}" data-tab="quotes">Quotes (${n.length})</button>
        <button class="tab ${c==="invoices"?"active":""}" data-tab="invoices">Invoices (${r.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,d(),e.querySelectorAll(".tab").forEach(u=>{u.addEventListener("click",()=>{c=u.dataset.tab,e.querySelectorAll(".tab").forEach(g=>g.classList.remove("active")),u.classList.add("active"),d()})}),e.querySelector("#btn-edit-person").addEventListener("click",()=>{Y.navigate(`/people/${a}/edit`)}),e.querySelector("#btn-delete-person").addEventListener("click",()=>{const u=document.createElement("div");u.innerHTML=`<p>Are you sure you want to delete <strong>${v(t.company)}</strong>? This action cannot be undone.</p>`,$e({title:"Delete Customer",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Delete",className:"btn-danger",onClick:g=>{l.delete("customers",a),O("Customer deleted successfully","success"),g(),Y.navigate("/people")}}]})})}function d(){const u=e.querySelector("#tab-content");if(c==="details")u.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Ze("Company",t.company)}
                  ${Ze("Contact",`${t.firstName} ${t.lastName}`)}
                  ${Ze("Email",t.email)}
                  ${Ze("Phone",t.phone)}
                  ${Ze("Type",t.type)}
                  ${Ze("Status",t.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Ze("Address",t.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Ze("Created",new Date(t.createdAt).toLocaleDateString())}
                  ${Ze("Last Updated",new Date(t.updatedAt).toLocaleDateString())}
                  ${Ze("Total Jobs",s.length)}
                  ${Ze("Total Quotes",n.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(c==="contacts"){const g=t.contacts||[];u.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${g.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${g.map((y,i)=>`
                  <tr>
                    <td class="font-medium">${v(y.name)}</td>
                    <td>${v(y.role||"—")}</td>
                    <td><a href="mailto:${v(y.email)}" class="cell-link">${v(y.email)}</a></td>
                    <td><a href="tel:${v(y.phone)}" class="cell-link">${v(y.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${g.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,u.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,He({title:"Add Contact",content:y.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const p=document.querySelector(".drawer-overlay"),m=p.querySelector("#new-c-name").value.trim();if(!m)return O("Name is required","error");t.contacts||(t.contacts=[]),t.contacts.push({name:m,role:p.querySelector("#new-c-role").value,email:p.querySelector("#new-c-email").value,phone:p.querySelector("#new-c-phone").value}),l.update("customers",a,{contacts:t.contacts}),O("Contact added","success"),d(),o(),i()}}]})}),u.querySelectorAll(".btn-delete-contact").forEach(y=>{y.addEventListener("click",()=>{t.contacts.splice(y.dataset.index,1),l.update("customers",a,{contacts:t.contacts}),O("Contact deleted","success"),d(),o()})})}else if(c==="sites"){const g=t.sites||[];u.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${g.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${g.map((y,i)=>`
                  <tr>
                    <td class="font-medium">${v(y.name)}</td>
                    <td>${v(y.address)}</td>
                    <td class="text-secondary">${v(y.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${g.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,u.querySelector("#btn-toggle-site").addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,He({title:"Add Site",content:y.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const p=document.querySelector(".drawer-overlay"),m=p.querySelector("#new-s-name").value.trim(),h=p.querySelector("#new-s-address").value.trim();if(!m||!h)return O("Name and Address are required","error");t.sites||(t.sites=[]),t.sites.push({name:m,address:h,notes:p.querySelector("#new-s-notes").value}),l.update("customers",a,{sites:t.sites}),O("Site added","success"),d(),o(),i()}}]})}),u.querySelectorAll(".btn-delete-site").forEach(y=>{y.addEventListener("click",()=>{t.sites.splice(y.dataset.index,1),l.update("customers",a,{sites:t.sites}),O("Site deleted","success"),d(),o()})})}else if(c==="assets"){t.assets&&t.assets.length>0&&(t.assets.forEach(y=>{l.create("assets",{name:y.name,serial:y.serial,site:y.site,installDate:y.installDate,ownerType:"Customer",customerId:a,status:"Active",type:"Equipment"})}),t.assets=[],l.update("customers",a,{assets:[]}));const g=l.getAll("assets").filter(y=>y.ownerType==="Customer"&&y.customerId===a);t.sites,u.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${g.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${g.map((y,i)=>`
                  <tr>
                    <td class="font-medium">${v(y.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${v(y.serial||"—")}</td>
                    <td>${v(y.site||"—")}</td>
                    <td>${y.installDate?new Date(y.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${g.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,u.querySelector("#btn-toggle-asset").addEventListener("click",()=>{La({customerId:a,onSave:()=>{d(),o()}})}),u.querySelectorAll(".btn-delete-asset").forEach(y=>{y.addEventListener("click",()=>{const i=y.dataset.id;l.delete("assets",i),O("Asset disabled/deleted","success"),d(),o()})})}else if(c==="communications"){const y=[...t.communications||[]].sort((i,p)=>new Date(p.date)-new Date(i.date));u.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${y.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${y.map((i,p)=>`
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
      `,u.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`
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
        `,He({title:"Log Activity",content:i.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:p=>p()},{label:"Save",className:"btn-primary",onClick:p=>{const m=document.querySelector(".drawer-overlay"),h=m.querySelector("#new-comm-content").value.trim();if(!h)return O("Details are required","error");t.communications||(t.communications=[]),t.communications.push({id:Date.now().toString(),type:m.querySelector("#new-comm-type").value,date:m.querySelector("#new-comm-date").value,content:h}),l.update("customers",a,{communications:t.communications}),O("Activity logged","success"),d(),o(),p()}}]})})}else c==="jobs"?u.innerHTML=Gt(s,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):c==="quotes"?(u.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${Gt(n,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,u.querySelector("#btn-create-quote").addEventListener("click",()=>{Y.navigate("/quotes/new?customerId="+a)})):c==="invoices"&&(u.innerHTML=Gt(r,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}o()}function Ze(e,a){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${v(e)}</span>
      <span style="font-size:var(--font-size-base)">${v(a)}</span>
    </div>
  `}function Gt(e,a,t,s){if(e.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${s}</h3></div></div>`;const n=r=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[r]||"neutral"}">${v(r)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${a.map(r=>`<th>${v(r.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.map(r=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${t}/${v(r.id)}'">
                ${a.map(c=>{let o=r[c.key];return c.badge?o=n(o):c.format==="currency"?o=`$${(o||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:c.format==="date"?o=o?new Date(o).toLocaleDateString():"—":o=v(o),`<td>${o}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function qa(e,{id:a}){const t=a&&a!=="new",s=t?l.getById("customers",a):{};e.innerHTML=`
    <div class="page-header">
      <h1>${t?"Edit Customer":"New Customer"}</h1>
    </div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="person-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Company Name *</label>
              <input class="form-input" name="company" value="${s.company||""}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                <option value="Company" ${s.type==="Company"?"selected":""}>Company</option>
                <option value="Individual" ${s.type==="Individual"?"selected":""}>Individual</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input class="form-input" name="firstName" value="${s.firstName||""}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input class="form-input" name="lastName" value="${s.lastName||""}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" name="email" value="${s.email||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" name="phone" value="${s.phone||""}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" name="address" value="${s.address||""}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                <option value="Active" ${s.status==="Active"||!t?"selected":""}>Active</option>
                <option value="Inactive" ${s.status==="Inactive"?"selected":""}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${s.notes||""}</textarea>
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{Y.navigate(t?`/people/${a}`:"/people")}),e.querySelector("#btn-save").addEventListener("click",()=>{const n=e.querySelector("#person-form");if(!n.checkValidity()){n.reportValidity();return}const r=new FormData(n),c=Object.fromEntries(r);if(t)l.update("customers",a,c),O("Customer updated successfully","success"),Y.navigate(`/people/${a}`);else{const o=l.create("customers",c);O("Customer created successfully","success"),Y.navigate(`/people/${o.id}`)}})}function ea(e){const a=l.getAll("leads"),t=a.filter(h=>h.status!=="Won"&&h.status!=="Lost"),s={New:10,Contacted:30,Qualified:50,Proposal:70,Negotiation:85,Won:100,Lost:0},n=t.reduce((h,b)=>h+(b.value||0),0),r=t.reduce((h,b)=>{const w=s[b.status]||0;return h+(b.value||0)*(w/100)},0),c=a.filter(h=>h.status==="Won").length,o=a.filter(h=>h.status==="Lost").length,d=c+o,u=d>0?Math.round(c/d*100):0;e.innerHTML=`
    <div class="page-header">
      <h1>Leads</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-lead">
          <span class="material-icons-outlined">add</span> New Lead
        </button>
      </div>
    </div>

    <!-- Forecasting Dashboard Summaries -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:24px">
      <!-- Card 1: Pipeline Value -->
      <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-primary)">
        <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--color-primary-light); color:var(--color-primary); display:flex; align-items:center; justify-content:center">
            <span class="material-icons-outlined" style="font-size:24px">trending_up</span>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Total Open Pipeline</div>
            <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">$${n.toLocaleString("en-AU",{maximumFractionDigits:0})}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${t.length} active opportunities</div>
          </div>
        </div>
      </div>
      <!-- Card 2: Weighted Value -->
      <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-success)">
        <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--color-success-bg); color:var(--color-success); display:flex; align-items:center; justify-content:center">
            <span class="material-icons-outlined" style="font-size:24px">insights</span>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Weighted Sales Forecast</div>
            <div style="font-size:22px; font-weight:800; color:var(--color-success-dark); margin-top:4px">$${r.toLocaleString("en-AU",{maximumFractionDigits:0})}</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Adjusted by probability</div>
          </div>
        </div>
      </div>
      <!-- Card 3: Win Rate -->
      <div class="card" style="margin:0; box-shadow:var(--shadow-sm); border-left:4px solid var(--color-warning)">
        <div class="card-body" style="padding:16px 20px; display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; border-radius:50%; background:var(--color-warning-bg); color:var(--color-warning-dark); display:flex; align-items:center; justify-content:center">
            <span class="material-icons-outlined" style="font-size:24px">emoji_events</span>
          </div>
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Lead Conversion Rate</div>
            <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">${u}%</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${c} Won / ${o} Lost closed leads</div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
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
  `;let g=[...a];const y={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},i={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},m=Xe({columns:[{key:"title",label:"Lead",render:h=>`<span class="cell-link font-medium">${v(h.title)}</span>`},{key:"customerName",label:"Customer",render:h=>`<span class="text-secondary">${v(h.customerName)}</span>`},{key:"source",label:"Source",render:h=>`<span class="text-secondary">${v(h.source)}</span>`},{key:"status",label:"Status",render:h=>`<span class="badge ${y[h.status]||"badge-neutral"}">${v(h.status)}</span>`},{key:"likelihood",label:"Likelihood",render:h=>{const b=s[h.status]??0;let w="var(--text-tertiary)";return b>=80?w="var(--color-success)":b>=50?w="var(--color-primary)":b>=30&&(w="var(--color-warning-dark)"),`<span style="font-weight:700; color:${w}">${b}%</span>`},getValue:h=>s[h.status]||0,width:"100px"},{key:"priority",label:"Priority",render:h=>`<span class="badge ${i[h.priority]||"badge-neutral"}">${v(h.priority)}</span>`},{key:"value",label:"Value",render:h=>`<span class="font-medium">$${(h.value||0).toLocaleString()}</span>`,getValue:h=>h.value},{key:"createdAt",label:"Created",render:h=>`<span class="text-secondary">${new Date(h.createdAt).toLocaleDateString()}</span>`,getValue:h=>new Date(h.createdAt).getTime()}],data:g,onRowClick:h=>Y.navigate(`/leads/${h}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:h=>{st({container:e,selectedIds:h,onClear:()=>m.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:b=>{const w=document.createElement("div");w.innerHTML=`
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
              `,me(async()=>{const{showModal:I}=await Promise.resolve().then(()=>Re);return{showModal:I}},void 0).then(({showModal:I})=>{I({title:`Update ${b.length} Leads`,content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Apply",className:"btn-primary",onClick:x=>{const E=w.querySelector("#bulk-status").value;b.forEach(k=>l.update("leads",k,{status:E})),m.clearSelection(),ea(e),me(async()=>{const{showToast:k}=await Promise.resolve().then(()=>qe);return{showToast:k}},void 0).then(({showToast:k})=>k(`Updated ${b.length} leads to ${E}`,"success")),x()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:b=>{me(async()=>{const{showModal:w}=await Promise.resolve().then(()=>Re);return{showModal:w}},void 0).then(({showModal:w})=>{const I=document.createElement("div");I.innerHTML=`<p>Are you sure you want to delete ${b.length} leads? This action cannot be undone.</p>`,w({title:"Confirm Bulk Delete",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Delete",className:"btn-danger",onClick:x=>{b.forEach(E=>l.delete("leads",E)),m.clearSelection(),ea(e),me(async()=>{const{showToast:E}=await Promise.resolve().then(()=>qe);return{showToast:E}},void 0).then(({showToast:E})=>E(`Deleted ${b.length} leads`,"success")),x()}}]})})}}]})}});e.querySelector("#leads-table-container").appendChild(m),e.querySelector("#btn-new-lead").addEventListener("click",()=>Y.navigate("/leads/new")),e.querySelectorAll(".toolbar-filter").forEach(h=>{h.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(w=>w.classList.remove("active")),h.classList.add("active");const b=h.dataset.filter;g=b==="all"?[...a]:a.filter(w=>w.status===b),m.updateData(g)})}),e.querySelector("#leads-search").addEventListener("input",h=>{const b=h.target.value.toLowerCase();g=a.filter(w=>w.title.toLowerCase().includes(b)||w.customerName.toLowerCase().includes(b)),m.updateData(g)})}function Ds(e,{id:a}){const t=l.getById("leads",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}ct(t.title);const s={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},r={New:10,Contacted:30,Qualified:50,Proposal:70,Negotiation:85,Won:100,Lost:0}[t.status]??0,c=(t.value||0)*(r/100);function o(){e.innerHTML=`
      ${mt({title:t.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${v(t.customerName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${v(t.contactName||"—")}</span>
          <span class="badge ${s[t.status]||"badge-neutral"}">${t.status}</span>
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

      <!-- Interactive Stage Tracker -->
      <div class="pipeline-tracker" style="display:flex; border-radius:8px; overflow:hidden; background:var(--content-bg); border:1px solid var(--border-color); margin-bottom:24px; box-shadow:var(--shadow-sm)">
        ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map((u,g)=>{const y=t.status===u,i=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].indexOf(t.status)>=g;let p="transparent",m="var(--text-secondary)",h=g===6?"none":"1px solid var(--border-color)";return y?u==="Won"?(p="var(--color-success)",m="#fff"):u==="Lost"?(p="var(--color-danger)",m="#fff"):u==="Qualified"||u==="Proposal"?(p="var(--color-warning)",m="var(--color-warning-dark)"):(p="var(--color-primary)",m="#fff"):i&&t.status!=="Lost"&&u!=="Lost"&&(p="rgba(27, 109, 224, 0.05)",m="var(--color-primary-dark)"),`
            <div class="pipeline-step" data-status="${u}" style="flex:1; text-align:center; padding:14px 6px; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; background:${p}; color:${m}; border-right:${h}; cursor:pointer; transition:all 0.2s" title="Click to transition to ${u}">
              ${u}
            </div>
          `}).join("")}
      </div>

      <div class="grid-3" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:24px; align-items:stretch">
        
        <!-- Column 1: Lead Information & Contact -->
        <div style="display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%">
            <div class="card-header"><h4>Lead Qualification</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              ${et("Title",t.title)}
              ${et("Customer",t.customerName)}
              ${et("Contact Name",t.contactName||"—")}
              ${et("Lead Source",t.source||"—")}
              ${et("Priority",t.priority||"Medium")}
              ${et("Current Status",`<span class="badge ${s[t.status]||"badge-neutral"}">${t.status}</span>`)}
            </div>
          </div>
        </div>

        <!-- Column 2: Technical Scope & Financials -->
        <div style="display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%">
            <div class="card-header"><h4>Financial Scope & Contact</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              ${et("Direct Phone",t.phone?`<a href="tel:${t.phone}" style="color:var(--color-primary); font-weight:600; text-decoration:underline">${v(t.phone)}</a>`:"—")}
              ${et("Direct Email",t.email?`<a href="mailto:${t.email}" style="color:var(--color-primary); font-weight:600; text-decoration:underline">${v(t.email)}</a>`:"—")}
              <hr style="border:none; border-top:1px dashed var(--border-color); margin:4px 0" />
              ${et("Client Budget",t.budget?`<strong style="color:var(--text-primary)">$${(t.budget||0).toLocaleString()}</strong>`:"—")}
              ${et("Estimated Value",`<strong style="color:var(--color-primary-dark)">$${(t.value||0).toLocaleString()}</strong>`)}
              ${t.budget&&t.value?et("Budget Variance",`<span style="font-weight:700; color:${t.budget-t.value>=0?"var(--color-success)":"var(--color-danger)"}">$${(t.budget-t.value).toLocaleString()} (${t.budget-t.value>=0?"Under":"Over"} Budget)</span>`):""}
            </div>
          </div>
        </div>

        <!-- Column 3: Sales Forecasting Gauge -->
        <div style="display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%; border: 1px solid var(--border-color)">
            <div class="card-header"><h4>Conversion Forecast</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; text-align:center">
              <div style="position:relative; width:100px; height:100px; display:flex; align-items:center; justify-content:center">
                <!-- SVG Circle representation -->
                <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg)">
                  <circle cx="50" cy="50" r="40" stroke="var(--border-color)" stroke-width="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="${r>=80?"var(--color-success)":r>=50?"var(--color-primary)":"var(--color-warning)"}" stroke-width="8" fill="transparent" 
                          stroke-dasharray="251.2" stroke-dashoffset="${251.2-251.2*r/100}" stroke-linecap="round" />
                </svg>
                <div style="position:absolute; font-size:20px; font-weight:800; color:var(--text-primary)">${r}%</div>
              </div>
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Weighted Value Forecast</div>
                <div style="font-size:24px; font-weight:800; color:${r>=80?"var(--color-success)":"var(--text-primary)"}; margin-top:4px">$${c.toLocaleString("en-AU",{maximumFractionDigits:0})}</div>
                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Likelihood multiplier applied</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-header"><h4>Technical / Project Requirements</h4></div>
        <div class="card-body">
          <p style="color:var(--text-primary); line-height:1.6; font-size:14px; white-space:pre-wrap">${v(t.requirements||"No technical specifications or requirements provided.")}</p>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-header"><h4>Internal Notes</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary); line-height:1.6; font-size:14px; white-space:pre-wrap">${v(t.description||"No internal notes recorded.")}</p>
        </div>
      </div>
    `,d()}function d(){e.querySelector("#btn-convert-quote").addEventListener("click",()=>{const u=l.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,title:t.title,status:"Draft",sections:[{id:l.generateId(),name:"Main Scope",lineItems:[{description:`${t.title} - Scope of Work`,type:"labor",qty:1,rate:t.value||0,total:t.value||0}]}],subtotal:t.value||0,tax:(t.value||0)*.1,total:(t.value||0)*1.1,createdAt:new Date().toISOString()});l.update("leads",a,{status:"Won"}),O("Lead converted to quote successfully","success"),Y.navigate(`/quotes/${u.id}`)}),e.querySelector("#btn-edit-lead").addEventListener("click",()=>Y.navigate(`/leads/${a}/edit`)),e.querySelector("#btn-delete-lead").addEventListener("click",()=>{const u=document.createElement("div");u.innerHTML=`<p>Delete <strong>${v(t.title)}</strong>?</p>`,$e({title:"Delete Lead",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Delete",className:"btn-danger",onClick:g=>{l.delete("leads",a),O("Lead deleted","success"),g(),Y.navigate("/leads")}}]})}),e.querySelectorAll(".pipeline-step").forEach(u=>{u.addEventListener("click",()=>{var y;const g=u.dataset.status;if(t.status!==g){l.update("leads",a,{status:g}),t.status=g,O(`Status updated to ${g}`,"success"),o();const i=l.getAll("activity")||[];i.push({id:Date.now(),leadId:a,type:"lead_stage_changed",text:`Lead stage transitioned to "${g}".`,user:((y=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:y.name)||"System",timestamp:new Date().toISOString()}),l.save("activity",i)}})})}o()}function et(e,a){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${a}</span></div>`}function Aa(e,{id:a}){const t=a&&a!=="new",s=t?l.getById("leads",a):{},n=l.getAll("customers");e.innerHTML=`
    <div class="page-header"><h1>${t?"Edit Lead":"New Lead"}</h1></div>
    <div class="card" style="max-width:760px">
      <div class="card-body">
        <form id="lead-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${s.title||""}" required placeholder="e.g. Commercial Switchboard Upgrade" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" name="customerId" required id="lead-customer-select">
                <option value="">Select customer...</option>
                ${n.map(c=>`<option value="${c.id}" ${s.customerId===c.id?"selected":""}>${c.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(c=>`<option ${s.source===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input class="form-input" id="lead-phone" name="phone" value="${s.phone||""}" placeholder="e.g. 0400 123 456" />
            </div>
            <div class="form-group">
              <label class="form-label">Contact Email</label>
              <input class="form-input" id="lead-email" type="email" name="email" value="${s.email||""}" placeholder="e.g. contact@example.com" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(c=>`<option ${s.status===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(c=>`<option ${s.priority===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Client Budget ($)</label>
              <input class="form-input" type="number" name="budget" value="${s.budget||""}" step="0.01" placeholder="e.g. 15000" />
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Value ($)</label>
              <input class="form-input" type="number" name="value" value="${s.value||""}" step="0.01" placeholder="e.g. 12000" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Project Requirements</label>
            <textarea class="form-textarea" name="requirements" placeholder="Enter detailed project scope or client requirements..." style="min-height:100px">${s.requirements||""}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="description" placeholder="Internal pipeline notes...">${s.description||""}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Lead</button>
      </div>
    </div>
  `;const r=e.querySelector("#lead-customer-select");r.addEventListener("change",()=>{const c=r.value,o=n.find(d=>d.id===c);o&&(e.querySelector("#lead-phone").value=o.phone||"",e.querySelector("#lead-email").value=o.email||"")}),e.querySelector("#btn-cancel").addEventListener("click",()=>Y.navigate(t?`/leads/${a}`:"/leads")),e.querySelector("#btn-save").addEventListener("click",()=>{const c=e.querySelector("#lead-form");if(!c.checkValidity()){c.reportValidity();return}const o=Object.fromEntries(new FormData(c));o.value=parseFloat(o.value)||0,o.budget=parseFloat(o.budget)||0;const d=n.find(u=>u.id===o.customerId);if(o.customerName=(d==null?void 0:d.company)||"",o.contactName=d?`${d.firstName} ${d.lastName}`:"",t)l.update("leads",a,o),O("Lead updated","success"),Y.navigate(`/leads/${a}`);else{const u=l.create("leads",o);O("Lead created","success"),Y.navigate(`/leads/${u.id}`)}})}function Da(e){const a=l.getAll("notifications")||[];let t="",s="all";function n(){return a.filter(i=>{var b,w,I,x,E;const p=t.toLowerCase(),m=((b=i.title)==null?void 0:b.toLowerCase().includes(p))||((w=i.description)==null?void 0:w.toLowerCase().includes(p))||((I=i.createdBy)==null?void 0:I.toLowerCase().includes(p))||((x=i.type)==null?void 0:x.toLowerCase().includes(p))||((E=i.priority)==null?void 0:E.toLowerCase().includes(p)),h=s==="all"||i.status===s;return m&&h})}e.innerHTML=`
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
        <button class="toolbar-filter ${s==="all"?"active":""}" data-filter="all">All (${a.length})</button>
        <button class="toolbar-filter ${s==="Pending"?"active":""}" data-filter="Pending">Pending (${a.filter(i=>i.status==="Pending").length})</button>
        <button class="toolbar-filter ${s==="Converted"?"active":""}" data-filter="Converted">Converted (${a.filter(i=>i.status==="Converted").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${v(t)}" />
      </div>
    </div>
    
    <div id="notifications-table-container"></div>
  `;const c=Xe({columns:[{key:"createdAt",label:"Date",render:i=>i.createdAt?new Date(i.createdAt).toLocaleDateString():"—",getValue:i=>i.createdAt?new Date(i.createdAt).getTime():0,width:"100px"},{key:"type",label:"Type",render:i=>`<span class="badge badge-neutral">${v(i.type||"Field Alert")}</span>`,width:"120px"},{key:"title",label:"Title / Job Name",render:i=>`
        <div style="font-weight:500">${v(i.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v(i.description)}</div>
      `},{key:"priority",label:"Priority",render:i=>`<span class="badge ${i.priority==="Urgent"||i.priority==="High"?"badge-danger":"badge-neutral"}">${v(i.priority||"Normal")}</span>`,width:"100px"},{key:"status",label:"Status",render:i=>`<span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${v(i.status)}</span>`,width:"110px"},{key:"createdBy",label:"Raised By",width:"150px"},{key:"actions",label:"",render:i=>`
        <div style="text-align:right">
          ${i.status!=="Converted"?`
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${i.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${i.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          `:""}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${i.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${i.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,width:"150px"}],data:n(),onRowClick:i=>{const p=a.find(m=>m.id===i);p&&u(p)},emptyMessage:"No notifications found",emptyIcon:"campaign"});e.querySelector("#notifications-table-container").appendChild(c),e.querySelector("#notif-search").addEventListener("input",i=>{t=i.target.value,c.updateData(n())}),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(p=>p.classList.remove("active")),i.classList.add("active"),s=i.dataset.filter,c.updateData(n())})}),e.querySelector("#btn-raise-notification").addEventListener("click",()=>d()),c.addEventListener("click",i=>{const p=i.target.closest("button");if(!p)return;i.stopPropagation();const m=p.dataset.id;if(p.classList.contains("btn-view-notification")){const h=a.find(b=>b.id===m);h&&u(h)}else if(p.classList.contains("btn-edit-notification")){const h=a.find(b=>b.id===m);h&&d(h)}else p.classList.contains("btn-convert-quote")?g(m):p.classList.contains("btn-convert-job")&&y(m)});function d(i=null){const p=l.getAll("jobs"),m=JSON.parse(localStorage.getItem("currentUser")||"{}");He({title:i?"Edit Notification":"Raise Notification",width:450,content:`
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
              ${p.map(h=>`<option value="${h.id}" ${(i==null?void 0:i.jobId)===h.id?"selected":""}>${v(h.number)} - ${v(h.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${v((i==null?void 0:i.title)||"")}" />
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
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${v((i==null?void 0:i.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:i?"Save Changes":"Submit Notification",className:"btn-primary",onClick:h=>{const b=document.getElementById("notif-type").value,w=document.getElementById("notif-job").value,I=document.getElementById("notif-title").value.trim(),x=document.getElementById("notif-priority").value,E=document.getElementById("notif-desc").value.trim();if(!I||!E){O("Title and Description are required","error");return}i?(l.update("notifications",i.id,{type:b,jobId:w||null,title:I,priority:x,description:E}),O("Notification updated","success")):(l.create("notifications",{type:b,jobId:w||null,title:I,priority:x,description:E,status:"Pending",createdAt:new Date().toISOString(),createdBy:m.name||"Unknown"}),O("Notification raised successfully","success")),h(),Da(e)}}]})}function u(i){He({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${v(i.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${v(i.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${v(i.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${v(i.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${v(i.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${i.createdAt?new Date(i.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${i.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${i.jobId}">${v(i.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:i.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:p=>p()},{label:"Edit",className:"btn-secondary",onClick:p=>{p(),d(i)}},{label:"Convert to Quote",className:"btn-secondary",onClick:p=>{p(),g(i.id)}},{label:"Convert to Job",className:"btn-primary",onClick:p=>{p(),y(i.id)}}]:[{label:"Close",className:"btn-secondary",onClick:p=>p()}]})}function g(i){const p=l.getById("notifications",i);if(!p)return;const m=l.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:p.title,description:p.description,priority:p.priority,status:"Draft",notes:`Generated from Notification: ${p.title}

${p.description}`,createdAt:new Date().toISOString()});l.update("notifications",i,{status:"Converted",convertedTo:`Quote ${m.number}`}),O("Converted to Quote successfully","success"),Y.navigate(`/quotes/${m.id}`)}function y(i){const p=l.getById("notifications",i);if(!p)return;const m=l.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,title:p.title,description:p.description,priority:p.priority,status:"Pending",notes:`Generated from Notification: ${p.title}

${p.description}`,createdAt:new Date().toISOString()});l.update("notifications",i,{status:"Converted",convertedTo:`Job ${m.number}`}),O("Converted to Job successfully","success"),Y.navigate(`/jobs/${m.id}`)}}function ta(e){const a=l.getAll("quotes"),t=Le("Quotes","create");e.innerHTML=`
    <div class="page-header">
      <h1>Quotes</h1>
      ${t?`
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-quote"><span class="material-icons-outlined">add</span> New Quote</button>
      </div>`:""}
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
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
  `;let s=[...a];const n={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},c=Xe({columns:[{key:"number",label:"Quote #",render:d=>`<span class="cell-link font-medium">${v(d.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:d=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${v(d.title||"")}</span>`},{key:"status",label:"Status",render:d=>`<span class="badge ${n[d.status]||"badge-neutral"}">${v(d.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:d=>`<span class="font-semibold">$${(d.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:d=>d.total,width:"110px"},{key:"createdAt",label:"Date",render:d=>new Date(d.createdAt).toLocaleDateString(),getValue:d=>new Date(d.createdAt).getTime(),width:"100px"}],data:s,onRowClick:d=>Y.navigate(`/quotes/${d}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:d=>{st({container:e,selectedIds:d,onClear:()=>c.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:u=>{const g=document.createElement("div");g.innerHTML=`
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
              `,me(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Re);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:`Update ${u.length} Quotes`,content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const p=g.querySelector("#bulk-status").value;u.forEach(m=>l.update("quotes",m,{status:p})),c.clearSelection(),ta(e),me(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${u.length} quotes to ${p}`,"success")),i()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:u=>{me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Re);return{showModal:g}},void 0).then(({showModal:g})=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete ${u.length} quotes? This action cannot be undone.</p>`,g({title:"Confirm Bulk Delete",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{u.forEach(p=>l.delete("quotes",p)),c.clearSelection(),ta(e),me(async()=>{const{showToast:p}=await Promise.resolve().then(()=>qe);return{showToast:p}},void 0).then(({showToast:p})=>p(`Deleted ${u.length} quotes`,"success")),i()}}]})})}}]})}});e.querySelector("#quotes-table-container").appendChild(c);const o=e.querySelector("#btn-new-quote");o&&o.addEventListener("click",()=>Y.navigate("/quotes/new")),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(g=>g.classList.remove("active")),d.classList.add("active");const u=d.dataset.filter;s=u==="all"?[...a]:a.filter(g=>g.status===u),c.updateData(s)})}),e.querySelector("#quotes-search").addEventListener("input",d=>{const u=d.target.value.toLowerCase();s=a.filter(g=>g.number.toLowerCase().includes(u)||g.customerName.toLowerCase().includes(u)||(g.title||"").toLowerCase().includes(u)),c.updateData(s)})}function oa({type:e,data:a}){const t=document.createElement("div");t.className="modal-overlay",t.id="print-preview-overlay",t.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const s=document.createElement("div");s.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const n=document.createElement("div");n.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;";const r=e==="form"?`
    <button class="btn btn-secondary btn-sm" id="btn-export-csv" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2)">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:4px">table_view</span> CSV
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-export-json" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2)">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:4px">code</span> JSON
    </button>
  `:"";n.innerHTML=`
    <span style="font-weight:600;font-size:14px">${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} Preview — ${a.number}</span>
    <div style="display:flex;gap:8px;align-items:center">
      ${r}
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const c=document.createElement("div");c.id="print-document",c.className="print-document",c.innerHTML=fa(e,a),s.appendChild(n),s.appendChild(c),t.appendChild(s),document.body.appendChild(t);const o=()=>t.remove();n.querySelector("#btn-close-preview").addEventListener("click",o),t.addEventListener("click",u=>{u.target===t&&o()}),e==="form"&&(n.querySelector("#btn-export-csv").addEventListener("click",()=>{Na(a)}),n.querySelector("#btn-export-json").addEventListener("click",()=>{Pa(a)})),n.querySelector("#btn-print-pdf").addEventListener("click",()=>{const u=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${a.number} — ${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${Ps()}</style>
      </head>
      <body>
        ${fa(e,a)}
      </body>
      </html>
    `,g=`${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} ${a.number}`;if(!l.getAll("documents").find(m=>m.entityId===a.id&&m.name===g)){const m=`data:text/html;charset=utf-8,${encodeURIComponent(u)}`;l.create("documents",{name:g,type:e==="quote"?"Quote PDF":e==="invoice"?"Invoice PDF":"Form PDF",size:u.length,url:m,folder:e==="quote"?"Quotes":e==="invoice"?"Invoices":"Forms",uploadedAt:new Date().toISOString(),entityType:e==="quote"?"Quote":e==="invoice"?"Invoice":"Job",entityId:a.entityId||a.id,entityName:a.customerName||"Unknown Customer"}),me(async()=>{const{showToast:h}=await Promise.resolve().then(()=>qe);return{showToast:h}},void 0).then(({showToast:h})=>{h(`${g} saved to Documents`,"success")})}const p=window.open("","_blank","width=800,height=1000");p.document.write(u),p.document.close(),setTimeout(()=>{p.print()},500)});const d=u=>{u.key==="Escape"&&(o(),document.removeEventListener("keydown",d))};document.addEventListener("keydown",d)}function fa(e,a){if(e==="form")return Ns(a);const t=e==="quote",n={Draft:"#6B7280",Finalised:"#1B6DE0",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[a.status]||"#6B7280",r=a.customerName||"Customer",c=a.contactName||"",o=a.lineItems||[],d=a.sections||[],u=l.getSettings(),g=u.logo?`<img src="${u.logo}" style="max-height:60px; max-width:240px; object-fit:contain" />`:'<div class="pdf-logo">F</div>';let y="";return d.length>0?d.forEach(i=>{if(e==="invoice"&&i.isVariation===!0&&i.customerApproved!==!0)return;const p=e==="invoice"&&i.isVariation===!0?' <span style="background:#F59E0B; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:8px; vertical-align:middle; text-transform:uppercase">Variation</span>':"";y+=`
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${v(i.name||"Phase")}${p}</td>
        </tr>
      `,i.lineItems.forEach(m=>{y+=`
          <tr>
            <td>${m.description?v(m.description):"—"}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(m.type||"other").charAt(0).toUpperCase()+(m.type||"other").slice(1)}</span></td>
            <td style="text-align:center">${m.qty||1}</td>
            <td style="text-align:right">$${(m.rate||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(m.total||0).toFixed(2)}</td>
          </tr>
        `}),y+=`
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(i.subtotal||0).toFixed(2)}</td>
        </tr>
      `}):y=o.map(i=>`
      <tr>
        <td>${i.description?v(i.description):"—"}</td>
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
          ${g}
          <div>
            <div class="pdf-company-name">${v(u.name||"FieldForge Demo Company")}</div>
            <div class="pdf-company-detail">ABN: ${v(u.abn||"12 345 678 901")}</div>
            <div class="pdf-company-detail">${v(u.address||"123 Business St, Melbourne VIC 3000")}</div>
            <div class="pdf-company-detail">Phone: ${v(u.phone||"1300 123 456")}</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${t?"QUOTE":"TAX INVOICE"}</div>
          <div class="pdf-doc-number">${a.number}</div>
          <div class="pdf-status" style="background:${n}15;color:${n};border:1px solid ${n}40">${a.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${t?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${r}</div>
          ${c?`<div class="pdf-info-value">Attn: ${c}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${t?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${Lt(t?a.createdAt:a.issueDate)}</span>
          </div>
          ${t?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${Lt(a.validUntil)}</span>
            </div>
          `:`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${Lt(a.dueDate)}</span>
            </div>
          `}
          ${!t&&a.jobNumber?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Job Reference</span>
              <span class="pdf-info-value">${a.jobNumber}</span>
            </div>
          `:""}
          ${!t&&a.originalQuoteNumber?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Linked Quote</span>
              <span class="pdf-info-value">${a.originalQuoteNumber}</span>
            </div>
          `:""}
          ${t&&a.title?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Description</span>
              <span class="pdf-info-value">${a.title}</span>
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
      ${e==="invoice"?`
        <div class="pdf-totals">
          <div class="pdf-total-row">
            <span>Original Quoted Amount</span>
            <span>$${(a.originalSubtotal!==void 0?a.originalSubtotal:(a.subtotal||0)-(a.approvedVariationsSum||0)).toFixed(2)}</span>
          </div>
          ${(a.approvedVariationsSum||0)>0?`
            <div class="pdf-total-row" style="color:#10B981; font-weight:600">
              <span>Approved Variations</span>
              <span>+$${(a.approvedVariationsSum||0).toFixed(2)}</span>
            </div>
          `:""}
          <div class="pdf-total-row" style="border-top:1px dashed #CBD5E1; padding-top:8px; font-weight:600">
            <span>Invoice Subtotal</span>
            <span>$${(a.subtotal||0).toFixed(2)}</span>
          </div>
          <div class="pdf-total-row">
            <span>GST (10%)</span>
            <span>$${(a.tax||0).toFixed(2)}</span>
          </div>
          <div class="pdf-total-row pdf-grand-total">
            <span>Total Payable (AUD)</span>
            <span>$${(a.total||0).toFixed(2)}</span>
          </div>
        </div>
      `:`
        <div class="pdf-totals">
          <div class="pdf-total-row">
            <span>Subtotal</span>
            <span>$${(a.subtotal||0).toFixed(2)}</span>
          </div>
          <div class="pdf-total-row">
            <span>GST (10%)</span>
            <span>$${(a.tax||0).toFixed(2)}</span>
          </div>
          <div class="pdf-total-row pdf-grand-total">
            <span>Total (AUD)</span>
            <span>$${(a.total||0).toFixed(2)}</span>
          </div>
        </div>
      `}


      ${a.notes?`
        <div class="pdf-notes">
          <div class="pdf-notes-title">Notes</div>
          <div class="pdf-notes-text">${v(a.notes).replace(/\n/g,"<br>")}</div>
        </div>
      `:""}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div class="pdf-footer-text">
          ${t?"This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.":"Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business."}
        </div>
        <div class="pdf-footer-company">${v(u.name||"FieldForge Demo Company")} — ${v(u.email||"hello@fieldforge.io")} — ${v(u.phone||"1300 123 456")}</div>
      </div>
    </div>
  `}function Ns(e){let a="";return(e.template.sections||[]).forEach(t=>{const s=t.columns||(t.width==="half"?1:2);if(t.isSpacer){const n=t.height?String(t.height).endsWith("px")?t.height:t.height+"px":"50px";a+=`<div style="width:100%; height:${n}" class="print-spacer"></div>`;return}a+=`
      <div style="margin-bottom:24px; border:1px solid #CBD5E1; border-radius:6px; overflow:hidden; page-break-inside:avoid">
        <div style="background:#F8FAFC; padding:10px 16px; border-bottom:1px solid #CBD5E1; font-weight:700; color:#1E293B; font-size:14px; text-transform:uppercase; letter-spacing:0.5px">
          ${v(t.title)}
        </div>
        <div style="padding:16px; display:grid; grid-template-columns: repeat(${s}, 1fr); gap:16px">
    `,t.fields.forEach(n=>{const r=Math.min(n.colSpan||(n.width==="half"?1:s),s);if(n.type==="spacer"||n.type==="blank"){const d=n.height?String(n.height).endsWith("px")?n.height:n.height+"px":"50px";a+=`<div style="grid-column: span ${r}; height:${n.type==="blank"?"auto":d}" class="print-spacer"></div>`;return}if(n.type==="info"){a+=`
          <div style="grid-column: span ${r}; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #64748b; color:#334155; font-size:13px; border-radius:4px; line-height:1.6; page-break-inside:avoid">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px; color:#475569">
              <span class="material-icons-outlined" style="font-size:16px">info</span> Instruction / Info
            </div>
            <div>${v(n.label).replace(/\n/g,"<br/>")}</div>
          </div>
        `;return}const c=e.responses[n.id];let o="";n.type==="signature"?o=c?`<div style="font-family:'Brush Script MT', cursive; font-size:24px; padding:10px; border:1px solid #E4E9F0; border-radius:4px; text-align:center">${v(c)}</div>`:'<div style="padding:10px; border:1px dashed #E4E9F0; color:#8A97A8; font-style:italic; text-align:center">No signature</div>':n.type==="checkbox"?o=`<div style="font-weight:600; color:${c?"#10B981":"#EF4444"}">${c?"YES / CHECKED":"NO / UNCHECKED"}</div>`:o=`<div style="padding:8px 12px; border:1px solid #E4E9F0; border-radius:4px; background:#F8FAFC; min-height:34px; font-size:12px">${c?v(c).replace(/\n/g,"<br/>"):'<span style="color:#8A97A8;font-style:italic">No response</span>'}</div>`,a+=`
        <div style="grid-column: span ${r}; display:flex; flex-direction:column; gap:6px">
          <div style="font-size:11px; font-weight:700; color:#5A6B7F; text-transform:uppercase; letter-spacing:0.5px">${v(n.label)}</div>
          ${o}
        </div>
      `}),a+=`
        </div>
      </div>
    `}),`
    <div class="pdf-page">
      <div style="margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #E4E9F0">
        <div style="font-size:22px; font-weight:800; color:#1A2332">${v(e.template.name)}</div>
        ${e.template.description?`<div style="font-size:13px; color:#5A6B7F; margin-top:6px; line-height:1.6">${v(e.template.description)}</div>`:""}
      </div>

      <div class="pdf-info-grid" style="margin-bottom:32px">
        <div class="pdf-info-col">
          <div class="pdf-info-label">Job Reference</div>
          <div class="pdf-info-value-lg">${v(e.jobNumber)}</div>
          <div class="pdf-info-value">Customer: ${v(e.customerName)}</div>
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">Submitted By</span>
            <span class="pdf-info-value">${v(e.submittedByName||"—")}</span>
          </div>
          <div class="pdf-info-row">
            <span class="pdf-info-label">Date Submitted</span>
            <span class="pdf-info-value">${Lt(e.submittedAt)}</span>
          </div>
        </div>
      </div>

      ${a}
    </div>
  `}function Lt(e){if(!e)return"—";try{return new Date(e).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return e}}function Ps(){return`
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
  `}function ia(e,a,t){const s=document.createElement("a"),n=new Blob([e],{type:t});s.href=URL.createObjectURL(n),s.download=a,s.click(),URL.revokeObjectURL(s.href)}function Na(e){const a=[["Compliance Form Report"],["Form Name",e.template.name],["Job Reference",e.jobNumber],["Customer",e.customerName],["Submitted By",e.submittedByName||"—"],["Date Submitted",e.submittedAt?new Date(e.submittedAt).toLocaleDateString():"—"],[],["Section","Field Name","Field Type","Response / Value"]];(e.template.sections||[]).forEach(n=>{n.isSpacer||n.fields.forEach(r=>{if(r.type==="spacer"||r.type==="info"||r.type==="blank")return;const c=e.responses[r.id]??"",o=r.type==="checkbox"?c?"Yes":"No":c;a.push([n.title,r.label,r.type,o])})});const t=a.map(n=>n.map(r=>`"${String(r).replace(/"/g,'""')}"`).join(",")).join(`
`),s=`Form_${e.jobNumber}_${e.template.name.replace(/\s+/g,"_")}.csv`;ia(t,s,"text/csv;charset=utf-8;")}function Pa(e){const a=JSON.stringify({formInstanceId:e.id,jobId:e.jobId,jobNumber:e.jobNumber,customerName:e.customerName,submittedBy:e.submittedByName,submittedAt:e.submittedAt,formTemplate:{id:e.template.id,name:e.template.name,description:e.template.description,sections:e.template.sections},responses:e.responses},null,2),t=`Form_${e.jobNumber}_${e.template.name.replace(/\s+/g,"_")}.json`;ia(a,t,"application/json;charset=utf-8;")}const jt=Object.freeze(Object.defineProperty({__proto__:null,downloadFile:ia,exportFormAsCSV:Na,exportFormAsJSON:Pa,formatDate:Lt,showPrintPreview:oa},Symbol.toStringTag,{value:"Module"}));function Wt(e,{id:a,customerId:t,type:s}){const n=s==="template",r=n?"quoteTemplates":"quotes",c=a==="new";let o;if(c?n?o={name:"New Quote Template",description:"",sections:[{id:l.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0}:o={status:"Draft",version:1,sections:[{id:l.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:t||""}:o=l.getById(r,a),!o){e.innerHTML=`<div class="empty-state"><span class="material-icons-outlined">error</span><h3>${n?"Template":"Quote"} not found</h3></div>`;return}o.lineItems&&!o.sections&&(o.sections=[{id:l.generateId(),name:"Main Phase",lineItems:[...o.lineItems]}],delete o.lineItems),c||ct(o.number+(o.version>1?` v${o.version}`:""));const d=l.getAll("customers"),u=l.getAll("stock"),g=l.getSettings(),y={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function i(){e.innerHTML=`
      ${mt({title:n?c?"New Quote Template":v(o.name):`${c?"New Quote":o.number} ${o.version>1?`<span class="badge badge-neutral">v${o.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:n?"":`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          <span class="badge ${y[o.status]||"badge-neutral"}">${o.status}</span>
        `,actionsHtml:n?`
          ${c?"":'<button class="btn btn-secondary" id="btn-delete-template" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span> Delete</button>'}
        `:`
          ${c?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!c&&o.status!=="Archived"&&Le("Quotes","edit")?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!c&&o.status==="Accepted"&&Le("Quotes","convert")?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!c&&o.status==="Draft"&&Le("Quotes","edit")?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                ${Le("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>':""}
                ${Le("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>':""}
                ${!c&&Le("Quotes","delete")?'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>':""}
             </div>
          </div>
        `})}

      ${n?`
      <!-- Template Builder Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Template Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Template Name *</label>
              <input class="form-input" id="quote-name" value="${v(o.name||"")}" placeholder="Template Name..." />
            </div>
            <div class="form-group" style="flex:2">
              <label class="form-label">Description</label>
              <input class="form-input" id="quote-desc" value="${v(o.description||"")}" placeholder="Template Description..." />
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${g.laborRates.map(I=>`<option value="${I.id}" ${o.laborProfileId===I.id?"selected":""}>${I.name} ($${I.rate.toFixed(2)}/hr)</option>`).join("")}
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
                ${d.map(I=>`<option value="${I.id}" ${o.customerId===I.id?"selected":""}>${I.company}</option>`).join("")}
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
                ${["Draft","Finalised","Sent","Accepted","Declined","Archived"].map(I=>`<option ${o.status===I?"selected":""}>${I}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${o.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${g.laborRates.map(I=>`<option value="${I.id}" ${o.laborProfileId===I.id?"selected":""}>${I.name} ($${I.rate.toFixed(2)}/hr)</option>`).join("")}
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
        ${u.map(I=>`<option value="${I.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(o.sections||[]).map((I,x)=>p(I,x)).join("")}
      </div>
      
      ${o.status!=="Archived"?`
      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>`:""}

      <!-- Totals & Estimation & Client Agreement -->
      <div style="display:flex; justify-content:flex-end; gap:var(--space-lg); margin-bottom:var(--space-lg); align-items:stretch; flex-wrap:wrap">
        <!-- Internal Estimation (Only for internal use) -->
        ${o.status!=="Archived"&&!n?`
        <div class="card" style="width:280px; margin:0; border:1px dashed var(--border-color); background:var(--bg-color); display:flex; flex-direction:column">
          <div class="card-header" style="padding:10px 16px; border-bottom:1px dashed var(--border-color)">
            <h5 style="margin:0; font-size:13px; color:var(--text-secondary)">Internal Estimation</h5>
          </div>
          <div class="card-body" style="padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center">
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

        <!-- Client Agreement & Signature Panel -->
        ${n?"":`
        <div class="card" style="width:340px; margin:0; display:flex; flex-direction:column; border:1px solid ${o.status==="Accepted"?"var(--color-success)":o.status==="Declined"?"var(--color-danger)":"var(--border-color)"}">
          <div class="card-header" style="padding:10px 16px; background:${o.status==="Accepted"?"rgba(16,185,129,0.05)":o.status==="Declined"?"rgba(239,68,68,0.05)":"rgba(0,0,0,0.02)"}">
            <h5 style="margin:0; font-size:13px; color:${o.status==="Accepted"?"var(--color-success-dark)":o.status==="Declined"?"var(--color-danger)":"var(--text-secondary)"}">Client Agreement</h5>
          </div>
          <div class="card-body" style="padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center; gap:8px">
            ${o.status==="Accepted"?`
              <div style="display:flex; align-items:center; gap:8px; color:var(--color-success); font-weight:700; font-size:14px">
                <span class="material-icons-outlined">check_circle</span>
                <span>Accepted & Signed</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary)">
                <div><strong>Signed By:</strong> ${v(o.signedByName||"Client")}</div>
                <div style="margin-top:2px"><strong>Signed At:</strong> ${o.signedAt?new Date(o.signedAt).toLocaleString():"—"}</div>
              </div>
              <div style="border:1px solid var(--border-color); background:var(--bg-color); height:60px; border-radius:4px; display:flex; align-items:center; justify-content:center; margin-top:4px">
                <span style="font-family:'Brush Script MT', cursive; font-size:26px; color:#1B6DE0; font-style:italic; font-weight:500">${v(o.signatureData||"Client Signature")}</span>
              </div>
            `:o.status==="Declined"?`
              <div style="display:flex; align-items:center; gap:8px; color:var(--color-danger); font-weight:700; font-size:14px">
                <span class="material-icons-outlined">cancel</span>
                <span>Quote Declined by Client</span>
              </div>
              <div style="font-size:12px; color:var(--text-tertiary)">
                This proposal has been rejected by the customer. Create a revision to draft adjustments.
              </div>
            `:`
              <div style="font-size:13px; color:var(--text-secondary); line-height:1.4">
                This proposal is awaiting client review. You can simulate direct digital signature and job conversion below.
              </div>
              <div style="display:flex; gap:8px; margin-top:6px">
                <button class="btn btn-sm btn-success" id="btn-sign-approve-modal" style="flex:2; padding:6px 8px; font-size:12px">
                  <span class="material-icons-outlined" style="font-size:14px; vertical-align:middle; margin-right:2px">check_circle</span> Sign & Approve
                </button>
                <button class="btn btn-sm btn-secondary" id="btn-decline-quote" style="flex:1; padding:6px 8px; font-size:12px; color:var(--color-danger); border-color:rgba(239,68,68,0.2)">
                  Decline
                </button>
              </div>
            `}
          </div>
        </div>
        `}

        <!-- Client Totals -->
        <div class="card" style="width:340px; margin:0">
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

      ${n?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Template</button>
      </div>
      `:o.status!=="Archived"&&(c?Le("Quotes","create"):Le("Quotes","edit"))?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Back</button>
      </div>`}
    `,w()}function p(I,x){const E=o.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${x}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${I.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${E?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(I.subtotal||0).toFixed(2)}</span>
            ${E?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${x}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${x}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(I.lineItems||[]).map((k,S)=>m(k,x,S,E)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function m(I,x,E,k){return`
      <tr data-sidx="${x}" data-index="${E}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${I.description||""}" data-field="description" placeholder="Type item name..." ${k?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${k?"disabled":""}>
          <option value="labor" ${I.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${I.type==="material"?"selected":""}>Material</option>
          <option value="other" ${I.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${I.qty||1}" data-field="qty" min="1" ${k?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${I.rate||0}" data-field="rate" step="0.01" ${k?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(I.total||0).toFixed(2)}</td>
        <td>${k?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${x}" data-index="${E}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function h(){o.subtotal=0,o.totalInternalCost=0;let I=0;l.getSettings().laborRates.find(E=>E.id===o.laborProfileId),(o.sections||[]).forEach(E=>{E.subtotal=0,(E.lineItems||[]).forEach(k=>{k.total=(k.qty||0)*(k.rate||0),k.type==="labor"&&(I+=k.total),k.internalCost||(k.type==="labor"?k.internalCost=45:k.internalCost=k.rate*.7),o.totalInternalCost+=(k.qty||0)*(k.internalCost||0),E.subtotal+=k.total}),o.subtotal+=E.subtotal}),o.tax=o.subtotal*.1,o.total=o.subtotal+o.tax,i()}function b(){const I=l.getAll("technicians")||[],x=I[Math.floor(Math.random()*I.length)];let E=0,k=0;(o.sections||[]).forEach(N=>{(N.lineItems||[]).forEach($=>{$.type==="labor"&&(E+=$.total),$.type==="material"&&(k+=$.total)})});const S=o.sections.map(N=>({id:l.generateId(),name:N.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),D=l.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:o.customerId,customerName:o.customerName,contactName:o.contactName,title:o.title,type:"Project",status:"Pending",priority:"Medium",technicianId:x==null?void 0:x.id,technicianName:x==null?void 0:x.name,quoteId:a,tasks:S,phases:S,laborCost:E,materialCost:k,estimatedLaborCost:E,estimatedMaterialCost:k}),M=l.getAll("activity")||[];M.push({id:Date.now()+1,jobId:D.id,type:"job_converted_from_quote",text:`Live job ${D.number} created from accepted Quote ${o.number}.`,user:"System Automation",timestamp:new Date().toISOString()}),l.save("activity",M),me(async()=>{const{addSystemNotification:N}=await Promise.resolve().then(()=>qe);return{addSystemNotification:N}},void 0).then(({addSystemNotification:N})=>{N("New Job Assigned",`You have been assigned to Live Job ${D.number} (${D.title}).`,`/jobs/${D.id}`)}),O(`Converted successfully! Live Job ${D.number} is now active.`,"success"),Y.navigate(`/jobs/${D.id}`)}function w(){var x,E,k,S,D,M,N,$,f,T,C,z,J;(x=e.querySelector("#btn-preview-pdf"))==null||x.addEventListener("click",()=>{oa({type:"quote",data:o})});const I=e.querySelector(".dropdown > .btn");I&&(I.addEventListener("click",L=>{L.stopPropagation();const j=I.nextElementSibling;j.style.display=j.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const L=e.querySelector(".dropdown-menu");L&&(L.style.display="none")})),(E=e.querySelector("#btn-create-revision"))==null||E.addEventListener("click",()=>{l.update("quotes",a,{status:"Archived"});const L=JSON.parse(JSON.stringify(o));delete L.id,L.version=(o.version||1)+1,L.status="Draft",L.createdAt=new Date().toISOString();const j=l.create("quotes",L);O(`Revision v${L.version} created`,"success"),Y.navigate(`/quotes/${j.id}`)}),(k=e.querySelector("#btn-save-template"))==null||k.addEventListener("click",L=>{L.preventDefault();const j=document.createElement("div");j.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${o.title||"Custom Quote Template"}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `,$e({title:"Save Quote as Template",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:"Save Template",className:"btn-primary",onClick:q=>{const A=j.querySelector("#tmpl-name").value,_=j.querySelector("#tmpl-desc").value;if(!A){O("Template name is required","error");return}const H={name:A,description:_,sections:JSON.parse(JSON.stringify(o.sections)),createdAt:new Date().toISOString()};l.create("quoteTemplates",H),O("Saved to Quote Templates","success"),q()}}]})}),(S=e.querySelector("#btn-import-template"))==null||S.addEventListener("click",L=>{L.preventDefault();const j=l.getAll("quoteTemplates"),q=document.createElement("div");q.innerHTML=`
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${j.length?j.map(A=>`
            <div class="import-item" data-id="${A.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${v(A.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${A.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${v(A.description||"No description.")}</div>
            </div>
          `).join(""):'<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `,$e({title:"Import Quote Template",content:q,actions:[{label:"Cancel",className:"btn-secondary",onClick:A=>A()}]}),q.querySelectorAll(".import-item").forEach(A=>{A.addEventListener("click",()=>{var H;const _=j.find(R=>R.id===A.dataset.id);_&&confirm(`Replace current quote sections with "${_.name}"?`)&&(o.sections=JSON.parse(JSON.stringify(_.sections)),o.sections.forEach(R=>{R.id=l.generateId(),R.lineItems.forEach(V=>V.id=l.generateId())}),h(),(H=document.querySelector(".modal-overlay"))==null||H.remove())})})}),e.querySelectorAll("#quote-name, #quote-desc, #quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(L=>{L.addEventListener("change",()=>{const j=L.value;if(L.id==="quote-name")o.name=j;else if(L.id==="quote-desc")o.description=j;else if(L.id==="quote-customer")o.customerId=j;else if(L.id==="quote-title")o.title=j;else if(L.id==="quote-status")o.status=j;else if(L.id==="quote-valid")o.validUntil=j;else if(L.id==="quote-labor-profile"){o.laborProfileId=j;const q=g.laborRates.find(A=>A.id===j);if(q){if(o.sections&&o.sections.forEach(A=>{A.lineItems.forEach(_=>{_.type==="labor"&&(_.rate=q.rate)})}),q.minCallOutFee>0){const A=o.sections[0];A&&(A.lineItems.some(H=>H.description.includes("Call-out Fee"))||A.lineItems.unshift({description:"Call-out Fee",type:"other",qty:1,rate:q.minCallOutFee,total:q.minCallOutFee}))}h()}}})}),(D=e.querySelector("#btn-add-section"))==null||D.addEventListener("click",()=>{const L=g.laborRates.find(j=>j.id===o.laborProfileId)||g.laborRates.find(j=>j.isDefault);o.sections.push({id:l.generateId(),name:"New Phase",lineItems:[{description:"Labour",type:"labor",qty:1,rate:L?L.rate:85,total:L?L.rate:85}]}),h()}),e.querySelectorAll(".section-name-input").forEach((L,j)=>{L.addEventListener("change",()=>{o.sections[j].name=L.value})}),e.querySelectorAll(".btn-add-line").forEach(L=>{L.addEventListener("click",j=>{const q=parseInt(L.dataset.sidx);o.sections[q].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),i()})}),e.querySelectorAll(".btn-remove-section").forEach(L=>{L.addEventListener("click",()=>{const j=parseInt(L.dataset.sidx);confirm("Remove this entire phase?")&&(o.sections.splice(j,1),h())})}),e.querySelectorAll(".item-input").forEach(L=>{L.addEventListener("change",j=>{const q=L.closest("tr"),A=parseInt(q.dataset.sidx),_=parseInt(q.dataset.index),H=L.dataset.field;let R=L.value;if((H==="qty"||H==="rate")&&(R=parseFloat(R)||0),o.sections[A].lineItems[_][H]=R,H==="description"){const V=u.find(se=>se.name===R);if(V){const se=(V.category||"").toLowerCase().includes("labor");let U=0,P=0;if(se)U=V.unitPrice||85,P=V.costPrice||45;else{const Z=V.costPrice||V.unitPrice||0;P=Z,U=Qt(Z,g)}o.sections[A].lineItems[_].type=se?"labor":"material",o.sections[A].lineItems[_].rate=U,o.sections[A].lineItems[_].internalCost=P}}h()})}),e.querySelectorAll(".btn-remove-line").forEach(L=>{L.addEventListener("click",()=>{const j=parseInt(L.dataset.sidx),q=parseInt(L.dataset.index);o.sections[j].lineItems.splice(q,1),h()})}),(M=e.querySelector("#btn-cancel-quote"))==null||M.addEventListener("click",()=>{n?Y.navigate("/settings?tab=quotes"):Y.navigate("/quotes")}),(N=e.querySelector("#btn-save-quote"))==null||N.addEventListener("click",()=>{if(n)o.name=e.querySelector("#quote-name").value,o.description=e.querySelector("#quote-desc").value;else{const L=e.querySelector("#quote-customer").value,j=d.find(q=>q.id===L);o.customerId=L,o.customerName=(j==null?void 0:j.company)||"",o.contactName=j?`${j.firstName} ${j.lastName}`:"",o.title=e.querySelector("#quote-title").value,o.status=e.querySelector("#quote-status").value,o.validUntil=e.querySelector("#quote-valid").value}if(h(),n)c?(l.create("quoteTemplates",o),O("Template created","success"),Y.navigate("/settings?tab=quotes")):(l.update("quoteTemplates",a,o),O("Template saved","success"),i());else if(c){const L=l.create("quotes",o);O("Quote created","success"),Y.navigate(`/quotes/${L.id}`)}else l.update("quotes",a,o),O("Quote saved","success"),i()}),($=e.querySelector("#btn-convert-job"))==null||$.addEventListener("click",()=>{(o.sections||[]).forEach(q=>{(q.lineItems||[]).forEach(A=>{A.type==="labor"&&(laborCost+=A.total),A.type==="material"&&(materialCost+=A.total)})});const L=o.sections.map(q=>({id:l.generateId(),name:q.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),j=l.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:o.customerId,customerName:o.customerName,contactName:o.contactName,title:o.title,type:"Project",status:"Pending",priority:"Medium",technicianId:tech==null?void 0:tech.id,technicianName:tech==null?void 0:tech.name,quoteId:a,tasks:L,phases:L,laborCost,materialCost,estimatedLaborCost:laborCost,estimatedMaterialCost:materialCost});me(async()=>{const{addSystemNotification:q}=await Promise.resolve().then(()=>qe);return{addSystemNotification:q}},void 0).then(({addSystemNotification:q})=>{q("New Job Assigned",`You have been assigned to Live Job ${j.number} (${j.title}).`,`/jobs/${j.id}`)}),O("Quote converted to project","success"),Y.navigate(`/jobs/${j.id}`)}),(f=e.querySelector("#btn-send-quote"))==null||f.addEventListener("click",()=>{o.emailStatus="Sent",o.status==="Draft"&&(o.status="Sent"),l.update("quotes",a,{emailStatus:"Sent",status:o.status}),me(async()=>{const{showToast:L,addSystemNotification:j}=await Promise.resolve().then(()=>qe);return{showToast:L,addSystemNotification:j}},void 0).then(({showToast:L,addSystemNotification:j})=>{L("Email sent to customer","success"),i(),setTimeout(()=>{const q=l.getById("quotes",a);q&&q.emailStatus==="Sent"&&(q.emailStatus="Opened/Viewed",l.update("quotes",a,{emailStatus:"Opened/Viewed"}),j("Quote Opened",`Quote ${q.number} was opened by ${q.customerName||"the customer"}.`,`/quotes/${a}`),window.location.hash.includes(`/quotes/${a}`)&&(o.emailStatus="Opened/Viewed",i()))},15e3)})}),(T=e.querySelector("#btn-sign-approve-modal"))==null||T.addEventListener("click",()=>{const L=document.createElement("div");L.innerHTML=`
        <div style="display:flex; flex-direction:column; gap:16px">
          <div class="form-group">
            <label class="form-label">Client Name <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="sig-name" placeholder="Type your full name..." required />
          </div>
          <div style="border:1px solid var(--border-color); background:var(--bg-color); height:100px; border-radius:6px; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden">
            <div style="position:absolute; top:8px; left:12px; font-size:10px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Handwritten Signature Preview</div>
            <span id="sig-preview" style="font-family:'Brush Script MT', cursive; font-size:36px; color:#1B6DE0; font-style:italic; font-weight:500; transition:all 0.15s">Client Signature</span>
          </div>
          <label style="display:flex; align-items:flex-start; gap:8px; font-size:13px; line-height:1.4; cursor:pointer; margin:0">
            <input type="checkbox" id="sig-consent" style="width:16px; height:16px; margin-top:2px; cursor:pointer" />
            <span style="color:var(--text-secondary)">I hereby accept this estimation and authorize the project to go live under the standard service terms.</span>
          </label>
        </div>
      `,$e({title:"Sign & Approve Quote",content:L,actions:[{label:"Cancel",className:"btn-secondary",onClick:A=>A()},{label:"Sign & Authorize Project",className:"btn-success",onClick:A=>{const _=L.querySelector("#sig-name").value.trim(),H=L.querySelector("#sig-consent").checked;if(!_){O("Please type your name to sign.","error");return}if(!H){O("Please check the consent box to authorize.","error");return}o.status="Accepted",o.signedByName=_,o.signedAt=new Date().toISOString(),o.signatureData=_,l.update("quotes",a,{status:"Accepted",signedByName:_,signedAt:o.signedAt,signatureData:_}),O("Quote signed and accepted!","success"),A(),b()}}]});const j=L.querySelector("#sig-name"),q=L.querySelector("#sig-preview");j.addEventListener("input",()=>{q.textContent=j.value.trim()||"Client Signature"})}),(C=e.querySelector("#btn-decline-quote"))==null||C.addEventListener("click",()=>{confirm("Are you sure you want to decline this quote?")&&(o.status="Declined",l.update("quotes",a,{status:"Declined"}),O("Quote marked as declined","info"),i())}),(z=e.querySelector("#btn-delete-quote"))==null||z.addEventListener("click",()=>{const L=document.createElement("div");L.innerHTML=`<p>Delete quote <strong>${v(o.number)}</strong>?</p>`,$e({title:"Delete Quote",content:L,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Delete",className:"btn-danger",onClick:j=>{l.delete("quotes",a),O("Quote deleted","success"),j(),Y.navigate("/quotes")}}]})}),(J=e.querySelector("#btn-delete-template"))==null||J.addEventListener("click",()=>{confirm(`Delete template "${v(o.name)}"?`)&&(l.delete("quoteTemplates",a),O("Template deleted","success"),Y.navigate("/settings?tab=quotes"))})}i()}function aa(e){const a=l.getAll("jobs"),t=Le("Jobs","create");e.innerHTML=`
    <div class="page-header">
      <h1>Jobs</h1>
      ${t?`
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-job"><span class="material-icons-outlined">add</span> New Job</button>
      </div>`:""}
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
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
  `;let s=[...a];const n={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},r={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},o=Xe({columns:[{key:"number",label:"Job #",render:u=>`<span class="cell-link font-medium">${v(u.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:u=>`<span class="truncate" style="max-width:200px;display:inline-block">${v(u.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:u=>{if(u.contractorId){const g=l.getById("contractors",u.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${g?v(g.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${u.technicians&&u.technicians.length>0?u.technicians.map(g=>v(g.name)).join(", "):v(u.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:u=>`<span class="badge ${n[u.status]||"badge-neutral"}">${v(u.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:u=>`<span class="badge ${r[u.priority]||"badge-neutral"}">${v(u.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:u=>u.scheduledDate?new Date(u.scheduledDate).toLocaleDateString():"—",getValue:u=>u.scheduledDate?new Date(u.scheduledDate).getTime():0,width:"100px"}],data:s,onRowClick:u=>Y.navigate(`/jobs/${u}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:u=>{st({container:e,selectedIds:u,onClear:()=>o.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:g=>{const y=document.createElement("div");y.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:i}=await Promise.resolve().then(()=>Re);return{showModal:i}},void 0).then(({showModal:i})=>{i({title:`Update ${g.length} Jobs`,content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:p=>p()},{label:"Apply",className:"btn-primary",onClick:p=>{const m=y.querySelector("#bulk-status").value;g.forEach(h=>l.update("jobs",h,{status:m})),o.clearSelection(),aa(e),me(async()=>{const{showToast:h}=await Promise.resolve().then(()=>qe);return{showToast:h}},void 0).then(({showToast:h})=>h(`Updated ${g.length} jobs to ${m}`,"success")),p()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:g=>{me(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Re);return{showModal:y}},void 0).then(({showModal:y})=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete ${g.length} jobs? This cannot be undone.</p>`,y({title:"Confirm Bulk Delete",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:p=>p()},{label:"Delete",className:"btn-danger",onClick:p=>{g.forEach(m=>l.delete("jobs",m)),o.clearSelection(),aa(e),me(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${g.length} jobs`,"success")),p()}}]})})}}]})}});e.querySelector("#jobs-table-container").appendChild(o);const d=e.querySelector("#btn-new-job");d&&d.addEventListener("click",()=>Y.navigate("/jobs/new")),e.querySelectorAll(".toolbar-filter").forEach(u=>{u.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(y=>y.classList.remove("active")),u.classList.add("active");const g=u.dataset.filter;g==="all"?s=[...a]:g==="unscheduled"?s=a.filter(y=>!y.scheduledDate):s=a.filter(y=>y.status===g),o.updateData(s)})}),e.querySelector("#jobs-search").addEventListener("input",u=>{const g=u.target.value.toLowerCase();s=a.filter(y=>y.number.toLowerCase().includes(g)||y.title.toLowerCase().includes(g)||y.customerName.toLowerCase().includes(g)||(y.technicianName||"").toLowerCase().includes(g)),o.updateData(s)})}function ja(e,a){const t=l.getById("timesheets",e);if(!t)return;const s=JSON.parse(localStorage.getItem("currentUser")||"{}"),n={},r={};function c(x,E=[],k=[]){x&&x.forEach((S,D)=>{const M=[...E,D].join("-"),N=[...k,S.name].join(" > ");n[M]=N,S.id&&(r[S.id]=M),S.subTasks&&c(S.subTasks,[...E,D],[...k,S.name])})}function o(x,E=[]){return!x||x.length===0?"":x.map((k,S)=>{const D=[...E,S],M=D.join("-"),N=k.subTasks&&k.subTasks.length>0;return`
        <div class="tree-node" style="margin: 2px 0;">
          <div class="tree-node-row ${N?"parent-node":"leaf-node"}" data-path="${M}" data-name="${v(k.name)}" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; flex-grow:1;">
              ${N?`
                <span class="material-icons-outlined tree-node-toggle" data-path="${M}" style="font-size:16px; margin-right:4px;">chevron_right</span>
              `:`
                <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
              `}
              <span class="node-name" style="font-weight:${N?"600":"400"}">${v(k.name)}</span>
            </div>
            ${N?`
              <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${k.subTasks.length} subtasks</span>
            `:""}
          </div>
          ${N?`
            <div class="tree-node-children" id="children-${M}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
              ${o(k.subTasks,D)}
            </div>
          `:""}
        </div>
      `}).join("")}const d=t.startTime||`${t.date}T09:00`,u=t.finishTime||`${t.date}T10:00`,g=l.getAll("technicians"),y=l.getAll("jobs").filter(x=>x.status!=="Completed"&&x.status!=="Invoiced"||x.id===t.jobId),i=document.createElement("div");i.innerHTML=`
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
        <input type="datetime-local" class="form-input" id="lt-finish" value="${u}" style="width:100%" />
      </div>
    </div>
    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group" style="margin:0">
        <label class="form-label">Technician *</label>
        <select class="form-select" id="lt-tech" style="width:100%" ${s.role==="technician"?"disabled":""}>
          <option value="">Select technician...</option>
          ${g.map(x=>`<option value="${x.id}" ${t.technicianId===x.id?"selected":""}>${x.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Job *</label>
        <select class="form-select" id="lt-job" style="width:100%">
          <option value="">Select job...</option>
          ${y.map(x=>`<option value="${x.id}" ${t.jobId===x.id?"selected":""}>${x.number} - ${v(x.customerName)} (${v(x.title)})</option>`).join("")}
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
        <input type="hidden" id="lt-task-name" value="${v(t.taskName||"")}" />
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Description</label>
      <input type="text" class="form-input" id="lt-desc" value="${v(t.description||"")}" placeholder="Brief description..." style="width:100%" />
    </div>
  `;const p=i.querySelector("#lt-job"),m=i.querySelector("#lt-task-trigger"),h=i.querySelector("#lt-task-dropdown"),b=i.querySelector("#lt-task"),w=i.querySelector("#lt-task-name");m.addEventListener("click",x=>{x.stopPropagation();const E=h.style.display==="block";h.style.display=E?"none":"block"}),document.addEventListener("click",x=>{i.contains(x.target)||(h.style.display="none")});function I(x,E){if(!x){m.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',m.disabled=!0,h.style.display="none",b.value="",w.value="";return}const k=y.find(D=>D.id===x);if(!k||!k.tasks||k.tasks.length===0){m.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',m.disabled=!0,h.style.display="none",b.value="",w.value="";return}for(const D in n)delete n[D];for(const D in r)delete r[D];c(k.tasks),h.innerHTML=o(k.tasks),m.disabled=!1;let S=E;S&&!n[S]&&r[S]&&(S=r[S]),S&&n[S]?(m.innerHTML=`<span>${v(n[S])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,b.value=S,w.value=n[S]):(m.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',b.value="",w.value=""),h.querySelectorAll(".tree-node-toggle").forEach(D=>{D.addEventListener("click",M=>{M.stopPropagation();const N=D.dataset.path,$=h.querySelector("#children-"+N);if($){const f=$.style.display==="none";$.style.display=f?"block":"none",D.classList.toggle("expanded",f)}})}),h.querySelectorAll(".tree-node-row").forEach(D=>{D.addEventListener("click",M=>{if(M.target.classList.contains("tree-node-toggle"))return;const N=D.dataset.path,$=N.split("-").map(Number);function f(z,J){let L=z[J[0]];for(let j=1;j<J.length;j++){if(!L||!L.subTasks)return!1;L=L.subTasks[J[j]]}return L&&L.subTasks&&L.subTasks.length>0}if(f(k.tasks||[],$)){const z=h.querySelector("#children-"+N),J=h.querySelector('.tree-node-toggle[data-path="'+N+'"]');if(z){const L=z.style.display==="none";z.style.display=L?"block":"none",J&&J.classList.toggle("expanded",L)}return}const C=n[N]||D.dataset.name;b.value=N,w.value=C,m.innerHTML=`<span>${v(C)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,h.style.display="none"})})}I(t.jobId,t.taskPath||t.taskId),p.addEventListener("change",x=>{I(x.target.value,null)}),$e({title:"Edit Timesheet Entry",content:i,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Save Changes",className:"btn-primary",onClick:x=>{const E=document.getElementById("lt-start").value,k=document.getElementById("lt-finish").value,S=document.getElementById("lt-tech").value,D=document.getElementById("lt-job").value,M=document.getElementById("lt-task").value,N=document.getElementById("lt-task-name").value,$=document.getElementById("lt-desc").value;if(!E||!k||!S||!D||!M){O("Please fill all required fields, including the task","error");return}const f=new Date(E),T=new Date(k);if(T<=f){O("Finish time must be after start time","error");return}const C=Math.round((T-f)/36e5*100)/100,z=g.find(L=>L.id===S),J=y.find(L=>L.id===D);l.update("timesheets",t.id,{jobId:J.id,jobNumber:J.number,taskId:M,taskPath:M,taskName:N,technicianId:S,technicianName:z.name,date:E.split("T")[0],startTime:E,finishTime:k,hours:C,description:$||""}),O("Timesheet updated successfully","success"),x(),a&&a()}}]})}function js(e,{id:a}){const t=l.getById("jobs",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}ct(t.number);const s={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},n={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let r="overview",c=[0],o=[],d=!1,u=null,g=[];function y(){if(!u){const x=l.getAll("stock"),E=[];x.forEach(k=>{k.locations&&k.locations.length>0?k.locations.forEach(S=>{S.quantity>0&&E.push(`<option value="${k.id}::${v(S.location)}">${v(k.name)} [${v(S.location)}] (Qty: ${S.quantity}) - $${(k.costPrice||k.unitPrice||0).toFixed(2)}</option>`)}):k.quantity>0&&E.push(`<option value="${k.id}::${v(k.location||"Main Warehouse")}">${v(k.name)} [${v(k.location||"Main Warehouse")}] (Qty: ${k.quantity}) - $${(k.costPrice||k.unitPrice||0).toFixed(2)}</option>`)}),u=E.join("")}return u}function i(){(t.laborCost||0)+(t.materialCost||0),e.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${v(t.number)} — ${v(t.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${v(t.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${v(t.technicianName||"Unassigned")}</span>
              <span class="badge ${s[t.status]||"badge-neutral"}">${v(t.status)}</span>
              <span class="badge ${n[t.priority]||"badge-neutral"}">${v(t.priority)}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-sm">
          <!-- Moved invoice creation to Invoices tab -->
          ${Le("Jobs","edit")?'<button class="btn btn-secondary" id="btn-edit-job"><span class="material-icons-outlined">edit</span> Edit</button>':""}
          ${Le("Jobs","delete")?'<button class="btn btn-danger btn-icon" id="btn-delete-job"><span class="material-icons-outlined">delete</span></button>':""}
        </div>
      </div>
      <div class="tabs" id="job-tabs" style="flex-wrap:wrap">
        <button class="tab ${r==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${r==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        ${Le("Jobs","view_costs")?`<button class="tab ${r==="costs"?"active":""}" data-tab="costs">Costs</button>`:""}
        ${Le("Jobs","view_quotes_tab")?`<button class="tab ${r==="quotes"?"active":""}" data-tab="quotes">Quotes</button>`:""}
        <button class="tab ${r==="forms"?"active":""}" data-tab="forms">Forms</button>
        ${Le("Jobs","view_pos_tab")?`<button class="tab ${r==="pos"?"active":""}" data-tab="pos">POs</button>`:""}
        <button class="tab ${r==="activity"?"active":""}" data-tab="activity">Activity</button>
        ${Le("Jobs","view_timesheets_tab")?`<button class="tab ${r==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>`:""}
        ${Le("Jobs","view_invoices_tab")?`<button class="tab ${r==="invoices"?"active":""}" data-tab="invoices">Invoices</button>`:""}
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,p(),m()}function p(){var $,f,T,C,z,J,L,j,q,A,_,H,R,V,se,U,P,Z,re,ee,G,ne;(r==="costs"&&!Le("Jobs","view_costs")||r==="quotes"&&!Le("Jobs","view_quotes_tab")||r==="pos"&&!Le("Jobs","view_pos_tab")||r==="timesheets"&&!Le("Jobs","view_timesheets_tab")||r==="invoices"&&!Le("Jobs","view_invoices_tab"))&&(r="overview");const x=e.querySelector("#tab-content");if((t.laborCost||0)+(t.materialCost||0),r==="forms"){b(x);return}if(r==="overview"){let Q=0;if(t.tasks&&t.tasks.length>0){let xe=0,Ae=0;t.tasks.forEach(Ne=>{const Ve=(parseFloat(Ne.estimatedHours)||1)*(parseInt(Ne.people)||1);xe+=Ve,Ae+=Ve*((Ne.progress||0)/100)}),Q=xe>0?Math.round(Ae/xe*100):0}const K=t.technicians&&t.technicians.length>0?t.technicians.map(xe=>`${v(xe.name)} (${xe.hours}h)`).join(", "):v(t.technicianName||"Unassigned"),ae=l.getAll("timesheets").filter(xe=>xe.jobId===a),F=l.getAll("technicians"),W={};let B=0,te=0;ae.forEach(xe=>{if(!W[xe.technicianId]){const Ae=F.find(Ne=>Ne.id===xe.technicianId);W[xe.technicianId]={hours:0,rate:Ae&&(Ae.payRate||Ae.hourlyRate)||45}}W[xe.technicianId].hours+=xe.hours||0}),Object.values(W).forEach(xe=>{B+=xe.hours,te+=xe.hours*xe.rate});const ue=l.getAll("assetUsage").filter(xe=>xe.jobId===a),pe=l.getAll("assets");let X=0;ue.forEach(xe=>{const Ae=pe.find(Ve=>Ve.id===xe.assetId),Ne=xe.recoveryRate||(Ae?Ae.recoveryRate:0)||0;X+=xe.hours*Ne});const oe=(t.materials||[]).reduce((xe,Ae)=>xe+Ae.quantity*(Ae.unitCost||0),0),le=parseFloat(t.additionalMaterialCost||0),ce=oe+le,fe=l.getAll("quotes").filter(xe=>xe.jobId===a||t.quoteId===xe.id||xe.number===t.quoteNumber).find(xe=>xe.status==="Accepted")||(t.quoteId?l.getById("quotes",t.quoteId):null);let he=0,Te=0;fe&&fe.sections?fe.sections.forEach(xe=>{(xe.lineItems||[]).forEach(Ae=>{Ae.type==="labor"?he+=(Ae.qty||0)*(Ae.internalCost||Ae.rate||45):Ae.type==="material"&&(Te+=(Ae.qty||0)*(Ae.internalCost||0))})}):(he=parseFloat(t.estimatedLaborCost||t.laborCost||0),Te=parseFloat(t.estimatedMaterialCost||t.materialCost||0));const ke=he+Te,Ee=te,Oe=ce,Qe=X,Me=Ee+Oe+Qe,Ce=Ee-he,Fe=Oe-Te,je=Me-ke;x.innerHTML=`
        <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
          
          <!-- Budget Deviation Tracker Card -->
          <div class="card" style="border: 1.5px solid ${je>0?"var(--color-danger)":"var(--color-success)"}">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:${je>0?"rgba(239,68,68,0.02)":"rgba(16,185,129,0.02)"}; padding: 12px 16px">
              <h4 style="margin:0; color:${je>0?"var(--color-danger)":"var(--color-success-dark)"}; display:flex; align-items:center; gap:8px">
                <span class="material-icons-outlined" style="font-size:20px">analytics</span>
                Budget Deviation & Expenses Tracker
              </h4>
              <span class="badge ${je>0?"badge-danger":"badge-success"}" style="font-weight:700">
                ${je>0?"Over Budget":"Under Budget"}
              </span>
            </div>
            <div class="card-body" style="padding: 16px">
              ${je>0?`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(239,68,68,0.08); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; margin-bottom:16px; color:#c53030">
                  <span class="material-icons-outlined" style="font-size:20px">warning</span>
                  <div style="font-size:13px">
                    <strong>Budget Overrun Detected</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Actual expenses have exceeded the quoted estimation by <strong>$${je.toFixed(2)}</strong>. Customer approval may be required for additional variations.</div>
                  </div>
                </div>
              `:`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.08); border-left:4px solid var(--color-success); padding:12px; border-radius:4px; margin-bottom:16px; color:#2f855a">
                  <span class="material-icons-outlined" style="font-size:20px">check_circle</span>
                  <div style="font-size:13px">
                    <strong>Expenses Within Quoted Budget</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Current expenses are within the original quoted estimation. Remaining budget margin: <strong>$${Math.abs(je).toFixed(2)}</strong>.</div>
                  </div>
                </div>
              `}

              <!-- Visual Progress Comparison Bar -->
              <div style="margin-bottom:18px">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; font-weight:600; color:var(--text-secondary)">
                  <span>Quoted Estimate ($${ke.toFixed(2)})</span>
                  <span>Actual Expenses ($${Me.toFixed(2)})</span>
                </div>
                <div style="width:100%; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:flex">
                  ${(()=>{const xe=ke>0?Math.min(100,Math.round(Me/ke*100)):100,Ae=Me>ke;return`
                      <div style="width:${xe}%; background:${Ae?"var(--color-danger)":"var(--color-success)"}; height:100%; transition:width 0.4s ease; border-radius:6px"></div>
                      ${Ae?'<div style="flex:1; background:rgba(239,68,68,0.25); height:100%"></div>':""}
                    `})()}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:var(--text-tertiary)">
                  <span>0%</span>
                  <span>Budget Utilization: ${ke>0?Math.round(Me/ke*100):0}%</span>
                  <span>${ke>0&&Me>ke?`${Math.round(Me/ke*100)}% (Overspent)`:"100%"}</span>
                </div>
              </div>

              <!-- Itemized Variance Table -->
              <table class="data-table" style="font-size:13px; margin:0">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th style="text-align:right">Quoted Estimate</th>
                    <th style="text-align:right">Actual Spent</th>
                    <th style="text-align:right">Variance / Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight:600">Labor Pay</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${he.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${Ee.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${Ce>0?"var(--color-danger)":Ce<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${Ce>0?`+$${Ce.toFixed(2)}`:Ce<0?`-$${Math.abs(Ce).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Material Costs</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${Te.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${Oe.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${Fe>0?"var(--color-danger)":Fe<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${Fe>0?`+$${Fe.toFixed(2)}`:Fe<0?`-$${Math.abs(Fe).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  ${Qe>0?`
                    <tr>
                      <td style="font-weight:600">Asset Recovery (Van/Tools)</td>
                      <td style="text-align:right; color:var(--text-secondary)">$0.00</td>
                      <td style="text-align:right; font-weight:600">$${Qe.toFixed(2)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--color-danger)">+$${Qe.toFixed(2)}</td>
                    </tr>
                  `:""}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color); font-weight:700">
                    <td>Total Job Expenses</td>
                    <td style="text-align:right">$${ke.toFixed(2)}</td>
                    <td style="text-align:right; color:var(--color-primary)">$${Me.toFixed(2)}</td>
                    <td style="text-align:right; color:${je>0?"var(--color-danger)":je<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${je>0?`+$${je.toFixed(2)}`:je<0?`-$${Math.abs(je).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Original Grid details -->
          <div class="grid-2">
            <div class="card">
              <div class="card-header"><h4>Job Information</h4></div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${h("Job Number",v(t.number))}
                  ${h("Title",v(t.title))}
                  ${h("Type",v(t.type))}
                  ${h("Status",v(t.status))}
                  ${h("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${Q}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${Q}%</span></div>`)}
                  ${h("Priority",v(t.priority))}
                  ${h("Customer",v(t.customerName))}
                  ${h("Contact",v(t.contactName||"—"))}
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
                  ${h("Technicians",K)}
                  ${h("Scheduled",t.scheduledDate?new Date(t.scheduledDate).toLocaleDateString():"—")}
                  ${h("Est. Hours",t.estimatedHours||"—")}
                  ${h("Site Address",v(t.siteAddress||"—"))}
                  ${h("Quote Ref",t.quoteId?`<a href="#/quotes/${v(t.quoteId)}">${v(t.quoteId)}</a>`:"—")}
                  ${h("Created",new Date(t.createdAt).toLocaleDateString())}
                </div>
              </div>
            </div>
          </div>

        </div>
      `,($=x.querySelector("#btn-add-schedule"))==null||$.addEventListener("click",()=>{const xe=l.getAll("technicians"),Ae=l.getAll("schedule").filter(de=>de.jobId===a),Ne=document.createElement("div");function Ve(de,ie=[],be=[]){let ge=[];return de&&de.forEach((ve,ye)=>{const Ie=[...ie,ye].join("-"),Pe=[...be,ve.name].join(" > ");ge.push({path:Ie,name:Pe,isLeaf:!ve.subTasks||ve.subTasks.length===0}),ve.subTasks&&(ge=ge.concat(Ve(ve.subTasks,[...ie,ye],[...be,ve.name])))}),ge}const Je=Ve(t.tasks||[]);function bt(de){let ie="";return de.forEach((be,ge)=>{ie+='<div class="sched-entry" data-index="'+ge+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',ie+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',ie+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(ge+1)+"</span>",de.length>1&&(ie+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+ge+'" style="padding:2px 8px">✕ Remove</button>'),ie+="</div>",ie+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',ie+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',ie+='<select class="form-select sched-task" style="width:100%">',ie+='<option value="">-- Select a Task --</option>',Je.forEach(ye=>{ie+=`<option value="${ye.path}" ${be.taskPath===ye.path?"selected":""}>${v(ye.name)}</option>`}),ie+="</select></div>",ie+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',ie+='<input type="datetime-local" class="form-input sched-start" value="'+be.start+'"></div>',ie+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',ie+='<input type="datetime-local" class="form-input sched-finish" value="'+be.finish+'"></div>',ie+="</div>",ie+='<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>',ie+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',xe.forEach(ye=>{const Ie=be.techIds.includes(ye.id),Pe=Ie?"var(--color-primary)":"var(--border-color)",Ge=Ie?"var(--color-primary-light)":"transparent",ze=Ie?"var(--color-primary)":"var(--text-secondary)";ie+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Pe+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ge+";color:"+ze+';transition:all 0.15s">',ie+='<input type="checkbox" class="tech-check" data-tech-id="'+ye.id+'" '+(Ie?"checked":"")+' style="display:none">',ie+='<span class="material-icons-outlined" style="font-size:14px">person</span>',ie+=v(ye.name),ie+="</label>"}),ie+="</div></div>";const ve=l.getAll("assets").filter(ye=>ye.category==="Business");ie+='<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>',ie+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">',ve.forEach(ye=>{const Ie=be.assetIds&&be.assetIds.includes(ye.id),Pe=Ie?"var(--color-primary)":"var(--border-color)",Ge=Ie?"var(--color-primary-light)":"transparent",ze=Ie?"var(--color-primary)":"var(--text-secondary)";ie+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Pe+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ge+";color:"+ze+';transition:all 0.15s">',ie+='<input type="checkbox" class="asset-check" data-asset-id="'+ye.id+'" '+(Ie?"checked":"")+' style="display:none">',ie+='<span class="material-icons-outlined" style="font-size:14px">handyman</span>',ie+=v(ye.name),ie+="</label>"}),ve.length===0&&(ie+='<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>'),ie+="</div></div></div>"}),ie}function rt(de){if(!document.getElementById("sched-modal-styles")){const be=document.createElement("style");be.id="sched-modal-styles",be.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(be)}let ie="";Ae.length>0&&(ie+='<div style="margin-bottom:16px">',ie+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',Ae.forEach(be=>{const ge=new Date(be.startTime||be.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});ie+='<div class="sched-summary-row" style="flex-wrap:wrap">',ie+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',ie+='<span style="font-weight:500">'+v(be.technicianName)+"</span>",ie+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+v(be.taskName||"General Task")+"</span>",ie+='<span style="color:var(--text-tertiary);margin-left:auto">'+ge+"</span>",ie+='<span style="font-weight:600;margin-left:12px">'+be.hours+"h</span>",ie+="</div>"}),ie+="</div>",ie+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),ie+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',ie+='<div id="sched-entries">'+bt(de)+"</div>",ie+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',ie+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',Ne.innerHTML=ie,Ne.querySelectorAll(".tech-check").forEach(be=>{const ge=be.closest("label");be.addEventListener("change",()=>{be.checked?(ge.style.borderColor="var(--color-primary)",ge.style.background="var(--color-primary-light)",ge.style.color="var(--color-primary)"):(ge.style.borderColor="var(--border-color)",ge.style.background="transparent",ge.style.color="var(--text-secondary)")})}),Ne.querySelectorAll(".asset-check").forEach(be=>{const ge=be.closest("label");be.addEventListener("change",()=>{be.checked?(ge.style.borderColor="var(--color-primary)",ge.style.background="var(--color-primary-light)",ge.style.color="var(--color-primary)"):(ge.style.borderColor="var(--border-color)",ge.style.background="transparent",ge.style.color="var(--text-secondary)")})}),Ne.querySelectorAll(".btn-remove-entry").forEach(be=>{be.addEventListener("click",()=>{de.splice(parseInt(be.dataset.index),1),rt(de)})}),Ne.querySelector("#btn-add-entry").addEventListener("click",()=>{const be=ye=>ye.toString().padStart(2,"0"),ge=new Date;ge.setDate(ge.getDate()+1);const ve=`${ge.getFullYear()}-${be(ge.getMonth()+1)}-${be(ge.getDate())}`;de.push({taskPath:"",start:`${ve}T08:00`,finish:`${ve}T16:00`,techIds:[],assetIds:[]}),rt(de)})}const vt=de=>de.toString().padStart(2,"0"),Ke=new Date,lt=`${Ke.getFullYear()}-${vt(Ke.getMonth()+1)}-${vt(Ke.getDate())}`,pt=t.technicianId?[t.technicianId]:[],Ue=[{taskPath:"",start:`${lt}T08:00`,finish:`${lt}T16:00`,techIds:pt,assetIds:[]}];rt(Ue);function Nt(){const de=[];return Ne.querySelectorAll(".sched-entry").forEach((ie,be)=>{var Ge,ze,ot;const ge=(Ge=ie.querySelector(".sched-task"))==null?void 0:Ge.value,ve=(ze=ie.querySelector(".sched-start"))==null?void 0:ze.value,ye=(ot=ie.querySelector(".sched-finish"))==null?void 0:ot.value,Ie=[...ie.querySelectorAll(".tech-check:checked")].map(Ye=>Ye.dataset.techId),Pe=[...ie.querySelectorAll(".asset-check:checked")].map(Ye=>Ye.dataset.assetId);de.push({taskPath:ge,start:ve,finish:ye,techIds:Ie,assetIds:Pe})}),de}$e({title:`Schedule Job: ${v(t.title||t.number)}`,content:Ne,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:de=>de()},{label:"Save Schedule",className:"btn-primary",onClick:de=>{const ie=Nt();let be=0,ge=[];if(ie.forEach((ve,ye)=>{var ot;if(!ve.taskPath){ge.push(`Entry ${ye+1}: please select a task`);return}if(!ve.start||!ve.finish){ge.push(`Entry ${ye+1}: missing start or finish`);return}const Ie=new Date(ve.start),Pe=new Date(ve.finish);if(Pe<=Ie){ge.push(`Entry ${ye+1}: finish must be after start`);return}if(ve.techIds.length===0){ge.push(`Entry ${ye+1}: select at least one technician`);return}const Ge=Math.round((Pe-Ie)/36e5*100)/100,ze=((ot=Je.find(Ye=>Ye.path===ve.taskPath))==null?void 0:ot.name)||"Unknown Task";ve.techIds.forEach(Ye=>{const yt=xe.find(Ua=>Ua.id===Ye);yt&&(l.create("schedule",{jobId:a,jobNumber:t.number,taskPath:ve.taskPath,taskName:ze,technicianId:Ye,technicianName:yt.name,date:ve.start.split("T")[0],startTime:ve.start,finishTime:ve.finish,hours:Ge}),be++)}),ve.assetIds&&ve.assetIds.length>0&&ve.assetIds.forEach(Ye=>{const yt=l.getById("assets",Ye);yt&&l.create("assetUsage",{jobId:a,assetId:Ye,assetName:yt.name,taskPath:ve.taskPath,taskName:ze,startTime:ve.start,finishTime:ve.finish,hours:Ge,recoveryRate:yt.recoveryRate||0})})}),ge.length){O(ge[0],"error");return}if(ie.length>0&&ie[0].start){const ye=[...new Set(ie.flatMap(Ie=>Ie.techIds))].map(Ie=>{const Pe=xe.find(ze=>ze.id===Ie),Ge=ie.filter(ze=>ze.techIds.includes(Ie)).reduce((ze,ot)=>{const Ye=(new Date(ot.finish)-new Date(ot.start))/36e5;return ze+(isNaN(Ye)?0:Ye)},0);return{id:Ie,name:(Pe==null?void 0:Pe.name)||"",hours:Math.round(Ge*100)/100}});l.update("jobs",a,{scheduledDate:ie[0].start.split("T")[0],technicians:ye,technicianName:ye.map(Ie=>Ie.name).join(", ")}),me(async()=>{const{addSystemNotification:Ie}=await Promise.resolve().then(()=>qe);return{addSystemNotification:Ie}},void 0).then(({addSystemNotification:Ie})=>{ye.forEach(Pe=>{Ie("New Schedule Assignment",`You have been scheduled for Job ${t.number} (${t.title}) starting ${ie[0].start.replace("T"," ")} (${Pe.hours} hrs total).`,`/jobs/${a}`)})})}O(`${be} schedule ${be===1?"entry":"entries"} saved`,"success"),de(),p()}}]})})}else if(r==="tasks"){let W=function(X,oe){let le=X[oe[0]];if(!le)return null;for(let ce=1;ce<oe.length;ce++)if(!le.subTasks||(le=le.subTasks[oe[ce]],!le))return null;return le},B=function(X){return!X.subTasks||X.subTasks.length===0?(parseFloat(X.estimatedHours)||0)*(parseInt(X.people)||1):X.subTasks.reduce((oe,le)=>oe+B(le),0)},te=function(X,oe){if(oe.length<=1)return;const le=oe.slice(0,-1),ce=W(X,le);if(ce&&ce.subTasks&&ce.subTasks.length>0){let Se=0,fe=0;ce.subTasks.forEach(he=>{const Te=(parseFloat(he.estimatedHours)||1)*(parseInt(he.people)||1);Se+=Te,fe+=Te*((he.progress||0)/100)}),ce.progress=Se>0?Math.round(fe/Se*100):0,ce.progress===100?ce.status="Completed":ce.progress>0?ce.status="In Progress":ce.status="Not Started",te(X,le)}};var E=W,k=B,S=te;const Q=JSON.parse(localStorage.getItem("currentUser")||"{}");let K=!0;if(Q.userTypeId){const X=l.getById("userTypes",Q.userTypeId);if(X&&X.permissions){const oe=X.permissions.find(le=>le.module==="Jobs");oe&&(K=oe.edit)}}else(Q.role==="customer"||Q.role==="technician")&&(K=!1);t.tasks||(t.tasks=[{id:l.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}]),t.tasks.forEach(X=>{X.subTasks||(X.subTasks=[])});const ae=X=>{X.forEach(oe=>{oe.assignedContractorId&&(!oe.assignedContractorIds||oe.assignedContractorIds.length===0)&&(oe.assignedContractorIds=[oe.assignedContractorId]),oe.subTasks&&ae(oe.subTasks)})};ae(t.tasks);const F=l.getAll("contractors").filter(X=>X.active);let ue=!0,pe=t.tasks;for(let X=0;X<c.length;X++){if(!pe||!pe[c[X]]){ue=!1;break}pe=pe[c[X]].subTasks}ue||(c=[]),x.innerHTML=`
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
            ${(()=>{const X=o.length>0?W(t.tasks,o):null,oe=X?X.subTasks||[]:t.tasks,le=X?v(X.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${o.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${le}">${le}</span>
                    </div>
                    ${K?o.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${o.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${oe.map((ce,Se)=>{const fe=[...o,Se],he=fe.join("-")===c.join("-");return`
                        <div class="task-list-item" data-path="${fe.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${he?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${he?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${v(ce.name)}">${v(ce.name)}</span>
                          ${ce.subTasks&&ce.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${fe.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${fe.join("-")}" ${ce.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${oe.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${c.length>0?(()=>{const X=c,oe=W(t.tasks,X);if(!oe)return"";const le=oe.subTasks&&oe.subTasks.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${d?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${v(oe.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${K?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${X.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${K?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${X.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${v(oe.name)}" ${K?"":"disabled"} />
                  </div>
                  ${le?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${B(oe)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${oe.startDate?oe.startDate.split("T")[0]:""}" ${K?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${oe.estimatedHours||""}" min="0" step="0.5" ${K?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${oe.people||"1"}" min="1" step="1" ${K?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${oe.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${oe.progress>50?"#fff":"#000"}">${oe.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="margin-bottom:8px">Assigned Subcontractors</label>
                    <div style="border:1px solid var(--border-color); border-radius:6px; max-height:160px; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; background:var(--bg-color)">
                      ${F.map(ce=>{const Se=(oe.assignedContractorIds||[]).includes(ce.id);return`
                          <label class="contractor-checkbox-label" style="display:flex; align-items:center; gap:8px; margin:0; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:normal; transition:background 0.2s">
                            <input type="checkbox" class="contractor-assign-checkbox" value="${ce.id}" ${Se?"checked":""} ${K?"":"disabled"} style="width:16px; height:16px; margin:0; cursor:pointer" />
                            <span style="font-weight:500; color:var(--text-primary)">${v(ce.businessName)}</span>
                            <span style="color:var(--text-tertiary); font-size:11px">(${v(ce.contactName)})</span>
                          </label>
                        `}).join("")}
                      ${F.length===0?'<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:12px">No active subcontractors found</div>':""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${K?"":"disabled"}>${v(oe.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${v(oe.name)}">Info Panel: ${v(oe.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${K&&X.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${X.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      ${le?"":`<button class="btn btn-sm btn-secondary btn-book-time" data-path="${X.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>`}
                      ${K?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                      ${K?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${X.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${v(oe.name)}</div>
                  </div>
                  ${le?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${B(oe)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${oe.startDate?oe.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${oe.estimatedHours?oe.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${oe.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${oe.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${oe.progress>50?"#fff":"#000"}">${oe.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:6px">Assigned Subcontractors</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px">
                      ${(()=>{const ce=oe.assignedContractorIds||[];return ce.length===0?'<span style="color:var(--text-tertiary); font-style:italic; font-size:13px">Unassigned</span>':ce.map(Se=>{const fe=l.getById("contractors",Se),he=fe?fe.businessName:"Unknown Subcontractor";return`
                            <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600; display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:4px; font-size:12px">
                              <span class="material-icons-outlined" style="font-size:14px">engineering</span>
                              ${v(he)}
                            </span>
                          `}).join("")})()}
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${v(oe.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(f=x.querySelector(".btn-view-back"))==null||f.addEventListener("click",()=>{o.pop(),p()}),x.querySelectorAll(".btn-drill-down").forEach(X=>{X.addEventListener("click",oe=>{oe.stopPropagation(),o=X.dataset.path.split("-").map(Number),c=[...o],p()})}),x.querySelectorAll(".task-list-checkbox").forEach(X=>{X.addEventListener("change",oe=>{const le=oe.target.dataset.path.split("-").map(Number),ce=W(t.tasks,le);ce.progress=oe.target.checked?100:0,ce.status=oe.target.checked?"Completed":"Not Started",te(t.tasks,le),p()}),X.addEventListener("click",oe=>oe.stopPropagation())}),x.querySelectorAll(".task-list-item").forEach(X=>{X.addEventListener("click",oe=>{if(oe.target.closest(".btn-drill-down"))return;c=oe.currentTarget.dataset.path.split("-").map(Number),d=!1,p()})}),(T=x.querySelector(".btn-edit-info"))==null||T.addEventListener("click",()=>{d=!0,p()}),(C=x.querySelector(".btn-done-info"))==null||C.addEventListener("click",()=>{d=!1,p()}),(z=x.querySelector("#btn-add-main-task"))==null||z.addEventListener("click",()=>{t.tasks||(t.tasks=[]),t.tasks.push({id:l.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),c=[t.tasks.length-1],p()}),x.querySelectorAll(".btn-add-child-task").forEach(X=>{X.addEventListener("click",oe=>{const le=oe.currentTarget.dataset.path.split("-").map(Number),ce=W(t.tasks,le);ce.subTasks||(ce.subTasks=[]),ce.subTasks.push({id:l.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),c=[...le,ce.subTasks.length-1],p()})}),x.querySelectorAll(".detail-input").forEach(X=>{X.addEventListener("change",oe=>{const le=W(t.tasks,c),ce=oe.target.dataset.field;ce==="progress-check"?(le.progress=oe.target.checked?100:0,le.status=oe.target.checked?"Completed":"Not Started"):ce==="progress"?(le.progress=parseInt(oe.target.value),le.progress===100?le.status="Completed":le.progress===0?le.status="Not Started":le.status="In Progress"):ce==="estimatedHours"?le.estimatedHours=parseFloat(oe.target.value)||0:le[ce]=oe.target.value,te(t.tasks,c),p()})}),x.querySelectorAll(".contractor-assign-checkbox").forEach(X=>{X.addEventListener("change",()=>{const oe=W(t.tasks,c);oe.assignedContractorIds||(oe.assignedContractorIds=[]);const le=Array.from(x.querySelectorAll(".contractor-assign-checkbox:checked")).map(ce=>ce.value);if(oe.assignedContractorIds=le,le.length>0){oe.assignedContractorId=le[0];const ce=l.getById("contractors",le[0]);oe.assignedContractorName=ce?ce.businessName:""}else oe.assignedContractorId=null,oe.assignedContractorName="";te(t.tasks,c),p()})}),x.querySelectorAll(".btn-remove-task").forEach(X=>{X.addEventListener("click",oe=>{const le=X.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(le.length===1)t.tasks.splice(le[0],1);else{const ce=le.slice(0,-1),Se=W(t.tasks,ce);Se&&Se.subTasks&&Se.subTasks.splice(le[le.length-1],1),te(t.tasks,ce)}c=le.slice(0,-1),d=!1,p()}})}),(J=x.querySelector("#btn-save-tasks"))==null||J.addEventListener("click",()=>{l.update("jobs",a,{tasks:t.tasks}),O("Tasks saved","success")}),(L=x.querySelector("#btn-save-tasklist-template"))==null||L.addEventListener("click",()=>{const X=document.createElement("div");X.innerHTML=`
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
         `,$e({title:"Save Tasklist as Template",content:X,actions:[{label:"Cancel",className:"btn-secondary",onClick:oe=>oe()},{label:"Save Template",className:"btn-primary",onClick:oe=>{const le=X.querySelector("#tmpl-name").value,ce=X.querySelector("#tmpl-desc").value,Se=X.querySelector("#tmpl-tags").value.split(",").map(he=>he.trim()).filter(Boolean);if(!le){O("Template name is required","error");return}function fe(he){return he.map(Te=>({...Te,id:l.generateId(),status:"Not Started",progress:0,subTasks:Te.subTasks||Te.subPhases?fe(Te.subTasks||Te.subPhases):[]}))}l.create("taskTemplates",{name:le,description:ce,tags:Se,tasks:fe(t.tasks||t.phases||[]),createdAt:new Date().toISOString()}),O("Tasklist saved as template","success"),oe()}}]})}),(j=x.querySelector("#btn-import-tasklist"))==null||j.addEventListener("click",()=>{const X=l.getAll("taskTemplates"),oe=l.getAll("jobs").filter(fe=>fe.id!==a&&(fe.tasks&&fe.tasks.length>0||fe.phases&&fe.phases.length>0));let le="templates";const ce=document.createElement("div");ce.innerHTML=`
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;function Se(fe=""){const he=ce.querySelector("#import-content"),Te=fe.toLowerCase();if(le==="templates"){const ke=X.filter(Ee=>Ee.name.toLowerCase().includes(Te)||(Ee.description||"").toLowerCase().includes(Te)||(Ee.tags||[]).some(Oe=>Oe.toLowerCase().includes(Te)));he.innerHTML=ke.length?ke.map(Ee=>{const Oe=Ee.tasks||Ee.phases||[];return`
               <div class="import-item" data-id="${Ee.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${v(Ee.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${Oe.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${v(Ee.description||"No description.")}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(Ee.tags||[]).map(Qe=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${v(Qe)}</span>`).join("")}
                 </div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${fe}"</div>`}else{const ke=oe.filter(Ee=>Ee.number.toLowerCase().includes(Te)||Ee.title.toLowerCase().includes(Te)||Ee.customerName.toLowerCase().includes(Te));he.innerHTML=ke.length?ke.map(Ee=>{const Oe=Ee.tasks||Ee.phases||[];return`
               <div class="import-item" data-id="${Ee.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${v(Ee.number)} - ${v(Ee.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${v(Ee.customerName)} · ${Oe.length} tasks</div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${fe}"</div>`}he.querySelectorAll(".import-item").forEach(ke=>{ke.addEventListener("click",()=>{var je;const Ee=ke.dataset.id,Oe=ke.dataset.type,Qe=l.getAll("taskTemplates"),Me=l.getAll("jobs"),Ce=Oe==="template"?Qe.find(xe=>String(xe.id)===String(Ee)):Me.find(xe=>String(xe.id)===String(Ee));if(Ce&&(Ce.tasks||Ce.phases)){if(confirm(`Replace current tasklist with "${Ce.name||Ce.number}"?`)){let xe=function(Ae){return Ae.map(Ne=>({...Ne,id:l.generateId(),status:"Not Started",progress:0,subTasks:Ne.subTasks||Ne.subPhases?xe(Ne.subTasks||Ne.subPhases):[]}))};var Fe=xe;t.tasks=xe(Ce.tasks||Ce.phases),c=[0],o=[],O(`Imported ${Ce.name||Ce.number}`,"success"),p(),(je=document.querySelector(".modal-overlay"))==null||je.remove()}}else O("Could not find source data","error")})})}Se(),ce.querySelectorAll(".tab").forEach(fe=>{fe.addEventListener("click",()=>{ce.querySelectorAll(".tab").forEach(he=>he.classList.remove("active")),fe.classList.add("active"),le=fe.dataset.tab,ce.querySelector("#import-search").placeholder=le==="templates"?"Search templates...":"Search jobs...",Se(ce.querySelector("#import-search").value)})}),ce.querySelector("#import-search").addEventListener("input",fe=>{Se(fe.target.value)}),$e({title:"Import Tasklist",content:ce,actions:[{label:"Cancel",className:"btn-secondary",onClick:fe=>fe()}]})}),x.querySelectorAll(".btn-duplicate-task").forEach(X=>{X.addEventListener("click",oe=>{const le=oe.currentTarget.dataset.path.split("-").map(Number),ce=W(t.tasks,le);function Se(he,Te){return{...he,id:l.generateId(),name:he.name+(Te?" (Copy)":""),progress:0,status:"Not Started",subTasks:he.subTasks?he.subTasks.map(ke=>Se(ke,!1)):[]}}const fe=Se(ce,!0);if(le.length===1)t.tasks.splice(le[0]+1,0,fe);else{const he=le.slice(0,-1);W(t.tasks,he).subTasks.splice(le[le.length-1]+1,0,fe),te(t.tasks,he)}p()})}),x.querySelectorAll(".btn-book-time").forEach(X=>{X.addEventListener("click",oe=>{const le=oe.currentTarget.dataset.path.split("-").map(Number),ce=W(t.tasks,le),Se=JSON.parse(localStorage.getItem("currentUser")||"{}"),fe=l.getAll("timesheets").filter(Ce=>Ce.jobId===a),he=l.getAll("technicians"),Te=new Date,ke=Ce=>Ce.toString().padStart(2,"0"),Ee=`${Te.getFullYear()}-${ke(Te.getMonth()+1)}-${ke(Te.getDate())}`,Oe=`${Ee}T09:00`,Qe=`${Ee}T10:00`,Me=document.createElement("div");Me.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${fe.reduce((Ce,Fe)=>Ce+(Fe.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${fe.length?fe.map(Ce=>`
                      <tr>
                        <td>${Ce.startTime?new Date(Ce.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(Ce.date).toLocaleDateString()}</td>
                        <td>${v(Ce.technicianName)}</td>
                        <td>${v(Ce.taskName||Ce.phaseName||"—")}</td>
                        <td style="font-weight:600">${Ce.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${Oe}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${Qe}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${he.map(Ce=>`<option value="${Ce.id}" ${Ce.name===Se.name?"selected":""}>${Ce.name}</option>`).join("")}
              </select>
            </div>
            `,$e({title:"Book Time: "+v(ce.name),size:"modal-70",content:Me,actions:[{label:"Cancel",className:"btn-secondary",onClick:Ce=>Ce()},{label:"Log Time",className:"btn-primary",onClick:Ce=>{const Fe=document.getElementById("bt-start").value,je=document.getElementById("bt-finish").value,xe=document.getElementById("bt-tech").value,Ae=ce.name;if(!Fe||!je||!xe){O("Please fill all required fields","error");return}const Ne=new Date(Fe),Ve=new Date(je);if(Ve<=Ne){O("Finish time must be after start time","error");return}const Je=Math.round((Ve-Ne)/36e5*100)/100,bt=he.find(rt=>rt.id===xe);l.create("timesheets",{jobId:a,jobNumber:t.number,taskId:ce.id,taskPath:le.join("-"),taskName:ce.name,phaseId:ce.id,phaseName:ce.name,technicianId:xe,technicianName:bt.name,date:Fe.split("T")[0],startTime:Fe,finishTime:je,description:Ae,hours:Je,status:"Pending"}),O("Time booked successfully","success"),p(),Ce()}}]})})})}else if(r==="costs"){let Nt=function(){const de=(t.materials||[]).reduce((ge,ve)=>ge+ve.quantity*(ve.unitCost||0),0),ie=parseFloat(x.querySelector("#inp-material-cost").value)||0,be=de+ie;x.querySelector("#sum-mat").textContent="$"+be.toFixed(2),x.querySelector("#sum-total").textContent="$"+(W+be).toFixed(2)};var D=Nt;if(!t.materials){const ie=l.getAll("quotes").filter(be=>be.jobId===a||t.quoteId===be.id).find(be=>be.status==="Accepted")||l.getById("quotes",t.quoteId);ie&&ie.sections&&(t.materials=[],ie.sections.forEach(be=>{(be.lineItems||[]).forEach(ge=>{if(ge.type==="material"){const ve=l.getAll("stock").find(ye=>ye.name===ge.description);t.materials.push({stockId:ve?ve.id:null,name:ge.description||"Unknown Material",quantity:ge.qty||1,unitCost:ve&&(ve.costPrice||ve.unitPrice)||0,fromQuote:!0})}})}),l.update("jobs",a,{materials:t.materials}))}t.materials||(t.materials=[]);const Q=l.getAll("timesheets").filter(de=>de.jobId===a),K=l.getAll("technicians"),ae={};let F=0,W=0;Q.forEach(de=>{if(!ae[de.technicianId]){const ie=K.find(be=>be.id===de.technicianId);ae[de.technicianId]={id:de.technicianId,name:de.technicianName||(ie?ie.name:"Unknown Tech"),hours:0,rate:ie&&(ie.payRate||ie.hourlyRate)||45}}ae[de.technicianId].hours+=de.hours||0});const B=Object.values(ae);B.forEach(de=>{F+=de.hours,W+=de.hours*de.rate});const te=l.getAll("assetUsage").filter(de=>de.jobId===a),ue=l.getAll("assets");let pe=0;const X=te.map(de=>{const ie=ue.find(ve=>ve.id===de.assetId),be=de.recoveryRate||(ie?ie.recoveryRate:0)||0,ge=de.hours*be;return pe+=ge,{...de,rate:be,cost:ge}}),oe=t.materials.reduce((de,ie)=>de+ie.quantity*(ie.unitCost||0),0),le=parseFloat(t.additionalMaterialCost||0),ce=oe+le,Se=l.getSettings(),fe=Ia(t.materials,Se),he=Qt(le,Se),Te=fe+(le>0?he-le:0)+le;(t.laborCost!==W||t.estimatedHours!==F||t.materialCost!==ce||t.assetCost!==pe)&&(t.laborCost=W,t.estimatedHours=F,t.materialCost=ce,t.assetCost=pe,l.update("jobs",a,{laborCost:W,estimatedHours:F,materialCost:ce,assetCost:pe}));const ke=Se.laborRates.find(de=>de.id===t.laborRateProfileId)||Se.laborRates.find(de=>de.isDefault),Ee=F*(ke?ke.rate:85),Oe=ke&&ke.minCallOutFee||0,Qe=Math.max(Ee,Oe),Me=Qe+Te,Ce=W+ce+pe,Fe=Me-Ce,je=Me>0?Fe/Me*100:0,Ae=l.getAll("quotes").filter(de=>de.jobId===a||t.quoteId===de.id||de.number===t.quoteNumber).find(de=>de.status==="Accepted")||(t.quoteId?l.getById("quotes",t.quoteId):null);let Ne=0,Ve=0;Ae&&Ae.sections?Ae.sections.forEach(de=>{(de.lineItems||[]).forEach(ie=>{ie.type==="labor"?Ne+=(ie.qty||0)*(ie.internalCost||ie.rate||45):ie.type==="material"&&(Ve+=(ie.qty||0)*(ie.internalCost||0))})}):(Ne=parseFloat(t.estimatedLaborCost||t.laborCost||0),Ve=parseFloat(t.estimatedMaterialCost||t.materialCost||0));const Je=Ne+Ve,bt=W,rt=ce,vt=pe,Ke=bt+rt+vt,lt=bt-Ne,pt=rt-Ve,Ue=Ke-Je;x.innerHTML=`
        <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
          
          <!-- Budget Deviation Tracker Card -->
          <div class="card" style="border: 1.5px solid ${Ue>0?"var(--color-danger)":"var(--color-success)"}">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:${Ue>0?"rgba(239,68,68,0.02)":"rgba(16,185,129,0.02)"}; padding: 12px 16px">
              <h4 style="margin:0; color:${Ue>0?"var(--color-danger)":"var(--color-success-dark)"}; display:flex; align-items:center; gap:8px">
                <span class="material-icons-outlined" style="font-size:20px">analytics</span>
                Budget Deviation & Costs Tracker
              </h4>
              <span class="badge ${Ue>0?"badge-danger":"badge-success"}" style="font-weight:700">
                ${Ue>0?"Over Budget":"Under Budget"}
              </span>
            </div>
            <div class="card-body" style="padding: 16px">
              ${Ue>0?`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(239,68,68,0.08); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; margin-bottom:16px; color:#c53030">
                  <span class="material-icons-outlined" style="font-size:20px">warning</span>
                  <div style="font-size:13px">
                    <strong>Budget Overrun Detected</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Actual expenses have exceeded the quoted estimation by <strong>$${Ue.toFixed(2)}</strong>. Customer approval may be required for additional variations.</div>
                  </div>
                </div>
              `:`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.08); border-left:4px solid var(--color-success); padding:12px; border-radius:4px; margin-bottom:16px; color:#2f855a">
                  <span class="material-icons-outlined" style="font-size:20px">check_circle</span>
                  <div style="font-size:13px">
                    <strong>Expenses Within Quoted Budget</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Current expenses are within the original quoted estimation. Remaining budget margin: <strong>$${Math.abs(Ue).toFixed(2)}</strong>.</div>
                  </div>
                </div>
              `}

              <!-- Visual Progress Comparison Bar -->
              <div style="margin-bottom:18px">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; font-weight:600; color:var(--text-secondary)">
                  <span>Quoted Estimate ($${Je.toFixed(2)})</span>
                  <span>Actual Expenses ($${Ke.toFixed(2)})</span>
                </div>
                <div style="width:100%; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:flex">
                  ${(()=>{const de=Je>0?Math.min(100,Math.round(Ke/Je*100)):100,ie=Ke>Je;return`
                      <div style="width:${de}%; background:${ie?"var(--color-danger)":"var(--color-success)"}; height:100%; transition:width 0.4s ease; border-radius:6px"></div>
                      ${ie?'<div style="flex:1; background:rgba(239,68,68,0.25); height:100%"></div>':""}
                    `})()}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:var(--text-tertiary)">
                  <span>0%</span>
                  <span>Budget Utilization: ${Je>0?Math.round(Ke/Je*100):0}%</span>
                  <span>${Je>0&&Ke>Je?`${Math.round(Ke/Je*100)}% (Overspent)`:"100%"}</span>
                </div>
              </div>

              <!-- Itemized Variance Table -->
              <table class="data-table" style="font-size:13px; margin:0">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th style="text-align:right">Quoted Estimate</th>
                    <th style="text-align:right">Actual Spent</th>
                    <th style="text-align:right">Variance / Deviation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight:600">Labor Pay</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${Ne.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${bt.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${lt>0?"var(--color-danger)":lt<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${lt>0?`+$${lt.toFixed(2)}`:lt<0?`-$${Math.abs(lt).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Material Costs</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${Ve.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${rt.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${pt>0?"var(--color-danger)":pt<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${pt>0?`+$${pt.toFixed(2)}`:pt<0?`-$${Math.abs(pt).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  ${vt>0?`
                    <tr>
                      <td style="font-weight:600">Asset Recovery (Van/Tools)</td>
                      <td style="text-align:right; color:var(--text-secondary)">$0.00</td>
                      <td style="text-align:right; font-weight:600">$${vt.toFixed(2)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--color-danger)">+$${vt.toFixed(2)}</td>
                    </tr>
                  `:""}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color); font-weight:700">
                    <td>Total Job Expenses</td>
                    <td style="text-align:right">$${Je.toFixed(2)}</td>
                    <td style="text-align:right; color:var(--color-primary)">$${Ke.toFixed(2)}</td>
                    <td style="text-align:right; color:${Ue>0?"var(--color-danger)":Ue<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${Ue>0?`+$${Ue.toFixed(2)}`:Ue<0?`-$${Math.abs(Ue).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
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
                  ${B.map(de=>`
                    <tr>
                      <td>${v(de.name)}</td>
                      <td style="font-weight:600">${de.hours.toFixed(2)}</td>
                      <td>$${(de.payRate||de.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(de.hours*(de.payRate||de.rate)).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${B.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>':""}
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
                  ${X.map(de=>`
                    <tr>
                      <td>${v(de.assetName)}</td>
                      <td style="font-weight:600">${de.hours.toFixed(2)}</td>
                      <td>$${de.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${de.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${X.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>':""}
                </tbody>
                ${X.length>0?`
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${pe.toFixed(2)}</td>
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
                  ${Se.laborRates.map(de=>`<option value="${de.id}" ${ke.id===de.id?"selected":""}>${de.name} ($${de.rate.toFixed(2)}/hr)</option>`).join("")}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${ke.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(ke.minCallOutFee||0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${Qe.toFixed(2)}</span>
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
                  ${t.materials.map((de,ie)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${v(de.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${de.quantity} x $${(de.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(de.quantity*(de.unitCost||0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${ie}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
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
                  <span class="text-secondary">Logged Hours</span><span class="font-medium">${F.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(W+ce).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${Me.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${Fe>=0?"var(--color-success-bg)":"var(--color-danger-bg)"}; color:${Fe>=0?"var(--color-success)":"var(--color-danger)"}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${Fe.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${je.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      `,(q=x.querySelector("#inp-labor-profile"))==null||q.addEventListener("change",de=>{t.laborRateProfileId=de.target.value,l.update("jobs",a,{laborRateProfileId:t.laborRateProfileId}),p()}),x.addEventListener("click",de=>{const ie=de.target.closest(".btn-remove-mat");if(ie){const be=parseInt(ie.dataset.index);t.materials.splice(be,1),p()}}),(A=x.querySelector("#btn-refresh-materials"))==null||A.addEventListener("click",()=>{const ie=l.getAll("quotes").filter(ve=>ve.jobId===a||t.quoteId===ve.id).find(ve=>ve.status==="Accepted")||l.getById("quotes",t.quoteId);if(!ie){O("No linked accepted quote found.","error");return}const be=(t.materials||[]).filter(ve=>!ve.fromQuote),ge=[];ie.sections.forEach(ve=>{(ve.lineItems||[]).forEach(ye=>{if(ye.type==="material"){const Ie=l.getAll("stock").find(Pe=>Pe.name===ye.description);ge.push({stockId:Ie?Ie.id:null,name:ye.description||"Unknown Material",quantity:ye.qty||1,unitCost:Ie&&(Ie.costPrice||Ie.unitPrice)||0,fromQuote:!0})}})}),t.materials=[...ge,...be],l.update("jobs",a,{materials:t.materials}),O("Materials refreshed from Quote","success"),p()}),(_=x.querySelector("#inp-material-cost"))==null||_.addEventListener("input",Nt),(H=x.querySelector("#btn-add-material"))==null||H.addEventListener("click",()=>{var Ge;const de=x.querySelector("#mat-select"),ie=parseInt(x.querySelector("#mat-qty").value)||1,be=de.value;if(!be)return;const[ge,ve]=be.split("::"),ye=l.getById("stock",ge);if(!ye)return;let Ie=0,Pe=null;if(ye.locations&&Array.isArray(ye.locations)?(Pe=ye.locations.find(ze=>ze.location===ve),Ie=Pe?Pe.quantity:0):Ie=ye.quantity||0,Ie<ie){O(`Not enough stock at ${ve}. Available: ${Ie}`,"error");return}Pe?(Pe.quantity-=ie,ye.locations=ye.locations.filter(ze=>ze.quantity>0),ye.quantity=ye.locations.reduce((ze,ot)=>ze+ot.quantity,0),ye.location=((Ge=ye.locations[0])==null?void 0:Ge.location)||"Main Warehouse"):ye.quantity-=ie,l.update("stock",ge,ye),u=null,t.materials.push({stockId:ye.id,name:`${ye.name} (${ve})`,quantity:ie,unitCost:ye.costPrice||ye.unitPrice||0,fromQuote:!1}),O(`Added ${ie}x ${ye.name} from ${ve}`,"success"),p()}),(R=x.querySelector("#btn-save-costs"))==null||R.addEventListener("click",()=>{const de=parseFloat(x.querySelector("#inp-material-cost").value)||0,be=(t.materials||[]).reduce((ge,ve)=>ge+ve.quantity*(ve.unitCost||0),0)+de;t.materialCost=be,t.additionalMaterialCost=de,l.update("jobs",a,{materials:t.materials,materialCost:be,additionalMaterialCost:de}),O("Additional costs saved","success"),p()})}else if(r==="quotes"){const Q=l.getAll("quotes").filter(K=>K.jobId===a||t.quoteId===K.id);x.innerHTML=`
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
                    <td><a href="#/quotes/${K.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${v(K.number)}</a></td>
                    <td>${v(K.title||"Untitled Quote")}</td>
                    <td><span class="badge ${K.status==="Accepted"?"badge-success":K.status==="Declined"?"badge-danger":K.status==="Sent"?"badge-info":"badge-neutral"}">${v(K.status)}</span></td>
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
      `,(V=x.querySelector("#btn-new-quote"))==null||V.addEventListener("click",()=>{const K=l.create("quotes",{customerId:t.customerId,customerName:t.customerName,title:t.title,jobId:t.id,status:"Draft",version:1,sections:[{id:l.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});O("Draft quote created","success"),Y.navigate("/quotes/"+K.id)})}else if(r==="activity")t.activityLog||(t.activityLog=[]),t.activityLog=t.activityLog.map(Q=>Q.type==="note"||Q.type==="attachment"?{id:Q.id,type:"combined",date:Q.date,content:Q.type==="note"?Q.content:"",files:Q.type==="attachment"?[Q.file]:[]}:Q),x.innerHTML=`
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
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${g.length?"16px":"0"}">
              ${g.map((Q,K)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${v(Q.name)}</span>
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
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${v(Q.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${Q.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${v(Q.content)}</div>`:""}
                      ${Q.files&&Q.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${Q.files.map(ae=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${ae.type&&ae.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${v(ae.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${v(ae.name)}">${v(ae.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(ae.size/1024).toFixed(1)} KB</div>
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
      `,setTimeout(()=>{x.querySelectorAll(".activity-log-item").forEach(Q=>{const K=Q.querySelector(".activity-content-wrapper"),ae=Q.querySelector(".expand-overlay");K&&K.scrollHeight>200&&(ae.style.display="flex",Q.style.paddingBottom="32px",ae.addEventListener("click",()=>{Q.dataset.expanded==="false"?(K.style.maxHeight=K.scrollHeight+"px",ae.style.background="transparent",ae.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',Q.dataset.expanded="true"):(K.style.maxHeight="200px",ae.style.background="linear-gradient(transparent, var(--content-bg))",ae.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',Q.dataset.expanded="false")}))})},0),x.querySelectorAll(".btn-remove-staged").forEach(Q=>{Q.addEventListener("click",K=>{const ae=parseInt(K.currentTarget.dataset.idx);g.splice(ae,1),p()})}),(se=x.querySelector("#btn-add-note"))==null||se.addEventListener("click",()=>{const Q=x.querySelector("#new-note-input").value.trim();!Q&&!g.length||(t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:Q,files:[...g],date:new Date().toISOString()}),l.update("jobs",a,{activityLog:t.activityLog}),g=[],p())}),(U=x.querySelector("#upload-attachment"))==null||U.addEventListener("change",Q=>{const K=Array.from(Q.target.files);if(!K.length)return;let ae=0;K.forEach(F=>{const W=new FileReader;W.onload=B=>{g.push({name:F.name,size:F.size,type:F.type,data:B.target.result}),ae++,ae===K.length&&p()},W.readAsDataURL(F)})}),x.querySelectorAll(".btn-delete-activity").forEach(Q=>{Q.addEventListener("click",()=>{t.activityLog=t.activityLog.filter(K=>K.id!==Q.dataset.id),l.update("jobs",a,{activityLog:t.activityLog}),p()})});else if(r==="timesheets"){const Q=l.getAll("timesheets").filter(F=>F.jobId===a),K=Q.reduce((F,W)=>F+(W.hours||0),0),ae=l.getAll("technicians");x.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${K} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Task</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
                      ${Q.length?Q.map(F=>{const W=String(F.technicianId)===String(currentUser.id),B=["admin","manager","office"].includes(currentUser.role)||W&&F.status!=="Approved",te=["admin","manager","office"].includes(currentUser.role)||W&&F.status!=="Approved";return`
                  <tr>
                    <td>${new Date(F.date).toLocaleDateString()}</td>
                    <td>${v(F.technicianName)}</td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${v(F.taskName||"—")}</span></td>
                    <td class="text-secondary">${v(F.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${F.hours}</td>
                    <td><span class="badge ${F.status==="Approved"?"badge-success":F.status==="Rejected"?"badge-danger":"badge-warning"}">${F.status}</span></td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${B?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${F.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:16px">edit</span>
                          </button>
                        `:""}
                        ${te?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-ts-job" data-id="${F.id}" title="Delete entry" style="color:var(--color-danger)">
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
      `,x.querySelectorAll(".btn-edit-ts-job").forEach(F=>{F.addEventListener("click",()=>{const W=F.dataset.id;ja(W,p)})}),x.querySelectorAll(".btn-delete-ts-job").forEach(F=>{F.addEventListener("click",()=>{const W=F.dataset.id,B=l.getById("timesheets",W);B&&$e({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${B.hours} hrs</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:te=>te()},{label:"Delete",className:"btn-danger",onClick:te=>{l.delete("timesheets",W),O("Timesheet entry deleted successfully","success"),te(),p()}}]})})}),(P=x.querySelector("#btn-log-time-tab"))==null||P.addEventListener("click",()=>{const F=JSON.parse(localStorage.getItem("currentUser")||"{}"),W=new Date,B=le=>le.toString().padStart(2,"0"),te=`${W.getFullYear()}-${B(W.getMonth()+1)}-${B(W.getDate())}`;function ue(le,ce=[],Se=[]){let fe=[];return le&&le.forEach((he,Te)=>{const ke=[...ce,Te].join("-"),Ee=[...Se,he.name].join(" > ");fe.push({path:ke,name:Ee,isLeaf:!he.subTasks||he.subTasks.length===0}),he.subTasks&&(fe=fe.concat(ue(he.subTasks,[...ce,Te],[...Se,he.name])))}),fe}const X=ue(t.tasks||[]).filter(le=>le.isLeaf),oe=document.createElement("div");oe.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${te}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech" ${F.role==="technician"?"disabled":""}>
                <option value="">Select tech...</option>
                ${ae.map(le=>`<option value="${le.id}" ${le.name===F.name?"selected":""}>${le.name}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: 1 / -1">
              <label class="form-label">Task *</label>
              <select class="form-select" id="lt-task" style="width:100%">
                <option value="">Select task...</option>
                ${X.map(le=>`<option value="${le.path}">${v(le.name)}</option>`).join("")}
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
        `,He({title:"Log Time",content:oe.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:le=>le()},{label:"Save",className:"btn-primary",onClick:le=>{const ce=document.querySelector(".drawer-overlay"),Se=ce.querySelector("#lt-date").value,fe=ce.querySelector("#lt-tech").value,he=ce.querySelector("#lt-task").value,Te=parseFloat(ce.querySelector("#lt-hours").value),ke=ce.querySelector("#lt-desc").value;if(!Se||!fe||isNaN(Te)||!he){O("Please fill all required fields, including the task","error");return}const Ee=ae.find(Me=>Me.id===fe),Oe=X.find(Me=>Me.path===he),Qe=Oe?Oe.name:"";l.create("timesheets",{jobId:a,jobNumber:t.number,taskId:he,taskName:Qe,technicianId:fe,technicianName:Ee.name,date:Se,hours:Te,description:ke,status:"Pending"}),O("Time logged successfully","success"),p(),le()}}]})})}else if(r==="forms")t.forms=t.forms||[],x.innerHTML=`
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
                    <td class="font-medium">${v(Q.type)}</td>
                    <td>${new Date(Q.date).toLocaleString()}</td>
                    <td>${v(Q.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(Z=x.querySelector("#btn-add-form"))==null||Z.addEventListener("click",()=>{const Q=document.createElement("div");Q.innerHTML=`
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
          `,He({title:"Complete Form",content:Q.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:K=>K()},{label:"Submit",className:"btn-primary",onClick:K=>{const ae=document.querySelector(".drawer-overlay");t.forms.push({type:ae.querySelector("#new-form-type").value,notes:ae.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),l.update("jobs",a,{forms:t.forms}),O("Form submitted successfully","success"),p(),K()}}]})});else if(r==="pos"){const Q=l.getAll("purchaseOrders").filter(K=>K.jobId===a);x.innerHTML=`
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
                    <td><a href="#/purchase-orders/${v(K.id)}">${v(K.number)}</a></td>
                    <td>${v(K.supplierName||"—")}</td>
                    <td>${K.issueDate?new Date(K.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(K.total||0).toFixed(2)}</td>
                    <td><span class="badge ${K.status==="Received"?"badge-success":K.status==="Draft"?"badge-neutral":K.status==="Cancelled"?"badge-danger":"badge-primary"}">${K.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(re=x.querySelector("#btn-raise-po"))==null||re.addEventListener("click",()=>{const ae=(l.getAll("suppliers")||[]).filter(B=>B.active!==!1),F=l.getAll("stock"),W=document.createElement("div");W.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select class="form-select" id="po-supplier">
              <option value="">Select supplier...</option>
              ${ae.map(B=>`<option value="${v(B.name)}">${v(B.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${F.map(B=>`<option value="${B.id}">${B.name} - $${B.costPrice||0}</option>`).join("")}
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
        `,He({title:"Quick Purchase Order",content:W.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:B=>B()},{label:"Create PO",className:"btn-primary",onClick:B=>{const te=document.querySelector(".drawer-overlay"),ue=te.querySelector("#po-supplier").value,pe=te.querySelector("#po-part").value,X=parseInt(te.querySelector("#po-qty").value)||1,oe=te.querySelector("#po-date").value;if(!ue||!pe){O("Supplier and Part are required","error");return}const le=F.find(ce=>ce.id===pe);l.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:a,supplierName:ue,issueDate:new Date().toISOString(),expectedDate:oe,status:"Draft",items:[{stockId:pe,name:le.name,quantity:X,unitCost:le.costPrice||0,total:(le.costPrice||0)*X}],total:(le.costPrice||0)*X}),O("Quick PO Created","success"),p(),B()}}]})})}else if(r==="invoices"){let K=function(F,W,B){let te="",ue="";if(t.quoteId){const X=l.getById("quotes",t.quoteId);X&&(te=X.number,ue=X.id)}const pe=l.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:F,jobId:a,jobNumber:t.number,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,status:"Draft",sections:W,originalQuoteId:ue,originalQuoteNumber:te,originalSubtotal:B,subtotal:B,tax:B*.1,total:B*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString()});l.update("jobs",a,{status:"Invoiced"}),O(`${F} Invoice created`,"success"),Y.navigate(`/invoices/${pe.id}`)},ae=function(){let F=[],W=0;if(t.quoteId){const B=l.getById("quotes",t.quoteId);B&&B.sections&&B.sections.length>0?(F=JSON.parse(JSON.stringify(B.sections)),W=B.subtotal||0):B&&B.lineItems&&(F=[{id:l.generateId(),name:"Main Phase",lineItems:JSON.parse(JSON.stringify(B.lineItems))}],W=B.subtotal||0)}if(F.length===0){const B=t.tasks||t.phases||[];if(B.length>0){F=B.map(pe=>({id:l.generateId(),name:pe.name,lineItems:[{description:`${pe.name} - Labor & Materials`,type:"other",qty:1,rate:0,total:0}],subtotal:0}));const te=t.laborCost||0,ue=t.materialCost||0;(te>0||ue>0)&&(F[0].lineItems.push({description:"Estimated Job Labor",type:"labor",qty:1,rate:te,total:te}),F[0].lineItems.push({description:"Estimated Job Materials",type:"material",qty:1,rate:ue,total:ue}))}else{const te=t.laborCost||0,ue=t.materialCost||0;F=[{id:l.generateId(),name:"General Items",lineItems:[{description:`${t.title} - Labor`,type:"labor",qty:1,rate:te,total:te},{description:`${t.title} - Materials`,type:"material",qty:1,rate:ue,total:ue}]}]}W=F.reduce((te,ue)=>te+ue.lineItems.reduce((pe,X)=>pe+(X.total||0),0),0)}return{sections:F,subtotal:W}};var M=K,N=ae;const Q=l.getAll("invoices").filter(F=>F.jobId===a);x.innerHTML=`
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
                ${Q.length?Q.map(F=>`
                  <tr>
                    <td><a href="#/invoices/${v(F.id)}">${v(F.number)}</a></td>
                    <td><span class="badge badge-neutral">${v(F.invoiceType||"Standard")}</span></td>
                    <td>${F.issueDate?F.issueDate.split("T")[0]:"—"}</td>
                    <td>${F.dueDate?F.dueDate.split("T")[0]:"—"}</td>
                    <td style="font-weight:600;">$${(F.total||0).toFixed(2)}</td>
                    <td><span class="badge ${F.status==="Paid"?"badge-success":F.status==="Draft"?"badge-neutral":F.status==="Overdue"?"badge-danger":"badge-info"}">${F.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ee=x.querySelector("#btn-create-standard-invoice"))==null||ee.addEventListener("click",()=>{const{sections:F,subtotal:W}=ae();K("Standard",F,W)}),(G=x.querySelector("#btn-create-deposit-invoice"))==null||G.addEventListener("click",()=>{const F=[{id:l.generateId(),name:"Deposit",lineItems:[{description:`Deposit for Job ${t.number}`,type:"other",qty:1,rate:0,total:0}],subtotal:0}];K("Deposit",F,0)}),(ne=x.querySelector("#btn-create-progress-invoice"))==null||ne.addEventListener("click",()=>{const F=document.createElement("div");F.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,$e({title:"Create Progress Invoice",content:F,actions:[{label:"Cancel",className:"btn-secondary",onClick:W=>W()},{label:"Create",className:"btn-primary",onClick:W=>{const B=parseFloat(document.getElementById("progress-percent").value)||0;if(B<=0||B>100){O("Enter a valid percentage (1-100)","error");return}const{subtotal:te}=ae(),ue=te*(B/100),pe=[{id:l.generateId(),name:`Progress Payment (${B}%)`,lineItems:[{description:`Progress Payment (${B}% of job)`,type:"other",qty:1,rate:ue,total:ue}],subtotal:ue}];K("Progress",pe,ue),W()}}]})})}}function m(){var E,k;e.querySelectorAll(".tab").forEach(S=>{S.addEventListener("click",()=>{r=S.dataset.tab,e.querySelectorAll(".tab").forEach(D=>D.classList.remove("active")),S.classList.add("active"),p()})}),(E=e.querySelector("#btn-edit-job"))==null||E.addEventListener("click",()=>Y.navigate(`/jobs/${a}/edit`));const x=e.querySelector("#tech-log-form");x==null||x.addEventListener("submit",S=>{S.preventDefault();const D=e.querySelector("#log-task-path").value,M=e.querySelector("#log-tech-id").value,N=parseFloat(e.querySelector("#log-travel-hours").value)||0,$=parseFloat(e.querySelector("#log-labor-hours").value)||0,f=e.querySelector("#log-description").value.trim(),T=e.querySelector("#log-material-stock").value,C=parseInt(e.querySelector("#log-material-qty").value)||1;if(!D||!M||$<=0){O("Please select a task, technician, and enter labor hours.","error");return}function z(V,se=[],U=[]){let P=[];return V&&V.forEach((Z,re)=>{const ee=[...se,re].join("-"),G=[...U,Z.name].join(" > ");P.push({path:ee,name:G,isLeaf:!Z.subTasks||Z.subTasks.length===0}),Z.subTasks&&(P=P.concat(z(Z.subTasks,[...se,re],[...U,Z.name])))}),P}const L=z(t.tasks||[]).filter(V=>V.isLeaf),q=l.getAll("technicians").find(V=>V.id===M),A=L.find(V=>V.path===D),_=A?A.name:"Job Task",H=new Date().toISOString().split("T")[0];l.create("timesheets",{jobId:a,jobNumber:t.number,taskId:D,taskName:_,technicianId:M,technicianName:(q==null?void 0:q.name)||"Unknown Tech",date:H,hours:$,description:`Labor: ${f||"Task Execution"}`,status:"Pending",type:"Labor"}),N>0&&l.create("timesheets",{jobId:a,jobNumber:t.number,taskId:D,taskName:_,technicianId:M,technicianName:(q==null?void 0:q.name)||"Unknown Tech",date:H,hours:N,description:`Travel: ${f||"Travel to site"}`,status:"Pending",type:"Travel"});let R="";if(T){const[V,se]=T.split("::"),U=l.getById("stock",V);if(U){t.materials=t.materials||[],t.materials.push({stockId:V,name:U.name,quantity:C,unitCost:U.costPrice||U.unitPrice||0,location:se||U.location||"Main Warehouse"}),l.update("jobs",a,{materials:t.materials});const P=l.getAll("stock"),Z=P.findIndex(re=>re.id===V);if(Z!==-1){const re=(P[Z].locations||[]).findIndex(ee=>ee.location===se);re!==-1?P[Z].locations[re].quantity=Math.max(0,P[Z].locations[re].quantity-C):P[Z].quantity=Math.max(0,(P[Z].quantity||0)-C),l.save("stock",P)}R=` & consumed ${C}x ${U.name}`}}t.activityLog=t.activityLog||[],t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"field_log",content:`Field log submitted by ${(q==null?void 0:q.name)||"Technician"} for task "${_}": ${$}h labor${N>0?`, ${N}h travel`:""}${R}. Notes: "${f||"No notes."}"`,date:new Date().toISOString()}),l.update("jobs",a,{activityLog:t.activityLog}),me(async()=>{const{addSystemNotification:V}=await Promise.resolve().then(()=>qe);return{addSystemNotification:V}},void 0).then(({addSystemNotification:V})=>{V("Field Log Submitted",`${(q==null?void 0:q.name)||"Technician"} submitted a field log for Job ${t.number}: ${$} hrs labor logged.`,`/jobs/${a}`)}),O(`Field log submitted successfully: logged ${$}h labor${N>0?`, ${N}h travel`:""}${R}!`,"success"),p()}),(k=e.querySelector("#btn-delete-job"))==null||k.addEventListener("click",()=>{const S=document.createElement("div");S.innerHTML=`<p>Delete job <strong>${v(t.number)}</strong>?</p>`,$e({title:"Delete Job",content:S,actions:[{label:"Cancel",className:"btn-secondary",onClick:D=>D()},{label:"Delete",className:"btn-danger",onClick:D=>{l.delete("jobs",a),O("Job deleted","success"),D(),Y.navigate("/jobs")}}]})})}i();function h(x,E){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${x}</span><span>${E}</span></div>`}function b(x){const E=l.getAll("formInstances").filter(S=>S.jobId===a),k=l.getAll("formTemplates");x.innerHTML=`
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
              ${E.map(S=>{const D=k.find($=>$.id===S.templateId),M=S.status==="Completed",N=S.submittedBy?l.getById("people",S.submittedBy):null;return`
                  <tr>
                    <td class="font-medium">${v((D==null?void 0:D.name)||"Unknown Form")}</td>
                    <td><span class="badge ${M?"badge-success":"badge-warning"}">${S.status}</span></td>
                    <td>${N?v(`${N.firstName} ${N.lastName}`):"—"}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${S.submittedAt?new Date(S.submittedAt).toLocaleDateString():"—"}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${M?"btn-secondary":"btn-primary"} btn-sm fill-form" data-id="${S.id}" title="${M?"View / Edit":"Fill Form"}">
                          <span class="material-icons-outlined" style="font-size:16px">${M?"visibility":"edit_note"}</span>
                        </button>
                        ${M?`
                          <button class="btn btn-secondary btn-icon btn-sm export-form" data-id="${S.id}" title="Export Options">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </button>
                          <button class="btn btn-secondary btn-icon btn-sm print-form" data-id="${S.id}" title="Print / PDF">
                            <span class="material-icons-outlined" style="font-size:18px">print</span>
                          </button>
                        `:""}
                        ${M?"":`<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${S.id}" style="color:var(--color-danger)" title="Remove Form"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              ${E.length?"":'<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,x.querySelector("#btn-attach-form").addEventListener("click",()=>w()),x.querySelectorAll(".fill-form").forEach(S=>{S.addEventListener("click",()=>I(S.dataset.id))}),x.querySelectorAll(".remove-form-instance").forEach(S=>{S.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this form from the job?")){const D=S.dataset.id,M=l.getAll("formInstances");l.save("formInstances",M.filter(N=>N.id!==D)),b(x)}})}),x.querySelectorAll(".export-form").forEach(S=>{S.addEventListener("click",()=>{var T;const D=l.getById("formInstances",S.dataset.id),M=l.getById("formTemplates",D.templateId),N=D.submittedBy?l.getById("people",D.submittedBy):null,$={...D,template:M,jobNumber:t.number,customerName:((T=l.getById("people",t.customerId))==null?void 0:T.companyName)||"Unknown Customer",submittedByName:N?`${N.firstName} ${N.lastName}`:"Unknown Technician",number:`F-${t.number}-${D.id.slice(3,7).toUpperCase()}`},f=document.createElement("div");f.style.cssText="padding: 12px 0; display:flex; flex-direction:column; gap:16px",f.innerHTML=`
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:8px">
            Select the format to export <strong>${v(M.name)}</strong>:
          </div>
          <div style="display:grid; grid-template-columns: 1fr; gap:12px">
            <button class="btn btn-secondary" id="export-modal-pdf" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px">
              <span class="material-icons-outlined" style="color:#EF4444">picture_as_pdf</span>
              <span>Export as Print-Optimized PDF</span>
            </button>
            <button class="btn btn-secondary" id="export-modal-csv" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px">
              <span class="material-icons-outlined" style="color:#10B981">table_view</span>
              <span>Export as Spreadsheet CSV</span>
            </button>
            <button class="btn btn-secondary" id="export-modal-json" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px">
              <span class="material-icons-outlined" style="color:#1B6DE0">code</span>
              <span>Export as Developer JSON</span>
            </button>
          </div>
        `,$e({title:"Export Compliance Form",content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()}]}),f.querySelector("#export-modal-pdf").addEventListener("click",()=>{var C;(C=document.querySelector(".modal-overlay"))==null||C.remove(),me(async()=>{const{showPrintPreview:z}=await Promise.resolve().then(()=>jt);return{showPrintPreview:z}},void 0).then(({showPrintPreview:z})=>{z({type:"form",data:$})})}),f.querySelector("#export-modal-csv").addEventListener("click",()=>{var C;(C=document.querySelector(".modal-overlay"))==null||C.remove(),me(async()=>{const{exportFormAsCSV:z}=await Promise.resolve().then(()=>jt);return{exportFormAsCSV:z}},void 0).then(({exportFormAsCSV:z})=>{z($)})}),f.querySelector("#export-modal-json").addEventListener("click",()=>{var C;(C=document.querySelector(".modal-overlay"))==null||C.remove(),me(async()=>{const{exportFormAsJSON:z}=await Promise.resolve().then(()=>jt);return{exportFormAsJSON:z}},void 0).then(({exportFormAsJSON:z})=>{z($)})})})}),x.querySelectorAll(".print-form").forEach(S=>{S.addEventListener("click",()=>{const D=l.getById("formInstances",S.dataset.id),M=l.getById("formTemplates",D.templateId),N=D.submittedBy?l.getById("people",D.submittedBy):null;me(async()=>{const{showPrintPreview:$}=await Promise.resolve().then(()=>jt);return{showPrintPreview:$}},void 0).then(({showPrintPreview:$})=>{var f;$({type:"form",data:{...D,template:M,jobNumber:t.number,customerName:((f=l.getById("people",t.customerId))==null?void 0:f.companyName)||"Unknown Customer",submittedByName:N?`${N.firstName} ${N.lastName}`:"Unknown Technician",number:`F-${t.number}-${D.id.slice(3,7).toUpperCase()}`}})})})})}function w(){const x=l.getAll("formTemplates"),k=l.getAll("formInstances").filter(D=>D.jobId===a).map(D=>D.templateId),S=document.createElement("div");S.style.minWidth="450px",S.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:12px">
        ${x.map(D=>{const M=k.includes(D.id);return`
            <div class="card attach-template-item ${M?"disabled":""}" data-id="${D.id}" style="cursor:${M?"not-allowed":"pointer"}; opacity:${M?"0.6":"1"}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${v(D.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(D.sections||[]).reduce((N,$)=>N+$.fields.length,0)} fields</div>
                </div>
                ${M?'<span class="badge badge-neutral">Already Attached</span>':'<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `}).join("")}
        ${x.length?"":'<div class="text-center text-tertiary">No templates available.</div>'}
      </div>
    `,S.querySelectorAll(".attach-template-item:not(.disabled)").forEach(D=>{D.addEventListener("click",()=>{var $;const M=D.dataset.id,N=l.getAll("formInstances");N.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:a,templateId:M,responses:{},status:"Pending",createdAt:new Date().toISOString()}),l.save("formInstances",N),O("Form attached to job","success"),($=document.querySelector(".modal-overlay"))==null||$.remove(),b(e.querySelector("#tab-content"))})}),$e({title:"Attach Compliance Form",content:S,actions:[{label:"Cancel",className:"btn-secondary",onClick:D=>D()}]})}function I(x){const k=l.getAll("formInstances").find(f=>f.id===x),S=l.getById("formTemplates",k.templateId),D=k.status==="Completed",M=document.createElement("div");M.innerHTML=`
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${v(S.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${v(S.description||"")}</div>
      </div>
      <form id="active-job-form">
        <div style="display:flex; flex-direction:column; gap:24px">
          ${(S.sections||[]).map(f=>{const T=f.columns||(f.width==="half"?1:2);return f.isSpacer?`<div style="width:100%; height: ${f.height?String(f.height).endsWith("px")?f.height:f.height+"px":"50px"}"></div>`:`
            <div class="form-section" style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; overflow:hidden">
              <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color); border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${v(f.title)}</h4>
              </div>
              <div style="display:grid; grid-template-columns: repeat(${T}, 1fr); gap:16px; padding:16px">
                ${f.fields.map(C=>{const z=Math.min(C.colSpan||(C.width==="half"?1:T),T);if(C.type==="spacer"||C.type==="blank"){const j=C.height?String(C.height).endsWith("px")?C.height:C.height+"px":"50px";return`<div style="grid-column: span ${z}; height: ${C.type==="blank"?"auto":j}"></div>`}if(C.type==="info")return`
          <div class="form-group info-block" style="margin:0; grid-column: span ${z}; padding:16px; background:rgba(27, 109, 224, 0.05); border-left:4px solid var(--color-primary); border-radius:4px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
            <div style="display:flex; gap:12px; align-items:flex-start">
              <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0; font-size:20px; margin-top:2px">info</span>
              <div>${v(C.label).replace(/\n/g,"<br/>")}</div>
            </div>
          </div>
        `;const J=k.responses[C.id]||"";let L="";return C.type==="text"?L=`<input class="form-input" name="${C.id}" value="${v(J)}" ${C.required?"required":""} ${D?"disabled":""} />`:C.type==="textarea"?L=`<textarea class="form-textarea" name="${C.id}" rows="3" ${C.required?"required":""} ${D?"disabled":""}>${v(J)}</textarea>`:C.type==="checkbox"?L=`
                       <label style="display:flex; align-items:center; gap:10px; cursor:${D?"default":"pointer"}; opacity:${D?"0.7":"1"}">
                         <input type="checkbox" name="${C.id}" ${J?"checked":""} style="width:18px; height:18px" ${D?"disabled":""} />
                         <span style="font-size:14px">${v(C.label)}</span>
                       </label>`:C.type==="select"?L=`
                       <select class="form-select" name="${C.id}" ${C.required?"required":""} ${D?"disabled":""}>
                         <option value="">Select option...</option>
                         ${(C.options||[]).map(j=>`<option value="${v(j)}" ${J===j?"selected":""}>${v(j)}</option>`).join("")}
                       </select>`:C.type==="date"?L=`<input type="date" class="form-input" name="${C.id}" value="${J}" ${C.required?"required":""} ${D?"disabled":""} />`:C.type==="signature"&&(L=`
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${J?`<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${v(J)}</span>`:"Digitally Signed on submission"}
                       </div>`),`
                    <div class="form-group" style="margin:0; grid-column: span ${z}">
                      ${C.type!=="checkbox"?`<label class="form-label" style="font-weight:500">${v(C.label)} ${C.required?'<span style="color:var(--color-danger)">*</span>':""}</label>`:""}
                      ${L}
                    </div>
                  `}).join("")}
              </div>
            </div>
          `}).join("")}
        </div>
      </form>
    `;const N=f=>{var j,q;const T=M.querySelector("#active-job-form"),C={};(S.sections||[]).forEach(A=>{A.isSpacer||A.fields.forEach(_=>{var H;if(!(_.type==="spacer"||_.type==="info"||_.type==="blank")){if(_.type==="checkbox"){const R=T.querySelector(`input[name="${_.id}"]`);C[_.id]=R?R.checked:!1}else{const R=T.querySelector(`[name="${_.id}"]`);C[_.id]=R?R.value:""}f&&_.type==="signature"&&(C[_.id]=((H=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:H.name)||"Unknown")}})});const z=l.getAll("formInstances"),J=z.findIndex(A=>A.id===x);z[J]={...z[J],responses:C,status:f?"Completed":"Pending",submittedBy:f?(j=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:j.id:z[J].submittedBy,submittedAt:f?new Date().toISOString():z[J].submittedAt},l.save("formInstances",z),O(f?"Form submitted successfully":"Draft saved successfully","success"),b(e.querySelector("#tab-content"));const L=l.getAll("activity")||[];L.push({id:Date.now(),jobId:a,type:f?"form_submission":"form_draft_saved",text:f?`Form "${S.name}" submitted.`:`Form "${S.name}" draft was saved.`,user:(q=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:q.name,timestamp:new Date().toISOString()}),l.save("activity",L)},$=[];$.push({label:"Cancel",className:"btn-secondary",onClick:f=>f()}),D?$.push({label:"Update Form",className:"btn-primary",onClick:f=>{const T=M.querySelector("#active-job-form");if(!T.checkValidity()){T.reportValidity();return}N(!0),f()}}):($.push({label:"Save Draft",className:"btn-secondary",onClick:f=>{N(!1),f()}}),$.push({label:"Complete & Sign",className:"btn-primary",onClick:f=>{const T=M.querySelector("#active-job-form");if(!T.checkValidity()){T.reportValidity();return}N(!0),f()}})),$e({title:D?"Edit Form Response":"Complete Job Form",content:M,size:"modal-xl",actions:$})}}const Ms=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function Ma(e,{id:a}){const t=a&&a!=="new",s=t?l.getById("jobs",a):{},n=l.getAll("customers"),r=l.getAll("contractors").filter(A=>A.active);let c=s.tags?[...s.tags]:[];function o(A){return n.find(_=>_.id===A)||null}function d(A,_){const H=o(A);return!H||!H.sites||H.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+H.sites.map((R,V)=>`<option value="${V}" data-address="${v(R.address)}" data-name="${v(R.name)}" ${_===R.name?"selected":""}>${v(R.name)} — ${v(R.address)}</option>`).join("")}function u(A,_,H){const R=o(A);return!R||!R.contacts||R.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${H}</option>`+R.contacts.map((V,se)=>`<option value="${se}" ${_===V.name?"selected":""}>${v(V.name)} (${v(V.role||"")})</option>`).join("")}function g(){return Ms.map(A=>`<button type="button" class="tag-pill ${c.includes(A)?"tag-pill-active":""}" data-tag="${v(A)}">${v(A)}</button>`).join("")}const y=s.customerId||"";e.innerHTML=`
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
            <input class="form-input" name="title" value="${v(s.title||"")}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${n.map(A=>`<option value="${A.id}" ${s.customerId===A.id?"selected":""}>${v(A.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(A=>`<option ${s.type===A?"selected":""}>${A}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${y?"":"disabled"}>
              ${d(y,s.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${s.siteAddress?v(s.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${y?"":"disabled"}>
                ${u(y,s.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${y?"":"disabled"}>
                ${u(y,s.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(A=>`<option ${s.status===A?"selected":""}>${A}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(A=>`<option ${s.priority===A?"selected":""}>${A}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${r.map(A=>`<option value="${A.id}" ${s.contractorId===A.id?"selected":""}>${v(A.businessName)}</option>`).join("")}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${g()}
            </div>
          </div>

          <!-- Emergency -->
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-emergency" style="width:16px;height:16px" ${s.isEmergency?"checked":""} />
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
            <div id="job-description-editor" contenteditable="true" spellcheck="true">${s.description||s.notes||""}</div>
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
  `,e.querySelectorAll("#job-form-tabs .tab").forEach(A=>{A.addEventListener("click",_=>{e.querySelectorAll("#job-form-tabs .tab").forEach(R=>R.classList.remove("active")),_.currentTarget.classList.add("active");const H=_.currentTarget.dataset.tab;e.querySelector("#jf-tab-details").style.display=H==="details"?"block":"none",e.querySelector("#jf-tab-tasks").style.display=H==="tasks"?"block":"none",e.querySelector("#jf-tab-forms").style.display=H==="forms"?"block":"none",H==="tasks"&&z(),H==="forms"&&q()})});const i=e.querySelector("#jf-customer"),p=e.querySelector("#jf-site"),m=e.querySelector("#jf-site-hint"),h=e.querySelector("#jf-primary-contact"),b=e.querySelector("#jf-additional-contact");function w(A){const _=!A;p.innerHTML=d(A,""),p.disabled=_,h.innerHTML=u(A,"","Select primary contact..."),h.disabled=_,b.innerHTML=u(A,"","None"),b.disabled=_,m.textContent=_?"Select a customer to enable jobsite selection":"Select a jobsite above"}i.addEventListener("change",A=>w(A.target.value)),p.addEventListener("change",A=>{const _=A.target.selectedOptions[0];m.textContent=(_==null?void 0:_.dataset.address)||""}),e.querySelector("#jf-tags").addEventListener("click",A=>{const _=A.target.closest(".tag-pill");if(!_)return;const H=_.dataset.tag;c.includes(H)?(c=c.filter(R=>R!==H),_.classList.remove("tag-pill-active")):(c.push(H),_.classList.add("tag-pill-active"))});const I=e.querySelector("#job-description-editor"),x=e.querySelector("#editor-toolbar");x.addEventListener("mousedown",A=>{const _=A.target.closest("button[data-cmd]");if(!_)return;A.preventDefault();const H=_.dataset.cmd,R=_.dataset.val||null;document.execCommand(H,!1,R),I.focus()}),e.querySelector("#editor-link-btn").addEventListener("click",()=>{const A=prompt("Enter URL:","https://");A&&document.execCommand("createLink",!1,A),I.focus()}),I.addEventListener("keyup",E),I.addEventListener("mouseup",E);function E(){x.querySelectorAll("button[data-cmd]").forEach(A=>{try{A.classList.toggle("active",document.queryCommandState(A.dataset.cmd))}catch{}})}const k=e.querySelector("#is-emergency"),S=e.querySelector("#emergency-dispatch-suggestion"),D=e.querySelector("#dispatch-reason"),M=e.querySelector("#job-priority");function N(A){if(A){M.value="Urgent",S.style.display="block";const _=l.getAll("people").filter(H=>H.type==="Staff");if(_.length>0){const H=_[Math.floor(Math.random()*_.length)],R=Math.floor(Math.random()*15)+5;D.innerHTML=`Based on current GPS location, <strong>${H.firstName} ${H.lastName}</strong> is the most suitable technician (approx. ${R} mins away).`}else D.innerHTML="No internal technicians available for dispatch."}else S.style.display="none"}if(k==null||k.addEventListener("change",A=>N(A.target.checked)),s.isEmergency&&N(!0),!t){const A=e.querySelector("#is-recurring"),_=e.querySelector("#recurring-options");A==null||A.addEventListener("change",H=>{_.style.display=H.target.checked?"flex":"none"})}e.querySelector("#btn-cancel").addEventListener("click",()=>Y.navigate(t?`/jobs/${a}`:"/jobs"));let $=s.tasks?JSON.parse(JSON.stringify(s.tasks)):[{id:l.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subTasks:[]}];$.forEach(A=>{A.subTasks||(A.subTasks=[])});let f=[0],T=[];function C(A,_){let H=A[_[0]];if(!H)return null;for(let R=1;R<_.length;R++)if(!H.subTasks||(H=H.subTasks[_[R]],!H))return null;return H}function z(){var U,P,Z,re;const A=e.querySelector("#jf-task-container");if(!A)return;let _=!0,H=$;for(let ee=0;ee<f.length;ee++){if(!H||!H[f[ee]]){_=!1;break}H=H[f[ee]].subTasks}_||(f=[]);const R=T.length>0?C($,T):null,V=R?R.subTasks||[]:$,se=R?v(R.name):"Main Tasks";A.innerHTML=`
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
                ${T.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${se}">${se}</span>
              </div>
              ${T.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${T.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${V.map((ee,G)=>{const ne=[...T,G],Q=ne.join("-")===f.join("-");return`
                  <div class="task-list-item" data-path="${ne.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${Q?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${Q?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${v(ee.name)}">${v(ee.name)}</span>
                    ${ee.subTasks&&ee.subTasks.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${ne.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${V.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${f.length>0?(()=>{const ee=f,G=C($,ee);if(!G)return"";const ne=G.subTasks&&G.subTasks.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${v(G.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${ee.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${ee.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${ee.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${v(G.name)}" />
                </div>
                ${ne?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${G.startDate?G.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${G.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${G.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${v(G.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(U=A.querySelector(".btn-view-back"))==null||U.addEventListener("click",()=>{T.pop(),z()}),A.querySelectorAll(".btn-drill-down").forEach(ee=>{ee.addEventListener("click",G=>{G.stopPropagation(),T=ee.dataset.path.split("-").map(Number),f=[...T],z()})}),A.querySelectorAll(".task-list-item").forEach(ee=>{ee.addEventListener("click",()=>{f=ee.dataset.path.split("-").map(Number),z()})}),(P=A.querySelector("#btn-add-main-task"))==null||P.addEventListener("click",()=>{$.push({id:l.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),f=[$.length-1],z()}),A.querySelectorAll(".btn-add-child-task").forEach(ee=>{ee.addEventListener("click",()=>{const G=ee.dataset.path.split("-").map(Number),ne=C($,G);ne&&(ne.subTasks||(ne.subTasks=[]),ne.subTasks.push({id:l.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),f=[...G,ne.subTasks.length-1],T=[...G],z())})}),A.querySelectorAll(".btn-remove-task").forEach(ee=>{ee.addEventListener("click",()=>{const G=ee.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(G.length===1)$.splice(G[0],1),f=$.length>0?[0]:[];else{const ne=C($,G.slice(0,-1));ne&&ne.subTasks&&ne.subTasks.splice(G[G.length-1],1),f=[...G.slice(0,-1)]}z()}})}),A.querySelectorAll(".detail-input").forEach(ee=>{ee.addEventListener("input",G=>{const ne=G.target.dataset.field,Q=G.target.value,K=C($,f);if(K&&(ne==="estimatedHours"?K[ne]=parseFloat(Q)||0:ne==="people"?K[ne]=parseInt(Q)||1:K[ne]=Q,ne==="name")){const ae=A.querySelector(`.task-list-item[data-path="${f.join("-")}"] span:first-child`);ae&&(ae.textContent=Q,ae.title=Q);const F=A.querySelector("h4[title]");F&&(F.textContent="Task Settings: "+Q,F.title=Q)}})}),(Z=e.querySelector("#btn-save-as-template"))==null||Z.addEventListener("click",()=>{const ee=document.createElement("div");ee.innerHTML=`
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
      `,$e({title:"Save Tasklist as Template",content:ee,actions:[{label:"Cancel",className:"btn-secondary",onClick:G=>G()},{label:"Save Template",className:"btn-primary",onClick:G=>{const ne=ee.querySelector("#tmpl-name").value,Q=ee.querySelector("#tmpl-desc").value,K=ee.querySelector("#tmpl-tags").value.split(",").map(F=>F.trim()).filter(Boolean);if(!ne){O("Template name is required","error");return}function ae(F){return F.map(W=>({...W,id:l.generateId(),status:"Not Started",progress:0,subTasks:W.subTasks?ae(W.subTasks):[]}))}l.create("taskTemplates",{name:ne,description:Q,tags:K,tasks:ae($),createdAt:new Date().toISOString()}),O("Tasklist saved as template","success"),G()}}]})}),(re=e.querySelector("#btn-import-tasklist"))==null||re.addEventListener("click",()=>{const ee=l.getAll("taskTemplates"),G=l.getAll("jobs").filter(ae=>ae.id!==a&&ae.tasks&&ae.tasks.length>0);let ne="templates";const Q=document.createElement("div");Q.innerHTML=`
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
      `;function K(ae=""){const F=Q.querySelector("#import-content"),W=ae.toLowerCase();if(ne==="templates"){const B=ee.filter(te=>te.name.toLowerCase().includes(W)||(te.description||"").toLowerCase().includes(W)||(te.tags||[]).some(ue=>ue.toLowerCase().includes(W)));F.innerHTML=B.length?B.map(te=>`
            <div class="import-item" data-id="${te.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${v(te.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(te.tasks||te.phases||[]).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${v(te.description||"No description.")}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(te.tags||[]).map(ue=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${v(ue)}</span>`).join("")}
              </div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${ae}"</div>`}else{const B=G.filter(te=>te.number.toLowerCase().includes(W)||te.title.toLowerCase().includes(W)||te.customerName.toLowerCase().includes(W));F.innerHTML=B.length?B.map(te=>`
            <div class="import-item" data-id="${te.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${v(te.number)} - ${v(te.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${v(te.customerName)} · ${(te.tasks||te.phases||[]).length} tasks</div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${ae}"</div>`}F.querySelectorAll(".import-item").forEach(B=>{B.addEventListener("click",()=>{var ce;const te=B.dataset.id,ue=B.dataset.type,pe=l.getAll("taskTemplates"),X=l.getAll("jobs"),oe=ue==="template"?pe.find(Se=>String(Se.id)===String(te)):X.find(Se=>String(Se.id)===String(te));if(oe&&(oe.tasks||oe.phases)){const Se=oe.tasks||oe.phases;if(confirm(`Replace current tasklist with "${oe.name||oe.number}"?`)){let fe=function(he){return he.map(Te=>({...Te,id:l.generateId(),status:"Not Started",progress:0,subTasks:Te.subTasks||Te.subPhases?fe(Te.subTasks||Te.subPhases):[]}))};var le=fe;$=fe(Se),f=[0],T=[],O(`Imported ${oe.name||oe.number}`,"success"),z(),(ce=document.querySelector(".modal-overlay"))==null||ce.remove()}}else O("Could not find source data","error")})})}K(),Q.querySelectorAll(".tab").forEach(ae=>{ae.addEventListener("click",()=>{Q.querySelectorAll(".tab").forEach(F=>F.classList.remove("active")),ae.classList.add("active"),ne=ae.dataset.tab,Q.querySelector("#import-search").placeholder=ne==="templates"?"Search templates...":"Search jobs...",K(Q.querySelector("#import-search").value)})}),Q.querySelector("#import-search").addEventListener("input",ae=>{K(ae.target.value)}),$e({title:"Import Tasklist",content:Q,actions:[{label:"Cancel",className:"btn-secondary",onClick:ae=>ae()}]})})}const J=l.getAll("formTemplates"),L=t?l.getAll("formInstances").filter(A=>A.jobId===a):[];let j=t?L.map(A=>A.templateId):[];function q(){const A=e.querySelector("#jf-forms-container");A&&(A.innerHTML=`
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${J.map(_=>{const H=j.includes(_.id);return`
            <div class="card form-template-selector ${H?"active":""}" data-id="${_.id}" style="cursor:pointer; border:2px solid ${H?"var(--color-primary)":"var(--border-color)"}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${H?"var(--color-primary)":"var(--text-tertiary)"}; background:${H?"var(--color-primary)":"transparent"}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${H?'<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>':""}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${v(_.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${v(_.description||"No description.")}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(_.sections||[]).reduce((R,V)=>R+V.fields.length,0)} Required Fields</div>
                </div>
              </div>
            </div>
          `}).join("")}
        ${J.length?"":'<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>'}
      </div>
    `,A.querySelectorAll(".form-template-selector").forEach(_=>{_.addEventListener("click",()=>{const H=_.dataset.id;j.includes(H)?j=j.filter(R=>R!==H):j.push(H),q()})}))}e.querySelector("#btn-save").addEventListener("click",()=>{var K,ae,F,W;const A=e.querySelector("#job-form");if(!A.checkValidity()){e.querySelectorAll("#job-form-tabs .tab").forEach(B=>B.classList.remove("active")),e.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),e.querySelector("#jf-tab-details").style.display="block",e.querySelector("#jf-tab-tasks").style.display="none",e.querySelector("#jf-tab-forms").style.display="none",A.reportValidity();return}const _=Object.fromEntries(new FormData(A)),H=_.customerId,R=n.find(B=>B.id===H);_.customerName=(R==null?void 0:R.company)||"";const V=p.selectedOptions[0];_.siteAddress=(V==null?void 0:V.dataset.address)||"",_.siteName=(V==null?void 0:V.dataset.name)||"";const se=parseInt(_.primaryContactId),U=parseInt(_.additionalContactId),P=isNaN(se)?null:(K=R==null?void 0:R.contacts)==null?void 0:K[se],Z=isNaN(U)?null:(ae=R==null?void 0:R.contacts)==null?void 0:ae[U];_.contactName=(P==null?void 0:P.name)||(R?`${R.firstName} ${R.lastName}`:""),_.primaryContactName=(P==null?void 0:P.name)||"",_.additionalContactName=(Z==null?void 0:Z.name)||"",delete _.primaryContactId,delete _.additionalContactId,_.tags=c,_.description=I.innerHTML,_.tasks=$,_.phases=$,_.tasks.forEach(B=>{B.subTasks||(B.subTasks=[]),B.subPhases=B.subTasks}),delete _.notes,_.number=s.number||`J-${Date.now().toString().slice(-6)}`;const re=(F=e.querySelector("#is-emergency"))==null?void 0:F.checked;if(_.isEmergency=re,t?re&&!s.isEmergency?_.laborCost=(s.laborCost||0)+150:!re&&s.isEmergency&&(_.laborCost=Math.max(0,(s.laborCost||0)-150)):(_.technicians=[],_.laborCost=re?150:0,_.materialCost=0,_.estimatedHours=0),(W=e.querySelector("#is-recurring"))!=null&&W.checked){const B=e.querySelector("#recurring-freq").value,te=e.querySelector("#recurring-start").value,ue=e.querySelector("#recurring-end").value;if(!te||!ue){O("Recurring dates required","error");return}_.recurringConfig={freq:B,start:te,end:ue}}const ee=t?l.update("jobs",a,_):l.create("jobs",_),G=ee.id;let Q=(l.getAll("formInstances")||[]).filter(B=>{if(B.jobId!==G)return!0;const te=j.includes(B.templateId),ue=B.responses&&Object.keys(B.responses).length>0;return te||ue});if(j.forEach(B=>{Q.find(ue=>ue.jobId===G&&ue.templateId===B)||Q.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:G,templateId:B,responses:{},status:"Pending",createdAt:new Date().toISOString()})}),l.save("formInstances",Q),!t&&_.recurringConfig){let B=new Date(_.recurringConfig.start);const te=new Date(_.recurringConfig.end);let ue=0;for(;B<=te&&ue<50;)l.create("notifications",{type:"Recurring Job Due",jobId:G,title:`Recurring: ${ee.title||ee.number}`,dueDate:B.toISOString().split("T")[0],status:"Pending",createdAt:new Date().toISOString()}),_.recurringConfig.freq==="Daily"?B.setDate(B.getDate()+1):_.recurringConfig.freq==="Weekly"?B.setDate(B.getDate()+7):_.recurringConfig.freq==="Monthly"&&B.setMonth(B.getMonth()+1),ue++}O(`Job ${t?"updated":"created"} successfully`,"success"),Y.navigate(`/jobs/${G}`)})}function zs(e){var h;const a=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),t=a.userTypeId?l.getById("userTypes",a.userTypeId):null,s=t?(h=t.permissions)==null?void 0:h.find(b=>b.module==="Timesheets"):null;let n="All",r="All";const c=new Date,o=new Date;o.setDate(c.getDate()-7);const d=b=>{const w=b.getFullYear(),I=String(b.getMonth()+1).padStart(2,"0"),x=String(b.getDate()).padStart(2,"0");return`${w}-${I}-${x}`};let u=d(o),g=d(c),y=[];function i(){var T,C,z,J,L,j,q,A,_,H,R,V,se;const b=l.getAll("timesheets").sort((U,P)=>new Date(P.date)-new Date(U.date)),w=l.getAll("technicians");let I=[...b];const x=["admin","manager","office"].includes(a.role)||s&&s.view,E=s&&s.view_own;!x&&E?I=I.filter(U=>String(U.technicianId)===String(a.id)):!x&&!E&&a.role!=="admin"&&(I=[]);let k=n==="All"?[...I]:I.filter(U=>U.status===n);x&&r!=="All"&&(k=k.filter(U=>String(U.technicianId)===String(r))),u&&(k=k.filter(U=>(U.date?U.date.split("T")[0]:"")>=u)),g&&(k=k.filter(U=>(U.date?U.date.split("T")[0]:"")<=g));const S=k.filter(U=>U.status==="Pending").reduce((U,P)=>U+(P.hours||0),0),D=k.map(U=>U.id),M=D.length>0&&D.every(U=>y.includes(U)),N=y.length>0,$=[];k.forEach(U=>{const Z=new Date(U.date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});let re=$.find(ee=>ee.dateStr===Z);re||(re={dateStr:Z,items:[],total:0},$.push(re)),re.items.push(U),re.total+=U.hours||0}),e.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          ${Le("Timesheets","export")?`
            <button class="btn btn-secondary" id="btn-export-approved" style="margin-right:8px">
              <span class="material-icons-outlined">download</span> Export Approved
            </button>
          `:""}
          ${["admin","manager","office"].includes(a.role)?`
            <button class="btn btn-secondary" id="btn-log-time" style="margin-right:8px">
              <span class="material-icons-outlined">add</span> Log Time on Behalf
            </button>
          `:""}
          ${a.role==="admin"||a.role==="manager"||s&&s.approve?`
            <button class="btn btn-primary" id="btn-approve-all-pending" ${I.some(U=>U.status==="Pending")?"":"disabled"}>
              <span class="material-icons-outlined">done_all</span> Approve All Pending
            </button>
          `:""}
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${S.toFixed(2)} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="page-toolbar" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:16px;">
        <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
          <div class="toolbar-filters" style="margin:0">
            <button class="toolbar-filter ${n==="All"?"active":""}" data-status="All">All</button>
            <button class="toolbar-filter ${n==="Pending"?"active":""}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${n==="Approved"?"active":""}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${n==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
          </div>
          
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Date Range:</label>
            <input type="date" class="form-input" id="filter-date-start" value="${u}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
            <span style="font-size:12px; color:var(--text-secondary)">to</span>
            <input type="date" class="form-input" id="filter-date-end" value="${g}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
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
                ${w.map(U=>`<option value="${U.id}" ${r===U.id?"selected":""}>${U.name}</option>`).join("")}
              </select>
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-next" title="Next technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_right</span>
              </button>
            </div>
          </div>
        `:""}
      </div>

      <div id="bulk-actions-bar" style="display:${N?"flex":"none"}; align-items:center; justify-content:space-between; background:var(--color-primary-light); border:1px solid var(--color-primary); padding:10px 16px; border-radius:var(--border-radius); margin-bottom:12px; transition: all 0.2s ease;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:600; color:var(--color-primary); font-size:14px;"><span id="selected-count">${y.length}</span> items selected</span>
          <button class="btn btn-ghost btn-sm" id="btn-bulk-deselect" style="color:var(--color-primary); padding:2px 8px; font-weight:600;">Deselect All</button>
        </div>
        <div style="display:flex; gap:8px;">
          ${a.role==="admin"||a.role==="manager"||s&&s.approve?`
            <button class="btn btn-sm btn-success" id="btn-bulk-approve" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:var(--color-success); border-color:var(--color-success); background:rgba(46, 204, 113, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">done</span> Approve Selected
            </button>
            <button class="btn btn-sm btn-danger" id="btn-bulk-reject" style="display:flex; align-items:center; gap:4px; padding:6px 12px; font-size:13px; color:var(--color-danger); border-color:var(--color-danger); background:rgba(231, 76, 60, 0.1);">
              <span class="material-icons-outlined" style="font-size:16px">close</span> Reject Selected
            </button>
          `:""}
          ${Le("Timesheets","export")?`
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
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${M?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
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
              ${$.length===0?'<tr><td colspan="9" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>':$.map(U=>`
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="5" style="color:var(--text-primary)">${U.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${U.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${U.items.map(P=>{const Z=String(P.technicianId)===String(a.id),re=s&&s.edit===!0||Z,ee=s&&s.delete===!0||Z,G=["admin","manager","office"].includes(a.role)||re&&P.status!=="Approved",ne=["admin","manager","office"].includes(a.role)||ee&&P.status!=="Approved",Q=y.includes(P.id);return`
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${P.id}" ${Q?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
                    <td class="text-secondary" style="font-size:12px">${new Date(P.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${v(P.technicianName)}</span></td>
                    <td><a href="#/jobs/${P.jobId}" class="cell-link">${v(P.jobNumber||P.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${v(P.taskName||"—")}</span></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${v(P.description||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${P.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${P.status==="Approved"?"badge-success":P.status==="Rejected"?"badge-danger":"badge-warning"}">
                        ${v(P.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${G?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-timesheet" data-id="${P.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:18px">edit</span>
                          </button>
                        `:""}
                        ${ne?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-timesheet" data-id="${P.id}" title="Delete entry" style="color:var(--color-danger)">
                            <span class="material-icons-outlined" style="font-size:18px">delete</span>
                          </button>
                        `:""}
                        ${["admin","manager"].includes(a.role)&&P.status==="Pending"?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-approve-single" data-id="${P.id}" title="Approve entry" style="color:var(--color-success)">
                            <span class="material-icons-outlined" style="font-size:18px">check</span>
                          </button>
                          <button class="btn btn-ghost btn-sm btn-icon btn-reject-single" data-id="${P.id}" title="Reject entry" style="color:var(--color-danger)">
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
    `,e.querySelectorAll(".toolbar-filter").forEach(U=>{U.addEventListener("click",()=>{n=U.dataset.status,i()})}),(T=e.querySelector("#filter-tech"))==null||T.addEventListener("change",U=>{r=U.target.value,i()});const f=["All",...w.map(U=>String(U.id))];(C=e.querySelector("#btn-tech-prev"))==null||C.addEventListener("click",()=>{const U=f.indexOf(String(r));if(U!==-1){const P=(U-1+f.length)%f.length;r=f[P],i()}}),(z=e.querySelector("#btn-tech-next"))==null||z.addEventListener("click",()=>{const U=f.indexOf(String(r));if(U!==-1){const P=(U+1)%f.length;r=f[P],i()}}),(J=e.querySelector("#filter-date-start"))==null||J.addEventListener("change",U=>{u=U.target.value,i()}),(L=e.querySelector("#filter-date-end"))==null||L.addEventListener("change",U=>{g=U.target.value,i()}),(j=e.querySelector("#th-select-all"))==null||j.addEventListener("change",U=>{U.target.checked?D.forEach(P=>{y.includes(P)||y.push(P)}):y=y.filter(P=>!D.includes(P)),i()}),e.querySelectorAll(".row-checkbox").forEach(U=>{U.addEventListener("change",P=>{const Z=U.dataset.id;P.target.checked?y.includes(Z)||y.push(Z):y=y.filter(re=>re!==Z),i()})}),(q=e.querySelector("#btn-bulk-deselect"))==null||q.addEventListener("click",()=>{y=[],i()}),(A=e.querySelector("#btn-bulk-approve"))==null||A.addEventListener("click",()=>{y.length!==0&&(y.forEach(U=>{l.update("timesheets",U,{status:"Approved"})}),O(`Approved ${y.length} timesheets successfully`,"success"),y=[],i())}),(_=e.querySelector("#btn-bulk-reject"))==null||_.addEventListener("click",()=>{y.length!==0&&(y.forEach(U=>{l.update("timesheets",U,{status:"Rejected"})}),O(`Rejected ${y.length} timesheets`,"error"),y=[],i())}),(H=e.querySelector("#btn-bulk-export"))==null||H.addEventListener("click",()=>{if(y.length===0)return;const P=l.getAll("timesheets").filter(ae=>y.includes(ae.id));if(P.length===0){O("No entries found to export","error");return}const re=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description","Status"].join(",")];P.forEach(ae=>{const F=ae.startTime?new Date(ae.startTime).toLocaleString():"",W=ae.finishTime?new Date(ae.finishTime).toLocaleString():"",B=[ae.date||"",`"${(ae.technicianName||"").replace(/"/g,'""')}"`,`"${(ae.jobNumber||"").replace(/"/g,'""')}"`,`"${(ae.taskName||"").replace(/"/g,'""')}"`,`"${F}"`,`"${W}"`,ae.hours||0,`"${(ae.description||"").replace(/"/g,'""')}"`,ae.status||""];re.push(B.join(","))});const ee=re.join(`
`),G=new Blob([ee],{type:"text/csv;charset=utf-8;"}),ne=URL.createObjectURL(G),Q=document.createElement("a");Q.setAttribute("href",ne);const K=new Date().toISOString().split("T")[0];Q.setAttribute("download",`FieldForge_Selected_Timesheets_${K}.csv`),Q.style.visibility="hidden",document.body.appendChild(Q),Q.click(),document.body.removeChild(Q),O(`Exported ${P.length} selected timesheets to CSV!`,"success"),y=[],i()}),(R=e.querySelector("#btn-approve-all-pending"))==null||R.addEventListener("click",()=>{const U=I.filter(P=>P.status==="Pending");U.forEach(P=>l.update("timesheets",P.id,{status:"Approved"})),O(`Approved ${U.length} pending timesheets`,"success"),i()}),e.querySelectorAll(".btn-approve-single").forEach(U=>{U.addEventListener("click",()=>{l.update("timesheets",U.dataset.id,{status:"Approved"}),O("Timesheet entry approved","success"),i()})}),e.querySelectorAll(".btn-reject-single").forEach(U=>{U.addEventListener("click",()=>{l.update("timesheets",U.dataset.id,{status:"Rejected"}),O("Timesheet entry rejected","error"),i()})}),e.querySelectorAll(".btn-edit-timesheet").forEach(U=>{U.addEventListener("click",()=>{p(U.dataset.id)})}),e.querySelectorAll(".btn-delete-timesheet").forEach(U=>{U.addEventListener("click",()=>{const P=U.dataset.id,Z=l.getById("timesheets",P);Z&&$e({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${Z.hours} hrs</strong> on <strong>${new Date(Z.date).toLocaleDateString()}</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:re=>re()},{label:"Delete",className:"btn-danger",onClick:re=>{l.delete("timesheets",P),O("Timesheet entry deleted successfully","success"),re(),i()}}]})})}),(V=e.querySelector("#btn-export-approved"))==null||V.addEventListener("click",()=>{const U=l.getAll("timesheets"),P=["admin","manager","office"].includes(a.role);let Z=U.filter(F=>F.status==="Approved");if(u&&(Z=Z.filter(F=>F.date>=u)),g&&(Z=Z.filter(F=>F.date<=g)),P)r&&r!=="All"&&(Z=Z.filter(F=>F.technicianId===r));else{const W=l.getAll("technicians").find(te=>te.name===a.name),B=W?W.id:null;Z=Z.filter(te=>te.technicianId===B||te.technicianName===a.name)}if(Z.length===0){O("No approved timesheets found to export","error");return}const ee=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description"].join(",")];Z.forEach(F=>{const W=F.startTime?new Date(F.startTime).toLocaleString():"",B=F.finishTime?new Date(F.finishTime).toLocaleString():"",te=[F.date||"",`"${(F.technicianName||"").replace(/"/g,'""')}"`,`"${(F.jobNumber||"").replace(/"/g,'""')}"`,`"${(F.taskName||"").replace(/"/g,'""')}"`,`"${W}"`,`"${B}"`,F.hours||0,`"${(F.description||"").replace(/"/g,'""')}"`];ee.push(te.join(","))});const G=ee.join(`
`),ne=new Blob([G],{type:"text/csv;charset=utf-8;"}),Q=URL.createObjectURL(ne),K=document.createElement("a");K.setAttribute("href",Q);const ae=new Date().toISOString().split("T")[0];K.setAttribute("download",`FieldForge_Approved_Timesheets_${ae}.csv`),K.style.visibility="hidden",document.body.appendChild(K),K.click(),document.body.removeChild(K),O(`Exported ${Z.length} approved timesheets to CSV!`,"success")}),(se=e.querySelector("#btn-log-time"))==null||se.addEventListener("click",()=>{m()})}function p(b){ja(b,i)}function m(){const b={},w={};function I(j,q=[],A=[]){j&&j.forEach((_,H)=>{const R=[...q,H].join("-"),V=[...A,_.name].join(" > ");b[R]=V,_.id&&(w[_.id]=R),_.subTasks&&I(_.subTasks,[...q,H],[...A,_.name])})}function x(j,q=[]){return!j||j.length===0?"":j.map((A,_)=>{const H=[...q,_],R=H.join("-"),V=A.subTasks&&A.subTasks.length>0;return`
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${V?"parent-node":"leaf-node"}" data-path="${R}" data-name="${v(A.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${V?`
                  <span class="material-icons-outlined tree-node-toggle" data-path="${R}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                `:`
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${V?"600":"400"}">${v(A.name)}</span>
              </div>
              ${V?`
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${A.subTasks.length} subtasks</span>
              `:""}
            </div>
            ${V?`
              <div class="tree-node-children" id="children-${R}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${x(A.subTasks,H)}
              </div>
            `:""}
          </div>
        `}).join("")}const E=new Date,k=j=>j.toString().padStart(2,"0"),S=`${E.getFullYear()}-${k(E.getMonth()+1)}-${k(E.getDate())}`,D=`${S}T09:00`,M=`${S}T10:00`,N=l.getAll("technicians"),$=l.getAll("jobs").filter(j=>j.status!=="Completed"&&j.status!=="Invoiced"),f=document.createElement("div");f.innerHTML=`
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
          <input type="datetime-local" class="form-input" id="lt-start" value="${D}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Finish Time *</label>
          <input type="datetime-local" class="form-input" id="lt-finish" value="${M}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${N.map(j=>`<option value="${j.id}" ${r===j.id?"selected":""}>${j.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${$.map(j=>`<option value="${j.id}">${j.number} - ${v(j.customerName)} (${v(j.title)})</option>`).join("")}
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
    `;const T=f.querySelector("#lt-job"),C=f.querySelector("#lt-task-trigger"),z=f.querySelector("#lt-task-dropdown"),J=f.querySelector("#lt-task"),L=f.querySelector("#lt-task-name");C.addEventListener("click",j=>{j.stopPropagation();const q=z.style.display==="block";z.style.display=q?"none":"block"}),document.addEventListener("click",j=>{f.contains(j.target)||(z.style.display="none")}),T.addEventListener("change",j=>{const q=j.target.value;if(!q){C.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',C.disabled=!0,z.style.display="none",J.value="",L.value="";return}const A=$.find(_=>_.id===q);if(!A||!A.tasks||A.tasks.length===0){C.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',C.disabled=!0,z.style.display="none",J.value="",L.value="";return}for(const _ in b)delete b[_];for(const _ in w)delete w[_];I(A.tasks),z.innerHTML=x(A.tasks),C.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',C.disabled=!1,z.querySelectorAll(".tree-node-toggle").forEach(_=>{_.addEventListener("click",H=>{H.stopPropagation();const R=_.dataset.path,V=z.querySelector(`#children-${R}`);if(V){const se=V.style.display==="none";V.style.display=se?"block":"none",_.classList.toggle("expanded",se)}})}),z.querySelectorAll(".tree-node-row").forEach(_=>{_.addEventListener("click",H=>{if(H.target.classList.contains("tree-node-toggle"))return;const R=_.dataset.path,V=R.split("-").map(Number),se=$.find(re=>re.id===q);function U(re,ee){let G=re[ee[0]];for(let ne=1;ne<ee.length;ne++){if(!G||!G.subTasks)return!1;G=G.subTasks[ee[ne]]}return G&&G.subTasks&&G.subTasks.length>0}if(U(se.tasks||[],V)){const re=z.querySelector(`#children-${R}`),ee=z.querySelector(`.tree-node-toggle[data-path="${R}"]`);if(re){const G=re.style.display==="none";re.style.display=G?"block":"none",ee&&ee.classList.toggle("expanded",G)}return}const Z=b[R]||_.dataset.name;J.value=R,L.value=Z,C.innerHTML=`<span>${v(Z)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,z.style.display="none"})})}),$e({title:"Log Time on Behalf of Staff",content:f,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Log Time",className:"btn-primary",onClick:j=>{const q=document.getElementById("lt-start").value,A=document.getElementById("lt-finish").value,_=document.getElementById("lt-tech").value,H=document.getElementById("lt-job").value,R=document.getElementById("lt-task").value,V=document.getElementById("lt-task-name").value,se=document.getElementById("lt-desc").value;if(!q||!A||!_||!H||!R){O("Please fill all required fields, including the task","error");return}const U=new Date(q),P=new Date(A);if(P<=U){O("Finish time must be after start time","error");return}const Z=Math.round((P-U)/36e5*100)/100,re=N.find(G=>G.id===_),ee=$.find(G=>G.id===H);l.create("timesheets",{jobId:ee.id,jobNumber:ee.number,taskId:R,taskName:V,technicianId:_,technicianName:re.name,date:q.split("T")[0],startTime:q,finishTime:A,hours:Z,description:se||"",status:"Pending"}),O("Time logged successfully on behalf of staff","success"),j(),i()}}]})}i()}const Jt=[{value:"call",label:"Call",icon:"phone",color:"#3B82F6"},{value:"meeting",label:"Meeting",icon:"groups",color:"#8B5CF6"},{value:"follow-up",label:"Follow-up",icon:"reply",color:"#F59E0B"},{value:"site-visit",label:"Site Visit",icon:"location_on",color:"#10B981"},{value:"email",label:"Email",icon:"email",color:"#06B6D4"},{value:"task",label:"Task",icon:"task_alt",color:"#64748B"},{value:"other",label:"Other",icon:"more_horiz",color:"#94A3B8"}];function _s(e){return Jt.find(a=>a.value===e)||Jt[6]}function ga(e,a){if(!e||!a)return null;const t={job:"/jobs/",quote:"/quotes/",invoice:"/invoices/",customer:"/customers/",lead:"/leads/"};return t[e]?t[e]+a:null}function Fs(e,{getWeekDays:a,viewMode:t,currentDate:s,calendarType:n,isTechnician:r,onNav:c,onToday:o,onViewMode:d,onCalType:u}){const g=a(),y=["January","February","March","April","May","June","July","August","September","October","November","December"],i=JSON.parse(localStorage.getItem("currentUser")||"{}"),p=l.getAll("technicians");let m="active",h=r?i.id:"all";function b(){let S=l.getAll("activities");h!=="all"&&(S=S.filter(M=>M.assignedToId===h));const D=new Date().toISOString().split("T")[0];return m==="active"?S=S.filter(M=>M.status!=="completed"):m==="completed"?S=S.filter(M=>M.status==="completed"):m==="overdue"&&(S=S.filter(M=>M.status!=="completed"&&M.date<D)),S}function w(){let S=l.getAll("activities");h!=="all"&&(S=S.filter($=>$.assignedToId===h));const D=new Date().toISOString().split("T")[0],M=g.map($=>$.toISOString().split("T")[0]),N=S.filter($=>M.includes($.date));return{total:N.length,completed:N.filter($=>$.status==="completed").length,pending:N.filter($=>$.status!=="completed").length,overdue:S.filter($=>$.status!=="completed"&&$.date<D).length}}function I(S){var C;const D=_s(S.type),M=S.status==="completed",N=new Date().toISOString().split("T")[0],$=!M&&S.date<N,f=ga(S.linkedType,S.linkedId),T=S.priority==="high"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#EF4444;margin-right:4px" title="High priority"></span>':S.priority==="low"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94A3B8;margin-right:4px" title="Low priority"></span>':"";return`
      <div class="activity-card ${M?"completed":""} ${$?"overdue":""}" data-id="${S.id}" style="
        background:var(--card-bg); border:1px solid ${$?"#FCA5A5":"var(--border-color)"};
        border-left:3px solid ${M?"#94A3B8":D.color}; border-radius:8px;
        padding:12px 14px; transition:all 0.2s; ${M?"opacity:0.6;":""}
        display:flex; gap:12px; align-items:flex-start; position:relative;
      ">
        <div style="width:32px;height:32px;border-radius:8px;background:${D.color}14;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
          <span class="material-icons-outlined" style="font-size:18px;color:${D.color}">${D.icon}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">
            <div style="font-weight:600;font-size:13px;${M?"text-decoration:line-through;color:var(--text-tertiary)":"color:var(--text-primary)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${T}${v(S.title)}
            </div>
            <div style="display:flex;gap:2px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm btn-icon act-toggle-complete" data-id="${S.id}" title="${M?"Mark pending":"Mark complete"}" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:${M?"#10B981":"var(--text-tertiary)"}">${M?"check_circle":"radio_button_unchecked"}</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-edit" data-id="${S.id}" title="Edit" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-delete" data-id="${S.id}" title="Delete" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:var(--color-danger)">close</span>
              </button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-secondary)">
            ${S.time?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">schedule</span>${v(S.time)}${S.duration?` (${S.duration}min)`:""}</span>`:""}
            <span style="display:flex;align-items:center;gap:3px;background:${D.color}14;color:${D.color};padding:1px 6px;border-radius:10px;font-weight:500">${D.label}</span>
            ${S.linkedLabel?`<span class="act-linked-record" data-type="${S.linkedType||""}" data-linked-id="${S.linkedId||""}" style="display:flex;align-items:center;gap:3px;cursor:${f?"pointer":"default"};${f?"color:var(--color-primary);text-decoration:underline;":""}"><span class="material-icons-outlined" style="font-size:13px">link</span>${v(S.linkedLabel)}</span>`:""}
            ${h==="all"?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">person</span>${v(((C=p.find(z=>z.id===S.assignedToId))==null?void 0:C.name)||"Unassigned")}</span>`:""}
          </div>
          ${S.notes?`<div style="margin-top:6px;font-size:12px;color:var(--text-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v(S.notes)}</div>`:""}
        </div>
      </div>`}function x(){const S=b(),D=w(),M=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];e.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">${y[s.getMonth()]} ${s.getFullYear()}</span>
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${n==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${n==="activity"?"active":""}" data-cal="activity">Activities</button>
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
              <button class="toolbar-filter act-filter ${m==="overdue"?"active":""}" data-filter="overdue" style="${D.overdue>0?"color:var(--color-danger)":""}">Overdue${D.overdue>0?` (${D.overdue})`:""}</button>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-new-activity"><span class="material-icons-outlined" style="font-size:16px;margin-right:4px">add</span>New Activity</button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:16px">
            ${g.map(N=>{const $=N.toISOString().split("T")[0],f=$===new Date().toISOString().split("T")[0],T=S.filter(C=>C.date===$).sort((C,z)=>(C.time||"99:99").localeCompare(z.time||"99:99"));return`
                <div style="margin-bottom:20px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border-color)">
                    ${f?'<span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0"></span>':""}
                    <h4 style="margin:0;font-size:13px;${f?"color:var(--color-primary)":"color:var(--text-secondary)"}">${M[N.getDay()]}, ${N.getDate()} ${y[N.getMonth()]}</h4>
                    <span style="font-size:11px;color:var(--text-tertiary)">${T.length} ${T.length===1?"activity":"activities"}</span>
                  </div>
                  ${T.length===0?'<p style="color:var(--text-tertiary);font-size:12px;margin:0 0 0 16px">No activities scheduled.</p>':`
                    <div style="display:flex;flex-direction:column;gap:8px">${T.map(C=>I(C)).join("")}</div>
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
                <div style="font-size:20px;font-weight:700;color:var(--color-primary)">${D.pending}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Pending</div>
              </div>
              <div style="text-align:center;padding:10px;background:var(--content-bg);border-radius:8px">
                <div style="font-size:20px;font-weight:700;color:#10B981">${D.completed}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Done</div>
              </div>
              ${D.overdue>0?`
              <div style="text-align:center;padding:10px;background:#FEF2F2;border-radius:8px;grid-column:span 2">
                <div style="font-size:20px;font-weight:700;color:#EF4444">${D.overdue}</div>
                <div style="font-size:10px;color:#EF4444;text-transform:uppercase;font-weight:600">Overdue</div>
              </div>`:""}
            </div>
          </div>
          ${r?"":`
          <!-- Team Filter -->
          <div style="padding:16px;border-bottom:1px solid var(--border-color)">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">people</span>View By
            </h4>
            <select class="form-select" id="act-tech-filter" style="width:100%">
              <option value="all" ${h==="all"?"selected":""}>All Team Members</option>
              ${p.map(N=>`<option value="${N.id}" ${h===N.id?"selected":""}>${N.name}</option>`).join("")}
            </select>
          </div>`}
          <!-- Quick Create -->
          <div style="padding:16px">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">bolt</span>Quick Add
            </h4>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${Jt.slice(0,5).map(N=>`
                <button class="btn btn-secondary btn-sm act-quick-add" data-type="${N.value}" style="justify-content:flex-start;gap:8px;text-align:left">
                  <span class="material-icons-outlined" style="font-size:16px;color:${N.color}">${N.icon}</span>${N.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>`,k()}function E(S=null){const D=!!S,M=S||{title:"",type:"call",date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""},N=l.getAll("jobs").filter(q=>q.status!=="Completed"&&q.status!=="Invoiced"),$=l.getAll("customers"),f=l.getAll("quotes"),T=document.createElement("div");T.innerHTML=`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="act-title" value="${v(M.title)}" placeholder="e.g. Follow up on quote..." style="width:100%" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Type</label>
          <select class="form-select" id="act-type" style="width:100%">
            ${Jt.map(q=>`<option value="${q.value}" ${M.type===q.value?"selected":""}>${q.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <select class="form-select" id="act-priority" style="width:100%">
            <option value="low" ${M.priority==="low"?"selected":""}>Low</option>
            <option value="normal" ${M.priority==="normal"?"selected":""}>Normal</option>
            <option value="high" ${M.priority==="high"?"selected":""}>High</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="act-date" value="${M.date}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="act-time" value="${M.time||""}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Duration (min)</label>
          <input type="number" class="form-input" id="act-duration" value="${M.duration||""}" min="0" step="5" style="width:100%" />
        </div>
      </div>
      ${r?"":`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Assign To</label>
        <select class="form-select" id="act-assignee" style="width:100%">
          ${p.map(q=>`<option value="${q.id}" ${M.assignedToId===q.id?"selected":""}>${q.name}</option>`).join("")}
        </select>
      </div>`}
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Link To</label>
          <select class="form-select" id="act-link-type" style="width:100%">
            <option value="">None</option>
            <option value="job" ${M.linkedType==="job"?"selected":""}>Job</option>
            <option value="customer" ${M.linkedType==="customer"?"selected":""}>Customer</option>
            <option value="quote" ${M.linkedType==="quote"?"selected":""}>Quote</option>
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
        <textarea class="form-input" id="act-notes" rows="3" placeholder="Additional details..." style="width:100%">${v(M.notes||"")}</textarea>
      </div>
      ${D?"":`
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
            ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((q,A)=>`
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 8px;border:1px solid var(--border-color);border-radius:4px;cursor:pointer">
                <input type="checkbox" class="recur-day-cb" value="${A+1}" ${A<5,""} />${q}
              </label>
            `).join("")}
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-tertiary)">For weekly/fortnightly, select which days. For daily/monthly the date field is used as the anchor.</div>
        </div>
      </div>`}
    `;function C(q,A){const _=T.querySelector("#act-link-record");let H='<option value="">Select...</option>';q==="job"?H+=N.map(R=>`<option value="${R.id}" data-label="Job ${R.number}" ${A===R.id?"selected":""}>${R.number} — ${v(R.title)}</option>`).join(""):q==="customer"?H+=$.map(R=>`<option value="${R.id}" data-label="${v(R.company||R.firstName+" "+R.lastName)}" ${A===R.id?"selected":""}>${v(R.company||R.firstName+" "+R.lastName)}</option>`).join(""):q==="quote"&&(H+=f.map(R=>`<option value="${R.id}" data-label="Quote ${R.number}" ${A===R.id?"selected":""}>${R.number} — ${v(R.customerName||"")}</option>`).join("")),_.innerHTML=H}C(M.linkedType,M.linkedId),T.querySelector("#act-link-type").addEventListener("change",q=>C(q.target.value,""));const z=T.querySelector("#act-recur-enabled"),J=T.querySelector("#act-recur-details"),L=T.querySelector("#act-recur-weekdays"),j=T.querySelector("#act-recur-freq");z&&(z.addEventListener("change",()=>{J.style.display=z.checked?"block":"none"}),j==null||j.addEventListener("change",()=>{L.style.display=j.value==="weekly"||j.value==="fortnightly"?"flex":"none"})),$e({title:D?"Edit Activity":"New Activity",content:T,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:q=>q()},{label:D?"Save Changes":"Create Activity",className:"btn-primary",onClick:q=>{var U,P,Z;const A=T.querySelector("#act-title").value.trim(),_=T.querySelector("#act-date").value;if(!A||!_){O("Title and date are required","error");return}const H=T.querySelector("#act-link-type").value,R=T.querySelector("#act-link-record"),V=R.options[R.selectedIndex],se={title:A,type:T.querySelector("#act-type").value,priority:T.querySelector("#act-priority").value,date:_,time:T.querySelector("#act-time").value||"",duration:parseInt(T.querySelector("#act-duration").value)||0,assignedToId:r?i.id:((U=T.querySelector("#act-assignee"))==null?void 0:U.value)||i.id,linkedType:H,linkedId:R.value||"",linkedLabel:((P=V==null?void 0:V.dataset)==null?void 0:P.label)||"",notes:T.querySelector("#act-notes").value,status:D?M.status:"pending"};if(D)l.update("activities",M.id,se),O("Activity updated","success");else if((Z=T.querySelector("#act-recur-enabled"))==null?void 0:Z.checked){const ee=T.querySelector("#act-recur-freq").value,G=Math.min(parseInt(T.querySelector("#act-recur-count").value)||4,52),ne=[...T.querySelectorAll(".recur-day-cb:checked")].map(F=>parseInt(F.value)),Q=[],K=new Date(_+"T12:00:00");if(ee==="daily")for(let F=0;F<G;F++){const W=new Date(K);W.setDate(W.getDate()+F),Q.push(W)}else if(ee==="weekly"||ee==="fortnightly"){const F=ee==="fortnightly"?2:1,W=ne.length>0?ne:[K.getDay()===0?7:K.getDay()];let B=new Date(K);B.setDate(B.getDate()-(B.getDay()+6)%7);let te=0;for(let ue=0;te<G&&ue<200;ue++){for(const pe of W){if(te>=G)break;const X=new Date(B);X.setDate(X.getDate()+(pe-1)),X>=K&&(Q.push(X),te++)}B.setDate(B.getDate()+7*F)}}else if(ee==="monthly")for(let F=0;F<G;F++){const W=new Date(K);W.setMonth(W.getMonth()+F),Q.push(W)}const ae=F=>F.toString().padStart(2,"0");Q.forEach(F=>{const W=`${F.getFullYear()}-${ae(F.getMonth()+1)}-${ae(F.getDate())}`;l.create("activities",{...se,date:W,recurrenceGroup:se.title+"_"+_})}),O(`Created ${Q.length} recurring activities`,"success")}else l.create("activities",se),O("Activity created","success");q(),x()}}]})}function k(){var S,D,M,N,$;(S=e.querySelector("#btn-prev"))==null||S.addEventListener("click",()=>c(-1)),(D=e.querySelector("#btn-next"))==null||D.addEventListener("click",()=>c(1)),(M=e.querySelector("#btn-today"))==null||M.addEventListener("click",o),e.querySelectorAll("[data-view]").forEach(f=>f.addEventListener("click",()=>d(f.dataset.view))),e.querySelectorAll("[data-cal]").forEach(f=>f.addEventListener("click",()=>u(f.dataset.cal))),e.querySelectorAll(".act-filter").forEach(f=>f.addEventListener("click",()=>{m=f.dataset.filter,x()})),(N=e.querySelector("#act-tech-filter"))==null||N.addEventListener("change",f=>{h=f.target.value,x()}),($=e.querySelector("#btn-new-activity"))==null||$.addEventListener("click",()=>E()),e.querySelectorAll(".act-quick-add").forEach(f=>f.addEventListener("click",()=>{const T=f.dataset.type;E({title:"",type:T,date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""})})),e.querySelectorAll(".act-toggle-complete").forEach(f=>f.addEventListener("click",T=>{T.stopPropagation();const C=l.getById("activities",f.dataset.id);C&&(l.update("activities",C.id,{status:C.status==="completed"?"pending":"completed"}),x())})),e.querySelectorAll(".act-edit").forEach(f=>f.addEventListener("click",T=>{T.stopPropagation();const C=l.getById("activities",f.dataset.id);C&&E(C)})),e.querySelectorAll(".act-delete").forEach(f=>f.addEventListener("click",T=>{T.stopPropagation(),$e({title:"Delete Activity",content:"<p>Are you sure you want to delete this activity?</p>",actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()},{label:"Delete",className:"btn-danger",onClick:C=>{l.delete("activities",f.dataset.id),O("Activity deleted","success"),C(),x()}}]})})),e.querySelectorAll(".act-linked-record").forEach(f=>f.addEventListener("click",T=>{T.stopPropagation();const C=ga(f.dataset.type,f.dataset.linkedId);C&&Y.navigate(C)}))}x()}function Hs(e){const a=l.getAll("technicians"),t=JSON.parse(localStorage.getItem("currentUser")||"{}"),s=t.role==="technician";let n="week",r="schedule",c=new Date;const o=Array.from({length:24},(H,R)=>R);let d=null,u=null,g=new Set(s?[t.id]:a.map(H=>H.id)),y=null,i=0,p=0,m=!1,h=!1;const b=32,w=b/4;function I(H){return Math.round(H*4)/4}function x(H){const R=Math.floor(H),V=Math.round((H-R)*60);return`${R.toString().padStart(2,"0")}:${V.toString().padStart(2,"0")}`}function E(){const H=document.getElementById("calendar-scroll");H&&(i=H.scrollTop,p=H.scrollLeft)}function k(){const H=document.getElementById("calendar-scroll");H&&(H.scrollTop=i,H.scrollLeft=p)}function S(){y&&(y.remove(),y=null)}document.addEventListener("click",S);function D(){const H=new Date(c);return n==="day"?[new Date(c)]:(H.setDate(H.getDate()-H.getDay()+1),Array.from({length:5},(R,V)=>{const se=new Date(H);return se.setDate(se.getDate()+V),se}))}function M(){const H=l.getAll("jobs"),R=l.getAll("schedule"),V=[],se=D();R.forEach(P=>{if(P.type==="leave"||P.type==="blockout"||P.type==="meeting"){const ee=P.date?new Date(P.date+"T12:00:00"):P.startTime?new Date(P.startTime):null;if(!ee)return;se.forEach((G,ne)=>{if(ee.toDateString()===G.toDateString()){let Q=8,K=10;if(P.startTime&&P.finishTime){const ae=new Date(P.startTime),F=new Date(P.finishTime);Q=ae.getHours()+ae.getMinutes()/60,K=F.getHours()+F.getMinutes()/60}else P.startHour!==void 0&&P.endHour!==void 0&&(Q=P.startHour,K=P.endHour);V.push({id:P.id,type:P.type,jobId:null,jobNumber:P.type==="leave"?"LEAVE":P.type==="blockout"?"BLOCKOUT":"MEETING",customerName:P.notes||(P.type==="leave"?"On Leave":P.type==="blockout"?"Calendar Block":"Scheduled Meeting"),title:P.notes||"",technicianId:P.technicianId,dayIdx:ne,startHour:Q,endHour:K,status:"Draft",priority:"Normal"})}});return}const Z=H.find(ee=>ee.id===P.jobId);if(!Z||Z.status==="Completed"||Z.status==="Invoiced")return;let re=null;if(P.date)re=new Date(P.date+"T12:00:00");else if(P.startTime)re=new Date(P.startTime);else if(P.dayOffset!==void 0){const ee=se[0];ee&&(re=new Date(ee),re.setDate(re.getDate()+P.dayOffset))}re&&se.forEach((ee,G)=>{if(re.toDateString()===ee.toDateString()){let ne=8,Q=10;if(P.startTime&&P.finishTime){const K=new Date(P.startTime),ae=new Date(P.finishTime);ne=K.getHours()+K.getMinutes()/60,Q=ae.getHours()+ae.getMinutes()/60}else P.startHour!==void 0&&P.endHour!==void 0&&(ne=P.startHour,Q=P.endHour);V.push({id:P.id,type:"schedule",jobId:Z.id,jobNumber:Z.number,customerName:Z.customerName,title:Z.title,technicianId:P.technicianId,dayIdx:G,startHour:ne,endHour:Q,status:Z.status,priority:Z.priority})}})});const U=new Set(R.map(P=>P.jobId));return H.filter(P=>P.scheduledDate&&!U.has(P.id)&&P.status!=="Completed"&&P.status!=="Invoiced").forEach(P=>{const Z=new Date(P.scheduledDate);se.forEach((re,ee)=>{if(Z.toDateString()===re.toDateString()){const G=P.startHour!==void 0?P.startHour:7+Math.abs(N(P.id))%6;if(P.technicians&&P.technicians.length>0)P.technicians.forEach(ne=>{const Q=ne.hours||2;V.push({id:`legacy-${P.id}-${ne.id}`,type:"legacy",jobId:P.id,jobNumber:P.number,customerName:P.customerName,title:P.title,technicianId:ne.id,dayIdx:ee,startHour:G,endHour:G+Q,status:P.status,priority:P.priority})});else if(P.technicianId){const ne=P.estimatedHours||2;V.push({id:`legacy-${P.id}`,type:"legacy",jobId:P.id,jobNumber:P.number,customerName:P.customerName,title:P.title,technicianId:P.technicianId,dayIdx:ee,startHour:G,endHour:G+ne,status:P.status,priority:P.priority})}}})}),V}function N(H){let R=0;for(let V=0;V<H.length;V++)R=(R<<5)-R+H.charCodeAt(V),R|=0;return R}function $(){E();const H=D(),R=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],V=["January","February","March","April","May","June","July","August","September","October","November","December"];if(r==="activity"){_();return}const se=M(),U=a.filter(P=>g.has(P.id));document.documentElement.getAttribute("data-theme"),e.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${V[c.getMonth()]} ${c.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${s?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${t.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${r==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${r==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${n==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${n==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <!-- Calendar Grid + Right Sidebar -->
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 160px);overflow:hidden">
          
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${g.size!==1?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${U.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${U.map(P=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${P.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${P.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${H.map((P,Z)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${P.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${R[P.getDay()]}, ${P.getDate()} ${V[P.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${U.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${o.map(ee=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${ee.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${U.map(ee=>{const G=se.filter(ne=>ne.technicianId===ee.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${ee.id}" data-day="${Z}" data-date="${H[Z].getFullYear()}-${(H[Z].getMonth()+1).toString().padStart(2,"0")}-${H[Z].getDate().toString().padStart(2,"0")}">
                          ${o.map(ne=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${ne}"></div>`).join("")}
                          ${L(G,Z,ee.color)}
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
                ${H.map(P=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${P.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${R[P.getDay()]} ${P.getDate()} ${V[P.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${H.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${o.map(P=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${P.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${H.map((P,Z)=>{const re=a.find(G=>G.id===[...g][0]),ee=se.filter(G=>G.technicianId===re.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${re.id}" data-day="${Z}" data-date="${H[Z].getFullYear()}-${(H[Z].getMonth()+1).toString().padStart(2,"0")}-${H[Z].getDate().toString().padStart(2,"0")}">
                      ${o.map(G=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${G}"></div>`).join("")}
                      ${L(ee,Z,re.color)}
                    </div>
                  `}).join("")}
              </div>
            `}
          </div>

          <!-- Right Sidebar (For Non-Technicians) -->
          ${s?"":`
            ${m?`
              <!-- Collapsed Sidebar -->
              <div style="width:48px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; align-items:center; background:var(--card-bg); padding:16px 0; flex-shrink:0;">
                <button class="btn btn-ghost btn-icon btn-sm" id="btn-toggle-sidebar" title="Expand Sidebar" style="color:var(--text-secondary); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                  <span class="material-icons-outlined" style="font-size:20px">chevron_left</span>
                </button>
                
                <!-- Action Button Trigger (Plus Icon) -->
                <div style="margin-top:12px; position:relative; display:flex; flex-direction:column; align-items:center;">
                  <button class="btn btn-primary btn-icon btn-sm" id="btn-action-menu-trigger" title="Add to Schedule" style="width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0">
                    <span class="material-icons-outlined" style="font-size:20px">add</span>
                  </button>
                  ${h?`
                    <!-- Action Dropdown Menu -->
                    <div id="action-dropdown-menu" class="sidebar-collapsed-flyout" style="position:absolute; top:0; right:42px; width:220px; z-index:100; display:flex; flex-direction:column; overflow:hidden;">
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="job" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px">assignment</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Job Schedule</span>
                      </button>
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="leave" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:#EF4444; font-size:18px">flight_takeoff</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Leave / Time Off</span>
                      </button>
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="blockout" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:#6B7280; font-size:18px">block</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Calendar Blockout</span>
                      </button>
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="meeting" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:#3B82F6; font-size:18px">groups</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Team Meeting</span>
                      </button>
                    </div>
                  `:""}
                </div>

                <div style="margin-top:20px; color:var(--text-tertiary); display:flex; flex-direction:column; align-items:center; gap:16px">
                  <span class="material-icons-outlined" title="Visible Technicians" style="font-size:20px">people</span>
                  <div style="display:flex; flex-direction:column; gap:6px; align-items:center">
                    ${a.filter(P=>g.has(P.id)).map(P=>`
                      <div style="width:6px; height:6px; border-radius:50%; background:${P.color}" title="${P.name}"></div>
                    `).join("")}
                  </div>
                </div>
              </div>
            `:`
              <!-- Expanded Sidebar -->
              <div style="width:280px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; background:var(--card-bg); overflow-y:auto; flex-shrink:0;">
                
                <!-- Action Button Trigger -->
                <div style="padding:16px; border-bottom:1px solid var(--border-color); display:flex; flex-direction:column; gap:12px; position:relative;">
                  <button class="btn btn-primary" id="btn-action-menu-trigger" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span class="material-icons-outlined">add</span>
                    <span>Add to Schedule</span>
                  </button>
                  ${h?`
                    <!-- Action Dropdown Menu -->
                    <div id="action-dropdown-menu" class="sidebar-collapsed-flyout" style="position:absolute; top:56px; left:16px; right:16px; z-index:100; display:flex; flex-direction:column; overflow:hidden;">
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="job" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:var(--color-primary); font-size:18px">assignment</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Job Schedule</span>
                      </button>
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="leave" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:#EF4444; font-size:18px">flight_takeoff</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Leave / Time Off</span>
                      </button>
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="blockout" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:#6B7280; font-size:18px">block</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Calendar Blockout</span>
                      </button>
                      <button class="sidebar-nav-item sub-item action-menu-opt" data-action="meeting" style="margin:2px 0; width:100%; border:none; background:none; cursor:pointer; display:flex !important; align-items:center !important;">
                        <span class="nav-icon"><span class="material-icons-outlined" style="color:#3B82F6; font-size:18px">groups</span></span>
                        <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">Add Team Meeting</span>
                      </button>
                    </div>
                  `:""}
                </div>

                <!-- Visible Technicians Module -->
                <div style="padding:16px; border-bottom:1px solid var(--border-color);">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="font-size:var(--font-size-sm); margin:0; display:flex; align-items:center; gap:6px;">
                      <span class="material-icons-outlined" style="font-size:16px;">people</span> Visible Technicians
                    </h4>
                    <button class="btn btn-ghost btn-icon btn-sm" id="btn-toggle-sidebar" title="Collapse Sidebar" style="color:var(--text-secondary); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0">
                      <span class="material-icons-outlined" style="font-size:18px">chevron_right</span>
                    </button>
                  </div>
                  <div style="display:flex; flex-direction:column; gap:10px;">
                    ${a.map(P=>`
                      <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                        <input type="checkbox" class="tech-visibility-checkbox" value="${P.id}" ${g.has(P.id)?"checked":""}>
                        <div style="width:10px; height:10px; border-radius:50%; background:${P.color};"></div>
                        <span style="color:var(--text-primary); font-weight:500;">${P.name}</span>
                      </label>
                    `).join("")}
                  </div>
                </div>
              </div>
            `}
          `}

        </div>
      </div>
    `,j(),q(H),A(),k()}function f(){return l.getAll("jobs").filter(R=>(!R.scheduledDate||!R.technicianId)&&R.status!=="Completed"&&R.status!=="Invoiced")}function T(){const H=f(),R=l.getAll("technicians");if(H.length===0){O("No unscheduled jobs available.","info");return}He({title:"Schedule Unscheduled Job",content:`
        <form id="drawer-add-job-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Select Job <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="jobId" required>
              ${H.map(V=>`<option value="${V.id}">${V.number} — ${v(V.customerName)} (${v(V.title)})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${R.map(V=>`<option value="${V.id}">${v(V.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split("T")[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="08:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="2" required />
            </div>
          </div>
        </form>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:V=>V()},{label:"Schedule Job",className:"btn-primary",onClick:V=>{const se=document.getElementById("drawer-add-job-form");if(!se.checkValidity())return se.reportValidity();const U=new FormData(se),P=U.get("jobId"),Z=U.get("technicianId"),re=U.get("date"),ee=U.get("startTime"),G=parseFloat(U.get("duration")),ne=l.getById("jobs",P),Q=l.getById("technicians",Z),K=parseFloat(ee.split(":")[0])+parseFloat(ee.split(":")[1])/60,ae=K+G,F=`${re}T${ee}`,W=Math.floor(ae),B=Math.round((ae-W)*60),te=`${re}T${W.toString().padStart(2,"0")}:${B.toString().padStart(2,"0")}`;l.create("schedule",{jobId:ne.id,jobNumber:ne.number,technicianId:Z,technicianName:(Q==null?void 0:Q.name)||"",date:re,startTime:F,finishTime:te,hours:G}),l.update("jobs",ne.id,{scheduledDate:re,startHour:K,technicianId:Z}),O(`Scheduled Job ${ne.number} to ${Q==null?void 0:Q.name}`,"success"),V(),$()}}]})}function C(){const H=l.getAll("technicians");He({title:"Book Technician Leave",content:`
        <form id="drawer-add-leave-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${H.map(R=>`<option value="${R.id}">${v(R.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split("T")[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="08:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="8" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Leave Type / Notes <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="notes" required>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Public Holiday">Public Holiday</option>
            </select>
          </div>
        </form>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Book Leave",className:"btn-primary",onClick:R=>{const V=document.getElementById("drawer-add-leave-form");if(!V.checkValidity())return V.reportValidity();const se=new FormData(V),U=se.get("technicianId"),P=se.get("date"),Z=se.get("startTime"),re=parseFloat(se.get("duration")),ee=se.get("notes"),G=l.getById("technicians",U),Q=parseFloat(Z.split(":")[0])+parseFloat(Z.split(":")[1])/60+re,K=`${P}T${Z}`,ae=Math.floor(Q),F=Math.round((Q-ae)*60),W=`${P}T${ae.toString().padStart(2,"0")}:${F.toString().padStart(2,"0")}`;l.create("schedule",{type:"leave",technicianId:U,technicianName:(G==null?void 0:G.name)||"",date:P,startTime:K,finishTime:W,hours:re,notes:ee}),O(`Leave booked for ${G==null?void 0:G.name}`,"success"),R(),$()}}]})}function z(){const H=l.getAll("technicians");He({title:"Book Calendar Blockout",content:`
        <form id="drawer-add-blockout-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${H.map(R=>`<option value="${R.id}">${v(R.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split("T")[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="12:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="1" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Blockout Reason / Notes <span style="color:var(--color-danger)">*</span></label>
            <input type="text" class="form-input" name="notes" placeholder="e.g. Vehicle Maintenance, Doctor, Training" required />
          </div>
        </form>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Create Blockout",className:"btn-primary",onClick:R=>{const V=document.getElementById("drawer-add-blockout-form");if(!V.checkValidity())return V.reportValidity();const se=new FormData(V),U=se.get("technicianId"),P=se.get("date"),Z=se.get("startTime"),re=parseFloat(se.get("duration")),ee=se.get("notes"),G=l.getById("technicians",U),Q=parseFloat(Z.split(":")[0])+parseFloat(Z.split(":")[1])/60+re,K=`${P}T${Z}`,ae=Math.floor(Q),F=Math.round((Q-ae)*60),W=`${P}T${ae.toString().padStart(2,"0")}:${F.toString().padStart(2,"0")}`;l.create("schedule",{type:"blockout",technicianId:U,technicianName:(G==null?void 0:G.name)||"",date:P,startTime:K,finishTime:W,hours:re,notes:ee}),O(`Blockout scheduled for ${G==null?void 0:G.name}`,"success"),R(),$()}}]})}function J(){const H=l.getAll("technicians");He({title:"Book Team Meeting",content:`
        <form id="drawer-add-meeting-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${H.map(R=>`<option value="${R.id}">${v(R.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span style="color:var(--color-danger)">*</span></label>
            <input type="date" class="form-input" name="date" value="${new Date().toISOString().split("T")[0]}" required />
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
            <div class="form-group">
              <label class="form-label">Start Time <span style="color:var(--color-danger)">*</span></label>
              <input type="time" class="form-input" name="startTime" value="09:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">Duration (Hours) <span style="color:var(--color-danger)">*</span></label>
              <input type="number" class="form-input" name="duration" min="0.5" step="0.5" value="1" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Meeting Subject <span style="color:var(--color-danger)">*</span></label>
            <input type="text" class="form-input" name="notes" placeholder="e.g. Weekly Toolbox Talk, Safety Sync" required />
          </div>
        </form>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Schedule Meeting",className:"btn-primary",onClick:R=>{const V=document.getElementById("drawer-add-meeting-form");if(!V.checkValidity())return V.reportValidity();const se=new FormData(V),U=se.get("technicianId"),P=se.get("date"),Z=se.get("startTime"),re=parseFloat(se.get("duration")),ee=se.get("notes"),G=l.getById("technicians",U),Q=parseFloat(Z.split(":")[0])+parseFloat(Z.split(":")[1])/60+re,K=`${P}T${Z}`,ae=Math.floor(Q),F=Math.round((Q-ae)*60),W=`${P}T${ae.toString().padStart(2,"0")}:${F.toString().padStart(2,"0")}`;l.create("schedule",{type:"meeting",technicianId:U,technicianName:(G==null?void 0:G.name)||"",date:P,startTime:K,finishTime:W,hours:re,notes:ee}),O(`Meeting scheduled for ${G==null?void 0:G.name}`,"success"),R(),$()}}]})}function L(H,R,V){const se={Urgent:"#EF4444",High:"#F59E0B"};return H.filter(U=>U.dayIdx===R).map(U=>{const P=U.startHour*b,Z=Math.max((U.endHour-U.startHour)*b-2,w);let re=se[U.priority]||V,ee=`${V}12`,G=V;U.type==="leave"?(re="#EF4444",ee="rgba(239, 68, 68, 0.1)",G="#EF4444"):U.type==="blockout"?(re="#6B7280",ee="rgba(107, 114, 128, 0.1)",G="#4B5563"):U.type==="meeting"&&(re="#3B82F6",ee="rgba(59, 130, 246, 0.1)",G="#2563EB");const ne=`${x(U.startHour)} — ${x(U.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${U.jobId||""}"
            data-schedule-id="${U.id}"
            data-block-type="${U.type}"
            data-start="${U.startHour}"
            data-end="${U.endHour}"
            style="
              top:${P}px;
              height:${Z}px;
              background:${ee};
              border-color:${re};
              color:${G};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:700;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.jobNumber}</div>
            ${Z>20?`<div style="pointer-events:none;font-size:10px;opacity:0.9;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${U.customerName}</div>`:""}
            ${Z>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.7;margin-top:2px">${ne}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${U.jobId||""}" data-schedule-id="${U.id}" data-block-type="${U.type}" data-start="${U.startHour}" data-end="${U.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function j(){var H,R,V,se,U;(H=e.querySelector("#btn-prev"))==null||H.addEventListener("click",()=>{c.setDate(c.getDate()-(n==="week"?7:1)),$()}),(R=e.querySelector("#btn-next"))==null||R.addEventListener("click",()=>{c.setDate(c.getDate()+(n==="week"?7:1)),$()}),(V=e.querySelector("#btn-today"))==null||V.addEventListener("click",()=>{c=new Date,$()}),e.querySelectorAll("[data-view]").forEach(P=>{P.addEventListener("click",()=>{n=P.dataset.view,$()})}),e.querySelectorAll("[data-cal]").forEach(P=>{P.addEventListener("click",()=>{r=P.dataset.cal,$()})}),e.querySelectorAll(".tech-visibility-checkbox").forEach(P=>{P.addEventListener("change",Z=>{Z.target.checked?g.add(Z.target.value):g.delete(Z.target.value),$()})}),(se=e.querySelector("#btn-toggle-sidebar"))==null||se.addEventListener("click",()=>{m=!m,$()}),(U=e.querySelector("#btn-action-menu-trigger"))==null||U.addEventListener("click",P=>{P.stopPropagation(),h=!h,$()}),e.querySelectorAll(".action-menu-opt").forEach(P=>{P.addEventListener("click",Z=>{Z.stopPropagation();const re=P.dataset.action;h=!1,$(),re==="job"?T():re==="leave"?C():re==="blockout"?z():re==="meeting"&&J()})}),e.querySelectorAll(".schedule-block").forEach(P=>{P.addEventListener("click",Z=>{if(Z.defaultPrevented)return;if(P.dataset.resized==="true"){P.dataset.resized="false";return}const re=P.dataset.blockJobId,ee=P.dataset.blockType,G=P.dataset.scheduleId;if(ee==="schedule"||ee==="legacy"){const ne=l.getById("jobs",re);if(!ne)return;He({title:`Job Quick View: ${ne.number}`,content:`
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                  <label class="form-label">Title</label>
                  <div class="font-medium" style="font-size:16px">${ne.title||"Untitled"}</div>
                </div>
                <div>
                  <label class="form-label">Customer</label>
                  <div>${ne.customerName||"N/A"}</div>
                </div>
                <div>
                  <label class="form-label">Site Address</label>
                  <div>${ne.siteAddress||"No address provided"}</div>
                </div>
                <div>
                  <label class="form-label">Priority</label>
                  <div><span class="badge ${ne.priority==="Urgent"||ne.priority==="High"?"badge-danger":"badge-neutral"}">${ne.priority||"Normal"}</span></div>
                </div>
                <div>
                  <label class="form-label">Notes</label>
                  <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${ne.notes||"No notes available"}</div>
                </div>
              </div>
            `,actions:[{label:"Close",className:"btn-secondary",onClick:Q=>Q()},{label:"Open Full Job",className:"btn-primary",onClick:Q=>{Q(),Y.navigate(`/jobs/${re}`)}}],width:450})}else{const ne=l.getById("schedule",G);if(!ne)return;const Q=ee==="leave"?"Leave Details":ee==="blockout"?"Blockout Details":"Meeting Details",K=l.getById("technicians",ne.technicianId);He({title:Q,content:`
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                  <label class="form-label">Type</label>
                  <div class="font-medium" style="font-size:16px; text-transform:uppercase">${ee}</div>
                </div>
                <div>
                  <label class="form-label">Technician</label>
                  <div>${v((K==null?void 0:K.name)||ne.technicianName||"Unknown")}</div>
                </div>
                <div>
                  <label class="form-label">Date</label>
                  <div>${ne.date||"N/A"}</div>
                </div>
                <div>
                  <label class="form-label">Duration</label>
                  <div>${ne.hours||0} Hours</div>
                </div>
                <div>
                  <label class="form-label">Notes / Description</label>
                  <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${v(ne.notes||"No details entered")}</div>
                </div>
              </div>
            `,actions:[{label:"Close",className:"btn-secondary",onClick:ae=>ae()},{label:"Remove Allocation",className:"btn-danger",onClick:ae=>{ae(),l.delete("schedule",G),O("Allocation removed successfully","success"),$()}}],width:450})}}),P.addEventListener("contextmenu",Z=>{Z.preventDefault(),S();const re=P.dataset.scheduleId,ee=P.dataset.blockType,G=ee==="schedule"||ee==="legacy";y=document.createElement("div"),y.className="dropdown-menu",y.style.position="fixed",y.style.top=`${Z.clientY}px`,y.style.left=`${Z.clientX}px`,y.style.zIndex=1e3,y.style.background="var(--card-bg)",y.style.boxShadow="var(--shadow-md)",y.style.border="1px solid var(--border-color)",y.style.borderRadius="var(--border-radius)",y.style.padding="4px 0",y.style.minWidth="140px",G?(y.innerHTML=`
            <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
            <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
          `,document.body.appendChild(y),y.querySelector("#ctx-view").addEventListener("click",()=>{S();const ne=P.dataset.blockJobId;Y.navigate(`/jobs/${ne}`)}),y.querySelector("#ctx-unschedule").addEventListener("click",()=>{S();const ne=P.dataset.blockJobId;l.getAll("schedule").find(ae=>ae.id===re)&&l.delete("schedule",re),ne&&l.update("jobs",ne,{scheduledDate:null,technicianId:null}),O("Job unscheduled","success"),$()})):(y.innerHTML=`
            <button class="dropdown-item text-danger" id="ctx-delete-allocation"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">delete</span> Delete Allocation</button>
          `,document.body.appendChild(y),y.querySelector("#ctx-delete-allocation").addEventListener("click",()=>{S(),l.delete("schedule",re),O("Allocation removed successfully","success"),$()}))})})}function q(H){const R=document.getElementById("calendar-scroll");R&&(R.addEventListener("dragover",V=>{if(!d)return;const se=R.getBoundingClientRect(),U=60,P=15;V.clientY-se.top<U?R.scrollTop-=P:se.bottom-V.clientY<U&&(R.scrollTop+=P)}),R.addEventListener("wheel",V=>{d&&(R.scrollTop+=V.deltaY)},{passive:!0})),e.querySelectorAll(".unscheduled-job").forEach(V=>{V.addEventListener("dragstart",se=>{const U=V.getBoundingClientRect();d={type:"unscheduled",jobId:V.dataset.jobId,jobNumber:V.dataset.jobNumber,customerName:V.dataset.customer,title:V.dataset.title,hours:parseInt(V.dataset.hours)||2,offsetY:se.clientY-U.top},se.dataTransfer.effectAllowed="move",V.style.opacity="0.5"}),V.addEventListener("dragend",()=>{V.style.opacity="1",d=null,document.querySelectorAll(".schedule-drag-preview").forEach(se=>se.remove())})}),e.querySelectorAll(".schedule-block[draggable]").forEach(V=>{V.addEventListener("dragstart",se=>{se.stopPropagation();const U=V.getBoundingClientRect();d={type:"existing",blockType:V.dataset.blockType,scheduleId:V.dataset.scheduleId,jobId:V.dataset.blockJobId,startHour:parseFloat(V.dataset.start),endHour:parseFloat(V.dataset.end),offsetY:se.clientY-U.top},se.dataTransfer.effectAllowed="move",V.style.opacity="0.4"}),V.addEventListener("dragend",()=>{V.style.opacity="1",d=null,document.querySelectorAll(".schedule-drag-preview").forEach(se=>se.remove())})}),e.querySelectorAll(".schedule-day-col").forEach(V=>{V.addEventListener("dragover",se=>{if(se.preventDefault(),se.dataTransfer.dropEffect="move",V.style.background="rgba(27, 109, 224, 0.05)",!d)return;const U=V.getBoundingClientRect(),P=d.offsetY||0,re=(se.clientY-P-U.top)/b,ee=Math.min(23.75,Math.max(0,I(re)));let G=V.querySelector(".schedule-drag-preview");G||(G=document.createElement("div"),G.className="schedule-drag-preview",G.style.position="absolute",G.style.left="3px",G.style.right="3px",G.style.background="rgba(27, 109, 224, 0.15)",G.style.border="2px dashed var(--color-primary)",G.style.borderRadius="4px",G.style.pointerEvents="none",G.style.zIndex="10",V.appendChild(G));const ne=d.type==="existing"?d.endHour-d.startHour:d.hours||2,Q=ee*b,K=Math.max(ne*b-2,w);G.style.top=Q+"px",G.style.height=K+"px"}),V.addEventListener("dragleave",se=>{if(!V.contains(se.relatedTarget)){V.style.background="";const U=V.querySelector(".schedule-drag-preview");U&&U.remove()}}),V.addEventListener("drop",se=>{const U=l.getAll("jobs");se.preventDefault(),V.style.background="";const P=V.querySelector(".schedule-drag-preview");if(P&&P.remove(),!d)return;const Z=V.dataset.tech,re=parseInt(V.dataset.day),ee=V.dataset.date?new Date(V.dataset.date+"T12:00:00"):H[re],G=V.getBoundingClientRect(),ne=d.offsetY||0,K=(se.clientY-ne-G.top)/b,ae=Math.min(23.75,Math.max(0,I(K))),F=a.find(B=>B.id===Z),W=U.find(B=>B.id===d.jobId);if(W){const B=d.type==="existing"?d.endHour-d.startHour:d.hours||W.estimatedHours||2,te=ae+B;if(M().some(ke=>ke.technicianId===Z&&ke.dayIdx===re&&(d.scheduleId?ke.id!==d.scheduleId:ke.jobId!==W.id)&&Math.max(ke.startHour,ae)<Math.min(ke.endHour,te))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){d=null;return}const X=ke=>ke.toString().padStart(2,"0"),oe=`${ee.getFullYear()}-${X(ee.getMonth()+1)}-${X(ee.getDate())}`,le=Math.floor(ae),ce=Math.round((ae-le)*60),Se=Math.floor(te),fe=Math.round((te-Se)*60),he=`${oe}T${X(le)}:${X(ce)}`,Te=`${oe}T${X(Se)}:${X(fe)}`;d.type==="existing"&&d.blockType==="schedule"?(l.update("schedule",d.scheduleId,{technicianId:Z,technicianName:(F==null?void 0:F.name)||"",date:oe,startTime:he,finishTime:Te,hours:B}),O(`Moved ${W.number} for ${F==null?void 0:F.name} to ${oe}`,"success")):(l.create("schedule",{jobId:W.id,jobNumber:W.number,technicianId:Z,technicianName:(F==null?void 0:F.name)||"",date:oe,startTime:he,finishTime:Te,hours:B}),l.update("jobs",W.id,{scheduledDate:oe,startHour:ae,technicianId:Z,technicianName:(F==null?void 0:F.name)||"",status:W.status==="Pending"?"Scheduled":W.status}),O(`Assigned ${W.number} to ${F==null?void 0:F.name}`,"success"))}d=null,$()})})}function A(){e.querySelectorAll(".schedule-resize-handle").forEach(H=>{H.addEventListener("mousedown",R=>{R.preventDefault(),R.stopPropagation();const V=H.closest(".schedule-block"),se=V.closest(".schedule-day-col"),U=parseFloat(H.dataset.start),P=parseFloat(H.dataset.end);se.getBoundingClientRect(),u={blockType:H.dataset.blockType,scheduleId:H.dataset.scheduleId,jobId:H.dataset.blockJobId,block:V,col:se,startHour:U,endHour:P},V.dataset.resized="false",V.style.opacity="0.85",V.style.userSelect="none",document.body.style.cursor="ns-resize";function Z(ee){if(!u)return;const G=u.col.getBoundingClientRect(),Q=(ee.clientY-G.top)/b,K=I(Q),ae=u.startHour+.25,F=Math.max(K,ae);if(F!==u.endHour){u.endHour=F,u.block.dataset.resized="true";const W=Math.max((F-u.startHour)*b-2,w);u.block.style.height=W+"px";const B=u.block.querySelector(".schedule-block-time");B&&(B.textContent=`${x(u.startHour)} — ${x(F)}`)}}function re(){var K;if(document.removeEventListener("mousemove",Z),document.removeEventListener("mouseup",re),document.body.style.cursor="",!u)return;const{jobId:ee,startHour:G,endHour:ne}=u,Q=ne-G;if(u.block.style.opacity="",u.block.style.userSelect="",Math.abs(ne-P)>=.25)if(u.blockType==="schedule"){const ae=l.getById("schedule",u.scheduleId);if(ae){const F=ae.date||((K=ae.startTime)==null?void 0:K.split("T")[0])||new Date().toISOString().split("T")[0],W=X=>X.toString().padStart(2,"0"),B=Math.floor(G),te=Math.round((G-B)*60),ue=Math.floor(ne),pe=Math.round((ne-ue)*60);l.update("schedule",u.scheduleId,{startTime:`${F}T${W(B)}:${W(te)}`,finishTime:`${F}T${W(ue)}:${W(pe)}`,hours:Q}),O(`Time updated to ${x(G)} — ${x(ne)}`,"success")}}else{const ae=l.getAll("jobs").find(F=>F.id===ee);if(ae){let F=ae.technicians||[];F.length>0&&(F=F.map(W=>({...W,hours:Q}))),l.update("jobs",ee,{startHour:G,estimatedHours:parseFloat(Q.toFixed(4)),technicians:F.length>0?F:ae.technicians}),O("Job time updated","success")}}u=null}document.addEventListener("mousemove",Z),document.addEventListener("mouseup",re)})})}function _(){Fs(e,{getWeekDays:D,viewMode:n,currentDate:c,calendarType:r,isTechnician:s,onNav:H=>{c.setDate(c.getDate()+(n==="week"?7*H:H)),$()},onToday:()=>{c=new Date,$()},onViewMode:H=>{n=H,$()},onCalType:H=>{r=H,$()}})}$()}function Rs(e){const a=[],t=e.split(/\r?\n/).filter(r=>r.trim().length>0);if(t.length===0)return a;const s=t[0],n=ya(s);for(let r=1;r<t.length;r++){const c=t[r],o=ya(c),d={};for(let u=0;u<n.length;u++){const g=n[u]?n[u].trim():`col${u}`;d[g]=o[u]!==void 0?o[u].trim():""}a.push(d)}return a}function ya(e){const a=[];let t="",s=!1;for(let n=0;n<e.length;n++){const r=e[n];r==='"'?s&&e[n+1]==='"'?(t+='"',n++):s=!s:r===","&&!s?(a.push(t),t=""):t+=r}return a.push(t),a}function gt(e){var y;const a=l.getAll("stock");e.innerHTML=`
    <div class="page-header">
      <h1>Stock / Inventory</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-transfer-stock"><span class="material-icons-outlined">swap_horiz</span> Transfer</button>
        <button class="btn btn-secondary" id="btn-import-stock"><span class="material-icons-outlined">file_upload</span> Import</button>
        <button class="btn btn-primary" id="btn-new-stock"><span class="material-icons-outlined">add</span> New Item</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-left" style="display:flex; gap:15px; align-items:center; flex-wrap:wrap">
        <div class="toolbar-filters">
          <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
          ${[...new Set(a.map(i=>i.category))].map(i=>`<button class="toolbar-filter" data-filter="${i}">${i}</button>`).join("")}
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
  `;const t=e.querySelector("#location-filter"),s=[...new Set(a.flatMap(i=>(i.locations||[]).map(p=>p.location||"Unassigned")))].sort(),n=s.filter(i=>i.toLowerCase().includes("warehouse")||i==="Main"||i==="Main Warehouse"),r=s.filter(i=>i.toLowerCase().includes("vehicle")||i.toLowerCase().includes("van")||i.toLowerCase().includes("truck")||i.toLowerCase().includes("van stock")),c=s.filter(i=>!n.includes(i)&&!r.includes(i));if(n.length>0){const i=document.createElement("optgroup");i.label="Warehouses",n.forEach(p=>{const m=new Option(p,p);i.appendChild(m)}),t.appendChild(i)}if(r.length>0){const i=document.createElement("optgroup");i.label="Vehicles / Vans",r.forEach(p=>{const m=new Option(p,p);i.appendChild(m)}),t.appendChild(i)}if(c.length>0){const i=document.createElement("optgroup");i.label="Other",c.forEach(p=>{const m=new Option(p,p);i.appendChild(m)}),t.appendChild(i)}let o={category:"all",location:"all",search:""};function d(){const i=o.search.toLowerCase(),p=a.filter(m=>{const h=o.category==="all"||m.category===o.category,b=o.location==="all"||(m.locations||[]).some(I=>I.location===o.location),w=!i||m.name.toLowerCase().includes(i)||m.sku.toLowerCase().includes(i)||m.category.toLowerCase().includes(i)||(m.locations||[]).some(I=>I.location.toLowerCase().includes(i));return h&&b&&w});g.updateData(p)}const g=Xe({columns:[{key:"name",label:"Item Name",render:i=>`<span class="cell-link font-medium">${v(i.name)}</span>`},{key:"sku",label:"SKU",render:i=>`<span class="text-secondary" style="font-family:monospace">${v(i.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:i=>`<span class="badge badge-neutral">${v(i.category)}</span>`,width:"110px"},{key:"quantity",label:"Total Qty",render:i=>{const p=(i.locations||[]).reduce((h,b)=>h+b.quantity,0),m=p<=i.reorderLevel;return`<span style="font-weight:600;color:${m?"var(--color-danger)":"var(--text-primary)"}">${p}</span>${m?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:i=>(i.locations||[]).reduce((p,m)=>p+m.quantity,0),width:"100px"},{key:"unitPrice",label:"Unit Price",render:i=>`$${i.unitPrice.toFixed(2)}`,getValue:i=>i.unitPrice,width:"100px"},{key:"locations",label:"Locations Breakdown",render:i=>!i.locations||i.locations.length===0?'<span class="text-tertiary" style="font-size: 12px;">No Stock</span>':`<div style="display:flex; flex-direction:column; gap:4px">
        ${i.locations.map(p=>`
            <div style="display:flex; align-items:center; gap:6px; font-size:12px">
              <span class="material-icons-outlined" style="font-size:14px; color:var(--text-tertiary)">${p.location.toLowerCase().includes("vehicle")||p.location.toLowerCase().includes("van")||p.location.toLowerCase().includes("truck")?"local_shipping":"warehouse"}</span>
              <span class="text-secondary" style="font-weight:500">${v(p.location)}:</span>
              <span style="font-weight:600; color:var(--text-primary)">${p.quantity}</span>
            </div>
          `).join("")}
      </div>`,width:"240px"},{key:"supplier",label:"Supplier",render:i=>`<span class="text-secondary">${v(i.supplier)}</span>`}],data:a,onRowClick:i=>Y.navigate(`/stock/${i}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:i=>{st({container:e,selectedIds:i,onClear:()=>g.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:p=>{const m=[...new Set(l.getAll("stock").map(b=>b.category))],h=document.createElement("div");h.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${m.map(b=>`<option value="${v(b)}">${v(b)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,h.querySelector("#bulk-category").addEventListener("change",b=>{h.querySelector("#new-cat-field").style.display=b.target.value==="NEW"?"block":"none"}),$e({title:`Update ${p.length} Items`,content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{let w=h.querySelector("#bulk-category").value;w==="NEW"&&(w=h.querySelector("#bulk-new-category").value.trim()),w&&(p.forEach(I=>l.update("stock",I,{category:w})),g.clearSelection(),gt(e),O(`Updated ${p.length} items to category: ${w}`,"success"),b())}}]})}},{label:"Adjust Price",icon:"payments",onClick:p=>{const m=document.createElement("div");m.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,$e({title:`Adjust Price for ${p.length} Items`,content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:"Apply",className:"btn-primary",onClick:h=>{const b=parseFloat(m.querySelector("#bulk-price-adjust").value);if(isNaN(b))return;const w=1+b/100;p.forEach(I=>{const x=l.getById("stock",I);x&&l.update("stock",I,{unitPrice:x.unitPrice*w})}),g.clearSelection(),gt(e),O(`Adjusted prices for ${p.length} items by ${b}%`,"success"),h()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:p=>{$e({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${p.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{p.forEach(h=>l.delete("stock",h)),g.clearSelection(),gt(e),O(`Deleted ${p.length} stock items`,"success"),m()}}]})}}]})}});e.querySelector("#stock-table-container").appendChild(g),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(p=>p.classList.remove("active")),i.classList.add("active"),o.category=i.dataset.filter,d()})}),e.querySelector("#location-filter").addEventListener("change",i=>{o.location=i.target.value,d()}),e.querySelector("#stock-search").addEventListener("input",i=>{o.search=i.target.value,d()}),e.querySelector("#btn-new-stock").addEventListener("click",()=>{const i=l.getAll("technicians"),p=document.createElement("div");p.innerHTML=`
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
              ${i.map(m=>`<option value="Vehicle - ${v(m.name)}">Vehicle - ${v(m.name)}</option>`).join("")}
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
    `,He({title:"New Stock Item",content:p.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Create",className:"btn-primary",onClick:m=>{const h=document.querySelector(".drawer-overlay"),b=h.querySelector("#new-stock-name").value.trim(),w=h.querySelector("#new-stock-category").value.trim()||"Uncategorized",I=h.querySelector("#new-stock-location").value,x=parseFloat(h.querySelector("#new-stock-cost").value),E=parseInt(h.querySelector("#new-stock-qty").value)||0;if(!b||isNaN(x)){O("Please fill all required fields correctly","error");return}l.create("stock",{name:b,sku:"SKU-"+Date.now().toString().slice(-6),category:w,quantity:E,unitPrice:x*1.5,costPrice:x,location:I,locations:[{location:I,quantity:E}],supplier:"Unknown"}),O("Stock item created","success"),gt(e),m()}}]})}),(y=e.querySelector("#btn-transfer-stock"))==null||y.addEventListener("click",()=>{var b;const i=l.getAll("stock"),p=l.getAll("technicians");if(i.length===0){O("No stock items available to transfer","error");return}const m=document.createElement("div");m.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${i.map(w=>`<option value="${v(w.id)}">${v(w.name)} (${v(w.sku)})</option>`).join("")}
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
                ${p.map(w=>`<option value="Vehicle - ${v(w.name)}">Vehicle - ${v(w.name)}</option>`).join("")}
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
    `,He({title:"Transfer Stock",content:m.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:w=>w()},{label:"Transfer",className:"btn-primary",onClick:w=>{var $;const I=document.querySelector(".drawer-overlay"),x=I.querySelector("#transfer-item").value,E=I.querySelector("#transfer-from").value,k=I.querySelector("#transfer-to").value,S=parseInt(I.querySelector("#transfer-qty").value)||0;if(!x||!E||!k||S<=0){O("Please fill all fields correctly","error");return}if(E===k){O("Cannot transfer to the same location","error");return}const D=l.getById("stock",x);if(!D)return;const M=(D.locations||[]).find(f=>f.location===E);if(!M||M.quantity<S){O("Insufficient quantity at source location","error");return}M.quantity-=S,D.locations||(D.locations=[]);let N=D.locations.find(f=>f.location===k);N?N.quantity+=S:D.locations.push({location:k,quantity:S}),D.locations=D.locations.filter(f=>f.quantity>0),D.quantity=D.locations.reduce((f,T)=>f+T.quantity,0),D.location=(($=D.locations[0])==null?void 0:$.location)||"Main Warehouse",l.update("stock",D.id,D),O(`Successfully transferred ${S}x ${D.name} to ${k}`,"success"),gt(e),w()}}]}),(b=e.querySelector("#btn-import-stock"))==null||b.addEventListener("click",()=>h(e));function h(w){const I=document.createElement("div");I.innerHTML=`
        <div class="form-group">
          <label class="form-label">Select CSV File *</label>
          <input type="file" accept=".csv,text/csv" id="csv-file-input" class="form-input" />
        </div>
      `,$e({title:"Import Stock from CSV",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Next",className:"btn-primary",onClick:x=>{const E=document.getElementById("csv-file-input");if(!E.files.length){O("Please select a CSV file","error");return}const k=E.files[0],S=new FileReader;S.onload=D=>{const M=D.target.result,N=Rs(M);if(N.length===0){O("CSV file appears empty","error");return}const $=Object.keys(N[0]),f=[{key:"name",label:"Item Name"},{key:"sku",label:"SKU"},{key:"category",label:"Category"},{key:"unitPrice",label:"Unit Price"},{key:"quantity",label:"Qty"},{key:"location",label:"Location"},{key:"supplier",label:"Supplier"}],T=document.createElement("div");T.innerHTML=f.map(C=>`
                  <div class="form-group">
                    <label class="form-label">${C.label}</label>
                    <select class="form-select" id="map-${C.key}">
                      <option value="">-- ignore --</option>
                      ${$.map(z=>`<option value="${z}">${z}</option>`).join("")}
                    </select>
                  </div>
                `).join(""),$e({title:"Map CSV Columns",content:T,actions:[{label:"Back",className:"btn-secondary",onClick:C=>C()},{label:"Import",className:"btn-primary",onClick:C=>{const z={};f.forEach(j=>{const q=document.getElementById("map-"+j.key);q&&q.value&&(z[j.key]=q.value)});const J=N.slice(0,5).map(j=>{const q={};return Object.entries(z).forEach(([A,_])=>{q[A]=j[_]}),q}),L=document.createElement("div");L.innerHTML="<pre>"+JSON.stringify(J,null,2)+"</pre>",$e({title:"Preview Import (first 5 rows)",content:L,actions:[{label:"Back",className:"btn-secondary",onClick:j=>j()},{label:"Execute",className:"btn-primary",onClick:j=>{N.forEach(q=>{const A={};A.name=(q[z.name]||"").trim()||"Untitled",A.sku=(q[z.sku]||"").trim()||"SKU-"+Date.now().toString().slice(-6),A.category=(q[z.category]||"").trim()||"Uncategorized";const _=parseFloat(q[z.unitPrice]);A.unitPrice=isNaN(_)?0:_;const H=parseInt(q[z.quantity]),R=isNaN(H)?0:H,V=(q[z.location]||"").trim()||"Main Warehouse";A.locations=[{location:V,quantity:R}],A.quantity=R,A.location=V,A.supplier=(q[z.supplier]||"").trim()||"Unknown",A.costPrice=A.unitPrice/1.5,l.create("stock",A)}),O(`Imported ${N.length} stock items`,"success"),gt(w),j()}}]}),C()}}]}),x()},S.readAsText(k)}}]})}setTimeout(()=>{const w=document.querySelector(".drawer-overlay");if(!w)return;const I=w.querySelector("#transfer-item"),x=w.querySelector("#transfer-from"),E=w.querySelector("#transfer-qty"),k=w.querySelector("#transfer-available-info");I.addEventListener("change",()=>{const D=I.value;if(!D){x.innerHTML='<option value="">Select an item first...</option>',x.disabled=!0,E.disabled=!0,k.style.display="none";return}const M=i.find($=>$.id===D);if(!M||!M.locations||M.locations.length===0){x.innerHTML='<option value="">No locations available</option>',x.disabled=!0,E.disabled=!0,k.style.display="none";return}const N=M.locations.filter($=>$.quantity>0);if(N.length===0){x.innerHTML='<option value="">Out of stock everywhere</option>',x.disabled=!0,E.disabled=!0,k.style.display="none";return}x.innerHTML=N.map($=>`
          <option value="${v($.location)}" data-max="${$.quantity}">${v($.location)} (Available: ${$.quantity})</option>
        `).join(""),x.disabled=!1,E.disabled=!1,S()}),x.addEventListener("change",S);function S(){const D=x.options[x.selectedIndex];if(!D)return;const M=parseInt(D.dataset.max)||0;E.max=M,E.value=Math.min(E.value||1,M),k.textContent=`Max available: ${M}`,k.style.display="block"}},100)})}function Os(e,{id:a}){const t=l.getById("stock",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}ct(t.name);const s=(t.locations||[]).reduce((o,d)=>o+d.quantity,0),n=s<=t.reorderLevel,r=t.unitPrice>0?((t.unitPrice-t.costPrice)/t.unitPrice*100).toFixed(1):0,c=(t.locations||[]).map(o=>`
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-color)">
        <div style="display:flex; align-items:center; gap:8px">
          <span class="material-icons-outlined" style="font-size:20px; color:var(--text-tertiary)">${o.location.toLowerCase().includes("vehicle")||o.location.toLowerCase().includes("van")||o.location.toLowerCase().includes("truck")?"local_shipping":"warehouse"}</span>
          <span class="text-secondary" style="font-weight:500">${v(o.location)}</span>
        </div>
        <span style="font-weight:600; font-size:14px; color:var(--text-primary)">${o.quantity} ${v(t.unit||"each")}s</span>
      </div>
    `).join("")||'<div class="text-tertiary" style="padding:12px 0">No stock in any location</div>';e.innerHTML=`
    ${mt({title:t.name,icon:"inventory_2",iconBgColor:n?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:n?"var(--color-danger)":"var(--color-success)",metaHtml:`
        <span style="font-family:monospace">${t.sku}</span>
        <span class="badge badge-neutral">${t.category}</span>
        ${n?'<span class="badge badge-danger">LOW STOCK</span>':'<span class="badge badge-success">IN STOCK</span>'}
      `,actionsHtml:`
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `})}

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Consolidated Stock</div>
        <div class="stat-value" style="color:${n?"var(--color-danger)":"var(--text-primary)"}">${s}</div>
        <div class="text-sm text-secondary">Reorder at ${t.reorderLevel} ${t.unit}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unit Price</div>
        <div class="stat-value">$${t.unitPrice.toFixed(2)}</div>
        <div class="text-sm text-secondary">Cost: $${t.costPrice.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profit Margin</div>
        <div class="stat-value">${r}%</div>
        <div class="text-sm text-secondary">Stock Value (Cost): $${(s*t.costPrice).toFixed(2)}</div>
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
              ${it("Name",t.name)}
              ${it("SKU",t.sku)}
              ${it("Category",t.category)}
              ${it("Unit",t.unit)}
              ${it("Supplier",t.supplier)}
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="height: fit-content;">
        <div class="card-header"><h4>Pricing & Value</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${it("Cost Price",`$${t.costPrice.toFixed(2)}`)}
            ${it("Sell Price",`$${t.unitPrice.toFixed(2)}`)}
            ${it("Margin",`${r}%`)}
            ${it("Consolidated Value (Sell)",`$${(s*t.unitPrice).toFixed(2)}`)}
            ${it("Consolidated Value (Cost)",`$${(s*t.costPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit-stock").addEventListener("click",()=>Y.navigate(`/stock/${a}/edit`)),e.querySelector("#btn-delete-stock").addEventListener("click",()=>{const o=document.createElement("div");o.innerHTML=`<p>Delete <strong>${v(t.name)}</strong>?</p>`,$e({title:"Delete Stock Item",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{l.delete("stock",a),O("Item deleted","success"),d(),Y.navigate("/stock")}}]})})}function it(e,a){return`<div style="display:flex;gap:8px"><span style="width:180px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span style="font-weight:600">${a}</span></div>`}function za(e,{id:a}){const t=a&&a!=="new",s=t?l.getById("stock",a):{},n=l.getAll("technicians"),r=l.getAll("assets"),c=l.getAll("suppliers").filter(i=>i.active!==!1);function o(i=""){let p='<option value="">Select location...</option>';return p+=`<option value="Main Warehouse" ${i==="Main Warehouse"?"selected":""}>Main Warehouse</option>`,p+='<optgroup label="Warehouses">',["Warehouse A","Warehouse B"].forEach(m=>{p+=`<option value="${m}" ${i===m?"selected":""}>${m}</option>`}),p+="</optgroup>",p+='<optgroup label="Vehicles">',n.forEach(m=>{const h=`Vehicle - ${m.name}`;p+=`<option value="${h}" ${i===h?"selected":""}>${h}</option>`}),p+="</optgroup>",p+='<optgroup label="Assets">',r.forEach(m=>{p+=`<option value="${m.name}" ${i===m.name?"selected":""}>${m.name}</option>`}),p+="</optgroup>",p+=`<option value="On Order" ${i==="On Order"?"selected":""}>On Order</option>`,p}function d(i="",p=0){return`
      <div class="location-row" style="display:flex; gap:12px; align-items:center; margin-bottom:10px">
        <div style="flex:1">
          <select class="form-select loc-select" required style="width:100%">
            ${o(i)}
          </select>
        </div>
        <div style="width:120px">
          <input type="number" class="form-input loc-qty" min="0" value="${p}" required style="width:100%" />
        </div>
        <div>
          <button type="button" class="btn btn-icon btn-danger btn-remove-loc" style="padding:6px"><span class="material-icons-outlined">delete</span></button>
        </div>
      </div>
    `}let u="";t&&s.locations&&s.locations.length>0?u=s.locations.map(i=>d(i.location,i.quantity)).join(""):u=d(s.location||"Warehouse A",s.quantity||0),e.innerHTML=`
    <div class="page-header"><h1>${t?"Edit Stock Item":"New Stock Item"}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="stock-form">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input class="form-input" name="name" value="${s.name||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">SKU</label>
              <input class="form-input" name="sku" value="${s.sku||""}" placeholder="e.g. SKU-1000" />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="category">
                ${["Electrical","Plumbing","HVAC","Fire Safety","Security","General"].map(i=>`<option ${s.category===i?"selected":""}>${i}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Unit</label>
              <input class="form-input" name="unit" value="${s.unit||"each"}" />
            </div>
            <div class="form-group">
              <label class="form-label">Reorder Level</label>
              <input class="form-input" type="number" name="reorderLevel" value="${s.reorderLevel||"10"}" min="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cost Price ($) *</label>
              <input class="form-input" type="number" name="costPrice" value="${s.costPrice||""}" step="0.01" required min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Sell Price ($) *</label>
              <input class="form-input" type="number" name="unitPrice" value="${s.unitPrice||""}" step="0.01" required min="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Supplier</label>
            <select class="form-input" name="supplier">
              <option value="">Select a supplier...</option>
              ${c.map(i=>`<option value="${v(i.name)}" ${s.supplier===i.name?"selected":""}>${v(i.name)}</option>`).join("")}
              ${s.supplier&&!c.some(i=>i.name===s.supplier)?`<option value="${v(s.supplier)}" selected>${v(s.supplier)} (Inactive / Custom)</option>`:""}
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
              ${u}
            </div>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Item</button>
      </div>
    </div>
  `;const g=e.querySelector("#locations-editor-container");e.querySelector("#btn-add-loc-row").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=d();const p=i.firstElementChild;g.appendChild(p),y(p)});function y(i){i.querySelector(".btn-remove-loc").addEventListener("click",()=>{g.querySelectorAll(".location-row").length>1?i.remove():O("At least one stock location is required","error")})}g.querySelectorAll(".location-row").forEach(y),e.querySelector("#btn-cancel").addEventListener("click",()=>Y.navigate(t?`/stock/${a}`:"/stock")),e.querySelector("#btn-save").addEventListener("click",()=>{var w;const i=e.querySelector("#stock-form");if(!i.checkValidity()){i.reportValidity();return}const m=Array.from(g.querySelectorAll(".location-row")).map(I=>{const x=I.querySelector(".loc-select").value,E=parseInt(I.querySelector(".loc-qty").value)||0;return{location:x,quantity:E}}).filter(I=>I.location!=="");if(m.length===0){O("Please select at least one valid stock location","error");return}const h=m.map(I=>I.location);if(new Set(h).size!==h.length){O("Duplicate locations detected. Please merge them into a single row.","error");return}const b=Object.fromEntries(new FormData(i));if(b.costPrice=parseFloat(b.costPrice)||0,b.unitPrice=parseFloat(b.unitPrice)||0,b.reorderLevel=parseInt(b.reorderLevel)||10,b.locations=m,b.quantity=m.reduce((I,x)=>I+x.quantity,0),b.location=((w=m[0])==null?void 0:w.location)||"Main Warehouse",t)l.update("stock",a,b),O("Item updated successfully","success"),ha(b),Y.navigate(`/stock/${a}`);else{b.sku=b.sku||`SKU-${Date.now().toString().slice(-4)}`;const I=l.create("stock",b);O("Item created successfully","success"),ha(b),Y.navigate(`/stock/${I.id}`)}})}function ha(e){if(e.quantity<=e.reorderLevel){const a=JSON.parse(localStorage.getItem("currentUser")||"{}");let t=!1;if(a.role==="admin")t=!0;else if(a.userTypeId){const s=l.getById("userTypes",a.userTypeId);if(s&&s.permissions){const n=s.permissions.find(r=>r.module==="Stock");n&&(t=n.edit||n.create)}}t&&(me(async()=>{const{showToast:s}=await Promise.resolve().then(()=>qe);return{showToast:s}},void 0).then(({showToast:s})=>{s(`Auto-Reorder Alert: ${e.name} is at or below its reorder level (${e.quantity} left).`,"warning")}),l.create("notifications",{title:"Stock Auto-Reorder",message:`${e.name} (SKU: ${e.sku}) has reached its reorder level. Current quantity: ${e.quantity}. Please reorder from ${e.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function _t(e){const a=l.getAll("invoices");e.innerHTML=`
    <div class="page-header">
      <h1>Invoices</h1>
      <div class="page-header-actions">
        <button class="btn btn-outline" id="btn-export-accounting" style="display:none;"><span class="material-icons-outlined">download</span> Export to Accounting</button>
        <button class="btn btn-primary" id="btn-new-invoice"><span class="material-icons-outlined">add</span> New Invoice</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
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
  `;let t=[...a];const s={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},r=Xe({columns:[{key:"number",label:"Invoice #",render:d=>`<span class="cell-link font-medium">${v(d.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:d=>d.jobNumber?`<span class="text-secondary">${v(d.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:d=>`<span class="badge ${s[d.status]||"badge-neutral"}">${v(d.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:d=>`<span class="font-semibold">$${(d.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:d=>d.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:d=>d.issueDate?new Date(d.issueDate).toLocaleDateString():"—",getValue:d=>d.issueDate?new Date(d.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:d=>d.dueDate?new Date(d.dueDate).toLocaleDateString():"—",getValue:d=>d.dueDate?new Date(d.dueDate).getTime():0,width:"100px"}],data:t,onRowClick:d=>Y.navigate(`/invoices/${d}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:d=>{st({container:e,selectedIds:d,onClear:()=>r.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:u=>{u.forEach(g=>l.update("invoices",g,{status:"Paid",datePaid:new Date().toISOString()})),r.clearSelection(),_t(e),me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>qe);return{showToast:g}},void 0).then(({showToast:g})=>g(`Marked ${u.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:u=>{const g=document.createElement("div");g.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:y}=await Promise.resolve().then(()=>Re);return{showModal:y}},void 0).then(({showModal:y})=>{y({title:`Update ${u.length} Invoices`,content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const p=g.querySelector("#bulk-status").value;u.forEach(m=>l.update("invoices",m,{status:p})),r.clearSelection(),_t(e),me(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Updated ${u.length} invoices to ${p}`,"success")),i()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:u=>{me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>qe);return{showToast:g}},void 0).then(({showToast:g})=>g(`Sending reminders for ${u.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:u=>{me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Re);return{showModal:g}},void 0).then(({showModal:g})=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete ${u.length} invoices? This action cannot be undone.</p>`,g({title:"Confirm Bulk Delete",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{u.forEach(p=>l.delete("invoices",p)),r.clearSelection(),_t(e),me(async()=>{const{showToast:p}=await Promise.resolve().then(()=>qe);return{showToast:p}},void 0).then(({showToast:p})=>p(`Deleted ${u.length} invoices`,"success")),i()}}]})})}}]})}});e.querySelector("#invoices-table-container").appendChild(r),e.querySelector("#btn-new-invoice").addEventListener("click",()=>Y.navigate("/invoices/new"));const c=e.querySelector("#btn-export-accounting");function o(d){d.some(u=>u.status==="Paid")?c.style.display="inline-flex":c.style.display="none"}o(t),e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(g=>g.classList.remove("active")),d.classList.add("active");const u=d.dataset.filter;t=u==="all"?[...a]:a.filter(g=>g.status===u),r.updateData(t),o(t)})}),c.addEventListener("click",()=>{const d=t.filter(i=>i.status==="Paid");if(d.length===0)return;let u="data:text/csv;charset=utf-8,";u+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,d.forEach(i=>{const p=[i.number,`"${i.customerName.replace(/"/g,'""')}"`,i.email||"",i.issueDate?i.issueDate.split("T")[0]:"",i.dueDate?i.dueDate.split("T")[0]:"",(i.total||0).toFixed(2),(i.tax||0).toFixed(2),"200"].join(",");u+=p+`
`});const g=encodeURI(u),y=document.createElement("a");y.setAttribute("href",g),y.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(y),y.click(),document.body.removeChild(y),me(async()=>{const{showToast:i}=await Promise.resolve().then(()=>qe);return{showToast:i}},void 0).then(({showToast:i})=>{i(`Exported ${d.length} paid invoices`,"success")})}),e.querySelector("#invoices-search").addEventListener("input",d=>{const u=d.target.value.toLowerCase();t=a.filter(g=>g.number.toLowerCase().includes(u)||g.customerName.toLowerCase().includes(u)||(g.jobNumber||"").toLowerCase().includes(u)),r.updateData(t),o(t)})}function _a(e,{id:a}){const t=a==="new";let s=t?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",sections:[{id:l.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:l.getById("invoices",a);if(!s){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}s.lineItems&&!s.sections&&(s.sections=[{id:l.generateId(),name:"Main Phase",lineItems:[...s.lineItems]}],delete s.lineItems),t||ct(s.number);const n=l.getAll("customers"),r=l.getAll("stock"),c=l.getSettings(),o={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function d(){e.innerHTML=`
      ${mt({title:`
          ${t?"New Invoice":s.number}
          ${s.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':s.invoiceType&&s.invoiceType!=="Standard"?`<span class="badge badge-primary">${s.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${s.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${s.customerName}</span>`:""}
          ${s.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${s.jobNumber}</span>`:""}
          <span class="badge ${o[s.status]||"badge-neutral"}">${s.status}</span>
        `,actionsHtml:`
          ${t?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!t&&s.status==="Draft"?'<button class="btn btn-primary" id="btn-send-invoice"><span class="material-icons-outlined">send</span> Send</button>':""}
          ${!t&&(s.status==="Sent"||s.status==="Overdue")?'<button class="btn btn-secondary" id="btn-send-reminder"><span class="material-icons-outlined">notifications</span> Reminder</button>':""}
          ${!t&&(s.status==="Sent"||s.status==="Overdue")?'<button class="btn btn-primary" id="btn-mark-paid"><span class="material-icons-outlined">check_circle</span> Mark Paid</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                <a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import from Quote</a>
                ${t?"":'<a href="#" class="dropdown-item" id="btn-delete-invoice" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Invoice</a>'}
             </div>
          </div>
        `})}

      <!-- Linked Quote alert header if present -->
      ${s.originalQuoteNumber?`
        <div class="card" style="margin-bottom:var(--space-lg); border-left: 4px solid var(--color-primary); background: var(--color-primary-light); padding: 16px var(--space-lg); display:flex; justify-content:space-between; align-items:center; box-shadow:var(--shadow-sm); border-radius:8px">
          <div style="display:flex; align-items:center; gap:10px">
            <span class="material-icons-outlined" style="color:var(--color-primary); font-size:24px">request_quote</span>
            <div>
              <div style="font-weight:700; color:var(--color-primary-dark); font-size:14px">Linked Quote: <a href="#/quotes/${s.originalQuoteId}" style="text-decoration:underline; font-weight:800; color:inherit">${v(s.originalQuoteNumber)}</a></div>
              <div style="color:var(--text-secondary); font-size:12px; margin-top:2px">Original Quote Subtotal: <strong>$${(s.originalSubtotal||0).toFixed(2)}</strong></div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-unlink-quote" style="color:var(--color-danger); border-color:rgba(239,68,68,0.2); background:rgba(239,68,68,0.02)">
            <span class="material-icons-outlined" style="font-size:16px; vertical-align:middle; margin-right:4px">link_off</span> Unlink Quote
          </button>
        </div>
      `:""}

      <!-- Invoice Form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Invoice Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="inv-customer">
                <option value="">Select customer...</option>
                ${n.map(p=>`<option value="${p.id}" ${s.customerId===p.id?"selected":""}>${p.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${c.laborRates.map(p=>`<option value="${p.id}" ${s.laborProfileId===p.id?"selected":""}>${p.name} ($${p.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(p=>`<option ${s.invoiceType===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input class="form-input" type="date" id="inv-issue" value="${s.issueDate?s.issueDate.split("T")[0]:""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" id="inv-due" value="${s.dueDate?s.dueDate.split("T")[0]:""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inv-status">
                ${["Draft","Sent","Paid","Overdue","Void"].map(p=>`<option ${s.status===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${r.map(p=>`<option value="${p.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(s.sections||[]).map((p,m)=>u(p,m)).join("")}
      </div>

      <div style="display:flex; gap:12px; margin-bottom:var(--space-lg)">
        <button class="btn btn-secondary" id="btn-add-section">
          <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
        </button>
        <button class="btn btn-secondary" id="btn-add-variation" style="border-color:var(--color-warning); color:var(--color-warning-dark); background:rgba(245,158,11,0.02)">
          <span class="material-icons-outlined" style="font-size:16px">history_edu</span> Add Variation Phase
        </button>
      </div>

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
              <span>$${(s.totalInternalCost||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px; font-weight:600; color:${s.subtotal-(s.totalInternalCost||0)>=0?"var(--color-success)":"var(--color-danger)"}">
              <span>Invoice Margin</span>
              <span>$${(s.subtotal-(s.totalInternalCost||0)).toFixed(2)} (${s.subtotal>0?Math.round((s.subtotal-s.totalInternalCost)/s.subtotal*100):0}%)</span>
            </div>
          </div>
        </div>

        <!-- Invoice Totals -->
        <div class="card" style="width:380px">
          <div class="card-body" style="display:flex; flex-direction:column; gap:8px">
            <div style="display:flex;justify-content:space-between;font-size:var(--font-size-md)">
              <span class="text-secondary">Original Quoted Amount</span>
              <span>$${(s.originalSubtotal||0).toFixed(2)}</span>
            </div>
            ${(s.approvedVariationsSum||0)>0?`
              <div style="display:flex;justify-content:space-between;font-size:var(--font-size-md); color:var(--color-success); font-weight:600">
                <span>Approved Variations</span>
                <span>+$${(s.approvedVariationsSum||0).toFixed(2)}</span>
              </div>
            `:""}
            <div style="display:flex;justify-content:space-between;padding-top:4px;border-top:1px dashed var(--border-color);font-size:var(--font-size-md);font-weight:700; color:var(--text-primary)">
              <span>Invoice Subtotal</span>
              <span id="inv-subtotal">$${(s.subtotal||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:var(--font-size-md)">
              <span class="text-secondary">GST (10%)</span>
              <span id="inv-tax">$${(s.tax||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
              <span>Total Payable</span>
              <span id="inv-total">$${(s.total||0).toFixed(2)}</span>
            </div>
            ${(s.pendingVariationsSum||0)>0?`
              <div style="display:flex;justify-content:space-between;padding:8px 12px;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.15);border-radius:4px;font-size:12px;color:var(--color-warning-dark);margin-top:4px">
                <span style="font-weight:700">Pending Variations (Excluded)</span>
                <span style="font-weight:800">$${(s.pendingVariationsSum||0).toFixed(2)}</span>
              </div>
            `:""}
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-inv">Cancel</button>
        <button class="btn btn-primary" id="btn-save-inv"><span class="material-icons-outlined">save</span> Save Invoice</button>
      </div>
    `,i()}function u(p,m){const h=p.isVariation===!0,b=h?"border: 2px dashed var(--color-warning); background: rgba(245,158,11,0.01)":"",w=h?"background: rgba(245,158,11,0.04)":"",I=h?p.customerApproved?'<span class="badge badge-success" style="margin-right:8px"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;margin-right:2px">check_circle</span> Approved Variation</span>':'<span class="badge badge-warning" style="margin-right:8px; border-color:var(--color-warning); color:var(--color-warning-dark)"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;margin-right:2px">schedule</span> Awaiting Customer Approval</span>':"",x=h?`<label style="display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; cursor:pointer; margin-right:16px; background:#fff; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; margin-bottom:0">
           <input type="checkbox" class="variation-approved-checkbox" data-sidx="${m}" ${p.customerApproved?"checked":""} style="width:16px; height:16px; margin:0" /> Customer Agreed
         </label>`:"";return`
      <div class="card" style="margin-bottom:var(--space-lg); ${b}" data-section-index="${m}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; ${w}">
          <div style="display:flex; align-items:center; gap:12px; flex:1">
            ${h?'<span class="material-icons-outlined" style="color:var(--color-warning); font-size:20px">history_edu</span>':""}
            <input class="form-input section-name-input" value="${p.name||""}" placeholder="${h?"e.g. Variation - Additional Cabling":"Phase/Section Name"}" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" />
            ${I}
          </div>
          <div style="display:flex; align-items:center; gap:8px">
            ${x}
            <span class="badge badge-neutral" style="margin-right:12px">Subtotal: $${(p.subtotal||0).toFixed(2)}</span>
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
              ${(p.lineItems||[]).map((E,k)=>g(E,m,k)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function g(p,m,h){return`
      <tr data-sidx="${m}" data-index="${h}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${p.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${p.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${p.type==="material"?"selected":""}>Material</option>
          <option value="other" ${p.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${p.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${p.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(p.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${m}" data-index="${h}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function y(){let p=0,m=0,h=0;s.totalInternalCost=0,l.getSettings(),(s.sections||[]).forEach(w=>{w.subtotal=0,(w.lineItems||[]).forEach(I=>{I.total=(I.qty||0)*(I.rate||0),I.internalCost||(I.type==="labor"?I.internalCost=45:I.internalCost=I.rate*.7),w.subtotal+=I.total}),w.isVariation===!0?w.customerApproved===!0?(m+=w.subtotal,(w.lineItems||[]).forEach(I=>{s.totalInternalCost+=(I.qty||0)*(I.internalCost||0)})):h+=w.subtotal:(p+=w.subtotal,(w.lineItems||[]).forEach(I=>{s.totalInternalCost+=(I.qty||0)*(I.internalCost||0)}))}),(s.originalSubtotal===void 0||s.originalSubtotal===0)&&(s.originalSubtotal=p);let b=p+m;s.invoiceType==="CreditNote"?s.subtotal=-Math.abs(b):s.subtotal=Math.abs(b),s.tax=s.subtotal*.1,s.total=s.subtotal+s.tax,s.approvedVariationsSum=m,s.pendingVariationsSum=h,d()}function i(){var m,h,b,w,I,x,E,k,S,D,M;(m=e.querySelector("#btn-preview-pdf"))==null||m.addEventListener("click",()=>{oa({type:"invoice",data:s})});const p=e.querySelector(".dropdown > .btn");p&&(p.addEventListener("click",N=>{N.stopPropagation();const $=p.nextElementSibling;$.style.display=$.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const N=e.querySelector(".dropdown-menu");N&&(N.style.display="none")})),(h=e.querySelector("#inv-labor-profile"))==null||h.addEventListener("change",N=>{s.laborProfileId=N.target.value;const $=c.laborRates.find(f=>f.id===s.laborProfileId);$&&(s.sections.forEach(f=>{f.lineItems.forEach(T=>{T.type==="labor"&&(T.rate=$.rate)})}),y())}),(b=e.querySelector("#btn-add-section"))==null||b.addEventListener("click",()=>{s.sections.push({id:l.generateId(),name:"New Phase",isVariation:!1,lineItems:[]}),y()}),(w=e.querySelector("#btn-add-variation"))==null||w.addEventListener("click",()=>{s.sections.push({id:l.generateId(),name:"Variation Phase",isVariation:!0,customerApproved:!1,lineItems:[]}),y()}),(I=e.querySelector("#btn-unlink-quote"))==null||I.addEventListener("click",()=>{s.originalQuoteId="",s.originalQuoteNumber="",s.originalSubtotal=0,y(),O("Invoice unlinked from quote","info")}),e.querySelectorAll(".section-name-input").forEach((N,$)=>{N.addEventListener("change",()=>{s.sections[$].name=N.value})}),e.querySelectorAll(".btn-add-line").forEach(N=>{N.addEventListener("click",()=>{const $=parseInt(N.dataset.sidx);s.sections[$].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),d()})}),e.querySelectorAll(".btn-remove-section").forEach(N=>{N.addEventListener("click",()=>{const $=parseInt(N.dataset.sidx);confirm("Remove this entire phase?")&&(s.sections.splice($,1),y())})}),e.querySelectorAll(".variation-approved-checkbox").forEach(N=>{N.addEventListener("change",()=>{const $=parseInt(N.dataset.sidx);s.sections[$].customerApproved=N.checked,y()})}),e.querySelectorAll(".item-input").forEach(N=>{N.addEventListener("change",()=>{const $=N.closest("tr"),f=parseInt($.dataset.sidx),T=parseInt($.dataset.index),C=N.dataset.field;let z=N.value;if((C==="qty"||C==="rate")&&(z=parseFloat(z)||0),s.sections[f].lineItems[T][C]=z,C==="description"){const J=r.find(L=>L.name===z);if(J){const L=(J.category||"").toLowerCase().includes("labor");let j=0,q=0;if(L)j=J.unitPrice||85,q=J.costPrice||45;else{const A=J.costPrice||J.unitPrice||0;q=A,j=Qt(A,c)}s.sections[f].lineItems[T].type=L?"labor":"material",s.sections[f].lineItems[T].rate=j,s.sections[f].lineItems[T].internalCost=q}}y()})}),e.querySelectorAll(".btn-remove-line").forEach(N=>{N.addEventListener("click",()=>{const $=parseInt(N.dataset.sidx),f=parseInt(N.dataset.index);s.sections[$].lineItems.splice(f,1),y()})}),(x=e.querySelector("#btn-import-template"))==null||x.addEventListener("click",N=>{N.preventDefault();const $=e.querySelector("#inv-customer").value;if(!$){O("Please select a customer first","error");return}const f=l.getAll("quotes").filter(C=>C.customerId===$);if(!f.length){O("No quotes found for this customer","error");return}const T=document.createElement("div");T.style.minWidth="400px",T.innerHTML=`
        <div style="font-size:14px; color:var(--text-secondary); margin-bottom:12px">
          Select a quote to import items as the original invoice content:
        </div>
        <div style="display:flex; flex-direction:column; gap:10px">
          ${f.map(C=>`
            <div class="card import-quote-item" data-id="${C.id}" style="cursor:pointer; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${v(C.number)} — ${v(C.title||"Untitled")}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">Subtotal: $${(C.subtotal||0).toFixed(2)} | Date: ${new Date(C.createdAt).toLocaleDateString()}</div>
                </div>
                <span class="badge ${C.status==="Accepted"?"badge-success":"badge-neutral"}">${v(C.status)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `,$e({title:"Import from Quote",content:T,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()}]}),T.querySelectorAll(".import-quote-item").forEach(C=>{C.addEventListener("click",()=>{var L;const z=C.dataset.id,J=f.find(j=>j.id===z);J&&(s.originalQuoteId=J.id,s.originalQuoteNumber=J.number,s.originalSubtotal=J.subtotal,J.sections&&J.sections.length>0?s.sections=JSON.parse(JSON.stringify(J.sections)).map(j=>({...j,isVariation:!1,customerApproved:void 0})):J.lineItems&&(s.sections=[{id:l.generateId(),name:"Main Phase",isVariation:!1,lineItems:JSON.parse(JSON.stringify(J.lineItems))}]),y(),O(`Imported ${J.number} successfully!`,"success"),(L=document.querySelector(".modal-overlay"))==null||L.remove())})})}),(E=e.querySelector("#btn-save-inv"))==null||E.addEventListener("click",()=>{const N=e.querySelector("#inv-customer").value,$=n.find(J=>J.id===N);s.customerId=N,s.customerName=($==null?void 0:$.company)||"",s.status=e.querySelector("#inv-status").value,s.issueDate=e.querySelector("#inv-issue").value,s.dueDate=e.querySelector("#inv-due").value,s.invoiceType=e.querySelector("#inv-type").value;let f=0,T=0,C=0;(s.sections||[]).forEach(J=>{let L=(J.lineItems||[]).reduce((j,q)=>j+(q.qty||0)*(q.rate||0),0);J.subtotal=L,J.isVariation===!0?J.customerApproved===!0?T+=L:C+=L:f+=L}),(s.originalSubtotal===void 0||s.originalSubtotal===0)&&(s.originalSubtotal=f);let z=f+T;if(s.subtotal=s.invoiceType==="CreditNote"?-Math.abs(z):Math.abs(z),s.tax=s.subtotal*.1,s.total=s.subtotal+s.tax,s.approvedVariationsSum=T,s.pendingVariationsSum=C,t){const J=l.create("invoices",s);O("Invoice created","success"),Y.navigate(`/invoices/${J.id}`)}else l.update("invoices",a,s),O("Invoice saved","success"),d()}),(k=e.querySelector("#btn-send-invoice"))==null||k.addEventListener("click",()=>{l.update("invoices",a,{status:"Sent"}),s.status="Sent",O("Invoice sent to customer","success"),d()}),(S=e.querySelector("#btn-mark-paid"))==null||S.addEventListener("click",()=>{const N=document.createElement("div");N.style.minWidth="300px",N.innerHTML=`
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
      `,He({title:"Mark Invoice as Paid",content:N.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Confirm Payment",className:"btn-primary",onClick:$=>{const f=document.querySelector(".drawer-overlay"),T=f.querySelector("#paid-date").value,C=f.querySelector("#paid-method").value;l.update("invoices",a,{status:"Paid",paidDate:T,paymentMethod:C}),s.status="Paid",s.paidDate=T,s.paymentMethod=C,O("Invoice marked as paid","success"),d(),$()}}],width:350})}),(D=e.querySelector("#btn-delete-invoice"))==null||D.addEventListener("click",()=>{const N=document.createElement("div");N.innerHTML=`<p>Delete invoice <strong>${v(s.number)}</strong>?</p>`,$e({title:"Delete Invoice",content:N,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Delete",className:"btn-danger",onClick:$=>{l.delete("invoices",a),O("Invoice deleted","success"),$(),Y.navigate("/invoices")}}]})}),(M=e.querySelector("#btn-cancel-inv"))==null||M.addEventListener("click",()=>Y.navigate("/invoices"))}d()}function xt(e){const a=l.getAll("purchaseOrders");e.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(r=>`<button class="toolbar-filter" data-filter="${r}">${r}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let t=[...a];const n=Xe({columns:[{key:"number",label:"PO Number",render:r=>`<span class="cell-link font-medium">${v(r.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:r=>`<span class="text-secondary">${v(r.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:r=>r.jobId?`<a href="#/jobs/${r.jobId}" class="cell-link">${v(r.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:r=>r.issueDate?new Date(r.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:r=>`$${(r.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:r=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[r.status]||"badge-neutral"}">${v(r.status)}</span>`,width:"110px"}],data:t,onRowClick:r=>va({id:r,onSave:()=>xt(e)}),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:r=>{st({container:e,selectedIds:r,onClear:()=>n.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:c=>{c.forEach(o=>l.update("purchaseOrders",o,{status:"Received",receivedDate:new Date().toISOString()})),n.clearSelection(),xt(e),me(async()=>{const{showToast:o}=await Promise.resolve().then(()=>qe);return{showToast:o}},void 0).then(({showToast:o})=>o(`Marked ${c.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:c=>{const o=document.createElement("div");o.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Re);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${c.length} Purchase Orders`,content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{const g=o.querySelector("#bulk-status").value;c.forEach(y=>l.update("purchaseOrders",y,{status:g})),n.clearSelection(),xt(e),me(async()=>{const{showToast:y}=await Promise.resolve().then(()=>qe);return{showToast:y}},void 0).then(({showToast:y})=>y(`Updated ${c.length} POs to ${g}`,"success")),u()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:c=>{me(async()=>{const{showModal:o}=await Promise.resolve().then(()=>Re);return{showModal:o}},void 0).then(({showModal:o})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${c.length} purchase orders? This action cannot be undone.</p>`,o({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Delete",className:"btn-danger",onClick:u=>{c.forEach(g=>l.delete("purchaseOrders",g)),n.clearSelection(),xt(e),me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>qe);return{showToast:g}},void 0).then(({showToast:g})=>g(`Deleted ${c.length} purchase orders`,"success")),u()}}]})})}}]})}});e.querySelector("#po-table-container").appendChild(n),e.querySelector("#btn-new-po").addEventListener("click",()=>{va({onSave:()=>xt(e)})}),e.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),r.classList.add("active");const c=r.dataset.filter;t=c==="all"?[...a]:a.filter(o=>o.status===c),n.updateData(t)})}),e.querySelector("#po-search").addEventListener("input",r=>{const c=r.target.value.toLowerCase();t=a.filter(o=>{var d,u,g;return((d=o.number)==null?void 0:d.toLowerCase().includes(c))||((u=o.supplierName)==null?void 0:u.toLowerCase().includes(c))||((g=o.jobNumber)==null?void 0:g.toLowerCase().includes(c))}),n.updateData(t)})}function Bs(e,{id:a,jobId:t}){const s=a==="new";let n=s?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:t||"",jobNumber:""}:l.getById("purchaseOrders",a);if(!n){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(s&&t){const p=l.getById("jobs",t);p&&(n.jobNumber=p.number)}ct(s?"New PO":n.number);const r=l.getAll("stock"),c=l.getAll("jobs"),o=l.getAll("suppliers").filter(p=>p.active!==!1),d=[...o];n.supplierName&&!o.some(p=>p.name===n.supplierName)&&d.push({name:n.supplierName}),d.length===0&&d.push({name:"General Supplier"});function u(){e.innerHTML=`
      ${mt({title:n.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${n.status==="Draft"?"badge-neutral":n.status==="Issued"?"badge-primary":n.status==="Received"?"badge-success":"badge-danger"}">${n.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!s&&n.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!s&&n.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${n.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${d.map(p=>`<option value="${v(p.name)}" ${n.supplierName===p.name?"selected":""}>${v(p.name)}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${n.issueDate?n.issueDate.split("T")[0]:""}" ${n.status!=="Draft"?"disabled":""} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${n.status!=="Draft"?"disabled":""}>
                    <option value="">None</option>
                    ${c.map(p=>`<option value="${p.id}" ${n.jobId===p.id?"selected":""}>${p.number} - ${p.title}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${n.status!=="Draft"?"disabled":""}>${n.notes||""}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${n.status==="Draft"?'<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>':""}
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
                  ${n.status==="Draft"?'<th style="width:5%"></th>':""}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${n.lineItems.length===0?'<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>':""}
                ${n.lineItems.map((p,m)=>`
                  <tr data-index="${m}">
                    <td>
                      ${n.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${r.map(h=>`<option value="${h.id}" ${p.stockId===h.id?"selected":""}>${h.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${p.stockId?"display:none":""}" value="${p.description||""}" placeholder="Description" />
                      `:`<div>${p.description}</div>`}
                    </td>
                    <td>
                      ${n.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${p.sku||""}" ${p.stockId?"disabled":""} />`:p.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${n.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${p.unitCost||0}" step="0.01" />`:`$${(p.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${n.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${p.quantity||1}" min="1" step="1" />`:p.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((p.unitCost||0)*(p.quantity||1)).toFixed(2)}
                    </td>
                    ${n.status==="Draft"?`
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>`:""}
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(n.total||0).toFixed(2)}</td>
                  ${n.status==="Draft"?"<td></td>":""}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,y()}function g(){let p=0;e.querySelectorAll("#line-items-body tr[data-index]").forEach(h=>{const b=parseFloat(h.querySelector(".item-cost").value)||0,w=parseFloat(h.querySelector(".item-qty").value)||0,I=b*w;h.querySelector(".item-total").textContent="$"+I.toFixed(2),p+=I}),n.total=p;const m=e.querySelector("#po-total");m&&(m.textContent="$"+p.toFixed(2))}function y(){var p,m,h,b;e.querySelector("#btn-cancel").addEventListener("click",()=>Y.navigate("/purchase-orders")),(p=e.querySelector("#btn-save"))==null||p.addEventListener("click",()=>{i()}),(m=e.querySelector("#btn-issue"))==null||m.addEventListener("click",()=>{if(n.lineItems.length===0){O("Cannot issue a PO with no items","error");return}i("Issued")}),(h=e.querySelector("#btn-receive"))==null||h.addEventListener("click",()=>{const w=l.getAll("technicians"),I=l.getAll("assets"),x=document.createElement("div");x.innerHTML=`
        <div class="form-group">
          <label class="form-label">Receive into Location *</label>
          <select class="form-select" id="receive-location-select" required>
            <option value="Main Warehouse">Main Warehouse</option>
            <optgroup label="Warehouses">
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </optgroup>
            <optgroup label="Vehicles">
              ${w.map(E=>`<option value="Vehicle - ${v(E.name)}">Vehicle - ${v(E.name)}</option>`).join("")}
            </optgroup>
            <optgroup label="Assets">
              ${I.map(E=>`<option value="${v(E.name)}">${v(E.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      `,showModal({title:"Receive Purchase Order",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Receive Items",className:"btn-success",onClick:E=>{const k=x.querySelector("#receive-location-select").value;if(!k){O("Please select a valid location","error");return}let S=0;const D=l.getAll("stock");n.lineItems.forEach(M=>{var N;if(M.stockId){const $=D.find(f=>f.id===M.stockId);if($){$.locations||($.locations=[]);let f=$.locations.find(T=>T.location===k);f?f.quantity+=M.quantity:$.locations.push({location:k,quantity:M.quantity}),$.quantity=$.locations.reduce((T,C)=>T+C.quantity,0),$.location=((N=$.locations[0])==null?void 0:N.location)||"Main Warehouse",$.updatedAt=new Date().toISOString(),S++}}}),S>0&&l.save("stock",D),O(`Received ${S} items into ${k}`,"success"),n.status="Received",l.update("purchaseOrders",n.id,{status:"Received"}),E(),u()}}]})}),(b=e.querySelector("#btn-add-item"))==null||b.addEventListener("click",()=>{n.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),u()}),e.querySelectorAll(".item-select").forEach((w,I)=>{w.addEventListener("change",x=>{const E=x.target.value,k=x.target.closest("tr"),S=k.querySelector(".item-desc"),D=k.querySelector(".item-sku"),M=k.querySelector(".item-cost");if(E){const N=l.getById("stock",E);N&&(S.style.display="none",S.value=N.name,D.value=N.sku,D.disabled=!0,M.value=N.costPrice||N.unitPrice)}else S.style.display="block",S.value="",D.value="",D.disabled=!1,M.value=0;g()})}),e.querySelectorAll(".item-cost, .item-qty").forEach(w=>{w.addEventListener("input",g)}),e.querySelectorAll(".btn-remove-item").forEach(w=>{w.addEventListener("click",I=>{const x=I.target.closest("tr"),E=parseInt(x.dataset.index);n.lineItems.splice(E,1),u()})})}function i(p=null){if(n.status!=="Draft"){O("Cannot modify an issued or received PO","error");return}const m=e.querySelector("#po-form");if(!m.checkValidity()){m.reportValidity();return}const h=Object.fromEntries(new FormData(m));if(h.jobId){const w=c.find(I=>I.id===h.jobId);h.jobNumber=w?w.number:""}else h.jobNumber="";n.lineItems=Array.from(e.querySelectorAll("#line-items-body tr[data-index]")).map(w=>{const I=w.querySelector(".item-select"),x=I?I.value:"",E=w.querySelector(".item-desc").value,k=x?I.options[I.selectedIndex].text:E;return{stockId:x,description:k,sku:w.querySelector(".item-sku").value,unitCost:parseFloat(w.querySelector(".item-cost").value)||0,quantity:parseInt(w.querySelector(".item-qty").value)||1}}),g();const b={...n,...h,total:n.total,lineItems:n.lineItems,status:p||n.status};if(s){b.number=`PO-${Date.now().toString().slice(-6)}`;const w=l.create("purchaseOrders",b);O(`PO ${p==="Issued"?"issued":"created"} successfully`,"success"),Y.navigate(`/purchase-orders/${w.id}`)}else l.update("purchaseOrders",a,b),O(`PO ${p==="Issued"?"issued":"updated"} successfully`,"success"),p==="Issued"&&u()}u()}function Vs(e){let a="overview";const t=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function s(){const d=l.getAll("jobs"),u=l.getAll("quotes"),g=l.getAll("invoices"),y=l.getAll("customers"),i=l.getAll("stock"),p=l.getAll("technicians"),m=l.getAll("leads"),h=g.filter(L=>L.status==="Paid").reduce((L,j)=>L+(j.total||0),0),b=g.filter(L=>L.status==="Sent"||L.status==="Overdue").reduce((L,j)=>L+(j.total||0),0),w=d.length>0?d.reduce((L,j)=>L+(j.laborCost||0)+(j.materialCost||0),0)/d.length:0,I=u.length>0?u.filter(L=>L.status==="Accepted").length/u.length*100:0,x=m.length>0?m.filter(L=>L.status==="Won").length/m.length*100:0,E={};d.forEach(L=>{E[L.status]=(E[L.status]||0)+1});const k={};g.forEach(L=>{k[L.status]=(k[L.status]||0)+1});const S=p.map(L=>{const j=d.filter(_=>_.technicianId===L.id),q=j.filter(_=>_.status==="Completed"||_.status==="Invoiced").length,A=j.reduce((_,H)=>_+(H.laborCost||0)+(H.materialCost||0),0);return{...L,totalJobs:j.length,completed:q,revenue:A}}),D={};g.filter(L=>L.status==="Paid").forEach(L=>{D[L.customerName]=(D[L.customerName]||0)+(L.total||0)});const M=Object.entries(D).sort((L,j)=>j[1]-L[1]).slice(0,10),N=i.reduce((L,j)=>L+j.quantity*j.costPrice,0),$=i.filter(L=>L.quantity<=L.reorderLevel),f=l.getAll("timesheets"),T={},C={},z=l.getAll("people"),J={};return z.forEach(L=>{L.payRate&&(J[L.id]=L.payRate)}),f.forEach(L=>{T[L.jobId]=(T[L.jobId]||0)+(L.hours||0);const j=L.payRate||J[L.technicianId]||0;C[L.jobId]=(C[L.jobId]||0)+L.hours*j}),{jobs:d,quotes:u,invoices:g,customers:y,stock:i,technicians:p,leads:m,totalRevenue:h,totalOutstanding:b,avgJobValue:w,quoteWinRate:I,leadConvRate:x,jobsByStatus:E,invByStatus:k,techStats:S,topCustomers:M,totalStockValue:N,lowStockItems:$,timesheets:f,hoursByJob:T,internalLaborCostByJob:C}}function n(){const d=s();e.innerHTML=`
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
              ${t.map(u=>`
                <button class="report-nav-item ${a===u.id?"active":""}" data-report="${u.id}" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${a===u.id?"var(--color-primary-light)":"transparent"};
                  color:${a===u.id?"var(--color-primary)":"var(--text-secondary)"};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${a===u.id?"600":"500"};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${u.icon}</span>
                  ${u.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `,r(d),c(d)}function r(d){const u=e.querySelector("#report-content");switch(a){case"overview":u.innerHTML=Js(d);break;case"revenue":u.innerHTML=Us(d);break;case"jobs":u.innerHTML=Qs(d);break;case"job_costing":u.innerHTML=Ws(d);break;case"technicians":u.innerHTML=Gs(d);break;case"customers":u.innerHTML=Ys(d);break;case"inventory":u.innerHTML=Ks(d);break;default:u.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function c(d){var u;e.querySelectorAll("[data-report]").forEach(g=>{g.addEventListener("click",()=>{a=g.dataset.report,n()})}),(u=e.querySelector("#btn-export-csv"))==null||u.addEventListener("click",()=>o(d))}function o(d){let u="";if(a==="overview"||a==="revenue")u=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,d.invoices.forEach(p=>{u+=`"${p.number}","${p.customerName}","${p.status}",${p.total||0},"${p.issueDate||""}","${p.dueDate||""}"
`});else if(a==="job_costing"){const p=l.getSettings();u=`Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %
`,d.jobs.filter(h=>h.status==="Completed"||h.status==="Invoiced").map(h=>{const b=d.hoursByJob[h.id]||0,w=d.internalLaborCostByJob[h.id]||h.laborCost||0,I=p.laborRates.find(S=>S.id===h.laborRateProfileId)||p.laborRates.find(S=>S.isDefault),x=Math.max(b*((I==null?void 0:I.rate)||85),(I==null?void 0:I.minCallOutFee)||0),E=x-w,k=x>0?E/x*100:0;return{num:h.number,tech:h.technicianName||"",actualH:b,actualLabor:w,billableLabor:x,profit:E,margin:k}}).forEach(h=>{u+=`"${h.num}","${h.tech}",${h.actualH},${h.actualLabor.toFixed(2)},${h.billableLabor.toFixed(2)},${h.profit.toFixed(2)},${h.margin.toFixed(1)}%
`})}else a==="jobs"?(u=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,d.jobs.forEach(p=>{u+=`"${p.number}","${p.title}","${p.customerName}","${p.technicianName||""}","${p.status}","${p.priority}",${p.laborCost||0},${p.materialCost||0}
`})):a==="technicians"?(u=`Name,Role,Total Jobs,Completed,Revenue
`,d.techStats.forEach(p=>{u+=`"${p.name}","${p.role}",${p.totalJobs},${p.completed},${p.revenue}
`})):a==="customers"?(u=`Company,First Name,Last Name,Email,Phone,Status
`,d.customers.forEach(p=>{u+=`"${p.company}","${p.firstName}","${p.lastName}","${p.email}","${p.phone}","${p.status}"
`})):a==="inventory"&&(u=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,d.stock.forEach(p=>{u+=`"${p.name}","${p.sku}","${p.category}",${p.quantity},${p.costPrice},${p.unitPrice},"${p.location}","${p.supplier}"
`}));const g=new Blob([u],{type:"text/csv"}),y=URL.createObjectURL(g),i=document.createElement("a");i.href=y,i.download=`simpro_${a}_report.csv`,i.click(),URL.revokeObjectURL(y)}n()}function _e(e,a,t,s){const n={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${e}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[s]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${n[s]}">${t}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${a}</div>
    </div>
  `}function ht(e,a,t){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${t}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${a}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${e}</div>
        </div>
      </div>
    </div>
  `}function At(e,a={},t="#1B6DE0"){const s=Object.entries(e);if(s.length===0)return'<div class="text-secondary text-sm">No data available</div>';const n=Math.max(...s.map(([,r])=>r));return s.map(([r,c])=>{const o=a[r]||t,d=n>0?c/n*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${r}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${d}%;background:${o};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof c=="number"&&c>=1e3?`$${(c/1e3).toFixed(1)}k`:c}</div>
      </div>
    `}).join("")}function Et(e,a,t,s){const n=t>0?a/t*100:0,r=typeof a=="number"?`$${a.toLocaleString("en-AU",{minimumFractionDigits:0})}`:a;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${e}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${r}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${n}%;background:${s};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function Js(e){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${_e("Total Revenue",`$${e.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${_e("Outstanding",`$${e.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${_e("Quote Win Rate",`${e.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${_e("Lead Conversion",`${e.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${At(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${At(e.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
      </div>
    </div>
    <div class="grid-3">
      ${ht("Total Jobs",e.jobs.length,"build")}
      ${ht("Total Quotes",e.quotes.length,"request_quote")}
      ${ht("Total Invoices",e.invoices.length,"receipt_long")}
      ${ht("Total Customers",e.customers.length,"people")}
      ${ht("Avg Job Value",`$${e.avgJobValue.toFixed(0)}`,"paid")}
      ${ht("Stock Items",`${e.stock.length} (${e.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function Us(e){const a=e.invoices.filter(c=>c.status==="Paid"),t={};a.forEach(c=>{const o=new Date(c.issueDate||c.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});t[o]=(t[o]||0)+(c.total||0)});const s=e.jobs.reduce((c,o)=>c+(o.materialCost||0),0),n=e.jobs.reduce((c,o)=>c+(o.laborCost||0),0),r=e.totalRevenue-s;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${_e("Gross Revenue",`$${e.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${_e("Total Labor",`$${n.toFixed(0)}`,"engineering","blue")}
      ${_e("Material Costs",`$${s.toFixed(0)}`,"inventory_2","orange")}
      ${_e("Gross Profit",`$${r.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${At(t,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${Et("Revenue",e.totalRevenue,e.totalRevenue,"#10B981")}
        ${Et("Labor Cost",n,e.totalRevenue,"#3B82F6")}
        ${Et("Material Cost",s,e.totalRevenue,"#F59E0B")}
        ${Et("Gross Profit",r,e.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function Qs(e){const a=e.jobs.filter(s=>s.status==="Completed"||s.status==="Invoiced"),t=a.length>0?a.reduce((s,n)=>s+(n.estimatedHours||0),0)/a.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${_e("Total Jobs",e.jobs.length,"build","blue")}
      ${_e("Completed",a.length,"check_circle","green")}
      ${_e("In Progress",e.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${_e("Avg Hours",t.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${At(e.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${e.jobs.sort((s,n)=>(n.laborCost||0)+(n.materialCost||0)-((s.laborCost||0)+(s.materialCost||0))).slice(0,8).map(s=>`
              <tr>
                <td class="font-medium">${s.number}</td>
                <td class="text-secondary">${s.customerName}</td>
                <td><span class="badge badge-neutral">${s.status}</span></td>
                <td style="text-align:right;font-weight:600">$${((s.laborCost||0)+(s.materialCost||0)).toFixed(0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Ws(e){const a=l.getSettings(),s=e.jobs.filter(d=>d.status==="Completed"||d.status==="Invoiced").map(d=>{const u=e.hoursByJob[d.id]||0,g=e.internalLaborCostByJob[d.id]||d.laborCost||0,y=a.laborRates.find(h=>h.id===d.laborRateProfileId)||a.laborRates.find(h=>h.isDefault),i=Math.max(u*((y==null?void 0:y.rate)||85),(y==null?void 0:y.minCallOutFee)||0),p=i-g,m=i>0?p/i*100:0;return{...d,actualH:u,actualLabor:g,billableLabor:i,profit:p,margin:m}}),n=s.reduce((d,u)=>d+u.actualLabor,0),r=s.reduce((d,u)=>d+u.billableLabor,0),c=r-n,o=r>0?c/r*100:0;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${_e("Internal Labor Cost","$"+n.toLocaleString(),"engineering","orange")}
      ${_e("Billable Labor Rev.","$"+r.toLocaleString(),"payments","green")}
      ${_e("Labor Profitability",o.toFixed(1)+"% Margin","trending_up",o>=40?"green":"orange")}
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
            ${s.map(d=>`
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
            ${s.length?"":'<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No completed jobs to analyze</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Gs(e){return`
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Technician Performance</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Role</th><th style="text-align:center">Total Jobs</th><th style="text-align:center">Completed</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>
            ${e.techStats.sort((a,t)=>t.revenue-a.revenue).map(a=>`
              <tr>
                <td><div style="width:8px;height:8px;border-radius:50%;background:${a.color}"></div></td>
                <td class="font-medium">${a.name}</td>
                <td class="text-secondary">${a.role}</td>
                <td style="text-align:center">${a.totalJobs}</td>
                <td style="text-align:center"><span class="badge badge-success">${a.completed}</span></td>
                <td style="text-align:right;font-weight:600">$${a.revenue.toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Revenue by Technician</h4></div>
      <div class="card-body">
        ${e.techStats.map(a=>Et(a.name,a.revenue,Math.max(...e.techStats.map(t=>t.revenue)),a.color)).join("")}
      </div>
    </div>
  `}function Ys(e){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${_e("Total Customers",e.customers.length,"people","blue")}
      ${_e("Active Customers",e.customers.filter(a=>a.status==="Active").length,"check_circle","green")}
      ${_e("Total Leads",e.leads.length,"trending_up","orange")}
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Customers by Revenue</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Revenue</th><th>Share</th></tr></thead>
          <tbody>
            ${e.topCustomers.map(([a,t],s)=>`
              <tr>
                <td class="text-secondary">${s+1}</td>
                <td class="font-medium">${a}</td>
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
  `}function Ks(e){const a=e.stock.reduce((t,s)=>t+s.quantity*s.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${_e("Total Items",e.stock.length,"inventory_2","blue")}
      ${_e("Stock Value (Cost)",`$${e.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${_e("Stock Value (Sell)",`$${a.toFixed(0)}`,"paid","green")}
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
        ${At(e.stock.reduce((t,s)=>(t[s.category]=(t[s.category]||0)+s.quantity,t),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}function tt(e){return Object.entries(wt).map(([a,t])=>{const s={module:a};return t.forEach(({key:n})=>{s[n]=e(a,n)}),s})}function Xs(e){const t=new URLSearchParams(window.location.hash.split("?")[1]||window.location.search).get("tab");let s="company",n="tasklists";t==="forms"?(s="templates_forms",n="forms"):t==="tasks"||t==="tasklists"?(s="templates_forms",n="tasklists"):t==="quote_templates"||t==="quotes"?(s="templates_forms",n="quotes"):t&&(s=t),JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');function r(){e.innerHTML=`
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${s==="company"?"active":""}" data-tab="company">Company</button>
        <button class="tab ${s==="users"?"active":""}" data-tab="users">Users & Permissions</button>
        <button class="tab ${s==="materials"?"active":""}" data-tab="materials">Materials</button>
        <button class="tab ${s==="templates_forms"?"active":""}" data-tab="templates_forms">Templates &amp; Forms</button>
        <button class="tab ${s==="tax"?"active":""}" data-tab="tax">Tax &amp; Rates</button>
        <button class="tab ${s==="assets"?"active":""}" data-tab="assets">Assets</button>
        <button class="tab ${s==="system"?"active":""}" data-tab="system">System</button>
      </div>
      <div id="settings-content" style="padding-top:var(--space-lg)"></div>
    `,c(),e.querySelectorAll(".tab").forEach(m=>{m.addEventListener("click",()=>{s=m.dataset.tab,e.querySelectorAll(".tab").forEach(h=>h.classList.remove("active")),m.classList.add("active"),c()})})}function c(){var b,w,I;const m=e.querySelector("#settings-content");if(s==="templates_forms"){p(m);return}if(s==="company"){const x=l.getSettings();let E=x.logo;(()=>{var D;m.innerHTML=`
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
                    ${E?`<img src="${E}" style="max-width:90%; max-height:90%; object-fit:contain" />`:`
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
                    ${E?'<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>':""}
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
        `;const S=m.querySelector("#logo-upload");m.querySelector("#btn-upload-logo").addEventListener("click",()=>S.click()),S.addEventListener("change",M=>{const N=M.target.files[0];if(N){const $=new FileReader;$.onload=f=>{E=f.target.result;const T=m.querySelector("#logo-preview-container");T.innerHTML=`<img src="${E}" style="max-width:90%; max-height:90%; object-fit:contain" />`,m.querySelector("#unsaved-logo-hint").style.display="block",O("Logo preview updated. Click Save to apply.","info")},$.readAsDataURL(N)}}),(D=m.querySelector("#btn-remove-logo"))==null||D.addEventListener("click",()=>{E=null;const M=m.querySelector("#logo-preview-container");M.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `,m.querySelector("#unsaved-logo-hint").style.display="block",m.querySelector("#btn-remove-logo").style.display="none"}),m.querySelector("#btn-save-company").addEventListener("click",()=>{const M=l.getSettings();M.name=m.querySelector("#company-name").value,M.abn=m.querySelector("#company-abn").value,M.phone=m.querySelector("#company-phone").value,M.email=m.querySelector("#company-domain").value,M.address=m.querySelector("#company-address").value,M.logo=E,l.saveSettings(M),O("Company information saved permanently","success"),m.querySelector("#unsaved-logo-hint").style.display="none",window.dispatchEvent(new CustomEvent("simpro-settings-updated"))})})()}else if(s==="users"){const x=l.getAll("technicians");let E=l.getAll("userTypes");!E||E.length===0?(E=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:tt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:tt((k,S)=>k==="Settings"?["view","edit_company"].includes(S):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs",permissions:tt((k,S)=>k==="Dashboard"?S==="view":k==="Jobs"?["view","manage_tasks","book_time"].includes(S):k==="Timesheets"?["view_own","create"].includes(S):k==="Schedule"?["view_own"].includes(S):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:tt((k,S)=>k==="Settings"?!1:k==="Reports"?S==="view":!(["Invoices","Purchase Orders"].includes(k)&&S==="delete"))}],l.save("userTypes",E)):E.some(S=>S.id==="ut_office")||(E.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:tt((S,D)=>S==="Settings"?!1:S==="Reports"?D==="view":!(["Invoices","Purchase Orders"].includes(S)&&D==="delete"))}),l.save("userTypes",E)),m.innerHTML=`
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
                ${x.filter(k=>!k.deactivated).map(k=>{const S=E.find(D=>D.id===k.userTypeId);return`
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${k.color}"></div></td>
                      <td class="font-medium">${k.name}</td>
                      <td class="text-secondary">${k.role}</td>
                      <td><span class="badge ${(S==null?void 0:S.id)==="ut_admin"?"badge-primary":"badge-neutral"}">${(S==null?void 0:S.name)||"Unassigned"}</span></td>
                      <td class="text-tertiary">${k.email||"-"}</td>
                      <td class="text-secondary">${k.payRate?`$${k.payRate.toFixed(2)}/hr`:"-"}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${k.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${k.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
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
                ${E.map(k=>`
                  <tr>
                    <td class="font-medium">${k.name}</td>
                    <td class="text-secondary">${k.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${k.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${k.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${k.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${x.filter(k=>k.deactivated).length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>':""}
                ${x.filter(k=>k.deactivated).map(k=>{const S=new Date(k.deactivatedAt),M=new Date-S,$=30-Math.ceil(M/(1e3*60*60*24)),f=$<=0;return`
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${k.name}</td>
                      <td style="opacity:0.6">${k.role}</td>
                      <td class="text-tertiary">${S.toLocaleDateString()}</td>
                      <td>
                        ${f?'<span class="badge badge-success">Cooldown Complete</span>':`<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${$} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${k.id}" 
                                ${f?"":'disabled style="opacity:0.4; cursor:not-allowed"'}>
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,m.querySelector("#btn-add-user").addEventListener("click",()=>u()),m.querySelectorAll(".btn-edit-user").forEach(k=>{k.addEventListener("click",S=>u(S.currentTarget.dataset.id))}),m.querySelectorAll(".btn-deactivate-user").forEach(k=>{k.addEventListener("click",S=>{const D=S.currentTarget.dataset.id,M=l.getById("technicians",D);if(!M)return;const N=document.createElement("div");N.innerHTML=`<p>Are you sure you want to deactivate <strong>${M.name}</strong>? They will no longer be able to log in.</p>`,$e({title:"Deactivate User",content:N,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Deactivate",className:"btn-danger",onClick:$=>{l.update("technicians",D,{deactivated:!0,deactivatedAt:new Date().toISOString()}),O(`${M.name} deactivated`,"info"),$(),c()}}]})})}),m.querySelectorAll(".btn-reactivate-user").forEach(k=>{k.addEventListener("click",S=>{const D=S.currentTarget.dataset.id,M=l.getById("technicians",D);if(!M)return;const N=new Date(M.deactivatedAt),$=Math.ceil((new Date-N)/(1e3*60*60*24));if($<30){O(`License Policy: Seat cooldown in progress (${30-$} days remaining)`,"error");return}const f=document.createElement("div");f.innerHTML=`<p>Reactivate <strong>${M.name}</strong>? They will regain access once a User Type is assigned.</p>`,$e({title:"Reactivate User",content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Reactivate",className:"btn-primary",onClick:T=>{l.update("technicians",D,{deactivated:!1,deactivatedAt:null}),O(`${M.name} has been reactivated.`,"success"),T(),c()}}]})})}),(b=m.querySelector("#btn-add-usertype"))==null||b.addEventListener("click",()=>{o()}),m.querySelectorAll(".btn-edit-perms").forEach(k=>{k.addEventListener("click",S=>{d(S.target.dataset.id)})}),m.querySelectorAll(".btn-edit-usertype").forEach(k=>{k.addEventListener("click",S=>{o(S.target.dataset.id)})}),m.querySelectorAll(".btn-delete-usertype").forEach(k=>{k.addEventListener("click",S=>{const D=S.target.dataset.id,M=l.getById("userTypes",D);if(!M)return;if(M.name.toLowerCase().includes("admin")){O("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const N=l.getAll("technicians").filter(f=>f.userTypeId===D),$=document.createElement("div");$.innerHTML=`<p>Are you sure you want to delete the user type <strong>${M.name}</strong>?${N.length>0?` <strong>${N.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,$e({title:"Confirm Deletion",content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Delete",className:"btn-danger",onClick:f=>{l.delete("userTypes",D),O("User Type deleted","success"),f(),c()}}]})})})}else if(s==="materials")i(m);else if(s==="tax"){let E=function(k){return Array.from(k.querySelectorAll(".labor-rate-card")).map(S=>{const D=S.dataset.id,M=S.querySelector(".rate-name").value,N=parseFloat(S.querySelector(".rate-val").value)||0,$=parseFloat(S.querySelector(".rate-multiplier").value)||1,f=S.querySelector(".rate-desc").value,T=parseFloat(S.querySelector(".rate-min-fee").value)||0,C=S.querySelector(".btn-set-default")===null,z=Array.from(S.querySelectorAll(".rate-day:checked")).map(J=>J.dataset.day);return{id:D,name:M,rate:N,description:f,overtimeMultiplier:$,minCallOutFee:T,applicableDays:z,isDefault:C}})};var h=E;const x=l.getSettings();m.innerHTML=`
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
              ${x.laborRates.map(k=>{const S=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],D={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},M=k.applicableDays||["Mon","Tue","Wed","Thu","Fri"];return`
                <div class="labor-rate-card" data-id="${k.id}" style="border:2px solid ${k.isDefault?"var(--color-primary)":"var(--border-color)"}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${k.isDefault?"var(--color-primary-light)":"var(--bg-color)"}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${k.isDefault?"var(--color-primary)":"var(--text-tertiary)"}; font-size:20px">sell</span>
                      <input class="rate-name" value="${k.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${k.isDefault?'<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>':""}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${k.isDefault?"":`<button class="btn btn-ghost btn-sm btn-set-default" data-id="${k.id}" title="Set as default rate">Set Default</button>`}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${k.id}" title="Delete profile" ${k.isDefault?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
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
                        <input class="form-input rate-val" type="number" value="${k.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Overtime Multiplier</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <input class="form-input rate-multiplier" type="number" value="${(k.overtimeMultiplier||1).toFixed(1)}" min="1" max="5" step="0.5" style="width:100px" />
                        <span class="text-secondary">× base pay</span>
                      </div>
                    </div>
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${(k.minCallOutFee||0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Description</label>
                      <input class="form-input rate-desc" value="${k.description||""}" placeholder="When is this rate used?" />
                    </div>
                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${S.map(N=>`
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${N}" ${M.includes(N)?"checked":""} style="display:none" />
                            <span class="rate-day-pill" data-day="${N}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${M.includes(N)?"var(--color-primary)":"var(--border-color)"};background:${M.includes(N)?"var(--color-primary-light)":"transparent"};color:${M.includes(N)?"var(--color-primary)":"var(--text-secondary)"}">
                              ${D[N]}
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
              ${["Service","Project","Maintenance","Quote"].map(k=>`
                <div class="form-group" style="margin:0">
                  <label class="form-label">${k} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${k}">
                    <option value="">-- Use Default --</option>
                    ${x.laborRates.map(S=>{var D;return`<option value="${S.id}" ${((D=x.rateMappings)==null?void 0:D[k])===S.id?"selected":""}>${S.name}</option>`}).join("")}
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `,m.addEventListener("click",k=>{const S=k.target.closest(".rate-day-pill");if(S){const D=S.dataset.day,N=S.closest(".labor-rate-card").querySelector(`.rate-day[data-day="${D}"]`);N.checked=!N.checked;const $=N.checked;S.style.border=`1px solid ${$?"var(--color-primary)":"var(--border-color)"}`,S.style.background=$?"var(--color-primary-light)":"transparent",S.style.color=$?"var(--color-primary)":"var(--text-secondary)"}}),m.querySelector("#add-rate-btn").addEventListener("click",()=>{const k="rate_"+Date.now().toString(36),S=m.querySelector("#labor-rates-container"),D=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],M={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},N=document.createElement("div");N.className="labor-rate-card",N.dataset.id=k,N.style.cssText="border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);",N.innerHTML=`
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${k}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${k}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${D.map($=>`
                  <label style="cursor:pointer">
                    <input type="checkbox" class="rate-day" data-day="${$}" ${["Mon","Tue","Wed","Thu","Fri"].includes($)?"checked":""} style="display:none" />
                    <span class="rate-day-pill" data-day="${$}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${["Mon","Tue","Wed","Thu","Fri"].includes($)?"var(--color-primary)":"var(--border-color)"};background:${["Mon","Tue","Wed","Thu","Fri"].includes($)?"var(--color-primary-light)":"transparent"};color:${["Mon","Tue","Wed","Thu","Fri"].includes($)?"var(--color-primary)":"var(--text-secondary)"}">
                      ${M[$]}
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        `,S.appendChild(N)}),m.addEventListener("click",k=>{if(k.target.closest(".remove-rate-btn")){const S=k.target.closest(".labor-rate-card");S&&S.remove()}}),m.addEventListener("click",k=>{if(k.target.closest(".btn-set-default")){const S=k.target.closest(".btn-set-default").dataset.id,D=E(m);D.forEach(N=>N.isDefault=N.id===S);const M=m.querySelector("#labor-rates-container");M.innerHTML=D.map(N=>{m.querySelectorAll(".labor-rate-card").forEach($=>{const f=$.dataset.id===S;$.style.border=`2px solid ${f?"var(--color-primary)":"var(--border-color)"}`;const T=$.querySelector('div[style*="padding:12px 16px"]');T&&(T.style.background=f?"var(--color-primary-light)":"var(--bg-color)");let C=$.querySelector(".badge");if(f&&!C){const J=$.querySelector('div[style*="flex:1"]'),L=document.createElement("span");L.className="badge",L.style.cssText="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600",L.textContent="DEFAULT",J.appendChild(L)}else!f&&C&&C.remove();let z=$.querySelector(".btn-set-default");if(f&&z)z.remove();else if(!f&&!z){const J=$.querySelector('div[style*="gap:8px"]'),L=document.createElement("button");L.className="btn btn-ghost btn-sm btn-set-default",L.dataset.id=$.dataset.id,L.textContent="Set Default",J.prepend(L)}})}),O("Default rate updated in view. Click Save to apply.","info")}}),m.querySelector("#save-tax-settings").addEventListener("click",()=>{const k=parseFloat(m.querySelector("#global-markup").value)||0,S=parseInt(m.querySelector("#labor-rounding").value)||15,D=E(m),M=l.getSettings();M.markupPercent=k,M.laborRounding=S,M.laborRates=D,M.rateMappings={},m.querySelectorAll(".rate-mapping").forEach(N=>{N.value&&(M.rateMappings[N.dataset.type]=N.value)}),l.saveSettings(M),O("Financial and Rate settings saved","success"),c()})}else if(s==="assets"){l.getSettings();const x=l.getAll("assets").filter(E=>E.category==="Business");m.innerHTML=`
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
                ${x.map(E=>`
                  <tr>
                    <td class="font-medium">${v(E.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${E.id}" value="${E.recoveryRate||0}" step="0.5" style="width:100px; height:32px" />
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
      `,m.querySelector("#btn-save-asset-settings").addEventListener("click",()=>{m.querySelectorAll(".asset-rate-input").forEach(E=>{const k=E.dataset.id,S=parseFloat(E.value)||0;l.update("assets",k,{recoveryRate:S})}),O("Asset recovery rates updated across the system","success")})}else s==="system"&&(m.innerHTML=`
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
      `,(w=m.querySelector("#btn-reset-data"))==null||w.addEventListener("click",()=>{l.clearAll(),O("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(I=m.querySelector("#btn-clear-data"))==null||I.addEventListener("click",()=>{l.clearAll(),O("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)}))}function o(m=null){let h=m?l.getById("userTypes",m):{name:"",description:""};const b=document.createElement("div");b.innerHTML=`
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
          <input class="form-input" id="ut-name" value="${h.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${h.description}" />
        </div>
    `;const w=b.querySelector("#ut-template"),I=b.querySelector("#ut-custom-edit-perms");w&&I&&(w.addEventListener("change",x=>{x.target.value==="Custom"?I.style.display="flex":I.style.display="none"}),I.addEventListener("click",()=>{var D;const x=b.querySelector("#ut-name").value,E=b.querySelector("#ut-desc").value;if(!x){O("Please enter a User Type Name first","error");return}const k=tt(()=>!1),S=l.create("userTypes",{name:x,description:E,permissions:k});(D=document.getElementById("modal-close-btn"))==null||D.click(),d(S.id)})),$e({title:m?"Edit User Type":"Add User Type",content:b,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Save",className:"btn-primary",onClick:x=>{var D;const E=document.getElementById("ut-name").value,k=document.getElementById("ut-desc").value,S=(D=document.getElementById("ut-template"))==null?void 0:D.value;if(!E){O("Name required","error");return}if(m)l.update("userTypes",m,{name:E,description:k});else{let M=[];S==="Admin"?M=tt(()=>!0):S==="Manager"?M=tt((N,$)=>N==="Settings"?["view","edit_company"].includes($):!0):S==="Technician"?M=tt((N,$)=>N==="Dashboard"?$==="view":N==="Jobs"?["view","manage_tasks","book_time"].includes($):N==="Timesheets"?["view_own","create"].includes($):N==="Schedule"?["view_own"].includes($):!1):S==="Office Staff"?M=tt((N,$)=>N==="Settings"?!1:N==="Reports"?$==="view":!(["Invoices","Purchase Orders"].includes(N)&&$==="delete")):M=tt(()=>!1),l.create("userTypes",{name:E,description:k,permissions:M})}O("User Type saved","success"),c(),x()}}]})}function d(m){const h=l.getById("userTypes",m);if(!h)return;const b=h.permissions||[],w={};b.forEach(E=>{w[E.module]=E});const I=document.createElement("div"),x=Object.entries(wt).map(([E,k])=>{const S=w[E]||{},D=k.every(({key:N})=>S[N]),M=k.map(({key:N,label:$})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${E}" data-key="${N}" ${S[N]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${$}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${E}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${E}" ${D?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${M}
          </div>
        </div>
      `}).join("");I.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${x}
      </div>
    `,I.querySelector("#btn-select-all-perms").addEventListener("click",()=>{I.querySelectorAll(".perm-chk, .module-select-all").forEach(E=>E.checked=!0)}),I.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{I.querySelectorAll(".perm-chk, .module-select-all").forEach(E=>E.checked=!1)}),I.querySelectorAll(".module-select-all").forEach(E=>{E.addEventListener("change",k=>{const S=k.target.dataset.module;I.querySelectorAll(`.perm-chk[data-module="${S}"]`).forEach(D=>D.checked=k.target.checked)})}),I.querySelectorAll(".perm-chk").forEach(E=>{E.addEventListener("change",()=>{const k=E.dataset.module,D=(wt[k]||[]).every(({key:N})=>{const $=I.querySelector(`.perm-chk[data-module="${k}"][data-key="${N}"]`);return $&&$.checked}),M=I.querySelector(`.module-select-all[data-module="${k}"]`);M&&(M.checked=D)})}),$e({title:`Edit Permissions: ${h.name}`,content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Save Permissions",className:"btn-primary",onClick:E=>{const k=Object.entries(wt).map(([S,D])=>{const M={module:S};return D.forEach(({key:N})=>{const $=I.querySelector(`.perm-chk[data-module="${S}"][data-key="${N}"]`);M[N]=$?$.checked:!1}),M});l.update("userTypes",m,{permissions:k}),O("Permissions updated successfully","success"),c(),E()}}]})}function u(m=null){let h=m?l.getById("technicians",m):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const b=l.getAll("userTypes"),w=document.createElement("div");w.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${h.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${h.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${h.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${b.map(E=>`
              <option value="${E.id}" ${h.userTypeId===E.id?"selected":""}>${E.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary);font-size:15px">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${h.payRate||""}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary" style="font-size:var(--font-size-sm)">/hr — used in job cost &amp; P&amp;L calculations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(E=>`
            <div class="color-swatch" data-color="${E}" style="width:28px; height:28px; border-radius:50%; background:${E}; cursor:pointer; border:2px solid ${h.color.toUpperCase()===E.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${h.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const I=w.querySelector("#u-color"),x=w.querySelectorAll(".color-swatch");x.forEach(E=>{E.addEventListener("click",()=>{I.value=E.dataset.color,x.forEach(k=>k.style.borderColor="transparent"),E.style.borderColor="var(--text-primary)"})}),I.addEventListener("input",()=>{x.forEach(E=>E.style.borderColor="transparent")}),$e({title:m?"Edit User":"Add User",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Save",className:"btn-primary",onClick:E=>{const k=document.getElementById("u-name").value,S=document.getElementById("u-email").value,D=document.getElementById("u-role").value,M=document.getElementById("u-type").value,N=document.getElementById("u-color").value,$=parseFloat(document.getElementById("u-payrate").value)||null;if(!k){O("Name required","error");return}m?l.update("technicians",m,{name:k,email:S,role:D,userTypeId:M,color:N,payRate:$}):l.create("technicians",{name:k,email:S,role:D,userTypeId:M,color:N,payRate:$}),O("User saved","success"),c(),E()}}]})}document.addEventListener("save-settings",()=>O("Settings saved","success"));function g(m){const h=l.getAll("taskTemplates");m.innerHTML=`
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
              ${h.length?h.map(w=>`
                <tr>
                  <td class="font-medium">${v(w.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${v(w.description||"—")}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(w.tags||[]).map(I=>`<span class="badge badge-neutral" style="font-size:10px">${v(I)}</span>`).join("")}
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
    `,m.querySelector("#btn-add-template").addEventListener("click",()=>{b()}),m.querySelectorAll(".btn-delete-template").forEach(w=>{w.addEventListener("click",()=>{confirm("Delete this template?")&&(l.delete("taskTemplates",w.dataset.id),c())})}),m.querySelectorAll(".btn-edit-template").forEach(w=>{w.addEventListener("click",()=>{b(w.dataset.id)})});function b(w=null){const I=w?l.getById("taskTemplates",w):{name:"",description:"",tags:[],tasks:[]},x=document.createElement("div");x.style.maxHeight="80vh",x.style.overflowY="auto",x.style.padding="4px";let E=JSON.parse(JSON.stringify(I.tasks||I.phases||[])).map(f=>{!f.subTasks&&f.subPhases&&(f.subTasks=f.subPhases,delete f.subPhases),f.tasks&&!f.subTasks&&(f.subTasks=f.tasks.map(C=>({id:C.id||l.generateId(),name:C.name||"",estimatedHours:C.estimatedHours||0,people:C.people||1,status:"Not Started",progress:0})),delete f.tasks);function T(C){C.subPhases&&!C.subTasks&&(C.subTasks=C.subPhases,delete C.subPhases),C.subTasks||(C.subTasks=[]),C.subTasks.forEach(T)}return T(f),f}),k=E.length>0?[0]:[],S=[],D=!1;function M(f,T){if(!T||T.length===0)return null;let C=f[T[0]];if(!C)return null;for(let z=1;z<T.length;z++)if(!C.subTasks||(C=C.subTasks[T[z]],!C))return null;return C}function N(f){return!f.subTasks||f.subTasks.length===0?(parseFloat(f.estimatedHours)||0)*(parseInt(f.people)||1):f.subTasks.reduce((T,C)=>T+N(C),0)}const $=()=>{var f,T,C,z,J,L;x.innerHTML=`
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${v(I.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${v(I.description||"")}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(I.tags||[]).join(", ")}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(()=>{const j=S.length>0?M(E,S):null,q=j?j.subTasks||[]:E,A=j?v(j.name):"Main Tasks";return`
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${S.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${A}">${A}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${q.map((_,H)=>{const R=[...S,H],V=R.join("-")===k.join("-");return`
                        <div class="tmpl-task-list-item" data-path="${R.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${V?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${V?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${v(_.name)}">${v(_.name)}</span>
                          ${_.subTasks&&_.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${R.join("-")}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>`:""}
                        </div>
                      `}).join("")}
                    ${q.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${k.length>0?(()=>{const j=k,q=M(E,j);if(!q)return'<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';const A=q.subTasks&&q.subTasks.length>0;return`
                  ${D?`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${j.join("-")}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${j.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <label class="form-label" style="font-size:11px">Name *</label>
                      <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${v(q.name)}" style="font-size:13px" />
                    </div>
                    ${A?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:13px; font-weight:500">${N(q)} hrs</div>
                      </div>
                    `:`
                      <div class="form-row" style="margin-bottom:12px; gap:8px">
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">Est. Hours</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${q.estimatedHours||""}" min="0" step="0.5" style="font-size:13px" />
                        </div>
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">People</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${q.people||"1"}" min="1" step="1" style="font-size:13px" />
                        </div>
                      </div>
                    `}
                    <div class="form-group" style="margin-bottom:0">
                      <label class="form-label" style="font-size:11px">Description</label>
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${v(q.description||"")}</textarea>
                    </div>
                  `:`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${v(q.name)}">${v(q.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${j.length<3?`<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${j.join("-")}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>`:""}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${j.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${v(q.name)}</div>
                    </div>
                    ${A?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${N(q)} hrs</div>
                      </div>
                    `:`
                      <div style="display:flex; gap:16px; margin-bottom:12px">
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Estimated Hours</div>
                          <div style="font-size:14px; font-weight:500">${q.estimatedHours||0} hrs</div>
                        </div>
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">People</div>
                          <div style="font-size:14px; font-weight:500">${q.people||1}</div>
                        </div>
                      </div>
                    `}
                    <div style="margin-top:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Description</div>
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${v(q.description||"No description provided.")}</div>
                    </div>
                  `}
                `})():'<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `,(f=x.querySelector(".btn-view-back"))==null||f.addEventListener("click",()=>{S.pop(),$()}),x.querySelectorAll(".btn-drill-down-tmpl").forEach(j=>{j.addEventListener("click",q=>{q.stopPropagation(),S=j.dataset.path.split("-").map(Number),k=[...S],$()})}),x.querySelectorAll(".tmpl-task-list-item").forEach(j=>{j.addEventListener("click",q=>{q.target.closest(".btn-drill-down-tmpl")||(k=j.dataset.path.split("-").map(Number),D=!1,$())})}),(T=x.querySelector(".btn-add-node"))==null||T.addEventListener("click",()=>{const j={id:l.generateId(),name:"New Task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]};if(S.length===0)E.push(j),k=[E.length-1];else{const q=M(E,S);q.subTasks||(q.subTasks=[]),q.subTasks.push(j),k=[...S,q.subTasks.length-1]}D=!0,$()}),(C=x.querySelector(".btn-add-child-tmpl"))==null||C.addEventListener("click",j=>{const q=j.currentTarget.dataset.path.split("-").map(Number),A=M(E,q);A.subTasks||(A.subTasks=[]),A.subTasks.push({id:l.generateId(),name:"New Sub-task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]}),k=[...q,A.subTasks.length-1],D=!0,$()}),(z=x.querySelector(".btn-edit-info-tmpl"))==null||z.addEventListener("click",()=>{D=!0,$()}),(J=x.querySelector(".btn-done-info-tmpl"))==null||J.addEventListener("click",()=>{D=!1,$()}),x.querySelectorAll(".tmpl-detail-input").forEach(j=>{j.addEventListener("input",q=>{const A=M(E,k);if(!A)return;const _=q.target.dataset.field;_==="estimatedHours"?A[_]=parseFloat(q.target.value)||0:_==="people"?A[_]=parseInt(q.target.value)||1:A[_]=q.target.value})}),x.querySelectorAll(".btn-remove-task-tmpl-item").forEach(j=>{j.addEventListener("click",q=>{const A=j.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this item and all its sub-tasks?")){if(A.length===1)E.splice(A[0],1);else{const _=A.slice(0,-1),H=M(E,_);H&&H.subTasks&&H.subTasks.splice(A[A.length-1],1)}k=A.slice(0,-1),D=!1,$()}})}),(L=x.querySelector(".btn-duplicate-task-tmpl"))==null||L.addEventListener("click",j=>{const q=j.currentTarget.dataset.path.split("-").map(Number),A=M(E,q);if(!A)return;function _(R,V){return{...R,id:l.generateId(),name:R.name+(V?" (Copy)":""),status:"Not Started",progress:0,subTasks:R.subTasks?R.subTasks.map(se=>_(se,!1)):[]}}const H=_(A,!0);if(q.length===1)E.splice(q[0]+1,0,H),k=[q[0]+1];else{const R=q.slice(0,-1);M(E,R).subTasks.splice(q[q.length-1]+1,0,H),k=[...R,q[q.length-1]+1]}D=!1,$()})};$(),$e({title:w?"Edit Tasklist Template":"Create Tasklist Template",content:x,size:"modal-lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Save Template",className:"btn-primary",onClick:f=>{const T=x.querySelector("#edit-tmpl-name").value,C=x.querySelector("#edit-tmpl-desc").value,z=x.querySelector("#edit-tmpl-tags").value.split(",").map(L=>L.trim()).filter(Boolean);if(!T){O("Name required","error");return}const J={name:T,description:C,tags:z,tasks:E,phases:E};w?l.update("taskTemplates",w,J):l.create("taskTemplates",J),O("Tasklist template saved","success"),f(),c()}}]})}}function y(m){const h=l.getAll("quoteTemplates");m.innerHTML=`
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
              ${h.length?h.map(b=>`
                <tr>
                  <td class="font-medium">${v(b.name)}</td>
                  <td class="text-secondary">${v(b.description||"—")}</td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-quote-template" data-id="${b.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-quote-template" data-id="${b.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="3" class="text-center text-tertiary" style="padding:32px">No quote templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,m.querySelector("#btn-add-quote-template").addEventListener("click",()=>{Y.navigate("/settings/quote-templates/new")}),m.querySelectorAll(".btn-delete-quote-template").forEach(b=>{b.addEventListener("click",()=>{confirm("Delete this template?")&&(l.delete("quoteTemplates",b.dataset.id),c())})}),m.querySelectorAll(".btn-edit-quote-template").forEach(b=>{b.addEventListener("click",()=>{Y.navigate(`/settings/quote-templates/${b.dataset.id}/edit`)})})}function i(m){const h=l.getSettings(),b=h.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]},w=h.materialCategories||["General"];m.innerHTML=`
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
                    ${(b.tiers||[]).map((x,E)=>`
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${E===0?"Up to":"From previous up to"} 
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
                          <button class="btn btn-icon btn-sm text-danger btn-remove-tier" data-idx="${E}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
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
              ${w.map(x=>`
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
    `;const I=()=>{const x=parseFloat(m.querySelector("#mat-default-markup").value),E=parseFloat(m.querySelector("#mat-min-markup").value),k=m.querySelector("#mat-use-tiers").checked,S=Array.from(m.querySelectorAll("#tier-rows tr")).map(N=>({upTo:parseFloat(N.querySelector(".tier-upto").value)||null,percent:parseFloat(N.querySelector(".tier-percent").value)||0})).sort((N,$)=>N.upTo===null?1:$.upTo===null?-1:N.upTo-$.upTo),D=Array.from(m.querySelectorAll(".btn-remove-cat")).map(N=>N.dataset.name),M={...h,materialMarkup:{defaultPercent:x,minMarkupAmount:E,useTiers:k,tiers:S},materialCategories:D};l.saveSettings(M),O("Material settings saved","success")};m.querySelector("#mat-use-tiers").addEventListener("change",x=>{m.querySelector("#tiers-container").style.opacity=x.target.checked?"1":"0.5",m.querySelector("#tiers-container").style.pointerEvents=x.target.checked?"auto":"none"}),m.querySelector("#btn-add-tier").addEventListener("click",()=>{const x=document.createElement("tr");x.innerHTML=`
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
      `,m.querySelector("#tier-rows").appendChild(x),x.querySelector(".btn-remove-tier").addEventListener("click",()=>x.remove())}),m.querySelectorAll(".btn-remove-tier").forEach(x=>{x.addEventListener("click",()=>x.closest("tr").remove())}),m.querySelector("#btn-add-category").addEventListener("click",()=>{const x=prompt("Enter category name:");if(x){const E=document.createElement("div");E.className="badge badge-neutral",E.style.cssText="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px",E.innerHTML=`
          ${x}
          <span class="material-icons-outlined btn-remove-cat" data-name="${x}" style="font-size:14px;cursor:pointer">close</span>
        `,m.querySelector("#categories-container").insertBefore(E,m.querySelector("#btn-add-category")),E.querySelector(".btn-remove-cat").addEventListener("click",()=>E.remove())}}),m.querySelectorAll(".btn-remove-cat").forEach(x=>{x.addEventListener("click",()=>x.closest(".badge").remove())}),m.querySelector("#btn-save-materials").addEventListener("click",I)}function p(m){m.innerHTML=`
      <div class="card" style="margin-bottom:var(--space-md)">
        <div class="card-body" style="padding: 8px; background:var(--bg-color); border-radius: 8px; display:flex; gap:8px">
          <button class="btn btn-sm" id="subtab-tasklists" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${n==="tasklists"?"var(--color-primary)":"transparent"}; color:${n==="tasklists"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">playlist_add_check</span> Tasklist Templates
          </button>
          <button class="btn btn-sm" id="subtab-forms" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${n==="forms"?"var(--color-primary)":"transparent"}; color:${n==="forms"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">assignment</span> Form Templates
          </button>
          <button class="btn btn-sm" id="subtab-quotes" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; border:none; border-radius:6px; padding:10px; background:${n==="quotes"?"var(--color-primary)":"transparent"}; color:${n==="quotes"?"white":"var(--text-color)"}; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
            <span class="material-icons-outlined" style="font-size:18px">article</span> Quote Templates
          </button>
        </div>
      </div>
      <div id="templates-subcontent" style="margin-top:var(--space-md)"></div>
    `;const h=m.querySelector("#subtab-tasklists"),b=m.querySelector("#subtab-forms"),w=m.querySelector("#subtab-quotes");n==="tasklists"&&(h.style.color="white"),n==="forms"&&(b.style.color="white"),n==="quotes"&&(w.style.color="white");const I=m.querySelector("#templates-subcontent");n==="tasklists"?g(I):n==="forms"?Fa(I):n==="quotes"&&y(I),h.addEventListener("click",()=>{n="tasklists",p(m)}),b.addEventListener("click",()=>{n="forms",p(m)}),w.addEventListener("click",()=>{n="quotes",p(m)})}r()}function Fa(e){const a=l.getAll("formTemplates");e.innerHTML=`
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
              ${a.map(t=>`
                <tr>
                  <td class="font-medium">${v(t.name)}</td>
                  <td style="color:var(--text-secondary); font-size:13px">${v(t.description||"—")}</td>
                  <td><span class="badge badge-neutral">${(t.sections||[]).reduce((s,n)=>s+n.fields.length,0)} Fields</span></td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-icon btn-sm edit-form-template" data-id="${t.id}"><span class="material-icons-outlined">edit</span></button>
                    <button class="btn btn-ghost btn-icon btn-sm delete-form-template" data-id="${t.id}" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span></button>
                  </td>
                </tr>
              `).join("")}
              ${a.length?"":'<tr><td colspan="4" style="text-align:center; padding:40px; color:var(--text-tertiary)">No form templates created yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,e.querySelector("#btn-add-form-template").addEventListener("click",()=>Y.navigate("/settings/forms/new")),e.querySelectorAll(".edit-form-template").forEach(t=>{t.addEventListener("click",()=>Y.navigate(`/settings/forms/${t.dataset.id}/edit`))}),e.querySelectorAll(".delete-form-template").forEach(t=>{t.addEventListener("click",()=>{if(confirm("Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.")){const s=t.dataset.id,n=l.getAll("formTemplates").filter(r=>r.id!==s);l.save("formTemplates",n),Fa(e)}})})}const Ut=[{type:"text",label:"Text Input",icon:"edit"},{type:"textarea",label:"Long Text",icon:"notes"},{type:"checkbox",label:"Checkbox",icon:"check_box"},{type:"select",label:"Dropdown",icon:"arrow_drop_down_circle"},{type:"date",label:"Date",icon:"calendar_today"},{type:"signature",label:"Signature",icon:"draw"},{type:"info",label:"Info Box",icon:"info"},{type:"spacer",label:"Spacer",icon:"space_bar"}];function Mt(e){return Ut.find(a=>a.type===e)||Ut[0]}function at(e){return e+"_"+Math.random().toString(36).substr(2,7)}function Ha(e,{id:a}){const t=a&&a!=="new",s=t?l.getAll("formTemplates").find($=>$.id===a):null;if(t&&!s){e.innerHTML='<div class="empty-state"><h3>Template not found</h3></div>';return}let n=s?JSON.parse(JSON.stringify(s.sections||[])):[{id:at("sec"),title:"General Info",columns:1,fields:[]}];n.forEach($=>{$.columns===void 0&&($.columns=2),($.fields||[]).forEach(f=>{f.colSpan===void 0&&(f.colSpan=f.width==="full"?$.columns||2:1)})});let r={type:null,sIdx:null,fIdx:null},c=null,o=(s==null?void 0:s.name)||"",d=(s==null?void 0:s.description)||"";function u($,f){let T=[],C=0;for(let J of $){let L=Math.min(J.colSpan||1,f);J.type==="blank"&&(L=Math.min(J.colSpan,f-C),L<=0)||(C+L>f&&(f-C>0&&T.push({id:at("blk"),type:"blank",colSpan:f-C}),C=0),J.colSpan=L,T.push(J),C+=L,C===f&&(C=0))}for(C>0&&T.push({id:at("blk"),type:"blank",colSpan:f-C});T.length>0;){const J=T[T.length-1];if(J.type==="blank"&&J.colSpan===f)T.pop();else break}T.push({id:at("blk"),type:"blank",colSpan:f});let z=[];C=0;for(let J=0;J<T.length;J++){const L=T[J];if(z.length>0){const j=z[z.length-1];if(j.type==="blank"&&L.type==="blank"&&C+L.colSpan<=f){j.colSpan+=L.colSpan,C+=L.colSpan,C===f&&(C=0);continue}}z.push(L),C+=L.colSpan,C===f&&(C=0)}return z}function g(){const $=e.querySelector("#fb2-canvas"),f=e.querySelector(".fb2-right"),T=$?$.scrollTop:0,C=f?f.scrollTop:0;n.forEach(L=>{L.isSpacer||(L.fields=u(L.fields||[],L.columns||1))}),e.innerHTML=`
      ${N()}
      <div class="fb2-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-ghost btn-icon" id="fb2-back"><span class="material-icons-outlined">arrow_back</span></button>
          <h1 style="margin:0">${t?"Edit Form Template":"Create Form Template"}</h1>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" id="fb2-cancel">Cancel</button>
          <button class="btn btn-primary" id="fb2-save"><span class="material-icons-outlined">save</span> Save Template</button>
        </div>
      </div>
      <div class="fb2-body">
        <div class="fb2-left">
          <div class="fb2-meta">
            <div class="form-group" style="margin:0;flex:1">
              <label class="form-label">Form Name <span style="color:var(--color-danger)">*</span></label>
              <input class="form-input" id="fb2-name" value="${v(o)}" placeholder="e.g. Daily Safety Audit" />
            </div>
            <div class="form-group" style="margin:0;flex:1">
              <label class="form-label">Description</label>
              <input class="form-input" id="fb2-desc" value="${v(d)}" placeholder="Optional description..." />
            </div>
          </div>
          <div class="fb2-canvas" id="fb2-canvas">
            ${y()}
          </div>
          <div class="fb2-toolbox">
            <span class="fb2-toolbox-label">DRAG TO ADD</span>
            ${Ut.map(L=>`
              <div class="fb2-tool" draggable="true" data-type="${L.type}">
                <span class="material-icons-outlined">${L.icon}</span>
                <span>${L.label}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="fb2-right" id="fb2-sidebar">
          ${p()}
        </div>
      </div>
    `,b();const z=e.querySelector("#fb2-canvas"),J=e.querySelector(".fb2-right");z&&(z.scrollTop=T),J&&(J.scrollTop=C)}function y(){if(!n.length)return`<div class="fb2-empty">
        <span class="material-icons-outlined" style="font-size:48px">dashboard_customize</span>
        <p>Click "Add Section" below to get started</p>
      </div>`;let $="";return n.forEach((f,T)=>{const C=r.type==="section"&&r.sIdx===T,z=f.columns||1;if(f.isSpacer){$+=`
          <div class="fb2-section fb2-spacer-sec ${C?"fb2-sel":""}" data-sidx="${T}">
            <div class="fb2-sec-header" draggable="true" data-sidx="${T}">
              <span class="material-icons-outlined fb2-drag-handle">drag_indicator</span>
              <span style="flex:1;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary)">Layout Spacer</span>
              <button class="btn btn-ghost btn-icon btn-sm fb2-del-sec" data-sidx="${T}" style="color:var(--color-danger)">
                <span class="material-icons-outlined" style="font-size:18px">close</span>
              </button>
            </div>
          </div>`;return}$+=`
        <div class="fb2-section ${C?"fb2-sel":""}" data-sidx="${T}">
          <div class="fb2-sec-header" draggable="true" data-sidx="${T}">
            <span class="material-icons-outlined fb2-drag-handle">drag_indicator</span>
            <input class="fb2-sec-title" value="${v(f.title)}" placeholder="Section title..." data-sidx="${T}" />
            <div class="fb2-col-btns">
              ${[1,2,3].map(J=>`<button class="fb2-col-btn ${z===J?"active":""}" data-sidx="${T}" data-cols="${J}" title="${J} column${J>1?"s":""}">${J}</button>`).join("")}
            </div>
            <button class="btn btn-ghost btn-icon btn-sm fb2-del-sec" data-sidx="${T}" style="color:var(--color-danger)" title="Delete section">
              <span class="material-icons-outlined" style="font-size:18px">close</span>
            </button>
          </div>
          <div class="fb2-fields" data-sidx="${T}" style="grid-template-columns:repeat(${z},1fr)">
            ${f.fields.length?f.fields.map((J,L)=>i(f,T,J,L)).join(""):""}
          </div>
        </div>`}),$+=`
      <div class="fb2-add-row">
        <button class="fb2-add-sec" id="fb2-add-sec"><span class="material-icons-outlined">add</span> Add Section</button>
        <button class="fb2-add-sec fb2-add-sec-alt" id="fb2-add-spacer"><span class="material-icons-outlined">space_bar</span> Add Spacer</button>
      </div>`,$}function i($,f,T,C){const z=Mt(T.type),J=r.type==="field"&&r.sIdx===f&&r.fIdx===C,L=$.columns||1,j=Math.min(T.colSpan||1,L);if(T.type==="blank")return`
        <div class="fb2-field fb2-blank" data-sidx="${f}" data-fidx="${C}" style="grid-column:span ${j};border:2px dashed var(--border-color);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.02);min-height:70px;border-radius:6px;cursor:crosshair;box-shadow:none">
          <span style="color:var(--text-tertiary);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Drop Here</span>
        </div>
      `;const q=T.label||z.label+"...";let A="";return T.type==="text"&&(A='<div class="fb2-prev-input"></div>'),T.type==="textarea"&&(A='<div class="fb2-prev-ta"></div>'),T.type==="checkbox"&&(A=`<div class="fb2-prev-chk"><input type="checkbox" disabled /> <span style="flex:1; word-break: break-word; white-space: pre-wrap;">${v(q)}</span></div>`),T.type==="select"&&(A='<div class="fb2-prev-input" style="display:flex;justify-content:space-between"><span class="material-icons-outlined" style="font-size:16px">expand_more</span></div>'),T.type==="date"&&(A='<div class="fb2-prev-input"><span class="material-icons-outlined" style="font-size:14px">calendar_today</span></div>'),T.type==="signature"&&(A='<div class="fb2-prev-sig">Signature Field</div>'),T.type==="info"&&(A=`<div class="fb2-prev-info"><span class="material-icons-outlined" style="font-size:18px;flex-shrink:0">info</span> <span style="flex:1; word-break: break-word; white-space: pre-wrap;">${v(T.label||"Informational text block").replace(/\n/g,"<br/>")}</span></div>`),T.type==="spacer"&&(A='<div class="fb2-prev-spacer">Spacer</div>'),`
      <div class="fb2-field ${J?"fb2-sel":""}" data-sidx="${f}" data-fidx="${C}" style="grid-column:span ${j}" draggable="true">
        <div class="fb2-field-bar">
          <span class="material-icons-outlined fb2-drag-handle" style="font-size:16px">drag_indicator</span>
          <span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary)">${z.icon}</span>
          <span class="fb2-ftype-lbl">${z.label}</span>
        </div>
        <div style="padding:10px 14px 14px">
          ${T.type!=="info"?`
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between">
              <span class="fb2-lbl" style="word-break: break-word; white-space: pre-wrap;">${v(q)}</span>
              ${T.required?'<span style="color:var(--color-danger);flex-shrink:0;margin-left:8px">*</span>':""}
            </div>
          `:""}
          ${A}
        </div>
      </div>
    `}function p(){var $;if(r.type==="field"){const f=($=n[r.sIdx])==null?void 0:$.fields[r.fIdx];if(!f)return r={type:null},p();const T=Mt(f.type),z=n[r.sIdx].columns||1;return`
        <div class="fb2-sb-head"><span class="material-icons-outlined" style="color:var(--color-primary)">${T.icon}</span><span>${T.label} Properties</span></div>
        <div class="fb2-sb-body">
          ${f.type!=="spacer"?`
            <div class="form-group">
              <label class="form-label">${f.type==="info"?"Information Text":"Label"}</label>
              <textarea class="form-textarea" id="sb-label" rows="${f.type==="info"?4:2}" placeholder="${f.type==="info"?"Informational text...":"Field label..."}">${v(f.label||"")}</textarea>
            </div>
          `:""}
          <div class="form-group">
            <label class="form-label">Field Type</label>
            <select class="form-select" id="sb-type">
              ${Ut.map(J=>`<option value="${J.type}" ${f.type===J.type?"selected":""}>${J.label}</option>`).join("")}
            </select>
          </div>
          ${f.type!=="info"&&f.type!=="spacer"?`
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                <input type="checkbox" id="sb-req" ${f.required?"checked":""} style="width:18px;height:18px" />
                Required field
              </label>
            </div>
          `:""}
          ${z>1?`
            <div class="form-group">
              <label class="form-label">Column Span</label>
              <div class="fb2-col-btns" style="justify-content:flex-start">
                ${Array.from({length:z},(J,L)=>L+1).map(J=>`
                  <button class="fb2-col-btn sb-span-btn ${(f.colSpan||1)===J?"active":""}" data-span="${J}">${J===z?"Full":J}</button>
                `).join("")}
              </div>
            </div>
          `:""}
          ${f.type==="select"?`
            <div class="form-group">
              <label class="form-label">Dropdown Options</label>
              <textarea class="form-textarea" id="sb-opts" rows="4" placeholder="One option per line...">${(f.options||[]).join(`
`)}</textarea>
              <small style="color:var(--text-tertiary);font-size:11px">One option per line</small>
            </div>
          `:""}
          <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" id="sb-del-field" style="color:var(--color-danger);width:100%;justify-content:center">
              <span class="material-icons-outlined" style="font-size:16px">delete</span> Delete Field
            </button>
          </div>
        </div>`}if(r.type==="section"){const f=n[r.sIdx];if(!f)return r={type:null},p();const T=f.columns||1;return`
        <div class="fb2-sb-head"><span class="material-icons-outlined" style="color:var(--color-primary)">view_agenda</span><span>Section Properties</span></div>
        <div class="fb2-sb-body">
          ${f.isSpacer?`
            <div class="form-group">
              <label class="form-label">Spacer Height (px)</label>
              <input type="number" class="form-input" id="sb-spacer-h" value="${parseInt(f.height||"60")}" min="20" max="300" />
            </div>
          `:`
            <div class="form-group">
              <label class="form-label">Section Title</label>
              <input class="form-input" id="sb-sec-title" value="${v(f.title||"")}" placeholder="Section title..." />
            </div>
            <div class="form-group">
              <label class="form-label">Columns</label>
              <div class="fb2-col-btns" style="justify-content:flex-start">
                ${[1,2,3].map(C=>`<button class="fb2-col-btn sb-col-btn ${T===C?"active":""}" data-cols="${C}">${C} Col${C>1?"s":""}</button>`).join("")}
              </div>
            </div>
          `}
          <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" id="sb-del-sec" style="color:var(--color-danger);width:100%;justify-content:center">
              <span class="material-icons-outlined" style="font-size:16px">delete</span> Delete Section
            </button>
          </div>
        </div>`}return`
      <div class="fb2-sb-empty">
        <span class="material-icons-outlined" style="font-size:40px;color:var(--text-tertiary)">touch_app</span>
        <h4 style="margin:12px 0 4px;color:var(--text-secondary)">No Selection</h4>
        <p style="color:var(--text-tertiary);font-size:13px;line-height:1.5">Click a field or section to edit its properties here.<br><br>Drag items from the toolbox to add new fields.</p>
      </div>`}function m(){const $=document.activeElement,f=$==null?void 0:$.id,T=$==null?void 0:$.selectionStart,C=$==null?void 0:$.selectionEnd;if(g(),f){const z=e.querySelector(`#${f}`);if(z){z.focus();try{z.setSelectionRange(T,C)}catch{}}}}function h(){const $=e.querySelector("#fb2-sidebar");$&&($.innerHTML=p(),I())}function b(){var $,f,T,C,z;($=e.querySelector("#fb2-back"))==null||$.addEventListener("click",()=>Y.navigate("/settings?tab=forms")),(f=e.querySelector("#fb2-cancel"))==null||f.addEventListener("click",()=>Y.navigate("/settings?tab=forms")),(T=e.querySelector("#fb2-save"))==null||T.addEventListener("click",M),(C=e.querySelector("#fb2-name"))==null||C.addEventListener("input",J=>o=J.target.value),(z=e.querySelector("#fb2-desc"))==null||z.addEventListener("input",J=>d=J.target.value),w(),I(),x()}function w(){var $,f,T;($=e.querySelector("#fb2-add-sec"))==null||$.addEventListener("click",()=>{n.push({id:at("sec"),title:"New Section",columns:1,fields:[]}),r={type:"section",sIdx:n.length-1},g()}),(f=e.querySelector("#fb2-add-spacer"))==null||f.addEventListener("click",()=>{n.push({id:at("sec"),title:"",isSpacer:!0,width:"full",columns:1,height:"60px",fields:[]}),r={type:"section",sIdx:n.length-1},g()}),e.querySelectorAll(".fb2-field:not(.fb2-blank)").forEach(C=>{C.addEventListener("click",z=>{z.stopPropagation(),r={type:"field",sIdx:+C.dataset.sidx,fIdx:+C.dataset.fidx},g()})}),e.querySelectorAll(".fb2-sec-header").forEach(C=>{C.addEventListener("click",z=>{z.target.closest(".fb2-del-sec")||z.target.closest(".fb2-col-btn")||z.target.classList.contains("fb2-sec-title")||(r={type:"section",sIdx:+C.dataset.sidx},g())})}),e.querySelectorAll(".fb2-sec-title").forEach(C=>{C.addEventListener("input",()=>{n[+C.dataset.sidx].title=C.value;const z=e.querySelector("#sb-sec-title");z&&z!==document.activeElement&&(z.value=C.value)})}),e.querySelectorAll(".fb2-col-btn[data-sidx][data-cols]").forEach(C=>{C.addEventListener("click",z=>{z.stopPropagation();const J=+C.dataset.sidx,L=+C.dataset.cols;n[J].columns=L,n[J].fields.forEach(j=>{(j.colSpan||1)>L&&(j.colSpan=L)}),r={type:"section",sIdx:J},g()})}),e.querySelectorAll(".fb2-del-sec").forEach(C=>{C.addEventListener("click",z=>{z.stopPropagation(),confirm("Delete this section and all its fields?")&&(n.splice(+C.dataset.sidx,1),r={type:null},g())})}),(T=e.querySelector(".fb2-canvas"))==null||T.addEventListener("click",C=>{C.target.closest(".fb2-field")||C.target.closest(".fb2-sec-header")||C.target.closest(".fb2-add-sec")||C.target.closest(".fb2-add-sec-alt")||(r={type:null},h(),e.querySelectorAll(".fb2-sel").forEach(z=>z.classList.remove("fb2-sel")))})}function I(){var T,C,z,J,L,j;const $=e.querySelector("#sb-label");$&&$.addEventListener("input",()=>{if(r.type==="field"){n[r.sIdx].fields[r.fIdx].label=$.value;const q=e.querySelector(`.fb2-field[data-sidx="${r.sIdx}"][data-fidx="${r.fIdx}"] .fb2-lbl`);q&&(q.textContent=$.value||Mt(n[r.sIdx].fields[r.fIdx].type).label+"...")}}),(T=e.querySelector("#sb-type"))==null||T.addEventListener("change",q=>{r.type==="field"&&(n[r.sIdx].fields[r.fIdx].type=q.target.value,g())}),(C=e.querySelector("#sb-req"))==null||C.addEventListener("change",q=>{r.type==="field"&&(n[r.sIdx].fields[r.fIdx].required=q.target.checked,m())}),e.querySelectorAll(".sb-span-btn").forEach(q=>{q.addEventListener("click",()=>{r.type==="field"&&(n[r.sIdx].fields[r.fIdx].colSpan=+q.dataset.span,g())})}),(z=e.querySelector("#sb-opts"))==null||z.addEventListener("input",q=>{r.type==="field"&&(n[r.sIdx].fields[r.fIdx].options=q.target.value.split(`
`).map(A=>A.trim()).filter(Boolean))});const f=e.querySelector("#sb-sec-title");f&&f.addEventListener("input",()=>{if(r.type==="section"){n[r.sIdx].title=f.value;const q=e.querySelector(`.fb2-sec-title[data-sidx="${r.sIdx}"]`);q&&q!==document.activeElement&&(q.value=f.value)}}),e.querySelectorAll(".sb-col-btn").forEach(q=>{q.addEventListener("click",()=>{if(r.type==="section"){const A=+q.dataset.cols;n[r.sIdx].columns=A,n[r.sIdx].fields.forEach(_=>{(_.colSpan||1)>A&&(_.colSpan=A)}),g()}})}),(J=e.querySelector("#sb-spacer-h"))==null||J.addEventListener("input",q=>{r.type==="section"&&(n[r.sIdx].height=q.target.value+"px")}),(L=e.querySelector("#sb-del-field"))==null||L.addEventListener("click",()=>{r.type==="field"&&(n[r.sIdx].fields.splice(r.fIdx,1),r={type:null},g())}),(j=e.querySelector("#sb-del-sec"))==null||j.addEventListener("click",()=>{r.type==="section"&&confirm("Delete this section?")&&(n.splice(r.sIdx,1),r={type:null},g())})}function x(){e.querySelectorAll(".fb2-tool").forEach(f=>{f.addEventListener("dragstart",T=>{const C=f.dataset.type,z=Mt(C);c={action:"add",type:C},T.dataTransfer.effectAllowed="copy",T.dataTransfer.setData("text/plain",C);const J=document.createElement("div");J.style.cssText="position:fixed;top:-999px;padding:10px 16px;background:white;border:2px solid #1B6DE0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;",J.innerHTML=`<span class="material-icons-outlined" style="font-size:18px">${z.icon}</span> ${z.label}`,document.body.appendChild(J),T.dataTransfer.setDragImage(J,80,20),requestAnimationFrame(()=>J.remove()),document.body.classList.add("fb2-dragging")}),f.addEventListener("dragend",D)}),e.querySelectorAll(".fb2-field:not(.fb2-blank)[draggable]").forEach(f=>{f.addEventListener("dragstart",T=>{T.stopPropagation(),c={action:"moveField",sIdx:+f.dataset.sidx,fIdx:+f.dataset.fidx},T.dataTransfer.effectAllowed="move",T.dataTransfer.setData("text/plain","field"),f.classList.add("fb2-dragging-src"),document.body.classList.add("fb2-dragging")}),f.addEventListener("dragend",()=>{f.classList.remove("fb2-dragging-src"),D()})}),e.querySelectorAll(".fb2-sec-header[draggable]").forEach(f=>{f.addEventListener("dragstart",T=>{c={action:"moveSection",sIdx:+f.dataset.sidx},T.dataTransfer.effectAllowed="move",T.dataTransfer.setData("text/plain","section");const C=f.closest(".fb2-section");C&&C.classList.add("fb2-dragging-src"),document.body.classList.add("fb2-dragging")}),f.addEventListener("dragend",()=>{e.querySelectorAll(".fb2-dragging-src").forEach(T=>T.classList.remove("fb2-dragging-src")),D()})}),e.querySelectorAll(".fb2-blank").forEach(f=>{f.addEventListener("dragover",T=>{if(!c||c.action==="moveSection")return;const C=n[+f.dataset.sidx].fields[+f.dataset.fidx].colSpan;if((c.action==="add"?1:n[c.sIdx].fields[c.fIdx].colSpan)>C){T.dataTransfer.dropEffect="none";return}T.preventDefault(),T.stopPropagation(),T.dataTransfer.dropEffect=c.action==="add"?"copy":"move",f.style.borderColor="var(--color-primary)",f.style.background="var(--color-primary-light)"}),f.addEventListener("dragleave",()=>{f.style.borderColor="",f.style.background="rgba(0,0,0,0.02)"}),f.addEventListener("drop",T=>{if(T.preventDefault(),T.stopPropagation(),!c||c.action==="moveSection")return;const C=+f.dataset.sidx,z=+f.dataset.fidx,J=n[C].fields[z].colSpan;if(c.action==="add"){const L={id:at("f"),type:c.type,label:"",required:!1,colSpan:1};L.type==="select"&&(L.options=[]),n[C].fields.splice(z,1,L),J>1&&n[C].fields.splice(z+1,0,{id:at("blk"),type:"blank",colSpan:J-1}),r={type:"field",sIdx:C,fIdx:z}}else if(c.action==="moveField"){const{sIdx:L,fIdx:j}=c,q={...n[L].fields[j]};if(q.colSpan>J)return;n[L].fields[j]={id:at("blk"),type:"blank",colSpan:q.colSpan},n[C].fields.splice(z,1,q),J>q.colSpan&&n[C].fields.splice(z+1,0,{id:at("blk"),type:"blank",colSpan:J-q.colSpan}),r={type:"field",sIdx:C,fIdx:z}}D(),g()})}),e.querySelectorAll(".fb2-field:not(.fb2-blank)").forEach(f=>{f.addEventListener("dragover",T=>{if(!c||c.action!=="moveField")return;const C=n[+f.dataset.sidx].fields[+f.dataset.fidx].colSpan;if(n[c.sIdx].fields[c.fIdx].colSpan!==C){T.dataTransfer.dropEffect="none";return}T.preventDefault(),T.stopPropagation(),T.dataTransfer.dropEffect="move",f.style.boxShadow="0 0 0 2px var(--color-primary)"}),f.addEventListener("dragleave",()=>{f.style.boxShadow=""}),f.addEventListener("drop",T=>{if(T.preventDefault(),T.stopPropagation(),!c||c.action!=="moveField")return;const C=+f.dataset.sidx,z=+f.dataset.fidx,J=c.sIdx,L=c.fIdx,j=n[C].fields[z],q=n[J].fields[L];j.colSpan===q.colSpan&&(n[C].fields[z]=q,n[J].fields[L]=j,r={type:"field",sIdx:C,fIdx:z},D(),g())})});const $=e.querySelector("#fb2-canvas");$&&($.addEventListener("dragover",f=>{c&&c.action==="moveSection"&&(f.preventDefault(),f.dataTransfer.dropEffect="move",k($,E($,f.clientY)))}),$.addEventListener("drop",f=>{if(c&&c.action==="moveSection"){f.preventDefault();let T=E($,f.clientY);const C=c.sIdx,z=n.splice(C,1)[0];C<T&&T--,n.splice(T,0,z),r={type:"section",sIdx:T},D(),g()}}))}function E($,f){const T=$.querySelectorAll(".fb2-section");for(let C=0;C<T.length;C++){const z=T[C].getBoundingClientRect();if(f<z.top+z.height/2)return C}return T.length}function k($,f){S();const T=$.querySelectorAll(".fb2-section");f<T.length?T[f].classList.add("fb2-drop-before"):T.length&&T[T.length-1].classList.add("fb2-drop-after")}function S(){e.querySelectorAll(".fb2-drop-before,.fb2-drop-after").forEach($=>$.classList.remove("fb2-drop-before","fb2-drop-after"))}function D(){c=null,S(),document.body.classList.remove("fb2-dragging")}function M(){var L,j,q;const $=(L=e.querySelector("#fb2-name"))==null?void 0:L.value.trim(),f=(j=e.querySelector("#fb2-desc"))==null?void 0:j.value.trim();if(!$){O("Form name is required","error"),(q=e.querySelector("#fb2-name"))==null||q.focus();return}if(n.reduce((A,_)=>{var H;return A+(((H=_.fields)==null?void 0:H.length)||0)},0)===0){O("Add at least one field","error");return}const C=n.map(A=>{let _=A.fields?[...A.fields]:[];for(;_.length>0;){const H=_[_.length-1];if(H.type==="blank"&&H.colSpan===(A.columns||1))_.pop();else break}return{...A,width:"full",fields:_.map(H=>({...H,width:(H.colSpan||1)>=(A.columns||1)?"full":"half"}))}}),z={id:t?a:at("fmt"),name:$,description:f,sections:C},J=l.getAll("formTemplates");if(t){const A=J.findIndex(_=>_.id===a);A>=0&&(J[A]=z)}else J.push(z);l.save("formTemplates",J),O(`Form "${$}" saved`,"success"),Y.navigate("/settings?tab=forms")}function N(){return`<style>
      .fb2-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px}
      .fb2-body{display:flex;gap:0;height:calc(100vh - var(--topbar-height) - 110px);min-height:500px}
      .fb2-left{flex:1;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border-color);border-radius:12px 0 0 12px;background:var(--content-bg)}
      .fb2-right{width:300px;min-width:280px;border:1px solid var(--border-color);border-left:none;border-radius:0 12px 12px 0;background:var(--card-bg);display:flex;flex-direction:column;overflow-y:auto}
      .fb2-meta{display:flex;gap:16px;padding:16px 20px;border-bottom:1px solid var(--border-color);background:var(--card-bg);flex-shrink:0}
      .fb2-canvas{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px}
      .fb2-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:8px;color:var(--text-tertiary)}

      /* Toolbox */
      .fb2-toolbox{display:flex;align-items:center;gap:8px;padding:12px 20px;border-top:1px solid var(--border-color);background:var(--card-bg);flex-shrink:0;flex-wrap:wrap}
      .fb2-toolbox-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary);margin-right:4px}
      .fb2-tool{display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--card-bg);cursor:grab;font-size:12px;font-weight:500;color:var(--text-secondary);transition:all .15s;user-select:none}
      .fb2-tool:hover{border-color:var(--color-primary);color:var(--color-primary);box-shadow:0 2px 8px rgba(27,109,224,.1)}
      .fb2-tool .material-icons-outlined{font-size:16px}

      /* Sections */
      .fb2-section{flex-shrink:0;border:1px solid var(--border-color);border-radius:10px;background:var(--card-bg);overflow:hidden;transition:border-color .15s,box-shadow .15s}
      .fb2-section.fb2-sel{border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(27,109,224,.12)}
      .fb2-section.fb2-dragging-src{opacity:.35}
      .fb2-spacer-sec{border-style:dashed;background:transparent;min-height:50px}
      .fb2-sec-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--content-bg);border-bottom:1px solid var(--border-color);cursor:pointer}
      .fb2-drag-handle{color:var(--text-tertiary);cursor:grab}
      .fb2-drag-handle:hover{color:var(--text-primary)}
      .fb2-sec-title{flex:1;border:none;background:transparent;font-weight:600;font-size:14px;color:var(--text-primary);outline:none;padding:4px 8px;border-radius:4px}
      .fb2-sec-title:focus{background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-color)}
      .fb2-col-btns{display:flex;gap:2px}
      .fb2-col-btn{width:32px;height:28px;border:1px solid var(--border-color);background:var(--card-bg);border-radius:4px;font-size:12px;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all .15s}
      .fb2-col-btn:hover{border-color:var(--color-primary);color:var(--color-primary)}
      .fb2-col-btn.active{background:var(--color-primary);color:white;border-color:var(--color-primary)}

      /* Field grid */
      .fb2-fields{display:grid;gap:10px;padding:14px;min-height:60px}
      .fb2-field-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:24px;border:2px dashed var(--border-color);border-radius:8px;color:var(--text-tertiary);font-size:12px;transition:all .15s}

      /* Field cards */
      .fb2-field{background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;cursor:pointer;transition:all .15s;overflow:hidden;position:relative;user-select:none}
      .fb2-field:hover{border-color:var(--color-primary);box-shadow:0 2px 8px rgba(0,0,0,.06)}
      .fb2-field.fb2-sel{border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(27,109,224,.12)}
      .fb2-field.fb2-dragging-src{opacity:.25}
      .fb2-field-bar{display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--content-bg);border-bottom:1px solid var(--border-color)}
      .fb2-ftype-lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text-tertiary)}

      /* Previews */
      .fb2-prev-input{padding:8px 10px;margin:8px;border:1px solid var(--border-color);border-radius:4px;font-size:12px;color:var(--text-tertiary);background:var(--content-bg)}
      .fb2-prev-ta{padding:8px 10px;margin:8px;border:1px solid var(--border-color);border-radius:4px;font-size:12px;color:var(--text-tertiary);background:var(--content-bg);min-height:48px}
      .fb2-prev-chk{padding:8px 10px;margin:8px;display:flex;align-items:flex-start;gap:6px;font-size:12px;color:var(--text-secondary)}
      .fb2-prev-chk input {margin-top:2px;}
      .fb2-prev-sig{padding:12px 10px;margin:8px;border:1px dashed var(--border-color);border-radius:4px;font-size:12px;color:var(--text-tertiary);text-align:center;font-style:italic}
      .fb2-prev-info{padding:8px 10px;margin:8px;background:var(--color-primary-light);border-radius:4px;font-size:12px;color:var(--color-primary-dark);display:flex;align-items:flex-start;gap:6px;line-height:1.4}
      .fb2-prev-spacer{padding:12px 10px;margin:8px;border:2px dashed var(--border-color);border-radius:4px;font-size:11px;color:var(--text-tertiary);text-align:center;text-transform:uppercase;letter-spacing:1px}

      /* Sidebar */
      .fb2-sb-head{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border-color);font-weight:600;font-size:14px}
      .fb2-sb-body{padding:20px;display:flex;flex-direction:column;gap:16px}
      .fb2-sb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;flex:1}

      /* Add section */
      .fb2-add-row{display:flex;gap:8px;justify-content:center;flex-shrink:0}
      .fb2-add-sec{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 24px;border:2px dashed var(--border-color);border-radius:10px;background:transparent;color:var(--text-tertiary);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;flex:1}
      .fb2-add-sec:hover{border-color:var(--color-primary);color:var(--color-primary);background:rgba(27,109,224,.03)}
      .fb2-add-sec-alt{border-style:dotted}

      /* Drop indicators */
      .fb2-drop-before{border-top:3px solid var(--color-primary)!important}
      .fb2-drop-after{border-bottom:3px solid var(--color-primary)!important}

      /* Drag global state */
      body.fb2-dragging .fb2-fields{min-height:80px}
      body.fb2-dragging .fb2-field-empty{border-color:var(--color-primary);background:var(--color-primary-light)}
    </style>`}g()}const Zs=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function eo(e,a){if(e.role==="admin"||e.role==="manager")return"/";if(!e.userTypeId)return"/schedule";const t=a.getById("userTypes",e.userTypeId);if(!t||!t.permissions)return"/schedule";for(const{path:s,module:n}of Zs){const r=t.permissions.find(c=>c.module===n);if(r&&(r.view||r.create||r.edit||r.delete))return s}return"/schedule"}function to(e){var d;const a=document.querySelector(".sidebar"),t=document.querySelector(".topbar"),s=document.getElementById("breadcrumb");a&&(a.style.display="none"),t&&(t.style.display="none"),s&&(s.style.display="none");const n=l.getAll("technicians").filter(u=>!u.deactivated),r=l.getAll("userTypes");e.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">FieldForge</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${n.map(u=>{const g=r.find(y=>y.id===u.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${u.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${u.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${g?g.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${n.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const c=async u=>{const g=n.find(b=>b.id===u),y=r.find(b=>b.id===(g==null?void 0:g.userTypeId));let i="technician";if(y){const b=y.name.toLowerCase();b.includes("admin")?i="admin":b.includes("manager")?i="manager":b.includes("office")&&(i="office")}const p={id:g.id,name:g.name,role:i,userTypeName:y?y.name:"Unassigned",userTypeId:g.userTypeId,color:g.color};localStorage.setItem("currentUser",JSON.stringify(p)),a&&(a.style.display=""),t&&(t.style.display=""),s&&(s.style.display=""),me(async()=>{const{updateSidebarAccess:b}=await Promise.resolve().then(()=>pa);return{updateSidebarAccess:b}},void 0).then(({updateSidebarAccess:b})=>{b&&b()}),me(async()=>{const{updateTopbarAccess:b}=await Promise.resolve().then(()=>ua);return{updateTopbarAccess:b}},void 0).then(({updateTopbarAccess:b})=>{b&&b()});const{store:m}=await me(async()=>{const{store:b}=await Promise.resolve().then(()=>Ga);return{store:b}},void 0),h=eo(p,m);Y.navigate(h)};e.querySelectorAll(".btn-login-user").forEach(u=>{u.addEventListener("click",g=>{const y=g.target.closest(".btn-login-user");c(y.dataset.id)})});const o=()=>{const u={id:"customer-user",name:"Customer User",role:"customer"},g=l.get("people").filter(y=>y.type==="Customer");g.length>0&&(u.customerId=g[0].id,u.name=g[0].firstName+" "+g[0].lastName),localStorage.setItem("currentUser",JSON.stringify(u)),a&&(a.style.display=""),t&&(t.style.display=""),s&&(s.style.display=""),me(async()=>{const{updateSidebarAccess:y}=await Promise.resolve().then(()=>pa);return{updateSidebarAccess:y}},void 0).then(({updateSidebarAccess:y})=>{y&&y()}),me(async()=>{const{updateTopbarAccess:y}=await Promise.resolve().then(()=>ua);return{updateTopbarAccess:y}},void 0).then(({updateTopbarAccess:y})=>{y&&y()}),Y.navigate("/portal")};(d=e.querySelector("#btn-login-customer"))==null||d.addEventListener("click",o)}function sa(e){const a=JSON.parse(localStorage.getItem("currentUser")||"{}"),t=a.customerId;if(a.role!=="customer"||!t){e.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const s=l.getAll("jobs").filter(u=>u.customerId===t),n=l.getAll("quotes").filter(u=>u.customerId===t),r=l.getAll("invoices").filter(u=>u.customerId===t);e.innerHTML=`
    <div class="page-header" style="background:var(--bg-surface); padding:20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1 style="margin:0;">Customer Portal</h1>
        <p style="margin:5px 0 0 0; color:var(--text-secondary);">Welcome back, ${a.name}</p>
      </div>
      <button class="btn btn-outline" id="portal-logout-btn">Log Out</button>
    </div>

    <div class="page-content" style="padding:20px; max-width:1200px; margin:0 auto;">

      <!-- Quotes Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Quotes</h2>
        ${n.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${n.map(u=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${u.number} - ${u.title||"Quote"}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(u.total||0).toFixed(2)} | Status: <span class="badge ${u.status==="Approved"?"badge-success":"badge-neutral"}">${u.status}</span></div>
                </div>
                <div>
                  ${u.status!=="Approved"?`<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${u.id}">Approve</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Jobs Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Jobs</h2>
        ${s.length===0?'<p style="color:var(--text-tertiary);">No jobs found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${s.map(u=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${u.number} - ${u.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${u.status}</span></div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Invoices Section -->
      <div style="margin-bottom: 40px;">
        <h2 style="margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Your Invoices</h2>
        ${r.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${r.map(u=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${u.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(u.total||0).toFixed(2)} | Status: <span class="badge ${u.status==="Paid"?"badge-success":"badge-danger"}">${u.status}</span></div>
                </div>
                <div>
                  ${u.status!=="Paid"?`<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${u.id}">Pay Now</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;const c=e.querySelector("#portal-logout-btn");c&&c.addEventListener("click",()=>{localStorage.removeItem("currentUser"),me(async()=>{const{router:u}=await Promise.resolve().then(()=>Qa);return{router:u}},void 0).then(({router:u})=>{u.navigate("/login")})}),e.querySelectorAll(".btn-approve-quote").forEach(u=>{u.addEventListener("click",g=>{const y=g.target.dataset.id;l.update("quotes",y,{status:"Approved"}),alert("Quote approved successfully!"),sa(e)})}),e.querySelectorAll(".btn-pay-invoice").forEach(u=>{u.addEventListener("click",g=>{const y=g.target.dataset.id;l.update("invoices",y,{status:"Paid"}),alert("Invoice paid successfully!"),sa(e)})})}const ao=["Public Liability Insurance","Workers Compensation"];function na(e){if(!e.expiryDate)return{status:"missing",label:"Missing Date",colorClass:"badge-neutral"};const a=new Date;a.setHours(0,0,0,0);const t=new Date(e.expiryDate);t.setHours(0,0,0,0);const s=t.getTime()-a.getTime(),n=Math.ceil(s/(1e3*60*60*24));return n<0?{status:"expired",label:"Expired",colorClass:"badge-danger"}:n<=30?{status:"expiring",label:`Expiring (${n}d)`,colorClass:"badge-warning"}:e.verified?{status:"active",label:"Active",colorClass:"badge-success"}:{status:"unverified",label:"Pending Verification",colorClass:"badge-neutral"}}function $t(e){if(!e.active)return{status:"inactive",label:"Inactive",badgeClass:"badge-neutral"};const a=e.complianceDocs||[];if(a.length===0)return{status:"non-compliant",label:"Missing Docs",badgeClass:"badge-danger"};const t=a.map(o=>o.type.toLowerCase().trim()),s=ao.filter(o=>!t.some(d=>d.includes(o.toLowerCase())));if(s.length>0)return{status:"non-compliant",label:"Missing critical docs",badgeClass:"badge-danger",reason:`Missing: ${s.join(", ")}`};let n=!1,r=!1,c=!1;return a.forEach(o=>{const d=na(o);d.status==="expired"?n=!0:d.status==="expiring"?r=!0:d.status==="unverified"&&(c=!0)}),n?{status:"non-compliant",label:"Expired Credentials",badgeClass:"badge-danger"}:r?{status:"warning",label:"Expiring Credentials",badgeClass:"badge-warning"}:c?{status:"warning",label:"Pending Review",badgeClass:"badge-warning"}:{status:"compliant",label:"Compliant",badgeClass:"badge-success"}}function so(e,a){const t=a.token,n=l.getAll("contractors").find($=>$.portalToken===t);if(!n){e.innerHTML=`
      <div style="max-width: 500px; margin: 80px auto; padding: 40px; text-align: center; background: var(--card-bg); border-radius: var(--border-radius-lg); box-shadow: var(--shadow-lg); border: 1px solid var(--border-color);">
        <span class="material-icons-outlined text-danger" style="font-size: 64px; margin-bottom: 20px;">gpp_maybe</span>
        <h2 style="font-size: var(--font-size-3xl); margin-bottom: 12px; color: var(--text-primary);">Invalid Access Link</h2>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; font-size: var(--font-size-lg);">
          This secure subcontractor portal link is invalid or has expired. Please verify your portal URL or contact the operations office for assistance.
        </p>
        <a href="#/login" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
          <span class="material-icons-outlined">login</span> Go to Login
        </a>
      </div>
    `;return}let r="jobs",c=null,o="",d="all",u=null,g="";const y=new Set,i=new Map;function p(){const $=l.getAll("jobs"),f=[];return $.forEach(T=>{let C=T.contractorId===n.id;const z=[];function J(L){L&&L.forEach(j=>{((j.assignedContractorIds||[]).includes(n.id)||j.assignedContractorId===n.id)&&(C=!0,z.push(j)),j.subTasks&&J(j.subTasks)})}T.tasks&&J(T.tasks),C&&f.push({job:T,assignedTasks:z})}),f}function m($,f){if(f.length<=1)return;const T=f.slice(0,-1);let C=$[T[0]];for(let z=1;z<T.length;z++)C=C.subTasks[T[z]];if(C&&C.subTasks&&C.subTasks.length>0){let z=0,J=0;C.subTasks.forEach(L=>{const j=(parseFloat(L.estimatedHours)||1)*(parseInt(L.people)||1);z+=j,J+=j*((L.progress||0)/100)}),C.progress=z>0?Math.round(J/z*100):0,C.progress===100?C.status="Completed":C.progress>0?C.status="In Progress":C.status="Not Started",m($,T)}}function h($,f){if(!$||f.length===0)return null;let T=$[f[0]];for(let C=1;C<f.length;C++){if(!T.subTasks)return null;T=T.subTasks[f[C]]}return T}function b($,f,T){const z=l.getAll("jobs").find(q=>q.id===$);if(!z||!z.tasks)return;const J=f.split("-").map(Number),L=h(z.tasks,J);if(!L)return;if(L.progress=T,T===100?L.status="Completed":T>0?L.status="In Progress":L.status="Not Started",m(z.tasks,J),z.tasks.length>0){const q=z.tasks.length;z.tasks.filter(H=>H.status==="Completed").length;let A=0;z.tasks.forEach(H=>A+=H.progress||0);const _=Math.round(A/q);_===100&&z.status!=="Completed"&&z.status!=="Invoiced"?z.status="Completed":_>0&&z.status==="Pending"&&(z.status="In Progress")}l.update("jobs",$,{tasks:z.tasks,status:z.status});const j=document.getElementById("sync-indicator-"+$);j&&(j.style.opacity="1",setTimeout(()=>{j.style.opacity="0"},1e3))}function w(){const $=p(),f=$t(n),T=$.length;let C=0,z=0;$.forEach(A=>{function _(H){H&&H.forEach(R=>{((R.assignedContractorIds||[]).includes(n.id)||R.assignedContractorId===n.id)&&(R.status==="Completed"||R.progress===100?z++:C++),R.subTasks&&_(R.subTasks)})}_(A.job.tasks)});const L=l.getSettings().name||"FieldForge CRM",j=JSON.parse(localStorage.getItem("currentUser")||"null"),q=j&&j.role!=="customer";e.innerHTML=`
      <style>
        .portal-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          font-family: var(--font-family);
          color: var(--text-primary);
        }
        
        .portal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          color: #ffffff;
          padding: 24px 32px;
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        
        .portal-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(27,109,224,0.15) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
        }

        .portal-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .portal-header p {
          margin: 4px 0 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .portal-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }

        .kpi-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          padding: 16px;
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .kpi-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-value {
          font-size: 20px;
          font-weight: 700;
          line-height: 1.2;
        }

        .kpi-label {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .b2b-banner {
          background: linear-gradient(135deg, rgba(27,109,224,0.08), rgba(27,109,224,0.02));
          border: 1px solid var(--color-primary-light);
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          animation: pulse 3s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { border-color: var(--color-primary-light); }
          50% { border-color: rgba(27,109,224,0.4); }
        }

        .tabs-nav {
          display: flex;
          border-bottom: 2px solid var(--border-color);
          margin-bottom: 24px;
          gap: 16px;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 12px 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          position: relative;
          transition: color 0.15s;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--color-primary);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-primary);
          border-radius: 2px;
        }

        /* --- Custom Checkbox Styling --- */
        .custom-chk-label {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          gap: 8px;
        }

        .custom-chk {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          height: 18px;
          width: 18px;
          background-color: var(--content-bg);
          border: 1px solid var(--border-color-dark);
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, border-color 0.15s;
        }

        .custom-chk:checked ~ .checkmark {
          background-color: var(--color-success);
          border-color: var(--color-success);
        }

        .checkmark::after {
          content: "";
          display: none;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg) translate(-1px, -1px);
        }

        .custom-chk:checked ~ .checkmark::after {
          display: block;
        }



        /* --- Accordion Job Card --- */
        .job-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .job-card:hover {
          border-color: var(--border-color-dark);
        }

        .job-card-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          user-select: none;
          background: var(--card-bg);
        }

        .job-card-header:hover {
          background: #fafafa;
        }

        .job-card-body {
          border-top: 1px solid var(--border-color);
          padding: 20px;
          background: #fdfdfd;
        }

        .timeline {
          position: relative;
          padding-left: 20px;
          border-left: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 12px;
        }

        .timeline-item {
          position: relative;
        }

        .timeline-item::before {
          content: '';
          position: absolute;
          left: -25px;
          top: 4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--border-color-dark);
          border: 2px solid var(--card-bg);
        }

        .timeline-item.subcontractor::before {
          background: var(--color-primary);
        }

        .drag-drop-zone {
          border: 2px dashed var(--border-color-dark);
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          background: var(--content-bg);
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .drag-drop-zone:hover {
          border-color: var(--color-primary);
          background-color: var(--color-primary-light);
        }
      </style>

      <div class="portal-container">
        
        <!-- B2B Staff Import Banner -->
        ${q?`
          <div class="b2b-banner">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="material-icons-outlined text-primary" style="font-size: 28px;">sync_alt</span>
              <div>
                <strong style="font-size:13px; color: var(--text-primary)">B2B Integration Detected</strong>
                <p style="margin: 2px 0 0 0; font-size:11px; color: var(--text-secondary)">
                  You are logged into ${L} as <strong>${j.name}</strong>. You can copy this dispatch details directly into your local database!
                </p>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-b2b-import" style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
              <span class="material-icons-outlined" style="font-size:16px;">library_add</span> Import Dispatch to Jobs
            </button>
          </div>
        `:""}

        <!-- Portal Header -->
        <div class="portal-header">
          <div>
            <h1>${v(n.businessName)}</h1>
            <p>FieldForge dispatch & subcontractor portal | Contact: ${v(n.contactName)}</p>
          </div>
          <div style="font-size: 11px; padding: 6px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; border: 1px solid rgba(255,255,255,0.12)">
            System Agency ID: <strong style="font-family:monospace; color:#38bdf8">${n.id}</strong>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;">
              <span class="material-icons-outlined">business_center</span>
            </div>
            <div>
              <div class="kpi-value">${T}</div>
              <div class="kpi-label">Active Jobs</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#fffbeb; color:#f59e0b;">
              <span class="material-icons-outlined">pending_actions</span>
            </div>
            <div>
              <div class="kpi-value">${C}</div>
              <div class="kpi-label">Pending Tasks</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#ecfdf5; color:#10b981;">
              <span class="material-icons-outlined">task_alt</span>
            </div>
            <div>
              <div class="kpi-value">${z}</div>
              <div class="kpi-label">Completed Tasks</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="${f.status==="compliant"?"background:#ecfdf5; color:#10b981;":"background:#fef2f2; color:#ef4444;"}">
              <span class="material-icons-outlined">${f.status==="compliant"?"verified":"gpp_maybe"}</span>
            </div>
            <div>
              <div class="kpi-value" style="font-size: 13px;">${f.label}</div>
              <div class="kpi-label">Compliance Status</div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button class="tab-btn ${r==="jobs"?"active":""}" data-tab="jobs">Jobs Allocation & Tasks</button>
          <button class="tab-btn ${r==="compliance"?"active":""}" data-tab="compliance">Compliance Registry (${(n.complianceDocs||[]).length})</button>
        </div>

        <!-- Tab Content -->
        <div id="portal-tab-content">
          ${r==="jobs"?I($):E()}
        </div>

      </div>
    `,k()}function I($){let f=$;if(d!=="all"&&(f=f.filter(T=>d==="pending"?T.job.status==="Pending":d==="inprogress"?T.job.status==="In Progress":d==="completed"?["Completed","Invoiced"].includes(T.job.status):!0)),o){const T=o.toLowerCase();f=f.filter(C=>C.job.number.toLowerCase().includes(T)||C.job.title.toLowerCase().includes(T)||C.job.siteAddress.toLowerCase().includes(T))}return`
      <!-- Filters and Search Bar -->
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:250px;">
          <span class="material-icons-outlined text-secondary">search</span>
          <input type="text" id="job-search-input" class="form-input" style="flex:1;" placeholder="Search jobs by number, title, or address..." value="${v(o)}" />
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:11px; text-transform:uppercase; font-weight:600; color:var(--text-secondary);">Status Filter</span>
          <select id="job-status-filter" class="form-select" style="min-width:140px; height: 32px; padding: 2px 8px;">
            <option value="all" ${d==="all"?"selected":""}>All Dispatches</option>
            <option value="pending" ${d==="pending"?"selected":""}>Pending</option>
            <option value="inprogress" ${d==="inprogress"?"selected":""}>In Progress</option>
            <option value="completed" ${d==="completed"?"selected":""}>Completed</option>
          </select>
        </div>
      </div>

      <!-- Jobs Accordion -->
      ${f.length===0?`
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:48px; text-align:center; color:var(--text-tertiary);">
          <span class="material-icons-outlined" style="font-size:48px; margin-bottom:12px;">work_off</span>
          <h3>No assigned jobs found matching filters</h3>
          <p style="margin-top:4px; font-size:12px;">Ensure tasks are allocated to ${v(n.businessName)} in the FieldForge CRM.</p>
        </div>
      `:`
        <div style="display:flex; flex-direction:column;">
          ${f.map(T=>{const C=T.job.id===c,z={Urgent:"background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2;",High:"background: #fffbeb; color: #d97706; border: 1px solid #fef3c7;",Medium:"background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe;",Low:"background: #f8fafc; color: #64748b; border: 1px solid #f1f5f9;"},J={Pending:"badge-neutral",Scheduled:"badge-neutral","In Progress":"badge-primary","On Hold":"badge-warning",Completed:"badge-success",Invoiced:"badge-success"};return`
              <div class="job-card" id="job-card-${T.job.id}">
                <div class="job-card-header" data-id="${T.job.id}">
                  <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="font-bold" style="font-size:13px; color:var(--color-primary);">${v(T.job.number)}</span>
                      <h3 style="font-size:13px; margin:0;">${v(T.job.title)}</h3>
                      <span class="badge ${J[T.job.status]||"badge-neutral"}" style="margin:0">${v(T.job.status)}</span>
                      <span class="badge" style="${z[T.job.priority]||""}; margin:0; font-size:10px; padding: 1px 6px;">${v(T.job.priority||"Medium")}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:16px; font-size:11px; color:var(--text-secondary); margin-top:2px;">
                      <span style="display:flex; align-items:center; gap:4px;"><span class="material-icons-outlined" style="font-size:13px;">place</span> ${v(T.job.siteAddress)}</span>
                      <span>Scheduled: ${T.job.scheduledDate?new Date(T.job.scheduledDate).toLocaleDateString("en-AU"):"—"}</span>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <!-- Realtime sync tick feedback -->
                    <span id="sync-indicator-${T.job.id}" class="text-success" style="opacity:0; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; transition:opacity 0.2s;">
                      <span class="material-icons-outlined" style="font-size:14px;">cloud_done</span> Synced
                    </span>
                    <span class="material-icons-outlined text-secondary" style="font-size:24px; transition: transform 0.2s; ${C?"transform: rotate(180deg)":""}">expand_more</span>
                  </div>
                </div>

                ${C?`
                  <div class="job-card-body">
                    <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px;">
                      
                      <!-- Tasks Checklist Panel -->
                      <div>
                        <h4 style="margin-bottom:12px; font-size:13px; display:flex; align-items:center; gap:6px;">
                          <span class="material-icons-outlined text-primary">assignment_turned_in</span>
                          Allocated Tasklist & Completion Progress
                        </h4>
                        
                        <div style="background:var(--content-bg); border:1px solid var(--border-color); border-radius:6px; padding:16px; display:flex; flex-direction:column; gap:12px;">
                          ${x(T.job.tasks,T.job,[])}
                        </div>
                      </div>

                      <!-- Job Timeline and Activity Panel -->
                      <div>
                        <h4 style="margin-bottom:12px; font-size:13px; display:flex; align-items:center; gap:6px;">
                          <span class="material-icons-outlined text-primary">history</span>
                          Activity
                        </h4>

                        <!-- Note submission box -->
                        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                          <textarea id="comment-input-${T.job.id}" class="form-input" rows="2" style="font-size:12px;" placeholder="Post a comment or activity update..."></textarea>
                          
                          <!-- Staged images preview -->
                          ${(()=>{const L=i.get(T.job.id)||[];return L.length===0?"":`
                              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                                ${L.map((j,q)=>`
                                  <div style="display:flex; align-items:center; background:var(--content-bg); padding:2px 6px; border-radius:4px; font-size:11px; border:1px solid var(--border-color); gap:4px;">
                                    ${j.type&&j.type.startsWith("image/")?`<img src="${j.data}" style="width:20px; height:20px; object-fit:cover; border-radius:2px;" />`:'<span class="material-icons-outlined" style="font-size:14px; color:var(--text-secondary);">insert_drive_file</span>'}
                                    <span class="truncate" style="max-width:80px;">${v(j.name)}</span>
                                    <span class="material-icons-outlined text-danger btn-remove-comment-staged" data-job-id="${T.job.id}" data-idx="${q}" style="font-size:12px; cursor:pointer;">close</span>
                                  </div>
                                `).join("")}
                              </div>
                            `})()}

                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label class="btn btn-secondary btn-sm" for="comment-upload-${T.job.id}" style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:11px; padding:4px 8px;">
                              <span class="material-icons-outlined" style="font-size:14px;">photo_camera</span> Attach Image
                              <input type="file" id="comment-upload-${T.job.id}" class="comment-file-input" data-job-id="${T.job.id}" style="display:none;" multiple accept="image/*" />
                            </label>
                            
                            <button class="btn btn-primary btn-sm btn-post-comment" data-job-id="${T.job.id}" style="display:flex; align-items:center; gap:6px;">
                              <span class="material-icons-outlined" style="font-size:14px;">send</span> Post Update
                            </button>
                          </div>
                        </div>

                        <!-- Notes Feed -->
                        <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; padding:12px; background:var(--card-bg);">
                          <div class="timeline">
                            ${(T.job.activityLog||[]).length===0?`
                              <div style="text-align:center; padding:12px; color:var(--text-tertiary); font-size:11px;">No activity history on this job.</div>
                            `:(T.job.activityLog||[]).map(L=>`
                                <div class="timeline-item ${L.content.startsWith("[Subcontractor")?"subcontractor":""}">
                                  <div style="font-size:11px; font-weight:600; display:flex; justify-content:space-between;">
                                    <span>${v(L.content.split(": ")[0]||"System Note")}</span>
                                    <span class="text-tertiary" style="font-weight:400;">${new Date(L.date).toLocaleDateString("en-AU",{hour:"2-digit",minute:"2-digit"})}</span>
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-top:3px; line-height:1.4;">
                                    ${v(L.content.split(": ").slice(1).join(": ")||L.content)}
                                  </div>
                                  ${L.files&&L.files.length?`
                                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                                      ${L.files.map(q=>`
                                          <div style="display:flex; align-items:center; gap:6px; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; background:var(--card-bg); font-size:10px; max-width:100%;">
                                            ${q.type&&q.type.startsWith("image/")?`<a href="${v(q.data)}" target="_blank" style="display:block;"><img src="${v(q.data)}" style="width:30px; height:30px; object-fit:cover; border-radius:3px;" /></a>`:'<span class="material-icons-outlined" style="font-size:18px; color:var(--text-tertiary);">description</span>'}
                                            <div style="overflow:hidden; text-align:left;">
                                              <div class="truncate" style="font-weight:500; max-width:120px;" title="${v(q.name)}">${v(q.name)}</div>
                                              <div class="text-secondary" style="font-size:8px;">${(q.size/1024).toFixed(1)} KB</div>
                                            </div>
                                          </div>
                                        `).join("")}
                                    </div>
                                  `:""}
                                </div>
                              `).join("")}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                `:""}
              </div>
            `}).join("")}
        </div>
      `}
    `}function x($,f,T,C=!1){if(!$||$.length===0)return'<div class="text-secondary" style="font-size:11px">No tasks defined</div>';const z=f&&f.contractorId===n.id,J=f?f.id:"";function L(q){return!q.subTasks||q.subTasks.length===0?!1:q.subTasks.some(A=>(A.assignedContractorIds||[]).includes(n.id)||A.assignedContractorId===n.id||L(A))}const j=$.map((q,A)=>({t:q,idx:A})).filter(({t:q})=>{const A=(q.assignedContractorIds||[]).includes(n.id)||q.assignedContractorId===n.id;return z||A||C?!0:L(q)});return j.length===0?T.length===0?'<div class="text-secondary" style="font-size:11px">No tasks allocated to your company</div>':"":j.map(({t:q,idx:A})=>{const _=[...T,A],H=_.join("-"),R=T.length*12,V=(q.assignedContractorIds||[]).includes(n.id)||q.assignedContractorId===n.id,se=z||V||C,U=q.subTasks&&q.subTasks.length>0,P=y.has(`${J}-${H}`),Z=q.description||`Standard operational procedures, verification checks, and safety guidelines for "${q.name}".`;return`
        <div style="padding-left: ${R}px; border-left: ${_.length>1?"1px dashed var(--border-color-dark)":"none"}; margin-left: ${_.length>1?"8px":"0"}; padding-top: 4px; padding-bottom: 4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding: 6px 10px; background:var(--card-bg); border-radius:4px; border:1px solid ${se?"rgba(27,109,224,0.15)":"var(--border-color)"};">
            
            <div class="task-info-col" style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:180px;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${se?`
                  <span class="material-icons-outlined text-primary" style="font-size:16px;" title="Assigned to your company">engineering</span>
                `:""}
                
                <span class="font-medium task-name-clickable" data-job-id="${J}" data-path="${H}" style="font-size:12px; cursor: pointer; ${se?"font-weight:600; color:var(--color-primary-dark)":""}" title="Click to show/hide description">
                  ${v(q.name)}
                </span>
                
                ${q.estimatedHours?`
                  <span style="font-size:10px; color:var(--text-tertiary); background:var(--content-bg); padding:1px 4px; border-radius:3px;">${q.estimatedHours}h</span>
                `:""}

                <span class="material-icons-outlined btn-toggle-desc text-tertiary" data-job-id="${J}" data-path="${H}" style="font-size:14px; cursor:pointer;" title="Toggle description">
                  ${P?"info":"info_outline"}
                </span>
              </div>
              <div class="task-desc-container" style="font-size:11px; color:var(--text-secondary); line-height:1.4; padding-left: ${se?"24px":"0px"}; font-style: italic; max-height: ${P?"200px":"0px"}; overflow: hidden; transition: max-height 0.2s ease-in-out; margin-top: ${P?"4px":"0px"};">
                ${v(Z)}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <!-- Interactive elements for subcontractor tasks, or read-only if not their task -->
              ${U?`
                <!-- Parent node: display progress badge, non-editable directly -->
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:10px; font-weight:700; margin:0;">${q.progress||0}%</span>
                  <span class="badge badge-neutral" style="font-size:10px; margin:0;">${v(q.status||"Not Started")}</span>
                </div>
              `:`
                <!-- Leaf node: checkbox toggle only (no slider) -->
                <div style="display:flex; align-items:center; gap:12px;">
                  <span class="badge ${q.progress===100?"badge-success":q.progress>0?"badge-primary":"badge-neutral"}" style="font-size:10px; margin:0; min-width: 80px; text-align: center;">
                    ${q.progress===100?"Completed":q.progress>0?`${q.progress}% Progress`:"Not Started"}
                  </span>
                  
                  <label class="custom-chk-label" style="margin: 0; display: inline-flex;">
                    <input type="checkbox" class="custom-chk task-checkbox" data-job-id="${J}" data-path="${H}" ${q.progress===100?"checked":""} ${se?"":"disabled"} />
                    <span class="checkmark"></span>
                  </label>
                </div>
              `}
            </div>

          </div>

          <!-- Recurse children -->
          ${U?`
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
              ${x(q.subTasks,f,_,se)}
            </div>
          `:""}
        </div>
      `}).join("")}function E(){const $=n.complianceDocs||[];return`
      <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px; align-items: start;">
        
        <!-- Credentials Table -->
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0;">Active Licenses & Insurances</h4>
          </div>
          <div class="card-body" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Credential Name</th>
                  <th>License / Policy No.</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${$.map(f=>{const T=na(f);return`
                    <tr>
                      <td class="font-medium">
                        <div>${v(f.type)}</div>
                        ${f.fileData?`
                          <div style="margin-top:4px;">
                            <a href="${f.fileData}" download="${f.fileName}" target="_blank" class="text-primary" style="font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                              <span class="material-icons-outlined" style="font-size:14px">attachment</span> ${v(f.fileName)}
                            </a>
                          </div>
                        `:""}
                      </td>
                      <td style="font-family:monospace;" class="text-secondary">${v(f.number||"—")}</td>
                      <td>${f.expiryDate?new Date(f.expiryDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td><span class="badge ${T.colorClass}">${v(T.label)}</span></td>
                    </tr>
                  `}).join("")}
                ${$.length===0?'<tr><td colspan="4" style="text-align:center; padding:32px;" class="text-secondary">No credentials or certificates uploaded.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compliance Upload Form -->
        <div class="card">
          <div class="card-header">
            <h4 style="margin:0;">Self-Service Certificate Upload</h4>
          </div>
          <div class="card-body">
            <p class="text-secondary" style="font-size:12px; margin:0 0 16px 0; line-height:1.5;">
              Submit your renewed compliance documents directly to the admin dashboard. Uploaded files will be labeled as "Pending Verification" until approved by office staff.
            </p>

            <form id="compliance-upload-form" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Certificate Type *</label>
                <select id="cred-type" class="form-select" required>
                  <option value="Public Liability Insurance">Public Liability Insurance</option>
                  <option value="Workers Compensation">Workers Compensation</option>
                  <option value="Trade License">Trade License</option>
                  <option value="White Card">White Card (Safety Induction)</option>
                  <option value="Other Certification">Other Certification</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Policy or License Number *</label>
                <input type="text" id="cred-number" class="form-input" placeholder="e.g. WC-990212-B" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Expiry Date *</label>
                <input type="date" id="cred-expiry" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Notes / Coverage Scope</label>
                <textarea id="cred-notes" class="form-input" rows="2" style="font-size:12px;" placeholder="Optional additional comments..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size:12px;">Upload File Attachment *</label>
                <div class="drag-drop-zone" id="file-drop-zone">
                  <span class="material-icons-outlined text-tertiary" style="font-size:32px; margin-bottom:6px;">cloud_upload</span>
                  <div style="font-size:11px; font-weight:600; color:var(--text-secondary);" id="selected-file-label">
                    Drag and drop file here, or click to select
                  </div>
                  <div style="font-size:9px; color:var(--text-tertiary); margin-top:2px;">PDF, PNG, JPG (Max 5MB)</div>
                  <input type="file" id="cred-file-input" style="display:none;" accept=".pdf,.png,.jpg,.jpeg" />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:8px;">
                <span class="material-icons-outlined">save</span> Submit for Verification
              </button>
            </form>
          </div>
        </div>

      </div>
    `}function k(){const $=e.querySelector(".portal-container");$&&S($)}function S($){$.addEventListener("click",f=>{const T=f.target.closest(".tab-btn");if(T){r=T.dataset.tab,w();return}const C=f.target.closest(".job-card-header");if(C){if(f.target.closest("button")||f.target.closest("a"))return;const A=C.dataset.id;c=c===A?null:A,w();return}const z=f.target.closest(".task-name-clickable")||f.target.closest(".btn-toggle-desc");if(z){const A=z.dataset.jobId,_=z.dataset.path;if(A&&_){const H=`${A}-${_}`,R=z.closest(".task-info-col"),V=R==null?void 0:R.querySelector(".task-desc-container"),se=R==null?void 0:R.querySelector(".btn-toggle-desc");y.has(H)?(y.delete(H),V&&(V.style.maxHeight="0px",V.style.marginTop="0px"),se&&(se.textContent="info_outline")):(y.add(H),V&&(V.style.maxHeight="200px",V.style.marginTop="4px"),se&&(se.textContent="info"))}return}const J=f.target.closest(".btn-post-comment");if(J){const A=J.dataset.jobId,_=$.querySelector("#comment-input-"+A);if(!_)return;const H=_.value.trim(),R=i.get(A)||[];if(!H&&!R.length)return;const se=l.getAll("jobs").find(re=>re.id===A);if(!se)return;se.activityLog||(se.activityLog=[]);const U=`[Subcontractor - ${n.businessName}] ${n.contactName}`,P=H?`${U}: ${H}`:`${U} attached files`;se.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:P,files:[...R],date:new Date().toISOString()}),l.update("jobs",A,{activityLog:se.activityLog}),i.set(A,[]);const Z=document.getElementById("sync-indicator-"+A);Z&&(Z.style.opacity="1",setTimeout(()=>{Z.style.opacity="0"},1e3)),w();return}const L=f.target.closest(".btn-remove-comment-staged");if(L){const A=L.dataset.jobId,_=parseInt(L.dataset.idx),H=i.get(A)||[];H.splice(_,1),i.set(A,H),w();return}if(f.target.closest("#btn-b2b-import")){N();return}if(f.target.closest("#file-drop-zone")){if(f.target.id!=="cred-file-input"){const A=$.querySelector("#cred-file-input");A&&A.click()}return}}),$.addEventListener("change",f=>{if(f.target.matches("#job-status-filter")){d=f.target.value;const T=$.querySelector("#portal-tab-content");T&&(T.innerHTML=I(p()));return}if(f.target.matches(".task-checkbox")){const T=f.target.dataset.jobId,C=f.target.dataset.path,J=f.target.checked?100:0;b(T,C,J),w();return}if(f.target.matches("#cred-file-input")){const T=f.target.files[0];D(T);return}if(f.target.matches(".comment-file-input")){const T=f.target.dataset.jobId,C=Array.from(f.target.files);if(!C.length)return;let z=0;const J=i.get(T)||[];C.forEach(L=>{const j=new FileReader;j.onload=q=>{J.push({name:L.name,size:L.size,type:L.type,data:q.target.result}),z++,z===C.length&&(i.set(T,J),w())},j.readAsDataURL(L)});return}}),$.addEventListener("input",f=>{if(f.target.matches("#job-search-input")){o=f.target.value;const T=$.querySelector("#portal-tab-content");T&&(T.innerHTML=I(p()));return}}),$.addEventListener("submit",f=>{f.target.matches("#compliance-upload-form")&&(f.preventDefault(),M())}),$.addEventListener("dragover",f=>{const T=f.target.closest("#file-drop-zone");T&&(f.preventDefault(),T.style.borderColor="var(--color-primary)",T.style.backgroundColor="var(--color-primary-light)")}),$.addEventListener("dragleave",f=>{const T=f.target.closest("#file-drop-zone");T&&(T.style.borderColor="var(--border-color-dark)",T.style.backgroundColor="var(--content-bg)")}),$.addEventListener("drop",f=>{const T=f.target.closest("#file-drop-zone");if(T){f.preventDefault(),T.style.borderColor="var(--border-color-dark)",T.style.backgroundColor="var(--content-bg)";const C=f.dataTransfer.files[0];D(C)}})}function D($){if(!$)return;if($.size>5*1024*1024){me(async()=>{const{showToast:C}=await Promise.resolve().then(()=>qe);return{showToast:C}},void 0).then(({showToast:C})=>{C("File is too large. Max allowed size is 5MB.","error")});return}g=$.name;const f=e.querySelector("#selected-file-label");f&&(f.innerHTML=`<strong>Selected Attachment:</strong> ${v($.name)} (${($.size/1024).toFixed(1)} KB)`);const T=new FileReader;T.onload=C=>{u=C.target.result},T.readAsDataURL($)}function M(){const $=e.querySelector("#cred-type").value,f=e.querySelector("#cred-number").value.trim(),T=e.querySelector("#cred-expiry").value,C=e.querySelector("#cred-notes").value.trim();if(!f||!T){me(async()=>{const{showToast:L}=await Promise.resolve().then(()=>qe);return{showToast:L}},void 0).then(({showToast:L})=>{L("Please fill in all required fields.","error")});return}if(!u){me(async()=>{const{showToast:L}=await Promise.resolve().then(()=>qe);return{showToast:L}},void 0).then(({showToast:L})=>{L("Please select a certificate file to upload.","error")});return}const z={id:"doc_"+Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:$,number:f,expiryDate:T,verified:!1,fileName:g,fileData:u,notes:C},J=[...n.complianceDocs||[],z];l.update("contractors",n.id,{complianceDocs:J}),n.complianceDocs=J,u=null,g="",me(async()=>{const{showToast:L}=await Promise.resolve().then(()=>qe);return{showToast:L}},void 0).then(({showToast:L})=>{L("Document uploaded successfully. Awaiting admin review.","success"),w()})}function N(){const $=p();if($.length===0){me(async()=>{const{showToast:q}=await Promise.resolve().then(()=>qe);return{showToast:q}},void 0).then(({showToast:q})=>{q("No active jobs to import.","error")});return}const f=l.getSettings(),T=f.name||"FieldForge Demo Company";let z=l.getAll("customers").find(q=>q.company===T);z||(z={id:"cust_b2b_"+Math.random().toString(36).substr(2,9),company:T,firstName:"Operations",lastName:"Staff",email:f.email?"dispatch@"+f.email:"dispatch@fieldforge.io",phone:f.phone||"1300 123 456",address:f.address||"123 Business St, Melbourne VIC 3000",status:"Active",type:"Company",notes:"Auto-created customer representing our parent company during subcontractor B2B job imports.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},l.create("customers",z));function J(q){return q?q.map(A=>({id:"b2bt_"+Math.random().toString(36).substr(2,9),name:A.name,status:"Not Started",progress:0,estimatedHours:A.estimatedHours||0,people:A.people||1,startDate:A.startDate||new Date().toISOString(),subTasks:A.subTasks?J(A.subTasks):[],assignedContractorIds:[],assignedContractorId:null})):[]}let L=0;const j=l.getAll("jobs");$.forEach(({job:q})=>{const A=`[B2B Dispatch] ${q.number} - ${q.title}`;if(j.some(U=>U.title===A))return;let H=1e5;l.getAll("jobs").forEach(U=>{if(U.number&&U.number.startsWith("J-")){const P=parseInt(U.number.substring(2));!isNaN(P)&&P>H&&(H=P)}});const V="J-"+(H+1),se={id:"job_b2b_"+Math.random().toString(36).substr(2,9),number:V,customerId:z.id,customerName:z.company,contactName:z.firstName+" "+z.lastName,siteAddress:q.siteAddress,title:A,type:q.type,status:"Pending",priority:q.priority||"Medium",scheduledDate:new Date().toISOString().split("T")[0],estimatedHours:q.estimatedHours||0,laborCost:q.laborCost||0,materialCost:q.materialCost||0,tasks:J(q.tasks||[]),notes:`Imported via magic-link B2B Dispatch API. Original Job Number: ${q.number} managed by ${T}.`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};l.create("jobs",se),L++}),me(async()=>{const{showToast:q}=await Promise.resolve().then(()=>qe);return{showToast:q}},void 0).then(({showToast:q})=>{L>0?q(`Successfully imported ${L} dispatch job(s) into your CRM database!`,"success"):q("These dispatch jobs have already been imported previously.","info")})}w()}function Ft(e){const a=l.getAll("contractors");e.innerHTML=`
    <div class="page-header">
      <h1>Contractors</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-contractor"><span class="material-icons-outlined">add</span> Add Contractor</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
        <button class="toolbar-filter" data-filter="active">Active</button>
        <button class="toolbar-filter" data-filter="inactive">Inactive</button>
        <button class="toolbar-filter" data-filter="compliant">Compliant</button>
        <button class="toolbar-filter" data-filter="non-compliant">Non-Compliant</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search contractors by name, email or specialty..." id="contractors-search" />
      </div>
    </div>

    <div id="contractors-table-container"></div>
  `;let t=[...a];const n=Xe({columns:[{key:"businessName",label:"Business Name",render:d=>`<span class="cell-link font-medium">${v(d.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:d=>v(d.email||"—")},{key:"phone",label:"Phone",render:d=>v(d.phone||"—")},{key:"compliance",label:"Compliance",render:d=>{const u=$t(d),g=u.reason?u.reason:u.label;return`<span class="badge ${u.badgeClass}" title="${v(g)}" style="cursor:help">${v(u.label)}</span>`}},{key:"active",label:"Status",render:d=>`<span class="badge ${d.active?"badge-success":"badge-neutral"}">${d.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:d=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${d.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:t,onRowClick:d=>Y.navigate(`/contractors/${d}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:d=>{st({container:e,selectedIds:d,onClear:()=>n.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:u=>{u.forEach(g=>l.update("contractors",g,{active:!0})),n.clearSelection(),Ft(e),me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>qe);return{showToast:g}},void 0).then(({showToast:g})=>g(`Activated ${u.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:u=>{u.forEach(g=>l.update("contractors",g,{active:!1})),n.clearSelection(),Ft(e),me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>qe);return{showToast:g}},void 0).then(({showToast:g})=>g(`Deactivated ${u.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:u=>{me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Re);return{showModal:g}},void 0).then(({showModal:g})=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete ${u.length} contractors? This action cannot be undone.</p>`,g({title:"Confirm Bulk Delete",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{u.forEach(p=>l.delete("contractors",p)),n.clearSelection(),Ft(e),me(async()=>{const{showToast:p}=await Promise.resolve().then(()=>qe);return{showToast:p}},void 0).then(({showToast:p})=>p(`Deleted ${u.length} contractors`,"success")),i()}}]})})}}]})}});e.querySelector("#contractors-table-container").appendChild(n),e.querySelector("#btn-new-contractor").addEventListener("click",()=>Y.navigate("/contractors/new"));let r="all",c="";function o(){let d=[...a];r==="active"?d=d.filter(u=>u.active===!0):r==="inactive"?d=d.filter(u=>u.active===!1):r==="compliant"?d=d.filter(u=>$t(u).status==="compliant"):r==="non-compliant"&&(d=d.filter(u=>$t(u).status==="non-compliant"||$t(u).status==="warning")),c&&(d=d.filter(u=>u.businessName.toLowerCase().includes(c)||u.contactName.toLowerCase().includes(c)||(u.email||"").toLowerCase().includes(c)||(u.specialties||[]).some(g=>g.toLowerCase().includes(c)))),t=d,n.updateData(t)}e.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(u=>u.classList.remove("active")),d.classList.add("active"),r=d.dataset.filter,o()})}),e.querySelector("#contractors-search").addEventListener("input",d=>{c=d.target.value.toLowerCase(),o()}),e.addEventListener("click",d=>{const u=d.target.closest(".contractor-edit-btn");u&&(d.stopPropagation(),Y.navigate(`/contractors/${u.dataset.id}/edit`))})}function Ra(e,a){const t=a.id==="new";let s=t?{active:!0,hourlyRate:85,afterHoursRate:127.5,calloutFee:90,specialties:[],complianceDocs:[]}:l.getById("contractors",a.id);if(!s&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
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
            <input type="text" id="businessName" class="form-input" value="${s.businessName||""}" placeholder="e.g. Acme Plumbing Pty Ltd" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Primary Contact Person *</label>
            <input type="text" id="contactName" class="form-input" value="${s.contactName||""}" placeholder="e.g. John Doe" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" value="${s.email||""}" placeholder="e.g. office@acmeplumbing.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="phone" class="form-input" value="${s.phone||""}" placeholder="e.g. 0412 345 678" />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">License & Specialties</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Trade License No.</label>
              <input type="text" id="licenseNumber" class="form-input" value="${s.licenseNumber||""}" placeholder="e.g. LIC-PL-1190" />
            </div>
            <div class="form-group">
              <label class="form-label">Primary Insurance Expiry</label>
              <input type="date" id="insuranceExpiry" class="form-input" value="${s.insuranceExpiry||""}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Specialties / Trade Skills (comma-separated)</label>
            <input type="text" id="specialties" class="form-input" value="${(s.specialties||[]).join(", ")}" placeholder="e.g. Gas Fitting, Excavation, Commercial Plumbing" />
            <p class="text-secondary" style="font-size:11px; margin: 3px 0 0 0;">Used to quickly search and filter subcontractors during dispatch.</p>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Subcontractor Charge Rates</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Std. Hourly Rate ($) *</label>
              <input type="number" id="hourlyRate" class="form-input" value="${s.hourlyRate!==void 0?s.hourlyRate:85}" step="0.5" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">After Hours Rate ($) *</label>
              <input type="number" id="afterHoursRate" class="form-input" value="${s.afterHoursRate!==void 0?s.afterHoursRate:127.5}" step="0.5" min="0" required />
            </div>
            <div class="form-group">
              <label class="form-label">Flat Call-out Fee ($) *</label>
              <input type="number" id="calloutFee" class="form-input" value="${s.calloutFee!==void 0?s.calloutFee:90}" step="0.5" min="0" required />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Administrative Information</h4>

          <div class="form-group">
            <label class="form-label">Internal Operations Notes</label>
            <textarea id="notes" class="form-input" rows="3" placeholder="Enter comments, standard response times, preferred technicians, or performance evaluations...">${s.notes||""}</textarea>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
            <input type="checkbox" id="active" ${s.active?"checked":""} style="width:16px; height:16px; cursor:pointer;" />
            <label for="active" style="margin: 0; cursor:pointer; font-weight:600;" class="form-label">Active & Dispatch-Ready</label>
          </div>
        </form>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{Y.navigate(t?"/contractors":`/contractors/${a.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const n=e.querySelector("#businessName").value.trim(),r=e.querySelector("#contactName").value.trim(),c=e.querySelector("#email").value.trim(),o=e.querySelector("#phone").value.trim(),d=e.querySelector("#licenseNumber").value.trim(),u=e.querySelector("#insuranceExpiry").value,g=e.querySelector("#active").checked,y=parseFloat(e.querySelector("#hourlyRate").value),i=parseFloat(e.querySelector("#afterHoursRate").value),p=parseFloat(e.querySelector("#calloutFee").value),m=e.querySelector("#specialties").value,h=m?m.split(",").map(I=>I.trim()).filter(Boolean):[],b=e.querySelector("#notes").value.trim();if(!n||!r){O("Business Name and Contact Name are required fields.","warning");return}if(isNaN(y)||isNaN(i)||isNaN(p)){O("Please enter valid numeric pay rates.","warning");return}const w={businessName:n,contactName:r,email:c,phone:o,licenseNumber:d,insuranceExpiry:u,active:g,hourlyRate:y,afterHoursRate:i,calloutFee:p,specialties:h,notes:b,complianceDocs:s.complianceDocs||[]};if(u){w.complianceDocs||(w.complianceDocs=[]);const I=w.complianceDocs.findIndex(x=>x.type.toLowerCase().includes("public liability"));I!==-1?(w.complianceDocs[I].expiryDate=u,w.complianceDocs[I].number=d?`PL-${d}`:w.complianceDocs[I].number):w.complianceDocs.push({id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:"Public Liability Insurance",number:d?`PL-${d}`:"PL-AUTO",expiryDate:u,verified:!0,notes:"Auto-synced from primary details"})}if(t){const I=l.create("contractors",w);O("Contractor profile created successfully","success"),Y.navigate(`/contractors/${I.id}`)}else l.update("contractors",a.id,w),O("Contractor profile updated successfully","success"),Y.navigate(`/contractors/${a.id}`)})}function oo(e,a){const t=l.getById("contractors",a.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}if(!t.portalToken){const g="c_pt_"+Math.random().toString(36).substr(2,9)+Date.now().toString(36).substr(-4);l.update("contractors",t.id,{portalToken:g}),t.portalToken=g}ct(t.businessName),l.getAll("jobs").filter(g=>g.contractorId===a.id);const s=l.getAll("jobs"),n=[];function r(g,y,i=[]){g&&g.forEach((p,m)=>{const h=[...i,m];((p.assignedContractorIds||[]).includes(a.id)||p.assignedContractorId===a.id)&&n.push({jobId:y.id,jobNumber:y.number,jobTitle:y.title,jobStatus:y.status,taskId:p.id,taskName:p.name,taskStatus:p.status||"Not Started",taskProgress:p.progress||0,taskEstimatedHours:p.estimatedHours||0,taskStartDate:p.startDate,path:h,isList:p.subTasks&&p.subTasks.length>0}),p.subTasks&&p.subTasks.length>0&&r(p.subTasks,y,h)})}s.forEach(g=>{g.tasks&&r(g.tasks,g)});let c="details";function o(){const g=$t(t);e.innerHTML=`
      ${mt({title:v(t.businessName),icon:"engineering",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${v(t.contactName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${v(t.email||"—")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${v(t.phone||"—")}</span>
          <span class="badge ${g.badgeClass}" title="${v(g.reason||g.label)}" style="cursor:help">
            Compliance: ${v(g.label)}
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
        <button class="tab ${c==="details"?"active":""}" data-tab="details">Overview & Details</button>
        <button class="tab ${c==="compliance"?"active":""}" data-tab="compliance">Compliance Registry (${(t.complianceDocs||[]).length})</button>
        <button class="tab ${c==="rates"?"active":""}" data-tab="rates">Financials & Rates</button>
        <button class="tab ${c==="tasks"?"active":""}" data-tab="tasks">Task Allocations (${n.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `,d(),e.querySelectorAll(".tab").forEach(y=>{y.addEventListener("click",()=>{c=y.dataset.tab,e.querySelectorAll(".tab").forEach(i=>i.classList.remove("active")),y.classList.add("active"),d()})}),e.querySelector("#btn-edit-contractor").addEventListener("click",()=>{Y.navigate(`/contractors/${a.id}/edit`)}),e.querySelector("#btn-delete-contractor").addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete <strong>${v(t.businessName)}</strong>? This action cannot be undone.</p>`,$e({title:"Delete Contractor",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{l.delete("contractors",a.id),O("Contractor deleted successfully","success"),i(),Y.navigate("/contractors")}}]})})}function d(){const g=e.querySelector("#tab-content");if(g)if(c==="details"){const i=t.specialties||[];g.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Business & Contact Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${u("Business Name",t.businessName)}
                  ${u("Contact Name",t.contactName)}
                  ${u("Email Address",t.email||"Not set")}
                  ${u("Phone Number",t.phone||"Not set")}
                  ${u("Trade License No.",t.licenseNumber||"Not set")}
                  ${u("System Status",t.active?"Active (Ready for dispatch)":"Inactive (Do not dispatch)")}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Specialties & Trade Skills</h4>
                <div style="margin-bottom:var(--space-lg); display: flex; flex-wrap: wrap; gap: 6px;">
                  ${i.map(m=>`<span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600;">${v(m)}</span>`).join("")}
                  ${i.length===0?'<span class="text-secondary">No trade specialties listed. Click Edit to add.</span>':""}
                </div>

                <h4 style="margin-bottom:var(--space-base)">Administrative Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.5; white-space: pre-wrap;">${v(t.notes||"No administrative notes recorded for this contractor.")}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top: var(--space-lg); border: 1px solid var(--color-primary-light); background: linear-gradient(135deg, white, rgba(27,109,224,0.015));">
          <div class="card-header" style="border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined text-primary" style="font-size:20px;">vpn_key</span>
            <h4 style="margin:0; font-size:14px; font-weight:600;">Subcontractor Access Portal</h4>
          </div>
          <div class="card-body">
            <p class="text-secondary" style="font-size: var(--font-size-sm); margin:0 0 12px 0; line-height:1.5;">
              Share this secure magic link with the subcontractor. They will be able to view their assigned tasks, slide progress updates, leave site comments, and upload compliance documents without needing a password.
            </p>
            <div style="display:flex; gap: var(--space-sm); align-items:center;">
              <input type="text" readonly id="magic-link-url" class="form-input" style="flex:1; font-family:monospace; background: var(--content-bg); font-size:13px; color:var(--text-secondary);" value="${window.location.origin}${window.location.pathname}#/contractor-portal/${t.portalToken}" />
              <button class="btn btn-primary btn-sm" id="btn-copy-magic-link" style="display:flex; align-items:center; gap:6px; height: 32px;">
                <span class="material-icons-outlined" style="font-size:16px">content_copy</span> Copy Magic Link
              </button>
            </div>
          </div>
        </div>
      `;const p=g.querySelector("#btn-copy-magic-link");p&&p.addEventListener("click",()=>{const m=g.querySelector("#magic-link-url");m&&navigator.clipboard.writeText(m.value).then(()=>{O("Magic link copied to clipboard!","success")}).catch(()=>{O("Failed to copy link","error")})})}else if(c==="compliance"){const i=t.complianceDocs||[];g.innerHTML=`
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
                ${i.map((p,m)=>{const h=na(p);return`
                    <tr>
                      <td class="font-medium">
                        <div>${v(p.type)}</div>
                        ${p.fileData?`
                          <div style="margin-top:4px;">
                            <a href="${p.fileData}" download="${p.fileName}" target="_blank" class="text-primary" style="font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                              <span class="material-icons-outlined" style="font-size:14px">attachment</span> ${v(p.fileName)}
                            </a>
                          </div>
                        `:""}
                      </td>
                      <td style="font-family:monospace" class="text-secondary">${v(p.number||"—")}</td>
                      <td>${p.expiryDate?new Date(p.expiryDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td><span class="badge ${h.colorClass}">${v(h.label)}</span></td>
                      <td>
                        <button class="btn btn-ghost btn-sm btn-toggle-verify" data-id="${p.id}" style="padding: 2px 6px;">
                          ${p.verified?'<span class="material-icons-outlined text-success" style="font-size:18px">check_circle</span> <span class="text-success" style="font-size:12px;font-weight:600">Verified</span>':'<span class="material-icons-outlined text-tertiary" style="font-size:18px">radio_button_unchecked</span> <span class="text-tertiary" style="font-size:12px">Click to verify</span>'}
                        </button>
                      </td>
                      <td style="text-align:right">
                        <button class="btn btn-icon btn-sm btn-ghost btn-delete-doc text-danger" data-id="${p.id}">
                          <span class="material-icons-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
                ${i.length===0?'<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No credentials or certificates uploaded.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `,g.querySelectorAll(".btn-toggle-verify").forEach(p=>{p.addEventListener("click",()=>{const m=p.dataset.id,h=i.map(b=>b.id===m?{...b,verified:!b.verified}:b);l.update("contractors",t.id,{complianceDocs:h}),t.complianceDocs=h,O("Certificate verification status updated","success"),o()})}),g.querySelectorAll(".btn-delete-doc").forEach(p=>{p.addEventListener("click",()=>{const m=p.dataset.id,h=document.createElement("div");h.innerHTML="<p>Are you sure you want to delete this compliance certificate? This cannot be undone.</p>",$e({title:"Delete Certificate",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{const w=i.filter(I=>I.id!==m);l.update("contractors",t.id,{complianceDocs:w}),t.complianceDocs=w,O("Certificate deleted","success"),b(),o()}}]})})}),g.querySelector("#btn-add-doc").addEventListener("click",()=>{He({title:"Add Credential",content:`
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
        `,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Save Credential",className:"btn-primary",onClick:m=>{const h=document.querySelector(".drawer-overlay"),b=h.querySelector("#new-doc-type").value,w=h.querySelector("#new-doc-number").value.trim(),I=h.querySelector("#new-doc-expiry").value,x=h.querySelector("#new-doc-notes").value.trim();if(!w||!I){O("Please fill in all required fields","error");return}const E={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:b,number:w,expiryDate:I,verified:!1,notes:x},k=[...i,E];l.update("contractors",t.id,{complianceDocs:k}),t.complianceDocs=k,O("Credential added to registry","success"),m(),o()}}]})})}else if(c==="rates"){let E=function(){const k=parseFloat(h.value)||0,S=b.value==="standard"?i:p,D=w.checked?m:0,M=k*S+D;x.textContent=`$${M.toFixed(2)}`;const N=b.value==="standard"?`$${i.toFixed(2)}`:`$${p.toFixed(2)}`,$=w.checked?` + $${m.toFixed(2)}`:"";I.textContent=`${k} hrs × ${N}${$}`};var y=E;const i=t.hourlyRate||0,p=t.afterHoursRate||0,m=t.calloutFee||0;g.innerHTML=`
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
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${i.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom:8px">
                <div>
                  <strong>After Hours Hourly Rate</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Applicable for weekends, nights, and public holidays</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${p.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:4px">
                <div>
                  <strong>Call-out / Mobilisation Fee</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Flat fee applied per job dispatch</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${m.toFixed(2)}</div>
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
                    <option value="standard">Standard Hourly ($${i.toFixed(2)})</option>
                    <option value="afterhours">After Hours ($${p.toFixed(2)})</option>
                  </select>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                  <input type="checkbox" id="calc-callout" checked />
                  <label for="calc-callout" class="form-label" style="margin:0; font-size:12px">Include Mobilisation Call-out Fee ($${m.toFixed(2)})</label>
                </div>

                <div style="background:var(--color-primary-light); color:var(--color-primary); padding: 15px; border-radius:6px; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:0.5px">Estimated Total Billing</strong>
                    <span style="font-size:13px; opacity:0.8" id="calc-formula">8 hrs × $${i.toFixed(2)} + $${m.toFixed(2)}</span>
                  </div>
                  <div class="font-bold" style="font-size:24px" id="calc-total">$${(8*i+m).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;const h=g.querySelector("#calc-hours"),b=g.querySelector("#calc-rate-type"),w=g.querySelector("#calc-callout"),I=g.querySelector("#calc-formula"),x=g.querySelector("#calc-total");h&&b&&w&&(h.addEventListener("input",E),h.addEventListener("change",E),b.addEventListener("change",E),w.addEventListener("change",E))}else c==="tasks"&&(g.innerHTML=`
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
                ${n.map(i=>{const p={Completed:"badge-success","In Progress":"badge-primary","Not Started":"badge-neutral"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/jobs/${i.jobId}'" title="Click to view Job Tasklist">
                      <td class="font-medium cell-link">${v(i.jobNumber)}</td>
                      <td>${v(i.jobTitle)}</td>
                      <td class="font-semibold">${v(i.taskName)}</td>
                      <td>
                        <span class="badge" style="${i.isList?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color); border:1px solid var(--border-color); color:var(--text-secondary)"}">
                          ${i.isList?"Tasklist":"Task"}
                        </span>
                      </td>
                      <td>${i.taskStartDate?new Date(i.taskStartDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${i.taskEstimatedHours||"—"} hrs</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="badge ${p[i.taskStatus]||"badge-neutral"}" style="margin:0">${v(i.taskStatus)}</span>
                          <div style="width:60px; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:inline-block" title="${i.taskProgress}% completed">
                            <div style="width:${i.taskProgress}%; background:var(--color-primary); height:100%"></div>
                          </div>
                          <span style="font-size:11px; font-weight:600; color:var(--text-secondary)">${i.taskProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  `}).join("")}
                ${n.length===0?'<tr><td colspan="7" style="text-align:center;padding:32px" class="text-secondary">No task-level allocations dispatched to this subcontractor.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `)}function u(g,y){return`
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${v(g)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${v(String(y))}</span>
      </div>
    `}o()}function Ht(e){const a=l.getAll("suppliers"),t=Le("Suppliers","create"),s=Le("Suppliers","edit"),n=Le("Suppliers","delete");e.innerHTML=`
    <div class="page-header">
      <h1>Suppliers</h1>
      <div class="page-header-actions">
        ${t?'<button class="btn btn-primary" id="btn-new-supplier"><span class="material-icons-outlined">add</span> Add Supplier</button>':""}
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
        <button class="toolbar-filter" data-filter="active">Active</button>
        <button class="toolbar-filter" data-filter="inactive">Inactive</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search suppliers by name, contact, category, or email..." id="suppliers-search" />
      </div>
    </div>

    <div id="suppliers-table-container"></div>
  `;let r=[...a];const c=[{key:"name",label:"Supplier Name",render:y=>`<span class="cell-link font-medium">${v(y.name)}</span>`},{key:"contactName",label:"Contact Person",render:y=>v(y.contactName||"—")},{key:"category",label:"Category",render:y=>`<span class="badge badge-neutral">${v(y.category||"General")}</span>`},{key:"email",label:"Email",render:y=>v(y.email||"—")},{key:"phone",label:"Phone",render:y=>v(y.phone||"—")},{key:"paymentTerms",label:"Payment Terms",render:y=>v(y.paymentTerms||"—")},{key:"active",label:"Status",render:y=>`<span class="badge ${y.active?"badge-success":"badge-neutral"}">${y.active?"Active":"Inactive"}</span>`}];s&&c.push({key:"actions",label:"",width:"80px",render:y=>`<button class="btn btn-ghost btn-sm supplier-edit-btn" data-id="${y.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`});const o=Xe({columns:c,data:r,onRowClick:y=>Y.navigate(`/suppliers/${y}`),emptyMessage:"No suppliers found",emptyIcon:"local_shipping",selectable:s||n,onSelectionChange:y=>{const i=[];s&&i.push({label:"Activate",icon:"check_circle",onClick:p=>{p.forEach(m=>l.update("suppliers",m,{active:!0})),o.clearSelection(),Ht(e),me(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Activated ${p.length} suppliers`,"success"))}},{label:"Deactivate",icon:"block",onClick:p=>{p.forEach(m=>l.update("suppliers",m,{active:!1})),o.clearSelection(),Ht(e),me(async()=>{const{showToast:m}=await Promise.resolve().then(()=>qe);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deactivated ${p.length} suppliers`,"warning"))}}),n&&i.push({label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:p=>{me(async()=>{const{showModal:m}=await Promise.resolve().then(()=>Re);return{showModal:m}},void 0).then(({showModal:m})=>{const h=document.createElement("div");h.innerHTML=`<p>Are you sure you want to delete ${p.length} suppliers? This action cannot be undone.</p>`,m({title:"Confirm Bulk Delete",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{p.forEach(w=>l.delete("suppliers",w)),o.clearSelection(),Ht(e),me(async()=>{const{showToast:w}=await Promise.resolve().then(()=>qe);return{showToast:w}},void 0).then(({showToast:w})=>w(`Deleted ${p.length} suppliers`,"success")),b()}}]})})}}),st({container:e,selectedIds:y,onClear:()=>o.clearSelection(),actions:i})}});e.querySelector("#suppliers-table-container").appendChild(o),t&&e.querySelector("#btn-new-supplier").addEventListener("click",()=>Y.navigate("/suppliers/new"));let d="all",u="";function g(){let y=[...a];d==="active"?y=y.filter(i=>i.active===!0):d==="inactive"&&(y=y.filter(i=>i.active===!1)),u&&(y=y.filter(i=>i.name.toLowerCase().includes(u)||(i.contactName||"").toLowerCase().includes(u)||(i.category||"").toLowerCase().includes(u)||(i.email||"").toLowerCase().includes(u))),r=y,o.updateData(r)}e.querySelectorAll(".toolbar-filter").forEach(y=>{y.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(i=>i.classList.remove("active")),y.classList.add("active"),d=y.dataset.filter,g()})}),e.querySelector("#suppliers-search").addEventListener("input",y=>{u=y.target.value.toLowerCase(),g()}),s&&e.addEventListener("click",y=>{const i=y.target.closest(".supplier-edit-btn");i&&(y.stopPropagation(),Y.navigate(`/suppliers/${i.dataset.id}/edit`))})}function Oa(e,a){const t=a.id==="new";let s=t?{active:!0,category:"General",paymentTerms:"30 Days",attachments:[]}:l.getById("suppliers",a.id);if(!s&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>';return}const n=["Electrical","Plumbing","HVAC","Fire Safety","Security","General"],r=["COD","7 Days","14 Days","30 Days"];e.innerHTML=`
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
            <input type="text" id="name" class="form-input" value="${s.name||""}" placeholder="e.g. ElectraTrade" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Primary Contact Person</label>
            <input type="text" id="contactName" class="form-input" value="${s.contactName||""}" placeholder="e.g. Robert Vance" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="email" class="form-input" value="${s.email||""}" placeholder="e.g. sales@electratrade.com.au" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" id="phone" class="form-input" value="${s.phone||""}" placeholder="e.g. 03 9822 1045" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Physical Address</label>
            <input type="text" id="address" class="form-input" value="${s.address||""}" placeholder="e.g. 22 Industrial Parkway, South Melbourne, VIC 3205" />
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Classification & Terms</h4>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier Category</label>
              <select id="category" class="form-input">
                ${n.map(c=>`<option value="${c}" ${s.category===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="paymentTerms" class="form-input">
                ${r.map(c=>`<option value="${c}" ${s.paymentTerms===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Account Number</label>
              <input type="text" id="accountNumber" class="form-input" value="${s.accountNumber||""}" placeholder="e.g. FF-ET-10291" />
            </div>
          </div>

          <h4 style="border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px; margin-top: 10px;">Internal Notes</h4>

          <div class="form-group">
            <textarea id="notes" class="form-input" rows="3" placeholder="Enter comments or special notes about this supplier...">${s.notes||""}</textarea>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
            <input type="checkbox" id="active" ${s.active?"checked":""} style="width:16px; height:16px; cursor:pointer;" />
            <label for="active" style="margin: 0; cursor:pointer; font-weight:600;" class="form-label">Active (Visible in stock & purchase orders)</label>
          </div>
        </form>
      </div>
    </div>
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{Y.navigate(t?"/suppliers":`/suppliers/${a.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const c=e.querySelector("#name").value.trim(),o=e.querySelector("#contactName").value.trim(),d=e.querySelector("#email").value.trim(),u=e.querySelector("#phone").value.trim(),g=e.querySelector("#address").value.trim(),y=e.querySelector("#category").value,i=e.querySelector("#paymentTerms").value,p=e.querySelector("#accountNumber").value.trim(),m=e.querySelector("#notes").value.trim(),h=e.querySelector("#active").checked;if(!c){O("Supplier Name is a required field.","warning");return}const b={...s,name:c,contactName:o,email:d,phone:u,address:g,category:y,paymentTerms:i,accountNumber:p,notes:m,active:h};if(t){const w=l.create("suppliers",b);O("Supplier profile created successfully","success"),Y.navigate(`/suppliers/${w.id}`)}else l.update("suppliers",a.id,b),O("Supplier profile updated successfully","success"),Y.navigate(`/suppliers/${a.id}`)})}function io(e,a){const t=l.getById("suppliers",a.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>';return}ct(t.name);const s=Le("Suppliers","edit"),n=Le("Suppliers","delete"),r=l.getAll("stock").filter(y=>y.supplier===t.name),c=l.getAll("purchaseOrders").filter(y=>y.supplierName===t.name);let o="overview";function d(){e.innerHTML=`
      ${mt({title:v(t.name),icon:"local_shipping",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">label</span> ${v(t.category||"General")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">payment</span> Terms: ${v(t.paymentTerms||"30 Days")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">credit_card</span> Account: ${v(t.accountNumber||"—")}</span>
          <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span>
        `,actionsHtml:`
          ${s?`
            <button class="btn btn-secondary" id="btn-edit-supplier">
              <span class="material-icons-outlined">edit</span> Edit
            </button>
          `:""}
          ${n?`
            <button class="btn btn-danger" id="btn-delete-supplier">
              <span class="material-icons-outlined">delete</span> Delete
            </button>
          `:""}
        `})}

      <div class="tabs" id="supplier-tabs">
        <button class="tab ${o==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${o==="catalogues"?"active":""}" data-tab="catalogues">Catalogues & Docs (${(t.attachments||[]).length})</button>
        <button class="tab ${o==="stock"?"active":""}" data-tab="stock">Stock Items (${r.length})</button>
        <button class="tab ${o==="pos"?"active":""}" data-tab="pos">Purchase Orders (${c.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `,u(),e.querySelectorAll(".tab").forEach(y=>{y.addEventListener("click",()=>{o=y.dataset.tab,e.querySelectorAll(".tab").forEach(i=>i.classList.remove("active")),y.classList.add("active"),u()})}),s&&e.querySelector("#btn-edit-supplier").addEventListener("click",()=>{Y.navigate(`/suppliers/${t.id}/edit`)}),n&&e.querySelector("#btn-delete-supplier").addEventListener("click",()=>{const y=document.createElement("div");y.innerHTML=`<p>Are you sure you want to delete supplier <strong>${v(t.name)}</strong>? This action cannot be undone.</p>`,$e({title:"Delete Supplier",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{l.delete("suppliers",t.id),O("Supplier deleted successfully","success"),i(),Y.navigate("/suppliers")}}]})})}function u(){const y=e.querySelector("#tab-content");if(y)if(o==="overview")y.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Supplier & Financial Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${g("Supplier Name",t.name)}
                  ${g("Contact Name",t.contactName||"Not set")}
                  ${g("Email Address",t.email||"Not set")}
                  ${g("Phone Number",t.phone||"Not set")}
                  ${g("Physical Address",t.address||"Not set")}
                  ${g("Account Number",t.accountNumber||"Not set")}
                  ${g("Payment Terms",t.paymentTerms||"30 Days")}
                  ${g("System Status",t.active?"Active (Available for stock & POs)":"Inactive")}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Internal Operations Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 16px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${v(t.notes||"No notes recorded for this supplier.")}</div>
              </div>
            </div>
          </div>
        </div>
      `;else if(o==="catalogues"){const i=t.attachments||[];if(y.innerHTML=`
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding: 12px 20px;">
            <h4 style="margin:0">Catalogues & Documents Registry</h4>
            ${s?`
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
                ${i.map(p=>{const m=(p.size/1048576).toFixed(2),h=p.type==="application/pdf"||p.type&&p.type.startsWith("image/")||p.name.toLowerCase().endsWith(".pdf");return`
                    <tr>
                      <td class="font-medium">${v(p.name)}</td>
                      <td class="text-secondary" style="font-size:12px">${v(p.type||"Unknown")}</td>
                      <td>${m} MB</td>
                      <td>${p.uploadedAt?new Date(p.uploadedAt).toLocaleDateString("en-AU"):"—"}</td>
                      <td style="text-align:right">
                        <div style="display:inline-flex; gap:6px;">
                          ${h?`
                            <button class="btn btn-ghost btn-sm btn-preview-doc" data-id="${p.id}" title="Preview Document">
                              <span class="material-icons-outlined" style="font-size:18px">visibility</span>
                            </button>
                          `:""}
                          <a href="${p.url}" download="${v(p.name)}" class="btn btn-ghost btn-sm" title="Download File" style="display:inline-flex; align-items:center; justify-content:center; text-decoration:none; color:inherit;">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </a>
                          ${s?`
                            <button class="btn btn-ghost btn-sm btn-delete-doc text-danger" data-id="${p.id}" title="Delete Document">
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
      `,s){const p=y.querySelector("#catalogue-file-input"),m=y.querySelector("#btn-upload-file");m&&p&&(m.addEventListener("click",()=>p.click()),p.addEventListener("change",h=>{const b=h.target.files[0];if(!b)return;if(b.size>8*1024*1024){O("File is too large. Maximum size is 8MB.","error");return}const w=new FileReader;w.onload=function(I){const x={id:"att_sup_"+Date.now().toString(36)+Math.random().toString(36).substr(2,4),name:b.name,type:b.type,size:b.size,uploadedAt:new Date().toISOString(),url:I.target.result},E=[...t.attachments||[],x];l.update("suppliers",t.id,{attachments:E}),t.attachments=E,O("Document uploaded successfully","success"),d()},w.readAsDataURL(b)})),y.querySelectorAll(".btn-delete-doc").forEach(h=>{h.addEventListener("click",()=>{const b=h.dataset.id,w=document.createElement("div");w.innerHTML="<p>Are you sure you want to delete this catalogue/document? This action cannot be undone.</p>",$e({title:"Confirm Delete Document",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Delete",className:"btn-danger",onClick:I=>{const x=(t.attachments||[]).filter(E=>E.id!==b);l.update("suppliers",t.id,{attachments:x}),t.attachments=x,O("Document deleted successfully","success"),I(),d()}}]})})})}y.querySelectorAll(".btn-preview-doc").forEach(p=>{p.addEventListener("click",()=>{const m=p.dataset.id,h=(t.attachments||[]).find(b=>b.id===m);h&&(localStorage.setItem("currentDocumentView",JSON.stringify({name:h.name,type:h.type,url:h.url})),window.open("#/document/view","_blank"))})})}else o==="stock"?y.innerHTML=`
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
                ${r.map(i=>`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/stock/${i.id}'" title="Click to view Stock Details">
                      <td class="font-medium cell-link">${v(i.name)}</td>
                      <td style="font-family:monospace">${v(i.sku||"—")}</td>
                      <td><span class="badge badge-neutral">${v(i.category||"General")}</span></td>
                      <td class="font-semibold" style="color:var(--color-primary)">$${(i.costPrice!==void 0?i.costPrice:0).toFixed(2)}</td>
                      <td>
                        <strong style="color: ${i.quantity<=(i.reorderLevel||0)?"var(--color-danger)":"inherit"}">
                          ${i.quantity||0} units
                        </strong>
                        ${i.quantity<=(i.reorderLevel||0)?'<span style="font-size:10px; color:var(--color-danger); font-weight:600; display:block">REORDER LEVEL REACHED</span>':""}
                      </td>
                    </tr>
                  `).join("")}
                ${r.length===0?'<tr><td colspan="5" style="text-align:center;padding:32px" class="text-secondary">No inventory parts catalogued under this supplier.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `:o==="pos"&&(y.innerHTML=`
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
                ${c.map(i=>{const p=(i.items||[]).reduce((h,b)=>h+(parseFloat(b.quantity)||0)*(parseFloat(b.unitCost)||0),0),m={Draft:"badge-neutral","Pending Approval":"badge-warning","Approved / Sent":"badge-primary",Received:"badge-success",Cancelled:"badge-danger"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/purchase-orders/${i.id}'" title="Click to view Purchase Order">
                      <td class="font-medium cell-link">${v(i.number)}</td>
                      <td>${i.orderDate?new Date(i.orderDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${v(i.creatorName||"—")}</td>
                      <td>${v(i.warehouseName||"Main Warehouse")}</td>
                      <td><span class="badge ${m[i.status]||"badge-neutral"}">${v(i.status)}</span></td>
                      <td class="font-medium" style="color:var(--color-primary)">$${p.toFixed(2)}</td>
                    </tr>
                  `}).join("")}
                ${c.length===0?'<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No purchase orders raised for this supplier yet.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `)}function g(y,i){return`
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${v(y)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${v(String(i))}</span>
      </div>
    `}d()}function Rt(e){let a=l.getAll("assets");const t=l.getAll("fleet");a.length===0&&t.length>0&&(t.forEach(c=>{c.ownerType="Business",c.identifier=c.licensePlate,l.create("assets",c)}),a=l.getAll("assets")),e.innerHTML=`
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
  `;let s=[...a];const r=Xe({columns:[{key:"name",label:"Name / ID",render:c=>`<span class="cell-link font-medium">${v(c.name)}</span>`},{key:"owner",label:"Owner Type",render:c=>{if(c.ownerType==="Customer"&&c.customerId){const o=l.getById("customers",c.customerId);return o?`<span class="badge badge-neutral">${v(o.company)}</span>`:"Customer"}return'<span class="badge badge-primary">My Business</span>'}},{key:"type",label:"Category",render:c=>v(c.type||"—")},{key:"service",label:"Service Status",render:c=>{const d=(c.logs||[]).filter(y=>y.type==="Service").sort((y,i)=>new Date(i.date)-new Date(y.date))[0];if(!d||!c.serviceIntervalMonths)return'<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';const u=new Date(d.date);u.setMonth(u.getMonth()+parseInt(c.serviceIntervalMonths));const g=u<new Date;return`<span style="color:${g?"var(--color-danger)":"var(--text-secondary)"}; font-size:12px; font-weight:${g?"600":"400"}">
          ${g?"OVERDUE":u.toLocaleDateString()}
        </span>`}},{key:"status",label:"Status",render:c=>`<span class="badge ${c.status==="Active"?"badge-success":c.status==="In Maintenance"?"badge-warning":"badge-neutral"}">${v(c.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:c=>{if(!c.assignedToId)return"—";const o=l.getById("technicians",c.assignedToId);return o?v(o.name):"—"}},{key:"actions",label:"",width:"80px",render:c=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${c.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:s,onRowClick:c=>Y.navigate(`/assets/${c}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:c=>{st({container:e,selectedIds:c,onClear:()=>r.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:o=>{const d=document.createElement("div");d.innerHTML=`
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
              `,me(async()=>{const{showModal:u}=await Promise.resolve().then(()=>Re);return{showModal:u}},void 0).then(({showModal:u})=>{u({title:`Update ${o.length} Assets`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Apply",className:"btn-primary",onClick:g=>{const y=d.querySelector("#bulk-status").value;o.forEach(i=>l.update("assets",i,{status:y})),r.clearSelection(),Rt(e),me(async()=>{const{showToast:i}=await Promise.resolve().then(()=>qe);return{showToast:i}},void 0).then(({showToast:i})=>i(`Updated ${o.length} assets to ${y}`,"success")),g()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:o=>{me(async()=>{const{showToast:d}=await Promise.resolve().then(()=>qe);return{showToast:d}},void 0).then(({showToast:d})=>d(`Generating tags for ${o.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:o=>{me(async()=>{const{showModal:d}=await Promise.resolve().then(()=>Re);return{showModal:d}},void 0).then(({showModal:d})=>{const u=document.createElement("div");u.innerHTML=`<p>Are you sure you want to delete ${o.length} assets? This action cannot be undone.</p>`,d({title:"Confirm Bulk Delete",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Delete",className:"btn-danger",onClick:g=>{o.forEach(y=>l.delete("assets",y)),r.clearSelection(),Rt(e),me(async()=>{const{showToast:y}=await Promise.resolve().then(()=>qe);return{showToast:y}},void 0).then(({showToast:y})=>y(`Deleted ${o.length} assets`,"success")),g()}}]})})}}]})}});e.querySelector("#asset-table-container").appendChild(r),e.querySelector("#btn-new-asset").addEventListener("click",()=>{La({onSave:()=>Rt(e)})}),e.querySelector("#asset-search").addEventListener("input",c=>{const o=c.target.value.toLowerCase();s=a.filter(d=>d.name.toLowerCase().includes(o)||(d.serial||d.identifier||d.licensePlate||"").toLowerCase().includes(o)||(d.type||"").toLowerCase().includes(o)),r.updateData(s)}),e.addEventListener("click",c=>{const o=c.target.closest(".asset-edit-btn");o&&(c.stopPropagation(),Y.navigate(`/assets/${o.dataset.id}/edit`))})}function Ba(e,a){const t=a.id==="new";let s=t?{status:"Active",ownerType:"Business",type:"Plant & Equipment",serviceIntervalMonths:6,currentMeter:0,recoveryRate:0}:l.getById("assets",a.id);if(!s&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const n=l.getAll("people").filter(p=>p.type==="Staff"),r=l.getAll("customers");let c=[];if(s.customerId){const p=l.getById("customers",s.customerId);p&&p.sites&&(c=p.sites)}e.innerHTML=`
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
            <input type="text" id="name" class="form-input" value="${s.name||""}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="description" class="form-input" rows="3">${s.description||""}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Owner Type</label>
              <select id="ownerType" class="form-select">
                <option value="Business" ${s.ownerType==="Business"?"selected":""}>My Business (Revenue Tool)</option>
                <option value="Customer" ${s.ownerType==="Customer"?"selected":""}>Customer (Service Target)</option>
              </select>
            </div>
            <div class="form-group" id="customer-select-group" style="display: ${s.ownerType==="Customer"?"block":"none"};">
              <label class="form-label">Customer *</label>
              <select id="customerId" class="form-select">
                <option value="">Select customer...</option>
                ${r.map(p=>`<option value="${p.id}" ${s.customerId===p.id?"selected":""}>${p.company||p.firstName+" "+p.lastName}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type / Category</label>
              <select id="type" class="form-select">
                ${["Vehicle","Plant & Equipment","Specialized Tool","Fixed Asset (HVAC/Solar/Fire)","Other"].map(p=>`<option value="${p}" ${s.type===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Serial / ID / License</label>
              <input type="text" id="serial" class="form-input" value="${s.serial||s.identifier||""}" placeholder="e.g. S/N 12345 or REG-123" />
            </div>
          </div>

          <div class="form-row" id="business-fields" style="display: ${s.ownerType==="Business"?"flex":"none"};">
            <div class="form-group">
              <label class="form-label">Recovery Rate ($/hr)</label>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="text-tertiary">$</span>
                <input type="number" id="recoveryRate" class="form-input" value="${s.recoveryRate||0}" step="0.5" />
              </div>
              <div class="form-help">Amount charged to jobs for using this asset.</div>
            </div>
            <div class="form-group">
               <label class="form-label">Assign to Default Staff</label>
               <select id="assignedToId" class="form-select">
                 <option value="">Unassigned</option>
                 ${n.map(p=>`<option value="${p.id}" ${s.assignedToId===p.id?"selected":""}>${p.firstName} ${p.lastName}</option>`).join("")}
               </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Service Interval (Months)</label>
              <input type="number" id="serviceIntervalMonths" class="form-input" value="${s.serviceIntervalMonths||6}" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Current Meter Reading</label>
              <div style="display:flex; gap:8px;">
                <input type="number" id="currentMeter" class="form-input" value="${s.currentMeter||0}" step="1" style="flex:1" />
                <select id="meterUnit" class="form-select" style="width: 100px;">
                  <option value="hrs" ${s.meterUnit==="hrs"?"selected":""}>Hours</option>
                  <option value="kmls" ${s.meterUnit==="kmls"?"selected":""}>Kmls</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location / Site</label>
              <select id="site" class="form-select" ${s.ownerType==="Business"?"disabled":""}>
                <option value="">-- No specific site --</option>
                ${c.map(p=>`<option value="${p.name}" ${s.site===p.name?"selected":""}>${p.name}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Install / Purchase Date</label>
              <input type="date" id="installDate" class="form-input" value="${s.installDate||""}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="status" class="form-select">
              ${["Active","In Maintenance","Commissioning","Decommissioned","Lost/Stolen"].map(p=>`<option value="${p}" ${s.status===p?"selected":""}>${p}</option>`).join("")}
            </select>
          </div>
        </form>
      </div>
    </div>
  `;const o=e.querySelector("#ownerType"),d=e.querySelector("#customer-select-group"),u=e.querySelector("#customerId"),g=e.querySelector("#site"),y=e.querySelector("#business-fields");o.addEventListener("change",p=>{const m=p.target.value==="Customer";d.style.display=m?"block":"none",y.style.display=m?"none":"flex",g.disabled=!m,m?i(u.value):g.innerHTML='<option value="">-- No specific site --</option>'}),u.addEventListener("change",p=>{i(p.target.value)});function i(p){if(!p){g.innerHTML='<option value="">-- No specific site --</option>';return}const m=l.getById("customers",p);if(!m||!m.sites||m.sites.length===0){g.innerHTML='<option value="">-- No specific site --</option>';return}g.innerHTML='<option value="">-- No specific site --</option>'+m.sites.map(h=>`<option value="${h.name}" ${s.site===h.name?"selected":""}>${h.name}</option>`).join("")}e.querySelector("#btn-cancel").addEventListener("click",()=>{Y.navigate(t?"/assets":`/assets/${a.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{var m;const p={name:e.querySelector("#name").value,description:e.querySelector("#description").value,serial:e.querySelector("#serial").value,identifier:e.querySelector("#serial").value,type:e.querySelector("#type").value,status:e.querySelector("#status").value,assignedToId:e.querySelector("#assignedToId").value,ownerType:e.querySelector("#ownerType").value,customerId:e.querySelector("#ownerType").value==="Customer"?e.querySelector("#customerId").value:null,site:e.querySelector("#site").value,installDate:e.querySelector("#installDate").value,recoveryRate:parseFloat(((m=e.querySelector("#recoveryRate"))==null?void 0:m.value)||0),serviceIntervalMonths:parseInt(e.querySelector("#serviceIntervalMonths").value||6),currentMeter:parseFloat(e.querySelector("#currentMeter").value||0),meterUnit:e.querySelector("#meterUnit").value};if(!p.name){alert("Asset Name is required.");return}t?(p.logs=[],l.create("assets",p)):l.update("assets",a.id,p),Y.navigate("/assets")})}function Va(e,a){const t=l.getById("assets",a.id);if(!t){e.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}l.getSettings();let s="Unassigned";if(t.assignedToId){const i=l.getById("technicians",t.assignedToId);i&&(s=i.name)}let n="My Business",r="Internal Asset";if(t.ownerType==="Customer"&&t.customerId){const i=l.getById("customers",t.customerId);i&&(n=i.company),r="Customer Asset"}const c=t.logs||[],o=c.reduce((i,p)=>i+(parseFloat(p.cost)||0),0),d=c.filter(i=>i.type==="Service").sort((i,p)=>new Date(p.date)-new Date(i.date))[0];let u="Not Scheduled",g=!1;if(d&&t.serviceIntervalMonths){const i=new Date(d.date);i.setMonth(i.getMonth()+parseInt(t.serviceIntervalMonths)),u=i.toLocaleDateString(),g=i<new Date}e.innerHTML=`
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
          <span class="material-icons-outlined" style="color:var(--color-primary)">${t.type==="Vehicle"?"directions_car":"precision_manufacturing"}</span>
        </div>
        <div>
          <h1 style="margin: 0;">${v(t.name)}</h1>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
            <span class="badge ${t.ownerType==="Business"?"badge-primary":"badge-neutral"}">${r}</span>
            <span class="text-tertiary" style="font-size:12px">• ${v(t.identifier||t.serial||"No ID")}</span>
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
          <div style="font-weight:600; font-size:16px; color:${g?"var(--color-danger)":"inherit"}">
            ${u}
            ${g?'<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">OVERDUE</span>':""}
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
                <span class="font-medium">${v(t.type||"-")}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Owner</span>
                <span class="font-medium">${v(n)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Assigned To</span>
                <span class="font-medium">${v(s)}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span class="text-secondary">Location</span>
                <span class="font-medium">${v(t.site||"Main Office")}</span>
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
            ${v(t.description)}
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
              ${c.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>':c.sort((i,p)=>new Date(p.date)-new Date(i.date)).map(i=>`
                  <tr>
                    <td class="font-medium">${new Date(i.date).toLocaleDateString()}</td>
                    <td class="text-secondary">${i.meter||"-"}</td>
                    <td>
                      <span class="badge ${i.type==="Service"?"badge-success":i.type==="Repair"?"badge-danger":"badge-neutral"}">
                        ${v(i.type)}
                      </span>
                    </td>
                    <td><span class="text-secondary" style="font-size:13px">${v(i.notes||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${i.cost>0?`$${parseFloat(i.cost).toFixed(2)}`:"—"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit").addEventListener("click",()=>{Y.navigate(`/assets/${a.id}/edit`)}),e.querySelector("#btn-add-log").addEventListener("click",()=>{y()});function y(){const i=document.createElement("div");i.innerHTML=`
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
    `,me(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Re);return{showModal:p}},void 0).then(({showModal:p})=>{p({title:"Add Activity Log",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Save Log",className:"btn-primary",onClick:m=>{const h=i.querySelector("#log-date").value,b=i.querySelector("#log-type").value,w=parseFloat(i.querySelector("#log-meter").value),I=parseFloat(i.querySelector("#log-cost").value),x=i.querySelector("#log-notes").value;if(!h)return;const E={date:h,type:b,meter:w,cost:I,notes:x},k=[...t.logs||[],E];l.update("assets",t.id,{logs:k,currentMeter:w,status:b==="Repair"?"In Maintenance":t.status}),m(),Va(e,a)}}]})})}}function no(e){let a="All Documents";const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),s=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];function n(){if(t.role==="admin"||t.role==="manager")return s;const c=["All Documents","Health & Safety","Job Attachments","Customer Attachments","Digital Forms","Purchase Orders"],o=t.userTypeId?l.getById("userTypes",t.userTypeId):null;if(o&&o.permissions){const d=o.permissions.find(g=>g.module==="Quotes"),u=o.permissions.find(g=>g.module==="Invoices");d&&d.view&&c.push("Quotes"),u&&u.view&&c.push("Invoices")}return s.filter(d=>c.includes(d))}function r(){const c=n();c.includes(a)||(a="All Documents");const o=[];l.getAll("documents").forEach(b=>{o.push({id:b.id,name:b.name,url:b.url,type:b.type,size:b.size,uploadedAt:b.uploadedAt,folder:b.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),l.getAll("jobs").forEach(b=>{b.attachments&&Array.isArray(b.attachments)&&b.attachments.forEach(w=>{o.push({id:w.id||Math.random().toString(36).substr(2,9),name:w.name,url:w.url||w.data||"#",type:w.type,size:w.size,uploadedAt:w.uploadedAt||w.date||b.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})}),b.activityLog&&Array.isArray(b.activityLog)&&b.activityLog.forEach(w=>{w.type==="attachment"&&w.file&&o.push({id:w.id,name:w.file.name,url:w.file.url||w.file.data||"#",type:w.file.type,size:w.file.size,uploadedAt:w.date,folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`}),w.type==="combined"&&Array.isArray(w.files)&&w.files.forEach((I,x)=>{o.push({id:`${w.id}_${x}`,name:I.name,url:I.url||I.data||"#",type:I.type,size:I.size,uploadedAt:w.date,folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})})}),b.forms&&Array.isArray(b.forms)&&b.forms.forEach((w,I)=>{o.push({id:`form_${b.id}_${I}`,name:`${w.type} - ${new Date(w.date).toLocaleDateString()}`,url:`#/jobs/${b.id}`,type:"Digital Form",size:null,uploadedAt:w.date,folder:"Digital Forms",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})})}),l.getAll("customers").forEach(b=>{b.attachments&&Array.isArray(b.attachments)&&b.attachments.forEach(w=>{o.push({id:w.id||Math.random().toString(36).substr(2,9),name:w.name,url:w.url||w.data||"#",type:w.type,size:w.size,uploadedAt:w.uploadedAt||b.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:b.id,entityName:b.company})})}),l.getAll("invoices").forEach(b=>{o.push({id:b.id,name:`Invoice ${b.number}.pdf`,url:`#/invoices/${b.id}`,type:"Invoice PDF",size:null,uploadedAt:b.issueDate,folder:"Invoices",entityType:"Invoice",entityId:b.id,entityName:`Inv ${b.number} - ${b.customerName}`})}),l.getAll("quotes").forEach(b=>{o.push({id:b.id,name:`Quote ${b.number}.pdf`,url:`#/quotes/${b.id}`,type:"Quote PDF",size:null,uploadedAt:b.createdAt,folder:"Quotes",entityType:"Quote",entityId:b.id,entityName:`Quote ${b.number} - ${b.customerName}`})}),l.getAll("purchaseOrders").forEach(b=>{o.push({id:b.id,name:`PO ${b.number}.pdf`,url:`#/purchase-orders/${b.id}`,type:"PO PDF",size:null,uploadedAt:b.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:b.id,entityName:`PO ${b.number} - ${b.supplierName}`})}),l.getAll("taskTemplates").forEach(b=>{o.push({id:`task_tmpl_${b.id}`,name:`${b.name} (Tasklist Template)`,url:"#/settings",type:"Tasklist Template",size:null,uploadedAt:b.createdAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:b.id,entityName:"Settings / Tasklist Templates"})}),l.getAll("formTemplates").forEach(b=>{o.push({id:`form_tmpl_${b.id}`,name:`${b.name} (Compliance Form Template)`,url:"#/settings",type:"Form Template",size:null,uploadedAt:b.createdAt||b.updatedAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:b.id,entityName:"Settings / Compliance Forms"})});const d=o.filter(b=>c.includes(b.folder));d.sort((b,w)=>new Date(w.uploadedAt)-new Date(b.uploadedAt));let u=d;a!=="All Documents"&&(u=d.filter(b=>b.folder===a));const g=c;e.innerHTML=`
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
              ${g.map(b=>{let w="folder";b==="All Documents"?w="dashboard":b==="Company Docs"?w="domain":b==="Health & Safety"?w="health_and_safety":b==="Templates"?w="file_copy":b==="Job Attachments"?w="build":b==="Customer Attachments"?w="people":b==="Digital Forms"?w="assignment":b==="Invoices"?w="receipt_long":b==="Quotes"?w="request_quote":b==="Purchase Orders"&&(w="shopping_cart");const I=a===b,x=b==="All Documents"?d.length:d.filter(E=>E.folder===b).length;return`
                <li>
                  <button class="btn btn-ghost ${I?"active":""}" data-folder="${b}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${I?"var(--color-primary-bg)":"transparent"}; color:${I?"var(--primary-color)":"var(--text-primary)"}; font-weight:${I?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${w}</span> ${b}
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
            <h3 style="margin:0">${a}</h3>
            <div class="toolbar-search">
              <span class="material-icons-outlined">search</span>
              <input type="text" placeholder="Search ${a.toLowerCase()}..." id="docs-search" />
            </div>
          </div>
          <div class="card-body" style="padding:0; overflow-x:auto;">
            <div id="docs-table-container"></div>
          </div>
        </div>
      </div>
    `,e.querySelectorAll("#folder-list button").forEach(b=>{b.addEventListener("click",()=>{a=b.dataset.folder,r()})});let y=[...u];const p=Xe({columns:[{key:"name",label:"File Name",render:b=>{let w="insert_drive_file";return b.type==="Invoice PDF"||b.type==="Quote PDF"||b.type==="PO PDF"?w="picture_as_pdf":b.type==="Digital Form"?w="assignment":b.type&&b.type.includes("image")&&(w="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${w}</span> <span class="font-medium truncate" style="max-width:300px" title="${v(b.name)}">${v(b.name)}</span></div>`}},{key:"folder",label:"Category",render:b=>v(b.folder||"—")},{key:"size",label:"Size",render:b=>b.size?(b.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:b=>{if(b.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let w="#";return b.entityType==="Job"?w=`#/jobs/${b.entityId}`:b.entityType==="Customer"?w=`#/people/${b.entityId}`:b.entityType==="Invoice"?w=`#/invoices/${b.entityId}`:b.entityType==="Quote"?w=`#/quotes/${b.entityId}`:b.entityType==="PO"&&(w=`#/purchase-orders/${b.entityId}`),`<span class="badge badge-neutral">${b.entityType}</span> <a href="${w}">${v(b.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:b=>b.uploadedAt?new Date(b.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:b=>b.url&&b.url.startsWith("#/")?`<a href="${v(b.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`:`<a href="#/document/view" target="_blank" class="btn btn-sm btn-outline btn-view-doc" data-doc-id="${v(b.id)}" style="text-decoration:none">View</a>`}],data:y,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:b=>{st({container:e.querySelector(".main-wrapper")||e,selectedIds:b,onClear:()=>p.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:w=>{const I=g.filter(E=>E!=="All Documents"),x=document.createElement("div");x.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${I.map(E=>`<option value="${E}">${E}</option>`).join("")}
                    </select>
                  </div>
                `,$e({title:`Move ${w.length} Documents`,content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Move",className:"btn-primary",onClick:E=>{const k=x.querySelector("#bulk-folder").value;w.forEach(S=>{l.getById("documents",S)&&l.update("documents",S,{folder:k})}),p.clearSelection(),r(),O(`Moved ${w.length} documents to ${k}`,"success"),E()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:w=>{$e({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${w.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Delete",className:"btn-danger",onClick:I=>{w.forEach(x=>l.delete("documents",x)),p.clearSelection(),r(),O(`Deleted ${w.length} documents`,"success"),I()}}]})}}]})}});e.querySelector("#docs-table-container").appendChild(p);const m=e.querySelector("#docs-search");function h(){const b=m.value.toLowerCase();y=u.filter(w=>w.name.toLowerCase().includes(b)||w.entityName&&w.entityName.toLowerCase().includes(b)||w.folder&&w.folder.toLowerCase().includes(b)),p.updateData(y)}m.addEventListener("input",h),e.querySelector("#docs-table-container").addEventListener("click",b=>{const w=b.target.closest(".btn-view-doc");if(w){const I=w.dataset.docId,x=u.find(E=>E.id===I);x&&localStorage.setItem("currentDocumentView",JSON.stringify({name:x.name,url:x.url,type:x.type}))}}),e.querySelector("#btn-upload-doc").addEventListener("click",()=>{const b=g.filter(I=>I!=="All Documents"),w=document.createElement("div");w.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${b.map(I=>`<option value="${I}">${I}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,$e({title:"Upload Global Document",content:w,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Upload",className:"btn-primary",onClick:I=>{const x=document.getElementById("upload-file-input"),E=document.getElementById("upload-folder").value;if(!x.files.length){O("Please select a file","error");return}const k=x.files[0],S=new FileReader;S.onload=D=>{l.create("documents",{name:k.name,type:k.type||"unknown",size:k.size,url:D.target.result,folder:E,uploadedAt:new Date().toISOString()}),O("Document uploaded successfully","success"),r(),I()},S.readAsDataURL(k)}}]})})}r()}function ro(e){let a=null;try{const r=localStorage.getItem("currentDocumentView");r&&(a=JSON.parse(r))}catch(r){console.error("Failed to parse document data:",r)}if(!a||!a.url){e.innerHTML=`
      <div class="empty-state" style="padding: 40px; margin-top: 40px;">
        <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary);">error_outline</span>
        <h3>Document Not Found</h3>
        <p class="text-secondary">The requested document could not be loaded or the session expired.</p>
        <button class="btn btn-primary" onclick="window.close()" style="margin-top: 20px;">Close Tab</button>
      </div>
    `;return}const t=a.type&&a.type.startsWith("image/"),s=a.type==="application/pdf"||a.name.toLowerCase().endsWith(".pdf");e.innerHTML=`
    <div style="display: flex; flex-direction: column; height: 100vh; background: var(--bg-color);">
      <div class="page-header" style="background: var(--content-bg); border-bottom: 1px solid var(--border-color); padding: 12px 24px; margin: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: var(--bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
              <span class="material-icons-outlined" style="color: var(--color-primary);">${t?"image":s?"picture_as_pdf":"description"}</span>
            </div>
            <div>
              <h2 style="margin: 0; font-size: 16px;">${v(a.name||"View Document")}</h2>
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
          <img src="${v(a.url)}" style="max-width: 100%; max-height: 100%; box-shadow: var(--shadow-md); border-radius: 4px;" alt="${v(a.name)}" />
        `:s?`
          <iframe src="${v(a.url)}" style="width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
        `:`
          <div class="card" style="padding: 40px; text-align: center; max-width: 400px;">
            <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px;">description</span>
            <h4>Cannot preview this file type</h4>
            <p class="text-secondary" style="margin-bottom: 24px;">This file type (${v(a.type||"Unknown")}) cannot be previewed in the browser.</p>
            <a href="${v(a.url)}" download="${v(a.name)}" class="btn btn-primary">Download File</a>
          </div>
        `}
      </div>
    </div>
  `,setTimeout(()=>{const r=document.querySelector(".sidebar"),c=document.querySelector(".topbar"),o=document.getElementById("breadcrumb"),d=document.getElementById("main-content");r&&(r.style.display="none"),c&&(c.style.display="none"),o&&(o.style.display="none"),d&&(d.style.padding="0",d.style.height="100vh",d.style.overflow="hidden")},0);const n=()=>{const r=document.querySelector(".sidebar"),c=document.querySelector(".topbar"),o=document.getElementById("breadcrumb"),d=document.getElementById("main-content");r&&(r.style.display=""),c&&(c.style.display=""),o&&(o.style.display=""),d&&(d.style.padding="",d.style.height="",d.style.overflow=""),window.removeEventListener("hashchange",n)};window.addEventListener("hashchange",n)}rs();window.__fieldForge={router:Y,store:l};const Ja=document.getElementById("app"),lo=$a(),Dt=document.createElement("div");Dt.className="main-wrapper";const co=Sa(),ra=document.createElement("div");ra.className="breadcrumb";ra.id="breadcrumb";const kt=document.createElement("main");kt.className="main-content";kt.id="main-content";Dt.appendChild(co);Dt.appendChild(ra);Dt.appendChild(kt);Ja.appendChild(lo);Ja.appendChild(Dt);function we(e){return a=>{kt.innerHTML="",kt.scrollTop=0,e(kt,a)}}Y.register("/login",we(to));Y.register("/portal",we(sa));Y.register("/contractor-portal/:token",we(so));Y.register("/",we(gs));Y.register("/people",we(Zt));Y.register("/people/new",we((e,a)=>qa(e,{id:"new"})));Y.register("/people/:id",we(As));Y.register("/people/:id/edit",we((e,a)=>qa(e,a)));Y.register("/contractors",we(Ft));Y.register("/contractors/new",we((e,a)=>Ra(e,{id:"new"})));Y.register("/contractors/:id",we(oo));Y.register("/contractors/:id/edit",we((e,a)=>Ra(e,a)));Y.register("/suppliers",we(Ht));Y.register("/suppliers/new",we((e,a)=>Oa(e,{id:"new"})));Y.register("/suppliers/:id",we(io));Y.register("/suppliers/:id/edit",we((e,a)=>Oa(e,a)));Y.register("/leads",we(ea));Y.register("/leads/new",we((e,a)=>Aa(e,{id:"new"})));Y.register("/leads/:id",we(Ds));Y.register("/leads/:id/edit",we((e,a)=>Aa(e,a)));Y.register("/notifications",we(Da));Y.register("/quotes",we(ta));Y.register("/quotes/new",we((e,a)=>Wt(e,{id:"new"})));Y.register("/quotes/:id",we(Wt));Y.register("/jobs",we(aa));Y.register("/jobs/new",we((e,a)=>Ma(e,{id:"new"})));Y.register("/jobs/:id",we(js));Y.register("/jobs/:id/edit",we((e,a)=>Ma(e,a)));Y.register("/timesheets",we(zs));Y.register("/assets",we(Rt));Y.register("/assets/new",we((e,a)=>Ba(e,{id:"new"})));Y.register("/assets/:id",we(Va));Y.register("/assets/:id/edit",we((e,a)=>Ba(e,a)));Y.register("/schedule",we(Hs));Y.register("/stock",we(gt));Y.register("/stock/new",we((e,a)=>za(e,{id:"new"})));Y.register("/stock/:id",we(Os));Y.register("/stock/:id/edit",we((e,a)=>za(e,a)));Y.register("/invoices",we(_t));Y.register("/invoices/new",we((e,a)=>_a(e,{id:"new"})));Y.register("/invoices/:id",we(_a));Y.register("/purchase-orders",we(xt));Y.register("/purchase-orders/:id",we(Bs));Y.register("/documents",we(no));Y.register("/document/view",we(ro));Y.register("/reports",we(Vs));Y.register("/settings",we(Xs));Y.register("/settings/forms/new",we((e,a)=>Ha(e,{id:"new"})));Y.register("/settings/forms/:id/edit",we((e,a)=>Ha(e,a)));Y.register("/settings/quote-templates/new",we((e,a)=>Wt(e,{id:"new",type:"template"})));Y.register("/settings/quote-templates/:id/edit",we((e,a)=>Wt(e,{id:a.id,type:"template"})));const po=["/","/people","/contractors","/suppliers","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings","/settings/forms"];Y.onNavigate=(e,a)=>{const t=JSON.parse(localStorage.getItem("currentUser")||"null"),s=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0],n=e.startsWith("/contractor-portal"),r=document.querySelector(".sidebar"),c=document.querySelector(".topbar"),o=document.getElementById("breadcrumb");if(n?(r&&(r.style.display="none"),c&&(c.style.display="none"),o&&(o.style.display="none")):t&&(r&&(r.style.display=""),c&&(c.style.display=""),o&&(o.style.display="")),!t&&e!=="/login"&&!n)return Y.navigate("/login"),!1;if(t){if(t.role==="customer"&&po.includes(s))return Y.navigate("/portal"),!1;if(t.role!=="customer"&&s==="/portal")return Y.navigate("/"),!1;if(t.role!=="admin"&&t.role!=="customer"&&t.userTypeId&&e!=="/login"){const d=l.getById("userTypes",t.userTypeId);if(d&&d.permissions){const u={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/suppliers":"Suppliers","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},g=u[s];if(g){let y=!1;if(e==="/jobs/new"&&!Le("Jobs","create")&&(y=!0),e.endsWith("/edit")&&s==="/jobs"&&!Le("Jobs","edit")&&(y=!0),e==="/quotes/new"&&!Le("Quotes","create")&&(y=!0),e==="/suppliers/new"&&!Le("Suppliers","create")&&(y=!0),e.endsWith("/edit")&&s==="/suppliers"&&!Le("Suppliers","edit")&&(y=!0),y){const p=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/suppliers","/assets","/documents","/settings"].find(m=>{const h=u[m];if(h==="Notifications"||h==="Dashboard")return!0;const b=d.permissions.find(w=>w.module===h);return b&&Object.entries(b).some(([w,I])=>w!=="module"&&I===!0)})||"/";return Y.navigate(p),!1}if(!(g==="Notifications"||g==="Dashboard")){const i=d.permissions.find(p=>p.module===g);if(!i||Object.entries(i||{}).every(([p,m])=>p==="module"||!m)){const m=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/suppliers","/assets","/documents","/settings"].find(h=>{const b=u[h];if(b==="Notifications"||b==="Dashboard")return!0;const w=d.permissions.find(I=>I.module===b);return w&&Object.entries(w).some(([I,x])=>I!=="module"&&x===!0)})||"/";if(s!==m)return Y.navigate(m),!1}}}}}}ka(e),bs(e)};window.addEventListener("fieldforge-logout",()=>{localStorage.removeItem("currentUser");const e=document.querySelector(".sidebar"),a=document.querySelector(".topbar"),t=document.getElementById("breadcrumb");e&&(e.style.display="none"),a&&(a.style.display="none"),t&&(t.style.display="none"),Y.navigate("/login")});const uo=JSON.parse(localStorage.getItem("currentUser")||"null");!uo&&window.location.hash!=="#/login"&&!window.location.hash.startsWith("#/contractor-portal")&&(window.location.hash="#/login");Y.resolve();
