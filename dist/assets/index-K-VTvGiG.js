(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))o(l);new MutationObserver(l=>{for(const r of l)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function e(l){const r={};return l.integrity&&(r.integrity=l.integrity),l.referrerPolicy&&(r.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?r.credentials="include":l.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(l){if(l.ep)return;l.ep=!0;const r=e(l);fetch(l.href,r)}})();class Et{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(s,e){this.routes[s]=e}navigate(s){typeof window<"u"&&(window.location.hash=s)}resolve(s){let e=s||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const o=e.indexOf("?"),l={};if(o!==-1){const i=e.substring(o+1);e=e.substring(0,o),i.split("&").forEach(n=>{const[d,m]=n.split("=");d&&(l[d]=decodeURIComponent(m||""))})}const{handler:r,params:a}=this.matchRoute(e);if(r){this.currentRoute=e;const i={...a,...l};if(this.onNavigate&&this.onNavigate(e,i)===!1)return;r(i)}}matchRoute(s){if(this.routes[s])return{handler:this.routes[s],params:{}};for(const[e,o]of Object.entries(this.routes)){const l=e.split("/"),r=s.split("/");if(l.length!==r.length)continue;const a={};let i=!0;for(let n=0;n<l.length;n++)if(l[n].startsWith(":"))a[l[n].slice(1)]=r[n];else if(l[n]!==r[n]){i=!1;break}if(i)return{handler:o,params:a}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const C=new Et,Yt=Object.freeze(Object.defineProperty({__proto__:null,Router:Et,router:C},Symbol.toStringTag,{value:"Module"})),Xe="simpro_";class Gt{constructor(){this.listeners={}}_key(s){return Xe+s}getAll(s){try{const e=localStorage.getItem(this._key(s));return e?JSON.parse(e):[]}catch{return[]}}getById(s,e){return this.getAll(s).find(l=>l.id===e)||null}save(s,e){localStorage.setItem(this._key(s),JSON.stringify(e)),this.emit(s,e)}create(s,e){const o=this.getAll(s);return e.id=e.id||this.generateId(),e.createdAt=e.createdAt||new Date().toISOString(),e.updatedAt=new Date().toISOString(),o.push(e),this.save(s,o),e}update(s,e,o){const l=this.getAll(s),r=l.findIndex(a=>a.id===e);return r===-1?null:(l[r]={...l[r],...o,updatedAt:new Date().toISOString()},this.save(s,l),l[r])}delete(s,e){const l=this.getAll(s).filter(r=>r.id!==e);this.save(s,l)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const s={markupPercent:20,laborRates:[{id:"rate_1",name:"Standard Rate",rate:85},{id:"rate_2",name:"After Hours Rate",rate:127.5},{id:"rate_3",name:"Emergency Rate",rate:170}]};try{const e=localStorage.getItem(this._key("settings"));return e?JSON.parse(e):s}catch{return s}}saveSettings(s){localStorage.setItem(this._key("settings"),JSON.stringify(s)),this.emit("settings",s)}on(s,e){this.listeners[s]||(this.listeners[s]=[]),this.listeners[s].push(e)}off(s,e){this.listeners[s]&&(this.listeners[s]=this.listeners[s].filter(o=>o!==e))}emit(s,e){this.listeners[s]&&this.listeners[s].forEach(o=>o(e))}isSeeded(){return localStorage.getItem(Xe+"_seeded")==="true"}markSeeded(){localStorage.setItem(Xe+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(s=>s.startsWith(Xe)).forEach(s=>localStorage.removeItem(s))}}const p=new Gt,Kt=Object.freeze(Object.defineProperty({__proto__:null,store:p},Symbol.toStringTag,{value:"Module"}));let je=null;function Xt(){return(!je||!document.body.contains(je))&&(je=document.createElement("div"),je.className="toast-container",je.id="toast-container",document.body.appendChild(je)),je}function T(t,s="info",e=3500){const o=Xt(),l=document.createElement("div");l.className=`toast ${s}`;const r={success:"check_circle",error:"error",warning:"warning",info:"info"};l.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${s==="error"?"danger":s})">${r[s]||r.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${t}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,l.querySelector(".toast-close").addEventListener("click",()=>l.remove()),o.appendChild(l),setTimeout(()=>{l.parentNode&&(l.style.opacity="0",l.style.transform="translateX(20px)",l.style.transition="0.3s ease",setTimeout(()=>l.remove(),300))},e)}function Zt(t,s,e){p.create("notifications",{title:t,message:s,link:e,read:!1}),T(`${t}: ${s}`,"info")}const ye=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:Zt,showToast:T},Symbol.toStringTag,{value:"Module"}));function y(t){return t==null?"":String(t).replace(/[&<>"']/g,function(e){switch(e){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return e}})}function ve({title:t,content:s,size:e="",onClose:o,actions:l=[]}){const r=document.createElement("div");r.className="modal-overlay",r.id="modal-overlay";const a=document.createElement("div");a.className=`modal ${e}`;let i=`
    <div class="modal-header">
      <h3>${y(t)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof s=="string"?y(s):""}</div>
  `;l.length&&(i+='<div class="modal-footer">',l.forEach((m,c)=>{i+=`<button class="btn ${m.className||"btn-secondary"}" id="modal-action-${c}">${y(m.label)}</button>`}),i+="</div>"),a.innerHTML=i,typeof s!="string"&&(s instanceof HTMLElement||s instanceof DocumentFragment)&&(a.querySelector(".modal-body").innerHTML="",a.querySelector(".modal-body").appendChild(s)),r.appendChild(a),document.body.appendChild(r);const n=()=>{r.remove(),o&&o()};a.querySelector("#modal-close-btn").addEventListener("click",n),r.addEventListener("click",m=>{m.target===r&&n()}),l.forEach((m,c)=>{const u=a.querySelector(`#modal-action-${c}`);u&&m.onClick&&u.addEventListener("click",()=>m.onClick(n))});const d=m=>{m.key==="Escape"&&(n(),document.removeEventListener("keydown",d))};return document.addEventListener("keydown",d),{close:n,modal:a,overlay:r}}const xe=Object.freeze(Object.defineProperty({__proto__:null,showModal:ve},Symbol.toStringTag,{value:"Module"})),Ye={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Phases"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs & Financials"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create Timesheet Entries"},{key:"edit",label:"Edit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"delete",label:"Delete Timesheets"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Add Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View All Technicians' Schedules"},{key:"create",label:"Create Bookings"},{key:"edit",label:"Edit / Move Bookings"},{key:"delete",label:"Delete Bookings"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Add Contractors"},{key:"edit",label:"Edit Contractors"},{key:"delete",label:"Delete Contractors"}],Stock:[{key:"view",label:"View Stock"},{key:"create",label:"Add Stock Items"},{key:"edit",label:"Edit Stock Items"},{key:"delete",label:"Delete Stock Items"},{key:"transfer",label:"Transfer Stock Between Locations"},{key:"adjust",label:"Adjust Stock Quantities"}],"Purchase Orders":[{key:"view",label:"View Purchase Orders"},{key:"create",label:"Create Purchase Orders"},{key:"edit",label:"Edit Purchase Orders"},{key:"delete",label:"Delete Purchase Orders"},{key:"approve",label:"Approve Purchase Orders"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"edit",label:"Edit Invoices"},{key:"delete",label:"Delete Invoices"},{key:"record_payment",label:"Record Payments"},{key:"generate_pdf",label:"Generate & Save PDF"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Documents"},{key:"delete",label:"Delete Documents"}],Reports:[{key:"view",label:"View Reports"},{key:"export",label:"Export Reports"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Information"},{key:"manage_users",label:"Manage Users"},{key:"manage_permissions",label:"Manage User Types & Permissions"},{key:"manage_tax",label:"Manage Tax & Labor Rates"}]};function Pe(t){return Object.entries(Ye).map(([s,e])=>{const o={module:s};return e.forEach(({key:l})=>{o[l]=t(s,l)}),o})}function ea(t){let s="company";const e=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}');function o(){t.innerHTML=`
      <div class="page-header"><h1>Settings</h1></div>

      <div class="tabs" style="margin-bottom:0">
        <button class="tab ${s==="company"?"active":""}" data-tab="company">Company</button>
        <button class="tab ${s==="users"?"active":""}" data-tab="users">Users & Permissions</button>
        <button class="tab ${s==="tax"?"active":""}" data-tab="tax">Tax &amp; Rates</button>
        <button class="tab ${s==="system"?"active":""}" data-tab="system">System</button>
      </div>
      <div id="settings-content" style="padding-top:var(--space-lg)"></div>
    `,l(),t.querySelectorAll(".tab").forEach(n=>{n.addEventListener("click",()=>{s=n.dataset.tab,t.querySelectorAll(".tab").forEach(d=>d.classList.remove("active")),n.classList.add("active"),l()})})}function l(){var d,m,c,u,b;const n=t.querySelector("#settings-content");if(s==="company")n.innerHTML=`
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
              <label class="form-label">Company Domain</label>
              <input class="form-input" value="simprogroup.com.au" placeholder="e.g. yourcompany.com.au" />
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
      `;else if(s==="users"){const v=p.getAll("technicians");let f=p.getAll("userTypes");(!f||f.length===0)&&(f=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:Pe(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:Pe(($,j)=>$==="Settings"?["view","edit_company"].includes(j):!0)},{id:"ut_tech",name:"Technician",description:"Field staff with limited access",permissions:Pe(($,j)=>$==="Dashboard"?j==="view":$==="Jobs"?["view","manage_tasks","book_time"].includes(j):$==="Timesheets"?["view_own","create"].includes(j):$==="Schedule"?["view_own"].includes(j):!1)}],p.save("userTypes",f));const g=v.filter($=>!$.deactivated),x=v.filter($=>$.deactivated);n.innerHTML=`
        <!-- ACTIVE USERS TABLE -->
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0">Active Users</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">${g.length} active user${g.length!==1?"s":""} — contributing to subscription</p>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-add-user"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Role / Job</th><th>User Type</th><th>Actions</th></tr></thead>
              <tbody>
                ${g.length===0?'<tr><td colspan="5" class="text-secondary" style="text-align:center;padding:24px">No active users</td></tr>':g.map($=>{const j=f.find(I=>I.id===$.userTypeId),z=j&&j.name.toLowerCase().includes("admin");return`
                  <tr>
                    <td><div style="width:8px;height:8px;border-radius:50%;background:${$.color}"></div></td>
                    <td class="font-medium">${$.name} ${z?'<span class="material-icons-outlined" style="font-size:14px;vertical-align:middle;color:var(--color-warning)" title="Admin user">shield</span>':""}</td>
                    <td class="text-secondary">${$.role}</td>
                    <td><span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); padding:4px 8px; border-radius:12px; font-size:var(--font-size-xs)">${j?j.name:"Unassigned"}</span></td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm btn-secondary btn-edit-user" data-id="${$.id}">Edit</button>
                        <button class="btn btn-sm btn-danger btn-deactivate-user" data-id="${$.id}" ${z?'disabled style="opacity:0.4;cursor:not-allowed" title="Cannot deactivate an Admin"':'title="Deactivate user"'}>
                          <span class="material-icons-outlined" style="font-size:14px;pointer-events:none">person_off</span> Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- DEACTIVATED USERS -->
        ${x.length>0?`
        <div class="card" style="margin-bottom:var(--space-lg); border-color: var(--border-color); opacity:0.85">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-color)">
            <div>
              <h4 style="margin:0; color:var(--text-secondary)">Deactivated Users</h4>
              <p class="text-secondary" style="font-size:var(--font-size-sm);margin:4px 0 0">${x.length} deactivated — not contributing to subscription</p>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Role / Job</th><th>Deactivated On</th><th>Reactivate Available</th><th>Actions</th></tr></thead>
              <tbody>
                ${x.map($=>{const j=$.deactivatedAt?new Date($.deactivatedAt):null,z=j?new Date(j.getTime()+30*24*3600*1e3):null,I=new Date,_=z&&I>=z,Q=z?Math.ceil((z-I)/(24*3600*1e3)):null;return f.find(E=>E.id===$.userTypeId),`
                  <tr style="opacity:0.75">
                    <td><div style="width:8px;height:8px;border-radius:50%;background:#94a3b8"></div></td>
                    <td class="font-medium" style="color:var(--text-secondary)">${$.name}</td>
                    <td class="text-secondary">${$.role}</td>
                    <td class="text-secondary" style="font-size:var(--font-size-sm)">${j?j.toLocaleDateString():"—"}</td>
                    <td style="font-size:var(--font-size-sm)">
                      ${_?'<span style="color:var(--color-success)">Available now</span>':`<span style="color:var(--text-tertiary)">In ${Q} day${Q!==1?"s":""}</span>`}
                    </td>
                    <td>
                      <button class="btn btn-sm ${_?"btn-primary":"btn-ghost"} btn-reactivate-user"
                        data-id="${$.id}"
                        ${_?"":'disabled style="opacity:0.4;cursor:not-allowed"'}
                        title="${_?"Reactivate this user":`Cannot reactivate for ${Q} more day${Q!==1?"s":""}`}">
                        <span class="material-icons-outlined" style="font-size:14px;pointer-events:none">person_add</span> Reactivate
                      </button>
                    </td>
                  </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
        `:""}

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
              <thead><tr><th>User Type</th><th>Description</th><th>Active Users</th><th>Actions</th></tr></thead>
              <tbody>
                ${f.map($=>{const j=g.filter(I=>I.userTypeId===$.id).length,z=$.name.toLowerCase().includes("admin");return`
                  <tr>
                    <td class="font-medium" style="display:flex;align-items:center;gap:8px">
                      ${z?'<span class="material-icons-outlined" style="font-size:16px;color:var(--color-warning)">shield</span>':'<span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">person</span>'}
                      ${$.name}
                    </td>
                    <td class="text-secondary">${$.description}</td>
                    <td><span class="badge badge-neutral">${j} user${j!==1?"s":""}</span></td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-secondary btn-edit-perms" data-id="${$.id}">Edit Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${$.id}">Rename</button>
                        ${z?`<button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${$.id}" title="Cannot delete Admin type" disabled style="opacity:0.4;cursor:not-allowed"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">shield</span></button>`:`<button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${$.id}" title="Delete"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,(d=n.querySelector("#btn-add-user"))==null||d.addEventListener("click",()=>{i()}),n.querySelectorAll(".btn-edit-user").forEach($=>{$.addEventListener("click",j=>{i(j.target.dataset.id)})}),n.querySelectorAll(".btn-deactivate-user").forEach($=>{$.addEventListener("click",j=>{const z=j.currentTarget.dataset.id,I=p.getById("technicians",z);if(!I)return;const _=f.find(E=>E.id===I.userTypeId);if(_&&_.name.toLowerCase().includes("admin")){T("Cannot deactivate an Admin user.","error");return}const Q=document.createElement("div");Q.innerHTML=`
            <p>Are you sure you want to deactivate <strong>${I.name}</strong>?</p>
            <ul style="margin:12px 0 0 16px; color:var(--text-secondary); font-size:var(--font-size-sm); line-height:1.8">
              <li>They will lose all system access immediately</li>
              <li>Their data will be preserved</li>
              <li>They will no longer count toward your subscription</li>
              <li><strong>They cannot be reactivated for 30 days</strong></li>
            </ul>
          `,ve({title:"Deactivate User",content:Q,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Deactivate",className:"btn-danger",onClick:E=>{p.update("technicians",z,{deactivated:!0,deactivatedAt:new Date().toISOString(),userTypeId:null}),T(`${I.name} has been deactivated.`,"warning"),E(),l()}}]})})}),n.querySelectorAll(".btn-reactivate-user").forEach($=>{$.addEventListener("click",j=>{const z=j.currentTarget.dataset.id,I=p.getById("technicians",z);if(!I)return;const _=document.createElement("div");_.innerHTML=`<p>Reactivate <strong>${I.name}</strong>? They will regain access once a User Type is assigned.</p>`,ve({title:"Reactivate User",content:_,actions:[{label:"Cancel",className:"btn-secondary",onClick:Q=>Q()},{label:"Reactivate",className:"btn-primary",onClick:Q=>{p.update("technicians",z,{deactivated:!1,deactivatedAt:null}),T(`${I.name} has been reactivated. Assign a User Type to restore access.`,"success"),Q(),l()}}]})})}),(m=n.querySelector("#btn-add-usertype"))==null||m.addEventListener("click",()=>{r()}),n.querySelectorAll(".btn-edit-perms").forEach($=>{$.addEventListener("click",j=>{a(j.target.dataset.id)})}),n.querySelectorAll(".btn-edit-usertype").forEach($=>{$.addEventListener("click",j=>{r(j.target.dataset.id)})}),n.querySelectorAll(".btn-delete-usertype").forEach($=>{$.addEventListener("click",j=>{const z=j.target.dataset.id,I=p.getById("userTypes",z);if(!I)return;if(I.name.toLowerCase().includes("admin")){T("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const _=p.getAll("technicians").filter(E=>E.userTypeId===z),Q=document.createElement("div");Q.innerHTML=`<p>Are you sure you want to delete the user type <strong>${I.name}</strong>?${_.length>0?` <strong>${_.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,ve({title:"Confirm Deletion",content:Q,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Delete",className:"btn-danger",onClick:E=>{p.delete("userTypes",z),T("User Type deleted","success"),E(),l()}}]})})})}else if(s==="tax"){const v=p.getSettings();n.innerHTML=`
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
                <input class="form-input" id="global-markup" type="number" value="${v.markupPercent}" style="width:100px" /> <span class="text-secondary">%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="max-width:540px;margin-top:var(--space-lg)">
          <div class="card-header"><h4>Labor Rate Profiles</h4></div>
          <div class="card-body">
            <div id="labor-rates-container" style="display:flex;flex-direction:column;gap:12px;">
              ${v.laborRates.map(f=>`
                <div class="form-row labor-rate-row" data-id="${f.id}" style="align-items:flex-end;margin-bottom:0">
                  <div class="form-group" style="margin-bottom:0;flex:1">
                    <label class="form-label">Profile Name</label>
                    <input class="form-input rate-name" value="${f.name}" />
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label class="form-label">Rate ($/hr)</label>
                    <input class="form-input rate-val" type="number" value="${f.rate.toFixed(2)}" step="0.01" style="width:140px" />
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
      `,n.querySelector("#add-rate-btn").addEventListener("click",()=>{const f="rate_"+Math.random().toString(36).substring(2,9),g=n.querySelector("#labor-rates-container"),x=document.createElement("div");x.className="form-row labor-rate-row",x.dataset.id=f,x.style.alignItems="flex-end",x.style.marginBottom="12px",x.innerHTML=`
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
        `,g.appendChild(x)}),n.addEventListener("click",f=>{f.target.closest(".remove-rate-btn")&&f.target.closest(".labor-rate-row").remove()}),n.querySelector("#save-tax-settings").addEventListener("click",()=>{const f=parseFloat(n.querySelector("#global-markup").value)||0,g=Array.from(n.querySelectorAll(".labor-rate-row")).map(x=>({id:x.dataset.id,name:x.querySelector(".rate-name").value,rate:parseFloat(x.querySelector(".rate-val").value)||0}));v.markupPercent=f,v.laborRates=g,p.saveSettings(v),document.dispatchEvent(new CustomEvent("save-settings"))})}else if(s==="system")n.innerHTML=`
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
      `,(c=n.querySelector("#btn-reset-data"))==null||c.addEventListener("click",()=>{p.clearAll(),T("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(u=n.querySelector("#btn-clear-data"))==null||u.addEventListener("click",()=>{p.clearAll(),T("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)});else if(s==="permissions"&&e.role==="admin"){let v=p.getAll("userTypes");if(!v||v.length===0){const f=["Dashboard","Customers","Leads","Quotes","Jobs","Timesheets","Assets","Schedule","Contractors","Stock","Purchase Orders","Invoices","Documents","Reports","Settings"],g=x=>f.map($=>({module:$,view:x,create:x,edit:x,delete:x}));v=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:g(!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:g(!0).map(x=>x.module==="Settings"?{...x,edit:!1,delete:!1,create:!1}:x)},{id:"ut_tech",name:"Technician",description:"Field staff with limited access",permissions:g(!1).map(x=>["Dashboard","Jobs","Timesheets","Schedule"].includes(x.module)?{...x,view:!0,create:x.module!=="Dashboard",edit:x.module!=="Dashboard"}:x)}],p.save("userTypes",v)}n.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">User Types & Permissions</h4>
            <button class="btn btn-primary btn-sm" id="btn-add-usertype"><span class="material-icons-outlined" style="font-size:16px">add</span> Add User Type</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>User Type</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                ${v.map(f=>`
                  <tr>
                    <td class="font-medium">${f.name}</td>
                    <td class="text-secondary">${f.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-secondary btn-edit-perms" data-id="${f.id}">Edit Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-view-usertype" data-id="${f.id}">View Info</button>
                        <button class="btn btn-sm btn-danger btn-icon btn-delete-usertype" data-id="${f.id}" title="Delete"><span class="material-icons-outlined" style="pointer-events:none; font-size:18px;">delete</span></button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,(b=n.querySelector("#btn-add-usertype"))==null||b.addEventListener("click",()=>{r()}),n.querySelectorAll(".btn-edit-perms").forEach(f=>{f.addEventListener("click",g=>{a(g.target.dataset.id)})}),n.querySelectorAll(".btn-view-usertype").forEach(f=>{f.addEventListener("click",g=>{const x=p.getById("userTypes",g.target.dataset.id),$=document.createElement("div");$.innerHTML=`<p><strong>Name:</strong> ${x.name}</p><p><strong>Description:</strong> ${x.description}</p>`,ve({title:"User Type Info",content:$,actions:[{label:"Close",className:"btn-secondary",onClick:j=>j()},{label:"Edit",className:"btn-primary",onClick:j=>{j(),r(x.id)}}]})})}),n.querySelectorAll(".btn-delete-usertype").forEach(f=>{f.addEventListener("click",g=>{const x=g.target.dataset.id,$=p.getById("userTypes",x);if(!$)return;const j=document.createElement("div");j.innerHTML=`<p>Are you sure you want to delete the user type <strong>${$.name}</strong>? This action cannot be undone.</p>`,ve({title:"Confirm Deletion",content:j,actions:[{label:"Cancel",className:"btn-secondary",onClick:z=>z()},{label:"Delete",className:"btn-danger",onClick:z=>{p.delete("userTypes",x),T("User Type deleted","success"),z(),l()}}]})})})}}function r(n=null){let d=n?p.getById("userTypes",n):{name:"",description:""};const m=document.createElement("div");m.innerHTML=`
        ${n?"":`
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
          <input class="form-input" id="ut-name" value="${d.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${d.description}" />
        </div>
    `;const c=m.querySelector("#ut-template"),u=m.querySelector("#ut-custom-edit-perms");c&&u&&(c.addEventListener("change",b=>{b.target.value==="Custom"?u.style.display="flex":u.style.display="none"}),u.addEventListener("click",()=>{var x,$;const b=m.querySelector("#ut-name").value,v=m.querySelector("#ut-desc").value;if(!b){T("Please enter a User Type Name first","error");return}const f=Pe(()=>!1),g=p.create("userTypes",{name:b,description:v,permissions:f});(x=document.getElementById("modal-close-btn"))==null||x.click(),a(g.id),($=document.querySelector('.tab[data-tab="permissions"]'))==null||$.click()})),ve({title:n?"Edit User Type":"Add User Type",content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Save",className:"btn-primary",onClick:b=>{var x;const v=document.getElementById("ut-name").value,f=document.getElementById("ut-desc").value,g=(x=document.getElementById("ut-template"))==null?void 0:x.value;if(!v){T("Name required","error");return}if(n)p.update("userTypes",n,{name:v,description:f});else{let $=[];g==="Admin"?$=Pe(()=>!0):g==="Manager"?$=Pe((j,z)=>j==="Settings"?["view","edit_company"].includes(z):!0):g==="Technician"?$=Pe((j,z)=>j==="Dashboard"?z==="view":j==="Jobs"?["view","manage_tasks","book_time"].includes(z):j==="Timesheets"?["view_own","create"].includes(z):j==="Schedule"?["view_own"].includes(z):!1):$=Pe(()=>!1),p.create("userTypes",{name:v,description:f,permissions:$})}T("User Type saved","success"),l(),b()}}]})}function a(n){const d=p.getById("userTypes",n);if(!d)return;const m=d.permissions||[],c={};m.forEach(v=>{c[v.module]=v});const u=document.createElement("div"),b=Object.entries(Ye).map(([v,f])=>{const g=c[v]||{},x=f.every(({key:j})=>g[j]);f.some(({key:j})=>g[j]);const $=f.map(({key:j,label:z})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${v}" data-key="${j}" ${g[j]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${z}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${v}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${v}" ${x?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${$}
          </div>
        </div>
      `}).join("");u.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${b}
      </div>
    `,u.querySelector("#btn-select-all-perms").addEventListener("click",()=>{u.querySelectorAll(".perm-chk, .module-select-all").forEach(v=>v.checked=!0)}),u.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{u.querySelectorAll(".perm-chk, .module-select-all").forEach(v=>v.checked=!1)}),u.querySelectorAll(".module-select-all").forEach(v=>{v.addEventListener("change",f=>{const g=f.target.dataset.module;u.querySelectorAll(`.perm-chk[data-module="${g}"]`).forEach(x=>x.checked=f.target.checked)})}),u.querySelectorAll(".perm-chk").forEach(v=>{v.addEventListener("change",()=>{const f=v.dataset.module,x=(Ye[f]||[]).every(({key:j})=>{const z=u.querySelector(`.perm-chk[data-module="${f}"][data-key="${j}"]`);return z&&z.checked}),$=u.querySelector(`.module-select-all[data-module="${f}"]`);$&&($.checked=x)})}),ve({title:`Edit Permissions: ${d.name}`,content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Save Permissions",className:"btn-primary",onClick:v=>{const f=Object.entries(Ye).map(([g,x])=>{const $={module:g};return x.forEach(({key:j})=>{const z=u.querySelector(`.perm-chk[data-module="${g}"][data-key="${j}"]`);$[j]=z?z.checked:!1}),$});p.update("userTypes",n,{permissions:f}),T("Permissions updated successfully","success"),l(),v()}}]})}function i(n=null){let d=n?p.getById("technicians",n):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const m=p.getAll("userTypes"),c=document.createElement("div");c.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${d.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${d.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${d.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${m.map(v=>`
              <option value="${v.id}" ${d.userTypeId===v.id?"selected":""}>${v.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(v=>`
            <div class="color-swatch" data-color="${v}" style="width:28px; height:28px; border-radius:50%; background:${v}; cursor:pointer; border:2px solid ${d.color.toUpperCase()===v.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${d.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const u=c.querySelector("#u-color"),b=c.querySelectorAll(".color-swatch");b.forEach(v=>{v.addEventListener("click",()=>{u.value=v.dataset.color,b.forEach(f=>f.style.borderColor="transparent"),v.style.borderColor="var(--text-primary)"})}),u.addEventListener("input",()=>{b.forEach(v=>v.style.borderColor="transparent")}),ve({title:n?"Edit User":"Add User",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:v=>v()},{label:"Save",className:"btn-primary",onClick:v=>{var z;const f=document.getElementById("u-name").value,g=document.getElementById("u-email").value,x=document.getElementById("u-role").value,$=document.getElementById("u-type").value,j=document.getElementById("u-color").value;if(!f){T("Name required","error");return}n?p.update("technicians",n,{name:f,email:g,role:x,userTypeId:$,color:j}):p.create("technicians",{name:f,email:g,role:x,userTypeId:$,color:j}),T("User saved","success"),(z=document.querySelector('.tab[data-tab="users"]'))==null||z.click(),v()}}]})}document.addEventListener("save-settings",()=>T("Settings saved","success")),o()}function Ze(t){return Object.entries(Ye).map(([s,e])=>{const o={module:s};return e.forEach(({key:l})=>{o[l]=t(s,l)}),o})}function ta(){const t=p.getAll("userTypes");if(t&&t.length>0)return t;const s=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:Ze(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:Ze((e,o)=>e==="Settings"?["view","edit_company","manage_tax"].includes(o):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:Ze((e,o)=>e==="Dashboard"?o==="view":e==="Jobs"?["view","manage_tasks","book_time"].includes(o):e==="Timesheets"?["view_own","create"].includes(o):e==="Schedule"?["view_own"].includes(o):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Ze((e,o)=>e==="Settings"?!1:e==="Reports"?o==="view":!(["Invoices","Purchase Orders"].includes(e)&&o==="delete"))}];return p.save("userTypes",s),s}const aa=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],nt=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin"},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager"},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech"},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech"},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech"},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office"}],Fe=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],ut=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],et=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function ue(t){return t[Math.floor(Math.random()*t.length)]}function we(t,s=0){const e=new Date,o=Math.floor(Math.random()*(t+s))-t;return new Date(e.getTime()+o*864e5).toISOString()}function Ne(t,s){return Math.round((Math.random()*(s-t)+t)*100)/100}function sa(){return aa.map((t,s)=>{const e=ue(ut),o=ue(ut);return{id:`cust_${s+1}`,company:t.company,firstName:t.first,lastName:t.last,email:`${t.first.toLowerCase()}.${t.last.toLowerCase()}@${t.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${e}, ${ue(et)}, VIC 3000`,status:ue(["Active","Active","Active","Inactive"]),type:ue(["Company","Company","Individual"]),notes:"",createdAt:we(365),updatedAt:we(30),sites:[{name:"Main Office",address:`${e}, ${ue(et)}, VIC 3000`},{name:"Warehouse",address:`${o}, ${ue(et)}, VIC 3001`}],contacts:[{name:`${t.first} ${t.last}`,role:"Primary",email:`${t.first.toLowerCase()}@${t.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${ue(["Alex","Sam","Jordan","Casey","Morgan"])} ${t.last}`,role:"Site Manager",email:`site@${t.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function oa(t){const s=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],e=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(o,l)=>{const r=ue(t);return{id:`lead_${l+1}`,title:`${ue(Fe)} ${ue(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:r.id,customerName:r.company,contactName:`${r.firstName} ${r.lastName}`,status:ue(s),source:ue(e),value:Ne(500,25e3),description:`Potential ${ue(Fe).toLowerCase()} work for ${r.company}.`,priority:ue(["Low","Medium","High"]),createdAt:we(90),updatedAt:we(14)}})}function na(t){const s=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(e,o)=>{const l=ue(t),r=Ne(200,5e3),a=Ne(100,8e3),i=(r+a)*.1;return{id:`quote_${o+1}`,number:`Q-${String(2024e3+o+1)}`,customerId:l.id,customerName:l.company,contactName:`${l.firstName} ${l.lastName}`,title:`${ue(Fe)} - ${ue(["Service Quote","Project Quote","Maintenance Quote"])}`,status:ue(s),lineItems:[{description:`${ue(Fe)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:Ne(65,120),total:r},{description:`${ue(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:Ne(15,200),total:a}],subtotal:r+a,tax:i,total:r+a+i,validUntil:we(-30,60),notes:"",createdAt:we(120),updatedAt:we(14)}})}function ia(t,s){const e=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],o=["Low","Medium","High","Urgent"];return Array.from({length:20},(l,r)=>{var d;const a=ue(t),i=ue(nt),n=ue(e);return{id:`job_${r+1}`,number:`J-${String(1e5+r+1)}`,customerId:a.id,customerName:a.company,contactName:`${a.firstName} ${a.lastName}`,siteAddress:a.address||`${ue(ut)}, ${ue(et)}, VIC 3000`,title:`${ue(Fe)} - ${ue(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:ue(Fe),status:n,priority:ue(o),technicianId:i.id,technicianName:i.name,quoteId:r<s.length?(d=s[r])==null?void 0:d.id:null,scheduledDate:we(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:Ne(200,4e3),materialCost:Ne(100,3e3),notes:"",createdAt:we(90),updatedAt:we(7)}})}function la(t){const s=["Draft","Sent","Paid","Overdue","Void"],e=t.filter(o=>o.status==="Completed"||o.status==="Invoiced");return Array.from({length:Math.max(8,e.length)},(o,l)=>{const r=e[l]||ue(t),a=(r.laborCost||0)+(r.materialCost||0),i=a*.1;return{id:`inv_${l+1}`,number:`INV-${String(5e4+l+1)}`,jobId:r.id,jobNumber:r.number,customerId:r.customerId,customerName:r.customerName,contactName:r.contactName,status:ue(s),lineItems:[{description:`${r.title} - Labor`,amount:r.laborCost||Ne(200,4e3)},{description:`${r.title} - Materials`,amount:r.materialCost||Ne(100,3e3)}],subtotal:a,tax:i,total:a+i,invoiceType:"Standard",issueDate:we(60),dueDate:we(-14,30),paidDate:null,notes:"",createdAt:we(60),updatedAt:we(7)}})}function ra(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((s,e)=>({id:`stock_${e+1}`,name:s.name,sku:`SKU-${String(1e3+e)}`,category:s.cat,unit:s.unit,unitPrice:s.price,costPrice:s.price*.6,quantity:Math.floor(Math.random()*200)+5,reorderLevel:Math.floor(Math.random()*20)+5,supplier:ue(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:ue(["Warehouse A","Warehouse B","Van Stock","On Order"]),createdAt:we(365),updatedAt:we(30)}))}function da(t){const s=[];return t.filter(o=>o.status==="Scheduled"||o.status==="In Progress").forEach((o,l)=>{const r=Math.floor(Math.random()*5),a=7+Math.floor(Math.random()*8),i=1+Math.floor(Math.random()*4),n=nt.find(d=>d.id===o.technicianId)||ue(nt);s.push({id:`sched_${l+1}`,jobId:o.id,jobNumber:o.number,title:o.title,technicianId:n.id,technicianName:n.name,color:n.color,dayOffset:r,startHour:a,endHour:Math.min(a+i,18),customerName:o.customerName,siteAddress:o.siteAddress})}),s}function ca(){if(p.isSeeded())return;ta();const t=sa(),s=oa(t),e=na(t),o=ia(t,e),l=la(o),r=ra(),a=da(o);p.save("customers",t),p.save("leads",s),p.save("quotes",e),p.save("jobs",o),p.save("invoices",l),p.save("stock",r),p.save("schedule",a),p.save("technicians",nt),p.markSeeded()}const ua=[{section:"MAIN"},{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{section:"WORKFLOW"},{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"},{section:"RESOURCES"},{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"},{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{section:"ANALYTICS"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{section:"SYSTEM"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}];function Lt(){const t=document.createElement("aside");t.className="sidebar",t.id="sidebar";const s=localStorage.getItem("simpro_sidebar_expanded")==="true";s&&t.classList.add("expanded");let e=`
    <div class="sidebar-logo" id="sidebar-logo">
      <div class="logo-icon">S</div>
      <span class="logo-text">SimPro</span>
    </div>
    <div class="sidebar-scroll-arrow up" id="sidebar-scroll-up">
      <span class="material-icons-outlined">keyboard_arrow_up</span>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">
  `;JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),ua.forEach(m=>{m.section?e+=`<div class="sidebar-section-label" data-section="${m.section}">${m.section}</div>`:e+=`
        <button class="sidebar-nav-item" data-path="${m.path}" data-id="${m.id}" id="nav-${m.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${m.icon}</span></span>
          <span class="nav-label">${m.label}</span>
        </button>
      `}),e+=`
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
  `,t.innerHTML=e,t.addEventListener("click",m=>{const c=m.target.closest(".sidebar-nav-item");if(c){const u=c.dataset.path;C.navigate(u)}}),t.querySelector("#sidebar-logo").addEventListener("click",()=>C.navigate("/")),t.querySelector("#sidebar-toggle").addEventListener("click",()=>pa(t));const r=t.querySelector("#sidebar-nav"),a=t.querySelector("#sidebar-scroll-up"),i=t.querySelector("#sidebar-scroll-down"),n=()=>{if(t.classList.contains("expanded")){a.classList.remove("visible"),i.classList.remove("visible");return}const{scrollTop:m,scrollHeight:c,clientHeight:u}=r;a.classList.toggle("visible",m>0),i.classList.toggle("visible",Math.ceil(m+u)<c)};r.addEventListener("scroll",n),a.addEventListener("click",()=>{r.scrollBy({top:-100,behavior:"smooth"})}),i.addEventListener("click",()=>{r.scrollBy({top:100,behavior:"smooth"})}),setTimeout(n,100);const d=t.querySelector("#btn-logout");return d&&d.addEventListener("click",()=>{sessionStorage.removeItem("currentUser"),C.navigate("/login")}),It(),t}function It(){const t=document.getElementById("sidebar");if(!t)return;const s=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}');if(s.role==="customer")t.style.display="none";else{t.style.display="";let e=null;if(s.userTypeId){const a=p.getById("userTypes",s.userTypeId);a&&a.permissions&&(e=a.permissions)}document.querySelectorAll(".sidebar-nav-item").forEach(a=>{const i=a.querySelector(".nav-label");if(!i)return;const n=i.textContent.trim();if(s.role==="admin"){a.style.display="";return}if(e){const d=e.find(c=>c.module===n);d&&Object.entries(d).some(([c,u])=>c!=="module"&&u===!0)||n==="Notifications"||n==="Dashboard"?a.style.display="":a.style.display="none"}else(n==="Settings"||n==="Reports"||n==="Invoices")&&(a.style.display="none")}),document.querySelectorAll(".sidebar-section-label").forEach(a=>{let i=!1,n=a.nextElementSibling;for(;n&&n.classList.contains("sidebar-nav-item");){if(n.style.display!=="none"){i=!0;break}n=n.nextElementSibling}a.style.display=i?"":"none"});const o=t.querySelector("#sidebar-nav"),l=t.querySelector("#sidebar-scroll-up"),r=t.querySelector("#sidebar-scroll-down");if(o&&l&&r&&!t.classList.contains("expanded")){const{scrollTop:a,scrollHeight:i,clientHeight:n}=o;l.classList.toggle("visible",a>0),r.classList.toggle("visible",Math.ceil(a+n)<i)}}}function pa(t){t.classList.toggle("expanded");const s=t.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",s);const e=t.querySelector("#sidebar-toggle-icon");e.textContent=s?"chevron_left":"chevron_right";const o=t.querySelector("#sidebar-nav"),l=t.querySelector("#sidebar-scroll-up"),r=t.querySelector("#sidebar-scroll-down");if(o&&l&&r)if(s)l.classList.remove("visible"),r.classList.remove("visible");else{const{scrollTop:a,scrollHeight:i,clientHeight:n}=o;l.classList.toggle("visible",a>0),r.classList.toggle("visible",Math.ceil(a+n)<i)}}function Tt(t){const s=t==="/"?"/":"/"+t.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(e=>{e.classList.toggle("active",e.dataset.path===s)})}const $t=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:Lt,updateSidebarAccess:It,updateSidebarActive:Tt},Symbol.toStringTag,{value:"Module"}));function Dt(){const t=document.createElement("header");t.className="topbar",t.id="topbar",t.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${qt()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const s=t.querySelector("#global-search");let e;s.addEventListener("input",i=>{clearTimeout(e),e=setTimeout(()=>{const n=i.target.value.trim();n.length>=2?ba(n):it()},300)}),s.addEventListener("blur",()=>{setTimeout(it,200)}),t.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const n=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n),localStorage.setItem("simpro_theme",n),t.querySelector("#theme-icon").textContent=n==="dark"?"light_mode":"dark_mode"}),va();const l=t.querySelector("#btn-notifications"),r=t.querySelector(".notification-dot");function a(){p.getAll("notifications").filter(d=>!d.read).length>0?r.style.display="block":r.style.display="none"}return p.on("notifications",a),a(),l.addEventListener("click",i=>{i.stopPropagation(),ma(l)}),At(t),t}function At(t){const s=t||document.getElementById("topbar");if(!s)return;const e=JSON.parse(sessionStorage.getItem("currentUser")||'{"role":"admin"}'),o=s.querySelector("#topbar-name"),l=s.querySelector("#topbar-role"),r=s.querySelector("#topbar-avatar");if(o&&(o.textContent=e.name||"Unknown User"),l){let a=e.role;if(e.userTypeId){const n=JSON.parse(localStorage.getItem("simpro_userTypes")||"[]").find(d=>d.id===e.userTypeId);n&&(a=n.name)}(!a||a===e.role)&&(a={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[e.role]||e.role),l.textContent=a}if(r){const i=(e.name||"").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase()||"U";r.textContent=i}}function ma(t){let s=document.querySelector("#notifications-dropdown");if(s){s.remove();return}const e=p.getAll("notifications").sort((a,i)=>new Date(i.createdAt)-new Date(a.createdAt));s=document.createElement("div"),s.className="dropdown-menu",s.id="notifications-dropdown",s.style.cssText="position:absolute;top:100%;right:0;margin-top:4px;width:300px;max-height:400px;overflow-y:auto;z-index:1000;box-shadow:var(--shadow-lg);border-radius:var(--radius-md);background:var(--content-bg);border:1px solid var(--border-color);";const o=document.createElement("div");o.style.cssText="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",o.innerHTML='<h4 style="margin:0">Notifications</h4>';const l=document.createElement("button");l.className="btn btn-ghost btn-sm",l.textContent="Mark all as read",l.onclick=()=>{const a=p.getAll("notifications");let i=!1;a.forEach(n=>{n.read||(n.read=!0,n.updatedAt=new Date().toISOString(),i=!0)}),i&&p.save("notifications",a),s.remove()},o.appendChild(l),s.appendChild(o),e.length===0?s.innerHTML+='<div style="padding:20px;text-align:center;color:var(--text-tertiary)">No notifications</div>':e.forEach(a=>{const i=document.createElement("div");i.className="dropdown-item",i.style.cssText=`padding:12px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${a.read?"transparent":"var(--color-info-bg)"};align-items:flex-start;`,i.innerHTML=`
        <div style="flex:1">
          <div style="font-weight:600;margin-bottom:4px">${a.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;">${a.message}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${new Date(a.createdAt).toLocaleString()}</div>
        </div>
      `,i.addEventListener("click",()=>{if(p.update("notifications",a.id,{read:!0}),a.link){const{router:n}=window.__simproApp||{};n&&n.navigate(a.link)}s.remove()}),s.appendChild(i)}),t.parentNode.style.position="relative",t.parentNode.appendChild(s);const r=a=>{!s.contains(a.target)&&a.target!==t&&!t.contains(a.target)&&(s.remove(),document.removeEventListener("click",r))};document.addEventListener("click",r)}function ba(t){it();const{store:s}=window.__simproApp||{};if(!s)return;const e=[],o=t.toLowerCase();if(s.getAll("customers").forEach(r=>{(r.company.toLowerCase().includes(o)||`${r.firstName} ${r.lastName}`.toLowerCase().includes(o))&&e.push({type:"Customer",label:r.company,icon:"people",path:`/people/${r.id}`})}),s.getAll("jobs").forEach(r=>{(r.number.toLowerCase().includes(o)||r.title.toLowerCase().includes(o)||r.customerName.toLowerCase().includes(o))&&e.push({type:"Job",label:`${r.number} — ${r.title}`,icon:"build",path:`/jobs/${r.id}`})}),s.getAll("quotes").forEach(r=>{var a;(r.number.toLowerCase().includes(o)||(a=r.title)!=null&&a.toLowerCase().includes(o)||r.customerName.toLowerCase().includes(o))&&e.push({type:"Quote",label:`${r.number} — ${r.customerName}`,icon:"request_quote",path:`/quotes/${r.id}`})}),s.getAll("invoices").forEach(r=>{(r.number.toLowerCase().includes(o)||r.customerName.toLowerCase().includes(o))&&e.push({type:"Invoice",label:`${r.number} — ${r.customerName}`,icon:"receipt_long",path:`/invoices/${r.id}`})}),e.length===0)return;const l=document.createElement("div");l.className="dropdown-menu",l.id="search-results",l.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",e.slice(0,12).forEach(r=>{const a=document.createElement("button");a.className="dropdown-item",a.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${r.icon}</span>
      <span style="flex:1" class="truncate">${r.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${r.type}</span>
    `,a.addEventListener("click",()=>{const{router:i}=window.__simproApp||{};i&&i.navigate(r.path),it(),document.querySelector("#global-search").value=""}),l.appendChild(a)}),document.querySelector(".topbar-search").appendChild(l)}function it(){const t=document.querySelector("#search-results");t&&t.remove()}function qt(){return localStorage.getItem("simpro_theme")||"light"}function va(){qt()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const wt=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:Dt,updateTopbarAccess:At},Symbol.toStringTag,{value:"Module"})),ya={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function fa(t){const s=document.getElementById("breadcrumb");if(!s)return;if(t==="/"){s.style.display="none";return}s.style.display="flex";const e=t.split("/").filter(Boolean);let o=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,l="";e.forEach((r,a)=>{l+="/"+r;const i=a===e.length-1,n=ya[l]||decodeURIComponent(r);o+='<span class="breadcrumb-separator">›</span>',i?o+=`<span class="breadcrumb-item current">${n}</span>`:o+=`<span class="breadcrumb-item" data-path="${l}">${n}</span>`}),s.innerHTML=o,s.querySelectorAll(".breadcrumb-item[data-path]").forEach(r=>{r.addEventListener("click",()=>{const{router:a}=window.__simproApp||{};a&&a.navigate(r.dataset.path)})})}function He(t){const s=document.getElementById("breadcrumb");if(!s)return;const e=s.querySelector(".breadcrumb-item.current");e&&(e.textContent=t)}const ha="modulepreload",ga=function(t){return"/"+t},St={},ee=function(s,e,o){let l=Promise.resolve();if(e&&e.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),i=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));l=Promise.allSettled(e.map(n=>{if(n=ga(n),n in St)return;St[n]=!0;const d=n.endsWith(".css"),m=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${n}"]${m}`))return;const c=document.createElement("link");if(c.rel=d?"stylesheet":ha,d||(c.as="script"),c.crossOrigin="",c.href=n,i&&c.setAttribute("nonce",i),document.head.appendChild(c),d)return new Promise((u,b)=>{c.addEventListener("load",u),c.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${n}`)))})}))}function r(a){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=a,window.dispatchEvent(i),!i.defaultPrevented)throw a}return l.then(a=>{for(const i of a||[])i.status==="rejected"&&r(i.reason);return s().catch(r)})};let Me=!1;const Ve={S:"module-s",M:"module-m",L:"module-l",XL:"module-xl"},Qe={standard:"",tall:"module-tall",xtall:"module-xtall"};function pt(){const t=JSON.parse(sessionStorage.getItem("currentUser")||"null");return t?`dashboardLayout_v2_${t.id}`:"dashboardLayout_v2"}const lt={"kpi-cards":{title:"KPI Cards",defaultW:"XL",defaultH:"standard",widths:["M","L","XL"],heights:["standard"],kpiStrip:!0,render:wa},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Sa},"tech-map":{title:"Technician Map",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:ka},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:Ca},"recent-leads":{title:"Recent Leads",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Ea},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:La},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:Ta},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>$e("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>$e("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>$e("inventory","Inventory looks good")},"profitability-chart":{title:"Profitability Chart",defaultW:"L",defaultH:"tall",widths:["M","L","XL"],heights:["tall","xtall"],render:()=>$e("trending_up","Mock Profitability Data")},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>$e("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>$e("schedule","No timesheet alerts")},"fleet-status":{title:"Fleet Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>$e("local_shipping","Fleet operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>$e("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>$e("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>$e("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>$e("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>$e("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>$e("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>$e("wb_sunny","Sunny, 24°C")}},Nt=[{id:"kpi-cards",w:"XL",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"M",h:"tall"},{id:"recent-leads",w:"M",h:"tall"},{id:"cash-flow",w:"M",h:"standard"}];function $e(t,s){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${t}</span>
    <span style="font-size:13px;">${s}</span>
  </div>`}function xa(t){let s=JSON.parse(JSON.stringify(Nt));try{const l=localStorage.getItem(pt());l&&(s=JSON.parse(l))}catch{}s.forEach(l=>{l.instanceId||(l.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const e={jobs:p.getAll("jobs"),quotes:p.getAll("quotes"),invoices:p.getAll("invoices"),leads:p.getAll("leads"),people:p.getAll("people")};t.innerHTML=`
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
    </div>`;const o=t.querySelector("#dashboard-grid");_e(o,s,e),t.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{Me=!0,_e(o,s,e),$a(t,o,s,e)})}function _e(t,s,e){t.innerHTML="",s.forEach(o=>{const l=lt[o.id];if(!l)return;const r=Ve[o.w]||"module-m",a=Qe[o.h]||"",i=["dashboard-module",r,a,Me?"edit-mode":""].filter(Boolean).join(" "),n=l.widths.length>1,d=l.heights.length>1,m=Me?`
      ${n?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${d?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${n&&d?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",c=Me?`
      <div style="display:flex;align-items:center;gap:4px;">
        ${l.configurable?`
          <button class="btn btn-ghost btn-icon btn-sm btn-configure" data-instance-id="${o.instanceId}" title="Configure widget" style="pointer-events:auto;position:relative;z-index:20;">
            <span class="material-icons-outlined" style="font-size:15px;">settings</span>
          </button>
        `:""}
        <button class="btn btn-ghost btn-icon btn-sm btn-remove" data-instance-id="${o.instanceId}" title="Remove widget" style="pointer-events:auto;position:relative;z-index:20;">
          <span class="material-icons-outlined" style="font-size:15px;">close</span>
        </button>
      </div>`:"",u=Me?"background:rgba(27,109,224,0.04);":"";t.insertAdjacentHTML("beforeend",`
      <div class="${i}" data-instance-id="${o.instanceId}" data-id="${o.id}" style="position:relative;">
        <div class="card ${l.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${u}">
            <span style="font-weight:600;font-size:14px;">${l.title}</span>
            ${c}
          </div>
          <div class="card-body">${l.render(e,o)}</div>
        </div>
        ${m}
      </div>`)}),Me&&mt(t,s,e)}function mt(t,s,e){t.querySelectorAll(".btn-configure").forEach(o=>{o.addEventListener("click",l=>{const r=l.currentTarget.dataset.instanceId,a=s.find(i=>i.instanceId===r);if(a&&a.id==="pinned-job"){const i=e.jobs,n=document.createElement("div");n.innerHTML=`
          <div style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            ${i.map(d=>`
              <div class="job-option" data-job-id="${d.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
                onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
                onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
                <div style="font-weight:600;font-size:13px;">#${d.number} - ${d.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">${d.customerName}</div>
              </div>
            `).join("")}
          </div>
        `,ee(async()=>{const{showModal:d}=await Promise.resolve().then(()=>xe);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:"Select Job to Pin",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()}]}),n.querySelectorAll(".job-option").forEach(m=>{m.addEventListener("click",()=>{var c;a.config={...a.config,jobId:m.dataset.jobId},(c=document.querySelector(".modal-overlay"))==null||c.remove(),_e(t,s,e)})})})}})}),t.querySelectorAll(".btn-remove").forEach(o=>{o.addEventListener("click",l=>{const r=l.currentTarget.dataset.instanceId,a=s.findIndex(i=>i.instanceId===r);a!==-1&&(s.splice(a,1),_e(t,s,e))})}),window.Sortable&&!t.sortableInstance&&(t.sortableInstance=new window.Sortable(t,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const o=Array.from(t.children).map(r=>r.dataset.instanceId),l=[];o.forEach(r=>{const a=s.find(i=>i.instanceId===r);a&&l.push(a)}),s.splice(0,s.length,...l)}})),t.sortableInstance&&t.sortableInstance.option("disabled",!1),t.querySelectorAll(".resize-handle").forEach(o=>{o.addEventListener("mousedown",l=>{l.preventDefault(),l.stopPropagation();const r=l.target.closest(".dashboard-module"),a=r.dataset.instanceId,i=s.find(I=>I.instanceId===a),n=lt[i==null?void 0:i.id];if(!i||!n)return;const d=l.target.closest(".resize-handle"),m=d&&(d.classList.contains("resize-r")||d.classList.contains("resize-br")),c=d&&(d.classList.contains("resize-b")||d.classList.contains("resize-br"));let u=l.clientX,b=l.clientY,v=0,f=0;const g=60,x=["S","M","L","XL"].filter(I=>n.widths.includes(I)),$=["standard","tall","xtall"].filter(I=>n.heights.includes(I));function j(I){if(m){if(v+=I.clientX-u,v>g){let _=x.indexOf(i.w);_<x.length-1&&(i.w=x[_+1],r.className=["dashboard-module",Ve[i.w]||"module-m",Qe[i.h]||"","edit-mode"].filter(Boolean).join(" ")),v=0}else if(v<-g){let _=x.indexOf(i.w);_>0&&(i.w=x[_-1],r.className=["dashboard-module",Ve[i.w]||"module-m",Qe[i.h]||"","edit-mode"].filter(Boolean).join(" ")),v=0}}if(c){if(f+=I.clientY-b,f>g){let _=$.indexOf(i.h);_<$.length-1&&(i.h=$[_+1],r.className=["dashboard-module",Ve[i.w]||"module-m",Qe[i.h]||"","edit-mode"].filter(Boolean).join(" ")),f=0}else if(f<-g){let _=$.indexOf(i.h);_>0&&(i.h=$[_-1],r.className=["dashboard-module",Ve[i.w]||"module-m",Qe[i.h]||"","edit-mode"].filter(Boolean).join(" ")),f=0}}u=I.clientX,b=I.clientY}function z(){document.removeEventListener("mousemove",j),document.removeEventListener("mouseup",z),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",j),document.addEventListener("mouseup",z),document.body.style.cursor=window.getComputedStyle(l.target).cursor,document.body.style.userSelect="none"})})}function $a(t,s,e,o){const l=t.querySelector("#dashboard-header-actions"),r=t.querySelector("#btn-edit-dashboard");r.style.display="none",l.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,l.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(e.splice(0,e.length,...JSON.parse(JSON.stringify(Nt))),_e(s,e,o),mt(s,e,o))}),l.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(pt(),JSON.stringify(e)),Me=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),r.style.display="",l.innerHTML=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`,_e(s,e,o)}),l.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const a=localStorage.getItem(pt());a&&e.splice(0,e.length,...JSON.parse(a))}catch{}Me=!1,s.sortableInstance&&s.sortableInstance.option("disabled",!0),r.style.display="",l.innerHTML=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`,_e(s,e,o)}),l.querySelector("#btn-add-widget").addEventListener("click",()=>{const a=Object.entries(lt),i=document.createElement("div");i.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${a.map(([n,d])=>`
            <div data-id="${n}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${d.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${d.defaultW} · ${d.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,ee(async()=>{const{showModal:n}=await Promise.resolve().then(()=>xe);return{showModal:n}},void 0).then(({showModal:n})=>{n({title:"Add Widget",content:i,actions:[{label:"Close",className:"btn-secondary",onClick:d=>d()}]}),i.querySelectorAll("[data-id]").forEach(d=>{d.addEventListener("click",m=>{var b;const c=m.currentTarget.dataset.id,u=lt[c];e.push({id:c,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:u.defaultW,h:u.defaultH}),(b=document.querySelector(".modal-overlay"))==null||b.remove(),_e(s,e,o),mt(s,e,o)})})})})}function wa(t,s){const e=t.jobs.filter(a=>a.status==="In Progress"||a.status==="Scheduled").length,o=t.quotes.filter(a=>a.status==="Sent"||a.status==="Draft").length,l=t.invoices.filter(a=>a.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+t.invoices.filter(a=>a.status==="Paid").reduce((a,i)=>a+(i.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:e,icon:"build",color:"green",sub:`${t.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:o,icon:"request_quote",color:"orange",sub:`${t.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:l,icon:"warning",color:"red",sub:l>0?"Requires attention":"All on track",pos:l===0}].map(a=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${a.label}</div>
        <div class="stat-icon ${a.color}"><span class="material-icons-outlined">${a.icon}</span></div>
      </div>
      <div class="stat-value">${a.value}</div>
      <div class="stat-change ${a.pos===!0?"positive":a.pos===!1?"negative":""}">
        <span style="font-size:12px;">${a.sub}</span>
      </div>
    </div>`).join("")}function Sa(t,s){const e={};t.jobs.forEach(r=>{e[r.status]=(e[r.status]||0)+1});const o=t.jobs.length||1,l={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(e).map(([r,a])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${r}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(a/o*100).toFixed(1)}%;height:100%;background:${l[r]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${a>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${a}</span>
      </div>`).join("")}
  </div>`}function ka(t,s){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${t.people.filter(l=>l.type==="Staff").slice(0,4).map((l,r)=>{const a=15+r*22+Math.sin(r)*12,i=15+r*18+Math.cos(r)*18;return`<div style="position:absolute;top:${a}%;left:${i}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${l.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${l.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function Ca(t,s){const e=[];return t.jobs.slice(0,4).forEach(o=>e.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${o.number}</strong> — ${o.title}`,sub:o.customerName,time:o.updatedAt})),t.quotes.slice(0,3).forEach(o=>e.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${o.number}</strong> ${o.status.toLowerCase()}`,sub:o.customerName,time:o.updatedAt})),t.invoices.slice(0,2).forEach(o=>e.push({icon:"receipt_long",color:o.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${o.number}</strong> — ${o.status}`,sub:o.customerName,time:o.updatedAt})),e.sort((o,l)=>new Date(l.time)-new Date(o.time)),e.map(o=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${o.color}20;color:${o.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${o.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${o.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${o.sub} · ${Ia(o.time)}</div>
      </div>
    </div>`).join("")}function Ea(t,s){const e={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${t.leads.slice(0,8).map(o=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${o.id}'">
        <td class="cell-link font-medium">${o.title}</td>
        <td style="color:var(--text-secondary);">${o.customerName}</td>
        <td><span class="badge ${e[o.status]||"badge-neutral"}">${o.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function La(t,s){const e=t.jobs.filter(o=>o.status==="Scheduled"||o.status==="In Progress").slice(0,8);return e.length?e.map(o=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${o.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${o.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${o.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${o.technicianName} · ${o.customerName}</div>
      </div>
      <span class="badge ${o.status==="In Progress"?"badge-primary":"badge-warning"}">${o.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function Ia(t){const s=Math.floor((Date.now()-new Date(t))/6e4);if(s<60)return`${s}m ago`;const e=Math.floor(s/60);return e<24?`${e}h ago`:`${Math.floor(e/24)}d ago`}function Ta(t,s){var i;const e=(i=s.config)==null?void 0:i.jobId;if(!e)return $e("push_pin","Click settings to pin a job");const o=t.jobs.find(n=>n.id===e);if(!o)return $e("warning","Job not found");const l=o.tasks||[{label:"Site Safety Audit",completed:!0},{label:"Materials Delivery",completed:o.status!=="Pending"},{label:"Initial Rough-in",completed:o.status==="In Progress"||o.status==="Completed"},{label:"Quality Inspection",completed:o.status==="Completed"},{label:"Client Sign-off",completed:!1}],r=l.filter(n=>n.completed).length,a=Math.round(r/l.length*100);return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${o.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${a}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${a}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        ${l.map(n=>`
          <div style="display:flex;align-items:center;gap:10px;opacity:${n.completed?.6:1}">
            <span class="material-icons-outlined" style="font-size:16px;color:${n.completed?"var(--color-success)":"var(--text-tertiary)"};">
              ${n.completed?"check_circle":"radio_button_unchecked"}
            </span>
            <span style="font-size:12px;text-decoration:${n.completed?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:var(--text-secondary);">${n.label}</span>
          </div>
        `).join("")}
      </div>

      <div style="background:var(--bg-primary);padding:8px;border-radius:6px;border:1px dashed var(--border-color);">
        <div style="font-weight:700;font-size:12px;color:var(--text-primary);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${o.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${o.customerName}</div>
      </div>
    </div>
  `}function Ie({columns:t,data:s,onRowClick:e,getId:o,emptyMessage:l="No records found",emptyIcon:r="inbox",selectable:a=!1,onSelectionChange:i=null}){const n=document.createElement("div");n.className="card";let d=null,m="asc",c=1;const u=15,b=new Set;function v(){i&&i(Array.from(b))}function f(){let g=[...s];d&&g.sort((I,_)=>{const Q=d.getValue?d.getValue(I):I[d.key],E=d.getValue?d.getValue(_):_[d.key];return Q==null?1:E==null?-1:typeof Q=="string"?m==="asc"?Q.localeCompare(E):E.localeCompare(Q):m==="asc"?Q-E:E-Q});const x=Math.ceil(g.length/u);c>x&&(c=x||1);const $=(c-1)*u,j=g.slice($,$+u);if(s.length===0){n.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${y(r)}</span>
          <h3>${y(l)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let z='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(a){const I=j.length>0&&j.every(_=>b.has(String(o?o(_):_.id)));z+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${I?"checked":""}></th>`}if(t.forEach(I=>{const _=d&&d.key===I.key,Q=_?" sorted":"",E=_?m==="asc"?"arrow_upward":"arrow_downward":"unfold_more";z+=`<th class="${Q}" data-key="${I.key}" style="${I.width?"width:"+I.width:""}">
        ${y(I.label)}
        <span class="material-icons-outlined sort-icon">${E}</span>
      </th>`}),z+="</tr></thead><tbody>",j.forEach(I=>{const _=String(o?o(I):I.id),Q=b.has(_);z+=`<tr data-id="${y(_)}" style="cursor:pointer" class="${Q?"selected-row":""}">`,a&&(z+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${y(_)}" ${Q?"checked":""}>
        </td>`),t.forEach(E=>{const V=E.render?E.render(I):y(I[E.key]??"");z+=`<td>${V}</td>`}),z+="</tr>"}),z+="</tbody></table></div>",x>1){z+=`<div class="pagination">
        <span class="pagination-info">Showing ${$+1}–${Math.min($+u,g.length)} of ${g.length}</span>
        <div class="pagination-controls">
          <button ${c===1?"disabled":""} data-page="prev">‹</button>`;for(let I=1;I<=x;I++){if(x>7&&I>2&&I<x-1&&Math.abs(I-c)>1){(I===3||I===x-2)&&(z+="<button disabled>…</button>");continue}z+=`<button class="${I===c?"page-active":""}" data-page="${I}">${I}</button>`}z+=`<button ${c===x?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(n.innerHTML=z,n.querySelectorAll("th[data-key]").forEach(I=>{I.addEventListener("click",()=>{const _=t.find(Q=>Q.key===I.dataset.key);d===_?m=m==="asc"?"desc":"asc":(d=_,m="asc"),f()})}),e&&n.querySelectorAll("tbody tr[data-id]").forEach(I=>{I.addEventListener("click",_=>{_.target.closest(".dt-select-cell")||e(I.dataset.id)})}),a){n.querySelectorAll(".dt-select-row").forEach(_=>{_.addEventListener("change",Q=>{Q.target.checked?b.add(Q.target.value):b.delete(Q.target.value),v(),f()})});const I=n.querySelector(".dt-select-all");I&&I.addEventListener("change",_=>{const Q=_.target.checked;j.forEach(E=>{const V=String(o?o(E):E.id);Q?b.add(V):b.delete(V)}),v(),f()})}n.querySelectorAll(".pagination-controls button[data-page]").forEach(I=>{I.addEventListener("click",()=>{const _=I.dataset.page;_==="prev"?c--:_==="next"?c++:c=parseInt(_),f()})})}return f(),n.updateData=g=>{s=g,f()},n.clearSelection=()=>{b.clear(),v(),f()},n}function Te({container:t,selectedIds:s,actions:e,onClear:o}){const l=t.querySelector(".bulk-action-bar");if(l&&l.remove(),!s||s.length===0)return;const r=document.createElement("div");r.className="bulk-action-bar slide-up";let a=`
    <div class="bulk-action-left">
      <span class="bulk-count">${s.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return e.forEach((i,n)=>{a+=`<button class="btn ${i.className||"btn-secondary"} btn-sm" data-action="${n}">
      ${i.icon?`<span class="material-icons-outlined" style="font-size:16px">${y(i.icon)}</span> `:""}
      ${y(i.label)}
    </button>`}),a+="</div>",r.innerHTML=a,r.querySelector("#btn-clear-selection").addEventListener("click",()=>{o&&o()}),r.querySelectorAll("button[data-action]").forEach(i=>{i.addEventListener("click",()=>{const n=i.dataset.action;e[n]&&e[n].onClick&&e[n].onClick(s)})}),t.appendChild(r),r}function bt(t){const s=p.getAll("customers");t.innerHTML=`
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
        <button class="toolbar-filter" data-filter="Active">Active (${s.filter(r=>r.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${s.filter(r=>r.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let e=[...s];const l=Ie({columns:[{key:"company",label:"Company / Name",render:r=>`<span class="cell-link font-medium">${y(r.company)}</span>`},{key:"contact",label:"Contact",render:r=>`${y(r.firstName)} ${y(r.lastName)}`},{key:"email",label:"Email",render:r=>`<span class="text-secondary">${y(r.email)}</span>`},{key:"phone",label:"Phone",render:r=>`<span class="text-secondary">${y(r.phone)}</span>`},{key:"type",label:"Type",render:r=>`<span class="badge badge-neutral">${y(r.type)}</span>`},{key:"status",label:"Status",render:r=>`<span class="badge ${r.status==="Active"?"badge-success":"badge-neutral"}">${y(r.status)}</span>`}],data:e,onRowClick:r=>C.navigate(`/people/${r}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:r=>{Te({container:t,selectedIds:r,onClear:()=>l.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:a=>{const i=document.createElement("div");i.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,ee(async()=>{const{showModal:n}=await Promise.resolve().then(()=>xe);return{showModal:n}},void 0).then(({showModal:n})=>{n({title:`Update ${a.length} Customers`,content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const m=i.querySelector("#bulk-status").value;a.forEach(c=>p.update("customers",c,{status:m})),l.clearSelection(),bt(t),T(`Updated ${a.length} customers to ${m}`,"success"),d()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:a=>{ee(async()=>{const{showModal:i}=await Promise.resolve().then(()=>xe);return{showModal:i}},void 0).then(({showModal:i})=>{const n=document.createElement("div");n.innerHTML=`<p>Are you sure you want to delete ${a.length} customers? This cannot be undone.</p>`,i({title:"Confirm Bulk Delete",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{a.forEach(m=>p.delete("customers",m)),l.clearSelection(),bt(t),T(`Deleted ${a.length} customers`,"success"),d()}}]})})}}]})}});t.querySelector("#people-table-container").appendChild(l),t.querySelector("#btn-new-person").addEventListener("click",()=>{C.navigate("/people/new")}),t.querySelector("#btn-export-people").addEventListener("click",()=>{T("Customer data exported successfully","success")}),t.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(i=>i.classList.remove("active")),r.classList.add("active");const a=r.dataset.filter;e=a==="all"?[...s]:s.filter(i=>i.status===a),l.updateData(e)})}),t.querySelector("#people-search").addEventListener("input",r=>{var n;const a=r.target.value.toLowerCase();e=s.filter(d=>d.company.toLowerCase().includes(a)||`${d.firstName} ${d.lastName}`.toLowerCase().includes(a)||d.email.toLowerCase().includes(a));const i=(n=t.querySelector(".toolbar-filter.active"))==null?void 0:n.dataset.filter;i&&i!=="all"&&(e=e.filter(d=>d.status===i)),l.updateData(e)})}function Ue({title:t,icon:s,iconBgColor:e="var(--color-primary-light)",iconTextColor:o="var(--color-primary)",metaHtml:l="",actionsHtml:r=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${e};color:${o}">
          <span class="material-icons-outlined">${s}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${t}</h2></div>
          ${l?`<div class="detail-header-meta">${l}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${r}
      </div>
    </div>
  `}function Ce({title:t,content:s,actions:e=[],width:o=400}){const l=document.querySelector(".drawer-overlay");l&&l.remove();const r=document.createElement("div");r.className="drawer-overlay";const a=document.createElement("div");a.className="drawer",a.style.width=typeof o=="number"?`${o}px`:o;const i=document.createElement("div");i.className="drawer-header",i.innerHTML=`
    <h3>${t}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const n=document.createElement("div");if(n.className="drawer-body",n.innerHTML=s,a.appendChild(i),a.appendChild(n),e.length>0){const m=document.createElement("div");m.className="drawer-footer",e.forEach(c=>{const u=document.createElement("button");u.className=`btn ${c.className||"btn-secondary"}`,u.innerHTML=c.label,u.onclick=()=>c.onClick(d),m.appendChild(u)}),a.appendChild(m)}r.appendChild(a),document.body.appendChild(r);function d(){a.style.animation="slideRightOut 0.2s ease forwards",r.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>r.remove(),200)}i.querySelector(".drawer-close").onclick=d,r.addEventListener("mousedown",m=>{m.target===r&&d()})}function Da(t,{id:s}){const e=p.getById("customers",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}He(e.company);const o=p.getAll("jobs").filter(d=>d.customerId===s),l=p.getAll("quotes").filter(d=>d.customerId===s),r=p.getAll("invoices").filter(d=>d.customerId===s);let a="details";function i(){t.innerHTML=`
      ${Ue({title:y(e.company),icon:e.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${y(e.firstName)} ${y(e.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${y(e.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${y(e.phone)}</span>
          <span class="badge ${e.status==="Active"?"badge-success":"badge-neutral"}">${y(e.status)}</span>
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
        <button class="tab ${a==="assets"?"active":""}" data-tab="assets">Assets (${p.getAll("assets").filter(d=>d.ownerType==="Customer"&&d.customerId===s).length})</button>
        <button class="tab ${a==="communications"?"active":""}" data-tab="communications">Communications (${(e.communications||[]).length})</button>
        <button class="tab ${a==="jobs"?"active":""}" data-tab="jobs">Jobs (${o.length})</button>
        <button class="tab ${a==="quotes"?"active":""}" data-tab="quotes">Quotes (${l.length})</button>
        <button class="tab ${a==="invoices"?"active":""}" data-tab="invoices">Invoices (${r.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,n(),t.querySelectorAll(".tab").forEach(d=>{d.addEventListener("click",()=>{a=d.dataset.tab,t.querySelectorAll(".tab").forEach(m=>m.classList.remove("active")),d.classList.add("active"),n()})}),t.querySelector("#btn-edit-person").addEventListener("click",()=>{C.navigate(`/people/${s}/edit`)}),t.querySelector("#btn-delete-person").addEventListener("click",()=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete <strong>${y(e.company)}</strong>? This action cannot be undone.</p>`,ve({title:"Delete Customer",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{p.delete("customers",s),T("Customer deleted successfully","success"),m(),C.navigate("/people")}}]})})}function n(){const d=t.querySelector("#tab-content");if(a==="details")d.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-2">
              <div>
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Le("Company",e.company)}
                  ${Le("Contact",`${e.firstName} ${e.lastName}`)}
                  ${Le("Email",e.email)}
                  ${Le("Phone",e.phone)}
                  ${Le("Type",e.type)}
                  ${Le("Status",e.status)}
                </div>
              </div>
              <div>
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Le("Address",e.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${Le("Created",new Date(e.createdAt).toLocaleDateString())}
                  ${Le("Last Updated",new Date(e.updatedAt).toLocaleDateString())}
                  ${Le("Total Jobs",o.length)}
                  ${Le("Total Quotes",l.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(a==="contacts"){const m=e.contacts||[];d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${m.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${m.map((c,u)=>`
                  <tr>
                    <td class="font-medium">${y(c.name)}</td>
                    <td>${y(c.role||"—")}</td>
                    <td><a href="mailto:${y(c.email)}" class="cell-link">${y(c.email)}</a></td>
                    <td><a href="tel:${y(c.phone)}" class="cell-link">${y(c.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${u}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${m.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,d.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const c=document.createElement("div");c.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,Ce({title:"Add Contact",content:c.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save",className:"btn-primary",onClick:u=>{const b=document.querySelector(".drawer-overlay"),v=b.querySelector("#new-c-name").value.trim();if(!v)return T("Name is required","error");e.contacts||(e.contacts=[]),e.contacts.push({name:v,role:b.querySelector("#new-c-role").value,email:b.querySelector("#new-c-email").value,phone:b.querySelector("#new-c-phone").value}),p.update("customers",s,{contacts:e.contacts}),T("Contact added","success"),n(),i(),u()}}]})}),d.querySelectorAll(".btn-delete-contact").forEach(c=>{c.addEventListener("click",()=>{e.contacts.splice(c.dataset.index,1),p.update("customers",s,{contacts:e.contacts}),T("Contact deleted","success"),n(),i()})})}else if(a==="sites"){const m=e.sites||[];d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${m.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${m.map((c,u)=>`
                  <tr>
                    <td class="font-medium">${y(c.name)}</td>
                    <td>${y(c.address)}</td>
                    <td class="text-secondary">${y(c.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${u}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${m.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,d.querySelector("#btn-toggle-site").addEventListener("click",()=>{const c=document.createElement("div");c.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,Ce({title:"Add Site",content:c.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Save",className:"btn-primary",onClick:u=>{const b=document.querySelector(".drawer-overlay"),v=b.querySelector("#new-s-name").value.trim(),f=b.querySelector("#new-s-address").value.trim();if(!v||!f)return T("Name and Address are required","error");e.sites||(e.sites=[]),e.sites.push({name:v,address:f,notes:b.querySelector("#new-s-notes").value}),p.update("customers",s,{sites:e.sites}),T("Site added","success"),n(),i(),u()}}]})}),d.querySelectorAll(".btn-delete-site").forEach(c=>{c.addEventListener("click",()=>{e.sites.splice(c.dataset.index,1),p.update("customers",s,{sites:e.sites}),T("Site deleted","success"),n(),i()})})}else if(a==="assets"){e.assets&&e.assets.length>0&&(e.assets.forEach(u=>{p.create("assets",{name:u.name,serial:u.serial,site:u.site,installDate:u.installDate,ownerType:"Customer",customerId:s,status:"Active",type:"Equipment"})}),e.assets=[],p.update("customers",s,{assets:[]}));const m=p.getAll("assets").filter(u=>u.ownerType==="Customer"&&u.customerId===s),c=e.sites||[];d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${m.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${m.map((u,b)=>`
                  <tr>
                    <td class="font-medium">${y(u.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${y(u.serial||"—")}</td>
                    <td>${y(u.site||"—")}</td>
                    <td>${u.installDate?new Date(u.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${u.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${m.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,d.querySelector("#btn-toggle-asset").addEventListener("click",()=>{const u=document.createElement("div");u.innerHTML=`
          <div class="form-group"><label class="form-label">Asset Name *</label><input type="text" id="new-a-name" class="form-input" placeholder="e.g. Carrier HVAC Unit"></div>
          <div class="form-group"><label class="form-label">Serial Number</label><input type="text" id="new-a-serial" class="form-input"></div>
          <div class="form-group">
            <label class="form-label">Location / Site</label>
            <select id="new-a-site" class="form-select">
              <option value="">-- No specific site --</option>
              ${c.map(b=>`<option value="${y(b.name)}">${y(b.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Install Date</label><input type="date" id="new-a-date" class="form-input"></div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="new-a-description" class="form-input" rows="2"></textarea>
          </div>
        `,Ce({title:"Add Asset",content:u.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Save",className:"btn-primary",onClick:b=>{const v=document.querySelector(".drawer-overlay"),f=v.querySelector("#new-a-name").value.trim();if(!f)return T("Asset Name is required","error");p.create("assets",{name:f,serial:v.querySelector("#new-a-serial").value,site:v.querySelector("#new-a-site").value,installDate:v.querySelector("#new-a-date").value,description:v.querySelector("#new-a-description").value,ownerType:"Customer",customerId:s,status:"Active",type:"Equipment"}),T("Asset tracking started","success"),n(),i(),b()}}],width:450})}),d.querySelectorAll(".btn-delete-asset").forEach(u=>{u.addEventListener("click",()=>{const b=u.dataset.id;p.delete("assets",b),T("Asset disabled/deleted","success"),n(),i()})})}else if(a==="communications"){const c=[...e.communications||[]].sort((u,b)=>new Date(b.date)-new Date(u.date));d.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${c.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${c.map((u,b)=>`
                  <div style="display:flex;gap:12px;border-bottom:1px solid var(--border-color);padding-bottom:12px">
                    <div style="background:var(--color-${u.type==="Email"?"info":u.type==="Call"?"success":"neutral"}-bg);color:var(--color-${u.type==="Email"?"info":u.type==="Call"?"success":"neutral"});padding:8px;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <span class="material-icons-outlined" style="font-size:20px">${u.type==="Email"?"mail":u.type==="Call"?"phone":"sticky_note_2"}</span>
                    </div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                        <strong style="font-size:var(--font-size-md)">${u.type}</strong>
                        <span style="font-size:var(--font-size-sm);color:var(--text-tertiary)">${new Date(u.date).toLocaleDateString()}</span>
                      </div>
                      <div style="color:var(--text-secondary);white-space:pre-wrap;font-size:var(--font-size-sm)">${u.content}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </div>
      `,d.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const u=document.createElement("div");u.innerHTML=`
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
        `,Ce({title:"Log Activity",content:u.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Save",className:"btn-primary",onClick:b=>{const v=document.querySelector(".drawer-overlay"),f=v.querySelector("#new-comm-content").value.trim();if(!f)return T("Details are required","error");e.communications||(e.communications=[]),e.communications.push({id:Date.now().toString(),type:v.querySelector("#new-comm-type").value,date:v.querySelector("#new-comm-date").value,content:f}),p.update("customers",s,{communications:e.communications}),T("Activity logged","success"),n(),i(),b()}}]})})}else a==="jobs"?d.innerHTML=dt(o,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):a==="quotes"?(d.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${dt(l,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,d.querySelector("#btn-create-quote").addEventListener("click",()=>{C.navigate("/quotes/new?customerId="+s)})):a==="invoices"&&(d.innerHTML=dt(r,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}i()}function Le(t,s){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${y(t)}</span>
      <span style="font-size:var(--font-size-base)">${y(s)}</span>
    </div>
  `}function dt(t,s,e,o){if(t.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${o}</h3></div></div>`;const l=r=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[r]||"neutral"}">${y(r)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${s.map(r=>`<th>${y(r.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${t.map(r=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${e}/${y(r.id)}'">
                ${s.map(a=>{let i=r[a.key];return a.badge?i=l(i):a.format==="currency"?i=`$${(i||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:a.format==="date"?i=i?new Date(i).toLocaleDateString():"—":i=y(i),`<td>${i}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Pt(t,{id:s}){const e=s&&s!=="new",o=e?p.getById("customers",s):{};t.innerHTML=`
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
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>{C.navigate(e?`/people/${s}`:"/people")}),t.querySelector("#btn-save").addEventListener("click",()=>{const l=t.querySelector("#person-form");if(!l.checkValidity()){l.reportValidity();return}const r=new FormData(l),a=Object.fromEntries(r);if(e)p.update("customers",s,a),T("Customer updated successfully","success"),C.navigate(`/people/${s}`);else{const i=p.create("customers",a);T("Customer created successfully","success"),C.navigate(`/people/${i.id}`)}})}function vt(t){const s=p.getAll("leads");t.innerHTML=`
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
  `;let e=[...s];const o={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},l={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},a=Ie({columns:[{key:"title",label:"Lead",render:i=>`<span class="cell-link font-medium">${y(i.title)}</span>`},{key:"customerName",label:"Customer",render:i=>`<span class="text-secondary">${y(i.customerName)}</span>`},{key:"source",label:"Source",render:i=>`<span class="text-secondary">${y(i.source)}</span>`},{key:"status",label:"Status",render:i=>`<span class="badge ${o[i.status]||"badge-neutral"}">${y(i.status)}</span>`},{key:"priority",label:"Priority",render:i=>`<span class="badge ${l[i.priority]||"badge-neutral"}">${y(i.priority)}</span>`},{key:"value",label:"Value",render:i=>`<span class="font-medium">$${(i.value||0).toLocaleString()}</span>`,getValue:i=>i.value},{key:"createdAt",label:"Created",render:i=>`<span class="text-secondary">${new Date(i.createdAt).toLocaleDateString()}</span>`,getValue:i=>new Date(i.createdAt).getTime()}],data:e,onRowClick:i=>C.navigate(`/leads/${i}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:i=>{Te({container:t,selectedIds:i,onClear:()=>a.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:n=>{const d=document.createElement("div");d.innerHTML=`
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
              `,ee(async()=>{const{showModal:m}=await Promise.resolve().then(()=>xe);return{showModal:m}},void 0).then(({showModal:m})=>{m({title:`Update ${n.length} Leads`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Apply",className:"btn-primary",onClick:c=>{const u=d.querySelector("#bulk-status").value;n.forEach(b=>p.update("leads",b,{status:u})),a.clearSelection(),vt(t),ee(async()=>{const{showToast:b}=await Promise.resolve().then(()=>ye);return{showToast:b}},void 0).then(({showToast:b})=>b(`Updated ${n.length} leads to ${u}`,"success")),c()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:n=>{ee(async()=>{const{showModal:d}=await Promise.resolve().then(()=>xe);return{showModal:d}},void 0).then(({showModal:d})=>{const m=document.createElement("div");m.innerHTML=`<p>Are you sure you want to delete ${n.length} leads? This action cannot be undone.</p>`,d({title:"Confirm Bulk Delete",content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Delete",className:"btn-danger",onClick:c=>{n.forEach(u=>p.delete("leads",u)),a.clearSelection(),vt(t),ee(async()=>{const{showToast:u}=await Promise.resolve().then(()=>ye);return{showToast:u}},void 0).then(({showToast:u})=>u(`Deleted ${n.length} leads`,"success")),c()}}]})})}}]})}});t.querySelector("#leads-table-container").appendChild(a),t.querySelector("#btn-new-lead").addEventListener("click",()=>C.navigate("/leads/new")),t.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),i.classList.add("active");const n=i.dataset.filter;e=n==="all"?[...s]:s.filter(d=>d.status===n),a.updateData(e)})}),t.querySelector("#leads-search").addEventListener("input",i=>{const n=i.target.value.toLowerCase();e=s.filter(d=>d.title.toLowerCase().includes(n)||d.customerName.toLowerCase().includes(n)),a.updateData(e)})}function Aa(t,{id:s}){const e=p.getById("leads",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}He(e.title);const o={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"};t.innerHTML=`
    ${Ue({title:e.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
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
            ${ze("Title",e.title)}
            ${ze("Customer",e.customerName)}
            ${ze("Contact",e.contactName)}
            ${ze("Source",e.source)}
            ${ze("Priority",e.priority)}
            ${ze("Status",e.status)}
            ${ze("Estimated Value","$"+(e.value||0).toLocaleString())}
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
  `,t.querySelector("#btn-convert-quote").addEventListener("click",()=>{const l=p.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:e.customerId,customerName:e.customerName,contactName:e.contactName,title:e.title,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0});p.update("leads",s,{status:"Won"}),T("Lead converted to quote successfully","success"),C.navigate(`/quotes/${l.id}`)}),t.querySelector("#btn-edit-lead").addEventListener("click",()=>C.navigate(`/leads/${s}/edit`)),t.querySelector("#btn-delete-lead").addEventListener("click",()=>{const l=document.createElement("div");l.innerHTML=`<p>Delete <strong>${y(e.title)}</strong>?</p>`,ve({title:"Delete Lead",content:l,actions:[{label:"Cancel",className:"btn-secondary",onClick:r=>r()},{label:"Delete",className:"btn-danger",onClick:r=>{p.delete("leads",s),T("Lead deleted","success"),r(),C.navigate("/leads")}}]})})}function ze(t,s){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${t}</span><span>${s}</span></div>`}function Mt(t,{id:s}){const e=s&&s!=="new",o=e?p.getById("leads",s):{},l=p.getAll("customers");t.innerHTML=`
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
                ${l.map(r=>`<option value="${r.id}" ${o.customerId===r.id?"selected":""}>${r.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(r=>`<option ${o.source===r?"selected":""}>${r}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(r=>`<option ${o.status===r?"selected":""}>${r}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(r=>`<option ${o.priority===r?"selected":""}>${r}</option>`).join("")}
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
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>C.navigate(e?`/leads/${s}`:"/leads")),t.querySelector("#btn-save").addEventListener("click",()=>{const r=t.querySelector("#lead-form");if(!r.checkValidity()){r.reportValidity();return}const a=Object.fromEntries(new FormData(r));a.value=parseFloat(a.value)||0;const i=l.find(n=>n.id===a.customerId);if(a.customerName=(i==null?void 0:i.company)||"",a.contactName=i?`${i.firstName} ${i.lastName}`:"",e)p.update("leads",s,a),T("Lead updated","success"),C.navigate(`/leads/${s}`);else{const n=p.create("leads",a);T("Lead created","success"),C.navigate(`/leads/${n.id}`)}})}function _t(t){const s=p.getAll("notifications")||[];s.sort((a,i)=>new Date(i.createdAt)-new Date(a.createdAt)),t.innerHTML=`
    <div class="page-header">
      <h1>Notifications</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-raise-notification">
          <span class="material-icons-outlined">campaign</span> Raise Notification
        </button>
      </div>
    </div>
    
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Title / Job Name</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Raised By</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${s.length?s.map(a=>`
              <tr>
                <td>${a.createdAt?new Date(a.createdAt).toLocaleDateString():"—"}</td>
                <td><span class="badge badge-neutral">${y(a.type||"Field Alert")}</span></td>
                <td>
                  <div style="font-weight:500">${y(a.title)}</div>
                  <div style="font-size:12px;color:var(--text-tertiary);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${y(a.description)}</div>
                </td>
                <td><span class="badge ${a.priority==="Urgent"||a.priority==="High"?"badge-danger":"badge-neutral"}">${y(a.priority||"Normal")}</span></td>
                <td><span class="badge ${a.status==="Converted"?"badge-success":"badge-warning"}">${y(a.status)}</span></td>
                <td>${y(a.createdBy||"System")}</td>
                <td style="text-align:right">
                  ${a.status!=="Converted"?`
                    <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${a.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
                    <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${a.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
                  `:""}
                  <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${a.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
                  <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${a.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
                </td>
              </tr>
            `).join(""):'<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary)">No notifications found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `,t.querySelector("#btn-raise-notification").addEventListener("click",()=>e()),t.querySelectorAll(".btn-view-notification").forEach(a=>{a.addEventListener("click",i=>{const n=i.currentTarget.dataset.id,d=s.find(m=>m.id===n);d&&o(d)})}),t.querySelectorAll(".btn-edit-notification").forEach(a=>{a.addEventListener("click",i=>{const n=i.currentTarget.dataset.id,d=s.find(m=>m.id===n);d&&e(d)})}),t.querySelectorAll(".btn-convert-quote").forEach(a=>{a.addEventListener("click",i=>{const n=i.currentTarget.dataset.id;l(n)})}),t.querySelectorAll(".btn-convert-job").forEach(a=>{a.addEventListener("click",i=>{const n=i.currentTarget.dataset.id;r(n)})});function e(a=null){const i=p.getAll("jobs"),n=JSON.parse(sessionStorage.getItem("currentUser")||"{}");Ce({title:a?"Edit Notification":"Raise Notification",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="notif-type">
              <option value="Field Fault" ${(a==null?void 0:a.type)==="Field Fault"?"selected":""}>Field Fault</option>
              <option value="Client Request" ${(a==null?void 0:a.type)==="Client Request"?"selected":""}>Client Request</option>
              <option value="Safety Hazard" ${(a==null?void 0:a.type)==="Safety Hazard"?"selected":""}>Safety Hazard</option>
              <option value="Recurring Job Due" ${(a==null?void 0:a.type)==="Recurring Job Due"?"selected":""}>Recurring Job Due</option>
              <option value="Other" ${(a==null?void 0:a.type)==="Other"?"selected":""}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Related Job (Optional)</label>
            <select class="form-select" id="notif-job">
              <option value="">-- None --</option>
              ${i.map(d=>`<option value="${d.id}" ${(a==null?void 0:a.jobId)===d.id?"selected":""}>${y(d.number)} - ${y(d.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${y((a==null?void 0:a.title)||"")}" />
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="notif-priority">
              <option value="Low" ${(a==null?void 0:a.priority)==="Low"?"selected":""}>Low</option>
              <option value="Normal" ${!a||(a==null?void 0:a.priority)==="Normal"?"selected":""}>Normal</option>
              <option value="High" ${(a==null?void 0:a.priority)==="High"?"selected":""}>High</option>
              <option value="Urgent" ${(a==null?void 0:a.priority)==="Urgent"?"selected":""}>Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fault / Description <span class="text-danger">*</span></label>
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${y((a==null?void 0:a.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:a?"Save Changes":"Submit Notification",className:"btn-primary",onClick:d=>{const m=document.getElementById("notif-type").value,c=document.getElementById("notif-job").value,u=document.getElementById("notif-title").value.trim(),b=document.getElementById("notif-priority").value,v=document.getElementById("notif-desc").value.trim();if(!u||!v){T("Title and Description are required","error");return}a?(p.update("notifications",a.id,{type:m,jobId:c||null,title:u,priority:b,description:v}),T("Notification updated","success")):(p.create("notifications",{type:m,jobId:c||null,title:u,priority:b,description:v,status:"Pending",createdAt:new Date().toISOString(),createdBy:n.name||"Unknown"}),T("Notification raised successfully","success")),d(),_t(t)}}]})}function o(a){Ce({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${a.status==="Converted"?"badge-success":"badge-warning"}">${y(a.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${y(a.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${y(a.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${y(a.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${y(a.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${a.createdAt?new Date(a.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${a.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${a.jobId}">${y(a.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:a.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:i=>i()},{label:"Edit",className:"btn-secondary",onClick:i=>{i(),e(a)}},{label:"Convert to Quote",className:"btn-secondary",onClick:i=>{i(),l(a.id)}},{label:"Convert to Job",className:"btn-primary",onClick:i=>{i(),r(a.id)}}]:[{label:"Close",className:"btn-secondary",onClick:i=>i()}]})}function l(a){const i=p.getById("notifications",a);if(!i)return;const n=p.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:i.title,description:i.description,priority:i.priority,status:"Draft",notes:`Generated from Notification: ${i.title}

${i.description}`,createdAt:new Date().toISOString()});p.update("notifications",a,{status:"Converted",convertedTo:`Quote ${n.number}`}),T("Converted to Quote successfully","success"),C.navigate(`/quotes/${n.id}`)}function r(a){const i=p.getById("notifications",a);if(!i)return;const n=p.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,title:i.title,description:i.description,priority:i.priority,status:"Pending",notes:`Generated from Notification: ${i.title}

${i.description}`,createdAt:new Date().toISOString()});p.update("notifications",a,{status:"Converted",convertedTo:`Job ${n.number}`}),T("Converted to Job successfully","success"),C.navigate(`/jobs/${n.id}`)}}function yt(t){const s=p.getAll("quotes");t.innerHTML=`
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
  `;let e=[...s];const o={Draft:"badge-neutral",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},r=Ie({columns:[{key:"number",label:"Quote #",render:a=>`<span class="cell-link font-medium">${y(a.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:a=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${y(a.title||"")}</span>`},{key:"status",label:"Status",render:a=>`<span class="badge ${o[a.status]||"badge-neutral"}">${y(a.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:a=>`<span class="font-semibold">$${(a.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:a=>a.total,width:"110px"},{key:"createdAt",label:"Date",render:a=>new Date(a.createdAt).toLocaleDateString(),getValue:a=>new Date(a.createdAt).getTime(),width:"100px"}],data:e,onRowClick:a=>C.navigate(`/quotes/${a}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:a=>{Te({container:t,selectedIds:a,onClear:()=>r.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:i=>{const n=document.createElement("div");n.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              `,ee(async()=>{const{showModal:d}=await Promise.resolve().then(()=>xe);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${i.length} Quotes`,content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Apply",className:"btn-primary",onClick:m=>{const c=n.querySelector("#bulk-status").value;i.forEach(u=>p.update("quotes",u,{status:c})),r.clearSelection(),yt(t),ee(async()=>{const{showToast:u}=await Promise.resolve().then(()=>ye);return{showToast:u}},void 0).then(({showToast:u})=>u(`Updated ${i.length} quotes to ${c}`,"success")),m()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:i=>{ee(async()=>{const{showModal:n}=await Promise.resolve().then(()=>xe);return{showModal:n}},void 0).then(({showModal:n})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${i.length} quotes? This action cannot be undone.</p>`,n({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{i.forEach(c=>p.delete("quotes",c)),r.clearSelection(),yt(t),ee(async()=>{const{showToast:c}=await Promise.resolve().then(()=>ye);return{showToast:c}},void 0).then(({showToast:c})=>c(`Deleted ${i.length} quotes`,"success")),m()}}]})})}}]})}});t.querySelector("#quotes-table-container").appendChild(r),t.querySelector("#btn-new-quote").addEventListener("click",()=>C.navigate("/quotes/new")),t.querySelectorAll(".toolbar-filter").forEach(a=>{a.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(n=>n.classList.remove("active")),a.classList.add("active");const i=a.dataset.filter;e=i==="all"?[...s]:s.filter(n=>n.status===i),r.updateData(e)})}),t.querySelector("#quotes-search").addEventListener("input",a=>{const i=a.target.value.toLowerCase();e=s.filter(n=>n.number.toLowerCase().includes(i)||n.customerName.toLowerCase().includes(i)||(n.title||"").toLowerCase().includes(i)),r.updateData(e)})}function jt({type:t,data:s}){const e=document.createElement("div");e.className="modal-overlay",e.id="print-preview-overlay",e.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const o=document.createElement("div");o.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const l=document.createElement("div");l.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;",l.innerHTML=`
    <span style="font-weight:600;font-size:14px">${t==="quote"?"Quote":"Invoice"} Preview — ${s.number}</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const r=document.createElement("div");r.id="print-document",r.className="print-document",r.innerHTML=kt(t,s),o.appendChild(l),o.appendChild(r),e.appendChild(o),document.body.appendChild(e);const a=()=>e.remove();l.querySelector("#btn-close-preview").addEventListener("click",a),e.addEventListener("click",n=>{n.target===e&&a()}),l.querySelector("#btn-print-pdf").addEventListener("click",()=>{const n=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${s.number} — ${t==="quote"?"Quote":"Invoice"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${qa()}</style>
      </head>
      <body>
        ${kt(t,s)}
      </body>
      </html>
    `,d=`${t==="quote"?"Quote":"Invoice"} ${s.number}`;if(!p.getAll("documents").find(b=>b.entityId===s.id&&b.name===d)){const b=`data:text/html;charset=utf-8,${encodeURIComponent(n)}`;p.create("documents",{name:d,type:t==="quote"?"Quote PDF":"Invoice PDF",size:n.length,url:b,folder:t==="quote"?"Quotes":"Invoices",uploadedAt:new Date().toISOString(),entityType:t==="quote"?"Quote":"Invoice",entityId:s.id,entityName:s.customerName||"Unknown Customer"}),ee(async()=>{const{showToast:v}=await Promise.resolve().then(()=>ye);return{showToast:v}},void 0).then(({showToast:v})=>{v(`${d} saved to Documents`,"success")})}const u=window.open("","_blank","width=800,height=1000");u.document.write(n),u.document.close(),setTimeout(()=>{u.print()},500)});const i=n=>{n.key==="Escape"&&(a(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i)}function kt(t,s){const e=t==="quote",l={Draft:"#6B7280",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[s.status]||"#6B7280",r=s.customerName||"Customer",a=s.contactName||"",i=s.lineItems||[];return`
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
          <div class="pdf-status" style="background:${l}15;color:${l};border:1px solid ${l}40">${s.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${e?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${r}</div>
          ${a?`<div class="pdf-info-value">Attn: ${a}</div>`:""}
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">${e?"Quote Date":"Issue Date"}</span>
            <span class="pdf-info-value">${ct(e?s.createdAt:s.issueDate)}</span>
          </div>
          ${e?`
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
          ${i.map(n=>`
            <tr>
              <td>${n.description?y(n.description):"—"}</td>
              ${e?`
                <td style="text-align:center"><span class="pdf-type-tag">${(n.type||"other").charAt(0).toUpperCase()+(n.type||"other").slice(1)}</span></td>
                <td style="text-align:center">${n.qty||1}</td>
                <td style="text-align:right">$${(n.rate||0).toFixed(2)}</td>
              `:""}
              <td style="text-align:right;font-weight:600">$${(e?n.total||0:n.amount||0).toFixed(2)}</td>
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
          <div class="pdf-notes-text">${y(s.notes).replace(/\n/g,"<br>")}</div>
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
  `}function ct(t){if(!t)return"—";try{return new Date(t).toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}catch{return t}}function qa(){return`
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
  `}function zt(t,{id:s,customerId:e}){const o=s==="new";let l=o?{status:"Draft",version:1,sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:e||""}:p.getById("quotes",s);if(!l){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Quote not found</h3></div>';return}l.lineItems&&!l.sections&&(l.sections=[{id:p.generateId(),name:"Main Phase",lineItems:[...l.lineItems]}],delete l.lineItems),o||He(l.number+(l.version>1?` v${l.version}`:""));const r=p.getAll("customers"),a=p.getAll("stock"),i=p.getSettings(),n={Draft:"badge-neutral",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function d(){t.innerHTML=`
      ${Ue({title:`${o?"New Quote":l.number} ${l.version>1?`<span class="badge badge-neutral">v${l.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:`
          ${l.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${l.customerName}</span>`:""}
          <span class="badge ${n[l.status]||"badge-neutral"}">${l.status}</span>
        `,actionsHtml:`
          ${o?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!o&&l.status!=="Archived"?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!o&&l.status==="Accepted"?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!o&&l.status==="Draft"?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
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
              <select class="form-select" id="quote-customer" ${l.status==="Archived"?"disabled":""}>
                <option value="">Select customer...</option>
                ${r.map(v=>`<option value="${v.id}" ${l.customerId===v.id?"selected":""}>${v.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input class="form-input" id="quote-title" value="${l.title||""}" placeholder="Quote description..." ${l.status==="Archived"?"disabled":""} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="quote-status" ${l.status==="Archived"?"disabled":""}>
                ${["Draft","Sent","Accepted","Declined","Archived"].map(v=>`<option ${l.status===v?"selected":""}>${v}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${l.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${i.laborRates.map(v=>`<option value="${v.id}" ${l.laborProfileId===v.id?"selected":""}>${v.name} ($${v.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input class="form-input" type="date" id="quote-valid" value="${l.validUntil?l.validUntil.split("T")[0]:""}" ${l.status==="Archived"?"disabled":""} />
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${a.map(v=>`<option value="${v.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(l.sections||[]).map((v,f)=>m(v,f)).join("")}
      </div>
      
      ${l.status!=="Archived"?`
      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>`:""}

      <!-- Totals -->
      <div class="card" style="max-width:360px;margin-left:auto;margin-bottom:var(--space-lg)">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
            <span class="text-secondary">Subtotal</span>
            <span id="subtotal">$${(l.subtotal||0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
            <span class="text-secondary">GST (10%)</span>
            <span id="tax">$${(l.tax||0).toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
            <span>Total</span>
            <span id="total">$${(l.total||0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${l.status!=="Archived"?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:""}
    `,b()}function m(v,f){const g=l.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${f}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${v.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${g?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(v.subtotal||0).toFixed(2)}</span>
            ${g?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${f}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${f}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(v.lineItems||[]).map((x,$)=>c(x,f,$,g)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function c(v,f,g,x){return`
      <tr data-sidx="${f}" data-index="${g}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${v.description||""}" data-field="description" placeholder="Type item name..." ${x?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${x?"disabled":""}>
          <option value="labor" ${v.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${v.type==="material"?"selected":""}>Material</option>
          <option value="other" ${v.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${v.qty||1}" data-field="qty" min="1" ${x?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${v.rate||0}" data-field="rate" step="0.01" ${x?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(v.total||0).toFixed(2)}</td>
        <td>${x?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${f}" data-index="${g}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function u(){l.subtotal=0,(l.sections||[]).forEach(v=>{v.subtotal=0,(v.lineItems||[]).forEach(f=>{f.total=(f.qty||0)*(f.rate||0),v.subtotal+=f.total}),l.subtotal+=v.subtotal}),l.tax=l.subtotal*.1,l.total=l.subtotal+l.tax,d()}function b(){var f,g,x,$,j,z,I,_,Q;(f=t.querySelector("#btn-preview-pdf"))==null||f.addEventListener("click",()=>{jt({type:"quote",data:l})});const v=t.querySelector(".dropdown > .btn");v&&(v.addEventListener("click",E=>{E.stopPropagation();const V=v.nextElementSibling;V.style.display=V.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const E=t.querySelector(".dropdown-menu");E&&(E.style.display="none")})),(g=t.querySelector("#btn-create-revision"))==null||g.addEventListener("click",()=>{p.update("quotes",s,{status:"Archived"});const E=JSON.parse(JSON.stringify(l));delete E.id,E.version=(l.version||1)+1,E.status="Draft",E.createdAt=new Date().toISOString();const V=p.create("quotes",E);T(`Revision v${E.version} created`,"success"),C.navigate(`/quotes/${V.id}`)}),(x=t.querySelector("#btn-save-template"))==null||x.addEventListener("click",E=>{E.preventDefault();const V={name:l.title||"Custom Template",sections:JSON.parse(JSON.stringify(l.sections))};p.create("quoteTemplates",V),T("Saved to Quote Templates","success")}),t.querySelectorAll("#quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(E=>{E.addEventListener("change",()=>{const V=E.value;if(E.id==="quote-customer")l.customerId=V;else if(E.id==="quote-title")l.title=V;else if(E.id==="quote-status")l.status=V;else if(E.id==="quote-valid")l.validUntil=V;else if(E.id==="quote-labor-profile"){l.laborProfileId=V;const X=i.laborRates.find(le=>le.id===V);X&&l.sections&&(l.sections.forEach(le=>{le.lineItems.forEach(pe=>{pe.type==="labor"&&(pe.rate=X.rate)})}),u())}})}),($=t.querySelector("#btn-add-section"))==null||$.addEventListener("click",()=>{l.sections.push({id:p.generateId(),name:"New Phase",lineItems:[]}),d()}),t.querySelectorAll(".section-name-input").forEach((E,V)=>{E.addEventListener("change",()=>{l.sections[V].name=E.value})}),t.querySelectorAll(".btn-add-line").forEach(E=>{E.addEventListener("click",V=>{const X=parseInt(E.dataset.sidx);l.sections[X].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),d()})}),t.querySelectorAll(".btn-remove-section").forEach(E=>{E.addEventListener("click",()=>{const V=parseInt(E.dataset.sidx);confirm("Remove this entire phase?")&&(l.sections.splice(V,1),u())})}),t.querySelectorAll(".item-input").forEach(E=>{E.addEventListener("change",V=>{const X=E.closest("tr"),le=parseInt(X.dataset.sidx),pe=parseInt(X.dataset.index),W=E.dataset.field;let ie=E.value;if((W==="qty"||W==="rate")&&(ie=parseFloat(ie)||0),l.sections[le].lineItems[pe][W]=ie,W==="description"){const h=a.find(S=>S.name===ie);if(h){const S=h.category&&h.category.toLowerCase().includes("labor");let w=h.unitPrice||0;S||(w=w*(1+(i.markupPercent||0)/100)),l.sections[le].lineItems[pe].type=S?"labor":"material",l.sections[le].lineItems[pe].rate=w}}u()})}),t.querySelectorAll(".btn-remove-line").forEach(E=>{E.addEventListener("click",()=>{const V=parseInt(E.dataset.sidx),X=parseInt(tr.dataset.index);l.sections[V].lineItems.splice(X,1),u()})}),(j=t.querySelector("#btn-cancel-quote"))==null||j.addEventListener("click",()=>C.navigate("/quotes")),(z=t.querySelector("#btn-save-quote"))==null||z.addEventListener("click",()=>{const E=t.querySelector("#quote-customer").value,V=r.find(X=>X.id===E);if(l.customerId=E,l.customerName=(V==null?void 0:V.company)||"",l.contactName=V?`${V.firstName} ${V.lastName}`:"",l.title=t.querySelector("#quote-title").value,l.status=t.querySelector("#quote-status").value,l.validUntil=t.querySelector("#quote-valid").value,u(),o){const X=p.create("quotes",l);T("Quote created","success"),C.navigate(`/quotes/${X.id}`)}else p.update("quotes",s,l),T("Quote saved","success"),d()}),(I=t.querySelector("#btn-convert-job"))==null||I.addEventListener("click",()=>{const E=p.getAll("technicians"),V=E[Math.floor(Math.random()*E.length)];let X=0,le=0;(l.sections||[]).forEach(ie=>{(ie.lineItems||[]).forEach(h=>{h.type==="labor"&&(X+=h.total),h.type==="material"&&(le+=h.total)})});const pe=l.sections.map(ie=>({id:p.generateId(),name:ie.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),W=p.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:l.customerId,customerName:l.customerName,contactName:l.contactName,title:l.title,type:"Project",status:"Pending",priority:"Medium",technicianId:V==null?void 0:V.id,technicianName:V==null?void 0:V.name,quoteId:s,phases:pe,laborCost:X,materialCost:le});T("Quote converted to project","success"),C.navigate(`/jobs/${W.id}`)}),(_=t.querySelector("#btn-send-quote"))==null||_.addEventListener("click",()=>{l.emailStatus="Sent",l.status==="Draft"&&(l.status="Sent"),p.update("quotes",s,{emailStatus:"Sent",status:l.status}),ee(async()=>{const{showToast:E,addSystemNotification:V}=await Promise.resolve().then(()=>ye);return{showToast:E,addSystemNotification:V}},void 0).then(({showToast:E,addSystemNotification:V})=>{E("Email sent to customer","success"),d(),setTimeout(()=>{const X=p.getById("quotes",s);X&&X.emailStatus==="Sent"&&(X.emailStatus="Opened/Viewed",p.update("quotes",s,{emailStatus:"Opened/Viewed"}),V("Quote Opened",`Quote ${X.number} was opened by ${X.customerName||"the customer"}.`,`/quotes/${s}`),window.location.hash.includes(`/quotes/${s}`)&&(l.emailStatus="Opened/Viewed",d()))},15e3)})}),(Q=t.querySelector("#btn-delete-quote"))==null||Q.addEventListener("click",()=>{const E=document.createElement("div");E.innerHTML=`<p>Delete quote <strong>${y(l.number)}</strong>?</p>`,ve({title:"Delete Quote",content:E,actions:[{label:"Cancel",className:"btn-secondary",onClick:V=>V()},{label:"Delete",className:"btn-danger",onClick:V=>{p.delete("quotes",s),T("Quote deleted","success"),V(),C.navigate("/quotes")}}]})})}d()}function ft(t){const s=p.getAll("jobs");t.innerHTML=`
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
  `;let e=[...s];const o={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},l={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},a=Ie({columns:[{key:"number",label:"Job #",render:i=>`<span class="cell-link font-medium">${y(i.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:i=>`<span class="truncate" style="max-width:200px;display:inline-block">${y(i.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:i=>{if(i.contractorId){const n=p.getById("contractors",i.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${n?y(n.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${i.technicians&&i.technicians.length>0?i.technicians.map(n=>y(n.name)).join(", "):y(i.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:i=>`<span class="badge ${o[i.status]||"badge-neutral"}">${y(i.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:i=>`<span class="badge ${l[i.priority]||"badge-neutral"}">${y(i.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:i=>i.scheduledDate?new Date(i.scheduledDate).toLocaleDateString():"—",getValue:i=>i.scheduledDate?new Date(i.scheduledDate).getTime():0,width:"100px"}],data:e,onRowClick:i=>C.navigate(`/jobs/${i}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:i=>{Te({container:t,selectedIds:i,onClear:()=>a.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:n=>{const d=document.createElement("div");d.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,ee(async()=>{const{showModal:m}=await Promise.resolve().then(()=>xe);return{showModal:m}},void 0).then(({showModal:m})=>{m({title:`Update ${n.length} Jobs`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Apply",className:"btn-primary",onClick:c=>{const u=d.querySelector("#bulk-status").value;n.forEach(b=>p.update("jobs",b,{status:u})),a.clearSelection(),ft(t),ee(async()=>{const{showToast:b}=await Promise.resolve().then(()=>ye);return{showToast:b}},void 0).then(({showToast:b})=>b(`Updated ${n.length} jobs to ${u}`,"success")),c()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:n=>{ee(async()=>{const{showModal:d}=await Promise.resolve().then(()=>xe);return{showModal:d}},void 0).then(({showModal:d})=>{const m=document.createElement("div");m.innerHTML=`<p>Are you sure you want to delete ${n.length} jobs? This cannot be undone.</p>`,d({title:"Confirm Bulk Delete",content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:c=>c()},{label:"Delete",className:"btn-danger",onClick:c=>{n.forEach(u=>p.delete("jobs",u)),a.clearSelection(),ft(t),ee(async()=>{const{showToast:u}=await Promise.resolve().then(()=>ye);return{showToast:u}},void 0).then(({showToast:u})=>u(`Deleted ${n.length} jobs`,"success")),c()}}]})})}}]})}});t.querySelector("#jobs-table-container").appendChild(a),t.querySelector("#btn-new-job").addEventListener("click",()=>C.navigate("/jobs/new")),t.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),i.classList.add("active");const n=i.dataset.filter;n==="all"?e=[...s]:n==="unscheduled"?e=s.filter(d=>!d.scheduledDate):e=s.filter(d=>d.status===n),a.updateData(e)})}),t.querySelector("#jobs-search").addEventListener("input",i=>{const n=i.target.value.toLowerCase();e=s.filter(d=>d.number.toLowerCase().includes(n)||d.title.toLowerCase().includes(n)||d.customerName.toLowerCase().includes(n)||(d.technicianName||"").toLowerCase().includes(n)),a.updateData(e)})}function Na(t,{id:s}){const e=p.getById("jobs",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}He(e.number);const o={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},l={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let r="overview",a=[0],i=[],n=!1,d=null,m=[];function c(){return d||(d=p.getAll("stock").map(f=>`<option value="${f.id}">${y(f.name)} (Qty: ${f.quantity}) - $${f.costPrice||f.unitPrice}</option>`).join("")),d}function u(){(e.laborCost||0)+(e.materialCost||0),t.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${y(e.number)} — ${y(e.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${y(e.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${y(e.technicianName||"Unassigned")}</span>
              <span class="badge ${o[e.status]||"badge-neutral"}">${y(e.status)}</span>
              <span class="badge ${l[e.priority]||"badge-neutral"}">${y(e.priority)}</span>
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
        <button class="tab ${r==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${r==="phases"?"active":""}" data-tab="phases">TaskLists</button>
        <button class="tab ${r==="costs"?"active":""}" data-tab="costs">Costs</button>
        <button class="tab ${r==="quotes"?"active":""}" data-tab="quotes">Quotes</button>
        <button class="tab ${r==="forms"?"active":""}" data-tab="forms">Forms</button>
        <button class="tab ${r==="pos"?"active":""}" data-tab="pos">POs</button>
        <button class="tab ${r==="activity"?"active":""}" data-tab="activity">Activity</button>
        <button class="tab ${r==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>
        <button class="tab ${r==="invoices"?"active":""}" data-tab="invoices">Invoices</button>
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,b(),v()}function b(){var _,Q,E,V,X,le,pe,W,ie,h,S,w,q,U,L,G,ae,B,R;const f=t.querySelector("#tab-content");if((e.laborCost||0)+(e.materialCost||0),r==="overview"){let k=0;if(e.phases&&e.phases.length>0){let H=0,N=0;e.phases.forEach(M=>{const J=(parseFloat(M.estimatedHours)||1)*(parseInt(M.people)||1);H+=J,N+=J*((M.progress||0)/100)}),k=H>0?Math.round(N/H*100):0}const D=e.technicians&&e.technicians.length>0?e.technicians.map(H=>`${y(H.name)} (${H.hours}h)`).join(", "):y(e.technicianName||"Unassigned");f.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Job Information</h4></div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:12px">
                ${ke("Job Number",y(e.number))}
                ${ke("Title",y(e.title))}
                ${ke("Type",y(e.type))}
                ${ke("Status",y(e.status))}
                ${ke("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${k}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${k}%</span></div>`)}
                ${ke("Priority",y(e.priority))}
                ${ke("Customer",y(e.customerName))}
                ${ke("Contact",y(e.contactName||"—"))}
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
                ${ke("Technicians",D)}
                ${ke("Scheduled",e.scheduledDate?new Date(e.scheduledDate).toLocaleDateString():"—")}
                ${ke("Est. Hours",e.estimatedHours||"—")}
                ${ke("Site Address",y(e.siteAddress||"—"))}
                ${ke("Quote Ref",e.quoteId?`<a href="#/quotes/${y(e.quoteId)}">${y(e.quoteId)}</a>`:"—")}
                ${ke("Created",new Date(e.createdAt).toLocaleDateString())}
              </div>
            </div>
          </div>
        </div>
      `,(_=f.querySelector("#btn-add-schedule"))==null||_.addEventListener("click",()=>{const H=p.getAll("technicians"),N=p.getAll("timesheets").filter(me=>me.jobId===s),M=document.createElement("div");function J(me,Y=[],de=[]){let se=[];return me&&me.forEach((ce,re)=>{const fe=[...Y,re].join("-"),ge=[...de,ce.name].join(" > ");se.push({path:fe,name:ge,isLeaf:!ce.subPhases||ce.subPhases.length===0}),ce.subPhases&&(se=se.concat(J(ce.subPhases,[...Y,re],[...de,ce.name])))}),se}const Z=J(e.phases||[]);function O(me){let Y="";return me.forEach((de,se)=>{Y+='<div class="sched-entry" data-index="'+se+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',Y+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',Y+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(se+1)+"</span>",me.length>1&&(Y+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+se+'" style="padding:2px 8px">✕ Remove</button>'),Y+="</div>",Y+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',Y+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',Y+='<select class="form-select sched-task" style="width:100%">',Y+='<option value="">-- Select a Task --</option>',Z.forEach(ce=>{Y+=`<option value="${ce.path}" ${de.taskPath===ce.path?"selected":""}>${y(ce.name)}</option>`}),Y+="</select></div>",Y+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',Y+='<input type="datetime-local" class="form-input sched-start" value="'+de.start+'"></div>',Y+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',Y+='<input type="datetime-local" class="form-input sched-finish" value="'+de.finish+'"></div>',Y+="</div>",Y+='<div class="form-group" style="margin:0"><label class="form-label">Technicians</label>',Y+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',H.forEach(ce=>{const re=de.techIds.includes(ce.id),fe=re?"var(--color-primary)":"var(--border-color)",ge=re?"var(--color-primary-light)":"transparent",Ee=re?"var(--color-primary)":"var(--text-secondary)";Y+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+fe+";border-radius:999px;cursor:pointer;font-size:13px;background:"+ge+";color:"+Ee+';transition:all 0.15s">',Y+='<input type="checkbox" class="tech-check" data-tech-id="'+ce.id+'" '+(re?"checked":"")+' style="display:none">',Y+='<span class="material-icons-outlined" style="font-size:14px">person</span>',Y+=y(ce.name),Y+="</label>"}),Y+="</div></div></div>"}),Y}function P(me){if(!document.getElementById("sched-modal-styles")){const de=document.createElement("style");de.id="sched-modal-styles",de.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(de)}let Y="";N.length>0&&(Y+='<div style="margin-bottom:16px">',Y+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',N.forEach(de=>{const se=new Date(de.startTime||de.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});Y+='<div class="sched-summary-row" style="flex-wrap:wrap">',Y+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',Y+='<span style="font-weight:500">'+y(de.technicianName)+"</span>",Y+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+y(de.taskName||"General Task")+"</span>",Y+='<span style="color:var(--text-tertiary);margin-left:auto">'+se+"</span>",Y+='<span style="font-weight:600;margin-left:12px">'+de.hours+"h</span>",Y+="</div>"}),Y+="</div>",Y+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),Y+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',Y+='<div id="sched-entries">'+O(me)+"</div>",Y+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',Y+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',M.innerHTML=Y,M.querySelectorAll(".tech-check").forEach(de=>{const se=de.closest("label");de.addEventListener("change",()=>{de.checked?(se.style.borderColor="var(--color-primary)",se.style.background="var(--color-primary-light)",se.style.color="var(--color-primary)"):(se.style.borderColor="var(--border-color)",se.style.background="transparent",se.style.color="var(--text-secondary)")})}),M.querySelectorAll(".btn-remove-entry").forEach(de=>{de.addEventListener("click",()=>{me.splice(parseInt(de.dataset.index),1),P(me)})}),M.querySelector("#btn-add-entry").addEventListener("click",()=>{const de=re=>re.toString().padStart(2,"0"),se=new Date;se.setDate(se.getDate()+1);const ce=`${se.getFullYear()}-${de(se.getMonth()+1)}-${de(se.getDate())}`;me.push({taskPath:"",start:`${ce}T08:00`,finish:`${ce}T16:00`,techIds:[]}),P(me)})}const F=me=>me.toString().padStart(2,"0"),A=new Date,K=`${A.getFullYear()}-${F(A.getMonth()+1)}-${F(A.getDate())}`,te=e.technicianId?[e.technicianId]:[],oe=[{taskPath:"",start:`${K}T08:00`,finish:`${K}T16:00`,techIds:te}];P(oe);function be(){const me=[];return M.querySelectorAll(".sched-entry").forEach((Y,de)=>{var ge,Ee,Se;const se=(ge=Y.querySelector(".sched-task"))==null?void 0:ge.value,ce=(Ee=Y.querySelector(".sched-start"))==null?void 0:Ee.value,re=(Se=Y.querySelector(".sched-finish"))==null?void 0:Se.value,fe=[...Y.querySelectorAll(".tech-check:checked")].map(qe=>qe.dataset.techId);me.push({taskPath:se,start:ce,finish:re,techIds:fe})}),me}ve({title:`Schedule Job: ${y(e.title||e.number)}`,content:M,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:me=>me()},{label:"Save Schedule",className:"btn-primary",onClick:me=>{const Y=be();let de=0,se=[];if(Y.forEach((ce,re)=>{var qe;if(!ce.taskPath){se.push(`Entry ${re+1}: please select a task`);return}if(!ce.start||!ce.finish){se.push(`Entry ${re+1}: missing start or finish`);return}const fe=new Date(ce.start),ge=new Date(ce.finish);if(ge<=fe){se.push(`Entry ${re+1}: finish must be after start`);return}if(ce.techIds.length===0){se.push(`Entry ${re+1}: select at least one technician`);return}const Ee=Math.round((ge-fe)/36e5*100)/100,Se=((qe=Z.find(De=>De.path===ce.taskPath))==null?void 0:qe.name)||"Unknown Task";ce.techIds.forEach(De=>{const Je=H.find(rt=>rt.id===De);Je&&(p.create("timesheets",{jobId:s,jobNumber:e.number,taskPath:ce.taskPath,taskName:Se,technicianId:De,technicianName:Je.name,date:ce.start.split("T")[0],startTime:ce.start,finishTime:ce.finish,hours:Ee,status:"Approved"}),de++)})}),se.length){T(se[0],"error");return}if(Y.length>0&&Y[0].start){const re=[...new Set(Y.flatMap(fe=>fe.techIds))].map(fe=>{const ge=H.find(Se=>Se.id===fe),Ee=Y.filter(Se=>Se.techIds.includes(fe)).reduce((Se,qe)=>{const De=(new Date(qe.finish)-new Date(qe.start))/36e5;return Se+(isNaN(De)?0:De)},0);return{id:fe,name:(ge==null?void 0:ge.name)||"",hours:Math.round(Ee*100)/100}});p.update("jobs",s,{scheduledDate:Y[0].start.split("T")[0],technicians:re,technicianName:re.map(fe=>fe.name).join(", ")})}T(`${de} schedule ${de===1?"entry":"entries"} saved`,"success"),me(),b()}}]})})}else if(r==="phases"){let H=function(O,P){let F=O[P[0]];if(!F)return null;for(let A=1;A<P.length;A++)if(!F.subPhases||(F=F.subPhases[P[A]],!F))return null;return F},N=function(O){return!O.subPhases||O.subPhases.length===0?(parseFloat(O.estimatedHours)||0)*(parseInt(O.people)||1):O.subPhases.reduce((P,F)=>P+N(F),0)},M=function(O,P){if(P.length<=1)return;const F=P.slice(0,-1),A=H(O,F);if(A&&A.subPhases&&A.subPhases.length>0){let K=0,te=0;A.subPhases.forEach(oe=>{const be=(parseFloat(oe.estimatedHours)||1)*(parseInt(oe.people)||1);K+=be,te+=be*((oe.progress||0)/100)}),A.progress=K>0?Math.round(te/K*100):0,A.progress===100?A.status="Completed":A.progress>0?A.status="In Progress":A.status="Not Started",M(O,F)}};var g=H,x=N,$=M;const k=JSON.parse(sessionStorage.getItem("currentUser")||"{}");let D=!0;if(k.userTypeId){const O=p.getById("userTypes",k.userTypeId);if(O&&O.permissions){const P=O.permissions.find(F=>F.module==="Jobs");P&&(D=P.edit)}}else(k.role==="customer"||k.role==="technician")&&(D=!1);e.phases||(e.phases=[{id:p.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}]),e.phases.forEach(O=>{O.subPhases||(O.subPhases=[])});let J=!0,Z=e.phases;for(let O=0;O<a.length;O++){if(!Z||!Z[a[O]]){J=!1;break}Z=Z[a[O]].subPhases}J||(a=[]),f.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${D?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${D?'<button class="btn btn-sm btn-primary" id="btn-save-phases"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const O=i.length>0?H(e.phases,i):null,P=O?O.subPhases||[]:e.phases,F=O?y(O.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${i.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${F}">${F}</span>
                    </div>
                    ${D?i.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${i.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${P.map((A,K)=>{const te=[...i,K],oe=te.join("-")===a.join("-");return`
                        <div class="task-list-item" data-path="${te.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${oe?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${oe?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${y(A.name)}">${y(A.name)}</span>
                          ${A.subPhases&&A.subPhases.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${te.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${te.join("-")}" ${A.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${P.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${a.length>0?(()=>{const O=a,P=H(e.phases,O);if(!P)return"";const F=P.subPhases&&P.subPhases.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${n?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${y(P.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${D?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${O.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${D?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${O.join("-")}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${y(P.name)}" ${D?"":"disabled"} />
                  </div>
                  ${F?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${N(P)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${P.startDate?P.startDate.split("T")[0]:""}" ${D?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${P.estimatedHours||""}" min="0" step="0.5" ${D?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${P.people||"1"}" min="1" step="1" ${D?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${P.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${P.progress>50?"#fff":"#000"}">${P.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${D?"":"disabled"}>${y(P.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${y(P.name)}">Info Panel: ${y(P.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${D&&O.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${O.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      <button class="btn btn-sm btn-secondary btn-book-time" data-path="${O.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>
                      ${D?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${y(P.name)}</div>
                  </div>
                  ${F?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${N(P)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${P.startDate?P.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${P.estimatedHours?P.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${P.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${P.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${P.progress>50?"#fff":"#000"}">${P.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${y(P.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(Q=f.querySelector(".btn-view-back"))==null||Q.addEventListener("click",()=>{i.pop(),b()}),f.querySelectorAll(".btn-drill-down").forEach(O=>{O.addEventListener("click",P=>{P.stopPropagation(),i=O.dataset.path.split("-").map(Number),a=[...i],b()})}),f.querySelectorAll(".task-list-checkbox").forEach(O=>{O.addEventListener("change",P=>{const F=P.target.dataset.path.split("-").map(Number),A=H(e.phases,F);A.progress=P.target.checked?100:0,A.status=P.target.checked?"Completed":"Not Started",M(e.phases,F),b()}),O.addEventListener("click",P=>P.stopPropagation())}),f.querySelectorAll(".task-list-item").forEach(O=>{O.addEventListener("click",P=>{if(P.target.closest(".btn-drill-down"))return;a=P.currentTarget.dataset.path.split("-").map(Number),n=!1,b()})}),(E=f.querySelector(".btn-edit-info"))==null||E.addEventListener("click",()=>{n=!0,b()}),(V=f.querySelector(".btn-done-info"))==null||V.addEventListener("click",()=>{n=!1,b()}),(X=f.querySelector("#btn-add-main-task"))==null||X.addEventListener("click",()=>{e.phases||(e.phases=[]),e.phases.push({id:p.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}),a=[e.phases.length-1],b()}),f.querySelectorAll(".btn-add-child-task").forEach(O=>{O.addEventListener("click",P=>{const F=P.currentTarget.dataset.path.split("-").map(Number),A=H(e.phases,F);A.subPhases||(A.subPhases=[]),A.subPhases.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}),a=[...F,A.subPhases.length-1],b()})}),f.querySelectorAll(".detail-input").forEach(O=>{O.addEventListener("change",P=>{const F=H(e.phases,a),A=P.target.dataset.field;A==="progress-check"?(F.progress=P.target.checked?100:0,F.status=P.target.checked?"Completed":"Not Started"):A==="progress"?(F.progress=parseInt(P.target.value),F.progress===100?F.status="Completed":F.progress===0?F.status="Not Started":F.status="In Progress"):A==="estimatedHours"?F.estimatedHours=parseFloat(P.target.value)||0:F[A]=P.target.value,M(e.phases,a),b()})}),f.querySelectorAll(".btn-remove-task").forEach(O=>{O.addEventListener("click",P=>{if(confirm("Delete this task and all its sub-tasks?")){const F=P.currentTarget.dataset.path.split("-").map(Number);if(F.length===1)e.phases.splice(F[0],1);else{const A=F.slice(0,-1);H(e.phases,A).subPhases.splice(F[F.length-1],1),M(e.phases,A)}a=F.slice(0,-1),b()}})}),(le=f.querySelector("#btn-save-phases"))==null||le.addEventListener("click",()=>{p.update("jobs",s,{phases:e.phases}),T("Tasks saved","success")}),(pe=f.querySelector("#btn-save-tasklist-template"))==null||pe.addEventListener("click",()=>{const O=prompt("Enter a name for this Tasklist template:");if(O){let F=function(A){return A.map(K=>({...K,id:p.generateId(),subPhases:K.subPhases?F(K.subPhases):[]}))};var P=F;p.create("tasklistTemplates",{name:O,phases:F(e.phases),createdAt:new Date().toISOString()}),T("Tasklist saved as template","success")}}),f.querySelectorAll(".btn-duplicate-task").forEach(O=>{O.addEventListener("click",P=>{const F=P.currentTarget.dataset.path.split("-").map(Number),A=H(e.phases,F);function K(oe,be){return{...oe,id:p.generateId(),name:oe.name+(be?" (Copy)":""),progress:0,status:"Not Started",subPhases:oe.subPhases?oe.subPhases.map(me=>K(me,!1)):[]}}const te=K(A,!0);if(F.length===1)e.phases.splice(F[0]+1,0,te);else{const oe=F.slice(0,-1);H(e.phases,oe).subPhases.splice(F[F.length-1]+1,0,te),M(e.phases,oe)}b()})}),f.querySelectorAll(".btn-book-time").forEach(O=>{O.addEventListener("click",P=>{const F=P.currentTarget.dataset.path.split("-").map(Number),A=H(e.phases,F),K=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),te=p.getAll("timesheets").filter(re=>re.jobId===s),oe=p.getAll("technicians"),be=new Date,me=re=>re.toString().padStart(2,"0"),Y=`${be.getFullYear()}-${me(be.getMonth()+1)}-${me(be.getDate())}`,de=`${Y}T09:00`,se=`${Y}T10:00`,ce=document.createElement("div");ce.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${te.reduce((re,fe)=>re+(fe.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${te.length?te.map(re=>`
                      <tr>
                        <td>${re.startTime?new Date(re.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(re.date).toLocaleDateString()}</td>
                        <td>${y(re.technicianName)}</td>
                        <td>${y(re.phaseName||"ΓÇö")}</td>
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
                <input type="datetime-local" class="form-input" id="bt-finish" value="${se}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${oe.map(re=>`<option value="${re.id}" ${re.name===K.name?"selected":""}>${re.name}</option>`).join("")}
              </select>
            </div>
            `,Ce({title:"Book Time: "+y(A.name),content:ce.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:re=>re()},{label:"Log Time",className:"btn-primary",onClick:re=>{const fe=document.querySelector(".drawer-overlay"),ge=fe.querySelector("#bt-start").value,Ee=fe.querySelector("#bt-finish").value,Se=fe.querySelector("#bt-tech").value,qe="";if(!ge||!Ee||!Se){T("Please fill all required fields","error");return}const De=new Date(ge),Je=new Date(Ee);if(Je<=De){T("Finish time must be after start time","error");return}const rt=Math.round((Je-De)/36e5*100)/100,Qt=oe.find(Wt=>Wt.id===Se);p.create("timesheets",{jobId:s,jobNumber:e.number,phaseId:A.id,phaseName:A.name,technicianId:Se,technicianName:Qt.name,date:ge.split("T")[0],startTime:ge,finishTime:Ee,description:qe,hours:rt,status:"Approved"}),T("Time booked successfully","success"),b(),re()}}]})})})}else if(r==="costs"){let F=function(){const A=(e.materials||[]).reduce((oe,be)=>oe+be.quantity*(be.unitCost||0),0),K=parseFloat(f.querySelector("#inp-material-cost").value)||0,te=A+K;f.querySelector("#sum-mat").textContent="$"+te.toFixed(2),f.querySelector("#sum-total").textContent="$"+(M+te).toFixed(2)};var j=F;if(!e.materials){const K=p.getAll("quotes").filter(te=>te.jobId===s||e.quoteId===te.id).find(te=>te.status==="Accepted")||p.getById("quotes",e.quoteId);K&&K.sections&&(e.materials=[],K.sections.forEach(te=>{(te.lineItems||[]).forEach(oe=>{if(oe.type==="material"){const be=p.getAll("stock").find(me=>me.name===oe.description);e.materials.push({stockId:be?be.id:null,name:oe.description||"Unknown Material",quantity:oe.qty||1,unitCost:be&&(be.costPrice||be.unitPrice)||0})}})}),p.update("jobs",s,{materials:e.materials}))}e.materials||(e.materials=[]);const k=p.getAll("timesheets").filter(A=>A.jobId===s),D=p.getAll("technicians"),H={};let N=0,M=0;k.forEach(A=>{if(!H[A.technicianId]){const K=D.find(te=>te.id===A.technicianId);H[A.technicianId]={id:A.technicianId,name:A.technicianName||(K?K.name:"Unknown Tech"),hours:0,rate:K&&K.hourlyRate||85}}H[A.technicianId].hours+=A.hours||0});const J=Object.values(H);J.forEach(A=>{N+=A.hours,M+=A.hours*A.rate});const Z=e.materials.reduce((A,K)=>A+K.quantity*(K.unitCost||0),0),O=parseFloat(e.additionalMaterialCost||0),P=Z+O;(e.laborCost!==M||e.estimatedHours!==N||e.materialCost!==P)&&(e.laborCost=M,e.estimatedHours=N,e.materialCost=P,p.update("jobs",s,{laborCost:M,estimatedHours:N,materialCost:P})),f.innerHTML=`
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h4>Technicians & Internal Labor (Auto-Synced)</h4></div>
            <div class="card-body">
              <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                Labor hours are automatically calculated based on timesheets booked against this job's tasks.
              </div>
              <table class="data-table" style="font-size:13px">
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th style="width:80px">Hours</th>
                    <th style="width:80px">Rate</th>
                    <th style="width:100px">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${J.map(A=>`
                    <tr>
                      <td>${y(A.name)}</td>
                      <td style="font-weight:600">${A.hours.toFixed(2)}</td>
                      <td>$${A.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${(A.hours*A.rate).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${J.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet. Book time in the TaskLists tab.</td></tr>':""}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
            <div class="card">
              <div class="card-header"><h4>Material Costs</h4></div>
              <div class="card-body">
                <div id="materials-container" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">
                  ${e.materials.map((A,K)=>`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:4px">
                      <div>
                        <div class="font-medium">${y(A.name)}</div>
                        <div class="text-secondary" style="font-size:12px">${A.quantity} x $${(A.unitCost||0).toFixed(2)}</div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px">
                        <div class="font-medium">$${(A.quantity*(A.unitCost||0)).toFixed(2)}</div>
                        <button class="btn btn-ghost btn-sm btn-icon btn-remove-mat" data-index="${K}"><span class="material-icons-outlined" style="color:var(--color-danger);font-size:16px">delete</span></button>
                      </div>
                    </div>
                  `).join("")}
                  ${e.materials.length===0?'<div class="text-secondary" style="font-size:14px">No materials added.</div>':""}
                </div>
                <div style="display:flex;gap:8px">
                  <select class="form-select" id="mat-select" style="flex:2">
                    <option value="">Select from Stock...</option>
                    ${c()}
                  </select>
                  <input type="number" class="form-input" id="mat-qty" value="1" min="1" style="flex:1" />
                  <button class="btn btn-primary" id="btn-add-material">Add Item</button>
                </div>
                <div class="form-group" style="margin-top:16px;margin-bottom:0">
                  <label class="form-label">Manual Add. Cost ($) (Permits, Travel, etc.)</label>
                  <input type="number" class="form-input" id="inp-material-cost" value="${e.additionalMaterialCost||0}" step="0.01" />
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h4>Job Cost Summary</h4></div>
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Logged Hours</span><span id="sum-hours" class="font-medium">${N.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Labor Cost</span><span id="sum-labor" class="font-medium">$${M.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Material Cost</span><span id="sum-mat" class="font-medium">$${P.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:var(--font-size-lg);font-weight:700">
                  <span>Total Internal Cost</span><span id="sum-total">$${(M+P).toFixed(2)}</span>
                </div>
                ${e.quoteId?(()=>{const A=p.getById("quotes",e.quoteId);if(!A)return"";const K=(A.subtotal||0)-(M+P),te=(A.subtotal||0)>0?K/A.subtotal*100:0;return`
                    <div style="display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid var(--border-color);margin-top:8px">
                      <span class="text-secondary">Quoted Revenue (Ex. Tax)</span><span class="font-medium">$${(A.subtotal||0).toFixed(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:var(--font-size-lg);font-weight:700;color:${K>=0?"var(--color-success)":"var(--color-danger)"}">
                      <span>Est. Profit</span><span>$${K.toFixed(2)} (${te.toFixed(1)}%)</span>
                    </div>
                  `})():""}
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      `,f.addEventListener("click",A=>{const K=A.target.closest(".btn-remove-mat");if(K){const te=parseInt(K.dataset.index);e.materials.splice(te,1),b()}}),(W=f.querySelector("#inp-material-cost"))==null||W.addEventListener("input",F),(ie=f.querySelector("#btn-add-material"))==null||ie.addEventListener("click",()=>{const A=f.querySelector("#mat-select"),K=parseInt(f.querySelector("#mat-qty").value)||1,te=A.value;if(!te)return;const oe=p.getById("stock",te);if(oe){if(oe.quantity<K){T(`Not enough stock. Available: ${oe.quantity}`,"error");return}p.update("stock",te,{quantity:oe.quantity-K}),d=null,e.materials.push({stockId:oe.id,name:oe.name,quantity:K,unitCost:oe.costPrice||oe.unitPrice||0}),T(`Added ${K}x ${oe.name}`,"success"),b()}}),(h=f.querySelector("#btn-save-costs"))==null||h.addEventListener("click",()=>{const A=parseFloat(f.querySelector("#inp-material-cost").value)||0,te=(e.materials||[]).reduce((oe,be)=>oe+be.quantity*(be.unitCost||0),0)+A;e.materialCost=te,e.additionalMaterialCost=A,p.update("jobs",s,{materials:e.materials,materialCost:te,additionalMaterialCost:A}),T("Additional costs saved","success"),b()})}else if(r==="quotes"){const k=p.getAll("quotes").filter(D=>D.jobId===s||e.quoteId===D.id);f.innerHTML=`
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
                ${k.length?k.map(D=>`
                  <tr>
                    <td><a href="#/quotes/${D.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${y(D.number)}</a></td>
                    <td>${y(D.title||"Untitled Quote")}</td>
                    <td><span class="badge ${D.status==="Accepted"?"badge-success":D.status==="Declined"?"badge-danger":D.status==="Sent"?"badge-info":"badge-neutral"}">${y(D.status)}</span></td>
                    <td style="font-weight:600">$${(D.total||0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${D.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(S=f.querySelector("#btn-new-quote"))==null||S.addEventListener("click",()=>{const D=p.create("quotes",{customerId:e.customerId,customerName:e.customerName,title:e.title,jobId:e.id,status:"Draft",version:1,sections:[{id:p.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});T("Draft quote created","success"),C.navigate("/quotes/"+D.id)})}else if(r==="activity")e.activityLog||(e.activityLog=[]),e.activityLog=e.activityLog.map(k=>k.type==="note"||k.type==="attachment"?{id:k.id,type:"combined",date:k.date,content:k.type==="note"?k.content:"",files:k.type==="attachment"?[k.file]:[]}:k),f.innerHTML=`
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
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${m.length?"16px":"0"}">
              ${m.map((k,D)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${y(k.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${D}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join("")}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${e.activityLog.length?e.activityLog.map((k,D)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${k.files&&k.files.length?"attachment":"chat_bubble_outline"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                      <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(k.date).toLocaleString()}</span>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${y(k.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${k.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${y(k.content)}</div>`:""}
                      ${k.files&&k.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${k.files.map(H=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${H.type&&H.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${y(H.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${y(H.name)}">${y(H.name)}</div>
                                 <div class="text-secondary" style="font-size:10px">${(H.size/1024).toFixed(1)} KB</div>
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
      `,setTimeout(()=>{f.querySelectorAll(".activity-log-item").forEach(k=>{const D=k.querySelector(".activity-content-wrapper"),H=k.querySelector(".expand-overlay");D&&D.scrollHeight>200&&(H.style.display="flex",k.style.paddingBottom="32px",H.addEventListener("click",()=>{k.dataset.expanded==="false"?(D.style.maxHeight=D.scrollHeight+"px",H.style.background="transparent",H.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',k.dataset.expanded="true"):(D.style.maxHeight="200px",H.style.background="linear-gradient(transparent, var(--content-bg))",H.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',k.dataset.expanded="false")}))})},0),f.querySelectorAll(".btn-remove-staged").forEach(k=>{k.addEventListener("click",D=>{const H=parseInt(D.currentTarget.dataset.idx);m.splice(H,1),b()})}),(w=f.querySelector("#btn-add-note"))==null||w.addEventListener("click",()=>{const k=f.querySelector("#new-note-input").value.trim();!k&&!m.length||(e.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:k,files:[...m],date:new Date().toISOString()}),p.update("jobs",s,{activityLog:e.activityLog}),m=[],b())}),(q=f.querySelector("#upload-attachment"))==null||q.addEventListener("change",k=>{const D=Array.from(k.target.files);if(!D.length)return;let H=0;D.forEach(N=>{const M=new FileReader;M.onload=J=>{m.push({name:N.name,size:N.size,type:N.type,data:J.target.result}),H++,H===D.length&&b()},M.readAsDataURL(N)})}),f.querySelectorAll(".btn-delete-activity").forEach(k=>{k.addEventListener("click",()=>{e.activityLog=e.activityLog.filter(D=>D.id!==k.dataset.id),p.update("jobs",s,{activityLog:e.activityLog}),b()})});else if(r==="timesheets"){const k=p.getAll("timesheets").filter(N=>N.jobId===s),D=k.reduce((N,M)=>N+(M.hours||0),0),H=p.getAll("technicians");f.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${D} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th></tr></thead>
              <tbody>
                ${k.length?k.map(N=>`
                  <tr>
                    <td>${new Date(N.date).toLocaleDateString()}</td>
                    <td>${y(N.technicianName)}</td>
                    <td class="text-secondary">${y(N.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${N.hours}</td>
                    <td><span class="badge ${N.status==="Approved"?"badge-success":N.status==="Rejected"?"badge-danger":"badge-warning"}">${N.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No time logged yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(U=f.querySelector("#btn-log-time-tab"))==null||U.addEventListener("click",()=>{const N=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),M=new Date,J=P=>P.toString().padStart(2,"0"),Z=`${M.getFullYear()}-${J(M.getMonth()+1)}-${J(M.getDate())}`,O=document.createElement("div");O.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${Z}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech">
                <option value="">Select tech...</option>
                ${H.map(P=>`<option value="${P.id}" ${P.name===N.name?"selected":""}>${P.name}</option>`).join("")}
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
        `,Ce({title:"Log Time",content:O.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:P=>P()},{label:"Save",className:"btn-primary",onClick:P=>{const F=document.querySelector(".drawer-overlay"),A=F.querySelector("#lt-date").value,K=F.querySelector("#lt-tech").value,te=parseFloat(F.querySelector("#lt-hours").value),oe=F.querySelector("#lt-desc").value;if(!A||!K||isNaN(te)){T("Please fill all required fields","error");return}const be=H.find(me=>me.id===K);p.create("timesheets",{jobId:s,jobNumber:e.number,technicianId:K,technicianName:be.name,date:A,hours:te,description:oe,status:"Pending"}),T("Time logged successfully","success"),b(),P()}}]})})}else if(r==="forms")e.forms=e.forms||[],f.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${e.forms.length?e.forms.map(k=>`
                  <tr>
                    <td class="font-medium">${y(k.type)}</td>
                    <td>${new Date(k.date).toLocaleString()}</td>
                    <td>${y(k.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(L=f.querySelector("#btn-add-form"))==null||L.addEventListener("click",()=>{const k=document.createElement("div");k.innerHTML=`
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
          `,Ce({title:"Complete Form",content:k.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:D=>D()},{label:"Submit",className:"btn-primary",onClick:D=>{const H=document.querySelector(".drawer-overlay");e.forms.push({type:H.querySelector("#new-form-type").value,notes:H.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),p.update("jobs",s,{forms:e.forms}),T("Form submitted successfully","success"),b(),D()}}]})});else if(r==="pos"){const k=p.getAll("purchaseOrders").filter(D=>D.jobId===s);f.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${k.length?k.map(D=>`
                  <tr>
                    <td><a href="#/purchase-orders/${y(D.id)}">${y(D.number)}</a></td>
                    <td>${y(D.supplierName||"—")}</td>
                    <td>${D.issueDate?new Date(D.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(D.total||0).toFixed(2)}</td>
                    <td><span class="badge ${D.status==="Received"?"badge-success":D.status==="Draft"?"badge-neutral":D.status==="Cancelled"?"badge-danger":"badge-primary"}">${D.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(G=f.querySelector("#btn-raise-po"))==null||G.addEventListener("click",()=>{p.getAll("suppliers");const D=p.getAll("stock"),H=document.createElement("div");H.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <input type="text" class="form-input" id="po-supplier" placeholder="e.g. Reece Plumbing" />
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${D.map(N=>`<option value="${N.id}">${N.name} - $${N.costPrice||0}</option>`).join("")}
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
        `,Ce({title:"Quick Purchase Order",content:H.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:N=>N()},{label:"Create PO",className:"btn-primary",onClick:N=>{const M=document.querySelector(".drawer-overlay"),J=M.querySelector("#po-supplier").value,Z=M.querySelector("#po-part").value,O=parseInt(M.querySelector("#po-qty").value)||1,P=M.querySelector("#po-date").value;if(!J||!Z){T("Supplier and Part are required","error");return}const F=D.find(A=>A.id===Z);p.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:s,supplierName:J,issueDate:new Date().toISOString(),expectedDate:P,status:"Draft",items:[{stockId:Z,name:F.name,quantity:O,unitCost:F.costPrice||0,total:(F.costPrice||0)*O}],total:(F.costPrice||0)*O}),T("Quick PO Created","success"),b(),N()}}]})})}else if(r==="invoices"){let D=function(N,M,J){const Z=p.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:N,jobId:s,jobNumber:e.number,customerId:e.customerId,customerName:e.customerName,contactName:e.contactName,status:"Draft",lineItems:M,subtotal:J,tax:J*.1,total:J*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+2592e6).toISOString()});p.update("jobs",s,{status:"Invoiced"}),T(`${N} Invoice created`,"success"),C.navigate(`/invoices/${Z.id}`)},H=function(){let N=[],M=0;if(e.quoteId){const J=p.getById("quotes",e.quoteId);J&&J.lineItems&&J.lineItems.length>0&&(N=J.lineItems.map(Z=>({...Z})),M=J.subtotal||J.lineItems.reduce((Z,O)=>Z+(O.total||0),0))}if(N.length===0){const J=e.laborCost||0,Z=e.materialCost||0;N=[{description:`${e.title} - Labor`,type:"labor",qty:1,rate:J,total:J},{description:`${e.title} - Materials`,type:"material",qty:1,rate:Z,total:Z}],M=J+Z}return{lineItems:N,subtotal:M}};var z=D,I=H;const k=p.getAll("invoices").filter(N=>N.jobId===s);f.innerHTML=`
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
                ${k.length?k.map(N=>`
                  <tr>
                    <td><a href="#/invoices/${y(N.id)}">${y(N.number)}</a></td>
                    <td><span class="badge badge-neutral">${y(N.invoiceType||"Standard")}</span></td>
                    <td>${N.issueDate?N.issueDate.split("T")[0]:"—"}</td>
                    <td>${N.dueDate?N.dueDate.split("T")[0]:"—"}</td>
                    <td style="font-weight:600;">$${(N.total||0).toFixed(2)}</td>
                    <td><span class="badge ${N.status==="Paid"?"badge-success":N.status==="Draft"?"badge-neutral":N.status==="Overdue"?"badge-danger":"badge-info"}">${N.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ae=f.querySelector("#btn-create-standard-invoice"))==null||ae.addEventListener("click",()=>{const{lineItems:N,subtotal:M}=H();D("Standard",N,M)}),(B=f.querySelector("#btn-create-deposit-invoice"))==null||B.addEventListener("click",()=>{const N=[{description:`Deposit for Job ${e.number}`,type:"other",qty:1,rate:0,total:0}];D("Deposit",N,0)}),(R=f.querySelector("#btn-create-progress-invoice"))==null||R.addEventListener("click",()=>{const N=document.createElement("div");N.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,ve({title:"Create Progress Invoice",content:N,actions:[{label:"Cancel",className:"btn-secondary",onClick:M=>M()},{label:"Create",className:"btn-primary",onClick:M=>{const J=parseFloat(document.getElementById("progress-percent").value)||0;if(J<=0||J>100){T("Enter a valid percentage (1-100)","error");return}const{subtotal:Z}=H(),O=Z*(J/100),P=[{description:`Progress Payment (${J}% of job)`,type:"other",qty:1,rate:O,total:O}];D("Progress",P,O),M()}}]})})}}function v(){var f,g;t.querySelectorAll(".tab").forEach(x=>{x.addEventListener("click",()=>{r=x.dataset.tab,t.querySelectorAll(".tab").forEach($=>$.classList.remove("active")),x.classList.add("active"),b()})}),(f=t.querySelector("#btn-edit-job"))==null||f.addEventListener("click",()=>C.navigate(`/jobs/${s}/edit`)),(g=t.querySelector("#btn-delete-job"))==null||g.addEventListener("click",()=>{const x=document.createElement("div");x.innerHTML=`<p>Delete job <strong>${y(e.number)}</strong>?</p>`,ve({title:"Delete Job",content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Delete",className:"btn-danger",onClick:$=>{p.delete("jobs",s),T("Job deleted","success"),$(),C.navigate("/jobs")}}]})})}u()}function ke(t,s){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${t}</span><span>${s}</span></div>`}const Pa=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function Ht(t,{id:s}){const e=s&&s!=="new",o=e?p.getById("jobs",s):{},l=p.getAll("customers"),r=p.getAll("contractors").filter(h=>h.active);let a=o.tags?[...o.tags]:[];function i(h){return l.find(S=>S.id===h)||null}function n(h,S){const w=i(h);return!w||!w.sites||w.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+w.sites.map((q,U)=>`<option value="${U}" data-address="${y(q.address)}" data-name="${y(q.name)}" ${S===q.name?"selected":""}>${y(q.name)} — ${y(q.address)}</option>`).join("")}function d(h,S,w){const q=i(h);return!q||!q.contacts||q.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${w}</option>`+q.contacts.map((U,L)=>`<option value="${L}" ${S===U.name?"selected":""}>${y(U.name)} (${y(U.role||"")})</option>`).join("")}function m(){return Pa.map(h=>`<button type="button" class="tag-pill ${a.includes(h)?"tag-pill-active":""}" data-tag="${y(h)}">${y(h)}</button>`).join("")}const c=o.customerId||"";t.innerHTML=`
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
      <h1>${e?"Edit Job":"New Job"}</h1>
      <div class="page-header-actions">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${e?"Update":"Create"} Job</button>
      </div>
    </div>
    <div class="tabs" id="job-form-tabs" style="margin-bottom:16px">
      <button type="button" class="tab active" data-tab="details">Details</button>
      <button type="button" class="tab" data-tab="phases">TaskLists / Phases</button>
    </div>
    
    <div id="jf-tab-details">
      <div class="card">
        <div class="card-body">
          <form id="job-form">

          <!-- Title -->
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input class="form-input" name="title" value="${y(o.title||"")}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${l.map(h=>`<option value="${h.id}" ${o.customerId===h.id?"selected":""}>${y(h.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(h=>`<option ${o.type===h?"selected":""}>${h}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${c?"":"disabled"}>
              ${n(c,o.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${o.siteAddress?y(o.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${c?"":"disabled"}>
                ${d(c,o.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${c?"":"disabled"}>
                ${d(c,o.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(h=>`<option ${o.status===h?"selected":""}>${h}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(h=>`<option ${o.priority===h?"selected":""}>${h}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${r.map(h=>`<option value="${h.id}" ${o.contractorId===h.id?"selected":""}>${y(h.businessName)}</option>`).join("")}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${m()}
            </div>
          </div>

          <!-- Emergency -->
          <div class="form-row">
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="is-emergency" style="width:16px;height:16px" ${o.isEmergency?"checked":""} />
              <label class="form-label" style="margin:0; color:var(--color-danger);" for="is-emergency">Is Emergency (Applies Callout Fee)</label>
            </div>
          </div>
          <div id="emergency-dispatch-suggestion" style="display:none; background:var(--color-warning-bg); border:1px solid var(--color-warning); padding:15px; border-radius:8px; margin-bottom:15px;">
            <strong>Emergency Dispatch Suggestion:</strong>
            <p style="margin:5px 0 0 0;" id="dispatch-reason">Loading best technician...</p>
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
            <div id="job-description-editor" contenteditable="true" spellcheck="true">${o.description||o.notes||""}</div>
          </div>

        </form>
      </div>
        </form>
      </div>
    </div>
  </div>
  
  <div id="jf-tab-phases" style="display:none;">
    <div id="jf-task-container"></div>
  </div>
  `,t.querySelectorAll("#job-form-tabs .tab").forEach(h=>{h.addEventListener("click",S=>{t.querySelectorAll("#job-form-tabs .tab").forEach(q=>q.classList.remove("active")),S.currentTarget.classList.add("active");const w=S.currentTarget.dataset.tab;t.querySelector("#jf-tab-details").style.display=w==="details"?"block":"none",t.querySelector("#jf-tab-phases").style.display=w==="phases"?"block":"none",w==="phases"&&ie()})});const u=t.querySelector("#jf-customer"),b=t.querySelector("#jf-site"),v=t.querySelector("#jf-site-hint"),f=t.querySelector("#jf-primary-contact"),g=t.querySelector("#jf-additional-contact");function x(h){const S=!h;b.innerHTML=n(h,""),b.disabled=S,f.innerHTML=d(h,"","Select primary contact..."),f.disabled=S,g.innerHTML=d(h,"","None"),g.disabled=S,v.textContent=S?"Select a customer to enable jobsite selection":"Select a jobsite above"}u.addEventListener("change",h=>x(h.target.value)),b.addEventListener("change",h=>{const S=h.target.selectedOptions[0];v.textContent=(S==null?void 0:S.dataset.address)||""}),t.querySelector("#jf-tags").addEventListener("click",h=>{const S=h.target.closest(".tag-pill");if(!S)return;const w=S.dataset.tag;a.includes(w)?(a=a.filter(q=>q!==w),S.classList.remove("tag-pill-active")):(a.push(w),S.classList.add("tag-pill-active"))});const $=t.querySelector("#job-description-editor"),j=t.querySelector("#editor-toolbar");j.addEventListener("mousedown",h=>{const S=h.target.closest("button[data-cmd]");if(!S)return;h.preventDefault();const w=S.dataset.cmd,q=S.dataset.val||null;document.execCommand(w,!1,q),$.focus()}),t.querySelector("#editor-link-btn").addEventListener("click",()=>{const h=prompt("Enter URL:","https://");h&&document.execCommand("createLink",!1,h),$.focus()}),$.addEventListener("keyup",z),$.addEventListener("mouseup",z);function z(){j.querySelectorAll("button[data-cmd]").forEach(h=>{try{h.classList.toggle("active",document.queryCommandState(h.dataset.cmd))}catch{}})}const I=t.querySelector("#is-emergency"),_=t.querySelector("#emergency-dispatch-suggestion"),Q=t.querySelector("#dispatch-reason"),E=t.querySelector("#job-priority");function V(h){if(h){E.value="Urgent",_.style.display="block";const S=p.getAll("people").filter(w=>w.type==="Staff");if(S.length>0){const w=S[Math.floor(Math.random()*S.length)],q=Math.floor(Math.random()*15)+5;Q.innerHTML=`Based on current GPS location, <strong>${w.firstName} ${w.lastName}</strong> is the most suitable technician (approx. ${q} mins away).`}else Q.innerHTML="No internal technicians available for dispatch."}else _.style.display="none"}if(I==null||I.addEventListener("change",h=>V(h.target.checked)),o.isEmergency&&V(!0),!e){const h=t.querySelector("#is-recurring"),S=t.querySelector("#recurring-options");h==null||h.addEventListener("change",w=>{S.style.display=w.target.checked?"flex":"none"})}t.querySelector("#btn-cancel").addEventListener("click",()=>C.navigate(e?`/jobs/${s}`:"/jobs"));let X=o.phases?JSON.parse(JSON.stringify(o.phases)):[{id:p.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subPhases:[]}];X.forEach(h=>{h.subPhases||(h.subPhases=[])});let le=[0],pe=[];function W(h,S){let w=h[S[0]];if(!w)return null;for(let q=1;q<S.length;q++)if(!w.subPhases||(w=w.subPhases[S[q]],!w))return null;return w}function ie(){var G,ae;const h=t.querySelector("#jf-task-container");if(!h)return;let S=!0,w=X;for(let B=0;B<le.length;B++){if(!w||!w[le[B]]){S=!1;break}w=w[le[B]].subPhases}S||(le=[]);const q=pe.length>0?W(X,pe):null,U=q?q.subPhases||[]:X,L=q?y(q.name):"Main Tasks";h.innerHTML=`
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
          
          <!-- Drill-Down List -->
          <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
            <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
              <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                ${pe.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${L}">${L}</span>
              </div>
              ${pe.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${pe.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${U.map((B,R)=>{const k=[...pe,R],D=k.join("-")===le.join("-");return`
                  <div class="task-list-item" data-path="${k.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${D?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${D?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${y(B.name)}">${y(B.name)}</span>
                    ${B.subPhases&&B.subPhases.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${k.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${U.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${le.length>0?(()=>{const B=le,R=W(X,B);if(!R)return"";const k=R.subPhases&&R.subPhases.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${y(R.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${B.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${B.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${B.join("-")}"><span class="material-icons-outlined" style="font-size:16px">delete</span></button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${y(R.name)}" />
                </div>
                ${k?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${R.startDate?R.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${R.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${R.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${y(R.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(G=h.querySelector(".btn-view-back"))==null||G.addEventListener("click",()=>{pe.pop(),ie()}),h.querySelectorAll(".btn-drill-down").forEach(B=>{B.addEventListener("click",R=>{R.stopPropagation(),pe=B.dataset.path.split("-").map(Number),le=[...pe],ie()})}),h.querySelectorAll(".task-list-item").forEach(B=>{B.addEventListener("click",()=>{le=B.dataset.path.split("-").map(Number),ie()})}),(ae=h.querySelector("#btn-add-main-task"))==null||ae.addEventListener("click",()=>{X.push({id:p.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}),le=[X.length-1],ie()}),h.querySelectorAll(".btn-add-child-task").forEach(B=>{B.addEventListener("click",()=>{const R=B.dataset.path.split("-").map(Number),k=W(X,R);k&&(k.subPhases||(k.subPhases=[]),k.subPhases.push({id:p.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subPhases:[]}),le=[...R,k.subPhases.length-1],pe=[...R],ie())})}),h.querySelectorAll(".btn-remove-task").forEach(B=>{B.addEventListener("click",()=>{if(!confirm("Are you sure you want to delete this task?"))return;const R=B.dataset.path.split("-").map(Number);if(R.length===1)X.splice(R[0],1),le=X.length>0?[0]:[];else{const k=W(X,R.slice(0,-1));k&&k.subPhases&&(k.subPhases.splice(R[R.length-1],1),le=[...R.slice(0,-1)])}ie()})}),h.querySelectorAll(".detail-input").forEach(B=>{B.addEventListener("input",R=>{const k=R.target.dataset.field,D=R.target.value,H=W(X,le);if(H&&(k==="estimatedHours"?H[k]=parseFloat(D)||0:k==="people"?H[k]=parseInt(D)||1:H[k]=D,k==="name")){const N=h.querySelector(`.task-list-item[data-path="${le.join("-")}"] span:first-child`);N&&(N.textContent=D,N.title=D);const M=h.querySelector("h4[title]");M&&(M.textContent="Task Settings: "+D,M.title=D)}}),B.addEventListener("change",()=>ie())})}t.querySelector("#btn-save").addEventListener("click",()=>{var k,D,H,N;const h=t.querySelector("#job-form");if(!h.checkValidity()){t.querySelectorAll("#job-form-tabs .tab").forEach(M=>M.classList.remove("active")),t.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),t.querySelector("#jf-tab-details").style.display="block",t.querySelector("#jf-tab-phases").style.display="none",h.reportValidity();return}const S=Object.fromEntries(new FormData(h)),w=S.customerId,q=l.find(M=>M.id===w);S.customerName=(q==null?void 0:q.company)||"";const U=b.selectedOptions[0];S.siteAddress=(U==null?void 0:U.dataset.address)||"",S.siteName=(U==null?void 0:U.dataset.name)||"";const L=parseInt(S.primaryContactId),G=parseInt(S.additionalContactId),ae=isNaN(L)?null:(k=q==null?void 0:q.contacts)==null?void 0:k[L],B=isNaN(G)?null:(D=q==null?void 0:q.contacts)==null?void 0:D[G];S.contactName=(ae==null?void 0:ae.name)||(q?`${q.firstName} ${q.lastName}`:""),S.primaryContactName=(ae==null?void 0:ae.name)||"",S.additionalContactName=(B==null?void 0:B.name)||"",delete S.primaryContactId,delete S.additionalContactId,S.tags=a,S.description=$.innerHTML,S.phases=X,S.phases.forEach(M=>{M.subPhases||(M.subPhases=[])}),delete S.notes,S.number=o.number||`J-${Date.now().toString().slice(-6)}`;const R=(H=t.querySelector("#is-emergency"))==null?void 0:H.checked;if(S.isEmergency=R,e?R&&!o.isEmergency?S.laborCost=(o.laborCost||0)+150:!R&&o.isEmergency&&(S.laborCost=Math.max(0,(o.laborCost||0)-150)):(S.technicians=[],S.laborCost=R?150:0,S.materialCost=0,S.estimatedHours=0),(N=t.querySelector("#is-recurring"))!=null&&N.checked){const M=t.querySelector("#recurring-freq").value,J=new Date(t.querySelector("#recurring-start").value),Z=new Date(t.querySelector("#recurring-end").value);if(isNaN(J.getTime())||isNaN(Z.getTime())||J>Z){T("Invalid recurring dates","error");return}S.recurringConfig={freq:M,start:J.toISOString().split("T")[0],end:Z.toISOString().split("T")[0]}}if(e)p.update("jobs",s,S),T("Job updated","success"),C.navigate(`/jobs/${s}`);else{const M=p.create("jobs",S);if(S.recurringConfig){let J=new Date(S.recurringConfig.start);const Z=new Date(S.recurringConfig.end);let O=0;for(;J<=Z&&O<50;)p.create("notifications",{type:"Recurring Job Due",jobId:M.id,title:`Recurring: ${M.title||M.number}`,description:`This recurring job is due on ${J.toISOString().split("T")[0]}`,dueDate:J.toISOString().split("T")[0],status:"Pending",priority:M.priority||"Normal",createdAt:new Date().toISOString()}),S.recurringConfig.freq==="Daily"?J.setDate(J.getDate()+1):S.recurringConfig.freq==="Weekly"?J.setDate(J.getDate()+7):S.recurringConfig.freq==="Monthly"&&J.setMonth(J.getMonth()+1),O++;T(`Job created and ${O} future notifications scheduled`,"success")}else T("Job created","success");C.navigate(`/jobs/${M.id}`)}})}function tt(t){const s=p.getAll("timesheets").sort((a,i)=>new Date(i.date)-new Date(a.date));let e=[...s],o="All";function l(){e=o==="All"?[...s]:s.filter(a=>a.status===o)}function r(){var m;const a=s.filter(c=>c.status==="Pending").reduce((c,u)=>c+(u.hours||0),0),i=s.filter(c=>c.status==="Approved").reduce((c,u)=>c+(u.hours||0),0);t.innerHTML=`
      <div class="page-header">
        <h1>Timesheets & Approval</h1>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-approve-all-pending" ${s.some(c=>c.status==="Pending")?"":"disabled"}>
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
          <div class="stat-value" style="color:var(--color-success)">${i} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
        </div>
      </div>

      <div class="page-toolbar">
        <div class="toolbar-filters">
          <button class="toolbar-filter ${o==="All"?"active":""}" data-status="All">All</button>
          <button class="toolbar-filter ${o==="Pending"?"active":""}" data-status="Pending">Pending</button>
          <button class="toolbar-filter ${o==="Approved"?"active":""}" data-status="Approved">Approved</button>
          <button class="toolbar-filter ${o==="Rejected"?"active":""}" data-status="Rejected">Rejected</button>
        </div>
      </div>

      <div id="timesheets-table-container"></div>
    `;const n=[{key:"date",label:"Date",render:c=>new Date(c.date).toLocaleDateString(),getValue:c=>new Date(c.date).getTime(),width:"110px"},{key:"technicianName",label:"Technician",render:c=>`<span class="font-medium">${y(c.technicianName)}</span>`},{key:"job",label:"Job",render:c=>`<a href="#/jobs/${c.jobId}" class="cell-link">${y(c.jobNumber||c.jobId)}</a>`},{key:"description",label:"Description",render:c=>`<span class="text-secondary truncate" style="max-width:250px;display:inline-block">${y(c.description||"—")}</span>`},{key:"hours",label:"Hours",render:c=>`<span style="font-weight:600">${c.hours}</span>`,getValue:c=>c.hours,width:"80px",align:"right"},{key:"status",label:"Status",render:c=>`<span class="badge ${{Approved:"badge-success",Rejected:"badge-danger",Pending:"badge-warning"}[c.status]||"badge-neutral"}">${y(c.status)}</span>`,width:"100px"}];l();const d=Ie({columns:n,data:e,emptyMessage:"No timesheets found",emptyIcon:"schedule",selectable:!0,onSelectionChange:c=>{Te({container:t,selectedIds:c,onClear:()=>d.clearSelection(),actions:[{label:"Approve Selected",icon:"check_circle",onClick:u=>{u.forEach(b=>p.update("timesheets",b,{status:"Approved"})),d.clearSelection(),tt(t),T(`Approved ${u.length} timesheets`,"success")}},{label:"Reject Selected",icon:"cancel",className:"btn-danger",onClick:u=>{u.forEach(b=>p.update("timesheets",b,{status:"Rejected"})),d.clearSelection(),tt(t),T(`Rejected ${u.length} timesheets`,"warning")}}]})}});t.querySelector("#timesheets-table-container").appendChild(d),t.querySelectorAll(".toolbar-filter").forEach(c=>{c.addEventListener("click",()=>{o=c.dataset.status,r()})}),(m=t.querySelector("#btn-approve-all-pending"))==null||m.addEventListener("click",()=>{const c=s.filter(u=>u.status==="Pending");c.forEach(u=>p.update("timesheets",u.id,{status:"Approved"})),T(`Approved ${c.length} pending timesheets`,"success"),tt(t)})}r()}function Ma(t){const s=p.getAll("technicians"),e=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),o=e.role==="technician";let l="week",r="schedule",a=new Date;const i=Array.from({length:24},(h,S)=>S);let n=null,d=null,m=new Set(o?[e.id]:s.map(h=>h.id)),c=null,u=0,b=0;const v=32,f=v/4;function g(h){return Math.round(h*4)/4}function x(h){const S=Math.floor(h),w=Math.round((h-S)*60);return`${S.toString().padStart(2,"0")}:${w.toString().padStart(2,"0")}`}function $(){const h=document.getElementById("calendar-scroll");h&&(u=h.scrollTop,b=h.scrollLeft)}function j(){const h=document.getElementById("calendar-scroll");h&&(h.scrollTop=u,h.scrollLeft=b)}function z(){c&&(c.remove(),c=null)}document.addEventListener("click",z);function I(){const h=new Date(a);return l==="day"?[new Date(a)]:(h.setDate(h.getDate()-h.getDay()+1),Array.from({length:5},(S,w)=>{const q=new Date(h);return q.setDate(q.getDate()+w),q}))}function _(){const h=p.getAll("jobs"),S=p.getAll("timesheets"),w=[],q=I();S.filter(L=>L.startTime&&L.finishTime).forEach(L=>{const G=h.find(B=>B.id===L.jobId);if(!G||G.status==="Completed"||G.status==="Invoiced")return;const ae=new Date(L.startTime);q.forEach((B,R)=>{if(ae.toDateString()===B.toDateString()){const k=ae.getHours()+ae.getMinutes()/60,D=new Date(L.finishTime),H=D.getHours()+D.getMinutes()/60;w.push({id:L.id,type:"timesheet",jobId:G.id,jobNumber:G.number,customerName:G.customerName,title:G.title,technicianId:L.technicianId,dayIdx:R,startHour:k,endHour:H,status:G.status,priority:G.priority})}})});const U=new Set(S.map(L=>L.jobId));return h.filter(L=>L.scheduledDate&&!U.has(L.id)&&L.status!=="Completed"&&L.status!=="Invoiced").forEach(L=>{const G=new Date(L.scheduledDate);q.forEach((ae,B)=>{if(G.toDateString()===ae.toDateString()){const R=L.startHour!==void 0?L.startHour:7+Math.abs(Q(L.id))%6;if(L.technicians&&L.technicians.length>0)L.technicians.forEach(k=>{const D=k.hours||2;w.push({id:`legacy-${L.id}-${k.id}`,type:"legacy",jobId:L.id,jobNumber:L.number,customerName:L.customerName,title:L.title,technicianId:k.id,dayIdx:B,startHour:R,endHour:R+D,status:L.status,priority:L.priority})});else if(L.technicianId){const k=L.estimatedHours||2;w.push({id:`legacy-${L.id}`,type:"legacy",jobId:L.id,jobNumber:L.number,customerName:L.customerName,title:L.title,technicianId:L.technicianId,dayIdx:B,startHour:R,endHour:R+k,status:L.status,priority:L.priority})}}})}),w}function Q(h){let S=0;for(let w=0;w<h.length;w++)S=(S<<5)-S+h.charCodeAt(w),S|=0;return S}function E(){$();const h=I(),S=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],w=["January","February","March","April","May","June","July","August","September","October","November","December"];if(r==="activity"){ie();return}const q=_(),U=s.filter(L=>m.has(L.id));t.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${w[a.getMonth()]} ${a.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${o?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${e.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${r==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${r==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${l==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${l==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>

      <!-- Calendar Grid + Right Sidebar -->
      <div class="card" style="overflow:hidden">
        <div style="display:flex;height:calc(100vh - 160px);overflow:hidden">
          
          <!-- Calendar -->
          <div style="flex:1;overflow:auto" id="calendar-scroll">
            ${m.size!==1?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${U.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${U.map(L=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${L.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${L.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${h.map((L,G)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${L.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${S[L.getDay()]}, ${L.getDate()} ${w[L.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${U.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${i.map(B=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${B.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${U.map(B=>{const R=q.filter(k=>k.technicianId===B.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${B.id}" data-day="${G}" data-date="${h[G].getFullYear()}-${(h[G].getMonth()+1).toString().padStart(2,"0")}-${h[G].getDate().toString().padStart(2,"0")}">
                          ${i.map(k=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${k}"></div>`).join("")}
                          ${X(R,G,B.color)}
                        </div>
                      `}).join("")}
                  </div>
                `).join("")}
            `:`
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${h.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${h.map(L=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${L.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${S[L.getDay()]} ${L.getDate()} ${w[L.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${h.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${i.map(L=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${L.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${h.map((L,G)=>{const ae=s.find(R=>R.id===[...m][0]),B=q.filter(R=>R.technicianId===ae.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${ae.id}" data-day="${G}" data-date="${h[G].getFullYear()}-${(h[G].getMonth()+1).toString().padStart(2,"0")}-${h[G].getDate().toString().padStart(2,"0")}">
                      ${i.map(R=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${R}"></div>`).join("")}
                      ${X(B,G,ae.color)}
                    </div>
                  `}).join("")}
              </div>
            `}
          </div>

          <!-- Right Sidebar (For Non-Technicians) -->
          ${o?"":`
          <div style="width:280px; border-left:1px solid var(--border-color); display:flex; flex-direction:column; background:var(--card-bg); overflow-y:auto; flex-shrink:0;">
            
            <!-- Visible Technicians Module -->
            <div style="padding:16px; border-bottom:1px solid var(--border-color);">
              <h4 style="font-size:var(--font-size-sm); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <span class="material-icons-outlined" style="font-size:16px;">people</span> Visible Technicians
              </h4>
              <div style="display:flex; flex-direction:column; gap:10px;">
                ${s.map(L=>`
                  <label style="display:flex; align-items:center; gap:8px; font-size:var(--font-size-sm); cursor:pointer;">
                    <input type="checkbox" class="tech-visibility-checkbox" value="${L.id}" ${m.has(L.id)?"checked":""}>
                    <div style="width:10px; height:10px; border-radius:50%; background:${L.color};"></div>
                    <span style="color:var(--text-primary); font-weight:500;">${L.name}</span>
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
                ${V().map(L=>`
                  <div class="unscheduled-job" draggable="true" data-job-id="${L.id}" data-job-number="${L.number}" data-customer="${L.customerName}" data-title="${L.title}" data-hours="${L.estimatedHours||2}" data-priority="${L.priority}" style="padding:10px; background:var(--content-bg); border:1px solid var(--border-color); border-radius:4px; cursor:grab; transition:all 0.2s;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span class="font-medium" style="font-size:var(--font-size-sm)">${L.number}</span>
                      <span class="badge ${L.priority==="High"||L.priority==="Urgent"?"badge-danger":"badge-neutral"}" style="font-size:9px">${L.priority}</span>
                    </div>
                    <div class="text-secondary" style="font-size:var(--font-size-xs); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${L.customerName}</div>
                  </div>
                `).join("")||'<span class="text-secondary" style="font-size:var(--font-size-sm);">All jobs are scheduled</span>'}
              </div>
            </div>
          </div>
          `}

        </div>
      </div>
    `,le(),pe(h),W(),j()}function V(){return p.getAll("jobs").filter(S=>(!S.scheduledDate||!S.technicianId)&&S.status!=="Completed"&&S.status!=="Invoiced")}function X(h,S,w){const q={Urgent:"#EF4444",High:"#F59E0B"};return h.filter(U=>U.dayIdx===S).map(U=>{const L=U.startHour*v,G=Math.max((U.endHour-U.startHour)*v-2,f),ae=q[U.priority]||w,B=`${x(U.startHour)} — ${x(U.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${U.jobId}"
            data-timesheet-id="${U.id}"
            data-block-type="${U.type}"
            data-start="${U.startHour}"
            data-end="${U.endHour}"
            style="
              top:${L}px;
              height:${G}px;
              background:${w}12;
              border-color:${ae};
              color:${w};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:600;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.jobNumber}</div>
            ${G>20?`<div style="pointer-events:none;font-size:10px;opacity:0.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${U.customerName}</div>`:""}
            ${G>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.6;margin-top:2px">${B}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${U.jobId}" data-timesheet-id="${U.id}" data-block-type="${U.type}" data-start="${U.startHour}" data-end="${U.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function le(){var h,S,w;(h=t.querySelector("#btn-prev"))==null||h.addEventListener("click",()=>{a.setDate(a.getDate()-(l==="week"?7:1)),E()}),(S=t.querySelector("#btn-next"))==null||S.addEventListener("click",()=>{a.setDate(a.getDate()+(l==="week"?7:1)),E()}),(w=t.querySelector("#btn-today"))==null||w.addEventListener("click",()=>{a=new Date,E()}),t.querySelectorAll("[data-view]").forEach(q=>{q.addEventListener("click",()=>{l=q.dataset.view,E()})}),t.querySelectorAll("[data-cal]").forEach(q=>{q.addEventListener("click",()=>{r=q.dataset.cal,E()})}),t.querySelectorAll(".tech-visibility-checkbox").forEach(q=>{q.addEventListener("change",U=>{U.target.checked?m.add(U.target.value):m.delete(U.target.value),E()})}),t.querySelectorAll(".schedule-block").forEach(q=>{q.addEventListener("click",U=>{if(U.defaultPrevented)return;if(q.dataset.resized==="true"){q.dataset.resized="false";return}const L=q.dataset.blockJobId,G=p.getById("jobs",L);G&&Ce({title:`Job Quick View: ${G.number}`,content:`
            <div style="display:flex;flex-direction:column;gap:16px;">
              <div>
                <label class="form-label">Title</label>
                <div class="font-medium" style="font-size:16px">${G.title||"Untitled"}</div>
              </div>
              <div>
                <label class="form-label">Customer</label>
                <div>${G.customerName||"N/A"}</div>
              </div>
              <div>
                <label class="form-label">Site Address</label>
                <div>${G.siteAddress||"No address provided"}</div>
              </div>
              <div>
                <label class="form-label">Priority</label>
                <div><span class="badge ${G.priority==="Urgent"||G.priority==="High"?"badge-danger":"badge-neutral"}">${G.priority||"Normal"}</span></div>
              </div>
              <div>
                <label class="form-label">Notes</label>
                <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${G.notes||"No notes available"}</div>
              </div>
            </div>
          `,actions:[{label:"Close",className:"btn-secondary",onClick:ae=>ae()},{label:"Open Full Job",className:"btn-primary",onClick:ae=>{ae(),C.navigate(`/jobs/${L}`)}}],width:450})}),q.addEventListener("contextmenu",U=>{U.preventDefault(),z();const L=q.dataset.blockJobId;c=document.createElement("div"),c.className="dropdown-menu",c.style.position="fixed",c.style.top=`${U.clientY}px`,c.style.left=`${U.clientX}px`,c.style.zIndex=1e3,c.style.background="var(--card-bg)",c.style.boxShadow="var(--shadow-md)",c.style.border="1px solid var(--border-color)",c.style.borderRadius="var(--border-radius)",c.style.padding="4px 0",c.style.minWidth="140px",c.innerHTML=`
          <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
          <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
        `,document.body.appendChild(c),c.querySelector("#ctx-view").addEventListener("click",()=>{z(),C.navigate(`/jobs/${L}`)}),c.querySelector("#ctx-unschedule").addEventListener("click",()=>{z(),jobs.find(ae=>ae.id===L)&&(p.update("jobs",L,{scheduledDate:null}),T("Job unscheduled","success"),E())})})})}function pe(h){const S=document.getElementById("calendar-scroll");S&&(S.addEventListener("dragover",w=>{if(!n)return;const q=S.getBoundingClientRect(),U=60,L=15;w.clientY-q.top<U?S.scrollTop-=L:q.bottom-w.clientY<U&&(S.scrollTop+=L)}),S.addEventListener("wheel",w=>{n&&(S.scrollTop+=w.deltaY)},{passive:!0})),t.querySelectorAll(".unscheduled-job").forEach(w=>{w.addEventListener("dragstart",q=>{const U=w.getBoundingClientRect();n={type:"unscheduled",jobId:w.dataset.jobId,jobNumber:w.dataset.jobNumber,customerName:w.dataset.customer,title:w.dataset.title,hours:parseInt(w.dataset.hours)||2,offsetY:q.clientY-U.top},q.dataTransfer.effectAllowed="move",w.style.opacity="0.5"}),w.addEventListener("dragend",()=>{w.style.opacity="1",n=null,document.querySelectorAll(".schedule-drag-preview").forEach(q=>q.remove())})}),t.querySelectorAll(".schedule-block[draggable]").forEach(w=>{w.addEventListener("dragstart",q=>{q.stopPropagation();const U=w.getBoundingClientRect();n={type:"existing",blockType:w.dataset.blockType,timesheetId:w.dataset.timesheetId,jobId:w.dataset.blockJobId,startHour:parseFloat(w.dataset.start),endHour:parseFloat(w.dataset.end),offsetY:q.clientY-U.top},q.dataTransfer.effectAllowed="move",w.style.opacity="0.4"}),w.addEventListener("dragend",()=>{w.style.opacity="1",n=null,document.querySelectorAll(".schedule-drag-preview").forEach(q=>q.remove())})}),t.querySelectorAll(".schedule-day-col").forEach(w=>{w.addEventListener("dragover",q=>{if(q.preventDefault(),q.dataTransfer.dropEffect="move",w.style.background="rgba(27, 109, 224, 0.05)",!n)return;const U=w.getBoundingClientRect(),L=n.offsetY||0,ae=(q.clientY-L-U.top)/v,B=Math.min(23.75,Math.max(0,g(ae)));let R=w.querySelector(".schedule-drag-preview");R||(R=document.createElement("div"),R.className="schedule-drag-preview",R.style.position="absolute",R.style.left="3px",R.style.right="3px",R.style.background="rgba(27, 109, 224, 0.15)",R.style.border="2px dashed var(--color-primary)",R.style.borderRadius="4px",R.style.pointerEvents="none",R.style.zIndex="10",w.appendChild(R));const k=n.type==="existing"?n.endHour-n.startHour:n.hours||2,D=B*v,H=Math.max(k*v-2,f);R.style.top=D+"px",R.style.height=H+"px"}),w.addEventListener("dragleave",q=>{if(!w.contains(q.relatedTarget)){w.style.background="";const U=w.querySelector(".schedule-drag-preview");U&&U.remove()}}),w.addEventListener("drop",q=>{const U=p.getAll("jobs");q.preventDefault(),w.style.background="";const L=w.querySelector(".schedule-drag-preview");if(L&&L.remove(),!n)return;const G=w.dataset.tech,ae=parseInt(w.dataset.day),B=w.dataset.date?new Date(w.dataset.date+"T12:00:00"):h[ae],R=w.getBoundingClientRect(),k=n.offsetY||0,H=(q.clientY-k-R.top)/v,N=Math.min(23.75,Math.max(0,g(H))),M=s.find(Z=>Z.id===G),J=U.find(Z=>Z.id===n.jobId);if(J){const Z=n.type==="existing"?n.endHour-n.startHour:n.hours||J.estimatedHours||2,O=N+Z;if(_().some(se=>se.technicianId===G&&se.dayIdx===ae&&(n.timesheetId?se.id!==n.timesheetId:se.jobId!==J.id)&&Math.max(se.startHour,N)<Math.min(se.endHour,O))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){n=null;return}const A=se=>se.toString().padStart(2,"0"),K=`${B.getFullYear()}-${A(B.getMonth()+1)}-${A(B.getDate())}`,te=Math.floor(N),oe=Math.round((N-te)*60),be=Math.floor(O),me=Math.round((O-be)*60),Y=`${K}T${A(te)}:${A(oe)}`,de=`${K}T${A(be)}:${A(me)}`;n.type==="existing"&&n.blockType==="timesheet"?(p.update("timesheets",n.timesheetId,{technicianId:G,technicianName:(M==null?void 0:M.name)||"",date:K,startTime:Y,finishTime:de,hours:Z}),T(`Moved ${J.number} for ${M==null?void 0:M.name} to ${K}`,"success")):(p.create("timesheets",{jobId:J.id,jobNumber:J.number,technicianId:G,technicianName:(M==null?void 0:M.name)||"",date:K,startTime:Y,finishTime:de,hours:Z,status:"Approved"}),n.type==="unscheduled"&&p.update("jobs",J.id,{scheduledDate:K,startHour:N,status:J.status==="Pending"?"Scheduled":J.status}),T(`Assigned ${J.number} to ${M==null?void 0:M.name}`,"success"))}n=null,E()})})}function W(){t.querySelectorAll(".schedule-resize-handle").forEach(h=>{h.addEventListener("mousedown",S=>{S.preventDefault(),S.stopPropagation();const w=h.closest(".schedule-block"),q=w.closest(".schedule-day-col"),U=parseFloat(h.dataset.start),L=parseFloat(h.dataset.end);q.getBoundingClientRect(),d={blockType:h.dataset.blockType,timesheetId:h.dataset.timesheetId,jobId:h.dataset.blockJobId,block:w,col:q,startHour:U,endHour:L},w.dataset.resized="false",w.style.opacity="0.85",w.style.userSelect="none",document.body.style.cursor="ns-resize";function G(B){if(!d)return;const R=d.col.getBoundingClientRect(),D=(B.clientY-R.top)/v,H=g(D),N=d.startHour+.25,M=Math.max(H,N);if(M!==d.endHour){d.endHour=M,d.block.dataset.resized="true";const J=Math.max((M-d.startHour)*v-2,f);d.block.style.height=J+"px";const Z=d.block.querySelector(".schedule-block-time");Z&&(Z.textContent=`${x(d.startHour)} — ${x(M)}`)}}function ae(){if(document.removeEventListener("mousemove",G),document.removeEventListener("mouseup",ae),document.body.style.cursor="",!d)return;const{jobId:B,startHour:R,endHour:k}=d,D=k-R;if(d.block.style.opacity="",d.block.style.userSelect="",Math.abs(k-L)>=.25)if(d.blockType==="timesheet"){const H=p.getById("timesheets",d.timesheetId);if(H){const N=H.date||H.startTime.split("T")[0],M=F=>F.toString().padStart(2,"0"),J=Math.floor(R),Z=Math.round((R-J)*60),O=Math.floor(k),P=Math.round((k-O)*60);p.update("timesheets",d.timesheetId,{startTime:`${N}T${M(J)}:${M(Z)}`,finishTime:`${N}T${M(O)}:${M(P)}`,hours:D}),T(`Time updated to ${x(R)} — ${x(k)}`,"success")}}else{const H=p.getAll("jobs").find(N=>N.id===B);if(H){let N=H.technicians||[];N.length>0&&(N=N.map(M=>({...M,hours:D}))),p.update("jobs",B,{startHour:R,estimatedHours:parseFloat(D.toFixed(4)),technicians:N.length>0?N:H.technicians}),T("Job time updated","success")}}d=null}document.addEventListener("mousemove",G),document.addEventListener("mouseup",ae)})})}function ie(){var U;const h=I(),S=["January","February","March","April","May","June","July","August","September","October","November","December"],w=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),q=p.getAll("activities").filter(L=>L.assignedToId===w.id);t.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${S[a.getMonth()]} ${a.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
             <!-- Spacer -->
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${r==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${r==="activity"?"active":""}" data-cal="activity">Activities</button>
          </div>
          <div class="flex gap-xs">
            <button class="toolbar-filter ${l==="day"?"active":""}" data-view="day">Day</button>
            <button class="toolbar-filter ${l==="week"?"active":""}" data-view="week">Week</button>
          </div>
        </div>
      </div>
      <div class="card" style="height:calc(100vh - 160px); display:flex; flex-direction:column;">
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;">My Activities</h3>
          <button class="btn btn-primary btn-sm" id="btn-new-activity">New Activity</button>
        </div>
        <div style="flex:1; overflow-y:auto; padding: 15px;">
          ${h.map(L=>{const G=L.toISOString().split("T")[0],ae=q.filter(B=>B.date===G);return`
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">${L.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"short"})}</h4>
                ${ae.length===0?'<p style="color:var(--text-tertiary); font-size: 13px; margin: 0;">No activities.</p>':`
                  <div style="display:flex; flex-direction:column; gap:8px;">
                    ${ae.map(B=>`
                      <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                          <strong style="color:var(--text-primary);">${y(B.title)}</strong>
                          <span style="font-size:12px; color:var(--text-secondary);">${B.time?y(B.time):""}</span>
                        </div>
                        ${B.linkedTo?`<div style="font-size:12px; color:var(--text-secondary); margin-bottom:5px;">Linked to: ${y(B.linkedTo)}</div>`:""}
                        ${B.notes?`<div style="font-size:13px;">${y(B.notes)}</div>`:""}
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>
            `}).join("")}
        </div>
      </div>
    `,le(),(U=t.querySelector("#btn-new-activity"))==null||U.addEventListener("click",()=>{const L=prompt("Activity Title:");if(!L)return;const G=prompt("Date (YYYY-MM-DD):",new Date().toISOString().split("T")[0]);if(!G)return;const ae=prompt("Time (e.g. 10:00 AM):",""),B=prompt("Linked To (Job/Customer Name):",""),R=prompt("Notes:","");p.create("activities",{title:L,date:G,time:ae,linkedTo:B,notes:R,assignedToId:w.id}),T("Activity added","success"),E()})}E()}function Re(t){var r;const s=p.getAll("stock");t.innerHTML=`
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
  `;let e=[...s];const l=Ie({columns:[{key:"name",label:"Item Name",render:a=>`<span class="cell-link font-medium">${y(a.name)}</span>`},{key:"sku",label:"SKU",render:a=>`<span class="text-secondary" style="font-family:monospace">${y(a.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:a=>`<span class="badge badge-neutral">${y(a.category)}</span>`,width:"110px"},{key:"quantity",label:"Qty",render:a=>{const i=a.quantity<=a.reorderLevel;return`<span style="font-weight:600;color:${i?"var(--color-danger)":"var(--text-primary)"}">${a.quantity}</span>${i?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:a=>a.quantity,width:"100px"},{key:"unitPrice",label:"Unit Price",render:a=>`$${a.unitPrice.toFixed(2)}`,getValue:a=>a.unitPrice,width:"100px"},{key:"location",label:"Location",render:a=>`<span class="text-secondary">${y(a.location)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:a=>`<span class="text-secondary">${y(a.supplier)}</span>`}],data:e,onRowClick:a=>C.navigate(`/stock/${a}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:a=>{Te({container:t,selectedIds:a,onClear:()=>l.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:i=>{const n=[...new Set(p.getAll("stock").map(m=>m.category))],d=document.createElement("div");d.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${n.map(m=>`<option value="${y(m)}">${y(m)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,d.querySelector("#bulk-category").addEventListener("change",m=>{d.querySelector("#new-cat-field").style.display=m.target.value==="NEW"?"block":"none"}),ve({title:`Update ${i.length} Items`,content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Apply",className:"btn-primary",onClick:m=>{let c=d.querySelector("#bulk-category").value;c==="NEW"&&(c=d.querySelector("#bulk-new-category").value.trim()),c&&(i.forEach(u=>p.update("stock",u,{category:c})),l.clearSelection(),Re(t),T(`Updated ${i.length} items to category: ${c}`,"success"),m())}}]})}},{label:"Adjust Price",icon:"payments",onClick:i=>{const n=document.createElement("div");n.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,ve({title:`Adjust Price for ${i.length} Items`,content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const m=parseFloat(n.querySelector("#bulk-price-adjust").value);if(isNaN(m))return;const c=1+m/100;i.forEach(u=>{const b=p.getById("stock",u);b&&p.update("stock",u,{unitPrice:b.unitPrice*c})}),l.clearSelection(),Re(t),T(`Adjusted prices for ${i.length} items by ${m}%`,"success"),d()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:i=>{ve({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${i.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:n=>n()},{label:"Delete",className:"btn-danger",onClick:n=>{i.forEach(d=>p.delete("stock",d)),l.clearSelection(),Re(t),T(`Deleted ${i.length} stock items`,"success"),n()}}]})}}]})}});t.querySelector("#stock-table-container").appendChild(l),t.querySelector("#btn-new-stock").addEventListener("click",()=>{const a=document.createElement("div");a.innerHTML=`
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
          <label class="form-label">Cost Price ($) *</label>
          <input type="number" class="form-input" id="new-stock-cost" step="0.01" />
        </div>
      </div>
    `,Ce({title:"New Stock Item",content:a.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Create",className:"btn-primary",onClick:i=>{const n=document.querySelector(".drawer-overlay"),d=n.querySelector("#new-stock-name").value.trim(),m=n.querySelector("#new-stock-category").value.trim()||"Uncategorized",c=parseFloat(n.querySelector("#new-stock-cost").value);if(!d||isNaN(c)){T("Please fill all required fields correctly","error");return}p.create("stock",{name:d,sku:"SKU-"+Date.now().toString().slice(-6),category:m,quantity:0,unitPrice:c*1.5,costPrice:c,location:"Main Warehouse",supplier:"Unknown"}),T("Stock item created","success"),Re(t),i()}}]})}),(r=t.querySelector("#btn-transfer-stock"))==null||r.addEventListener("click",()=>{const a=p.getAll("stock"),i=p.getAll("technicians");if(a.length===0){T("No stock items available to transfer","error");return}const n=document.createElement("div");n.innerHTML=`
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${a.map(d=>`<option value="${y(d.id)}">${y(d.name)} (Qty: ${d.quantity}) - ${y(d.location)}</option>`).join("")}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">To Location *</label>
            <select class="form-select" id="transfer-to">
              <option value="">Select location...</option>
              <option value="Main Warehouse">Main Warehouse</option>
              ${i.map(d=>`<option value="Vehicle - ${y(d.name)}">Vehicle - ${y(d.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity *</label>
            <input type="number" class="form-input" id="transfer-qty" min="1" value="1" />
          </div>
        </div>
      `,Ce({title:"Transfer Stock",content:n.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Transfer",className:"btn-primary",onClick:d=>{const m=document.querySelector(".drawer-overlay"),c=m.querySelector("#transfer-item").value,u=m.querySelector("#transfer-to").value,b=parseInt(m.querySelector("#transfer-qty").value)||0;if(!c||!u||b<=0){T("Please fill all fields correctly","error");return}const v=p.getById("stock",c);if(v.quantity<b){T("Insufficient quantity available","error");return}if(v.location===u){T("Cannot transfer to the same location","error");return}p.update("stock",v.id,{quantity:v.quantity-b});const f=a.find(g=>g.sku===v.sku&&g.location===u);if(f)p.update("stock",f.id,{quantity:f.quantity+b});else{const g={...v,id:void 0,quantity:b,location:u};p.create("stock",g)}T("Stock transferred successfully","success"),Re(t),d()}}]})}),t.querySelectorAll(".toolbar-filter").forEach(a=>{a.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(n=>n.classList.remove("active")),a.classList.add("active");const i=a.dataset.filter;e=i==="all"?[...s]:s.filter(n=>n.category===i),l.updateData(e)})}),t.querySelector("#stock-search").addEventListener("input",a=>{const i=a.target.value.toLowerCase();e=s.filter(n=>n.name.toLowerCase().includes(i)||n.sku.toLowerCase().includes(i)||n.category.toLowerCase().includes(i)),l.updateData(e)})}function _a(t,{id:s}){const e=p.getById("stock",s);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}He(e.name);const o=e.quantity<=e.reorderLevel,l=e.unitPrice>0?((e.unitPrice-e.costPrice)/e.unitPrice*100).toFixed(1):0;t.innerHTML=`
    ${Ue({title:e.name,icon:"inventory_2",iconBgColor:o?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:o?"var(--color-danger)":"var(--color-success)",metaHtml:`
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
        <div class="stat-value">${l}%</div>
        <div class="text-sm text-secondary">Stock value: $${(e.quantity*e.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h4>Item Details</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Ae("Name",e.name)}
            ${Ae("SKU",e.sku)}
            ${Ae("Category",e.category)}
            ${Ae("Unit",e.unit)}
            ${Ae("Supplier",e.supplier)}
            ${Ae("Location",e.location)}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Pricing</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${Ae("Cost Price",`$${e.costPrice.toFixed(2)}`)}
            ${Ae("Sell Price",`$${e.unitPrice.toFixed(2)}`)}
            ${Ae("Margin",`${l}%`)}
            ${Ae("Total Value",`$${(e.quantity*e.unitPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,t.querySelector("#btn-edit-stock").addEventListener("click",()=>C.navigate(`/stock/${s}/edit`)),t.querySelector("#btn-delete-stock").addEventListener("click",()=>{const r=document.createElement("div");r.innerHTML=`<p>Delete <strong>${y(e.name)}</strong>?</p>`,ve({title:"Delete Stock Item",content:r,actions:[{label:"Cancel",className:"btn-secondary",onClick:a=>a()},{label:"Delete",className:"btn-danger",onClick:a=>{p.delete("stock",s),T("Item deleted","success"),a(),C.navigate("/stock")}}]})})}function Ae(t,s){return`<div style="display:flex;gap:8px"><span style="width:100px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${t}</span><span>${s}</span></div>`}function Ot(t,{id:s}){const e=s&&s!=="new",o=e?p.getById("stock",s):{},l=p.getAll("assets");t.innerHTML=`
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
                ${["Electrical","Plumbing","HVAC","Fire Safety","Security","General"].map(r=>`<option ${o.category===r?"selected":""}>${r}</option>`).join("")}
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
              ${["Warehouse A","Warehouse B","On Order"].map(r=>`<option ${o.location===r?"selected":""}>${r}</option>`).join("")}
              <optgroup label="Assets">
                ${l.map(r=>`<option value="${r.name}" ${o.location===r.name?"selected":""}>${r.name}</option>`).join("")}
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
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>C.navigate(e?`/stock/${s}`:"/stock")),t.querySelector("#btn-save").addEventListener("click",()=>{const r=t.querySelector("#stock-form");if(!r.checkValidity()){r.reportValidity();return}const a=Object.fromEntries(new FormData(r));if(a.quantity=parseInt(a.quantity)||0,a.costPrice=parseFloat(a.costPrice)||0,a.unitPrice=parseFloat(a.unitPrice)||0,a.reorderLevel=parseInt(a.reorderLevel)||10,e)p.update("stock",s,a),T("Item updated","success"),Ct(a),C.navigate(`/stock/${s}`);else{a.sku=a.sku||`SKU-${Date.now().toString().slice(-4)}`;const i=p.create("stock",a);T("Item created","success"),Ct(a),C.navigate(`/stock/${i.id}`)}})}function Ct(t){if(t.quantity<=t.reorderLevel){const s=JSON.parse(sessionStorage.getItem("currentUser")||"{}");let e=!1;if(s.role==="admin")e=!0;else if(s.userTypeId){const o=p.getById("userTypes",s.userTypeId);if(o&&o.permissions){const l=o.permissions.find(r=>r.module==="Stock");l&&(e=l.edit||l.create)}}e&&(ee(async()=>{const{showToast:o}=await Promise.resolve().then(()=>ye);return{showToast:o}},void 0).then(({showToast:o})=>{o(`Auto-Reorder Alert: ${t.name} is at or below its reorder level (${t.quantity} left).`,"warning")}),p.create("notifications",{title:"Stock Auto-Reorder",message:`${t.name} (SKU: ${t.sku}) has reached its reorder level. Current quantity: ${t.quantity}. Please reorder from ${t.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function at(t){const s=p.getAll("invoices");t.innerHTML=`
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
  `;let e=[...s];const o={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},r=Ie({columns:[{key:"number",label:"Invoice #",render:n=>`<span class="cell-link font-medium">${y(n.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:n=>n.jobNumber?`<span class="text-secondary">${y(n.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:n=>`<span class="badge ${o[n.status]||"badge-neutral"}">${y(n.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:n=>`<span class="font-semibold">$${(n.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:n=>n.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:n=>n.issueDate?new Date(n.issueDate).toLocaleDateString():"—",getValue:n=>n.issueDate?new Date(n.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:n=>n.dueDate?new Date(n.dueDate).toLocaleDateString():"—",getValue:n=>n.dueDate?new Date(n.dueDate).getTime():0,width:"100px"}],data:e,onRowClick:n=>C.navigate(`/invoices/${n}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:n=>{Te({container:t,selectedIds:n,onClear:()=>r.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:d=>{d.forEach(m=>p.update("invoices",m,{status:"Paid",datePaid:new Date().toISOString()})),r.clearSelection(),at(t),ee(async()=>{const{showToast:m}=await Promise.resolve().then(()=>ye);return{showToast:m}},void 0).then(({showToast:m})=>m(`Marked ${d.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:d=>{const m=document.createElement("div");m.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,ee(async()=>{const{showModal:c}=await Promise.resolve().then(()=>xe);return{showModal:c}},void 0).then(({showModal:c})=>{c({title:`Update ${d.length} Invoices`,content:m,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{const b=m.querySelector("#bulk-status").value;d.forEach(v=>p.update("invoices",v,{status:b})),r.clearSelection(),at(t),ee(async()=>{const{showToast:v}=await Promise.resolve().then(()=>ye);return{showToast:v}},void 0).then(({showToast:v})=>v(`Updated ${d.length} invoices to ${b}`,"success")),u()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:d=>{ee(async()=>{const{showToast:m}=await Promise.resolve().then(()=>ye);return{showToast:m}},void 0).then(({showToast:m})=>m(`Sending reminders for ${d.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{ee(async()=>{const{showModal:m}=await Promise.resolve().then(()=>xe);return{showModal:m}},void 0).then(({showModal:m})=>{const c=document.createElement("div");c.innerHTML=`<p>Are you sure you want to delete ${d.length} invoices? This action cannot be undone.</p>`,m({title:"Confirm Bulk Delete",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Delete",className:"btn-danger",onClick:u=>{d.forEach(b=>p.delete("invoices",b)),r.clearSelection(),at(t),ee(async()=>{const{showToast:b}=await Promise.resolve().then(()=>ye);return{showToast:b}},void 0).then(({showToast:b})=>b(`Deleted ${d.length} invoices`,"success")),u()}}]})})}}]})}});t.querySelector("#invoices-table-container").appendChild(r),t.querySelector("#btn-new-invoice").addEventListener("click",()=>C.navigate("/invoices/new"));const a=t.querySelector("#btn-export-accounting");function i(n){n.some(d=>d.status==="Paid")?a.style.display="inline-flex":a.style.display="none"}i(e),t.querySelectorAll(".toolbar-filter").forEach(n=>{n.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(m=>m.classList.remove("active")),n.classList.add("active");const d=n.dataset.filter;e=d==="all"?[...s]:s.filter(m=>m.status===d),r.updateData(e),i(e)})}),a.addEventListener("click",()=>{const n=e.filter(u=>u.status==="Paid");if(n.length===0)return;let d="data:text/csv;charset=utf-8,";d+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,n.forEach(u=>{const b=[u.number,`"${u.customerName.replace(/"/g,'""')}"`,u.email||"",u.issueDate?u.issueDate.split("T")[0]:"",u.dueDate?u.dueDate.split("T")[0]:"",(u.total||0).toFixed(2),(u.tax||0).toFixed(2),"200"].join(",");d+=b+`
`});const m=encodeURI(d),c=document.createElement("a");c.setAttribute("href",m),c.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(c),c.click(),document.body.removeChild(c),ee(async()=>{const{showToast:u}=await Promise.resolve().then(()=>ye);return{showToast:u}},void 0).then(({showToast:u})=>{u(`Exported ${n.length} paid invoices`,"success")})}),t.querySelector("#invoices-search").addEventListener("input",n=>{const d=n.target.value.toLowerCase();e=s.filter(m=>m.number.toLowerCase().includes(d)||m.customerName.toLowerCase().includes(d)||(m.jobNumber||"").toLowerCase().includes(d)),r.updateData(e),i(e)})}function Rt(t,{id:s}){const e=s==="new";let o=e?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",lineItems:[],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:p.getById("invoices",s);if(!o){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}e||He(o.number);const l=p.getAll("customers"),r=p.getAll("stock"),a=p.getSettings(),i={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function n(){t.innerHTML=`
      ${Ue({title:`
          ${e?"New Invoice":o.number}
          ${o.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':o.invoiceType&&o.invoiceType!=="Standard"?`<span class="badge badge-primary">${o.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${o.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${o.customerName}</span>`:""}
          ${o.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${o.jobNumber}</span>`:""}
          <span class="badge ${i[o.status]||"badge-neutral"}">${o.status}</span>
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
                ${l.map(u=>`<option value="${u.id}" ${o.customerId===u.id?"selected":""}>${u.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(u=>`<option ${o.invoiceType===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inv-status">
                ${["Draft","Sent","Paid","Overdue","Void"].map(u=>`<option ${o.status===u?"selected":""}>${u}</option>`).join("")}
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
        ${r.map(u=>`<option value="${u.name}"></option>`).join("")}
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
              ${(o.lineItems||[]).map((u,b)=>d(u,b)).join("")}
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
    `,c()}function d(u,b){return`
      <tr data-index="${b}">
        <td><input class="form-input" list="stock-items-list" style="padding:4px 8px" value="${u.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select" style="padding:4px 8px" data-field="type">
          <option value="labor" ${u.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${u.type==="material"?"selected":""}>Material</option>
          <option value="other" ${u.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input" style="padding:4px 8px" type="number" value="${u.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input" style="padding:4px 8px" type="number" value="${u.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600">$${(u.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm" data-remove="${b}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function m(){const u=o.lineItems||[];u.forEach(x=>{x.total=(x.qty||0)*(x.rate||0)});let b=u.reduce((x,$)=>x+Math.abs($.total||0),0);o.invoiceType==="CreditNote"?b=-Math.abs(b):b=Math.abs(b),o.subtotal=b,o.tax=b*.1,o.total=b+o.tax;const v=t.querySelector("#inv-subtotal"),f=t.querySelector("#inv-tax"),g=t.querySelector("#inv-total");v&&(v.textContent=`$${o.subtotal.toFixed(2)}`),f&&(f.textContent=`$${o.tax.toFixed(2)}`),g&&(g.textContent=`$${o.total.toFixed(2)}`)}function c(){var u,b,v,f,g,x,$,j,z;(u=t.querySelector("#btn-preview-pdf"))==null||u.addEventListener("click",()=>{jt({type:"invoice",data:o})}),(b=t.querySelector("#btn-add-line"))==null||b.addEventListener("click",()=>{o.lineItems||(o.lineItems=[]),o.lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),n()}),t.querySelectorAll("#line-items-table input, #line-items-table select").forEach(I=>{I.addEventListener("input",()=>{const _=I.closest("tr"),Q=parseInt(_.dataset.index),E=I.dataset.field;let V=I.value;if((E==="qty"||E==="rate")&&(V=parseFloat(V)||0),o.lineItems[Q][E]=V,E==="description"){const le=r.find(pe=>pe.name===V);if(le){const pe=le.category&&le.category.toLowerCase().includes("labor");let W=le.unitPrice||0;pe||(W=W*(1+(a.markupPercent||0)/100)),o.lineItems[Q].type=pe?"labor":"material",o.lineItems[Q].rate=W;const ie=_.querySelector('[data-field="type"]'),h=_.querySelector('[data-field="rate"]');ie&&(ie.value=o.lineItems[Q].type),h&&(h.value=W.toFixed(2))}}m();const X=_.querySelector("td:nth-child(5)");X&&(X.textContent=`$${(o.lineItems[Q].total||0).toFixed(2)}`)})}),t.querySelectorAll("[data-remove]").forEach(I=>{I.addEventListener("click",()=>{o.lineItems.splice(parseInt(I.dataset.remove),1),n()})}),(v=t.querySelector("#inv-type"))==null||v.addEventListener("change",I=>{o.invoiceType=I.target.value,m()}),(f=t.querySelector("#btn-cancel-inv"))==null||f.addEventListener("click",()=>C.navigate("/invoices")),(g=t.querySelector("#btn-save-inv"))==null||g.addEventListener("click",()=>{var Q;const I=t.querySelector("#inv-customer").value,_=l.find(E=>E.id===I);if(o.customerId=I,o.customerName=(_==null?void 0:_.company)||"",o.contactName=_?`${_.firstName} ${_.lastName}`:"",o.invoiceType=((Q=t.querySelector("#inv-type"))==null?void 0:Q.value)||"Standard",o.status=t.querySelector("#inv-status").value,o.issueDate=t.querySelector("#inv-issue").value,o.dueDate=t.querySelector("#inv-due").value,m(),e){const E=p.create("invoices",o);T("Invoice created","success"),C.navigate(`/invoices/${E.id}`)}else p.update("invoices",s,o),T("Invoice saved","success")}),(x=t.querySelector("#btn-send-invoice"))==null||x.addEventListener("click",()=>{p.update("invoices",s,{status:"Sent"}),o.status="Sent",T("Invoice sent","success"),n()}),($=t.querySelector("#btn-send-reminder"))==null||$.addEventListener("click",()=>{o.lastReminderDate=new Date().toISOString(),p.update("invoices",s,{lastReminderDate:o.lastReminderDate}),T("Payment reminder sent","success")}),(j=t.querySelector("#btn-mark-paid"))==null||j.addEventListener("click",()=>{const I=document.createElement("div");I.innerHTML=`
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
      `,Ce({title:"Mark Invoice as Paid",content:I.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Confirm Payment",className:"btn-primary",onClick:_=>{const Q=document.querySelector(".drawer-overlay"),E=Q.querySelector("#paid-date").value,V=Q.querySelector("#paid-method").value;p.update("invoices",s,{status:"Paid",paidDate:E,paymentMethod:V}),o.status="Paid",o.paidDate=E,o.paymentMethod=V,T("Invoice marked as paid","success"),n(),_()}}],width:350})}),(z=t.querySelector("#btn-delete-invoice"))==null||z.addEventListener("click",()=>{const I=document.createElement("div");I.innerHTML=`<p>Delete invoice <strong>${y(o.number)}</strong>?</p>`,ve({title:"Delete Invoice",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Delete",className:"btn-danger",onClick:_=>{p.delete("invoices",s),T("Invoice deleted","success"),_(),C.navigate("/invoices")}}]})})}n()}function st(t){const s=p.getAll("purchaseOrders");t.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${s.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(r=>`<button class="toolbar-filter" data-filter="${r}">${r}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let e=[...s];const l=Ie({columns:[{key:"number",label:"PO Number",render:r=>`<span class="cell-link font-medium">${y(r.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:r=>`<span class="text-secondary">${y(r.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:r=>r.jobId?`<a href="#/jobs/${r.jobId}" class="cell-link">${y(r.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:r=>r.issueDate?new Date(r.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:r=>`$${(r.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:r=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[r.status]||"badge-neutral"}">${y(r.status)}</span>`,width:"110px"}],data:e,onRowClick:r=>C.navigate(`/purchase-orders/${r}`),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:r=>{Te({container:t,selectedIds:r,onClear:()=>l.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:a=>{a.forEach(i=>p.update("purchaseOrders",i,{status:"Received",receivedDate:new Date().toISOString()})),l.clearSelection(),st(t),ee(async()=>{const{showToast:i}=await Promise.resolve().then(()=>ye);return{showToast:i}},void 0).then(({showToast:i})=>i(`Marked ${a.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:a=>{const i=document.createElement("div");i.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,ee(async()=>{const{showModal:n}=await Promise.resolve().then(()=>xe);return{showModal:n}},void 0).then(({showModal:n})=>{n({title:`Update ${a.length} Purchase Orders`,content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const m=i.querySelector("#bulk-status").value;a.forEach(c=>p.update("purchaseOrders",c,{status:m})),l.clearSelection(),st(t),ee(async()=>{const{showToast:c}=await Promise.resolve().then(()=>ye);return{showToast:c}},void 0).then(({showToast:c})=>c(`Updated ${a.length} POs to ${m}`,"success")),d()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:a=>{ee(async()=>{const{showModal:i}=await Promise.resolve().then(()=>xe);return{showModal:i}},void 0).then(({showModal:i})=>{const n=document.createElement("div");n.innerHTML=`<p>Are you sure you want to delete ${a.length} purchase orders? This action cannot be undone.</p>`,i({title:"Confirm Bulk Delete",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{a.forEach(m=>p.delete("purchaseOrders",m)),l.clearSelection(),st(t),ee(async()=>{const{showToast:m}=await Promise.resolve().then(()=>ye);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${a.length} purchase orders`,"success")),d()}}]})})}}]})}});t.querySelector("#po-table-container").appendChild(l),t.querySelector("#btn-new-po").addEventListener("click",()=>C.navigate("/purchase-orders/new")),t.querySelectorAll(".toolbar-filter").forEach(r=>{r.addEventListener("click",()=>{t.querySelectorAll(".toolbar-filter").forEach(i=>i.classList.remove("active")),r.classList.add("active");const a=r.dataset.filter;e=a==="all"?[...s]:s.filter(i=>i.status===a),l.updateData(e)})}),t.querySelector("#po-search").addEventListener("input",r=>{const a=r.target.value.toLowerCase();e=s.filter(i=>{var n,d,m;return((n=i.number)==null?void 0:n.toLowerCase().includes(a))||((d=i.supplierName)==null?void 0:d.toLowerCase().includes(a))||((m=i.jobNumber)==null?void 0:m.toLowerCase().includes(a))}),l.updateData(e)})}function Bt(t,{id:s,jobId:e}){const o=s==="new";let l=o?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:e||"",jobNumber:""}:p.getById("purchaseOrders",s);if(!l){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(o&&e){const u=p.getById("jobs",e);u&&(l.jobNumber=u.number)}He(l.number||"New PO");const r=p.getAll("stock"),a=p.getAll("jobs"),i=[...new Set(r.map(u=>u.supplier).filter(Boolean))];i.length===0&&i.push("General Supplier");function n(){t.innerHTML=`
      ${Ue({title:l.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${l.status==="Draft"?"badge-neutral":l.status==="Issued"?"badge-primary":l.status==="Received"?"badge-success":"badge-danger"}">${l.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!o&&l.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!o&&l.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${l.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${i.map(u=>`<option value="${u}" ${l.supplierName===u?"selected":""}>${u}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date</label>
                  <input type="date" class="form-input" name="issueDate" value="${l.issueDate?l.issueDate.split("T")[0]:""}" ${l.status!=="Draft"?"disabled":""} />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Job</label>
                  <select class="form-select" name="jobId" ${l.status!=="Draft"?"disabled":""}>
                    <option value="">None</option>
                    ${a.map(u=>`<option value="${u.id}" ${l.jobId===u.id?"selected":""}>${u.number} - ${u.title}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-textarea" name="notes" ${l.status!=="Draft"?"disabled":""}>${l.notes||""}</textarea>
              </div>
            </form>
          </div>
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <h4 style="margin:0">Line Items</h4>
            ${l.status==="Draft"?'<button class="btn btn-secondary btn-sm" id="btn-add-item"><span class="material-icons-outlined">add</span> Add Item</button>':""}
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
                  ${l.status==="Draft"?'<th style="width:5%"></th>':""}
                </tr>
              </thead>
              <tbody id="line-items-body">
                ${l.lineItems.length===0?'<tr><td colspan="6" style="text-align:center;padding:24px" class="text-secondary">No items added yet.</td></tr>':""}
                ${l.lineItems.map((u,b)=>`
                  <tr data-index="${b}">
                    <td>
                      ${l.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${r.map(v=>`<option value="${v.id}" ${u.stockId===v.id?"selected":""}>${v.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${u.stockId?"display:none":""}" value="${u.description||""}" placeholder="Description" />
                      `:`<div>${u.description}</div>`}
                    </td>
                    <td>
                      ${l.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${u.sku||""}" ${u.stockId?"disabled":""} />`:u.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${l.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${u.unitCost||0}" step="0.01" />`:`$${(u.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${l.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${u.quantity||1}" min="1" step="1" />`:u.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((u.unitCost||0)*(u.quantity||1)).toFixed(2)}
                    </td>
                    ${l.status==="Draft"?`
                    <td>
                      <button class="btn btn-icon btn-danger btn-sm btn-remove-item"><span class="material-icons-outlined">close</span></button>
                    </td>`:""}
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:600">Total:</td>
                  <td style="text-align:right;font-weight:700;font-size:var(--font-size-lg)" id="po-total">$${(l.total||0).toFixed(2)}</td>
                  ${l.status==="Draft"?"<td></td>":""}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,m()}function d(){let u=0;t.querySelectorAll("#line-items-body tr[data-index]").forEach(v=>{const f=parseFloat(v.querySelector(".item-cost").value)||0,g=parseFloat(v.querySelector(".item-qty").value)||0,x=f*g;v.querySelector(".item-total").textContent="$"+x.toFixed(2),u+=x}),l.total=u;const b=t.querySelector("#po-total");b&&(b.textContent="$"+u.toFixed(2))}function m(){var u,b,v,f;t.querySelector("#btn-cancel").addEventListener("click",()=>C.navigate("/purchase-orders")),(u=t.querySelector("#btn-save"))==null||u.addEventListener("click",()=>{c()}),(b=t.querySelector("#btn-issue"))==null||b.addEventListener("click",()=>{if(l.lineItems.length===0){T("Cannot issue a PO with no items","error");return}c("Issued")}),(v=t.querySelector("#btn-receive"))==null||v.addEventListener("click",()=>{let g=0;l.lineItems.forEach(x=>{if(x.stockId){const $=p.getById("stock",x.stockId);$&&(p.update("stock",$.id,{quantity:($.quantity||0)+x.quantity}),g++)}}),T(`Received ${g} items into stock.`,"success"),l.status="Received",p.update("purchaseOrders",l.id,{status:"Received"}),n()}),(f=t.querySelector("#btn-add-item"))==null||f.addEventListener("click",()=>{l.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),n()}),t.querySelectorAll(".item-select").forEach((g,x)=>{g.addEventListener("change",$=>{const j=$.target.value,z=$.target.closest("tr"),I=z.querySelector(".item-desc"),_=z.querySelector(".item-sku"),Q=z.querySelector(".item-cost");if(j){const E=p.getById("stock",j);E&&(I.style.display="none",I.value=E.name,_.value=E.sku,_.disabled=!0,Q.value=E.costPrice||E.unitPrice)}else I.style.display="block",I.value="",_.value="",_.disabled=!1,Q.value=0;d()})}),t.querySelectorAll(".item-cost, .item-qty").forEach(g=>{g.addEventListener("input",d)}),t.querySelectorAll(".btn-remove-item").forEach(g=>{g.addEventListener("click",x=>{const $=x.target.closest("tr"),j=parseInt($.dataset.index);l.lineItems.splice(j,1),n()})})}function c(u=null){if(l.status!=="Draft"){T("Cannot modify an issued or received PO","error");return}const b=t.querySelector("#po-form");if(!b.checkValidity()){b.reportValidity();return}const v=Object.fromEntries(new FormData(b));if(v.jobId){const g=a.find(x=>x.id===v.jobId);v.jobNumber=g?g.number:""}else v.jobNumber="";l.lineItems=Array.from(t.querySelectorAll("#line-items-body tr[data-index]")).map(g=>{const x=g.querySelector(".item-select"),$=x?x.value:"",j=g.querySelector(".item-desc").value,z=$?x.options[x.selectedIndex].text:j;return{stockId:$,description:z,sku:g.querySelector(".item-sku").value,unitCost:parseFloat(g.querySelector(".item-cost").value)||0,quantity:parseInt(g.querySelector(".item-qty").value)||1}}),d();const f={...l,...v,total:l.total,lineItems:l.lineItems,status:u||l.status};if(o){f.number=`PO-${Date.now().toString().slice(-6)}`;const g=p.create("purchaseOrders",f);T(`PO ${u==="Issued"?"issued":"created"} successfully`,"success"),C.navigate(`/purchase-orders/${g.id}`)}else p.update("purchaseOrders",s,f),T(`PO ${u==="Issued"?"issued":"updated"} successfully`,"success"),u==="Issued"&&n()}n()}function ja(t){let s="overview";const e=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function o(){const n=p.getAll("jobs"),d=p.getAll("quotes"),m=p.getAll("invoices"),c=p.getAll("customers"),u=p.getAll("stock"),b=p.getAll("technicians"),v=p.getAll("leads"),f=m.filter(W=>W.status==="Paid").reduce((W,ie)=>W+(ie.total||0),0),g=m.filter(W=>W.status==="Sent"||W.status==="Overdue").reduce((W,ie)=>W+(ie.total||0),0),x=n.length>0?n.reduce((W,ie)=>W+(ie.laborCost||0)+(ie.materialCost||0),0)/n.length:0,$=d.length>0?d.filter(W=>W.status==="Accepted").length/d.length*100:0,j=v.length>0?v.filter(W=>W.status==="Won").length/v.length*100:0,z={};n.forEach(W=>{z[W.status]=(z[W.status]||0)+1});const I={};m.forEach(W=>{I[W.status]=(I[W.status]||0)+1});const _=b.map(W=>{const ie=n.filter(w=>w.technicianId===W.id),h=ie.filter(w=>w.status==="Completed"||w.status==="Invoiced").length,S=ie.reduce((w,q)=>w+(q.laborCost||0)+(q.materialCost||0),0);return{...W,totalJobs:ie.length,completed:h,revenue:S}}),Q={};m.filter(W=>W.status==="Paid").forEach(W=>{Q[W.customerName]=(Q[W.customerName]||0)+(W.total||0)});const E=Object.entries(Q).sort((W,ie)=>ie[1]-W[1]).slice(0,10),V=u.reduce((W,ie)=>W+ie.quantity*ie.costPrice,0),X=u.filter(W=>W.quantity<=W.reorderLevel),le=p.getAll("timesheets"),pe={};return le.forEach(W=>{pe[W.jobId]=(pe[W.jobId]||0)+(W.hours||0)}),{jobs:n,quotes:d,invoices:m,customers:c,stock:u,technicians:b,leads:v,totalRevenue:f,totalOutstanding:g,avgJobValue:x,quoteWinRate:$,leadConvRate:j,jobsByStatus:z,invByStatus:I,techStats:_,topCustomers:E,totalStockValue:V,lowStockItems:X,timesheets:le,hoursByJob:pe}}function l(){const n=o();t.innerHTML=`
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
              ${e.map(d=>`
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
    `,r(n),a(n)}function r(n){const d=t.querySelector("#report-content");switch(s){case"overview":d.innerHTML=za(n);break;case"revenue":d.innerHTML=Ha(n);break;case"jobs":d.innerHTML=Oa(n);break;case"job_costing":d.innerHTML=Ra(n);break;case"technicians":d.innerHTML=Ba(n);break;case"customers":d.innerHTML=Fa(n);break;case"inventory":d.innerHTML=Ua(n);break;default:d.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function a(n){var d;t.querySelectorAll("[data-report]").forEach(m=>{m.addEventListener("click",()=>{s=m.dataset.report,l()})}),(d=t.querySelector("#btn-export-csv"))==null||d.addEventListener("click",()=>i(n))}function i(n){let d="";s==="overview"||s==="revenue"?(d=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,n.invoices.forEach(b=>{d+=`"${b.number}","${b.customerName}","${b.status}",${b.total||0},"${b.issueDate||""}","${b.dueDate||""}"
`})):s==="job_costing"?(d=`Job #,Technician,Est. Hrs,Actual Hrs,Est. Labor,Actual Labor,Variance
`,n.jobs.filter(v=>v.status==="Completed"||v.status==="Invoiced").map(v=>{const f=v.estimatedHours||0,g=v.laborCost||0,x=n.hoursByJob[v.id]||0,$=x*85;return{num:v.number,tech:v.technicianName||"",estH:f,actualH:x,estLabor:g,actualLabor:$,variance:g-$}}).forEach(v=>{d+=`"${v.num}","${v.tech}",${v.estH},${v.actualH},${v.estLabor},${v.actualLabor},${v.variance}
`})):s==="jobs"?(d=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,n.jobs.forEach(b=>{d+=`"${b.number}","${b.title}","${b.customerName}","${b.technicianName||""}","${b.status}","${b.priority}",${b.laborCost||0},${b.materialCost||0}
`})):s==="technicians"?(d=`Name,Role,Total Jobs,Completed,Revenue
`,n.techStats.forEach(b=>{d+=`"${b.name}","${b.role}",${b.totalJobs},${b.completed},${b.revenue}
`})):s==="customers"?(d=`Company,First Name,Last Name,Email,Phone,Status
`,n.customers.forEach(b=>{d+=`"${b.company}","${b.firstName}","${b.lastName}","${b.email}","${b.phone}","${b.status}"
`})):s==="inventory"&&(d=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,n.stock.forEach(b=>{d+=`"${b.name}","${b.sku}","${b.category}",${b.quantity},${b.costPrice},${b.unitPrice},"${b.location}","${b.supplier}"
`}));const m=new Blob([d],{type:"text/csv"}),c=URL.createObjectURL(m),u=document.createElement("a");u.href=c,u.download=`simpro_${s}_report.csv`,u.click(),URL.revokeObjectURL(c)}l()}function he(t,s,e,o){const l={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${t}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[o]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${l[o]}">${e}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${s}</div>
    </div>
  `}function Oe(t,s,e){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${e}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${s}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${t}</div>
        </div>
      </div>
    </div>
  `}function Ge(t,s={},e="#1B6DE0"){const o=Object.entries(t);if(o.length===0)return'<div class="text-secondary text-sm">No data available</div>';const l=Math.max(...o.map(([,r])=>r));return o.map(([r,a])=>{const i=s[r]||e,n=l>0?a/l*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${r}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${n}%;background:${i};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof a=="number"&&a>=1e3?`$${(a/1e3).toFixed(1)}k`:a}</div>
      </div>
    `}).join("")}function We(t,s,e,o){const l=e>0?s/e*100:0,r=typeof s=="number"?`$${s.toLocaleString("en-AU",{minimumFractionDigits:0})}`:s;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${t}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${r}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${l}%;background:${o};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function za(t){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${he("Total Revenue",`$${t.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${he("Outstanding",`$${t.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${he("Quote Win Rate",`${t.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${he("Lead Conversion",`${t.leadConvRate.toFixed(0)}%`,"trending_up","green")}
    </div>
    <div class="grid-2" style="margin-bottom:var(--space-lg)">
      <div class="card">
        <div class="card-header"><h4>Jobs by Status</h4></div>
        <div class="card-body">${Ge(t.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
      </div>
      <div class="card">
        <div class="card-header"><h4>Invoices by Status</h4></div>
        <div class="card-body">${Ge(t.invByStatus,{Draft:"#6B7280",Sent:"#3B82F6",Paid:"#10B981",Overdue:"#EF4444"})}</div>
      </div>
    </div>
    <div class="grid-3">
      ${Oe("Total Jobs",t.jobs.length,"build")}
      ${Oe("Total Quotes",t.quotes.length,"request_quote")}
      ${Oe("Total Invoices",t.invoices.length,"receipt_long")}
      ${Oe("Total Customers",t.customers.length,"people")}
      ${Oe("Avg Job Value",`$${t.avgJobValue.toFixed(0)}`,"paid")}
      ${Oe("Stock Items",`${t.stock.length} (${t.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function Ha(t){const s=t.invoices.filter(a=>a.status==="Paid"),e={};s.forEach(a=>{const i=new Date(a.issueDate||a.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});e[i]=(e[i]||0)+(a.total||0)});const o=t.jobs.reduce((a,i)=>a+(i.materialCost||0),0),l=t.jobs.reduce((a,i)=>a+(i.laborCost||0),0),r=t.totalRevenue-o;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${he("Gross Revenue",`$${t.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${he("Total Labor",`$${l.toFixed(0)}`,"engineering","blue")}
      ${he("Material Costs",`$${o.toFixed(0)}`,"inventory_2","orange")}
      ${he("Gross Profit",`$${r.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${Ge(e,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${We("Revenue",t.totalRevenue,t.totalRevenue,"#10B981")}
        ${We("Labor Cost",l,t.totalRevenue,"#3B82F6")}
        ${We("Material Cost",o,t.totalRevenue,"#F59E0B")}
        ${We("Gross Profit",r,t.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function Oa(t){const s=t.jobs.filter(o=>o.status==="Completed"||o.status==="Invoiced"),e=s.length>0?s.reduce((o,l)=>o+(l.estimatedHours||0),0)/s.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${he("Total Jobs",t.jobs.length,"build","blue")}
      ${he("Completed",s.length,"check_circle","green")}
      ${he("In Progress",t.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${he("Avg Hours",e.toFixed(1),"schedule","blue")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Job Status Distribution</h4></div>
      <div class="card-body">${Ge(t.jobsByStatus,{Pending:"#F59E0B",Scheduled:"#3B82F6","In Progress":"#1B6DE0","On Hold":"#6B7280",Completed:"#10B981",Invoiced:"#8B5CF6"})}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Top Jobs by Value</h4></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>Job</th><th>Customer</th><th>Status</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            ${t.jobs.sort((o,l)=>(l.laborCost||0)+(l.materialCost||0)-((o.laborCost||0)+(o.materialCost||0))).slice(0,8).map(o=>`
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
  `}function Ra(t){const e=t.jobs.filter(a=>a.status==="Completed"||a.status==="Invoiced").map(a=>{const i=a.estimatedHours||0,n=a.laborCost||0,d=t.hoursByJob[a.id]||0,c=d*85;return{...a,estH:i,actualH:d,estLabor:n,actualLabor:c,hVariance:i-d,laborVariance:n-c}}),o=e.reduce((a,i)=>a+i.estLabor,0),l=e.reduce((a,i)=>a+i.actualLabor,0),r=o-l;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${he("Est. Total Labor","$"+o.toFixed(0),"engineering","blue")}
      ${he("Actual Total Labor","$"+l.toFixed(0),"timer","orange")}
      ${he("Overall Variance","$"+Math.abs(r).toFixed(0)+" "+(r>=0?"Under Budget":"Over Budget"),"trending_flat",r>=0?"green":"red")}
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
  `}function Ba(t){return`
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
        ${t.techStats.map(s=>We(s.name,s.revenue,Math.max(...t.techStats.map(e=>e.revenue)),s.color)).join("")}
      </div>
    </div>
  `}function Fa(t){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${he("Total Customers",t.customers.length,"people","blue")}
      ${he("Active Customers",t.customers.filter(s=>s.status==="Active").length,"check_circle","green")}
      ${he("Total Leads",t.leads.length,"trending_up","orange")}
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
  `}function Ua(t){const s=t.stock.reduce((e,o)=>e+o.quantity*o.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${he("Total Items",t.stock.length,"inventory_2","blue")}
      ${he("Stock Value (Cost)",`$${t.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${he("Stock Value (Sell)",`$${s.toFixed(0)}`,"paid","green")}
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
        ${Ge(t.stock.reduce((e,o)=>(e[o.category]=(e[o.category]||0)+o.quantity,e),{}),{},"#1B6DE0")}
      </div>
    </div>
  `}const Ja=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function Va(t,s){if(t.role==="admin"||t.role==="manager")return"/";if(!t.userTypeId)return"/schedule";const e=s.getById("userTypes",t.userTypeId);if(!e||!e.permissions)return"/schedule";for(const{path:o,module:l}of Ja){const r=e.permissions.find(a=>a.module===l);if(r&&(r.view||r.create||r.edit||r.delete))return o}return"/schedule"}function Qa(t){var n;const s=document.querySelector(".sidebar"),e=document.querySelector(".topbar"),o=document.getElementById("breadcrumb");s&&(s.style.display="none"),e&&(e.style.display="none"),o&&(o.style.display="none");const l=p.getAll("technicians").filter(d=>!d.deactivated),r=p.getAll("userTypes");t.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">Simpro Clone</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${l.map(d=>{const m=r.find(c=>c.id===d.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${d.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${d.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${m?m.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${l.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const a=async d=>{const m=l.find(g=>g.id===d),c=r.find(g=>g.id===(m==null?void 0:m.userTypeId));let u="technician";c&&c.name.toLowerCase().includes("admin")?u="admin":c&&c.name.toLowerCase().includes("manager")&&(u="manager");const b={id:m.id,name:m.name,role:u,userTypeId:m.userTypeId,color:m.color};sessionStorage.setItem("currentUser",JSON.stringify(b)),s&&(s.style.display=""),e&&(e.style.display=""),o&&(o.style.display=""),ee(async()=>{const{updateSidebarAccess:g}=await Promise.resolve().then(()=>$t);return{updateSidebarAccess:g}},void 0).then(({updateSidebarAccess:g})=>{g&&g()}),ee(async()=>{const{updateTopbarAccess:g}=await Promise.resolve().then(()=>wt);return{updateTopbarAccess:g}},void 0).then(({updateTopbarAccess:g})=>{g&&g()});const{store:v}=await ee(async()=>{const{store:g}=await Promise.resolve().then(()=>Kt);return{store:g}},void 0),f=Va(b,v);C.navigate(f)};t.querySelectorAll(".btn-login-user").forEach(d=>{d.addEventListener("click",m=>{const c=m.target.closest(".btn-login-user");a(c.dataset.id)})});const i=()=>{const d={id:"customer-user",name:"Customer User",role:"customer"},m=p.get("people").filter(c=>c.type==="Customer");m.length>0&&(d.customerId=m[0].id,d.name=m[0].firstName+" "+m[0].lastName),sessionStorage.setItem("currentUser",JSON.stringify(d)),s&&(s.style.display=""),e&&(e.style.display=""),o&&(o.style.display=""),ee(async()=>{const{updateSidebarAccess:c}=await Promise.resolve().then(()=>$t);return{updateSidebarAccess:c}},void 0).then(({updateSidebarAccess:c})=>{c&&c()}),ee(async()=>{const{updateTopbarAccess:c}=await Promise.resolve().then(()=>wt);return{updateTopbarAccess:c}},void 0).then(({updateTopbarAccess:c})=>{c&&c()}),C.navigate("/portal")};(n=t.querySelector("#btn-login-customer"))==null||n.addEventListener("click",i)}function ht(t){const s=JSON.parse(sessionStorage.getItem("currentUser")||"{}"),e=s.customerId;if(s.role!=="customer"||!e){t.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const o=p.getAll("jobs").filter(d=>d.customerId===e),l=p.getAll("quotes").filter(d=>d.customerId===e),r=p.getAll("invoices").filter(d=>d.customerId===e);t.innerHTML=`
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
        ${l.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${l.map(d=>`
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
        ${o.length===0?'<p style="color:var(--text-tertiary);">No jobs found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${o.map(d=>`
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
        ${r.length===0?'<p style="color:var(--text-tertiary);">No invoices found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${r.map(d=>`
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
  `;const a=t.querySelector("#portal-logout-btn");a&&a.addEventListener("click",()=>{sessionStorage.removeItem("currentUser"),ee(async()=>{const{router:d}=await Promise.resolve().then(()=>Yt);return{router:d}},void 0).then(({router:d})=>{d.navigate("/login")})}),t.querySelectorAll(".btn-approve-quote").forEach(d=>{d.addEventListener("click",m=>{const c=m.target.dataset.id;p.update("quotes",c,{status:"Approved"}),alert("Quote approved successfully!"),ht(t)})}),t.querySelectorAll(".btn-pay-invoice").forEach(d=>{d.addEventListener("click",m=>{const c=m.target.dataset.id;p.update("invoices",c,{status:"Paid"}),alert("Invoice paid successfully!"),ht(t)})})}function ot(t){const s=p.getAll("contractors");t.innerHTML=`
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
  `;let e=[...s];const l=Ie({columns:[{key:"businessName",label:"Business Name",render:r=>`<span class="cell-link font-medium">${y(r.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:r=>y(r.email||"—")},{key:"phone",label:"Phone",render:r=>y(r.phone||"—")},{key:"active",label:"Status",render:r=>`<span class="badge ${r.active?"badge-success":"badge-neutral"}">${r.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:r=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${r.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:e,onRowClick:r=>C.navigate(`/contractors/${r}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:r=>{Te({container:t,selectedIds:r,onClear:()=>l.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:a=>{a.forEach(i=>p.update("contractors",i,{active:!0})),l.clearSelection(),ot(t),ee(async()=>{const{showToast:i}=await Promise.resolve().then(()=>ye);return{showToast:i}},void 0).then(({showToast:i})=>i(`Activated ${a.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:a=>{a.forEach(i=>p.update("contractors",i,{active:!1})),l.clearSelection(),ot(t),ee(async()=>{const{showToast:i}=await Promise.resolve().then(()=>ye);return{showToast:i}},void 0).then(({showToast:i})=>i(`Deactivated ${a.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:a=>{ee(async()=>{const{showModal:i}=await Promise.resolve().then(()=>xe);return{showModal:i}},void 0).then(({showModal:i})=>{const n=document.createElement("div");n.innerHTML=`<p>Are you sure you want to delete ${a.length} contractors? This action cannot be undone.</p>`,i({title:"Confirm Bulk Delete",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{a.forEach(m=>p.delete("contractors",m)),l.clearSelection(),ot(t),ee(async()=>{const{showToast:m}=await Promise.resolve().then(()=>ye);return{showToast:m}},void 0).then(({showToast:m})=>m(`Deleted ${a.length} contractors`,"success")),d()}}]})})}}]})}});t.querySelector("#contractors-table-container").appendChild(l),t.querySelector("#btn-new-contractor").addEventListener("click",()=>C.navigate("/contractors/new")),t.querySelector("#contractors-search").addEventListener("input",r=>{const a=r.target.value.toLowerCase();e=s.filter(i=>i.businessName.toLowerCase().includes(a)||i.contactName.toLowerCase().includes(a)||(i.email||"").toLowerCase().includes(a)),l.updateData(e)}),t.addEventListener("click",r=>{const a=r.target.closest(".contractor-edit-btn");a&&(r.stopPropagation(),C.navigate(`/contractors/${a.dataset.id}/edit`))})}function Ft(t,s){const e=s.id==="new";let o=e?{active:!0}:p.getById("contractors",s.id);if(!o&&!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}t.innerHTML=`
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
  `,t.querySelector("#btn-cancel").addEventListener("click",()=>{C.navigate(e?"/contractors":`/contractors/${s.id}`)}),t.querySelector("#btn-save").addEventListener("click",()=>{const l={businessName:t.querySelector("#businessName").value,contactName:t.querySelector("#contactName").value,email:t.querySelector("#email").value,phone:t.querySelector("#phone").value,licenseNumber:t.querySelector("#licenseNumber").value,insuranceExpiry:t.querySelector("#insuranceExpiry").value,active:t.querySelector("#active").checked};if(!l.businessName||!l.contactName){alert("Business Name and Contact Name are required.");return}e?p.create("contractors",l):p.update("contractors",s.id,l),C.navigate("/contractors")})}function Wa(t,s){const e=p.getById("contractors",s.id);if(!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}t.innerHTML=`
    <div class="page-header">
      <div class="page-header-info">
        <h1 style="margin: 0;">${y(e.businessName)}</h1>
        <p class="text-secondary" style="margin: 5px 0 0 0;">Contact: ${y(e.contactName)}</p>
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
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Email</strong> ${y(e.email||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Phone</strong> ${y(e.phone||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">License</strong> ${y(e.licenseNumber||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Insurance Expiry</strong> ${y(e.insuranceExpiry||"—")}</div>
          <div><strong class="text-secondary" style="display:block;margin-bottom:4px;font-size:12px;">Status</strong> <span class="badge ${e.active?"badge-success":"badge-neutral"}">${e.active?"Active":"Inactive"}</span></div>
        </div>
      </div>
    </div>
  `,t.querySelector("#btn-edit").addEventListener("click",()=>{C.navigate(`/contractors/${s.id}/edit`)})}function gt(t){let s=p.getAll("assets");const e=p.getAll("fleet");s.length===0&&e.length>0&&(e.forEach(a=>{a.ownerType="Business",a.identifier=a.licensePlate,p.create("assets",a)}),s=p.getAll("assets")),t.innerHTML=`
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
  `;let o=[...s];const r=Ie({columns:[{key:"name",label:"Name / ID",render:a=>`<span class="cell-link font-medium">${y(a.name)}</span>`},{key:"identifier",label:"Identifier/Serial",render:a=>y(a.serial||a.identifier||a.licensePlate||"—")},{key:"type",label:"Type",render:a=>y(a.type||"—")},{key:"owner",label:"Owner",render:a=>{if(a.ownerType==="Customer"&&a.customerId){const i=p.getById("customers",a.customerId)||p.getById("people",a.customerId);return i?`<span class="badge badge-info">${y(i.company||i.firstName+" "+i.lastName)}</span>`:"Customer"}return'<span class="badge badge-neutral">My Business</span>'}},{key:"status",label:"Status",render:a=>`<span class="badge ${a.status==="Active"?"badge-success":a.status==="Maintenance"?"badge-warning":"badge-neutral"}">${y(a.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:a=>{if(!a.assignedToId)return"—";const i=p.getById("people",a.assignedToId);return i?y(`${i.firstName} ${i.lastName}`):"—"}},{key:"actions",label:"",width:"80px",render:a=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${a.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:o,onRowClick:a=>C.navigate(`/assets/${a}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:a=>{Te({container:t,selectedIds:a,onClear:()=>r.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:i=>{const n=document.createElement("div");n.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Broken">Broken</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              `,ee(async()=>{const{showModal:d}=await Promise.resolve().then(()=>xe);return{showModal:d}},void 0).then(({showModal:d})=>{d({title:`Update ${i.length} Assets`,content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Apply",className:"btn-primary",onClick:m=>{const c=n.querySelector("#bulk-status").value;i.forEach(u=>p.update("assets",u,{status:c})),r.clearSelection(),gt(t),ee(async()=>{const{showToast:u}=await Promise.resolve().then(()=>ye);return{showToast:u}},void 0).then(({showToast:u})=>u(`Updated ${i.length} assets to ${c}`,"success")),m()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:i=>{ee(async()=>{const{showToast:n}=await Promise.resolve().then(()=>ye);return{showToast:n}},void 0).then(({showToast:n})=>n(`Generating tags for ${i.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:i=>{ee(async()=>{const{showModal:n}=await Promise.resolve().then(()=>xe);return{showModal:n}},void 0).then(({showModal:n})=>{const d=document.createElement("div");d.innerHTML=`<p>Are you sure you want to delete ${i.length} assets? This action cannot be undone.</p>`,n({title:"Confirm Bulk Delete",content:d,actions:[{label:"Cancel",className:"btn-secondary",onClick:m=>m()},{label:"Delete",className:"btn-danger",onClick:m=>{i.forEach(c=>p.delete("assets",c)),r.clearSelection(),gt(t),ee(async()=>{const{showToast:c}=await Promise.resolve().then(()=>ye);return{showToast:c}},void 0).then(({showToast:c})=>c(`Deleted ${i.length} assets`,"success")),m()}}]})})}}]})}});t.querySelector("#asset-table-container").appendChild(r),t.querySelector("#btn-new-asset").addEventListener("click",()=>C.navigate("/assets/new")),t.querySelector("#asset-search").addEventListener("input",a=>{const i=a.target.value.toLowerCase();o=s.filter(n=>n.name.toLowerCase().includes(i)||(n.serial||n.identifier||n.licensePlate||"").toLowerCase().includes(i)||(n.type||"").toLowerCase().includes(i)),r.updateData(o)}),t.addEventListener("click",a=>{const i=a.target.closest(".asset-edit-btn");i&&(a.stopPropagation(),C.navigate(`/assets/${i.dataset.id}/edit`))})}function Ut(t,s){const e=s.id==="new";let o=e?{status:"Active",ownerType:"Business"}:p.getById("assets",s.id);if(!o&&!e){t.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const l=p.getAll("people").filter(u=>u.type==="Staff"),r=p.getAll("customers");let a=[];if(o.customerId){const u=p.getById("customers",o.customerId);u&&u.sites&&(a=u.sites)}t.innerHTML=`
    <div class="page-header">
      <h1>${e?"New Asset":"Edit Asset"}</h1>
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
            <input type="text" id="name" class="form-input" value="${o.name||""}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="description" class="form-input" rows="3">${o.description||""}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Owner Type</label>
              <select id="ownerType" class="form-select">
                <option value="Business" ${o.ownerType==="Business"?"selected":""}>My Business</option>
                <option value="Customer" ${o.ownerType==="Customer"?"selected":""}>Customer</option>
              </select>
            </div>
            <div class="form-group" id="customer-select-group" style="display: ${o.ownerType==="Customer"?"block":"none"};">
              <label class="form-label">Customer</label>
              <select id="customerId" class="form-select">
                <option value="">Select customer...</option>
                ${r.map(u=>`<option value="${u.id}" ${o.customerId===u.id?"selected":""}>${u.company||u.firstName+" "+u.lastName}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location / Site</label>
              <select id="site" class="form-select" ${o.ownerType==="Business"?"disabled":""}>
                <option value="">-- No specific site --</option>
                ${a.map(u=>`<option value="${u.name}" ${o.site===u.name?"selected":""}>${u.name}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Install Date</label>
              <input type="date" id="installDate" class="form-input" value="${o.installDate||""}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select id="type" class="form-select">
                ${["Vehicle","Equipment","Tool","Other"].map(u=>`<option value="${u}" ${o.type===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Serial Number / Identifier</label>
              <input type="text" id="serial" class="form-input" value="${o.serial||o.identifier||o.licensePlate||""}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="status" class="form-select">
                ${["Active","Maintenance","Inactive"].map(u=>`<option value="${u}" ${o.status===u?"selected":""}>${u}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assign To (Staff)</label>
              <select id="assignedToId" class="form-select">
                <option value="">Unassigned</option>
                ${l.map(u=>`<option value="${u.id}" ${o.assignedToId===u.id?"selected":""}>${u.firstName} ${u.lastName}</option>`).join("")}
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;const i=t.querySelector("#ownerType"),n=t.querySelector("#customer-select-group"),d=t.querySelector("#customerId"),m=t.querySelector("#site");i.addEventListener("change",u=>{const b=u.target.value==="Customer";n.style.display=b?"block":"none",m.disabled=!b,b?c(d.value):m.innerHTML='<option value="">-- No specific site --</option>'}),d.addEventListener("change",u=>{c(u.target.value)});function c(u){if(!u){m.innerHTML='<option value="">-- No specific site --</option>';return}const b=p.getById("customers",u);if(!b||!b.sites||b.sites.length===0){m.innerHTML='<option value="">-- No specific site --</option>';return}m.innerHTML='<option value="">-- No specific site --</option>'+b.sites.map(v=>`<option value="${v.name}" ${o.site===v.name?"selected":""}>${v.name}</option>`).join("")}t.querySelector("#btn-cancel").addEventListener("click",()=>{C.navigate(e?"/assets":`/assets/${s.id}`)}),t.querySelector("#btn-save").addEventListener("click",()=>{const u={name:t.querySelector("#name").value,description:t.querySelector("#description").value,serial:t.querySelector("#serial").value,identifier:t.querySelector("#serial").value,type:t.querySelector("#type").value,status:t.querySelector("#status").value,assignedToId:t.querySelector("#assignedToId").value,ownerType:t.querySelector("#ownerType").value,customerId:t.querySelector("#ownerType").value==="Customer"?t.querySelector("#customerId").value:null,site:t.querySelector("#site").value,installDate:t.querySelector("#installDate").value};if(!u.name){alert("Asset Name is required.");return}e?(u.logs=[],p.create("assets",u)):p.update("assets",s.id,u),C.navigate("/assets")})}function Jt(t,s){const e=p.getById("assets",s.id);if(!e){t.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}let o="Unassigned";if(e.assignedToId){const a=p.getById("people",e.assignedToId);a&&(o=`${a.firstName} ${a.lastName}`)}let l="My Business";if(e.ownerType==="Customer"&&e.customerId){const a=p.getById("customers",e.customerId)||p.getById("people",e.customerId);a&&(l=a.company||`${a.firstName} ${a.lastName}`)}const r=e.logs||[];t.innerHTML=`
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        <h1 style="margin: 0;">${y(e.name)}</h1>
        <p style="margin: 5px 0 0 0; color: var(--text-secondary);">${y(e.identifier||e.licensePlate||"No Identifier")}</p>
      </div>
      <button class="btn btn-outline" id="btn-edit">Edit</button>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
      <div class="card">
        <h3 style="margin-top: 0;">Details</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div><strong>Type:</strong> ${y(e.type||"-")}</div>
          <div><strong>Owner:</strong> ${y(l)}</div>
          <div><strong>Status:</strong> <span class="badge ${e.status==="Active"?"badge-success":e.status==="Maintenance"?"badge-warning":"badge-neutral"}">${y(e.status||"Active")}</span></div>
          <div><strong>Assigned To:</strong> ${y(o)}</div>
        </div>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">Service & Activity Logs</h3>
          <button class="btn btn-sm btn-primary" id="btn-add-log">Add Log</button>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Metric/Mileage</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${r.length===0?'<tr><td colspan="4" class="text-center">No logs recorded.</td></tr>':r.map(a=>`
                <tr>
                  <td>${y(a.date)}</td>
                  <td>${y(a.mileage)}</td>
                  <td>${y(a.type)}</td>
                  <td>${y(a.notes||"-")}</td>
                </tr>
              `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `,t.querySelector("#btn-edit").addEventListener("click",()=>{C.navigate(`/assets/${s.id}/edit`)}),t.querySelector("#btn-add-log").addEventListener("click",()=>{const a=prompt("Enter date (YYYY-MM-DD):",new Date().toISOString().split("T")[0]);if(!a)return;const i=prompt("Enter current metric/mileage:");if(!i)return;const n=prompt("Enter log type (e.g. Regular Service, Refuel, Repair, Inspection):","Regular Service");if(!n)return;const d=prompt("Enter notes (optional):",""),m={date:a,mileage:i,type:n,notes:d},c=[...e.logs||[],m];p.update("assets",e.id,{logs:c}),Jt(t,s)})}function Ya(t){let s="All Documents";function e(){const o=[];p.getAll("documents").forEach(c=>{o.push({id:c.id,name:c.name,url:c.url,type:c.type,size:c.size,uploadedAt:c.uploadedAt,folder:c.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),p.getAll("jobs").forEach(c=>{c.attachments&&Array.isArray(c.attachments)&&c.attachments.forEach(u=>{o.push({id:u.id||Math.random().toString(36).substr(2,9),name:u.name,url:u.url||u.data||"#",type:u.type,size:u.size,uploadedAt:u.uploadedAt||u.date||c.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:c.id,entityName:`${c.number} - ${c.title}`})}),c.activityLog&&Array.isArray(c.activityLog)&&c.activityLog.filter(u=>u.type==="attachment").forEach(u=>{o.push({id:u.id,name:u.file.name,url:u.file.url||u.file.data||"#",type:u.file.type,size:u.file.size,uploadedAt:u.date,folder:"Job Attachments",entityType:"Job",entityId:c.id,entityName:`${c.number} - ${c.title}`})}),c.forms&&Array.isArray(c.forms)&&c.forms.forEach((u,b)=>{o.push({id:`form_${c.id}_${b}`,name:`${u.type} - ${new Date(u.date).toLocaleDateString()}`,url:`#/jobs/${c.id}`,type:"Digital Form",size:null,uploadedAt:u.date,folder:"Digital Forms",entityType:"Job",entityId:c.id,entityName:`${c.number} - ${c.title}`})})}),p.getAll("customers").forEach(c=>{c.attachments&&Array.isArray(c.attachments)&&c.attachments.forEach(u=>{o.push({id:u.id||Math.random().toString(36).substr(2,9),name:u.name,url:u.url||u.data||"#",type:u.type,size:u.size,uploadedAt:u.uploadedAt||c.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:c.id,entityName:c.company})})}),p.getAll("invoices").forEach(c=>{o.push({id:c.id,name:`Invoice ${c.number}.pdf`,url:`#/invoices/${c.id}`,type:"Invoice PDF",size:null,uploadedAt:c.issueDate,folder:"Invoices",entityType:"Invoice",entityId:c.id,entityName:`Inv ${c.number} - ${c.customerName}`})}),p.getAll("quotes").forEach(c=>{o.push({id:c.id,name:`Quote ${c.number}.pdf`,url:`#/quotes/${c.id}`,type:"Quote PDF",size:null,uploadedAt:c.createdAt,folder:"Quotes",entityType:"Quote",entityId:c.id,entityName:`Quote ${c.number} - ${c.customerName}`})}),p.getAll("purchaseOrders").forEach(c=>{o.push({id:c.id,name:`PO ${c.number}.pdf`,url:`#/purchase-orders/${c.id}`,type:"PO PDF",size:null,uploadedAt:c.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:c.id,entityName:`PO ${c.number} - ${c.supplierName}`})}),o.sort((c,u)=>new Date(u.uploadedAt)-new Date(c.uploadedAt));let l=o;s!=="All Documents"&&(l=o.filter(c=>c.folder===s));const r=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];t.innerHTML=`
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
              ${r.map(c=>{let u="folder";c==="All Documents"?u="dashboard":c==="Company Docs"?u="domain":c==="Health & Safety"?u="health_and_safety":c==="Templates"?u="file_copy":c==="Job Attachments"?u="build":c==="Customer Attachments"?u="people":c==="Digital Forms"?u="assignment":c==="Invoices"?u="receipt_long":c==="Quotes"?u="request_quote":c==="Purchase Orders"&&(u="shopping_cart");const b=s===c,v=c==="All Documents"?o.length:o.filter(f=>f.folder===c).length;return`
                <li>
                  <button class="btn btn-ghost ${b?"active":""}" data-folder="${c}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${b?"var(--color-primary-bg)":"transparent"}; color:${b?"var(--primary-color)":"var(--text-primary)"}; font-weight:${b?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${u}</span> ${c}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${v}</span>
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
    `,t.querySelectorAll("#folder-list button").forEach(c=>{c.addEventListener("click",()=>{s=c.dataset.folder,e()})});let a=[...l];const n=Ie({columns:[{key:"name",label:"File Name",render:c=>{let u="insert_drive_file";return c.type==="Invoice PDF"||c.type==="Quote PDF"||c.type==="PO PDF"?u="picture_as_pdf":c.type==="Digital Form"?u="assignment":c.type&&c.type.includes("image")&&(u="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${u}</span> <span class="font-medium truncate" style="max-width:300px" title="${y(c.name)}">${y(c.name)}</span></div>`}},{key:"folder",label:"Category",render:c=>y(c.folder||"—")},{key:"size",label:"Size",render:c=>c.size?(c.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:c=>{if(c.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let u="#";return c.entityType==="Job"?u=`#/jobs/${c.entityId}`:c.entityType==="Customer"?u=`#/people/${c.entityId}`:c.entityType==="Invoice"?u=`#/invoices/${c.entityId}`:c.entityType==="Quote"?u=`#/quotes/${c.entityId}`:c.entityType==="PO"&&(u=`#/purchase-orders/${c.entityId}`),`<span class="badge badge-neutral">${c.entityType}</span> <a href="${u}">${y(c.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:c=>c.uploadedAt?new Date(c.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:c=>`<a href="${y(c.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`}],data:a,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:c=>{Te({container:t.querySelector(".main-wrapper")||t,selectedIds:c,onClear:()=>n.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:u=>{const b=r.filter(f=>f!=="All Documents"),v=document.createElement("div");v.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${b.map(f=>`<option value="${f}">${f}</option>`).join("")}
                    </select>
                  </div>
                `,ve({title:`Move ${u.length} Documents`,content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Move",className:"btn-primary",onClick:f=>{const g=v.querySelector("#bulk-folder").value;u.forEach(x=>{p.getById("documents",x)&&p.update("documents",x,{folder:g})}),n.clearSelection(),e(),T(`Moved ${u.length} documents to ${g}`,"success"),f()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:u=>{ve({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${u.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{u.forEach(v=>p.delete("documents",v)),n.clearSelection(),e(),T(`Deleted ${u.length} documents`,"success"),b()}}]})}}]})}});t.querySelector("#docs-table-container").appendChild(n);const d=t.querySelector("#docs-search");function m(){const c=d.value.toLowerCase();a=l.filter(u=>u.name.toLowerCase().includes(c)||u.entityName&&u.entityName.toLowerCase().includes(c)||u.folder&&u.folder.toLowerCase().includes(c)),n.updateData(a)}d.addEventListener("input",m),t.querySelector("#btn-upload-doc").addEventListener("click",()=>{const c=r.filter(b=>b!=="All Documents"),u=document.createElement("div");u.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${c.map(b=>`<option value="${b}">${b}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,ve({title:"Upload Global Document",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Upload",className:"btn-primary",onClick:b=>{const v=document.getElementById("upload-file-input"),f=document.getElementById("upload-folder").value;if(!v.files.length){T("Please select a file","error");return}const g=v.files[0],x=new FileReader;x.onload=$=>{p.create("documents",{name:g.name,type:g.type||"unknown",size:g.size,url:$.target.result,folder:f,uploadedAt:new Date().toISOString()}),T("Document uploaded successfully","success"),e(),b()},x.readAsDataURL(g)}}]})})}e()}ca();window.__simproApp={router:C,store:p};const Vt=document.getElementById("app"),Ga=Lt(),Ke=document.createElement("div");Ke.className="main-wrapper";const Ka=Dt(),xt=document.createElement("div");xt.className="breadcrumb";xt.id="breadcrumb";const Be=document.createElement("main");Be.className="main-content";Be.id="main-content";Ke.appendChild(Ka);Ke.appendChild(xt);Ke.appendChild(Be);Vt.appendChild(Ga);Vt.appendChild(Ke);function ne(t){return s=>{Be.innerHTML="",Be.scrollTop=0,t(Be,s)}}C.register("/login",ne(Qa));C.register("/portal",ne(ht));C.register("/",ne(xa));C.register("/people",ne(bt));C.register("/people/new",ne((t,s)=>Pt(t,{id:"new"})));C.register("/people/:id",ne(Da));C.register("/people/:id/edit",ne((t,s)=>Pt(t,s)));C.register("/contractors",ne(ot));C.register("/contractors/new",ne((t,s)=>Ft(t,{id:"new"})));C.register("/contractors/:id",ne(Wa));C.register("/contractors/:id/edit",ne((t,s)=>Ft(t,s)));C.register("/leads",ne(vt));C.register("/leads/new",ne((t,s)=>Mt(t,{id:"new"})));C.register("/leads/:id",ne(Aa));C.register("/leads/:id/edit",ne((t,s)=>Mt(t,s)));C.register("/notifications",ne(_t));C.register("/quotes",ne(yt));C.register("/quotes/new",ne((t,s)=>zt(t,{id:"new"})));C.register("/quotes/:id",ne(zt));C.register("/jobs",ne(ft));C.register("/jobs/new",ne((t,s)=>Ht(t,{id:"new"})));C.register("/jobs/:id",ne(Na));C.register("/jobs/:id/edit",ne((t,s)=>Ht(t,s)));C.register("/timesheets",ne(tt));C.register("/assets",ne(gt));C.register("/assets/new",ne((t,s)=>Ut(t,{id:"new"})));C.register("/assets/:id",ne(Jt));C.register("/assets/:id/edit",ne((t,s)=>Ut(t,s)));C.register("/schedule",ne(Ma));C.register("/stock",ne(Re));C.register("/stock/new",ne((t,s)=>Ot(t,{id:"new"})));C.register("/stock/:id",ne(_a));C.register("/stock/:id/edit",ne((t,s)=>Ot(t,s)));C.register("/invoices",ne(at));C.register("/invoices/new",ne((t,s)=>Rt(t,{id:"new"})));C.register("/invoices/:id",ne(Rt));C.register("/purchase-orders",ne(st));C.register("/purchase-orders/new",ne((t,s)=>Bt(t,{id:"new",jobId:s.jobId})));C.register("/purchase-orders/:id",ne(Bt));C.register("/documents",ne(Ya));C.register("/reports",ne(ja));C.register("/settings",ne(ea));const Xa=["/","/people","/contractors","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings"];C.onNavigate=(t,s)=>{const e=JSON.parse(sessionStorage.getItem("currentUser")||"null"),o=t==="/"?"/":"/"+t.split("/").filter(Boolean)[0];if(!e&&t!=="/login")return C.navigate("/login"),!1;if(e){if(e.role==="customer"&&Xa.includes(o))return C.navigate("/portal"),!1;if(e.role!=="customer"&&o==="/portal")return C.navigate("/"),!1;if(e.role!=="admin"&&e.role!=="customer"&&e.userTypeId&&t!=="/login"){const l=p.getById("userTypes",e.userTypeId);if(l&&l.permissions){const r={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},a=r[o];if(a&&!(a==="Notifications"||a==="Dashboard")){const i=l.permissions.find(n=>n.module===a);if(!i||Object.entries(i||{}).every(([n,d])=>n==="module"||!d)){const d=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/assets","/documents","/settings"].find(m=>{const c=r[m];if(c==="Notifications"||c==="Dashboard")return!0;const u=l.permissions.find(b=>b.module===c);return u&&Object.entries(u).some(([b,v])=>b!=="module"&&v===!0)})||"/";if(o!==d)return C.navigate(d),!1}}}}}Tt(t),fa(t)};const Za=JSON.parse(sessionStorage.getItem("currentUser")||"null");!Za&&window.location.hash!=="#/login"&&(window.location.hash="#/login");C.resolve();
