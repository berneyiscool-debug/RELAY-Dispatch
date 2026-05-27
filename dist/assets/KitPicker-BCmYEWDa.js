import{s as u,a as b,e as i}from"./index-pDuoXKAf.js";function $({onSelect:y,context:x="quote"}){const n=u.getAll("kits").filter(t=>t.active!==!1),f=["All",...new Set(n.map(t=>t.category).filter(Boolean))],o=document.createElement("div");let r="All",s="";function d(){var v;let t=n;if(r!=="All"&&(t=t.filter(e=>e.category===r)),s){const e=s.toLowerCase();t=t.filter(a=>a.name.toLowerCase().includes(e)||(a.description||"").toLowerCase().includes(e))}o.innerHTML=`
      <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; align-items:center">
        <div class="toolbar-search" style="flex:1; min-width:200px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="kit-search" placeholder="Search kits..." value="${i(s)}" style="width:100%" />
        </div>
      </div>
      <div style="display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap">
        ${f.map(e=>`
          <button class="kit-cat-filter btn btn-sm ${e===r?"btn-primary":"btn-secondary"}" data-cat="${i(e)}">${i(e)}</button>
        `).join("")}
      </div>
      <div style="max-height:420px; overflow-y:auto">
        ${t.length===0?`
          <div style="text-align:center; padding:40px; color:var(--text-tertiary)">
            <span class="material-icons-outlined" style="font-size:36px; margin-bottom:8px">widgets</span>
            <p>No kits found</p>
          </div>
        `:t.map(e=>{const a=e.items.filter(p=>p.type!=="labor").length,l=e.items.filter(p=>p.type==="labor").length,g=x==="po"?`Cost: $${(e.totalCost||0).toFixed(2)}`:`Sell: $${(e.totalPrice||0).toFixed(2)}`;return`
            <div class="kit-pick-item" data-id="${e.id}" style="padding:14px 16px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px; cursor:pointer; transition:all 0.15s ease; display:flex; justify-content:space-between; align-items:center">
              <div style="flex:1; min-width:0">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px">
                  <span style="font-weight:600; font-size:var(--font-size-base)">${i(e.name)}</span>
                  <span class="badge badge-neutral" style="font-size:10px">${i(e.category)}</span>
                </div>
                <div style="font-size:12px; color:var(--text-secondary); margin-bottom:6px">${i(e.description||"")}</div>
                <div style="display:flex; gap:12px; font-size:11px; color:var(--text-tertiary)">
                  <span>${a} material${a!==1?"s":""}</span>
                  ${l>0?`<span>${l} labour</span>`:""}
                  <span style="font-weight:600; color:var(--text-secondary)">${g}</span>
                </div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary); font-size:28px; flex-shrink:0">add_circle_outline</span>
            </div>
          `}).join("")}
      </div>
    `,(v=o.querySelector("#kit-search"))==null||v.addEventListener("input",e=>{s=e.target.value,d()}),o.querySelectorAll(".kit-cat-filter").forEach(e=>{e.addEventListener("click",()=>{r=e.dataset.cat,d()})}),o.querySelectorAll(".kit-pick-item").forEach(e=>{e.addEventListener("mouseenter",()=>{e.style.borderColor="var(--color-primary)",e.style.background="var(--color-primary-light, rgba(49,86,113,0.04))"}),e.addEventListener("mouseleave",()=>{e.style.borderColor="var(--border-color)",e.style.background=""}),e.addEventListener("click",()=>{const a=n.find(l=>l.id===e.dataset.id);a&&y&&(y(a),m())})})}d();let m;const c=b({title:"Add Kit",content:o,size:"lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:t=>t()}]});m=(c==null?void 0:c.close)||(()=>{var t;return(t=document.querySelector(".modal-overlay"))==null?void 0:t.remove()})}export{$ as showKitPicker};
