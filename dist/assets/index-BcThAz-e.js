(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();class Xe{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(s,e){this.routes[s]=e}navigate(s){typeof window<"u"&&(window.location.hash=s)}resolve(s){let e=s||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const o=e.indexOf("?"),i={};if(o!==-1){const d=e.substring(o+1);e=e.substring(0,o),d.split("&").forEach(r=>{const[l,y]=r.split("=");l&&(i[l]=decodeURIComponent(y||""))})}const{handler:n,params:a}=this.matchRoute(e);if(n){this.currentRoute=e;const d={...a,...i};if(this.onNavigate&&this.onNavigate(e,d)===!1)return;n(d)}}matchRoute(s){if(this.routes[s])return{handler:this.routes[s],params:{}};for(const[e,o]of Object.entries(this.routes)){const i=e.split("/"),n=s.split("/");if(i.length!==n.length)continue;const a={};let d=!0;for(let r=0;r<i.length;r++)if(i[r].startsWith(":"))a[i[r].slice(1)]=n[r];else if(i[r]!==n[r]){d=!1;break}if(d)return{handler:o,params:a}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const h=new Xe,Et=Object.freeze(Object.defineProperty({__proto__:null,Router:Xe,router:h},Symbol.toStringTag,{value:"Module"})),Ne="simpro_";class Ct{constructor(){this.listeners={}}_key(s){return Ne+s}getAll(s){try{const e=localStorage.getItem(this._key(s));return e?JSON.parse(e):[]}catch{return[]}}getById(s,e){return this.getAll(s).find(i=>i.id===e)||null}save(s,e){localStorage.setItem(this._key(s),JSON.stringify(e)),this.emit(s,e)}create(s,e){const o=this.getAll(s);return e.id=e.id||this.generateId(),e.createdAt=e.createdAt||new Date().toISOString(),e.updatedAt=new Date().toISOString(),o.push(e),this.save(s,o),e}update(s,e,o){const i=this.getAll(s),n=i.findIndex(a=>a.id===e);return n===-1?null:(i[n]={...i[n],...o,updatedAt:new Date().toISOString()},this.save(s,i),i[n])}delete(s,e){const i=this.getAll(s).filter(n=>n.id!==e);this.save(s,i)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const s={markupPercent:20,laborRates:[{id:"rate_1",name:"Standard Rate",rate:85},{id:"rate_2",name:"After Hours Rate",rate:127.5},{id:"rate_3",name:"Emergency Rate",rate:170}]};try{const e=localStorage.getItem(this._key("settings"));return e?JSON.parse(e):s}catch{return s}}saveSettings(s){localStorage.setItem(this._key("settings"),JSON.stringify(s)),this.emit("settings",s)}on(s,e){this.listeners[s]||(this.listeners[s]=[]),this.listeners[s].push(e)}off(s,e){this.listeners[s]&&(this.listeners[s]=this.listeners[s].filter(o=>o!==e))}emit(s,e){this.listeners[s]&&this.listeners[s].forEach(o=>o(e))}isSeeded(){return localStorage.getItem(Ne+"_seeded")==="true"}markSeeded(){localStorage.setItem(Ne+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(s=>s.startsWith(Ne)).forEach(s=>localStorage.removeItem(s))}}const m=new Ct,It=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],Pe=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6"},{id:"tech2",name:"Jake Patterson",role:"Plumber",color:"#10B981"},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B"},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444"},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6"},{id:"tech6",name:"Carlos Ramírez",role:"General Technician",color:"#EC4899"}],Le=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],Ze=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],et=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function G(t){return t[Math.floor(Math.random()*t.length)]}function re(t,s=0){const e=new Date,o=Math.floor(Math.random()*(t+s))-t;return new Date(e.getTime()+o*864e5).toISOString()}function ye(t,s){return Math.round((Math.random()*(s-t)+t)*100)/100}function qt(){return It.map((t,s)=>({id:`cust_${s+1}`,company:t.company,firstName:t.first,lastName:t.last,email:`${t.first.toLowerCase()}.${t.last.toLowerCase()}@${t.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${G(Ze)}, ${G(et)}, VIC 3000`,status:G(["Active","Active","Active","Inactive"]),type:G(["Company","Company","Individual"]),notes:"",createdAt:re(365),updatedAt:re(30)}))}function Dt(t){const s=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],e=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(o,i)=>{const n=G(t);return{id:`lead_${i+1}`,title:`${G(Le)} ${G(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:n.id,customerName:n.company,contactName:`${n.firstName} ${n.lastName}`,status:G(s),source:G(e),value:ye(500,25e3),description:`Potential ${G(Le).toLowerCase()} work for ${n.company}.`,priority:G(["Low","Medium","High"]),createdAt:re(90),updatedAt:re(14)}})}function At(t){const s=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(e,o)=>{const i=G(t),n=ye(200,5e3),a=ye(100,8e3),d=(n+a)*.1;return{id:`quote_${o+1}`,number:`Q-${String(2024e3+o+1)}`,customerId:i.id,customerName:i.company,contactName:`${i.firstName} ${i.lastName}`,title:`${G(Le)} - ${G(["Service Quote","Project Quote","Maintenance Quote"])}`,status:G(s),lineItems:[{description:`${G(Le)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:ye(65,120),total:n},{description:`${G(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:ye(15,200),total:a}],subtotal:n+a,tax:d,total:n+a+d,validUntil:re(-30,60),notes:"",createdAt:re(120),updatedAt:re(14)}})}function Tt(t,s){const e=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],o=["Low","Medium","High","Urgent"];return Array.from({length:20},(i,n)=>{var l;const a=G(t),d=G(Pe),r=G(e);return{id:`job_${n+1}`,number:`J-${String(1e5+n+1)}`,customerId:a.id,customerName:a.company,contactName:`${a.firstName} ${a.lastName}`,siteAddress:a.address||`${G(Ze)}, ${G(et)}, VIC 3000`,title:`${G(Le)} - ${G(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:G(Le),status:r,priority:G(o),technicianId:d.id,technicianName:d.name,quoteId:n<s.length?(l=s[n])==null?void 0:l.id:null,scheduledDate:re(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:ye(200,4e3),materialCost:ye(100,3e3),notes:"",createdAt:re(90),updatedAt:re(7)}})}function Nt(t){const s=["Draft","Sent","Paid","Overdue","Void"],e=t.filter(o=>o.status==="Completed"||o.status==="Invoiced");return Array.from({length:Math.max(8,e.length)},(o,i)=>{const n=e[i]||G(t),a=(n.laborCost||0)+(n.materialCost||0),d=a*.1;return{id:`inv_${i+1}`,number:`INV-${String(5e4+i+1)}`,jobId:n.id,jobNumber:n.number,customerId:n.customerId,customerName:n.customerName,contactName:n.contactName,status:G(s),lineItems:[{description:`${n.title} - Labor`,amount:n.laborCost||ye(200,4e3)},{description:`${n.title} - Materials`,amount:n.materialCost||ye(100,3e3)}],subtotal:a,tax:d,total:a+d,invoiceType:"Standard",issueDate:re(60),dueDate:re(-14,30),paidDate:null,notes:"",createdAt:re(60),updatedAt:re(7)}})}function Pt(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((s,e)=>({id:`stock_${e+1}`,name:s.name,sku:`SKU-${String(1e3+e)}`,category:s.cat,unit:s.unit,unitPrice:s.price,costPrice:s.price*.6,quantity:Math.floor(Math.random()*200)+5,reorderLevel:Math.floor(Math.random()*20)+5,supplier:G(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:G(["Warehouse A","Warehouse B","Van Stock","On Order"]),createdAt:re(365),updatedAt:re(30)}))}function zt(t){const s=[];return t.filter(o=>o.status==="Scheduled"||o.status==="In Progress").forEach((o,i)=>{const n=Math.floor(Math.random()*5),a=7+Math.floor(Math.random()*8),d=1+Math.floor(Math.random()*4),r=Pe.find(l=>l.id===o.technicianId)||G(Pe);s.push({id:`sched_${i+1}`,jobId:o.id,jobNumber:o.number,title:o.title,technicianId:r.id,technicianName:r.name,color:r.color,dayOffset:n,startHour:a,endHour:Math.min(a+d,18),customerName:o.customerName,siteAddress:o.siteAddress})}),s}function Mt(){if(m.isSeeded())return;const t=qt(),s=Dt(t),e=At(t),o=Tt(t,e),i=Nt(o),n=Pt(),a=zt(o);m.save("customers",t),m.save("leads",s),m.save("quotes",e),m.save("jobs",o),m.save("invoices",i),m.save("stock",n),m.save("schedule",a),m.save("technicians",Pe),m.markSeeded()}const jt=[{section:"MAIN"},{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{section:"WORKFLOW"},{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"},{id:"fleet",icon:"local_shipping",label:"Fleet",path:"/fleet"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{section:"RESOURCES"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"},{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{section:"ANALYTICS"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{section:"SYSTEM"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}];function tt(){const t=document.createElement("aside");t.className="sidebar",t.id="sidebar";const s=localStorage.getItem("simpro_sidebar_expanded")==="true";s&&t.classList.add("expanded");let e=`
    <div class="sidebar-logo" id="sidebar-logo">
      <div class="logo-icon">S</div>
      <span class="logo-text">SimPro</span>
    </div>
    <nav class="sidebar-nav">
  `;JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),jt.forEach(a=>{a.section?e+=`<div class="sidebar-section-label" data-section="${a.section}">${a.section}</div>`:e+=`
        <button class="sidebar-nav-item" data-path="${a.path}" data-id="${a.id}" id="nav-${a.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${a.icon}</span></span>
          <span class="nav-label">${a.label}</span>
        </button>
      `}),e+=`
    </nav>
    <div style="padding: 1rem;">
      <button id="btn-logout" class="btn btn-outline" style="width: 100%;">Logout</button>
    </div>
    <button class="sidebar-toggle" id="sidebar-toggle">
      <span class="material-icons-outlined" id="sidebar-toggle-icon">${s?"chevron_left":"chevron_right"}</span>
    </button>
  `,t.innerHTML=e,t.addEventListener("click",a=>{const d=a.target.closest(".sidebar-nav-item");if(d){const r=d.dataset.path;h.navigate(r)}}),t.querySelector("#sidebar-logo").addEventListener("click",()=>h.navigate("/")),t.querySelector("#sidebar-toggle").addEventListener("click",()=>Ht(t));const n=t.querySelector("#btn-logout");return n&&n.addEventListener("click",()=>{sessionStorage.removeItem("currentUser"),h.navigate("/login")}),st(),t}function st(){const t=document.getElementById("sidebar");if(!t)return;const s=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}');if(s.role==="customer")t.style.display="none";else{t.style.display="";let e=null;if(s.userTypeId){const o=m.getById("userTypes",s.userTypeId);o&&o.permissions&&(e=o.permissions)}document.querySelectorAll(".sidebar-nav-item").forEach(o=>{const i=o.querySelector(".nav-label");if(!i)return;const n=i.textContent.trim();if(s.role==="admin"){o.style.display="";return}if(e){const a=e.find(d=>d.module===n);a&&(a.view||a.create||a.edit||a.delete)?o.style.display="":o.style.display="none"}else(n==="Settings"||n==="Reports"||n==="Invoices")&&(o.style.display="none")}),document.querySelectorAll(".sidebar-section-label").forEach(o=>{let i=!1,n=o.nextElementSibling;for(;n&&n.classList.contains("sidebar-nav-item");){if(n.style.display!=="none"){i=!0;break}n=n.nextElementSibling}o.style.display=i?"":"none"})}}function Ht(t){t.classList.toggle("expanded");const s=t.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",s);const e=t.querySelector("#sidebar-toggle-icon");e.textContent=s?"chevron_left":"chevron_right"}function at(t){const s=t==="/"?"/":"/"+t.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(e=>{e.classList.toggle("active",e.dataset.path===s)})}const Qe=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:tt,updateSidebarAccess:st,updateSidebarActive:at},Symbol.toStringTag,{value:"Module"}));function nt(){const t=document.createElement("header");t.className="topbar",t.id="topbar",t.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${it()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const s=t.querySelector("#global-search");let e;s.addEventListener("input",d=>{clearTimeout(e),e=setTimeout(()=>{const r=d.target.value.trim();r.length>=2?_t(r):ze()},300)}),s.addEventListener("blur",()=>{setTimeout(ze,200)}),t.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const r=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",r),localStorage.setItem("simpro_theme",r),t.querySelector("#theme-icon").textContent=r==="dark"?"light_mode":"dark_mode"}),Rt();const i=t.querySelector("#btn-notifications"),n=t.querySelector(".notification-dot");function a(){m.getAll("notifications").filter(l=>!l.read).length>0?n.style.display="block":n.style.display="none"}return m.on("notifications",a),a(),i.addEventListener("click",d=>{d.stopPropagation(),Ft(i)}),ot(t),t}function ot(t){const s=t||document.getElementById("topbar");if(!s)return;const e=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),o=s.querySelector("#topbar-name"),i=s.querySelector("#topbar-role"),n=s.querySelector("#topbar-avatar");if(o&&(o.textContent=e.name||"Unknown User"),i){const a={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"};i.textContent=a[e.role]||e.role}if(n){const d=(e.name||"").split(" ").map(r=>r[0]).join("").substring(0,2).toUpperCase()||"U";n.textContent=d}}function Ft(t){let s=document.querySelector("#notifications-dropdown");if(s){s.remove();return}const e=m.getAll("notifications").sort((a,d)=>new Date(d.createdAt)-new Date(a.createdAt));s=document.createElement("div"),s.className="dropdown-menu",s.id="notifications-dropdown",s.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const o=document.createElement("div");o.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",o.innerHTML='<h4 style="margin:0">Notifications</h4>';const i=document.createElement("button");i.className="btn btn-ghost btn-sm",i.textContent="Mark all as read",i.onclick=()=>{const a=m.getAll("notifications");let d=!1;a.forEach(r=>{r.read||(r.read=!0,r.updatedAt=new Date().toISOString(),d=!0)}),d&&m.save("notifications",a),s.remove()},o.appendChild(i),s.appendChild(o),e.length===0?s.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':e.forEach(a=>{const d=document.createElement("div");d.className="dropdown-item",d.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${a.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,d.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${a.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${a.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(a.createdAt).toLocaleString()}</div>
        </div>
      `,d.addEventListener("click",()=>{if(m.update("notifications",a.id,{read:!0}),a.link){const{router:r}=window.__simproApp||{};r&&r.navigate(a.link)}s.remove()}),s.appendChild(d)}),t.parentNode.style.position="relative",t.parentNode.appendChild(s);const n=a=>{!s.contains(a.target)&&a.target!==t&&!t.contains(a.target)&&(s.remove(),document.removeEventListener("click",n))};document.addEventListener("click",n)}function _t(t){ze();const{store:s}=window.__simproApp||{};if(!s)return;const e=[],o=t.toLowerCase();if(s.getAll("customers").forEach(n=>{(n.company.toLowerCase().includes(o)||`${n.firstName} ${n.lastName}`.toLowerCase().includes(o))&&e.push({type:"Customer",label:n.company,icon:"people",path:`/people/${n.id}`})}),s.getAll("jobs").forEach(n=>{(n.number.toLowerCase().includes(o)||n.title.toLowerCase().includes(o)||n.customerName.toLowerCase().includes(o))&&e.push({type:"Job",label:`${n.number} — ${n.title}`,icon:"build",path:`/jobs/${n.id}`})}),s.getAll("quotes").forEach(n=>{var a;(n.number.toLowerCase().includes(o)||(a=n.title)!=null&&a.toLowerCase().includes(o)||n.customerName.toLowerCase().includes(o))&&e.push({type:"Quote",label:`${n.number} — ${n.customerName}`,icon:"request_quote",path:`/quotes/${n.id}`})}),s.getAll("invoices").forEach(n=>{(n.number.toLowerCase().includes(o)||n.customerName.toLowerCase().includes(o))&&e.push({type:"Invoice",label:`${n.number} — ${n.customerName}`,icon:"receipt_long",path:`/invoices/${n.id}`})}),e.length===0)return;const i=document.createElement("div");i.className="dropdown-menu",i.id="search-results",i.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",e.slice(0,12).forEach(n=>{const a=document.createElement("button");a.className="dropdown-item",a.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${n.icon}</span>
      <span style="flex:1" class="truncate">${n.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${n.type}</span>
    `,a.addEventListener("click",()=>{const{router:d}=window.__simproApp||{};d&&d.navigate(n.path),ze(),document.querySelector("#global-search").value=""}),i.appendChild(a)}),document.querySelector(".topbar-search").appendChild(i)}function ze(){const t=document.querySelector("#search-results");t&&t.remove()}function it(){return localStorage.getItem("simpro_theme")||"light"}function Rt(){it()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const We=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:nt,updateTopbarAccess:ot},Symbol.toStringTag,{value:"Module"})),Bt={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function Ot(t){const s=document.getElementById("breadcrumb");if(!s)return;if(t==="/"){s.style.display="none";return}s.style.display="flex";const e=t.split("/").filter(Boolean);let o=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,i="";e.forEach((n,a)=>{i+="/"+n;const d=a===e.length-1,r=Bt[i]||decodeURIComponent(n);o+='<span class="breadcrumb-separator">›</span>',d?o+=`<span class="breadcrumb-item current">${r}</span>`:o+=`<span class="breadcrumb-item" data-path="${i}">${r}</span>`}),s.innerHTML=o,s.querySelectorAll(".breadcrumb-item[data-path]").forEach(n=>{n.addEventListener("click",()=>{const{router:a}=window.__simproApp||{};a&&a.navigate(n.dataset.path)})})}function he(t){const s=document.getElementById("breadcrumb");if(!s)return;const e=s.querySelector(".breadcrumb-item.current");e&&(e.textContent=t)}const Ut="modulepreload",Jt=function(t){return"/"+t},Ge={},me=function(s,e,o){let i=Promise.resolve();if(e&&e.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),d=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));i=Promise.allSettled(e.map(r=>{if(r=Jt(r),r in Ge)return;Ge[r]=!0;const l=r.endsWith(".css"),y=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${y}`))return;const u=document.createElement("link");if(u.rel=l?"stylesheet":Ut,l||(u.as="script"),u.crossOrigin="",u.href=r,d&&u.setAttribute("nonce",d),document.head.appendChild(u),l)return new Promise((c,b)=>{u.addEventListener("load",c),u.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${r}`)))})}))}function n(a){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=a,window.dispatchEvent(d),!d.defaultPrevented)throw a}return i.then(a=>{for(const d of a||[])d.status==="rejected"&&n(d.reason);return s().catch(n)})};let $e=!1,ce=null;const Ie={S:{w:3,h:3,label:"Small"},M:{w:6,h:3,label:"Medium"},L:{w:6,h:5,label:"Large"},XL:{w:12,h:4,label:"Extra Large"}},Vt=["S","M","L","XL"],Se={"kpi-cards":{title:"KPI Cards",sizes:["XL"],defaultSize:"XL",render:Wt},"job-status-chart":{title:"Job Status Chart",sizes:["M","L"],defaultSize:"M",render:Gt},"tech-map":{title:"Technician GPS Map",sizes:["M","L"],defaultSize:"L",render:Yt},"recent-activity":{title:"Recent Activity",sizes:["M","XL"],defaultSize:"XL",render:Kt},"recent-leads":{title:"Recent Leads",sizes:["M","L"],defaultSize:"L",render:Xt},"today-schedule":{title:"Today's Schedule",sizes:["M","L"],defaultSize:"L",render:Zt},"pinned-job":{title:"Pinned Job Progress",sizes:["S","M"],defaultSize:"M",render:()=>le("Select a job to pin")},"unassigned-jobs":{title:"Unassigned Jobs Queue",sizes:["M","L"],defaultSize:"M",render:()=>le("No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",sizes:["M","L"],defaultSize:"M",render:()=>le("All completed jobs invoiced")},"low-stock":{title:"Low Stock Alerts",sizes:["S","M"],defaultSize:"S",render:()=>le("Inventory looks good")},"profitability-chart":{title:"Profitability Chart",sizes:["M","L","XL"],defaultSize:"L",render:()=>le("Mock Profitability Data")},"staff-availability":{title:"Staff Availability Board",sizes:["M","L"],defaultSize:"M",render:()=>le("All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",sizes:["S","M"],defaultSize:"S",render:()=>le("No timesheet alerts")},"fleet-status":{title:"Fleet Status Alerts",sizes:["S","M"],defaultSize:"M",render:()=>le("Fleet operational")},"overdue-maintenance":{title:"Overdue Maintenance",sizes:["S","M"],defaultSize:"M",render:()=>le("No overdue maintenance")},"top-customers":{title:"Top Customers Leaderboard",sizes:["M","L"],defaultSize:"M",render:()=>le("Mock Top Customers")},"daily-todo":{title:"Daily Quick To-Do",sizes:["S","M"],defaultSize:"S",render:()=>le("No tasks added")},"pending-approvals":{title:"Pending Approvals",sizes:["S","M"],defaultSize:"M",render:()=>le("No pending quotes")},"customer-nps":{title:"Customer Satisfaction (NPS)",sizes:["S","M"],defaultSize:"S",render:()=>le("NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",sizes:["S","M"],defaultSize:"M",render:()=>le("+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",sizes:["S","M"],defaultSize:"S",render:()=>le("Sunny, 24°C")}};function le(t){return`<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:14px;text-align:center;padding:16px;">${t}</div>`}const Fe=[{id:"kpi-cards",x:0,y:0,size:"XL"},{id:"job-status-chart",x:0,y:4,size:"M"},{id:"tech-map",x:6,y:4,size:"L"},{id:"recent-activity",x:0,y:9,size:"XL"},{id:"recent-leads",x:0,y:13,size:"L"},{id:"today-schedule",x:6,y:13,size:"L"}];function Qt(t){let s=Fe;try{const r=localStorage.getItem("dashboardLayout");r&&(s=JSON.parse(r))}catch{}const e={customers:m.getAll("customers"),jobs:m.getAll("jobs"),quotes:m.getAll("quotes"),invoices:m.getAll("invoices"),leads:m.getAll("leads"),people:m.getAll("people")};t.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <h1 style="margin:0;">Dashboard</h1>
        <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
          <span class="material-icons-outlined" style="font-size:18px;">edit</span> Customise
        </button>
      </div>
      <div id="dashboard-actions" style="display:flex;gap:8px;"></div>
    </div>
    <div id="grid-container" class="grid-stack"></div>`;const o=t.querySelector("#grid-container");function i(r,l){const y=Se[r.id];if(!y)return"";const u=Ie[r.size]||Ie[y.defaultSize];Vt.indexOf(r.size);const c=y.sizes,b=c[(c.indexOf(r.size)+1)%c.length],p=l?`
      <div style="display:flex;align-items:center;gap:4px;">
        <button class="btn btn-ghost btn-icon btn-sm btn-cycle-size" data-id="${r.id}" data-next="${b}" title="Size: ${r.size} → ${b}">
          <span class="material-icons-outlined" style="font-size:15px;">aspect_ratio</span>
        </button>
        <span style="font-size:11px;color:var(--text-tertiary);font-weight:600;">${r.size}</span>
        <button class="btn btn-ghost btn-icon btn-sm btn-remove-module" data-id="${r.id}">
          <span class="material-icons-outlined" style="font-size:15px;">close</span>
        </button>
      </div>`:"";return`
      <div class="grid-stack-item" gs-id="${r.id}" gs-x="${r.x||0}" gs-y="${r.y||0}" gs-w="${u.w}" gs-h="${u.h}" gs-no-resize="true">
        <div class="grid-stack-item-content" style="border-radius:8px;overflow:hidden;display:flex;flex-direction:column;height:100%;background:var(--card-bg);border:1px solid var(--card-border);box-shadow:var(--card-shadow);">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color);flex-shrink:0;${l?"background:rgba(27,109,224,0.04);":""}">
            <span style="font-weight:600;font-size:14px;">${y.title}</span>
            ${p}
          </div>
          <div style="flex:1;overflow:hidden;min-height:0;">
            ${y.render(e)}
          </div>
        </div>
      </div>`}function n(){if(o.innerHTML="",s.forEach(r=>{const l=Se[r.id];l&&(r.size||(r.size=l.defaultSize),o.insertAdjacentHTML("beforeend",i(r,$e)))}),ce)try{ce.destroy(!1)}catch{}if(typeof GridStack>"u"){o.innerHTML='<div style="padding:24px;text-align:center;color:var(--color-danger);">GridStack failed to load. Check index.html CDN links.</div>';return}ce=GridStack.init({column:12,cellHeight:80,margin:10,staticGrid:!$e,disableResize:!0,disableOneColumnMode:!0,animate:!0},o),o.querySelectorAll(".btn-remove-module").forEach(r=>{r.addEventListener("click",l=>{const y=l.currentTarget.dataset.id;s=s.filter(c=>c.id!==y);const u=o.querySelector(`.grid-stack-item[gs-id="${y}"]`);u&&ce&&ce.removeWidget(u)})}),o.querySelectorAll(".btn-cycle-size").forEach(r=>{r.addEventListener("click",l=>{const y=l.currentTarget.dataset.id,u=l.currentTarget.dataset.next,c=s.find(A=>A.id===y);if(!c)return;c.size=u;const b=Ie[u],p=o.querySelector(`.grid-stack-item[gs-id="${y}"]`);p&&ce&&ce.update(p,{w:b.w,h:b.h});const x=p.querySelector(".btn-cycle-size"),v=Se[y].sizes,w=v[(v.indexOf(u)+1)%v.length];if(x){x.dataset.next=w,x.title=`Size: ${u} → ${w}`;const A=x.parentElement.querySelector("span:not(.material-icons-outlined)");A&&(A.textContent=u)}})})}function a(){const r=t.querySelector("#dashboard-actions"),l=t.querySelector("#btn-edit-dashboard");$e?(l.style.display="none",r.innerHTML=`
        <button class="btn btn-secondary btn-sm" id="btn-add-module"><span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget</button>
        <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-layout"><span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout</button>`,r.querySelector("#btn-save-layout").addEventListener("click",()=>{ce&&(s=ce.engine.nodes.map(y=>{var u,c;return{id:y.el.getAttribute("gs-id"),x:y.x,y:y.y,size:((u=s.find(b=>b.id===y.el.getAttribute("gs-id")))==null?void 0:u.size)||((c=Se[y.el.getAttribute("gs-id")])==null?void 0:c.defaultSize)||"M"}}),localStorage.setItem("dashboardLayout",JSON.stringify(s))),$e=!1,a(),n()}),r.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const y=localStorage.getItem("dashboardLayout");y?s=JSON.parse(y):s=Fe}catch{s=Fe}$e=!1,a(),n()}),r.querySelector("#btn-add-module").addEventListener("click",d)):(l.style.display="",r.innerHTML=`
        <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'"><span class="material-icons-outlined" style="font-size:16px;">add</span> New Job</button>
        <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'"><span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote</button>`)}t.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{$e=!0,a(),n()});function d(){const r=s.map(u=>u.id),l=Object.entries(Se).filter(([u])=>!r.includes(u)),y=document.createElement("div");y.innerHTML=l.length===0?'<p style="text-align:center;color:var(--text-tertiary);">All modules are on your dashboard!</p>':`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${l.map(([u,c])=>`
            <div data-id="${u}" style="padding:12px 14px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;" 
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:20px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${c.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Sizes: ${c.sizes.join(", ")}</div>
              </div>
            </div>`).join("")}
        </div>`,me(async()=>{const{showModal:u}=await Promise.resolve().then(()=>ns);return{showModal:u}},void 0).then(({showModal:u})=>{u({title:"Add Widget",content:y,actions:[{label:"Close",className:"btn-secondary",onClick:c=>c()}]}),y.querySelectorAll("[data-id]").forEach(c=>{c.addEventListener("click",b=>{var w,A,P;const p=b.currentTarget.dataset.id,x=Se[p],g={id:p,x:0,y:0,size:x.defaultSize};s.push(g),Ie[x.defaultSize];const v=i(g,!0);if(ce){const O=ce.addWidget(v.trim());(w=O.querySelector(".btn-remove-module"))==null||w.addEventListener("click",()=>{s=s.filter(F=>F.id!==p),ce.removeWidget(O)}),(A=O.querySelector(".btn-cycle-size"))==null||A.addEventListener("click",F=>{const Y=F.currentTarget.dataset.next;g.size=Y;const E=Ie[Y];ce.update(O,{w:E.w,h:E.h})})}(P=document.querySelector(".modal-overlay"))==null||P.remove()})})})}a(),n()}function Wt(t){const s=t.jobs.filter(a=>a.status==="In Progress"||a.status==="Scheduled").length,e=t.quotes.filter(a=>a.status==="Sent"||a.status==="Draft").length,o=t.invoices.filter(a=>a.status==="Overdue").length;return`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px;height:100%;box-sizing:border-box;">
    ${[{label:"Total Revenue",value:"$"+t.invoices.filter(a=>a.status==="Paid").reduce((a,d)=>a+(d.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",positive:!0},{label:"Active Jobs",value:s,icon:"build",color:"green",sub:`${t.jobs.length} total`,positive:!0},{label:"Pending Quotes",value:e,icon:"request_quote",color:"orange",sub:`${t.quotes.length} total`,positive:null},{label:"Overdue Invoices",value:o,icon:"warning",color:"red",sub:o>0?"Requires attention":"All on track",positive:o===0}].map(a=>`
      <div class="stat-card" style="margin:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="stat-label">${a.label}</div>
          <div class="stat-icon ${a.color}"><span class="material-icons-outlined">${a.icon}</span></div>
        </div>
        <div class="stat-value">${a.value}</div>
        <div class="stat-change ${a.positive===!0?"positive":a.positive===!1?"negative":""}">
          <span style="font-size:12px;">${a.sub}</span>
        </div>
      </div>`).join("")}
  </div>`}function Gt(t){const s={};t.jobs.forEach(i=>{s[i.status]=(s[i.status]||0)+1});const e=t.jobs.length,o={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="padding:16px;display:flex;flex-direction:column;gap:10px;height:100%;box-sizing:border-box;overflow-y:auto;">
    ${Object.entries(s).map(([i,n])=>{const a=e>0?(n/e*100).toFixed(1):0,d=o[i]||"var(--text-tertiary)";return`<div style="display:flex;align-items:center;gap:10px;">
        <span style="width:90px;font-size:13px;color:var(--text-secondary);flex-shrink:0;">${i}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${a}%;height:100%;background:${d};border-radius:4px;transition:width 0.5s;min-width:${n>0?"6px":"0"};"></div>
        </div>
        <span style="width:24px;text-align:right;font-size:13px;font-weight:600;">${n}</span>
      </div>`}).join("")}
  </div>`}function Yt(t){const s=t.people.filter(o=>o.type==="Staff").slice(0,4);return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${s.length===0?'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;">No technicians active</div>':s.map((o,i)=>{const n=15+i*22+Math.sin(i)*12,a=15+i*18+Math.cos(i)*18;return`<div style="position:absolute;top:${n}%;left:${a}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
          <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.2);margin-bottom:2px;white-space:nowrap;">${o.firstName}</div>
          <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${o.firstName[0]}</div>
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
        </div>`}).join("")}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,0.85);padding:4px 8px;font-size:10px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">Mock Map</div>
  </div>`}function Kt(t){const s=[];return t.jobs.slice(0,3).forEach(e=>s.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${e.number}</strong> — ${e.title}`,sub:e.customerName,time:e.updatedAt})),t.quotes.slice(0,3).forEach(e=>s.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${e.number}</strong> ${e.status.toLowerCase()}`,sub:e.customerName,time:e.updatedAt})),t.invoices.slice(0,2).forEach(e=>s.push({icon:"receipt_long",color:e.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${e.number}</strong> — ${e.status}`,sub:e.customerName,time:e.updatedAt})),s.sort((e,o)=>new Date(o.time)-new Date(e.time)),`<div style="overflow-y:auto;height:100%;padding:0 16px;">
    ${s.map(e=>`<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:30px;height:30px;border-radius:50%;background:${e.color}20;color:${e.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:15px;">${e.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${e.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${e.sub} · ${es(e.time)}</div>
      </div>
    </div>`).join("")}
  </div>`}function Xt(t){const s={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<div style="overflow-y:auto;height:100%;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
      <tbody>${t.leads.slice(0,6).map(e=>`
        <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${e.id}'">
          <td class="cell-link font-medium">${e.title}</td>
          <td style="color:var(--text-secondary);">${e.customerName}</td>
          <td><span class="badge ${s[e.status]||"badge-neutral"}">${e.status}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`}function Zt(t){const s=t.jobs.filter(e=>e.status==="Scheduled"||e.status==="In Progress").slice(0,6);return s.length?`<div style="overflow-y:auto;height:100%;display:flex;flex-direction:column;">
    ${s.map(e=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${e.id}'">
        <div style="width:3px;height:32px;border-radius:2px;flex-shrink:0;background:${e.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.title}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${e.technicianName} · ${e.customerName}</div>
        </div>
        <span class="badge ${e.status==="In Progress"?"badge-primary":"badge-warning"}">${e.status}</span>
      </div>`).join("")}
  </div>`:'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);">No jobs scheduled today</div>'}function es(t){const s=Math.floor((Date.now()-new Date(t))/6e4);if(s<60)return`${s}m ago`;const e=Math.floor(s/60);return e<24?`${e}h ago`:`${Math.floor(e/24)}d ago`}function f(t){return t==null?"":String(t).replace(/[&<>"']/g,function(e){switch(e){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return e}})}function be({columns:t,data:s,onRowClick:e,getId:o,emptyMessage:i="No records found",emptyIcon:n="inbox"}){const a=document.createElement("div");a.className="card";let d=null,r="asc",l=1;const y=15;function u(){let c=[...s];d&&c.sort((v,w)=>{const A=d.getValue?d.getValue(v):v[d.key],P=d.getValue?d.getValue(w):w[d.key];return A==null?1:P==null?-1:typeof A=="string"?r==="asc"?A.localeCompare(P):P.localeCompare(A):r==="asc"?A-P:P-A});const b=Math.ceil(c.length/y);l>b&&(l=b||1);const p=(l-1)*y,x=c.slice(p,p+y);if(s.length===0){a.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${f(n)}</span>
          <h3>${f(i)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let g='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(t.forEach(v=>{const w=d&&d.key===v.key,A=w?" sorted":"",P=w?r==="asc"?"arrow_upward":"arrow_downward":"unfold_more";g+=`<th class="${A}" data-key="${v.key}" style="${v.width?"width:"+v.width:""}">
        ${f(v.label)}
        <span class="material-icons-outlined sort-icon">${P}</span>
      </th>`}),g+="</tr></thead><tbody>",x.forEach(v=>{const w=o?o(v):v.id;g+=`<tr data-id="${f(w)}" style="cursor:pointer">`,t.forEach(A=>{const P=A.render?A.render(v):f(v[A.key]??"");g+=`<td>${P}</td>`}),g+="</tr>"}),g+="</tbody></table></div>",b>1){g+=`<div class="pagination">
        <span class="pagination-info">Showing ${p+1}–${Math.min(p+y,c.length)} of ${c.length}</span>
        <div class="pagination-controls">
          <button ${l===1?"disabled":""} data-page="prev">‹</button>`;for(let v=1;v<=b;v++){if(b>7&&v>2&&v<b-1&&Math.abs(v-l)>1){(v===3||v===b-2)&&(g+="<button disabled>…</button>");continue}g+=`<button class="${v===l?"page-active":""}" data-page="${v}">${v}</button>`}g+=`<button ${l===b?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}a.innerHTML=g,a.querySelectorAll("th[data-key]").forEach(v=>{v.addEventListener("click",()=>{const w=t.find(A=>A.key===v.dataset.key);d===w?r=r==="asc"?"desc":"asc":(d=w,r="asc"),u()})}),e&&a.querySelectorAll("tbody tr[data-id]").forEach(v=>{v.addEventListener("click",()=>e(v.dataset.id))}),a.querySelectorAll(".pagination-controls button[data-page]").forEach(v=>{v.addEventListener("click",()=>{const w=v.dataset.page;w==="prev"?l--:w==="next"?l++:l=parseInt(w),u()})})}return u(),a.updateData=c=>{s=c,u()},a}let fe=null;function ts(){return(!fe||!document.body.contains(fe))&&(fe=document.createElement("div"),fe.className="toast-container",fe.id="toast-container",document.body.appendChild(fe)),fe}function C(t,s="info",e=3500){const o=ts(),i=document.createElement("div");i.className=`toast ${s}`;const n={success:"check_circle",error:"error",warning:"warning",info:"info"};i.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${s==="error"?"danger":s})">${n[s]||n.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${t}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,i.querySelector(".toast-close").addEventListener("click",()=>i.remove()),o.appendChild(i),setTimeout(()=>{i.parentNode&&(i.style.opacity="0",i.style.transform="translateX(20px)",i.style.transition="0.3s ease",setTimeout(()=>i.remove(),300))},e)}function ss(t,s,e){m.create("notifications",{title:t,message:s,link:e,read:!1}),C(`${t}: ${s}`,"info")}const Me=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:ss,showToast:C},Symbol.toStringTag,{value:"Module"}));function as(t){const s=m.getAll("customers");t.innerHTML=`
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
  `;let e=[...s];const i=be({columns:[{key:"company",label:"Company / Name",render:n=>`<span class="cell-link font-medium">${f(n.company)}</span>`},{key:"contact",label:"Contact",render:n=>`${f(n.firstName)} ${f(n.lastName)}`},{key:"email",label:"Email",render:n=>`<span class="text-secondary">${f(n.email)}</span>`},{key:"phone",label:"Phone",render:n=>`<span class="text-secondary">${f(n.phone)}</span>`},{key:"type",label:"Type",render:n=>`<span class="badge badge-neutral">${f(n.type)}</span>`},{key:"status",label:"Status",render:n=>`<span class="badge ${n.status==="Active"?"badge-success":"badge-neutral"}">${f(n.status)}</span>`}],data:e,onRowClick:n=>h.navigate(`/people/${n}`),emptyMessage:"No customers found",emptyIcon:"people"});t.querySelector("#people-table-container").appendChild(i),t.querySelector("#btn-new-person").addEventListener("click",()=>{h.navigate("/people/new")}),t.querySelector("#btn-export-people").addEventListener("click",()=>{C("Customer data exported successfully","success")}),t.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),n.classList.add("active");const a=n.dataset.filter;e=a==="all"?[...s]:s.filter(d=>d.status===a),i.updateData(e)})}),t.querySelector("#people-search").addEventListener("input",n=>{var r;const a=n.target.value.toLowerCase();e=s.filter(l=>l.company.toLowerCase().includes(a)||`${l.firstName} ${l.lastName}`.toLowerCase().includes(a)||l.email.toLowerCase().includes(a));const d=(r=t.querySelector(".toolbar-filter.active"))==null?void 0:r.dataset.filter;d&&d!=="all"&&(e=e.filter(l=>l.status===d)),i.updateData(e)})}function ie({title:t,content:s,size:e="",onClose:o,actions:i=[]}){const n=document.createElement("div");n.className="modal-overlay",n.id="modal-overlay";const a=document.createElement("div");a.className=`modal ${e}`;let d=`
    <div class="modal-header">
      <h3>${f(t)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof s=="string"?f(s):""}</div>
  `;i.length&&(d+='<div class="modal-footer">',i.forEach((y,u)=>{d+=`<button class="btn ${y.className||"btn-secondary"}" id="modal-action-${u}">${f(y.label)}</button>`}),d+="</div>"),a.innerHTML=d,typeof s!="string"&&(s instanceof HTMLElement||s instanceof DocumentFragment)&&(a.querySelector(".modal-body").innerHTML="",a.querySelector(".modal-body").appendChild(s)),n.appendChild(a),document.body.appendChild(n);const r=()=>{n.remove(),o&&o()};a.querySelector("#modal-close-btn").addEventListener("click",r),n.addEventListener("click",y=>{y.target===n&&r()}),i.forEach((y,u)=>{const c=a.querySelector(`#modal-action-${u}`);c&&y.onClick&&c.addEventListener("click",()=>y.onClick(r))});const l=y=>{y.key==="Escape"&&(r(),document.removeEventListener("keydown",l))};return document.addEventListener("keydown",l),{close:r,modal:a,overlay:n}}const ns=Object.freeze(Object.defineProperty({__proto__:null,showModal:ie},Symbol.toStringTag,{value:"Module"}));function Ee({title:t,icon:s,iconBgColor:e="var(--color-primary-light)",iconTextColor:o="var(--color-primary)",metaHtml:i="",actionsHtml:n=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${e};color:${o}">
          <span class="material-icons-outlined">${s}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${t}</h2></div>
          ${i?`<div class="detail-header-meta">${i}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${n}
      </div>
    </div>
  `}function os(t,{id:s}){const e=m.getById("customers",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}he(e.company);const o=m.getAll("jobs").filter(l=>l.customerId===s),i=m.getAll("quotes").filter(l=>l.customerId===s),n=m.getAll("invoices").filter(l=>l.customerId===s);let a="details";function d(){t.innerHTML=`
      ${Ee({title:f(e.company),icon:e.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${f(e.firstName)} ${f(e.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${f(e.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${f(e.phone)}</span>
          <span class="badge ${e.status==="Active"?"badge-success":"badge-neutral"}">${f(e.status)}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-edit-person">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-person">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `})}

      <div class="tabs" id="person-tabs">
        <button class="tab ${a==="details"?"active":""}" data-tab="details">Details</button>
        <button class="tab ${a==="contacts"?"active":""}" data-tab="contacts">Contacts (${(e.contacts||[]).length})</button>
        <button class="tab ${a==="sites"?"active":""}" data-tab="sites">Sites (${(e.sites||[]).length})</button>
        <button class="tab ${a==="assets"?"active":""}" data-tab="assets">Assets (${(e.assets||[]).length})</button>
        <button class="tab ${a==="communications"?"active":""}" data-tab="communications">Communications (${(e.communications||[]).length})</button>
        <button class="tab ${a==="jobs"?"active":""}" data-tab="jobs">Jobs (${o.length})</button>
        <button class="tab ${a==="quotes"?"active":""}" data-tab="quotes">Quotes (${i.length})</button>
        <button class="tab ${a==="invoices"?"active":""}" data-tab="invoices">Invoices (${n.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,r(),t.querySelectorAll(".tab").forEach(l=>{l.addEventListener("click",()=>{a=l.dataset.tab,t.querySelectorAll(".tab").forEach(y=>y.classList.remove("active")),l.classList.add("active"),r()})}),t.querySelector("#btn-edit-person").addEventListener("click",()=>{h.navigate(`/people/${s}/edit`)}),t.querySelector("#btn-delete-person").addEventListener("click",()=>{const l=document.createElement("div");l.innerHTML=`<p>Are you sure you want to delete <strong>${f(e.company)}</strong>? This action cannot be undone.</p>`,ie({title:"Delete Customer",content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:y=>y()},{label:"Delete",className:"btn-danger",onClick:y=>{m.delete("customers",s),C("Customer deleted successfully","success"),y(),h.navigate("/people")}}]})})}function r(){const l=t.querySelector("#tab-content");if(a==="details")l.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${ue("Company",e.company)}
                  ${ue("Contact",`${e.firstName} ${e.lastName}`)}
                  ${ue("Email",e.email)}
                  ${ue("Phone",e.phone)}
                  ${ue("Type",e.type)}
                  ${ue("Status",e.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${ue("Address",e.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${ue("Created",new Date(e.createdAt).toLocaleDateString())}
                  ${ue("Last Updated",new Date(e.updatedAt).toLocaleDateString())}
                  ${ue("Total Jobs",o.length)}
                  ${ue("Total Quotes",i.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(a==="contacts"){const y=e.contacts||[];l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${y.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div id="contact-form" style="display:none;padding:var(--space-base);background:var(--content-bg);border-bottom:1px solid var(--border-color)">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
              <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
              <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button class="btn btn-secondary btn-sm" id="btn-cancel-contact">Cancel</button>
              <button class="btn btn-primary btn-sm" id="btn-save-contact">Save Contact</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${y.map((u,c)=>`
                  <tr>
                    <td class="font-medium">${u.name}</td>
                    <td>${u.role||"—"}</td>
                    <td><a href="mailto:${u.email}" class="cell-link">${u.email}</a></td>
                    <td><a href="tel:${u.phone}" class="cell-link">${u.phone}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${c}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${y.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,l.querySelector("#btn-toggle-contact").addEventListener("click",()=>{l.querySelector("#contact-form").style.display="block"}),l.querySelector("#btn-cancel-contact").addEventListener("click",()=>{l.querySelector("#contact-form").style.display="none"}),l.querySelector("#btn-save-contact").addEventListener("click",()=>{const u=l.querySelector("#new-c-name").value.trim();if(!u)return C("Name is required","error");e.contacts||(e.contacts=[]),e.contacts.push({name:u,role:l.querySelector("#new-c-role").value,email:l.querySelector("#new-c-email").value,phone:l.querySelector("#new-c-phone").value}),m.update("customers",s,{contacts:e.contacts}),C("Contact added","success"),r(),d()}),l.querySelectorAll(".btn-delete-contact").forEach(u=>{u.addEventListener("click",()=>{e.contacts.splice(u.dataset.index,1),m.update("customers",s,{contacts:e.contacts}),C("Contact deleted","success"),r(),d()})})}else if(a==="sites"){const y=e.sites||[];l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${y.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div id="site-form" style="display:none;padding:var(--space-base);background:var(--content-bg);border-bottom:1px solid var(--border-color)">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
              <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
            </div>
            <div class="form-row">
              <div class="form-group" style="grid-column: span 2"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button class="btn btn-secondary btn-sm" id="btn-cancel-site">Cancel</button>
              <button class="btn btn-primary btn-sm" id="btn-save-site">Save Site</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${y.map((u,c)=>`
                  <tr>
                    <td class="font-medium">${u.name}</td>
                    <td>${u.address}</td>
                    <td class="text-secondary">${u.notes||"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${c}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${y.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,l.querySelector("#btn-toggle-site").addEventListener("click",()=>{l.querySelector("#site-form").style.display="block"}),l.querySelector("#btn-cancel-site").addEventListener("click",()=>{l.querySelector("#site-form").style.display="none"}),l.querySelector("#btn-save-site").addEventListener("click",()=>{const u=l.querySelector("#new-s-name").value.trim(),c=l.querySelector("#new-s-address").value.trim();if(!u||!c)return C("Name and Address are required","error");e.sites||(e.sites=[]),e.sites.push({name:u,address:c,notes:l.querySelector("#new-s-notes").value}),m.update("customers",s,{sites:e.sites}),C("Site added","success"),r(),d()}),l.querySelectorAll(".btn-delete-site").forEach(u=>{u.addEventListener("click",()=>{e.sites.splice(u.dataset.index,1),m.update("customers",s,{sites:e.sites}),C("Site deleted","success"),r(),d()})})}else if(a==="assets"){const y=e.assets||[],u=e.sites||[];l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${y.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div id="asset-form" style="display:none;padding:var(--space-base);background:var(--content-bg);border-bottom:1px solid var(--border-color)">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Asset Name *</label><input type="text" id="new-a-name" class="form-input" placeholder="e.g. Carrier HVAC Unit"></div>
              <div class="form-group"><label class="form-label">Serial Number</label><input type="text" id="new-a-serial" class="form-input"></div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Location / Site</label>
                <select id="new-a-site" class="form-select">
                  <option value="">-- No specific site --</option>
                  ${u.map(c=>`<option value="${c.name}">${c.name}</option>`).join("")}
                </select>
              </div>
              <div class="form-group"><label class="form-label">Install Date</label><input type="date" id="new-a-date" class="form-input"></div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button class="btn btn-secondary btn-sm" id="btn-cancel-asset">Cancel</button>
              <button class="btn btn-primary btn-sm" id="btn-save-asset">Save Asset</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${y.map((c,b)=>`
                  <tr>
                    <td class="font-medium">${c.name}</td>
                    <td style="font-family:monospace" class="text-secondary">${c.serial||"—"}</td>
                    <td>${c.site||"—"}</td>
                    <td>${c.installDate?new Date(c.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-index="${b}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${y.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,l.querySelector("#btn-toggle-asset").addEventListener("click",()=>{l.querySelector("#asset-form").style.display="block"}),l.querySelector("#btn-cancel-asset").addEventListener("click",()=>{l.querySelector("#asset-form").style.display="none"}),l.querySelector("#btn-save-asset").addEventListener("click",()=>{const c=l.querySelector("#new-a-name").value.trim();if(!c)return C("Asset Name is required","error");e.assets||(e.assets=[]),e.assets.push({name:c,serial:l.querySelector("#new-a-serial").value,site:l.querySelector("#new-a-site").value,installDate:l.querySelector("#new-a-date").value}),m.update("customers",s,{assets:e.assets}),C("Asset tracking started","success"),r(),d()}),l.querySelectorAll(".btn-delete-asset").forEach(c=>{c.addEventListener("click",()=>{e.assets.splice(c.dataset.index,1),m.update("customers",s,{assets:e.assets}),C("Asset disabled/deleted","success"),r(),d()})})}else if(a==="communications"){const u=[...e.communications||[]].sort((c,b)=>new Date(b.date)-new Date(c.date));l.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div id="comm-form" style="display:none;padding:var(--space-base);background:var(--content-bg);border-bottom:1px solid var(--border-color)">
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
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
              <button class="btn btn-secondary btn-sm" id="btn-cancel-comm">Cancel</button>
              <button class="btn btn-primary btn-sm" id="btn-save-comm">Save Activity</button>
            </div>
          </div>
          <div class="card-body">
            ${u.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${u.map((c,b)=>`
                  <div style="display:flex;gap:12px;border-bottom:1px solid var(--border-color);padding-bottom:12px">
                    <div style="background:var(--color-${c.type==="Email"?"info":c.type==="Call"?"success":"neutral"}-bg);color:var(--color-${c.type==="Email"?"info":c.type==="Call"?"success":"neutral"});padding:8px;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span class="material-icons-outlined" style="font-size:20px">${c.type==="Email"?"mail":c.type==="Call"?"phone":"sticky_note_2"}</span>
                    </div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                        <strong style="font-size:var(--font-size-md)">${c.type}</strong>
                        <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">${new Date(c.date).toLocaleDateString()}</span>
                      </div>
                      <div style="color:var(--text-secondary);white-space:pre-wrap;font-size:var(--font-size-sm)">${c.content}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      `,l.querySelector("#btn-toggle-comm").addEventListener("click",()=>{l.querySelector("#comm-form").style.display="block"}),l.querySelector("#btn-cancel-comm").addEventListener("click",()=>{l.querySelector("#comm-form").style.display="none"}),l.querySelector("#btn-save-comm").addEventListener("click",()=>{const c=l.querySelector("#new-comm-content").value.trim();if(!c)return C("Details are required","error");e.communications||(e.communications=[]),e.communications.push({id:Date.now().toString(),type:l.querySelector("#new-comm-type").value,date:l.querySelector("#new-comm-date").value,content:c}),m.update("customers",s,{communications:e.communications}),C("Activity logged","success"),r(),d()})}else a==="jobs"?l.innerHTML=_e(o,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):a==="quotes"?(l.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${_e(i,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,l.querySelector("#btn-create-quote").addEventListener("click",()=>{h.navigate("/quotes/new?customerId="+s)})):a==="invoices"&&(l.innerHTML=_e(n,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}d()}function ue(t,s){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${f(t)}</span>
      <span style="font-size:var(--font-size-base)">${f(s)}</span>
    </div>
  `}function _e(t,s,e,o){if(t.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${o}</h3></div></div>`;const i=n=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[n]||"neutral"}">${f(n)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${s.map(n=>`<th>${f(n.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${t.map(n=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${e}/${f(n.id)}'">
                ${s.map(a=>{let d=n[a.key];return a.badge?d=i(d):a.format==="currency"?d=`$${(d||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:a.format==="date"?d=d?new Date(d).toLocaleDateString():"—":d=f(d),`<td>${d}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function rt(t,{id:s}){const e=s&&s!=="new",o=e?m.getById("customers",s):{};t.innerHTML=`
    <div class="page-header">
      <h1>${e?"Edit Customer":"New Customer"}</h1>
    </div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="person-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Company Name *</label>
              <input class="form-input" name="company" value="${o.company||""}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                <option value="Company" ${o.type==="Company"?"selected":""}>Company</option>
                <option value="Individual" ${o.type==="Individual"?"selected":""}>Individual</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name *</label>
              <input class="form-input" name="firstName" value="${o.firstName||""}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name *</label>
              <input class="form-input" name="lastName" value="${o.lastName||""}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" name="email" value="${o.email||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" name="phone" value="${o.phone||""}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" name="address" value="${o.address||""}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                <option value="Active" ${o.status==="Active"||!e?"selected":""}>Active</option>
                <option value="Inactive" ${o.status==="Inactive"?"selected":""}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${o.notes||""}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save">
          <span class="material-icons-outlined">save</span> ${e?"Update":"Create"} Customer
        </button>
      </div>
    </div>
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>{h.navigate(e?`/people/${s}`:"/people")}),t.querySelector("#btn-save").addEventListener("click",()=>{const i=t.querySelector("#person-form");if(!i.checkValidity()){i.reportValidity();return}const n=new FormData(i),a=Object.fromEntries(n);if(e)m.update("customers",s,a),C("Customer updated successfully","success"),h.navigate(`/people/${s}`);else{const d=m.create("customers",a);C("Customer created successfully","success"),h.navigate(`/people/${d.id}`)}})}function is(t){const s=m.getAll("leads");t.innerHTML=`
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
  `;let e=[...s];const o={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},i={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},a=be({columns:[{key:"title",label:"Lead",render:d=>`<span class="cell-link font-medium">${f(d.title)}</span>`},{key:"customerName",label:"Customer",render:d=>`<span class="text-secondary">${f(d.customerName)}</span>`},{key:"source",label:"Source",render:d=>`<span class="text-secondary">${f(d.source)}</span>`},{key:"status",label:"Status",render:d=>`<span class="badge ${o[d.status]||"badge-neutral"}">${f(d.status)}</span>`},{key:"priority",label:"Priority",render:d=>`<span class="badge ${i[d.priority]||"badge-neutral"}">${f(d.priority)}</span>`},{key:"value",label:"Value",render:d=>`<span class="font-medium">$${(d.value||0).toLocaleString()}</span>`,getValue:d=>d.value},{key:"createdAt",label:"Created",render:d=>`<span class="text-secondary">${new Date(d.createdAt).toLocaleDateString()}</span>`,getValue:d=>new Date(d.createdAt).getTime()}],data:e,onRowClick:d=>h.navigate(`/leads/${d}`),emptyMessage:"No leads found",emptyIcon:"trending_up"});t.querySelector("#leads-table-container").appendChild(a),t.querySelector("#btn-new-lead").addEventListener("click",()=>h.navigate("/leads/new")),t.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(l=>l.classList.remove("active")),d.classList.add("active");const r=d.dataset.filter;e=r==="all"?[...s]:s.filter(l=>l.status===r),a.updateData(e)})}),t.querySelector("#leads-search").addEventListener("input",d=>{const r=d.target.value.toLowerCase();e=s.filter(l=>l.title.toLowerCase().includes(r)||l.customerName.toLowerCase().includes(r)),a.updateData(e)})}function rs(t,{id:s}){const e=m.getById("leads",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}he(e.title);const o={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"};t.innerHTML=`
    ${Ee({title:e.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
        <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${e.customerName}</span>
        <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${e.contactName}</span>
        <span class="badge ${o[e.status]||"badge-neutral"}">${e.status}</span>
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
            ${ge("Title",e.title)}
            ${ge("Customer",e.customerName)}
            ${ge("Contact",e.contactName)}
            ${ge("Source",e.source)}
            ${ge("Priority",e.priority)}
            ${ge("Status",e.status)}
            ${ge("Estimated Value","$"+(e.value||0).toLocaleString())}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Description & Notes</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary);line-height:1.6">${e.description||"No description provided."}</p>
        </div>
      </div>
    </div>
  `,t.querySelector("#btn-convert-quote").addEventListener("click",()=>{const i=m.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:e.customerId,customerName:e.customerName,contactName:e.contactName,title:e.title,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0});m.update("leads",s,{status:"Won"}),C("Lead converted to quote successfully","success"),h.navigate(`/quotes/${i.id}`)}),t.querySelector("#btn-edit-lead").addEventListener("click",()=>h.navigate(`/leads/${s}/edit`)),t.querySelector("#btn-delete-lead").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`<p>Delete <strong>${f(e.title)}</strong>?</p>`,ie({title:"Delete Lead",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{m.delete("leads",s),C("Lead deleted","success"),n(),h.navigate("/leads")}}]})})}function ge(t,s){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${t}</span><span>${s}</span></div>`}function lt(t,{id:s}){const e=s&&s!=="new",o=e?m.getById("leads",s):{},i=m.getAll("customers");t.innerHTML=`
    <div class="page-header"><h1>${e?"Edit Lead":"New Lead"}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="lead-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${o.title||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" name="customerId" required>
                <option value="">Select customer...</option>
                ${i.map(n=>`<option value="${n.id}" ${o.customerId===n.id?"selected":""}>${n.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(n=>`<option ${o.source===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(n=>`<option ${o.status===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(n=>`<option ${o.priority===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Estimated Value ($)</label>
            <input class="form-input" type="number" name="value" value="${o.value||""}" step="0.01" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" name="description">${o.description||""}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${e?"Update":"Create"} Lead</button>
      </div>
    </div>
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>h.navigate(e?`/leads/${s}`:"/leads")),t.querySelector("#btn-save").addEventListener("click",()=>{const n=t.querySelector("#lead-form");if(!n.checkValidity()){n.reportValidity();return}const a=Object.fromEntries(new FormData(n));a.value=parseFloat(a.value)||0;const d=i.find(r=>r.id===a.customerId);if(a.customerName=(d==null?void 0:d.company)||"",a.contactName=d?`${d.firstName} ${d.lastName}`:"",e)m.update("leads",s,a),C("Lead updated","success"),h.navigate(`/leads/${s}`);else{const r=m.create("leads",a);C("Lead created","success"),h.navigate(`/leads/${r.id}`)}})}function ls(t){const s=m.getAll("quotes");t.innerHTML=`
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
  `;let e=[...s];const o={Draft:"badge-neutral",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},n=be({columns:[{key:"number",label:"Quote #",render:a=>`<span class="cell-link font-medium">${f(a.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:a=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${f(a.title||"")}</span>`},{key:"status",label:"Status",render:a=>`<span class="badge ${o[a.status]||"badge-neutral"}">${f(a.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:a=>`<span class="font-semibold">$${(a.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:a=>a.total,width:"110px"},{key:"createdAt",label:"Date",render:a=>new Date(a.createdAt).toLocaleDateString(),getValue:a=>new Date(a.createdAt).getTime(),width:"100px"}],data:e,onRowClick:a=>h.navigate(`/quotes/${a}`),emptyMessage:"No quotes found",emptyIcon:"request_quote"});t.querySelector("#quotes-table-container").appendChild(n),t.querySelector("#btn-new-quote").addEventListener("click",()=>h.navigate("/quotes/new")),t.querySelectorAll(".toolbar-filter").forEach(a=>{a.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(r=>r.classList.remove("active")),a.classList.add("active");const d=a.dataset.filter;e=d==="all"?[...s]:s.filter(r=>r.status===d),n.updateData(e)})}),t.querySelector("#quotes-search").addEventListener("input",a=>{const d=a.target.value.toLowerCase();e=s.filter(r=>r.number.toLowerCase().includes(d)||r.customerName.toLowerCase().includes(d)||(r.title||"").toLowerCase().includes(d)),n.updateData(e)})}function dt({type:t,data:s}){const e=document.createElement("div");e.className="modal-overlay",e.id="print-preview-overlay",e.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const o=document.createElement("div");o.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const i=document.createElement("div");i.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;",i.innerHTML=`
    <span style="font-weight:600;font-size:14px">${t==="quote"?"Quote":"Invoice"} Preview — ${s.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const n=document.createElement("div");n.id="print-document",n.className="print-document",n.innerHTML=Ye(t,s),o.appendChild(i),o.appendChild(n),e.appendChild(o),document.body.appendChild(e);const a=()=>e.remove();i.querySelector("#btn-close-preview").addEventListener("click",a),e.addEventListener("click",r=>{r.target===e&&a()}),i.querySelector("#btn-print-pdf").addEventListener("click",()=>{const r=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.number} — ${t==="quote"?"Quote":"Invoice"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${ds()}</style>
      </head>
      <body>
        ${Ye(t,s)}
      </body>
      </html>
    `,l=`${t==="quote"?"Quote":"Invoice"} ${s.number}`;if(!m.getAll("documents").find(b=>b.entityId===s.id&&b.name===l)){const b=`data:text/html;charset=utf-8,${encodeURIComponent(r)}`;m.create("documents",{name:l,type:t==="quote"?"Quote PDF":"Invoice PDF",size:r.length,url:b,folder:t==="quote"?"Quotes":"Invoices",uploadedAt:new Date().toISOString(),entityType:t==="quote"?"Quote":"Invoice",entityId:s.id,entityName:s.customerName||"Unknown Customer"}),me(async()=>{const{showToast:p}=await Promise.resolve().then(()=>Me);return{showToast:p}},void 0).then(({showToast:p})=>{p(`${l} saved to Documents`,"success")})}const c=window.open("","_blank","width=800,height=1000");c.document.write(r),c.document.close(),setTimeout(()=>{c.print()},500)});const d=r=>{r.key==="Escape"&&(a(),document.removeEventListener("keydown",d))};document.addEventListener("keydown",d)}function Ye(t,s){const e=t==="quote",i={Draft:"#6B7280",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[s.status]||"#6B7280",n=s.customerName||"Customer",a=s.contactName||"",d=s.lineItems||[];return`
    <div class="pdf-page">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-company">
          <div class="pdf-logo">S</div>
          <div>
            <div class="pdf-company-name">SimPro Demo Company</div>
            <div class="pdf-company-detail">ABN: 12 345 678 901</div>
            <div class="pdf-company-detail">123 Business St, Melbourne VIC 3000</div>
            <div class="pdf-company-detail">Phone: 1300 123 456</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${e?"QUOTE":"TAX INVOICE"}</div>
          <div class="pdf-doc-number">${s.number}</div>
          <div class="pdf-status" style="background:${i}15;color:${i};border:1px solid ${i}40">${s.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${e?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${n}</div>
          ${a?`<div class="pdf-info-value">Attn: ${a}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${e?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${Re(e?s.createdAt:s.issueDate)}</span>
          </div>
          ${e?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Valid Until</span>
              <span class="pdf-info-value">${Re(s.validUntil)}</span>
            </div>
          `:`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Due Date</span>
              <span class="pdf-info-value">${Re(s.dueDate)}</span>
            </div>
          `}
          ${!e&&s.jobNumber?`
            <div class="pdf-info-row">
              <span class="pdf-info-label">Job Reference</span>
              <span class="pdf-info-value">${s.jobNumber}</span>
            </div>
          `:""}
          ${e&&s.title?`
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
            <th style="width:50%">Description</th>
            ${e?`
              <th style="width:12%;text-align:center">Type</th>
              <th style="width:10%;text-align:center">Qty</th>
              <th style="width:13%;text-align:right">Rate</th>
            `:""}
            <th style="width:${e?"15":"25"}%;text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${d.map(r=>`
            <tr>
              <td>${r.description?f(r.description):"—"}</td>
              ${e?`
                <td style="text-align:center"><span class="pdf-type-tag">${(r.type||"other").charAt(0).toUpperCase()+(r.type||"other").slice(1)}</span></td>
                <td style="text-align:center">${r.qty||1}</td>
                <td style="text-align:right">$${(r.rate||0).toFixed(2)}</td>
              `:""}
              <td style="text-align:right;font-weight:600">$${(e?r.total||0:r.amount||0).toFixed(2)}</td>
            </tr>
          `).join("")}
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
          ${e?"This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.":"Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business."}
        </div>
        <div class="pdf-footer-company">SimPro Demo Company — admin@simprogroup.com — 1300 123 456</div>
      </div>
    </div>
  `}function Re(t){if(!t)return"—";try{return new Date(t).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return t}}function ds(){return`
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
  `}function ct(t,{id:s,customerId:e}){const o=s==="new";let i=o?{status:"Draft",version:1,sections:[{id:m.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:e||""}:m.getById("quotes",s);if(!i){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Quote not found</h3></div>';return}i.lineItems&&!i.sections&&(i.sections=[{id:m.generateId(),name:"Main Phase",lineItems:[...i.lineItems]}],delete i.lineItems),o||he(i.number+(i.version>1?` v${i.version}`:""));const n=m.getAll("customers"),a=m.getAll("stock"),d=m.getSettings(),r={Draft:"badge-neutral",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function l(){t.innerHTML=`
      ${Ee({title:`${o?"New Quote":i.number} ${i.version>1?`<span class="badge badge-neutral">v${i.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:`
          ${i.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${i.customerName}</span>`:""}
          <span class="badge ${r[i.status]||"badge-neutral"}">${i.status}</span>
        `,actionsHtml:`
          ${o?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!o&&i.status!=="Archived"?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!o&&i.status==="Accepted"?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!o&&i.status==="Draft"?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                <a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>
                ${o?"":'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>'}
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
              <select class="form-select" id="quote-customer" ${i.status==="Archived"?"disabled":""}>
                <option value="">Select customer...</option>
                ${n.map(p=>`<option value="${p.id}" ${i.customerId===p.id?"selected":""}>${p.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input class="form-input" id="quote-title" value="${i.title||""}" placeholder="Quote description..." ${i.status==="Archived"?"disabled":""} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="quote-status" ${i.status==="Archived"?"disabled":""}>
                ${["Draft","Sent","Accepted","Declined","Archived"].map(p=>`<option ${i.status===p?"selected":""}>${p}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${i.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${d.laborRates.map(p=>`<option value="${p.id}" ${i.laborProfileId===p.id?"selected":""}>${p.name} ($${p.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input class="form-input" type="date" id="quote-valid" value="${i.validUntil?i.validUntil.split("T")[0]:""}" ${i.status==="Archived"?"disabled":""} />
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${a.map(p=>`<option value="${p.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(i.sections||[]).map((p,x)=>y(p,x)).join("")}
      </div>
      
      ${i.status!=="Archived"?`
      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>`:""}

      <!-- Totals -->
      <div class="card" style="max-width:360px;margin-left:auto;margin-bottom:var(--space-lg)">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
            <span class="text-secondary">Subtotal</span>
            <span id="subtotal">$${(i.subtotal||0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
            <span class="text-secondary">GST (10%)</span>
            <span id="tax">$${(i.tax||0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
            <span>Total</span>
            <span id="total">$${(i.total||0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${i.status!=="Archived"?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:""}
    `,b()}function y(p,x){const g=i.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${x}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${p.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${g?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(p.subtotal||0).toFixed(2)}</span>
            ${g?"":`
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
              ${(p.lineItems||[]).map((v,w)=>u(v,x,w,g)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function u(p,x,g,v){return`
      <tr data-sidx="${x}" data-index="${g}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${p.description||""}" data-field="description" placeholder="Type item name..." ${v?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${v?"disabled":""}>
          <option value="labor" ${p.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${p.type==="material"?"selected":""}>Material</option>
          <option value="other" ${p.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${p.qty||1}" data-field="qty" min="1" ${v?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${p.rate||0}" data-field="rate" step="0.01" ${v?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(p.total||0).toFixed(2)}</td>
        <td>${v?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${x}" data-index="${g}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function c(){i.subtotal=0,(i.sections||[]).forEach(p=>{p.subtotal=0,(p.lineItems||[]).forEach(x=>{x.total=(x.qty||0)*(x.rate||0),p.subtotal+=x.total}),i.subtotal+=p.subtotal}),i.tax=i.subtotal*.1,i.total=i.subtotal+i.tax,l()}function b(){var x,g,v,w,A,P,O,F,Y;(x=t.querySelector("#btn-preview-pdf"))==null||x.addEventListener("click",()=>{dt({type:"quote",data:i})});const p=t.querySelector(".dropdown > .btn");p&&(p.addEventListener("click",E=>{E.stopPropagation();const j=p.nextElementSibling;j.style.display=j.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const E=t.querySelector(".dropdown-menu");E&&(E.style.display="none")})),(g=t.querySelector("#btn-create-revision"))==null||g.addEventListener("click",()=>{m.update("quotes",s,{status:"Archived"});const E=JSON.parse(JSON.stringify(i));delete E.id,E.version=(i.version||1)+1,E.status="Draft",E.createdAt=new Date().toISOString();const j=m.create("quotes",E);C(`Revision v${E.version} created`,"success"),h.navigate(`/quotes/${j.id}`)}),(v=t.querySelector("#btn-save-template"))==null||v.addEventListener("click",E=>{E.preventDefault();const j={name:i.title||"Custom Template",sections:JSON.parse(JSON.stringify(i.sections))};m.create("quoteTemplates",j),C("Saved to Quote Templates","success")}),t.querySelectorAll("#quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(E=>{E.addEventListener("change",()=>{const j=E.value;if(E.id==="quote-customer")i.customerId=j;else if(E.id==="quote-title")i.title=j;else if(E.id==="quote-status")i.status=j;else if(E.id==="quote-valid")i.validUntil=j;else if(E.id==="quote-labor-profile"){i.laborProfileId=j;const Q=d.laborRates.find(ee=>ee.id===j);Q&&i.sections&&(i.sections.forEach(ee=>{ee.lineItems.forEach(te=>{te.type==="labor"&&(te.rate=Q.rate)})}),c())}})}),(w=t.querySelector("#btn-add-section"))==null||w.addEventListener("click",()=>{i.sections.push({id:m.generateId(),name:"New Phase",lineItems:[]}),l()}),t.querySelectorAll(".section-name-input").forEach((E,j)=>{E.addEventListener("change",()=>{i.sections[j].name=E.value})}),t.querySelectorAll(".btn-add-line").forEach(E=>{E.addEventListener("click",j=>{const Q=parseInt(E.dataset.sidx);i.sections[Q].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),l()})}),t.querySelectorAll(".btn-remove-section").forEach(E=>{E.addEventListener("click",()=>{const j=parseInt(E.dataset.sidx);confirm("Remove this entire phase?")&&(i.sections.splice(j,1),c())})}),t.querySelectorAll(".item-input").forEach(E=>{E.addEventListener("change",j=>{const Q=E.closest("tr"),ee=parseInt(Q.dataset.sidx),te=parseInt(Q.dataset.index),S=E.dataset.field;let k=E.value;if((S==="qty"||S==="rate")&&(k=parseFloat(k)||0),i.sections[ee].lineItems[te][S]=k,S==="description"){const M=a.find(K=>K.name===k);if(M){const K=M.category&&M.category.toLowerCase().includes("labor");let $=M.unitPrice||0;K||($=$*(1+(d.markupPercent||0)/100)),i.sections[ee].lineItems[te].type=K?"labor":"material",i.sections[ee].lineItems[te].rate=$}}c()})}),t.querySelectorAll(".btn-remove-line").forEach(E=>{E.addEventListener("click",()=>{const j=parseInt(E.dataset.sidx),Q=parseInt(tr.dataset.index);i.sections[j].lineItems.splice(Q,1),c()})}),(A=t.querySelector("#btn-cancel-quote"))==null||A.addEventListener("click",()=>h.navigate("/quotes")),(P=t.querySelector("#btn-save-quote"))==null||P.addEventListener("click",()=>{const E=t.querySelector("#quote-customer").value,j=n.find(Q=>Q.id===E);if(i.customerId=E,i.customerName=(j==null?void 0:j.company)||"",i.contactName=j?`${j.firstName} ${j.lastName}`:"",i.title=t.querySelector("#quote-title").value,i.status=t.querySelector("#quote-status").value,i.validUntil=t.querySelector("#quote-valid").value,c(),o){const Q=m.create("quotes",i);C("Quote created","success"),h.navigate(`/quotes/${Q.id}`)}else m.update("quotes",s,i),C("Quote saved","success"),l()}),(O=t.querySelector("#btn-convert-job"))==null||O.addEventListener("click",()=>{const E=m.getAll("technicians"),j=E[Math.floor(Math.random()*E.length)];let Q=0,ee=0;(i.sections||[]).forEach(k=>{(k.lineItems||[]).forEach(M=>{M.type==="labor"&&(Q+=M.total),M.type==="material"&&(ee+=M.total)})});const te=i.sections.map(k=>({id:m.generateId(),name:k.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),S=m.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:i.customerId,customerName:i.customerName,contactName:i.contactName,title:i.title,type:"Project",status:"Pending",priority:"Medium",technicianId:j==null?void 0:j.id,technicianName:j==null?void 0:j.name,quoteId:s,phases:te,laborCost:Q,materialCost:ee});C("Quote converted to project","success"),h.navigate(`/jobs/${S.id}`)}),(F=t.querySelector("#btn-send-quote"))==null||F.addEventListener("click",()=>{i.emailStatus="Sent",i.status==="Draft"&&(i.status="Sent"),m.update("quotes",s,{emailStatus:"Sent",status:i.status}),me(async()=>{const{showToast:E,addSystemNotification:j}=await Promise.resolve().then(()=>Me);return{showToast:E,addSystemNotification:j}},void 0).then(({showToast:E,addSystemNotification:j})=>{E("Email sent to customer","success"),l(),setTimeout(()=>{const Q=m.getById("quotes",s);Q&&Q.emailStatus==="Sent"&&(Q.emailStatus="Opened/Viewed",m.update("quotes",s,{emailStatus:"Opened/Viewed"}),j("Quote Opened",`Quote ${Q.number} was opened by ${Q.customerName||"the customer"}.`,`/quotes/${s}`),window.location.hash.includes(`/quotes/${s}`)&&(i.emailStatus="Opened/Viewed",l()))},15e3)})}),(Y=t.querySelector("#btn-delete-quote"))==null||Y.addEventListener("click",()=>{const E=document.createElement("div");E.innerHTML=`<p>Delete quote <strong>${f(i.number)}</strong>?</p>`,ie({title:"Delete Quote",content:E,actions:[{label:"Cancel",className:"btn-secondary",onClick:j=>j()},{label:"Delete",className:"btn-danger",onClick:j=>{m.delete("quotes",s),C("Quote deleted","success"),j(),h.navigate("/quotes")}}]})})}l()}function cs(t){const s=m.getAll("jobs");t.innerHTML=`
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
  `;let e=[...s];const o={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},i={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},a=be({columns:[{key:"number",label:"Job #",render:d=>`<span class="cell-link font-medium">${f(d.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:d=>`<span class="truncate" style="max-width:200px;display:inline-block">${f(d.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:d=>{if(d.contractorId){const r=m.getById("contractors",d.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${r?f(r.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${d.technicians&&d.technicians.length>0?d.technicians.map(r=>f(r.name)).join(", "):f(d.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:d=>`<span class="badge ${o[d.status]||"badge-neutral"}">${f(d.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:d=>`<span class="badge ${i[d.priority]||"badge-neutral"}">${f(d.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:d=>d.scheduledDate?new Date(d.scheduledDate).toLocaleDateString():"—",getValue:d=>d.scheduledDate?new Date(d.scheduledDate).getTime():0,width:"100px"}],data:e,onRowClick:d=>h.navigate(`/jobs/${d}`),emptyMessage:"No jobs found",emptyIcon:"build"});t.querySelector("#jobs-table-container").appendChild(a),t.querySelector("#btn-new-job").addEventListener("click",()=>h.navigate("/jobs/new")),t.querySelectorAll(".toolbar-filter").forEach(d=>{d.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(l=>l.classList.remove("active")),d.classList.add("active");const r=d.dataset.filter;r==="all"?e=[...s]:r==="unscheduled"?e=s.filter(l=>!l.scheduledDate):e=s.filter(l=>l.status===r),a.updateData(e)})}),t.querySelector("#jobs-search").addEventListener("input",d=>{const r=d.target.value.toLowerCase();e=s.filter(l=>l.number.toLowerCase().includes(r)||l.title.toLowerCase().includes(r)||l.customerName.toLowerCase().includes(r)||(l.technicianName||"").toLowerCase().includes(r)),a.updateData(e)})}function us(t,{id:s}){const e=m.getById("jobs",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}he(e.number);const o={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},i={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let n="overview",a=[0],d=[],r=!1,l=null;function y(){return l||(l=m.getAll("stock").map(p=>`<option value="${p.id}">${f(p.name)} (Qty: ${p.quantity}) - $${p.costPrice||p.unitPrice}</option>`).join("")),l}function u(){(e.laborCost||0)+(e.materialCost||0),t.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${f(e.number)} — ${f(e.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${f(e.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${f(e.technicianName||"Unassigned")}</span>
              <span class="badge ${o[e.status]||"badge-neutral"}">${f(e.status)}</span>
              <span class="badge ${i[e.priority]||"badge-neutral"}">${f(e.priority)}</span>
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
        <button class="tab ${n==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${n==="phases"?"active":""}" data-tab="phases">TaskLists</button>
        <button class="tab ${n==="costs"?"active":""}" data-tab="costs">Costs</button>
        <button class="tab ${n==="forms"?"active":""}" data-tab="forms">Forms</button>
        <button class="tab ${n==="pos"?"active":""}" data-tab="pos">POs</button>
        <button class="tab ${n==="activity"?"active":""}" data-tab="activity">Activity</button>
        <button class="tab ${n==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>
        <button class="tab ${n==="invoices"?"active":""}" data-tab="invoices">Invoices</button>
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,c(),b()}function c(){var O,F,Y,E,j,Q,ee,te,S,k,M,K,$,V,W,R,J;const p=t.querySelector("#tab-content");if((e.laborCost||0)+(e.materialCost||0),n==="overview"){let T=0;if(e.phases&&e.phases.length>0){let I=0,D=0;e.phases.forEach(_=>{const H=(parseFloat(_.estimatedHours)||1)*(parseInt(_.people)||1);I+=H,D+=H*((_.progress||0)/100)}),T=I>0?Math.round(D/I*100):0}const z=e.technicians&&e.technicians.length>0?e.technicians.map(I=>`${f(I.name)} (${I.hours}h)`).join(", "):f(e.technicianName||"Unassigned");p.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${de("Job Number",f(e.number))}
                ${de("Title",f(e.title))}
                ${de("Type",f(e.type))}
                ${de("Status",f(e.status))}
                ${de("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${T}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${T}%</span></div>`)}
                ${de("Priority",f(e.priority))}
                ${de("Customer",f(e.customerName))}
                ${de("Contact",f(e.contactName||"—"))}
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
                ${de("Technicians",z)}
                ${de("Scheduled",e.scheduledDate?new Date(e.scheduledDate).toLocaleDateString():"—")}
                ${de("Est. Hours",e.estimatedHours||"—")}
                ${de("Site Address",f(e.siteAddress||"—"))}
                ${de("Quote Ref",e.quoteId?`<a href="#/quotes/${f(e.quoteId)}">${f(e.quoteId)}</a>`:"—")}
                ${de("Created",new Date(e.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `,(O=p.querySelector("#btn-add-schedule"))==null||O.addEventListener("click",()=>{h.navigate(`/schedule?jobId=${s}`)})}else if(n==="phases"){let I=function(q,L){let N=q[L[0]];if(!N)return null;for(let B=1;B<L.length;B++)if(!N.subPhases||(N=N.subPhases[L[B]],!N))return null;return N},D=function(q){return!q.subPhases||q.subPhases.length===0?(parseFloat(q.estimatedHours)||0)*(parseInt(q.people)||1):q.subPhases.reduce((L,N)=>L+D(N),0)},_=function(q,L){if(L.length<=1)return;const N=L.slice(0,-1),B=I(q,N);if(B&&B.subPhases&&B.subPhases.length>0){let Z=0,oe=0;B.subPhases.forEach(ae=>{const ve=(parseFloat(ae.estimatedHours)||1)*(parseInt(ae.people)||1);Z+=ve,oe+=ve*((ae.progress||0)/100)}),B.progress=Z>0?Math.round(oe/Z*100):0,B.progress===100?B.status="Completed":B.progress>0?B.status="In Progress":B.status="Not Started",_(q,N)}};var x=I,g=D,v=_;const T=JSON.parse(sessionStorage.getItem("currentUser")||"{}");let z=!0;if(T.userTypeId){const q=m.getById("userTypes",T.userTypeId);if(q&&q.permissions){const L=q.permissions.find(N=>N.module==="Jobs");L&&(z=L.edit)}}else(T.role==="customer"||T.role==="technician")&&(z=!1);e.phases||(e.phases=[{id:m.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}]),e.phases.forEach(q=>{q.subPhases||(q.subPhases=[])});let H=!0,X=e.phases;for(let q=0;q<a.length;q++){if(!X||!X[a[q]]){H=!1;break}X=X[a[q]].subPhases}H||(a=[]),p.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${z?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${z?'<button class="btn btn-sm btn-primary" id="btn-save-phases"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const q=d.length>0?I(e.phases,d):null,L=q?q.subPhases||[]:e.phases,N=q?f(q.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${d.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${N}">${N}</span>
                    </div>
                    ${z?d.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${d.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${L.map((B,Z)=>{const oe=[...d,Z],ae=oe.join("-")===a.join("-");return`
                        <div class="task-list-item" data-path="${oe.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${ae?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${ae?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${f(B.name)}">${f(B.name)}</span>
                          ${B.subPhases&&B.subPhases.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${oe.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${oe.join("-")}" ${B.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${L.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${a.length>0?(()=>{const q=a,L=I(e.phases,q);if(!L)return"";const N=L.subPhases&&L.subPhases.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${r?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(L.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${z?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${q.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${z?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${q.join("-")}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${f(L.name)}" ${z?"":"disabled"} />
                  </div>
                  ${N?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${D(L)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${L.startDate?L.startDate.split("T")[0]:""}" ${z?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${L.estimatedHours||""}" min="0" step="0.5" ${z?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${L.people||"1"}" min="1" step="1" ${z?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${L.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${L.progress>50?"#fff":"#000"}">${L.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${z?"":"disabled"}>${f(L.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${f(L.name)}">Info Panel: ${f(L.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${z&&q.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${q.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      <button class="btn btn-sm btn-secondary btn-book-time" data-path="${q.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>
                      ${z?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${f(L.name)}</div>
                  </div>
                  ${N?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${D(L)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${L.startDate?L.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${L.estimatedHours?L.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${L.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${L.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${L.progress>50?"#fff":"#000"}">${L.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${f(L.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(F=p.querySelector(".btn-view-back"))==null||F.addEventListener("click",()=>{d.pop(),c()}),p.querySelectorAll(".btn-drill-down").forEach(q=>{q.addEventListener("click",L=>{L.stopPropagation(),d=q.dataset.path.split("-").map(Number),a=[...d],c()})}),p.querySelectorAll(".task-list-checkbox").forEach(q=>{q.addEventListener("change",L=>{const N=L.target.dataset.path.split("-").map(Number),B=I(e.phases,N);B.progress=L.target.checked?100:0,B.status=L.target.checked?"Completed":"Not Started",_(e.phases,N),c()}),q.addEventListener("click",L=>L.stopPropagation())}),p.querySelectorAll(".task-list-item").forEach(q=>{q.addEventListener("click",L=>{if(L.target.closest(".btn-drill-down"))return;a=L.currentTarget.dataset.path.split("-").map(Number),r=!1,c()})}),(Y=p.querySelector(".btn-edit-info"))==null||Y.addEventListener("click",()=>{r=!0,c()}),(E=p.querySelector(".btn-done-info"))==null||E.addEventListener("click",()=>{r=!1,c()}),(j=p.querySelector("#btn-add-main-task"))==null||j.addEventListener("click",()=>{e.phases||(e.phases=[]),e.phases.push({id:m.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}),a=[e.phases.length-1],c()}),p.querySelectorAll(".btn-add-child-task").forEach(q=>{q.addEventListener("click",L=>{const N=L.currentTarget.dataset.path.split("-").map(Number),B=I(e.phases,N);B.subPhases||(B.subPhases=[]),B.subPhases.push({id:m.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}),a=[...N,B.subPhases.length-1],c()})}),p.querySelectorAll(".detail-input").forEach(q=>{q.addEventListener("change",L=>{const N=I(e.phases,a),B=L.target.dataset.field;B==="progress-check"?(N.progress=L.target.checked?100:0,N.status=L.target.checked?"Completed":"Not Started"):B==="progress"?(N.progress=parseInt(L.target.value),N.progress===100?N.status="Completed":N.progress===0?N.status="Not Started":N.status="In Progress"):B==="estimatedHours"?N.estimatedHours=parseFloat(L.target.value)||0:N[B]=L.target.value,_(e.phases,a),c()})}),p.querySelectorAll(".btn-remove-task").forEach(q=>{q.addEventListener("click",L=>{if(confirm("Delete this task and all its sub-tasks?")){const N=L.currentTarget.dataset.path.split("-").map(Number);if(N.length===1)e.phases.splice(N[0],1);else{const B=N.slice(0,-1);I(e.phases,B).subPhases.splice(N[N.length-1],1),_(e.phases,B)}a=N.slice(0,-1),c()}})}),(Q=p.querySelector("#btn-save-phases"))==null||Q.addEventListener("click",()=>{m.update("jobs",s,{phases:e.phases}),C("Tasks saved","success")}),(ee=p.querySelector("#btn-save-tasklist-template"))==null||ee.addEventListener("click",()=>{const q=prompt("Enter a name for this Tasklist template:");if(q){let N=function(B){return B.map(Z=>({...Z,id:m.generateId(),subPhases:Z.subPhases?N(Z.subPhases):[]}))};var L=N;m.create("tasklistTemplates",{name:q,phases:N(e.phases),createdAt:new Date().toISOString()}),C("Tasklist saved as template","success")}}),p.querySelectorAll(".btn-duplicate-task").forEach(q=>{q.addEventListener("click",L=>{const N=L.currentTarget.dataset.path.split("-").map(Number),B=I(e.phases,N);function Z(ae,ve){return{...ae,id:m.generateId(),name:ae.name+(ve?" (Copy)":""),progress:0,status:"Not Started",subPhases:ae.subPhases?ae.subPhases.map(Te=>Z(Te,!1)):[]}}const oe=Z(B,!0);if(N.length===1)e.phases.splice(N[0]+1,0,oe);else{const ae=N.slice(0,-1);I(e.phases,ae).subPhases.splice(N[N.length-1]+1,0,oe),_(e.phases,ae)}c()})}),p.querySelectorAll(".btn-book-time").forEach(q=>{q.addEventListener("click",L=>{const N=L.currentTarget.dataset.path.split("-").map(Number),B=I(e.phases,N),Z=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),oe=m.getAll("timesheets").filter(ne=>ne.jobId===s),ae=m.getAll("technicians"),ve=new Date,Te=ne=>ne.toString().padStart(2,"0"),Ue=`${ve.getFullYear()}-${Te(ve.getMonth()+1)}-${Te(ve.getDate())}`,xt=`${Ue}T09:00`,$t=`${Ue}T10:00`,Ce=document.createElement("div");Ce.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${oe.reduce((ne,xe)=>ne+(xe.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${oe.length?oe.map(ne=>`
                      <tr>
                        <td>${ne.startTime?new Date(ne.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(ne.date).toLocaleDateString()}</td>
                        <td>${f(ne.technicianName)}</td>
                        <td>${f(ne.phaseName||"ΓÇö")}</td>
                        <td style="font-weight:600">${ne.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${xt}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${$t}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${ae.map(ne=>`<option value="${ne.id}" ${ne.name===Z.name?"selected":""}>${ne.name}</option>`).join("")}
              </select>
            </div>
            `,ie({title:"Book Time: "+f(B.name),content:Ce,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:ne=>ne()},{label:"Log Time",className:"btn-primary",onClick:ne=>{const xe=Ce.querySelector("#bt-start").value,je=Ce.querySelector("#bt-finish").value,He=Ce.querySelector("#bt-tech").value,St="";if(!xe||!je||!He){C("Please fill all required fields","error");return}const Je=new Date(xe),Ve=new Date(je);if(Ve<=Je){C("Finish time must be after start time","error");return}const wt=Math.round((Ve-Je)/36e5*100)/100,kt=ae.find(Lt=>Lt.id===He);m.create("timesheets",{jobId:s,jobNumber:e.number,phaseId:B.id,phaseName:B.name,technicianId:He,technicianName:kt.name,date:xe.split("T")[0],startTime:xe,finishTime:je,description:St,hours:wt,status:"Approved"}),C("Time booked successfully","success"),c(),ne()}}]})})})}else if(n==="costs"){let z=function(){let I=0,D=0;p.querySelectorAll(".tech-row").forEach(q=>{const L=parseFloat(q.querySelector(".tech-hours").value)||0,N=parseFloat(q.querySelector(".tech-rate").value)||0;I+=L,D+=L*N});const _=(e.materials||[]).reduce((q,L)=>q+L.quantity*(L.unitCost||0),0),H=parseFloat(p.querySelector("#inp-material-cost").value)||0,X=_+H;p.querySelector("#sum-hours").textContent=I,p.querySelector("#sum-labor").textContent="$"+D.toFixed(2),p.querySelector("#sum-mat").textContent="$"+X.toFixed(2),p.querySelector("#sum-total").textContent="$"+(D+X).toFixed(2)};var w=z;e.technicianId&&(!e.technicians||e.technicians.length===0)&&(e.technicians=[{id:e.technicianId,name:e.technicianName,hours:e.estimatedHours||0,rate:85}]),e.technicians||(e.technicians=[]);const T=m.getAll("technicians");p.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Technicians & Internal Labor</h4></div>
            <div class="card-body">
              <div id="techs-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                ${e.technicians.map((I,D)=>`
                  <div class="tech-row form-row" data-index="${D}" style="align-items:flex-end">
                    <div class="form-group" style="margin-bottom:0;flex:2">
                      <label class="form-label">Technician</label>
                      <select class="form-select tech-select">
                        <option value="">Select...</option>
                        ${T.map(_=>`<option value="${_.id}" ${I.id===_.id?"selected":""}>${_.name}</option>`).join("")}
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;flex:1">
                      <label class="form-label">Est. Hours</label>
                      <input type="number" class="form-input tech-hours" value="${I.hours||0}" min="0" step="0.5" />
                    </div>
                    <div class="form-group" style="margin-bottom:0;flex:1">
                      <label class="form-label">Pay Rate ($/hr)</label>
                      <input type="number" class="form-input tech-rate" value="${I.rate||0}" min="0" step="0.01" />
                    </div>
                    <button class="btn btn-danger btn-icon btn-remove-tech"><span class="material-icons-outlined">close</span></button>
                  </div>
                `).join("")}
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-add-tech" style="width:100%"><span class="material-icons-outlined">add</span> Add Technician</button>
            </div>
          </div>
          
          <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
            <div class="card">
              <div class="card-header"><h4>Material Costs</h4></div>
              <div class="card-body">
                <div id="materials-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                  ${(e.materials||[]).map((I,D)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${f(I.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${I.quantity} x $${(I.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div class="font-medium">$${(I.quantity*(I.unitCost||0)).toFixed(2)}</div>
                    </div>
                  `).join("")}
                  ${!e.materials||e.materials.length===0?'<div class="text-secondary" style="font-size:14px">No materials added.</div>':""}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${y()}
                  </select>
                  <input type="number" class="form-input" id="mat-qty" value="1" min="1" style="flex:1" />
                  <button class="btn btn-primary" id="btn-add-material">Add</button>
                </div>
                <div class="form-group" style="margin-top:16px;margin-bottom:0">
                  <label class="form-label">Manual Add. Cost ($)</label>
                  <input type="number" class="form-input" id="inp-material-cost" value="${e.additionalMaterialCost||0}" step="0.01" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Internal Cost Summary</h4></div>
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Est. Hours</span><span id="sum-hours" class="font-medium">${e.estimatedHours||0}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Labor Cost</span><span id="sum-labor" class="font-medium">$${(e.laborCost||0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Material Cost</span><span id="sum-mat" class="font-medium">$${(e.materialCost||0).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:var(--font-size-lg);font-weight:700">
                  <span>Total Internal Cost</span><span id="sum-total">$${((e.laborCost||0)+(e.materialCost||0)).toFixed(2)}</span>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Costs & Techs</button>
              </div>
            </div>
          </div>
        </div>
      `,(te=p.querySelector("#btn-add-tech"))==null||te.addEventListener("click",()=>{e.technicians.push({id:"",name:"",hours:2,rate:85}),c()}),p.addEventListener("click",I=>{if(I.target.closest(".btn-remove-tech")){const D=I.target.closest(".tech-row").dataset.index;e.technicians.splice(D,1),c()}}),p.addEventListener("input",I=>{I.target.matches(".tech-hours, .tech-rate, #inp-material-cost")&&z()}),(S=p.querySelector("#btn-add-material"))==null||S.addEventListener("click",()=>{const I=p.querySelector("#mat-select"),D=parseInt(p.querySelector("#mat-qty").value)||1,_=I.value;if(!_)return;const H=m.getById("stock",_);if(H){if(H.quantity<D){C(`Not enough stock. Available: ${H.quantity}`,"error");return}m.update("stock",_,{quantity:H.quantity-D}),l=null,e.materials||(e.materials=[]),e.materials.push({stockId:H.id,name:H.name,quantity:D,unitCost:H.costPrice||H.unitPrice||0}),e.materialCost=e.materials.reduce((X,q)=>X+q.quantity*q.unitCost,0)+(parseFloat(p.querySelector("#inp-material-cost").value)||0),m.update("jobs",s,{materials:e.materials,materialCost:e.materialCost}),C(`Added ${D}x ${H.name}`,"success"),c()}}),(k=p.querySelector("#btn-save-costs"))==null||k.addEventListener("click",()=>{let I=0,D=0;const _=Array.from(p.querySelectorAll(".tech-row")).map(L=>{const N=L.querySelector(".tech-select"),B=N.value,Z=N.options[N.selectedIndex].text,oe=parseFloat(L.querySelector(".tech-hours").value)||0,ae=parseFloat(L.querySelector(".tech-rate").value)||0;return I+=oe,D+=oe*ae,{id:B,name:Z,hours:oe,rate:ae}}),H=parseFloat(p.querySelector("#inp-material-cost").value)||0,q=(e.materials||[]).reduce((L,N)=>L+N.quantity*(N.unitCost||0),0)+H;e.technicians=_,e.estimatedHours=I,e.laborCost=D,e.materialCost=q,e.additionalMaterialCost=H,m.update("jobs",s,{technicians:_,estimatedHours:I,laborCost:D,materialCost:q,additionalMaterialCost:H}),C("Costs and Technicians saved","success")})}else if(n==="activity")e.activityLog||(e.activityLog=[],e.notes&&e.activityLog.push({id:Math.random().toString(36).substr(2,9),type:"note",content:e.notes,date:e.createdAt||new Date().toISOString()}),e.attachments&&e.attachments.forEach(T=>{e.activityLog.push({id:Math.random().toString(36).substr(2,9),type:"attachment",file:T,date:e.updatedAt||new Date().toISOString()})}),e.activityLog.sort((T,z)=>new Date(z.date)-new Date(T.date))),p.innerHTML=`
        <div class="card" style="max-width:800px;margin-bottom:var(--space-lg)">
          <div class="card-body">
            <div style="display:flex;gap:8px;margin-bottom:var(--space-base)">
              <input type="text" class="form-input" id="new-note-input" placeholder="Type a new note..." style="flex:1" />
              <button class="btn btn-primary" id="btn-add-note">Post</button>
              <label class="btn btn-secondary" for="upload-attachment" style="cursor:pointer">
                <span class="material-icons-outlined" style="font-size:16px">attach_file</span> Attach
                <input type="file" id="upload-attachment" style="display:none" multiple accept="image/*,.pdf,.doc,.docx" />
              </label>
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${e.activityLog.length?e.activityLog.map((T,z)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${T.type==="note"?"chat_bubble_outline":"attachment"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(T.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${f(T.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    ${T.type==="note"?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap">${f(T.content)}</div>`:`<div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                         ${T.file.type&&T.file.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${f(T.file.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                         <div style="overflow:hidden">
                           <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${f(T.file.name)}">${f(T.file.name)}</div>
                           <div class="text-secondary" style="font-size:10px">${(T.file.size/1024).toFixed(1)} KB</div>
                         </div>
                       </div>`}
                  </div>
                </div>
              `).join(""):'<div class="text-secondary text-center" style="padding:24px">No activity yet.</div>'}
            </div>
          </div>
        </div>
      `,(M=p.querySelector("#btn-add-note"))==null||M.addEventListener("click",()=>{const T=p.querySelector("#new-note-input").value.trim();T&&(e.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"note",content:T,date:new Date().toISOString()}),m.update("jobs",s,{activityLog:e.activityLog}),c())}),(K=p.querySelector("#upload-attachment"))==null||K.addEventListener("change",T=>{const z=Array.from(T.target.files);if(!z.length)return;let I=0;z.forEach(D=>{const _=new FileReader;_.onload=H=>{e.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"attachment",date:new Date().toISOString(),file:{name:D.name,size:D.size,type:D.type,data:H.target.result}}),I++,I===z.length&&(m.update("jobs",s,{activityLog:e.activityLog}),C(`${z.length} file(s) attached`,"success"),c())},_.readAsDataURL(D)})}),p.querySelectorAll(".btn-delete-activity").forEach(T=>{T.addEventListener("click",()=>{e.activityLog=e.activityLog.filter(z=>z.id!==T.dataset.id),m.update("jobs",s,{activityLog:e.activityLog}),c()})});else if(n==="timesheets"){const T=m.getAll("timesheets").filter(I=>I.jobId===s),z=T.reduce((I,D)=>I+(D.hours||0),0);m.getAll("technicians"),p.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Timesheets (${z} hrs total)</h4>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th></tr></thead>
              <tbody>
                ${T.length?T.map(I=>`
                  <tr>
                    <td>${new Date(I.date).toLocaleDateString()}</td>
                    <td>${f(I.technicianName)}</td>
                    <td class="text-secondary">${f(I.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${I.hours}</td>
                    <td><span class="badge ${I.status==="Approved"?"badge-success":I.status==="Rejected"?"badge-danger":"badge-warning"}">${I.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `}else if(n==="forms")e.forms=e.forms||[],p.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${e.forms.length?e.forms.map(T=>`
                  <tr>
                    <td class="font-medium">${f(T.type)}</td>
                    <td>${new Date(T.date).toLocaleString()}</td>
                    <td>${f(T.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,($=p.querySelector("#btn-add-form"))==null||$.addEventListener("click",()=>{const T=document.createElement("div");T.innerHTML=`
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
          `,ie({title:"Complete Form",content:T,actions:[{label:"Cancel",className:"btn-secondary",onClick:z=>z()},{label:"Submit",className:"btn-primary",onClick:z=>{e.forms.push({type:document.getElementById("new-form-type").value,notes:document.getElementById("new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),m.update("jobs",s,{forms:e.forms}),C("Form submitted successfully","success"),c(),z()}}]})});else if(n==="pos"){const T=m.getAll("purchaseOrders").filter(z=>z.jobId===s);p.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${T.length?T.map(z=>`
                  <tr>
                    <td><a href="#/purchase-orders/${f(z.id)}">${f(z.number)}</a></td>
                    <td>${f(z.supplierName||"—")}</td>
                    <td>${z.issueDate?new Date(z.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(z.total||0).toFixed(2)}</td>
                    <td><span class="badge ${z.status==="Received"?"badge-success":z.status==="Draft"?"badge-neutral":z.status==="Cancelled"?"badge-danger":"badge-primary"}">${z.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(V=p.querySelector("#btn-raise-po"))==null||V.addEventListener("click",()=>{h.navigate(`/purchase-orders/new?jobId=${s}`)})}else if(n==="invoices"){let z=function(D,_,H){const X=m.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:D,jobId:s,jobNumber:e.number,customerId:e.customerId,customerName:e.customerName,contactName:e.contactName,status:"Draft",lineItems:_,subtotal:H,tax:H*.1,total:H*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+2592e6).toISOString()});m.update("jobs",s,{status:"Invoiced"}),C(`${D} Invoice created`,"success"),h.navigate(`/invoices/${X.id}`)},I=function(){let D=[],_=0;if(e.quoteId){const H=m.getById("quotes",e.quoteId);H&&H.lineItems&&H.lineItems.length>0&&(D=H.lineItems.map(X=>({...X})),_=H.subtotal||H.lineItems.reduce((X,q)=>X+(q.total||0),0))}if(D.length===0){const H=e.laborCost||0,X=e.materialCost||0;D=[{description:`${e.title} - Labor`,type:"labor",qty:1,rate:H,total:H},{description:`${e.title} - Materials`,type:"material",qty:1,rate:X,total:X}],_=H+X}return{lineItems:D,subtotal:_}};var A=z,P=I;const T=m.getAll("invoices").filter(D=>D.jobId===s);p.innerHTML=`
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
                ${T.length?T.map(D=>`
                  <tr>
                    <td><a href="#/invoices/${f(D.id)}">${f(D.number)}</a></td>
                    <td><span class="badge badge-neutral">${f(D.invoiceType||"Standard")}</span></td>
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
      `,(W=p.querySelector("#btn-create-standard-invoice"))==null||W.addEventListener("click",()=>{const{lineItems:D,subtotal:_}=I();z("Standard",D,_)}),(R=p.querySelector("#btn-create-deposit-invoice"))==null||R.addEventListener("click",()=>{const D=[{description:`Deposit for Job ${e.number}`,type:"other",qty:1,rate:0,total:0}];z("Deposit",D,0)}),(J=p.querySelector("#btn-create-progress-invoice"))==null||J.addEventListener("click",()=>{const D=document.createElement("div");D.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,ie({title:"Create Progress Invoice",content:D,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Create",className:"btn-primary",onClick:_=>{const H=parseFloat(document.getElementById("progress-percent").value)||0;if(H<=0||H>100){C("Enter a valid percentage (1-100)","error");return}const{subtotal:X}=I(),q=X*(H/100),L=[{description:`Progress Payment (${H}% of job)`,type:"other",qty:1,rate:q,total:q}];z("Progress",L,q),_()}}]})})}}function b(){var p,x;t.querySelectorAll(".tab").forEach(g=>{g.addEventListener("click",()=>{n=g.dataset.tab,t.querySelectorAll(".tab").forEach(v=>v.classList.remove("active")),g.classList.add("active"),c()})}),(p=t.querySelector("#btn-edit-job"))==null||p.addEventListener("click",()=>h.navigate(`/jobs/${s}/edit`)),(x=t.querySelector("#btn-delete-job"))==null||x.addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`<p>Delete job <strong>${f(e.number)}</strong>?</p>`,ie({title:"Delete Job",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Delete",className:"btn-danger",onClick:v=>{m.delete("jobs",s),C("Job deleted","success"),v(),h.navigate("/jobs")}}]})})}u()}function de(t,s){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${t}</span><span>${s}</span></div>`}function ut(t,{id:s}){const e=s&&s!=="new",o=e?m.getById("jobs",s):{},i=m.getAll("customers"),n=m.getAll("contractors").filter(u=>u.active);t.innerHTML=`
    <div class="page-header"><h1>${e?"Edit Job":"New Job"}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="job-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${o.title||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" name="customerId" required>
                <option value="">Select customer...</option>
                ${i.map(u=>`<option value="${u.id}" ${o.customerId===u.id?"selected":""}>${u.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(u=>`<option ${o.type===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label class="form-label">Assign to Contractor (Optional)</label>
              <select class="form-select" name="contractorId">
                <option value="">None (Internal Techs)</option>
                ${n.map(u=>`<option value="${u.id}" ${o.contractorId===u.id?"selected":""}>${u.businessName}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(u=>`<option ${o.status===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High","Urgent"].map(u=>`<option ${o.priority===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-emergency" style="width:16px;height:16px" ${o.isEmergency?"checked":""} />
              <label class="form-label" style="margin:0; color: var(--color-danger);" for="is-emergency">Is Emergency (Applies Callout Fee)</label>
            </div>
          </div>
          <div id="emergency-dispatch-suggestion" style="display: none; background: var(--color-warning-bg); border: 1px solid var(--color-warning); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <strong>Emergency Dispatch Suggestion:</strong>
            <p style="margin: 5px 0 0 0;" id="dispatch-reason">Loading best technician...</p>
          </div>
          ${e?"":`
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
          <div class="form-group">
            <label class="form-label">Site Address</label>
            <input class="form-input" name="siteAddress" value="${o.siteAddress||""}" />
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-textarea" name="notes">${o.notes||""}</textarea>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${e?"Update":"Create"} Job</button>
      </div>
    </div>
  `;const a=t.querySelector("#is-emergency"),d=t.querySelector("#emergency-dispatch-suggestion"),r=t.querySelector("#dispatch-reason"),l=t.querySelector("#job-priority");function y(u){if(u){l.value="Urgent",d.style.display="block";const c=m.getAll("people").filter(b=>b.type==="Staff");if(c.length>0){const b=c[Math.floor(Math.random()*c.length)],p=Math.floor(Math.random()*15)+5;r.innerHTML=`Based on current GPS location and schedule, <strong>${b.firstName} ${b.lastName}</strong> is the most suitable technician (approx. ${p} mins away from site).`}else r.innerHTML="No internal technicians available for dispatch."}else d.style.display="none"}if(a==null||a.addEventListener("change",u=>{y(u.target.checked)}),o.isEmergency&&y(!0),!e){const u=t.querySelector("#is-recurring"),c=t.querySelector("#recurring-options");u==null||u.addEventListener("change",b=>{c.style.display=b.target.checked?"flex":"none"})}t.querySelector("#btn-cancel").addEventListener("click",()=>h.navigate(e?`/jobs/${s}`:"/jobs")),t.querySelector("#btn-save").addEventListener("click",()=>{var x,g;const u=t.querySelector("#job-form");if(!u.checkValidity()){u.reportValidity();return}const c=Object.fromEntries(new FormData(u)),b=i.find(v=>v.id===c.customerId);c.customerName=(b==null?void 0:b.company)||"",c.contactName=b?`${b.firstName} ${b.lastName}`:"",c.number=o.number||`J-${Date.now().toString().slice(-6)}`;const p=(x=t.querySelector("#is-emergency"))==null?void 0:x.checked;if(c.isEmergency=p,e?p&&!o.isEmergency?c.laborCost=(o.laborCost||0)+150:!p&&o.isEmergency&&(c.laborCost=Math.max(0,(o.laborCost||0)-150)):(c.technicians=[],c.laborCost=p?150:0,c.materialCost=0,c.estimatedHours=0),!e&&((g=t.querySelector("#is-recurring"))!=null&&g.checked)){const v=t.querySelector("#recurring-freq").value,w=new Date(t.querySelector("#recurring-start").value),A=new Date(t.querySelector("#recurring-end").value);if(isNaN(w.getTime())||isNaN(A.getTime())||w>A){C("Invalid recurring dates","error");return}let P=new Date(w),O=0,F=0;const Y=Date.now().toString().slice(-6);for(;P<=A&&O<50;){const E={...c};E.scheduledDate=P.toISOString().split("T")[0],E.number=`J-${Y}-${O+1}`,m.create("jobs",E),F++,v==="Daily"?P.setDate(P.getDate()+1):v==="Weekly"?P.setDate(P.getDate()+7):v==="Monthly"&&P.setMonth(P.getMonth()+1),O++}C(`Created ${F} recurring jobs`,"success"),h.navigate("/jobs")}else if(e)m.update("jobs",s,c),C("Job updated","success"),h.navigate(`/jobs/${s}`);else{const v=m.create("jobs",c);C("Job created","success"),h.navigate(`/jobs/${v.id}`)}})}function ps(t){const s=m.getAll("timesheets").sort((n,a)=>new Date(a.date)-new Date(n.date));let e="All";function o(){const n=e==="All"?s:s.filter(r=>r.status===e),a=s.filter(r=>r.status==="Pending").reduce((r,l)=>r+(l.hours||0),0),d=s.filter(r=>r.status==="Approved").reduce((r,l)=>r+(l.hours||0),0);t.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-approve-all" ${s.some(r=>r.status==="Pending")?"":"disabled"}>
            <span class="material-icons-outlined">done_all</span> Approve All Pending
          </button>
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${a} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Approved</div>
          <div class="stat-value" style="color:var(--color-success)">${d} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-base)">
        <div class="card-header">
          <div style="display:flex;gap:var(--space-sm)">
            <button class="toolbar-filter ${e==="All"?"active":""}" data-status="All">All</button>
            <button class="toolbar-filter ${e==="Pending"?"active":""}" data-status="Pending">Pending</button>
            <button class="toolbar-filter ${e==="Approved"?"active":""}" data-status="Approved">Approved</button>
            <button class="toolbar-filter ${e==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
          </div>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Technician</th>
                <th>Job</th>
                <th>Description</th>
                <th style="text-align:right">Hours</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${n.length?n.map(r=>`
                <tr data-id="${r.id}">
                  <td>${new Date(r.date).toLocaleDateString()}</td>
                  <td class="font-medium">${r.technicianName}</td>
                  <td><a href="#/jobs/${r.jobId}" class="cell-link">${r.jobNumber||r.jobId}</a></td>
                  <td class="text-secondary">${r.description||"—"}</td>
                  <td style="text-align:right;font-weight:600">${r.hours}</td>
                  <td><span class="badge ${r.status==="Approved"?"badge-success":r.status==="Rejected"?"badge-danger":"badge-warning"}">${r.status}</span></td>
                  <td style="text-align:right">
                    ${r.status==="Pending"?`
                      <button class="btn btn-sm btn-ghost btn-icon btn-approve" title="Approve"><span class="material-icons-outlined" style="color:var(--color-success)">check_circle</span></button>
                      <button class="btn btn-sm btn-ghost btn-icon btn-reject" title="Reject"><span class="material-icons-outlined" style="color:var(--color-danger)">cancel</span></button>
                    `:"—"}
                  </td>
                </tr>
              `).join(""):`<tr><td colspan="7" style="text-align:center;padding:40px" class="text-secondary">No ${e!=="All"?e.toLowerCase():""} timesheets found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `,i()}function i(){var n;t.querySelectorAll(".toolbar-filter").forEach(a=>{a.addEventListener("click",()=>{e=a.dataset.status,o()})}),t.querySelectorAll(".btn-approve").forEach(a=>{a.addEventListener("click",()=>{const d=a.closest("tr").dataset.id,r=s.find(l=>l.id===d);r&&(r.status="Approved",m.update("timesheets",d,{status:"Approved"}),o())})}),t.querySelectorAll(".btn-reject").forEach(a=>{a.addEventListener("click",()=>{const d=a.closest("tr").dataset.id,r=s.find(l=>l.id===d);r&&(r.status="Rejected",m.update("timesheets",d,{status:"Rejected"}),o())})}),(n=t.querySelector("#btn-approve-all"))==null||n.addEventListener("click",()=>{s.filter(a=>a.status==="Pending").forEach(a=>{a.status="Approved",m.update("timesheets",a.id,{status:"Approved"})}),o()})}o()}function ms(t){const s=m.getAll("technicians");let e="week",o="schedule",i=new Date;const n=Array.from({length:24},(S,k)=>k);let a=null,d=null,r="all",l=null,y=0,u=0;const c=32,b=c/4;function p(S){return Math.round(S*4)/4}function x(S){const k=Math.floor(S),M=Math.round((S-k)*60);return`${k.toString().padStart(2,"0")}:${M.toString().padStart(2,"0")}`}function g(){const S=document.getElementById("calendar-scroll");S&&(y=S.scrollTop,u=S.scrollLeft)}function v(){const S=document.getElementById("calendar-scroll");S&&(S.scrollTop=y,S.scrollLeft=u)}function w(){l&&(l.remove(),l=null)}document.addEventListener("click",w);function A(){const S=new Date(i);return e==="day"?[new Date(i)]:(S.setDate(S.getDate()-S.getDay()+1),Array.from({length:5},(k,M)=>{const K=new Date(S);return K.setDate(K.getDate()+M),K}))}function P(){const S=m.getAll("jobs"),k=[],M=A();return S.filter($=>$.scheduledDate&&$.status!=="Completed"&&$.status!=="Invoiced").forEach($=>{const V=new Date($.scheduledDate);M.forEach((W,R)=>{if(V.toDateString()===W.toDateString()){const J=$.startHour!==void 0?$.startHour:7+Math.abs(O($.id))%6;if($.technicians&&$.technicians.length>0)$.technicians.forEach(T=>{const z=T.hours||2;k.push({jobId:$.id,jobNumber:$.number,customerName:$.customerName,title:$.title,technicianId:T.id,dayIdx:R,startHour:J,endHour:J+z,status:$.status,priority:$.priority})});else if($.technicianId){const T=$.estimatedHours||2;k.push({jobId:$.id,jobNumber:$.number,customerName:$.customerName,title:$.title,technicianId:$.technicianId,dayIdx:R,startHour:J,endHour:J+T,status:$.status,priority:$.priority})}}})}),m.getAll("schedule").forEach($=>{if($.date){const V=new Date($.date),W=M.findIndex(R=>R.toDateString()===V.toDateString());W!==-1&&!k.find(R=>R.jobId===$.jobId&&R.dayIdx===W)&&k.push({...$,dayIdx:W})}else k.find(V=>V.jobId===$.jobId&&V.dayIdx===$.dayOffset)||k.push({...$,dayIdx:$.dayOffset})}),k}function O(S){let k=0;for(let M=0;M<S.length;M++)k=(k<<5)-k+S.charCodeAt(M),k|=0;return k}function F(){g();const S=A(),k=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],M=["January","February","March","April","May","June","July","August","September","October","November","December"];if(o==="activity"){te();return}const K=P();t.innerHTML=`
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
            <select class="form-select form-select-sm" id="schedule-tech-filter" style="min-width:180px">
              <option value="all">All Technicians</option>
              ${s.map($=>`<option value="${$.id}" ${r===$.id?"selected":""}>${$.name}</option>`).join("")}
            </select>
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${o==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${o==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${e==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${e==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <!-- Unscheduled jobs drawer -->
      <div class="card" style="margin-bottom:var(--space-base)" id="unscheduled-section">
        <div class="card-header" style="padding:8px 16px;cursor:pointer" id="unscheduled-toggle">
          <h4 style="font-size:var(--font-size-sm)"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle">pending_actions</span> Unscheduled Jobs</h4>
          <span class="material-icons-outlined" style="font-size:16px" id="unscheduled-chevron">expand_more</span>
        </div>
        <div id="unscheduled-drawer" style="padding:8px 16px;display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid var(--border-color)">
          ${Y().map($=>`
            <div class="unscheduled-job" draggable="true" data-job-id="${$.id}" data-job-number="${$.number}" data-customer="${$.customerName}" data-title="${$.title}" data-hours="${$.estimatedHours||2}" data-priority="${$.priority}">
              <span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary)">drag_indicator</span>
              <span class="font-medium" style="font-size:var(--font-size-sm)">${$.number}</span>
              <span class="text-secondary" style="font-size:var(--font-size-xs)">${$.customerName}</span>
              <span class="badge ${$.priority==="High"||$.priority==="Urgent"?"badge-danger":"badge-neutral"}" style="font-size:9px">${$.priority}</span>
            </div>
          `).join("")||'<span class="text-secondary" style="font-size:var(--font-size-sm);padding:4px">All jobs are scheduled</span>'}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 260px);overflow:hidden">
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${r==="all"?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${s.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${s.map($=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${$.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${$.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${S.map(($,V)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${$.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${k[$.getDay()]}, ${$.getDate()} ${M[$.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${s.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${n.map(R=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${R.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${s.map(R=>{const J=K.filter(T=>T.technicianId===R.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${R.id}" data-day="${V}" data-date="${S[V].toISOString().split("T")[0]}">
                          ${n.map(T=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${T}"></div>`).join("")}
                          ${E(J,V,R.color)}
                        </div>
                      `}).join("")}
                  </div>
                `).join("")}
            `:`
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${S.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${S.map($=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${$.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${k[$.getDay()]} ${$.getDate()} ${M[$.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${S.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${n.map($=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${$.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${S.map(($,V)=>{const W=s.find(J=>J.id===r),R=K.filter(J=>J.technicianId===W.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${W.id}" data-day="${V}">
                      ${n.map(J=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${J}"></div>`).join("")}
                      ${E(R,V,W.color)}
                    </div>
                  `}).join("")}
              </div>
            `}
          </div>
        </div>
      </div>
    `,j(),Q(S),ee(),v()}function Y(){return m.getAll("jobs").filter(k=>(!k.scheduledDate||!k.technicianId)&&k.status!=="Completed"&&k.status!=="Invoiced")}function E(S,k,M){const K={Urgent:"#EF4444",High:"#F59E0B"};return S.filter($=>$.dayIdx===k).map($=>{const V=$.startHour*c,W=Math.max(($.endHour-$.startHour)*c-2,b),R=K[$.priority]||M,J=`${x($.startHour)} — ${x($.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${$.jobId}"
            data-start="${$.startHour}"
            data-end="${$.endHour}"
            style="
              top:${V}px;
              height:${W}px;
              background:${M}12;
              border-color:${R};
              color:${M};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${$.jobNumber}</div>
            ${W>20?`<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${$.customerName}</div>`:""}
            ${W>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${J}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${$.jobId}" data-start="${$.startHour}" data-end="${$.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function j(){var K,$,V,W;(K=t.querySelector("#btn-prev"))==null||K.addEventListener("click",()=>{i.setDate(i.getDate()-(e==="week"?7:1)),F()}),($=t.querySelector("#btn-next"))==null||$.addEventListener("click",()=>{i.setDate(i.getDate()+(e==="week"?7:1)),F()}),(V=t.querySelector("#btn-today"))==null||V.addEventListener("click",()=>{i=new Date,F()}),t.querySelectorAll("[data-view]").forEach(R=>{R.addEventListener("click",()=>{e=R.dataset.view,F()})}),t.querySelectorAll("[data-cal]").forEach(R=>{R.addEventListener("click",()=>{o=R.dataset.cal,F()})}),(W=t.querySelector("#schedule-tech-filter"))==null||W.addEventListener("change",R=>{r=R.target.value,F()});const S=t.querySelector("#unscheduled-toggle"),k=t.querySelector("#unscheduled-drawer"),M=t.querySelector("#unscheduled-chevron");S==null||S.addEventListener("click",()=>{const R=k.style.display!=="none";k.style.display=R?"none":"flex",M.textContent=R?"expand_more":"expand_less"}),t.querySelectorAll(".schedule-block").forEach(R=>{R.addEventListener("click",J=>{if(!J.defaultPrevented){if(R.dataset.resized==="true"){R.dataset.resized="false";return}h.navigate(`/jobs/${R.dataset.blockJobId}`)}}),R.addEventListener("contextmenu",J=>{J.preventDefault(),w();const T=R.dataset.blockJobId;l=document.createElement("div"),l.className="dropdown-menu",l.style.position="fixed",l.style.top=`${J.clientY}px`,l.style.left=`${J.clientX}px`,l.style.zIndex=1e3,l.style.background="var(--card-bg)",l.style.boxShadow="var(--shadow-md)",l.style.border="1px solid var(--border-color)",l.style.borderRadius="var(--border-radius)",l.style.padding="4px 0",l.style.minWidth="140px",l.innerHTML=`
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `,document.body.appendChild(l),l.querySelector("#ctx-view").addEventListener("click",()=>{w(),h.navigate(`/jobs/${T}`)}),l.querySelector("#ctx-unschedule").addEventListener("click",()=>{w(),jobs.find(I=>I.id===T)&&(m.update("jobs",T,{scheduledDate:null}),C("Job unscheduled","success"),F())})})})}function Q(S){t.querySelectorAll(".unscheduled-job").forEach(k=>{k.addEventListener("dragstart",M=>{a={type:"unscheduled",jobId:k.dataset.jobId,jobNumber:k.dataset.jobNumber,customerName:k.dataset.customer,title:k.dataset.title,hours:parseInt(k.dataset.hours)||2},M.dataTransfer.effectAllowed="move",k.style.opacity="0.5"}),k.addEventListener("dragend",()=>{k.style.opacity="1",a=null})}),t.querySelectorAll(".schedule-block[draggable]").forEach(k=>{k.addEventListener("dragstart",M=>{M.stopPropagation(),a={type:"existing",jobId:k.dataset.blockJobId,startHour:parseInt(k.dataset.start),endHour:parseInt(k.dataset.end)},M.dataTransfer.effectAllowed="move",k.style.opacity="0.4"}),k.addEventListener("dragend",()=>{k.style.opacity="1",a=null})}),t.querySelectorAll(".schedule-day-col").forEach(k=>{k.addEventListener("dragover",M=>{M.preventDefault(),M.dataTransfer.dropEffect="move",k.style.background="rgba(27, 109, 224, 0.05)"}),k.addEventListener("dragleave",()=>{k.style.background=""}),k.addEventListener("drop",M=>{const K=m.getAll("jobs");if(M.preventDefault(),k.style.background="",!a)return;const $=k.dataset.tech,V=parseInt(k.dataset.day),W=k.dataset.date?new Date(k.dataset.date+"T12:00:00"):S[V],R=k.getBoundingClientRect(),J=M.clientY-R.top,T=Math.floor(J/32),z=Math.max(0,Math.min(23,T)),I=s.find(_=>_.id===$),D=K.find(_=>_.id===a.jobId);if(D){const _=a.type==="existing"?a.endHour-a.startHour:a.hours||D.estimatedHours||2,H=z+_;if(P().some(Z=>Z.technicianId===$&&Z.dayIdx===V&&Z.jobId!==D.id&&Math.max(Z.startHour,z)<Math.min(Z.endHour,H))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){a=null;return}let L=D.technicians||[];L.find(Z=>Z.id===$)||(L=[{id:$,name:(I==null?void 0:I.name)||"",hours:_,rate:85}]);const N=Z=>Z.toString().padStart(2,"0"),B=`${W.getFullYear()}-${N(W.getMonth()+1)}-${N(W.getDate())}`;m.update("jobs",D.id,{technicianId:$,technicianName:(I==null?void 0:I.name)||"",technicians:L,scheduledDate:B,startHour:z,status:D.status==="Pending"?"Scheduled":D.status}),C(`${D.number} → ${(I==null?void 0:I.name)||"tech"} on ${W.toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})}`,"success")}a=null,F()})})}function ee(){t.querySelectorAll(".schedule-resize-handle").forEach(S=>{S.addEventListener("mousedown",k=>{k.preventDefault(),k.stopPropagation();const M=S.closest(".schedule-block"),K=M.closest(".schedule-day-col"),$=parseFloat(S.dataset.start),V=parseFloat(S.dataset.end),W=K.getBoundingClientRect();d={jobId:S.dataset.blockJobId,block:M,startHour:$,endHour:V,colRect:W},M.dataset.resized="false",M.style.opacity="0.85",M.style.userSelect="none",document.body.style.cursor="ns-resize";function R(T){if(!d)return;const z=document.getElementById("calendar-scroll"),I=z?z.scrollTop:0,_=(T.clientY-d.colRect.top+I)/c,H=p(_),X=d.startHour+.25,q=Math.max(H,X);if(q!==d.endHour){d.endHour=q,d.block.dataset.resized="true";const L=Math.max((q-d.startHour)*c-2,b);d.block.style.height=L+"px";const N=d.block.querySelector(".schedule-block-time");N&&(N.textContent=`${x(d.startHour)} — ${x(q)}`)}}function J(){if(document.removeEventListener("mousemove",R),document.removeEventListener("mouseup",J),document.body.style.cursor="",!d)return;const{jobId:T,startHour:z,endHour:I}=d,D=I-z;if(d.block.style.opacity="",d.block.style.userSelect="",Math.abs(I-V)>=.25){const _=m.getAll("jobs").find(H=>H.id===T);if(_){let H=_.technicians||[];H.length>0&&(H=H.map(X=>({...X,hours:D}))),m.update("jobs",T,{startHour:z,estimatedHours:parseFloat(D.toFixed(4)),technicians:H.length>0?H:_.technicians}),C(`Duration set to ${x(D).replace("0","").trim()||D+"h"}`,"success")}d=null,F();return}d=null}document.addEventListener("mousemove",R),document.addEventListener("mouseup",J)})})}function te(){var $;const S=A(),k=["January","February","March","April","May","June","July","August","September","October","November","December"],M=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),K=m.getAll("activities").filter(V=>V.assignedToId===M.id);t.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${k[i.getMonth()]} ${i.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
             <!-- Spacer -->
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${o==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${o==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${e==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${e==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>
      <div class="card" style="height:calc(100vh - 160px); display:flex; flex-direction:column;">
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;">My Activities</h3>
          <button class="btn btn-primary btn-sm" id="btn-new-activity">New Activity</button>
        </div>
        <div style="flex:1; overflow-y:auto; padding: 15px;">
          ${S.map(V=>{const W=V.toISOString().split("T")[0],R=K.filter(J=>J.date===W);return`
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">${V.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}</h4>
                ${R.length===0?'<p style="color:var(--text-tertiary); font-size: 13px; margin: 0;">No activities.</p>':`
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${R.map(J=>`
                      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                          <strong style="color:var(--text-primary);">${f(J.title)}</strong>
                          <span style="font-size:12px; color:var(--text-secondary);">${J.time?f(J.time):""}</span>
                        </div>
                        ${J.linkedTo?`<div style="font-size:12px; color:var(--text-secondary); margin-bottom:5px;">Linked to: ${f(J.linkedTo)}</div>`:""}
                        ${J.notes?`<div style="font-size:13px;">${f(J.notes)}</div>`:""}
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>
            `}).join("")}
        </div>
      </div>
    `,j(),($=t.querySelector("#btn-new-activity"))==null||$.addEventListener("click",()=>{const V=prompt("Activity Title:");if(!V)return;const W=prompt("Date (YYYY-MM-DD):",new Date().toISOString().split("T")[0]);if(!W)return;const R=prompt("Time (e.g. 10:00 AM):",""),J=prompt("Linked To (Job/Customer Name):",""),T=prompt("Notes:","");m.create("activities",{title:V,date:W,time:R,linkedTo:J,notes:T,assignedToId:M.id}),C("Activity added","success"),F()})}F()}function pt(t){var n;const s=m.getAll("stock");t.innerHTML=`
    <div class="page-header">
      <h1>Stock / Inventory</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-transfer-stock"><span class="material-icons-outlined">swap_horiz</span> Transfer</button>
        <button class="btn btn-primary" id="btn-new-stock"><span class="material-icons-outlined">add</span> New Item</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        ${[...new Set(s.map(a=>a.category))].map(a=>`<button class="toolbar-filter" data-filter="${a}">${a}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search stock..." id="stock-search" />
      </div>
    </div>
    <div id="stock-table-container"></div>
  `;let e=[...s];const i=be({columns:[{key:"name",label:"Item Name",render:a=>`<span class="cell-link font-medium">${f(a.name)}</span>`},{key:"sku",label:"SKU",render:a=>`<span class="text-secondary" style="font-family:monospace">${f(a.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:a=>`<span class="badge badge-neutral">${f(a.category)}</span>`,width:"110px"},{key:"quantity",label:"Qty",render:a=>{const d=a.quantity<=a.reorderLevel;return`<span style="font-weight:600;color:${d?"var(--color-danger)":"var(--text-primary)"}">${a.quantity}</span>${d?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:a=>a.quantity,width:"100px"},{key:"unitPrice",label:"Unit Price",render:a=>`$${a.unitPrice.toFixed(2)}`,getValue:a=>a.unitPrice,width:"100px"},{key:"location",label:"Location",render:a=>`<span class="text-secondary">${f(a.location)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:a=>`<span class="text-secondary">${f(a.supplier)}</span>`}],data:e,onRowClick:a=>h.navigate(`/stock/${a}`),emptyMessage:"No stock items",emptyIcon:"inventory_2"});t.querySelector("#stock-table-container").appendChild(i),t.querySelector("#btn-new-stock").addEventListener("click",()=>h.navigate("/stock/new")),(n=t.querySelector("#btn-transfer-stock"))==null||n.addEventListener("click",()=>{const a=m.getAll("stock"),d=m.getAll("technicians");if(a.length===0){C("No stock items available to transfer","error");return}const r=document.createElement("div");r.innerHTML=`
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${a.map(l=>`<option value="${f(l.id)}">${f(l.name)} (Qty: ${l.quantity}) - ${f(l.location)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select location...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              ${d.map(l=>`<option value="Vehicle - ${f(l.name)}">Vehicle - ${f(l.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" />
          </div>
        </div>
      `,ie({title:"Transfer Stock",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Transfer",className:"btn-primary",onClick:l=>{const y=document.getElementById("transfer-item").value,u=document.getElementById("transfer-to").value,c=parseInt(document.getElementById("transfer-qty").value)||0;if(!y||!u||c<=0){C("Please fill all fields correctly","error");return}const b=m.getById("stock",y);if(b.quantity<c){C("Insufficient quantity available","error");return}if(b.location===u){C("Cannot transfer to the same location","error");return}m.update("stock",b.id,{quantity:b.quantity-c});const p=a.find(x=>x.sku===b.sku&&x.location===u);if(p)m.update("stock",p.id,{quantity:p.quantity+c});else{const x={...b,id:void 0,quantity:c,location:u};m.create("stock",x)}C("Stock transferred successfully","success"),pt(t),l()}}]})}),t.querySelectorAll(".toolbar-filter").forEach(a=>{a.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(r=>r.classList.remove("active")),a.classList.add("active");const d=a.dataset.filter;e=d==="all"?[...s]:s.filter(r=>r.category===d),i.updateData(e)})}),t.querySelector("#stock-search").addEventListener("input",a=>{const d=a.target.value.toLowerCase();e=s.filter(r=>r.name.toLowerCase().includes(d)||r.sku.toLowerCase().includes(d)||r.category.toLowerCase().includes(d)),i.updateData(e)})}function bs(t,{id:s}){const e=m.getById("stock",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}he(e.name);const o=e.quantity<=e.reorderLevel,i=e.unitPrice>0?((e.unitPrice-e.costPrice)/e.unitPrice*100).toFixed(1):0;t.innerHTML=`
    ${Ee({title:e.name,icon:"inventory_2",iconBgColor:o?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:o?"var(--color-danger)":"var(--color-success)",metaHtml:`
        <span style="font-family:monospace">${e.sku}</span>
        <span class="badge badge-neutral">${e.category}</span>
        ${o?'<span class="badge badge-danger">LOW STOCK</span>':'<span class="badge badge-success">IN STOCK</span>'}
      `,actionsHtml:`
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `})}

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Current Stock</div>
        <div class="stat-value" style="color:${o?"var(--color-danger)":"var(--text-primary)"}">${e.quantity}</div>
        <div class="text-sm text-secondary">Reorder at ${e.reorderLevel} ${e.unit}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unit Price</div>
        <div class="stat-value">$${e.unitPrice.toFixed(2)}</div>
        <div class="text-sm text-secondary">Cost: $${e.costPrice.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Profit Margin</div>
        <div class="stat-value">${i}%</div>
        <div class="text-sm text-secondary">Stock value: $${(e.quantity*e.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Item Details</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${pe("Name",e.name)}
            ${pe("SKU",e.sku)}
            ${pe("Category",e.category)}
            ${pe("Unit",e.unit)}
            ${pe("Supplier",e.supplier)}
            ${pe("Location",e.location)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Pricing</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${pe("Cost Price",`$${e.costPrice.toFixed(2)}`)}
            ${pe("Sell Price",`$${e.unitPrice.toFixed(2)}`)}
            ${pe("Margin",`${i}%`)}
            ${pe("Total Value",`$${(e.quantity*e.unitPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,t.querySelector("#btn-edit-stock").addEventListener("click",()=>h.navigate(`/stock/${s}/edit`)),t.querySelector("#btn-delete-stock").addEventListener("click",()=>{const n=document.createElement("div");n.innerHTML=`<p>Delete <strong>${f(e.name)}</strong>?</p>`,ie({title:"Delete Stock Item",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:a=>a()},{label:"Delete",className:"btn-danger",onClick:a=>{m.delete("stock",s),C("Item deleted","success"),a(),h.navigate("/stock")}}]})})}function pe(t,s){return`<div style="display:flex;gap:8px"><span style="width:100px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${t}</span><span>${s}</span></div>`}function mt(t,{id:s}){const e=s&&s!=="new",o=e?m.getById("stock",s):{},i=m.getAll("fleet");t.innerHTML=`
    <div class="page-header"><h1>${e?"Edit Stock Item":"New Stock Item"}</h1></div>
    <div class="card" style="max-width:720px">
      <div class="card-body">
        <form id="stock-form">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input class="form-input" name="name" value="${o.name||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">SKU</label>
              <input class="form-input" name="sku" value="${o.sku||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="category">
                ${["Electrical","Plumbing","HVAC","Fire Safety","Security","General"].map(n=>`<option ${o.category===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Unit</label>
              <input class="form-input" name="unit" value="${o.unit||"each"}" />
            </div>
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input class="form-input" type="number" name="quantity" value="${o.quantity??""}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cost Price ($)</label>
              <input class="form-input" type="number" name="costPrice" value="${o.costPrice||""}" step="0.01" />
            </div>
            <div class="form-group">
              <label class="form-label">Sell Price ($)</label>
              <input class="form-input" type="number" name="unitPrice" value="${o.unitPrice||""}" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Reorder Level</label>
              <input class="form-input" type="number" name="reorderLevel" value="${o.reorderLevel||"10"}" />
            </div>
            <div class="form-group">
              <label class="form-label">Supplier</label>
              <input class="form-input" name="supplier" value="${o.supplier||""}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Location</label>
            <select class="form-select" name="location">
              ${["Warehouse A","Warehouse B","On Order"].map(n=>`<option ${o.location===n?"selected":""}>${n}</option>`).join("")}
              <optgroup label="Fleet Vehicles">
                ${i.map(n=>`<option value="${n.name}" ${o.location===n.name?"selected":""}>${n.name}</option>`).join("")}
              </optgroup>
            </select>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${e?"Update":"Create"} Item</button>
      </div>
    </div>
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>h.navigate(e?`/stock/${s}`:"/stock")),t.querySelector("#btn-save").addEventListener("click",()=>{const n=t.querySelector("#stock-form");if(!n.checkValidity()){n.reportValidity();return}const a=Object.fromEntries(new FormData(n));if(a.quantity=parseInt(a.quantity)||0,a.costPrice=parseFloat(a.costPrice)||0,a.unitPrice=parseFloat(a.unitPrice)||0,a.reorderLevel=parseInt(a.reorderLevel)||10,e)m.update("stock",s,a),C("Item updated","success"),Ke(a),h.navigate(`/stock/${s}`);else{a.sku=a.sku||`SKU-${Date.now().toString().slice(-4)}`;const d=m.create("stock",a);C("Item created","success"),Ke(a),h.navigate(`/stock/${d.id}`)}})}function Ke(t){if(t.quantity<=t.reorderLevel){const s=JSON.parse(sessionStorage.getItem("currentUser")||"{}");let e=!1;if(s.role==="admin")e=!0;else if(s.userTypeId){const o=m.getById("userTypes",s.userTypeId);if(o&&o.permissions){const i=o.permissions.find(n=>n.module==="Stock");i&&(e=i.edit||i.create)}}e&&(me(async()=>{const{showToast:o}=await Promise.resolve().then(()=>Me);return{showToast:o}},void 0).then(({showToast:o})=>{o(`Auto-Reorder Alert: ${t.name} is at or below its reorder level (${t.quantity} left).`,"warning")}),m.create("notifications",{title:"Stock Auto-Reorder",message:`${t.name} (SKU: ${t.sku}) has reached its reorder level. Current quantity: ${t.quantity}. Please reorder from ${t.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function vs(t){const s=m.getAll("invoices");t.innerHTML=`
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
  `;let e=[...s];const o={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},n=be({columns:[{key:"number",label:"Invoice #",render:r=>`<span class="cell-link font-medium">${f(r.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:r=>r.jobNumber?`<span class="text-secondary">${f(r.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:r=>`<span class="badge ${o[r.status]||"badge-neutral"}">${f(r.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:r=>`<span class="font-semibold">$${(r.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:r=>r.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:r=>r.issueDate?new Date(r.issueDate).toLocaleDateString():"—",getValue:r=>r.issueDate?new Date(r.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():"—",getValue:r=>r.dueDate?new Date(r.dueDate).getTime():0,width:"100px"}],data:e,onRowClick:r=>h.navigate(`/invoices/${r}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long"});t.querySelector("#invoices-table-container").appendChild(n),t.querySelector("#btn-new-invoice").addEventListener("click",()=>h.navigate("/invoices/new"));const a=t.querySelector("#btn-export-accounting");function d(r){r.some(l=>l.status==="Paid")?a.style.display="inline-flex":a.style.display="none"}d(e),t.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(y=>y.classList.remove("active")),r.classList.add("active");const l=r.dataset.filter;e=l==="all"?[...s]:s.filter(y=>y.status===l),n.updateData(e),d(e)})}),a.addEventListener("click",()=>{const r=e.filter(c=>c.status==="Paid");if(r.length===0)return;let l="data:text/csv;charset=utf-8,";l+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,r.forEach(c=>{const b=[c.number,`"${c.customerName.replace(/"/g,'""')}"`,c.email||"",c.issueDate?c.issueDate.split("T")[0]:"",c.dueDate?c.dueDate.split("T")[0]:"",(c.total||0).toFixed(2),(c.tax||0).toFixed(2),"200"].join(",");l+=b+`
`});const y=encodeURI(l),u=document.createElement("a");u.setAttribute("href",y),u.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(u),u.click(),document.body.removeChild(u),me(async()=>{const{showToast:c}=await Promise.resolve().then(()=>Me);return{showToast:c}},void 0).then(({showToast:c})=>{c(`Exported ${r.length} paid invoices`,"success")})}),t.querySelector("#invoices-search").addEventListener("input",r=>{const l=r.target.value.toLowerCase();e=s.filter(y=>y.number.toLowerCase().includes(l)||y.customerName.toLowerCase().includes(l)||(y.jobNumber||"").toLowerCase().includes(l)),n.updateData(e),d(e)})}function bt(t,{id:s}){const e=s==="new";let o=e?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:m.getById("invoices",s);if(!o){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}e||he(o.number);const i=m.getAll("customers"),n=m.getAll("stock"),a=m.getSettings(),d={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function r(){t.innerHTML=`
      ${Ee({title:`
          ${e?"New Invoice":o.number}
          ${o.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':o.invoiceType&&o.invoiceType!=="Standard"?`<span class="badge badge-primary">${o.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          ${o.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${o.jobNumber}</span>`:""}
          <span class="badge ${d[o.status]||"badge-neutral"}">${o.status}</span>
        `,actionsHtml:`
          ${e?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> Preview PDF</button>'}
          ${!e&&o.status==="Draft"?'<button class="btn btn-primary" id="btn-send-invoice"><span class="material-icons-outlined">send</span> Send</button>':""}
          ${!e&&(o.status==="Sent"||o.status==="Overdue")?'<button class="btn btn-secondary" id="btn-send-reminder"><span class="material-icons-outlined">notifications</span> Send Reminder</button>':""}
          ${!e&&(o.status==="Sent"||o.status==="Overdue")?'<button class="btn btn-primary" id="btn-mark-paid"><span class="material-icons-outlined">check_circle</span> Mark Paid</button>':""}
          ${e?"":'<button class="btn btn-danger btn-icon" id="btn-delete-invoice"><span class="material-icons-outlined">delete</span></button>'}
        `})}

      <!-- Invoice form -->
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><h4>Invoice Details</h4></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="inv-customer">
                <option value="">Select customer...</option>
                ${i.map(c=>`<option value="${c.id}" ${o.customerId===c.id?"selected":""}>${c.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(c=>`<option ${o.invoiceType===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inv-status">
                ${["Draft","Sent","Paid","Overdue","Void"].map(c=>`<option ${o.status===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input class="form-input" type="date" id="inv-issue" value="${o.issueDate?o.issueDate.split("T")[0]:""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" id="inv-due" value="${o.dueDate?o.dueDate.split("T")[0]:""}" />
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <datalist id="stock-items-list">
        ${n.map(c=>`<option value="${c.name}"></option>`).join("")}
      </datalist>

      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <h4>Line Items</h4>
          <button class="btn btn-sm btn-primary" id="btn-add-line"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table" id="line-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="width:80px">Type</th>
                <th style="width:70px">Qty</th>
                <th style="width:90px">Rate</th>
                <th style="width:100px">Total</th>
                <th style="width:50px"></th>
              </tr>
            </thead>
            <tbody>
              ${(o.lineItems||[]).map((c,b)=>l(c,b)).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totals -->
      <div class="card" style="max-width:360px;margin-left:auto;margin-bottom:var(--space-lg)">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-secondary">Subtotal</span><span id="inv-subtotal">$${(o.subtotal||0).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-secondary">GST (10%)</span><span id="inv-tax">$${(o.tax||0).toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
            <span>Total</span><span id="inv-total">$${(o.total||0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-inv">Cancel</button>
        <button class="btn btn-primary" id="btn-save-inv"><span class="material-icons-outlined">save</span> Save Invoice</button>
      </div>
    `,u()}function l(c,b){return`
      <tr data-index="${b}">
        <td><input class="form-input" list="stock-items-list" style="padding:4px 8px" value="${c.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select" style="padding:4px 8px" data-field="type">
          <option value="labor" ${c.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${c.type==="material"?"selected":""}>Material</option>
          <option value="other" ${c.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input" style="padding:4px 8px" type="number" value="${c.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input" style="padding:4px 8px" type="number" value="${c.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600">$${(c.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm" data-remove="${b}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function y(){const c=o.lineItems||[];c.forEach(v=>{v.total=(v.qty||0)*(v.rate||0)});let b=c.reduce((v,w)=>v+Math.abs(w.total||0),0);o.invoiceType==="CreditNote"?b=-Math.abs(b):b=Math.abs(b),o.subtotal=b,o.tax=b*.1,o.total=b+o.tax;const p=t.querySelector("#inv-subtotal"),x=t.querySelector("#inv-tax"),g=t.querySelector("#inv-total");p&&(p.textContent=`$${o.subtotal.toFixed(2)}`),x&&(x.textContent=`$${o.tax.toFixed(2)}`),g&&(g.textContent=`$${o.total.toFixed(2)}`)}function u(){var c,b,p,x,g,v,w,A,P;(c=t.querySelector("#btn-preview-pdf"))==null||c.addEventListener("click",()=>{dt({type:"invoice",data:o})}),(b=t.querySelector("#btn-add-line"))==null||b.addEventListener("click",()=>{o.lineItems||(o.lineItems=[]),o.lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),r()}),t.querySelectorAll("#line-items-table input, #line-items-table select").forEach(O=>{O.addEventListener("input",()=>{const F=O.closest("tr"),Y=parseInt(F.dataset.index),E=O.dataset.field;let j=O.value;if((E==="qty"||E==="rate")&&(j=parseFloat(j)||0),o.lineItems[Y][E]=j,E==="description"){const ee=n.find(te=>te.name===j);if(ee){const te=ee.category&&ee.category.toLowerCase().includes("labor");let S=ee.unitPrice||0;te||(S=S*(1+(a.markupPercent||0)/100)),o.lineItems[Y].type=te?"labor":"material",o.lineItems[Y].rate=S;const k=F.querySelector('[data-field="type"]'),M=F.querySelector('[data-field="rate"]');k&&(k.value=o.lineItems[Y].type),M&&(M.value=S.toFixed(2))}}y();const Q=F.querySelector("td:nth-child(5)");Q&&(Q.textContent=`$${(o.lineItems[Y].total||0).toFixed(2)}`)})}),t.querySelectorAll("[data-remove]").forEach(O=>{O.addEventListener("click",()=>{o.lineItems.splice(parseInt(O.dataset.remove),1),r()})}),(p=t.querySelector("#inv-type"))==null||p.addEventListener("change",O=>{o.invoiceType=O.target.value,y()}),(x=t.querySelector("#btn-cancel-inv"))==null||x.addEventListener("click",()=>h.navigate("/invoices")),(g=t.querySelector("#btn-save-inv"))==null||g.addEventListener("click",()=>{var Y;const O=t.querySelector("#inv-customer").value,F=i.find(E=>E.id===O);if(o.customerId=O,o.customerName=(F==null?void 0:F.company)||"",o.contactName=F?`${F.firstName} ${F.lastName}`:"",o.invoiceType=((Y=t.querySelector("#inv-type"))==null?void 0:Y.value)||"Standard",o.status=t.querySelector("#inv-status").value,o.issueDate=t.querySelector("#inv-issue").value,o.dueDate=t.querySelector("#inv-due").value,y(),e){const E=m.create("invoices",o);C("Invoice created","success"),h.navigate(`/invoices/${E.id}`)}else m.update("invoices",s,o),C("Invoice saved","success")}),(v=t.querySelector("#btn-send-invoice"))==null||v.addEventListener("click",()=>{m.update("invoices",s,{status:"Sent"}),o.status="Sent",C("Invoice sent","success"),r()}),(w=t.querySelector("#btn-send-reminder"))==null||w.addEventListener("click",()=>{o.lastReminderDate=new Date().toISOString(),m.update("invoices",s,{lastReminderDate:o.lastReminderDate}),C("Payment reminder sent","success")}),(A=t.querySelector("#btn-mark-paid"))==null||A.addEventListener("click",()=>{m.update("invoices",s,{status:"Paid",paidDate:new Date().toISOString()}),o.status="Paid",C("Invoice marked as paid","success"),r()}),(P=t.querySelector("#btn-delete-invoice"))==null||P.addEventListener("click",()=>{const O=document.createElement("div");O.innerHTML=`<p>Delete invoice <strong>${f(o.number)}</strong>?</p>`,ie({title:"Delete Invoice",content:O,actions:[{label:"Cancel",className:"btn-secondary",onClick:F=>F()},{label:"Delete",className:"btn-danger",onClick:F=>{m.delete("invoices",s),C("Invoice deleted","success"),F(),h.navigate("/invoices")}}]})})}r()}function ys(t){const s=m.getAll("purchaseOrders");t.innerHTML=`
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
  `;let e=[...s];const i=be({columns:[{key:"number",label:"PO Number",render:n=>`<span class="cell-link font-medium">${f(n.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:n=>`<span class="text-secondary">${f(n.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:n=>n.jobId?`<a href="#/jobs/${n.jobId}" class="cell-link">${f(n.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:n=>n.issueDate?new Date(n.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:n=>`$${(n.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:n=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[n.status]||"badge-neutral"}">${f(n.status)}</span>`,width:"110px"}],data:e,onRowClick:n=>h.navigate(`/purchase-orders/${n}`),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart"});t.querySelector("#po-table-container").appendChild(i),t.querySelector("#btn-new-po").addEventListener("click",()=>h.navigate("/purchase-orders/new")),t.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),n.classList.add("active");const a=n.dataset.filter;e=a==="all"?[...s]:s.filter(d=>d.status===a),i.updateData(e)})}),t.querySelector("#po-search").addEventListener("input",n=>{const a=n.target.value.toLowerCase();e=s.filter(d=>{var r,l,y;return((r=d.number)==null?void 0:r.toLowerCase().includes(a))||((l=d.supplierName)==null?void 0:l.toLowerCase().includes(a))||((y=d.jobNumber)==null?void 0:y.toLowerCase().includes(a))}),i.updateData(e)})}function vt(t,{id:s,jobId:e}){const o=s==="new";let i=o?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:e||"",jobNumber:""}:m.getById("purchaseOrders",s);if(!i){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(o&&e){const c=m.getById("jobs",e);c&&(i.jobNumber=c.number)}he(i.number||"New PO");const n=m.getAll("stock"),a=m.getAll("jobs"),d=[...new Set(n.map(c=>c.supplier).filter(Boolean))];d.length===0&&d.push("General Supplier");function r(){t.innerHTML=`
      ${Ee({title:i.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${i.status==="Draft"?"badge-neutral":i.status==="Issued"?"badge-primary":i.status==="Received"?"badge-success":"badge-danger"}">${i.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!o&&i.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!o&&i.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${i.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${d.map(c=>`<option value="${c}" ${i.supplierName===c?"selected":""}>${c}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${i.issueDate?i.issueDate.split("T")[0]:""}" ${i.status!=="Draft"?"disabled":""} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${i.status!=="Draft"?"disabled":""}>
                    <option value="">None</option>
                    ${a.map(c=>`<option value="${c.id}" ${i.jobId===c.id?"selected":""}>${c.number} - ${c.title}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${i.status!=="Draft"?"disabled":""}>${i.notes||""}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${i.status==="Draft"?'<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>':""}
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
                  ${i.status==="Draft"?'<th style="width:5%"></th>':""}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${i.lineItems.length===0?'<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>':""}
                ${i.lineItems.map((c,b)=>`
                  <tr data-index="${b}">
                    <td>
                      ${i.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${n.map(p=>`<option value="${p.id}" ${c.stockId===p.id?"selected":""}>${p.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${c.stockId?"display:none":""}" value="${c.description||""}" placeholder="Description" />
                      `:`<div>${c.description}</div>`}
                    </td>
                    <td>
                      ${i.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${c.sku||""}" ${c.stockId?"disabled":""} />`:c.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${i.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${c.unitCost||0}" step="0.01" />`:`$${(c.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${i.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${c.quantity||1}" min="1" step="1" />`:c.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((c.unitCost||0)*(c.quantity||1)).toFixed(2)}
                    </td>
                    ${i.status==="Draft"?`
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>`:""}
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(i.total||0).toFixed(2)}</td>
                  ${i.status==="Draft"?"<td></td>":""}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,y()}function l(){let c=0;t.querySelectorAll("#line-items-body tr[data-index]").forEach(p=>{const x=parseFloat(p.querySelector(".item-cost").value)||0,g=parseFloat(p.querySelector(".item-qty").value)||0,v=x*g;p.querySelector(".item-total").textContent="$"+v.toFixed(2),c+=v}),i.total=c;const b=t.querySelector("#po-total");b&&(b.textContent="$"+c.toFixed(2))}function y(){var c,b,p,x;t.querySelector("#btn-cancel").addEventListener("click",()=>h.navigate("/purchase-orders")),(c=t.querySelector("#btn-save"))==null||c.addEventListener("click",()=>{u()}),(b=t.querySelector("#btn-issue"))==null||b.addEventListener("click",()=>{if(i.lineItems.length===0){C("Cannot issue a PO with no items","error");return}u("Issued")}),(p=t.querySelector("#btn-receive"))==null||p.addEventListener("click",()=>{let g=0;i.lineItems.forEach(v=>{if(v.stockId){const w=m.getById("stock",v.stockId);w&&(m.update("stock",w.id,{quantity:(w.quantity||0)+v.quantity}),g++)}}),C(`Received ${g} items into stock.`,"success"),i.status="Received",m.update("purchaseOrders",i.id,{status:"Received"}),r()}),(x=t.querySelector("#btn-add-item"))==null||x.addEventListener("click",()=>{i.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),r()}),t.querySelectorAll(".item-select").forEach((g,v)=>{g.addEventListener("change",w=>{const A=w.target.value,P=w.target.closest("tr"),O=P.querySelector(".item-desc"),F=P.querySelector(".item-sku"),Y=P.querySelector(".item-cost");if(A){const E=m.getById("stock",A);E&&(O.style.display="none",O.value=E.name,F.value=E.sku,F.disabled=!0,Y.value=E.costPrice||E.unitPrice)}else O.style.display="block",O.value="",F.value="",F.disabled=!1,Y.value=0;l()})}),t.querySelectorAll(".item-cost, .item-qty").forEach(g=>{g.addEventListener("input",l)}),t.querySelectorAll(".btn-remove-item").forEach(g=>{g.addEventListener("click",v=>{const w=v.target.closest("tr"),A=parseInt(w.dataset.index);i.lineItems.splice(A,1),r()})})}function u(c=null){if(i.status!=="Draft"){C("Cannot modify an issued or received PO","error");return}const b=t.querySelector("#po-form");if(!b.checkValidity()){b.reportValidity();return}const p=Object.fromEntries(new FormData(b));if(p.jobId){const g=a.find(v=>v.id===p.jobId);p.jobNumber=g?g.number:""}else p.jobNumber="";i.lineItems=Array.from(t.querySelectorAll("#line-items-body tr[data-index]")).map(g=>{const v=g.querySelector(".item-select"),w=v?v.value:"",A=g.querySelector(".item-desc").value,P=w?v.options[v.selectedIndex].text:A;return{stockId:w,description:P,sku:g.querySelector(".item-sku").value,unitCost:parseFloat(g.querySelector(".item-cost").value)||0,quantity:parseInt(g.querySelector(".item-qty").value)||1}}),l();const x={...i,...p,total:i.total,lineItems:i.lineItems,status:c||i.status};if(o){x.number=`PO-${Date.now().toString().slice(-6)}`;const g=m.create("purchaseOrders",x);C(`PO ${c==="Issued"?"issued":"created"} successfully`,"success"),h.navigate(`/purchase-orders/${g.id}`)}else m.update("purchaseOrders",s,x),C(`PO ${c==="Issued"?"issued":"updated"} successfully`,"success"),c==="Issued"&&r()}r()}function fs(t){let s="overview";const e=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function o(){const r=m.getAll("jobs"),l=m.getAll("quotes"),y=m.getAll("invoices"),u=m.getAll("customers"),c=m.getAll("stock"),b=m.getAll("technicians"),p=m.getAll("leads"),x=y.filter(S=>S.status==="Paid").reduce((S,k)=>S+(k.total||0),0),g=y.filter(S=>S.status==="Sent"||S.status==="Overdue").reduce((S,k)=>S+(k.total||0),0),v=r.length>0?r.reduce((S,k)=>S+(k.laborCost||0)+(k.materialCost||0),0)/r.length:0,w=l.length>0?l.filter(S=>S.status==="Accepted").length/l.length*100:0,A=p.length>0?p.filter(S=>S.status==="Won").length/p.length*100:0,P={};r.forEach(S=>{P[S.status]=(P[S.status]||0)+1});const O={};y.forEach(S=>{O[S.status]=(O[S.status]||0)+1});const F=b.map(S=>{const k=r.filter($=>$.technicianId===S.id),M=k.filter($=>$.status==="Completed"||$.status==="Invoiced").length,K=k.reduce(($,V)=>$+(V.laborCost||0)+(V.materialCost||0),0);return{...S,totalJobs:k.length,completed:M,revenue:K}}),Y={};y.filter(S=>S.status==="Paid").forEach(S=>{Y[S.customerName]=(Y[S.customerName]||0)+(S.total||0)});const E=Object.entries(Y).sort((S,k)=>k[1]-S[1]).slice(0,10),j=c.reduce((S,k)=>S+k.quantity*k.costPrice,0),Q=c.filter(S=>S.quantity<=S.reorderLevel),ee=m.getAll("timesheets"),te={};return ee.forEach(S=>{te[S.jobId]=(te[S.jobId]||0)+(S.hours||0)}),{jobs:r,quotes:l,invoices:y,customers:u,stock:c,technicians:b,leads:p,totalRevenue:x,totalOutstanding:g,avgJobValue:v,quoteWinRate:w,leadConvRate:A,jobsByStatus:P,invByStatus:O,techStats:F,topCustomers:E,totalStockValue:j,lowStockItems:Q,timesheets:ee,hoursByJob:te}}function i(){const r=o();t.innerHTML=`
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
              ${e.map(l=>`
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
    `,n(r),a(r)}function n(r){const l=t.querySelector("#report-content");switch(s){case"overview":l.innerHTML=gs(r);break;case"revenue":l.innerHTML=hs(r);break;case"jobs":l.innerHTML=xs(r);break;case"job_costing":l.innerHTML=$s(r);break;case"technicians":l.innerHTML=Ss(r);break;case"customers":l.innerHTML=ws(r);break;case"inventory":l.innerHTML=ks(r);break;default:l.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function a(r){var l;t.querySelectorAll("[data-report]").forEach(y=>{y.addEventListener("click",()=>{s=y.dataset.report,i()})}),(l=t.querySelector("#btn-export-csv"))==null||l.addEventListener("click",()=>d(r))}function d(r){let l="";s==="overview"||s==="revenue"?(l=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,r.invoices.forEach(b=>{l+=`"${b.number}","${b.customerName}","${b.status}",${b.total||0},"${b.issueDate||""}","${b.dueDate||""}"
`})):s==="job_costing"?(l=`Job #,Technician,Est. Hrs,Actual Hrs,Est. Labor,Actual Labor,Variance
`,r.jobs.filter(p=>p.status==="Completed"||p.status==="Invoiced").map(p=>{const x=p.estimatedHours||0,g=p.laborCost||0,v=r.hoursByJob[p.id]||0,w=v*85;return{num:p.number,tech:p.technicianName||"",estH:x,actualH:v,estLabor:g,actualLabor:w,variance:g-w}}).forEach(p=>{l+=`"${p.num}","${p.tech}",${p.estH},${p.actualH},${p.estLabor},${p.actualLabor},${p.variance}
`})):s==="jobs"?(l=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,r.jobs.forEach(b=>{l+=`"${b.number}","${b.title}","${b.customerName}","${b.technicianName||""}","${b.status}","${b.priority}",${b.laborCost||0},${b.materialCost||0}
`})):s==="technicians"?(l=`Name,Role,Total Jobs,Completed,Revenue
`,r.techStats.forEach(b=>{l+=`"${b.name}","${b.role}",${b.totalJobs},${b.completed},${b.revenue}
`})):s==="customers"?(l=`Company,First Name,Last Name,Email,Phone,Status
`,r.customers.forEach(b=>{l+=`"${b.company}","${b.firstName}","${b.lastName}","${b.email}","${b.phone}","${b.status}"
`})):s==="inventory"&&(l=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,r.stock.forEach(b=>{l+=`"${b.name}","${b.sku}","${b.category}",${b.quantity},${b.costPrice},${b.unitPrice},"${b.location}","${b.supplier}"
`}));const y=new Blob([l],{type:"text/csv"}),u=URL.createObjectURL(y),c=document.createElement("a");c.href=u,c.download=`simpro_${s}_report.csv`,c.click(),URL.revokeObjectURL(u)}i()}function se(t,s,e,o){const i={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${t}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[o]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${i[o]}">${e}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${s}</div>
    </div>
  `}function we(t,s,e){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${e}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${s}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${t}</div>
        </div>
      </div>
    </div>
  `}function De(t,s={},e="#1B6DE0"){const o=Object.entries(t);if(o.length===0)return'<div class="text-secondary text-sm">No data available</div>';const i=Math.max(...o.map(([,n])=>n));return o.map(([n,a])=>{const d=s[n]||e,r=i>0?a/i*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${n}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${r}%;background:${d};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof a=="number"&&a>=1e3?`$${(a/1e3).toFixed(1)}k`:a}</div>
      </div>
    `}).join("")}function qe(t,s,e,o){const i=e>0?s/e*100:0,n=typeof s=="number"?`$${s.toLocaleString("en-AU",{minimumFractionDigits:0})}`:s;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${t}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${n}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${i}%;background:${o};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function gs(t){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${se("Total Revenue",`$${t.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${se("Outstanding",`$${t.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${se("Quote Win Rate",`${t.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${se("Lead Conversion",`${t.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${De(t.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${De(t.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
      </div>
    </div>
    <div class="grid-3">
      ${we("Total Jobs",t.jobs.length,"build")}
      ${we("Total Quotes",t.quotes.length,"request_quote")}
      ${we("Total Invoices",t.invoices.length,"receipt_long")}
      ${we("Total Customers",t.customers.length,"people")}
      ${we("Avg Job Value",`$${t.avgJobValue.toFixed(0)}`,"paid")}
      ${we("Stock Items",`${t.stock.length} (${t.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function hs(t){const s=t.invoices.filter(a=>a.status==="Paid"),e={};s.forEach(a=>{const d=new Date(a.issueDate||a.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});e[d]=(e[d]||0)+(a.total||0)});const o=t.jobs.reduce((a,d)=>a+(d.materialCost||0),0),i=t.jobs.reduce((a,d)=>a+(d.laborCost||0),0),n=t.totalRevenue-o;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${se("Gross Revenue",`$${t.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${se("Total Labor",`$${i.toFixed(0)}`,"engineering","blue")}
      ${se("Material Costs",`$${o.toFixed(0)}`,"inventory_2","orange")}
      ${se("Gross Profit",`$${n.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${De(e,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${qe("Revenue",t.totalRevenue,t.totalRevenue,"#10B981")}
        ${qe("Labor Cost",i,t.totalRevenue,"#3B82F6")}
        ${qe("Material Cost",o,t.totalRevenue,"#F59E0B")}
        ${qe("Gross Profit",n,t.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function xs(t){const s=t.jobs.filter(o=>o.status==="Completed"||o.status==="Invoiced"),e=s.length>0?s.reduce((o,i)=>o+(i.estimatedHours||0),0)/s.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${se("Total Jobs",t.jobs.length,"build","blue")}
      ${se("Completed",s.length,"check_circle","green")}
      ${se("In Progress",t.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${se("Avg Hours",e.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${De(t.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${t.jobs.sort((o,i)=>(i.laborCost||0)+(i.materialCost||0)-((o.laborCost||0)+(o.materialCost||0))).slice(0,8).map(o=>`
              <tr>
                <td class="font-medium">${o.number}</td>
                <td class="text-secondary">${o.customerName}</td>
                <td><span class="badge badge-neutral">${o.status}</span></td>
                <td style="text-align:right;font-weight:600">$${((o.laborCost||0)+(o.materialCost||0)).toFixed(0)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function $s(t){const e=t.jobs.filter(a=>a.status==="Completed"||a.status==="Invoiced").map(a=>{const d=a.estimatedHours||0,r=a.laborCost||0,l=t.hoursByJob[a.id]||0,u=l*85;return{...a,estH:d,actualH:l,estLabor:r,actualLabor:u,hVariance:d-l,laborVariance:r-u}}),o=e.reduce((a,d)=>a+d.estLabor,0),i=e.reduce((a,d)=>a+d.actualLabor,0),n=o-i;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${se("Est. Total Labor","$"+o.toFixed(0),"engineering","blue")}
      ${se("Actual Total Labor","$"+i.toFixed(0),"timer","orange")}
      ${se("Overall Variance","$"+Math.abs(n).toFixed(0)+" "+(n>=0?"Under Budget":"Over Budget"),"trending_flat",n>=0?"green":"red")}
    </div>
    <div class="card">
      <div class="card-header"><h4>Labor Costing Analysis (Completed Jobs)</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Technician</th>
              <th style="text-align:right">Est. Hrs</th>
              <th style="text-align:right">Actual Hrs</th>
              <th style="text-align:right">Est. Labor</th>
              <th style="text-align:right">Actual Labor</th>
              <th style="text-align:right">Variance</th>
            </tr>
          </thead>
          <tbody>
            ${e.map(a=>`
              <tr>
                <td class="font-medium"><a href="#/jobs/${a.id}" class="cell-link">${a.number}</a></td>
                <td>${a.technicianName||"—"}</td>
                <td style="text-align:right">${a.estH}</td>
                <td style="text-align:right;font-weight:${a.actualH>a.estH?"600":"400"};color:${a.actualH>a.estH?"var(--color-danger)":"inherit"}">${a.actualH}</td>
                <td style="text-align:right">$${a.estLabor.toFixed(0)}</td>
                <td style="text-align:right">$${a.actualLabor.toFixed(0)}</td>
                <td style="text-align:right;font-weight:600;color:${a.laborVariance>=0?"var(--color-success)":"var(--color-danger)"}">
                  ${a.laborVariance>=0?"+":"-"}$${Math.abs(a.laborVariance).toFixed(0)}
                </td>
              </tr>
            `).join("")}
            ${e.length?"":'<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No completed jobs to analyze</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Ss(t){return`
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Technician Performance</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th></th><th>Name</th><th>Role</th><th style="text-align:center">Total Jobs</th><th style="text-align:center">Completed</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>
            ${t.techStats.sort((s,e)=>e.revenue-s.revenue).map(s=>`
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
        ${t.techStats.map(s=>qe(s.name,s.revenue,Math.max(...t.techStats.map(e=>e.revenue)),s.color)).join("")}
      </div>
    </div>
  `}function ws(t){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${se("Total Customers",t.customers.length,"people","blue")}
      ${se("Active Customers",t.customers.filter(s=>s.status==="Active").length,"check_circle","green")}
      ${se("Total Leads",t.leads.length,"trending_up","orange")}
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Customers by Revenue</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Revenue</th><th>Share</th></tr></thead>
          <tbody>
            ${t.topCustomers.map(([s,e],o)=>`
              <tr>
                <td class="text-secondary">${o+1}</td>
                <td class="font-medium">${s}</td>
                <td style="text-align:right;font-weight:600">$${e.toLocaleString()}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden">
                      <div style="height:100%;width:${t.totalRevenue>0?e/t.totalRevenue*100:0}%;background:var(--color-primary);border-radius:3px"></div>
                    </div>
                    <span class="text-secondary" style="font-size:var(--font-size-xs)">${t.totalRevenue>0?(e/t.totalRevenue*100).toFixed(0):0}%</span>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function ks(t){const s=t.stock.reduce((e,o)=>e+o.quantity*o.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${se("Total Items",t.stock.length,"inventory_2","blue")}
      ${se("Stock Value (Cost)",`$${t.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${se("Stock Value (Sell)",`$${s.toFixed(0)}`,"paid","green")}
    </div>
    ${t.lowStockItems.length>0?`
      <div class="card" style="margin-bottom:var(--space-lg);border-color:var(--color-danger)">
        <div class="card-header" style="background:var(--color-danger-bg)">
          <h4 style="color:var(--color-danger)"><span class="material-icons-outlined" style="font-size:18px;vertical-align:middle">warning</span> Low Stock Alert (${t.lowStockItems.length} items)</h4>
        </div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>Item</th><th>SKU</th><th style="text-align:center">Qty</th><th style="text-align:center">Reorder Level</th><th>Supplier</th></tr></thead>
            <tbody>
              ${t.lowStockItems.map(e=>`
                <tr>
                  <td class="font-medium">${e.name}</td>
                  <td class="text-secondary" style="font-family:monospace">${e.sku}</td>
                  <td style="text-align:center;color:var(--color-danger);font-weight:600">${e.quantity}</td>
                  <td style="text-align:center">${e.reorderLevel}</td>
                  <td class="text-secondary">${e.supplier}</td>
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
        ${De(t.stock.reduce((e,o)=>(e[o.category]=(e[o.category]||0)+o.quantity,e),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}function Ls(t){let s="company";const e=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}');function o(){t.innerHTML=`
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${s==="company"?"active":""}" data-tab="company">Company</button>
        <button class="tab ${s==="users"?"active":""}" data-tab="users">Users & Permissions</button>
        <button class="tab ${s==="tax"?"active":""}" data-tab="tax">Tax &amp; Rates</button>
        <button class="tab ${s==="system"?"active":""}" data-tab="system">System</button>
      </div>
      <div id="settings-content" style="padding-top:var(--space-lg)"></div>
    `,i(),t.querySelectorAll(".tab").forEach(r=>{r.addEventListener("click",()=>{s=r.dataset.tab,t.querySelectorAll(".tab").forEach(l=>l.classList.remove("active")),r.classList.add("active"),i()})})}function i(){var l,y,u,c,b;const r=t.querySelector("#settings-content");if(s==="company")r.innerHTML=`
        <div class="card" style="max-width:600px">
          <div class="card-header"><h4>Company Information</h4></div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <input class="form-input" value="SimPro Demo Company" id="company-name" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">ABN</label>
                <input class="form-input" value="12 345 678 901" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input class="form-input" value="1300 123 456" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" value="admin@simprogroup.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea class="form-textarea" rows="2">123 Business St, Melbourne VIC 3000</textarea>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" onclick="document.dispatchEvent(new CustomEvent('save-settings'))">
              <span class="material-icons-outlined">save</span> Save Changes
            </button>
          </div>
        </div>
      `;else if(s==="users"){const p=m.getAll("technicians");let x=m.getAll("userTypes");if(!x||x.length===0){const g=["Dashboard","Customers","Leads","Quotes","Jobs","Timesheets","Fleet","Schedule","Contractors","Stock","Purchase Orders","Invoices","Documents","Reports","Settings"],v=w=>g.map(A=>({module:A,view:w,create:w,edit:w,delete:w}));x=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:v(!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:v(!0).map(w=>w.module==="Settings"?{...w,edit:!1,delete:!1,create:!1}:w)},{id:"ut_tech",name:"Technician",description:"Field staff with limited access",permissions:v(!1).map(w=>["Dashboard","Jobs","Timesheets","Schedule"].includes(w.module)?{...w,view:!0,create:w.module!=="Dashboard",edit:w.module!=="Dashboard"}:w)}],m.save("userTypes",x)}r.innerHTML=`
        <!-- USERS TABLE -->
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Users</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-user"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Role / Job</th><th>User Type</th><th>Actions</th></tr></thead>
              <tbody>
                ${p.map(g=>{const v=x.find(A=>A.id===g.userTypeId),w=v&&v.name.toLowerCase().includes("admin");return`
                  <tr>
                    <td><div style="width:8px;height:8px;border-radius:50%;background:${g.color}"></div></td>
                    <td class="font-medium">${g.name} ${w?'<span class="material-icons-outlined" style="font-size:14px;vertical-align:middle;color:var(--color-warning)" title="Admin user">shield</span>':""}</td>
                    <td class="text-secondary">${g.role}</td>
                    <td><span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); padding:4px 8px; border-radius:12px; font-size:var(--font-size-xs)">${v?v.name:"Unassigned"}</span></td>
                    <td>
                      <button class="btn btn-sm btn-secondary btn-edit-user" data-id="${g.id}">Edit</button>
                    </td>
                  </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- USER TYPES & PERMISSIONS -->
        <div class="card">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0">User Types &amp; Permissions</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">Control which pages and actions each user type can access. If no permissions are ticked for a page, it will be hidden from users of that type.</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>User Type</th><th>Description</th><th>Users</th><th>Actions</th></tr></thead>
              <tbody>
                ${x.map(g=>{const v=p.filter(A=>A.userTypeId===g.id).length,w=g.name.toLowerCase().includes("admin");return`
                  <tr>
                    <td class="font-medium" style="display:flex;align-items:center;gap:8px">
                      ${w?'<span class="material-icons-outlined" style="font-size:16px;color:var(--color-warning)">shield</span>':'<span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">person</span>'}
                      ${g.name}
                    </td>
                    <td class="text-secondary">${g.description}</td>
                    <td><span class="badge badge-neutral">${v} user${v!==1?"s":""}</span></td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-secondary btn-edit-perms" data-id="${g.id}">Edit Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${g.id}">Rename</button>
                        ${w?`<button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${g.id}" title="Cannot delete Admin type" disabled style="opacity:0.4;cursor:not-allowed"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">shield</span></button>`:`<button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${g.id}" title="Delete"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,(l=r.querySelector("#btn-add-user"))==null||l.addEventListener("click",()=>{d()}),r.querySelectorAll(".btn-edit-user").forEach(g=>{g.addEventListener("click",v=>{d(v.target.dataset.id)})}),(y=r.querySelector("#btn-add-usertype"))==null||y.addEventListener("click",()=>{n()}),r.querySelectorAll(".btn-edit-perms").forEach(g=>{g.addEventListener("click",v=>{a(v.target.dataset.id)})}),r.querySelectorAll(".btn-edit-usertype").forEach(g=>{g.addEventListener("click",v=>{n(v.target.dataset.id)})}),r.querySelectorAll(".btn-delete-usertype").forEach(g=>{g.addEventListener("click",v=>{const w=v.target.dataset.id,A=m.getById("userTypes",w);if(!A)return;if(A.name.toLowerCase().includes("admin")){C("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const P=m.getAll("technicians").filter(F=>F.userTypeId===w),O=document.createElement("div");O.innerHTML=`<p>Are you sure you want to delete the user type <strong>${A.name}</strong>?${P.length>0?` <strong>${P.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,ie({title:"Confirm Deletion",content:O,actions:[{label:"Cancel",className:"btn-secondary",onClick:F=>F()},{label:"Delete",className:"btn-danger",onClick:F=>{m.delete("userTypes",w),C("User Type deleted","success"),F(),i()}}]})})})}else if(s==="tax"){const p=m.getSettings();r.innerHTML=`
        <div class="card" style="max-width:540px">
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
                <input class="form-input" id="global-markup" type="number" value="${p.markupPercent}" style="width:100px" /> <span class="text-secondary">%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="max-width:540px;margin-top:var(--space-lg)">
          <div class="card-header"><h4>Labor Rate Profiles</h4></div>
          <div class="card-body">
            <div id="labor-rates-container" style="display:flex;flex-direction:column;gap:12px;">
              ${p.laborRates.map(x=>`
                <div class="form-row labor-rate-row" data-id="${x.id}" style="align-items:flex-end;margin-bottom:0">
                  <div class="form-group" style="margin-bottom:0;flex:1">
                    <label class="form-label">Profile Name</label>
                    <input class="form-input rate-name" value="${x.name}" />
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label class="form-label">Rate ($/hr)</label>
                    <input class="form-input rate-val" type="number" value="${x.rate.toFixed(2)}" step="0.01" style="width:140px" />
                  </div>
                  <button class="btn btn-danger btn-icon remove-rate-btn">
                    <span class="material-icons-outlined">delete</span>
                  </button>
                </div>
              `).join("")}
            </div>
            <button class="btn btn-secondary mt-3" id="add-rate-btn" style="width:100%;margin-top:16px;">
              <span class="material-icons-outlined">add</span> Add Rate Profile
            </button>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="save-tax-settings">
              <span class="material-icons-outlined">save</span> Save Settings
            </button>
          </div>
        </div>
      `,r.querySelector("#add-rate-btn").addEventListener("click",()=>{const x="rate_"+Math.random().toString(36).substring(2,9),g=r.querySelector("#labor-rates-container"),v=document.createElement("div");v.className="form-row labor-rate-row",v.dataset.id=x,v.style.alignItems="flex-end",v.style.marginBottom="12px",v.innerHTML=`
          <div class="form-group" style="margin-bottom:0;flex:1">
            <label class="form-label">Profile Name</label>
            <input class="form-input rate-name" value="New Profile" />
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Rate ($/hr)</label>
            <input class="form-input rate-val" type="number" value="0.00" step="0.01" style="width:140px" />
          </div>
          <button class="btn btn-danger btn-icon remove-rate-btn">
            <span class="material-icons-outlined">delete</span>
          </button>
        `,g.appendChild(v)}),r.addEventListener("click",x=>{x.target.closest(".remove-rate-btn")&&x.target.closest(".labor-rate-row").remove()}),r.querySelector("#save-tax-settings").addEventListener("click",()=>{const x=parseFloat(r.querySelector("#global-markup").value)||0,g=Array.from(r.querySelectorAll(".labor-rate-row")).map(v=>({id:v.dataset.id,name:v.querySelector(".rate-name").value,rate:parseFloat(v.querySelector(".rate-val").value)||0}));p.markupPercent=x,p.laborRates=g,m.saveSettings(p),document.dispatchEvent(new CustomEvent("save-settings"))})}else if(s==="system")r.innerHTML=`
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
      `,(u=r.querySelector("#btn-reset-data"))==null||u.addEventListener("click",()=>{m.clearAll(),C("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(c=r.querySelector("#btn-clear-data"))==null||c.addEventListener("click",()=>{m.clearAll(),C("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)});else if(s==="permissions"&&e.role==="admin"){let p=m.getAll("userTypes");if(!p||p.length===0){const x=["Dashboard","Customers","Leads","Quotes","Jobs","Timesheets","Fleet","Schedule","Contractors","Stock","Purchase Orders","Invoices","Documents","Reports","Settings"],g=v=>x.map(w=>({module:w,view:v,create:v,edit:v,delete:v}));p=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:g(!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:g(!0).map(v=>v.module==="Settings"?{...v,edit:!1,delete:!1,create:!1}:v)},{id:"ut_tech",name:"Technician",description:"Field staff with limited access",permissions:g(!1).map(v=>["Dashboard","Jobs","Timesheets","Schedule"].includes(v.module)?{...v,view:!0,create:v.module!=="Dashboard",edit:v.module!=="Dashboard"}:v)}],m.save("userTypes",p)}r.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">User Types & Permissions</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>User Type</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${p.map(x=>`
                  <tr>
                    <td class="font-medium">${x.name}</td>
                    <td class="text-secondary">${x.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-secondary btn-edit-perms" data-id="${x.id}">Edit Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-view-usertype" data-id="${x.id}">View Info</button>
                        <button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${x.id}" title="Delete"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">delete</span></button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,(b=r.querySelector("#btn-add-usertype"))==null||b.addEventListener("click",()=>{n()}),r.querySelectorAll(".btn-edit-perms").forEach(x=>{x.addEventListener("click",g=>{a(g.target.dataset.id)})}),r.querySelectorAll(".btn-view-usertype").forEach(x=>{x.addEventListener("click",g=>{const v=m.getById("userTypes",g.target.dataset.id),w=document.createElement("div");w.innerHTML=`<p><strong>Name:</strong> ${v.name}</p><p><strong>Description:</strong> ${v.description}</p>`,ie({title:"User Type Info",content:w,actions:[{label:"Close",className:"btn-secondary",onClick:A=>A()},{label:"Edit",className:"btn-primary",onClick:A=>{A(),n(v.id)}}]})})}),r.querySelectorAll(".btn-delete-usertype").forEach(x=>{x.addEventListener("click",g=>{const v=g.target.dataset.id,w=m.getById("userTypes",v);if(!w)return;const A=document.createElement("div");A.innerHTML=`<p>Are you sure you want to delete the user type <strong>${w.name}</strong>? This action cannot be undone.</p>`,ie({title:"Confirm Deletion",content:A,actions:[{label:"Cancel",className:"btn-secondary",onClick:P=>P()},{label:"Delete",className:"btn-danger",onClick:P=>{m.delete("userTypes",v),C("User Type deleted","success"),P(),i()}}]})})})}}function n(r=null){let l=r?m.getById("userTypes",r):{name:"",description:""};const y=document.createElement("div");y.innerHTML=`
        ${r?"":`
        <div class="form-group">
          <label class="form-label">Template (Auto-fills permissions)</label>
          <select class="form-select" id="ut-template">
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Technician">Technician</option>
            <option value="Custom">Custom</option>
          </select>
          <button class="btn btn-secondary mt-2" id="ut-custom-edit-perms" style="display:none; width:100%; justify-content:center; align-items:center; gap:8px;">
            <span class="material-icons-outlined" style="font-size:16px;">edit</span> Configure Custom Permissions
          </button>
        </div>
        `}
        <div class="form-group">
          <label class="form-label">User Type Name</label>
          <input class="form-input" id="ut-name" value="${l.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${l.description}" />
        </div>
    `;const u=y.querySelector("#ut-template"),c=y.querySelector("#ut-custom-edit-perms");u&&c&&(u.addEventListener("change",b=>{b.target.value==="Custom"?c.style.display="flex":c.style.display="none"}),c.addEventListener("click",()=>{var w,A;const b=y.querySelector("#ut-name").value,p=y.querySelector("#ut-desc").value;if(!b){C("Please enter a User Type Name first","error");return}const g=["Dashboard","Customers","Leads","Quotes","Jobs","Timesheets","Fleet","Schedule","Contractors","Stock","Purchase Orders","Invoices","Documents","Reports","Settings"].map(P=>({module:P,view:!1,create:!1,edit:!1,delete:!1})),v=m.create("userTypes",{name:b,description:p,permissions:g});(w=document.getElementById("modal-close-btn"))==null||w.click(),a(v.id),(A=document.querySelector('.tab[data-tab="permissions"]'))==null||A.click()})),ie({title:r?"Edit User Type":"Add User Type",content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Save",className:"btn-primary",onClick:b=>{var v;const p=document.getElementById("ut-name").value,x=document.getElementById("ut-desc").value,g=(v=document.getElementById("ut-template"))==null?void 0:v.value;if(!p){C("Name required","error");return}if(r)m.update("userTypes",r,{name:p,description:x});else{const w=["Dashboard","Customers","Leads","Quotes","Jobs","Timesheets","Fleet","Schedule","Contractors","Stock","Purchase Orders","Invoices","Documents","Reports","Settings"];let A=[];g==="Admin"?A=w.map(P=>({module:P,view:!0,create:!0,edit:!0,delete:!0})):g==="Manager"?A=w.map(P=>({module:P,view:!0,create:!0,edit:!0,delete:!0})).map(P=>P.module==="Settings"?{...P,edit:!1,delete:!1,create:!1}:P):g==="Technician"?A=w.map(P=>({module:P,view:!1,create:!1,edit:!1,delete:!1})).map(P=>["Dashboard","Jobs","Timesheets","Schedule"].includes(P.module)?{...P,view:!0,create:P.module!=="Dashboard",edit:P.module!=="Dashboard"}:P):A=w.map(P=>({module:P,view:!1,create:!1,edit:!1,delete:!1})),m.create("userTypes",{name:p,description:x,permissions:A})}C("User Type saved","success"),i(),b()}}]})}function a(r){const l=m.getById("userTypes",r);if(!l)return;const y=document.createElement("div");y.innerHTML=`
      <div style="max-height: 60vh; overflow-y: auto;">
        <table class="data-table" style="width:100%">
          <thead style="position:sticky; top:0; background:white; z-index:10;">
            <tr>
              <th>Module</th>
              <th style="text-align:center">View</th>
              <th style="text-align:center">Create</th>
              <th style="text-align:center">Edit</th>
              <th style="text-align:center">Delete</th>
            </tr>
          </thead>
          <tbody>
            ${l.permissions.map((u,c)=>`
              <tr>
                <td class="font-medium">${u.module}</td>
                <td style="text-align:center"><input type="checkbox" class="perm-chk" data-idx="${c}" data-key="view" ${u.view?"checked":""} /></td>
                <td style="text-align:center"><input type="checkbox" class="perm-chk" data-idx="${c}" data-key="create" ${u.create?"checked":""} /></td>
                <td style="text-align:center"><input type="checkbox" class="perm-chk" data-idx="${c}" data-key="edit" ${u.edit?"checked":""} /></td>
                <td style="text-align:center"><input type="checkbox" class="perm-chk" data-idx="${c}" data-key="delete" ${u.delete?"checked":""} /></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `,ie({title:`Edit Permissions: ${l.name}`,content:y,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save Permissions",className:"btn-primary",onClick:u=>{const c=document.querySelectorAll(".perm-chk"),b=JSON.parse(JSON.stringify(l.permissions));c.forEach(p=>{const x=parseInt(p.dataset.idx),g=p.dataset.key;b[x][g]=p.checked}),m.update("userTypes",r,{permissions:b}),C("Permissions updated successfully","success"),u()}}]})}function d(r=null){let l=r?m.getById("technicians",r):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const y=m.getAll("userTypes"),u=document.createElement("div");u.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${l.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${l.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${l.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${y.map(p=>`
              <option value="${p.id}" ${l.userTypeId===p.id?"selected":""}>${p.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(p=>`
            <div class="color-swatch" data-color="${p}" style="width:28px; height:28px; border-radius:50%; background:${p}; cursor:pointer; border:2px solid ${l.color.toUpperCase()===p.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${l.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const c=u.querySelector("#u-color"),b=u.querySelectorAll(".color-swatch");b.forEach(p=>{p.addEventListener("click",()=>{c.value=p.dataset.color,b.forEach(x=>x.style.borderColor="transparent"),p.style.borderColor="var(--text-primary)"})}),c.addEventListener("input",()=>{b.forEach(p=>p.style.borderColor="transparent")}),ie({title:r?"Edit User":"Add User",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:p=>p()},{label:"Save",className:"btn-primary",onClick:p=>{var P;const x=document.getElementById("u-name").value,g=document.getElementById("u-email").value,v=document.getElementById("u-role").value,w=document.getElementById("u-type").value,A=document.getElementById("u-color").value;if(!x){C("Name required","error");return}r?m.update("technicians",r,{name:x,email:g,role:v,userTypeId:w,color:A}):m.create("technicians",{name:x,email:g,role:v,userTypeId:w,color:A}),C("User saved","success"),(P=document.querySelector('.tab[data-tab="users"]'))==null||P.click(),p()}}]})}document.addEventListener("save-settings",()=>C("Settings saved","success")),o()}function Es(t){var r;const s=document.querySelector(".sidebar"),e=document.querySelector(".topbar"),o=document.getElementById("breadcrumb");s&&(s.style.display="none"),e&&(e.style.display="none"),o&&(o.style.display="none");const i=m.getAll("technicians"),n=m.getAll("userTypes");t.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">Simpro Clone</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${i.map(l=>{const y=n.find(u=>u.id===l.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${l.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${l.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${y?y.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${i.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const a=l=>{const y=i.find(p=>p.id===l),u=n.find(p=>p.id===(y==null?void 0:y.userTypeId));let c="technician";u&&u.name.toLowerCase().includes("admin")?c="admin":u&&u.name.toLowerCase().includes("manager")&&(c="manager");const b={id:y.id,name:y.name,role:c,userTypeId:y.userTypeId,color:y.color};sessionStorage.setItem("currentUser",JSON.stringify(b)),s&&(s.style.display=""),e&&(e.style.display=""),o&&(o.style.display=""),me(async()=>{const{updateSidebarAccess:p}=await Promise.resolve().then(()=>Qe);return{updateSidebarAccess:p}},void 0).then(({updateSidebarAccess:p})=>{p&&p()}),me(async()=>{const{updateTopbarAccess:p}=await Promise.resolve().then(()=>We);return{updateTopbarAccess:p}},void 0).then(({updateTopbarAccess:p})=>{p&&p()}),h.navigate("/")};t.querySelectorAll(".btn-login-user").forEach(l=>{l.addEventListener("click",y=>{const u=y.target.closest(".btn-login-user");a(u.dataset.id)})});const d=()=>{const l={id:"customer-user",name:"Customer User",role:"customer"},y=m.get("people").filter(u=>u.type==="Customer");y.length>0&&(l.customerId=y[0].id,l.name=y[0].firstName+" "+y[0].lastName),sessionStorage.setItem("currentUser",JSON.stringify(l)),s&&(s.style.display=""),e&&(e.style.display=""),o&&(o.style.display=""),me(async()=>{const{updateSidebarAccess:u}=await Promise.resolve().then(()=>Qe);return{updateSidebarAccess:u}},void 0).then(({updateSidebarAccess:u})=>{u&&u()}),me(async()=>{const{updateTopbarAccess:u}=await Promise.resolve().then(()=>We);return{updateTopbarAccess:u}},void 0).then(({updateTopbarAccess:u})=>{u&&u()}),h.navigate("/portal")};(r=t.querySelector("#btn-login-customer"))==null||r.addEventListener("click",d)}function Be(t){const s=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),e=s.customerId;if(s.role!=="customer"||!e){t.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const o=m.getAll("jobs").filter(l=>l.customerId===e),i=m.getAll("quotes").filter(l=>l.customerId===e),n=m.getAll("invoices").filter(l=>l.customerId===e);t.innerHTML=`
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
        ${i.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${i.map(l=>`
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
        ${o.length===0?'<p style="color:var(--text-tertiary);">No jobs found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${o.map(l=>`
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
        ${n.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${n.map(l=>`
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
  `;const a=t.querySelector("#portal-logout-btn");a&&a.addEventListener("click",()=>{sessionStorage.removeItem("currentUser"),me(async()=>{const{router:l}=await Promise.resolve().then(()=>Et);return{router:l}},void 0).then(({router:l})=>{l.navigate("/login")})}),t.querySelectorAll(".btn-approve-quote").forEach(l=>{l.addEventListener("click",y=>{const u=y.target.dataset.id;m.update("quotes",u,{status:"Approved"}),alert("Quote approved successfully!"),Be(t)})}),t.querySelectorAll(".btn-pay-invoice").forEach(l=>{l.addEventListener("click",y=>{const u=y.target.dataset.id;m.update("invoices",u,{status:"Paid"}),alert("Invoice paid successfully!"),Be(t)})})}function Cs(t){const s=m.getAll("contractors");t.innerHTML=`
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
  `;let e=[...s];const i=be({columns:[{key:"businessName",label:"Business Name",render:n=>`<span class="cell-link font-medium">${f(n.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:n=>f(n.email||"—")},{key:"phone",label:"Phone",render:n=>f(n.phone||"—")},{key:"active",label:"Status",render:n=>`<span class="badge ${n.active?"badge-success":"badge-neutral"}">${n.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:n=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${n.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:e,onRowClick:n=>h.navigate(`/contractors/${n}`),emptyMessage:"No contractors found",emptyIcon:"engineering"});t.querySelector("#contractors-table-container").appendChild(i),t.querySelector("#btn-new-contractor").addEventListener("click",()=>h.navigate("/contractors/new")),t.querySelector("#contractors-search").addEventListener("input",n=>{const a=n.target.value.toLowerCase();e=s.filter(d=>d.businessName.toLowerCase().includes(a)||d.contactName.toLowerCase().includes(a)||(d.email||"").toLowerCase().includes(a)),i.updateData(e)}),t.addEventListener("click",n=>{const a=n.target.closest(".contractor-edit-btn");a&&(n.stopPropagation(),h.navigate(`/contractors/${a.dataset.id}/edit`))})}function yt(t,s){const e=s.id==="new";let o=e?{active:!0}:m.getById("contractors",s.id);if(!o&&!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}t.innerHTML=`
    <div class="page-header">
      <h1>${e?"New Contractor":"Edit Contractor"}</h1>
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
            <input type="text" id="businessName" class="form-input" value="${o.businessName||""}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contact Name</label>
            <input type="text" id="contactName" class="form-input" value="${o.contactName||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="email" class="form-input" value="${o.email||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="text" id="phone" class="form-input" value="${o.phone||""}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">License Number</label>
              <input type="text" id="licenseNumber" class="form-input" value="${o.licenseNumber||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Insurance Expiry</label>
              <input type="date" id="insuranceExpiry" class="form-input" value="${o.insuranceExpiry||""}" />
            </div>
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="active" ${o.active?"checked":""} />
            <label for="active" style="margin: 0;" class="form-label">Active</label>
          </div>
        </form>
      </div>
    </div>
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>{h.navigate(e?"/contractors":`/contractors/${s.id}`)}),t.querySelector("#btn-save").addEventListener("click",()=>{const i={businessName:t.querySelector("#businessName").value,contactName:t.querySelector("#contactName").value,email:t.querySelector("#email").value,phone:t.querySelector("#phone").value,licenseNumber:t.querySelector("#licenseNumber").value,insuranceExpiry:t.querySelector("#insuranceExpiry").value,active:t.querySelector("#active").checked};if(!i.businessName||!i.contactName){alert("Business Name and Contact Name are required.");return}e?m.create("contractors",i):m.update("contractors",s.id,i),h.navigate("/contractors")})}function Is(t,s){const e=m.getById("contractors",s.id);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}t.innerHTML=`
    <div class="page-header">
      <div class="page-header-info">
        <h1 style="margin: 0;">${f(e.businessName)}</h1>
        <p class="text-secondary" style="margin: 5px 0 0 0;">Contact: ${f(e.contactName)}</p>
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
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Email</strong> ${f(e.email||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Phone</strong> ${f(e.phone||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">License</strong> ${f(e.licenseNumber||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Insurance Expiry</strong> ${f(e.insuranceExpiry||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Status</strong> <span class="badge ${e.active?"badge-success":"badge-neutral"}">${e.active?"Active":"Inactive"}</span></div>
        </div>
      </div>
    </div>
  `,t.querySelector("#btn-edit").addEventListener("click",()=>{h.navigate(`/contractors/${s.id}/edit`)})}function qs(t){const s=m.getAll("fleet");t.innerHTML=`
    <div class="page-header">
      <h1>Fleet / Vehicles</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-vehicle"><span class="material-icons-outlined">add</span> Add Vehicle</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search fleet..." id="fleet-search" />
      </div>
    </div>

    <div id="fleet-table-container"></div>
  `;let e=[...s];const i=be({columns:[{key:"name",label:"Name / ID",render:n=>`<span class="cell-link font-medium">${f(n.name)}</span>`},{key:"licensePlate",label:"License Plate",render:n=>f(n.licensePlate||"—")},{key:"type",label:"Type",render:n=>f(n.type||"—")},{key:"status",label:"Status",render:n=>`<span class="badge ${n.status==="Active"?"badge-success":n.status==="Maintenance"?"badge-warning":"badge-neutral"}">${f(n.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:n=>{if(!n.assignedToId)return"—";const a=m.getById("people",n.assignedToId);return a?f(`${a.firstName} ${a.lastName}`):"—"}},{key:"actions",label:"",width:"80px",render:n=>`<button class="btn btn-ghost btn-sm fleet-edit-btn" data-id="${n.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:e,onRowClick:n=>h.navigate(`/fleet/${n}`),emptyMessage:"No vehicles found",emptyIcon:"directions_car"});t.querySelector("#fleet-table-container").appendChild(i),t.querySelector("#btn-new-vehicle").addEventListener("click",()=>h.navigate("/fleet/new")),t.querySelector("#fleet-search").addEventListener("input",n=>{const a=n.target.value.toLowerCase();e=s.filter(d=>d.name.toLowerCase().includes(a)||(d.licensePlate||"").toLowerCase().includes(a)||(d.type||"").toLowerCase().includes(a)),i.updateData(e)}),t.addEventListener("click",n=>{const a=n.target.closest(".fleet-edit-btn");a&&(n.stopPropagation(),h.navigate(`/fleet/${a.dataset.id}/edit`))})}function ft(t,s){const e=s.id==="new";let o=e?{status:"Active"}:m.getById("fleet",s.id);if(!o&&!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Vehicle not found</h3></div>';return}const i=m.getAll("people").filter(n=>n.type==="Staff");t.innerHTML=`
    <div class="page-header">
      <h1>${e?"New Vehicle":"Edit Vehicle"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save</button>
      </div>
    </div>

    <div class="card" style="max-width: 600px;">
      <div class="card-body">
        <form id="vehicle-form" style="display: flex; flex-direction: column; gap: 15px;">
          <div class="form-group">
            <label class="form-label">Vehicle Name/ID *</label>
            <input type="text" id="name" class="form-input" value="${o.name||""}" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">License Plate</label>
              <input type="text" id="licensePlate" class="form-input" value="${o.licensePlate||""}" />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="type" class="form-select">
                ${["Van","Truck","Car","Other"].map(n=>`<option value="${n}" ${o.type===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="status" class="form-select">
                ${["Active","Maintenance","Inactive"].map(n=>`<option value="${n}" ${o.status===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assign To (Staff)</label>
              <select id="assignedToId" class="form-select">
                <option value="">Unassigned</option>
                ${i.map(n=>`<option value="${n.id}" ${o.assignedToId===n.id?"selected":""}>${n.firstName} ${n.lastName}</option>`).join("")}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>{h.navigate(e?"/fleet":`/fleet/${s.id}`)}),t.querySelector("#btn-save").addEventListener("click",()=>{const n={name:t.querySelector("#name").value,licensePlate:t.querySelector("#licensePlate").value,type:t.querySelector("#type").value,status:t.querySelector("#status").value,assignedToId:t.querySelector("#assignedToId").value};if(!n.name){alert("Vehicle Name is required.");return}e?(n.logs=[],m.create("fleet",n)):m.update("fleet",s.id,n),h.navigate("/fleet")})}function gt(t,s){const e=m.getById("fleet",s.id);if(!e){t.innerHTML='<div class="card"><p>Vehicle not found.</p></div>';return}let o="Unassigned";if(e.assignedToId){const n=m.getById("people",e.assignedToId);n&&(o=`${n.firstName} ${n.lastName}`)}const i=e.logs||[];t.innerHTML=`
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h1 style="margin: 0;">${f(e.name)}</h1>
        <p style="margin: 5px 0 0 0; color: var(--text-secondary);">${f(e.licensePlate||"No License Plate")}</p>
      </div>
      <button class="btn btn-outline" id="btn-edit">Edit</button>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
      <div class="card">
        <h3 style="margin-top: 0;">Details</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div><strong>Type:</strong> ${f(e.type||"-")}</div>
          <div><strong>Status:</strong> <span class="badge ${e.status==="Active"?"badge-success":e.status==="Maintenance"?"badge-warning":"badge-neutral"}">${f(e.status||"Active")}</span></div>
          <div><strong>Assigned To:</strong> ${f(o)}</div>
        </div>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">Service & Mileage Logs</h3>
          <button class="btn btn-sm btn-primary" id="btn-add-log">Add Log</button>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Mileage</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${i.length===0?'<tr><td colspan="4" class="text-center">No logs recorded.</td></tr>':i.map(n=>`
                <tr>
                  <td>${f(n.date)}</td>
                  <td>${f(n.mileage)}</td>
                  <td>${f(n.type)}</td>
                  <td>${f(n.notes||"-")}</td>
                </tr>
              `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `,t.querySelector("#btn-edit").addEventListener("click",()=>{h.navigate(`/fleet/${s.id}/edit`)}),t.querySelector("#btn-add-log").addEventListener("click",()=>{const n=prompt("Enter date (YYYY-MM-DD):",new Date().toISOString().split("T")[0]);if(!n)return;const a=prompt("Enter current mileage:");if(!a)return;const d=prompt("Enter log type (e.g. Regular Service, Refuel, Repair):","Regular Service");if(!d)return;const r=prompt("Enter notes (optional):",""),l={date:n,mileage:a,type:d,notes:r},y=[...e.logs||[],l];m.update("fleet",e.id,{logs:y}),gt(t,s)})}function Ds(t){let s="All Documents";function e(){const o=[];m.getAll("documents").forEach(u=>{o.push({id:u.id,name:u.name,url:u.url,type:u.type,size:u.size,uploadedAt:u.uploadedAt,folder:u.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),m.getAll("jobs").forEach(u=>{u.attachments&&Array.isArray(u.attachments)&&u.attachments.forEach(c=>{o.push({id:c.id||Math.random().toString(36).substr(2,9),name:c.name,url:c.url||c.data||"#",type:c.type,size:c.size,uploadedAt:c.uploadedAt||c.date||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:u.id,entityName:`${u.number} - ${u.title}`})}),u.forms&&Array.isArray(u.forms)&&u.forms.forEach((c,b)=>{o.push({id:`form_${u.id}_${b}`,name:`${c.type} - ${new Date(c.date).toLocaleDateString()}`,url:`#/jobs/${u.id}`,type:"Digital Form",size:null,uploadedAt:c.date,folder:"Digital Forms",entityType:"Job",entityId:u.id,entityName:`${u.number} - ${u.title}`})})}),m.getAll("customers").forEach(u=>{u.attachments&&Array.isArray(u.attachments)&&u.attachments.forEach(c=>{o.push({id:c.id||Math.random().toString(36).substr(2,9),name:c.name,url:c.url||c.data||"#",type:c.type,size:c.size,uploadedAt:c.uploadedAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:u.id,entityName:u.company})})}),o.sort((u,c)=>new Date(c.uploadedAt)-new Date(u.uploadedAt));let i=o;s!=="All Documents"&&(i=o.filter(u=>u.folder===s));const n=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes"];t.innerHTML=`
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1>Document Center</h1>
        <button class="btn btn-primary" id="btn-upload-doc"><span class="material-icons-outlined">upload_file</span> Upload Document</button>
      </div>

      <div style="display:flex; gap:24px; align-items:flex-start; margin-top:24px;">
        <!-- Sidebar Folders -->
        <div class="card" style="width:250px; flex-shrink:0;">
          <div class="card-body" style="padding:12px">
            <h4 style="margin:0 0 12px 8px; font-size:12px; text-transform:uppercase; color:var(--text-tertiary)">Categories</h4>
            <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:4px;" id="folder-list">
              ${n.map(u=>{let c="folder";u==="All Documents"?c="dashboard":u==="Company Docs"?c="domain":u==="Health & Safety"?c="health_and_safety":u==="Templates"?c="file_copy":u==="Job Attachments"?c="build":u==="Customer Attachments"?c="people":u==="Digital Forms"?c="assignment":u==="Invoices"?c="receipt_long":u==="Quotes"&&(c="request_quote");const b=s===u,p=u==="All Documents"?o.length:o.filter(x=>x.folder===u).length;return`
                <li>
                  <button class="btn btn-ghost ${b?"active":""}" data-folder="${u}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${b?"var(--color-primary-bg)":"transparent"}; color:${b?"var(--primary-color)":"var(--text-primary)"}; font-weight:${b?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${c}</span> ${u}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${p}</span>
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
    `,t.querySelectorAll("#folder-list button").forEach(u=>{u.addEventListener("click",()=>{s=u.dataset.folder,e()})});let a=[...i];const r=be({columns:[{key:"name",label:"File Name",render:u=>{let c="insert_drive_file";return u.type==="Invoice PDF"||u.type==="Quote PDF"?c="picture_as_pdf":u.type==="Digital Form"?c="assignment":u.type&&u.type.includes("image")&&(c="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${c}</span> <span class="font-medium truncate" style="max-width:300px" title="${f(u.name)}">${f(u.name)}</span></div>`}},{key:"folder",label:"Category",render:u=>f(u.folder||"—")},{key:"size",label:"Size",render:u=>u.size?(u.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:u=>{if(u.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';const c=u.entityType==="Job"?`#/jobs/${u.entityId}`:u.entityType==="Customer"?`#/people/${u.entityId}`:u.entityType==="Invoice"?`#/invoices/${u.entityId}`:`#/quotes/${u.entityId}`;return`<span class="badge badge-neutral">${u.entityType}</span> <a href="${c}">${f(u.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:u=>u.uploadedAt?new Date(u.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:u=>`<a href="${f(u.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`}],data:a,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open"});t.querySelector("#docs-table-container").appendChild(r);const l=t.querySelector("#docs-search");function y(){const u=l.value.toLowerCase();a=i.filter(c=>c.name.toLowerCase().includes(u)||c.entityName&&c.entityName.toLowerCase().includes(u)||c.folder&&c.folder.toLowerCase().includes(u)),r.updateData(a)}l.addEventListener("input",y),t.querySelector("#btn-upload-doc").addEventListener("click",()=>{const u=n.filter(b=>b!=="All Documents"),c=document.createElement("div");c.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${u.map(b=>`<option value="${b}">${b}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,ie({title:"Upload Global Document",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Upload",className:"btn-primary",onClick:b=>{const p=document.getElementById("upload-file-input"),x=document.getElementById("upload-folder").value;if(!p.files.length){C("Please select a file","error");return}const g=p.files[0],v=new FileReader;v.onload=w=>{m.create("documents",{name:g.name,type:g.type||"unknown",size:g.size,url:w.target.result,folder:x,uploadedAt:new Date().toISOString()}),C("Document uploaded successfully","success"),e(),b()},v.readAsDataURL(g)}}]})})}e()}Mt();window.__simproApp={router:h,store:m};const ht=document.getElementById("app"),As=tt(),Ae=document.createElement("div");Ae.className="main-wrapper";const Ts=nt(),Oe=document.createElement("div");Oe.className="breadcrumb";Oe.id="breadcrumb";const ke=document.createElement("main");ke.className="main-content";ke.id="main-content";Ae.appendChild(Ts);Ae.appendChild(Oe);Ae.appendChild(ke);ht.appendChild(As);ht.appendChild(Ae);function U(t){return s=>{ke.innerHTML="",ke.scrollTop=0,t(ke,s)}}h.register("/login",U(Es));h.register("/portal",U(Be));h.register("/",U(Qt));h.register("/people",U(as));h.register("/people/new",U((t,s)=>rt(t,{id:"new"})));h.register("/people/:id",U(os));h.register("/people/:id/edit",U((t,s)=>rt(t,s)));h.register("/contractors",U(Cs));h.register("/contractors/new",U((t,s)=>yt(t,{id:"new"})));h.register("/contractors/:id",U(Is));h.register("/contractors/:id/edit",U((t,s)=>yt(t,s)));h.register("/leads",U(is));h.register("/leads/new",U((t,s)=>lt(t,{id:"new"})));h.register("/leads/:id",U(rs));h.register("/leads/:id/edit",U((t,s)=>lt(t,s)));h.register("/quotes",U(ls));h.register("/quotes/new",U((t,s)=>ct(t,{id:"new"})));h.register("/quotes/:id",U(ct));h.register("/jobs",U(cs));h.register("/jobs/new",U((t,s)=>ut(t,{id:"new"})));h.register("/jobs/:id",U(us));h.register("/jobs/:id/edit",U((t,s)=>ut(t,s)));h.register("/timesheets",U(ps));h.register("/fleet",U(qs));h.register("/fleet/new",U((t,s)=>ft(t,{id:"new"})));h.register("/fleet/:id",U(gt));h.register("/fleet/:id/edit",U((t,s)=>ft(t,s)));h.register("/schedule",U(ms));h.register("/stock",U(pt));h.register("/stock/new",U((t,s)=>mt(t,{id:"new"})));h.register("/stock/:id",U(bs));h.register("/stock/:id/edit",U((t,s)=>mt(t,s)));h.register("/invoices",U(vs));h.register("/invoices/new",U((t,s)=>bt(t,{id:"new"})));h.register("/invoices/:id",U(bt));h.register("/purchase-orders",U(ys));h.register("/purchase-orders/new",U((t,s)=>vt(t,{id:"new",jobId:s.jobId})));h.register("/purchase-orders/:id",U(vt));h.register("/documents",U(Ds));h.register("/reports",U(fs));h.register("/settings",U(Ls));const Ns=["/","/people","/contractors","/leads","/quotes","/jobs","/timesheets","/fleet","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings"];h.onNavigate=(t,s)=>{const e=JSON.parse(sessionStorage.getItem("currentUser")||"null"),o=t==="/"?"/":"/"+t.split("/").filter(Boolean)[0];if(!e&&t!=="/login")return h.navigate("/login"),!1;if(e){if(e.role==="customer"&&Ns.includes(o))return h.navigate("/portal"),!1;if(e.role!=="customer"&&o==="/portal")return h.navigate("/"),!1;if(e.role!=="admin"&&e.role!=="customer"&&e.userTypeId&&t!=="/login"){const i=m.getById("userTypes",e.userTypeId);if(i&&i.permissions){const a={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/fleet":"Fleet","/schedule":"Schedule","/contractors":"Contractors","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"}[o];if(a){const d=i.permissions.find(r=>r.module===a);if((!d||!d.view&&!d.create&&!d.edit&&!d.delete)&&o!=="/")return h.navigate("/"),!1}}}}at(t),Ot(t)};const Ps=JSON.parse(sessionStorage.getItem("currentUser")||"null");!Ps&&window.location.hash!=="#/login"&&(window.location.hash="#/login");h.resolve();
