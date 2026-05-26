(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))s(c);new MutationObserver(c=>{for(const l of c)if(l.type==="childList")for(const m of l.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&s(m)}).observe(document,{childList:!0,subtree:!0});function t(c){const l={};return c.integrity&&(l.integrity=c.integrity),c.referrerPolicy&&(l.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?l.credentials="include":c.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function s(c){if(c.ep)return;c.ep=!0;const l=t(c);fetch(c.href,l)}})();class Qa{constructor(){this.routes={},this.currentRoute=null,this.onNavigate=null,typeof window<"u"&&window.addEventListener("hashchange",()=>this.resolve())}register(a,t){this.routes[a]=t}navigate(a){if(typeof window<"u"){let t=a.startsWith("#")?a.slice(1):a;t.startsWith("/")||(t="/"+t);let s=window.location.hash.startsWith("#")?window.location.hash.slice(1):window.location.hash;s.startsWith("/")||(s="/"+s),s===t?this.resolve(t):window.location.hash="#"+t}}resolve(a){let t=a||(typeof window<"u"?window.location.hash.slice(1):"/")||"/";const s=t.indexOf("?"),c={};if(s!==-1){const n=t.substring(s+1);t=t.substring(0,s),n.split("&").forEach(p=>{const[o,f]=p.split("=");o&&(c[o]=decodeURIComponent(f||""))})}const{handler:l,params:m}=this.matchRoute(t);if(l){this.currentRoute=t;const n={...m,...c};if(this.onNavigate&&this.onNavigate(t,n)===!1)return;l(n)}}matchRoute(a){if(this.routes[a])return{handler:this.routes[a],params:{}};for(const[t,s]of Object.entries(this.routes)){const c=t.split("/"),l=a.split("/");if(c.length!==l.length)continue;const m={};let n=!0;for(let p=0;p<c.length;p++)if(c[p].startsWith(":"))m[c[p].slice(1)]=l[p];else if(c[p]!==l[p]){n=!1;break}if(n)return{handler:s,params:m}}return{handler:null,params:{}}}getCurrentPath(){return typeof window<"u"&&window.location.hash.slice(1)||"/"}getBasePath(){return"/"+(this.getCurrentPath().split("/").filter(Boolean)[0]||"")}}const X=new Qa,Ga=[{id:"ft_jsa_swms",name:"Job Safety Analysis (JSA) / SWMS",description:"Outlines risks and control measures before high-risk tasks.",sections:[{id:"s_jsa_info",title:"Job Details & Induction",columns:2,fields:[{id:"f_jsa_job",type:"text",label:"Job Reference / Task Name",required:!0,colSpan:1},{id:"f_jsa_date",type:"date",label:"Date",required:!0,colSpan:1},{id:"f_jsa_supervisor",type:"text",label:"Supervisor Name",required:!0,colSpan:1},{id:"f_jsa_company",type:"text",label:"Company / Contractor",required:!0,colSpan:1},{id:"f_jsa_desc",type:"textarea",label:"Description of Work",required:!0,colSpan:2}]},{id:"s_jsa_hazards",title:"Hazard Identification",columns:2,fields:[{id:"f_jsa_haz_fall",type:"checkbox",label:"Working at Heights / Fall Risk",colSpan:1},{id:"f_jsa_haz_elec",type:"checkbox",label:"Live Electrical Work",colSpan:1},{id:"f_jsa_haz_confined",type:"checkbox",label:"Confined Space Entry",colSpan:1},{id:"f_jsa_haz_chem",type:"checkbox",label:"Hazardous Chemicals / Asbestos",colSpan:1},{id:"f_jsa_haz_plant",type:"checkbox",label:"Mobile Plant / Heavy Machinery",colSpan:1},{id:"f_jsa_haz_other",type:"text",label:"Other Hazards",colSpan:1}]},{id:"s_jsa_controls",title:"Risk Controls & PPE",columns:2,fields:[{id:"f_jsa_ppe_hardhat",type:"checkbox",label:"Hard Hat",colSpan:1},{id:"f_jsa_ppe_boots",type:"checkbox",label:"Steel Capped Boots",colSpan:1},{id:"f_jsa_ppe_vest",type:"checkbox",label:"Hi-Vis Clothing",colSpan:1},{id:"f_jsa_ppe_glasses",type:"checkbox",label:"Safety Glasses",colSpan:1},{id:"f_jsa_control_desc",type:"textarea",label:"Detailed Control Measures",required:!0,colSpan:2}]},{id:"s_jsa_signoff",title:"Sign Off",columns:1,fields:[{id:"f_jsa_info1",type:"info",label:"By signing below, I confirm I have read and understood the hazards and control measures associated with this task."},{id:"f_jsa_sign",type:"signature",label:"Worker Signature",required:!0}]}]},{id:"ft_daily_report",name:"Daily Site Report",description:"Tracks weather, daily progress, and subcontractor logs.",sections:[{id:"s_dsr_meta",title:"Site Conditions",columns:2,fields:[{id:"f_dsr_date",type:"date",label:"Date",required:!0,colSpan:1},{id:"f_dsr_weather",type:"select",label:"Weather Conditions",options:["Clear/Sunny","Overcast","Light Rain","Heavy Rain","Extreme Heat","High Winds"],required:!0,colSpan:1},{id:"f_dsr_temp",type:"text",label:"Temperature (Approx)",colSpan:1},{id:"f_dsr_delays",type:"checkbox",label:"Were there any weather delays?",colSpan:1}]},{id:"s_dsr_work",title:"Work & Progress",columns:1,fields:[{id:"f_dsr_progress",type:"textarea",label:"Summary of Work Completed Today",required:!0},{id:"f_dsr_materials",type:"textarea",label:"Materials Delivered / Used"},{id:"f_dsr_subs",type:"textarea",label:"Subcontractors on Site (Names/Companies)"}]},{id:"s_dsr_issues",title:"Issues & Safety",columns:2,fields:[{id:"f_dsr_incidents",type:"checkbox",label:"Any safety incidents or near misses?",colSpan:1},{id:"f_dsr_variations",type:"checkbox",label:"Any client variations requested?",colSpan:1},{id:"f_dsr_issue_desc",type:"textarea",label:"Issue Details (if any)",colSpan:2}]},{id:"s_dsr_signoff",title:"Sign Off",columns:1,fields:[{id:"f_dsr_sign",type:"signature",label:"Site Supervisor Signature",required:!0}]}]},{id:"ft_induction",name:"Site Induction Form",description:"Standard safety orientations for new workers on site.",sections:[{id:"s_ind_person",title:"Worker Details",columns:2,fields:[{id:"f_ind_name",type:"text",label:"Full Name",required:!0,colSpan:1},{id:"f_ind_company",type:"text",label:"Company",required:!0,colSpan:1},{id:"f_ind_phone",type:"text",label:"Contact Number",required:!0,colSpan:1},{id:"f_ind_emergency",type:"text",label:"Emergency Contact",required:!0,colSpan:1}]},{id:"s_ind_checklist",title:"Induction Checklist",columns:1,fields:[{id:"f_ind_chk_1",type:"checkbox",label:"Shown site amenities (toilets, crib room, first aid)"},{id:"f_ind_chk_2",type:"checkbox",label:"Explained evacuation procedures & assembly points"},{id:"f_ind_chk_3",type:"checkbox",label:"Reviewed Site Safety Rules & PPE requirements"},{id:"f_ind_chk_4",type:"checkbox",label:"Provided copies of required licenses / white card"}]},{id:"s_ind_signoff",title:"Declaration",columns:1,fields:[{id:"f_ind_info",type:"info",label:"I acknowledge that I have received the site induction and agree to abide by all site safety rules and procedures."},{id:"f_ind_sign",type:"signature",label:"Worker Signature",required:!0}]}]},{id:"ft_plumb_comp",name:"Plumbing Compliance Certificate",description:"Verifies that gas/plumbing work meets state and local regulatory standards.",sections:[{id:"s_pc_meta",title:"Installation Details",columns:2,fields:[{id:"f_pc_type",type:"select",label:"Work Type",options:["Sanitary","Water Supply","Drainage","Roofing","Gasfitting","Mechanical Services"],required:!0,colSpan:1},{id:"f_pc_class",type:"select",label:"Building Classification",options:["Class 1","Class 2-9","Class 10"],required:!0,colSpan:1},{id:"f_pc_desc",type:"textarea",label:"Description of Plumbing Work",required:!0,colSpan:2}]},{id:"s_pc_tests",title:"Testing & Verification",columns:2,fields:[{id:"f_pc_test_pressure",type:"checkbox",label:"Pressure test passed",colSpan:1},{id:"f_pc_test_flow",type:"checkbox",label:"Flow rates verified",colSpan:1},{id:"f_pc_test_leaks",type:"checkbox",label:"System free of leaks",colSpan:1},{id:"f_pc_test_standards",type:"checkbox",label:"Complies with AS/NZS 3500",colSpan:1}]},{id:"s_pc_sign",title:"Plumber Declaration",columns:1,fields:[{id:"f_pc_license",type:"text",label:"Plumber License Number",required:!0},{id:"f_pc_info",type:"info",label:"I certify that the plumbing work described above complies with the relevant plumbing laws and standards."},{id:"f_pc_sign",type:"signature",label:"Licensed Plumber Signature",required:!0}]}]},{id:"ft_leak_detect",name:"Leak Detection & Backflow Report",description:"Documents diagnostic checks and system faults.",sections:[{id:"s_ld_sys",title:"System Details",columns:2,fields:[{id:"f_ld_asset",type:"text",label:"Device / Asset ID",colSpan:1},{id:"f_ld_type",type:"select",label:"Device Type",options:["RPZD","Double Check Valve","Air Gap","Other"],required:!0,colSpan:1},{id:"f_ld_loc",type:"text",label:"Exact Location on Site",required:!0,colSpan:2}]},{id:"s_ld_results",title:"Test Results",columns:2,fields:[{id:"f_ld_pressure",type:"text",label:"Line Pressure (kPa)",colSpan:1},{id:"f_ld_drop",type:"text",label:"Pressure Drop (kPa)",colSpan:1},{id:"f_ld_pass",type:"select",label:"Overall Result",options:["PASS","FAIL"],required:!0,colSpan:2},{id:"f_ld_notes",type:"textarea",label:"Faults / Repair Notes",colSpan:2}]},{id:"s_ld_sign",title:"Sign Off",columns:1,fields:[{id:"f_ld_sign",type:"signature",label:"Tester Signature",required:!0}]}]},{id:"ft_gas_safety",name:"Gas Safety Checklist",description:"Pre-commissioning and safety assessment logs.",sections:[{id:"s_gs_appliance",title:"Appliance Information",columns:2,fields:[{id:"f_gs_make",type:"text",label:"Make & Model",required:!0,colSpan:1},{id:"f_gs_serial",type:"text",label:"Serial Number",colSpan:1},{id:"f_gs_type",type:"select",label:"Gas Type",options:["Natural Gas (NG)","LPG"],required:!0,colSpan:1},{id:"f_gs_loc",type:"text",label:"Location",colSpan:1}]},{id:"s_gs_checks",title:"Safety Checks",columns:2,fields:[{id:"f_gs_vent",type:"checkbox",label:"Ventilation adequate (AS/NZS 5601)",colSpan:1},{id:"f_gs_clearance",type:"checkbox",label:"Clearances to combustibles met",colSpan:1},{id:"f_gs_pressure",type:"checkbox",label:"Operating pressure correct",colSpan:1},{id:"f_gs_leak",type:"checkbox",label:"Soap test / Leak test passed",colSpan:1},{id:"f_gs_co",type:"checkbox",label:"CO spillage test passed (if applicable)",colSpan:1}]},{id:"s_gs_sign",title:"Sign Off",columns:1,fields:[{id:"f_gs_license",type:"text",label:"Gas Fitter License No.",required:!0},{id:"f_gs_sign",type:"signature",label:"Fitter Signature",required:!0}]}]},{id:"ft_test_tag",name:"Test & Tag Report",description:"Records the electrical safety status of tools and appliances.",sections:[{id:"s_tt_equip",title:"Equipment Details",columns:2,fields:[{id:"f_tt_id",type:"text",label:"Asset/Plant ID",required:!0,colSpan:1},{id:"f_tt_desc",type:"text",label:"Equipment Description",required:!0,colSpan:1},{id:"f_tt_class",type:"select",label:"Class",options:["Class I (Earthed)","Class II (Double Insulated)","RCD","Cord Extension"],required:!0,colSpan:2}]},{id:"s_tt_tests",title:"Test Results",columns:2,fields:[{id:"f_tt_visual",type:"select",label:"Visual Inspection",options:["Pass","Fail"],required:!0,colSpan:1},{id:"f_tt_earth",type:"select",label:"Earth Continuity",options:["Pass","Fail","N/A"],required:!0,colSpan:1},{id:"f_tt_insulation",type:"select",label:"Insulation Resistance",options:["Pass","Fail"],required:!0,colSpan:1},{id:"f_tt_polarity",type:"select",label:"Polarity (if cord)",options:["Pass","Fail","N/A"],colSpan:1},{id:"f_tt_overall",type:"select",label:"Overall Result",options:["PASS (Tagged)","FAIL (Danger Tagged)"],required:!0,colSpan:2}]},{id:"s_tt_sign",title:"Tester Sign Off",columns:1,fields:[{id:"f_tt_date",type:"date",label:"Next Test Due Date",required:!0},{id:"f_tt_sign",type:"signature",label:"Tester Signature",required:!0}]}]},{id:"ft_switchboard",name:"Switchboard Inspection",description:"Documents thermal imaging, faults, and board condition.",sections:[{id:"s_sw_meta",title:"Board Information",columns:2,fields:[{id:"f_sw_id",type:"text",label:"Switchboard ID/Name",required:!0,colSpan:1},{id:"f_sw_loc",type:"text",label:"Location",colSpan:1},{id:"f_sw_rating",type:"text",label:"Main Switch Rating (Amps)",colSpan:1},{id:"f_sw_rcd",type:"checkbox",label:"Are RCDs fitted to all required circuits?",colSpan:1}]},{id:"s_sw_visual",title:"Inspection & Thermal",columns:2,fields:[{id:"f_sw_clean",type:"checkbox",label:"Board clean and free of debris",colSpan:1},{id:"f_sw_legend",type:"checkbox",label:"Circuit legend accurate and legible",colSpan:1},{id:"f_sw_thermal",type:"select",label:"Thermal Imaging Result",options:["Normal","Minor Hotspots","Critical Faults Found"],colSpan:2},{id:"f_sw_notes",type:"textarea",label:"Defects / Rectification required",colSpan:2}]},{id:"s_sw_sign",title:"Inspector Sign Off",columns:1,fields:[{id:"f_sw_sign",type:"signature",label:"Electrician Signature",required:!0}]}]},{id:"ft_cable_verif",name:"Cable Verification Report",description:"Confirms data or telecom wiring compliance.",sections:[{id:"s_cv_meta",title:"Network Details",columns:2,fields:[{id:"f_cv_cat",type:"select",label:"Cable Category",options:["Cat 5e","Cat 6","Cat 6A","Optical Fibre","Coax"],required:!0,colSpan:1},{id:"f_cv_tester",type:"text",label:"Tester Make/Model used",colSpan:1}]},{id:"s_cv_results",title:"Testing Checklist",columns:2,fields:[{id:"f_cv_wiremap",type:"checkbox",label:"Wiremap / Continuity passed",colSpan:1},{id:"f_cv_length",type:"checkbox",label:"Length within limits",colSpan:1},{id:"f_cv_next",type:"checkbox",label:"NEXT / Return Loss passed",colSpan:1},{id:"f_cv_label",type:"checkbox",label:"Outlets & Patch panels labelled",colSpan:1},{id:"f_cv_notes",type:"textarea",label:"Failing Runs / Notes",colSpan:2}]},{id:"s_cv_sign",title:"Technician Sign Off",columns:1,fields:[{id:"f_cv_sign",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"ft_hvac_maint",name:"HVAC Maintenance Checklist",description:"Used for routine AC and heating system servicing.",sections:[{id:"s_hvac_unit",title:"Unit Details",columns:2,fields:[{id:"f_hvac_make",type:"text",label:"Make & Model",required:!0,colSpan:1},{id:"f_hvac_serial",type:"text",label:"Serial Number",colSpan:1},{id:"f_hvac_type",type:"select",label:"System Type",options:["Split System","Ducted","Package Unit","VRV/VRF","Chiller"],colSpan:2}]},{id:"s_hvac_tasks",title:"Maintenance Tasks",columns:2,fields:[{id:"f_hvac_filters",type:"checkbox",label:"Filters cleaned / replaced",colSpan:1},{id:"f_hvac_coils",type:"checkbox",label:"Evap & Condenser coils cleaned",colSpan:1},{id:"f_hvac_drain",type:"checkbox",label:"Condensate drain flushed",colSpan:1},{id:"f_hvac_elec",type:"checkbox",label:"Electrical terminals tightened",colSpan:1},{id:"f_hvac_refrig",type:"checkbox",label:"Refrigerant charge checked",colSpan:1},{id:"f_hvac_temp",type:"text",label:"Supply Air Temp (°C)",colSpan:1},{id:"f_hvac_notes",type:"textarea",label:"Recommendations / Faults",colSpan:2}]},{id:"s_hvac_sign",title:"Sign Off",columns:1,fields:[{id:"f_hvac_sign",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"ft_pressure_test",name:"Pressure Testing Form",description:"Records pressure ratings for refrigerant or ductwork.",sections:[{id:"s_pt_sys",title:"System Information",columns:2,fields:[{id:"f_pt_sys",type:"text",label:"System/Pipework ID",required:!0,colSpan:1},{id:"f_pt_medium",type:"select",label:"Test Medium",options:["Dry Nitrogen","Water","Air","Refrigerant"],required:!0,colSpan:1}]},{id:"s_pt_readings",title:"Test Readings",columns:2,fields:[{id:"f_pt_start_p",type:"text",label:"Start Pressure (kPa)",required:!0,colSpan:1},{id:"f_pt_start_t",type:"text",label:"Start Time",required:!0,colSpan:1},{id:"f_pt_end_p",type:"text",label:"End Pressure (kPa)",required:!0,colSpan:1},{id:"f_pt_end_t",type:"text",label:"End Time",required:!0,colSpan:1},{id:"f_pt_result",type:"select",label:"Test Result",options:["PASS (No drop)","FAIL (Pressure drop)"],required:!0,colSpan:2}]},{id:"s_pt_sign",title:"Sign Off",columns:1,fields:[{id:"f_pt_sign",type:"signature",label:"Tester Signature",required:!0}]}]},{id:"ft_commissioning",name:"Commissioning Report",description:"Ensures systems are operating to manufacturer specifications.",sections:[{id:"s_cm_meta",title:"Equipment Information",columns:2,fields:[{id:"f_cm_equip",type:"text",label:"Equipment Name/ID",required:!0,colSpan:2},{id:"f_cm_make",type:"text",label:"Make & Model",colSpan:1},{id:"f_cm_serial",type:"text",label:"Serial Number",colSpan:1}]},{id:"s_cm_checks",title:"Pre-Start & Running Checks",columns:2,fields:[{id:"f_cm_install",type:"checkbox",label:"Installed to manufacturer specs",colSpan:1},{id:"f_cm_power",type:"checkbox",label:"Power supply verified",colSpan:1},{id:"f_cm_controls",type:"checkbox",label:"Thermostat/Controls operational",colSpan:1},{id:"f_cm_amps",type:"text",label:"Running Amps (L1, L2, L3)",colSpan:1},{id:"f_cm_notes",type:"textarea",label:"Commissioning Notes / Handover",colSpan:2}]},{id:"s_cm_sign",title:"Sign Off",columns:1,fields:[{id:"f_cm_sign",type:"signature",label:"Commissioning Tech Signature",required:!0}]}]},{id:"ft_heights_permit",name:"Working at Heights Permit",description:"Authorizes ladder, roof, or scaffolding work.",sections:[{id:"s_wh_meta",title:"Permit Details",columns:2,fields:[{id:"f_wh_loc",type:"text",label:"Exact Location of Work",required:!0,colSpan:2},{id:"f_wh_method",type:"select",label:"Access Method",options:["Scaffolding","EWP / Boom Lift","Harness / Roof Anchor","Extension Ladder","Platform Ladder"],required:!0,colSpan:1},{id:"f_wh_height",type:"text",label:"Approx Height (m)",colSpan:1}]},{id:"s_wh_controls",title:"Safety Controls in Place",columns:2,fields:[{id:"f_wh_barricades",type:"checkbox",label:"Barricades / Drop zones established",colSpan:1},{id:"f_wh_weather",type:"checkbox",label:"Weather conditions assessed",colSpan:1},{id:"f_wh_harness",type:"checkbox",label:"Harnesses inspected & in date",colSpan:1},{id:"f_wh_rescue",type:"checkbox",label:"Rescue plan documented",colSpan:1}]},{id:"s_wh_auth",title:"Authorization",columns:2,fields:[{id:"f_wh_auth_name",type:"text",label:"Authorizing Person",required:!0,colSpan:1},{id:"f_wh_auth_sign",type:"signature",label:"Authorization Signature",required:!0,colSpan:1},{id:"f_wh_worker_sign",type:"signature",label:"Worker Signature",required:!0,colSpan:2}]}]},{id:"ft_defect_list",name:"Defect / Handover List",description:"Records incomplete work or minor fixes required before final sign-off.",sections:[{id:"s_df_meta",title:"Handover Details",columns:2,fields:[{id:"f_df_area",type:"text",label:"Room / Area",required:!0,colSpan:1},{id:"f_df_client",type:"text",label:"Client Name",required:!0,colSpan:1}]},{id:"s_df_items",title:"Defect Identification",columns:1,fields:[{id:"f_df_list",type:"textarea",label:"List of Defects / Snags",required:!0},{id:"f_df_photos",type:"checkbox",label:"Photos taken and attached to job?"},{id:"f_df_action",type:"select",label:"Required Action",options:["Touch up paint","Adjust hinges/doors","Replace damaged item","Clean up required","Other (describe above)"]}]},{id:"s_df_sign",title:"Sign Off",columns:2,fields:[{id:"f_df_builder_sign",type:"signature",label:"Builder/Tech Signature",required:!0,colSpan:1},{id:"f_df_client_sign",type:"signature",label:"Client Signature (Acknowledged)",colSpan:1}]}]},{id:"ft_site_measure",name:"Site Measure Sheet",description:"Accurate dimensions for custom cabinets, frames, and trim.",sections:[{id:"s_sm_meta",title:"Measurement Details",columns:2,fields:[{id:"f_sm_room",type:"text",label:"Room / Elevation",required:!0,colSpan:1},{id:"f_sm_type",type:"select",label:"Item to measure",options:["Kitchen Cabinetry","Wardrobes","Windows/Doors","Skirting/Trim","Other"],required:!0,colSpan:1},{id:"f_sm_walls",type:"checkbox",label:"Walls checked for plumb?",colSpan:1},{id:"f_sm_floors",type:"checkbox",label:"Floors checked for level?",colSpan:1}]},{id:"s_sm_dims",title:"Dimensions",columns:1,fields:[{id:"f_sm_w",type:"text",label:"Overall Width (mm)"},{id:"f_sm_h",type:"text",label:"Overall Height (mm)"},{id:"f_sm_d",type:"text",label:"Overall Depth (mm)"},{id:"f_sm_notes",type:"textarea",label:"Specific Notes / Cutouts (Plumbing/Electrical)"}]},{id:"s_sm_sign",title:"Sign Off",columns:1,fields:[{id:"f_sm_sign",type:"signature",label:"Measurer Signature",required:!0}]}]}],Nt="simpro_";class Ya{constructor(){this.listeners={}}_key(a){return Nt+a}getAll(a){try{const t=localStorage.getItem(this._key(a));return t?JSON.parse(t):[]}catch{return[]}}getById(a,t){return this.getAll(a).find(c=>c.id===t)||null}save(a,t){localStorage.setItem(this._key(a),JSON.stringify(t)),this.emit(a,t)}create(a,t){const s=this.getAll(a);return t.id=t.id||this.generateId(),t.createdAt=t.createdAt||new Date().toISOString(),t.updatedAt=new Date().toISOString(),s.push(t),this.save(a,s),t}update(a,t,s){const c=this.getAll(a),l=c.findIndex(n=>n.id===t);if(l===-1)return null;const m=c[l];if(c[l]={...c[l],...s,updatedAt:new Date().toISOString()},this.save(a,c),a==="jobs"&&s.status==="Completed"&&m.status!=="Completed"){const n=c[l];if(n.assetId){const p=this.getAll("assets"),o=p.findIndex(f=>f.id===n.assetId);if(o!==-1){const f=p[o],g=f.logs||[],i=`Completed Maintenance Job #${n.number} - ${n.title}`;g.some(x=>x.notes===i)||(g.push({id:"log_"+Date.now()+Math.random().toString(36).substr(2,5),type:"Service",date:new Date().toISOString().split("T")[0],meter:f.currentMeter||0,cost:(n.laborCost||0)+(n.materialCost||0),notes:i}),f.logs=g,this.save("assets",p))}}}return c[l]}delete(a,t){const c=this.getAll(a).filter(l=>l.id!==t);this.save(a,c)}generateId(){return Date.now().toString(36)+Math.random().toString(36).substr(2,9)}getSettings(){const a={markupPercent:20,materialMarkup:{defaultPercent:30,minMarkupAmount:5,useTiers:!0,tiers:[{upTo:50,percent:60},{upTo:200,percent:45},{upTo:1e3,percent:30},{upTo:null,percent:15}]},materialCategories:["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],laborRates:[{id:"rate_1",name:"Standard Rate",rate:85,description:"Normal business hours Mon–Fri",overtimeMultiplier:1,minCallOutFee:0,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!0},{id:"rate_2",name:"After Hours Rate",rate:127.5,description:"Evenings and early mornings",overtimeMultiplier:1.5,minCallOutFee:45,applicableDays:["Mon","Tue","Wed","Thu","Fri"],isDefault:!1},{id:"rate_3",name:"Saturday Rate",rate:127.5,description:"Saturday work",overtimeMultiplier:1.5,minCallOutFee:65,applicableDays:["Sat"],isDefault:!1},{id:"rate_4",name:"Sunday Rate",rate:170,description:"Sunday and public holidays",overtimeMultiplier:2,minCallOutFee:85,applicableDays:["Sun","PH"],isDefault:!1},{id:"rate_5",name:"Emergency Rate",rate:195,description:"Urgent call-outs any day",overtimeMultiplier:2,minCallOutFee:120,applicableDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],isDefault:!1}]};try{const t=localStorage.getItem(this._key("settings"));return t?JSON.parse(t):a}catch{return a}}saveSettings(a){localStorage.setItem(this._key("settings"),JSON.stringify(a)),this.emit("settings",a)}on(a,t){this.listeners[a]||(this.listeners[a]=[]),this.listeners[a].push(t)}off(a,t){this.listeners[a]&&(this.listeners[a]=this.listeners[a].filter(s=>s!==t))}emit(a,t){this.listeners[a]&&this.listeners[a].forEach(s=>s(t))}isSeeded(){return localStorage.getItem(Nt+"_seeded")==="true"}markSeeded(){localStorage.setItem(Nt+"_seeded","true")}clearAll(){Object.keys(localStorage).filter(a=>a.startsWith(Nt)).forEach(a=>localStorage.removeItem(a))}seedFormTemplates(){this.getAll("formTemplates").length===0&&this.save("formTemplates",Ga)}}const r=new Ya;r.seedFormTemplates();const Ka=Object.freeze(Object.defineProperty({__proto__:null,store:r},Symbol.toStringTag,{value:"Module"}));function Le(e,a){const t=JSON.parse(localStorage.getItem("currentUser")||"null");if(!t)return!1;if(t.role==="admin")return!0;if(t.role==="customer")return!1;if(t.userTypeId){const s=r.getById("userTypes",t.userTypeId);if(s&&s.permissions){const c=s.permissions.find(l=>l.module===e);return c?!!c[a]:!1}}return t.role==="technician"?e==="Dashboard"?a==="view":e==="Jobs"?["view","manage_tasks","book_time"].includes(a):e==="Timesheets"?["view_own","create"].includes(a):e==="Schedule"?["view_own"].includes(a):!1:t.role==="manager"?e==="Settings"?["view","edit_company","manage_tax"].includes(a):!0:!1}const St={Dashboard:[{key:"view",label:"View Dashboard"}],Customers:[{key:"view",label:"View Customers"},{key:"create",label:"Create Customers"},{key:"edit",label:"Edit Customer Details"},{key:"delete",label:"Delete Customers"},{key:"manage_contacts",label:"Manage Contacts & Sites"}],Leads:[{key:"view",label:"View Leads"},{key:"create",label:"Create Leads"},{key:"edit",label:"Edit Leads"},{key:"delete",label:"Delete Leads"},{key:"convert",label:"Convert Lead to Quote / Job"}],Quotes:[{key:"view",label:"View Quotes"},{key:"create",label:"Create Quotes"},{key:"edit",label:"Edit Quotes"},{key:"delete",label:"Delete Quotes"},{key:"approve",label:"Approve / Accept Quotes"},{key:"convert",label:"Convert to Job"},{key:"generate_pdf",label:"Generate & Save PDF"}],Jobs:[{key:"view",label:"View Jobs"},{key:"create",label:"Create Jobs"},{key:"edit",label:"Edit Job Details"},{key:"delete",label:"Delete Jobs"},{key:"manage_tasks",label:"Manage Tasks & Tasklists"},{key:"book_time",label:"Book Time to Tasks"},{key:"view_costs",label:"View Costs Tab"},{key:"view_quotes_tab",label:"View Quotes Tab"},{key:"view_pos_tab",label:"View POs Tab"},{key:"view_timesheets_tab",label:"View Timesheets Tab"},{key:"view_invoices_tab",label:"View Invoices Tab"},{key:"manage_materials",label:"Manage Materials & Stock"},{key:"create_invoice",label:"Create Invoices from Job"}],Timesheets:[{key:"view_own",label:"View Own Timesheets"},{key:"view",label:"View All Timesheets"},{key:"create",label:"Create / Submit Timesheets"},{key:"approve",label:"Approve Timesheets"},{key:"edit_all",label:"Edit Any Timesheet"},{key:"export",label:"Export Timesheets"}],Assets:[{key:"view",label:"View Assets"},{key:"create",label:"Create Assets"},{key:"edit",label:"Edit Assets"},{key:"delete",label:"Delete Assets"}],Schedule:[{key:"view_own",label:"View Own Schedule"},{key:"view",label:"View Full Schedule"},{key:"edit",label:"Manage Schedule (Drag/Drop)"}],Contractors:[{key:"view",label:"View Contractors"},{key:"create",label:"Create Contractors"},{key:"edit",label:"Edit Contractors"}],Suppliers:[{key:"view",label:"View Suppliers"},{key:"create",label:"Create Suppliers"},{key:"edit",label:"Edit Suppliers"},{key:"delete",label:"Delete Suppliers"}],Stock:[{key:"view",label:"View Inventory"},{key:"create",label:"Create Stock Items"},{key:"edit",label:"Manage Stock Levels"},{key:"delete",label:"Delete Stock"}],"Purchase Orders":[{key:"view",label:"View POs"},{key:"create",label:"Create POs"},{key:"approve",label:"Approve POs"}],Invoices:[{key:"view",label:"View Invoices"},{key:"create",label:"Create Invoices"},{key:"send",label:"Send Invoices"},{key:"void",label:"Void Invoices"}],Reports:[{key:"view",label:"Access Reports"},{key:"export",label:"Export Data"}],Documents:[{key:"view",label:"View Documents"},{key:"upload",label:"Upload Files"}],Settings:[{key:"view",label:"View Settings"},{key:"edit_company",label:"Edit Company Profile"},{key:"manage_users",label:"Manage Users & Permissions"},{key:"manage_tax",label:"Manage Tax & Finance"}]};function Tt(e){return Object.entries(St).map(([a,t])=>{const s={module:a};return t.forEach(({key:c})=>{s[c]=e(a,c)}),s})}function Kt(){const e=r.getAll("userTypes");if(e&&e.length>0)return e;const a=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:Tt(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings access",permissions:Tt((t,s)=>t==="Settings"?["view","edit_company","manage_tax"].includes(s):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs, schedule and timesheets",permissions:Tt((t,s)=>t==="Dashboard"?s==="view":t==="Jobs"?["view","manage_tasks","book_time"].includes(s):t==="Timesheets"?["view_own","create"].includes(s):t==="Schedule"?["view_own"].includes(s):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Tt((t,s)=>t==="Settings"?!1:t==="Reports"?s==="view":!(["Invoices","Purchase Orders","Suppliers"].includes(t)&&s==="delete"))}];return r.save("userTypes",a),a}const Xa=[{company:"Acme Electrical Services",first:"James",last:"Henderson"},{company:"BluePeak Plumbing Co",first:"Sarah",last:"Mitchell"},{company:"ClearAir HVAC Solutions",first:"David",last:"Thompson"},{company:"Delta Fire Protection",first:"Emily",last:"Rodriguez"},{company:"Evergreen Security Systems",first:"Michael",last:"Chen"},{company:"Falcon Mechanical",first:"Lisa",last:"Anderson"},{company:"GreenLeaf Property Mgmt",first:"Robert",last:"Williams"},{company:"Harbor Construction Group",first:"Jennifer",last:"Davis"},{company:"Iron Shield Roofing",first:"Christopher",last:"Taylor"},{company:"Jade Commercial Fitouts",first:"Amanda",last:"Brown"},{company:"Knight Industrial Services",first:"Daniel",last:"Wilson"},{company:"Lakeside Developments",first:"Michelle",last:"Garcia"}],gt=[{id:"tech1",name:"Mark Sullivan",role:"Senior Electrician",color:"#3B82F6",userTypeId:"ut_admin",payRate:95},{id:"tech2",name:"Jake Patterson",role:"Operations Manager",color:"#10B981",userTypeId:"ut_manager",payRate:85},{id:"tech3",name:"Ryan Cooper",role:"HVAC Technician",color:"#F59E0B",userTypeId:"ut_tech",payRate:58},{id:"tech4",name:"Tom Bradley",role:"Fire Systems Specialist",color:"#EF4444",userTypeId:"ut_tech",payRate:62},{id:"tech5",name:"Nathan Brooks",role:"Security Installer",color:"#8B5CF6",userTypeId:"ut_tech",payRate:55},{id:"tech6",name:"Carlos Ramírez",role:"Office Administrator",color:"#EC4899",userTypeId:"ut_office",payRate:42}],Ct=["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"],Xt=["145 King St","88 Queen Rd","201 George Ave","55 Elizabeth Dr","312 Market St","78 Bridge Ln","420 Park Ave","33 Oak Blvd"],jt=["Southbank","Richmond","Carlton","Docklands","Brunswick","Fitzroy","Collingwood","Hawthorn"];function _e(e){return e[Math.floor(Math.random()*e.length)]}function Ve(e,a=0){const t=new Date,s=Math.floor(Math.random()*(e+a))-e;return new Date(t.getTime()+s*864e5).toISOString()}function ct(e,a){return Math.round((Math.random()*(a-e)+e)*100)/100}function Za(){return Xa.map((e,a)=>{const t=_e(Xt),s=_e(Xt);return{id:`cust_${a+1}`,company:e.company,firstName:e.first,lastName:e.last,email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`,address:`${t}, ${_e(jt)}, VIC 3000`,status:_e(["Active","Active","Active","Inactive"]),type:_e(["Company","Company","Individual"]),notes:"",createdAt:Ve(365),updatedAt:Ve(30),sites:[{name:"Main Office",address:`${t}, ${_e(jt)}, VIC 3000`},{name:"Warehouse",address:`${s}, ${_e(jt)}, VIC 3001`}],contacts:[{name:`${e.first} ${e.last}`,role:"Primary",email:`${e.first.toLowerCase()}@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`},{name:`${_e(["Alex","Sam","Jordan","Casey","Morgan"])} ${e.last}`,role:"Site Manager",email:`site@${e.company.split(" ")[0].toLowerCase()}.com.au`,phone:`04${Math.floor(1e7+Math.random()*9e7)}`}]}})}function pa(){return[{id:"cont_1",businessName:"EcoVolt Electrical Services",contactName:"Elena Rostova",email:"elena@ecovoltelectrical.com.au",phone:"0498 765 432",licenseNumber:"LIC-EL-88390",active:!0,hourlyRate:95,afterHoursRate:142.5,calloutFee:85,specialties:["Solar PV Installation","Battery Systems","Switchboard Upgrades"],notes:"Preferred subcontractor for large-scale solar rollouts. Highly reliable.",portalToken:"c_pt_ecovolt",complianceDocs:[{id:"doc_1_1",type:"Public Liability Insurance",number:"PL-992110-A",expiryDate:"2026-10-15",verified:!0,notes:"Cover up to $20M"},{id:"doc_1_2",type:"Workers Compensation",number:"WC-883912",expiryDate:"2026-08-20",verified:!0,notes:"Active cover"},{id:"doc_1_3",type:"Electrical Contractor License",number:"REC-39021",expiryDate:"2027-02-15",verified:!0,notes:"A-Grade Electrical License"}]},{id:"cont_2",businessName:"Apex Plumbing & Drainage",contactName:"Gary Barlow",email:"gary@apexplumbing.com.au",phone:"0412 345 678",licenseNumber:"LIC-PL-99211",active:!0,hourlyRate:90,afterHoursRate:135,calloutFee:90,specialties:["Commercial Plumbing","Gas Fitting","Drain Blockages"],notes:"Quick response time. Has own high-pressure jetter and CCTV camera.",portalToken:"c_pt_apex",complianceDocs:[{id:"doc_2_1",type:"Public Liability Insurance",number:"PL-223401-B",expiryDate:"2026-06-30",verified:!0,notes:"Cover up to $10M"},{id:"doc_2_2",type:"Workers Compensation",number:"WC-449102",expiryDate:"2026-04-12",verified:!1,notes:"Requires updated certificate copy"},{id:"doc_2_3",type:"Plumbing Practitioner License",number:"PPL-1192",expiryDate:"2027-09-01",verified:!0,notes:"Licensed drainer and gasfitter"}]},{id:"cont_3",businessName:"Swift HVAC & Mechanical",contactName:"Marcus Sterling",email:"marcus@swifthvac.com.au",phone:"0423 556 789",licenseNumber:"LIC-HV-44012",active:!1,hourlyRate:105,afterHoursRate:157.5,calloutFee:120,specialties:["Chiller Maintenance","Commercial A/C","Duct Work"],notes:"Currently set to inactive due to expired public liability insurance. Do not dispatch.",portalToken:"c_pt_swift",complianceDocs:[{id:"doc_3_1",type:"Public Liability Insurance",number:"PL-771109-C",expiryDate:"2026-02-10",verified:!1,notes:"Expired! Contact Marcus for renewal"},{id:"doc_3_2",type:"Workers Compensation",number:"WC-110291",expiryDate:"2026-11-30",verified:!0,notes:"Cover active"},{id:"doc_3_3",type:"ARC Refrigerant License",number:"ARC-8891",expiryDate:"2027-05-18",verified:!0,notes:"Full handle license"}]}]}function Zt(){return[{id:"tmpl_elec_std",name:"Standard Electrical Inspection",description:"A comprehensive tasklist for residential or commercial electrical safety inspections.",tags:["Electrical","Maintenance","Compliance"],createdAt:new Date().toISOString(),tasks:[{id:"p1",name:"Main Board Inspection",status:"Not Started",progress:0,description:"Visually inspect main board, terminal blocks, enclosure, and general wiring integrity.",subTasks:[{id:"sp1",name:"RCD Testing",estimatedHours:1,people:1,status:"Not Started",progress:0,description:"Perform trip time and trip current test on safety switches."},{id:"sp2",name:"Terminal Tightness",estimatedHours:.5,people:1,status:"Not Started",progress:0,description:"Verify all terminal screws are properly torqued to specifications."}]},{id:"p2",name:"Circuit Testing",status:"Not Started",progress:0,description:"Test subcircuits for safety, load rating compliance, and continuous grounding.",subTasks:[{id:"sp3",name:"Insulation Resistance",estimatedHours:2,people:1,status:"Not Started",progress:0,description:"Measure insulation resistance between active, neutral, and earth conductors."},{id:"sp4",name:"Earth Loop Impedance",estimatedHours:1.5,people:1,status:"Not Started",progress:0,description:"Measure the impedance of the earth fault loop to verify breaker trip time."}]}]},{id:"tmpl_solar_maint",name:"Solar Panel Maintenance",description:"Annual maintenance checklist for PV solar systems.",tags:["Solar","Renewable","Maintenance"],createdAt:new Date().toISOString(),tasks:[{id:"p3",name:"Physical Inspection",status:"Not Started",progress:0,description:"Assess physical condition of panels, mounting frames, and external conduits.",subTasks:[{id:"sp5",name:"Module Cleaning",estimatedHours:3,people:2,status:"Not Started",progress:0,description:"Clean modules with de-ionized water to remove dirt, debris, or bird droppings."},{id:"sp6",name:"Mounting Hardware Check",estimatedHours:1,people:1,status:"Not Started",progress:0,description:"Ensure all mounting brackets, rails, and bolts are securely fastened."}]},{id:"p4",name:"Electrical Performance",status:"Not Started",progress:0,description:"Measure solar production efficiency, inverter outputs, and string voltage stability.",subTasks:[{id:"sp7",name:"Inverter Diagnostics",estimatedHours:1,people:1,status:"Not Started",progress:0,description:"Read fault log history, check operational status, and inspect ventilation/heatsinks."},{id:"sp8",name:"String Voltage Testing",estimatedHours:2,people:1,status:"Not Started",progress:0,description:"Measure open circuit voltage and short circuit current on each solar string."}]}]}]}function es(e){const a=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"],t=["Website","Referral","Phone","Email","Trade Show","Google Ads"];return Array.from({length:15},(s,c)=>{const l=_e(e);return{id:`lead_${c+1}`,title:`${_e(Ct)} ${_e(["Installation","Repair","Inspection","Upgrade","Maintenance"])}`,customerId:l.id,customerName:l.company,contactName:`${l.firstName} ${l.lastName}`,status:_e(a),source:_e(t),value:ct(500,25e3),description:`Potential ${_e(Ct).toLowerCase()} work for ${l.company}.`,priority:_e(["Low","Medium","High"]),createdAt:Ve(90),updatedAt:Ve(14)}})}function ts(e){const a=["Draft","Sent","Accepted","Declined"];return Array.from({length:18},(t,s)=>{const c=_e(e),l=ct(200,5e3),m=ct(100,8e3),n=(l+m)*.1;return{id:`quote_${s+1}`,number:`Q-${String(2024e3+s+1)}`,customerId:c.id,customerName:c.company,contactName:`${c.firstName} ${c.lastName}`,title:`${_e(Ct)} - ${_e(["Service Quote","Project Quote","Maintenance Quote"])}`,status:_e(a),lineItems:[{description:`${_e(Ct)} Labor`,type:"labor",qty:Math.ceil(Math.random()*16),rate:ct(65,120),total:l},{description:`${_e(["Cable","Pipe","Filter","Sensor","Panel","Valve"])} Kit`,type:"material",qty:Math.ceil(Math.random()*10),rate:ct(15,200),total:m}],subtotal:l+m,tax:n,total:l+m+n,validUntil:Ve(-30,60),notes:"",createdAt:Ve(120),updatedAt:Ve(14)}})}function as(e,a){const t=["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"],s=["Low","Medium","High","Urgent"];return Array.from({length:20},(c,l)=>{var f;const m=_e(e),n=_e(gt),p=l===0?"Scheduled":l===1?"In Progress":l===2?"Pending":_e(t),o=l===0||l===1?"cont_1":l===2?"cont_2":null;return{id:`job_${l+1}`,number:`J-${String(1e5+l+1)}`,customerId:m.id,customerName:m.company,contactName:`${m.firstName} ${m.lastName}`,siteAddress:m.address||`${_e(Xt)}, ${_e(jt)}, VIC 3000`,title:`${_e(Ct)} - ${_e(["Service","Repair","Installation","Inspection","Maintenance"])}`,type:_e(Ct),status:p,priority:_e(s),technicianId:n.id,technicianName:n.name,contractorId:o,quoteId:l<a.length?(f=a[l])==null?void 0:f.id:null,scheduledDate:Ve(-7,21),estimatedHours:Math.ceil(Math.random()*8),laborCost:ct(200,4e3),materialCost:ct(100,3e3),tasks:[{id:"p1",name:"Site Preparation",status:p==="Pending"?"Not Started":"Completed",progress:p==="Pending"?0:100,estimatedHours:4,people:1,assignedContractorIds:l===2?["cont_1"]:[],subTasks:[{id:"sp1",name:"Safety Audit",status:p==="Pending"?"Not Started":"Completed",progress:p==="Pending"?0:100,estimatedHours:1,people:1,assignedContractorIds:l===2?["cont_1"]:[]},{id:"sp2",name:"Site Setup",status:p==="Pending"?"Not Started":"Completed",progress:p==="Pending"?0:100,estimatedHours:3,people:1,assignedContractorIds:l===2?["cont_1"]:[]}]},{id:"p2",name:"Installation Phase",status:p==="Completed"||p==="Invoiced"?"Completed":p==="In Progress"?"In Progress":"Not Started",progress:p==="Completed"||p==="Invoiced"?100:p==="In Progress"?50:0,estimatedHours:12,people:2,assignedContractorIds:l===2?["cont_2"]:[],subTasks:[{id:"sp3",name:"Main Installation",status:p==="Completed"||p==="Invoiced"?"Completed":p==="In Progress"?"In Progress":"Not Started",progress:p==="Completed"||p==="Invoiced"||p==="In Progress"?100:0,estimatedHours:8,people:2,assignedContractorIds:l===2?["cont_2"]:[]},{id:"sp4",name:"Final Commissioning",status:p==="Completed"||p==="Invoiced"?"Completed":"Not Started",progress:p==="Completed"||p==="Invoiced"?100:0,estimatedHours:4,people:2,assignedContractorIds:l===2?["cont_2"]:[]}]}],notes:"",createdAt:Ve(90),updatedAt:Ve(7)}})}function ss(e){const a=["Draft","Sent","Paid","Overdue","Void"],t=e.filter(s=>s.status==="Completed"||s.status==="Invoiced");return Array.from({length:Math.max(8,t.length)},(s,c)=>{const l=t[c]||_e(e),m=(l.laborCost||0)+(l.materialCost||0),n=m*.1;return{id:`inv_${c+1}`,number:`INV-${String(5e4+c+1)}`,jobId:l.id,jobNumber:l.number,customerId:l.customerId,customerName:l.customerName,contactName:l.contactName,status:_e(a),lineItems:[{description:`${l.title} - Labor`,amount:l.laborCost||ct(200,4e3)},{description:`${l.title} - Materials`,amount:l.materialCost||ct(100,3e3)}],subtotal:m,tax:n,total:m+n,invoiceType:"Standard",issueDate:Ve(60),dueDate:Ve(-14,30),paidDate:null,notes:"",createdAt:Ve(60),updatedAt:Ve(7)}})}function os(){return[{id:"fmt_1",name:"Job Safety Analysis (JSA)",description:"Daily safety assessment before starting work.",sections:[{id:"sec_1",title:"Personal Protective Equipment",fields:[{id:"f1",type:"checkbox",label:"Gloves worn?",required:!0},{id:"f2",type:"checkbox",label:"Safety Glasses worn?",required:!0},{id:"f3",type:"checkbox",label:"Steel Cap Boots worn?",required:!0}]},{id:"sec_2",title:"Site Hazards",fields:[{id:"f4",type:"select",label:"Overall Site Risk",options:["Low","Medium","High"],required:!0},{id:"f5",type:"textarea",label:"Identified Hazards",placeholder:"Describe any trip hazards, live wires, etc."}]},{id:"sec_3",title:"Authorization",fields:[{id:"f6",type:"signature",label:"Technician Signature",required:!0}]}]},{id:"fmt_2",name:"Site Assessment",description:"Detailed site inspection and requirements.",sections:[{id:"sec_4",title:"Client Details",fields:[{id:"f7",type:"text",label:"Customer Rep Name"},{id:"f8",type:"date",label:"Inspection Date"}]},{id:"sec_5",title:"Access & Logistics",fields:[{id:"f9",type:"checkbox",label:"Access keys provided?"},{id:"f10",type:"textarea",label:"Parking / Entry Instructions"}]}]}]}function is(){return[{name:"10A Circuit Breaker",cat:"Electrical",unit:"each",price:12.5},{name:"2.5mm Twin & Earth Cable (100m)",cat:"Electrical",unit:"roll",price:89},{name:"LED Downlight 10W",cat:"Electrical",unit:"each",price:18.5},{name:"RCD Safety Switch",cat:"Electrical",unit:"each",price:45},{name:"15mm Copper Pipe (5.5m)",cat:"Plumbing",unit:"length",price:32},{name:"PVC Elbow 90° 50mm",cat:"Plumbing",unit:"each",price:4.5},{name:"Flick Mixer Tap Chrome",cat:"Plumbing",unit:"each",price:155},{name:"Hot Water Thermostat",cat:"Plumbing",unit:"each",price:38},{name:"Split System Filter",cat:"HVAC",unit:"each",price:22},{name:"Refrigerant R410A (10kg)",cat:"HVAC",unit:"cylinder",price:245},{name:"Duct Tape Aluminium 48mm",cat:"HVAC",unit:"roll",price:14},{name:"Fire Extinguisher 4.5kg ABE",cat:"Fire Safety",unit:"each",price:89},{name:"Smoke Detector Photoelectric",cat:"Fire Safety",unit:"each",price:28},{name:"Fire Hose Reel 36m",cat:"Fire Safety",unit:"each",price:320},{name:"Motion Sensor PIR",cat:"Security",unit:"each",price:42},{name:"Security Camera 4MP IP",cat:"Security",unit:"each",price:189},{name:"Access Control Keypad",cat:"Security",unit:"each",price:135},{name:"Cable Ties 300mm (100pk)",cat:"General",unit:"pack",price:8.5},{name:"Silicone Sealant Clear",cat:"General",unit:"tube",price:9},{name:"Safety Glasses Clear",cat:"General",unit:"pair",price:6.5}].map((a,t)=>{const s=["Warehouse A","Warehouse B","Main Warehouse","Vehicle - Mark Sullivan","Vehicle - Jake Patterson","Vehicle - Ryan Cooper"],c=Math.floor(Math.random()*2)+2,m=[...s].sort(()=>.5-Math.random()).slice(0,c).map(p=>({location:p,quantity:Math.floor(Math.random()*60)+5})),n=m.reduce((p,o)=>p+o.quantity,0);return{id:`stock_${t+1}`,name:a.name,sku:`SKU-${String(1e3+t)}`,category:a.cat,unit:a.unit,unitPrice:a.price,costPrice:a.price*.6,quantity:n,reorderLevel:Math.floor(Math.random()*20)+5,supplier:_e(["ElectraTrade","PipeLine Supply","CoolParts Wholesale","SafeGuard Dist.","AllTrade Supplies"]),location:m[0].location,locations:m,createdAt:Ve(365),updatedAt:Ve(30)}})}function ns(e){var t,s,c,l,m,n;return[{name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active"},{name:"Isuzu NPR Truck",type:"Vehicle",serial:"REG-888-FF",ownerType:"Business",recoveryRate:45,serviceIntervalMonths:6,currentMeter:12e4,status:"Active"},{name:"Scissor Lift 19ft",type:"Plant & Equipment",serial:"SN-SL-9920",ownerType:"Business",recoveryRate:15,serviceIntervalMonths:3,currentMeter:840,status:"Active"},{name:"Carrier Chiller Unit",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-CH-7721",ownerType:"Customer",customerId:e[0].id,site:(s=(t=e[0].sites)==null?void 0:t[0])==null?void 0:s.name,serviceIntervalMonths:12,currentMeter:15400,status:"Active"},{name:"Daikin Split System",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-DS-4410",ownerType:"Customer",customerId:e[1].id,site:(l=(c=e[1].sites)==null?void 0:c[0])==null?void 0:l.name,serviceIntervalMonths:12,currentMeter:3200,status:"Active"},{name:"Fire Alarm Panel v4",type:"Fixed Asset (HVAC/Solar/Fire)",serial:"SN-FP-2299",ownerType:"Customer",customerId:e[2].id,site:(n=(m=e[2].sites)==null?void 0:m[0])==null?void 0:n.name,serviceIntervalMonths:6,currentMeter:0,status:"Active"}].map((p,o)=>({id:`asset_${o+1}`,...p,logs:[{id:`log_${o}_1`,type:"Service",date:Ve(90),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]}))}function ua(){return[{id:"sup_1",name:"ElectraTrade",contactName:"Robert Vance",email:"sales@electratrade.com.au",phone:"03 9822 1045",address:"22 Industrial Parkway, South Melbourne, VIC 3205",category:"Electrical",accountNumber:"FF-ET-10291",paymentTerms:"30 Days",active:!0,notes:"Primary supplier for electrical switchgear, cable, and general conduit fittings.",attachments:[{id:"att_sup_1_1",name:"ElectraTrade_Price_List_2026.pdf",type:"application/pdf",size:1245e3,uploadedAt:"2026-01-10T08:00:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_2",name:"PipeLine Supply",contactName:"Douglas Miller",email:"orders@pipelinesupply.com.au",phone:"03 9544 3300",address:"108 Pipeline Rd, Richmond, VIC 3121",category:"Plumbing",accountNumber:"FF-PL-99401",paymentTerms:"14 Days",active:!0,notes:"Main plumbing merchant. Provides rapid morning deliveries to metro sites.",attachments:[{id:"att_sup_2_1",name:"PipeLine_Product_Brochure.pdf",type:"application/pdf",size:345e4,uploadedAt:"2026-02-15T09:30:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_3",name:"CoolParts Wholesale",contactName:"Amanda Jenkins",email:"amanda@coolparts.com.au",phone:"03 9711 5050",address:"45 Cold Storage Lane, Clayton, VIC 3168",category:"HVAC",accountNumber:"FF-CP-39021",paymentTerms:"30 Days",active:!0,notes:"HVAC compressors, copper coils, ducting components, and split system units.",attachments:[]},{id:"sup_4",name:"SafeGuard Dist.",contactName:"Sarah Conner",email:"wholesale@safeguard.com.au",phone:"03 8990 1200",address:"90 Security Plaza, Collingwood, VIC 3066",category:"Fire Safety",accountNumber:"FF-SG-88301",paymentTerms:"COD",active:!0,notes:"Preferred supplier for smoke alarms, commercial fire panel zone cards, and extinguishers.",attachments:[{id:"att_sup_4_1",name:"SafeGuard_Compliance_Certificate.pdf",type:"application/pdf",size:954e3,uploadedAt:"2026-03-01T10:15:00Z",url:"data:application/pdf;base64,JVBERi0xLjQKJ..."}]},{id:"sup_5",name:"AllTrade Supplies",contactName:"Kevin Higgins",email:"kevin@alltradesupplies.com.au",phone:"03 9205 6000",address:"15-19 Warehouse Lane, Dandenong, VIC 3175",category:"General",accountNumber:"FF-AT-22340",paymentTerms:"30 Days",active:!0,notes:"Consumables, cable ties, silicone, fasteners, and miscellaneous hand tools.",attachments:[]}]}function rs(e){const a=[];return e.filter(s=>s.status==="Scheduled"||s.status==="In Progress").forEach((s,c)=>{const l=Math.floor(Math.random()*5),m=7+Math.floor(Math.random()*8),n=1+Math.floor(Math.random()*4),p=gt.find(o=>o.id===s.technicianId)||_e(gt);a.push({id:`sched_${c+1}`,jobId:s.id,jobNumber:s.number,title:s.title,technicianId:p.id,technicianName:p.name,color:p.color,dayOffset:l,startHour:m,endHour:Math.min(m+n,18),customerName:s.customerName,siteAddress:s.siteAddress})}),a}function ls(){var x,u,b,h,k,S,L,T,I,_,A,q;if(localStorage.getItem("simpro__prevent_seeding")==="true"){const w=r.getAll("userTypes");(!w||w.length===0)&&Kt();const v=r.getAll("technicians");(!v||v.length===0)&&r.save("technicians",gt);return}if(r.isSeeded()){let K=function(U){let Q=!1;return U.description||(U.description=se[U.name]||`Standard operational procedures, verification checks, and safety guidelines for "${U.name}".`,Q=!0),U.subTasks&&U.subTasks.forEach(J=>{K(J)&&(Q=!0)}),Q};var d=K;const w=r.getAll("maintenancePlans");if(!w||w.length===0){const U=[{id:"maint_1",name:"Routine Carrier Chiller Servicing",assetId:"asset_4",quoteId:"quote_1",triggerType:"Calendar",frequency:"Quarterly",meterInterval:null,lastTriggeredMeter:0,nextServiceDate:new Date(Date.now()+2592e5).toISOString().split("T")[0],lastNotificationDate:null,status:"Active"},{id:"maint_2",name:"Toyota Hilux 10k Service Plan",assetId:"asset_1",quoteId:"quote_2",triggerType:"Meter",frequency:null,meterInterval:1e4,lastTriggeredMeter:34e3,lastNotificationDate:null,status:"Active"}];r.save("maintenancePlans",U)}const v=r.getAll("jobs");let $=!1;const C=v.map(U=>{let Q=!1;function J(ve){const Z={...ve};return"subPhases"in Z?(Z.subTasks=(Z.subPhases||[]).map(Y=>J(Y)),delete Z.subPhases,Q=!0):Z.subTasks&&(Z.subTasks=Z.subTasks.map(Y=>J(Y))),Z}const le={...U};return"phases"in le?(le.tasks=(le.phases||[]).map(ve=>J(ve)),delete le.phases,Q=!0):le.tasks&&(le.tasks=le.tasks.map(ve=>J(ve))),Q&&($=!0),le});$&&r.save("jobs",C);const N=r.getAll("taskTemplates");let O=!1;const D=N.map(U=>{let Q=!1;function J(ve){const Z={...ve};return"subPhases"in Z?(Z.subTasks=(Z.subPhases||[]).map(Y=>J(Y)),delete Z.subPhases,Q=!0):Z.subTasks&&(Z.subTasks=Z.subTasks.map(Y=>J(Y))),Z}const le={...U};return"phases"in le?(le.tasks=(le.phases||[]).map(ve=>J(ve)),delete le.phases,Q=!0):le.tasks&&(le.tasks=le.tasks.map(ve=>J(ve))),Q&&(O=!0),le});O&&r.save("taskTemplates",D);const z=r.getAll("jobs");if(z.length>0&&!z[0].tasks){const U=z.map(Q=>{const J=Q.status;return{...Q,tasks:[{id:"p1",name:"Site Preparation",status:J==="Pending"?"Not Started":"Completed",progress:J==="Pending"?0:100,estimatedHours:4,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:J==="Pending"?"Not Started":"Completed",progress:J==="Pending"?0:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:J==="Pending"?"Not Started":"Completed",progress:J==="Pending"?0:100,estimatedHours:3,people:1}]},{id:"p2",name:"Project Execution",status:J==="Completed"||J==="Invoiced"?"Completed":J==="In Progress"?"In Progress":"Not Started",progress:J==="Completed"||J==="Invoiced"?100:J==="In Progress"?50:0,estimatedHours:16,people:2,subTasks:[{id:"sp3",name:"Installation",status:J==="Completed"||J==="Invoiced"?"Completed":J==="In Progress"?"In Progress":"Not Started",progress:J==="Completed"||J==="Invoiced"||J==="In Progress"?100:0,estimatedHours:12,people:2},{id:"sp4",name:"Cleanup & Handover",status:J==="Completed"||J==="Invoiced"?"Completed":"Not Started",progress:J==="Completed"||J==="Invoiced"?100:0,estimatedHours:4,people:2}]}]}});r.save("jobs",U)}const M=r.getAll("userTypes");if(!M||M.length===0)Kt();else{M.some(J=>J.id==="ut_office")||(M.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:Tt((J,le)=>J==="Settings"?!1:J==="Reports"?le==="view":!(["Invoices","Purchase Orders"].includes(J)&&le==="delete"))}),r.save("userTypes",M));let Q=!1;M.forEach(J=>{J.permissions||(J.permissions=[]),Object.entries(St).forEach(([le,ve])=>{let Z=J.permissions.find(Y=>Y.module===le);Z||(Z={module:le},J.permissions.push(Z),Q=!0),ve.forEach(({key:Y})=>{Z[Y]===void 0&&(J.id==="ut_admin"?Z[Y]=!0:J.id==="ut_manager"?le==="Settings"?Z[Y]=["view","edit_company","manage_tax"].includes(Y):Z[Y]=!0:J.id==="ut_office"?le==="Settings"?Z[Y]=!1:le==="Reports"?Z[Y]=Y==="view":["Invoices","Purchase Orders","Suppliers"].includes(le)&&Y==="delete"?Z[Y]=!1:Z[Y]=!0:J.id==="ut_tech"?le==="Dashboard"?Z[Y]=Y==="view":le==="Jobs"?Z[Y]=["view","manage_tasks","book_time"].includes(Y):le==="Timesheets"?Z[Y]=["view_own","create"].includes(Y):le==="Schedule"?Z[Y]=["view_own"].includes(Y):Z[Y]=!1:Z[Y]=!1,Q=!0)})})}),Q&&r.save("userTypes",M)}const E=r.getAll("technicians"),j=r.getAll("userTypes");if(E.length>0&&j.length>0){const U=E[0];j.some(J=>J.id===U.userTypeId)||r.save("technicians",gt)}const F=r.getAll("taskTemplates");(!F||F.length===0)&&r.save("taskTemplates",Zt());const R=r.getAll("contractors"),B=R.some(U=>U.complianceDocs&&U.complianceDocs.length>0);(!R||R.length===0||!B)&&r.save("contractors",pa());const oe=r.getAll("suppliers");(!oe||oe.length===0)&&r.save("suppliers",ua());const V=r.getAll("stock");if(V.some(U=>!U.locations||!Array.isArray(U.locations))){const U={};V.forEach(J=>{const le=J.sku||J.name;if(U[le]||(U[le]={...J,locations:J.locations&&Array.isArray(J.locations)?[...J.locations]:[]}),!J.locations||!Array.isArray(J.locations)){const ve=J.location||"Main Warehouse",Z=parseInt(J.quantity)||0,Y=U[le].locations.find(pe=>pe.location===ve);Y?Y.quantity+=Z:U[le].locations.push({location:ve,quantity:Z})}else J.locations.forEach(ve=>{const Z=U[le].locations.find(Y=>Y.location===ve.location);Z?Z.quantity+=ve.quantity:U[le].locations.push({...ve})})});const Q=Object.values(U).map(J=>{var le;return J.quantity=J.locations.reduce((ve,Z)=>ve+Z.quantity,0),J.location=((le=J.locations[0])==null?void 0:le.location)||"Main Warehouse",J});r.save("stock",Q)}const te=r.getAll("jobs");let ce=!1;const se={"Site Preparation":"Establish site perimeter, prepare tools, and ensure safety barriers are erected.","Safety Audit":"Perform JSA/SWMS audit, verify PPE, and sign off the site hazard checklist.","Site Setup":"Lay down drop sheets, set up safety signage, and deploy service vehicles.","Project Execution":"Execute primary wiring, mount physical hardware components, and run routing paths.","Installation Phase":"Execute primary wiring, mount physical hardware components, and run routing paths.","Main Installation":"Fit electrical panels, run armored cabling, connect central distribution points.","Final Commissioning":"Perform insulation resistance checks, load tests, and sign off safety compliance reports.",Installation:"Fit electrical panels, run armored cabling, connect central distribution points.","Cleanup & Handover":"Perform insulation resistance checks, load tests, and sign off safety compliance reports."};!te.some(U=>U.contractorId==="cont_1"||U.contractorId==="cont_2")&&te.length>=3&&(te[0].contractorId="cont_1",te[0].status="Scheduled",te[1].contractorId="cont_1",te[1].status="In Progress",te[2].contractorId="cont_2",te[2].status="Pending",te[2].tasks&&te[2].tasks[0]&&(te[2].tasks[0].assignedContractorIds=["cont_1"],te[2].tasks[0].subTasks&&te[2].tasks[0].subTasks.forEach(U=>{U.assignedContractorIds=["cont_1"]})),ce=!0);const G=te.map(U=>{let Q=!1;return U.tasks&&U.tasks.forEach(J=>{K(J)&&(Q=!0)}),Q&&(ce=!0),U});ce&&r.save("jobs",G);const ee=r.getAll("taskTemplates");let ae=!1;const W=ee.map(U=>{let Q=!1;return U.tasks&&U.tasks.forEach(J=>{K(J)&&(Q=!0)}),Q&&(ae=!0),U});ae&&r.save("taskTemplates",W);return}const e=Za(),a=es(e),t=ts(e),s=as(e,t),c=ss(s),l=is(),m=ns(e),n=rs(s),p=os();r.save("customers",e),r.save("leads",a),r.save("quotes",t),r.save("jobs",s),r.save("invoices",c),r.save("stock",l),r.save("assets",m),r.save("maintenancePlans",[{id:"maint_1",name:"Routine Carrier Chiller Servicing",assetId:"asset_4",quoteId:"quote_1",triggerType:"Calendar",frequency:"Quarterly",meterInterval:null,lastTriggeredMeter:0,nextServiceDate:new Date(Date.now()+3*24*60*60*1e3).toISOString().split("T")[0],lastNotificationDate:null,status:"Active"},{id:"maint_2",name:"Toyota Hilux 10k Service Plan",assetId:"asset_1",quoteId:"quote_2",triggerType:"Meter",frequency:null,meterInterval:1e4,lastTriggeredMeter:34e3,lastNotificationDate:null,status:"Active"}]),r.save("schedule",n),r.save("technicians",gt),r.save("taskTemplates",Zt()),r.save("formTemplates",p),r.save("formInstances",[]),r.save("contractors",pa()),r.save("suppliers",ua());const o=new Date,f=w=>w.toString().padStart(2,"0");function g(w){const v=new Date(o);return v.setDate(v.getDate()+w),`${v.getFullYear()}-${f(v.getMonth()+1)}-${f(v.getDate())}`}const i=[{id:"act_1",title:"Follow up on quote approval",type:"follow-up",date:g(0),time:"09:00",duration:15,priority:"high",status:"pending",assignedToId:"tech1",linkedType:"quote",linkedId:((x=t[0])==null?void 0:x.id)||"",linkedLabel:`Quote ${((u=t[0])==null?void 0:u.number)||""}`,notes:"Client requested revised pricing on switchboard section."},{id:"act_2",title:"Site inspection — Docklands",type:"site-visit",date:g(0),time:"13:00",duration:120,priority:"normal",status:"pending",assignedToId:"tech3",linkedType:"job",linkedId:((b=s[0])==null?void 0:b.id)||"",linkedLabel:`Job ${((h=s[0])==null?void 0:h.number)||""}`,notes:"Confirm conduit runs before ceiling close-in."},{id:"act_3",title:"Call supplier re: panel delivery",type:"call",date:g(-1),time:"10:30",duration:10,priority:"normal",status:"completed",assignedToId:"tech2",linkedType:"",linkedId:"",linkedLabel:"",notes:"Confirmed delivery for Friday."},{id:"act_4",title:"Team safety meeting",type:"meeting",date:g(1),time:"07:30",duration:30,priority:"normal",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:"Monthly toolbox talk — fire extinguisher training."},{id:"act_5",title:"Email updated scope to client",type:"email",date:g(0),time:"15:00",duration:15,priority:"low",status:"pending",assignedToId:"tech6",linkedType:"customer",linkedId:((k=e[1])==null?void 0:k.id)||"",linkedLabel:((S=e[1])==null?void 0:S.company)||"",notes:""},{id:"act_6",title:"Chase overdue invoice",type:"call",date:g(-2),time:"11:00",duration:10,priority:"high",status:"pending",assignedToId:"tech6",linkedType:"invoice",linkedId:((L=c[0])==null?void 0:L.id)||"",linkedLabel:`Invoice ${((T=c[0])==null?void 0:T.number)||""}`,notes:"60 days overdue. Escalate if no response."},{id:"act_7",title:"Pre-start meeting with builder",type:"meeting",date:g(2),time:"08:00",duration:60,priority:"normal",status:"pending",assignedToId:"tech2",linkedType:"job",linkedId:((I=s[1])==null?void 0:I.id)||"",linkedLabel:`Job ${((_=s[1])==null?void 0:_.number)||""}`,notes:"Coordinate access and power isolation with site foreman."},{id:"act_8",title:"Order fire panel spares",type:"task",date:g(1),time:"",duration:0,priority:"normal",status:"pending",assignedToId:"tech4",linkedType:"",linkedId:"",linkedLabel:"",notes:"Need 3x zone cards and 1x PSU."},{id:"act_9",title:"Review apprentice logbook",type:"task",date:g(3),time:"",duration:0,priority:"low",status:"pending",assignedToId:"tech1",linkedType:"",linkedId:"",linkedLabel:"",notes:""},{id:"act_10",title:"Warranty follow-up call",type:"call",date:g(-3),time:"14:00",duration:15,priority:"normal",status:"completed",assignedToId:"tech5",linkedType:"customer",linkedId:((A=e[2])==null?void 0:A.id)||"",linkedLabel:((q=e[2])==null?void 0:q.company)||"",notes:"Issue resolved. Replacement sensor installed."}];r.save("activities",i),r.markSeeded()}function cs(){r.clearAll(),Kt(),r.save("technicians",gt);const e={id:"cust_1",company:"Acme Corp",firstName:"James",lastName:"Henderson",email:"james@acme.com",phone:"0412345678",address:"145 King St, Southbank, VIC 3000",status:"Active",type:"Company",notes:"Primary test account.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),sites:[{name:"Main Office",address:"145 King St, Southbank, VIC 3000"}],contacts:[{name:"James Henderson",role:"Primary",email:"james@acme.com",phone:"0412345678"}]};r.save("customers",[e]);const a={id:"lead_1",title:"Commercial Switchboard Upgrade",customerId:"cust_1",customerName:"Acme Corp",contactName:"James Henderson",status:"New",source:"Website",value:4500,description:"Standard industrial switchboard upgrade for main office.",priority:"High",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};r.save("leads",[a]);const t={id:"quote_1",number:"Q-2026001",customerId:"cust_1",customerName:"Acme Corp",contactName:"James Henderson",title:"Electrical Upgrade Quote",status:"Sent",lineItems:[{description:"Electrical Labor",type:"labor",qty:8,rate:85,total:680},{description:"RCD Safety Switch Kit",type:"material",qty:2,rate:45,total:90}],subtotal:770,tax:77,total:847,validUntil:new Date(Date.now()+30*24*60*60*1e3).toISOString().split("T")[0],notes:"Standard quotes terms.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};r.save("quotes",[t]);const s={id:"job_1",number:"J-100001",customerId:"cust_1",customerName:"Acme Corp",contactName:"James Henderson",siteAddress:"145 King St, Southbank, VIC 3000",title:"Main Switchboard Upgrade",type:"Electrical",status:"Scheduled",priority:"High",technicianId:"tech1",technicianName:"Mark Sullivan",contractorId:null,quoteId:"quote_1",scheduledDate:new Date().toISOString().split("T")[0],estimatedHours:8,laborCost:680,materialCost:90,tasks:[{id:"p1",name:"Site Preparation",status:"Completed",progress:100,estimatedHours:2,people:1,subTasks:[{id:"sp1",name:"Safety Audit",status:"Completed",progress:100,estimatedHours:1,people:1},{id:"sp2",name:"Site Setup",status:"Completed",progress:100,estimatedHours:1,people:1}]},{id:"p2",name:"Installation Phase",status:"In Progress",progress:50,estimatedHours:6,people:2,subTasks:[{id:"sp3",name:"Main Installation",status:"In Progress",progress:50,estimatedHours:4,people:2},{id:"sp4",name:"Final Commissioning",status:"Not Started",progress:0,estimatedHours:2,people:2}]}],notes:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};r.save("jobs",[s]);const c={id:"inv_1",number:"INV-50001",jobId:"job_1",jobNumber:"J-100001",customerId:"cust_1",customerName:"Acme Corp",contactName:"James Henderson",status:"Sent",lineItems:[{description:"Main Switchboard Upgrade - Labor",amount:680},{description:"Main Switchboard Upgrade - Materials",amount:90}],subtotal:770,tax:77,total:847,invoiceType:"Standard",issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+14*24*60*60*1e3).toISOString().split("T")[0],paidDate:null,notes:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};r.save("invoices",[c]);const l={id:"stock_1",name:"LED Downlight 10W",sku:"SKU-1001",category:"Electrical",unit:"each",unitPrice:18.5,costPrice:11,quantity:45,reorderLevel:10,supplier:"ElectraTrade",location:"Main Warehouse",locations:[{location:"Main Warehouse",quantity:45}],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};r.save("stock",[l]);const m={id:"asset_1",name:"Toyota Hilux 2022",type:"Vehicle",serial:"REG-123-FF",ownerType:"Business",recoveryRate:25,serviceIntervalMonths:6,currentMeter:45e3,status:"Active",logs:[{id:"log_1_1",type:"Service",date:new Date().toISOString(),technicianName:"Jake Patterson",cost:250,notes:"Routine check"}]};r.save("assets",[m]);const n={id:"maint_1",name:"Toyota Hilux 10k Service Plan",assetId:"asset_1",triggerType:"Meter",frequency:null,meterInterval:1e4,lastTriggeredMeter:4e4,lastNotificationDate:null,status:"Active"};r.save("maintenancePlans",[n]);const p={id:"sched_1",jobId:"job_1",jobNumber:"J-100001",title:"Main Switchboard Upgrade",technicianId:"tech1",technicianName:"Mark Sullivan",color:"#3B82F6",dayOffset:0,startHour:8,endHour:16,customerName:"Acme Corp",siteAddress:"145 King St, Southbank, VIC 3000"};r.save("schedule",[p]),r.seedFormTemplates(),r.save("formInstances",[]);const o={id:"cont_1",businessName:"EcoVolt Electrical Services",contactName:"Elena Rostova",email:"elena@ecovoltelectrical.com.au",phone:"0498 765 432",licenseNumber:"LIC-EL-88390",active:!0,hourlyRate:95,afterHoursRate:142.5,calloutFee:85,specialties:["Solar PV Installation","Switchboard Upgrades"],notes:"Preferred subcontractor.",portalToken:"c_pt_ecovolt",complianceDocs:[{id:"doc_1",type:"Public Liability Insurance",number:"PL-992110-A",expiryDate:"2026-10-15",verified:!0,notes:"Cover up to $20M"}]};r.save("contractors",[o]);const f={id:"sup_1",name:"ElectraTrade",contactName:"Robert Vance",email:"sales@electratrade.com.au",phone:"03 9822 1045",address:"22 Industrial Parkway, South Melbourne, VIC 3205",category:"Electrical",accountNumber:"FF-ET-10291",paymentTerms:"30 Days",active:!0,notes:"Primary supplier.",attachments:[]};r.save("suppliers",[f]);const g={id:"act_1",title:"Site inspection — Southbank",type:"site-visit",date:new Date().toISOString().split("T")[0],time:"13:00",duration:120,priority:"normal",status:"pending",assignedToId:"tech1",linkedType:"job",linkedId:"job_1",linkedLabel:"Job J-100001",notes:"Verify panel wiring integrity."};r.save("activities",[g]),r.save("taskTemplates",Zt()),localStorage.removeItem("simpro__prevent_seeding"),r.markSeeded()}function Sa(){const e=r.getAll("maintenancePlans")||[],a=r.getAll("assets")||[],t=r.getAll("quotes")||[],s=r.getAll("notifications")||[];let c=!1;e.forEach(l=>{if(l.status!=="Active")return;const m=a.find(p=>p.id===l.assetId);if(!m)return;const n=t.find(p=>p.id===l.quoteId);if(n){if(l.triggerType==="Calendar"){const f=new Date(l.nextServiceDate)-new Date;if(Math.ceil(f/(1e3*60*60*24))<=7&&!s.some(d=>d.maintenancePlanId===l.id&&d.targetServiceDate===l.nextServiceDate)){const d=(n.sections||n.lineItems||[]).flatMap(h=>h.lineItems||[h]).filter(h=>h.type==="material").map(h=>`${h.qty}x ${h.description}`).join(", ")||"No specific parts required",x=(n.sections||n.lineItems||[]).flatMap(h=>h.lineItems||[h]).filter(h=>h.type==="labor").reduce((h,k)=>h+parseFloat(k.qty||0),0)||0,u={id:"notif_maint_"+Date.now()+Math.random().toString(36).substr(2,5),title:`Maintenance Due: ${m.name} - ${l.name}`,description:`Scheduled maintenance is due on ${l.nextServiceDate} at ${m.site||"Main Office"}. Required parts: ${d}. Labor Profile: ${x} hrs.`,status:"Pending",type:"Recurring Job Due",priority:"Normal",createdAt:new Date().toISOString(),createdBy:"System Engine",maintenancePlanId:l.id,quoteId:l.quoteId,assetId:l.assetId,targetServiceDate:l.nextServiceDate};s.push(u),r.save("notifications",s);const b=new Date(l.nextServiceDate);l.frequency==="Weekly"?b.setDate(b.getDate()+7):l.frequency==="Monthly"?b.setMonth(b.getMonth()+1):l.frequency==="Quarterly"?b.setMonth(b.getMonth()+3):l.frequency==="Semi-Annually"?b.setMonth(b.getMonth()+6):l.frequency==="Annually"&&b.setFullYear(b.getFullYear()+1),l.nextServiceDate=b.toISOString().split("T")[0],l.lastNotificationDate=new Date().toISOString(),c=!0}}else if(l.triggerType==="Meter"){const p=parseFloat(m.currentMeter||0),o=parseFloat(l.lastTriggeredMeter||0),f=parseFloat(l.meterInterval||0);if(p>=o+f&&!s.some(i=>i.maintenancePlanId===l.id&&i.status==="Pending"&&i.type==="Recurring Job Due")){const i=(n.sections||n.lineItems||[]).flatMap(u=>u.lineItems||[u]).filter(u=>u.type==="material").map(u=>`${u.qty}x ${u.description}`).join(", ")||"No specific parts required",d=(n.sections||n.lineItems||[]).flatMap(u=>u.lineItems||[u]).filter(u=>u.type==="labor").reduce((u,b)=>u+parseFloat(b.qty||0),0)||0,x={id:"notif_maint_"+Date.now()+Math.random().toString(36).substr(2,5),title:`Usage Maintenance Due: ${m.name} - ${l.name}`,description:`Asset meter reading is at ${p} ${m.meterUnit||"hrs"} (Target milestone: ${o+f} ${m.meterUnit||"hrs"}). Required parts: ${i}. Labor: ${d} hrs.`,status:"Pending",type:"Recurring Job Due",priority:"Normal",createdAt:new Date().toISOString(),createdBy:"System Engine",maintenancePlanId:l.id,quoteId:l.quoteId,assetId:l.assetId,currentMeterAtTrigger:p};s.push(x),r.save("notifications",s),l.lastTriggeredMeter=o+f,l.lastNotificationDate=new Date().toISOString(),c=!0}}}}),c&&r.save("maintenancePlans",e)}const ma=Object.freeze(Object.defineProperty({__proto__:null,checkMaintenancePlans:Sa},Symbol.toStringTag,{value:"Module"})),ds=[{id:"dashboard",icon:"dashboard",label:"Dashboard",path:"/"},{id:"schedule",icon:"calendar_today",label:"Schedule",path:"/schedule"},{category:"Workflow",id:"cat-workflow",icon:"account_tree",items:[{id:"leads",icon:"trending_up",label:"Leads",path:"/leads"},{id:"quotes",icon:"request_quote",label:"Quotes",path:"/quotes"},{id:"jobs",icon:"build",label:"Jobs",path:"/jobs"},{id:"notifications",icon:"campaign",label:"Notifications",path:"/notifications"},{id:"invoices",icon:"receipt_long",label:"Invoices",path:"/invoices"}]},{category:"People",id:"cat-people",icon:"groups",items:[{id:"people",icon:"people",label:"Customers",path:"/people"},{id:"contractors",icon:"engineering",label:"Contractors",path:"/contractors"},{id:"suppliers",icon:"local_shipping",label:"Suppliers",path:"/suppliers"}]},{category:"Resources",id:"cat-resources",icon:"widgets",items:[{id:"assets",icon:"precision_manufacturing",label:"Assets",path:"/assets"},{id:"stock",icon:"inventory_2",label:"Stock",path:"/stock"},{id:"purchase-orders",icon:"shopping_cart",label:"Purchase Orders",path:"/purchase-orders"},{id:"timesheets",icon:"schedule",label:"Timesheets",path:"/timesheets"}]},{category:"Admin",id:"cat-admin",icon:"admin_panel_settings",items:[{id:"documents",icon:"folder",label:"Documents",path:"/documents"},{id:"reports",icon:"bar_chart",label:"Reports",path:"/reports"},{id:"settings",icon:"settings",label:"Settings",path:"/settings"}]}];function ka(){const e=document.createElement("aside");e.className="sidebar",e.id="sidebar";const a=localStorage.getItem("simpro_sidebar_expanded")==="true";a&&e.classList.add("expanded");const t=r.getSettings();let c=`
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
  `,l={};try{l=JSON.parse(localStorage.getItem("simpro_sidebar_collapsed_categories")||"{}")}catch{}const m=window.location.hash.slice(1)||"/",n=m==="/"?"/":"/"+m.split("/").filter(Boolean)[0];ds.forEach(u=>{if(u.category){const b=u.items.some(k=>k.path===n);let h=l[u.id]===!0;b&&(h=!1),c+=`
        <div class="sidebar-category-container" data-category-id="${u.id}">
          <button class="sidebar-category-header" data-category-id="${u.id}" id="cat-header-${u.id}">
            <span class="category-chevron">
              <span class="material-icons-outlined">${h?"keyboard_arrow_right":"expand_more"}</span>
            </span>
            <span class="category-icon">
              <span class="material-icons-outlined">${u.icon}</span>
            </span>
            <span class="category-label">${u.category}</span>
          </button>
          <div class="sidebar-category-items ${h?"collapsed":""}" id="cat-items-${u.id}">
      `,u.items.forEach(k=>{c+=`
          <button class="sidebar-nav-item sub-item" data-path="${k.path}" data-id="${k.id}" id="nav-${k.id}">
            <span class="nav-icon"><span class="material-icons-outlined">${k.icon}</span></span>
            <span class="nav-label">${k.label}</span>
          </button>
        `}),c+=`
          </div>
        </div>
      `}else c+=`
        <button class="sidebar-nav-item" data-path="${u.path}" data-id="${u.id}" id="nav-${u.id}">
          <span class="nav-icon"><span class="material-icons-outlined">${u.icon}</span></span>
          <span class="nav-label">${u.label}</span>
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
      <span class="material-icons-outlined" id="sidebar-toggle-icon">${a?"chevron_left":"chevron_right"}</span>
    </button>
  `,e.innerHTML=c,e.addEventListener("click",u=>{const b=u.target.closest(".sidebar-category-header");if(b){if(!e.classList.contains("expanded"))return;const k=b.dataset.categoryId,S=e.querySelector(`#cat-items-${k}`),L=b.querySelector(".category-chevron .material-icons-outlined");if(S&&L){S.classList.toggle("collapsed");const T=S.classList.contains("collapsed");L.textContent=T?"keyboard_arrow_right":"expand_more";try{const I=JSON.parse(localStorage.getItem("simpro_sidebar_collapsed_categories")||"{}");I[k]=T,localStorage.setItem("simpro_sidebar_collapsed_categories",JSON.stringify(I))}catch{}}return}const h=u.target.closest(".sidebar-nav-item");if(h&&h.id!=="btn-logout"){const k=h.dataset.path;k&&X.navigate(k)}}),e.querySelector("#sidebar-logo").addEventListener("click",()=>X.navigate("/")),e.querySelector("#sidebar-toggle").addEventListener("click",()=>Ca(e));const f=e.querySelector("#sidebar-nav"),g=e.querySelector("#sidebar-scroll-up"),i=e.querySelector("#sidebar-scroll-down"),d=()=>{if(e.classList.contains("expanded")){g.classList.remove("visible"),i.classList.remove("visible");return}const{scrollTop:u,scrollHeight:b,clientHeight:h}=f;g.classList.toggle("visible",u>0),i.classList.toggle("visible",Math.ceil(u+h)<b)};f.addEventListener("scroll",d),g.addEventListener("click",()=>{f.scrollBy({top:-100,behavior:"smooth"})}),i.addEventListener("click",()=>{f.scrollBy({top:100,behavior:"smooth"})}),setTimeout(d,100);const x=e.querySelector("#btn-logout");return x&&x.addEventListener("click",u=>{u.stopPropagation(),window.dispatchEvent(new CustomEvent("fieldforge-logout"))}),e.querySelectorAll(".sidebar-category-container").forEach(u=>{let b=null,h=null;function k(){b&&(b.remove(),b=null)}u.addEventListener("mouseenter",()=>{if(e.classList.contains("expanded")||(h&&(clearTimeout(h),h=null),b))return;const S=u.dataset.categoryId,L=u.querySelector(".sidebar-category-header"),T=u.querySelector(".sidebar-category-items");if(!L||!T)return;const I=Array.from(T.querySelectorAll(".sidebar-nav-item")).filter(q=>q.style.display!=="none");if(I.length===0)return;b=document.createElement("div"),b.className="sidebar-collapsed-flyout",b.id=`flyout-${S}`;let _="";I.forEach(q=>{const w=q.classList.contains("active");_+=`
          <button class="sidebar-nav-item sub-item ${w?"active":""}" data-path="${q.dataset.path}" data-id="${q.dataset.id}">
            <span class="nav-icon">${q.querySelector(".nav-icon").innerHTML}</span>
            <span class="nav-label" style="opacity: 1 !important; display: block !important; width: auto !important;">${q.querySelector(".nav-label").textContent}</span>
          </button>
        `}),b.innerHTML=_,document.body.appendChild(b);const A=L.getBoundingClientRect();b.style.position="fixed",b.style.left=`${A.right+2}px`,b.style.top=`${A.top}px`,b.style.zIndex="99999",b.addEventListener("click",q=>{const w=q.target.closest(".sidebar-nav-item");if(w){const v=w.dataset.path;v&&(X.navigate(v),k())}}),b.addEventListener("mouseenter",()=>{h&&(clearTimeout(h),h=null)}),b.addEventListener("mouseleave",()=>{h=setTimeout(k,120)})}),u.addEventListener("mouseleave",()=>{e.classList.contains("expanded")||(h=setTimeout(k,120))})}),window.addEventListener("simpro-settings-updated",()=>{const u=r.getSettings(),b=e.querySelector("#sidebar-logo");u.logo?b.innerHTML=`
        <div style="display:flex; align-items:center; justify-content:center; width:100%; gap:10px">
          <img src="${u.logo}" class="custom-logo" style="max-height: 28px; max-width: ${e.classList.contains("expanded")?"140px":"32px"}; object-fit: contain;" />
          <span class="logo-text" style="${e.classList.contains("expanded")?"display: block;":"display: none;"}">${u.name||"FieldForge"}</span>
        </div>
      `:b.innerHTML=`
        <div class="logo-icon">F</div>
        <span class="logo-text">FieldForge</span>
      `}),e}function ps(e){const a=e||document.getElementById("sidebar");if(!a)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');if(t.role==="customer")a.style.display="none";else{a.style.display="";let s=null;if(t.userTypeId){const n=r.getById("userTypes",t.userTypeId);n&&n.permissions&&(s=n.permissions)}a.querySelectorAll(".sidebar-nav-item").forEach(n=>{if(n.id==="btn-logout"){n.style.display="";return}const p=n.querySelector(".nav-label");if(!p)return;const o=p.textContent.trim();if(t.role==="admin"){n.style.display="";return}if(s){const f=s.find(i=>i.module===o);f&&Object.entries(f).some(([i,d])=>i!=="module"&&d===!0)||o==="Notifications"||o==="Dashboard"?n.style.display="":n.style.display="none"}else(o==="Settings"||o==="Reports"||o==="Invoices")&&(n.style.display="none")}),a.querySelectorAll(".sidebar-category-container").forEach(n=>{const p=n.querySelectorAll(".sidebar-nav-item");let o=!1;p.forEach(f=>{f.style.display!=="none"&&(o=!0)}),n.style.display=o?"":"none"});const c=a.querySelector("#sidebar-nav"),l=a.querySelector("#sidebar-scroll-up"),m=a.querySelector("#sidebar-scroll-down");if(c&&l&&m&&!a.classList.contains("expanded")){const{scrollTop:n,scrollHeight:p,clientHeight:o}=c;l.classList.toggle("visible",n>0),m.classList.toggle("visible",Math.ceil(n+o)<p)}}}function Ca(e){e.classList.toggle("expanded");const a=e.classList.contains("expanded");localStorage.setItem("simpro_sidebar_expanded",a);const t=e.querySelector("#sidebar-toggle-icon");t.textContent=a?"chevron_left":"chevron_right";const s=e.querySelector(".custom-logo"),c=e.querySelector(".logo-text");s&&(s.style.maxWidth=a?"140px":"32px"),c&&(c.style.display=a?"block":"none");const l=e.querySelector("#sidebar-nav"),m=e.querySelector("#sidebar-scroll-up"),n=e.querySelector("#sidebar-scroll-down");if(l&&m&&n)if(a)m.classList.remove("visible"),n.classList.remove("visible");else{const{scrollTop:p,scrollHeight:o,clientHeight:f}=l;m.classList.toggle("visible",p>0),n.classList.toggle("visible",Math.ceil(p+f)<o)}}function Ta(e){const a=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0];document.querySelectorAll(".sidebar-nav-item").forEach(t=>{t.classList.toggle("active",t.dataset.path===a)})}const ba=Object.freeze(Object.defineProperty({__proto__:null,createSidebar:ka,toggleSidebar:Ca,updateSidebarAccess:ps,updateSidebarActive:Ta},Symbol.toStringTag,{value:"Module"}));function Ia(){const e=document.createElement("header");e.className="topbar",e.id="topbar",e.innerHTML=`
    <div class="topbar-search">
      <span class="material-icons-outlined search-icon">search</span>
      <input type="text" id="global-search" placeholder="Search customers, jobs, quotes..." autocomplete="off" />
    </div>
    <div class="topbar-actions">
      <button class="theme-toggle" id="btn-theme-toggle" title="Toggle dark mode">
        <span class="material-icons-outlined" id="theme-icon">${qa()==="dark"?"light_mode":"dark_mode"}</span>
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
  `;const a=e.querySelector("#global-search");let t;a.addEventListener("input",n=>{clearTimeout(t),t=setTimeout(()=>{const p=n.target.value.trim();p.length>=2?ms(p):Bt()},300)}),a.addEventListener("blur",()=>{setTimeout(Bt,200)}),e.querySelector("#btn-theme-toggle").addEventListener("click",()=>{const p=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",p),localStorage.setItem("simpro_theme",p),e.querySelector("#theme-icon").textContent=p==="dark"?"light_mode":"dark_mode"}),bs();const c=e.querySelector("#btn-notifications"),l=e.querySelector(".notification-dot");function m(){r.getAll("notifications").filter(o=>!o.read).length>0?l.style.display="block":l.style.display="none"}return r.on("notifications",m),m(),c.addEventListener("click",n=>{n.stopPropagation(),us(c)}),Ea(e),e}function Ea(e){const a=e||document.getElementById("topbar");if(!a)return;const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),s=a.querySelector("#topbar-name"),c=a.querySelector("#topbar-role"),l=a.querySelector("#topbar-avatar");if(s&&(s.textContent=t.name||"Unknown User"),c){let m=t.userTypeName;if(!m&&t.userTypeId){const n=r.getById("userTypes",t.userTypeId);n&&(m=n.name)}m||(m={admin:"Administrator",manager:"Manager",technician:"Technician",customer:"Customer"}[t.role]||t.role),c.textContent=m}if(l){const n=(t.name||"").split(" ").map(p=>p[0]).join("").substring(0,2).toUpperCase()||"U";l.textContent=n}}function us(e){let a=document.querySelector("#notifications-dropdown");if(a){a.remove();return}const t=r.getAll("notifications").sort((m,n)=>{const p=m.createdAt?new Date(m.createdAt):new Date(0);return(n.createdAt?new Date(n.createdAt):new Date(0))-p});a=document.createElement("div"),a.className="dropdown-menu",a.id="notifications-dropdown",a.style.cssText="position:absolute;top:100%;right:0;margin-top:8px;width:320px;max-height:420px;overflow-y:auto;z-index:var(--z-dropdown);box-shadow:var(--shadow-lg);border-radius:var(--border-radius-md);background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(0,0,0,0.08);padding:0;",document.documentElement.getAttribute("data-theme")==="dark"&&(a.style.background="rgba(13, 17, 30, 0.92)",a.style.borderColor="rgba(255, 255, 255, 0.1)");const s=document.createElement("div");s.style.cssText="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center",s.innerHTML='<h4 style="margin:0;font-size:var(--font-size-md);font-weight:var(--font-weight-semibold);color:var(--text-primary);">Notifications</h4>';const c=document.createElement("button");if(c.className="btn btn-ghost btn-sm",c.style.cssText="font-size:11px;padding:4px 8px;",c.textContent="Mark all as read",c.addEventListener("click",m=>{m.stopPropagation();const n=r.getAll("notifications");let p=!1;n.forEach(o=>{o.read||(o.read=!0,o.updatedAt=new Date().toISOString(),p=!0)}),p&&r.save("notifications",n),a.remove()}),s.appendChild(c),a.appendChild(s),t.length===0){const m=document.createElement("div");m.style.cssText="padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:var(--font-size-sm);display:flex;flex-direction:column;align-items:center;gap:8px;",m.innerHTML=`
      <span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary);opacity:0.6;">notifications_off</span>
      <span>No notifications</span>
    `,a.appendChild(m)}else{const m=document.createElement("div");m.className="notifications-list",t.forEach(n=>{const p=document.createElement("div");p.className="dropdown-item",p.style.cssText=`padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;white-space:normal;background:${n.read?"transparent":"var(--color-info-bg)"};display:flex;align-items:flex-start;transition:background 0.2s;`,p.onmouseenter=()=>{p.style.background=n.read?"var(--content-bg)":"rgba(37, 99, 235, 0.12)"},p.onmouseleave=()=>{p.style.background=n.read?"transparent":"var(--color-info-bg)"};const o=n.read?"":'<span style="width:6px;height:6px;border-radius:50%;background:var(--color-info);margin-top:5px;margin-right:8px;flex-shrink:0;"></span>';p.innerHTML=`
        ${o}
        <div style="flex:1">
          <div style="font-weight:var(--font-weight-semibold);font-size:var(--font-size-base);margin-bottom:2px;color:var(--text-primary);">${n.title}</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);word-wrap:break-word;white-space:normal;line-height:1.4;">${n.message}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${new Date(n.createdAt).toLocaleString()}</div>
        </div>
      `,p.addEventListener("click",f=>{f.stopPropagation(),r.update("notifications",n.id,{read:!0}),n.link&&X.navigate(n.link),a.remove()}),m.appendChild(p)}),a.appendChild(m)}e.parentNode.style.position="relative",e.parentNode.appendChild(a);const l=m=>{!a.contains(m.target)&&m.target!==e&&!e.contains(m.target)&&(a.remove(),document.removeEventListener("click",l))};setTimeout(()=>{document.addEventListener("click",l)},0)}function ms(e){Bt();const{store:a}=window.__fieldForge||{};if(!a)return;const t=[],s=e.toLowerCase();if(a.getAll("customers").forEach(l=>{(l.company.toLowerCase().includes(s)||`${l.firstName} ${l.lastName}`.toLowerCase().includes(s))&&t.push({type:"Customer",label:l.company,icon:"people",path:`/people/${l.id}`})}),a.getAll("jobs").forEach(l=>{(l.number.toLowerCase().includes(s)||l.title.toLowerCase().includes(s)||l.customerName.toLowerCase().includes(s))&&t.push({type:"Job",label:`${l.number} — ${l.title}`,icon:"build",path:`/jobs/${l.id}`})}),a.getAll("quotes").forEach(l=>{var m;(l.number.toLowerCase().includes(s)||(m=l.title)!=null&&m.toLowerCase().includes(s)||l.customerName.toLowerCase().includes(s))&&t.push({type:"Quote",label:`${l.number} — ${l.customerName}`,icon:"request_quote",path:`/quotes/${l.id}`})}),a.getAll("invoices").forEach(l=>{(l.number.toLowerCase().includes(s)||l.customerName.toLowerCase().includes(s))&&t.push({type:"Invoice",label:`${l.number} — ${l.customerName}`,icon:"receipt_long",path:`/invoices/${l.id}`})}),t.length===0)return;const c=document.createElement("div");c.className="dropdown-menu",c.id="search-results",c.style.cssText="position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:320px;overflow-y:auto;",t.slice(0,12).forEach(l=>{const m=document.createElement("button");m.className="dropdown-item",m.innerHTML=`
      <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">${l.icon}</span>
      <span style="flex:1" class="truncate">${l.label}</span>
      <span class="badge badge-neutral" style="font-size:10px">${l.type}</span>
    `,m.addEventListener("click",()=>{X.navigate(l.path),Bt(),document.querySelector("#global-search").value=""}),c.appendChild(m)}),document.querySelector(".topbar-search").appendChild(c)}function Bt(){const e=document.querySelector("#search-results");e&&e.remove()}function qa(){return localStorage.getItem("simpro_theme")||"light"}function bs(){qa()==="dark"&&document.documentElement.setAttribute("data-theme","dark")}const fa=Object.freeze(Object.defineProperty({__proto__:null,createTopBar:Ia,updateTopbarAccess:Ea},Symbol.toStringTag,{value:"Module"})),fs={"/":"Dashboard","/people":"Customers","/leads":"Leads","/quotes":"Quotes","/jobs":"Jobs","/schedule":"Schedule","/stock":"Stock","/invoices":"Invoices","/settings":"Settings"};function vs(e){const a=document.getElementById("breadcrumb");if(!a)return;if(e==="/"){a.style.display="none";return}a.style.display="flex";const t=e.split("/").filter(Boolean);let s=`
    <span class="breadcrumb-item" data-path="/">
      <span class="material-icons-outlined" style="font-size:14px">home</span>
    </span>
  `,c="";t.forEach((l,m)=>{c+="/"+l;const n=m===t.length-1,p=fs[c]||decodeURIComponent(l);s+='<span class="breadcrumb-separator">›</span>',n?s+=`<span class="breadcrumb-item current">${p}</span>`:s+=`<span class="breadcrumb-item" data-path="${c}">${p}</span>`}),a.innerHTML=s,a.querySelectorAll(".breadcrumb-item[data-path]").forEach(l=>{l.addEventListener("click",()=>{X.navigate(l.dataset.path)})})}function dt(e){const a=document.getElementById("breadcrumb");if(!a)return;const t=a.querySelector(".breadcrumb-item.current");t&&(t.textContent=e)}const ys="modulepreload",gs=function(e){return"/"+e},va={},me=function(a,t,s){let c=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const m=document.querySelector("meta[property=csp-nonce]"),n=(m==null?void 0:m.nonce)||(m==null?void 0:m.getAttribute("nonce"));c=Promise.allSettled(t.map(p=>{if(p=gs(p),p in va)return;va[p]=!0;const o=p.endsWith(".css"),f=o?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${f}`))return;const g=document.createElement("link");if(g.rel=o?"stylesheet":ys,o||(g.as="script"),g.crossOrigin="",g.href=p,n&&g.setAttribute("nonce",n),document.head.appendChild(g),o)return new Promise((i,d)=>{g.addEventListener("load",i),g.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${p}`)))})}))}function l(m){const n=new Event("vite:preloadError",{cancelable:!0});if(n.payload=m,window.dispatchEvent(n),!n.defaultPrevented)throw m}return c.then(m=>{for(const n of m||[])n.status==="rejected"&&l(n.reason);return a().catch(l)})};function Qt(e,a){if(!e||e<=0)return 0;const t=a.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]};let s=t.defaultPercent||30;if(t.useTiers&&t.tiers&&t.tiers.length>0){const m=t.tiers.find(n=>n.upTo===null||e<=n.upTo);m&&(s=m.percent)}const c=e*(s/100),l=Math.max(c,t.minMarkupAmount||0);return e+l}function La(e,a){return e.reduce((t,s)=>{const c=Qt(s.unitCost||0,a);return t+c*(s.quantity||1)},0)}function ea(){const e=Le("Jobs","create"),a=Le("Quotes","create");let t="";return e&&(t+=`
      <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/jobs/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Job
      </button>`),a&&(t+=`
      <button class="btn btn-primary btn-sm" onclick="window.location.hash='/quotes/new'">
        <span class="material-icons-outlined" style="font-size:16px;">add</span> New Quote
      </button>`),t}let nt=!1;const It={S:"module-s",M:"module-m",L:"module-l",XL:"module-l"},Et={standard:"",tall:"module-tall",xtall:"module-xtall"};function Vt(){const e=JSON.parse(localStorage.getItem("currentUser")||"null");return e?`dashboardLayout_v3_${e.id}`:"dashboardLayout_v3"}const Ut={"kpi-cards":{title:"KPI Cards",defaultW:"L",defaultH:"standard",widths:["M","L"],heights:["standard"],kpiStrip:!0,render:ws},"job-status-chart":{title:"Job Status Chart",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:Ss},"tech-map":{title:"Technician Map",defaultW:"S",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:ks},"recent-activity":{title:"Recent Activity",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:Cs},"recent-leads":{title:"Recent Leads",defaultW:"S",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Ts},"today-schedule":{title:"Today's Schedule",defaultW:"M",defaultH:"tall",widths:["S","M","L"],heights:["tall","xtall"],render:Is},"pinned-job":{title:"Pinned Job Progress",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],configurable:!0,render:qs},"unassigned-jobs":{title:"Unassigned Jobs Queue",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Qe("assignment_late","No unassigned jobs")},"uninvoiced-completed":{title:"Uninvoiced Completed Jobs",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Qe("receipt_long","All jobs invoiced")},"low-stock":{title:"Low Stock Alerts",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard","tall"],render:()=>Qe("inventory","Inventory looks good")},"profitability-chart":{title:"Projected Profitability",defaultW:"L",defaultH:"tall",widths:["L"],heights:["tall","xtall"],render:Ls},"staff-availability":{title:"Staff Availability",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Qe("people","All staff active")},"timesheet-exceptions":{title:"Timesheet Exceptions",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Qe("schedule","No timesheet alerts")},"asset-status":{title:"Asset Status",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Qe("precision_manufacturing","All assets operational")},"overdue-maintenance":{title:"Overdue Maintenance",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Qe("build","No overdue maintenance")},"top-customers":{title:"Top Customers",defaultW:"M",defaultH:"tall",widths:["M","L"],heights:["tall","xtall"],render:()=>Qe("emoji_events","Mock Top Customers")},"daily-todo":{title:"Daily To-Do",defaultW:"S",defaultH:"tall",widths:["S","M"],heights:["tall","xtall"],render:()=>Qe("checklist","No tasks added")},"pending-approvals":{title:"Pending Approvals",defaultW:"M",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Qe("approval","No pending approvals")},"customer-nps":{title:"Customer Satisfaction",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>Qe("star","NPS Score: 8.5/10")},"cash-flow":{title:"Cash Flow Summary",defaultW:"S",defaultH:"standard",widths:["S","M","L"],heights:["standard","tall"],render:()=>Qe("account_balance","+ $15,240 this week")},"weather-forecast":{title:"Weather Forecast",defaultW:"S",defaultH:"standard",widths:["S","M"],heights:["standard"],render:()=>Qe("wb_sunny","Sunny, 24°C")}},Aa=[{id:"kpi-cards",w:"L",h:"standard"},{id:"job-status-chart",w:"M",h:"tall"},{id:"cash-flow",w:"S",h:"tall"},{id:"today-schedule",w:"M",h:"tall"},{id:"recent-leads",w:"S",h:"tall"},{id:"recent-activity",w:"M",h:"tall"},{id:"tech-map",w:"S",h:"tall"}];function Qe(e,a){return`<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-tertiary);padding:16px;text-align:center;">
    <span class="material-icons-outlined" style="font-size:28px;opacity:0.4;">${e}</span>
    <span style="font-size:13px;">${a}</span>
  </div>`}function hs(e){let a=JSON.parse(JSON.stringify(Aa));try{const c=localStorage.getItem(Vt());c&&(a=JSON.parse(c))}catch{}a.forEach(c=>{c.instanceId||(c.instanceId="inst_"+Math.random().toString(36).substr(2,9))});const t={jobs:r.getAll("jobs"),quotes:r.getAll("quotes"),invoices:r.getAll("invoices"),leads:r.getAll("leads"),people:r.getAll("people")};e.innerHTML=`
    <div class="page-content-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="margin:0;">Dashboard</h1>
          <button id="btn-edit-dashboard" class="btn btn-secondary btn-sm" style="display:flex;align-items:center;gap:4px;">
            <span class="material-icons-outlined" style="font-size:16px;">dashboard_customize</span> Customise
          </button>
        </div>
        <div id="dashboard-header-actions" style="display:flex;gap:8px;">
          ${ea()}
        </div>
      </div>
      <div id="dashboard-grid" class="dashboard-grid"></div>
    </div>`;const s=e.querySelector("#dashboard-grid");ut(s,a,t),e.querySelector("#btn-edit-dashboard").addEventListener("click",()=>{nt=!0,ut(s,a,t),$s(e,s,a,t)})}function ut(e,a,t){e.innerHTML="",a.forEach(s=>{const c=Ut[s.id];if(!c)return;const l=It[s.w]||"module-m",m=Et[s.h]||"",n=["dashboard-module",l,m,nt?"edit-mode":""].filter(Boolean).join(" "),p=c.widths.length>1,o=c.heights.length>1,f=nt?`
      ${p?'<div class="resize-handle resize-r" title="Drag to resize width"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(90deg);">unfold_more</span></div>':""}
      ${o?'<div class="resize-handle resize-b" title="Drag to resize height"><span class="material-icons-outlined" style="font-size:12px;">unfold_more</span></div>':""}
      ${p&&o?'<div class="resize-handle resize-br" title="Drag to resize"><span class="material-icons-outlined" style="font-size:12px;transform:rotate(45deg);">open_in_full</span></div>':""}
    `:"",g=`
      <div style="display:flex;align-items:center;gap:4px;">
        ${c.configurable?`
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
      <div class="${n}" data-instance-id="${s.instanceId}" data-id="${s.id}" style="position:relative;">
        <div class="card ${c.kpiStrip?"kpi-strip":""}">
          <div class="card-header" style="${i}">
            <span style="font-weight:600;font-size:14px;">${c.title}</span>
            ${g}
          </div>
          <div class="card-body">${c.render(t,s)}</div>
        </div>
        ${f}
      </div>`)}),xs(e,a,t),nt&&ta(e,a,t)}function xs(e,a,t){e.querySelectorAll(".btn-configure").forEach(s=>{s.addEventListener("click",c=>{const l=c.currentTarget.dataset.instanceId,m=a.find(p=>p.instanceId===l);if(m&&m.id==="pinned-job"){let f=function(g=""){const i=o.querySelector("#job-list-container"),d=p.filter(x=>x.number.toLowerCase().includes(g.toLowerCase())||x.title.toLowerCase().includes(g.toLowerCase())||x.customerName.toLowerCase().includes(g.toLowerCase()));i.innerHTML=d.length>0?d.map(x=>`
            <div class="job-option" data-job-id="${x.id}" style="padding:10px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <div style="font-weight:600;font-size:13px;">#${x.number} - ${x.title}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${x.customerName}</div>
            </div>
          `).join(""):'<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">No matching jobs found</div>',i.querySelectorAll(".job-option").forEach(x=>{x.addEventListener("click",()=>{var u;m.config={...m.config,jobId:x.dataset.jobId},nt||localStorage.setItem(Vt(),JSON.stringify(a)),(u=document.querySelector(".modal-overlay"))==null||u.remove(),ut(e,a,t)})})};var n=f;const p=t.jobs,o=document.createElement("div");o.innerHTML=`
          <div style="margin-bottom: 12px;">
            <input type="text" id="job-search" placeholder="Search by Job #, Title or Customer..." 
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; outline: none; transition: border-color 0.2s;"
              onfocus="this.style.borderColor='var(--color-primary)'"
              onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <div id="job-list-container" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
            <!-- Jobs will be rendered here -->
          </div>
        `,f(),o.querySelector("#job-search").addEventListener("input",g=>{f(g.target.value)}),me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Pe);return{showModal:g}},void 0).then(({showModal:g})=>{g({title:"Select Job to Pin",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()}]})})}})})}function ta(e,a,t){e.querySelectorAll(".btn-remove").forEach(s=>{s.addEventListener("click",c=>{const l=c.currentTarget.dataset.instanceId,m=a.findIndex(n=>n.instanceId===l);m!==-1&&(a.splice(m,1),ut(e,a,t))})}),window.Sortable&&!e.sortableInstance&&(e.sortableInstance=new window.Sortable(e,{handle:".card",animation:250,easing:"cubic-bezier(0.2, 0, 0, 1)",ghostClass:"sortable-ghost",dragClass:"sortable-drag",swapThreshold:.65,forceFallback:!0,fallbackClass:"sortable-drag",fallbackOnBody:!0,filter:".btn-remove, .resize-handle",preventOnFilter:!1,onEnd:function(){const s=Array.from(e.children).map(l=>l.dataset.instanceId),c=[];s.forEach(l=>{const m=a.find(n=>n.instanceId===l);m&&c.push(m)}),a.splice(0,a.length,...c)}})),e.sortableInstance&&e.sortableInstance.option("disabled",!1),e.querySelectorAll(".resize-handle").forEach(s=>{s.addEventListener("mousedown",c=>{c.preventDefault(),c.stopPropagation();const l=c.target.closest(".dashboard-module"),m=l.dataset.instanceId,n=a.find(T=>T.instanceId===m),p=Ut[n==null?void 0:n.id];if(!n||!p)return;const o=c.target.closest(".resize-handle"),f=o&&(o.classList.contains("resize-r")||o.classList.contains("resize-br")),g=o&&(o.classList.contains("resize-b")||o.classList.contains("resize-br"));let i=c.clientX,d=c.clientY,x=0,u=0;const b=60,h=["S","M","L","XL"].filter(T=>p.widths.includes(T)),k=["standard","tall","xtall"].filter(T=>p.heights.includes(T));function S(T){if(f){if(x+=T.clientX-i,x>b){let I=h.indexOf(n.w);I<h.length-1&&(n.w=h[I+1],l.className=["dashboard-module",It[n.w]||"module-m",Et[n.h]||"","edit-mode"].filter(Boolean).join(" ")),x=0}else if(x<-b){let I=h.indexOf(n.w);I>0&&(n.w=h[I-1],l.className=["dashboard-module",It[n.w]||"module-m",Et[n.h]||"","edit-mode"].filter(Boolean).join(" ")),x=0}}if(g){if(u+=T.clientY-d,u>b){let I=k.indexOf(n.h);I<k.length-1&&(n.h=k[I+1],l.className=["dashboard-module",It[n.w]||"module-m",Et[n.h]||"","edit-mode"].filter(Boolean).join(" ")),u=0}else if(u<-b){let I=k.indexOf(n.h);I>0&&(n.h=k[I-1],l.className=["dashboard-module",It[n.w]||"module-m",Et[n.h]||"","edit-mode"].filter(Boolean).join(" ")),u=0}}i=T.clientX,d=T.clientY}function L(){document.removeEventListener("mousemove",S),document.removeEventListener("mouseup",L),document.body.style.cursor="",document.body.style.userSelect=""}document.addEventListener("mousemove",S),document.addEventListener("mouseup",L),document.body.style.cursor=window.getComputedStyle(c.target).cursor,document.body.style.userSelect="none"})})}function $s(e,a,t,s){const c=e.querySelector("#dashboard-header-actions"),l=e.querySelector("#btn-edit-dashboard");l.style.display="none",c.innerHTML=`
    <button class="btn btn-secondary btn-sm" id="btn-add-widget">
      <span class="material-icons-outlined" style="font-size:16px;">add</span> Add Widget
    </button>
    <button class="btn btn-ghost btn-sm" id="btn-reset-default" title="Reset to default dashboard">Reset to Default</button>
    <div style="width:1px; height:20px; background:var(--border-color); margin:0 4px;"></div>
    <button class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-layout">
      <span class="material-icons-outlined" style="font-size:16px;">save</span> Save Layout
    </button>`,c.querySelector("#btn-reset-default").addEventListener("click",()=>{confirm("Are you sure you want to reset your dashboard to the default layout?")&&(t.splice(0,t.length,...JSON.parse(JSON.stringify(Aa))),ut(a,t,s),ta(a,t,s))}),c.querySelector("#btn-save-layout").addEventListener("click",()=>{localStorage.setItem(Vt(),JSON.stringify(t)),nt=!1,a.sortableInstance&&a.sortableInstance.option("disabled",!0),l.style.display="",c.innerHTML=ea(),ut(a,t,s)}),c.querySelector("#btn-cancel-edit").addEventListener("click",()=>{try{const m=localStorage.getItem(Vt());m&&t.splice(0,t.length,...JSON.parse(m))}catch{}nt=!1,a.sortableInstance&&a.sortableInstance.option("disabled",!0),l.style.display="",c.innerHTML=ea(),ut(a,t,s)}),c.querySelector("#btn-add-widget").addEventListener("click",()=>{const m=Object.entries(Ut),n=document.createElement("div");n.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-height:420px;overflow-y:auto;">
          ${m.map(([p,o])=>`
            <div data-id="${p}" style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s;"
              onmouseover="this.style.borderColor='var(--color-primary)';this.style.background='var(--color-primary-light)';"
              onmouseout="this.style.borderColor='var(--border-color)';this.style.background='';">
              <span class="material-icons-outlined" style="color:var(--color-primary);font-size:18px;">widgets</span>
              <div>
                <div style="font-weight:600;font-size:13px;">${o.title}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Default: ${o.defaultW} · ${o.defaultH}</div>
              </div>
            </div>`).join("")}
        </div>`,me(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Pe);return{showModal:p}},void 0).then(({showModal:p})=>{p({title:"Add Widget",content:n,actions:[{label:"Close",className:"btn-secondary",onClick:o=>o()}]}),n.querySelectorAll("[data-id]").forEach(o=>{o.addEventListener("click",f=>{var d;const g=f.currentTarget.dataset.id,i=Ut[g];t.push({id:g,instanceId:"inst_"+Math.random().toString(36).substr(2,9),w:i.defaultW,h:i.defaultH}),(d=document.querySelector(".modal-overlay"))==null||d.remove(),ut(a,t,s),ta(a,t,s)})})})})}function ws(e,a){const t=e.jobs.filter(m=>m.status==="In Progress"||m.status==="Scheduled").length,s=e.quotes.filter(m=>m.status==="Sent"||m.status==="Draft").length,c=e.invoices.filter(m=>m.status==="Overdue").length;return[{label:"Total Revenue",value:"$"+e.invoices.filter(m=>m.status==="Paid").reduce((m,n)=>m+(n.total||0),0).toLocaleString("en-AU"),icon:"payments",color:"blue",sub:"+12.5% vs last month",pos:!0},{label:"Active Jobs",value:t,icon:"build",color:"green",sub:`${e.jobs.length} total`,pos:!0},{label:"Pending Quotes",value:s,icon:"request_quote",color:"orange",sub:`${e.quotes.length} total`,pos:null},{label:"Overdue Invoices",value:c,icon:"warning",color:"red",sub:c>0?"Requires attention":"All on track",pos:c===0}].map(m=>`
    <div class="stat-card" style="margin:0;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="stat-label">${m.label}</div>
        <div class="stat-icon ${m.color}"><span class="material-icons-outlined">${m.icon}</span></div>
      </div>
      <div class="stat-value">${m.value}</div>
      <div class="stat-change ${m.pos===!0?"positive":m.pos===!1?"negative":""}">
        <span style="font-size:12px;">${m.sub}</span>
      </div>
    </div>`).join("")}function Ss(e,a){const t={};e.jobs.forEach(l=>{t[l.status]=(t[l.status]||0)+1});const s=e.jobs.length||1,c={Pending:"var(--color-warning)",Scheduled:"var(--color-info)","In Progress":"var(--color-primary)","On Hold":"var(--text-tertiary)",Completed:"var(--color-success)",Invoiced:"#8B5CF6"};return`<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0;">
    ${Object.entries(t).map(([l,m])=>`
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:88px;font-size:12px;color:var(--text-secondary);flex-shrink:0;">${l}</span>
        <div style="flex:1;height:20px;background:var(--content-bg);border-radius:4px;overflow:hidden;">
          <div style="width:${(m/s*100).toFixed(1)}%;height:100%;background:${c[l]||"var(--text-tertiary)"};border-radius:4px;transition:width 0.5s;min-width:${m>0?"6px":"0"};"></div>
        </div>
        <span style="width:22px;text-align:right;font-size:12px;font-weight:600;">${m}</span>
      </div>`).join("")}
  </div>`}function ks(e,a){return`<div style="position:relative;width:100%;height:100%;background:#e5e3df;overflow:hidden;">
    <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.05) 1px,transparent 1px);background-size:20px 20px;"></div>
    ${e.people.filter(c=>c.type==="Staff").slice(0,4).map((c,l)=>{const m=15+l*22+Math.sin(l)*12,n=15+l*18+Math.cos(l)*18;return`<div style="position:absolute;top:${m}%;left:${n}%;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:10;">
      <div style="background:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.2);margin-bottom:2px;white-space:nowrap;">${c.firstName}</div>
      <div style="width:22px;height:22px;background:var(--color-primary);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;">${c.firstName[0]}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--color-primary);margin-top:-1px;"></div>
    </div>`}).join("")||'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;font-size:13px;">No technicians</div>'}
    <div style="position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,.85);padding:4px 8px;font-size:10px;border-radius:4px;">Mock Map</div>
  </div>`}function Cs(e,a){const t=[];return e.jobs.slice(0,4).forEach(s=>t.push({icon:"build",color:"var(--color-primary)",text:`Job <strong>${s.number}</strong> — ${s.title}`,sub:s.customerName,time:s.updatedAt})),e.quotes.slice(0,3).forEach(s=>t.push({icon:"request_quote",color:"var(--color-warning)",text:`Quote <strong>${s.number}</strong> ${s.status.toLowerCase()}`,sub:s.customerName,time:s.updatedAt})),e.invoices.slice(0,2).forEach(s=>t.push({icon:"receipt_long",color:s.status==="Paid"?"var(--color-success)":"var(--color-danger)",text:`Invoice <strong>${s.number}</strong> — ${s.status}`,sub:s.customerName,time:s.updatedAt})),t.sort((s,c)=>new Date(c.time)-new Date(s.time)),t.map(s=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);">
      <div style="width:28px;height:28px;border-radius:50%;background:${s.color}20;color:${s.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span class="material-icons-outlined" style="font-size:14px;">${s.icon}</span>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;">${s.text}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${s.sub} · ${Es(s.time)}</div>
      </div>
    </div>`).join("")}function Ts(e,a){const t={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Won:"badge-success",Lost:"badge-danger"};return`<table class="data-table" style="width:100%;">
    <thead><tr><th>Lead</th><th>Customer</th><th>Status</th></tr></thead>
    <tbody>${e.leads.slice(0,8).map(s=>`
      <tr style="cursor:pointer;" onclick="window.location.hash='/leads/${s.id}'">
        <td class="cell-link font-medium">${s.title}</td>
        <td style="color:var(--text-secondary);">${s.customerName}</td>
        <td><span class="badge ${t[s.status]||"badge-neutral"}">${s.status}</span></td>
      </tr>`).join("")}
    </tbody>
  </table>`}function Is(e,a){const t=e.jobs.filter(s=>s.status==="Scheduled"||s.status==="In Progress").slice(0,8);return t.length?t.map(s=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" onclick="window.location.hash='/jobs/${s.id}'">
      <div style="width:3px;height:30px;border-radius:2px;flex-shrink:0;background:${s.status==="In Progress"?"var(--color-primary)":"var(--color-warning)"};"></div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</div>
        <div style="font-size:11px;color:var(--text-tertiary);">${s.technicianName} · ${s.customerName}</div>
      </div>
      <span class="badge ${s.status==="In Progress"?"badge-primary":"badge-warning"}">${s.status}</span>
    </div>`).join(""):'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-tertiary);font-size:13px;">No jobs scheduled today</div>'}function Es(e){const a=Math.floor((Date.now()-new Date(e))/6e4);if(a<60)return`${a}m ago`;const t=Math.floor(a/60);return t<24?`${t}h ago`:`${Math.floor(t/24)}d ago`}function qs(e,a){var o;const t=(o=a.config)==null?void 0:o.jobId;if(!t)return Qe("push_pin","Click settings to pin a job");const s=e.jobs.find(f=>f.id===t);if(!s)return Qe("warning","Job not found");function c(f,g=0){let i=[];return f&&f.forEach(d=>{const x=d.subTasks&&d.subTasks.length>0||d.subPhases&&d.subPhases.length>0;i.push({...d,depth:g,isParent:x}),x&&(i=i.concat(c(d.subTasks||d.subPhases,g+1)))}),i}const l=s.tasks||s.phases||[],m=c(l),n=m.length;let p=0;if(l.length>0){const f=l.reduce((g,i)=>g+(i.progress||0),0);p=Math.round(f/l.length)}return`
    <div style="padding:2px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
        <span style="font-size:12px;font-weight:700;color:var(--text-primary);letter-spacing:0.5px;">JOB #${s.number}</span>
        <span style="font-size:14px;font-weight:700;color:var(--color-primary);">${p}%</span>
      </div>
      
      <div style="height:6px;background:var(--border-color);border-radius:3px;overflow:hidden;margin-bottom:14px;">
        <div style="width:${p}%;height:100%;background:var(--color-primary);border-radius:3px;transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:240px;overflow-y:auto;padding-right:4px;">
        ${n>0?m.map(f=>{const g=f.progress===100;return`
          <div style="display:flex;align-items:center;gap:8px;padding-left:${f.depth*14}px; opacity:${!f.isParent&&g?.6:1}">
            ${f.isParent?'<span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary);margin-top:2px;">folder</span>':`<span class="material-icons-outlined" style="font-size:16px;color:${g?"var(--color-success)":"var(--text-tertiary)"};">
                ${g?"check_circle":"radio_button_unchecked"}
              </span>`}
            <span style="font-size:12px;font-weight:${f.isParent?"700":"400"};text-decoration:${!f.isParent&&g?"line-through":"none"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:${f.isParent?"var(--text-primary)":"var(--text-secondary)"};">
              ${f.name}
            </span>
            ${f.isParent?`<span style="font-size:10px;font-weight:600;color:var(--text-tertiary);">${f.progress}%</span>`:""}
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
  `}function Ls(e,a){const t=r.getSettings(),s=e.jobs.filter(p=>p.status!=="Invoiced"&&p.status!=="Archived");let c=0,l=0;s.forEach(p=>{const o=(p.materials||[]).reduce((u,b)=>u+b.quantity*(b.unitCost||0),0),f=p.laborCost||0;c+=o+f;const g=La(p.materials||[],t),i=t.laborRates.find(u=>u.id===p.laborRateProfileId)||t.laborRates.find(u=>u.isDefault),d=p.estimatedHours||0,x=Math.max(d*((i==null?void 0:i.rate)||85),(i==null?void 0:i.minCallOutFee)||0);l+=g+x});const m=l-c,n=l>0?m/l*100:0;return`
    <div style="display:flex; flex-direction:column; gap:20px; height:100%; padding:4px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Projected Rev.</div>
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">$${l.toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="font-size:11px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Avg. Margin</div>
          <div style="font-size:18px; font-weight:700; color:${n>=30?"var(--color-success)":"var(--color-warning)"};">${n.toFixed(1)}%</div>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
        <div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:var(--text-secondary);">Projected Profit</span>
            <span style="font-weight:600; color:var(--color-success);">+$${m.toLocaleString("en-AU",{minimumFractionDigits:2})}</span>
          </div>
          <div style="height:12px; background:var(--bg-color); border-radius:6px; overflow:hidden; border:1px solid var(--border-color);">
            <div style="width:${Math.min(n,100)}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-success));"></div>
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
            <span style="font-weight:500;">$${m.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px; color:var(--text-tertiary); text-align:center; padding-top:8px; border-top:1px solid var(--border-color);">
        Based on ${s.length} active jobs using tiered material markups.
      </div>
    </div>
  `}function y(e){return e==null?"":String(e).replace(/[&<>"']/g,function(t){switch(t){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";case"'":return"&#39;";default:return t}})}function Xe({columns:e,data:a,onRowClick:t,getId:s,emptyMessage:c="No records found",emptyIcon:l="inbox",selectable:m=!1,onSelectionChange:n=null}){const p=document.createElement("div");p.className="card";let o=null,f="asc",g=1;const i=15,d=new Set;function x(){n&&n(Array.from(d))}function u(){let b=[...a];o&&b.sort((T,I)=>{const _=o.getValue?o.getValue(T):T[o.key],A=o.getValue?o.getValue(I):I[o.key];return _==null?1:A==null?-1:typeof _=="string"?f==="asc"?_.localeCompare(A):A.localeCompare(_):f==="asc"?_-A:A-_});const h=Math.ceil(b.length/i);g>h&&(g=h||1);const k=(g-1)*i,S=b.slice(k,k+i);if(a.length===0){p.innerHTML=`
        <div class="empty-state">
          <span class="material-icons-outlined">${y(l)}</span>
          <h3>${y(c)}</h3>
          <p>Get started by creating a new record.</p>
        </div>
      `;return}let L='<div class="data-table-wrapper"><table class="data-table"><thead><tr>';if(m){const T=S.length>0&&S.every(I=>d.has(String(s?s(I):I.id)));L+=`<th style="width: 40px; text-align: center;"><input type="checkbox" class="dt-select-all" ${T?"checked":""}></th>`}if(e.forEach(T=>{const I=o&&o.key===T.key,_=I?" sorted":"",A=I?f==="asc"?"arrow_upward":"arrow_downward":"unfold_more";L+=`<th class="${_}" data-key="${T.key}" style="${T.width?"width:"+T.width:""}">
        ${y(T.label)}
        <span class="material-icons-outlined sort-icon">${A}</span>
      </th>`}),L+="</tr></thead><tbody>",S.forEach(T=>{const I=String(s?s(T):T.id),_=d.has(I);L+=`<tr data-id="${y(I)}" style="cursor:pointer" class="${_?"selected-row":""}">`,m&&(L+=`<td style="width: 40px; text-align: center;" class="dt-select-cell">
          <input type="checkbox" class="dt-select-row" value="${y(I)}" ${_?"checked":""}>
        </td>`),e.forEach(A=>{const q=A.render?A.render(T):y(T[A.key]??"");L+=`<td>${q}</td>`}),L+="</tr>"}),L+="</tbody></table></div>",h>1){L+=`<div class="pagination">
        <span class="pagination-info">Showing ${k+1}–${Math.min(k+i,b.length)} of ${b.length}</span>
        <div class="pagination-controls">
          <button ${g===1?"disabled":""} data-page="prev">‹</button>`;for(let T=1;T<=h;T++){if(h>7&&T>2&&T<h-1&&Math.abs(T-g)>1){(T===3||T===h-2)&&(L+="<button disabled>…</button>");continue}L+=`<button class="${T===g?"page-active":""}" data-page="${T}">${T}</button>`}L+=`<button ${g===h?"disabled":""} data-page="next">›</button>
        </div>
      </div>`}if(p.innerHTML=L,p.querySelectorAll("th[data-key]").forEach(T=>{T.addEventListener("click",()=>{const I=e.find(_=>_.key===T.dataset.key);o===I?f=f==="asc"?"desc":"asc":(o=I,f="asc"),u()})}),t&&p.querySelectorAll("tbody tr[data-id]").forEach(T=>{T.addEventListener("click",I=>{I.target.closest(".dt-select-cell")||t(T.dataset.id)})}),m){p.querySelectorAll(".dt-select-row").forEach(I=>{I.addEventListener("change",_=>{_.target.checked?d.add(_.target.value):d.delete(_.target.value),x(),u()})});const T=p.querySelector(".dt-select-all");T&&T.addEventListener("change",I=>{const _=I.target.checked;S.forEach(A=>{const q=String(s?s(A):A.id);_?d.add(q):d.delete(q)}),x(),u()})}p.querySelectorAll(".pagination-controls button[data-page]").forEach(T=>{T.addEventListener("click",()=>{const I=T.dataset.page;I==="prev"?g--:I==="next"?g++:g=parseInt(I),u()})})}return u(),p.updateData=b=>{a=b,u()},p.clearSelection=()=>{d.clear(),x(),u()},p}let vt=null;function As(){return(!vt||!document.body.contains(vt))&&(vt=document.createElement("div"),vt.className="toast-container",vt.id="toast-container",document.body.appendChild(vt)),vt}function H(e,a="info",t={}){const s=typeof t=="number"?t:t.duration||3500,c=typeof t=="object"?t.link:null,l=typeof t=="object"?t.skipBell:!1;if(c&&!l){let o="Notification";a==="success"&&(o="Success"),a==="error"&&(o="Error"),a==="warning"&&(o="Warning"),r.create("notifications",{title:o,message:e,link:c,read:!1})}const m=As(),n=document.createElement("div");n.className=`toast ${a}`,c&&(n.style.cursor="pointer",n.title="Click to view");const p={success:"check_circle",error:"error",warning:"warning",info:"info"};n.innerHTML=`
    <span class="material-icons-outlined" style="color:var(--color-${a==="error"?"danger":a})">${p[a]||p.info}</span>
    <span style="flex:1;font-size:var(--font-size-base)">${e}</span>
    <button style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px" class="toast-close">
      <span class="material-icons-outlined" style="font-size:16px">close</span>
    </button>
  `,c&&n.addEventListener("click",o=>{o.target.closest(".toast-close")||(X.navigate(c),n.remove())}),n.querySelector(".toast-close").addEventListener("click",o=>{o.stopPropagation(),n.remove()}),m.appendChild(n),setTimeout(()=>{n.parentNode&&(n.style.opacity="0",n.style.transform="translateX(20px)",n.style.transition="0.3s ease",setTimeout(()=>n.remove(),300))},s)}function Ds(e,a,t){r.create("notifications",{title:e,message:a,link:t,read:!1}),H(`${e}: ${a}`,"info",{link:t,skipBell:!0})}const De=Object.freeze(Object.defineProperty({__proto__:null,addSystemNotification:Ds,showToast:H},Symbol.toStringTag,{value:"Module"}));function Ze({container:e,selectedIds:a,actions:t,onClear:s}){const c=e.querySelector(".bulk-action-bar");if(c&&c.remove(),!a||a.length===0)return;const l=document.createElement("div");l.className="bulk-action-bar slide-up";let m=`
    <div class="bulk-action-left">
      <span class="bulk-count">${a.length} selected</span>
      <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
    </div>
    <div class="bulk-action-right">
  `;return t.forEach((n,p)=>{m+=`<button class="btn ${n.className||"btn-secondary"} btn-sm" data-action="${p}">
      ${n.icon?`<span class="material-icons-outlined" style="font-size:16px">${y(n.icon)}</span> `:""}
      ${y(n.label)}
    </button>`}),m+="</div>",l.innerHTML=m,l.querySelector("#btn-clear-selection").addEventListener("click",()=>{s&&s()}),l.querySelectorAll("button[data-action]").forEach(n=>{n.addEventListener("click",()=>{const p=n.dataset.action;t[p]&&t[p].onClick&&t[p].onClick(a)})}),e.appendChild(l),l}function aa(e){const a=r.getAll("customers");e.innerHTML=`
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
        <button class="toolbar-filter" data-filter="Active">Active (${a.filter(l=>l.status==="Active").length})</button>
        <button class="toolbar-filter" data-filter="Inactive">Inactive (${a.filter(l=>l.status==="Inactive").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search customers..." id="people-search" />
      </div>
    </div>
    <div id="people-table-container"></div>
  `;let t=[...a];const c=Xe({columns:[{key:"company",label:"Company / Name",render:l=>`<span class="cell-link font-medium">${y(l.company)}</span>`},{key:"contact",label:"Contact",render:l=>`${y(l.firstName)} ${y(l.lastName)}`},{key:"email",label:"Email",render:l=>`<span class="text-secondary">${y(l.email)}</span>`},{key:"phone",label:"Phone",render:l=>`<span class="text-secondary">${y(l.phone)}</span>`},{key:"type",label:"Type",render:l=>`<span class="badge badge-neutral">${y(l.type)}</span>`},{key:"status",label:"Status",render:l=>`<span class="badge ${l.status==="Active"?"badge-success":"badge-neutral"}">${y(l.status)}</span>`}],data:t,onRowClick:l=>X.navigate(`/people/${l}`),emptyMessage:"No customers found",emptyIcon:"people",selectable:!0,onSelectionChange:l=>{Ze({container:e,selectedIds:l,onClear:()=>c.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:m=>{const n=document.createElement("div");n.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Pe);return{showModal:p}},void 0).then(({showModal:p})=>{p({title:`Update ${m.length} Customers`,content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:o=>o()},{label:"Apply",className:"btn-primary",onClick:o=>{const f=n.querySelector("#bulk-status").value;m.forEach(g=>r.update("customers",g,{status:f})),c.clearSelection(),aa(e),H(`Updated ${m.length} customers to ${f}`,"success"),o()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:m=>{me(async()=>{const{showModal:n}=await Promise.resolve().then(()=>Pe);return{showModal:n}},void 0).then(({showModal:n})=>{const p=document.createElement("div");p.innerHTML=`<p>Are you sure you want to delete ${m.length} customers? This cannot be undone.</p>`,n({title:"Confirm Bulk Delete",content:p,actions:[{label:"Cancel",className:"btn-secondary",onClick:o=>o()},{label:"Delete",className:"btn-danger",onClick:o=>{m.forEach(f=>r.delete("customers",f)),c.clearSelection(),aa(e),H(`Deleted ${m.length} customers`,"success"),o()}}]})})}}]})}});e.querySelector("#people-table-container").appendChild(c),e.querySelector("#btn-new-person").addEventListener("click",()=>{X.navigate("/people/new")}),e.querySelector("#btn-export-people").addEventListener("click",()=>{H("Customer data exported successfully","success")}),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(n=>n.classList.remove("active")),l.classList.add("active");const m=l.dataset.filter;t=m==="all"?[...a]:a.filter(n=>n.status===m),c.updateData(t)})}),e.querySelector("#people-search").addEventListener("input",l=>{var p;const m=l.target.value.toLowerCase();t=a.filter(o=>o.company.toLowerCase().includes(m)||`${o.firstName} ${o.lastName}`.toLowerCase().includes(m)||o.email.toLowerCase().includes(m));const n=(p=e.querySelector(".toolbar-filter.active"))==null?void 0:p.dataset.filter;n&&n!=="all"&&(t=t.filter(o=>o.status===n)),c.updateData(t)})}function xe({title:e,content:a,size:t="",onClose:s,actions:c=[]}){const l=document.createElement("div");l.className="modal-overlay",l.id="modal-overlay";const m=document.createElement("div");m.className=`modal ${t}`;let n=`
    <div class="modal-header">
      <h3>${y(e)}</h3>
      <button class="modal-close" id="modal-close-btn">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
    <div class="modal-body">${typeof a=="string"?y(a):""}</div>
  `;c.length&&(n+='<div class="modal-footer">',c.forEach((f,g)=>{n+=`<button class="btn ${f.className||"btn-secondary"}" id="modal-action-${g}">${y(f.label)}</button>`}),n+="</div>"),m.innerHTML=n,typeof a!="string"&&(a instanceof HTMLElement||a instanceof DocumentFragment)&&(m.querySelector(".modal-body").innerHTML="",m.querySelector(".modal-body").appendChild(a)),l.appendChild(m),document.body.appendChild(l);const p=()=>{l.remove(),s&&s()};m.querySelector("#modal-close-btn").addEventListener("click",p),l.addEventListener("click",f=>{f.target===l&&p()}),c.forEach((f,g)=>{const i=m.querySelector(`#modal-action-${g}`);i&&f.onClick&&i.addEventListener("click",()=>f.onClick(p))});const o=f=>{f.key==="Escape"&&(p(),document.removeEventListener("keydown",o))};return document.addEventListener("keydown",o),{close:p,modal:m,overlay:l}}const Pe=Object.freeze(Object.defineProperty({__proto__:null,showModal:xe},Symbol.toStringTag,{value:"Module"}));function mt({title:e,icon:a,iconBgColor:t="var(--color-primary-light)",iconTextColor:s="var(--color-primary)",metaHtml:c="",actionsHtml:l=""}){return`
    <div class="detail-header">
      <div class="detail-header-info">
        <div class="detail-header-icon" style="background:${t};color:${s}">
          <span class="material-icons-outlined">${a}</span>
        </div>
        <div>
          <div class="detail-header-text"><h2>${e}</h2></div>
          ${c?`<div class="detail-header-meta">${c}</div>`:""}
        </div>
      </div>
      <div class="flex gap-sm">
        ${l}
      </div>
    </div>
  `}function He({title:e,content:a,actions:t=[],width:s=400}){const c=document.querySelector(".drawer-overlay");c&&c.remove();const l=document.createElement("div");l.className="drawer-overlay";const m=document.createElement("div");m.className="drawer",m.style.width=typeof s=="number"?`${s}px`:s;const n=document.createElement("div");n.className="drawer-header",n.innerHTML=`
    <h3>${e}</h3>
    <button class="drawer-close"><span class="material-icons-outlined">close</span></button>
  `;const p=document.createElement("div");if(p.className="drawer-body",typeof a=="string"?p.innerHTML=a:p.appendChild(a),m.appendChild(n),m.appendChild(p),t.length>0){const f=document.createElement("div");f.className="drawer-footer",t.forEach(g=>{const i=document.createElement("button");i.className=`btn ${g.className||"btn-secondary"}`,i.innerHTML=g.label,i.onclick=()=>g.onClick(o),f.appendChild(i)}),m.appendChild(f)}l.appendChild(m),document.body.appendChild(l);function o(){m.style.animation="slideRightOut 0.2s ease forwards",l.style.animation="fadeOut 0.2s ease forwards",setTimeout(()=>l.remove(),200)}n.querySelector(".drawer-close").onclick=o,l.addEventListener("mousedown",f=>{f.target===l&&o()})}function Da({customerId:e=null,site:a="",onSave:t=null}={}){const s=r.getAll("customers"),c=r.getAll("people").filter(x=>x.type==="Staff"),l=e?r.getById("customers",e):null,m=(l==null?void 0:l.sites)||[],n=document.createElement("div");n.innerHTML=`
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
            ${s.map(x=>`<option value="${x.id}" ${e===x.id?"selected":""}>${x.company||x.firstName+" "+x.lastName}</option>`).join("")}
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
            ${c.map(x=>`<option value="${x.id}">${x.firstName} ${x.lastName}</option>`).join("")}
          </select>
        </div>
      </div>

      <div id="qa-customer-fields" style="display: ${e?"flex":"none"}; gap: 15px;" class="form-row">
        <div class="form-group">
          <label class="form-label">Location / Site</label>
          <select id="qa-asset-site" class="form-select">
            <option value="">-- No specific site --</option>
            ${m.map(x=>`<option value="${y(x.name)}" ${a===x.name?"selected":""}>${y(x.name)}</option>`).join("")}
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
  `;const p=n.querySelector("#qa-owner-type"),o=n.querySelector("#qa-customer-group"),f=n.querySelector("#qa-business-fields"),g=n.querySelector("#qa-customer-fields"),i=n.querySelector("#qa-customer-id"),d=n.querySelector("#qa-asset-site");p.addEventListener("change",x=>{const u=x.target.value==="Customer";o.style.display=u?"block":"none",f.style.display=u?"none":"flex",g.style.display=u?"flex":"none"}),i.addEventListener("change",x=>{const u=x.target.value,b=r.getById("customers",u);b&&b.sites?d.innerHTML='<option value="">-- No specific site --</option>'+b.sites.map(h=>`<option value="${y(h.name)}">${y(h.name)}</option>`).join(""):d.innerHTML='<option value="">-- No specific site --</option>'}),xe({title:"Quick Add Asset",size:"modal-70",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Create Asset",className:"btn-primary",onClick:x=>{const u=n.querySelector("#qa-asset-name").value.trim();if(!u)return H("Asset Name is required","error");const b=p.value,h=i.value;if(b==="Customer"&&!h)return H("Please select a customer","error");const k={name:u,description:n.querySelector("#qa-asset-desc").value.trim(),ownerType:b,customerId:b==="Customer"?h:null,type:n.querySelector("#qa-asset-type").value,serial:n.querySelector("#qa-asset-serial").value.trim(),status:"Active",serviceIntervalMonths:parseInt(n.querySelector("#qa-service-interval").value)||6,currentMeter:parseInt(n.querySelector("#qa-initial-meter").value)||0,meterUnit:n.querySelector("#qa-meter-unit").value,logs:[]};b==="Business"?(k.recoveryRate=parseFloat(n.querySelector("#qa-recovery-rate").value)||0,k.assignedToId=n.querySelector("#qa-assigned-to").value):(k.site=d.value,k.installDate=n.querySelector("#qa-install-date").value);const S=r.create("assets",k);H(`Asset "${u}" created successfully`,"success"),t&&t(S),x()}}]})}function ya({onSave:e}={}){const a=r.getAll("assets"),s=r.getSettings().materialCategories||["Consumables","Electrical","Plumbing","HVAC Parts","Fixings","General"],c=document.createElement("div");c.innerHTML=`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div class="form-group" style="grid-column: span 2;">
        <label class="form-label">Item Name *</label>
        <input type="text" id="qs-name" class="form-input" placeholder="e.g. 20mm Conduit 4m" required />
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="qs-category" class="form-select">
          ${s.map(l=>`<option>${l}</option>`).join("")}
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
            ${a.map(l=>`<option>${l.name}</option>`).join("")}
          </optgroup>
        </select>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 11px; color: var(--text-tertiary);">
      Note: If Sell Price is blank, a 30% default markup will be applied.
    </div>
  `,xe({title:"Create New Catalog Item",content:c,actions:[{label:"Cancel",className:"btn-secondary",onClick:l=>l()},{label:"Save to Catalog",className:"btn-primary",onClick:l=>{const m=c.querySelector("#qs-name").value,n=parseFloat(c.querySelector("#qs-cost").value)||0;let p=parseFloat(c.querySelector("#qs-sell").value);if(!m){H("Item name is required","error");return}if(n<=0){H("Cost price is required","error");return}(isNaN(p)||p===0)&&(p=n*1.3);const o=r.create("stock",{name:m,category:c.querySelector("#qs-category").value,sku:c.querySelector("#qs-sku").value||`SKU-${Date.now().toString().slice(-4)}`,unit:c.querySelector("#qs-unit").value,reorderLevel:parseInt(c.querySelector("#qs-reorder").value)||10,costPrice:n,unitPrice:p,location:c.querySelector("#qs-location").value,quantity:0,supplier:""});H(`Stock item "${m}" created`,"success"),e&&e(o),l()}}]})}function ga({id:e=null,jobId:a=null,supplierId:t=null,onSave:s=null}={}){const c=!e,l=(r.getAll("suppliers")||[]).filter(x=>x.active!==!1),m=r.getAll("jobs").filter(x=>x.status!=="Completed"&&x.status!=="Invoiced"),n=r.getAll("stock");let p=c?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],notes:"",supplierId:t||"",jobId:a||""}:r.getById("purchaseOrders",e);if(!p){H("Purchase Order not found","error");return}let o=[...p.lineItems||[]];const f=document.createElement("div");f.className="po-drawer-container";function g(){f.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card" style="padding:16px; background:var(--bg-color)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supplier *</label>
              <select id="qa-po-supplier" class="form-select" ${p.status!=="Draft"&&!c?"disabled":""}>
                <option value="">Select supplier...</option>
                ${l.map(x=>`<option value="${x.id}" ${p.supplierId===x.id?"selected":""}>${y(x.name)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Linked Job</label>
              <select id="qa-po-job" class="form-select" ${p.status!=="Draft"&&!c?"disabled":""}>
                <option value="">No specific job (Stock PO)</option>
                ${m.map(x=>`<option value="${x.id}" ${p.jobId===x.id?"selected":""}>#${x.number} - ${x.title}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="margin-top:12px">
            <div class="form-group">
              <label class="form-label">Issue Date</label>
              <input type="date" id="qa-po-date" class="form-input" value="${p.issueDate?p.issueDate.split("T")[0]:""}" ${p.status!=="Draft"&&!c?"disabled":""} />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" id="qa-po-notes" class="form-input" value="${y(p.notes||"")}" placeholder="e.g. Delivery instructions" ${p.status!=="Draft"&&!c?"disabled":""} />
            </div>
          </div>
        </div>

        <div class="po-items-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <h4 style="margin:0">Line Items ${c?"":`(${y(p.number)})`}</h4>
            ${p.status==="Draft"||c?`
            <div style="display:flex; gap:8px">
               <button class="btn btn-secondary btn-sm" id="btn-browse-stock"><span class="material-icons-outlined" style="font-size:16px">inventory_2</span> Browse Stock</button>
               <button class="btn btn-secondary btn-sm" id="btn-add-stock-new"><span class="material-icons-outlined" style="font-size:16px">add</span> Add New Stock</button>
            </div>
            `:`<span class="badge ${p.status==="Issued"?"badge-primary":"badge-success"}">${p.status}</span>`}
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
                ${o.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:32px">No items added yet.</td></tr>':o.map((x,u)=>`
                  <tr data-idx="${u}">
                    <td>
                       <input type="text" class="form-input item-desc" value="${y(x.description)}" style="width:100%" placeholder="Search stock..." list="stock-list-${u}" ${p.status!=="Draft"&&!c?"disabled":""} />
                       <datalist id="stock-list-${u}">
                          ${n.map(b=>`<option value="${y(b.name)}">${y(b.name)} - $${(b.costPrice||0).toFixed(2)}</option>`).join("")}
                       </datalist>
                    </td>
                    <td><input type="number" class="form-input item-qty" value="${x.qty||x.quantity}" min="1" style="width:100%" ${p.status!=="Draft"&&!c?"disabled":""} /></td>
                    <td><input type="number" class="form-input item-cost" value="${x.cost||x.unitCost}" step="0.01" style="width:100%" ${p.status!=="Draft"&&!c?"disabled":""} /></td>
                    <td style="text-align:right; font-weight:600">$${((x.qty||x.quantity||0)*(x.cost||x.unitCost||0)).toFixed(2)}</td>
                    <td>${p.status==="Draft"||c?'<button class="btn btn-ghost btn-sm btn-icon text-danger btn-remove-item"><span class="material-icons-outlined" style="font-size:18px">close</span></button>':""}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr style="background:var(--bg-color); font-weight:700">
                  <td colspan="3" style="text-align:right">Total (Ex GST):</td>
                  <td style="text-align:right">$${o.reduce((x,u)=>x+(u.qty||u.quantity||0)*(u.cost||u.unitCost||0),0).toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `,i()}function i(){var x,u;(x=f.querySelector("#btn-add-stock-new"))==null||x.addEventListener("click",()=>{ya({onSave:b=>{o.push({description:b.name,qty:1,cost:b.costPrice||0,stockId:b.id}),g()}})}),(u=f.querySelector("#btn-browse-stock"))==null||u.addEventListener("click",()=>{var h;const b=document.createElement("div");b.innerHTML=`
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:12px">
          <div class="toolbar-search" style="flex:1">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="stock-search" placeholder="Search materials..." style="width:100%" />
          </div>
          <button class="btn btn-primary btn-sm" id="btn-po-new-stock"><span class="material-icons-outlined" style="font-size:16px">add</span> New Stock Item</button>
        </div>
        <div id="stock-list-browse" style="max-height:400px; overflow-y:auto">
          ${n.map(k=>`
            <div class="stock-pick-item" data-id="${k.id}" style="padding:10px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer">
              <div>
                <div style="font-weight:600">${y(k.name)}</div>
                <div style="font-size:11px; color:var(--text-secondary)">SKU: ${k.sku||"N/A"} — Cost: $${(k.costPrice||0).toFixed(2)}</div>
              </div>
              <span class="material-icons-outlined" style="color:var(--color-primary)">add_circle_outline</span>
            </div>
          `).join("")}
        </div>
      `,xe({title:"Select Stock",content:b,actions:[{label:"Close",className:"btn-secondary",onClick:k=>k()}]}),(h=b.querySelector("#btn-po-new-stock"))==null||h.addEventListener("click",()=>{ya({onSave:k=>{var S;o.push({description:k.name,qty:1,cost:k.costPrice||0,stockId:k.id}),g(),(S=document.querySelector(".modal-overlay"))==null||S.remove()}})}),b.querySelectorAll(".stock-pick-item").forEach(k=>{k.addEventListener("click",()=>{const S=n.find(L=>L.id===k.dataset.id);S&&(o.push({description:S.name,qty:1,cost:S.costPrice||0,stockId:S.id}),g(),H(`Added ${S.name}`,"success"))})})}),f.querySelectorAll("#po-items-body tr").forEach(b=>{var T;const h=parseInt(b.dataset.idx),k=b.querySelector(".item-desc"),S=b.querySelector(".item-qty"),L=b.querySelector(".item-cost");k==null||k.addEventListener("change",I=>{const _=I.target.value,A=n.find(q=>q.name===_);A?(o[h].description=A.name,o[h].cost=A.costPrice||0,o[h].stockId=A.id):o[h].description=_,g()}),S==null||S.addEventListener("input",()=>{const I=parseFloat(S.value)||0;o[h].qty=I,o[h].quantity=I}),L==null||L.addEventListener("input",()=>{const I=parseFloat(L.value)||0;o[h].cost=I,o[h].unitCost=I}),(T=b.querySelector(".btn-remove-item"))==null||T.addEventListener("click",()=>{o.splice(h,1),g()})})}g();const d=[{label:"Cancel",className:"btn-secondary",onClick:x=>x()}];c||p.status==="Draft"?d.push({label:c?"Create & Issue PO":"Update & Issue PO",className:"btn-primary",onClick:x=>{const u=f.querySelector("#qa-po-supplier").value,b=f.querySelector("#qa-po-job").value;if(!u){H("Supplier is required","error");return}if(o.length===0){H("Please add at least one item","error");return}const h=l.find(L=>L.id===u),k=m.find(L=>L.id===b),S={number:p.number||`PO-${Date.now().toString().slice(-6)}`,supplierId:u,supplierName:(h==null?void 0:h.name)||(h==null?void 0:h.company)||"Unknown",jobId:b||null,jobNumber:(k==null?void 0:k.number)||"",issueDate:f.querySelector("#qa-po-date").value,notes:f.querySelector("#qa-po-notes").value,total:o.reduce((L,T)=>L+(T.qty||T.quantity||0)*(T.cost||T.unitCost||0),0),status:"Issued",lineItems:o};c?r.create("purchaseOrders",S):r.update("purchaseOrders",e,S),H(`Purchase Order ${S.number} issued`,"success"),s&&s(),x()}}):p.status==="Issued"&&d.push({label:"Mark as Received",className:"btn-success",onClick:x=>{const u=r.getAll("technicians"),b=r.getAll("assets"),h=document.createElement("div");h.innerHTML=`
           <div class="form-group">
             <label class="form-label">Receive into Location *</label>
             <select class="form-select" id="receive-location-select" required>
               <option value="Main Warehouse">Main Warehouse</option>
               <optgroup label="Warehouses">
                 <option value="Warehouse A">Warehouse A</option>
                 <option value="Warehouse B">Warehouse B</option>
               </optgroup>
               <optgroup label="Vehicles">
                 ${u.map(k=>`<option value="Vehicle - ${y(k.name)}">Vehicle - ${y(k.name)}</option>`).join("")}
               </optgroup>
               <optgroup label="Assets">
                 ${b.map(k=>`<option value="${y(k.name)}">${y(k.name)}</option>`).join("")}
               </optgroup>
             </select>
           </div>
         `,xe({title:"Receive Purchase Order",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Receive Items",className:"btn-success",onClick:k=>{const S=h.querySelector("#receive-location-select").value;if(!S){H("Please select a valid location","error");return}let L=0;const T=r.getAll("stock");o.forEach(I=>{var A;const _=I.stockId;if(_){const q=T.find(w=>w.id===_);if(q){q.locations||(q.locations=[]);let w=q.locations.find($=>$.location===S);const v=parseFloat(I.qty||I.quantity)||0;w?w.quantity+=v:q.locations.push({location:S,quantity:v}),q.quantity=q.locations.reduce(($,C)=>$+C.quantity,0),q.location=((A=q.locations[0])==null?void 0:A.location)||"Main Warehouse",q.updatedAt=new Date().toISOString(),L++}}}),L>0&&r.save("stock",T),r.update("purchaseOrders",e,{status:"Received",receivedDate:new Date().toISOString()}),H(`Received ${L} items into ${S}`,"success"),k(),s&&s(),x()}}]})}}),He({title:c?"New Purchase Order":"Manage Purchase Order",content:f,width:750,actions:d})}function _s(e,{id:a}){const t=r.getById("customers",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Customer not found</h3></div>';return}dt(t.company);const s=r.getAll("jobs").filter(o=>o.customerId===a),c=r.getAll("quotes").filter(o=>o.customerId===a),l=r.getAll("invoices").filter(o=>o.customerId===a);let m="details";function n(){e.innerHTML=`
      ${mt({title:y(t.company),icon:t.type==="Company"?"business":"person",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${y(t.firstName)} ${y(t.lastName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${y(t.email)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${y(t.phone)}</span>
          <span class="badge ${t.status==="Active"?"badge-success":"badge-neutral"}">${y(t.status)}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-edit-person">
            <span class="material-icons-outlined">edit</span> Edit
          </button>
          <button class="btn btn-danger" id="btn-delete-person">
            <span class="material-icons-outlined">delete</span> Delete
          </button>
        `})}

      <div class="tabs" id="person-tabs">
        <button class="tab ${m==="details"?"active":""}" data-tab="details">Details</button>
        <button class="tab ${m==="contacts"?"active":""}" data-tab="contacts">Contacts (${(t.contacts||[]).length})</button>
        <button class="tab ${m==="sites"?"active":""}" data-tab="sites">Sites (${(t.sites||[]).length})</button>
        <button class="tab ${m==="assets"?"active":""}" data-tab="assets">Assets (${r.getAll("assets").filter(o=>o.ownerType==="Customer"&&o.customerId===a).length})</button>
        <button class="tab ${m==="communications"?"active":""}" data-tab="communications">Communications (${(t.communications||[]).length})</button>
        <button class="tab ${m==="jobs"?"active":""}" data-tab="jobs">Jobs (${s.length})</button>
        <button class="tab ${m==="quotes"?"active":""}" data-tab="quotes">Quotes (${c.length})</button>
        <button class="tab ${m==="invoices"?"active":""}" data-tab="invoices">Invoices (${l.length})</button>
      </div>

      <div class="tab-content" id="tab-content"></div>
    `,p(),e.querySelectorAll(".tab").forEach(o=>{o.addEventListener("click",()=>{m=o.dataset.tab,e.querySelectorAll(".tab").forEach(f=>f.classList.remove("active")),o.classList.add("active"),p()})}),e.querySelector("#btn-edit-person").addEventListener("click",()=>{X.navigate(`/people/${a}/edit`)}),e.querySelector("#btn-delete-person").addEventListener("click",()=>{const o=document.createElement("div");o.innerHTML=`<p>Are you sure you want to delete <strong>${y(t.company)}</strong>? This action cannot be undone.</p>`,xe({title:"Delete Customer",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Delete",className:"btn-danger",onClick:f=>{r.delete("customers",a),H("Customer deleted successfully","success"),f(),X.navigate("/people")}}]})})}function p(){const o=e.querySelector("#tab-content");if(m==="details")o.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-3">
              <div style="grid-column: span 2">
                <h4 style="margin-bottom:var(--space-base)">Contact Information</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${et("Company",t.company)}
                  ${et("Contact",`${t.firstName} ${t.lastName}`)}
                  ${et("Email",t.email)}
                  ${et("Phone",t.phone)}
                  ${et("Type",t.type)}
                  ${et("Status",t.status)}
                </div>
              </div>
              <div style="grid-column: span 1">
                <h4 style="margin-bottom:var(--space-base)">Address</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${et("Address",t.address||"Not set")}
                </div>
                <h4 style="margin-top:var(--space-xl);margin-bottom:var(--space-base)">History</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${et("Created",new Date(t.createdAt).toLocaleDateString())}
                  ${et("Last Updated",new Date(t.updatedAt).toLocaleDateString())}
                  ${et("Total Jobs",s.length)}
                  ${et("Total Quotes",c.length)}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;else if(m==="contacts"){const f=t.contacts||[];o.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Contacts (${f.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-contact"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Contact</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${f.map((g,i)=>`
                  <tr>
                    <td class="font-medium">${y(g.name)}</td>
                    <td>${y(g.role||"—")}</td>
                    <td><a href="mailto:${y(g.email)}" class="cell-link">${y(g.email)}</a></td>
                    <td><a href="tel:${y(g.phone)}" class="cell-link">${y(g.phone)}</a></td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-contact" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${f.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No additional contacts</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,o.querySelector("#btn-toggle-contact").addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input type="text" id="new-c-name" class="form-input"></div>
            <div class="form-group"><label class="form-label">Role</label><input type="text" id="new-c-role" class="form-input"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="new-c-email" class="form-input"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" id="new-c-phone" class="form-input"></div>
          </div>
        `,He({title:"Add Contact",content:g.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const d=document.querySelector(".drawer-overlay"),x=d.querySelector("#new-c-name").value.trim();if(!x)return H("Name is required","error");t.contacts||(t.contacts=[]),t.contacts.push({name:x,role:d.querySelector("#new-c-role").value,email:d.querySelector("#new-c-email").value,phone:d.querySelector("#new-c-phone").value}),r.update("customers",a,{contacts:t.contacts}),H("Contact added","success"),p(),n(),i()}}]})}),o.querySelectorAll(".btn-delete-contact").forEach(g=>{g.addEventListener("click",()=>{t.contacts.splice(g.dataset.index,1),r.update("customers",a,{contacts:t.contacts}),H("Contact deleted","success"),p(),n()})})}else if(m==="sites"){const f=t.sites||[];o.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Sites (${f.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-site"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Site</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Site Name</th><th>Address</th><th>Notes</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${f.map((g,i)=>`
                  <tr>
                    <td class="font-medium">${y(g.name)}</td>
                    <td>${y(g.address)}</td>
                    <td class="text-secondary">${y(g.notes||"—")}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-site" data-index="${i}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${f.length?"":'<tr><td colspan="4" style="text-align:center;padding:20px" class="text-secondary">No sites added</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,o.querySelector("#btn-toggle-site").addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`
          <div class="form-row">
            <div class="form-group"><label class="form-label">Site Name *</label><input type="text" id="new-s-name" class="form-input" placeholder="e.g. Headquarters"></div>
            <div class="form-group"><label class="form-label">Address *</label><input type="text" id="new-s-address" class="form-input"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><input type="text" id="new-s-notes" class="form-input"></div>
        `,He({title:"Add Site",content:g.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Save",className:"btn-primary",onClick:i=>{const d=document.querySelector(".drawer-overlay"),x=d.querySelector("#new-s-name").value.trim(),u=d.querySelector("#new-s-address").value.trim();if(!x||!u)return H("Name and Address are required","error");t.sites||(t.sites=[]),t.sites.push({name:x,address:u,notes:d.querySelector("#new-s-notes").value}),r.update("customers",a,{sites:t.sites}),H("Site added","success"),p(),n(),i()}}]})}),o.querySelectorAll(".btn-delete-site").forEach(g=>{g.addEventListener("click",()=>{t.sites.splice(g.dataset.index,1),r.update("customers",a,{sites:t.sites}),H("Site deleted","success"),p(),n()})})}else if(m==="assets"){t.assets&&t.assets.length>0&&(t.assets.forEach(g=>{r.create("assets",{name:g.name,serial:g.serial,site:g.site,installDate:g.installDate,ownerType:"Customer",customerId:a,status:"Active",type:"Equipment"})}),t.assets=[],r.update("customers",a,{assets:[]}));const f=r.getAll("assets").filter(g=>g.ownerType==="Customer"&&g.customerId===a);t.sites,o.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Assets/Equipment (${f.length})</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-asset"><span class="material-icons-outlined" style="font-size:16px">add</span> Add Asset</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Asset Name</th><th>Serial No.</th><th>Site</th><th>Install Date</th><th style="width:50px"></th></tr></thead>
              <tbody>
                ${f.map((g,i)=>`
                  <tr>
                    <td class="font-medium">${y(g.name)}</td>
                    <td style="font-family:monospace" class="text-secondary">${y(g.serial||"—")}</td>
                    <td>${y(g.site||"—")}</td>
                    <td>${g.installDate?new Date(g.installDate).toLocaleDateString():"—"}</td>
                    <td><button class="btn btn-icon btn-sm btn-danger btn-delete-asset" data-id="${g.id}"><span class="material-icons-outlined" style="font-size:14px">close</span></button></td>
                  </tr>
                `).join("")}
                ${f.length?"":'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No assets tracked</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,o.querySelector("#btn-toggle-asset").addEventListener("click",()=>{Da({customerId:a,onSave:()=>{p(),n()}})}),o.querySelectorAll(".btn-delete-asset").forEach(g=>{g.addEventListener("click",()=>{const i=g.dataset.id;r.delete("assets",i),H("Asset disabled/deleted","success"),p(),n()})})}else if(m==="communications"){const g=[...t.communications||[]].sort((i,d)=>new Date(d.date)-new Date(i.date));o.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header">
            <h4>Communication History</h4>
            <button class="btn btn-primary btn-sm" id="btn-toggle-comm"><span class="material-icons-outlined" style="font-size:16px">add</span> Log Activity</button>
          </div>
          <div class="card-body">
            ${g.length===0?'<div style="text-align:center;padding:20px" class="text-secondary">No communications logged</div>':`
              <div style="display:flex;flex-direction:column;gap:16px">
                ${g.map((i,d)=>`
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
      `,o.querySelector("#btn-toggle-comm").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=`
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
        `,He({title:"Log Activity",content:i.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Save",className:"btn-primary",onClick:d=>{const x=document.querySelector(".drawer-overlay"),u=x.querySelector("#new-comm-content").value.trim();if(!u)return H("Details are required","error");t.communications||(t.communications=[]),t.communications.push({id:Date.now().toString(),type:x.querySelector("#new-comm-type").value,date:x.querySelector("#new-comm-date").value,content:u}),r.update("customers",a,{communications:t.communications}),H("Activity logged","success"),p(),n(),d()}}]})})}else m==="jobs"?o.innerHTML=Yt(s,[{label:"Job #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Technician",key:"technicianName"}],"jobs","No jobs for this customer"):m==="quotes"?(o.innerHTML=`
        <div style="margin-bottom:var(--space-base);display:flex;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" id="btn-create-quote">
            <span class="material-icons-outlined">add</span> Create Quote
          </button>
        </div>
        ${Yt(c,[{label:"Quote #",key:"number"},{label:"Title",key:"title"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"}],"quotes","No quotes for this customer")}
      `,o.querySelector("#btn-create-quote").addEventListener("click",()=>{X.navigate("/quotes/new?customerId="+a)})):m==="invoices"&&(o.innerHTML=Yt(l,[{label:"Invoice #",key:"number"},{label:"Status",key:"status",badge:!0},{label:"Total",key:"total",format:"currency"},{label:"Due",key:"dueDate",format:"date"}],"invoices","No invoices for this customer"))}n()}function et(e,a){return`
    <div style="display:flex;gap:8px">
      <span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${y(e)}</span>
      <span style="font-size:var(--font-size-base)">${y(a)}</span>
    </div>
  `}function Yt(e,a,t,s){if(e.length===0)return`<div class="card"><div class="empty-state" style="padding:32px"><span class="material-icons-outlined">inbox</span><h3>${s}</h3></div></div>`;const c=l=>`<span class="badge badge-${{Active:"success",Completed:"success",Paid:"success",Accepted:"success","In Progress":"primary",Sent:"info",Scheduled:"info",Pending:"warning",Draft:"neutral","On Hold":"neutral",Overdue:"danger",Declined:"danger",Void:"danger",Invoiced:"primary"}[l]||"neutral"}">${y(l)}</span>`;return`
    <div class="card">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>${a.map(l=>`<th>${y(l.label)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.map(l=>`
              <tr style="cursor:pointer" onclick="window.location.hash='#/${t}/${y(l.id)}'">
                ${a.map(m=>{let n=l[m.key];return m.badge?n=c(n):m.format==="currency"?n=`$${(n||0).toLocaleString("en-AU",{minimumFractionDigits:2})}`:m.format==="date"?n=n?new Date(n).toLocaleDateString():"—":n=y(n),`<td>${n}</td>`}).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function _a(e,{id:a}){const t=a&&a!=="new",s=t?r.getById("customers",a):{};e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{X.navigate(t?`/people/${a}`:"/people")}),e.querySelector("#btn-save").addEventListener("click",()=>{const c=e.querySelector("#person-form");if(!c.checkValidity()){c.reportValidity();return}const l=new FormData(c),m=Object.fromEntries(l);if(t)r.update("customers",a,m),H("Customer updated successfully","success"),X.navigate(`/people/${a}`);else{const n=r.create("customers",m);H("Customer created successfully","success"),X.navigate(`/people/${n.id}`)}})}function sa(e){const a=r.getAll("leads"),t=a.filter(u=>u.status!=="Won"&&u.status!=="Lost"),s={New:10,Contacted:30,Qualified:50,Proposal:70,Negotiation:85,Won:100,Lost:0},c=t.reduce((u,b)=>u+(b.value||0),0),l=t.reduce((u,b)=>{const h=s[b.status]||0;return u+(b.value||0)*(h/100)},0),m=a.filter(u=>u.status==="Won").length,n=a.filter(u=>u.status==="Lost").length,p=m+n,o=p>0?Math.round(m/p*100):0;e.innerHTML=`
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
            <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">$${c.toLocaleString("en-AU",{maximumFractionDigits:0})}</div>
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
            <div style="font-size:22px; font-weight:800; color:var(--color-success-dark); margin-top:4px">$${l.toLocaleString("en-AU",{maximumFractionDigits:0})}</div>
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
            <div style="font-size:22px; font-weight:800; color:var(--text-primary); margin-top:4px">${o}%</div>
            <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">${m} Won / ${n} Lost closed leads</div>
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
  `;let f=[...a];const g={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},i={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger"},x=Xe({columns:[{key:"title",label:"Lead",render:u=>`<span class="cell-link font-medium">${y(u.title)}</span>`},{key:"customerName",label:"Customer",render:u=>`<span class="text-secondary">${y(u.customerName)}</span>`},{key:"source",label:"Source",render:u=>`<span class="text-secondary">${y(u.source)}</span>`},{key:"status",label:"Status",render:u=>`<span class="badge ${g[u.status]||"badge-neutral"}">${y(u.status)}</span>`},{key:"likelihood",label:"Likelihood",render:u=>{const b=s[u.status]??0;let h="var(--text-tertiary)";return b>=80?h="var(--color-success)":b>=50?h="var(--color-primary)":b>=30&&(h="var(--color-warning-dark)"),`<span style="font-weight:700; color:${h}">${b}%</span>`},getValue:u=>s[u.status]||0,width:"100px"},{key:"priority",label:"Priority",render:u=>`<span class="badge ${i[u.priority]||"badge-neutral"}">${y(u.priority)}</span>`},{key:"value",label:"Value",render:u=>`<span class="font-medium">$${(u.value||0).toLocaleString()}</span>`,getValue:u=>u.value},{key:"createdAt",label:"Created",render:u=>`<span class="text-secondary">${new Date(u.createdAt).toLocaleDateString()}</span>`,getValue:u=>new Date(u.createdAt).getTime()}],data:f,onRowClick:u=>X.navigate(`/leads/${u}`),emptyMessage:"No leads found",emptyIcon:"trending_up",selectable:!0,onSelectionChange:u=>{Ze({container:e,selectedIds:u,onClear:()=>x.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:b=>{const h=document.createElement("div");h.innerHTML=`
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
              `,me(async()=>{const{showModal:k}=await Promise.resolve().then(()=>Pe);return{showModal:k}},void 0).then(({showModal:k})=>{k({title:`Update ${b.length} Leads`,content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Apply",className:"btn-primary",onClick:S=>{const L=h.querySelector("#bulk-status").value;b.forEach(T=>r.update("leads",T,{status:L})),x.clearSelection(),sa(e),me(async()=>{const{showToast:T}=await Promise.resolve().then(()=>De);return{showToast:T}},void 0).then(({showToast:T})=>T(`Updated ${b.length} leads to ${L}`,"success")),S()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:b=>{me(async()=>{const{showModal:h}=await Promise.resolve().then(()=>Pe);return{showModal:h}},void 0).then(({showModal:h})=>{const k=document.createElement("div");k.innerHTML=`<p>Are you sure you want to delete ${b.length} leads? This action cannot be undone.</p>`,h({title:"Confirm Bulk Delete",content:k,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Delete",className:"btn-danger",onClick:S=>{b.forEach(L=>r.delete("leads",L)),x.clearSelection(),sa(e),me(async()=>{const{showToast:L}=await Promise.resolve().then(()=>De);return{showToast:L}},void 0).then(({showToast:L})=>L(`Deleted ${b.length} leads`,"success")),S()}}]})})}}]})}});e.querySelector("#leads-table-container").appendChild(x),e.querySelector("#btn-new-lead").addEventListener("click",()=>X.navigate("/leads/new")),e.querySelectorAll(".toolbar-filter").forEach(u=>{u.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(h=>h.classList.remove("active")),u.classList.add("active");const b=u.dataset.filter;f=b==="all"?[...a]:a.filter(h=>h.status===b),x.updateData(f)})}),e.querySelector("#leads-search").addEventListener("input",u=>{const b=u.target.value.toLowerCase();f=a.filter(h=>h.title.toLowerCase().includes(b)||h.customerName.toLowerCase().includes(b)),x.updateData(f)})}function Ns(e,{id:a}){const t=r.getById("leads",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Lead not found</h3></div>';return}dt(t.title);const s={New:"badge-info",Contacted:"badge-primary",Qualified:"badge-warning",Proposal:"badge-warning",Negotiation:"badge-primary",Won:"badge-success",Lost:"badge-danger"},l={New:10,Contacted:30,Qualified:50,Proposal:70,Negotiation:85,Won:100,Lost:0}[t.status]??0,m=(t.value||0)*(l/100);function n(){e.innerHTML=`
      ${mt({title:t.title,icon:"trending_up",iconBgColor:"var(--color-info-bg)",iconTextColor:"var(--color-info)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${y(t.customerName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${y(t.contactName||"—")}</span>
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
        ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map((o,f)=>{const g=t.status===o,i=["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].indexOf(t.status)>=f;let d="transparent",x="var(--text-secondary)",u=f===6?"none":"1px solid var(--border-color)";return g?o==="Won"?(d="var(--color-success)",x="#fff"):o==="Lost"?(d="var(--color-danger)",x="#fff"):o==="Qualified"||o==="Proposal"?(d="var(--color-warning)",x="var(--color-warning-dark)"):(d="var(--color-primary)",x="#fff"):i&&t.status!=="Lost"&&o!=="Lost"&&(d="rgba(27, 109, 224, 0.05)",x="var(--color-primary-dark)"),`
            <div class="pipeline-step" data-status="${o}" style="flex:1; text-align:center; padding:14px 6px; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; background:${d}; color:${x}; border-right:${u}; cursor:pointer; transition:all 0.2s" title="Click to transition to ${o}">
              ${o}
            </div>
          `}).join("")}
      </div>      <div class="grid-3" style="align-items:stretch">
        
        <!-- Column 1: Lead Information & Contact -->
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%">
            <div class="card-header"><h4>Lead Qualification</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              ${tt("Title",t.title)}
              ${tt("Customer",t.customerName)}
              ${tt("Contact Name",t.contactName||"—")}
              ${tt("Lead Source",t.source||"—")}
              ${tt("Priority",t.priority||"Medium")}
              ${tt("Current Status",`<span class="badge ${s[t.status]||"badge-neutral"}">${t.status}</span>`)}
            </div>
          </div>
        </div>

        <!-- Column 2: Technical Scope & Financials -->
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%">
            <div class="card-header"><h4>Financial Scope & Contact</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; gap:16px">
              ${tt("Direct Phone",t.phone?`<a href="tel:${t.phone}" style="color:var(--color-primary); font-weight:600; text-decoration:underline">${y(t.phone)}</a>`:"—")}
              ${tt("Direct Email",t.email?`<a href="mailto:${t.email}" style="color:var(--color-primary); font-weight:600; text-decoration:underline">${y(t.email)}</a>`:"—")}
              <hr style="border:none; border-top:1px dashed var(--border-color); margin:4px 0" />
              ${tt("Client Budget",t.budget?`<strong style="color:var(--text-primary)">$${(t.budget||0).toLocaleString()}</strong>`:"—")}
              ${tt("Estimated Value",`<strong style="color:var(--color-primary-dark)">$${(t.value||0).toLocaleString()}</strong>`)}
              ${t.budget&&t.value?tt("Budget Variance",`<span style="font-weight:700; color:${t.budget-t.value>=0?"var(--color-success)":"var(--color-danger)"}">$${(t.budget-t.value).toLocaleString()} (${t.budget-t.value>=0?"Under":"Over"} Budget)</span>`):""}
            </div>
          </div>
        </div>

        <!-- Column 3: Sales Forecasting Gauge -->
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:24px">
          <div class="card" style="margin:0; height:100%; border: 1px solid var(--border-color)">
            <div class="card-header"><h4>Conversion Forecast</h4></div>
            <div class="card-body" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; text-align:center">
              <div style="position:relative; width:100px; height:100px; display:flex; align-items:center; justify-content:center">
                <!-- SVG Circle representation -->
                <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg)">
                  <circle cx="50" cy="50" r="40" stroke="var(--border-color)" stroke-width="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="${l>=80?"var(--color-success)":l>=50?"var(--color-primary)":"var(--color-warning)"}" stroke-width="8" fill="transparent" 
                           stroke-dasharray="251.2" stroke-dashoffset="${251.2-251.2*l/100}" stroke-linecap="round" />
                </svg>
                <div style="position:absolute; font-size:20px; font-weight:800; color:var(--text-primary)">${l}%</div>
              </div>
              <div>
                <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px">Weighted Value Forecast</div>
                <div style="font-size:24px; font-weight:800; color:${l>=80?"var(--color-success)":"var(--text-primary)"}; margin-top:4px">$${m.toLocaleString("en-AU",{maximumFractionDigits:0})}</div>
                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">Likelihood multiplier applied</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-header"><h4>Technical / Project Requirements</h4></div>
        <div class="card-body">
          <p style="color:var(--text-primary); line-height:1.6; font-size:14px; white-space:pre-wrap">${y(t.requirements||"No technical specifications or requirements provided.")}</p>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div class="card-header"><h4>Internal Notes</h4></div>
        <div class="card-body">
          <p style="color:var(--text-secondary); line-height:1.6; font-size:14px; white-space:pre-wrap">${y(t.description||"No internal notes recorded.")}</p>
        </div>
      </div>
    `,p()}function p(){e.querySelector("#btn-convert-quote").addEventListener("click",()=>{const o=r.create("quotes",{number:`Q-${Date.now().toString().slice(-7)}`,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,title:t.title,status:"Draft",sections:[{id:r.generateId(),name:"Main Scope",lineItems:[{description:`${t.title} - Scope of Work`,type:"labor",qty:1,rate:t.value||0,total:t.value||0}]}],subtotal:t.value||0,tax:(t.value||0)*.1,total:(t.value||0)*1.1,createdAt:new Date().toISOString()});r.update("leads",a,{status:"Won"}),H("Lead converted to quote successfully","success"),X.navigate(`/quotes/${o.id}`)}),e.querySelector("#btn-edit-lead").addEventListener("click",()=>X.navigate(`/leads/${a}/edit`)),e.querySelector("#btn-delete-lead").addEventListener("click",()=>{const o=document.createElement("div");o.innerHTML=`<p>Delete <strong>${y(t.title)}</strong>?</p>`,xe({title:"Delete Lead",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:f=>f()},{label:"Delete",className:"btn-danger",onClick:f=>{r.delete("leads",a),H("Lead deleted","success"),f(),X.navigate("/leads")}}]})}),e.querySelectorAll(".pipeline-step").forEach(o=>{o.addEventListener("click",()=>{var g;const f=o.dataset.status;if(t.status!==f){r.update("leads",a,{status:f}),t.status=f,H(`Status updated to ${f}`,"success"),n();const i=r.getAll("activity")||[];i.push({id:Date.now(),leadId:a,type:"lead_stage_changed",text:`Lead stage transitioned to "${f}".`,user:((g=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:g.name)||"System",timestamp:new Date().toISOString()}),r.save("activity",i)}})})}n()}function tt(e,a){return`<div style="display:flex;gap:8px"><span style="width:130px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span>${a}</span></div>`}function Na(e,{id:a}){const t=a&&a!=="new",s=t?r.getById("leads",a):{},c=r.getAll("customers");e.innerHTML=`
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
                ${c.map(m=>`<option value="${m.id}" ${s.customerId===m.id?"selected":""}>${m.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source</label>
              <select class="form-select" name="source">
                ${["Website","Referral","Phone","Email","Trade Show","Google Ads"].map(m=>`<option ${s.source===m?"selected":""}>${m}</option>`).join("")}
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
                ${["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"].map(m=>`<option ${s.status===m?"selected":""}>${m}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority">
                ${["Low","Medium","High"].map(m=>`<option ${s.priority===m?"selected":""}>${m}</option>`).join("")}
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
  `;const l=e.querySelector("#lead-customer-select");l.addEventListener("change",()=>{const m=l.value,n=c.find(p=>p.id===m);n&&(e.querySelector("#lead-phone").value=n.phone||"",e.querySelector("#lead-email").value=n.email||"")}),e.querySelector("#btn-cancel").addEventListener("click",()=>X.navigate(t?`/leads/${a}`:"/leads")),e.querySelector("#btn-save").addEventListener("click",()=>{const m=e.querySelector("#lead-form");if(!m.checkValidity()){m.reportValidity();return}const n=Object.fromEntries(new FormData(m));n.value=parseFloat(n.value)||0,n.budget=parseFloat(n.budget)||0;const p=c.find(o=>o.id===n.customerId);if(n.customerName=(p==null?void 0:p.company)||"",n.contactName=p?`${p.firstName} ${p.lastName}`:"",t)r.update("leads",a,n),H("Lead updated","success"),X.navigate(`/leads/${a}`);else{const o=r.create("leads",n);H("Lead created","success"),X.navigate(`/leads/${o.id}`)}})}function zt(e){const a=r.getAll("notifications")||[];let t="",s="all";function c(){return a.filter(i=>{var b,h,k,S,L;const d=t.toLowerCase(),x=((b=i.title)==null?void 0:b.toLowerCase().includes(d))||((h=i.description)==null?void 0:h.toLowerCase().includes(d))||((k=i.createdBy)==null?void 0:k.toLowerCase().includes(d))||((S=i.type)==null?void 0:S.toLowerCase().includes(d))||((L=i.priority)==null?void 0:L.toLowerCase().includes(d)),u=s==="all"||i.status===s;return x&&u})}e.innerHTML=`
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
        <input type="text" id="notif-search" placeholder="Search notifications..." value="${y(t)}" />
      </div>
    </div>
    
    <div id="notifications-table-container"></div>
  `;const m=Xe({columns:[{key:"createdAt",label:"Date",render:i=>i.createdAt?new Date(i.createdAt).toLocaleDateString():"—",getValue:i=>i.createdAt?new Date(i.createdAt).getTime():0,width:"100px"},{key:"type",label:"Type",render:i=>`<span class="badge badge-neutral">${y(i.type||"Field Alert")}</span>`,width:"120px"},{key:"title",label:"Title / Job Name",render:i=>`
        <div style="font-weight:500">${y(i.title)}</div>
        <div class="text-tertiary" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${y(i.description)}</div>
      `},{key:"priority",label:"Priority",render:i=>`<span class="badge ${i.priority==="Urgent"||i.priority==="High"?"badge-danger":"badge-neutral"}">${y(i.priority||"Normal")}</span>`,width:"100px"},{key:"status",label:"Status",render:i=>`<span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${y(i.status)}</span>`,width:"110px"},{key:"createdBy",label:"Raised By",width:"150px"},{key:"actions",label:"",render:i=>`
        <div style="text-align:right">
          ${i.status!=="Converted"?`
            <button class="btn btn-sm btn-ghost btn-convert-quote" data-id="${i.id}" title="Convert to Quote"><span class="material-icons-outlined">request_quote</span></button>
            <button class="btn btn-sm btn-ghost btn-convert-job" data-id="${i.id}" title="Convert to Job"><span class="material-icons-outlined">build</span></button>
          `:""}
          <button class="btn btn-sm btn-ghost btn-view-notification" data-id="${i.id}" title="View Details"><span class="material-icons-outlined">visibility</span></button>
          <button class="btn btn-sm btn-ghost btn-edit-notification" data-id="${i.id}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        </div>
      `,width:"150px"}],data:c(),onRowClick:i=>{const d=a.find(x=>x.id===i);d&&o(d)},emptyMessage:"No notifications found",emptyIcon:"campaign",selectable:!0,onSelectionChange:i=>{Ze({container:e,selectedIds:i,onClear:()=>m.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:d=>{me(async()=>{const{showModal:x}=await Promise.resolve().then(()=>Pe);return{showModal:x}},void 0).then(({showModal:x})=>{const u=document.createElement("div");u.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Status</label>
                    <select class="form-select" id="bulk-status">
                      <option value="Pending">Pending</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                `,x({title:`Update ${d.length} Notification${d.length>1?"s":""}`,content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{const h=u.querySelector("#bulk-status").value;d.forEach(k=>r.update("notifications",k,{status:h})),m.clearSelection(),zt(e),H(`Updated ${d.length} notification${d.length>1?"s":""} to ${h}`,"success"),b()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{me(async()=>{const{showModal:x}=await Promise.resolve().then(()=>Pe);return{showModal:x}},void 0).then(({showModal:x})=>{const u=document.createElement("div");u.innerHTML=`<p>Are you sure you want to delete ${d.length} notification${d.length>1?"s":""}? This cannot be undone.</p>`,x({title:"Confirm Bulk Delete",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{d.forEach(h=>r.delete("notifications",h)),m.clearSelection(),zt(e),H(`Deleted ${d.length} notification${d.length>1?"s":""}`,"success"),b()}}]})})}}]})}});e.querySelector("#notifications-table-container").appendChild(m),e.querySelector("#notif-search").addEventListener("input",i=>{t=i.target.value,m.updateData(c())}),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),i.classList.add("active"),s=i.dataset.filter,m.updateData(c())})}),e.querySelector("#btn-raise-notification").addEventListener("click",()=>p()),m.addEventListener("click",i=>{const d=i.target.closest("button");if(!d)return;i.stopPropagation();const x=d.dataset.id;if(d.classList.contains("btn-view-notification")){const u=a.find(b=>b.id===x);u&&o(u)}else if(d.classList.contains("btn-edit-notification")){const u=a.find(b=>b.id===x);u&&p(u)}else d.classList.contains("btn-convert-quote")?f(x):d.classList.contains("btn-convert-job")&&g(x)});function p(i=null){const d=r.getAll("jobs"),x=JSON.parse(localStorage.getItem("currentUser")||"{}");He({title:i?"Edit Notification":"Raise Notification",width:450,content:`
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
              ${d.map(u=>`<option value="${u.id}" ${(i==null?void 0:i.jobId)===u.id?"selected":""}>${y(u.number)} - ${y(u.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Subject <span class="text-danger">*</span></label>
            <input type="text" class="form-input" id="notif-title" placeholder="E.g. Leaking pipe discovered" value="${y((i==null?void 0:i.title)||"")}" />
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
            <textarea class="form-input" id="notif-desc" rows="5" placeholder="Provide details of what needs to be rectified...">${y((i==null?void 0:i.description)||"")}</textarea>
          </div>
        </div>
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:i?"Save Changes":"Submit Notification",className:"btn-primary",onClick:u=>{const b=document.getElementById("notif-type").value,h=document.getElementById("notif-job").value,k=document.getElementById("notif-title").value.trim(),S=document.getElementById("notif-priority").value,L=document.getElementById("notif-desc").value.trim();if(!k||!L){H("Title and Description are required","error");return}i?(r.update("notifications",i.id,{type:b,jobId:h||null,title:k,priority:S,description:L}),H("Notification updated","success")):(r.create("notifications",{type:b,jobId:h||null,title:k,priority:S,description:L,status:"Pending",createdAt:new Date().toISOString(),createdBy:x.name||"Unknown"}),H("Notification raised successfully","success")),u(),zt(e)}}]})}function o(i){He({title:"Notification Details",width:450,content:`
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div>
            <label class="form-label">Status</label>
            <div><span class="badge ${i.status==="Converted"?"badge-success":"badge-warning"}">${y(i.status)}</span></div>
          </div>
          <div>
            <label class="form-label">Subject</label>
            <div style="font-size:16px;font-weight:500">${y(i.title)}</div>
          </div>
          <div>
            <label class="form-label">Description / Fault</label>
            <div style="padding:12px;background:var(--bg-color);border:1px solid var(--border-color);border-radius:4px;white-space:pre-wrap;font-size:14px">${y(i.description)}</div>
          </div>
          <div style="display:flex;gap:32px">
            <div>
              <label class="form-label">Priority</label>
              <div>${y(i.priority||"Normal")}</div>
            </div>
            <div>
              <label class="form-label">Raised By</label>
              <div>${y(i.createdBy||"System")}</div>
            </div>
            <div>
              <label class="form-label">Date</label>
              <div>${i.createdAt?new Date(i.createdAt).toLocaleDateString():"—"}</div>
            </div>
          </div>
          ${i.jobId?`
            <div>
              <label class="form-label">Related Job ID</label>
              <div><a href="#/jobs/${i.jobId}">${y(i.jobId)}</a></div>
            </div>
          `:""}
        </div>
      `,actions:i.status!=="Converted"?[{label:"Close",className:"btn-secondary",onClick:d=>d()},{label:"Edit",className:"btn-secondary",onClick:d=>{d(),p(i)}},{label:"Convert to Quote",className:"btn-secondary",onClick:d=>{d(),f(i.id)}},{label:"Convert to Job",className:"btn-primary",onClick:d=>{d(),g(i.id)}}]:[{label:"Close",className:"btn-secondary",onClick:d=>d()}]})}function f(i){const d=r.getById("notifications",i);if(!d)return;const x=r.create("quotes",{number:`Q-${Date.now().toString().slice(-6)}`,title:d.title,description:d.description,priority:d.priority,status:"Draft",notes:`Generated from Notification: ${d.title}

${d.description}`,createdAt:new Date().toISOString()});r.update("notifications",i,{status:"Converted",convertedTo:`Quote ${x.number}`}),H("Converted to Quote successfully","success"),X.navigate(`/quotes/${x.id}`)}function g(i){const d=r.getById("notifications",i);if(!d)return;let x={number:`J-${Date.now().toString().slice(-6)}`,title:d.title,description:d.description,priority:d.priority,status:"Pending",notes:`Generated from Notification: ${d.title}

${d.description}`,createdAt:new Date().toISOString()};if(d.maintenancePlanId){const b=r.getById("assets",d.assetId),h=r.getById("quotes",d.quoteId);if(b&&h){const k=r.getById("customers",b.customerId);let S=0,L=0;const T=[];h.sections?h.sections.forEach(A=>{A.lineItems&&T.push(...A.lineItems)}):h.lineItems&&T.push(...h.lineItems);const I=[];T.forEach(A=>{if(A.type==="material"){const q=r.getAll("stock").find(w=>w.name===A.description);I.push({stockId:q?q.id:null,name:A.description||"Unknown Material",quantity:A.qty||1,unitCost:q&&(q.costPrice||q.unitPrice)||0,fromQuote:!0}),L+=A.total||0}else A.type==="labor"&&(S+=A.total||0)});const _=h.sections?h.sections.map(A=>({id:r.generateId(),name:A.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})):[{id:"p1",name:"Routine Maintenance",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]}];x={...x,customerId:b.customerId||h.customerId||"",customerName:k?k.company:h.customerName||"Internal",contactName:k?`${k.firstName} ${k.lastName}`:h.contactName||"Unassigned",siteAddress:b.site||"Main Office",assetId:b.id,quoteId:h.id,tasks:_,phases:_,materials:I,laborCost:S,materialCost:L,estimatedLaborCost:S,estimatedMaterialCost:L}}}const u=r.create("jobs",x);r.update("notifications",i,{status:"Converted",convertedTo:`Job ${u.number}`}),H("Converted to Job successfully","success"),X.navigate(`/jobs/${u.id}`)}}function oa(e){const a=r.getAll("quotes"),t=Le("Quotes","create");e.innerHTML=`
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
  `;let s=[...a];const c={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger"},m=Xe({columns:[{key:"number",label:"Quote #",render:p=>`<span class="cell-link font-medium">${y(p.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"title",label:"Description",render:p=>`<span class="text-secondary truncate" style="max-width:200px;display:inline-block">${y(p.title||"")}</span>`},{key:"status",label:"Status",render:p=>`<span class="badge ${c[p.status]||"badge-neutral"}">${y(p.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:p=>`<span class="font-semibold">$${(p.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:p=>p.total,width:"110px"},{key:"createdAt",label:"Date",render:p=>new Date(p.createdAt).toLocaleDateString(),getValue:p=>new Date(p.createdAt).getTime(),width:"100px"}],data:s,onRowClick:p=>X.navigate(`/quotes/${p}`),emptyMessage:"No quotes found",emptyIcon:"request_quote",selectable:!0,onSelectionChange:p=>{Ze({container:e,selectedIds:p,onClear:()=>m.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:o=>{const f=document.createElement("div");f.innerHTML=`
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
              `,me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Pe);return{showModal:g}},void 0).then(({showModal:g})=>{g({title:`Update ${o.length} Quotes`,content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const d=f.querySelector("#bulk-status").value;o.forEach(x=>r.update("quotes",x,{status:d})),m.clearSelection(),oa(e),me(async()=>{const{showToast:x}=await Promise.resolve().then(()=>De);return{showToast:x}},void 0).then(({showToast:x})=>x(`Updated ${o.length} quotes to ${d}`,"success")),i()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:o=>{me(async()=>{const{showModal:f}=await Promise.resolve().then(()=>Pe);return{showModal:f}},void 0).then(({showModal:f})=>{const g=document.createElement("div");g.innerHTML=`<p>Are you sure you want to delete ${o.length} quotes? This action cannot be undone.</p>`,f({title:"Confirm Bulk Delete",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{o.forEach(d=>r.delete("quotes",d)),m.clearSelection(),oa(e),me(async()=>{const{showToast:d}=await Promise.resolve().then(()=>De);return{showToast:d}},void 0).then(({showToast:d})=>d(`Deleted ${o.length} quotes`,"success")),i()}}]})})}}]})}});e.querySelector("#quotes-table-container").appendChild(m);const n=e.querySelector("#btn-new-quote");n&&n.addEventListener("click",()=>X.navigate("/quotes/new")),e.querySelectorAll(".toolbar-filter").forEach(p=>{p.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(f=>f.classList.remove("active")),p.classList.add("active");const o=p.dataset.filter;s=o==="all"?[...a]:a.filter(f=>f.status===o),m.updateData(s)})}),e.querySelector("#quotes-search").addEventListener("input",p=>{const o=p.target.value.toLowerCase();s=a.filter(f=>f.number.toLowerCase().includes(o)||f.customerName.toLowerCase().includes(o)||(f.title||"").toLowerCase().includes(o)),m.updateData(s)})}function ra({type:e,data:a}){const t=document.createElement("div");t.className="modal-overlay",t.id="print-preview-overlay",t.style.cssText="z-index:500;background:rgba(0,0,0,0.7)";const s=document.createElement("div");s.style.cssText="background:white;width:210mm;max-width:95vw;max-height:95vh;overflow-y:auto;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;";const c=document.createElement("div");c.style.cssText="position:sticky;top:0;z-index:2;background:var(--sidebar-bg);color:white;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:8px 8px 0 0;";const l=e==="form"?`
    <button class="btn btn-secondary btn-sm" id="btn-export-csv" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2)">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:4px">table_view</span> CSV
    </button>
    <button class="btn btn-secondary btn-sm" id="btn-export-json" style="background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2)">
      <span class="material-icons-outlined" style="font-size:16px; margin-right:4px">code</span> JSON
    </button>
  `:"";c.innerHTML=`
    <span style="font-weight:600;font-size:14px">${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} Preview — ${a.number}</span>
    <div style="display:flex;gap:8px;align-items:center">
      ${l}
      <button class="btn btn-primary btn-sm" id="btn-print-pdf" style="background:#10B981;border-color:#10B981">
        <span class="material-icons-outlined" style="font-size:16px">print</span> Print / Save PDF
      </button>
      <button class="btn btn-ghost btn-sm" id="btn-close-preview" style="color:white">
        <span class="material-icons-outlined" style="font-size:18px">close</span>
      </button>
    </div>
  `;const m=document.createElement("div");m.id="print-document",m.className="print-document",m.innerHTML=ha(e,a),s.appendChild(c),s.appendChild(m),t.appendChild(s),document.body.appendChild(t);const n=()=>t.remove();c.querySelector("#btn-close-preview").addEventListener("click",n),t.addEventListener("click",o=>{o.target===t&&n()}),e==="form"&&(c.querySelector("#btn-export-csv").addEventListener("click",()=>{Ma(a)}),c.querySelector("#btn-export-json").addEventListener("click",()=>{Pa(a)})),c.querySelector("#btn-print-pdf").addEventListener("click",()=>{const o=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${a.number} — ${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>${Ps()}</style>
      </head>
      <body>
        ${ha(e,a)}
      </body>
      </html>
    `,f=`${e==="quote"?"Quote":e==="invoice"?"Invoice":"Form"} ${a.number}`;if(!r.getAll("documents").find(x=>x.entityId===a.id&&x.name===f)){const x=`data:text/html;charset=utf-8,${encodeURIComponent(o)}`;r.create("documents",{name:f,type:e==="quote"?"Quote PDF":e==="invoice"?"Invoice PDF":"Form PDF",size:o.length,url:x,folder:e==="quote"?"Quotes":e==="invoice"?"Invoices":"Forms",uploadedAt:new Date().toISOString(),entityType:e==="quote"?"Quote":e==="invoice"?"Invoice":"Job",entityId:a.entityId||a.id,entityName:a.customerName||"Unknown Customer"}),me(async()=>{const{showToast:u}=await Promise.resolve().then(()=>De);return{showToast:u}},void 0).then(({showToast:u})=>{u(`${f} saved to Documents`,"success")})}const d=window.open("","_blank","width=800,height=1000");d.document.write(o),d.document.close(),setTimeout(()=>{d.print()},500)});const p=o=>{o.key==="Escape"&&(n(),document.removeEventListener("keydown",p))};document.addEventListener("keydown",p)}function ha(e,a){if(e==="form")return Ms(a);const t=e==="quote",c={Draft:"#6B7280",Finalised:"#1B6DE0",Sent:"#3B82F6",Accepted:"#10B981",Declined:"#EF4444",Paid:"#10B981",Overdue:"#EF4444",Void:"#6B7280"}[a.status]||"#6B7280",l=a.customerName||"Customer",m=a.contactName||"",n=a.lineItems||[],p=a.sections||[],o=r.getSettings(),f=o.logo?`<img src="${o.logo}" style="max-height:60px; max-width:240px; object-fit:contain" />`:'<div class="pdf-logo">F</div>';let g="";return p.length>0?p.forEach(i=>{if(e==="invoice"&&i.isVariation===!0&&i.customerApproved!==!0)return;const d=e==="invoice"&&i.isVariation===!0?' <span style="background:#F59E0B; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:8px; vertical-align:middle; text-transform:uppercase">Variation</span>':"";g+=`
        <tr class="pdf-section-header">
          <td colspan="5" style="background:#F1F5F9; font-weight:700; color:#1E293B; border-bottom:2px solid #CBD5E1">${y(i.name||"Phase")}${d}</td>
        </tr>
      `,i.lineItems.forEach(x=>{g+=`
          <tr>
            <td>${x.description?y(x.description):"—"}</td>
            <td style="text-align:center"><span class="pdf-type-tag">${(x.type||"other").charAt(0).toUpperCase()+(x.type||"other").slice(1)}</span></td>
            <td style="text-align:center">${x.qty||1}</td>
            <td style="text-align:right">$${(x.rate||0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:600">$${(x.total||0).toFixed(2)}</td>
          </tr>
        `}),g+=`
        <tr class="pdf-section-footer">
          <td colspan="4" style="text-align:right; font-size:11px; color:#64748B; padding:6px 12px">Phase Subtotal</td>
          <td style="text-align:right; font-weight:700; color:#1E293B; padding:6px 12px">$${(i.subtotal||0).toFixed(2)}</td>
        </tr>
      `}):g=n.map(i=>`
      <tr>
        <td>${i.description?y(i.description):"—"}</td>
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
          ${f}
          <div>
            <div class="pdf-company-name">${y(o.name||"FieldForge Demo Company")}</div>
            <div class="pdf-company-detail">ABN: ${y(o.abn||"12 345 678 901")}</div>
            <div class="pdf-company-detail">${y(o.address||"123 Business St, Melbourne VIC 3000")}</div>
            <div class="pdf-company-detail">Phone: ${y(o.phone||"1300 123 456")}</div>
          </div>
        </div>
        <div class="pdf-title-block">
          <div class="pdf-doc-type">${t?"QUOTE":"TAX INVOICE"}</div>
          <div class="pdf-doc-number">${a.number}</div>
          <div class="pdf-status" style="background:${c}15;color:${c};border:1px solid ${c}40">${a.status}</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="pdf-info-grid">
        <div class="pdf-info-col">
          <div class="pdf-info-label">${t?"Quote For":"Bill To"}</div>
          <div class="pdf-info-value-lg">${l}</div>
          ${m?`<div class="pdf-info-value">Attn: ${m}</div>`:""}
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
          ${g}
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
          <div class="pdf-notes-text">${y(a.notes).replace(/\n/g,"<br>")}</div>
        </div>
      `:""}

      <!-- Footer -->
      <div class="pdf-footer">
        <div class="pdf-footer-line"></div>
        <div class="pdf-footer-text">
          ${t?"This quote is valid for the period shown above. Prices include GST where applicable. Please contact us to accept this quote or if you have any questions.":"Payment is due by the date shown above. Please reference the invoice number when making payment. Thank you for your business."}
        </div>
        <div class="pdf-footer-company">${y(o.name||"FieldForge Demo Company")} — ${y(o.email||"hello@fieldforge.io")} — ${y(o.phone||"1300 123 456")}</div>
      </div>
    </div>
  `}function Ms(e){let a="";return(e.template.sections||[]).forEach(t=>{const s=t.columns||(t.width==="half"?1:2);if(t.isSpacer){const c=t.height?String(t.height).endsWith("px")?t.height:t.height+"px":"50px";a+=`<div style="width:100%; height:${c}" class="print-spacer"></div>`;return}a+=`
      <div style="margin-bottom:24px; border:1px solid #CBD5E1; border-radius:6px; overflow:hidden; page-break-inside:avoid">
        <div style="background:#F8FAFC; padding:10px 16px; border-bottom:1px solid #CBD5E1; font-weight:700; color:#1E293B; font-size:14px; text-transform:uppercase; letter-spacing:0.5px">
          ${y(t.title)}
        </div>
        <div style="padding:16px; display:grid; grid-template-columns: repeat(${s}, 1fr); gap:16px">
    `,t.fields.forEach(c=>{const l=Math.min(c.colSpan||(c.width==="half"?1:s),s);if(c.type==="spacer"||c.type==="blank"){const p=c.height?String(c.height).endsWith("px")?c.height:c.height+"px":"50px";a+=`<div style="grid-column: span ${l}; height:${c.type==="blank"?"auto":p}" class="print-spacer"></div>`;return}if(c.type==="info"){a+=`
          <div style="grid-column: span ${l}; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #64748b; color:#334155; font-size:13px; border-radius:4px; line-height:1.6; page-break-inside:avoid">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px; color:#475569">
              <span class="material-icons-outlined" style="font-size:16px">info</span> Instruction / Info
            </div>
            <div>${y(c.label).replace(/\n/g,"<br/>")}</div>
          </div>
        `;return}const m=e.responses[c.id];let n="";c.type==="signature"?n=m?`<div style="font-family:'Brush Script MT', cursive; font-size:24px; padding:10px; border:1px solid #E4E9F0; border-radius:4px; text-align:center">${y(m)}</div>`:'<div style="padding:10px; border:1px dashed #E4E9F0; color:#8A97A8; font-style:italic; text-align:center">No signature</div>':c.type==="checkbox"?n=`<div style="font-weight:600; color:${m?"#10B981":"#EF4444"}">${m?"YES / CHECKED":"NO / UNCHECKED"}</div>`:n=`<div style="padding:8px 12px; border:1px solid #E4E9F0; border-radius:4px; background:#F8FAFC; min-height:34px; font-size:12px">${m?y(m).replace(/\n/g,"<br/>"):'<span style="color:#8A97A8;font-style:italic">No response</span>'}</div>`,a+=`
        <div style="grid-column: span ${l}; display:flex; flex-direction:column; gap:6px">
          <div style="font-size:11px; font-weight:700; color:#5A6B7F; text-transform:uppercase; letter-spacing:0.5px">${y(c.label)}</div>
          ${n}
        </div>
      `}),a+=`
        </div>
      </div>
    `}),`
    <div class="pdf-page">
      <div style="margin-bottom:28px; padding-bottom:20px; border-bottom:2px solid #E4E9F0">
        <div style="font-size:22px; font-weight:800; color:#1A2332">${y(e.template.name)}</div>
        ${e.template.description?`<div style="font-size:13px; color:#5A6B7F; margin-top:6px; line-height:1.6">${y(e.template.description)}</div>`:""}
      </div>

      <div class="pdf-info-grid" style="margin-bottom:32px">
        <div class="pdf-info-col">
          <div class="pdf-info-label">Job Reference</div>
          <div class="pdf-info-value-lg">${y(e.jobNumber)}</div>
          <div class="pdf-info-value">Customer: ${y(e.customerName)}</div>
        </div>
        <div class="pdf-info-col">
          <div class="pdf-info-row">
            <span class="pdf-info-label">Submitted By</span>
            <span class="pdf-info-value">${y(e.submittedByName||"—")}</span>
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
  `}function la(e,a,t){const s=document.createElement("a"),c=new Blob([e],{type:t});s.href=URL.createObjectURL(c),s.download=a,s.click(),URL.revokeObjectURL(s.href)}function Ma(e){const a=[["Compliance Form Report"],["Form Name",e.template.name],["Job Reference",e.jobNumber],["Customer",e.customerName],["Submitted By",e.submittedByName||"—"],["Date Submitted",e.submittedAt?new Date(e.submittedAt).toLocaleDateString():"—"],[],["Section","Field Name","Field Type","Response / Value"]];(e.template.sections||[]).forEach(c=>{c.isSpacer||c.fields.forEach(l=>{if(l.type==="spacer"||l.type==="info"||l.type==="blank")return;const m=e.responses[l.id]??"",n=l.type==="checkbox"?m?"Yes":"No":m;a.push([c.title,l.label,l.type,n])})});const t=a.map(c=>c.map(l=>`"${String(l).replace(/"/g,'""')}"`).join(",")).join(`
`),s=`Form_${e.jobNumber}_${e.template.name.replace(/\s+/g,"_")}.csv`;la(t,s,"text/csv;charset=utf-8;")}function Pa(e){const a=JSON.stringify({formInstanceId:e.id,jobId:e.jobId,jobNumber:e.jobNumber,customerName:e.customerName,submittedBy:e.submittedByName,submittedAt:e.submittedAt,formTemplate:{id:e.template.id,name:e.template.name,description:e.template.description,sections:e.template.sections},responses:e.responses},null,2),t=`Form_${e.jobNumber}_${e.template.name.replace(/\s+/g,"_")}.json`;la(a,t,"application/json;charset=utf-8;")}const Mt=Object.freeze(Object.defineProperty({__proto__:null,downloadFile:la,exportFormAsCSV:Ma,exportFormAsJSON:Pa,formatDate:Lt,showPrintPreview:ra},Symbol.toStringTag,{value:"Module"}));function Gt(e,{id:a,customerId:t,type:s}){const c=s==="template",l=c?"quoteTemplates":"quotes",m=a==="new";let n;if(m?c?n={name:"New Quote Template",description:"",sections:[{id:r.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0}:n={status:"Draft",version:1,sections:[{id:r.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:`Q-${Date.now().toString().slice(-7)}`,customerId:t||""}:n=r.getById(l,a),!n){e.innerHTML=`<div class="empty-state"><span class="material-icons-outlined">error</span><h3>${c?"Template":"Quote"} not found</h3></div>`;return}n.lineItems&&!n.sections&&(n.sections=[{id:r.generateId(),name:"Main Phase",lineItems:[...n.lineItems]}],delete n.lineItems),m||dt(n.number+(n.version>1?` v${n.version}`:""));const p=r.getAll("customers"),o=r.getAll("stock"),f=r.getSettings(),g={Draft:"badge-neutral",Finalised:"badge-primary",Sent:"badge-info",Accepted:"badge-success",Declined:"badge-danger",Archived:"badge-neutral"};function i(){e.innerHTML=`
      ${mt({title:c?m?"New Quote Template":y(n.name):`${m?"New Quote":n.number} ${n.version>1?`<span class="badge badge-neutral">v${n.version}</span>`:""}`,icon:"request_quote",iconBgColor:"var(--color-warning-bg)",iconTextColor:"var(--color-warning)",metaHtml:c?"":`
          ${n.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${n.customerName}</span>`:""}
          <span class="badge ${g[n.status]||"badge-neutral"}">${n.status}</span>
        `,actionsHtml:c?`
          ${m?"":'<button class="btn btn-secondary" id="btn-delete-template" style="color:var(--color-danger)"><span class="material-icons-outlined">delete</span> Delete</button>'}
        `:`
          ${m?"":'<button class="btn btn-secondary" id="btn-preview-pdf"><span class="material-icons-outlined">picture_as_pdf</span> PDF</button>'}
          ${!m&&n.status!=="Archived"&&Le("Quotes","edit")?'<button class="btn btn-secondary" id="btn-create-revision"><span class="material-icons-outlined">history</span> Create Revision</button>':""}
          ${!m&&n.status==="Accepted"&&Le("Quotes","convert")?'<button class="btn btn-primary" id="btn-convert-job"><span class="material-icons-outlined">build</span> Convert to Job</button>':""}
          ${!m&&n.status==="Draft"&&Le("Quotes","edit")?'<button class="btn btn-primary" id="btn-send-quote"><span class="material-icons-outlined">send</span> Send Quote</button>':""}
          <div class="dropdown">
             <button class="btn btn-secondary btn-icon"><span class="material-icons-outlined">more_vert</span></button>
             <div class="dropdown-menu dropdown-menu-right" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:100;min-width:160px">
                ${Le("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-import-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Import Template</a>':""}
                ${Le("Quotes","edit")?'<a href="#" class="dropdown-item" id="btn-save-template" style="display:block;padding:8px 12px;text-decoration:none;color:#333">Save as Template</a>':""}
                ${!m&&Le("Quotes","delete")?'<a href="#" class="dropdown-item" id="btn-delete-quote" style="display:block;padding:8px 12px;text-decoration:none;color:var(--color-danger)">Delete Quote</a>':""}
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
              <input class="form-input" id="quote-name" value="${y(n.name||"")}" placeholder="Template Name..." />
            </div>
            <div class="form-group" style="flex:2">
              <label class="form-label">Description</label>
              <input class="form-input" id="quote-desc" value="${y(n.description||"")}" placeholder="Template Description..." />
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${f.laborRates.map(k=>`<option value="${k.id}" ${n.laborProfileId===k.id?"selected":""}>${k.name} ($${k.rate.toFixed(2)}/hr)</option>`).join("")}
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
              <select class="form-select" id="quote-customer" ${n.status==="Archived"?"disabled":""}>
                <option value="">Select customer...</option>
                ${p.map(k=>`<option value="${k.id}" ${n.customerId===k.id?"selected":""}>${k.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input class="form-input" id="quote-title" value="${n.title||""}" placeholder="Quote description..." ${n.status==="Archived"?"disabled":""} />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="quote-status" ${n.status==="Archived"?"disabled":""}>
                ${["Draft","Finalised","Sent","Accepted","Declined","Archived"].map(k=>`<option ${n.status===k?"selected":""}>${k}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="quote-labor-profile" ${n.status==="Archived"?"disabled":""}>
                <option value="">-- Custom / Manual Rates --</option>
                ${f.laborRates.map(k=>`<option value="${k.id}" ${n.laborProfileId===k.id?"selected":""}>${k.name} ($${k.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Valid Until</label>
              <input class="form-input" type="date" id="quote-valid" value="${n.validUntil?n.validUntil.split("T")[0]:""}" ${n.status==="Archived"?"disabled":""} />
            </div>
          </div>
        </div>
      </div>
      `}

      <datalist id="stock-items-list">
        ${o.map(k=>`<option value="${k.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(n.sections||[]).map((k,S)=>d(k,S)).join("")}
      </div>
      
      ${n.status!=="Archived"?`
      <button class="btn btn-secondary" id="btn-add-section" style="margin-bottom:var(--space-lg)">
        <span class="material-icons-outlined" style="font-size:16px">add</span> Add New Phase/Section
      </button>`:""}

      <!-- Totals & Estimation & Client Agreement -->
      <div style="display:flex; justify-content:flex-end; gap:var(--space-lg); margin-bottom:var(--space-lg); align-items:stretch; flex-wrap:wrap">
        <!-- Internal Estimation (Only for internal use) -->
        ${n.status!=="Archived"&&!c?`
        <div class="card" style="width:280px; margin:0; border:1px dashed var(--border-color); background:var(--bg-color); display:flex; flex-direction:column">
          <div class="card-header" style="padding:10px 16px; border-bottom:1px dashed var(--border-color)">
            <h5 style="margin:0; font-size:13px; color:var(--text-secondary)">Internal Estimation</h5>
          </div>
          <div class="card-body" style="padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
              <span class="text-secondary">Est. Cost</span>
              <span>$${(n.totalInternalCost||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px; font-weight:600; color:${n.subtotal-(n.totalInternalCost||0)>=0?"var(--color-success)":"var(--color-danger)"}">
              <span>Est. Margin</span>
              <span>$${(n.subtotal-(n.totalInternalCost||0)).toFixed(2)} (${n.subtotal>0?Math.round((n.subtotal-n.totalInternalCost)/n.subtotal*100):0}%)</span>
            </div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-top:8px">
              * Based on stock cost and internal labor rates.
            </div>
          </div>
        </div>
        `:""}

        <!-- Client Agreement & Signature Panel -->
        ${c?"":`
        <div class="card" style="width:340px; margin:0; display:flex; flex-direction:column; border:1px solid ${n.status==="Accepted"?"var(--color-success)":n.status==="Declined"?"var(--color-danger)":"var(--border-color)"}">
          <div class="card-header" style="padding:10px 16px; background:${n.status==="Accepted"?"rgba(16,185,129,0.05)":n.status==="Declined"?"rgba(239,68,68,0.05)":"rgba(0,0,0,0.02)"}">
            <h5 style="margin:0; font-size:13px; color:${n.status==="Accepted"?"var(--color-success-dark)":n.status==="Declined"?"var(--color-danger)":"var(--text-secondary)"}">Client Agreement</h5>
          </div>
          <div class="card-body" style="padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center; gap:8px">
            ${n.status==="Accepted"?`
              <div style="display:flex; align-items:center; gap:8px; color:var(--color-success); font-weight:700; font-size:14px">
                <span class="material-icons-outlined">check_circle</span>
                <span>Accepted & Signed</span>
              </div>
              <div style="font-size:12px; color:var(--text-secondary)">
                <div><strong>Signed By:</strong> ${y(n.signedByName||"Client")}</div>
                <div style="margin-top:2px"><strong>Signed At:</strong> ${n.signedAt?new Date(n.signedAt).toLocaleString():"—"}</div>
              </div>
              <div style="border:1px solid var(--border-color); background:var(--bg-color); height:60px; border-radius:4px; display:flex; align-items:center; justify-content:center; margin-top:4px">
                <span style="font-family:'Brush Script MT', cursive; font-size:26px; color:#1B6DE0; font-style:italic; font-weight:500">${y(n.signatureData||"Client Signature")}</span>
              </div>
            `:n.status==="Declined"?`
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
              <span id="subtotal">$${(n.subtotal||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:var(--font-size-md)">
              <span class="text-secondary">GST (10%)</span>
              <span id="tax">$${(n.tax||0).toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:var(--font-size-lg);font-weight:700;border-top:2px solid var(--border-color);margin-top:4px">
              <span>Total</span>
              <span id="total">$${(n.total||0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      ${c?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Template</button>
      </div>
      `:n.status!=="Archived"&&(m?Le("Quotes","create"):Le("Quotes","edit"))?`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Cancel</button>
        <button class="btn btn-primary" id="btn-save-quote"><span class="material-icons-outlined">save</span> Save Quote</button>
      </div>`:`
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-secondary" id="btn-cancel-quote">Back</button>
      </div>`}
    `,h()}function d(k,S){const L=n.status==="Archived";return`
      <div class="card" style="margin-bottom:var(--space-lg)" data-section-index="${S}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <input class="form-input section-name-input" value="${k.name||""}" placeholder="Phase/Section Name" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" ${L?"disabled":""} />
          <div>
            <span class="badge badge-neutral" style="margin-right:12px">Phase Subtotal: $${(k.subtotal||0).toFixed(2)}</span>
            ${L?"":`
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${S}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${S}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(k.lineItems||[]).map((T,I)=>x(T,S,I,L)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function x(k,S,L,T){return`
      <tr data-sidx="${S}" data-index="${L}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${k.description||""}" data-field="description" placeholder="Type item name..." ${T?"disabled":""}/></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type" ${T?"disabled":""}>
          <option value="labor" ${k.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${k.type==="material"?"selected":""}>Material</option>
          <option value="other" ${k.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${k.qty||1}" data-field="qty" min="1" ${T?"disabled":""}/></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${k.rate||0}" data-field="rate" step="0.01" ${T?"disabled":""}/></td>
        <td style="font-weight:600" class="item-total-cell">$${(k.total||0).toFixed(2)}</td>
        <td>${T?"":`<button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${S}" data-index="${L}"><span class="material-icons-outlined" style="font-size:16px">close</span></button>`}</td>
      </tr>
    `}function u(){n.subtotal=0,n.totalInternalCost=0;let k=0;r.getSettings().laborRates.find(L=>L.id===n.laborProfileId),(n.sections||[]).forEach(L=>{L.subtotal=0,(L.lineItems||[]).forEach(T=>{T.total=(T.qty||0)*(T.rate||0),T.type==="labor"&&(k+=T.total),T.internalCost||(T.type==="labor"?T.internalCost=45:T.internalCost=T.rate*.7),n.totalInternalCost+=(T.qty||0)*(T.internalCost||0),L.subtotal+=T.total}),n.subtotal+=L.subtotal}),n.tax=n.subtotal*.1,n.total=n.subtotal+n.tax,i()}function b(){const k=r.getAll("technicians")||[],S=k[Math.floor(Math.random()*k.length)];let L=0,T=0;(n.sections||[]).forEach(q=>{(q.lineItems||[]).forEach(w=>{w.type==="labor"&&(L+=w.total),w.type==="material"&&(T+=w.total)})});const I=n.sections.map(q=>({id:r.generateId(),name:q.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),_=r.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:n.customerId,customerName:n.customerName,contactName:n.contactName,title:n.title,type:"Project",status:"Pending",priority:"Medium",technicianId:S==null?void 0:S.id,technicianName:S==null?void 0:S.name,quoteId:a,tasks:I,phases:I,laborCost:L,materialCost:T,estimatedLaborCost:L,estimatedMaterialCost:T}),A=r.getAll("activity")||[];A.push({id:Date.now()+1,jobId:_.id,type:"job_converted_from_quote",text:`Live job ${_.number} created from accepted Quote ${n.number}.`,user:"System Automation",timestamp:new Date().toISOString()}),r.save("activity",A),me(async()=>{const{addSystemNotification:q}=await Promise.resolve().then(()=>De);return{addSystemNotification:q}},void 0).then(({addSystemNotification:q})=>{q("New Job Assigned",`You have been assigned to Live Job ${_.number} (${_.title}).`,`/jobs/${_.id}`)}),H(`Converted successfully! Live Job ${_.number} is now active.`,"success"),X.navigate(`/jobs/${_.id}`)}function h(){var S,L,T,I,_,A,q,w,v,$,C,N,O;(S=e.querySelector("#btn-preview-pdf"))==null||S.addEventListener("click",()=>{ra({type:"quote",data:n})});const k=e.querySelector(".dropdown > .btn");k&&(k.addEventListener("click",D=>{D.stopPropagation();const z=k.nextElementSibling;z.style.display=z.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const D=e.querySelector(".dropdown-menu");D&&(D.style.display="none")})),(L=e.querySelector("#btn-create-revision"))==null||L.addEventListener("click",()=>{r.update("quotes",a,{status:"Archived"});const D=JSON.parse(JSON.stringify(n));delete D.id,D.version=(n.version||1)+1,D.status="Draft",D.createdAt=new Date().toISOString();const z=r.create("quotes",D);H(`Revision v${D.version} created`,"success"),X.navigate(`/quotes/${z.id}`)}),(T=e.querySelector("#btn-save-template"))==null||T.addEventListener("click",D=>{D.preventDefault();const z=document.createElement("div");z.innerHTML=`
        <div class="form-group">
          <label class="form-label">Template Name</label>
          <input type="text" class="form-input" id="tmpl-name" value="${n.title||"Custom Quote Template"}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tmpl-desc" rows="3" placeholder="Describe when to use this template..."></textarea>
        </div>
      `,xe({title:"Save Quote as Template",content:z,actions:[{label:"Cancel",className:"btn-secondary",onClick:M=>M()},{label:"Save Template",className:"btn-primary",onClick:M=>{const E=z.querySelector("#tmpl-name").value,j=z.querySelector("#tmpl-desc").value;if(!E){H("Template name is required","error");return}const F={name:E,description:j,sections:JSON.parse(JSON.stringify(n.sections)),createdAt:new Date().toISOString()};r.create("quoteTemplates",F),H("Saved to Quote Templates","success"),M()}}]})}),(I=e.querySelector("#btn-import-template"))==null||I.addEventListener("click",D=>{D.preventDefault();const z=r.getAll("quoteTemplates"),M=document.createElement("div");M.innerHTML=`
        <div class="toolbar-search" style="margin-bottom:12px">
          <span class="material-icons-outlined">search</span>
          <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
        </div>
        <div id="import-content" style="max-height:400px; overflow-y:auto">
          ${z.length?z.map(E=>`
            <div class="import-item" data-id="${E.id}" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${y(E.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${E.sections.length} sections</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${y(E.description||"No description.")}</div>
            </div>
          `).join(""):'<div class="text-secondary text-center" style="padding:24px">No templates saved yet.</div>'}
        </div>
      `,xe({title:"Import Quote Template",content:M,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()}]}),M.querySelectorAll(".import-item").forEach(E=>{E.addEventListener("click",()=>{var F;const j=z.find(R=>R.id===E.dataset.id);j&&confirm(`Replace current quote sections with "${j.name}"?`)&&(n.sections=JSON.parse(JSON.stringify(j.sections)),n.sections.forEach(R=>{R.id=r.generateId(),R.lineItems.forEach(B=>B.id=r.generateId())}),u(),(F=document.querySelector(".modal-overlay"))==null||F.remove())})})}),e.querySelectorAll("#quote-name, #quote-desc, #quote-customer, #quote-title, #quote-status, #quote-valid, #quote-labor-profile").forEach(D=>{D.addEventListener("change",()=>{const z=D.value;if(D.id==="quote-name")n.name=z;else if(D.id==="quote-desc")n.description=z;else if(D.id==="quote-customer")n.customerId=z;else if(D.id==="quote-title")n.title=z;else if(D.id==="quote-status")n.status=z;else if(D.id==="quote-valid")n.validUntil=z;else if(D.id==="quote-labor-profile"){n.laborProfileId=z;const M=f.laborRates.find(E=>E.id===z);if(M){if(n.sections&&n.sections.forEach(E=>{E.lineItems.forEach(j=>{j.type==="labor"&&(j.rate=M.rate)})}),M.minCallOutFee>0){const E=n.sections[0];E&&(E.lineItems.some(F=>F.description.includes("Call-out Fee"))||E.lineItems.unshift({description:"Call-out Fee",type:"other",qty:1,rate:M.minCallOutFee,total:M.minCallOutFee}))}u()}}})}),(_=e.querySelector("#btn-add-section"))==null||_.addEventListener("click",()=>{const D=f.laborRates.find(z=>z.id===n.laborProfileId)||f.laborRates.find(z=>z.isDefault);n.sections.push({id:r.generateId(),name:"New Phase",lineItems:[{description:"Labour",type:"labor",qty:1,rate:D?D.rate:85,total:D?D.rate:85}]}),u()}),e.querySelectorAll(".section-name-input").forEach((D,z)=>{D.addEventListener("change",()=>{n.sections[z].name=D.value})}),e.querySelectorAll(".btn-add-line").forEach(D=>{D.addEventListener("click",z=>{const M=parseInt(D.dataset.sidx);n.sections[M].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),i()})}),e.querySelectorAll(".btn-remove-section").forEach(D=>{D.addEventListener("click",()=>{const z=parseInt(D.dataset.sidx);confirm("Remove this entire phase?")&&(n.sections.splice(z,1),u())})}),e.querySelectorAll(".item-input").forEach(D=>{D.addEventListener("change",z=>{const M=D.closest("tr"),E=parseInt(M.dataset.sidx),j=parseInt(M.dataset.index),F=D.dataset.field;let R=D.value;if((F==="qty"||F==="rate")&&(R=parseFloat(R)||0),n.sections[E].lineItems[j][F]=R,F==="description"){const B=o.find(oe=>oe.name===R);if(B){const oe=(B.category||"").toLowerCase().includes("labor");let V=0,P=0;if(oe)V=B.unitPrice||85,P=B.costPrice||45;else{const te=B.costPrice||B.unitPrice||0;P=te,V=Qt(te,f)}n.sections[E].lineItems[j].type=oe?"labor":"material",n.sections[E].lineItems[j].rate=V,n.sections[E].lineItems[j].internalCost=P}}u()})}),e.querySelectorAll(".btn-remove-line").forEach(D=>{D.addEventListener("click",()=>{const z=parseInt(D.dataset.sidx),M=parseInt(D.dataset.index);n.sections[z].lineItems.splice(M,1),u()})}),(A=e.querySelector("#btn-cancel-quote"))==null||A.addEventListener("click",()=>{c?X.navigate("/settings?tab=quotes"):X.navigate("/quotes")}),(q=e.querySelector("#btn-save-quote"))==null||q.addEventListener("click",()=>{if(c)n.name=e.querySelector("#quote-name").value,n.description=e.querySelector("#quote-desc").value;else{const D=e.querySelector("#quote-customer").value,z=p.find(M=>M.id===D);n.customerId=D,n.customerName=(z==null?void 0:z.company)||"",n.contactName=z?`${z.firstName} ${z.lastName}`:"",n.title=e.querySelector("#quote-title").value,n.status=e.querySelector("#quote-status").value,n.validUntil=e.querySelector("#quote-valid").value}if(u(),c)m?(r.create("quoteTemplates",n),H("Template created","success"),X.navigate("/settings?tab=quotes")):(r.update("quoteTemplates",a,n),H("Template saved","success"),i());else if(m){const D=r.create("quotes",n);H("Quote created","success"),X.navigate(`/quotes/${D.id}`)}else r.update("quotes",a,n),H("Quote saved","success"),i()}),(w=e.querySelector("#btn-convert-job"))==null||w.addEventListener("click",()=>{(n.sections||[]).forEach(M=>{(M.lineItems||[]).forEach(E=>{E.type==="labor"&&(laborCost+=E.total),E.type==="material"&&(materialCost+=E.total)})});const D=n.sections.map(M=>({id:r.generateId(),name:M.name,status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[]})),z=r.create("jobs",{number:`J-${Date.now().toString().slice(-6)}`,customerId:n.customerId,customerName:n.customerName,contactName:n.contactName,title:n.title,type:"Project",status:"Pending",priority:"Medium",technicianId:tech==null?void 0:tech.id,technicianName:tech==null?void 0:tech.name,quoteId:a,tasks:D,phases:D,laborCost,materialCost,estimatedLaborCost:laborCost,estimatedMaterialCost:materialCost});me(async()=>{const{addSystemNotification:M}=await Promise.resolve().then(()=>De);return{addSystemNotification:M}},void 0).then(({addSystemNotification:M})=>{M("New Job Assigned",`You have been assigned to Live Job ${z.number} (${z.title}).`,`/jobs/${z.id}`)}),H("Quote converted to project","success"),X.navigate(`/jobs/${z.id}`)}),(v=e.querySelector("#btn-send-quote"))==null||v.addEventListener("click",()=>{n.emailStatus="Sent",n.status==="Draft"&&(n.status="Sent"),r.update("quotes",a,{emailStatus:"Sent",status:n.status}),me(async()=>{const{showToast:D,addSystemNotification:z}=await Promise.resolve().then(()=>De);return{showToast:D,addSystemNotification:z}},void 0).then(({showToast:D,addSystemNotification:z})=>{D("Email sent to customer","success"),i(),setTimeout(()=>{const M=r.getById("quotes",a);M&&M.emailStatus==="Sent"&&(M.emailStatus="Opened/Viewed",r.update("quotes",a,{emailStatus:"Opened/Viewed"}),z("Quote Opened",`Quote ${M.number} was opened by ${M.customerName||"the customer"}.`,`/quotes/${a}`),window.location.hash.includes(`/quotes/${a}`)&&(n.emailStatus="Opened/Viewed",i()))},15e3)})}),($=e.querySelector("#btn-sign-approve-modal"))==null||$.addEventListener("click",()=>{const D=document.createElement("div");D.innerHTML=`
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
      `,xe({title:"Sign & Approve Quote",content:D,actions:[{label:"Cancel",className:"btn-secondary",onClick:E=>E()},{label:"Sign & Authorize Project",className:"btn-success",onClick:E=>{const j=D.querySelector("#sig-name").value.trim(),F=D.querySelector("#sig-consent").checked;if(!j){H("Please type your name to sign.","error");return}if(!F){H("Please check the consent box to authorize.","error");return}n.status="Accepted",n.signedByName=j,n.signedAt=new Date().toISOString(),n.signatureData=j,r.update("quotes",a,{status:"Accepted",signedByName:j,signedAt:n.signedAt,signatureData:j}),H("Quote signed and accepted!","success"),E(),b()}}]});const z=D.querySelector("#sig-name"),M=D.querySelector("#sig-preview");z.addEventListener("input",()=>{M.textContent=z.value.trim()||"Client Signature"})}),(C=e.querySelector("#btn-decline-quote"))==null||C.addEventListener("click",()=>{confirm("Are you sure you want to decline this quote?")&&(n.status="Declined",r.update("quotes",a,{status:"Declined"}),H("Quote marked as declined","info"),i())}),(N=e.querySelector("#btn-delete-quote"))==null||N.addEventListener("click",()=>{const D=document.createElement("div");D.innerHTML=`<p>Delete quote <strong>${y(n.number)}</strong>?</p>`,xe({title:"Delete Quote",content:D,actions:[{label:"Cancel",className:"btn-secondary",onClick:z=>z()},{label:"Delete",className:"btn-danger",onClick:z=>{r.delete("quotes",a),H("Quote deleted","success"),z(),X.navigate("/quotes")}}]})}),(O=e.querySelector("#btn-delete-template"))==null||O.addEventListener("click",()=>{confirm(`Delete template "${y(n.name)}"?`)&&(r.delete("quoteTemplates",a),H("Template deleted","success"),X.navigate("/settings?tab=quotes"))})}i()}function ia(e){const a=r.getAll("jobs"),t=Le("Jobs","create");e.innerHTML=`
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
  `;let s=[...a];const c={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},l={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"},n=Xe({columns:[{key:"number",label:"Job #",render:o=>`<span class="cell-link font-medium">${y(o.number)}</span>`,width:"100px"},{key:"title",label:"Title",render:o=>`<span class="truncate" style="max-width:200px;display:inline-block">${y(o.title)}</span>`},{key:"customerName",label:"Customer"},{key:"technicians",label:"Assignee",render:o=>{if(o.contractorId){const f=r.getById("contractors",o.contractorId);return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;">engineering</span> ${f?y(f.businessName):"Unknown Contractor"}</span>`}return`<span class="text-secondary truncate" style="max-width:150px;display:inline-block">${o.technicians&&o.technicians.length>0?o.technicians.map(f=>y(f.name)).join(", "):y(o.technicianName||"—")}</span>`}},{key:"status",label:"Status",render:o=>`<span class="badge ${c[o.status]||"badge-neutral"}">${y(o.status)}</span>`,width:"110px"},{key:"priority",label:"Priority",render:o=>`<span class="badge ${l[o.priority]||"badge-neutral"}">${y(o.priority)}</span>`,width:"90px"},{key:"scheduledDate",label:"Scheduled",render:o=>o.scheduledDate?new Date(o.scheduledDate).toLocaleDateString():"—",getValue:o=>o.scheduledDate?new Date(o.scheduledDate).getTime():0,width:"100px"}],data:s,onRowClick:o=>X.navigate(`/jobs/${o}`),emptyMessage:"No jobs found",emptyIcon:"build",selectable:!0,onSelectionChange:o=>{Ze({container:e,selectedIds:o,onClear:()=>n.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:f=>{const g=document.createElement("div");g.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:i}=await Promise.resolve().then(()=>Pe);return{showModal:i}},void 0).then(({showModal:i})=>{i({title:`Update ${f.length} Jobs`,content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const x=g.querySelector("#bulk-status").value;f.forEach(u=>r.update("jobs",u,{status:x})),n.clearSelection(),ia(e),me(async()=>{const{showToast:u}=await Promise.resolve().then(()=>De);return{showToast:u}},void 0).then(({showToast:u})=>u(`Updated ${f.length} jobs to ${x}`,"success")),d()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:f=>{me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Pe);return{showModal:g}},void 0).then(({showModal:g})=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete ${f.length} jobs? This cannot be undone.</p>`,g({title:"Confirm Bulk Delete",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{f.forEach(x=>r.delete("jobs",x)),n.clearSelection(),ia(e),me(async()=>{const{showToast:x}=await Promise.resolve().then(()=>De);return{showToast:x}},void 0).then(({showToast:x})=>x(`Deleted ${f.length} jobs`,"success")),d()}}]})})}}]})}});e.querySelector("#jobs-table-container").appendChild(n);const p=e.querySelector("#btn-new-job");p&&p.addEventListener("click",()=>X.navigate("/jobs/new")),e.querySelectorAll(".toolbar-filter").forEach(o=>{o.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(g=>g.classList.remove("active")),o.classList.add("active");const f=o.dataset.filter;f==="all"?s=[...a]:f==="unscheduled"?s=a.filter(g=>!g.scheduledDate):s=a.filter(g=>g.status===f),n.updateData(s)})}),e.querySelector("#jobs-search").addEventListener("input",o=>{const f=o.target.value.toLowerCase();s=a.filter(g=>g.number.toLowerCase().includes(f)||g.title.toLowerCase().includes(f)||g.customerName.toLowerCase().includes(f)||(g.technicianName||"").toLowerCase().includes(f)),n.updateData(s)})}function ja(e,a){const t=r.getById("timesheets",e);if(!t)return;const s=JSON.parse(localStorage.getItem("currentUser")||"{}"),c={},l={};function m(S,L=[],T=[]){S&&S.forEach((I,_)=>{const A=[...L,_].join("-"),q=[...T,I.name].join(" > ");c[A]=q,I.id&&(l[I.id]=A),I.subTasks&&m(I.subTasks,[...L,_],[...T,I.name])})}function n(S,L=[]){return!S||S.length===0?"":S.map((T,I)=>{const _=[...L,I],A=_.join("-"),q=T.subTasks&&T.subTasks.length>0;return`
        <div class="tree-node" style="margin: 2px 0;">
          <div class="tree-node-row ${q?"parent-node":"leaf-node"}" data-path="${A}" data-name="${y(T.name)}" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; flex-grow:1;">
              ${q?`
                <span class="material-icons-outlined tree-node-toggle" data-path="${A}" style="font-size:16px; margin-right:4px;">chevron_right</span>
              `:`
                <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
              `}
              <span class="node-name" style="font-weight:${q?"600":"400"}">${y(T.name)}</span>
            </div>
            ${q?`
              <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${T.subTasks.length} subtasks</span>
            `:""}
          </div>
          ${q?`
            <div class="tree-node-children" id="children-${A}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
              ${n(T.subTasks,_)}
            </div>
          `:""}
        </div>
      `}).join("")}const p=t.startTime||`${t.date}T09:00`,o=t.finishTime||`${t.date}T10:00`,f=r.getAll("technicians"),g=r.getAll("jobs").filter(S=>S.status!=="Completed"&&S.status!=="Invoiced"||S.id===t.jobId),i=document.createElement("div");i.innerHTML=`
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
        <input type="datetime-local" class="form-input" id="lt-start" value="${p}" style="width:100%" />
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Finish Time *</label>
        <input type="datetime-local" class="form-input" id="lt-finish" value="${o}" style="width:100%" />
      </div>
    </div>
    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div class="form-group" style="margin:0">
        <label class="form-label">Technician *</label>
        <select class="form-select" id="lt-tech" style="width:100%" ${s.role==="technician"?"disabled":""}>
          <option value="">Select technician...</option>
          ${f.map(S=>`<option value="${S.id}" ${t.technicianId===S.id?"selected":""}>${S.name}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Job *</label>
        <select class="form-select" id="lt-job" style="width:100%">
          <option value="">Select job...</option>
          ${g.map(S=>`<option value="${S.id}" ${t.jobId===S.id?"selected":""}>${S.number} - ${y(S.customerName)} (${y(S.title)})</option>`).join("")}
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
        <input type="hidden" id="lt-task-name" value="${y(t.taskName||"")}" />
      </div>
    </div>
    <div class="form-group" style="margin:0">
      <label class="form-label">Description</label>
      <input type="text" class="form-input" id="lt-desc" value="${y(t.description||"")}" placeholder="Brief description..." style="width:100%" />
    </div>
  `;const d=i.querySelector("#lt-job"),x=i.querySelector("#lt-task-trigger"),u=i.querySelector("#lt-task-dropdown"),b=i.querySelector("#lt-task"),h=i.querySelector("#lt-task-name");x.addEventListener("click",S=>{S.stopPropagation();const L=u.style.display==="block";u.style.display=L?"none":"block"}),document.addEventListener("click",S=>{i.contains(S.target)||(u.style.display="none")});function k(S,L){if(!S){x.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',x.disabled=!0,u.style.display="none",b.value="",h.value="";return}const T=g.find(_=>_.id===S);if(!T||!T.tasks||T.tasks.length===0){x.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',x.disabled=!0,u.style.display="none",b.value="",h.value="";return}for(const _ in c)delete c[_];for(const _ in l)delete l[_];m(T.tasks),u.innerHTML=n(T.tasks),x.disabled=!1;let I=L;I&&!c[I]&&l[I]&&(I=l[I]),I&&c[I]?(x.innerHTML=`<span>${y(c[I])}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,b.value=I,h.value=c[I]):(x.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',b.value="",h.value=""),u.querySelectorAll(".tree-node-toggle").forEach(_=>{_.addEventListener("click",A=>{A.stopPropagation();const q=_.dataset.path,w=u.querySelector("#children-"+q);if(w){const v=w.style.display==="none";w.style.display=v?"block":"none",_.classList.toggle("expanded",v)}})}),u.querySelectorAll(".tree-node-row").forEach(_=>{_.addEventListener("click",A=>{if(A.target.classList.contains("tree-node-toggle"))return;const q=_.dataset.path,w=q.split("-").map(Number);function v(N,O){let D=N[O[0]];for(let z=1;z<O.length;z++){if(!D||!D.subTasks)return!1;D=D.subTasks[O[z]]}return D&&D.subTasks&&D.subTasks.length>0}if(v(T.tasks||[],w)){const N=u.querySelector("#children-"+q),O=u.querySelector('.tree-node-toggle[data-path="'+q+'"]');if(N){const D=N.style.display==="none";N.style.display=D?"block":"none",O&&O.classList.toggle("expanded",D)}return}const C=c[q]||_.dataset.name;b.value=q,h.value=C,x.innerHTML=`<span>${y(C)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,u.style.display="none"})})}k(t.jobId,t.taskPath||t.taskId),d.addEventListener("change",S=>{k(S.target.value,null)}),xe({title:"Edit Timesheet Entry",content:i,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Save Changes",className:"btn-primary",onClick:S=>{const L=document.getElementById("lt-start").value,T=document.getElementById("lt-finish").value,I=document.getElementById("lt-tech").value,_=document.getElementById("lt-job").value,A=document.getElementById("lt-task").value,q=document.getElementById("lt-task-name").value,w=document.getElementById("lt-desc").value;if(!L||!T||!I||!_||!A){H("Please fill all required fields, including the task","error");return}const v=new Date(L),$=new Date(T);if($<=v){H("Finish time must be after start time","error");return}const C=Math.round(($-v)/36e5*100)/100,N=f.find(D=>D.id===I),O=g.find(D=>D.id===_);r.update("timesheets",t.id,{jobId:O.id,jobNumber:O.number,taskId:A,taskPath:A,taskName:q,technicianId:I,technicianName:N.name,date:L.split("T")[0],startTime:L,finishTime:T,hours:C,description:w||""}),H("Timesheet updated successfully","success"),S(),a&&a()}}]})}function js(e,{id:a}){const t=r.getById("jobs",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Job not found</h3></div>';return}dt(t.number);const s={Pending:"badge-warning",Scheduled:"badge-info","In Progress":"badge-primary","On Hold":"badge-neutral",Completed:"badge-success",Invoiced:"badge-primary"},c={Low:"badge-neutral",Medium:"badge-warning",High:"badge-danger",Urgent:"badge-danger"};let l="overview",m=[0],n=[],p=!1,o=null,f=[];function g(){if(!o){const S=r.getAll("stock"),L=[];S.forEach(T=>{T.locations&&T.locations.length>0?T.locations.forEach(I=>{I.quantity>0&&L.push(`<option value="${T.id}::${y(I.location)}">${y(T.name)} [${y(I.location)}] (Qty: ${I.quantity}) - $${(T.costPrice||T.unitPrice||0).toFixed(2)}</option>`)}):T.quantity>0&&L.push(`<option value="${T.id}::${y(T.location||"Main Warehouse")}">${y(T.name)} [${y(T.location||"Main Warehouse")}] (Qty: ${T.quantity}) - $${(T.costPrice||T.unitPrice||0).toFixed(2)}</option>`)}),o=L.join("")}return o}function i(){(t.laborCost||0)+(t.materialCost||0),e.innerHTML=`
      <div class="detail-header">
        <div class="detail-header-info">
          <div class="detail-header-icon" style="background:var(--color-primary-light);color:var(--color-primary)">
            <span class="material-icons-outlined">build</span>
          </div>
          <div>
            <div class="detail-header-text"><h2>${y(t.number)} — ${y(t.title)}</h2></div>
            <div class="detail-header-meta">
              <span><span class="material-icons-outlined" style="font-size:14px">business</span> ${y(t.customerName)}</span>
              <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${y(t.technicianName||"Unassigned")}</span>
              <span class="badge ${s[t.status]||"badge-neutral"}">${y(t.status)}</span>
              <span class="badge ${c[t.priority]||"badge-neutral"}">${y(t.priority)}</span>
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
        <button class="tab ${l==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${l==="tasks"?"active":""}" data-tab="tasks">Tasklists</button>
        ${Le("Jobs","view_costs")?`<button class="tab ${l==="costs"?"active":""}" data-tab="costs">Costs</button>`:""}
        ${Le("Jobs","view_quotes_tab")?`<button class="tab ${l==="quotes"?"active":""}" data-tab="quotes">Quotes</button>`:""}
        <button class="tab ${l==="forms"?"active":""}" data-tab="forms">Forms</button>
        ${Le("Jobs","view_pos_tab")?`<button class="tab ${l==="pos"?"active":""}" data-tab="pos">POs</button>`:""}
        <button class="tab ${l==="activity"?"active":""}" data-tab="activity">Activity</button>
        ${Le("Jobs","view_timesheets_tab")?`<button class="tab ${l==="timesheets"?"active":""}" data-tab="timesheets">Timesheets</button>`:""}
        ${Le("Jobs","view_invoices_tab")?`<button class="tab ${l==="invoices"?"active":""}" data-tab="invoices">Invoices</button>`:""}
      </div>
      <div class="tab-content" id="tab-content"></div>
    `,d(),x()}function d(){var w,v,$,C,N,O,D,z,M,E,j,F,R,B,oe,V,P,te,ce,se,K,ne;(l==="costs"&&!Le("Jobs","view_costs")||l==="quotes"&&!Le("Jobs","view_quotes_tab")||l==="pos"&&!Le("Jobs","view_pos_tab")||l==="timesheets"&&!Le("Jobs","view_timesheets_tab")||l==="invoices"&&!Le("Jobs","view_invoices_tab"))&&(l="overview");const S=e.querySelector("#tab-content");if((t.laborCost||0)+(t.materialCost||0),l==="forms"){b(S);return}if(l==="overview"){let G=0;if(t.tasks&&t.tasks.length>0){let he=0,Ie=0;t.tasks.forEach(Ae=>{const Be=(parseFloat(Ae.estimatedHours)||1)*(parseInt(Ae.people)||1);he+=Be,Ie+=Be*((Ae.progress||0)/100)}),G=he>0?Math.round(Ie/he*100):0}const ee=t.technicians&&t.technicians.length>0?t.technicians.map(he=>`${y(he.name)} (${he.hours}h)`).join(", "):y(t.technicianName||"Unassigned"),ae=r.getAll("timesheets").filter(he=>he.jobId===a),W=r.getAll("technicians"),U={};let Q=0,J=0;ae.forEach(he=>{if(!U[he.technicianId]){const Ie=W.find(Ae=>Ae.id===he.technicianId);U[he.technicianId]={hours:0,rate:Ie&&(Ie.payRate||Ie.hourlyRate)||45}}U[he.technicianId].hours+=he.hours||0}),Object.values(U).forEach(he=>{Q+=he.hours,J+=he.hours*he.rate});const le=r.getAll("assetUsage").filter(he=>he.jobId===a),ve=r.getAll("assets");let Z=0;le.forEach(he=>{const Ie=ve.find(Be=>Be.id===he.assetId),Ae=he.recoveryRate||(Ie?Ie.recoveryRate:0)||0;Z+=he.hours*Ae});const Y=(t.materials||[]).reduce((he,Ie)=>he+Ie.quantity*(Ie.unitCost||0),0),pe=parseFloat(t.additionalMaterialCost||0),re=Y+pe,ye=r.getAll("quotes").filter(he=>he.jobId===a||t.quoteId===he.id||he.number===t.quoteNumber).find(he=>he.status==="Accepted")||(t.quoteId?r.getById("quotes",t.quoteId):null);let $e=0,Se=0;if(ye){const he=[];ye.sections&&Array.isArray(ye.sections)&&ye.sections.forEach(Ie=>{Ie.lineItems&&Array.isArray(Ie.lineItems)&&he.push(...Ie.lineItems)}),ye.lineItems&&Array.isArray(ye.lineItems)&&he.push(...ye.lineItems),he.forEach(Ie=>{const Ae=parseFloat(Ie.total)||(parseFloat(Ie.qty)||0)*(parseFloat(Ie.rate)||0);Ie.type==="labor"?$e+=Ae:Ie.type==="material"&&(Se+=Ae)})}$e===0&&Se===0&&($e=parseFloat(t.estimatedLaborCost||t.laborCost||0),Se=parseFloat(t.estimatedMaterialCost||t.materialCost||0));const Ce=$e+Se,qe=J,Re=re,Ue=Z,Fe=qe+Re+Ue,Te=qe-$e,Oe=Re-Se,Me=Fe-Ce;S.innerHTML=`
        <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
          
          <!-- Budget Deviation Tracker Card -->
          <div class="card" style="border: 1.5px solid ${Me>0?"var(--color-danger)":"var(--color-success)"}">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:${Me>0?"rgba(239,68,68,0.02)":"rgba(16,185,129,0.02)"}; padding: 12px 16px">
              <h4 style="margin:0; color:${Me>0?"var(--color-danger)":"var(--color-success-dark)"}; display:flex; align-items:center; gap:8px">
                <span class="material-icons-outlined" style="font-size:20px">analytics</span>
                Budget Deviation & Expenses Tracker
              </h4>
              <span class="badge ${Me>0?"badge-danger":"badge-success"}" style="font-weight:700">
                ${Me>0?"Over Budget":"Under Budget"}
              </span>
            </div>
            <div class="card-body" style="padding: 16px">
              ${Me>0?`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(239,68,68,0.08); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; margin-bottom:16px; color:#c53030">
                  <span class="material-icons-outlined" style="font-size:20px">warning</span>
                  <div style="font-size:13px">
                    <strong>Budget Overrun Detected</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Actual expenses have exceeded the quoted estimation by <strong>$${Me.toFixed(2)}</strong>. Customer approval may be required for additional variations.</div>
                  </div>
                </div>
              `:`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.08); border-left:4px solid var(--color-success); padding:12px; border-radius:4px; margin-bottom:16px; color:#2f855a">
                  <span class="material-icons-outlined" style="font-size:20px">check_circle</span>
                  <div style="font-size:13px">
                    <strong>Expenses Within Quoted Budget</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Current expenses are within the original quoted estimation. Remaining budget margin: <strong>$${Math.abs(Me).toFixed(2)}</strong>.</div>
                  </div>
                </div>
              `}

              <!-- Visual Progress Comparison Bar -->
              <div style="margin-bottom:18px">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; font-weight:600; color:var(--text-secondary)">
                  <span>Quoted Estimate ($${Ce.toFixed(2)})</span>
                  <span>Actual Expenses ($${Fe.toFixed(2)})</span>
                </div>
                <div style="width:100%; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:flex">
                  ${(()=>{const he=Ce>0?Math.min(100,Math.round(Fe/Ce*100)):100,Ie=Fe>Ce;return`
                      <div style="width:${he}%; background:${Ie?"var(--color-danger)":"var(--color-success)"}; height:100%; transition:width 0.4s ease; border-radius:6px"></div>
                      ${Ie?'<div style="flex:1; background:rgba(239,68,68,0.25); height:100%"></div>':""}
                    `})()}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:var(--text-tertiary)">
                  <span>0%</span>
                  <span>Budget Utilization: ${Ce>0?Math.round(Fe/Ce*100):0}%</span>
                  <span>${Ce>0&&Fe>Ce?`${Math.round(Fe/Ce*100)}% (Overspent)`:"100%"}</span>
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
                    <td style="text-align:right; color:var(--text-secondary)">$${$e.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${qe.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${Te>0?"var(--color-danger)":Te<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${Te>0?`+$${Te.toFixed(2)}`:Te<0?`-$${Math.abs(Te).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Material Costs</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${Se.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${Re.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${Oe>0?"var(--color-danger)":Oe<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${Oe>0?`+$${Oe.toFixed(2)}`:Oe<0?`-$${Math.abs(Oe).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  ${Ue>0?`
                    <tr>
                      <td style="font-weight:600">Asset Recovery (Van/Tools)</td>
                      <td style="text-align:right; color:var(--text-secondary)">$0.00</td>
                      <td style="text-align:right; font-weight:600">$${Ue.toFixed(2)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--color-danger)">+$${Ue.toFixed(2)}</td>
                    </tr>
                  `:""}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color); font-weight:700">
                    <td>Total Job Expenses</td>
                    <td style="text-align:right">$${Ce.toFixed(2)}</td>
                    <td style="text-align:right; color:var(--color-primary)">$${Fe.toFixed(2)}</td>
                    <td style="text-align:right; color:${Me>0?"var(--color-danger)":Me<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${Me>0?`+$${Me.toFixed(2)}`:Me<0?`-$${Math.abs(Me).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Original Grid details -->
          <div class="grid-3" style="align-items: start;">
            <div class="card" style="grid-column: span 1">
              <div class="card-header"><h4>Job Information</h4></div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${u("Job Number",y(t.number))}
                  ${u("Title",y(t.title))}
                  ${u("Type",y(t.type))}
                  ${u("Status",y(t.status))}
                  ${u("Completion",`<div style="display:flex;align-items:center;gap:8px;max-width:200px"><div style="flex:1;background:var(--border-color);height:8px;border-radius:4px;overflow:hidden"><div style="width:${G}%;background:var(--color-primary);height:100%"></div></div><span style="font-size:12px;font-weight:600">${G}%</span></div>`)}
                  ${u("Priority",y(t.priority))}
                  ${u("Customer",y(t.customerName))}
                  ${u("Contact",y(t.contactName||"—"))}
                </div>
              </div>
            </div>
            <div class="card" style="grid-column: span 2">
              <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                <h4 style="margin:0">Schedule & Assignment</h4>
                <button class="btn btn-ghost btn-sm" id="btn-add-schedule" style="font-size:12px;padding:4px 8px">
                  <span class="material-icons-outlined" style="font-size:14px;margin-right:4px">calendar_month</span> Add to Schedule
                </button>
              </div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${u("Technicians",ee)}
                  ${u("Scheduled",t.scheduledDate?new Date(t.scheduledDate).toLocaleDateString():"—")}
                  ${u("Est. Hours",t.estimatedHours||"—")}
                  ${u("Site Address",y(t.siteAddress||"—"))}
                  ${u("Quote Ref",t.quoteId?`<a href="#/quotes/${y(t.quoteId)}">${y(t.quoteId)}</a>`:"—")}
                  ${u("Created",new Date(t.createdAt).toLocaleDateString())}
                </div>
              </div>
            </div>
          </div>

        </div>
      `,(w=S.querySelector("#btn-add-schedule"))==null||w.addEventListener("click",()=>{const he=r.getAll("technicians"),Ie=r.getAll("schedule").filter(de=>de.jobId===a),Ae=document.createElement("div");function Be(de,ie=[],ue=[]){let fe=[];return de&&de.forEach((ge,be)=>{const Ee=[...ie,be].join("-"),Ne=[...ue,ge.name].join(" > ");fe.push({path:Ee,name:Ne,isLeaf:!ge.subTasks||ge.subTasks.length===0}),ge.subTasks&&(fe=fe.concat(Be(ge.subTasks,[...ie,be],[...ue,ge.name])))}),fe}const Je=Be(t.tasks||[]);function bt(de){let ie="";return de.forEach((ue,fe)=>{ie+='<div class="sched-entry" data-index="'+fe+'" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:8px;padding:16px;margin-bottom:12px">',ie+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">',ie+='<span style="font-weight:600;font-size:13px;color:var(--text-secondary)">Entry '+(fe+1)+"</span>",de.length>1&&(ie+='<button type="button" class="btn btn-sm btn-danger btn-remove-entry" data-index="'+fe+'" style="padding:2px 8px">✕ Remove</button>'),ie+="</div>",ie+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">',ie+='<div class="form-group" style="margin:0;grid-column:1/-1"><label class="form-label">Task <span class="text-danger">*</span></label>',ie+='<select class="form-select sched-task" style="width:100%">',ie+='<option value="">-- Select a Task --</option>',Je.forEach(be=>{ie+=`<option value="${be.path}" ${ue.taskPath===be.path?"selected":""}>${y(be.name)}</option>`}),ie+="</select></div>",ie+='<div class="form-group" style="margin:0"><label class="form-label">Start</label>',ie+='<input type="datetime-local" class="form-input sched-start" value="'+ue.start+'"></div>',ie+='<div class="form-group" style="margin:0"><label class="form-label">Finish</label>',ie+='<input type="datetime-local" class="form-input sched-finish" value="'+ue.finish+'"></div>',ie+="</div>",ie+='<div class="form-group" style="margin:12px 0 0 0"><label class="form-label">Technicians</label>',ie+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="tech-chips">',he.forEach(be=>{const Ee=ue.techIds.includes(be.id),Ne=Ee?"var(--color-primary)":"var(--border-color)",Ge=Ee?"var(--color-primary-light)":"transparent",je=Ee?"var(--color-primary)":"var(--text-secondary)";ie+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Ne+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ge+";color:"+je+';transition:all 0.15s">',ie+='<input type="checkbox" class="tech-check" data-tech-id="'+be.id+'" '+(Ee?"checked":"")+' style="display:none">',ie+='<span class="material-icons-outlined" style="font-size:14px">person</span>',ie+=y(be.name),ie+="</label>"}),ie+="</div></div>";const ge=r.getAll("assets").filter(be=>be.category==="Business");ie+='<div class="form-group" style="margin:16px 0 0 0"><label class="form-label">Business Assets / Tools</label>',ie+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px" class="asset-chips">',ge.forEach(be=>{const Ee=ue.assetIds&&ue.assetIds.includes(be.id),Ne=Ee?"var(--color-primary)":"var(--border-color)",Ge=Ee?"var(--color-primary-light)":"transparent",je=Ee?"var(--color-primary)":"var(--text-secondary)";ie+='<label style="display:flex;align-items:center;gap:6px;padding:4px 10px;border:1.5px solid '+Ne+";border-radius:999px;cursor:pointer;font-size:13px;background:"+Ge+";color:"+je+';transition:all 0.15s">',ie+='<input type="checkbox" class="asset-check" data-asset-id="'+be.id+'" '+(Ee?"checked":"")+' style="display:none">',ie+='<span class="material-icons-outlined" style="font-size:14px">handyman</span>',ie+=y(be.name),ie+="</label>"}),ge.length===0&&(ie+='<span class="text-tertiary" style="font-size:12px">No business assets configured.</span>'),ie+="</div></div></div>"}),ie}function rt(de){if(!document.getElementById("sched-modal-styles")){const ue=document.createElement("style");ue.id="sched-modal-styles",ue.textContent=".sched-summary-row{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);font-size:13px;align-items:center}.sched-summary-row:last-child{border-bottom:none}",document.head.appendChild(ue)}let ie="";Ie.length>0&&(ie+='<div style="margin-bottom:16px">',ie+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Current Schedule</div>',Ie.forEach(ue=>{const fe=new Date(ue.startTime||ue.date).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});ie+='<div class="sched-summary-row" style="flex-wrap:wrap">',ie+='<span class="material-icons-outlined" style="font-size:16px;color:var(--color-primary)">schedule</span>',ie+='<span style="font-weight:500">'+y(ue.technicianName)+"</span>",ie+='<span style="color:var(--text-tertiary);font-size:12px;margin-left:8px;padding-left:8px;border-left:1px solid var(--border-color)">'+y(ue.taskName||"General Task")+"</span>",ie+='<span style="color:var(--text-tertiary);margin-left:auto">'+fe+"</span>",ie+='<span style="font-weight:600;margin-left:12px">'+ue.hours+"h</span>",ie+="</div>"}),ie+="</div>",ie+='<hr style="border-color:var(--border-color);margin-bottom:16px">'),ie+='<div style="font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">New Schedule Entries</div>',ie+='<div id="sched-entries">'+bt(de)+"</div>",ie+='<button type="button" id="btn-add-entry" class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px">',ie+='<span class="material-icons-outlined" style="font-size:16px">add</span> Add Another Entry</button>',Ae.innerHTML=ie,Ae.querySelectorAll(".tech-check").forEach(ue=>{const fe=ue.closest("label");ue.addEventListener("change",()=>{ue.checked?(fe.style.borderColor="var(--color-primary)",fe.style.background="var(--color-primary-light)",fe.style.color="var(--color-primary)"):(fe.style.borderColor="var(--border-color)",fe.style.background="transparent",fe.style.color="var(--text-secondary)")})}),Ae.querySelectorAll(".asset-check").forEach(ue=>{const fe=ue.closest("label");ue.addEventListener("change",()=>{ue.checked?(fe.style.borderColor="var(--color-primary)",fe.style.background="var(--color-primary-light)",fe.style.color="var(--color-primary)"):(fe.style.borderColor="var(--border-color)",fe.style.background="transparent",fe.style.color="var(--text-secondary)")})}),Ae.querySelectorAll(".btn-remove-entry").forEach(ue=>{ue.addEventListener("click",()=>{de.splice(parseInt(ue.dataset.index),1),rt(de)})}),Ae.querySelector("#btn-add-entry").addEventListener("click",()=>{const ue=be=>be.toString().padStart(2,"0"),fe=new Date;fe.setDate(fe.getDate()+1);const ge=`${fe.getFullYear()}-${ue(fe.getMonth()+1)}-${ue(fe.getDate())}`;de.push({taskPath:"",start:`${ge}T08:00`,finish:`${ge}T16:00`,techIds:[],assetIds:[]}),rt(de)})}const ft=de=>de.toString().padStart(2,"0"),Ke=new Date,lt=`${Ke.getFullYear()}-${ft(Ke.getMonth()+1)}-${ft(Ke.getDate())}`,pt=t.technicianId?[t.technicianId]:[],We=[{taskPath:"",start:`${lt}T08:00`,finish:`${lt}T16:00`,techIds:pt,assetIds:[]}];rt(We);function _t(){const de=[];return Ae.querySelectorAll(".sched-entry").forEach((ie,ue)=>{var Ge,je,ot;const fe=(Ge=ie.querySelector(".sched-task"))==null?void 0:Ge.value,ge=(je=ie.querySelector(".sched-start"))==null?void 0:je.value,be=(ot=ie.querySelector(".sched-finish"))==null?void 0:ot.value,Ee=[...ie.querySelectorAll(".tech-check:checked")].map(Ye=>Ye.dataset.techId),Ne=[...ie.querySelectorAll(".asset-check:checked")].map(Ye=>Ye.dataset.assetId);de.push({taskPath:fe,start:ge,finish:be,techIds:Ee,assetIds:Ne})}),de}xe({title:`Schedule Job: ${y(t.title||t.number)}`,content:Ae,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:de=>de()},{label:"Save Schedule",className:"btn-primary",onClick:de=>{const ie=_t();let ue=0,fe=[];if(ie.forEach((ge,be)=>{var ot;if(!ge.taskPath){fe.push(`Entry ${be+1}: please select a task`);return}if(!ge.start||!ge.finish){fe.push(`Entry ${be+1}: missing start or finish`);return}const Ee=new Date(ge.start),Ne=new Date(ge.finish);if(Ne<=Ee){fe.push(`Entry ${be+1}: finish must be after start`);return}if(ge.techIds.length===0){fe.push(`Entry ${be+1}: select at least one technician`);return}const Ge=Math.round((Ne-Ee)/36e5*100)/100,je=((ot=Je.find(Ye=>Ye.path===ge.taskPath))==null?void 0:ot.name)||"Unknown Task";ge.techIds.forEach(Ye=>{const ht=he.find(Wa=>Wa.id===Ye);ht&&(r.create("schedule",{jobId:a,jobNumber:t.number,taskPath:ge.taskPath,taskName:je,technicianId:Ye,technicianName:ht.name,date:ge.start.split("T")[0],startTime:ge.start,finishTime:ge.finish,hours:Ge}),ue++)}),ge.assetIds&&ge.assetIds.length>0&&ge.assetIds.forEach(Ye=>{const ht=r.getById("assets",Ye);ht&&r.create("assetUsage",{jobId:a,assetId:Ye,assetName:ht.name,taskPath:ge.taskPath,taskName:je,startTime:ge.start,finishTime:ge.finish,hours:Ge,recoveryRate:ht.recoveryRate||0})})}),fe.length){H(fe[0],"error");return}if(ie.length>0&&ie[0].start){const be=[...new Set(ie.flatMap(Ee=>Ee.techIds))].map(Ee=>{const Ne=he.find(je=>je.id===Ee),Ge=ie.filter(je=>je.techIds.includes(Ee)).reduce((je,ot)=>{const Ye=(new Date(ot.finish)-new Date(ot.start))/36e5;return je+(isNaN(Ye)?0:Ye)},0);return{id:Ee,name:(Ne==null?void 0:Ne.name)||"",hours:Math.round(Ge*100)/100}});r.update("jobs",a,{scheduledDate:ie[0].start.split("T")[0],technicians:be,technicianName:be.map(Ee=>Ee.name).join(", ")}),me(async()=>{const{addSystemNotification:Ee}=await Promise.resolve().then(()=>De);return{addSystemNotification:Ee}},void 0).then(({addSystemNotification:Ee})=>{be.forEach(Ne=>{Ee("New Schedule Assignment",`You have been scheduled for Job ${t.number} (${t.title}) starting ${ie[0].start.replace("T"," ")} (${Ne.hours} hrs total).`,`/jobs/${a}`)})})}H(`${ue} schedule ${ue===1?"entry":"entries"} saved`,"success"),de(),d()}}]})})}else if(l==="tasks"){let U=function(Z,Y){let pe=Z[Y[0]];if(!pe)return null;for(let re=1;re<Y.length;re++)if(!pe.subTasks||(pe=pe.subTasks[Y[re]],!pe))return null;return pe},Q=function(Z){return!Z.subTasks||Z.subTasks.length===0?(parseFloat(Z.estimatedHours)||0)*(parseInt(Z.people)||1):Z.subTasks.reduce((Y,pe)=>Y+Q(pe),0)},J=function(Z,Y){if(Y.length<=1)return;const pe=Y.slice(0,-1),re=U(Z,pe);if(re&&re.subTasks&&re.subTasks.length>0){let we=0,ye=0;re.subTasks.forEach($e=>{const Se=(parseFloat($e.estimatedHours)||1)*(parseInt($e.people)||1);we+=Se,ye+=Se*(($e.progress||0)/100)}),re.progress=we>0?Math.round(ye/we*100):0,re.progress===100?re.status="Completed":re.progress>0?re.status="In Progress":re.status="Not Started",J(Z,pe)}};var L=U,T=Q,I=J;const G=JSON.parse(localStorage.getItem("currentUser")||"{}");let ee=!0;if(G.userTypeId){const Z=r.getById("userTypes",G.userTypeId);if(Z&&Z.permissions){const Y=Z.permissions.find(pe=>pe.module==="Jobs");Y&&(ee=Y.edit)}}else(G.role==="customer"||G.role==="technician")&&(ee=!1);t.tasks||(t.tasks=[{id:r.generateId(),name:"Main Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}]),t.tasks.forEach(Z=>{Z.subTasks||(Z.subTasks=[])});const ae=Z=>{Z.forEach(Y=>{Y.assignedContractorId&&(!Y.assignedContractorIds||Y.assignedContractorIds.length===0)&&(Y.assignedContractorIds=[Y.assignedContractorId]),Y.subTasks&&ae(Y.subTasks)})};ae(t.tasks);const W=r.getAll("contractors").filter(Z=>Z.active);let le=!0,ve=t.tasks;for(let Z=0;Z<m.length;Z++){if(!ve||!ve[m[Z]]){le=!1;break}ve=ve[m[Z]].subTasks}le||(m=[]),S.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <h4>Tasklists</h4>
            <div style="display:flex; gap:8px">
              ${ee?'<button class="btn btn-sm btn-secondary" id="btn-import-tasklist"><span class="material-icons-outlined" style="font-size:14px">download</span> Import</button>':""}
              ${ee?'<button class="btn btn-sm btn-secondary" id="btn-save-tasklist-template"><span class="material-icons-outlined" style="font-size:14px">bookmark_add</span> Save as Template</button>':""}
              ${ee?'<button class="btn btn-sm btn-primary" id="btn-save-tasks"><span class="material-icons-outlined" style="font-size:14px">save</span> Save Tasks</button>':""}
            </div>
          </div>
          <div class="card-body" style="padding:16px; display:flex; gap:16px; overflow-x:auto; min-height:400px; align-items:stretch">
            
            <!-- Drill-Down List -->
            ${(()=>{const Z=n.length>0?U(t.tasks,n):null,Y=Z?Z.subTasks||[]:t.tasks,pe=Z?y(Z.name):"Main Tasks";return`
                <div style="flex: 0 0 300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:12px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden">
                      ${n.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${pe}">${pe}</span>
                    </div>
                    ${ee?n.length===0?'<button class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${n.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`:""}
                  </div>
                  <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${Y.map((re,we)=>{const ye=[...n,we],$e=ye.join("-")===m.join("-");return`
                        <div class="task-list-item ${re.progress===100?"completed":""}" data-path="${ye.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${$e?"background:var(--color-primary-light); color:var(--color-primary)":"background:transparent; color:var(--text-primary)"}">
                          <span style="font-weight:${$e?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${y(re.name)}">${y(re.name)}</span>
                          ${re.subTasks&&re.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${ye.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:`<input type="checkbox" class="task-list-checkbox" data-path="${ye.join("-")}" ${re.progress===100?"checked":""} style="margin-left:8px; width:18px; height:18px; cursor:pointer;" />`}
                        </div>
                      `}).join("")}
                    ${Y.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Task Details Form -->
            ${m.length>0?(()=>{const Z=m,Y=U(t.tasks,Z);if(!Y)return"";const pe=Y.subTasks&&Y.subTasks.length>0;return`
                <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                  ${p?`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${y(Y.name)}">Edit Info Panel</h4>
                    <div style="display:flex;gap:8px">
                      <button class="btn btn-sm btn-primary btn-done-info">Done</button>
                      ${ee?`<button class="btn btn-sm btn-secondary btn-duplicate-task" data-path="${Z.join("-")}" title="Duplicate Task"><span class="material-icons-outlined" style="font-size:16px">content_copy</span></button>`:""}
                      ${ee?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${Z.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Task Name</label>
                    <input type="text" class="form-input detail-input" data-field="name" value="${y(Y.name)}" ${ee?"":"disabled"} />
                  </div>
                  ${pe?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${Q(Y)} hrs</div>
                  </div>
                  `:`
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Start Date</label>
                      <input type="date" class="form-input detail-input" data-field="startDate" value="${Y.startDate?Y.startDate.split("T")[0]:""}" ${ee?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Estimated Hours</label>
                      <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${Y.estimatedHours||""}" min="0" step="0.5" ${ee?"":"disabled"} />
                    </div>
                    <div class="form-group">
                      <label class="form-label">People</label>
                      <input type="number" class="form-input detail-input" data-field="people" value="${Y.people||"1"}" min="1" step="1" ${ee?"":"disabled"} />
                    </div>
                  </div>
                  `}
                  <div class="form-group">
                    <label class="form-label">Progress</label>
                    <div style="width:100%;background:var(--border-color);height:36px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${Y.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;color:${Y.progress>50?"#fff":"var(--text-primary)"}">${Y.progress||0}%</div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="margin-bottom:8px">Assigned Subcontractors</label>
                    <div style="border:1px solid var(--border-color); border-radius:6px; max-height:160px; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; background:var(--bg-color)">
                      ${W.map(re=>{const we=(Y.assignedContractorIds||[]).includes(re.id);return`
                          <label class="contractor-checkbox-label" style="display:flex; align-items:center; gap:8px; margin:0; padding:4px 6px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:normal; transition:background 0.2s">
                            <input type="checkbox" class="contractor-assign-checkbox" value="${re.id}" ${we?"checked":""} ${ee?"":"disabled"} style="width:16px; height:16px; margin:0; cursor:pointer" />
                            <span style="font-weight:500; color:var(--text-primary)">${y(re.businessName)}</span>
                            <span style="color:var(--text-tertiary); font-size:11px">(${y(re.contactName)})</span>
                          </label>
                        `}).join("")}
                      ${W.length===0?'<div style="color:var(--text-tertiary); font-size:12px; text-align:center; padding:12px">No active subcontractors found</div>':""}
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input detail-input" data-field="description" rows="3" ${ee?"":"disabled"}>${y(Y.description||"")}</textarea>
                  </div>
                  `:`
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${y(Y.name)}">Info Panel: ${y(Y.name)}</h4>
                    <div style="display:flex;gap:8px">
                      ${ee&&Z.length<3?`<button class="btn btn-sm btn-secondary btn-add-child-task" data-path="${Z.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                      ${pe?"":`<button class="btn btn-sm btn-secondary btn-book-time" data-path="${Z.join("-")}"><span class="material-icons-outlined" style="font-size:16px">timer</span> Book Time</button>`}
                      ${ee?'<button class="btn btn-sm btn-primary btn-edit-info" title="Edit"><span class="material-icons-outlined" style="font-size:16px">edit</span> Edit</button>':""}
                      ${ee?`<button class="btn btn-sm btn-danger btn-remove-task" data-path="${Z.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>`:""}
                    </div>
                  </div>
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Task Name</div>
                    <div style="font-size:16px; font-weight:500">${y(Y.name)}</div>
                  </div>
                  ${pe?`
                  <div style="margin-bottom:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Total Hours</div>
                    <div style="font-size:14px; font-weight:500">${Q(Y)} hrs</div>
                  </div>
                  `:`
                  <div style="display:flex; gap:24px; margin-bottom:16px">
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Start Date</div>
                      <div style="font-size:14px">${Y.startDate?Y.startDate.split("T")[0]:"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Estimated Hours</div>
                      <div style="font-size:14px">${Y.estimatedHours?Y.estimatedHours+" hrs":"-"}</div>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">People</div>
                      <div style="font-size:14px">${Y.people||"1"}</div>
                    </div>
                  </div>
                  `}
                  <div>
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Progress</div>
                    <div style="width:100%;background:var(--border-color);height:24px;border-radius:4px;overflow:hidden;position:relative">
                      <div style="width:${Y.progress||0}%;background:var(--color-primary);height:100%;transition:width 0.3s"></div>
                      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;color:${Y.progress>50?"#fff":"var(--text-primary)"}">${Y.progress||0}%</div>
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:6px">Assigned Subcontractors</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px">
                      ${(()=>{const re=Y.assignedContractorIds||[];return re.length===0?'<span style="color:var(--text-tertiary); font-style:italic; font-size:13px">Unassigned</span>':re.map(we=>{const ye=r.getById("contractors",we),$e=ye?ye.businessName:"Unknown Subcontractor";return`
                            <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600; display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:4px; font-size:12px">
                              <span class="material-icons-outlined" style="font-size:14px">engineering</span>
                              ${y($e)}
                            </span>
                          `}).join("")})()}
                    </div>
                  </div>
                  <div style="margin-top:16px">
                    <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:4px">Description</div>
                    <div style="font-size:14px; white-space:pre-wrap">${y(Y.description||"No description provided.")}</div>
                  </div>
                  `}
                </div>
              `})():""}
          </div>
        </div>
      `,(v=S.querySelector(".btn-view-back"))==null||v.addEventListener("click",()=>{n.pop(),d()}),S.querySelectorAll(".btn-drill-down").forEach(Z=>{Z.addEventListener("click",Y=>{Y.stopPropagation(),n=Z.dataset.path.split("-").map(Number),m=[...n],d()})}),S.querySelectorAll(".task-list-checkbox").forEach(Z=>{Z.addEventListener("change",Y=>{const pe=Y.target.dataset.path.split("-").map(Number),re=U(t.tasks,pe);re.progress=Y.target.checked?100:0,re.status=Y.target.checked?"Completed":"Not Started",J(t.tasks,pe),d()}),Z.addEventListener("click",Y=>Y.stopPropagation())}),S.querySelectorAll(".task-list-item").forEach(Z=>{Z.addEventListener("click",Y=>{if(Y.target.closest(".btn-drill-down"))return;m=Y.currentTarget.dataset.path.split("-").map(Number),p=!1,d()})}),($=S.querySelector(".btn-edit-info"))==null||$.addEventListener("click",()=>{p=!0,d()}),(C=S.querySelector(".btn-done-info"))==null||C.addEventListener("click",()=>{p=!1,d()}),(N=S.querySelector("#btn-add-main-task"))==null||N.addEventListener("click",()=>{t.tasks||(t.tasks=[]),t.tasks.push({id:r.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),m=[t.tasks.length-1],d()}),S.querySelectorAll(".btn-add-child-task").forEach(Z=>{Z.addEventListener("click",Y=>{const pe=Y.currentTarget.dataset.path.split("-").map(Number),re=U(t.tasks,pe);re.subTasks||(re.subTasks=[]),re.subTasks.push({id:r.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),m=[...pe,re.subTasks.length-1],d()})}),S.querySelectorAll(".detail-input").forEach(Z=>{Z.addEventListener("change",Y=>{const pe=U(t.tasks,m),re=Y.target.dataset.field;re==="progress-check"?(pe.progress=Y.target.checked?100:0,pe.status=Y.target.checked?"Completed":"Not Started"):re==="progress"?(pe.progress=parseInt(Y.target.value),pe.progress===100?pe.status="Completed":pe.progress===0?pe.status="Not Started":pe.status="In Progress"):re==="estimatedHours"?pe.estimatedHours=parseFloat(Y.target.value)||0:pe[re]=Y.target.value,J(t.tasks,m),d()})}),S.querySelectorAll(".contractor-assign-checkbox").forEach(Z=>{Z.addEventListener("change",()=>{const Y=U(t.tasks,m);Y.assignedContractorIds||(Y.assignedContractorIds=[]);const pe=Array.from(S.querySelectorAll(".contractor-assign-checkbox:checked")).map(re=>re.value);if(Y.assignedContractorIds=pe,pe.length>0){Y.assignedContractorId=pe[0];const re=r.getById("contractors",pe[0]);Y.assignedContractorName=re?re.businessName:""}else Y.assignedContractorId=null,Y.assignedContractorName="";J(t.tasks,m),d()})}),S.querySelectorAll(".btn-remove-task").forEach(Z=>{Z.addEventListener("click",Y=>{const pe=Z.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(pe.length===1)t.tasks.splice(pe[0],1);else{const re=pe.slice(0,-1),we=U(t.tasks,re);we&&we.subTasks&&we.subTasks.splice(pe[pe.length-1],1),J(t.tasks,re)}m=pe.slice(0,-1),p=!1,d()}})}),(O=S.querySelector("#btn-save-tasks"))==null||O.addEventListener("click",()=>{r.update("jobs",a,{tasks:t.tasks}),H("Tasks saved","success")}),(D=S.querySelector("#btn-save-tasklist-template"))==null||D.addEventListener("click",()=>{const Z=document.createElement("div");Z.innerHTML=`
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
         `,xe({title:"Save Tasklist as Template",content:Z,actions:[{label:"Cancel",className:"btn-secondary",onClick:Y=>Y()},{label:"Save Template",className:"btn-primary",onClick:Y=>{const pe=Z.querySelector("#tmpl-name").value,re=Z.querySelector("#tmpl-desc").value,we=Z.querySelector("#tmpl-tags").value.split(",").map($e=>$e.trim()).filter(Boolean);if(!pe){H("Template name is required","error");return}function ye($e){return $e.map(Se=>({...Se,id:r.generateId(),status:"Not Started",progress:0,subTasks:Se.subTasks||Se.subPhases?ye(Se.subTasks||Se.subPhases):[]}))}r.create("taskTemplates",{name:pe,description:re,tags:we,tasks:ye(t.tasks||t.phases||[]),createdAt:new Date().toISOString()}),H("Tasklist saved as template","success"),Y()}}]})}),(z=S.querySelector("#btn-import-tasklist"))==null||z.addEventListener("click",()=>{const Z=r.getAll("taskTemplates"),Y=r.getAll("jobs").filter(ye=>ye.id!==a&&(ye.tasks&&ye.tasks.length>0||ye.phases&&ye.phases.length>0));let pe="templates";const re=document.createElement("div");re.innerHTML=`
           <div class="tabs" id="import-tabs" style="margin-bottom:12px">
             <button class="tab active" data-tab="templates">Templates</button>
             <button class="tab" data-tab="jobs">Other Jobs</button>
           </div>
           <div class="toolbar-search" style="margin-bottom:12px">
             <span class="material-icons-outlined">search</span>
             <input type="text" id="import-search" placeholder="Search templates..." style="width:100%" />
           </div>
           <div id="import-content" style="max-height:400px; overflow-y:auto"></div>
         `;function we(ye=""){const $e=re.querySelector("#import-content"),Se=ye.toLowerCase();if(pe==="templates"){const Ce=Z.filter(qe=>qe.name.toLowerCase().includes(Se)||(qe.description||"").toLowerCase().includes(Se)||(qe.tags||[]).some(Re=>Re.toLowerCase().includes(Se)));$e.innerHTML=Ce.length?Ce.map(qe=>{const Re=qe.tasks||qe.phases||[];return`
               <div class="import-item" data-id="${qe.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                   <div style="font-weight:600; font-size:14px">${y(qe.name)}</div>
                   <div style="font-size:11px; color:var(--text-tertiary)">${Re.length} tasks</div>
                 </div>
                 <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${y(qe.description||"No description.")}</div>
                 <div style="display:flex; gap:4px; flex-wrap:wrap">
                   ${(qe.tags||[]).map(Ue=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${y(Ue)}</span>`).join("")}
                 </div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${ye}"</div>`}else{const Ce=Y.filter(qe=>qe.number.toLowerCase().includes(Se)||qe.title.toLowerCase().includes(Se)||qe.customerName.toLowerCase().includes(Se));$e.innerHTML=Ce.length?Ce.map(qe=>{const Re=qe.tasks||qe.phases||[];return`
               <div class="import-item" data-id="${qe.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
                 <div style="font-weight:600; font-size:14px; margin-bottom:2px">${y(qe.number)} - ${y(qe.title)}</div>
                 <div style="font-size:12px; color:var(--text-secondary)">${y(qe.customerName)} · ${Re.length} tasks</div>
               </div>
             `}).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${ye}"</div>`}$e.querySelectorAll(".import-item").forEach(Ce=>{Ce.addEventListener("click",()=>{var Me;const qe=Ce.dataset.id,Re=Ce.dataset.type,Ue=r.getAll("taskTemplates"),Fe=r.getAll("jobs"),Te=Re==="template"?Ue.find(he=>String(he.id)===String(qe)):Fe.find(he=>String(he.id)===String(qe));if(Te&&(Te.tasks||Te.phases)){if(confirm(`Replace current tasklist with "${Te.name||Te.number}"?`)){let he=function(Ie){return Ie.map(Ae=>({...Ae,id:r.generateId(),status:"Not Started",progress:0,subTasks:Ae.subTasks||Ae.subPhases?he(Ae.subTasks||Ae.subPhases):[]}))};var Oe=he;t.tasks=he(Te.tasks||Te.phases),m=[0],n=[],H(`Imported ${Te.name||Te.number}`,"success"),d(),(Me=document.querySelector(".modal-overlay"))==null||Me.remove()}}else H("Could not find source data","error")})})}we(),re.querySelectorAll(".tab").forEach(ye=>{ye.addEventListener("click",()=>{re.querySelectorAll(".tab").forEach($e=>$e.classList.remove("active")),ye.classList.add("active"),pe=ye.dataset.tab,re.querySelector("#import-search").placeholder=pe==="templates"?"Search templates...":"Search jobs...",we(re.querySelector("#import-search").value)})}),re.querySelector("#import-search").addEventListener("input",ye=>{we(ye.target.value)}),xe({title:"Import Tasklist",content:re,actions:[{label:"Cancel",className:"btn-secondary",onClick:ye=>ye()}]})}),S.querySelectorAll(".btn-duplicate-task").forEach(Z=>{Z.addEventListener("click",Y=>{const pe=Y.currentTarget.dataset.path.split("-").map(Number),re=U(t.tasks,pe);function we($e,Se){return{...$e,id:r.generateId(),name:$e.name+(Se?" (Copy)":""),progress:0,status:"Not Started",subTasks:$e.subTasks?$e.subTasks.map(Ce=>we(Ce,!1)):[]}}const ye=we(re,!0);if(pe.length===1)t.tasks.splice(pe[0]+1,0,ye);else{const $e=pe.slice(0,-1);U(t.tasks,$e).subTasks.splice(pe[pe.length-1]+1,0,ye),J(t.tasks,$e)}d()})}),S.querySelectorAll(".btn-book-time").forEach(Z=>{Z.addEventListener("click",Y=>{const pe=Y.currentTarget.dataset.path.split("-").map(Number),re=U(t.tasks,pe),we=JSON.parse(localStorage.getItem("currentUser")||"{}"),ye=r.getAll("timesheets").filter(Te=>Te.jobId===a),$e=r.getAll("technicians"),Se=new Date,Ce=Te=>Te.toString().padStart(2,"0"),qe=`${Se.getFullYear()}-${Ce(Se.getMonth()+1)}-${Ce(Se.getDate())}`,Re=`${qe}T09:00`,Ue=`${qe}T10:00`,Fe=document.createElement("div");Fe.innerHTML=`
            <div style="margin-bottom:var(--space-lg)">
              <h5 style="margin-bottom:8px">All Logged Time for this Job (${ye.reduce((Te,Oe)=>Te+(Oe.hours||0),0).toFixed(2)} hrs)</h5>
              <div style="max-height:150px;overflow-y:auto;background:var(--content-bg);border-radius:4px;border:1px solid var(--border-color)">
                <table class="data-table" style="font-size:13px">
                  <thead><tr><th>Date</th><th>Tech</th><th>Task</th><th>Hours</th></tr></thead>
                  <tbody>
                    ${ye.length?ye.map(Te=>`
                      <tr>
                        <td>${Te.startTime?new Date(Te.startTime).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):new Date(Te.date).toLocaleDateString()}</td>
                        <td>${y(Te.technicianName)}</td>
                        <td>${y(Te.taskName||Te.phaseName||"—")}</td>
                        <td style="font-weight:600">${Te.hours}</td>
                      </tr>
                    `).join(""):'<tr><td colspan="4" style="text-align:center" class="text-secondary">No time logged</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Time *</label>
                <input type="datetime-local" class="form-input" id="bt-start" value="${Re}" />
              </div>
              <div class="form-group">
                <label class="form-label">Finish Time *</label>
                <input type="datetime-local" class="form-input" id="bt-finish" value="${Ue}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="bt-tech">
                <option value="">Select tech...</option>
                ${$e.map(Te=>`<option value="${Te.id}" ${Te.name===we.name?"selected":""}>${Te.name}</option>`).join("")}
              </select>
            </div>
            `,xe({title:"Book Time: "+y(re.name),size:"modal-70",content:Fe,actions:[{label:"Cancel",className:"btn-secondary",onClick:Te=>Te()},{label:"Log Time",className:"btn-primary",onClick:Te=>{const Oe=document.getElementById("bt-start").value,Me=document.getElementById("bt-finish").value,he=document.getElementById("bt-tech").value,Ie=re.name;if(!Oe||!Me||!he){H("Please fill all required fields","error");return}const Ae=new Date(Oe),Be=new Date(Me);if(Be<=Ae){H("Finish time must be after start time","error");return}const Je=Math.round((Be-Ae)/36e5*100)/100,bt=$e.find(rt=>rt.id===he);r.create("timesheets",{jobId:a,jobNumber:t.number,taskId:re.id,taskPath:pe.join("-"),taskName:re.name,phaseId:re.id,phaseName:re.name,technicianId:he,technicianName:bt.name,date:Oe.split("T")[0],startTime:Oe,finishTime:Me,description:Ie,hours:Je,status:"Pending"}),H("Time booked successfully","success"),d(),Te()}}]})})})}else if(l==="costs"){let _t=function(){const de=(t.materials||[]).reduce((fe,ge)=>fe+ge.quantity*(ge.unitCost||0),0),ie=parseFloat(S.querySelector("#inp-material-cost").value)||0,ue=de+ie;S.querySelector("#sum-mat").textContent="$"+ue.toFixed(2),S.querySelector("#sum-total").textContent="$"+(U+ue).toFixed(2)};var _=_t;if(!t.materials){const ie=r.getAll("quotes").filter(ue=>ue.jobId===a||t.quoteId===ue.id).find(ue=>ue.status==="Accepted")||r.getById("quotes",t.quoteId);if(ie){const ue=[];ie.sections&&Array.isArray(ie.sections)&&ie.sections.forEach(fe=>{fe.lineItems&&Array.isArray(fe.lineItems)&&ue.push(...fe.lineItems)}),ie.lineItems&&Array.isArray(ie.lineItems)&&ue.push(...ie.lineItems),ue.length>0&&(t.materials=[],ue.forEach(fe=>{if(fe.type==="material"){const ge=r.getAll("stock").find(be=>be.name===fe.description);t.materials.push({stockId:ge?ge.id:null,name:fe.description||"Unknown Material",quantity:fe.qty||1,unitCost:ge&&(ge.costPrice||ge.unitPrice)||0,fromQuote:!0})}}),r.update("jobs",a,{materials:t.materials}))}}t.materials||(t.materials=[]);const G=r.getAll("timesheets").filter(de=>de.jobId===a),ee=r.getAll("technicians"),ae={};let W=0,U=0;G.forEach(de=>{if(!ae[de.technicianId]){const ie=ee.find(ue=>ue.id===de.technicianId);ae[de.technicianId]={id:de.technicianId,name:de.technicianName||(ie?ie.name:"Unknown Tech"),hours:0,rate:ie&&(ie.payRate||ie.hourlyRate)||45}}ae[de.technicianId].hours+=de.hours||0});const Q=Object.values(ae);Q.forEach(de=>{W+=de.hours,U+=de.hours*de.rate});const J=r.getAll("assetUsage").filter(de=>de.jobId===a),le=r.getAll("assets");let ve=0;const Z=J.map(de=>{const ie=le.find(ge=>ge.id===de.assetId),ue=de.recoveryRate||(ie?ie.recoveryRate:0)||0,fe=de.hours*ue;return ve+=fe,{...de,rate:ue,cost:fe}}),Y=t.materials.reduce((de,ie)=>de+ie.quantity*(ie.unitCost||0),0),pe=parseFloat(t.additionalMaterialCost||0),re=Y+pe,we=r.getSettings(),ye=La(t.materials,we),$e=Qt(pe,we),Se=ye+(pe>0?$e-pe:0)+pe;(t.laborCost!==U||t.estimatedHours!==W||t.materialCost!==re||t.assetCost!==ve)&&(t.laborCost=U,t.estimatedHours=W,t.materialCost=re,t.assetCost=ve,r.update("jobs",a,{laborCost:U,estimatedHours:W,materialCost:re,assetCost:ve}));const Ce=we.laborRates.find(de=>de.id===t.laborRateProfileId)||we.laborRates.find(de=>de.isDefault),qe=W*(Ce?Ce.rate:85),Re=Ce&&Ce.minCallOutFee||0,Ue=Math.max(qe,Re),Fe=Ue+Se,Te=U+re+ve,Oe=Fe-Te,Me=Fe>0?Oe/Fe*100:0,Ie=r.getAll("quotes").filter(de=>de.jobId===a||t.quoteId===de.id||de.number===t.quoteNumber).find(de=>de.status==="Accepted")||(t.quoteId?r.getById("quotes",t.quoteId):null);let Ae=0,Be=0;if(Ie){const de=[];Ie.sections&&Array.isArray(Ie.sections)&&Ie.sections.forEach(ie=>{ie.lineItems&&Array.isArray(ie.lineItems)&&de.push(...ie.lineItems)}),Ie.lineItems&&Array.isArray(Ie.lineItems)&&de.push(...Ie.lineItems),de.forEach(ie=>{const ue=parseFloat(ie.total)||(parseFloat(ie.qty)||0)*(parseFloat(ie.rate)||0);ie.type==="labor"?Ae+=ue:ie.type==="material"&&(Be+=ue)})}Ae===0&&Be===0&&(Ae=parseFloat(t.estimatedLaborCost||t.laborCost||0),Be=parseFloat(t.estimatedMaterialCost||t.materialCost||0));const Je=Ae+Be,bt=U,rt=re,ft=ve,Ke=bt+rt+ft,lt=bt-Ae,pt=rt-Be,We=Ke-Je;S.innerHTML=`
        <div style="display:flex; flex-direction:column; gap:var(--space-lg)">
          
          <!-- Budget Deviation Tracker Card -->
          <div class="card" style="border: 1.5px solid ${We>0?"var(--color-danger)":"var(--color-success)"}">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; background:${We>0?"rgba(239,68,68,0.02)":"rgba(16,185,129,0.02)"}; padding: 12px 16px">
              <h4 style="margin:0; color:${We>0?"var(--color-danger)":"var(--color-success-dark)"}; display:flex; align-items:center; gap:8px">
                <span class="material-icons-outlined" style="font-size:20px">analytics</span>
                Budget Deviation & Costs Tracker
              </h4>
              <span class="badge ${We>0?"badge-danger":"badge-success"}" style="font-weight:700">
                ${We>0?"Over Budget":"Under Budget"}
              </span>
            </div>
            <div class="card-body" style="padding: 16px">
              ${We>0?`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(239,68,68,0.08); border-left:4px solid var(--color-danger); padding:12px; border-radius:4px; margin-bottom:16px; color:#c53030">
                  <span class="material-icons-outlined" style="font-size:20px">warning</span>
                  <div style="font-size:13px">
                    <strong>Budget Overrun Detected</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Actual expenses have exceeded the quoted estimation by <strong>$${We.toFixed(2)}</strong>. Customer approval may be required for additional variations.</div>
                  </div>
                </div>
              `:`
                <div style="display:flex; align-items:center; gap:12px; background:rgba(16,185,129,0.08); border-left:4px solid var(--color-success); padding:12px; border-radius:4px; margin-bottom:16px; color:#2f855a">
                  <span class="material-icons-outlined" style="font-size:20px">check_circle</span>
                  <div style="font-size:13px">
                    <strong>Expenses Within Quoted Budget</strong>
                    <div style="font-size:12px; margin-top:2px; opacity:0.9">Current expenses are within the original quoted estimation. Remaining budget margin: <strong>$${Math.abs(We).toFixed(2)}</strong>.</div>
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
                    <td style="text-align:right; color:var(--text-secondary)">$${Ae.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${bt.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${lt>0?"var(--color-danger)":lt<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${lt>0?`+$${lt.toFixed(2)}`:lt<0?`-$${Math.abs(lt).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight:600">Material Costs</td>
                    <td style="text-align:right; color:var(--text-secondary)">$${Be.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600">$${rt.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600; color:${pt>0?"var(--color-danger)":pt<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${pt>0?`+$${pt.toFixed(2)}`:pt<0?`-$${Math.abs(pt).toFixed(2)}`:"$0.00"}
                    </td>
                  </tr>
                  ${ft>0?`
                    <tr>
                      <td style="font-weight:600">Asset Recovery (Van/Tools)</td>
                      <td style="text-align:right; color:var(--text-secondary)">$0.00</td>
                      <td style="text-align:right; font-weight:600">$${ft.toFixed(2)}</td>
                      <td style="text-align:right; font-weight:600; color:var(--color-danger)">+$${ft.toFixed(2)}</td>
                    </tr>
                  `:""}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-color); font-weight:700">
                    <td>Total Job Expenses</td>
                    <td style="text-align:right">$${Je.toFixed(2)}</td>
                    <td style="text-align:right; color:var(--color-primary)">$${Ke.toFixed(2)}</td>
                    <td style="text-align:right; color:${We>0?"var(--color-danger)":We<0?"var(--color-success-dark)":"var(--text-tertiary)"}">
                      ${We>0?`+$${We.toFixed(2)}`:We<0?`-$${Math.abs(We).toFixed(2)}`:"$0.00"}
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
                  ${Q.map(de=>`
                    <tr>
                      <td>${y(de.name)}</td>
                      <td style="font-weight:600">${de.hours.toFixed(2)}</td>
                      <td>$${(de.payRate||de.rate).toFixed(2)}</td>
                      <td style="font-weight:600">$${(de.hours*(de.payRate||de.rate)).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${Q.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No time logged yet.</td></tr>':""}
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
                  ${Z.map(de=>`
                    <tr>
                      <td>${y(de.assetName)}</td>
                      <td style="font-weight:600">${de.hours.toFixed(2)}</td>
                      <td>$${de.rate.toFixed(2)}</td>
                      <td style="font-weight:600">$${de.cost.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                  ${Z.length===0?'<tr><td colspan="4" class="text-secondary" style="text-align:center">No asset usage recorded.</td></tr>':""}
                </tbody>
                ${Z.length>0?`
                  <tfoot>
                    <tr style="border-top:2px solid var(--border-color)">
                      <td colspan="3" style="text-align:right; font-weight:700">Total Asset Recovery:</td>
                      <td style="font-weight:700; color:var(--color-primary)">$${ve.toFixed(2)}</td>
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
                  ${we.laborRates.map(de=>`<option value="${de.id}" ${Ce.id===de.id?"selected":""}>${de.name} ($${de.rate.toFixed(2)}/hr)</option>`).join("")}
                </select>
                <div style="margin-top:12px; padding:12px; background:var(--bg-color); border-radius:6px; border:1px solid var(--border-color); font-size:13px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Charge-out Rate:</span>
                    <span class="font-medium">$${Ce.rate.toFixed(2)}/hr</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                    <span class="text-secondary">Min Call-out Fee:</span>
                    <span class="font-medium">$${(Ce.minCallOutFee||0).toFixed(2)}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); margin-top:8px; padding-top:8px">
                    <span class="text-secondary">Billable Labor:</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${Ue.toFixed(2)}</span>
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
                        <div class="font-medium">${y(de.name)}</div>
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
                    ${g()}
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
                  <span class="text-secondary">Logged Hours</span><span class="font-medium">${W.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Actual Internal Cost</span><span class="font-medium">$${(U+re).toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">
                  <span class="text-secondary">Total Billable Amount</span><span class="font-medium" style="color:var(--color-primary)">$${Fe.toFixed(2)}</span>
                </div>
                <div style="margin-top:16px; padding:16px; border-radius:8px; background:${Oe>=0?"var(--color-success-bg)":"var(--color-danger-bg)"}; color:${Oe>=0?"var(--color-success)":"var(--color-danger)"}; display:flex; flex-direction:column; align-items:center; gap:4px">
                  <div style="font-size:12px; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px">Est. Profit / Loss</div>
                  <div style="font-size:24px; font-weight:700">$${Oe.toFixed(2)}</div>
                  <div style="font-size:14px; font-weight:600">${Me.toFixed(1)}% Margin</div>
                </div>
              </div>
              <div class="card-footer">
                <button class="btn btn-primary" id="btn-save-costs" style="width:100%"><span class="material-icons-outlined">save</span> Save Additional Costs</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      `,(M=S.querySelector("#inp-labor-profile"))==null||M.addEventListener("change",de=>{t.laborRateProfileId=de.target.value,r.update("jobs",a,{laborRateProfileId:t.laborRateProfileId}),d()}),S.addEventListener("click",de=>{const ie=de.target.closest(".btn-remove-mat");if(ie){const ue=parseInt(ie.dataset.index);t.materials.splice(ue,1),d()}}),(E=S.querySelector("#btn-refresh-materials"))==null||E.addEventListener("click",()=>{const ie=r.getAll("quotes").filter(be=>be.jobId===a||t.quoteId===be.id).find(be=>be.status==="Accepted")||r.getById("quotes",t.quoteId);if(!ie){H("No linked accepted quote found.","error");return}const ue=(t.materials||[]).filter(be=>!be.fromQuote),fe=[],ge=[];ie.sections&&Array.isArray(ie.sections)&&ie.sections.forEach(be=>{be.lineItems&&Array.isArray(be.lineItems)&&ge.push(...be.lineItems)}),ie.lineItems&&Array.isArray(ie.lineItems)&&ge.push(...ie.lineItems),ge.forEach(be=>{if(be.type==="material"){const Ee=r.getAll("stock").find(Ne=>Ne.name===be.description);fe.push({stockId:Ee?Ee.id:null,name:be.description||"Unknown Material",quantity:be.qty||1,unitCost:Ee&&(Ee.costPrice||Ee.unitPrice)||0,fromQuote:!0})}}),t.materials=[...fe,...ue],r.update("jobs",a,{materials:t.materials}),H("Materials refreshed from Quote","success"),d()}),(j=S.querySelector("#inp-material-cost"))==null||j.addEventListener("input",_t),(F=S.querySelector("#btn-add-material"))==null||F.addEventListener("click",()=>{var Ge;const de=S.querySelector("#mat-select"),ie=parseInt(S.querySelector("#mat-qty").value)||1,ue=de.value;if(!ue)return;const[fe,ge]=ue.split("::"),be=r.getById("stock",fe);if(!be)return;let Ee=0,Ne=null;if(be.locations&&Array.isArray(be.locations)?(Ne=be.locations.find(je=>je.location===ge),Ee=Ne?Ne.quantity:0):Ee=be.quantity||0,Ee<ie){H(`Not enough stock at ${ge}. Available: ${Ee}`,"error");return}Ne?(Ne.quantity-=ie,be.locations=be.locations.filter(je=>je.quantity>0),be.quantity=be.locations.reduce((je,ot)=>je+ot.quantity,0),be.location=((Ge=be.locations[0])==null?void 0:Ge.location)||"Main Warehouse"):be.quantity-=ie,r.update("stock",fe,be),o=null,t.materials.push({stockId:be.id,name:`${be.name} (${ge})`,quantity:ie,unitCost:be.costPrice||be.unitPrice||0,fromQuote:!1}),H(`Added ${ie}x ${be.name} from ${ge}`,"success"),d()}),(R=S.querySelector("#btn-save-costs"))==null||R.addEventListener("click",()=>{const de=parseFloat(S.querySelector("#inp-material-cost").value)||0,ue=(t.materials||[]).reduce((fe,ge)=>fe+ge.quantity*(ge.unitCost||0),0)+de;t.materialCost=ue,t.additionalMaterialCost=de,r.update("jobs",a,{materials:t.materials,materialCost:ue,additionalMaterialCost:de}),H("Additional costs saved","success"),d()})}else if(l==="quotes"){const G=r.getAll("quotes").filter(ee=>ee.jobId===a||t.quoteId===ee.id);S.innerHTML=`
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
                ${G.length?G.map(ee=>`
                  <tr>
                    <td><a href="#/quotes/${ee.id}" style="color:var(--color-primary);text-decoration:none;font-weight:500">${y(ee.number)}</a></td>
                    <td>${y(ee.title||"Untitled Quote")}</td>
                    <td><span class="badge ${ee.status==="Accepted"?"badge-success":ee.status==="Declined"?"badge-danger":ee.status==="Sent"?"badge-info":"badge-neutral"}">${y(ee.status)}</span></td>
                    <td style="font-weight:600">$${(ee.total||0).toFixed(2)}</td>
                    <td style="text-align:right">
                      <a href="#/quotes/${ee.id}" class="btn btn-secondary btn-sm">View</a>
                    </td>
                  </tr>
                `).join(""):'<tr><td colspan="5" class="text-secondary" style="text-align:center">No quotes linked to this job.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(B=S.querySelector("#btn-new-quote"))==null||B.addEventListener("click",()=>{const ee=r.create("quotes",{customerId:t.customerId,customerName:t.customerName,title:t.title,jobId:t.id,status:"Draft",version:1,sections:[{id:r.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,number:"Q-"+Date.now().toString().slice(-7)});H("Draft quote created","success",{link:`/quotes/${ee.id}`}),X.navigate("/quotes/"+ee.id)})}else if(l==="activity")t.activityLog||(t.activityLog=[]),t.activityLog=t.activityLog.map(G=>G.type==="note"||G.type==="attachment"?{id:G.id,type:"combined",date:G.date,content:G.type==="note"?G.content:"",files:G.type==="attachment"?[G.file]:[]}:G),S.innerHTML=`
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
            
            <div id="staged-files-container" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: ${f.length?"16px":"0"}">
              ${f.map((G,ee)=>`
                <div style="display:flex;align-items:center;background:var(--content-bg);padding:4px 8px;border-radius:4px;font-size:12px;border:1px solid var(--border-color)">
                   <span class="truncate" style="max-width:100px">${y(G.name)}</span>
                   <span class="material-icons-outlined text-danger btn-remove-staged" data-idx="${ee}" style="font-size:14px;cursor:pointer;margin-left:8px">close</span>
                </div>
              `).join("")}
            </div>
            
            <div class="activity-feed" style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
              ${t.activityLog.length?t.activityLog.map((G,ee)=>`
                <div style="display:flex;gap:12px">
                  <div style="width:36px;height:36px;border-radius:50%;background:var(--content-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-secondary)">
                    <span class="material-icons-outlined" style="font-size:18px">${G.files&&G.files.length?"attachment":"chat_bubble_outline"}</span>
                  </div>
                  <div style="flex:1;background:var(--content-bg);padding:12px;border-radius:var(--border-radius);position:relative;" class="activity-log-item" data-expanded="false">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;align-items:center;">
                      <div style="display:flex;gap:6px;align-items:center;">
                        <span style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-primary)">${y(G.author||"System")}</span>
                        <span class="text-tertiary" style="font-size:10px">•</span>
                        <span class="text-secondary" style="font-size:var(--font-size-xs)">${new Date(G.date).toLocaleString()}</span>
                      </div>
                      <button class="btn btn-icon btn-sm btn-ghost btn-delete-activity" data-id="${y(G.id)}" style="position:absolute;top:4px;right:4px;padding:2px;min-height:24px;min-width:24px;z-index:2"><span class="material-icons-outlined" style="font-size:14px">close</span></button>
                    </div>
                    <div class="activity-content-wrapper" style="max-height: 200px; overflow: hidden; position: relative; transition: max-height 0.3s ease;">
                      ${G.content?`<div style="font-size:var(--font-size-sm);white-space:pre-wrap;margin-bottom:8px">${y(G.content)}</div>`:""}
                      ${G.files&&G.files.length?`
                        <div style="display:flex; flex-wrap:wrap; gap:8px">
                          ${G.files.map(ae=>`
                            <div style="display:flex;align-items:center;gap:12px;border:1px solid var(--border-color);padding:8px;border-radius:4px;background:var(--card-bg);width:fit-content;max-width:100%">
                               ${ae.type&&ae.type.startsWith("image/")?`<div style="width:40px;height:40px;background:url('${y(ae.data)}') center/cover;border-radius:4px"></div>`:'<span class="material-icons-outlined" style="font-size:32px;color:var(--text-tertiary)">description</span>'}
                               <div style="overflow:hidden">
                                 <div class="truncate font-medium" style="font-size:var(--font-size-sm);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px" title="${y(ae.name)}">${y(ae.name)}</div>
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
      `,setTimeout(()=>{S.querySelectorAll(".activity-log-item").forEach(G=>{const ee=G.querySelector(".activity-content-wrapper"),ae=G.querySelector(".expand-overlay");ee&&ee.scrollHeight>200&&(ae.style.display="flex",G.style.paddingBottom="32px",ae.addEventListener("click",()=>{G.dataset.expanded==="false"?(ee.style.maxHeight=ee.scrollHeight+"px",ae.style.background="transparent",ae.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Collapse</span>',G.dataset.expanded="true"):(ee.style.maxHeight="200px",ae.style.background="linear-gradient(transparent, var(--content-bg))",ae.innerHTML='<span class="text-primary font-medium" style="font-size:12px">Expand to view</span>',G.dataset.expanded="false")}))})},0),S.querySelectorAll(".btn-remove-staged").forEach(G=>{G.addEventListener("click",ee=>{const ae=parseInt(ee.currentTarget.dataset.idx);f.splice(ae,1),d()})}),(oe=S.querySelector("#btn-add-note"))==null||oe.addEventListener("click",()=>{const G=S.querySelector("#new-note-input").value.trim();if(!G&&!f.length)return;const ee=JSON.parse(localStorage.getItem("currentUser")||"{}");t.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:G,files:[...f],date:new Date().toISOString(),author:ee.name||"Unknown User"}),r.update("jobs",a,{activityLog:t.activityLog}),f=[],d()}),(V=S.querySelector("#upload-attachment"))==null||V.addEventListener("change",G=>{const ee=Array.from(G.target.files);if(!ee.length)return;let ae=0;ee.forEach(W=>{const U=new FileReader;U.onload=Q=>{f.push({name:W.name,size:W.size,type:W.type,data:Q.target.result}),ae++,ae===ee.length&&d()},U.readAsDataURL(W)})}),S.querySelectorAll(".btn-delete-activity").forEach(G=>{G.addEventListener("click",()=>{t.activityLog=t.activityLog.filter(ee=>ee.id!==G.dataset.id),r.update("jobs",a,{activityLog:t.activityLog}),d()})});else if(l==="timesheets"){const G=r.getAll("timesheets").filter(U=>U.jobId===a),ee=G.reduce((U,Q)=>U+(Q.hours||0),0),ae=r.getAll("technicians"),W=JSON.parse(localStorage.getItem("currentUser")||"{}");S.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Timesheets (${ee} hrs total)</h4>
            <button class="btn btn-sm btn-primary" id="btn-log-time-tab"><span class="material-icons-outlined" style="font-size:16px;">add_task</span> Log Time</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Technician</th><th>Task</th><th>Description</th><th style="text-align:right">Hours</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
              <tbody>
                      ${G.length?G.map(U=>{const Q=String(U.technicianId)===String(W.id),J=["admin","manager","office"].includes(W.role)||Q&&U.status!=="Approved",le=["admin","manager","office"].includes(W.role)||Q&&U.status!=="Approved";return`
                  <tr>
                    <td>${new Date(U.date).toLocaleDateString()}</td>
                    <td>${y(U.technicianName)}</td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${y(U.taskName||"—")}</span></td>
                    <td class="text-secondary">${y(U.description||"—")}</td>
                    <td style="text-align:right;font-weight:600">${U.hours}</td>
                    <td><span class="badge ${U.status==="Approved"?"badge-success":U.status==="Rejected"?"badge-danger":"badge-warning"}">${U.status}</span></td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${J?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-edit-ts-job" data-id="${U.id}" title="Edit entry">
                            <span class="material-icons-outlined" style="font-size:16px">edit</span>
                          </button>
                        `:""}
                        ${le?`
                          <button class="btn btn-ghost btn-sm btn-icon btn-delete-ts-job" data-id="${U.id}" title="Delete entry" style="color:var(--color-danger)">
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
      `,S.querySelectorAll(".btn-edit-ts-job").forEach(U=>{U.addEventListener("click",()=>{const Q=U.dataset.id;ja(Q,d)})}),S.querySelectorAll(".btn-delete-ts-job").forEach(U=>{U.addEventListener("click",()=>{const Q=U.dataset.id,J=r.getById("timesheets",Q);J&&xe({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${J.hours} hrs</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:le=>le()},{label:"Delete",className:"btn-danger",onClick:le=>{r.delete("timesheets",Q),H("Timesheet entry deleted successfully","success"),le(),d()}}]})})}),(P=S.querySelector("#btn-log-time-tab"))==null||P.addEventListener("click",()=>{const U=JSON.parse(localStorage.getItem("currentUser")||"{}"),Q=new Date,J=re=>re.toString().padStart(2,"0"),le=`${Q.getFullYear()}-${J(Q.getMonth()+1)}-${J(Q.getDate())}`;function ve(re,we=[],ye=[]){let $e=[];return re&&re.forEach((Se,Ce)=>{const qe=[...we,Ce].join("-"),Re=[...ye,Se.name].join(" > ");$e.push({path:qe,name:Re,isLeaf:!Se.subTasks||Se.subTasks.length===0}),Se.subTasks&&($e=$e.concat(ve(Se.subTasks,[...we,Ce],[...ye,Se.name])))}),$e}const Y=ve(t.tasks||[]).filter(re=>re.isLeaf),pe=document.createElement("div");pe.innerHTML=`
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-input" id="lt-date" value="${le}" />
            </div>
            <div class="form-group">
              <label class="form-label">Technician *</label>
              <select class="form-select" id="lt-tech" ${U.role==="technician"?"disabled":""}>
                <option value="">Select tech...</option>
                ${ae.map(re=>`<option value="${re.id}" ${re.name===U.name?"selected":""}>${re.name}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="grid-column: 1 / -1">
              <label class="form-label">Task *</label>
              <select class="form-select" id="lt-task" style="width:100%">
                <option value="">Select task...</option>
                ${Y.map(re=>`<option value="${re.path}">${y(re.name)}</option>`).join("")}
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
        `,He({title:"Log Time",content:pe.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:re=>re()},{label:"Save",className:"btn-primary",onClick:re=>{const we=document.querySelector(".drawer-overlay"),ye=we.querySelector("#lt-date").value,$e=we.querySelector("#lt-tech").value,Se=we.querySelector("#lt-task").value,Ce=parseFloat(we.querySelector("#lt-hours").value),qe=we.querySelector("#lt-desc").value;if(!ye||!$e||isNaN(Ce)||!Se){H("Please fill all required fields, including the task","error");return}const Re=ae.find(Te=>Te.id===$e),Ue=Y.find(Te=>Te.path===Se),Fe=Ue?Ue.name:"";r.create("timesheets",{jobId:a,jobNumber:t.number,taskId:Se,taskName:Fe,technicianId:$e,technicianName:Re.name,date:ye,hours:Ce,description:qe,status:"Pending"}),H("Time logged successfully","success"),d(),re()}}]})})}else if(l==="forms")t.forms=t.forms||[],S.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Digital Forms / Checklists</h4>
            <button class="btn btn-sm btn-primary" id="btn-add-form"><span class="material-icons-outlined" style="font-size:16px;">post_add</span> Complete Form</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>Form Type</th><th>Completed Date</th><th>Completed By</th></tr></thead>
              <tbody>
                ${t.forms.length?t.forms.map(G=>`
                  <tr>
                    <td class="font-medium">${y(G.type)}</td>
                    <td>${new Date(G.date).toLocaleString()}</td>
                    <td>${y(G.completedBy||"System")}</td>
                  </tr>
                `).join(""):'<tr><td colspan="3" style="text-align:center;padding:20px" class="text-secondary">No forms completed yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(te=S.querySelector("#btn-add-form"))==null||te.addEventListener("click",()=>{const G=document.createElement("div");G.innerHTML=`
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
          `,He({title:"Complete Form",content:G.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:ee=>ee()},{label:"Submit",className:"btn-primary",onClick:ee=>{const ae=document.querySelector(".drawer-overlay");t.forms.push({type:ae.querySelector("#new-form-type").value,notes:ae.querySelector("#new-form-notes").value,date:new Date().toISOString(),completedBy:"Current User"}),r.update("jobs",a,{forms:t.forms}),H("Form submitted successfully","success"),d(),ee()}}]})});else if(l==="pos"){const G=r.getAll("purchaseOrders").filter(ee=>ee.jobId===a);S.innerHTML=`
        <div class="card" style="margin-bottom:var(--space-lg)">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0">Purchase Orders</h4>
            <button class="btn btn-sm btn-primary" id="btn-raise-po"><span class="material-icons-outlined" style="font-size:16px;">add_shopping_cart</span> Raise PO</button>
          </div>
          <div class="card-body" style="padding:0">
            <table class="data-table">
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Issue Date</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                ${G.length?G.map(ee=>`
                  <tr>
                    <td><a href="#/purchase-orders/${y(ee.id)}">${y(ee.number)}</a></td>
                    <td>${y(ee.supplierName||"—")}</td>
                    <td>${ee.issueDate?new Date(ee.issueDate).toLocaleDateString():"—"}</td>
                    <td style="font-weight:600;">$${(ee.total||0).toFixed(2)}</td>
                    <td><span class="badge ${ee.status==="Received"?"badge-success":ee.status==="Draft"?"badge-neutral":ee.status==="Cancelled"?"badge-danger":"badge-primary"}">${ee.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="5" style="text-align:center;padding:20px" class="text-secondary">No purchase orders linked to this job</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(ce=S.querySelector("#btn-raise-po"))==null||ce.addEventListener("click",()=>{const ae=(r.getAll("suppliers")||[]).filter(Q=>Q.active!==!1),W=r.getAll("stock"),U=document.createElement("div");U.innerHTML=`
          <div class="form-group">
            <label class="form-label">Supplier *</label>
            <select class="form-select" id="po-supplier">
              <option value="">Select supplier...</option>
              ${ae.map(Q=>`<option value="${y(Q.name)}">${y(Q.name)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Part Required *</label>
            <select class="form-select" id="po-part">
              <option value="">Select or type...</option>
              ${W.map(Q=>`<option value="${Q.id}">${Q.name} - $${Q.costPrice||0}</option>`).join("")}
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
        `,He({title:"Quick Purchase Order",content:U.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:Q=>Q()},{label:"Create PO",className:"btn-primary",onClick:Q=>{const J=document.querySelector(".drawer-overlay"),le=J.querySelector("#po-supplier").value,ve=J.querySelector("#po-part").value,Z=parseInt(J.querySelector("#po-qty").value)||1,Y=J.querySelector("#po-date").value;if(!le||!ve){H("Supplier and Part are required","error");return}const pe=W.find(we=>we.id===ve),re=r.create("purchaseOrders",{number:`PO-${Date.now().toString().slice(-5)}`,jobId:a,supplierName:le,issueDate:new Date().toISOString(),expectedDate:Y,status:"Draft",items:[{stockId:ve,name:pe.name,quantity:Z,unitCost:pe.costPrice||0,total:(pe.costPrice||0)*Z}],total:(pe.costPrice||0)*Z});H("Quick PO Created","success",{link:`/purchase-orders/${re.id}`}),d(),Q()}}]})})}else if(l==="invoices"){let ee=function(W,U,Q){let J="",le="";if(t.quoteId){const Z=r.getById("quotes",t.quoteId);Z&&(J=Z.number,le=Z.id)}const ve=r.create("invoices",{number:`INV-${Date.now().toString().slice(-6)}`,invoiceType:W,jobId:a,jobNumber:t.number,customerId:t.customerId,customerName:t.customerName,contactName:t.contactName,status:"Draft",sections:U,originalQuoteId:le,originalQuoteNumber:J,originalSubtotal:Q,subtotal:Q,tax:Q*.1,total:Q*1.1,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString()});r.update("jobs",a,{status:"Invoiced"}),H(`${W} Invoice created`,"success"),X.navigate(`/invoices/${ve.id}`)},ae=function(){let W=[],U=0;if(t.quoteId){const Q=r.getById("quotes",t.quoteId);Q&&Q.sections&&Q.sections.length>0?(W=JSON.parse(JSON.stringify(Q.sections)),U=Q.subtotal||0):Q&&Q.lineItems&&(W=[{id:r.generateId(),name:"Main Phase",lineItems:JSON.parse(JSON.stringify(Q.lineItems))}],U=Q.subtotal||0)}if(W.length===0){const Q=t.tasks||t.phases||[];if(Q.length>0){W=Q.map(ve=>({id:r.generateId(),name:ve.name,lineItems:[{description:`${ve.name} - Labor & Materials`,type:"other",qty:1,rate:0,total:0}],subtotal:0}));const J=t.laborCost||0,le=t.materialCost||0;(J>0||le>0)&&(W[0].lineItems.push({description:"Estimated Job Labor",type:"labor",qty:1,rate:J,total:J}),W[0].lineItems.push({description:"Estimated Job Materials",type:"material",qty:1,rate:le,total:le}))}else{const J=t.laborCost||0,le=t.materialCost||0;W=[{id:r.generateId(),name:"General Items",lineItems:[{description:`${t.title} - Labor`,type:"labor",qty:1,rate:J,total:J},{description:`${t.title} - Materials`,type:"material",qty:1,rate:le,total:le}]}]}U=W.reduce((J,le)=>J+le.lineItems.reduce((ve,Z)=>ve+(Z.total||0),0),0)}return{sections:W,subtotal:U}};var A=ee,q=ae;const G=r.getAll("invoices").filter(W=>W.jobId===a);S.innerHTML=`
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
                ${G.length?G.map(W=>`
                  <tr>
                    <td><a href="#/invoices/${y(W.id)}">${y(W.number)}</a></td>
                    <td><span class="badge badge-neutral">${y(W.invoiceType||"Standard")}</span></td>
                    <td>${W.issueDate?W.issueDate.split("T")[0]:"—"}</td>
                    <td>${W.dueDate?W.dueDate.split("T")[0]:"—"}</td>
                    <td style="font-weight:600;">$${(W.total||0).toFixed(2)}</td>
                    <td><span class="badge ${W.status==="Paid"?"badge-success":W.status==="Draft"?"badge-neutral":W.status==="Overdue"?"badge-danger":"badge-info"}">${W.status}</span></td>
                  </tr>
                `).join(""):'<tr><td colspan="6" style="text-align:center;padding:20px" class="text-secondary">No invoices created for this job yet</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `,(se=S.querySelector("#btn-create-standard-invoice"))==null||se.addEventListener("click",()=>{const{sections:W,subtotal:U}=ae();ee("Standard",W,U)}),(K=S.querySelector("#btn-create-deposit-invoice"))==null||K.addEventListener("click",()=>{const W=[{id:r.generateId(),name:"Deposit",lineItems:[{description:`Deposit for Job ${t.number}`,type:"other",qty:1,rate:0,total:0}],subtotal:0}];ee("Deposit",W,0)}),(ne=S.querySelector("#btn-create-progress-invoice"))==null||ne.addEventListener("click",()=>{const W=document.createElement("div");W.innerHTML=`
            <div class="form-group">
              <label class="form-label">Percentage Complete (%)</label>
              <input type="number" id="progress-percent" class="form-input" min="1" max="100" value="50" />
            </div>
          `,xe({title:"Create Progress Invoice",content:W,actions:[{label:"Cancel",className:"btn-secondary",onClick:U=>U()},{label:"Create",className:"btn-primary",onClick:U=>{const Q=parseFloat(document.getElementById("progress-percent").value)||0;if(Q<=0||Q>100){H("Enter a valid percentage (1-100)","error");return}const{subtotal:J}=ae(),le=J*(Q/100),ve=[{id:r.generateId(),name:`Progress Payment (${Q}%)`,lineItems:[{description:`Progress Payment (${Q}% of job)`,type:"other",qty:1,rate:le,total:le}],subtotal:le}];ee("Progress",ve,le),U()}}]})})}}function x(){var S,L;e.querySelectorAll(".tab").forEach(T=>{T.addEventListener("click",()=>{l=T.dataset.tab,e.querySelectorAll(".tab").forEach(I=>I.classList.remove("active")),T.classList.add("active"),d()})}),(S=e.querySelector("#btn-edit-job"))==null||S.addEventListener("click",()=>X.navigate(`/jobs/${a}/edit`)),(L=e.querySelector("#btn-delete-job"))==null||L.addEventListener("click",()=>{const T=document.createElement("div");T.innerHTML=`<p>Delete job <strong>${y(t.number)}</strong>?</p>`,xe({title:"Delete Job",content:T,actions:[{label:"Cancel",className:"btn-secondary",onClick:I=>I()},{label:"Delete",className:"btn-danger",onClick:I=>{r.delete("jobs",a),H("Job deleted","success"),I(),X.navigate("/jobs")}}]})})}i();function u(S,L){return`<div style="display:flex;gap:8px"><span style="width:120px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${S}</span><span>${L}</span></div>`}function b(S){const L=r.getAll("formInstances").filter(I=>I.jobId===a),T=r.getAll("formTemplates");S.innerHTML=`
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
              ${L.map(I=>{const _=T.find(w=>w.id===I.templateId),A=I.status==="Completed",q=I.submittedBy?r.getById("people",I.submittedBy):null;return`
                  <tr>
                    <td class="font-medium">${y((_==null?void 0:_.name)||"Unknown Form")}</td>
                    <td><span class="badge ${A?"badge-success":"badge-warning"}">${I.status}</span></td>
                    <td>${q?y(`${q.firstName} ${q.lastName}`):"—"}</td>
                    <td style="font-size:12px; color:var(--text-tertiary)">${I.submittedAt?new Date(I.submittedAt).toLocaleDateString():"—"}</td>
                    <td style="text-align:right">
                      <div style="display:flex; gap:4px; justify-content:flex-end">
                        <button class="btn ${A?"btn-secondary":"btn-primary"} btn-sm fill-form" data-id="${I.id}" title="${A?"View / Edit":"Fill Form"}">
                          <span class="material-icons-outlined" style="font-size:16px">${A?"visibility":"edit_note"}</span>
                        </button>
                        ${A?`
                          <button class="btn btn-secondary btn-icon btn-sm export-form" data-id="${I.id}" title="Export Options">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </button>
                          <button class="btn btn-secondary btn-icon btn-sm print-form" data-id="${I.id}" title="Print / PDF">
                            <span class="material-icons-outlined" style="font-size:18px">print</span>
                          </button>
                        `:""}
                        ${A?"":`<button class="btn btn-ghost btn-icon btn-sm remove-form-instance" data-id="${I.id}" style="color:var(--color-danger)" title="Remove Form"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>`}
                      </div>
                    </td>
                  </tr>
                `}).join("")}
              ${L.length?"":'<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-tertiary)">No forms attached to this job. Click "Attach Form" to add one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,S.querySelector("#btn-attach-form").addEventListener("click",()=>h()),S.querySelectorAll(".fill-form").forEach(I=>{I.addEventListener("click",()=>k(I.dataset.id))}),S.querySelectorAll(".remove-form-instance").forEach(I=>{I.addEventListener("click",()=>{if(confirm("Are you sure you want to remove this form from the job?")){const _=I.dataset.id,A=r.getAll("formInstances");r.save("formInstances",A.filter(q=>q.id!==_)),b(S)}})}),S.querySelectorAll(".export-form").forEach(I=>{I.addEventListener("click",()=>{var $;const _=r.getById("formInstances",I.dataset.id),A=r.getById("formTemplates",_.templateId),q=_.submittedBy?r.getById("people",_.submittedBy):null,w={..._,template:A,jobNumber:t.number,customerName:(($=r.getById("people",t.customerId))==null?void 0:$.companyName)||"Unknown Customer",submittedByName:q?`${q.firstName} ${q.lastName}`:"Unknown Technician",number:`F-${t.number}-${_.id.slice(3,7).toUpperCase()}`},v=document.createElement("div");v.style.cssText="padding: 12px 0; display:flex; flex-direction:column; gap:16px",v.innerHTML=`
          <div style="font-size:14px; color:var(--text-secondary); margin-bottom:8px">
            Select the format to export <strong>${y(A.name)}</strong>:
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
        `,xe({title:"Export Compliance Form",content:v,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()}]}),v.querySelector("#export-modal-pdf").addEventListener("click",()=>{var C;(C=document.querySelector(".modal-overlay"))==null||C.remove(),me(async()=>{const{showPrintPreview:N}=await Promise.resolve().then(()=>Mt);return{showPrintPreview:N}},void 0).then(({showPrintPreview:N})=>{N({type:"form",data:w})})}),v.querySelector("#export-modal-csv").addEventListener("click",()=>{var C;(C=document.querySelector(".modal-overlay"))==null||C.remove(),me(async()=>{const{exportFormAsCSV:N}=await Promise.resolve().then(()=>Mt);return{exportFormAsCSV:N}},void 0).then(({exportFormAsCSV:N})=>{N(w)})}),v.querySelector("#export-modal-json").addEventListener("click",()=>{var C;(C=document.querySelector(".modal-overlay"))==null||C.remove(),me(async()=>{const{exportFormAsJSON:N}=await Promise.resolve().then(()=>Mt);return{exportFormAsJSON:N}},void 0).then(({exportFormAsJSON:N})=>{N(w)})})})}),S.querySelectorAll(".print-form").forEach(I=>{I.addEventListener("click",()=>{const _=r.getById("formInstances",I.dataset.id),A=r.getById("formTemplates",_.templateId),q=_.submittedBy?r.getById("people",_.submittedBy):null;me(async()=>{const{showPrintPreview:w}=await Promise.resolve().then(()=>Mt);return{showPrintPreview:w}},void 0).then(({showPrintPreview:w})=>{var v;w({type:"form",data:{..._,template:A,jobNumber:t.number,customerName:((v=r.getById("people",t.customerId))==null?void 0:v.companyName)||"Unknown Customer",submittedByName:q?`${q.firstName} ${q.lastName}`:"Unknown Technician",number:`F-${t.number}-${_.id.slice(3,7).toUpperCase()}`}})})})})}function h(){const S=r.getAll("formTemplates"),T=r.getAll("formInstances").filter(_=>_.jobId===a).map(_=>_.templateId),I=document.createElement("div");I.style.minWidth="450px",I.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:12px">
        ${S.map(_=>{const A=T.includes(_.id);return`
            <div class="card attach-template-item ${A?"disabled":""}" data-id="${_.id}" style="cursor:${A?"not-allowed":"pointer"}; opacity:${A?"0.6":"1"}; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${y(_.name)}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">${(_.sections||[]).reduce((q,w)=>q+w.fields.length,0)} fields</div>
                </div>
                ${A?'<span class="badge badge-neutral">Already Attached</span>':'<span class="material-icons-outlined" style="color:var(--color-primary)">add_circle</span>'}
              </div>
            </div>
          `}).join("")}
        ${S.length?"":'<div class="text-center text-tertiary">No templates available.</div>'}
      </div>
    `,I.querySelectorAll(".attach-template-item:not(.disabled)").forEach(_=>{_.addEventListener("click",()=>{var w;const A=_.dataset.id,q=r.getAll("formInstances");q.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:a,templateId:A,responses:{},status:"Pending",createdAt:new Date().toISOString()}),r.save("formInstances",q),H("Form attached to job","success"),(w=document.querySelector(".modal-overlay"))==null||w.remove(),b(e.querySelector("#tab-content"))})}),xe({title:"Attach Compliance Form",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()}]})}function k(S){const T=r.getAll("formInstances").find(v=>v.id===S),I=r.getById("formTemplates",T.templateId),_=T.status==="Completed",A=document.createElement("div");A.innerHTML=`
      <div style="margin-bottom:24px; border-bottom:1px solid var(--border-color); padding-bottom:16px">
        <h3 style="margin:0">${y(I.name)}</h3>
        <div style="font-size:14px; color:var(--text-secondary); margin-top:6px">${y(I.description||"")}</div>
      </div>
      <form id="active-job-form">
        <div style="display:flex; flex-direction:column; gap:24px">
          ${(I.sections||[]).map(v=>{const $=v.columns||(v.width==="half"?1:2);return v.isSpacer?`<div style="width:100%; height: ${v.height?String(v.height).endsWith("px")?v.height:v.height+"px":"50px"}"></div>`:`
            <div class="form-section" style="background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; overflow:hidden">
              <div style="background:var(--content-bg); padding:12px 16px; border-bottom:1px solid var(--border-color); border-left:4px solid var(--color-primary)">
                <h4 style="margin:0; font-size:15px; text-transform:uppercase; letter-spacing:0.5px">${y(v.title)}</h4>
              </div>
              <div style="display:grid; grid-template-columns: repeat(${$}, 1fr); gap:16px; padding:16px">
                ${v.fields.map(C=>{const N=Math.min(C.colSpan||(C.width==="half"?1:$),$);if(C.type==="spacer"||C.type==="blank"){const z=C.height?String(C.height).endsWith("px")?C.height:C.height+"px":"50px";return`<div style="grid-column: span ${N}; height: ${C.type==="blank"?"auto":z}"></div>`}if(C.type==="info")return`
          <div class="form-group info-block" style="margin:0; grid-column: span ${N}; padding:16px; background:rgba(27, 109, 224, 0.05); border-left:4px solid var(--color-primary); border-radius:4px; color:var(--color-primary-dark); font-size:14px; line-height:1.6">
            <div style="display:flex; gap:12px; align-items:flex-start">
              <span class="material-icons-outlined" style="color:var(--color-primary); flex-shrink:0; font-size:20px; margin-top:2px">info</span>
              <div>${y(C.label).replace(/\n/g,"<br/>")}</div>
            </div>
          </div>
        `;const O=T.responses[C.id]||"";let D="";return C.type==="text"?D=`<input class="form-input" name="${C.id}" value="${y(O)}" ${C.required?"required":""} ${_?"disabled":""} />`:C.type==="textarea"?D=`<textarea class="form-textarea" name="${C.id}" rows="3" ${C.required?"required":""} ${_?"disabled":""}>${y(O)}</textarea>`:C.type==="checkbox"?D=`
                       <label style="display:flex; align-items:center; gap:10px; cursor:${_?"default":"pointer"}; opacity:${_?"0.7":"1"}">
                         <input type="checkbox" name="${C.id}" ${O?"checked":""} style="width:18px; height:18px" ${_?"disabled":""} />
                         <span style="font-size:14px">${y(C.label)}</span>
                       </label>`:C.type==="select"?D=`
                       <select class="form-select" name="${C.id}" ${C.required?"required":""} ${_?"disabled":""}>
                         <option value="">Select option...</option>
                         ${(C.options||[]).map(z=>`<option value="${y(z)}" ${O===z?"selected":""}>${y(z)}</option>`).join("")}
                       </select>`:C.type==="date"?D=`<input type="date" class="form-input" name="${C.id}" value="${O}" ${C.required?"required":""} ${_?"disabled":""} />`:C.type==="signature"&&(D=`
                       <div style="border:1px solid var(--border-color); background:var(--bg-color); height:80px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:13px; font-style:italic">
                         ${O?`<span style="font-family:'Brush Script MT', cursive; font-size:24px; color:var(--text-primary)">${y(O)}</span>`:"Digitally Signed on submission"}
                       </div>`),`
                    <div class="form-group" style="margin:0; grid-column: span ${N}">
                      ${C.type!=="checkbox"?`<label class="form-label" style="font-weight:500">${y(C.label)} ${C.required?'<span style="color:var(--color-danger)">*</span>':""}</label>`:""}
                      ${D}
                    </div>
                  `}).join("")}
              </div>
            </div>
          `}).join("")}
        </div>
      </form>
    `;const q=v=>{var z,M;const $=A.querySelector("#active-job-form"),C={};(I.sections||[]).forEach(E=>{E.isSpacer||E.fields.forEach(j=>{var F;if(!(j.type==="spacer"||j.type==="info"||j.type==="blank")){if(j.type==="checkbox"){const R=$.querySelector(`input[name="${j.id}"]`);C[j.id]=R?R.checked:!1}else{const R=$.querySelector(`[name="${j.id}"]`);C[j.id]=R?R.value:""}v&&j.type==="signature"&&(C[j.id]=((F=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:F.name)||"Unknown")}})});const N=r.getAll("formInstances"),O=N.findIndex(E=>E.id===S);N[O]={...N[O],responses:C,status:v?"Completed":"Pending",submittedBy:v?(z=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:z.id:N[O].submittedBy,submittedAt:v?new Date().toISOString():N[O].submittedAt},r.save("formInstances",N),H(v?"Form submitted successfully":"Draft saved successfully","success"),b(e.querySelector("#tab-content"));const D=r.getAll("activity")||[];D.push({id:Date.now(),jobId:a,type:v?"form_submission":"form_draft_saved",text:v?`Form "${I.name}" submitted.`:`Form "${I.name}" draft was saved.`,user:(M=JSON.parse(localStorage.getItem("currentUser")))==null?void 0:M.name,timestamp:new Date().toISOString()}),r.save("activity",D)},w=[];w.push({label:"Cancel",className:"btn-secondary",onClick:v=>v()}),_?w.push({label:"Update Form",className:"btn-primary",onClick:v=>{const $=A.querySelector("#active-job-form");if(!$.checkValidity()){$.reportValidity();return}q(!0),v()}}):(w.push({label:"Save Draft",className:"btn-secondary",onClick:v=>{q(!1),v()}}),w.push({label:"Complete & Sign",className:"btn-primary",onClick:v=>{const $=A.querySelector("#active-job-form");if(!$.checkValidity()){$.reportValidity();return}q(!0),v()}})),xe({title:_?"Edit Form Response":"Complete Job Form",content:A,size:"modal-xl",actions:w})}}const zs=["Urgent","Follow-up","Warranty","Inspection","After-Hours","High Value","Recurring","Compliance","Hazardous","New Site"];function za(e,{id:a}){const t=a&&a!=="new",s=t?r.getById("jobs",a):{},c=r.getAll("customers"),l=r.getAll("contractors").filter(E=>E.active);let m=s.tags?[...s.tags]:[];function n(E){return c.find(j=>j.id===E)||null}function p(E,j){const F=n(E);return!F||!F.sites||F.sites.length===0?'<option value="">— No sites for this customer —</option>':'<option value="">Select jobsite...</option>'+F.sites.map((R,B)=>`<option value="${B}" data-address="${y(R.address)}" data-name="${y(R.name)}" ${j===R.name?"selected":""}>${y(R.name)} — ${y(R.address)}</option>`).join("")}function o(E,j,F){const R=n(E);return!R||!R.contacts||R.contacts.length===0?'<option value="">— Select customer first —</option>':`<option value="">${F}</option>`+R.contacts.map((B,oe)=>`<option value="${oe}" ${j===B.name?"selected":""}>${y(B.name)} (${y(B.role||"")})</option>`).join("")}function f(){return zs.map(E=>`<button type="button" class="tag-pill ${m.includes(E)?"tag-pill-active":""}" data-tag="${y(E)}">${y(E)}</button>`).join("")}const g=s.customerId||"";e.innerHTML=`
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
            <input class="form-input" name="title" value="${y(s.title||"")}" required placeholder="e.g. Electrical fault repair — Main Office" />
          </div>

          <!-- Customer + Type -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Customer *</label>
              <select class="form-select" id="jf-customer" name="customerId" required>
                <option value="">Select customer...</option>
                ${c.map(E=>`<option value="${E.id}" ${s.customerId===E.id?"selected":""}>${y(E.company)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                ${["Electrical","Plumbing","HVAC","Fire Protection","Security","General Maintenance"].map(E=>`<option ${s.type===E?"selected":""}>${E}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Jobsite -->
          <div class="form-group">
            <label class="form-label">Jobsite</label>
            <select class="form-select" id="jf-site" name="siteId" ${g?"":"disabled"}>
              ${p(g,s.siteId)}
            </select>
            <div class="site-address-hint" id="jf-site-hint">${s.siteAddress?y(s.siteAddress):"Select a customer to enable jobsite selection"}</div>
          </div>

          <!-- Primary Contact + Additional Contact -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Primary Contact</label>
              <select class="form-select" id="jf-primary-contact" name="primaryContactId" ${g?"":"disabled"}>
                ${o(g,s.primaryContactId,"Select primary contact...")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Contact</label>
              <select class="form-select" id="jf-additional-contact" name="additionalContactId" ${g?"":"disabled"}>
                ${o(g,s.additionalContactId,"None")}
              </select>
            </div>
          </div>

          <!-- Status + Priority -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${["Pending","Scheduled","In Progress","On Hold","Completed","Invoiced"].map(E=>`<option ${s.status===E?"selected":""}>${E}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" name="priority" id="job-priority">
                ${["Low","Medium","High","Urgent"].map(E=>`<option ${s.priority===E?"selected":""}>${E}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Contractor -->
          <div class="form-group">
            <label class="form-label">Assign to Contractor (Optional)</label>
            <select class="form-select" name="contractorId">
              <option value="">None (Internal Techs)</option>
              ${l.map(E=>`<option value="${E.id}" ${s.contractorId===E.id?"selected":""}>${y(E.businessName)}</option>`).join("")}
            </select>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div id="jf-tags" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;">
              ${f()}
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
  `,e.querySelectorAll("#job-form-tabs .tab").forEach(E=>{E.addEventListener("click",j=>{e.querySelectorAll("#job-form-tabs .tab").forEach(R=>R.classList.remove("active")),j.currentTarget.classList.add("active");const F=j.currentTarget.dataset.tab;e.querySelector("#jf-tab-details").style.display=F==="details"?"block":"none",e.querySelector("#jf-tab-tasks").style.display=F==="tasks"?"block":"none",e.querySelector("#jf-tab-forms").style.display=F==="forms"?"block":"none",F==="tasks"&&N(),F==="forms"&&M()})});const i=e.querySelector("#jf-customer"),d=e.querySelector("#jf-site"),x=e.querySelector("#jf-site-hint"),u=e.querySelector("#jf-primary-contact"),b=e.querySelector("#jf-additional-contact");function h(E){const j=!E;d.innerHTML=p(E,""),d.disabled=j,u.innerHTML=o(E,"","Select primary contact..."),u.disabled=j,b.innerHTML=o(E,"","None"),b.disabled=j,x.textContent=j?"Select a customer to enable jobsite selection":"Select a jobsite above"}i.addEventListener("change",E=>h(E.target.value)),d.addEventListener("change",E=>{const j=E.target.selectedOptions[0];x.textContent=(j==null?void 0:j.dataset.address)||""}),e.querySelector("#jf-tags").addEventListener("click",E=>{const j=E.target.closest(".tag-pill");if(!j)return;const F=j.dataset.tag;m.includes(F)?(m=m.filter(R=>R!==F),j.classList.remove("tag-pill-active")):(m.push(F),j.classList.add("tag-pill-active"))});const k=e.querySelector("#job-description-editor"),S=e.querySelector("#editor-toolbar");S.addEventListener("mousedown",E=>{const j=E.target.closest("button[data-cmd]");if(!j)return;E.preventDefault();const F=j.dataset.cmd,R=j.dataset.val||null;document.execCommand(F,!1,R),k.focus()}),e.querySelector("#editor-link-btn").addEventListener("click",()=>{const E=prompt("Enter URL:","https://");E&&document.execCommand("createLink",!1,E),k.focus()}),k.addEventListener("keyup",L),k.addEventListener("mouseup",L);function L(){S.querySelectorAll("button[data-cmd]").forEach(E=>{try{E.classList.toggle("active",document.queryCommandState(E.dataset.cmd))}catch{}})}const T=e.querySelector("#is-emergency"),I=e.querySelector("#emergency-dispatch-suggestion"),_=e.querySelector("#dispatch-reason"),A=e.querySelector("#job-priority");function q(E){if(E){A.value="Urgent",I.style.display="block";const j=r.getAll("people").filter(F=>F.type==="Staff");if(j.length>0){const F=j[Math.floor(Math.random()*j.length)],R=Math.floor(Math.random()*15)+5;_.innerHTML=`Based on current GPS location, <strong>${F.firstName} ${F.lastName}</strong> is the most suitable technician (approx. ${R} mins away).`}else _.innerHTML="No internal technicians available for dispatch."}else I.style.display="none"}if(T==null||T.addEventListener("change",E=>q(E.target.checked)),s.isEmergency&&q(!0),!t){const E=e.querySelector("#is-recurring"),j=e.querySelector("#recurring-options");E==null||E.addEventListener("change",F=>{j.style.display=F.target.checked?"flex":"none"})}e.querySelector("#btn-cancel").addEventListener("click",()=>X.navigate(t?`/jobs/${a}`:"/jobs"));let w=s.tasks?JSON.parse(JSON.stringify(s.tasks)):[{id:r.generateId(),name:"Main Task",status:"Not Started",progress:0,estimatedHours:2,people:1,subTasks:[]}];w.forEach(E=>{E.subTasks||(E.subTasks=[])});let v=[0],$=[];function C(E,j){let F=E[j[0]];if(!F)return null;for(let R=1;R<j.length;R++)if(!F.subTasks||(F=F.subTasks[j[R]],!F))return null;return F}function N(){var V,P,te,ce;const E=e.querySelector("#jf-task-container");if(!E)return;let j=!0,F=w;for(let se=0;se<v.length;se++){if(!F||!F[v[se]]){j=!1;break}F=F[v[se]].subTasks}j||(v=[]);const R=$.length>0?C(w,$):null,B=R?R.subTasks||[]:w,oe=R?y(R.name):"Main Tasks";E.innerHTML=`
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
                ${$.length>0?'<button type="button" class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back"><span class="material-icons-outlined" style="font-size:18px">arrow_back</span></button>':""}
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${oe}">${oe}</span>
              </div>
              ${$.length===0?'<button type="button" class="btn btn-ghost btn-sm btn-icon" id="btn-add-main-task" title="Add Main Task"><span class="material-icons-outlined">add</span></button>':`<button type="button" class="btn btn-ghost btn-sm btn-icon btn-add-child-task" data-path="${$.join("-")}" title="Add Task"><span class="material-icons-outlined">add</span></button>`}
            </div>
            <div style="padding:8px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
              ${B.map((se,K)=>{const ne=[...$,K],G=ne.join("-")===v.join("-");return`
                  <div class="task-list-item" data-path="${ne.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${G?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                    <span style="font-weight:${G?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${y(se.name)}">${y(se.name)}</span>
                    ${se.subTasks&&se.subTasks.length>0?`<button type="button" class="btn btn-ghost btn-icon btn-sm btn-drill-down" data-path="${ne.join("-")}" style="margin-left:8px; padding:2px; min-width:24px; min-height:24px; color:inherit"><span class="material-icons-outlined" style="font-size:18px">chevron_right</span></button>`:""}
                  </div>
                `}).join("")}
              ${B.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No tasks</div>':""}
            </div>
          </div>

          <!-- Task Details Form -->
          ${v.length>0?(()=>{const se=v,K=C(w,se);if(!K)return"";const ne=K.subTasks&&K.subTasks.length>0;return`
              <div style="flex: 1; min-width:300px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${y(K.name)}">Task Settings</h4>
                  <div style="display:flex;gap:8px">
                    ${se.length<3?`<button type="button" class="btn btn-sm btn-secondary btn-add-child-task" data-path="${se.join("-")}" title="Add Sub-task"><span class="material-icons-outlined" style="font-size:16px">add_task</span> Add Sub-task</button>`:""}
                    <button type="button" class="btn btn-sm btn-danger btn-remove-task" data-path="${se.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:16px">delete</span> Delete</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Name</label>
                  <input type="text" class="form-input detail-input" data-field="name" value="${y(K.name)}" />
                </div>
                ${ne?'<div style="margin-bottom:16px;color:var(--text-tertiary);font-size:13px;font-style:italic">This task has sub-tasks. Hours are calculated automatically.</div>':`
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-input detail-input" data-field="startDate" value="${K.startDate?K.startDate.split("T")[0]:""}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" class="form-input detail-input" data-field="estimatedHours" value="${K.estimatedHours||""}" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">People</label>
                    <input type="number" class="form-input detail-input" data-field="people" value="${K.people||"1"}" min="1" step="1" />
                  </div>
                </div>
                `}
                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea class="form-input detail-input" data-field="description" rows="3">${y(K.description||"")}</textarea>
                </div>
              </div>
            `})():""}
        </div>
      </div>
    `,(V=E.querySelector(".btn-view-back"))==null||V.addEventListener("click",()=>{$.pop(),N()}),E.querySelectorAll(".btn-drill-down").forEach(se=>{se.addEventListener("click",K=>{K.stopPropagation(),$=se.dataset.path.split("-").map(Number),v=[...$],N()})}),E.querySelectorAll(".task-list-item").forEach(se=>{se.addEventListener("click",()=>{v=se.dataset.path.split("-").map(Number),N()})}),(P=E.querySelector("#btn-add-main-task"))==null||P.addEventListener("click",()=>{w.push({id:r.generateId(),name:"New Task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),v=[w.length-1],N()}),E.querySelectorAll(".btn-add-child-task").forEach(se=>{se.addEventListener("click",()=>{const K=se.dataset.path.split("-").map(Number),ne=C(w,K);ne&&(ne.subTasks||(ne.subTasks=[]),ne.subTasks.push({id:r.generateId(),name:"New Sub-task",status:"Not Started",progress:0,startDate:new Date().toISOString(),technicians:[],subTasks:[]}),v=[...K,ne.subTasks.length-1],$=[...K],N())})}),E.querySelectorAll(".btn-remove-task").forEach(se=>{se.addEventListener("click",()=>{const K=se.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this task and all its sub-tasks?")){if(K.length===1)w.splice(K[0],1),v=w.length>0?[0]:[];else{const ne=C(w,K.slice(0,-1));ne&&ne.subTasks&&ne.subTasks.splice(K[K.length-1],1),v=[...K.slice(0,-1)]}N()}})}),E.querySelectorAll(".detail-input").forEach(se=>{se.addEventListener("input",K=>{const ne=K.target.dataset.field,G=K.target.value,ee=C(w,v);if(ee&&(ne==="estimatedHours"?ee[ne]=parseFloat(G)||0:ne==="people"?ee[ne]=parseInt(G)||1:ee[ne]=G,ne==="name")){const ae=E.querySelector(`.task-list-item[data-path="${v.join("-")}"] span:first-child`);ae&&(ae.textContent=G,ae.title=G);const W=E.querySelector("h4[title]");W&&(W.textContent="Task Settings: "+G,W.title=G)}})}),(te=e.querySelector("#btn-save-as-template"))==null||te.addEventListener("click",()=>{const se=document.createElement("div");se.innerHTML=`
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
      `,xe({title:"Save Tasklist as Template",content:se,actions:[{label:"Cancel",className:"btn-secondary",onClick:K=>K()},{label:"Save Template",className:"btn-primary",onClick:K=>{const ne=se.querySelector("#tmpl-name").value,G=se.querySelector("#tmpl-desc").value,ee=se.querySelector("#tmpl-tags").value.split(",").map(W=>W.trim()).filter(Boolean);if(!ne){H("Template name is required","error");return}function ae(W){return W.map(U=>({...U,id:r.generateId(),status:"Not Started",progress:0,subTasks:U.subTasks?ae(U.subTasks):[]}))}r.create("taskTemplates",{name:ne,description:G,tags:ee,tasks:ae(w),createdAt:new Date().toISOString()}),H("Tasklist saved as template","success"),K()}}]})}),(ce=e.querySelector("#btn-import-tasklist"))==null||ce.addEventListener("click",()=>{const se=r.getAll("taskTemplates"),K=r.getAll("jobs").filter(ae=>ae.id!==a&&ae.tasks&&ae.tasks.length>0);let ne="templates";const G=document.createElement("div");G.innerHTML=`
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
      `;function ee(ae=""){const W=G.querySelector("#import-content"),U=ae.toLowerCase();if(ne==="templates"){const Q=se.filter(J=>J.name.toLowerCase().includes(U)||(J.description||"").toLowerCase().includes(U)||(J.tags||[]).some(le=>le.toLowerCase().includes(U)));W.innerHTML=Q.length?Q.map(J=>`
            <div class="import-item" data-id="${J.id}" data-type="template" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:4px">
                <div style="font-weight:600; font-size:14px">${y(J.name)}</div>
                <div style="font-size:11px; color:var(--text-tertiary)">${(J.tasks||J.phases||[]).length} tasks</div>
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px; line-height:1.4">${y(J.description||"No description.")}</div>
              <div style="display:flex; gap:4px; flex-wrap:wrap">
                ${(J.tags||[]).map(le=>`<span style="font-size:10px; background:var(--bg-color); padding:2px 6px; border-radius:10px; border:1px solid var(--border-color)">${y(le)}</span>`).join("")}
              </div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No templates matching "${ae}"</div>`}else{const Q=K.filter(J=>J.number.toLowerCase().includes(U)||J.title.toLowerCase().includes(U)||J.customerName.toLowerCase().includes(U));W.innerHTML=Q.length?Q.map(J=>`
            <div class="import-item" data-id="${J.id}" data-type="job" style="padding:12px; border:1px solid var(--border-color); border-radius:6px; margin-bottom:10px; cursor:pointer; transition:all 0.2s">
              <div style="font-weight:600; font-size:14px; margin-bottom:2px">${y(J.number)} - ${y(J.title)}</div>
              <div style="font-size:12px; color:var(--text-secondary)">${y(J.customerName)} · ${(J.tasks||J.phases||[]).length} tasks</div>
            </div>
          `).join(""):`<div class="text-secondary text-center" style="padding:24px">No jobs matching "${ae}"</div>`}W.querySelectorAll(".import-item").forEach(Q=>{Q.addEventListener("click",()=>{var re;const J=Q.dataset.id,le=Q.dataset.type,ve=r.getAll("taskTemplates"),Z=r.getAll("jobs"),Y=le==="template"?ve.find(we=>String(we.id)===String(J)):Z.find(we=>String(we.id)===String(J));if(Y&&(Y.tasks||Y.phases)){const we=Y.tasks||Y.phases;if(confirm(`Replace current tasklist with "${Y.name||Y.number}"?`)){let ye=function($e){return $e.map(Se=>({...Se,id:r.generateId(),status:"Not Started",progress:0,subTasks:Se.subTasks||Se.subPhases?ye(Se.subTasks||Se.subPhases):[]}))};var pe=ye;w=ye(we),v=[0],$=[],H(`Imported ${Y.name||Y.number}`,"success"),N(),(re=document.querySelector(".modal-overlay"))==null||re.remove()}}else H("Could not find source data","error")})})}ee(),G.querySelectorAll(".tab").forEach(ae=>{ae.addEventListener("click",()=>{G.querySelectorAll(".tab").forEach(W=>W.classList.remove("active")),ae.classList.add("active"),ne=ae.dataset.tab,G.querySelector("#import-search").placeholder=ne==="templates"?"Search templates...":"Search jobs...",ee(G.querySelector("#import-search").value)})}),G.querySelector("#import-search").addEventListener("input",ae=>{ee(ae.target.value)}),xe({title:"Import Tasklist",content:G,actions:[{label:"Cancel",className:"btn-secondary",onClick:ae=>ae()}]})})}const O=r.getAll("formTemplates"),D=t?r.getAll("formInstances").filter(E=>E.jobId===a):[];let z=t?D.map(E=>E.templateId):[];function M(){const E=e.querySelector("#jf-forms-container");E&&(E.innerHTML=`
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:4px">Compliance & Safety Forms</h4>
        <p style="font-size:13px; color:var(--text-tertiary); margin-bottom:16px">Select the forms required for this job. Technicians will be prompted to complete these.</p>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
        ${O.map(j=>{const F=z.includes(j.id);return`
            <div class="card form-template-selector ${F?"active":""}" data-id="${j.id}" style="cursor:pointer; border:2px solid ${F?"var(--color-primary)":"var(--border-color)"}; transition:all 0.2s">
              <div class="card-body" style="display:flex; gap:12px; align-items:start">
                <div style="width:20px; height:20px; border-radius:4px; border:2px solid ${F?"var(--color-primary)":"var(--text-tertiary)"}; background:${F?"var(--color-primary)":"transparent"}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  ${F?'<span class="material-icons-outlined" style="font-size:16px; color:white">check</span>':""}
                </div>
                <div>
                  <div style="font-weight:600; font-size:14px; margin-bottom:4px">${y(j.name)}</div>
                  <div style="font-size:12px; color:var(--text-secondary); line-height:1.4">${y(j.description||"No description.")}</div>
                  <div style="margin-top:8px; font-size:11px; color:var(--text-tertiary)">${(j.sections||[]).reduce((R,B)=>R+B.fields.length,0)} Required Fields</div>
                </div>
              </div>
            </div>
          `}).join("")}
        ${O.length?"":'<div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-color); border-radius:8px">No form templates found. Create some in Settings first.</div>'}
      </div>
    `,E.querySelectorAll(".form-template-selector").forEach(j=>{j.addEventListener("click",()=>{const F=j.dataset.id;z.includes(F)?z=z.filter(R=>R!==F):z.push(F),M()})}))}e.querySelector("#btn-save").addEventListener("click",()=>{var ee,ae,W,U;const E=e.querySelector("#job-form");if(!E.checkValidity()){e.querySelectorAll("#job-form-tabs .tab").forEach(Q=>Q.classList.remove("active")),e.querySelector('#job-form-tabs .tab[data-tab="details"]').classList.add("active"),e.querySelector("#jf-tab-details").style.display="block",e.querySelector("#jf-tab-tasks").style.display="none",e.querySelector("#jf-tab-forms").style.display="none",E.reportValidity();return}const j=Object.fromEntries(new FormData(E)),F=j.customerId,R=c.find(Q=>Q.id===F);j.customerName=(R==null?void 0:R.company)||"";const B=d.selectedOptions[0];j.siteAddress=(B==null?void 0:B.dataset.address)||"",j.siteName=(B==null?void 0:B.dataset.name)||"";const oe=parseInt(j.primaryContactId),V=parseInt(j.additionalContactId),P=isNaN(oe)?null:(ee=R==null?void 0:R.contacts)==null?void 0:ee[oe],te=isNaN(V)?null:(ae=R==null?void 0:R.contacts)==null?void 0:ae[V];j.contactName=(P==null?void 0:P.name)||(R?`${R.firstName} ${R.lastName}`:""),j.primaryContactName=(P==null?void 0:P.name)||"",j.additionalContactName=(te==null?void 0:te.name)||"",delete j.primaryContactId,delete j.additionalContactId,j.tags=m,j.description=k.innerHTML,j.tasks=w,j.phases=w,j.tasks.forEach(Q=>{Q.subTasks||(Q.subTasks=[]),Q.subPhases=Q.subTasks}),delete j.notes,j.number=s.number||`J-${Date.now().toString().slice(-6)}`;const ce=(W=e.querySelector("#is-emergency"))==null?void 0:W.checked;if(j.isEmergency=ce,t?ce&&!s.isEmergency?j.laborCost=(s.laborCost||0)+150:!ce&&s.isEmergency&&(j.laborCost=Math.max(0,(s.laborCost||0)-150)):(j.technicians=[],j.laborCost=ce?150:0,j.materialCost=0,j.estimatedHours=0),(U=e.querySelector("#is-recurring"))!=null&&U.checked){const Q=e.querySelector("#recurring-freq").value,J=e.querySelector("#recurring-start").value,le=e.querySelector("#recurring-end").value;if(!J||!le){H("Recurring dates required","error");return}j.recurringConfig={freq:Q,start:J,end:le}}const se=t?r.update("jobs",a,j):r.create("jobs",j),K=se.id;let G=(r.getAll("formInstances")||[]).filter(Q=>{if(Q.jobId!==K)return!0;const J=z.includes(Q.templateId),le=Q.responses&&Object.keys(Q.responses).length>0;return J||le});if(z.forEach(Q=>{G.find(le=>le.jobId===K&&le.templateId===Q)||G.push({id:"fi_"+Math.random().toString(36).substr(2,9),jobId:K,templateId:Q,responses:{},status:"Pending",createdAt:new Date().toISOString()})}),r.save("formInstances",G),!t&&j.recurringConfig){let Q=new Date(j.recurringConfig.start);const J=new Date(j.recurringConfig.end);let le=0;for(;Q<=J&&le<50;)r.create("notifications",{type:"Recurring Job Due",jobId:K,title:`Recurring: ${se.title||se.number}`,dueDate:Q.toISOString().split("T")[0],status:"Pending",createdAt:new Date().toISOString()}),j.recurringConfig.freq==="Daily"?Q.setDate(Q.getDate()+1):j.recurringConfig.freq==="Weekly"?Q.setDate(Q.getDate()+7):j.recurringConfig.freq==="Monthly"&&Q.setMonth(Q.getMonth()+1),le++}H(`Job ${t?"updated":"created"} successfully`,"success",{link:`/jobs/${K}`}),X.navigate(`/jobs/${K}`)})}function Fs(e){var u;const a=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),t=a.userTypeId?r.getById("userTypes",a.userTypeId):null,s=t?(u=t.permissions)==null?void 0:u.find(b=>b.module==="Timesheets"):null;let c="All",l="All";const m=new Date,n=new Date;n.setDate(m.getDate()-7);const p=b=>{const h=b.getFullYear(),k=String(b.getMonth()+1).padStart(2,"0"),S=String(b.getDate()).padStart(2,"0");return`${h}-${k}-${S}`};let o=p(n),f=p(m),g=[];function i(){var $,C,N,O,D,z,M,E,j,F,R,B,oe;const b=r.getAll("timesheets").sort((V,P)=>new Date(P.date)-new Date(V.date)),h=r.getAll("technicians");let k=[...b];const S=["admin","manager","office"].includes(a.role)||s&&s.view,L=s&&s.view_own;!S&&L?k=k.filter(V=>String(V.technicianId)===String(a.id)):!S&&!L&&a.role!=="admin"&&(k=[]);let T=c==="All"?[...k]:k.filter(V=>V.status===c);S&&l!=="All"&&(T=T.filter(V=>String(V.technicianId)===String(l))),o&&(T=T.filter(V=>(V.date?V.date.split("T")[0]:"")>=o)),f&&(T=T.filter(V=>(V.date?V.date.split("T")[0]:"")<=f));const I=T.filter(V=>V.status==="Pending").reduce((V,P)=>V+(P.hours||0),0),_=T.map(V=>V.id),A=_.length>0&&_.every(V=>g.includes(V)),q=g.length>0,w=[];T.forEach(V=>{const te=new Date(V.date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});let ce=w.find(se=>se.dateStr===te);ce||(ce={dateStr:te,items:[],total:0},w.push(ce)),ce.items.push(V),ce.total+=V.hours||0}),e.innerHTML=`
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
            <button class="btn btn-primary" id="btn-approve-all-pending" ${k.some(V=>V.status==="Pending")?"":"disabled"}>
              <span class="material-icons-outlined">done_all</span> Approve All Pending
            </button>
          `:""}
        </div>
      </div>
      
      <div class="grid-4" style="margin-bottom:var(--space-lg)">
        <div class="stat-card">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value" style="color:var(--color-warning)">${I.toFixed(2)} <span style="font-size:14px;color:var(--text-secondary)">hrs</span></div>
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
            <input type="date" class="form-input" id="filter-date-start" value="${o}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
            <span style="font-size:12px; color:var(--text-secondary)">to</span>
            <input type="date" class="form-input" id="filter-date-end" value="${f}" style="width:130px; height:32px; padding:0 8px; font-size:13px;" />
          </div>
        </div>

        ${S?`
          <div style="display:flex; align-items:center; gap:8px;">
            <label style="font-size:12px; color:var(--text-secondary); font-weight:500;">Filter by Staff:</label>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="btn btn-ghost btn-sm btn-icon" id="btn-tech-prev" title="Previous technician" style="padding:0; height:32px; width:32px; min-width:32px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); border-radius:var(--border-radius); background:var(--card-bg);">
                <span class="material-icons-outlined" style="font-size:18px">chevron_left</span>
              </button>
              <select class="form-select" id="filter-tech" style="width:180px; height:32px; padding:0 8px; font-size:13px; margin:0;">
                <option value="All">All Technicians</option>
                ${h.map(V=>`<option value="${V.id}" ${l===V.id?"selected":""}>${V.name}</option>`).join("")}
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
          <span style="font-weight:600; color:var(--color-primary); font-size:14px;"><span id="selected-count">${g.length}</span> items selected</span>
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
                <th style="width:40px; text-align:center;"><input type="checkbox" id="th-select-all" ${A?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" /></th>
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
              ${w.length===0?'<tr><td colspan="9" class="text-secondary" style="text-align:center;padding:40px">No timesheets found</td></tr>':w.map(V=>`
                <tr class="group-header" style="background:var(--content-bg); font-weight:600;">
                  <td></td>
                  <td colspan="5" style="color:var(--text-primary)">${V.dateStr}</td>
                  <td style="text-align:right; color:var(--color-primary)">${V.total.toFixed(2)} hrs</td>
                  <td></td>
                  <td></td>
                </tr>
                ${V.items.map(P=>{const te=String(P.technicianId)===String(a.id),ce=s&&s.edit===!0||te,se=s&&s.delete===!0||te,K=["admin","manager","office"].includes(a.role)||ce&&P.status!=="Approved",ne=["admin","manager","office"].includes(a.role)||se&&P.status!=="Approved",G=g.includes(P.id);return`
                  <tr>
                    <td style="width:40px; text-align:center;">
                      <input type="checkbox" class="row-checkbox" data-id="${P.id}" ${G?"checked":""} style="cursor:pointer; width:16px; height:16px; margin:0;" />
                    </td>
                    <td class="text-secondary" style="font-size:12px">${new Date(P.date).toLocaleDateString()}</td>
                    <td><span class="font-medium">${y(P.technicianName)}</span></td>
                    <td><a href="#/jobs/${P.jobId}" class="cell-link">${y(P.jobNumber||P.jobId)}</a></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${y(P.taskName||"—")}</span></td>
                    <td><span class="text-secondary truncate" style="max-width:200px;display:inline-block">${y(P.description||"—")}</span></td>
                    <td style="text-align:right; font-weight:600">${P.hours.toFixed(2)}</td>
                    <td>
                      <span class="badge ${P.status==="Approved"?"badge-success":P.status==="Rejected"?"badge-danger":"badge-warning"}">
                        ${y(P.status)}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex; justify-content:flex-end; gap:4px;">
                        ${K?`
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
    `,e.querySelectorAll(".toolbar-filter").forEach(V=>{V.addEventListener("click",()=>{c=V.dataset.status,i()})}),($=e.querySelector("#filter-tech"))==null||$.addEventListener("change",V=>{l=V.target.value,i()});const v=["All",...h.map(V=>String(V.id))];(C=e.querySelector("#btn-tech-prev"))==null||C.addEventListener("click",()=>{const V=v.indexOf(String(l));if(V!==-1){const P=(V-1+v.length)%v.length;l=v[P],i()}}),(N=e.querySelector("#btn-tech-next"))==null||N.addEventListener("click",()=>{const V=v.indexOf(String(l));if(V!==-1){const P=(V+1)%v.length;l=v[P],i()}}),(O=e.querySelector("#filter-date-start"))==null||O.addEventListener("change",V=>{o=V.target.value,i()}),(D=e.querySelector("#filter-date-end"))==null||D.addEventListener("change",V=>{f=V.target.value,i()}),(z=e.querySelector("#th-select-all"))==null||z.addEventListener("change",V=>{V.target.checked?_.forEach(P=>{g.includes(P)||g.push(P)}):g=g.filter(P=>!_.includes(P)),i()}),e.querySelectorAll(".row-checkbox").forEach(V=>{V.addEventListener("change",P=>{const te=V.dataset.id;P.target.checked?g.includes(te)||g.push(te):g=g.filter(ce=>ce!==te),i()})}),(M=e.querySelector("#btn-bulk-deselect"))==null||M.addEventListener("click",()=>{g=[],i()}),(E=e.querySelector("#btn-bulk-approve"))==null||E.addEventListener("click",()=>{g.length!==0&&(g.forEach(V=>{r.update("timesheets",V,{status:"Approved"})}),H(`Approved ${g.length} timesheets successfully`,"success"),g=[],i())}),(j=e.querySelector("#btn-bulk-reject"))==null||j.addEventListener("click",()=>{g.length!==0&&(g.forEach(V=>{r.update("timesheets",V,{status:"Rejected"})}),H(`Rejected ${g.length} timesheets`,"error"),g=[],i())}),(F=e.querySelector("#btn-bulk-export"))==null||F.addEventListener("click",()=>{if(g.length===0)return;const P=r.getAll("timesheets").filter(ae=>g.includes(ae.id));if(P.length===0){H("No entries found to export","error");return}const ce=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description","Status"].join(",")];P.forEach(ae=>{const W=ae.startTime?new Date(ae.startTime).toLocaleString():"",U=ae.finishTime?new Date(ae.finishTime).toLocaleString():"",Q=[ae.date||"",`"${(ae.technicianName||"").replace(/"/g,'""')}"`,`"${(ae.jobNumber||"").replace(/"/g,'""')}"`,`"${(ae.taskName||"").replace(/"/g,'""')}"`,`"${W}"`,`"${U}"`,ae.hours||0,`"${(ae.description||"").replace(/"/g,'""')}"`,ae.status||""];ce.push(Q.join(","))});const se=ce.join(`
`),K=new Blob([se],{type:"text/csv;charset=utf-8;"}),ne=URL.createObjectURL(K),G=document.createElement("a");G.setAttribute("href",ne);const ee=new Date().toISOString().split("T")[0];G.setAttribute("download",`FieldForge_Selected_Timesheets_${ee}.csv`),G.style.visibility="hidden",document.body.appendChild(G),G.click(),document.body.removeChild(G),H(`Exported ${P.length} selected timesheets to CSV!`,"success"),g=[],i()}),(R=e.querySelector("#btn-approve-all-pending"))==null||R.addEventListener("click",()=>{const V=k.filter(P=>P.status==="Pending");V.forEach(P=>r.update("timesheets",P.id,{status:"Approved"})),H(`Approved ${V.length} pending timesheets`,"success"),i()}),e.querySelectorAll(".btn-approve-single").forEach(V=>{V.addEventListener("click",()=>{r.update("timesheets",V.dataset.id,{status:"Approved"}),H("Timesheet entry approved","success"),i()})}),e.querySelectorAll(".btn-reject-single").forEach(V=>{V.addEventListener("click",()=>{r.update("timesheets",V.dataset.id,{status:"Rejected"}),H("Timesheet entry rejected","error"),i()})}),e.querySelectorAll(".btn-edit-timesheet").forEach(V=>{V.addEventListener("click",()=>{d(V.dataset.id)})}),e.querySelectorAll(".btn-delete-timesheet").forEach(V=>{V.addEventListener("click",()=>{const P=V.dataset.id,te=r.getById("timesheets",P);te&&xe({title:"Confirm Delete",content:`<p>Are you sure you want to delete this timesheet entry for <strong>${te.hours} hrs</strong> on <strong>${new Date(te.date).toLocaleDateString()}</strong>?</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:ce=>ce()},{label:"Delete",className:"btn-danger",onClick:ce=>{r.delete("timesheets",P),H("Timesheet entry deleted successfully","success"),ce(),i()}}]})})}),(B=e.querySelector("#btn-export-approved"))==null||B.addEventListener("click",()=>{const V=r.getAll("timesheets"),P=["admin","manager","office"].includes(a.role);let te=V.filter(W=>W.status==="Approved");if(o&&(te=te.filter(W=>W.date>=o)),f&&(te=te.filter(W=>W.date<=f)),P)l&&l!=="All"&&(te=te.filter(W=>W.technicianId===l));else{const U=r.getAll("technicians").find(J=>J.name===a.name),Q=U?U.id:null;te=te.filter(J=>J.technicianId===Q||J.technicianName===a.name)}if(te.length===0){H("No approved timesheets found to export","error");return}const se=[["Date","Technician","Job Number","Task Name","Start Time","Finish Time","Hours","Description"].join(",")];te.forEach(W=>{const U=W.startTime?new Date(W.startTime).toLocaleString():"",Q=W.finishTime?new Date(W.finishTime).toLocaleString():"",J=[W.date||"",`"${(W.technicianName||"").replace(/"/g,'""')}"`,`"${(W.jobNumber||"").replace(/"/g,'""')}"`,`"${(W.taskName||"").replace(/"/g,'""')}"`,`"${U}"`,`"${Q}"`,W.hours||0,`"${(W.description||"").replace(/"/g,'""')}"`];se.push(J.join(","))});const K=se.join(`
`),ne=new Blob([K],{type:"text/csv;charset=utf-8;"}),G=URL.createObjectURL(ne),ee=document.createElement("a");ee.setAttribute("href",G);const ae=new Date().toISOString().split("T")[0];ee.setAttribute("download",`FieldForge_Approved_Timesheets_${ae}.csv`),ee.style.visibility="hidden",document.body.appendChild(ee),ee.click(),document.body.removeChild(ee),H(`Exported ${te.length} approved timesheets to CSV!`,"success")}),(oe=e.querySelector("#btn-log-time"))==null||oe.addEventListener("click",()=>{x()})}function d(b){ja(b,i)}function x(){const b={},h={};function k(z,M=[],E=[]){z&&z.forEach((j,F)=>{const R=[...M,F].join("-"),B=[...E,j.name].join(" > ");b[R]=B,j.id&&(h[j.id]=R),j.subTasks&&k(j.subTasks,[...M,F],[...E,j.name])})}function S(z,M=[]){return!z||z.length===0?"":z.map((E,j)=>{const F=[...M,j],R=F.join("-"),B=E.subTasks&&E.subTasks.length>0;return`
          <div class="tree-node" style="margin: 2px 0;">
            <div class="tree-node-row ${B?"parent-node":"leaf-node"}" data-path="${R}" data-name="${y(E.name)}" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; flex-grow:1;">
                ${B?`
                  <span class="material-icons-outlined tree-node-toggle" data-path="${R}" style="font-size:16px; margin-right:4px;">chevron_right</span>
                `:`
                  <span class="material-icons-outlined" style="font-size:14px; margin-right:6px; color:var(--text-tertiary);">subdirectory_arrow_right</span>
                `}
                <span class="node-name" style="font-weight:${B?"600":"400"}">${y(E.name)}</span>
              </div>
              ${B?`
                <span style="font-size:10px; background:var(--content-bg); padding:2px 6px; border-radius:10px; color:var(--text-secondary)">${E.subTasks.length} subtasks</span>
              `:""}
            </div>
            ${B?`
              <div class="tree-node-children" id="children-${R}" style="display:none; padding-left:18px; border-left:1px dashed var(--border-color); margin-left:10px;">
                ${S(E.subTasks,F)}
              </div>
            `:""}
          </div>
        `}).join("")}const L=new Date,T=z=>z.toString().padStart(2,"0"),I=`${L.getFullYear()}-${T(L.getMonth()+1)}-${T(L.getDate())}`,_=`${I}T09:00`,A=`${I}T10:00`,q=r.getAll("technicians"),w=r.getAll("jobs").filter(z=>z.status!=="Completed"&&z.status!=="Invoiced"),v=document.createElement("div");v.innerHTML=`
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
          <input type="datetime-local" class="form-input" id="lt-start" value="${_}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Finish Time *</label>
          <input type="datetime-local" class="form-input" id="lt-finish" value="${A}" style="width:100%" />
        </div>
      </div>
      <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div class="form-group" style="margin:0">
          <label class="form-label">Technician *</label>
          <select class="form-select" id="lt-tech" style="width:100%">
            <option value="">Select technician...</option>
            ${q.map(z=>`<option value="${z.id}" ${l===z.id?"selected":""}>${z.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Job *</label>
          <select class="form-select" id="lt-job" style="width:100%">
            <option value="">Select job...</option>
            ${w.map(z=>`<option value="${z.id}">${z.number} - ${y(z.customerName)} (${y(z.title)})</option>`).join("")}
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
    `;const $=v.querySelector("#lt-job"),C=v.querySelector("#lt-task-trigger"),N=v.querySelector("#lt-task-dropdown"),O=v.querySelector("#lt-task"),D=v.querySelector("#lt-task-name");C.addEventListener("click",z=>{z.stopPropagation();const M=N.style.display==="block";N.style.display=M?"none":"block"}),document.addEventListener("click",z=>{v.contains(z.target)||(N.style.display="none")}),$.addEventListener("change",z=>{const M=z.target.value;if(!M){C.innerHTML='<span>Select a job first...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',C.disabled=!0,N.style.display="none",O.value="",D.value="";return}const E=w.find(j=>j.id===M);if(!E||!E.tasks||E.tasks.length===0){C.innerHTML='<span>No tasks available</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',C.disabled=!0,N.style.display="none",O.value="",D.value="";return}for(const j in b)delete b[j];for(const j in h)delete h[j];k(E.tasks),N.innerHTML=S(E.tasks),C.innerHTML='<span>Select a task...</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>',C.disabled=!1,N.querySelectorAll(".tree-node-toggle").forEach(j=>{j.addEventListener("click",F=>{F.stopPropagation();const R=j.dataset.path,B=N.querySelector(`#children-${R}`);if(B){const oe=B.style.display==="none";B.style.display=oe?"block":"none",j.classList.toggle("expanded",oe)}})}),N.querySelectorAll(".tree-node-row").forEach(j=>{j.addEventListener("click",F=>{if(F.target.classList.contains("tree-node-toggle"))return;const R=j.dataset.path,B=R.split("-").map(Number),oe=w.find(ce=>ce.id===M);function V(ce,se){let K=ce[se[0]];for(let ne=1;ne<se.length;ne++){if(!K||!K.subTasks)return!1;K=K.subTasks[se[ne]]}return K&&K.subTasks&&K.subTasks.length>0}if(V(oe.tasks||[],B)){const ce=N.querySelector(`#children-${R}`),se=N.querySelector(`.tree-node-toggle[data-path="${R}"]`);if(ce){const K=ce.style.display==="none";ce.style.display=K?"block":"none",se&&se.classList.toggle("expanded",K)}return}const te=b[R]||j.dataset.name;O.value=R,D.value=te,C.innerHTML=`<span>${y(te)}</span><span class="material-icons-outlined" style="font-size:18px; color:var(--text-secondary)">keyboard_arrow_down</span>`,N.style.display="none"})})}),xe({title:"Log Time on Behalf of Staff",content:v,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:z=>z()},{label:"Log Time",className:"btn-primary",onClick:z=>{const M=document.getElementById("lt-start").value,E=document.getElementById("lt-finish").value,j=document.getElementById("lt-tech").value,F=document.getElementById("lt-job").value,R=document.getElementById("lt-task").value,B=document.getElementById("lt-task-name").value,oe=document.getElementById("lt-desc").value;if(!M||!E||!j||!F||!R){H("Please fill all required fields, including the task","error");return}const V=new Date(M),P=new Date(E);if(P<=V){H("Finish time must be after start time","error");return}const te=Math.round((P-V)/36e5*100)/100,ce=q.find(K=>K.id===j),se=w.find(K=>K.id===F);r.create("timesheets",{jobId:se.id,jobNumber:se.number,taskId:R,taskName:B,technicianId:j,technicianName:ce.name,date:M.split("T")[0],startTime:M,finishTime:E,hours:te,description:oe||"",status:"Pending"}),H("Time logged successfully on behalf of staff","success"),z(),i()}}]})}i()}const Jt=[{value:"call",label:"Call",icon:"phone",color:"#3B82F6"},{value:"meeting",label:"Meeting",icon:"groups",color:"#8B5CF6"},{value:"follow-up",label:"Follow-up",icon:"reply",color:"#F59E0B"},{value:"site-visit",label:"Site Visit",icon:"location_on",color:"#10B981"},{value:"email",label:"Email",icon:"email",color:"#06B6D4"},{value:"task",label:"Task",icon:"task_alt",color:"#64748B"},{value:"other",label:"Other",icon:"more_horiz",color:"#94A3B8"}];function Hs(e){return Jt.find(a=>a.value===e)||Jt[6]}function xa(e,a){if(!e||!a)return null;const t={job:"/jobs/",quote:"/quotes/",invoice:"/invoices/",customer:"/customers/",lead:"/leads/"};return t[e]?t[e]+a:null}function Rs(e,{getWeekDays:a,viewMode:t,currentDate:s,calendarType:c,isTechnician:l,onNav:m,onToday:n,onViewMode:p,onCalType:o}){const f=a(),g=["January","February","March","April","May","June","July","August","September","October","November","December"],i=JSON.parse(localStorage.getItem("currentUser")||"{}"),d=r.getAll("technicians");let x="active",u=l?i.id:"all";function b(){let I=r.getAll("activities");u!=="all"&&(I=I.filter(A=>A.assignedToId===u));const _=new Date().toISOString().split("T")[0];return x==="active"?I=I.filter(A=>A.status!=="completed"):x==="completed"?I=I.filter(A=>A.status==="completed"):x==="overdue"&&(I=I.filter(A=>A.status!=="completed"&&A.date<_)),I}function h(){let I=r.getAll("activities");u!=="all"&&(I=I.filter(w=>w.assignedToId===u));const _=new Date().toISOString().split("T")[0],A=f.map(w=>w.toISOString().split("T")[0]),q=I.filter(w=>A.includes(w.date));return{total:q.length,completed:q.filter(w=>w.status==="completed").length,pending:q.filter(w=>w.status!=="completed").length,overdue:I.filter(w=>w.status!=="completed"&&w.date<_).length}}function k(I){var C;const _=Hs(I.type),A=I.status==="completed",q=new Date().toISOString().split("T")[0],w=!A&&I.date<q,v=xa(I.linkedType,I.linkedId),$=I.priority==="high"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#EF4444;margin-right:4px" title="High priority"></span>':I.priority==="low"?'<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#94A3B8;margin-right:4px" title="Low priority"></span>':"";return`
      <div class="activity-card ${A?"completed":""} ${w?"overdue":""}" data-id="${I.id}" style="
        background:var(--card-bg); border:1px solid ${w?"#FCA5A5":"var(--border-color)"};
        border-left:3px solid ${A?"#94A3B8":_.color}; border-radius:8px;
        padding:12px 14px; transition:all 0.2s; ${A?"opacity:0.6;":""}
        display:flex; gap:12px; align-items:flex-start; position:relative;
      ">
        <div style="width:32px;height:32px;border-radius:8px;background:${_.color}14;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
          <span class="material-icons-outlined" style="font-size:18px;color:${_.color}">${_.icon}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px">
            <div style="font-weight:600;font-size:13px;${A?"text-decoration:line-through;color:var(--text-tertiary)":"color:var(--text-primary)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${$}${y(I.title)}
            </div>
            <div style="display:flex;gap:2px;flex-shrink:0">
              <button class="btn btn-ghost btn-sm btn-icon act-toggle-complete" data-id="${I.id}" title="${A?"Mark pending":"Mark complete"}" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:${A?"#10B981":"var(--text-tertiary)"}">${A?"check_circle":"radio_button_unchecked"}</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-edit" data-id="${I.id}" title="Edit" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px">edit</span>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon act-delete" data-id="${I.id}" title="Delete" style="width:26px;height:26px">
                <span class="material-icons-outlined" style="font-size:16px;color:var(--color-danger)">close</span>
              </button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--text-secondary)">
            ${I.time?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">schedule</span>${y(I.time)}${I.duration?` (${I.duration}min)`:""}</span>`:""}
            <span style="display:flex;align-items:center;gap:3px;background:${_.color}14;color:${_.color};padding:1px 6px;border-radius:10px;font-weight:500">${_.label}</span>
            ${I.linkedLabel?`<span class="act-linked-record" data-type="${I.linkedType||""}" data-linked-id="${I.linkedId||""}" style="display:flex;align-items:center;gap:3px;cursor:${v?"pointer":"default"};${v?"color:var(--color-primary);text-decoration:underline;":""}"><span class="material-icons-outlined" style="font-size:13px">link</span>${y(I.linkedLabel)}</span>`:""}
            ${u==="all"?`<span style="display:flex;align-items:center;gap:3px"><span class="material-icons-outlined" style="font-size:13px">person</span>${y(((C=d.find(N=>N.id===I.assignedToId))==null?void 0:C.name)||"Unassigned")}</span>`:""}
          </div>
          ${I.notes?`<div style="margin-top:6px;font-size:12px;color:var(--text-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${y(I.notes)}</div>`:""}
        </div>
      </div>`}function S(){const I=b(),_=h(),A=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];e.innerHTML=`
      <div class="page-header">
        <h1>Activity Calendar</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">${g[s.getMonth()]} ${s.getFullYear()}</span>
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
              <button class="toolbar-filter act-filter ${x==="active"?"active":""}" data-filter="active">Active</button>
              <button class="toolbar-filter act-filter ${x==="all"?"active":""}" data-filter="all">All</button>
              <button class="toolbar-filter act-filter ${x==="completed"?"active":""}" data-filter="completed">Completed</button>
              <button class="toolbar-filter act-filter ${x==="overdue"?"active":""}" data-filter="overdue" style="${_.overdue>0?"color:var(--color-danger)":""}">Overdue${_.overdue>0?` (${_.overdue})`:""}</button>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-new-activity"><span class="material-icons-outlined" style="font-size:16px;margin-right:4px">add</span>New Activity</button>
          </div>
          <div style="flex:1;overflow-y:auto;padding:16px">
            ${f.map(q=>{const w=q.toISOString().split("T")[0],v=w===new Date().toISOString().split("T")[0],$=I.filter(C=>C.date===w).sort((C,N)=>(C.time||"99:99").localeCompare(N.time||"99:99"));return`
                <div style="margin-bottom:20px">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border-color)">
                    ${v?'<span style="width:8px;height:8px;border-radius:50%;background:var(--color-primary);flex-shrink:0"></span>':""}
                    <h4 style="margin:0;font-size:13px;${v?"color:var(--color-primary)":"color:var(--text-secondary)"}">${A[q.getDay()]}, ${q.getDate()} ${g[q.getMonth()]}</h4>
                    <span style="font-size:11px;color:var(--text-tertiary)">${$.length} ${$.length===1?"activity":"activities"}</span>
                  </div>
                  ${$.length===0?'<p style="color:var(--text-tertiary);font-size:12px;margin:0 0 0 16px">No activities scheduled.</p>':`
                    <div style="display:flex;flex-direction:column;gap:8px">${$.map(C=>k(C)).join("")}</div>
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
                <div style="font-size:20px;font-weight:700;color:var(--color-primary)">${_.pending}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Pending</div>
              </div>
              <div style="text-align:center;padding:10px;background:var(--content-bg);border-radius:8px">
                <div style="font-size:20px;font-weight:700;color:#10B981">${_.completed}</div>
                <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600">Done</div>
              </div>
              ${_.overdue>0?`
              <div style="text-align:center;padding:10px;background:#FEF2F2;border-radius:8px;grid-column:span 2">
                <div style="font-size:20px;font-weight:700;color:#EF4444">${_.overdue}</div>
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
              <option value="all" ${u==="all"?"selected":""}>All Team Members</option>
              ${d.map(q=>`<option value="${q.id}" ${u===q.id?"selected":""}>${q.name}</option>`).join("")}
            </select>
          </div>`}
          <!-- Quick Create -->
          <div style="padding:16px">
            <h4 style="font-size:var(--font-size-sm);margin:0 0 12px 0;display:flex;align-items:center;gap:6px">
              <span class="material-icons-outlined" style="font-size:16px">bolt</span>Quick Add
            </h4>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${Jt.slice(0,5).map(q=>`
                <button class="btn btn-secondary btn-sm act-quick-add" data-type="${q.value}" style="justify-content:flex-start;gap:8px;text-align:left">
                  <span class="material-icons-outlined" style="font-size:16px;color:${q.color}">${q.icon}</span>${q.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>`,T()}function L(I=null){const _=!!I,A=I||{title:"",type:"call",date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""},q=r.getAll("jobs").filter(M=>M.status!=="Completed"&&M.status!=="Invoiced"),w=r.getAll("customers"),v=r.getAll("quotes"),$=document.createElement("div");$.innerHTML=`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Title *</label>
        <input type="text" class="form-input" id="act-title" value="${y(A.title)}" placeholder="e.g. Follow up on quote..." style="width:100%" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Type</label>
          <select class="form-select" id="act-type" style="width:100%">
            ${Jt.map(M=>`<option value="${M.value}" ${A.type===M.value?"selected":""}>${M.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <select class="form-select" id="act-priority" style="width:100%">
            <option value="low" ${A.priority==="low"?"selected":""}>Low</option>
            <option value="normal" ${A.priority==="normal"?"selected":""}>Normal</option>
            <option value="high" ${A.priority==="high"?"selected":""}>High</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Date *</label>
          <input type="date" class="form-input" id="act-date" value="${A.date}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="act-time" value="${A.time||""}" style="width:100%" />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Duration (min)</label>
          <input type="number" class="form-input" id="act-duration" value="${A.duration||""}" min="0" step="5" style="width:100%" />
        </div>
      </div>
      ${l?"":`
      <div class="form-group" style="margin-bottom:12px">
        <label class="form-label">Assign To</label>
        <select class="form-select" id="act-assignee" style="width:100%">
          ${d.map(M=>`<option value="${M.id}" ${A.assignedToId===M.id?"selected":""}>${M.name}</option>`).join("")}
        </select>
      </div>`}
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-bottom:12px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Link To</label>
          <select class="form-select" id="act-link-type" style="width:100%">
            <option value="">None</option>
            <option value="job" ${A.linkedType==="job"?"selected":""}>Job</option>
            <option value="customer" ${A.linkedType==="customer"?"selected":""}>Customer</option>
            <option value="quote" ${A.linkedType==="quote"?"selected":""}>Quote</option>
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
        <textarea class="form-input" id="act-notes" rows="3" placeholder="Additional details..." style="width:100%">${y(A.notes||"")}</textarea>
      </div>
      ${_?"":`
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
            ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((M,E)=>`
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 8px;border:1px solid var(--border-color);border-radius:4px;cursor:pointer">
                <input type="checkbox" class="recur-day-cb" value="${E+1}" ${E<5,""} />${M}
              </label>
            `).join("")}
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-tertiary)">For weekly/fortnightly, select which days. For daily/monthly the date field is used as the anchor.</div>
        </div>
      </div>`}
    `;function C(M,E){const j=$.querySelector("#act-link-record");let F='<option value="">Select...</option>';M==="job"?F+=q.map(R=>`<option value="${R.id}" data-label="Job ${R.number}" ${E===R.id?"selected":""}>${R.number} — ${y(R.title)}</option>`).join(""):M==="customer"?F+=w.map(R=>`<option value="${R.id}" data-label="${y(R.company||R.firstName+" "+R.lastName)}" ${E===R.id?"selected":""}>${y(R.company||R.firstName+" "+R.lastName)}</option>`).join(""):M==="quote"&&(F+=v.map(R=>`<option value="${R.id}" data-label="Quote ${R.number}" ${E===R.id?"selected":""}>${R.number} — ${y(R.customerName||"")}</option>`).join("")),j.innerHTML=F}C(A.linkedType,A.linkedId),$.querySelector("#act-link-type").addEventListener("change",M=>C(M.target.value,""));const N=$.querySelector("#act-recur-enabled"),O=$.querySelector("#act-recur-details"),D=$.querySelector("#act-recur-weekdays"),z=$.querySelector("#act-recur-freq");N&&(N.addEventListener("change",()=>{O.style.display=N.checked?"block":"none"}),z==null||z.addEventListener("change",()=>{D.style.display=z.value==="weekly"||z.value==="fortnightly"?"flex":"none"})),xe({title:_?"Edit Activity":"New Activity",content:$,size:"modal-70",actions:[{label:"Cancel",className:"btn-secondary",onClick:M=>M()},{label:_?"Save Changes":"Create Activity",className:"btn-primary",onClick:M=>{var V,P,te;const E=$.querySelector("#act-title").value.trim(),j=$.querySelector("#act-date").value;if(!E||!j){H("Title and date are required","error");return}const F=$.querySelector("#act-link-type").value,R=$.querySelector("#act-link-record"),B=R.options[R.selectedIndex],oe={title:E,type:$.querySelector("#act-type").value,priority:$.querySelector("#act-priority").value,date:j,time:$.querySelector("#act-time").value||"",duration:parseInt($.querySelector("#act-duration").value)||0,assignedToId:l?i.id:((V=$.querySelector("#act-assignee"))==null?void 0:V.value)||i.id,linkedType:F,linkedId:R.value||"",linkedLabel:((P=B==null?void 0:B.dataset)==null?void 0:P.label)||"",notes:$.querySelector("#act-notes").value,status:_?A.status:"pending"};if(_)r.update("activities",A.id,oe),H("Activity updated","success");else if((te=$.querySelector("#act-recur-enabled"))==null?void 0:te.checked){const se=$.querySelector("#act-recur-freq").value,K=Math.min(parseInt($.querySelector("#act-recur-count").value)||4,52),ne=[...$.querySelectorAll(".recur-day-cb:checked")].map(W=>parseInt(W.value)),G=[],ee=new Date(j+"T12:00:00");if(se==="daily")for(let W=0;W<K;W++){const U=new Date(ee);U.setDate(U.getDate()+W),G.push(U)}else if(se==="weekly"||se==="fortnightly"){const W=se==="fortnightly"?2:1,U=ne.length>0?ne:[ee.getDay()===0?7:ee.getDay()];let Q=new Date(ee);Q.setDate(Q.getDate()-(Q.getDay()+6)%7);let J=0;for(let le=0;J<K&&le<200;le++){for(const ve of U){if(J>=K)break;const Z=new Date(Q);Z.setDate(Z.getDate()+(ve-1)),Z>=ee&&(G.push(Z),J++)}Q.setDate(Q.getDate()+7*W)}}else if(se==="monthly")for(let W=0;W<K;W++){const U=new Date(ee);U.setMonth(U.getMonth()+W),G.push(U)}const ae=W=>W.toString().padStart(2,"0");G.forEach(W=>{const U=`${W.getFullYear()}-${ae(W.getMonth()+1)}-${ae(W.getDate())}`;r.create("activities",{...oe,date:U,recurrenceGroup:oe.title+"_"+j})}),H(`Created ${G.length} recurring activities`,"success")}else r.create("activities",oe),H("Activity created","success");M(),S()}}]})}function T(){var I,_,A,q,w;(I=e.querySelector("#btn-prev"))==null||I.addEventListener("click",()=>m(-1)),(_=e.querySelector("#btn-next"))==null||_.addEventListener("click",()=>m(1)),(A=e.querySelector("#btn-today"))==null||A.addEventListener("click",n),e.querySelectorAll("[data-view]").forEach(v=>v.addEventListener("click",()=>p(v.dataset.view))),e.querySelectorAll("[data-cal]").forEach(v=>v.addEventListener("click",()=>o(v.dataset.cal))),e.querySelectorAll(".act-filter").forEach(v=>v.addEventListener("click",()=>{x=v.dataset.filter,S()})),(q=e.querySelector("#act-tech-filter"))==null||q.addEventListener("change",v=>{u=v.target.value,S()}),(w=e.querySelector("#btn-new-activity"))==null||w.addEventListener("click",()=>L()),e.querySelectorAll(".act-quick-add").forEach(v=>v.addEventListener("click",()=>{const $=v.dataset.type;L({title:"",type:$,date:new Date().toISOString().split("T")[0],time:"",duration:15,priority:"normal",status:"pending",assignedToId:i.id,linkedType:"",linkedId:"",notes:""})})),e.querySelectorAll(".act-toggle-complete").forEach(v=>v.addEventListener("click",$=>{$.stopPropagation();const C=r.getById("activities",v.dataset.id);C&&(r.update("activities",C.id,{status:C.status==="completed"?"pending":"completed"}),S())})),e.querySelectorAll(".act-edit").forEach(v=>v.addEventListener("click",$=>{$.stopPropagation();const C=r.getById("activities",v.dataset.id);C&&L(C)})),e.querySelectorAll(".act-delete").forEach(v=>v.addEventListener("click",$=>{$.stopPropagation(),xe({title:"Delete Activity",content:"<p>Are you sure you want to delete this activity?</p>",actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()},{label:"Delete",className:"btn-danger",onClick:C=>{r.delete("activities",v.dataset.id),H("Activity deleted","success"),C(),S()}}]})})),e.querySelectorAll(".act-linked-record").forEach(v=>v.addEventListener("click",$=>{$.stopPropagation();const C=xa(v.dataset.type,v.dataset.linkedId);C&&X.navigate(C)}))}S()}function Os(e){const a=r.getAll("technicians"),t=JSON.parse(localStorage.getItem("currentUser")||"{}"),s=t.role==="technician";let c="week",l="schedule",m=new Date;const n=Array.from({length:24},(F,R)=>R);let p=null,o=null,f=new Set(s?[t.id]:a.map(F=>F.id)),g=null,i=0,d=0,x=!1,u=!1;const b=32,h=b/4;function k(F){return Math.round(F*4)/4}function S(F){const R=Math.floor(F),B=Math.round((F-R)*60);return`${R.toString().padStart(2,"0")}:${B.toString().padStart(2,"0")}`}function L(){const F=document.getElementById("calendar-scroll");F&&(i=F.scrollTop,d=F.scrollLeft)}function T(){const F=document.getElementById("calendar-scroll");F&&(F.scrollTop=i,F.scrollLeft=d)}function I(){g&&(g.remove(),g=null)}document.addEventListener("click",I);function _(){const F=new Date(m);return c==="day"?[new Date(m)]:(F.setDate(F.getDate()-F.getDay()+1),Array.from({length:5},(R,B)=>{const oe=new Date(F);return oe.setDate(oe.getDate()+B),oe}))}function A(){const F=r.getAll("jobs"),R=r.getAll("schedule"),B=[],oe=_();R.forEach(P=>{if(P.type==="leave"||P.type==="blockout"||P.type==="meeting"){const se=P.date?new Date(P.date+"T12:00:00"):P.startTime?new Date(P.startTime):null;if(!se)return;oe.forEach((K,ne)=>{if(se.toDateString()===K.toDateString()){let G=8,ee=10;if(P.startTime&&P.finishTime){const ae=new Date(P.startTime),W=new Date(P.finishTime);G=ae.getHours()+ae.getMinutes()/60,ee=W.getHours()+W.getMinutes()/60}else P.startHour!==void 0&&P.endHour!==void 0&&(G=P.startHour,ee=P.endHour);B.push({id:P.id,type:P.type,jobId:null,jobNumber:P.type==="leave"?"LEAVE":P.type==="blockout"?"BLOCKOUT":"MEETING",customerName:P.notes||(P.type==="leave"?"On Leave":P.type==="blockout"?"Calendar Block":"Scheduled Meeting"),title:P.notes||"",technicianId:P.technicianId,dayIdx:ne,startHour:G,endHour:ee,status:"Draft",priority:"Normal"})}});return}const te=F.find(se=>se.id===P.jobId);if(!te||te.status==="Completed"||te.status==="Invoiced")return;let ce=null;if(P.date)ce=new Date(P.date+"T12:00:00");else if(P.startTime)ce=new Date(P.startTime);else if(P.dayOffset!==void 0){const se=oe[0];se&&(ce=new Date(se),ce.setDate(ce.getDate()+P.dayOffset))}ce&&oe.forEach((se,K)=>{if(ce.toDateString()===se.toDateString()){let ne=8,G=10;if(P.startTime&&P.finishTime){const ee=new Date(P.startTime),ae=new Date(P.finishTime);ne=ee.getHours()+ee.getMinutes()/60,G=ae.getHours()+ae.getMinutes()/60}else P.startHour!==void 0&&P.endHour!==void 0&&(ne=P.startHour,G=P.endHour);B.push({id:P.id,type:"schedule",jobId:te.id,jobNumber:te.number,customerName:te.customerName,title:te.title,technicianId:P.technicianId,dayIdx:K,startHour:ne,endHour:G,status:te.status,priority:te.priority})}})});const V=new Set(R.map(P=>P.jobId));return F.filter(P=>P.scheduledDate&&!V.has(P.id)&&P.status!=="Completed"&&P.status!=="Invoiced").forEach(P=>{const te=new Date(P.scheduledDate);oe.forEach((ce,se)=>{if(te.toDateString()===ce.toDateString()){const K=P.startHour!==void 0?P.startHour:7+Math.abs(q(P.id))%6;if(P.technicians&&P.technicians.length>0)P.technicians.forEach(ne=>{const G=ne.hours||2;B.push({id:`legacy-${P.id}-${ne.id}`,type:"legacy",jobId:P.id,jobNumber:P.number,customerName:P.customerName,title:P.title,technicianId:ne.id,dayIdx:se,startHour:K,endHour:K+G,status:P.status,priority:P.priority})});else if(P.technicianId){const ne=P.estimatedHours||2;B.push({id:`legacy-${P.id}`,type:"legacy",jobId:P.id,jobNumber:P.number,customerName:P.customerName,title:P.title,technicianId:P.technicianId,dayIdx:se,startHour:K,endHour:K+ne,status:P.status,priority:P.priority})}}})}),B}function q(F){let R=0;for(let B=0;B<F.length;B++)R=(R<<5)-R+F.charCodeAt(B),R|=0;return R}function w(){L();const F=_(),R=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],B=["January","February","March","April","May","June","July","August","September","October","November","December"];if(l==="activity"){j();return}const oe=A(),V=a.filter(P=>f.has(P.id));document.documentElement.getAttribute("data-theme"),e.innerHTML=`
      <div class="page-header">
        <h1>Schedule</h1>
        <div class="page-header-actions">
          <div class="flex gap-sm items-center">
            <button class="btn btn-secondary btn-sm" id="btn-prev"><span class="material-icons-outlined">chevron_left</span></button>
            <button class="btn btn-secondary btn-sm" id="btn-today">Today</button>
            <button class="btn btn-secondary btn-sm" id="btn-next"><span class="material-icons-outlined">chevron_right</span></button>
            <span style="font-weight:600;font-size:var(--font-size-md);margin:0 8px">
              ${B[m.getMonth()]} ${m.getFullYear()}
            </span>
          </div>
          <div class="flex gap-sm items-center" style="margin-left:auto;margin-right:16px">
            ${s?`<span style="font-size:var(--font-size-sm);color:var(--text-secondary);font-weight:500"><span class="material-icons-outlined" style="font-size:16px;vertical-align:middle;margin-right:4px">person</span>${t.name}</span>`:""}
          </div>
          <div class="flex gap-xs" style="margin-right:16px;">
            <button class="toolbar-filter ${l==="schedule"?"active":""}" data-cal="schedule">Schedule</button>
            <button class="toolbar-filter ${l==="activity"?"active":""}" data-cal="activity">Activities</button>
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
            ${f.size!==1?`
              <!-- Top headers: Technicians -->
              <div style="display:grid;grid-template-columns:56px repeat(${V.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${V.map(P=>`
                  <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                    <div style="font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px">
                      <div style="width:6px;height:6px;border-radius:50%;background:${P.color};flex-shrink:0"></div>
                      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${P.name}</span>
                    </div>
                  </div>
                `).join("")}
              </div>

              <!-- Rows: Days -->
              ${F.map((P,te)=>`
                  <!-- Day Header Row -->
                  <div style="display:flex;background:var(--content-bg);border-bottom:1px solid var(--border-color);position:sticky;left:0;z-index:2;width:fit-content;min-width:100%">
                     <div style="padding:6px 12px;font-size:var(--font-size-sm);font-weight:600;${P.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};position:sticky;left:0;background:var(--content-bg);">
                       ${R[P.getDay()]}, ${P.getDate()} ${B[P.getMonth()]}
                     </div>
                  </div>

                  <!-- Day Grid -->
                  <div style="display:grid;grid-template-columns:56px repeat(${V.length}, minmax(120px, 1fr));border-bottom:2px solid var(--border-color);width:fit-content;min-width:100%">

                    <!-- Hours Column (Sticky Left) -->
                    <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                      ${n.map(se=>`
                        <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                          ${se.toString().padStart(2,"0")}:00
                        </div>
                      `).join("")}
                    </div>

                    <!-- Technician Columns for this Day -->
                    ${V.map(se=>{const K=oe.filter(ne=>ne.technicianId===se.id);return`
                        <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${se.id}" data-day="${te}" data-date="${F[te].getFullYear()}-${(F[te].getMonth()+1).toString().padStart(2,"0")}-${F[te].getDate().toString().padStart(2,"0")}">
                          ${n.map(ne=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${ne}"></div>`).join("")}
                          ${D(K,te,se.color)}
                        </div>
                      `}).join("")}
                  </div>
                `).join("")}
            `:`
              <!-- Top headers: Days -->
              <div style="display:grid;grid-template-columns:56px repeat(${F.length}, minmax(120px, 1fr));border-bottom:1px solid var(--border-color);position:sticky;top:0;background:var(--card-bg);z-index:10;width:fit-content;min-width:100%">
                <!-- Sticky Top-Left corner for Time/Date header -->
                <div style="height:34px;border-right:1px solid var(--border-color);background:var(--card-bg);position:sticky;left:0;z-index:11;display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);color:var(--text-tertiary);font-weight:600;text-transform:uppercase">
                  Time
                </div>
                ${F.map(P=>`
                    <div style="height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid var(--border-color);background:var(--card-bg);">
                      <div style="font-size:11px;font-weight:600;${P.toDateString()===new Date().toDateString()?"color:var(--color-primary)":"color:var(--text-secondary)"};display:flex;align-items:center;gap:6px">
                        <span>${R[P.getDay()]} ${P.getDate()} ${B[P.getMonth()]}</span>
                      </div>
                    </div>
                  `).join("")}
              </div>

              <!-- Day Grid -->
              <div style="display:grid;grid-template-columns:56px repeat(${F.length}, minmax(120px, 1fr));width:fit-content;min-width:100%">
                <!-- Hours Column (Sticky Left) -->
                <div style="background:var(--card-bg);position:sticky;left:0;z-index:2;border-right:1px solid var(--border-color)">
                  ${n.map(P=>`
                    <div style="height:32px;border-bottom:1px solid var(--border-color);padding:2px 4px;font-size:10px;color:var(--text-tertiary);text-align:right;display:flex;align-items:flex-start;justify-content:flex-end">
                      ${P.toString().padStart(2,"0")}:00
                    </div>
                  `).join("")}
                </div>

                <!-- Day Columns for the selected Technician -->
                ${F.map((P,te)=>{const ce=a.find(K=>K.id===[...f][0]),se=oe.filter(K=>K.technicianId===ce.id);return`
                    <div class="schedule-day-col" style="position:relative;border-right:1px solid var(--border-color)" data-tech="${ce.id}" data-day="${te}" data-date="${F[te].getFullYear()}-${(F[te].getMonth()+1).toString().padStart(2,"0")}-${F[te].getDate().toString().padStart(2,"0")}">
                      ${n.map(K=>`<div class="schedule-hour-slot" style="height:32px;border-bottom:1px solid var(--border-color)" data-hour="${K}"></div>`).join("")}
                      ${D(se,te,ce.color)}
                    </div>
                  `}).join("")}
              </div>
            `}
          </div>

          <!-- Right Sidebar (For Non-Technicians) -->
          ${s?"":`
            ${x?`
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
                  ${u?`
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
                    ${a.filter(P=>f.has(P.id)).map(P=>`
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
                  ${u?`
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
                        <input type="checkbox" class="tech-visibility-checkbox" value="${P.id}" ${f.has(P.id)?"checked":""}>
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
    `,z(),M(F),E(),T()}function v(){return r.getAll("jobs").filter(R=>(!R.scheduledDate||!R.technicianId)&&R.status!=="Completed"&&R.status!=="Invoiced")}function $(){const F=v(),R=r.getAll("technicians");if(F.length===0){H("No unscheduled jobs available.","info");return}He({title:"Schedule Unscheduled Job",content:`
        <form id="drawer-add-job-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Select Job <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="jobId" required>
              ${F.map(B=>`<option value="${B.id}">${B.number} — ${y(B.customerName)} (${y(B.title)})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${R.map(B=>`<option value="${B.id}">${y(B.name)}</option>`).join("")}
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
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:B=>B()},{label:"Schedule Job",className:"btn-primary",onClick:B=>{const oe=document.getElementById("drawer-add-job-form");if(!oe.checkValidity())return oe.reportValidity();const V=new FormData(oe),P=V.get("jobId"),te=V.get("technicianId"),ce=V.get("date"),se=V.get("startTime"),K=parseFloat(V.get("duration")),ne=r.getById("jobs",P),G=r.getById("technicians",te),ee=parseFloat(se.split(":")[0])+parseFloat(se.split(":")[1])/60,ae=ee+K,W=`${ce}T${se}`,U=Math.floor(ae),Q=Math.round((ae-U)*60),J=`${ce}T${U.toString().padStart(2,"0")}:${Q.toString().padStart(2,"0")}`;r.create("schedule",{jobId:ne.id,jobNumber:ne.number,technicianId:te,technicianName:(G==null?void 0:G.name)||"",date:ce,startTime:W,finishTime:J,hours:K}),r.update("jobs",ne.id,{scheduledDate:ce,startHour:ee,technicianId:te}),H(`Scheduled Job ${ne.number} to ${G==null?void 0:G.name}`,"success"),B(),w()}}]})}function C(){const F=r.getAll("technicians");He({title:"Book Technician Leave",content:`
        <form id="drawer-add-leave-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${F.map(R=>`<option value="${R.id}">${y(R.name)}</option>`).join("")}
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
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Book Leave",className:"btn-primary",onClick:R=>{const B=document.getElementById("drawer-add-leave-form");if(!B.checkValidity())return B.reportValidity();const oe=new FormData(B),V=oe.get("technicianId"),P=oe.get("date"),te=oe.get("startTime"),ce=parseFloat(oe.get("duration")),se=oe.get("notes"),K=r.getById("technicians",V),G=parseFloat(te.split(":")[0])+parseFloat(te.split(":")[1])/60+ce,ee=`${P}T${te}`,ae=Math.floor(G),W=Math.round((G-ae)*60),U=`${P}T${ae.toString().padStart(2,"0")}:${W.toString().padStart(2,"0")}`;r.create("schedule",{type:"leave",technicianId:V,technicianName:(K==null?void 0:K.name)||"",date:P,startTime:ee,finishTime:U,hours:ce,notes:se}),H(`Leave booked for ${K==null?void 0:K.name}`,"success"),R(),w()}}]})}function N(){const F=r.getAll("technicians");He({title:"Book Calendar Blockout",content:`
        <form id="drawer-add-blockout-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${F.map(R=>`<option value="${R.id}">${y(R.name)}</option>`).join("")}
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
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Create Blockout",className:"btn-primary",onClick:R=>{const B=document.getElementById("drawer-add-blockout-form");if(!B.checkValidity())return B.reportValidity();const oe=new FormData(B),V=oe.get("technicianId"),P=oe.get("date"),te=oe.get("startTime"),ce=parseFloat(oe.get("duration")),se=oe.get("notes"),K=r.getById("technicians",V),G=parseFloat(te.split(":")[0])+parseFloat(te.split(":")[1])/60+ce,ee=`${P}T${te}`,ae=Math.floor(G),W=Math.round((G-ae)*60),U=`${P}T${ae.toString().padStart(2,"0")}:${W.toString().padStart(2,"0")}`;r.create("schedule",{type:"blockout",technicianId:V,technicianName:(K==null?void 0:K.name)||"",date:P,startTime:ee,finishTime:U,hours:ce,notes:se}),H(`Blockout scheduled for ${K==null?void 0:K.name}`,"success"),R(),w()}}]})}function O(){const F=r.getAll("technicians");He({title:"Book Team Meeting",content:`
        <form id="drawer-add-meeting-form" style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
            <label class="form-label">Technician <span style="color:var(--color-danger)">*</span></label>
            <select class="form-select" name="technicianId" required>
              ${F.map(R=>`<option value="${R.id}">${y(R.name)}</option>`).join("")}
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
      `,actions:[{label:"Cancel",className:"btn-secondary",onClick:R=>R()},{label:"Schedule Meeting",className:"btn-primary",onClick:R=>{const B=document.getElementById("drawer-add-meeting-form");if(!B.checkValidity())return B.reportValidity();const oe=new FormData(B),V=oe.get("technicianId"),P=oe.get("date"),te=oe.get("startTime"),ce=parseFloat(oe.get("duration")),se=oe.get("notes"),K=r.getById("technicians",V),G=parseFloat(te.split(":")[0])+parseFloat(te.split(":")[1])/60+ce,ee=`${P}T${te}`,ae=Math.floor(G),W=Math.round((G-ae)*60),U=`${P}T${ae.toString().padStart(2,"0")}:${W.toString().padStart(2,"0")}`;r.create("schedule",{type:"meeting",technicianId:V,technicianName:(K==null?void 0:K.name)||"",date:P,startTime:ee,finishTime:U,hours:ce,notes:se}),H(`Meeting scheduled for ${K==null?void 0:K.name}`,"success"),R(),w()}}]})}function D(F,R,B){const oe={Urgent:"#EF4444",High:"#F59E0B"};return F.filter(V=>V.dayIdx===R).map(V=>{const P=V.startHour*b,te=Math.max((V.endHour-V.startHour)*b-2,h);let ce=oe[V.priority]||B,se=`${B}12`,K=B;V.type==="leave"?(ce="#EF4444",se="rgba(239, 68, 68, 0.1)",K="#EF4444"):V.type==="blockout"?(ce="#6B7280",se="rgba(107, 114, 128, 0.1)",K="#4B5563"):V.type==="meeting"&&(ce="#3B82F6",se="rgba(59, 130, 246, 0.1)",K="#2563EB");const ne=`${S(V.startHour)} — ${S(V.endHour)}`;return`
          <div class="schedule-block" draggable="true"
            data-block-job-id="${V.jobId||""}"
            data-schedule-id="${V.id}"
            data-block-type="${V.type}"
            data-start="${V.startHour}"
            data-end="${V.endHour}"
            style="
              top:${P}px;
              height:${te}px;
              background:${se};
              border-color:${ce};
              color:${K};
              pointer-events:auto;
            ">
            <div style="pointer-events:none;font-weight:700;font-size:11px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${V.jobNumber}</div>
            ${te>20?`<div style="pointer-events:none;font-size:10px;opacity:0.9;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${V.customerName}</div>`:""}
            ${te>36?`<div class="schedule-block-time" style="pointer-events:none;font-size:9px;opacity:0.7;margin-top:2px">${ne}</div>`:""}
            <div class="schedule-resize-handle" data-block-job-id="${V.jobId||""}" data-schedule-id="${V.id}" data-block-type="${V.type}" data-start="${V.startHour}" data-end="${V.endHour}" title="Drag to resize"></div>
          </div>
        `}).join("")}function z(){var F,R,B,oe,V;(F=e.querySelector("#btn-prev"))==null||F.addEventListener("click",()=>{m.setDate(m.getDate()-(c==="week"?7:1)),w()}),(R=e.querySelector("#btn-next"))==null||R.addEventListener("click",()=>{m.setDate(m.getDate()+(c==="week"?7:1)),w()}),(B=e.querySelector("#btn-today"))==null||B.addEventListener("click",()=>{m=new Date,w()}),e.querySelectorAll("[data-view]").forEach(P=>{P.addEventListener("click",()=>{c=P.dataset.view,w()})}),e.querySelectorAll("[data-cal]").forEach(P=>{P.addEventListener("click",()=>{l=P.dataset.cal,w()})}),e.querySelectorAll(".tech-visibility-checkbox").forEach(P=>{P.addEventListener("change",te=>{te.target.checked?f.add(te.target.value):f.delete(te.target.value),w()})}),(oe=e.querySelector("#btn-toggle-sidebar"))==null||oe.addEventListener("click",()=>{x=!x,w()}),(V=e.querySelector("#btn-action-menu-trigger"))==null||V.addEventListener("click",P=>{P.stopPropagation(),u=!u,w()}),e.querySelectorAll(".action-menu-opt").forEach(P=>{P.addEventListener("click",te=>{te.stopPropagation();const ce=P.dataset.action;u=!1,w(),ce==="job"?$():ce==="leave"?C():ce==="blockout"?N():ce==="meeting"&&O()})}),e.querySelectorAll(".schedule-block").forEach(P=>{P.addEventListener("click",te=>{if(te.defaultPrevented)return;if(P.dataset.resized==="true"){P.dataset.resized="false";return}const ce=P.dataset.blockJobId,se=P.dataset.blockType,K=P.dataset.scheduleId;if(se==="schedule"||se==="legacy"){const ne=r.getById("jobs",ce);if(!ne)return;He({title:`Job Quick View: ${ne.number}`,content:`
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
            `,actions:[{label:"Close",className:"btn-secondary",onClick:G=>G()},{label:"Open Full Job",className:"btn-primary",onClick:G=>{G(),X.navigate(`/jobs/${ce}`)}}],width:450})}else{const ne=r.getById("schedule",K);if(!ne)return;const G=se==="leave"?"Leave Details":se==="blockout"?"Blockout Details":"Meeting Details",ee=r.getById("technicians",ne.technicianId);He({title:G,content:`
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div>
                  <label class="form-label">Type</label>
                  <div class="font-medium" style="font-size:16px; text-transform:uppercase">${se}</div>
                </div>
                <div>
                  <label class="form-label">Technician</label>
                  <div>${y((ee==null?void 0:ee.name)||ne.technicianName||"Unknown")}</div>
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
                  <div style="font-size:var(--font-size-sm);white-space:pre-wrap;background:var(--content-bg);padding:12px;border-radius:4px;border:1px solid var(--border-color);">${y(ne.notes||"No details entered")}</div>
                </div>
              </div>
            `,actions:[{label:"Close",className:"btn-secondary",onClick:ae=>ae()},{label:"Remove Allocation",className:"btn-danger",onClick:ae=>{ae(),r.delete("schedule",K),H("Allocation removed successfully","success"),w()}}],width:450})}}),P.addEventListener("contextmenu",te=>{te.preventDefault(),I();const ce=P.dataset.scheduleId,se=P.dataset.blockType,K=se==="schedule"||se==="legacy";g=document.createElement("div"),g.className="dropdown-menu",g.style.position="fixed",g.style.top=`${te.clientY}px`,g.style.left=`${te.clientX}px`,g.style.zIndex=1e3,g.style.background="var(--card-bg)",g.style.boxShadow="var(--shadow-md)",g.style.border="1px solid var(--border-color)",g.style.borderRadius="var(--border-radius)",g.style.padding="4px 0",g.style.minWidth="140px",K?(g.innerHTML=`
            <button class="dropdown-item" id="ctx-view"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">visibility</span> View Job</button>
            <button class="dropdown-item text-danger" id="ctx-unschedule"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">event_busy</span> Unschedule</button>
          `,document.body.appendChild(g),g.querySelector("#ctx-view").addEventListener("click",()=>{I();const ne=P.dataset.blockJobId;X.navigate(`/jobs/${ne}`)}),g.querySelector("#ctx-unschedule").addEventListener("click",()=>{I();const ne=P.dataset.blockJobId;r.getAll("schedule").find(ae=>ae.id===ce)&&r.delete("schedule",ce),ne&&r.update("jobs",ne,{scheduledDate:null,technicianId:null}),H("Job unscheduled","success"),w()})):(g.innerHTML=`
            <button class="dropdown-item text-danger" id="ctx-delete-allocation"><span class="material-icons-outlined" style="font-size:16px;margin-right:8px">delete</span> Delete Allocation</button>
          `,document.body.appendChild(g),g.querySelector("#ctx-delete-allocation").addEventListener("click",()=>{I(),r.delete("schedule",ce),H("Allocation removed successfully","success"),w()}))})})}function M(F){const R=document.getElementById("calendar-scroll");R&&(R.addEventListener("dragover",B=>{if(!p)return;const oe=R.getBoundingClientRect(),V=60,P=15;B.clientY-oe.top<V?R.scrollTop-=P:oe.bottom-B.clientY<V&&(R.scrollTop+=P)}),R.addEventListener("wheel",B=>{p&&(R.scrollTop+=B.deltaY)},{passive:!0})),e.querySelectorAll(".unscheduled-job").forEach(B=>{B.addEventListener("dragstart",oe=>{const V=B.getBoundingClientRect();p={type:"unscheduled",jobId:B.dataset.jobId,jobNumber:B.dataset.jobNumber,customerName:B.dataset.customer,title:B.dataset.title,hours:parseInt(B.dataset.hours)||2,offsetY:oe.clientY-V.top},oe.dataTransfer.effectAllowed="move",B.style.opacity="0.5"}),B.addEventListener("dragend",()=>{B.style.opacity="1",p=null,document.querySelectorAll(".schedule-drag-preview").forEach(oe=>oe.remove())})}),e.querySelectorAll(".schedule-block[draggable]").forEach(B=>{B.addEventListener("dragstart",oe=>{oe.stopPropagation();const V=B.getBoundingClientRect();p={type:"existing",blockType:B.dataset.blockType,scheduleId:B.dataset.scheduleId,jobId:B.dataset.blockJobId,startHour:parseFloat(B.dataset.start),endHour:parseFloat(B.dataset.end),offsetY:oe.clientY-V.top},oe.dataTransfer.effectAllowed="move",B.style.opacity="0.4"}),B.addEventListener("dragend",()=>{B.style.opacity="1",p=null,document.querySelectorAll(".schedule-drag-preview").forEach(oe=>oe.remove())})}),e.querySelectorAll(".schedule-day-col").forEach(B=>{B.addEventListener("dragover",oe=>{if(oe.preventDefault(),oe.dataTransfer.dropEffect="move",B.style.background="rgba(27, 109, 224, 0.05)",!p)return;const V=B.getBoundingClientRect(),P=p.offsetY||0,ce=(oe.clientY-P-V.top)/b,se=Math.min(23.75,Math.max(0,k(ce)));let K=B.querySelector(".schedule-drag-preview");K||(K=document.createElement("div"),K.className="schedule-drag-preview",K.style.position="absolute",K.style.left="3px",K.style.right="3px",K.style.background="rgba(27, 109, 224, 0.15)",K.style.border="2px dashed var(--color-primary)",K.style.borderRadius="4px",K.style.pointerEvents="none",K.style.zIndex="10",B.appendChild(K));const ne=p.type==="existing"?p.endHour-p.startHour:p.hours||2,G=se*b,ee=Math.max(ne*b-2,h);K.style.top=G+"px",K.style.height=ee+"px"}),B.addEventListener("dragleave",oe=>{if(!B.contains(oe.relatedTarget)){B.style.background="";const V=B.querySelector(".schedule-drag-preview");V&&V.remove()}}),B.addEventListener("drop",oe=>{const V=r.getAll("jobs");oe.preventDefault(),B.style.background="";const P=B.querySelector(".schedule-drag-preview");if(P&&P.remove(),!p)return;const te=B.dataset.tech,ce=parseInt(B.dataset.day),se=B.dataset.date?new Date(B.dataset.date+"T12:00:00"):F[ce],K=B.getBoundingClientRect(),ne=p.offsetY||0,ee=(oe.clientY-ne-K.top)/b,ae=Math.min(23.75,Math.max(0,k(ee))),W=a.find(Q=>Q.id===te),U=V.find(Q=>Q.id===p.jobId);if(U){const Q=p.type==="existing"?p.endHour-p.startHour:p.hours||U.estimatedHours||2,J=ae+Q;if(A().some(Ce=>Ce.technicianId===te&&Ce.dayIdx===ce&&(p.scheduleId?Ce.id!==p.scheduleId:Ce.jobId!==U.id)&&Math.max(Ce.startHour,ae)<Math.min(Ce.endHour,J))&&!window.confirm("Technician already has a job scheduled at this time. Proceed anyway?")){p=null;return}const Z=Ce=>Ce.toString().padStart(2,"0"),Y=`${se.getFullYear()}-${Z(se.getMonth()+1)}-${Z(se.getDate())}`,pe=Math.floor(ae),re=Math.round((ae-pe)*60),we=Math.floor(J),ye=Math.round((J-we)*60),$e=`${Y}T${Z(pe)}:${Z(re)}`,Se=`${Y}T${Z(we)}:${Z(ye)}`;p.type==="existing"&&p.blockType==="schedule"?(r.update("schedule",p.scheduleId,{technicianId:te,technicianName:(W==null?void 0:W.name)||"",date:Y,startTime:$e,finishTime:Se,hours:Q}),H(`Moved ${U.number} for ${W==null?void 0:W.name} to ${Y}`,"success")):(r.create("schedule",{jobId:U.id,jobNumber:U.number,technicianId:te,technicianName:(W==null?void 0:W.name)||"",date:Y,startTime:$e,finishTime:Se,hours:Q}),r.update("jobs",U.id,{scheduledDate:Y,startHour:ae,technicianId:te,technicianName:(W==null?void 0:W.name)||"",status:U.status==="Pending"?"Scheduled":U.status}),H(`Assigned ${U.number} to ${W==null?void 0:W.name}`,"success"))}p=null,w()})})}function E(){e.querySelectorAll(".schedule-resize-handle").forEach(F=>{F.addEventListener("mousedown",R=>{R.preventDefault(),R.stopPropagation();const B=F.closest(".schedule-block"),oe=B.closest(".schedule-day-col"),V=parseFloat(F.dataset.start),P=parseFloat(F.dataset.end);oe.getBoundingClientRect(),o={blockType:F.dataset.blockType,scheduleId:F.dataset.scheduleId,jobId:F.dataset.blockJobId,block:B,col:oe,startHour:V,endHour:P},B.dataset.resized="false",B.style.opacity="0.85",B.style.userSelect="none",document.body.style.cursor="ns-resize";function te(se){if(!o)return;const K=o.col.getBoundingClientRect(),G=(se.clientY-K.top)/b,ee=k(G),ae=o.startHour+.25,W=Math.max(ee,ae);if(W!==o.endHour){o.endHour=W,o.block.dataset.resized="true";const U=Math.max((W-o.startHour)*b-2,h);o.block.style.height=U+"px";const Q=o.block.querySelector(".schedule-block-time");Q&&(Q.textContent=`${S(o.startHour)} — ${S(W)}`)}}function ce(){var ee;if(document.removeEventListener("mousemove",te),document.removeEventListener("mouseup",ce),document.body.style.cursor="",!o)return;const{jobId:se,startHour:K,endHour:ne}=o,G=ne-K;if(o.block.style.opacity="",o.block.style.userSelect="",Math.abs(ne-P)>=.25)if(o.blockType==="schedule"){const ae=r.getById("schedule",o.scheduleId);if(ae){const W=ae.date||((ee=ae.startTime)==null?void 0:ee.split("T")[0])||new Date().toISOString().split("T")[0],U=Z=>Z.toString().padStart(2,"0"),Q=Math.floor(K),J=Math.round((K-Q)*60),le=Math.floor(ne),ve=Math.round((ne-le)*60);r.update("schedule",o.scheduleId,{startTime:`${W}T${U(Q)}:${U(J)}`,finishTime:`${W}T${U(le)}:${U(ve)}`,hours:G}),H(`Time updated to ${S(K)} — ${S(ne)}`,"success")}}else{const ae=r.getAll("jobs").find(W=>W.id===se);if(ae){let W=ae.technicians||[];W.length>0&&(W=W.map(U=>({...U,hours:G}))),r.update("jobs",se,{startHour:K,estimatedHours:parseFloat(G.toFixed(4)),technicians:W.length>0?W:ae.technicians}),H("Job time updated","success")}}o=null}document.addEventListener("mousemove",te),document.addEventListener("mouseup",ce)})})}function j(){Rs(e,{getWeekDays:_,viewMode:c,currentDate:m,calendarType:l,isTechnician:s,onNav:F=>{m.setDate(m.getDate()+(c==="week"?7*F:F)),w()},onToday:()=>{m=new Date,w()},onViewMode:F=>{c=F,w()},onCalType:F=>{l=F,w()}})}w()}function Bs(e){const a=[],t=e.split(/\r?\n/).filter(l=>l.trim().length>0);if(t.length===0)return a;const s=t[0],c=$a(s);for(let l=1;l<t.length;l++){const m=t[l],n=$a(m),p={};for(let o=0;o<c.length;o++){const f=c[o]?c[o].trim():`col${o}`;p[f]=n[o]!==void 0?n[o].trim():""}a.push(p)}return a}function $a(e){const a=[];let t="",s=!1;for(let c=0;c<e.length;c++){const l=e[c];l==='"'?s&&e[c+1]==='"'?(t+='"',c++):s=!s:l===","&&!s?(a.push(t),t=""):t+=l}return a.push(t),a}function yt(e){var g;const a=r.getAll("stock");e.innerHTML=`
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
  `;const t=e.querySelector("#location-filter"),s=[...new Set(a.flatMap(i=>(i.locations||[]).map(d=>d.location||"Unassigned")))].sort(),c=s.filter(i=>i.toLowerCase().includes("warehouse")||i==="Main"||i==="Main Warehouse"),l=s.filter(i=>i.toLowerCase().includes("vehicle")||i.toLowerCase().includes("van")||i.toLowerCase().includes("truck")||i.toLowerCase().includes("van stock")),m=s.filter(i=>!c.includes(i)&&!l.includes(i));if(c.length>0){const i=document.createElement("optgroup");i.label="Warehouses",c.forEach(d=>{const x=new Option(d,d);i.appendChild(x)}),t.appendChild(i)}if(l.length>0){const i=document.createElement("optgroup");i.label="Vehicles / Vans",l.forEach(d=>{const x=new Option(d,d);i.appendChild(x)}),t.appendChild(i)}if(m.length>0){const i=document.createElement("optgroup");i.label="Other",m.forEach(d=>{const x=new Option(d,d);i.appendChild(x)}),t.appendChild(i)}let n={category:"all",location:"all",search:""};function p(){const i=n.search.toLowerCase(),d=a.filter(x=>{const u=n.category==="all"||x.category===n.category,b=n.location==="all"||(x.locations||[]).some(k=>k.location===n.location),h=!i||x.name.toLowerCase().includes(i)||x.sku.toLowerCase().includes(i)||x.category.toLowerCase().includes(i)||(x.locations||[]).some(k=>k.location.toLowerCase().includes(i));return u&&b&&h});f.updateData(d)}const f=Xe({columns:[{key:"name",label:"Item Name",render:i=>`<span class="cell-link font-medium">${y(i.name)}</span>`},{key:"sku",label:"SKU",render:i=>`<span class="text-secondary" style="font-family:monospace">${y(i.sku)}</span>`,width:"90px"},{key:"category",label:"Category",render:i=>`<span class="badge badge-neutral">${y(i.category)}</span>`,width:"110px"},{key:"quantity",label:"Total Qty",render:i=>{const d=(i.locations||[]).reduce((u,b)=>u+b.quantity,0),x=d<=i.reorderLevel;return`<span style="font-weight:600;color:${x?"var(--color-danger)":"var(--text-primary)"}">${d}</span>${x?' <span class="badge badge-danger" style="margin-left:4px">LOW</span>':""}`},getValue:i=>(i.locations||[]).reduce((d,x)=>d+x.quantity,0),width:"100px"},{key:"unitPrice",label:"Unit Price",render:i=>`$${i.unitPrice.toFixed(2)}`,getValue:i=>i.unitPrice,width:"100px"},{key:"locations",label:"Locations Breakdown",render:i=>!i.locations||i.locations.length===0?'<span class="text-tertiary" style="font-size: 12px;">No Stock</span>':`<div style="display:flex; flex-direction:column; gap:4px">
        ${i.locations.map(d=>`
            <div style="display:flex; align-items:center; gap:6px; font-size:12px">
              <span class="material-icons-outlined" style="font-size:14px; color:var(--text-tertiary)">${d.location.toLowerCase().includes("vehicle")||d.location.toLowerCase().includes("van")||d.location.toLowerCase().includes("truck")?"local_shipping":"warehouse"}</span>
              <span class="text-secondary" style="font-weight:500">${y(d.location)}:</span>
              <span style="font-weight:600; color:var(--text-primary)">${d.quantity}</span>
            </div>
          `).join("")}
      </div>`,width:"240px"},{key:"supplier",label:"Supplier",render:i=>`<span class="text-secondary">${y(i.supplier)}</span>`}],data:a,onRowClick:i=>X.navigate(`/stock/${i}`),emptyMessage:"No stock items",emptyIcon:"inventory_2",selectable:!0,onSelectionChange:i=>{Ze({container:e,selectedIds:i,onClear:()=>f.clearSelection(),actions:[{label:"Change Category",icon:"category",onClick:d=>{const x=[...new Set(r.getAll("stock").map(b=>b.category))],u=document.createElement("div");u.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Select Category</label>
                  <select class="form-select" id="bulk-category">
                    ${x.map(b=>`<option value="${y(b)}">${y(b)}</option>`).join("")}
                    <option value="NEW">New Category...</option>
                  </select>
                </div>
                <div id="new-cat-field" style="display:none; margin-top: 10px;">
                   <input type="text" class="form-input" id="bulk-new-category" placeholder="Enter new category name">
                </div>
              `,u.querySelector("#bulk-category").addEventListener("change",b=>{u.querySelector("#new-cat-field").style.display=b.target.value==="NEW"?"block":"none"}),xe({title:`Update ${d.length} Items`,content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Apply",className:"btn-primary",onClick:b=>{let h=u.querySelector("#bulk-category").value;h==="NEW"&&(h=u.querySelector("#bulk-new-category").value.trim()),h&&(d.forEach(k=>r.update("stock",k,{category:h})),f.clearSelection(),yt(e),H(`Updated ${d.length} items to category: ${h}`,"success"),b())}}]})}},{label:"Adjust Price",icon:"payments",onClick:d=>{const x=document.createElement("div");x.innerHTML=`
                <div class="form-group">
                  <label class="form-label">Price Adjustment (%)</label>
                  <input type="number" class="form-input" id="bulk-price-adjust" value="5" placeholder="e.g. 5 for +5%, -5 for -5%">
                  <small class="text-tertiary">Adjusts unit price by the specified percentage.</small>
                </div>
              `,xe({title:`Adjust Price for ${d.length} Items`,content:x,actions:[{label:"Cancel",className:"btn-secondary",onClick:u=>u()},{label:"Apply",className:"btn-primary",onClick:u=>{const b=parseFloat(x.querySelector("#bulk-price-adjust").value);if(isNaN(b))return;const h=1+b/100;d.forEach(k=>{const S=r.getById("stock",k);S&&r.update("stock",k,{unitPrice:S.unitPrice*h})}),f.clearSelection(),yt(e),H(`Adjusted prices for ${d.length} items by ${b}%`,"success"),u()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{xe({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${d.length} stock items? This action cannot be undone.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Delete",className:"btn-danger",onClick:x=>{d.forEach(u=>r.delete("stock",u)),f.clearSelection(),yt(e),H(`Deleted ${d.length} stock items`,"success"),x()}}]})}}]})}});e.querySelector("#stock-table-container").appendChild(f),e.querySelectorAll(".toolbar-filter").forEach(i=>{i.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(d=>d.classList.remove("active")),i.classList.add("active"),n.category=i.dataset.filter,p()})}),e.querySelector("#location-filter").addEventListener("change",i=>{n.location=i.target.value,p()}),e.querySelector("#stock-search").addEventListener("input",i=>{n.search=i.target.value,p()}),e.querySelector("#btn-new-stock").addEventListener("click",()=>{const i=r.getAll("technicians"),d=document.createElement("div");d.innerHTML=`
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
              ${i.map(x=>`<option value="Vehicle - ${y(x.name)}">Vehicle - ${y(x.name)}</option>`).join("")}
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
    `,He({title:"New Stock Item",content:d.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Create",className:"btn-primary",onClick:x=>{const u=document.querySelector(".drawer-overlay"),b=u.querySelector("#new-stock-name").value.trim(),h=u.querySelector("#new-stock-category").value.trim()||"Uncategorized",k=u.querySelector("#new-stock-location").value,S=parseFloat(u.querySelector("#new-stock-cost").value),L=parseInt(u.querySelector("#new-stock-qty").value)||0;if(!b||isNaN(S)){H("Please fill all required fields correctly","error");return}r.create("stock",{name:b,sku:"SKU-"+Date.now().toString().slice(-6),category:h,quantity:L,unitPrice:S*1.5,costPrice:S,location:k,locations:[{location:k,quantity:L}],supplier:"Unknown"}),H("Stock item created","success"),yt(e),x()}}]})}),(g=e.querySelector("#btn-transfer-stock"))==null||g.addEventListener("click",()=>{var b;const i=r.getAll("stock"),d=r.getAll("technicians");if(i.length===0){H("No stock items available to transfer","error");return}const x=document.createElement("div");x.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="form-group">
          <label class="form-label">Item to Transfer *</label>
          <select class="form-select" id="transfer-item">
            <option value="">Select item...</option>
            ${i.map(h=>`<option value="${y(h.id)}">${y(h.name)} (${y(h.sku)})</option>`).join("")}
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
                ${d.map(h=>`<option value="Vehicle - ${y(h.name)}">Vehicle - ${y(h.name)}</option>`).join("")}
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
    `,He({title:"Transfer Stock",content:x.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:h=>h()},{label:"Transfer",className:"btn-primary",onClick:h=>{var w;const k=document.querySelector(".drawer-overlay"),S=k.querySelector("#transfer-item").value,L=k.querySelector("#transfer-from").value,T=k.querySelector("#transfer-to").value,I=parseInt(k.querySelector("#transfer-qty").value)||0;if(!S||!L||!T||I<=0){H("Please fill all fields correctly","error");return}if(L===T){H("Cannot transfer to the same location","error");return}const _=r.getById("stock",S);if(!_)return;const A=(_.locations||[]).find(v=>v.location===L);if(!A||A.quantity<I){H("Insufficient quantity at source location","error");return}A.quantity-=I,_.locations||(_.locations=[]);let q=_.locations.find(v=>v.location===T);q?q.quantity+=I:_.locations.push({location:T,quantity:I}),_.locations=_.locations.filter(v=>v.quantity>0),_.quantity=_.locations.reduce((v,$)=>v+$.quantity,0),_.location=((w=_.locations[0])==null?void 0:w.location)||"Main Warehouse",r.update("stock",_.id,_),H(`Successfully transferred ${I}x ${_.name} to ${T}`,"success"),yt(e),h()}}]}),(b=e.querySelector("#btn-import-stock"))==null||b.addEventListener("click",()=>u(e));function u(h){const k=document.createElement("div");k.innerHTML=`
        <div class="form-group">
          <label class="form-label">Select CSV File *</label>
          <input type="file" accept=".csv,text/csv" id="csv-file-input" class="form-input" />
        </div>
      `,xe({title:"Import Stock from CSV",content:k,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Next",className:"btn-primary",onClick:S=>{const L=document.getElementById("csv-file-input");if(!L.files.length){H("Please select a CSV file","error");return}const T=L.files[0],I=new FileReader;I.onload=_=>{const A=_.target.result,q=Bs(A);if(q.length===0){H("CSV file appears empty","error");return}const w=Object.keys(q[0]),v=[{key:"name",label:"Item Name"},{key:"sku",label:"SKU"},{key:"category",label:"Category"},{key:"unitPrice",label:"Unit Price"},{key:"quantity",label:"Qty"},{key:"location",label:"Location"},{key:"supplier",label:"Supplier"}],$=document.createElement("div");$.innerHTML=v.map(C=>`
                  <div class="form-group">
                    <label class="form-label">${C.label}</label>
                    <select class="form-select" id="map-${C.key}">
                      <option value="">-- ignore --</option>
                      ${w.map(N=>`<option value="${N}">${N}</option>`).join("")}
                    </select>
                  </div>
                `).join(""),xe({title:"Map CSV Columns",content:$,actions:[{label:"Back",className:"btn-secondary",onClick:C=>C()},{label:"Import",className:"btn-primary",onClick:C=>{const N={};v.forEach(z=>{const M=document.getElementById("map-"+z.key);M&&M.value&&(N[z.key]=M.value)});const O=q.slice(0,5).map(z=>{const M={};return Object.entries(N).forEach(([E,j])=>{M[E]=z[j]}),M}),D=document.createElement("div");D.innerHTML="<pre>"+JSON.stringify(O,null,2)+"</pre>",xe({title:"Preview Import (first 5 rows)",content:D,actions:[{label:"Back",className:"btn-secondary",onClick:z=>z()},{label:"Execute",className:"btn-primary",onClick:z=>{q.forEach(M=>{const E={};E.name=(M[N.name]||"").trim()||"Untitled",E.sku=(M[N.sku]||"").trim()||"SKU-"+Date.now().toString().slice(-6),E.category=(M[N.category]||"").trim()||"Uncategorized";const j=parseFloat(M[N.unitPrice]);E.unitPrice=isNaN(j)?0:j;const F=parseInt(M[N.quantity]),R=isNaN(F)?0:F,B=(M[N.location]||"").trim()||"Main Warehouse";E.locations=[{location:B,quantity:R}],E.quantity=R,E.location=B,E.supplier=(M[N.supplier]||"").trim()||"Unknown",E.costPrice=E.unitPrice/1.5,r.create("stock",E)}),H(`Imported ${q.length} stock items`,"success"),yt(h),z()}}]}),C()}}]}),S()},I.readAsText(T)}}]})}setTimeout(()=>{const h=document.querySelector(".drawer-overlay");if(!h)return;const k=h.querySelector("#transfer-item"),S=h.querySelector("#transfer-from"),L=h.querySelector("#transfer-qty"),T=h.querySelector("#transfer-available-info");k.addEventListener("change",()=>{const _=k.value;if(!_){S.innerHTML='<option value="">Select an item first...</option>',S.disabled=!0,L.disabled=!0,T.style.display="none";return}const A=i.find(w=>w.id===_);if(!A||!A.locations||A.locations.length===0){S.innerHTML='<option value="">No locations available</option>',S.disabled=!0,L.disabled=!0,T.style.display="none";return}const q=A.locations.filter(w=>w.quantity>0);if(q.length===0){S.innerHTML='<option value="">Out of stock everywhere</option>',S.disabled=!0,L.disabled=!0,T.style.display="none";return}S.innerHTML=q.map(w=>`
          <option value="${y(w.location)}" data-max="${w.quantity}">${y(w.location)} (Available: ${w.quantity})</option>
        `).join(""),S.disabled=!1,L.disabled=!1,I()}),S.addEventListener("change",I);function I(){const _=S.options[S.selectedIndex];if(!_)return;const A=parseInt(_.dataset.max)||0;L.max=A,L.value=Math.min(L.value||1,A),T.textContent=`Max available: ${A}`,T.style.display="block"}},100)})}function Vs(e,{id:a}){const t=r.getById("stock",a);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Item not found</h3></div>';return}dt(t.name);const s=(t.locations||[]).reduce((n,p)=>n+p.quantity,0),c=s<=t.reorderLevel,l=t.unitPrice>0?((t.unitPrice-t.costPrice)/t.unitPrice*100).toFixed(1):0,m=(t.locations||[]).map(n=>`
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-color)">
        <div style="display:flex; align-items:center; gap:8px">
          <span class="material-icons-outlined" style="font-size:20px; color:var(--text-tertiary)">${n.location.toLowerCase().includes("vehicle")||n.location.toLowerCase().includes("van")||n.location.toLowerCase().includes("truck")?"local_shipping":"warehouse"}</span>
          <span class="text-secondary" style="font-weight:500">${y(n.location)}</span>
        </div>
        <span style="font-weight:600; font-size:14px; color:var(--text-primary)">${n.quantity} ${y(t.unit||"each")}s</span>
      </div>
    `).join("")||'<div class="text-tertiary" style="padding:12px 0">No stock in any location</div>';e.innerHTML=`
    ${mt({title:t.name,icon:"inventory_2",iconBgColor:c?"var(--color-danger-bg)":"var(--color-success-bg)",iconTextColor:c?"var(--color-danger)":"var(--color-success)",metaHtml:`
        <span style="font-family:monospace">${t.sku}</span>
        <span class="badge badge-neutral">${t.category}</span>
        ${c?'<span class="badge badge-danger">LOW STOCK</span>':'<span class="badge badge-success">IN STOCK</span>'}
      `,actionsHtml:`
        <button class="btn btn-secondary" id="btn-edit-stock"><span class="material-icons-outlined">edit</span> Edit</button>
        <button class="btn btn-danger btn-icon" id="btn-delete-stock"><span class="material-icons-outlined">delete</span></button>
      `})}

    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      <div class="stat-card">
        <div class="stat-label">Consolidated Stock</div>
        <div class="stat-value" style="color:${c?"var(--color-danger)":"var(--text-primary)"}">${s}</div>
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
        <div class="text-sm text-secondary">Stock Value (Cost): $${(s*t.costPrice).toFixed(2)}</div>
      </div>
    </div>

    <div class="grid-3" style="align-items: start;">
      <div style="grid-column: span 2; display:flex; flex-direction:column; gap:20px">
        <div class="card">
          <div class="card-header"><h4>Location Stock Breakdown</h4></div>
          <div class="card-body" style="padding-top:0">
            ${m}
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

      <div class="card" style="grid-column: span 1; height: fit-content;">
        <div class="card-header"><h4>Pricing & Value</h4></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${it("Cost Price",`$${t.costPrice.toFixed(2)}`)}
            ${it("Sell Price",`$${t.unitPrice.toFixed(2)}`)}
            ${it("Margin",`${l}%`)}
            ${it("Consolidated Value (Sell)",`$${(s*t.unitPrice).toFixed(2)}`)}
            ${it("Consolidated Value (Cost)",`$${(s*t.costPrice).toFixed(2)}`)}
          </div>
        </div>
      </div>
    </div>
  `,e.querySelector("#btn-edit-stock").addEventListener("click",()=>X.navigate(`/stock/${a}/edit`)),e.querySelector("#btn-delete-stock").addEventListener("click",()=>{const n=document.createElement("div");n.innerHTML=`<p>Delete <strong>${y(t.name)}</strong>?</p>`,xe({title:"Delete Stock Item",content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:p=>p()},{label:"Delete",className:"btn-danger",onClick:p=>{r.delete("stock",a),H("Item deleted","success"),p(),X.navigate("/stock")}}]})})}function it(e,a){return`<div style="display:flex;gap:8px"><span style="width:180px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${e}</span><span style="font-weight:600">${a}</span></div>`}function Fa(e,{id:a}){const t=a&&a!=="new",s=t?r.getById("stock",a):{},c=r.getAll("technicians"),l=r.getAll("assets"),m=r.getAll("suppliers").filter(i=>i.active!==!1);function n(i=""){let d='<option value="">Select location...</option>';return d+=`<option value="Main Warehouse" ${i==="Main Warehouse"?"selected":""}>Main Warehouse</option>`,d+='<optgroup label="Warehouses">',["Warehouse A","Warehouse B"].forEach(x=>{d+=`<option value="${x}" ${i===x?"selected":""}>${x}</option>`}),d+="</optgroup>",d+='<optgroup label="Vehicles">',c.forEach(x=>{const u=`Vehicle - ${x.name}`;d+=`<option value="${u}" ${i===u?"selected":""}>${u}</option>`}),d+="</optgroup>",d+='<optgroup label="Assets">',l.forEach(x=>{d+=`<option value="${x.name}" ${i===x.name?"selected":""}>${x.name}</option>`}),d+="</optgroup>",d+=`<option value="On Order" ${i==="On Order"?"selected":""}>On Order</option>`,d}function p(i="",d=0){return`
      <div class="location-row" style="display:flex; gap:12px; align-items:center; margin-bottom:10px">
        <div style="flex:1">
          <select class="form-select loc-select" required style="width:100%">
            ${n(i)}
          </select>
        </div>
        <div style="width:120px">
          <input type="number" class="form-input loc-qty" min="0" value="${d}" required style="width:100%" />
        </div>
        <div>
          <button type="button" class="btn btn-icon btn-danger btn-remove-loc" style="padding:6px"><span class="material-icons-outlined">delete</span></button>
        </div>
      </div>
    `}let o="";t&&s.locations&&s.locations.length>0?o=s.locations.map(i=>p(i.location,i.quantity)).join(""):o=p(s.location||"Warehouse A",s.quantity||0),e.innerHTML=`
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
              ${m.map(i=>`<option value="${y(i.name)}" ${s.supplier===i.name?"selected":""}>${y(i.name)}</option>`).join("")}
              ${s.supplier&&!m.some(i=>i.name===s.supplier)?`<option value="${y(s.supplier)}" selected>${y(s.supplier)} (Inactive / Custom)</option>`:""}
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
              ${o}
            </div>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
        <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> ${t?"Update":"Create"} Item</button>
      </div>
    </div>
  `;const f=e.querySelector("#locations-editor-container");e.querySelector("#btn-add-loc-row").addEventListener("click",()=>{const i=document.createElement("div");i.innerHTML=p();const d=i.firstElementChild;f.appendChild(d),g(d)});function g(i){i.querySelector(".btn-remove-loc").addEventListener("click",()=>{f.querySelectorAll(".location-row").length>1?i.remove():H("At least one stock location is required","error")})}f.querySelectorAll(".location-row").forEach(g),e.querySelector("#btn-cancel").addEventListener("click",()=>X.navigate(t?`/stock/${a}`:"/stock")),e.querySelector("#btn-save").addEventListener("click",()=>{var h;const i=e.querySelector("#stock-form");if(!i.checkValidity()){i.reportValidity();return}const x=Array.from(f.querySelectorAll(".location-row")).map(k=>{const S=k.querySelector(".loc-select").value,L=parseInt(k.querySelector(".loc-qty").value)||0;return{location:S,quantity:L}}).filter(k=>k.location!=="");if(x.length===0){H("Please select at least one valid stock location","error");return}const u=x.map(k=>k.location);if(new Set(u).size!==u.length){H("Duplicate locations detected. Please merge them into a single row.","error");return}const b=Object.fromEntries(new FormData(i));if(b.costPrice=parseFloat(b.costPrice)||0,b.unitPrice=parseFloat(b.unitPrice)||0,b.reorderLevel=parseInt(b.reorderLevel)||10,b.locations=x,b.quantity=x.reduce((k,S)=>k+S.quantity,0),b.location=((h=x[0])==null?void 0:h.location)||"Main Warehouse",t)r.update("stock",a,b),H("Item updated successfully","success"),wa(b),X.navigate(`/stock/${a}`);else{b.sku=b.sku||`SKU-${Date.now().toString().slice(-4)}`;const k=r.create("stock",b);H("Item created successfully","success"),wa(b),X.navigate(`/stock/${k.id}`)}})}function wa(e){if(e.quantity<=e.reorderLevel){const a=JSON.parse(localStorage.getItem("currentUser")||"{}");let t=!1;if(a.role==="admin")t=!0;else if(a.userTypeId){const s=r.getById("userTypes",a.userTypeId);if(s&&s.permissions){const c=s.permissions.find(l=>l.module==="Stock");c&&(t=c.edit||c.create)}}t&&(me(async()=>{const{showToast:s}=await Promise.resolve().then(()=>De);return{showToast:s}},void 0).then(({showToast:s})=>{s(`Auto-Reorder Alert: ${e.name} is at or below its reorder level (${e.quantity} left).`,"warning")}),r.create("notifications",{title:"Stock Auto-Reorder",message:`${e.name} (SKU: ${e.sku}) has reached its reorder level. Current quantity: ${e.quantity}. Please reorder from ${e.supplier||"supplier"}.`,read:!1,link:"/stock"}))}}function Ft(e){const a=r.getAll("invoices");e.innerHTML=`
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
  `;let t=[...a];const s={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"},l=Xe({columns:[{key:"number",label:"Invoice #",render:p=>`<span class="cell-link font-medium">${y(p.number)}</span>`,width:"110px"},{key:"customerName",label:"Customer"},{key:"jobNumber",label:"Job Ref",render:p=>p.jobNumber?`<span class="text-secondary">${y(p.jobNumber)}</span>`:"—",width:"100px"},{key:"status",label:"Status",render:p=>`<span class="badge ${s[p.status]||"badge-neutral"}">${y(p.status)}</span>`,width:"100px"},{key:"total",label:"Total",render:p=>`<span class="font-semibold">$${(p.total||0).toLocaleString("en-AU",{minimumFractionDigits:2})}</span>`,getValue:p=>p.total,width:"110px"},{key:"issueDate",label:"Issue Date",render:p=>p.issueDate?new Date(p.issueDate).toLocaleDateString():"—",getValue:p=>p.issueDate?new Date(p.issueDate).getTime():0,width:"100px"},{key:"dueDate",label:"Due Date",render:p=>p.dueDate?new Date(p.dueDate).toLocaleDateString():"—",getValue:p=>p.dueDate?new Date(p.dueDate).getTime():0,width:"100px"}],data:t,onRowClick:p=>X.navigate(`/invoices/${p}`),emptyMessage:"No invoices found",emptyIcon:"receipt_long",selectable:!0,onSelectionChange:p=>{Ze({container:e,selectedIds:p,onClear:()=>l.clearSelection(),actions:[{label:"Mark Paid",icon:"check_circle",onClick:o=>{o.forEach(f=>r.update("invoices",f,{status:"Paid",datePaid:new Date().toISOString()})),l.clearSelection(),Ft(e),me(async()=>{const{showToast:f}=await Promise.resolve().then(()=>De);return{showToast:f}},void 0).then(({showToast:f})=>f(`Marked ${o.length} invoices as Paid`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:o=>{const f=document.createElement("div");f.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Pe);return{showModal:g}},void 0).then(({showModal:g})=>{g({title:`Update ${o.length} Invoices`,content:f,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Apply",className:"btn-primary",onClick:i=>{const d=f.querySelector("#bulk-status").value;o.forEach(x=>r.update("invoices",x,{status:d})),l.clearSelection(),Ft(e),me(async()=>{const{showToast:x}=await Promise.resolve().then(()=>De);return{showToast:x}},void 0).then(({showToast:x})=>x(`Updated ${o.length} invoices to ${d}`,"success")),i()}}]})})}},{label:"Send Reminders",icon:"notifications_active",onClick:o=>{me(async()=>{const{showToast:f}=await Promise.resolve().then(()=>De);return{showToast:f}},void 0).then(({showToast:f})=>f(`Sending reminders for ${o.length} invoices...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:o=>{me(async()=>{const{showModal:f}=await Promise.resolve().then(()=>Pe);return{showModal:f}},void 0).then(({showModal:f})=>{const g=document.createElement("div");g.innerHTML=`<p>Are you sure you want to delete ${o.length} invoices? This action cannot be undone.</p>`,f({title:"Confirm Bulk Delete",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{o.forEach(d=>r.delete("invoices",d)),l.clearSelection(),Ft(e),me(async()=>{const{showToast:d}=await Promise.resolve().then(()=>De);return{showToast:d}},void 0).then(({showToast:d})=>d(`Deleted ${o.length} invoices`,"success")),i()}}]})})}}]})}});e.querySelector("#invoices-table-container").appendChild(l),e.querySelector("#btn-new-invoice").addEventListener("click",()=>X.navigate("/invoices/new"));const m=e.querySelector("#btn-export-accounting");function n(p){p.some(o=>o.status==="Paid")?m.style.display="inline-flex":m.style.display="none"}n(t),e.querySelectorAll(".toolbar-filter").forEach(p=>{p.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(f=>f.classList.remove("active")),p.classList.add("active");const o=p.dataset.filter;t=o==="all"?[...a]:a.filter(f=>f.status===o),l.updateData(t),n(t)})}),m.addEventListener("click",()=>{const p=t.filter(i=>i.status==="Paid");if(p.length===0)return;let o="data:text/csv;charset=utf-8,";o+=`InvoiceNumber,ContactName,EmailAddress,InvoiceDate,DueDate,TotalAmount,TaxAmount,AccountCode
`,p.forEach(i=>{const d=[i.number,`"${i.customerName.replace(/"/g,'""')}"`,i.email||"",i.issueDate?i.issueDate.split("T")[0]:"",i.dueDate?i.dueDate.split("T")[0]:"",(i.total||0).toFixed(2),(i.tax||0).toFixed(2),"200"].join(",");o+=d+`
`});const f=encodeURI(o),g=document.createElement("a");g.setAttribute("href",f),g.setAttribute("download",`accounting_export_${Date.now()}.csv`),document.body.appendChild(g),g.click(),document.body.removeChild(g),me(async()=>{const{showToast:i}=await Promise.resolve().then(()=>De);return{showToast:i}},void 0).then(({showToast:i})=>{i(`Exported ${p.length} paid invoices`,"success")})}),e.querySelector("#invoices-search").addEventListener("input",p=>{const o=p.target.value.toLowerCase();t=a.filter(f=>f.number.toLowerCase().includes(o)||f.customerName.toLowerCase().includes(o)||(f.jobNumber||"").toLowerCase().includes(o)),l.updateData(t),n(t)})}function Ha(e,{id:a}){const t=a==="new";let s=t?{number:`INV-${Date.now().toString().slice(-6)}`,status:"Draft",sections:[{id:r.generateId(),name:"Main Phase",lineItems:[]}],subtotal:0,tax:0,total:0,issueDate:new Date().toISOString(),dueDate:new Date(Date.now()+30*864e5).toISOString(),invoiceType:"Standard"}:r.getById("invoices",a);if(!s){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Invoice not found</h3></div>';return}s.lineItems&&!s.sections&&(s.sections=[{id:r.generateId(),name:"Main Phase",lineItems:[...s.lineItems]}],delete s.lineItems),t||dt(s.number);const c=r.getAll("customers"),l=r.getAll("stock"),m=r.getSettings(),n={Draft:"badge-neutral",Sent:"badge-info",Paid:"badge-success",Overdue:"badge-danger",Void:"badge-neutral"};function p(){e.innerHTML=`
      ${mt({title:`
          ${t?"New Invoice":s.number}
          ${s.invoiceType==="CreditNote"?'<span class="badge badge-danger">CREDIT NOTE</span>':s.invoiceType&&s.invoiceType!=="Standard"?`<span class="badge badge-primary">${s.invoiceType.toUpperCase()}</span>`:""}
        `,icon:"receipt_long",iconBgColor:"var(--color-success-bg)",iconTextColor:"var(--color-success)",metaHtml:`
          ${s.customerName?`<span><span class="material-icons-outlined" style="font-size:14px">business</span> ${s.customerName}</span>`:""}
          ${s.jobNumber?`<span><span class="material-icons-outlined" style="font-size:14px">build</span> ${s.jobNumber}</span>`:""}
          <span class="badge ${n[s.status]||"badge-neutral"}">${s.status}</span>
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
              <div style="font-weight:700; color:var(--color-primary-dark); font-size:14px">Linked Quote: <a href="#/quotes/${s.originalQuoteId}" style="text-decoration:underline; font-weight:800; color:inherit">${y(s.originalQuoteNumber)}</a></div>
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
                ${c.map(d=>`<option value="${d.id}" ${s.customerId===d.id?"selected":""}>${d.company}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Labor Profile</label>
              <select class="form-select" id="inv-labor-profile">
                <option value="">-- Custom / Manual Rates --</option>
                ${m.laborRates.map(d=>`<option value="${d.id}" ${s.laborProfileId===d.id?"selected":""}>${d.name} ($${d.rate.toFixed(2)}/hr)</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-select" id="inv-type">
                ${["Standard","Deposit","Progress","CreditNote"].map(d=>`<option ${s.invoiceType===d?"selected":""}>${d}</option>`).join("")}
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
                ${["Draft","Sent","Paid","Overdue","Void"].map(d=>`<option ${s.status===d?"selected":""}>${d}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>
      </div>

      <datalist id="stock-items-list">
        ${l.map(d=>`<option value="${d.name}"></option>`).join("")}
      </datalist>

      <!-- Sections -->
      <div id="sections-container">
        ${(s.sections||[]).map((d,x)=>o(d,x)).join("")}
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
    `,i()}function o(d,x){const u=d.isVariation===!0,b=u?"border: 2px dashed var(--color-warning); background: rgba(245,158,11,0.01)":"",h=u?"background: rgba(245,158,11,0.04)":"",k=u?d.customerApproved?'<span class="badge badge-success" style="margin-right:8px"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;margin-right:2px">check_circle</span> Approved Variation</span>':'<span class="badge badge-warning" style="margin-right:8px; border-color:var(--color-warning); color:var(--color-warning-dark)"><span class="material-icons-outlined" style="font-size:12px;vertical-align:middle;margin-right:2px">schedule</span> Awaiting Customer Approval</span>':"",S=u?`<label style="display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; cursor:pointer; margin-right:16px; background:#fff; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; margin-bottom:0">
           <input type="checkbox" class="variation-approved-checkbox" data-sidx="${x}" ${d.customerApproved?"checked":""} style="width:16px; height:16px; margin:0" /> Customer Agreed
         </label>`:"";return`
      <div class="card" style="margin-bottom:var(--space-lg); ${b}" data-section-index="${x}">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; ${h}">
          <div style="display:flex; align-items:center; gap:12px; flex:1">
            ${u?'<span class="material-icons-outlined" style="color:var(--color-warning); font-size:20px">history_edu</span>':""}
            <input class="form-input section-name-input" value="${d.name||""}" placeholder="${u?"e.g. Variation - Additional Cabling":"Phase/Section Name"}" style="font-size:1.1rem; font-weight:600; background:transparent; border:none; border-bottom:1px solid var(--border-color); width:300px" />
            ${k}
          </div>
          <div style="display:flex; align-items:center; gap:8px">
            ${S}
            <span class="badge badge-neutral" style="margin-right:12px">Subtotal: $${(d.subtotal||0).toFixed(2)}</span>
            <button class="btn btn-sm btn-primary btn-add-line" data-sidx="${x}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Item</button>
            <button class="btn btn-sm btn-ghost btn-remove-section" data-sidx="${x}"><span class="material-icons-outlined" style="font-size:16px; color:var(--color-danger)">delete</span></button>
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
              ${(d.lineItems||[]).map((L,T)=>f(L,x,T)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `}function f(d,x,u){return`
      <tr data-sidx="${x}" data-index="${u}">
        <td><input class="form-input item-input" list="stock-items-list" style="padding:4px 8px" value="${d.description||""}" data-field="description" placeholder="Type item name..." /></td>
        <td><select class="form-select item-input" style="padding:4px 8px" data-field="type">
          <option value="labor" ${d.type==="labor"?"selected":""}>Labor</option>
          <option value="material" ${d.type==="material"?"selected":""}>Material</option>
          <option value="other" ${d.type==="other"?"selected":""}>Other</option>
        </select></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${d.qty||1}" data-field="qty" min="1" /></td>
        <td><input class="form-input item-input" style="padding:4px 8px" type="number" value="${d.rate||0}" data-field="rate" step="0.01" /></td>
        <td style="font-weight:600" class="item-total-cell">$${(d.total||0).toFixed(2)}</td>
        <td><button class="btn btn-ghost btn-icon btn-sm btn-remove-line" data-sidx="${x}" data-index="${u}"><span class="material-icons-outlined" style="font-size:16px">close</span></button></td>
      </tr>
    `}function g(){let d=0,x=0,u=0;s.totalInternalCost=0,r.getSettings(),(s.sections||[]).forEach(h=>{h.subtotal=0,(h.lineItems||[]).forEach(k=>{k.total=(k.qty||0)*(k.rate||0),k.internalCost||(k.type==="labor"?k.internalCost=45:k.internalCost=k.rate*.7),h.subtotal+=k.total}),h.isVariation===!0?h.customerApproved===!0?(x+=h.subtotal,(h.lineItems||[]).forEach(k=>{s.totalInternalCost+=(k.qty||0)*(k.internalCost||0)})):u+=h.subtotal:(d+=h.subtotal,(h.lineItems||[]).forEach(k=>{s.totalInternalCost+=(k.qty||0)*(k.internalCost||0)}))}),(s.originalSubtotal===void 0||s.originalSubtotal===0)&&(s.originalSubtotal=d);let b=d+x;s.invoiceType==="CreditNote"?s.subtotal=-Math.abs(b):s.subtotal=Math.abs(b),s.tax=s.subtotal*.1,s.total=s.subtotal+s.tax,s.approvedVariationsSum=x,s.pendingVariationsSum=u,p()}function i(){var x,u,b,h,k,S,L,T,I,_,A;(x=e.querySelector("#btn-preview-pdf"))==null||x.addEventListener("click",()=>{ra({type:"invoice",data:s})});const d=e.querySelector(".dropdown > .btn");d&&(d.addEventListener("click",q=>{q.stopPropagation();const w=d.nextElementSibling;w.style.display=w.style.display==="none"?"block":"none"}),document.addEventListener("click",()=>{const q=e.querySelector(".dropdown-menu");q&&(q.style.display="none")})),(u=e.querySelector("#inv-labor-profile"))==null||u.addEventListener("change",q=>{s.laborProfileId=q.target.value;const w=m.laborRates.find(v=>v.id===s.laborProfileId);w&&(s.sections.forEach(v=>{v.lineItems.forEach($=>{$.type==="labor"&&($.rate=w.rate)})}),g())}),(b=e.querySelector("#btn-add-section"))==null||b.addEventListener("click",()=>{s.sections.push({id:r.generateId(),name:"New Phase",isVariation:!1,lineItems:[]}),g()}),(h=e.querySelector("#btn-add-variation"))==null||h.addEventListener("click",()=>{s.sections.push({id:r.generateId(),name:"Variation Phase",isVariation:!0,customerApproved:!1,lineItems:[]}),g()}),(k=e.querySelector("#btn-unlink-quote"))==null||k.addEventListener("click",()=>{s.originalQuoteId="",s.originalQuoteNumber="",s.originalSubtotal=0,g(),H("Invoice unlinked from quote","info")}),e.querySelectorAll(".section-name-input").forEach((q,w)=>{q.addEventListener("change",()=>{s.sections[w].name=q.value})}),e.querySelectorAll(".btn-add-line").forEach(q=>{q.addEventListener("click",()=>{const w=parseInt(q.dataset.sidx);s.sections[w].lineItems.push({description:"",type:"labor",qty:1,rate:0,total:0}),p()})}),e.querySelectorAll(".btn-remove-section").forEach(q=>{q.addEventListener("click",()=>{const w=parseInt(q.dataset.sidx);confirm("Remove this entire phase?")&&(s.sections.splice(w,1),g())})}),e.querySelectorAll(".variation-approved-checkbox").forEach(q=>{q.addEventListener("change",()=>{const w=parseInt(q.dataset.sidx);s.sections[w].customerApproved=q.checked,g()})}),e.querySelectorAll(".item-input").forEach(q=>{q.addEventListener("change",()=>{const w=q.closest("tr"),v=parseInt(w.dataset.sidx),$=parseInt(w.dataset.index),C=q.dataset.field;let N=q.value;if((C==="qty"||C==="rate")&&(N=parseFloat(N)||0),s.sections[v].lineItems[$][C]=N,C==="description"){const O=l.find(D=>D.name===N);if(O){const D=(O.category||"").toLowerCase().includes("labor");let z=0,M=0;if(D)z=O.unitPrice||85,M=O.costPrice||45;else{const E=O.costPrice||O.unitPrice||0;M=E,z=Qt(E,m)}s.sections[v].lineItems[$].type=D?"labor":"material",s.sections[v].lineItems[$].rate=z,s.sections[v].lineItems[$].internalCost=M}}g()})}),e.querySelectorAll(".btn-remove-line").forEach(q=>{q.addEventListener("click",()=>{const w=parseInt(q.dataset.sidx),v=parseInt(q.dataset.index);s.sections[w].lineItems.splice(v,1),g()})}),(S=e.querySelector("#btn-import-template"))==null||S.addEventListener("click",q=>{q.preventDefault();const w=e.querySelector("#inv-customer").value;if(!w){H("Please select a customer first","error");return}const v=r.getAll("quotes").filter(C=>C.customerId===w);if(!v.length){H("No quotes found for this customer","error");return}const $=document.createElement("div");$.style.minWidth="400px",$.innerHTML=`
        <div style="font-size:14px; color:var(--text-secondary); margin-bottom:12px">
          Select a quote to import items as the original invoice content:
        </div>
        <div style="display:flex; flex-direction:column; gap:10px">
          ${v.map(C=>`
            <div class="card import-quote-item" data-id="${C.id}" style="cursor:pointer; border:1px solid var(--border-color); transition:all 0.2s">
              <div class="card-body" style="padding:12px; display:flex; justify-content:space-between; align-items:center">
                <div>
                  <div style="font-weight:600; font-size:14px">${y(C.number)} — ${y(C.title||"Untitled")}</div>
                  <div style="font-size:12px; color:var(--text-tertiary)">Subtotal: $${(C.subtotal||0).toFixed(2)} | Date: ${new Date(C.createdAt).toLocaleDateString()}</div>
                </div>
                <span class="badge ${C.status==="Accepted"?"badge-success":"badge-neutral"}">${y(C.status)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `,xe({title:"Import from Quote",content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()}]}),$.querySelectorAll(".import-quote-item").forEach(C=>{C.addEventListener("click",()=>{var D;const N=C.dataset.id,O=v.find(z=>z.id===N);O&&(s.originalQuoteId=O.id,s.originalQuoteNumber=O.number,s.originalSubtotal=O.subtotal,O.sections&&O.sections.length>0?s.sections=JSON.parse(JSON.stringify(O.sections)).map(z=>({...z,isVariation:!1,customerApproved:void 0})):O.lineItems&&(s.sections=[{id:r.generateId(),name:"Main Phase",isVariation:!1,lineItems:JSON.parse(JSON.stringify(O.lineItems))}]),g(),H(`Imported ${O.number} successfully!`,"success"),(D=document.querySelector(".modal-overlay"))==null||D.remove())})})}),(L=e.querySelector("#btn-save-inv"))==null||L.addEventListener("click",()=>{const q=e.querySelector("#inv-customer").value,w=c.find(O=>O.id===q);s.customerId=q,s.customerName=(w==null?void 0:w.company)||"",s.status=e.querySelector("#inv-status").value,s.issueDate=e.querySelector("#inv-issue").value,s.dueDate=e.querySelector("#inv-due").value,s.invoiceType=e.querySelector("#inv-type").value;let v=0,$=0,C=0;(s.sections||[]).forEach(O=>{let D=(O.lineItems||[]).reduce((z,M)=>z+(M.qty||0)*(M.rate||0),0);O.subtotal=D,O.isVariation===!0?O.customerApproved===!0?$+=D:C+=D:v+=D}),(s.originalSubtotal===void 0||s.originalSubtotal===0)&&(s.originalSubtotal=v);let N=v+$;if(s.subtotal=s.invoiceType==="CreditNote"?-Math.abs(N):Math.abs(N),s.tax=s.subtotal*.1,s.total=s.subtotal+s.tax,s.approvedVariationsSum=$,s.pendingVariationsSum=C,t){const O=r.create("invoices",s);H("Invoice created","success"),X.navigate(`/invoices/${O.id}`)}else r.update("invoices",a,s),H("Invoice saved","success"),p()}),(T=e.querySelector("#btn-send-invoice"))==null||T.addEventListener("click",()=>{r.update("invoices",a,{status:"Sent"}),s.status="Sent",H("Invoice sent to customer","success"),p()}),(I=e.querySelector("#btn-mark-paid"))==null||I.addEventListener("click",()=>{const q=document.createElement("div");q.style.minWidth="300px",q.innerHTML=`
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
      `,He({title:"Mark Invoice as Paid",content:q.outerHTML,actions:[{label:"Cancel",className:"btn-secondary",onClick:w=>w()},{label:"Confirm Payment",className:"btn-primary",onClick:w=>{const v=document.querySelector(".drawer-overlay"),$=v.querySelector("#paid-date").value,C=v.querySelector("#paid-method").value;r.update("invoices",a,{status:"Paid",paidDate:$,paymentMethod:C}),s.status="Paid",s.paidDate=$,s.paymentMethod=C,H("Invoice marked as paid","success"),p(),w()}}],width:350})}),(_=e.querySelector("#btn-delete-invoice"))==null||_.addEventListener("click",()=>{const q=document.createElement("div");q.innerHTML=`<p>Delete invoice <strong>${y(s.number)}</strong>?</p>`,xe({title:"Delete Invoice",content:q,actions:[{label:"Cancel",className:"btn-secondary",onClick:w=>w()},{label:"Delete",className:"btn-danger",onClick:w=>{r.delete("invoices",a),H("Invoice deleted","success"),w(),X.navigate("/invoices")}}]})}),(A=e.querySelector("#btn-cancel-inv"))==null||A.addEventListener("click",()=>X.navigate("/invoices"))}p()}function $t(e){const a=r.getAll("purchaseOrders");e.innerHTML=`
    <div class="page-header">
      <h1>Purchase Orders</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-po"><span class="material-icons-outlined">add</span> New PO</button>
      </div>
    </div>
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
        ${["Draft","Issued","Received","Cancelled"].map(l=>`<button class="toolbar-filter" data-filter="${l}">${l}</button>`).join("")}
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search POs..." id="po-search" />
      </div>
    </div>
    <div id="po-table-container"></div>
  `;let t=[...a];const c=Xe({columns:[{key:"number",label:"PO Number",render:l=>`<span class="cell-link font-medium">${y(l.number)}</span>`,width:"120px"},{key:"supplier",label:"Supplier",render:l=>`<span class="text-secondary">${y(l.supplierName||"—")}</span>`},{key:"job",label:"Job Ref",render:l=>l.jobId?`<a href="#/jobs/${l.jobId}" class="cell-link">${y(l.jobNumber)}</a>`:'<span class="text-secondary">—</span>'},{key:"date",label:"Issue Date",render:l=>l.issueDate?new Date(l.issueDate).toLocaleDateString():"—",width:"120px"},{key:"total",label:"Total",render:l=>`$${(l.total||0).toFixed(2)}`,width:"100px"},{key:"status",label:"Status",render:l=>`<span class="badge ${{Draft:"badge-neutral",Issued:"badge-primary",Received:"badge-success",Cancelled:"badge-danger"}[l.status]||"badge-neutral"}">${y(l.status)}</span>`,width:"110px"}],data:t,onRowClick:l=>ga({id:l,onSave:()=>$t(e)}),emptyMessage:"No purchase orders found",emptyIcon:"shopping_cart",selectable:!0,onSelectionChange:l=>{Ze({container:e,selectedIds:l,onClear:()=>c.clearSelection(),actions:[{label:"Mark Received",icon:"inventory",onClick:m=>{m.forEach(n=>r.update("purchaseOrders",n,{status:"Received",receivedDate:new Date().toISOString()})),c.clearSelection(),$t(e),me(async()=>{const{showToast:n}=await Promise.resolve().then(()=>De);return{showToast:n}},void 0).then(({showToast:n})=>n(`Marked ${m.length} POs as Received`,"success"))}},{label:"Change Status",icon:"sync_alt",onClick:m=>{const n=document.createElement("div");n.innerHTML=`
                <div class="form-group">
                  <label class="form-label">New Status</label>
                  <select class="form-select" id="bulk-status">
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              `,me(async()=>{const{showModal:p}=await Promise.resolve().then(()=>Pe);return{showModal:p}},void 0).then(({showModal:p})=>{p({title:`Update ${m.length} Purchase Orders`,content:n,actions:[{label:"Cancel",className:"btn-secondary",onClick:o=>o()},{label:"Apply",className:"btn-primary",onClick:o=>{const f=n.querySelector("#bulk-status").value;m.forEach(g=>r.update("purchaseOrders",g,{status:f})),c.clearSelection(),$t(e),me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>De);return{showToast:g}},void 0).then(({showToast:g})=>g(`Updated ${m.length} POs to ${f}`,"success")),o()}}]})})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:m=>{me(async()=>{const{showModal:n}=await Promise.resolve().then(()=>Pe);return{showModal:n}},void 0).then(({showModal:n})=>{const p=document.createElement("div");p.innerHTML=`<p>Are you sure you want to delete ${m.length} purchase orders? This action cannot be undone.</p>`,n({title:"Confirm Bulk Delete",content:p,actions:[{label:"Cancel",className:"btn-secondary",onClick:o=>o()},{label:"Delete",className:"btn-danger",onClick:o=>{m.forEach(f=>r.delete("purchaseOrders",f)),c.clearSelection(),$t(e),me(async()=>{const{showToast:f}=await Promise.resolve().then(()=>De);return{showToast:f}},void 0).then(({showToast:f})=>f(`Deleted ${m.length} purchase orders`,"success")),o()}}]})})}}]})}});e.querySelector("#po-table-container").appendChild(c),e.querySelector("#btn-new-po").addEventListener("click",()=>{ga({onSave:()=>$t(e)})}),e.querySelectorAll(".toolbar-filter").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(n=>n.classList.remove("active")),l.classList.add("active");const m=l.dataset.filter;t=m==="all"?[...a]:a.filter(n=>n.status===m),c.updateData(t)})}),e.querySelector("#po-search").addEventListener("input",l=>{const m=l.target.value.toLowerCase();t=a.filter(n=>{var p,o,f;return((p=n.number)==null?void 0:p.toLowerCase().includes(m))||((o=n.supplierName)==null?void 0:o.toLowerCase().includes(m))||((f=n.jobNumber)==null?void 0:f.toLowerCase().includes(m))}),c.updateData(t)})}function Us(e,{id:a,jobId:t}){const s=a==="new";let c=s?{status:"Draft",lineItems:[],issueDate:new Date().toISOString().split("T")[0],total:0,jobId:t||"",jobNumber:""}:r.getById("purchaseOrders",a);if(!c){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Purchase Order not found</h3></div>';return}if(s&&t){const d=r.getById("jobs",t);d&&(c.jobNumber=d.number)}dt(s?"New PO":c.number);const l=r.getAll("stock"),m=r.getAll("jobs"),n=r.getAll("suppliers").filter(d=>d.active!==!1),p=[...n];c.supplierName&&!n.some(d=>d.name===c.supplierName)&&p.push({name:c.supplierName}),p.length===0&&p.push({name:"General Supplier"});function o(){e.innerHTML=`
      ${mt({title:c.number||"New Purchase Order",icon:"shopping_cart",metaHtml:`
          <span class="badge ${c.status==="Draft"?"badge-neutral":c.status==="Issued"?"badge-primary":c.status==="Received"?"badge-success":"badge-danger"}">${c.status}</span>
        `,actionsHtml:`
          <button class="btn btn-secondary" id="btn-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-save"><span class="material-icons-outlined">save</span> Save PO</button>
          ${!s&&c.status==="Draft"?'<button class="btn btn-primary" id="btn-issue"><span class="material-icons-outlined">send</span> Issue PO</button>':""}
          ${!s&&c.status==="Issued"?'<button class="btn btn-success" id="btn-receive"><span class="material-icons-outlined">inventory</span> Receive PO</button>':""}
        `})}

      <div class="grid-3" style="align-items: start;">
        <div class="card" style="grid-column: span 1">
          <div class="card-header"><h4>PO Information</h4></div>
          <div class="card-body">
            <form id="po-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Supplier *</label>
                  <select class="form-select" name="supplierName" required ${c.status!=="Draft"?"disabled":""}>
                    <option value="">Select supplier...</option>
                    ${p.map(d=>`<option value="${y(d.name)}" ${c.supplierName===d.name?"selected":""}>${y(d.name)}</option>`).join("")}
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
                    ${m.map(d=>`<option value="${d.id}" ${c.jobId===d.id?"selected":""}>${d.number} - ${d.title}</option>`).join("")}
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
                ${c.lineItems.map((d,x)=>`
                  <tr data-index="${x}">
                    <td>
                      ${c.status==="Draft"?`
                      <select class="form-select item-select" style="width:100%">
                        <option value="">Custom Item...</option>
                        ${l.map(u=>`<option value="${u.id}" ${d.stockId===u.id?"selected":""}>${u.name}</option>`).join("")}
                      </select>
                      <input type="text" class="form-input item-desc" style="width:100%;margin-top:4px;${d.stockId?"display:none":""}" value="${d.description||""}" placeholder="Description" />
                      `:`<div>${d.description}</div>`}
                    </td>
                    <td>
                      ${c.status==="Draft"?`<input type="text" class="form-input item-sku" style="width:100%" value="${d.sku||""}" ${d.stockId?"disabled":""} />`:d.sku||"—"}
                    </td>
                    <td style="text-align:right">
                      ${c.status==="Draft"?`<input type="number" class="form-input item-cost" style="width:100px;text-align:right;margin-left:auto" value="${d.unitCost||0}" step="0.01" />`:`$${(d.unitCost||0).toFixed(2)}`}
                    </td>
                    <td style="text-align:right">
                      ${c.status==="Draft"?`<input type="number" class="form-input item-qty" style="width:80px;text-align:right;margin-left:auto" value="${d.quantity||1}" min="1" step="1" />`:d.quantity}
                    </td>
                    <td style="text-align:right;font-weight:600" class="item-total">
                      $${((d.unitCost||0)*(d.quantity||1)).toFixed(2)}
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
    `,g()}function f(){let d=0;e.querySelectorAll("#line-items-body tr[data-index]").forEach(u=>{const b=parseFloat(u.querySelector(".item-cost").value)||0,h=parseFloat(u.querySelector(".item-qty").value)||0,k=b*h;u.querySelector(".item-total").textContent="$"+k.toFixed(2),d+=k}),c.total=d;const x=e.querySelector("#po-total");x&&(x.textContent="$"+d.toFixed(2))}function g(){var d,x,u,b;e.querySelector("#btn-cancel").addEventListener("click",()=>X.navigate("/purchase-orders")),(d=e.querySelector("#btn-save"))==null||d.addEventListener("click",()=>{i()}),(x=e.querySelector("#btn-issue"))==null||x.addEventListener("click",()=>{if(c.lineItems.length===0){H("Cannot issue a PO with no items","error");return}i("Issued")}),(u=e.querySelector("#btn-receive"))==null||u.addEventListener("click",()=>{const h=r.getAll("technicians"),k=r.getAll("assets"),S=document.createElement("div");S.innerHTML=`
        <div class="form-group">
          <label class="form-label">Receive into Location *</label>
          <select class="form-select" id="receive-location-select" required>
            <option value="Main Warehouse">Main Warehouse</option>
            <optgroup label="Warehouses">
              <option value="Warehouse A">Warehouse A</option>
              <option value="Warehouse B">Warehouse B</option>
            </optgroup>
            <optgroup label="Vehicles">
              ${h.map(L=>`<option value="Vehicle - ${y(L.name)}">Vehicle - ${y(L.name)}</option>`).join("")}
            </optgroup>
            <optgroup label="Assets">
              ${k.map(L=>`<option value="${y(L.name)}">${y(L.name)}</option>`).join("")}
            </optgroup>
          </select>
        </div>
      `,showModal({title:"Receive Purchase Order",content:S,actions:[{label:"Cancel",className:"btn-secondary",onClick:L=>L()},{label:"Receive Items",className:"btn-success",onClick:L=>{const T=S.querySelector("#receive-location-select").value;if(!T){H("Please select a valid location","error");return}let I=0;const _=r.getAll("stock");c.lineItems.forEach(A=>{var q;if(A.stockId){const w=_.find(v=>v.id===A.stockId);if(w){w.locations||(w.locations=[]);let v=w.locations.find($=>$.location===T);v?v.quantity+=A.quantity:w.locations.push({location:T,quantity:A.quantity}),w.quantity=w.locations.reduce(($,C)=>$+C.quantity,0),w.location=((q=w.locations[0])==null?void 0:q.location)||"Main Warehouse",w.updatedAt=new Date().toISOString(),I++}}}),I>0&&r.save("stock",_),H(`Received ${I} items into ${T}`,"success"),c.status="Received",r.update("purchaseOrders",c.id,{status:"Received"}),L(),o()}}]})}),(b=e.querySelector("#btn-add-item"))==null||b.addEventListener("click",()=>{c.lineItems.push({description:"",sku:"",unitCost:0,quantity:1,stockId:""}),o()}),e.querySelectorAll(".item-select").forEach((h,k)=>{h.addEventListener("change",S=>{const L=S.target.value,T=S.target.closest("tr"),I=T.querySelector(".item-desc"),_=T.querySelector(".item-sku"),A=T.querySelector(".item-cost");if(L){const q=r.getById("stock",L);q&&(I.style.display="none",I.value=q.name,_.value=q.sku,_.disabled=!0,A.value=q.costPrice||q.unitPrice)}else I.style.display="block",I.value="",_.value="",_.disabled=!1,A.value=0;f()})}),e.querySelectorAll(".item-cost, .item-qty").forEach(h=>{h.addEventListener("input",f)}),e.querySelectorAll(".btn-remove-item").forEach(h=>{h.addEventListener("click",k=>{const S=k.target.closest("tr"),L=parseInt(S.dataset.index);c.lineItems.splice(L,1),o()})})}function i(d=null){if(c.status!=="Draft"){H("Cannot modify an issued or received PO","error");return}const x=e.querySelector("#po-form");if(!x.checkValidity()){x.reportValidity();return}const u=Object.fromEntries(new FormData(x));if(u.jobId){const h=m.find(k=>k.id===u.jobId);u.jobNumber=h?h.number:""}else u.jobNumber="";c.lineItems=Array.from(e.querySelectorAll("#line-items-body tr[data-index]")).map(h=>{const k=h.querySelector(".item-select"),S=k?k.value:"",L=h.querySelector(".item-desc").value,T=S?k.options[k.selectedIndex].text:L;return{stockId:S,description:T,sku:h.querySelector(".item-sku").value,unitCost:parseFloat(h.querySelector(".item-cost").value)||0,quantity:parseInt(h.querySelector(".item-qty").value)||1}}),f();const b={...c,...u,total:c.total,lineItems:c.lineItems,status:d||c.status};if(s){b.number=`PO-${Date.now().toString().slice(-6)}`;const h=r.create("purchaseOrders",b);H(`PO ${d==="Issued"?"issued":"created"} successfully`,"success"),X.navigate(`/purchase-orders/${h.id}`)}else r.update("purchaseOrders",a,b),H(`PO ${d==="Issued"?"issued":"updated"} successfully`,"success"),d==="Issued"&&o()}o()}function Js(e){let a="overview";const t=[{id:"overview",label:"Business Overview",icon:"dashboard"},{id:"revenue",label:"Revenue & Profit",icon:"trending_up"},{id:"jobs",label:"Job Performance",icon:"build"},{id:"job_costing",label:"Job Costing",icon:"price_check"},{id:"technicians",label:"Technician Productivity",icon:"engineering"},{id:"customers",label:"Customer Analysis",icon:"people"},{id:"inventory",label:"Inventory Report",icon:"inventory_2"}];function s(){const p=r.getAll("jobs"),o=r.getAll("quotes"),f=r.getAll("invoices"),g=r.getAll("customers"),i=r.getAll("stock"),d=r.getAll("technicians"),x=r.getAll("leads"),u=f.filter(D=>D.status==="Paid").reduce((D,z)=>D+(z.total||0),0),b=f.filter(D=>D.status==="Sent"||D.status==="Overdue").reduce((D,z)=>D+(z.total||0),0),h=p.length>0?p.reduce((D,z)=>D+(z.laborCost||0)+(z.materialCost||0),0)/p.length:0,k=o.length>0?o.filter(D=>D.status==="Accepted").length/o.length*100:0,S=x.length>0?x.filter(D=>D.status==="Won").length/x.length*100:0,L={};p.forEach(D=>{L[D.status]=(L[D.status]||0)+1});const T={};f.forEach(D=>{T[D.status]=(T[D.status]||0)+1});const I=d.map(D=>{const z=p.filter(j=>j.technicianId===D.id),M=z.filter(j=>j.status==="Completed"||j.status==="Invoiced").length,E=z.reduce((j,F)=>j+(F.laborCost||0)+(F.materialCost||0),0);return{...D,totalJobs:z.length,completed:M,revenue:E}}),_={};f.filter(D=>D.status==="Paid").forEach(D=>{_[D.customerName]=(_[D.customerName]||0)+(D.total||0)});const A=Object.entries(_).sort((D,z)=>z[1]-D[1]).slice(0,10),q=i.reduce((D,z)=>D+z.quantity*z.costPrice,0),w=i.filter(D=>D.quantity<=D.reorderLevel),v=r.getAll("timesheets"),$={},C={},N=r.getAll("people"),O={};return N.forEach(D=>{D.payRate&&(O[D.id]=D.payRate)}),v.forEach(D=>{$[D.jobId]=($[D.jobId]||0)+(D.hours||0);const z=D.payRate||O[D.technicianId]||0;C[D.jobId]=(C[D.jobId]||0)+D.hours*z}),{jobs:p,quotes:o,invoices:f,customers:g,stock:i,technicians:d,leads:x,totalRevenue:u,totalOutstanding:b,avgJobValue:h,quoteWinRate:k,leadConvRate:S,jobsByStatus:L,invByStatus:T,techStats:I,topCustomers:A,totalStockValue:q,lowStockItems:w,timesheets:v,hoursByJob:$,internalLaborCostByJob:C}}function c(){const p=s();e.innerHTML=`
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
              ${t.map(o=>`
                <button class="report-nav-item ${a===o.id?"active":""}" data-report="${o.id}" style="
                  display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;border:none;
                  background:${a===o.id?"var(--color-primary-light)":"transparent"};
                  color:${a===o.id?"var(--color-primary)":"var(--text-secondary)"};
                  border-radius:var(--border-radius);cursor:pointer;font-size:var(--font-size-sm);
                  font-weight:${a===o.id?"600":"500"};transition:all var(--transition-fast);
                  text-align:left;
                ">
                  <span class="material-icons-outlined" style="font-size:18px">${o.icon}</span>
                  ${o.label}
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Report Content -->
        <div style="flex:1" id="report-content"></div>
      </div>
    `,l(p),m(p)}function l(p){const o=e.querySelector("#report-content");switch(a){case"overview":o.innerHTML=Ws(p);break;case"revenue":o.innerHTML=Qs(p);break;case"jobs":o.innerHTML=Gs(p);break;case"job_costing":o.innerHTML=Ys(p);break;case"technicians":o.innerHTML=Ks(p);break;case"customers":o.innerHTML=Xs(p);break;case"inventory":o.innerHTML=Zs(p);break;default:o.innerHTML='<div class="text-secondary">Select a report to view</div>'}}function m(p){var o;e.querySelectorAll("[data-report]").forEach(f=>{f.addEventListener("click",()=>{a=f.dataset.report,c()})}),(o=e.querySelector("#btn-export-csv"))==null||o.addEventListener("click",()=>n(p))}function n(p){let o="";if(a==="overview"||a==="revenue")o=`Invoice #,Customer,Status,Total,Issue Date,Due Date
`,p.invoices.forEach(d=>{o+=`"${d.number}","${d.customerName}","${d.status}",${d.total||0},"${d.issueDate||""}","${d.dueDate||""}"
`});else if(a==="job_costing"){const d=r.getSettings();o=`Job #,Technician,Actual Hrs,Internal Labor Cost,Billable Labor,Profit,Margin %
`,p.jobs.filter(u=>u.status==="Completed"||u.status==="Invoiced").map(u=>{const b=p.hoursByJob[u.id]||0,h=p.internalLaborCostByJob[u.id]||u.laborCost||0,k=d.laborRates.find(I=>I.id===u.laborRateProfileId)||d.laborRates.find(I=>I.isDefault),S=Math.max(b*((k==null?void 0:k.rate)||85),(k==null?void 0:k.minCallOutFee)||0),L=S-h,T=S>0?L/S*100:0;return{num:u.number,tech:u.technicianName||"",actualH:b,actualLabor:h,billableLabor:S,profit:L,margin:T}}).forEach(u=>{o+=`"${u.num}","${u.tech}",${u.actualH},${u.actualLabor.toFixed(2)},${u.billableLabor.toFixed(2)},${u.profit.toFixed(2)},${u.margin.toFixed(1)}%
`})}else a==="jobs"?(o=`Job #,Title,Customer,Technician,Status,Priority,Labor,Material
`,p.jobs.forEach(d=>{o+=`"${d.number}","${d.title}","${d.customerName}","${d.technicianName||""}","${d.status}","${d.priority}",${d.laborCost||0},${d.materialCost||0}
`})):a==="technicians"?(o=`Name,Role,Total Jobs,Completed,Revenue
`,p.techStats.forEach(d=>{o+=`"${d.name}","${d.role}",${d.totalJobs},${d.completed},${d.revenue}
`})):a==="customers"?(o=`Company,First Name,Last Name,Email,Phone,Status
`,p.customers.forEach(d=>{o+=`"${d.company}","${d.firstName}","${d.lastName}","${d.email}","${d.phone}","${d.status}"
`})):a==="inventory"&&(o=`Name,SKU,Category,Quantity,Cost Price,Sell Price,Location,Supplier
`,p.stock.forEach(d=>{o+=`"${d.name}","${d.sku}","${d.category}",${d.quantity},${d.costPrice},${d.unitPrice},"${d.location}","${d.supplier}"
`}));const f=new Blob([o],{type:"text/csv"}),g=URL.createObjectURL(f),i=document.createElement("a");i.href=g,i.download=`simpro_${a}_report.csv`,i.click(),URL.revokeObjectURL(g)}c()}function ze(e,a,t,s){const c={green:"var(--color-success)",blue:"var(--color-primary)",orange:"var(--color-warning)",red:"var(--color-danger)"};return`
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="stat-label">${e}</div>
        <div style="width:36px;height:36px;border-radius:var(--border-radius);background:${{green:"var(--color-success-bg)",blue:"var(--color-primary-light)",orange:"var(--color-warning-bg)",red:"var(--color-danger-bg)"}[s]};display:flex;align-items:center;justify-content:center">
          <span class="material-icons-outlined" style="font-size:18px;color:${c[s]}">${t}</span>
        </div>
      </div>
      <div class="stat-value" style="font-size:var(--font-size-2xl)">${a}</div>
    </div>
  `}function xt(e,a,t){return`
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:12px;padding:var(--space-base)">
        <span class="material-icons-outlined" style="font-size:24px;color:var(--text-tertiary)">${t}</span>
        <div>
          <div style="font-size:var(--font-size-xl);font-weight:700">${a}</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-tertiary)">${e}</div>
        </div>
      </div>
    </div>
  `}function At(e,a={},t="#1B6DE0"){const s=Object.entries(e);if(s.length===0)return'<div class="text-secondary text-sm">No data available</div>';const c=Math.max(...s.map(([,l])=>l));return s.map(([l,m])=>{const n=a[l]||t,p=c>0?m/c*100:0;return`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:100px;font-size:var(--font-size-sm);color:var(--text-secondary);text-align:right;flex-shrink:0">${l}</div>
        <div style="flex:1;height:24px;background:var(--border-color);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${p}%;background:${n};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
        <div style="width:50px;font-size:var(--font-size-sm);font-weight:600;text-align:right">${typeof m=="number"&&m>=1e3?`$${(m/1e3).toFixed(1)}k`:m}</div>
      </div>
    `}).join("")}function qt(e,a,t,s){const c=t>0?a/t*100:0,l=typeof a=="number"?`$${a.toLocaleString("en-AU",{minimumFractionDigits:0})}`:a;return`
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:var(--font-size-sm);font-weight:500">${e}</span>
        <span style="font-size:var(--font-size-sm);font-weight:600">${l}</span>
      </div>
      <div style="height:8px;background:var(--border-color);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${c}%;background:${s};border-radius:4px;transition:width 0.5s ease"></div>
      </div>
    </div>
  `}function Ws(e){return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${ze("Total Revenue",`$${e.totalRevenue.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"account_balance","green")}
      ${ze("Outstanding",`$${e.totalOutstanding.toLocaleString("en-AU",{minimumFractionDigits:0})}`,"pending","orange")}
      ${ze("Quote Win Rate",`${e.quoteWinRate.toFixed(0)}%`,"emoji_events","blue")}
      ${ze("Lead Conversion",`${e.leadConvRate.toFixed(0)}%`,"trending_up","green")}
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
      ${xt("Total Jobs",e.jobs.length,"build")}
      ${xt("Total Quotes",e.quotes.length,"request_quote")}
      ${xt("Total Invoices",e.invoices.length,"receipt_long")}
      ${xt("Total Customers",e.customers.length,"people")}
      ${xt("Avg Job Value",`$${e.avgJobValue.toFixed(0)}`,"paid")}
      ${xt("Stock Items",`${e.stock.length} (${e.lowStockItems.length} low)`,"inventory_2")}
    </div>
  `}function Qs(e){const a=e.invoices.filter(m=>m.status==="Paid"),t={};a.forEach(m=>{const n=new Date(m.issueDate||m.createdAt).toLocaleDateString("en-AU",{month:"short",year:"2-digit"});t[n]=(t[n]||0)+(m.total||0)});const s=e.jobs.reduce((m,n)=>m+(n.materialCost||0),0),c=e.jobs.reduce((m,n)=>m+(n.laborCost||0),0),l=e.totalRevenue-s;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${ze("Gross Revenue",`$${e.totalRevenue.toFixed(0)}`,"account_balance","green")}
      ${ze("Total Labor",`$${c.toFixed(0)}`,"engineering","blue")}
      ${ze("Material Costs",`$${s.toFixed(0)}`,"inventory_2","orange")}
      ${ze("Gross Profit",`$${l.toFixed(0)}`,"savings","green")}
    </div>
    <div class="card" style="margin-bottom:var(--space-lg)">
      <div class="card-header"><h4>Revenue by Month</h4></div>
      <div class="card-body">${At(t,{},"#1B6DE0")}</div>
    </div>
    <div class="card">
      <div class="card-header"><h4>Profit Breakdown</h4></div>
      <div class="card-body">
        ${qt("Revenue",e.totalRevenue,e.totalRevenue,"#10B981")}
        ${qt("Labor Cost",c,e.totalRevenue,"#3B82F6")}
        ${qt("Material Cost",s,e.totalRevenue,"#F59E0B")}
        ${qt("Gross Profit",l,e.totalRevenue,"#10B981")}
      </div>
    </div>
  `}function Gs(e){const a=e.jobs.filter(s=>s.status==="Completed"||s.status==="Invoiced"),t=a.length>0?a.reduce((s,c)=>s+(c.estimatedHours||0),0)/a.length:0;return`
    <div class="grid-4" style="margin-bottom:var(--space-lg)">
      ${ze("Total Jobs",e.jobs.length,"build","blue")}
      ${ze("Completed",a.length,"check_circle","green")}
      ${ze("In Progress",e.jobsByStatus["In Progress"]||0,"pending","orange")}
      ${ze("Avg Hours",t.toFixed(1),"schedule","blue")}
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
            ${e.jobs.sort((s,c)=>(c.laborCost||0)+(c.materialCost||0)-((s.laborCost||0)+(s.materialCost||0))).slice(0,8).map(s=>`
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
  `}function Ys(e){const a=r.getSettings(),s=e.jobs.filter(p=>p.status==="Completed"||p.status==="Invoiced").map(p=>{const o=e.hoursByJob[p.id]||0,f=e.internalLaborCostByJob[p.id]||p.laborCost||0,g=a.laborRates.find(u=>u.id===p.laborRateProfileId)||a.laborRates.find(u=>u.isDefault),i=Math.max(o*((g==null?void 0:g.rate)||85),(g==null?void 0:g.minCallOutFee)||0),d=i-f,x=i>0?d/i*100:0;return{...p,actualH:o,actualLabor:f,billableLabor:i,profit:d,margin:x}}),c=s.reduce((p,o)=>p+o.actualLabor,0),l=s.reduce((p,o)=>p+o.billableLabor,0),m=l-c,n=l>0?m/l*100:0;return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${ze("Internal Labor Cost","$"+c.toLocaleString(),"engineering","orange")}
      ${ze("Billable Labor Rev.","$"+l.toLocaleString(),"payments","green")}
      ${ze("Labor Profitability",n.toFixed(1)+"% Margin","trending_up",n>=40?"green":"orange")}
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
            ${s.map(p=>`
              <tr>
                <td class="font-medium"><a href="#/jobs/${p.id}" class="cell-link">${p.number}</a></td>
                <td>${p.technicianName||"—"}</td>
                <td style="text-align:right">${p.actualH.toFixed(2)}</td>
                <td style="text-align:right">$${p.actualLabor.toFixed(2)}</td>
                <td style="text-align:right">$${p.billableLabor.toFixed(2)}</td>
                <td style="text-align:right;font-weight:600;color:${p.profit>=0?"var(--color-success)":"var(--color-danger)"}">
                  $${p.profit.toFixed(2)}
                </td>
                <td style="text-align:right">
                   <span class="badge ${p.margin>=40?"badge-success":p.margin>=20?"badge-warning":"badge-danger"}">
                    ${p.margin.toFixed(1)}%
                   </span>
                </td>
              </tr>
            `).join("")}
            ${s.length?"":'<tr><td colspan="7" style="text-align:center;padding:20px" class="text-secondary">No completed jobs to analyze</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Ks(e){return`
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
        ${e.techStats.map(a=>qt(a.name,a.revenue,Math.max(...e.techStats.map(t=>t.revenue)),a.color)).join("")}
      </div>
    </div>
  `}function Xs(e){return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${ze("Total Customers",e.customers.length,"people","blue")}
      ${ze("Active Customers",e.customers.filter(a=>a.status==="Active").length,"check_circle","green")}
      ${ze("Total Leads",e.leads.length,"trending_up","orange")}
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
  `}function Zs(e){const a=e.stock.reduce((t,s)=>t+s.quantity*s.unitPrice,0);return`
    <div class="grid-3" style="margin-bottom:var(--space-lg)">
      ${ze("Total Items",e.stock.length,"inventory_2","blue")}
      ${ze("Stock Value (Cost)",`$${e.totalStockValue.toFixed(0)}`,"account_balance","orange")}
      ${ze("Stock Value (Sell)",`$${a.toFixed(0)}`,"paid","green")}
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
  `}function at(e){return Object.entries(St).map(([a,t])=>{const s={module:a};return t.forEach(({key:c})=>{s[c]=e(a,c)}),s})}function eo(e){const t=new URLSearchParams(window.location.hash.split("?")[1]||window.location.search).get("tab");let s="company",c="tasklists";t==="forms"?(s="templates_forms",c="forms"):t==="tasks"||t==="tasklists"?(s="templates_forms",c="tasklists"):t==="quote_templates"||t==="quotes"?(s="templates_forms",c="quotes"):t&&(s=t);const l=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}');function m(){e.innerHTML=`
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
    `,n(),e.querySelectorAll(".tab").forEach(u=>{u.addEventListener("click",()=>{s=u.dataset.tab,e.querySelectorAll(".tab").forEach(b=>b.classList.remove("active")),u.classList.add("active"),n()})})}function n(){var h,k,S,L,T;const u=e.querySelector("#settings-content");if(s==="templates_forms"){x(u);return}if(s==="company"){const I=r.getSettings();let _=I.logo;(()=>{var w;u.innerHTML=`
          <div class="card" style="max-width:800px">
            <div class="card-header"><h4>Company Information</h4></div>
            <div class="card-body">
              <div style="display:grid; grid-template-columns: 1fr 280px; gap:var(--space-lg)">
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div class="form-group">
                    <label class="form-label">Company Name</label>
                    <input class="form-input" value="${I.name||"FieldForge Demo Company"}" id="company-name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">ABN</label>
                      <input class="form-input" id="company-abn" value="${I.abn||"12 345 678 901"}" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Phone</label>
                      <input class="form-input" id="company-phone" value="${I.phone||"1300 123 456"}" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Company Domain</label>
                    <input class="form-input" value="${I.email||"fieldforge.io"}" id="company-domain" placeholder="e.g. yourcompany.com.au" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <textarea class="form-textarea" id="company-address" rows="2">${I.address||"123 Business St, Melbourne VIC 3000"}</textarea>
                  </div>
                </div>

                <!-- Logo Section -->
                <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; align-items:center; text-align:center">
                  <label class="form-label" style="align-self:flex-start">Company Logo</label>
                  <div id="logo-preview-container" style="width:100%; aspect-ratio:1; margin:12px 0; background:var(--bg-color); border:1px dashed var(--border-color); border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden">
                    ${_?`<img src="${_}" style="max-width:90%; max-height:90%; object-fit:contain" />`:`
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
                    ${_?'<button class="btn btn-ghost btn-sm" id="btn-remove-logo" style="color:var(--color-danger); width:100%">Remove Logo</button>':""}
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
        `;const q=u.querySelector("#logo-upload");u.querySelector("#btn-upload-logo").addEventListener("click",()=>q.click()),q.addEventListener("change",v=>{const $=v.target.files[0];if($){const C=new FileReader;C.onload=N=>{_=N.target.result;const O=u.querySelector("#logo-preview-container");O.innerHTML=`<img src="${_}" style="max-width:90%; max-height:90%; object-fit:contain" />`,u.querySelector("#unsaved-logo-hint").style.display="block",H("Logo preview updated. Click Save to apply.","info")},C.readAsDataURL($)}}),(w=u.querySelector("#btn-remove-logo"))==null||w.addEventListener("click",()=>{_=null;const v=u.querySelector("#logo-preview-container");v.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; color:var(--text-tertiary)">
              <span class="material-icons-outlined" style="font-size:48px">image</span>
              <span style="font-size:12px; margin-top:8px">No custom logo</span>
            </div>
          `,u.querySelector("#unsaved-logo-hint").style.display="block",u.querySelector("#btn-remove-logo").style.display="none"}),u.querySelector("#btn-save-company").addEventListener("click",()=>{const v=r.getSettings();v.name=u.querySelector("#company-name").value,v.abn=u.querySelector("#company-abn").value,v.phone=u.querySelector("#company-phone").value,v.email=u.querySelector("#company-domain").value,v.address=u.querySelector("#company-address").value,v.logo=_,r.saveSettings(v),H("Company information saved permanently","success"),u.querySelector("#unsaved-logo-hint").style.display="none",window.dispatchEvent(new CustomEvent("simpro-settings-updated"))})})()}else if(s==="users"){const I=r.getAll("technicians");let _=r.getAll("userTypes");!_||_.length===0?(_=[{id:"ut_admin",name:"Admin",description:"Full system access",permissions:at(()=>!0)},{id:"ut_manager",name:"Manager",description:"Can manage most workflows but limited settings",permissions:at((A,q)=>A==="Settings"?["view","edit_company"].includes(q):!0)},{id:"ut_tech",name:"Technician",description:"Field staff — limited to their own jobs",permissions:at((A,q)=>A==="Dashboard"?q==="view":A==="Jobs"?["view","manage_tasks","book_time"].includes(q):A==="Timesheets"?["view_own","create"].includes(q):A==="Schedule"?["view_own"].includes(q):!1)},{id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:at((A,q)=>A==="Settings"?!1:A==="Reports"?q==="view":!(["Invoices","Purchase Orders"].includes(A)&&q==="delete"))}],r.save("userTypes",_)):_.some(q=>q.id==="ut_office")||(_.push({id:"ut_office",name:"Office Staff",description:"Admin / reception — can manage customers, quotes, invoices but not system settings",permissions:at((q,w)=>q==="Settings"?!1:q==="Reports"?w==="view":!(["Invoices","Purchase Orders"].includes(q)&&w==="delete"))}),r.save("userTypes",_)),u.innerHTML=`
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
                ${I.filter(A=>!A.deactivated).map(A=>{const q=_.find(w=>w.id===A.userTypeId);return`
                    <tr>
                      <td><div style="width:12px; height:12px; border-radius:50%; background:${A.color}"></div></td>
                      <td class="font-medium">${A.name}</td>
                      <td class="text-secondary">${A.role}</td>
                      <td><span class="badge ${(q==null?void 0:q.id)==="ut_admin"?"badge-primary":"badge-neutral"}">${(q==null?void 0:q.name)||"Unassigned"}</span></td>
                      <td class="text-tertiary">${A.email||"-"}</td>
                      <td class="text-secondary">${A.payRate?`$${A.payRate.toFixed(2)}/hr`:"-"}</td>
                      <td>
                        <div style="display:flex; gap:8px;">
                          <button class="btn btn-icon btn-sm btn-edit-user" data-id="${A.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                          <button class="btn btn-icon btn-sm text-danger btn-deactivate-user" data-id="${A.id}" title="Deactivate"><span class="material-icons-outlined" style="font-size:18px">person_off</span></button>
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
                ${_.map(A=>`
                  <tr>
                    <td class="font-medium">${A.name}</td>
                    <td class="text-secondary">${A.description}</td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm btn-ghost btn-edit-perms" data-id="${A.id}">Permissions</button>
                        <button class="btn btn-sm btn-ghost btn-edit-usertype" data-id="${A.id}">Edit</button>
                        <button class="btn btn-sm btn-icon text-danger btn-delete-usertype" data-id="${A.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${I.filter(A=>A.deactivated).length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:24px">No deactivated users</td></tr>':""}
                ${I.filter(A=>A.deactivated).map(A=>{const q=new Date(A.deactivatedAt),v=new Date-q,C=30-Math.ceil(v/(1e3*60*60*24)),N=C<=0;return`
                    <tr>
                      <td style="opacity:0.6; font-weight:500">${A.name}</td>
                      <td style="opacity:0.6">${A.role}</td>
                      <td class="text-tertiary">${q.toLocaleDateString()}</td>
                      <td>
                        ${N?'<span class="badge badge-success">Cooldown Complete</span>':`<span class="badge badge-warning" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5">Available in ${C} days</span>`}
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost btn-reactivate-user" 
                                data-id="${A.id}" 
                                ${N?"":'disabled style="opacity:0.4; cursor:not-allowed"'}>
                          Reactivate
                        </button>
                      </td>
                    </tr>
                  `}).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `,u.querySelector("#btn-add-user").addEventListener("click",()=>f()),u.querySelectorAll(".btn-edit-user").forEach(A=>{A.addEventListener("click",q=>f(q.currentTarget.dataset.id))}),u.querySelectorAll(".btn-deactivate-user").forEach(A=>{A.addEventListener("click",q=>{const w=q.currentTarget.dataset.id,v=r.getById("technicians",w);if(!v)return;const $=document.createElement("div");$.innerHTML=`<p>Are you sure you want to deactivate <strong>${v.name}</strong>? They will no longer be able to log in.</p>`,xe({title:"Deactivate User",content:$,actions:[{label:"Cancel",className:"btn-secondary",onClick:C=>C()},{label:"Deactivate",className:"btn-danger",onClick:C=>{r.update("technicians",w,{deactivated:!0,deactivatedAt:new Date().toISOString()}),H(`${v.name} deactivated`,"info"),C(),n()}}]})})}),u.querySelectorAll(".btn-reactivate-user").forEach(A=>{A.addEventListener("click",q=>{const w=q.currentTarget.dataset.id,v=r.getById("technicians",w);if(!v)return;const $=new Date(v.deactivatedAt),C=Math.ceil((new Date-$)/(1e3*60*60*24));if(C<30){H(`License Policy: Seat cooldown in progress (${30-C} days remaining)`,"error");return}const N=document.createElement("div");N.innerHTML=`<p>Reactivate <strong>${v.name}</strong>? They will regain access once a User Type is assigned.</p>`,xe({title:"Reactivate User",content:N,actions:[{label:"Cancel",className:"btn-secondary",onClick:O=>O()},{label:"Reactivate",className:"btn-primary",onClick:O=>{r.update("technicians",w,{deactivated:!1,deactivatedAt:null}),H(`${v.name} has been reactivated.`,"success"),O(),n()}}]})})}),(h=u.querySelector("#btn-add-usertype"))==null||h.addEventListener("click",()=>{p()}),u.querySelectorAll(".btn-edit-perms").forEach(A=>{A.addEventListener("click",q=>{o(q.target.dataset.id)})}),u.querySelectorAll(".btn-edit-usertype").forEach(A=>{A.addEventListener("click",q=>{p(q.target.dataset.id)})}),u.querySelectorAll(".btn-delete-usertype").forEach(A=>{A.addEventListener("click",q=>{const w=q.target.dataset.id,v=r.getById("userTypes",w);if(!v)return;if(v.name.toLowerCase().includes("admin")){H("Cannot delete the Admin user type — at least one Admin must always exist.","error");return}const $=r.getAll("technicians").filter(N=>N.userTypeId===w),C=document.createElement("div");C.innerHTML=`<p>Are you sure you want to delete the user type <strong>${v.name}</strong>?${$.length>0?` <strong>${$.length} user(s)</strong> will become unassigned.`:""} This cannot be undone.</p>`,xe({title:"Confirm Deletion",content:C,actions:[{label:"Cancel",className:"btn-secondary",onClick:N=>N()},{label:"Delete",className:"btn-danger",onClick:N=>{r.delete("userTypes",w),H("User Type deleted","success"),N(),n()}}]})})})}else if(s==="materials")d(u);else if(s==="tax"){let _=function(A){return Array.from(A.querySelectorAll(".labor-rate-card")).map(q=>{const w=q.dataset.id,v=q.querySelector(".rate-name").value,$=parseFloat(q.querySelector(".rate-val").value)||0,C=parseFloat(q.querySelector(".rate-multiplier").value)||1,N=q.querySelector(".rate-desc").value,O=parseFloat(q.querySelector(".rate-min-fee").value)||0,D=q.querySelector(".btn-set-default")===null,z=Array.from(q.querySelectorAll(".rate-day:checked")).map(M=>M.dataset.day);return{id:w,name:v,rate:$,description:N,overtimeMultiplier:C,minCallOutFee:O,applicableDays:z,isDefault:D}})};var b=_;const I=r.getSettings();u.innerHTML=`
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
                  <input class="form-input" id="global-markup" type="number" value="${I.markupPercent||20}" style="width:100px" /> <span class="text-secondary">%</span>
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
                  <option value="1" ${(I.laborRounding||15)===1?"selected":""}>None (Precise)</option>
                  <option value="5" ${(I.laborRounding||15)===5?"selected":""}>Nearest 5 Minutes</option>
                  <option value="15" ${(I.laborRounding||15)===15?"selected":""}>Nearest 15 Minutes</option>
                  <option value="30" ${(I.laborRounding||15)===30?"selected":""}>Nearest 30 Minutes</option>
                  <option value="60" ${(I.laborRounding||15)===60?"selected":""}>Nearest Hour</option>
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
              ${I.laborRates.map(A=>{const q=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],w={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},v=A.applicableDays||["Mon","Tue","Wed","Thu","Fri"];return`
                <div class="labor-rate-card" data-id="${A.id}" style="border:2px solid ${A.isDefault?"var(--color-primary)":"var(--border-color)"}; border-radius:10px; overflow:hidden; background:var(--content-bg);">
                  <!-- Card Header -->
                  <div style="padding:12px 16px; background:${A.isDefault?"var(--color-primary-light)":"var(--bg-color)"}; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:10px;flex:1">
                      <span class="material-icons-outlined" style="color:${A.isDefault?"var(--color-primary)":"var(--text-tertiary)"}; font-size:20px">sell</span>
                      <input class="rate-name" value="${A.name}" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" placeholder="Rate Profile Name" />
                      ${A.isDefault?'<span class="badge" style="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600">DEFAULT</span>':""}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                      ${A.isDefault?"":`<button class="btn btn-ghost btn-sm btn-set-default" data-id="${A.id}" title="Set as default rate">Set Default</button>`}
                      <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${A.id}" title="Delete profile" ${A.isDefault?'disabled style="opacity:0.4;cursor:not-allowed"':""}>
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
                        <input class="form-input rate-val" type="number" value="${A.rate.toFixed(2)}" min="0" step="0.50" style="width:120px" />
                        <span class="text-secondary">/hr</span>
                      </div>
                    </div>
                    <!-- Overtime Multiplier -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Overtime Multiplier</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <input class="form-input rate-multiplier" type="number" value="${(A.overtimeMultiplier||1).toFixed(1)}" min="1" max="5" step="0.5" style="width:100px" />
                        <span class="text-secondary">× base pay</span>
                      </div>
                    </div>
                    <!-- Minimum Call-out Fee -->
                    <div class="form-group" style="margin:0">
                      <label class="form-label">Min Call-out Fee ($)</label>
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:var(--text-secondary)">$</span>
                        <input class="form-input rate-min-fee" type="number" value="${(A.minCallOutFee||0).toFixed(2)}" min="0" step="1.00" style="width:120px" />
                      </div>
                    </div>
                    <!-- Description -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Description</label>
                      <input class="form-input rate-desc" value="${A.description||""}" placeholder="When is this rate used?" />
                    </div>
                    <!-- Applicable Days -->
                    <div class="form-group" style="margin:0;grid-column:1/-1">
                      <label class="form-label">Applicable Days</label>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                        ${q.map($=>`
                          <label style="cursor:pointer">
                            <input type="checkbox" class="rate-day" data-day="${$}" ${v.includes($)?"checked":""} style="display:none" />
                            <span class="rate-day-pill" data-day="${$}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${v.includes($)?"var(--color-primary)":"var(--border-color)"};background:${v.includes($)?"var(--color-primary-light)":"transparent"};color:${v.includes($)?"var(--color-primary)":"var(--text-secondary)"}">
                              ${w[$]}
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
              ${["Service","Project","Maintenance","Quote"].map(A=>`
                <div class="form-group" style="margin:0">
                  <label class="form-label">${A} Default Rate</label>
                  <select class="form-select rate-mapping" data-type="${A}">
                    <option value="">-- Use Default --</option>
                    ${I.laborRates.map(q=>{var w;return`<option value="${q.id}" ${((w=I.rateMappings)==null?void 0:w[A])===q.id?"selected":""}>${q.name}</option>`}).join("")}
                  </select>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `,u.addEventListener("click",A=>{const q=A.target.closest(".rate-day-pill");if(q){const w=q.dataset.day,$=q.closest(".labor-rate-card").querySelector(`.rate-day[data-day="${w}"]`);$.checked=!$.checked;const C=$.checked;q.style.border=`1px solid ${C?"var(--color-primary)":"var(--border-color)"}`,q.style.background=C?"var(--color-primary-light)":"transparent",q.style.color=C?"var(--color-primary)":"var(--text-secondary)"}}),u.querySelector("#add-rate-btn").addEventListener("click",()=>{const A="rate_"+Date.now().toString(36),q=u.querySelector("#labor-rates-container"),w=["Mon","Tue","Wed","Thu","Fri","Sat","Sun","PH"],v={Mon:"Mon",Tue:"Tue",Wed:"Wed",Thu:"Thu",Fri:"Fri",Sat:"Sat",Sun:"Sun",PH:"P.H."},$=document.createElement("div");$.className="labor-rate-card",$.dataset.id=A,$.style.cssText="border:2px solid var(--border-color); border-radius:10px; overflow:hidden; background:var(--content-bg);",$.innerHTML=`
          <div style="padding:12px 16px; background:var(--bg-color); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;flex:1">
              <span class="material-icons-outlined" style="color:var(--text-tertiary); font-size:20px">sell</span>
              <input class="rate-name" value="New Rate Profile" style="background:transparent;border:none;outline:none;font-weight:600;font-size:15px;color:var(--text-primary);width:200px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn btn-ghost btn-sm btn-set-default" data-id="${A}">Set Default</button>
              <button class="btn btn-ghost btn-sm btn-icon remove-rate-btn" data-id="${A}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
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
                ${w.map(C=>`
                  <label style="cursor:pointer">
                    <input type="checkbox" class="rate-day" data-day="${C}" ${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"checked":""} style="display:none" />
                    <span class="rate-day-pill" data-day="${C}" style="display:inline-block;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid ${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"var(--color-primary)":"var(--border-color)"};background:${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"var(--color-primary-light)":"transparent"};color:${["Mon","Tue","Wed","Thu","Fri"].includes(C)?"var(--color-primary)":"var(--text-secondary)"}">
                      ${v[C]}
                    </span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        `,q.appendChild($)}),u.addEventListener("click",A=>{if(A.target.closest(".remove-rate-btn")){const q=A.target.closest(".labor-rate-card");q&&q.remove()}}),u.addEventListener("click",A=>{if(A.target.closest(".btn-set-default")){const q=A.target.closest(".btn-set-default").dataset.id,w=_(u);w.forEach($=>$.isDefault=$.id===q);const v=u.querySelector("#labor-rates-container");v.innerHTML=w.map($=>{u.querySelectorAll(".labor-rate-card").forEach(C=>{const N=C.dataset.id===q;C.style.border=`2px solid ${N?"var(--color-primary)":"var(--border-color)"}`;const O=C.querySelector('div[style*="padding:12px 16px"]');O&&(O.style.background=N?"var(--color-primary-light)":"var(--bg-color)");let D=C.querySelector(".badge");if(N&&!D){const M=C.querySelector('div[style*="flex:1"]'),E=document.createElement("span");E.className="badge",E.style.cssText="background:var(--color-primary);color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600",E.textContent="DEFAULT",M.appendChild(E)}else!N&&D&&D.remove();let z=C.querySelector(".btn-set-default");if(N&&z)z.remove();else if(!N&&!z){const M=C.querySelector('div[style*="gap:8px"]'),E=document.createElement("button");E.className="btn btn-ghost btn-sm btn-set-default",E.dataset.id=C.dataset.id,E.textContent="Set Default",M.prepend(E)}})}),H("Default rate updated in view. Click Save to apply.","info")}}),u.querySelector("#save-tax-settings").addEventListener("click",()=>{const A=parseFloat(u.querySelector("#global-markup").value)||0,q=parseInt(u.querySelector("#labor-rounding").value)||15,w=_(u),v=r.getSettings();v.markupPercent=A,v.laborRounding=q,v.laborRates=w,v.rateMappings={},u.querySelectorAll(".rate-mapping").forEach($=>{$.value&&(v.rateMappings[$.dataset.type]=$.value)}),r.saveSettings(v),H("Financial and Rate settings saved","success"),n()})}else if(s==="assets"){r.getSettings();const I=r.getAll("assets").filter(_=>_.category==="Business");u.innerHTML=`
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
                ${I.map(_=>`
                  <tr>
                    <td class="font-medium">${y(_.name)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="text-tertiary">$</span>
                        <input type="number" class="form-input asset-rate-input" data-id="${_.id}" value="${_.recoveryRate||0}" step="0.5" style="width:100px; height:32px" />
                      </div>
                    </td>
                    <td><span class="badge badge-success">Active</span></td>
                  </tr>
                `).join("")}
                ${I.length===0?'<tr><td colspan="3" class="text-center text-tertiary" style="padding:24px">No business assets found. Add assets in the main Assets module.</td></tr>':""}
              </tbody>
            </table>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary" id="btn-save-asset-settings">Save Asset Recovery Rates</button>
          </div>
        </div>
      `,u.querySelector("#btn-save-asset-settings").addEventListener("click",()=>{u.querySelectorAll(".asset-rate-input").forEach(_=>{const A=_.dataset.id,q=parseFloat(_.value)||0;r.update("assets",A,{recoveryRate:q})}),H("Asset recovery rates updated across the system","success")})}else s==="system"&&(u.innerHTML=`
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
              ${l.role==="admin"?`
                <hr style="margin:var(--space-md) 0; border:none; border-top:1px dashed var(--border-color);" />
                <div style="background:var(--color-danger-bg); padding:var(--space-md); border-radius:var(--border-radius); border:1px solid rgba(220, 38, 38, 0.15)">
                  <h5 style="color:var(--color-danger); margin-bottom:8px; display:flex; align-items:center; gap:6px; font-weight:600;">
                    <span class="material-icons-outlined">admin_panel_settings</span> Administrator Actions
                  </h5>
                  <p style="font-size:var(--font-size-sm); color:var(--text-secondary); margin-bottom:var(--space-md); line-height:1.4;">
                    Configure clean setups or seed a single test sample to explore the blank app layout.
                  </p>
                  <button class="btn btn-secondary" id="btn-seed-minimal" style="width:100%; justify-content:center; margin-bottom:12px; border:1px solid rgba(0,0,0,0.12)">
                    <span class="material-icons-outlined">science</span> Seed One Example Version
                  </button>
                  <button class="btn btn-danger" id="btn-restore-new" style="width:100%; justify-content:center;">
                    <span class="material-icons-outlined">cleaning_services</span> Restore to New (Blank State)
                  </button>
                </div>
              `:""}
            </div>
          </div>
        </div>
      `,(k=u.querySelector("#btn-reset-data"))==null||k.addEventListener("click",()=>{r.clearAll(),H("Data reset. Reloading...","info"),setTimeout(()=>window.location.reload(),1e3)}),(S=u.querySelector("#btn-clear-data"))==null||S.addEventListener("click",()=>{r.clearAll(),H("All data cleared. Reloading...","warning"),setTimeout(()=>window.location.reload(),1e3)}),(L=u.querySelector("#btn-seed-minimal"))==null||L.addEventListener("click",()=>{const I=document.createElement("div");I.style.cssText="line-height:1.6; color:var(--text-primary);",I.innerHTML=`
          <p style="margin-bottom:12px">You are about to seed a minimal example dataset.</p>
          <div style="background:var(--color-info-bg); border-left:4px solid var(--color-info); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-info); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined">info</span>
            <span>This will clear current database records and load <strong>exactly one example</strong> of each business entity (1 customer, 1 lead, 1 quote, 1 job, 1 invoice, etc.) for testing.</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary)">This is highly recommended for quick feature walkthroughs.</p>
        `,xe({title:"Seed One Example Version",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Seed Example",className:"btn-primary",onClick:_=>{_(),cs(),H("Single-item example seeded. Reloading...","success"),setTimeout(()=>window.location.reload(),1200)}}]})}),(T=u.querySelector("#btn-restore-new"))==null||T.addEventListener("click",()=>{const I=document.createElement("div");I.style.cssText="line-height:1.6; color:var(--text-primary);",I.innerHTML=`
          <p style="margin-bottom:12px">You are about to restore the application to a blank state.</p>
          <div style="background:var(--color-warning-bg); border-left:4px solid var(--color-warning); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-warning); font-weight:500; display:flex; align-items:center; gap:8px;">
            <span class="material-icons-outlined">warning</span>
            <span><strong>What gets wiped:</strong> Customers, Jobs, Tasks, Quotes, Invoices, Purchase Orders, Suppliers, Contractors, Assets, and Schedule Blocks.</span>
          </div>
          <p style="font-size:12px; color:var(--text-secondary)">Only default User Types and Technician login credentials will be retained so you can log back in.</p>
        `,xe({title:"Restore to New (Blank State)",content:I,actions:[{label:"Cancel",className:"btn-secondary",onClick:_=>_()},{label:"Continue Wiping",className:"btn-danger",onClick:_=>{_();const A=document.createElement("div");A.style.cssText="line-height:1.6; color:var(--text-primary);",A.innerHTML=`
                  <p style="margin-bottom:12px; font-weight:600; color:var(--color-danger)">THIS ACTION IS IRREVERSIBLE AND CANNOT BE UNDONE!</p>
                  <div style="background:var(--color-danger-bg); border-left:4px solid var(--color-danger); padding:12px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:var(--color-danger); font-weight:500; display:flex; align-items:center; gap:8px;">
                    <span class="material-icons-outlined">error_outline</span>
                    <span>Confirming will permanently delete all local storage records and start completely fresh from scratch for your real company.</span>
                  </div>
                  <p style="font-size:12px; color:var(--text-secondary)">Are you absolutely 100% sure you want to proceed?</p>
                `,xe({title:"⚠️ Permanent Database Wipe",content:A,actions:[{label:"Abort Wiping",className:"btn-secondary",onClick:q=>q()},{label:"Yes, Wipe Everything!",className:"btn-danger",onClick:q=>{q(),r.clearAll(),localStorage.setItem("simpro__prevent_seeding","true"),localStorage.setItem("simpro__seeded","true"),localStorage.removeItem("currentUser"),H("App restored to fresh state. Reloading...","success"),setTimeout(()=>{window.location.hash="#/login",window.location.reload()},1200)}}]})}}]})}))}function p(u=null){let b=u?r.getById("userTypes",u):{name:"",description:""};const h=document.createElement("div");h.innerHTML=`
        ${u?"":`
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
          <input class="form-input" id="ut-name" value="${b.name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="ut-desc" value="${b.description}" />
        </div>
    `;const k=h.querySelector("#ut-template"),S=h.querySelector("#ut-custom-edit-perms");k&&S&&(k.addEventListener("change",L=>{L.target.value==="Custom"?S.style.display="flex":S.style.display="none"}),S.addEventListener("click",()=>{var A;const L=h.querySelector("#ut-name").value,T=h.querySelector("#ut-desc").value;if(!L){H("Please enter a User Type Name first","error");return}const I=at(()=>!1),_=r.create("userTypes",{name:L,description:T,permissions:I});(A=document.getElementById("modal-close-btn"))==null||A.click(),o(_.id)})),xe({title:u?"Edit User Type":"Add User Type",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:L=>L()},{label:"Save",className:"btn-primary",onClick:L=>{var A;const T=document.getElementById("ut-name").value,I=document.getElementById("ut-desc").value,_=(A=document.getElementById("ut-template"))==null?void 0:A.value;if(!T){H("Name required","error");return}if(u)r.update("userTypes",u,{name:T,description:I});else{let q=[];_==="Admin"?q=at(()=>!0):_==="Manager"?q=at((w,v)=>w==="Settings"?["view","edit_company"].includes(v):!0):_==="Technician"?q=at((w,v)=>w==="Dashboard"?v==="view":w==="Jobs"?["view","manage_tasks","book_time"].includes(v):w==="Timesheets"?["view_own","create"].includes(v):w==="Schedule"?["view_own"].includes(v):!1):_==="Office Staff"?q=at((w,v)=>w==="Settings"?!1:w==="Reports"?v==="view":!(["Invoices","Purchase Orders"].includes(w)&&v==="delete")):q=at(()=>!1),r.create("userTypes",{name:T,description:I,permissions:q})}H("User Type saved","success"),n(),L()}}]})}function o(u){const b=r.getById("userTypes",u);if(!b)return;const h=b.permissions||[],k={};h.forEach(T=>{k[T.module]=T});const S=document.createElement("div"),L=Object.entries(St).map(([T,I])=>{const _=k[T]||{},A=I.every(({key:w})=>_[w]),q=I.map(({key:w,label:v})=>`
        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; padding:4px 0">
          <input type="checkbox" class="perm-chk" data-module="${T}" data-key="${w}" ${_[w]?"checked":""}
            style="width:15px;height:15px;cursor:pointer" />
          <span>${v}</span>
        </label>
      `).join("");return`
        <div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden; margin-bottom:8px">
          <div style="padding:8px 14px; background:var(--content-bg); display:flex; align-items:center; justify-content:space-between">
            <span style="font-weight:600; font-size:13px">${T}</span>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:var(--text-secondary)">
              <input type="checkbox" class="module-select-all" data-module="${T}" ${A?"checked":""}
                style="width:14px;height:14px;cursor:pointer" />
              Select All
            </label>
          </div>
          <div style="padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:2px">
            ${q}
          </div>
        </div>
      `}).join("");S.innerHTML=`
      <div style="display:flex; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
        <button id="btn-select-all-perms" class="btn btn-sm btn-ghost">Select All</button>
        <button id="btn-deselect-all-perms" class="btn btn-sm btn-ghost">Deselect All</button>
      </div>
      <div style="max-height:62vh; overflow-y:auto; padding-right:4px">
        ${L}
      </div>
    `,S.querySelector("#btn-select-all-perms").addEventListener("click",()=>{S.querySelectorAll(".perm-chk, .module-select-all").forEach(T=>T.checked=!0)}),S.querySelector("#btn-deselect-all-perms").addEventListener("click",()=>{S.querySelectorAll(".perm-chk, .module-select-all").forEach(T=>T.checked=!1)}),S.querySelectorAll(".module-select-all").forEach(T=>{T.addEventListener("change",I=>{const _=I.target.dataset.module;S.querySelectorAll(`.perm-chk[data-module="${_}"]`).forEach(A=>A.checked=I.target.checked)})}),S.querySelectorAll(".perm-chk").forEach(T=>{T.addEventListener("change",()=>{const I=T.dataset.module,A=(St[I]||[]).every(({key:w})=>{const v=S.querySelector(`.perm-chk[data-module="${I}"][data-key="${w}"]`);return v&&v.checked}),q=S.querySelector(`.module-select-all[data-module="${I}"]`);q&&(q.checked=A)})}),xe({title:`Edit Permissions: ${b.name}`,content:S,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Save Permissions",className:"btn-primary",onClick:T=>{const I=Object.entries(St).map(([_,A])=>{const q={module:_};return A.forEach(({key:w})=>{const v=S.querySelector(`.perm-chk[data-module="${_}"][data-key="${w}"]`);q[w]=v?v.checked:!1}),q});r.update("userTypes",u,{permissions:I}),H("Permissions updated successfully","success"),n(),T()}}]})}function f(u=null){let b=u?r.getById("technicians",u):{name:"",role:"",color:"#1B6DE0",email:"",userTypeId:""};const h=r.getAll("userTypes"),k=document.createElement("div");k.innerHTML=`
      <div class="form-group">
        <label class="form-label">Name</label>
        <input class="form-input" id="u-name" value="${b.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="u-email" value="${b.email||""}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Role / Job Title</label>
          <input class="form-input" id="u-role" value="${b.role}" />
        </div>
        <div class="form-group">
          <label class="form-label">User Type</label>
          <select class="form-select" id="u-type">
            <option value="">-- Select --</option>
            ${h.map(T=>`
              <option value="${T.id}" ${b.userTypeId===T.id?"selected":""}>${T.name}</option>
            `).join("")}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Pay Rate ($/hr)</label>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-secondary);font-size:15px">$</span>
          <input class="form-input" id="u-payrate" type="number" min="0" step="0.50" value="${b.payRate||""}" placeholder="e.g. 45.00" style="width:140px" />
          <span class="text-secondary" style="font-size:var(--font-size-sm)">/hr — used in job cost &amp; P&amp;L calculations</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Profile Color</label>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${["#1B6DE0","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#64748B","#0EA5E9"].map(T=>`
            <div class="color-swatch" data-color="${T}" style="width:28px; height:28px; border-radius:50%; background:${T}; cursor:pointer; border:2px solid ${b.color.toUpperCase()===T.toUpperCase()?"var(--text-primary)":"transparent"}; box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
          `).join("")}
          <div style="position:relative; width:28px; height:28px; cursor:pointer; border-radius:50%; background:#f3f5f9; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color); margin-left:8px;" title="Custom Color">
            <span class="material-icons-outlined" style="font-size:16px; color:var(--text-secondary)">colorize</span>
            <input type="color" id="u-color" value="${b.color}" style="position:absolute; opacity:0; width:100%; height:100%; cursor:pointer; left:0; top:0;" />
          </div>
        </div>
      </div>
    `;const S=k.querySelector("#u-color"),L=k.querySelectorAll(".color-swatch");L.forEach(T=>{T.addEventListener("click",()=>{S.value=T.dataset.color,L.forEach(I=>I.style.borderColor="transparent"),T.style.borderColor="var(--text-primary)"})}),S.addEventListener("input",()=>{L.forEach(T=>T.style.borderColor="transparent")}),xe({title:u?"Edit User":"Add User",content:k,actions:[{label:"Cancel",className:"btn-secondary",onClick:T=>T()},{label:"Save",className:"btn-primary",onClick:T=>{const I=document.getElementById("u-name").value,_=document.getElementById("u-email").value,A=document.getElementById("u-role").value,q=document.getElementById("u-type").value,w=document.getElementById("u-color").value,v=parseFloat(document.getElementById("u-payrate").value)||null;if(!I){H("Name required","error");return}u?r.update("technicians",u,{name:I,email:_,role:A,userTypeId:q,color:w,payRate:v}):r.create("technicians",{name:I,email:_,role:A,userTypeId:q,color:w,payRate:v}),H("User saved","success"),n(),T()}}]})}document.addEventListener("save-settings",()=>H("Settings saved","success"));function g(u){const b=r.getAll("taskTemplates");u.innerHTML=`
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
              ${b.length?b.map(k=>`
                <tr>
                  <td class="font-medium">${y(k.name)}</td>
                  <td class="text-secondary" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${y(k.description||"—")}</td>
                  <td>
                    <div style="display:flex; gap:4px; flex-wrap:wrap">
                      ${(k.tags||[]).map(S=>`<span class="badge badge-neutral" style="font-size:10px">${y(S)}</span>`).join("")}
                    </div>
                  </td>
                  <td style="text-align:right">
                    <button class="btn btn-ghost btn-sm btn-icon btn-edit-template" data-id="${k.id}"><span class="material-icons-outlined" style="font-size:18px">edit</span></button>
                    <button class="btn btn-ghost btn-sm btn-icon text-danger btn-delete-template" data-id="${k.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
                  </td>
                </tr>
              `).join(""):'<tr><td colspan="4" class="text-center text-tertiary" style="padding:32px">No templates saved yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `,u.querySelector("#btn-add-template").addEventListener("click",()=>{h()}),u.querySelectorAll(".btn-delete-template").forEach(k=>{k.addEventListener("click",()=>{confirm("Delete this template?")&&(r.delete("taskTemplates",k.dataset.id),n())})}),u.querySelectorAll(".btn-edit-template").forEach(k=>{k.addEventListener("click",()=>{h(k.dataset.id)})});function h(k=null){const S=k?r.getById("taskTemplates",k):{name:"",description:"",tags:[],tasks:[]},L=document.createElement("div");L.style.maxHeight="80vh",L.style.overflowY="auto",L.style.padding="4px";let T=JSON.parse(JSON.stringify(S.tasks||S.phases||[])).map($=>{!$.subTasks&&$.subPhases&&($.subTasks=$.subPhases,delete $.subPhases),$.tasks&&!$.subTasks&&($.subTasks=$.tasks.map(N=>({id:N.id||r.generateId(),name:N.name||"",estimatedHours:N.estimatedHours||0,people:N.people||1,status:"Not Started",progress:0})),delete $.tasks);function C(N){N.subPhases&&!N.subTasks&&(N.subTasks=N.subPhases,delete N.subPhases),N.subTasks||(N.subTasks=[]),N.subTasks.forEach(C)}return C($),$}),I=T.length>0?[0]:[],_=[],A=!1;function q($,C){if(!C||C.length===0)return null;let N=$[C[0]];if(!N)return null;for(let O=1;O<C.length;O++)if(!N.subTasks||(N=N.subTasks[C[O]],!N))return null;return N}function w($){return!$.subTasks||$.subTasks.length===0?(parseFloat($.estimatedHours)||0)*(parseInt($.people)||1):$.subTasks.reduce((C,N)=>C+w(N),0)}const v=()=>{var $,C,N,O,D,z;L.innerHTML=`
          <div class="grid-3" style="margin-bottom:16px; gap:16px">
            <div class="form-group">
              <label class="form-label">Template Name *</label>
              <input type="text" class="form-input" id="edit-tmpl-name" value="${y(S.name)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input type="text" class="form-input" id="edit-tmpl-desc" value="${y(S.description||"")}" />
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma separated)</label>
              <input type="text" class="form-input" id="edit-tmpl-tags" value="${(S.tags||[]).join(", ")}" />
            </div>
          </div>

          <div style="display:flex; gap:16px; min-height:380px; align-items:stretch">
            <!-- Left panel: Drill-Down List -->
            ${(()=>{const M=_.length>0?q(T,_):null,E=M?M.subTasks||[]:T,j=M?y(M.name):"Main Tasks";return`
                <div style="flex: 0 0 280px; display:flex; flex-direction:column; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg);">
                  <div style="padding:10px; border-bottom:1px solid var(--border-color); font-weight:600; display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:6px; overflow:hidden">
                      ${_.length>0?'<button class="btn btn-ghost btn-sm btn-icon btn-view-back" title="Back" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:16px">arrow_back</span></button>':""}
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${j}">${j}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm btn-icon btn-add-node" title="Add Task" style="padding:2px; min-width:24px; min-height:24px"><span class="material-icons-outlined" style="font-size:18px">add</span></button>
                  </div>
                  <div style="padding:6px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; flex:1">
                    ${E.map((F,R)=>{const B=[..._,R],oe=B.join("-")===I.join("-");return`
                        <div class="tmpl-task-list-item" data-path="${B.join("-")}" style="padding:8px; border-radius:4px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; ${oe?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color)"}">
                          <span style="font-weight:${oe?"600":"400"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;" title="${y(F.name)}">${y(F.name)}</span>
                          ${F.subTasks&&F.subTasks.length>0?`<button class="btn btn-ghost btn-icon btn-sm btn-drill-down-tmpl" data-path="${B.join("-")}" style="margin-left:6px; padding:2px; min-width:20px; min-height:20px; color:inherit"><span class="material-icons-outlined" style="font-size:16px">chevron_right</span></button>`:""}
                        </div>
                      `}).join("")}
                    ${E.length===0?'<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px">No items. Click + to add.</div>':""}
                  </div>
                </div>
              `})()}

            <!-- Right panel: Task Details Form -->
            <div style="flex:1; border:1px solid var(--border-color); border-radius:4px; background:var(--content-bg); padding:16px; display:flex; flex-direction:column">
              ${I.length>0?(()=>{const M=I,E=q(T,M);if(!E)return'<div class="text-tertiary text-center" style="margin:auto">Selected task not found.</div>';const j=E.subTasks&&E.subTasks.length>0;return`
                  ${A?`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0">Edit Item Details</h4>
                      <div style="display:flex; gap:6px">
                        <button class="btn btn-xs btn-primary btn-done-info-tmpl">Done</button>
                        <button class="btn btn-xs btn-secondary btn-duplicate-task-tmpl" data-path="${M.join("-")}" title="Duplicate"><span class="material-icons-outlined" style="font-size:14px">content_copy</span></button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${M.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <label class="form-label" style="font-size:11px">Name *</label>
                      <input type="text" class="form-input tmpl-detail-input" data-field="name" value="${y(E.name)}" style="font-size:13px" />
                    </div>
                    ${j?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:13px; font-weight:500">${w(E)} hrs</div>
                      </div>
                    `:`
                      <div class="form-row" style="margin-bottom:12px; gap:8px">
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">Est. Hours</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="estimatedHours" value="${E.estimatedHours||""}" min="0" step="0.5" style="font-size:13px" />
                        </div>
                        <div class="form-group">
                          <label class="form-label" style="font-size:11px">People</label>
                          <input type="number" class="form-input tmpl-detail-input" data-field="people" value="${E.people||"1"}" min="1" step="1" style="font-size:13px" />
                        </div>
                      </div>
                    `}
                    <div class="form-group" style="margin-bottom:0">
                      <label class="form-label" style="font-size:11px">Description</label>
                      <textarea class="form-input tmpl-detail-input" data-field="description" rows="3" style="font-size:13px">${y(E.description||"")}</textarea>
                    </div>
                  `:`
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <h4 style="margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%" title="${y(E.name)}">${y(E.name)}</h4>
                      <div style="display:flex; gap:6px">
                        ${M.length<3?`<button class="btn btn-xs btn-secondary btn-add-child-tmpl" data-path="${M.join("-")}"><span class="material-icons-outlined" style="font-size:14px">add</span> Add Sub-task</button>`:""}
                        <button class="btn btn-xs btn-primary btn-edit-info-tmpl"><span class="material-icons-outlined" style="font-size:14px">edit</span> Edit</button>
                        <button class="btn btn-xs btn-danger btn-remove-task-tmpl-item" data-path="${M.join("-")}" title="Delete"><span class="material-icons-outlined" style="font-size:14px">delete</span> Delete</button>
                      </div>
                    </div>
                    <div style="margin-bottom:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Name</div>
                      <div style="font-size:14px; font-weight:500">${y(E.name)}</div>
                    </div>
                    ${j?`
                      <div style="margin-bottom:12px">
                        <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Total Hours (Rollup)</div>
                        <div style="font-size:14px; font-weight:500">${w(E)} hrs</div>
                      </div>
                    `:`
                      <div style="display:flex; gap:16px; margin-bottom:12px">
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Estimated Hours</div>
                          <div style="font-size:14px; font-weight:500">${E.estimatedHours||0} hrs</div>
                        </div>
                        <div>
                          <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">People</div>
                          <div style="font-size:14px; font-weight:500">${E.people||1}</div>
                        </div>
                      </div>
                    `}
                    <div style="margin-top:12px">
                      <div style="font-size:11px; color:var(--text-tertiary); margin-bottom:2px">Description</div>
                      <div style="font-size:13px; white-space:pre-wrap; color:var(--text-secondary)">${y(E.description||"No description provided.")}</div>
                    </div>
                  `}
                `})():'<div class="text-tertiary text-center" style="margin:auto">Add or select a task on the left to edit details.</div>'}
            </div>
          </div>
        `,($=L.querySelector(".btn-view-back"))==null||$.addEventListener("click",()=>{_.pop(),v()}),L.querySelectorAll(".btn-drill-down-tmpl").forEach(M=>{M.addEventListener("click",E=>{E.stopPropagation(),_=M.dataset.path.split("-").map(Number),I=[..._],v()})}),L.querySelectorAll(".tmpl-task-list-item").forEach(M=>{M.addEventListener("click",E=>{E.target.closest(".btn-drill-down-tmpl")||(I=M.dataset.path.split("-").map(Number),A=!1,v())})}),(C=L.querySelector(".btn-add-node"))==null||C.addEventListener("click",()=>{const M={id:r.generateId(),name:"New Task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]};if(_.length===0)T.push(M),I=[T.length-1];else{const E=q(T,_);E.subTasks||(E.subTasks=[]),E.subTasks.push(M),I=[..._,E.subTasks.length-1]}A=!0,v()}),(N=L.querySelector(".btn-add-child-tmpl"))==null||N.addEventListener("click",M=>{const E=M.currentTarget.dataset.path.split("-").map(Number),j=q(T,E);j.subTasks||(j.subTasks=[]),j.subTasks.push({id:r.generateId(),name:"New Sub-task",status:"Not Started",progress:0,estimatedHours:0,people:1,subTasks:[]}),I=[...E,j.subTasks.length-1],A=!0,v()}),(O=L.querySelector(".btn-edit-info-tmpl"))==null||O.addEventListener("click",()=>{A=!0,v()}),(D=L.querySelector(".btn-done-info-tmpl"))==null||D.addEventListener("click",()=>{A=!1,v()}),L.querySelectorAll(".tmpl-detail-input").forEach(M=>{M.addEventListener("input",E=>{const j=q(T,I);if(!j)return;const F=E.target.dataset.field;F==="estimatedHours"?j[F]=parseFloat(E.target.value)||0:F==="people"?j[F]=parseInt(E.target.value)||1:j[F]=E.target.value})}),L.querySelectorAll(".btn-remove-task-tmpl-item").forEach(M=>{M.addEventListener("click",E=>{const j=M.dataset.path.split("-").map(Number);if(confirm("Are you sure you want to delete this item and all its sub-tasks?")){if(j.length===1)T.splice(j[0],1);else{const F=j.slice(0,-1),R=q(T,F);R&&R.subTasks&&R.subTasks.splice(j[j.length-1],1)}I=j.slice(0,-1),A=!1,v()}})}),(z=L.querySelector(".btn-duplicate-task-tmpl"))==null||z.addEventListener("click",M=>{const E=M.currentTarget.dataset.path.split("-").map(Number),j=q(T,E);if(!j)return;function F(B,oe){return{...B,id:r.generateId(),name:B.name+(oe?" (Copy)":""),status:"Not Started",progress:0,subTasks:B.subTasks?B.subTasks.map(V=>F(V,!1)):[]}}const R=F(j,!0);if(E.length===1)T.splice(E[0]+1,0,R),I=[E[0]+1];else{const B=E.slice(0,-1);q(T,B).subTasks.splice(E[E.length-1]+1,0,R),I=[...B,E[E.length-1]+1]}A=!1,v()})};v(),xe({title:k?"Edit Tasklist Template":"Create Tasklist Template",content:L,size:"modal-lg",actions:[{label:"Cancel",className:"btn-secondary",onClick:$=>$()},{label:"Save Template",className:"btn-primary",onClick:$=>{const C=L.querySelector("#edit-tmpl-name").value,N=L.querySelector("#edit-tmpl-desc").value,O=L.querySelector("#edit-tmpl-tags").value.split(",").map(z=>z.trim()).filter(Boolean);if(!C){H("Name required","error");return}const D={name:C,description:N,tags:O,tasks:T,phases:T};k?r.update("taskTemplates",k,D):r.create("taskTemplates",D),H("Tasklist template saved","success"),$(),n()}}]})}}function i(u){const b=r.getAll("quoteTemplates");u.innerHTML=`
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
              ${b.length?b.map(h=>`
                <tr>
                  <td class="font-medium">${y(h.name)}</td>
                  <td class="text-secondary">${y(h.description||"—")}</td>
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
    `,u.querySelector("#btn-add-quote-template").addEventListener("click",()=>{X.navigate("/settings/quote-templates/new")}),u.querySelectorAll(".btn-delete-quote-template").forEach(h=>{h.addEventListener("click",()=>{confirm("Delete this template?")&&(r.delete("quoteTemplates",h.dataset.id),n())})}),u.querySelectorAll(".btn-edit-quote-template").forEach(h=>{h.addEventListener("click",()=>{X.navigate(`/settings/quote-templates/${h.dataset.id}/edit`)})})}function d(u){const b=r.getSettings(),h=b.materialMarkup||{defaultPercent:30,minMarkupAmount:0,useTiers:!1,tiers:[]},k=b.materialCategories||["General"];u.innerHTML=`
      <div style="max-width:900px">
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h4 style="margin:0">Markup Configuration</h4></div>
          <div class="card-body">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Global Default Markup (%)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <input type="number" class="form-input" id="mat-default-markup" value="${h.defaultPercent}" style="width:100px" />
                  <span class="text-secondary">%</span>
                </div>
                <p class="text-tertiary" style="font-size:12px;margin-top:4px">Applied to items not covered by tiers or categories.</p>
              </div>
              <div class="form-group">
                <label class="form-label">Minimum Markup Amount ($)</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="text-secondary">$</span>
                  <input type="number" class="form-input" id="mat-min-markup" value="${h.minMarkupAmount}" step="0.50" style="width:100px" />
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
                  <input type="checkbox" id="mat-use-tiers" ${h.useTiers?"checked":""} /> Enable Tiers
                </label>
              </div>

              <div id="tiers-container" style="display:flex;flex-direction:column;gap:8px; ${h.useTiers?"":"opacity:0.5;pointer-events:none"}">
                <table class="data-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Item Cost Range</th>
                      <th style="width:120px">Markup %</th>
                      <th style="width:40px"></th>
                    </tr>
                  </thead>
                  <tbody id="tier-rows">
                    ${(h.tiers||[]).map((L,T)=>`
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            ${T===0?"Up to":"From previous up to"} 
                            <div style="display:flex;align-items:center;gap:4px">
                              <span class="text-tertiary">$</span>
                              <input type="number" class="form-input tier-upto" value="${L.upTo||""}" placeholder="Infinity" style="height:28px;padding:2px 8px;width:100px" />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style="display:flex;align-items:center;gap:4px">
                            <input type="number" class="form-input tier-percent" value="${L.percent}" style="height:28px;padding:2px 8px;width:80px" />
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
              ${k.map(L=>`
                <div class="badge badge-neutral" style="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px">
                  ${L}
                  <span class="material-icons-outlined btn-remove-cat" data-name="${L}" style="font-size:14px;cursor:pointer">close</span>
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
    `;const S=()=>{const L=parseFloat(u.querySelector("#mat-default-markup").value),T=parseFloat(u.querySelector("#mat-min-markup").value),I=u.querySelector("#mat-use-tiers").checked,_=Array.from(u.querySelectorAll("#tier-rows tr")).map(w=>({upTo:parseFloat(w.querySelector(".tier-upto").value)||null,percent:parseFloat(w.querySelector(".tier-percent").value)||0})).sort((w,v)=>w.upTo===null?1:v.upTo===null?-1:w.upTo-v.upTo),A=Array.from(u.querySelectorAll(".btn-remove-cat")).map(w=>w.dataset.name),q={...b,materialMarkup:{defaultPercent:L,minMarkupAmount:T,useTiers:I,tiers:_},materialCategories:A};r.saveSettings(q),H("Material settings saved","success")};u.querySelector("#mat-use-tiers").addEventListener("change",L=>{u.querySelector("#tiers-container").style.opacity=L.target.checked?"1":"0.5",u.querySelector("#tiers-container").style.pointerEvents=L.target.checked?"auto":"none"}),u.querySelector("#btn-add-tier").addEventListener("click",()=>{const L=document.createElement("tr");L.innerHTML=`
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
      `,u.querySelector("#tier-rows").appendChild(L),L.querySelector(".btn-remove-tier").addEventListener("click",()=>L.remove())}),u.querySelectorAll(".btn-remove-tier").forEach(L=>{L.addEventListener("click",()=>L.closest("tr").remove())}),u.querySelector("#btn-add-category").addEventListener("click",()=>{const L=prompt("Enter category name:");if(L){const T=document.createElement("div");T.className="badge badge-neutral",T.style.cssText="padding:8px 12px;font-size:13px;display:flex;align-items:center;gap:8px",T.innerHTML=`
          ${L}
          <span class="material-icons-outlined btn-remove-cat" data-name="${L}" style="font-size:14px;cursor:pointer">close</span>
        `,u.querySelector("#categories-container").insertBefore(T,u.querySelector("#btn-add-category")),T.querySelector(".btn-remove-cat").addEventListener("click",()=>T.remove())}}),u.querySelectorAll(".btn-remove-cat").forEach(L=>{L.addEventListener("click",()=>L.closest(".badge").remove())}),u.querySelector("#btn-save-materials").addEventListener("click",S)}function x(u){u.innerHTML=`
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
    `;const b=u.querySelector("#subtab-tasklists"),h=u.querySelector("#subtab-forms"),k=u.querySelector("#subtab-quotes");c==="tasklists"&&(b.style.color="white"),c==="forms"&&(h.style.color="white"),c==="quotes"&&(k.style.color="white");const S=u.querySelector("#templates-subcontent");c==="tasklists"?g(S):c==="forms"?Ra(S):c==="quotes"&&i(S),b.addEventListener("click",()=>{c="tasklists",x(u)}),h.addEventListener("click",()=>{c="forms",x(u)}),k.addEventListener("click",()=>{c="quotes",x(u)})}m()}function Ra(e){const a=r.getAll("formTemplates");e.innerHTML=`
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
                  <td class="font-medium">${y(t.name)}</td>
                  <td style="color:var(--text-secondary); font-size:13px">${y(t.description||"—")}</td>
                  <td><span class="badge badge-neutral">${(t.sections||[]).reduce((s,c)=>s+c.fields.length,0)} Fields</span></td>
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
    `,e.querySelector("#btn-add-form-template").addEventListener("click",()=>X.navigate("/settings/forms/new")),e.querySelectorAll(".edit-form-template").forEach(t=>{t.addEventListener("click",()=>X.navigate(`/settings/forms/${t.dataset.id}/edit`))}),e.querySelectorAll(".delete-form-template").forEach(t=>{t.addEventListener("click",()=>{if(confirm("Are you sure you want to delete this form template? Existing job forms based on this template will remain but no new ones can be created.")){const s=t.dataset.id,c=r.getAll("formTemplates").filter(l=>l.id!==s);r.save("formTemplates",c),Ra(e)}})})}const Wt=[{type:"text",label:"Text Input",icon:"edit"},{type:"textarea",label:"Long Text",icon:"notes"},{type:"checkbox",label:"Checkbox",icon:"check_box"},{type:"select",label:"Dropdown",icon:"arrow_drop_down_circle"},{type:"date",label:"Date",icon:"calendar_today"},{type:"signature",label:"Signature",icon:"draw"},{type:"info",label:"Info Box",icon:"info"},{type:"spacer",label:"Spacer",icon:"space_bar"}];function Pt(e){return Wt.find(a=>a.type===e)||Wt[0]}function st(e){return e+"_"+Math.random().toString(36).substr(2,7)}function Oa(e,{id:a}){const t=a&&a!=="new",s=t?r.getAll("formTemplates").find(w=>w.id===a):null;if(t&&!s){e.innerHTML='<div class="empty-state"><h3>Template not found</h3></div>';return}let c=s?JSON.parse(JSON.stringify(s.sections||[])):[{id:st("sec"),title:"General Info",columns:1,fields:[]}];c.forEach(w=>{w.columns===void 0&&(w.columns=2),(w.fields||[]).forEach(v=>{v.colSpan===void 0&&(v.colSpan=v.width==="full"?w.columns||2:1)})});let l={type:null,sIdx:null,fIdx:null},m=null,n=(s==null?void 0:s.name)||"",p=(s==null?void 0:s.description)||"";function o(w,v){let $=[],C=0;for(let O of w){let D=Math.min(O.colSpan||1,v);O.type==="blank"&&(D=Math.min(O.colSpan,v-C),D<=0)||(C+D>v&&(v-C>0&&$.push({id:st("blk"),type:"blank",colSpan:v-C}),C=0),O.colSpan=D,$.push(O),C+=D,C===v&&(C=0))}for(C>0&&$.push({id:st("blk"),type:"blank",colSpan:v-C});$.length>0;){const O=$[$.length-1];if(O.type==="blank"&&O.colSpan===v)$.pop();else break}$.push({id:st("blk"),type:"blank",colSpan:v});let N=[];C=0;for(let O=0;O<$.length;O++){const D=$[O];if(N.length>0){const z=N[N.length-1];if(z.type==="blank"&&D.type==="blank"&&C+D.colSpan<=v){z.colSpan+=D.colSpan,C+=D.colSpan,C===v&&(C=0);continue}}N.push(D),C+=D.colSpan,C===v&&(C=0)}return N}function f(){const w=e.querySelector("#fb2-canvas"),v=e.querySelector(".fb2-right"),$=w?w.scrollTop:0,C=v?v.scrollTop:0;c.forEach(D=>{D.isSpacer||(D.fields=o(D.fields||[],D.columns||1))}),e.innerHTML=`
      ${q()}
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
              <input class="form-input" id="fb2-name" value="${y(n)}" placeholder="e.g. Daily Safety Audit" />
            </div>
            <div class="form-group" style="margin:0;flex:1">
              <label class="form-label">Description</label>
              <input class="form-input" id="fb2-desc" value="${y(p)}" placeholder="Optional description..." />
            </div>
          </div>
          <div class="fb2-canvas" id="fb2-canvas">
            ${g()}
          </div>
          <div class="fb2-toolbox">
            <span class="fb2-toolbox-label">DRAG TO ADD</span>
            ${Wt.map(D=>`
              <div class="fb2-tool" draggable="true" data-type="${D.type}">
                <span class="material-icons-outlined">${D.icon}</span>
                <span>${D.label}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="fb2-right" id="fb2-sidebar">
          ${d()}
        </div>
      </div>
    `,b();const N=e.querySelector("#fb2-canvas"),O=e.querySelector(".fb2-right");N&&(N.scrollTop=$),O&&(O.scrollTop=C)}function g(){if(!c.length)return`<div class="fb2-empty">
        <span class="material-icons-outlined" style="font-size:48px">dashboard_customize</span>
        <p>Click "Add Section" below to get started</p>
      </div>`;let w="";return c.forEach((v,$)=>{const C=l.type==="section"&&l.sIdx===$,N=v.columns||1;if(v.isSpacer){w+=`
          <div class="fb2-section fb2-spacer-sec ${C?"fb2-sel":""}" data-sidx="${$}">
            <div class="fb2-sec-header" draggable="true" data-sidx="${$}">
              <span class="material-icons-outlined fb2-drag-handle">drag_indicator</span>
              <span style="flex:1;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary)">Layout Spacer</span>
              <button class="btn btn-ghost btn-icon btn-sm fb2-del-sec" data-sidx="${$}" style="color:var(--color-danger)">
                <span class="material-icons-outlined" style="font-size:18px">close</span>
              </button>
            </div>
          </div>`;return}w+=`
        <div class="fb2-section ${C?"fb2-sel":""}" data-sidx="${$}">
          <div class="fb2-sec-header" draggable="true" data-sidx="${$}">
            <span class="material-icons-outlined fb2-drag-handle">drag_indicator</span>
            <input class="fb2-sec-title" value="${y(v.title)}" placeholder="Section title..." data-sidx="${$}" />
            <div class="fb2-col-btns">
              ${[1,2,3].map(O=>`<button class="fb2-col-btn ${N===O?"active":""}" data-sidx="${$}" data-cols="${O}" title="${O} column${O>1?"s":""}">${O}</button>`).join("")}
            </div>
            <button class="btn btn-ghost btn-icon btn-sm fb2-del-sec" data-sidx="${$}" style="color:var(--color-danger)" title="Delete section">
              <span class="material-icons-outlined" style="font-size:18px">close</span>
            </button>
          </div>
          <div class="fb2-fields" data-sidx="${$}" style="grid-template-columns:repeat(${N},1fr)">
            ${v.fields.length?v.fields.map((O,D)=>i(v,$,O,D)).join(""):""}
          </div>
        </div>`}),w+=`
      <div class="fb2-add-row">
        <button class="fb2-add-sec" id="fb2-add-sec"><span class="material-icons-outlined">add</span> Add Section</button>
        <button class="fb2-add-sec fb2-add-sec-alt" id="fb2-add-spacer"><span class="material-icons-outlined">space_bar</span> Add Spacer</button>
      </div>`,w}function i(w,v,$,C){const N=Pt($.type),O=l.type==="field"&&l.sIdx===v&&l.fIdx===C,D=w.columns||1,z=Math.min($.colSpan||1,D);if($.type==="blank")return`
        <div class="fb2-field fb2-blank" data-sidx="${v}" data-fidx="${C}" style="grid-column:span ${z};border:2px dashed var(--border-color);display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.02);min-height:70px;border-radius:6px;cursor:crosshair;box-shadow:none">
          <span style="color:var(--text-tertiary);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Drop Here</span>
        </div>
      `;const M=$.label||N.label+"...";let E="";return $.type==="text"&&(E='<div class="fb2-prev-input"></div>'),$.type==="textarea"&&(E='<div class="fb2-prev-ta"></div>'),$.type==="checkbox"&&(E=`<div class="fb2-prev-chk"><input type="checkbox" disabled /> <span style="flex:1; word-break: break-word; white-space: pre-wrap;">${y(M)}</span></div>`),$.type==="select"&&(E='<div class="fb2-prev-input" style="display:flex;justify-content:space-between"><span class="material-icons-outlined" style="font-size:16px">expand_more</span></div>'),$.type==="date"&&(E='<div class="fb2-prev-input"><span class="material-icons-outlined" style="font-size:14px">calendar_today</span></div>'),$.type==="signature"&&(E='<div class="fb2-prev-sig">Signature Field</div>'),$.type==="info"&&(E=`<div class="fb2-prev-info"><span class="material-icons-outlined" style="font-size:18px;flex-shrink:0">info</span> <span style="flex:1; word-break: break-word; white-space: pre-wrap;">${y($.label||"Informational text block").replace(/\n/g,"<br/>")}</span></div>`),$.type==="spacer"&&(E='<div class="fb2-prev-spacer">Spacer</div>'),`
      <div class="fb2-field ${O?"fb2-sel":""}" data-sidx="${v}" data-fidx="${C}" style="grid-column:span ${z}" draggable="true">
        <div class="fb2-field-bar">
          <span class="material-icons-outlined fb2-drag-handle" style="font-size:16px">drag_indicator</span>
          <span class="material-icons-outlined" style="font-size:14px;color:var(--text-tertiary)">${N.icon}</span>
          <span class="fb2-ftype-lbl">${N.label}</span>
        </div>
        <div style="padding:10px 14px 14px">
          ${$.type!=="info"?`
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;display:flex;justify-content:space-between">
              <span class="fb2-lbl" style="word-break: break-word; white-space: pre-wrap;">${y(M)}</span>
              ${$.required?'<span style="color:var(--color-danger);flex-shrink:0;margin-left:8px">*</span>':""}
            </div>
          `:""}
          ${E}
        </div>
      </div>
    `}function d(){var w;if(l.type==="field"){const v=(w=c[l.sIdx])==null?void 0:w.fields[l.fIdx];if(!v)return l={type:null},d();const $=Pt(v.type),N=c[l.sIdx].columns||1;return`
        <div class="fb2-sb-head"><span class="material-icons-outlined" style="color:var(--color-primary)">${$.icon}</span><span>${$.label} Properties</span></div>
        <div class="fb2-sb-body">
          ${v.type!=="spacer"?`
            <div class="form-group">
              <label class="form-label">${v.type==="info"?"Information Text":"Label"}</label>
              <textarea class="form-textarea" id="sb-label" rows="${v.type==="info"?4:2}" placeholder="${v.type==="info"?"Informational text...":"Field label..."}">${y(v.label||"")}</textarea>
            </div>
          `:""}
          <div class="form-group">
            <label class="form-label">Field Type</label>
            <select class="form-select" id="sb-type">
              ${Wt.map(O=>`<option value="${O.type}" ${v.type===O.type?"selected":""}>${O.label}</option>`).join("")}
            </select>
          </div>
          ${v.type!=="info"&&v.type!=="spacer"?`
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
                <input type="checkbox" id="sb-req" ${v.required?"checked":""} style="width:18px;height:18px" />
                Required field
              </label>
            </div>
          `:""}
          ${N>1?`
            <div class="form-group">
              <label class="form-label">Column Span</label>
              <div class="fb2-col-btns" style="justify-content:flex-start">
                ${Array.from({length:N},(O,D)=>D+1).map(O=>`
                  <button class="fb2-col-btn sb-span-btn ${(v.colSpan||1)===O?"active":""}" data-span="${O}">${O===N?"Full":O}</button>
                `).join("")}
              </div>
            </div>
          `:""}
          ${v.type==="select"?`
            <div class="form-group">
              <label class="form-label">Dropdown Options</label>
              <textarea class="form-textarea" id="sb-opts" rows="4" placeholder="One option per line...">${(v.options||[]).join(`
`)}</textarea>
              <small style="color:var(--text-tertiary);font-size:11px">One option per line</small>
            </div>
          `:""}
          <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:8px">
            <button class="btn btn-ghost btn-sm" id="sb-del-field" style="color:var(--color-danger);width:100%;justify-content:center">
              <span class="material-icons-outlined" style="font-size:16px">delete</span> Delete Field
            </button>
          </div>
        </div>`}if(l.type==="section"){const v=c[l.sIdx];if(!v)return l={type:null},d();const $=v.columns||1;return`
        <div class="fb2-sb-head"><span class="material-icons-outlined" style="color:var(--color-primary)">view_agenda</span><span>Section Properties</span></div>
        <div class="fb2-sb-body">
          ${v.isSpacer?`
            <div class="form-group">
              <label class="form-label">Spacer Height (px)</label>
              <input type="number" class="form-input" id="sb-spacer-h" value="${parseInt(v.height||"60")}" min="20" max="300" />
            </div>
          `:`
            <div class="form-group">
              <label class="form-label">Section Title</label>
              <input class="form-input" id="sb-sec-title" value="${y(v.title||"")}" placeholder="Section title..." />
            </div>
            <div class="form-group">
              <label class="form-label">Columns</label>
              <div class="fb2-col-btns" style="justify-content:flex-start">
                ${[1,2,3].map(C=>`<button class="fb2-col-btn sb-col-btn ${$===C?"active":""}" data-cols="${C}">${C} Col${C>1?"s":""}</button>`).join("")}
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
      </div>`}function x(){const w=document.activeElement,v=w==null?void 0:w.id,$=w==null?void 0:w.selectionStart,C=w==null?void 0:w.selectionEnd;if(f(),v){const N=e.querySelector(`#${v}`);if(N){N.focus();try{N.setSelectionRange($,C)}catch{}}}}function u(){const w=e.querySelector("#fb2-sidebar");w&&(w.innerHTML=d(),k())}function b(){var w,v,$,C,N;(w=e.querySelector("#fb2-back"))==null||w.addEventListener("click",()=>X.navigate("/settings?tab=forms")),(v=e.querySelector("#fb2-cancel"))==null||v.addEventListener("click",()=>X.navigate("/settings?tab=forms")),($=e.querySelector("#fb2-save"))==null||$.addEventListener("click",A),(C=e.querySelector("#fb2-name"))==null||C.addEventListener("input",O=>n=O.target.value),(N=e.querySelector("#fb2-desc"))==null||N.addEventListener("input",O=>p=O.target.value),h(),k(),S()}function h(){var w,v,$;(w=e.querySelector("#fb2-add-sec"))==null||w.addEventListener("click",()=>{c.push({id:st("sec"),title:"New Section",columns:1,fields:[]}),l={type:"section",sIdx:c.length-1},f()}),(v=e.querySelector("#fb2-add-spacer"))==null||v.addEventListener("click",()=>{c.push({id:st("sec"),title:"",isSpacer:!0,width:"full",columns:1,height:"60px",fields:[]}),l={type:"section",sIdx:c.length-1},f()}),e.querySelectorAll(".fb2-field:not(.fb2-blank)").forEach(C=>{C.addEventListener("click",N=>{N.stopPropagation(),l={type:"field",sIdx:+C.dataset.sidx,fIdx:+C.dataset.fidx},f()})}),e.querySelectorAll(".fb2-sec-header").forEach(C=>{C.addEventListener("click",N=>{N.target.closest(".fb2-del-sec")||N.target.closest(".fb2-col-btn")||N.target.classList.contains("fb2-sec-title")||(l={type:"section",sIdx:+C.dataset.sidx},f())})}),e.querySelectorAll(".fb2-sec-title").forEach(C=>{C.addEventListener("input",()=>{c[+C.dataset.sidx].title=C.value;const N=e.querySelector("#sb-sec-title");N&&N!==document.activeElement&&(N.value=C.value)})}),e.querySelectorAll(".fb2-col-btn[data-sidx][data-cols]").forEach(C=>{C.addEventListener("click",N=>{N.stopPropagation();const O=+C.dataset.sidx,D=+C.dataset.cols;c[O].columns=D,c[O].fields.forEach(z=>{(z.colSpan||1)>D&&(z.colSpan=D)}),l={type:"section",sIdx:O},f()})}),e.querySelectorAll(".fb2-del-sec").forEach(C=>{C.addEventListener("click",N=>{N.stopPropagation(),confirm("Delete this section and all its fields?")&&(c.splice(+C.dataset.sidx,1),l={type:null},f())})}),($=e.querySelector(".fb2-canvas"))==null||$.addEventListener("click",C=>{C.target.closest(".fb2-field")||C.target.closest(".fb2-sec-header")||C.target.closest(".fb2-add-sec")||C.target.closest(".fb2-add-sec-alt")||(l={type:null},u(),e.querySelectorAll(".fb2-sel").forEach(N=>N.classList.remove("fb2-sel")))})}function k(){var $,C,N,O,D,z;const w=e.querySelector("#sb-label");w&&w.addEventListener("input",()=>{if(l.type==="field"){c[l.sIdx].fields[l.fIdx].label=w.value;const M=e.querySelector(`.fb2-field[data-sidx="${l.sIdx}"][data-fidx="${l.fIdx}"] .fb2-lbl`);M&&(M.textContent=w.value||Pt(c[l.sIdx].fields[l.fIdx].type).label+"...")}}),($=e.querySelector("#sb-type"))==null||$.addEventListener("change",M=>{l.type==="field"&&(c[l.sIdx].fields[l.fIdx].type=M.target.value,f())}),(C=e.querySelector("#sb-req"))==null||C.addEventListener("change",M=>{l.type==="field"&&(c[l.sIdx].fields[l.fIdx].required=M.target.checked,x())}),e.querySelectorAll(".sb-span-btn").forEach(M=>{M.addEventListener("click",()=>{l.type==="field"&&(c[l.sIdx].fields[l.fIdx].colSpan=+M.dataset.span,f())})}),(N=e.querySelector("#sb-opts"))==null||N.addEventListener("input",M=>{l.type==="field"&&(c[l.sIdx].fields[l.fIdx].options=M.target.value.split(`
`).map(E=>E.trim()).filter(Boolean))});const v=e.querySelector("#sb-sec-title");v&&v.addEventListener("input",()=>{if(l.type==="section"){c[l.sIdx].title=v.value;const M=e.querySelector(`.fb2-sec-title[data-sidx="${l.sIdx}"]`);M&&M!==document.activeElement&&(M.value=v.value)}}),e.querySelectorAll(".sb-col-btn").forEach(M=>{M.addEventListener("click",()=>{if(l.type==="section"){const E=+M.dataset.cols;c[l.sIdx].columns=E,c[l.sIdx].fields.forEach(j=>{(j.colSpan||1)>E&&(j.colSpan=E)}),f()}})}),(O=e.querySelector("#sb-spacer-h"))==null||O.addEventListener("input",M=>{l.type==="section"&&(c[l.sIdx].height=M.target.value+"px")}),(D=e.querySelector("#sb-del-field"))==null||D.addEventListener("click",()=>{l.type==="field"&&(c[l.sIdx].fields.splice(l.fIdx,1),l={type:null},f())}),(z=e.querySelector("#sb-del-sec"))==null||z.addEventListener("click",()=>{l.type==="section"&&confirm("Delete this section?")&&(c.splice(l.sIdx,1),l={type:null},f())})}function S(){e.querySelectorAll(".fb2-tool").forEach(v=>{v.addEventListener("dragstart",$=>{const C=v.dataset.type,N=Pt(C);m={action:"add",type:C},$.dataTransfer.effectAllowed="copy",$.dataTransfer.setData("text/plain",C);const O=document.createElement("div");O.style.cssText="position:fixed;top:-999px;padding:10px 16px;background:white;border:2px solid #1B6DE0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;",O.innerHTML=`<span class="material-icons-outlined" style="font-size:18px">${N.icon}</span> ${N.label}`,document.body.appendChild(O),$.dataTransfer.setDragImage(O,80,20),requestAnimationFrame(()=>O.remove()),document.body.classList.add("fb2-dragging")}),v.addEventListener("dragend",_)}),e.querySelectorAll(".fb2-field:not(.fb2-blank)[draggable]").forEach(v=>{v.addEventListener("dragstart",$=>{$.stopPropagation(),m={action:"moveField",sIdx:+v.dataset.sidx,fIdx:+v.dataset.fidx},$.dataTransfer.effectAllowed="move",$.dataTransfer.setData("text/plain","field"),v.classList.add("fb2-dragging-src"),document.body.classList.add("fb2-dragging")}),v.addEventListener("dragend",()=>{v.classList.remove("fb2-dragging-src"),_()})}),e.querySelectorAll(".fb2-sec-header[draggable]").forEach(v=>{v.addEventListener("dragstart",$=>{m={action:"moveSection",sIdx:+v.dataset.sidx},$.dataTransfer.effectAllowed="move",$.dataTransfer.setData("text/plain","section");const C=v.closest(".fb2-section");C&&C.classList.add("fb2-dragging-src"),document.body.classList.add("fb2-dragging")}),v.addEventListener("dragend",()=>{e.querySelectorAll(".fb2-dragging-src").forEach($=>$.classList.remove("fb2-dragging-src")),_()})}),e.querySelectorAll(".fb2-blank").forEach(v=>{v.addEventListener("dragover",$=>{if(!m||m.action==="moveSection")return;const C=c[+v.dataset.sidx].fields[+v.dataset.fidx].colSpan;if((m.action==="add"?1:c[m.sIdx].fields[m.fIdx].colSpan)>C){$.dataTransfer.dropEffect="none";return}$.preventDefault(),$.stopPropagation(),$.dataTransfer.dropEffect=m.action==="add"?"copy":"move",v.style.borderColor="var(--color-primary)",v.style.background="var(--color-primary-light)"}),v.addEventListener("dragleave",()=>{v.style.borderColor="",v.style.background="rgba(0,0,0,0.02)"}),v.addEventListener("drop",$=>{if($.preventDefault(),$.stopPropagation(),!m||m.action==="moveSection")return;const C=+v.dataset.sidx,N=+v.dataset.fidx,O=c[C].fields[N].colSpan;if(m.action==="add"){const D={id:st("f"),type:m.type,label:"",required:!1,colSpan:1};D.type==="select"&&(D.options=[]),c[C].fields.splice(N,1,D),O>1&&c[C].fields.splice(N+1,0,{id:st("blk"),type:"blank",colSpan:O-1}),l={type:"field",sIdx:C,fIdx:N}}else if(m.action==="moveField"){const{sIdx:D,fIdx:z}=m,M={...c[D].fields[z]};if(M.colSpan>O)return;c[D].fields[z]={id:st("blk"),type:"blank",colSpan:M.colSpan},c[C].fields.splice(N,1,M),O>M.colSpan&&c[C].fields.splice(N+1,0,{id:st("blk"),type:"blank",colSpan:O-M.colSpan}),l={type:"field",sIdx:C,fIdx:N}}_(),f()})}),e.querySelectorAll(".fb2-field:not(.fb2-blank)").forEach(v=>{v.addEventListener("dragover",$=>{if(!m||m.action!=="moveField")return;const C=c[+v.dataset.sidx].fields[+v.dataset.fidx].colSpan;if(c[m.sIdx].fields[m.fIdx].colSpan!==C){$.dataTransfer.dropEffect="none";return}$.preventDefault(),$.stopPropagation(),$.dataTransfer.dropEffect="move",v.style.boxShadow="0 0 0 2px var(--color-primary)"}),v.addEventListener("dragleave",()=>{v.style.boxShadow=""}),v.addEventListener("drop",$=>{if($.preventDefault(),$.stopPropagation(),!m||m.action!=="moveField")return;const C=+v.dataset.sidx,N=+v.dataset.fidx,O=m.sIdx,D=m.fIdx,z=c[C].fields[N],M=c[O].fields[D];z.colSpan===M.colSpan&&(c[C].fields[N]=M,c[O].fields[D]=z,l={type:"field",sIdx:C,fIdx:N},_(),f())})});const w=e.querySelector("#fb2-canvas");w&&(w.addEventListener("dragover",v=>{m&&m.action==="moveSection"&&(v.preventDefault(),v.dataTransfer.dropEffect="move",T(w,L(w,v.clientY)))}),w.addEventListener("drop",v=>{if(m&&m.action==="moveSection"){v.preventDefault();let $=L(w,v.clientY);const C=m.sIdx,N=c.splice(C,1)[0];C<$&&$--,c.splice($,0,N),l={type:"section",sIdx:$},_(),f()}}))}function L(w,v){const $=w.querySelectorAll(".fb2-section");for(let C=0;C<$.length;C++){const N=$[C].getBoundingClientRect();if(v<N.top+N.height/2)return C}return $.length}function T(w,v){I();const $=w.querySelectorAll(".fb2-section");v<$.length?$[v].classList.add("fb2-drop-before"):$.length&&$[$.length-1].classList.add("fb2-drop-after")}function I(){e.querySelectorAll(".fb2-drop-before,.fb2-drop-after").forEach(w=>w.classList.remove("fb2-drop-before","fb2-drop-after"))}function _(){m=null,I(),document.body.classList.remove("fb2-dragging")}function A(){var D,z,M;const w=(D=e.querySelector("#fb2-name"))==null?void 0:D.value.trim(),v=(z=e.querySelector("#fb2-desc"))==null?void 0:z.value.trim();if(!w){H("Form name is required","error"),(M=e.querySelector("#fb2-name"))==null||M.focus();return}if(c.reduce((E,j)=>{var F;return E+(((F=j.fields)==null?void 0:F.length)||0)},0)===0){H("Add at least one field","error");return}const C=c.map(E=>{let j=E.fields?[...E.fields]:[];for(;j.length>0;){const F=j[j.length-1];if(F.type==="blank"&&F.colSpan===(E.columns||1))j.pop();else break}return{...E,width:"full",fields:j.map(F=>({...F,width:(F.colSpan||1)>=(E.columns||1)?"full":"half"}))}}),N={id:t?a:st("fmt"),name:w,description:v,sections:C},O=r.getAll("formTemplates");if(t){const E=O.findIndex(j=>j.id===a);E>=0&&(O[E]=N)}else O.push(N);r.save("formTemplates",O),H(`Form "${w}" saved`,"success"),X.navigate("/settings?tab=forms")}function q(){return`<style>
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
    </style>`}f()}const to=[{path:"/",module:"Dashboard"},{path:"/schedule",module:"Schedule"},{path:"/jobs",module:"Jobs"},{path:"/quotes",module:"Quotes"},{path:"/leads",module:"Leads"},{path:"/timesheets",module:"Timesheets"},{path:"/invoices",module:"Invoices"},{path:"/people",module:"Customers"},{path:"/stock",module:"Stock"},{path:"/purchase-orders",module:"Purchase Orders"},{path:"/reports",module:"Reports"},{path:"/contractors",module:"Contractors"},{path:"/assets",module:"Assets"},{path:"/documents",module:"Documents"},{path:"/settings",module:"Settings"}];function ao(e,a){if(e.role==="admin"||e.role==="manager")return"/";if(!e.userTypeId)return"/schedule";const t=a.getById("userTypes",e.userTypeId);if(!t||!t.permissions)return"/schedule";for(const{path:s,module:c}of to){const l=t.permissions.find(m=>m.module===c);if(l&&(l.view||l.create||l.edit||l.delete))return s}return"/schedule"}function so(e){var p;const a=document.querySelector(".sidebar"),t=document.querySelector(".topbar"),s=document.getElementById("breadcrumb");a&&(a.style.display="none"),t&&(t.style.display="none"),s&&(s.style.display="none");const c=r.getAll("technicians").filter(o=>!o.deactivated),l=r.getAll("userTypes");e.innerHTML=`
    <div class="login-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: var(--bg-primary);">
      <div class="login-box" style="background: var(--bg-surface); padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; max-height: 80vh; overflow-y:auto;">
        <h1 style="margin-bottom: 10px; color: var(--text-primary);">FieldForge</h1>
        <p style="margin-bottom: 30px; color: var(--text-secondary);">Select a user to log in</p>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${c.map(o=>{const f=l.find(g=>g.id===o.userTypeId);return`<button class="btn btn-secondary btn-login-user" data-id="${o.id}" style="width: 100%; padding: 12px; font-size: 16px; display:flex; justify-content:space-between; align-items:center;">
              <span>${o.name}</span>
              <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:12px;">${f?f.name:"Unassigned"}</span>
            </button>`}).join("")}
          ${c.length===0?'<p class="text-secondary">No users found. Please seed data.</p>':""}
          <hr style="margin: 10px 0; border-color: var(--border-color);">
          <button class="btn btn-outline" id="btn-login-customer" style="width: 100%; padding: 12px; font-size: 16px;">Log in as Customer</button>
        </div>
      </div>
    </div>
  `;const m=async o=>{const f=c.find(b=>b.id===o),g=l.find(b=>b.id===(f==null?void 0:f.userTypeId));let i="technician";if(g){const b=g.name.toLowerCase();b.includes("admin")?i="admin":b.includes("manager")?i="manager":b.includes("office")&&(i="office")}const d={id:f.id,name:f.name,role:i,userTypeName:g?g.name:"Unassigned",userTypeId:f.userTypeId,color:f.color};localStorage.setItem("currentUser",JSON.stringify(d)),a&&(a.style.display=""),t&&(t.style.display=""),s&&(s.style.display=""),me(async()=>{const{updateSidebarAccess:b}=await Promise.resolve().then(()=>ba);return{updateSidebarAccess:b}},void 0).then(({updateSidebarAccess:b})=>{b&&b()}),me(async()=>{const{updateTopbarAccess:b}=await Promise.resolve().then(()=>fa);return{updateTopbarAccess:b}},void 0).then(({updateTopbarAccess:b})=>{b&&b()});const{store:x}=await me(async()=>{const{store:b}=await Promise.resolve().then(()=>Ka);return{store:b}},void 0),u=ao(d,x);X.navigate(u)};e.querySelectorAll(".btn-login-user").forEach(o=>{o.addEventListener("click",f=>{const g=f.target.closest(".btn-login-user");m(g.dataset.id)})});const n=()=>{const o={id:"customer-user",name:"Customer User",role:"customer"},f=r.get("people").filter(g=>g.type==="Customer");f.length>0&&(o.customerId=f[0].id,o.name=f[0].firstName+" "+f[0].lastName),localStorage.setItem("currentUser",JSON.stringify(o)),a&&(a.style.display=""),t&&(t.style.display=""),s&&(s.style.display=""),me(async()=>{const{updateSidebarAccess:g}=await Promise.resolve().then(()=>ba);return{updateSidebarAccess:g}},void 0).then(({updateSidebarAccess:g})=>{g&&g()}),me(async()=>{const{updateTopbarAccess:g}=await Promise.resolve().then(()=>fa);return{updateTopbarAccess:g}},void 0).then(({updateTopbarAccess:g})=>{g&&g()}),X.navigate("/portal")};(p=e.querySelector("#btn-login-customer"))==null||p.addEventListener("click",n)}function na(e){const a=JSON.parse(localStorage.getItem("currentUser")||"{}"),t=a.customerId;if(a.role!=="customer"||!t){e.innerHTML='<div style="padding:40px;text-align:center;"><h2>Access Denied</h2></div>';return}const s=r.getAll("jobs").filter(o=>o.customerId===t),c=r.getAll("quotes").filter(o=>o.customerId===t),l=r.getAll("invoices").filter(o=>o.customerId===t);e.innerHTML=`
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
        ${c.length===0?'<p style="color:var(--text-tertiary);">No quotes found.</p>':`
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${c.map(o=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${o.number} - ${o.title||"Quote"}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(o.total||0).toFixed(2)} | Status: <span class="badge ${o.status==="Approved"?"badge-success":"badge-neutral"}">${o.status}</span></div>
                </div>
                <div>
                  ${o.status!=="Approved"?`<button class="btn btn-primary btn-sm btn-approve-quote" data-id="${o.id}">Approve</button>`:""}
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
            ${s.map(o=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${o.number} - ${o.title}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Status: <span class="badge badge-neutral">${o.status}</span></div>
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
            ${l.map(o=>`
              <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${o.number}</strong>
                  <div style="font-size:12px; color:var(--text-secondary);">Total: $${parseFloat(o.total||0).toFixed(2)} | Status: <span class="badge ${o.status==="Paid"?"badge-success":"badge-danger"}">${o.status}</span></div>
                </div>
                <div>
                  ${o.status!=="Paid"?`<button class="btn btn-success btn-sm btn-pay-invoice" data-id="${o.id}">Pay Now</button>`:""}
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;const m=e.querySelector("#portal-logout-btn");m&&m.addEventListener("click",()=>{localStorage.removeItem("currentUser"),X.navigate("/login")}),e.querySelectorAll(".btn-approve-quote").forEach(o=>{o.addEventListener("click",f=>{const g=f.target.dataset.id;r.update("quotes",g,{status:"Approved"}),alert("Quote approved successfully!"),na(e)})}),e.querySelectorAll(".btn-pay-invoice").forEach(o=>{o.addEventListener("click",f=>{const g=f.target.dataset.id;r.update("invoices",g,{status:"Paid"}),alert("Invoice paid successfully!"),na(e)})})}const oo=["Public Liability Insurance","Workers Compensation"];function ca(e){if(!e.expiryDate)return{status:"missing",label:"Missing Date",colorClass:"badge-neutral"};const a=new Date;a.setHours(0,0,0,0);const t=new Date(e.expiryDate);t.setHours(0,0,0,0);const s=t.getTime()-a.getTime(),c=Math.ceil(s/(1e3*60*60*24));return c<0?{status:"expired",label:"Expired",colorClass:"badge-danger"}:c<=30?{status:"expiring",label:`Expiring (${c}d)`,colorClass:"badge-warning"}:e.verified?{status:"active",label:"Active",colorClass:"badge-success"}:{status:"unverified",label:"Pending Verification",colorClass:"badge-neutral"}}function wt(e){if(!e.active)return{status:"inactive",label:"Inactive",badgeClass:"badge-neutral"};const a=e.complianceDocs||[];if(a.length===0)return{status:"non-compliant",label:"Missing Docs",badgeClass:"badge-danger"};const t=a.map(n=>n.type.toLowerCase().trim()),s=oo.filter(n=>!t.some(p=>p.includes(n.toLowerCase())));if(s.length>0)return{status:"non-compliant",label:"Missing critical docs",badgeClass:"badge-danger",reason:`Missing: ${s.join(", ")}`};let c=!1,l=!1,m=!1;return a.forEach(n=>{const p=ca(n);p.status==="expired"?c=!0:p.status==="expiring"?l=!0:p.status==="unverified"&&(m=!0)}),c?{status:"non-compliant",label:"Expired Credentials",badgeClass:"badge-danger"}:l?{status:"warning",label:"Expiring Credentials",badgeClass:"badge-warning"}:m?{status:"warning",label:"Pending Review",badgeClass:"badge-warning"}:{status:"compliant",label:"Compliant",badgeClass:"badge-success"}}function io(e,a){const t=a.token,c=r.getAll("contractors").find(w=>w.portalToken===t);if(!c){e.innerHTML=`
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
    `;return}let l="jobs",m=null,n="",p="all",o=null,f="";const g=new Set,i=new Map;function d(){const w=r.getAll("jobs"),v=[];return w.forEach($=>{let C=$.contractorId===c.id;const N=[];function O(D){D&&D.forEach(z=>{((z.assignedContractorIds||[]).includes(c.id)||z.assignedContractorId===c.id)&&(C=!0,N.push(z)),z.subTasks&&O(z.subTasks)})}$.tasks&&O($.tasks),C&&v.push({job:$,assignedTasks:N})}),v}function x(w,v){if(v.length<=1)return;const $=v.slice(0,-1);let C=w[$[0]];for(let N=1;N<$.length;N++)C=C.subTasks[$[N]];if(C&&C.subTasks&&C.subTasks.length>0){let N=0,O=0;C.subTasks.forEach(D=>{const z=(parseFloat(D.estimatedHours)||1)*(parseInt(D.people)||1);N+=z,O+=z*((D.progress||0)/100)}),C.progress=N>0?Math.round(O/N*100):0,C.progress===100?C.status="Completed":C.progress>0?C.status="In Progress":C.status="Not Started",x(w,$)}}function u(w,v){if(!w||v.length===0)return null;let $=w[v[0]];for(let C=1;C<v.length;C++){if(!$.subTasks)return null;$=$.subTasks[v[C]]}return $}function b(w,v,$){const N=r.getAll("jobs").find(M=>M.id===w);if(!N||!N.tasks)return;const O=v.split("-").map(Number),D=u(N.tasks,O);if(!D)return;if(D.progress=$,$===100?D.status="Completed":$>0?D.status="In Progress":D.status="Not Started",x(N.tasks,O),N.tasks.length>0){const M=N.tasks.length;N.tasks.filter(F=>F.status==="Completed").length;let E=0;N.tasks.forEach(F=>E+=F.progress||0);const j=Math.round(E/M);j===100&&N.status!=="Completed"&&N.status!=="Invoiced"?N.status="Completed":j>0&&N.status==="Pending"&&(N.status="In Progress")}r.update("jobs",w,{tasks:N.tasks,status:N.status});const z=document.getElementById("sync-indicator-"+w);z&&(z.style.opacity="1",setTimeout(()=>{z.style.opacity="0"},1e3))}function h(){const w=d(),v=wt(c),$=w.length;let C=0,N=0;w.forEach(E=>{function j(F){F&&F.forEach(R=>{((R.assignedContractorIds||[]).includes(c.id)||R.assignedContractorId===c.id)&&(R.status==="Completed"||R.progress===100?N++:C++),R.subTasks&&j(R.subTasks)})}j(E.job.tasks)});const D=r.getSettings().name||"FieldForge CRM",z=JSON.parse(localStorage.getItem("currentUser")||"null"),M=z&&z.role!=="customer";e.innerHTML=`
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
        ${M?`
          <div class="b2b-banner">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="material-icons-outlined text-primary" style="font-size: 28px;">sync_alt</span>
              <div>
                <strong style="font-size:13px; color: var(--text-primary)">B2B Integration Detected</strong>
                <p style="margin: 2px 0 0 0; font-size:11px; color: var(--text-secondary)">
                  You are logged into ${D} as <strong>${z.name}</strong>. You can copy this dispatch details directly into your local database!
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
            <h1>${y(c.businessName)}</h1>
            <p>FieldForge dispatch & subcontractor portal | Contact: ${y(c.contactName)}</p>
          </div>
          <div style="font-size: 11px; padding: 6px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; border: 1px solid rgba(255,255,255,0.12)">
            System Agency ID: <strong style="font-family:monospace; color:#38bdf8">${c.id}</strong>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon" style="background:#eff6ff; color:#3b82f6;">
              <span class="material-icons-outlined">business_center</span>
            </div>
            <div>
              <div class="kpi-value">${$}</div>
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
              <div class="kpi-value">${N}</div>
              <div class="kpi-label">Completed Tasks</div>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="${v.status==="compliant"?"background:#ecfdf5; color:#10b981;":"background:#fef2f2; color:#ef4444;"}">
              <span class="material-icons-outlined">${v.status==="compliant"?"verified":"gpp_maybe"}</span>
            </div>
            <div>
              <div class="kpi-value" style="font-size: 13px;">${v.label}</div>
              <div class="kpi-label">Compliance Status</div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button class="tab-btn ${l==="jobs"?"active":""}" data-tab="jobs">Jobs Allocation & Tasks</button>
          <button class="tab-btn ${l==="compliance"?"active":""}" data-tab="compliance">Compliance Registry (${(c.complianceDocs||[]).length})</button>
        </div>

        <!-- Tab Content -->
        <div id="portal-tab-content">
          ${l==="jobs"?k(w):L()}
        </div>

      </div>
    `,T()}function k(w){let v=w;if(p!=="all"&&(v=v.filter($=>p==="pending"?$.job.status==="Pending":p==="inprogress"?$.job.status==="In Progress":p==="completed"?["Completed","Invoiced"].includes($.job.status):!0)),n){const $=n.toLowerCase();v=v.filter(C=>C.job.number.toLowerCase().includes($)||C.job.title.toLowerCase().includes($)||C.job.siteAddress.toLowerCase().includes($))}return`
      <!-- Filters and Search Bar -->
      <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:12px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:250px;">
          <span class="material-icons-outlined text-secondary">search</span>
          <input type="text" id="job-search-input" class="form-input" style="flex:1;" placeholder="Search jobs by number, title, or address..." value="${y(n)}" />
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:11px; text-transform:uppercase; font-weight:600; color:var(--text-secondary);">Status Filter</span>
          <select id="job-status-filter" class="form-select" style="min-width:140px; height: 32px; padding: 2px 8px;">
            <option value="all" ${p==="all"?"selected":""}>All Dispatches</option>
            <option value="pending" ${p==="pending"?"selected":""}>Pending</option>
            <option value="inprogress" ${p==="inprogress"?"selected":""}>In Progress</option>
            <option value="completed" ${p==="completed"?"selected":""}>Completed</option>
          </select>
        </div>
      </div>

      <!-- Jobs Accordion -->
      ${v.length===0?`
        <div style="background:var(--card-bg); border:1px solid var(--border-color); border-radius:8px; padding:48px; text-align:center; color:var(--text-tertiary);">
          <span class="material-icons-outlined" style="font-size:48px; margin-bottom:12px;">work_off</span>
          <h3>No assigned jobs found matching filters</h3>
          <p style="margin-top:4px; font-size:12px;">Ensure tasks are allocated to ${y(c.businessName)} in the FieldForge CRM.</p>
        </div>
      `:`
        <div style="display:flex; flex-direction:column;">
          ${v.map($=>{const C=$.job.id===m,N={Urgent:"background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2;",High:"background: #fffbeb; color: #d97706; border: 1px solid #fef3c7;",Medium:"background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe;",Low:"background: #f8fafc; color: #64748b; border: 1px solid #f1f5f9;"},O={Pending:"badge-neutral",Scheduled:"badge-neutral","In Progress":"badge-primary","On Hold":"badge-warning",Completed:"badge-success",Invoiced:"badge-success"};return`
              <div class="job-card" id="job-card-${$.job.id}">
                <div class="job-card-header" data-id="${$.job.id}">
                  <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="font-bold" style="font-size:13px; color:var(--color-primary);">${y($.job.number)}</span>
                      <h3 style="font-size:13px; margin:0;">${y($.job.title)}</h3>
                      <span class="badge ${O[$.job.status]||"badge-neutral"}" style="margin:0">${y($.job.status)}</span>
                      <span class="badge" style="${N[$.job.priority]||""}; margin:0; font-size:10px; padding: 1px 6px;">${y($.job.priority||"Medium")}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:16px; font-size:11px; color:var(--text-secondary); margin-top:2px;">
                      <span style="display:flex; align-items:center; gap:4px;"><span class="material-icons-outlined" style="font-size:13px;">place</span> ${y($.job.siteAddress)}</span>
                      <span>Scheduled: ${$.job.scheduledDate?new Date($.job.scheduledDate).toLocaleDateString("en-AU"):"—"}</span>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <!-- Realtime sync tick feedback -->
                    <span id="sync-indicator-${$.job.id}" class="text-success" style="opacity:0; font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; transition:opacity 0.2s;">
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
                          ${S($.job.tasks,$.job,[])}
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
                          <textarea id="comment-input-${$.job.id}" class="form-input" rows="2" style="font-size:12px;" placeholder="Post a comment or activity update..."></textarea>
                          
                          <!-- Staged images preview -->
                          ${(()=>{const D=i.get($.job.id)||[];return D.length===0?"":`
                              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                                ${D.map((z,M)=>`
                                  <div style="display:flex; align-items:center; background:var(--content-bg); padding:2px 6px; border-radius:4px; font-size:11px; border:1px solid var(--border-color); gap:4px;">
                                    ${z.type&&z.type.startsWith("image/")?`<img src="${z.data}" style="width:20px; height:20px; object-fit:cover; border-radius:2px;" />`:'<span class="material-icons-outlined" style="font-size:14px; color:var(--text-secondary);">insert_drive_file</span>'}
                                    <span class="truncate" style="max-width:80px;">${y(z.name)}</span>
                                    <span class="material-icons-outlined text-danger btn-remove-comment-staged" data-job-id="${$.job.id}" data-idx="${M}" style="font-size:12px; cursor:pointer;">close</span>
                                  </div>
                                `).join("")}
                              </div>
                            `})()}

                          <div style="display:flex; justify-content:space-between; align-items:center;">
                            <label class="btn btn-secondary btn-sm" for="comment-upload-${$.job.id}" style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:11px; padding:4px 8px;">
                              <span class="material-icons-outlined" style="font-size:14px;">photo_camera</span> Attach Image
                              <input type="file" id="comment-upload-${$.job.id}" class="comment-file-input" data-job-id="${$.job.id}" style="display:none;" multiple accept="image/*" />
                            </label>
                            
                            <button class="btn btn-primary btn-sm btn-post-comment" data-job-id="${$.job.id}" style="display:flex; align-items:center; gap:6px;">
                              <span class="material-icons-outlined" style="font-size:14px;">send</span> Post Update
                            </button>
                          </div>
                        </div>

                        <!-- Notes Feed -->
                        <div style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:6px; padding:12px; background:var(--card-bg);">
                          <div class="timeline">
                            ${($.job.activityLog||[]).length===0?`
                              <div style="text-align:center; padding:12px; color:var(--text-tertiary); font-size:11px;">No activity history on this job.</div>
                            `:($.job.activityLog||[]).map(D=>`
                                <div class="timeline-item ${D.content.startsWith("[Subcontractor")?"subcontractor":""}">
                                  <div style="font-size:11px; font-weight:600; display:flex; justify-content:space-between;">
                                    <span>${y(D.content.split(": ")[0]||"System Note")}</span>
                                    <span class="text-tertiary" style="font-weight:400;">${new Date(D.date).toLocaleDateString("en-AU",{hour:"2-digit",minute:"2-digit"})}</span>
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-top:3px; line-height:1.4;">
                                    ${y(D.content.split(": ").slice(1).join(": ")||D.content)}
                                  </div>
                                  ${D.files&&D.files.length?`
                                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
                                      ${D.files.map(M=>`
                                          <div style="display:flex; align-items:center; gap:6px; border:1px solid var(--border-color); padding:4px 8px; border-radius:4px; background:var(--card-bg); font-size:10px; max-width:100%;">
                                            ${M.type&&M.type.startsWith("image/")?`<a href="${y(M.data)}" target="_blank" style="display:block;"><img src="${y(M.data)}" style="width:30px; height:30px; object-fit:cover; border-radius:3px;" /></a>`:'<span class="material-icons-outlined" style="font-size:18px; color:var(--text-tertiary);">description</span>'}
                                            <div style="overflow:hidden; text-align:left;">
                                              <div class="truncate" style="font-weight:500; max-width:120px;" title="${y(M.name)}">${y(M.name)}</div>
                                              <div class="text-secondary" style="font-size:8px;">${(M.size/1024).toFixed(1)} KB</div>
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
    `}function S(w,v,$,C=!1){if(!w||w.length===0)return'<div class="text-secondary" style="font-size:11px">No tasks defined</div>';const N=v&&v.contractorId===c.id,O=v?v.id:"";function D(M){return!M.subTasks||M.subTasks.length===0?!1:M.subTasks.some(E=>(E.assignedContractorIds||[]).includes(c.id)||E.assignedContractorId===c.id||D(E))}const z=w.map((M,E)=>({t:M,idx:E})).filter(({t:M})=>{const E=(M.assignedContractorIds||[]).includes(c.id)||M.assignedContractorId===c.id;return N||E||C?!0:D(M)});return z.length===0?$.length===0?'<div class="text-secondary" style="font-size:11px">No tasks allocated to your company</div>':"":z.map(({t:M,idx:E})=>{const j=[...$,E],F=j.join("-"),R=$.length*12,B=(M.assignedContractorIds||[]).includes(c.id)||M.assignedContractorId===c.id,oe=N||B||C,V=M.subTasks&&M.subTasks.length>0,P=g.has(`${O}-${F}`),te=M.description||`Standard operational procedures, verification checks, and safety guidelines for "${M.name}".`;return`
        <div style="padding-left: ${R}px; border-left: ${j.length>1?"1px dashed var(--border-color-dark)":"none"}; margin-left: ${j.length>1?"8px":"0"}; padding-top: 4px; padding-bottom: 4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding: 6px 10px; background:var(--card-bg); border-radius:4px; border:1px solid ${oe?"rgba(27,109,224,0.15)":"var(--border-color)"};">
            
            <div class="task-info-col" style="display:flex; flex-direction:column; gap:2px; flex:1; min-width:180px;">
              <div style="display:flex; align-items:center; gap:8px;">
                ${oe?`
                  <span class="material-icons-outlined text-primary" style="font-size:16px;" title="Assigned to your company">engineering</span>
                `:""}
                
                <span class="font-medium task-name-clickable" data-job-id="${O}" data-path="${F}" style="font-size:12px; cursor: pointer; ${oe?"font-weight:600; color:var(--color-primary-dark)":""}" title="Click to show/hide description">
                  ${y(M.name)}
                </span>
                
                ${M.estimatedHours?`
                  <span style="font-size:10px; color:var(--text-tertiary); background:var(--content-bg); padding:1px 4px; border-radius:3px;">${M.estimatedHours}h</span>
                `:""}

                <span class="material-icons-outlined btn-toggle-desc text-tertiary" data-job-id="${O}" data-path="${F}" style="font-size:14px; cursor:pointer;" title="Toggle description">
                  ${P?"info":"info_outline"}
                </span>
              </div>
              <div class="task-desc-container" style="font-size:11px; color:var(--text-secondary); line-height:1.4; padding-left: ${oe?"24px":"0px"}; font-style: italic; max-height: ${P?"200px":"0px"}; overflow: hidden; transition: max-height 0.2s ease-in-out; margin-top: ${P?"4px":"0px"};">
                ${y(te)}
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <!-- Interactive elements for subcontractor tasks, or read-only if not their task -->
              ${V?`
                <!-- Parent node: display progress badge, non-editable directly -->
                <div style="display:flex; align-items:center; gap:6px;">
                  <span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-size:10px; font-weight:700; margin:0;">${M.progress||0}%</span>
                  <span class="badge badge-neutral" style="font-size:10px; margin:0;">${y(M.status||"Not Started")}</span>
                </div>
              `:`
                <!-- Leaf node: checkbox toggle only (no slider) -->
                <div style="display:flex; align-items:center; gap:12px;">
                  <span class="badge ${M.progress===100?"badge-success":M.progress>0?"badge-primary":"badge-neutral"}" style="font-size:10px; margin:0; min-width: 80px; text-align: center;">
                    ${M.progress===100?"Completed":M.progress>0?`${M.progress}% Progress`:"Not Started"}
                  </span>
                  
                  <label class="custom-chk-label" style="margin: 0; display: inline-flex;">
                    <input type="checkbox" class="custom-chk task-checkbox" data-job-id="${O}" data-path="${F}" ${M.progress===100?"checked":""} ${oe?"":"disabled"} />
                    <span class="checkmark"></span>
                  </label>
                </div>
              `}
            </div>

          </div>

          <!-- Recurse children -->
          ${V?`
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
              ${S(M.subTasks,v,j,oe)}
            </div>
          `:""}
        </div>
      `}).join("")}function L(){const w=c.complianceDocs||[];return`
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
                ${w.map(v=>{const $=ca(v);return`
                    <tr>
                      <td class="font-medium">
                        <div>${y(v.type)}</div>
                        ${v.fileData?`
                          <div style="margin-top:4px;">
                            <a href="${v.fileData}" download="${v.fileName}" target="_blank" class="text-primary" style="font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                              <span class="material-icons-outlined" style="font-size:14px">attachment</span> ${y(v.fileName)}
                            </a>
                          </div>
                        `:""}
                      </td>
                      <td style="font-family:monospace;" class="text-secondary">${y(v.number||"—")}</td>
                      <td>${v.expiryDate?new Date(v.expiryDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td><span class="badge ${$.colorClass}">${y($.label)}</span></td>
                    </tr>
                  `}).join("")}
                ${w.length===0?'<tr><td colspan="4" style="text-align:center; padding:32px;" class="text-secondary">No credentials or certificates uploaded.</td></tr>':""}
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
    `}function T(){const w=e.querySelector(".portal-container");w&&I(w)}function I(w){w.addEventListener("click",v=>{const $=v.target.closest(".tab-btn");if($){l=$.dataset.tab,h();return}const C=v.target.closest(".job-card-header");if(C){if(v.target.closest("button")||v.target.closest("a"))return;const E=C.dataset.id;m=m===E?null:E,h();return}const N=v.target.closest(".task-name-clickable")||v.target.closest(".btn-toggle-desc");if(N){const E=N.dataset.jobId,j=N.dataset.path;if(E&&j){const F=`${E}-${j}`,R=N.closest(".task-info-col"),B=R==null?void 0:R.querySelector(".task-desc-container"),oe=R==null?void 0:R.querySelector(".btn-toggle-desc");g.has(F)?(g.delete(F),B&&(B.style.maxHeight="0px",B.style.marginTop="0px"),oe&&(oe.textContent="info_outline")):(g.add(F),B&&(B.style.maxHeight="200px",B.style.marginTop="4px"),oe&&(oe.textContent="info"))}return}const O=v.target.closest(".btn-post-comment");if(O){const E=O.dataset.jobId,j=w.querySelector("#comment-input-"+E);if(!j)return;const F=j.value.trim(),R=i.get(E)||[];if(!F&&!R.length)return;const oe=r.getAll("jobs").find(ce=>ce.id===E);if(!oe)return;oe.activityLog||(oe.activityLog=[]);const V=`[Subcontractor - ${c.businessName}] ${c.contactName}`,P=F?`${V}: ${F}`:`${V} attached files`;oe.activityLog.unshift({id:Math.random().toString(36).substr(2,9),type:"combined",content:P,files:[...R],date:new Date().toISOString()}),r.update("jobs",E,{activityLog:oe.activityLog}),i.set(E,[]);const te=document.getElementById("sync-indicator-"+E);te&&(te.style.opacity="1",setTimeout(()=>{te.style.opacity="0"},1e3)),h();return}const D=v.target.closest(".btn-remove-comment-staged");if(D){const E=D.dataset.jobId,j=parseInt(D.dataset.idx),F=i.get(E)||[];F.splice(j,1),i.set(E,F),h();return}if(v.target.closest("#btn-b2b-import")){q();return}if(v.target.closest("#file-drop-zone")){if(v.target.id!=="cred-file-input"){const E=w.querySelector("#cred-file-input");E&&E.click()}return}}),w.addEventListener("change",v=>{if(v.target.matches("#job-status-filter")){p=v.target.value;const $=w.querySelector("#portal-tab-content");$&&($.innerHTML=k(d()));return}if(v.target.matches(".task-checkbox")){const $=v.target.dataset.jobId,C=v.target.dataset.path,O=v.target.checked?100:0;b($,C,O),h();return}if(v.target.matches("#cred-file-input")){const $=v.target.files[0];_($);return}if(v.target.matches(".comment-file-input")){const $=v.target.dataset.jobId,C=Array.from(v.target.files);if(!C.length)return;let N=0;const O=i.get($)||[];C.forEach(D=>{const z=new FileReader;z.onload=M=>{O.push({name:D.name,size:D.size,type:D.type,data:M.target.result}),N++,N===C.length&&(i.set($,O),h())},z.readAsDataURL(D)});return}}),w.addEventListener("input",v=>{if(v.target.matches("#job-search-input")){n=v.target.value;const $=w.querySelector("#portal-tab-content");$&&($.innerHTML=k(d()));return}}),w.addEventListener("submit",v=>{v.target.matches("#compliance-upload-form")&&(v.preventDefault(),A())}),w.addEventListener("dragover",v=>{const $=v.target.closest("#file-drop-zone");$&&(v.preventDefault(),$.style.borderColor="var(--color-primary)",$.style.backgroundColor="var(--color-primary-light)")}),w.addEventListener("dragleave",v=>{const $=v.target.closest("#file-drop-zone");$&&($.style.borderColor="var(--border-color-dark)",$.style.backgroundColor="var(--content-bg)")}),w.addEventListener("drop",v=>{const $=v.target.closest("#file-drop-zone");if($){v.preventDefault(),$.style.borderColor="var(--border-color-dark)",$.style.backgroundColor="var(--content-bg)";const C=v.dataTransfer.files[0];_(C)}})}function _(w){if(!w)return;if(w.size>5*1024*1024){me(async()=>{const{showToast:C}=await Promise.resolve().then(()=>De);return{showToast:C}},void 0).then(({showToast:C})=>{C("File is too large. Max allowed size is 5MB.","error")});return}f=w.name;const v=e.querySelector("#selected-file-label");v&&(v.innerHTML=`<strong>Selected Attachment:</strong> ${y(w.name)} (${(w.size/1024).toFixed(1)} KB)`);const $=new FileReader;$.onload=C=>{o=C.target.result},$.readAsDataURL(w)}function A(){const w=e.querySelector("#cred-type").value,v=e.querySelector("#cred-number").value.trim(),$=e.querySelector("#cred-expiry").value,C=e.querySelector("#cred-notes").value.trim();if(!v||!$){me(async()=>{const{showToast:D}=await Promise.resolve().then(()=>De);return{showToast:D}},void 0).then(({showToast:D})=>{D("Please fill in all required fields.","error")});return}if(!o){me(async()=>{const{showToast:D}=await Promise.resolve().then(()=>De);return{showToast:D}},void 0).then(({showToast:D})=>{D("Please select a certificate file to upload.","error")});return}const N={id:"doc_"+Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:w,number:v,expiryDate:$,verified:!1,fileName:f,fileData:o,notes:C},O=[...c.complianceDocs||[],N];r.update("contractors",c.id,{complianceDocs:O}),c.complianceDocs=O,o=null,f="",me(async()=>{const{showToast:D}=await Promise.resolve().then(()=>De);return{showToast:D}},void 0).then(({showToast:D})=>{D("Document uploaded successfully. Awaiting admin review.","success"),h()})}function q(){const w=d();if(w.length===0){me(async()=>{const{showToast:M}=await Promise.resolve().then(()=>De);return{showToast:M}},void 0).then(({showToast:M})=>{M("No active jobs to import.","error")});return}const v=r.getSettings(),$=v.name||"FieldForge Demo Company";let N=r.getAll("customers").find(M=>M.company===$);N||(N={id:"cust_b2b_"+Math.random().toString(36).substr(2,9),company:$,firstName:"Operations",lastName:"Staff",email:v.email?"dispatch@"+v.email:"dispatch@fieldforge.io",phone:v.phone||"1300 123 456",address:v.address||"123 Business St, Melbourne VIC 3000",status:"Active",type:"Company",notes:"Auto-created customer representing our parent company during subcontractor B2B job imports.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},r.create("customers",N));function O(M){return M?M.map(E=>({id:"b2bt_"+Math.random().toString(36).substr(2,9),name:E.name,status:"Not Started",progress:0,estimatedHours:E.estimatedHours||0,people:E.people||1,startDate:E.startDate||new Date().toISOString(),subTasks:E.subTasks?O(E.subTasks):[],assignedContractorIds:[],assignedContractorId:null})):[]}let D=0;const z=r.getAll("jobs");w.forEach(({job:M})=>{const E=`[B2B Dispatch] ${M.number} - ${M.title}`;if(z.some(V=>V.title===E))return;let F=1e5;r.getAll("jobs").forEach(V=>{if(V.number&&V.number.startsWith("J-")){const P=parseInt(V.number.substring(2));!isNaN(P)&&P>F&&(F=P)}});const B="J-"+(F+1),oe={id:"job_b2b_"+Math.random().toString(36).substr(2,9),number:B,customerId:N.id,customerName:N.company,contactName:N.firstName+" "+N.lastName,siteAddress:M.siteAddress,title:E,type:M.type,status:"Pending",priority:M.priority||"Medium",scheduledDate:new Date().toISOString().split("T")[0],estimatedHours:M.estimatedHours||0,laborCost:M.laborCost||0,materialCost:M.materialCost||0,tasks:O(M.tasks||[]),notes:`Imported via magic-link B2B Dispatch API. Original Job Number: ${M.number} managed by ${$}.`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};r.create("jobs",oe),D++}),me(async()=>{const{showToast:M}=await Promise.resolve().then(()=>De);return{showToast:M}},void 0).then(({showToast:M})=>{D>0?M(`Successfully imported ${D} dispatch job(s) into your CRM database!`,"success"):M("These dispatch jobs have already been imported previously.","info")})}h()}function Ht(e){const a=r.getAll("contractors");e.innerHTML=`
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
  `;let t=[...a];const c=Xe({columns:[{key:"businessName",label:"Business Name",render:p=>`<span class="cell-link font-medium">${y(p.businessName)}</span>`},{key:"contactName",label:"Contact Name"},{key:"email",label:"Email",render:p=>y(p.email||"—")},{key:"phone",label:"Phone",render:p=>y(p.phone||"—")},{key:"compliance",label:"Compliance",render:p=>{const o=wt(p),f=o.reason?o.reason:o.label;return`<span class="badge ${o.badgeClass}" title="${y(f)}" style="cursor:help">${y(o.label)}</span>`}},{key:"active",label:"Status",render:p=>`<span class="badge ${p.active?"badge-success":"badge-neutral"}">${p.active?"Active":"Inactive"}</span>`},{key:"actions",label:"",width:"80px",render:p=>`<button class="btn btn-ghost btn-sm contractor-edit-btn" data-id="${p.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:t,onRowClick:p=>X.navigate(`/contractors/${p}`),emptyMessage:"No contractors found",emptyIcon:"engineering",selectable:!0,onSelectionChange:p=>{Ze({container:e,selectedIds:p,onClear:()=>c.clearSelection(),actions:[{label:"Activate",icon:"check_circle",onClick:o=>{o.forEach(f=>r.update("contractors",f,{active:!0})),c.clearSelection(),Ht(e),me(async()=>{const{showToast:f}=await Promise.resolve().then(()=>De);return{showToast:f}},void 0).then(({showToast:f})=>f(`Activated ${o.length} contractors`,"success"))}},{label:"Deactivate",icon:"block",onClick:o=>{o.forEach(f=>r.update("contractors",f,{active:!1})),c.clearSelection(),Ht(e),me(async()=>{const{showToast:f}=await Promise.resolve().then(()=>De);return{showToast:f}},void 0).then(({showToast:f})=>f(`Deactivated ${o.length} contractors`,"warning"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:o=>{me(async()=>{const{showModal:f}=await Promise.resolve().then(()=>Pe);return{showModal:f}},void 0).then(({showModal:f})=>{const g=document.createElement("div");g.innerHTML=`<p>Are you sure you want to delete ${o.length} contractors? This action cannot be undone.</p>`,f({title:"Confirm Bulk Delete",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{o.forEach(d=>r.delete("contractors",d)),c.clearSelection(),Ht(e),me(async()=>{const{showToast:d}=await Promise.resolve().then(()=>De);return{showToast:d}},void 0).then(({showToast:d})=>d(`Deleted ${o.length} contractors`,"success")),i()}}]})})}}]})}});e.querySelector("#contractors-table-container").appendChild(c),e.querySelector("#btn-new-contractor").addEventListener("click",()=>X.navigate("/contractors/new"));let l="all",m="";function n(){let p=[...a];l==="active"?p=p.filter(o=>o.active===!0):l==="inactive"?p=p.filter(o=>o.active===!1):l==="compliant"?p=p.filter(o=>wt(o).status==="compliant"):l==="non-compliant"&&(p=p.filter(o=>wt(o).status==="non-compliant"||wt(o).status==="warning")),m&&(p=p.filter(o=>o.businessName.toLowerCase().includes(m)||o.contactName.toLowerCase().includes(m)||(o.email||"").toLowerCase().includes(m)||(o.specialties||[]).some(f=>f.toLowerCase().includes(m)))),t=p,c.updateData(t)}e.querySelectorAll(".toolbar-filter").forEach(p=>{p.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(o=>o.classList.remove("active")),p.classList.add("active"),l=p.dataset.filter,n()})}),e.querySelector("#contractors-search").addEventListener("input",p=>{m=p.target.value.toLowerCase(),n()}),e.addEventListener("click",p=>{const o=p.target.closest(".contractor-edit-btn");o&&(p.stopPropagation(),X.navigate(`/contractors/${o.dataset.id}/edit`))})}function Ba(e,a){const t=a.id==="new";let s=t?{active:!0,hourlyRate:85,afterHoursRate:127.5,calloutFee:90,specialties:[],complianceDocs:[]}:r.getById("contractors",a.id);if(!s&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}e.innerHTML=`
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{X.navigate(t?"/contractors":`/contractors/${a.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const c=e.querySelector("#businessName").value.trim(),l=e.querySelector("#contactName").value.trim(),m=e.querySelector("#email").value.trim(),n=e.querySelector("#phone").value.trim(),p=e.querySelector("#licenseNumber").value.trim(),o=e.querySelector("#insuranceExpiry").value,f=e.querySelector("#active").checked,g=parseFloat(e.querySelector("#hourlyRate").value),i=parseFloat(e.querySelector("#afterHoursRate").value),d=parseFloat(e.querySelector("#calloutFee").value),x=e.querySelector("#specialties").value,u=x?x.split(",").map(k=>k.trim()).filter(Boolean):[],b=e.querySelector("#notes").value.trim();if(!c||!l){H("Business Name and Contact Name are required fields.","warning");return}if(isNaN(g)||isNaN(i)||isNaN(d)){H("Please enter valid numeric pay rates.","warning");return}const h={businessName:c,contactName:l,email:m,phone:n,licenseNumber:p,insuranceExpiry:o,active:f,hourlyRate:g,afterHoursRate:i,calloutFee:d,specialties:u,notes:b,complianceDocs:s.complianceDocs||[]};if(o){h.complianceDocs||(h.complianceDocs=[]);const k=h.complianceDocs.findIndex(S=>S.type.toLowerCase().includes("public liability"));k!==-1?(h.complianceDocs[k].expiryDate=o,h.complianceDocs[k].number=p?`PL-${p}`:h.complianceDocs[k].number):h.complianceDocs.push({id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:"Public Liability Insurance",number:p?`PL-${p}`:"PL-AUTO",expiryDate:o,verified:!0,notes:"Auto-synced from primary details"})}if(t){const k=r.create("contractors",h);H("Contractor profile created successfully","success"),X.navigate(`/contractors/${k.id}`)}else r.update("contractors",a.id,h),H("Contractor profile updated successfully","success"),X.navigate(`/contractors/${a.id}`)})}function no(e,a){const t=r.getById("contractors",a.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Contractor not found</h3></div>';return}if(!t.portalToken){const f="c_pt_"+Math.random().toString(36).substr(2,9)+Date.now().toString(36).substr(-4);r.update("contractors",t.id,{portalToken:f}),t.portalToken=f}dt(t.businessName),r.getAll("jobs").filter(f=>f.contractorId===a.id);const s=r.getAll("jobs"),c=[];function l(f,g,i=[]){f&&f.forEach((d,x)=>{const u=[...i,x];((d.assignedContractorIds||[]).includes(a.id)||d.assignedContractorId===a.id)&&c.push({jobId:g.id,jobNumber:g.number,jobTitle:g.title,jobStatus:g.status,taskId:d.id,taskName:d.name,taskStatus:d.status||"Not Started",taskProgress:d.progress||0,taskEstimatedHours:d.estimatedHours||0,taskStartDate:d.startDate,path:u,isList:d.subTasks&&d.subTasks.length>0}),d.subTasks&&d.subTasks.length>0&&l(d.subTasks,g,u)})}s.forEach(f=>{f.tasks&&l(f.tasks,f)});let m="details";function n(){const f=wt(t);e.innerHTML=`
      ${mt({title:y(t.businessName),icon:"engineering",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">person</span> ${y(t.contactName)}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">email</span> ${y(t.email||"—")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">phone</span> ${y(t.phone||"—")}</span>
          <span class="badge ${f.badgeClass}" title="${y(f.reason||f.label)}" style="cursor:help">
            Compliance: ${y(f.label)}
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
        <button class="tab ${m==="details"?"active":""}" data-tab="details">Overview & Details</button>
        <button class="tab ${m==="compliance"?"active":""}" data-tab="compliance">Compliance Registry (${(t.complianceDocs||[]).length})</button>
        <button class="tab ${m==="rates"?"active":""}" data-tab="rates">Financials & Rates</button>
        <button class="tab ${m==="tasks"?"active":""}" data-tab="tasks">Task Allocations (${c.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `,p(),e.querySelectorAll(".tab").forEach(g=>{g.addEventListener("click",()=>{m=g.dataset.tab,e.querySelectorAll(".tab").forEach(i=>i.classList.remove("active")),g.classList.add("active"),p()})}),e.querySelector("#btn-edit-contractor").addEventListener("click",()=>{X.navigate(`/contractors/${a.id}/edit`)}),e.querySelector("#btn-delete-contractor").addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`<p>Are you sure you want to delete <strong>${y(t.businessName)}</strong>? This action cannot be undone.</p>`,xe({title:"Delete Contractor",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{r.delete("contractors",a.id),H("Contractor deleted successfully","success"),i(),X.navigate("/contractors")}}]})})}function p(){const f=e.querySelector("#tab-content");if(f)if(m==="details"){const i=t.specialties||[];f.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-3">
              <div style="grid-column: span 2">
                <h4 style="margin-bottom:var(--space-base)">Business & Contact Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${o("Business Name",t.businessName)}
                  ${o("Contact Name",t.contactName)}
                  ${o("Email Address",t.email||"Not set")}
                  ${o("Phone Number",t.phone||"Not set")}
                  ${o("Trade License No.",t.licenseNumber||"Not set")}
                  ${o("System Status",t.active?"Active (Ready for dispatch)":"Inactive (Do not dispatch)")}
                </div>
              </div>
              <div style="grid-column: span 1">
                <h4 style="margin-bottom:var(--space-base)">Specialties & Trade Skills</h4>
                <div style="margin-bottom:var(--space-lg); display: flex; flex-wrap: wrap; gap: 6px;">
                  ${i.map(x=>`<span class="badge" style="background:var(--color-primary-light); color:var(--color-primary); font-weight:600;">${y(x)}</span>`).join("")}
                  ${i.length===0?'<span class="text-secondary">No trade specialties listed. Click Edit to add.</span>':""}
                </div>

                <h4 style="margin-bottom:var(--space-base)">Administrative Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 12px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.5; white-space: pre-wrap;">${y(t.notes||"No administrative notes recorded for this contractor.")}</div>
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
      `;const d=f.querySelector("#btn-copy-magic-link");d&&d.addEventListener("click",()=>{const x=f.querySelector("#magic-link-url");x&&navigator.clipboard.writeText(x.value).then(()=>{H("Magic link copied to clipboard!","success")}).catch(()=>{H("Failed to copy link","error")})})}else if(m==="compliance"){const i=t.complianceDocs||[];f.innerHTML=`
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
                ${i.map((d,x)=>{const u=ca(d);return`
                    <tr>
                      <td class="font-medium">
                        <div>${y(d.type)}</div>
                        ${d.fileData?`
                          <div style="margin-top:4px;">
                            <a href="${d.fileData}" download="${d.fileName}" target="_blank" class="text-primary" style="font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:4px; text-decoration:none;">
                              <span class="material-icons-outlined" style="font-size:14px">attachment</span> ${y(d.fileName)}
                            </a>
                          </div>
                        `:""}
                      </td>
                      <td style="font-family:monospace" class="text-secondary">${y(d.number||"—")}</td>
                      <td>${d.expiryDate?new Date(d.expiryDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td><span class="badge ${u.colorClass}">${y(u.label)}</span></td>
                      <td>
                        <button class="btn btn-ghost btn-sm btn-toggle-verify" data-id="${d.id}" style="padding: 2px 6px;">
                          ${d.verified?'<span class="material-icons-outlined text-success" style="font-size:18px">check_circle</span> <span class="text-success" style="font-size:12px;font-weight:600">Verified</span>':'<span class="material-icons-outlined text-tertiary" style="font-size:18px">radio_button_unchecked</span> <span class="text-tertiary" style="font-size:12px">Click to verify</span>'}
                        </button>
                      </td>
                      <td style="text-align:right">
                        <button class="btn btn-icon btn-sm btn-ghost btn-delete-doc text-danger" data-id="${d.id}">
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
      `,f.querySelectorAll(".btn-toggle-verify").forEach(d=>{d.addEventListener("click",()=>{const x=d.dataset.id,u=i.map(b=>b.id===x?{...b,verified:!b.verified}:b);r.update("contractors",t.id,{complianceDocs:u}),t.complianceDocs=u,H("Certificate verification status updated","success"),n()})}),f.querySelectorAll(".btn-delete-doc").forEach(d=>{d.addEventListener("click",()=>{const x=d.dataset.id,u=document.createElement("div");u.innerHTML="<p>Are you sure you want to delete this compliance certificate? This cannot be undone.</p>",xe({title:"Delete Certificate",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{const h=i.filter(k=>k.id!==x);r.update("contractors",t.id,{complianceDocs:h}),t.complianceDocs=h,H("Certificate deleted","success"),b(),n()}}]})})}),f.querySelector("#btn-add-doc").addEventListener("click",()=>{He({title:"Add Credential",content:`
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
        `,actions:[{label:"Cancel",className:"btn-secondary",onClick:x=>x()},{label:"Save Credential",className:"btn-primary",onClick:x=>{const u=document.querySelector(".drawer-overlay"),b=u.querySelector("#new-doc-type").value,h=u.querySelector("#new-doc-number").value.trim(),k=u.querySelector("#new-doc-expiry").value,S=u.querySelector("#new-doc-notes").value.trim();if(!h||!k){H("Please fill in all required fields","error");return}const L={id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:b,number:h,expiryDate:k,verified:!1,notes:S},T=[...i,L];r.update("contractors",t.id,{complianceDocs:T}),t.complianceDocs=T,H("Credential added to registry","success"),x(),n()}}]})})}else if(m==="rates"){let L=function(){const T=parseFloat(u.value)||0,I=b.value==="standard"?i:d,_=h.checked?x:0,A=T*I+_;S.textContent=`$${A.toFixed(2)}`;const q=b.value==="standard"?`$${i.toFixed(2)}`:`$${d.toFixed(2)}`,w=h.checked?` + $${x.toFixed(2)}`:"";k.textContent=`${T} hrs × ${q}${w}`};var g=L;const i=t.hourlyRate||0,d=t.afterHoursRate||0,x=t.calloutFee||0;f.innerHTML=`
        <div class="grid-3" style="align-items: start;">
          <div class="card" style="grid-column: span 1">
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
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${d.toFixed(2)}/hr</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:4px">
                <div>
                  <strong>Call-out / Mobilisation Fee</strong>
                  <p class="text-secondary" style="font-size:12px; margin:2px 0 0 0">Flat fee applied per job dispatch</p>
                </div>
                <div class="font-semibold" style="font-size:18px; color:var(--color-primary)">$${x.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div class="card" style="grid-column: span 2">
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
                    <option value="afterhours">After Hours ($${d.toFixed(2)})</option>
                  </select>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:8px;">
                  <input type="checkbox" id="calc-callout" checked />
                  <label for="calc-callout" class="form-label" style="margin:0; font-size:12px">Include Mobilisation Call-out Fee ($${x.toFixed(2)})</label>
                </div>

                <div style="background:var(--color-primary-light); color:var(--color-primary); padding: 15px; border-radius:6px; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:0.5px">Estimated Total Billing</strong>
                    <span style="font-size:13px; opacity:0.8" id="calc-formula">8 hrs × $${i.toFixed(2)} + $${x.toFixed(2)}</span>
                  </div>
                  <div class="font-bold" style="font-size:24px" id="calc-total">$${(8*i+x).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;const u=f.querySelector("#calc-hours"),b=f.querySelector("#calc-rate-type"),h=f.querySelector("#calc-callout"),k=f.querySelector("#calc-formula"),S=f.querySelector("#calc-total");u&&b&&h&&(u.addEventListener("input",L),u.addEventListener("change",L),b.addEventListener("change",L),h.addEventListener("change",L))}else m==="tasks"&&(f.innerHTML=`
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
                ${c.map(i=>{const d={Completed:"badge-success","In Progress":"badge-primary","Not Started":"badge-neutral"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/jobs/${i.jobId}'" title="Click to view Job Tasklist">
                      <td class="font-medium cell-link">${y(i.jobNumber)}</td>
                      <td>${y(i.jobTitle)}</td>
                      <td class="font-semibold">${y(i.taskName)}</td>
                      <td>
                        <span class="badge" style="${i.isList?"background:var(--color-primary-light); color:var(--color-primary)":"background:var(--bg-color); border:1px solid var(--border-color); color:var(--text-secondary)"}">
                          ${i.isList?"Tasklist":"Task"}
                        </span>
                      </td>
                      <td>${i.taskStartDate?new Date(i.taskStartDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${i.taskEstimatedHours||"—"} hrs</td>
                      <td>
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="badge ${d[i.taskStatus]||"badge-neutral"}" style="margin:0">${y(i.taskStatus)}</span>
                          <div style="width:60px; background:var(--border-color); height:12px; border-radius:6px; overflow:hidden; position:relative; display:inline-block" title="${i.taskProgress}% completed">
                            <div style="width:${i.taskProgress}%; background:var(--color-primary); height:100%"></div>
                          </div>
                          <span style="font-size:11px; font-weight:600; color:var(--text-secondary)">${i.taskProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  `}).join("")}
                ${c.length===0?'<tr><td colspan="7" style="text-align:center;padding:32px" class="text-secondary">No task-level allocations dispatched to this subcontractor.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `)}function o(f,g){return`
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${y(f)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${y(String(g))}</span>
      </div>
    `}n()}function Rt(e){const a=r.getAll("suppliers"),t=Le("Suppliers","create"),s=Le("Suppliers","edit"),c=Le("Suppliers","delete");e.innerHTML=`
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
  `;let l=[...a];const m=[{key:"name",label:"Supplier Name",render:g=>`<span class="cell-link font-medium">${y(g.name)}</span>`},{key:"contactName",label:"Contact Person",render:g=>y(g.contactName||"—")},{key:"category",label:"Category",render:g=>`<span class="badge badge-neutral">${y(g.category||"General")}</span>`},{key:"email",label:"Email",render:g=>y(g.email||"—")},{key:"phone",label:"Phone",render:g=>y(g.phone||"—")},{key:"paymentTerms",label:"Payment Terms",render:g=>y(g.paymentTerms||"—")},{key:"active",label:"Status",render:g=>`<span class="badge ${g.active?"badge-success":"badge-neutral"}">${g.active?"Active":"Inactive"}</span>`}];s&&m.push({key:"actions",label:"",width:"80px",render:g=>`<button class="btn btn-ghost btn-sm supplier-edit-btn" data-id="${g.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`});const n=Xe({columns:m,data:l,onRowClick:g=>X.navigate(`/suppliers/${g}`),emptyMessage:"No suppliers found",emptyIcon:"local_shipping",selectable:s||c,onSelectionChange:g=>{const i=[];s&&i.push({label:"Activate",icon:"check_circle",onClick:d=>{d.forEach(x=>r.update("suppliers",x,{active:!0})),n.clearSelection(),Rt(e),me(async()=>{const{showToast:x}=await Promise.resolve().then(()=>De);return{showToast:x}},void 0).then(({showToast:x})=>x(`Activated ${d.length} suppliers`,"success"))}},{label:"Deactivate",icon:"block",onClick:d=>{d.forEach(x=>r.update("suppliers",x,{active:!1})),n.clearSelection(),Rt(e),me(async()=>{const{showToast:x}=await Promise.resolve().then(()=>De);return{showToast:x}},void 0).then(({showToast:x})=>x(`Deactivated ${d.length} suppliers`,"warning"))}}),c&&i.push({label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:d=>{me(async()=>{const{showModal:x}=await Promise.resolve().then(()=>Pe);return{showModal:x}},void 0).then(({showModal:x})=>{const u=document.createElement("div");u.innerHTML=`<p>Are you sure you want to delete ${d.length} suppliers? This action cannot be undone.</p>`,x({title:"Confirm Bulk Delete",content:u,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:"Delete",className:"btn-danger",onClick:b=>{d.forEach(h=>r.delete("suppliers",h)),n.clearSelection(),Rt(e),me(async()=>{const{showToast:h}=await Promise.resolve().then(()=>De);return{showToast:h}},void 0).then(({showToast:h})=>h(`Deleted ${d.length} suppliers`,"success")),b()}}]})})}}),Ze({container:e,selectedIds:g,onClear:()=>n.clearSelection(),actions:i})}});e.querySelector("#suppliers-table-container").appendChild(n),t&&e.querySelector("#btn-new-supplier").addEventListener("click",()=>X.navigate("/suppliers/new"));let p="all",o="";function f(){let g=[...a];p==="active"?g=g.filter(i=>i.active===!0):p==="inactive"&&(g=g.filter(i=>i.active===!1)),o&&(g=g.filter(i=>i.name.toLowerCase().includes(o)||(i.contactName||"").toLowerCase().includes(o)||(i.category||"").toLowerCase().includes(o)||(i.email||"").toLowerCase().includes(o))),l=g,n.updateData(l)}e.querySelectorAll(".toolbar-filter").forEach(g=>{g.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(i=>i.classList.remove("active")),g.classList.add("active"),p=g.dataset.filter,f()})}),e.querySelector("#suppliers-search").addEventListener("input",g=>{o=g.target.value.toLowerCase(),f()}),s&&e.addEventListener("click",g=>{const i=g.target.closest(".supplier-edit-btn");i&&(g.stopPropagation(),X.navigate(`/suppliers/${i.dataset.id}/edit`))})}function Va(e,a){const t=a.id==="new";let s=t?{active:!0,category:"General",paymentTerms:"30 Days",attachments:[]}:r.getById("suppliers",a.id);if(!s&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>';return}const c=["Electrical","Plumbing","HVAC","Fire Safety","Security","General"],l=["COD","7 Days","14 Days","30 Days"];e.innerHTML=`
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
                ${c.map(m=>`<option value="${m}" ${s.category===m?"selected":""}>${m}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Terms</label>
              <select id="paymentTerms" class="form-input">
                ${l.map(m=>`<option value="${m}" ${s.paymentTerms===m?"selected":""}>${m}</option>`).join("")}
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
  `,e.querySelector("#btn-cancel").addEventListener("click",()=>{X.navigate(t?"/suppliers":`/suppliers/${a.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{const m=e.querySelector("#name").value.trim(),n=e.querySelector("#contactName").value.trim(),p=e.querySelector("#email").value.trim(),o=e.querySelector("#phone").value.trim(),f=e.querySelector("#address").value.trim(),g=e.querySelector("#category").value,i=e.querySelector("#paymentTerms").value,d=e.querySelector("#accountNumber").value.trim(),x=e.querySelector("#notes").value.trim(),u=e.querySelector("#active").checked;if(!m){H("Supplier Name is a required field.","warning");return}const b={...s,name:m,contactName:n,email:p,phone:o,address:f,category:g,paymentTerms:i,accountNumber:d,notes:x,active:u};if(t){const h=r.create("suppliers",b);H("Supplier profile created successfully","success"),X.navigate(`/suppliers/${h.id}`)}else r.update("suppliers",a.id,b),H("Supplier profile updated successfully","success"),X.navigate(`/suppliers/${a.id}`)})}function ro(e,a){const t=r.getById("suppliers",a.id);if(!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Supplier not found</h3></div>';return}dt(t.name);const s=Le("Suppliers","edit"),c=Le("Suppliers","delete"),l=r.getAll("stock").filter(g=>g.supplier===t.name),m=r.getAll("purchaseOrders").filter(g=>g.supplierName===t.name);let n="overview";function p(){e.innerHTML=`
      ${mt({title:y(t.name),icon:"local_shipping",iconBgColor:"var(--color-primary-light)",iconTextColor:"var(--color-primary)",metaHtml:`
          <span><span class="material-icons-outlined" style="font-size:14px">label</span> ${y(t.category||"General")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">payment</span> Terms: ${y(t.paymentTerms||"30 Days")}</span>
          <span><span class="material-icons-outlined" style="font-size:14px">credit_card</span> Account: ${y(t.accountNumber||"—")}</span>
          <span class="badge ${t.active?"badge-success":"badge-neutral"}">${t.active?"Active":"Inactive"}</span>
        `,actionsHtml:`
          ${s?`
            <button class="btn btn-secondary" id="btn-edit-supplier">
              <span class="material-icons-outlined">edit</span> Edit
            </button>
          `:""}
          ${c?`
            <button class="btn btn-danger" id="btn-delete-supplier">
              <span class="material-icons-outlined">delete</span> Delete
            </button>
          `:""}
        `})}

      <div class="tabs" id="supplier-tabs">
        <button class="tab ${n==="overview"?"active":""}" data-tab="overview">Overview</button>
        <button class="tab ${n==="catalogues"?"active":""}" data-tab="catalogues">Catalogues & Docs (${(t.attachments||[]).length})</button>
        <button class="tab ${n==="stock"?"active":""}" data-tab="stock">Stock Items (${l.length})</button>
        <button class="tab ${n==="pos"?"active":""}" data-tab="pos">Purchase Orders (${m.length})</button>
      </div>

      <div class="tab-content" id="tab-content" style="margin-top: var(--space-base);"></div>
    `,o(),e.querySelectorAll(".tab").forEach(g=>{g.addEventListener("click",()=>{n=g.dataset.tab,e.querySelectorAll(".tab").forEach(i=>i.classList.remove("active")),g.classList.add("active"),o()})}),s&&e.querySelector("#btn-edit-supplier").addEventListener("click",()=>{X.navigate(`/suppliers/${t.id}/edit`)}),c&&e.querySelector("#btn-delete-supplier").addEventListener("click",()=>{const g=document.createElement("div");g.innerHTML=`<p>Are you sure you want to delete supplier <strong>${y(t.name)}</strong>? This action cannot be undone.</p>`,xe({title:"Delete Supplier",content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:i=>i()},{label:"Delete",className:"btn-danger",onClick:i=>{r.delete("suppliers",t.id),H("Supplier deleted successfully","success"),i(),X.navigate("/suppliers")}}]})})}function o(){const g=e.querySelector("#tab-content");if(g)if(n==="overview")g.innerHTML=`
        <div class="card">
          <div class="card-body">
            <div class="grid-3">
              <div style="grid-column: span 2">
                <h4 style="margin-bottom:var(--space-base)">Supplier & Financial Details</h4>
                <div style="display:flex;flex-direction:column;gap:12px">
                  ${f("Supplier Name",t.name)}
                  ${f("Contact Name",t.contactName||"Not set")}
                  ${f("Email Address",t.email||"Not set")}
                  ${f("Phone Number",t.phone||"Not set")}
                  ${f("Physical Address",t.address||"Not set")}
                  ${f("Account Number",t.accountNumber||"Not set")}
                  ${f("Payment Terms",t.paymentTerms||"30 Days")}
                  ${f("System Status",t.active?"Active (Available for stock & POs)":"Inactive")}
                </div>
              </div>
              <div style="grid-column: span 1">
                <h4 style="margin-bottom:var(--space-base)">Internal Operations Notes</h4>
                <div style="background:var(--card-bg-secondary, #f8fafc); border: 1px solid var(--border-color); padding: 16px; border-radius: 6px; font-size:var(--font-size-sm); color:var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">${y(t.notes||"No notes recorded for this supplier.")}</div>
              </div>
            </div>
          </div>
        </div>
      `;else if(n==="catalogues"){const i=t.attachments||[];if(g.innerHTML=`
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
                ${i.map(d=>{const x=(d.size/1048576).toFixed(2),u=d.type==="application/pdf"||d.type&&d.type.startsWith("image/")||d.name.toLowerCase().endsWith(".pdf");return`
                    <tr>
                      <td class="font-medium">${y(d.name)}</td>
                      <td class="text-secondary" style="font-size:12px">${y(d.type||"Unknown")}</td>
                      <td>${x} MB</td>
                      <td>${d.uploadedAt?new Date(d.uploadedAt).toLocaleDateString("en-AU"):"—"}</td>
                      <td style="text-align:right">
                        <div style="display:inline-flex; gap:6px;">
                          ${u?`
                            <button class="btn btn-ghost btn-sm btn-preview-doc" data-id="${d.id}" title="Preview Document">
                              <span class="material-icons-outlined" style="font-size:18px">visibility</span>
                            </button>
                          `:""}
                          <a href="${d.url}" download="${y(d.name)}" class="btn btn-ghost btn-sm" title="Download File" style="display:inline-flex; align-items:center; justify-content:center; text-decoration:none; color:inherit;">
                            <span class="material-icons-outlined" style="font-size:18px">download</span>
                          </a>
                          ${s?`
                            <button class="btn btn-ghost btn-sm btn-delete-doc text-danger" data-id="${d.id}" title="Delete Document">
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
      `,s){const d=g.querySelector("#catalogue-file-input"),x=g.querySelector("#btn-upload-file");x&&d&&(x.addEventListener("click",()=>d.click()),d.addEventListener("change",u=>{const b=u.target.files[0];if(!b)return;if(b.size>8*1024*1024){H("File is too large. Maximum size is 8MB.","error");return}const h=new FileReader;h.onload=function(k){const S={id:"att_sup_"+Date.now().toString(36)+Math.random().toString(36).substr(2,4),name:b.name,type:b.type,size:b.size,uploadedAt:new Date().toISOString(),url:k.target.result},L=[...t.attachments||[],S];r.update("suppliers",t.id,{attachments:L}),t.attachments=L,H("Document uploaded successfully","success"),p()},h.readAsDataURL(b)})),g.querySelectorAll(".btn-delete-doc").forEach(u=>{u.addEventListener("click",()=>{const b=u.dataset.id,h=document.createElement("div");h.innerHTML="<p>Are you sure you want to delete this catalogue/document? This action cannot be undone.</p>",xe({title:"Confirm Delete Document",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Delete",className:"btn-danger",onClick:k=>{const S=(t.attachments||[]).filter(L=>L.id!==b);r.update("suppliers",t.id,{attachments:S}),t.attachments=S,H("Document deleted successfully","success"),k(),p()}}]})})})}g.querySelectorAll(".btn-preview-doc").forEach(d=>{d.addEventListener("click",()=>{const x=d.dataset.id,u=(t.attachments||[]).find(b=>b.id===x);u&&(localStorage.setItem("currentDocumentView",JSON.stringify({name:u.name,type:u.type,url:u.url})),window.open("#/document/view","_blank"))})})}else n==="stock"?g.innerHTML=`
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
                      <td class="font-medium cell-link">${y(i.name)}</td>
                      <td style="font-family:monospace">${y(i.sku||"—")}</td>
                      <td><span class="badge badge-neutral">${y(i.category||"General")}</span></td>
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
      `:n==="pos"&&(g.innerHTML=`
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
                ${m.map(i=>{const d=(i.items||[]).reduce((u,b)=>u+(parseFloat(b.quantity)||0)*(parseFloat(b.unitCost)||0),0),x={Draft:"badge-neutral","Pending Approval":"badge-warning","Approved / Sent":"badge-primary",Received:"badge-success",Cancelled:"badge-danger"};return`
                    <tr style="cursor:pointer" onclick="window.location.hash='#/purchase-orders/${i.id}'" title="Click to view Purchase Order">
                      <td class="font-medium cell-link">${y(i.number)}</td>
                      <td>${i.orderDate?new Date(i.orderDate).toLocaleDateString("en-AU"):"—"}</td>
                      <td>${y(i.creatorName||"—")}</td>
                      <td>${y(i.warehouseName||"Main Warehouse")}</td>
                      <td><span class="badge ${x[i.status]||"badge-neutral"}">${y(i.status)}</span></td>
                      <td class="font-medium" style="color:var(--color-primary)">$${d.toFixed(2)}</td>
                    </tr>
                  `}).join("")}
                ${m.length===0?'<tr><td colspan="6" style="text-align:center;padding:32px" class="text-secondary">No purchase orders raised for this supplier yet.</td></tr>':""}
              </tbody>
            </table>
          </div>
        </div>
      `)}function f(g,i){return`
      <div style="display:flex;gap:8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <span style="width:140px;font-size:var(--font-size-sm);color:var(--text-tertiary);font-weight:500">${y(g)}</span>
        <span style="font-size:var(--font-size-base); font-weight:500;">${y(String(i))}</span>
      </div>
    `}p()}function Ot(e){let a=r.getAll("assets");const t=r.getAll("fleet");a.length===0&&t.length>0&&(t.forEach(o=>{o.ownerType="Business",o.identifier=o.licensePlate,r.create("assets",o)}),a=r.getAll("assets"));let s="all",c="";function l(){let o=[...a];s==="My Business"?o=o.filter(f=>f.ownerType==="Business"):s==="Customer Owned"?o=o.filter(f=>f.ownerType==="Customer"):s==="In Maintenance"&&(o=o.filter(f=>f.status==="In Maintenance")),c&&(o=o.filter(f=>f.name.toLowerCase().includes(c)||(f.serial||f.identifier||f.licensePlate||"").toLowerCase().includes(c)||(f.type||"").toLowerCase().includes(c))),m=o,p.updateData(m)}e.innerHTML=`
    <div class="page-header">
      <h1>Assets Manager</h1>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="btn-new-asset"><span class="material-icons-outlined">add</span> Add Asset</button>
      </div>
    </div>
    
    <div class="page-toolbar">
      <div class="toolbar-filters">
        <button class="toolbar-filter active" data-filter="all">All (${a.length})</button>
        <button class="toolbar-filter" data-filter="My Business">My Business (${a.filter(o=>o.ownerType==="Business").length})</button>
        <button class="toolbar-filter" data-filter="Customer Owned">Customer Owned (${a.filter(o=>o.ownerType==="Customer").length})</button>
        <button class="toolbar-filter" data-filter="In Maintenance">In Maintenance (${a.filter(o=>o.status==="In Maintenance").length})</button>
      </div>
      <div class="toolbar-search">
        <span class="material-icons-outlined">search</span>
        <input type="text" placeholder="Search assets..." id="asset-search" />
      </div>
    </div>

    <div id="asset-table-container"></div>
  `;let m=[...a];const p=Xe({columns:[{key:"name",label:"Name / ID",render:o=>`<span class="cell-link font-medium">${y(o.name)}</span>`},{key:"owner",label:"Owner Type",render:o=>{if(o.ownerType==="Customer"&&o.customerId){const f=r.getById("customers",o.customerId);return f?`<span class="badge badge-neutral">${y(f.company)}</span>`:"Customer"}return'<span class="badge badge-primary">My Business</span>'}},{key:"type",label:"Category",render:o=>y(o.type||"—")},{key:"service",label:"Service Status",render:o=>{const g=(o.logs||[]).filter(x=>x.type==="Service").sort((x,u)=>new Date(u.date)-new Date(x.date))[0];if(!g||!o.serviceIntervalMonths)return'<span class="text-tertiary" style="font-size:12px">Not Scheduled</span>';const i=new Date(g.date);i.setMonth(i.getMonth()+parseInt(o.serviceIntervalMonths));const d=i<new Date;return`<span style="color:${d?"var(--color-danger)":"var(--text-secondary)"}; font-size:12px; font-weight:${d?"600":"400"}">
          ${d?"OVERDUE":i.toLocaleDateString()}
        </span>`}},{key:"status",label:"Status",render:o=>`<span class="badge ${o.status==="Active"?"badge-success":o.status==="In Maintenance"?"badge-warning":"badge-neutral"}">${y(o.status||"Active")}</span>`},{key:"assignedTo",label:"Assigned To",render:o=>{if(!o.assignedToId)return"—";const f=r.getById("technicians",o.assignedToId);return f?y(f.name):"—"}},{key:"actions",label:"",width:"80px",render:o=>`<button class="btn btn-ghost btn-sm asset-edit-btn" data-id="${o.id}"><span class="material-icons-outlined" style="font-size:16px;">edit</span></button>`}],data:m,onRowClick:o=>X.navigate(`/assets/${o}`),emptyMessage:"No assets found",emptyIcon:"category",selectable:!0,onSelectionChange:o=>{Ze({container:e,selectedIds:o,onClear:()=>p.clearSelection(),actions:[{label:"Change Status",icon:"sync_alt",onClick:f=>{const g=document.createElement("div");g.innerHTML=`
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
              `,me(async()=>{const{showModal:i}=await Promise.resolve().then(()=>Pe);return{showModal:i}},void 0).then(({showModal:i})=>{i({title:`Update ${f.length} Assets`,content:g,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Apply",className:"btn-primary",onClick:d=>{const x=g.querySelector("#bulk-status").value;f.forEach(u=>r.update("assets",u,{status:x})),p.clearSelection(),Ot(e),me(async()=>{const{showToast:u}=await Promise.resolve().then(()=>De);return{showToast:u}},void 0).then(({showToast:u})=>u(`Updated ${f.length} assets to ${x}`,"success")),d()}}]})})}},{label:"Print Labels",icon:"qr_code_2",onClick:f=>{me(async()=>{const{showToast:g}=await Promise.resolve().then(()=>De);return{showToast:g}},void 0).then(({showToast:g})=>g(`Generating tags for ${f.length} assets...`,"info"))}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:f=>{me(async()=>{const{showModal:g}=await Promise.resolve().then(()=>Pe);return{showModal:g}},void 0).then(({showModal:g})=>{const i=document.createElement("div");i.innerHTML=`<p>Are you sure you want to delete ${f.length} assets? This action cannot be undone.</p>`,g({title:"Confirm Bulk Delete",content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:d=>d()},{label:"Delete",className:"btn-danger",onClick:d=>{f.forEach(x=>r.delete("assets",x)),p.clearSelection(),Ot(e),me(async()=>{const{showToast:x}=await Promise.resolve().then(()=>De);return{showToast:x}},void 0).then(({showToast:x})=>x(`Deleted ${f.length} assets`,"success")),d()}}]})})}}]})}});e.querySelector("#asset-table-container").appendChild(p),e.querySelector("#btn-new-asset").addEventListener("click",()=>{Da({onSave:()=>Ot(e)})}),e.querySelectorAll(".toolbar-filter").forEach(o=>{o.addEventListener("click",()=>{e.querySelectorAll(".toolbar-filter").forEach(f=>f.classList.remove("active")),o.classList.add("active"),s=o.dataset.filter,l()})}),e.querySelector("#asset-search").addEventListener("input",o=>{c=o.target.value.toLowerCase(),l()}),e.addEventListener("click",o=>{const f=o.target.closest(".asset-edit-btn");f&&(o.stopPropagation(),X.navigate(`/assets/${f.dataset.id}/edit`))})}function Ua(e,a){const t=a.id==="new";let s=t?{status:"Active",ownerType:"Business",type:"Plant & Equipment",serviceIntervalMonths:6,currentMeter:0,recoveryRate:0}:r.getById("assets",a.id);if(!s&&!t){e.innerHTML='<div class="empty-state"><span class="material-icons-outlined">error</span><h3>Asset not found</h3></div>';return}const c=r.getAll("people").filter(d=>d.type==="Staff"),l=r.getAll("customers");let m=[];if(s.customerId){const d=r.getById("customers",s.customerId);d&&d.sites&&(m=d.sites)}e.innerHTML=`
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
                ${l.map(d=>`<option value="${d.id}" ${s.customerId===d.id?"selected":""}>${d.company||d.firstName+" "+d.lastName}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type / Category</label>
              <select id="type" class="form-select">
                ${["Vehicle","Plant & Equipment","Specialized Tool","Fixed Asset (HVAC/Solar/Fire)","Other"].map(d=>`<option value="${d}" ${s.type===d?"selected":""}>${d}</option>`).join("")}
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
                 ${c.map(d=>`<option value="${d.id}" ${s.assignedToId===d.id?"selected":""}>${d.firstName} ${d.lastName}</option>`).join("")}
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
                ${m.map(d=>`<option value="${d.name}" ${s.site===d.name?"selected":""}>${d.name}</option>`).join("")}
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
              ${["Active","In Maintenance","Commissioning","Decommissioned","Lost/Stolen"].map(d=>`<option value="${d}" ${s.status===d?"selected":""}>${d}</option>`).join("")}
            </select>
          </div>
        </form>
      </div>
    </div>
  `;const n=e.querySelector("#ownerType"),p=e.querySelector("#customer-select-group"),o=e.querySelector("#customerId"),f=e.querySelector("#site"),g=e.querySelector("#business-fields");n.addEventListener("change",d=>{const x=d.target.value==="Customer";p.style.display=x?"block":"none",g.style.display=x?"none":"flex",f.disabled=!x,x?i(o.value):f.innerHTML='<option value="">-- No specific site --</option>'}),o.addEventListener("change",d=>{i(d.target.value)});function i(d){if(!d){f.innerHTML='<option value="">-- No specific site --</option>';return}const x=r.getById("customers",d);if(!x||!x.sites||x.sites.length===0){f.innerHTML='<option value="">-- No specific site --</option>';return}f.innerHTML='<option value="">-- No specific site --</option>'+x.sites.map(u=>`<option value="${u.name}" ${s.site===u.name?"selected":""}>${u.name}</option>`).join("")}e.querySelector("#btn-cancel").addEventListener("click",()=>{X.navigate(t?"/assets":`/assets/${a.id}`)}),e.querySelector("#btn-save").addEventListener("click",()=>{var x;const d={name:e.querySelector("#name").value,description:e.querySelector("#description").value,serial:e.querySelector("#serial").value,identifier:e.querySelector("#serial").value,type:e.querySelector("#type").value,status:e.querySelector("#status").value,assignedToId:e.querySelector("#assignedToId").value,ownerType:e.querySelector("#ownerType").value,customerId:e.querySelector("#ownerType").value==="Customer"?e.querySelector("#customerId").value:null,site:e.querySelector("#site").value,installDate:e.querySelector("#installDate").value,recoveryRate:parseFloat(((x=e.querySelector("#recoveryRate"))==null?void 0:x.value)||0),serviceIntervalMonths:parseInt(e.querySelector("#serviceIntervalMonths").value||6),currentMeter:parseFloat(e.querySelector("#currentMeter").value||0),meterUnit:e.querySelector("#meterUnit").value};if(!d.name){alert("Asset Name is required.");return}t?(d.logs=[],r.create("assets",d)):r.update("assets",a.id,d),X.navigate("/assets")})}function lo(e,a){const t=r.getById("assets",a.id);if(!t){e.innerHTML='<div class="card"><p>Asset not found.</p></div>';return}let s="history";function c(){const o=r.getById("assets",a.id);r.getSettings();let f="Unassigned";if(o.assignedToId){const L=r.getById("technicians",o.assignedToId);L&&(f=L.name)}let g="My Business",i="Internal Asset";if(o.ownerType==="Customer"&&o.customerId){const L=r.getById("customers",o.customerId);L&&(g=L.company),i="Customer Asset"}const d=o.logs||[],x=d.reduce((L,T)=>L+(parseFloat(T.cost)||0),0),u=d.filter(L=>L.type==="Service").sort((L,T)=>new Date(T.date)-new Date(L.date))[0];let b="Not Scheduled",h=!1;if(u&&o.serviceIntervalMonths){const L=new Date(u.date);L.setMonth(L.getMonth()+parseInt(o.serviceIntervalMonths)),b=L.toLocaleDateString(),h=L<new Date}const k=r.getAll("maintenancePlans").filter(L=>L.assetId===o.id)||[],S=k.find(L=>L.status==="Active");if(S){if(S.triggerType==="Calendar")b=new Date(S.nextServiceDate).toLocaleDateString(),h=new Date(S.nextServiceDate)<new Date;else if(S.triggerType==="Meter"){const L=parseFloat(o.currentMeter||0),T=parseFloat(S.lastTriggeredMeter||0),I=parseFloat(S.meterInterval||0),_=T+I;b=`At ${_} ${o.meterUnit||"hrs"}`,h=L>=_}}e.innerHTML=`
      <div class="page-header">
        <div style="display:flex; align-items:center; gap:12px">
          <div class="asset-icon-box" style="width:48px; height:48px; background:var(--bg-color); border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border-color)">
            <span class="material-icons-outlined" style="color:var(--color-primary)">${o.type==="Vehicle"?"directions_car":"precision_manufacturing"}</span>
          </div>
          <div>
            <h1 style="margin: 0;">${y(o.name)}</h1>
            <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
              <span class="badge ${o.ownerType==="Business"?"badge-primary":"badge-neutral"}">${i}</span>
              <span class="text-tertiary" style="font-size:12px">• ${y(o.identifier||o.serial||"No ID")}</span>
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
              <div style="width:10px; height:10px; border-radius:50%; background:${o.status==="Active"?"var(--color-success)":"var(--color-warning)"}"></div>
              <span style="font-weight:600; font-size:16px">${o.status||"Active"}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">Next Service Due</div>
            <div style="font-weight:600; font-size:16px; color:${h?"var(--color-danger)":"inherit"}">
              ${b}
              ${h?`<span style="font-size:11px; margin-left:6px; background:var(--color-danger-bg); color:var(--color-danger); padding:2px 6px; border-radius:4px">${(S==null?void 0:S.triggerType)==="Meter"?"LIMIT MET":"OVERDUE"}</span>`:""}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="text-tertiary" style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">
              ${o.ownerType==="Business"?"Total Maintenance Spend":"Current Meter Reading"}
            </div>
            <div style="font-weight:600; font-size:16px">
              ${o.ownerType==="Business"?`$${x.toLocaleString()}`:`${o.currentMeter||0} ${o.meterUnit||"hrs"}`}
            </div>
          </div>
        </div>
      </div>

      <div class="grid-3" style="align-items: start;">
        <div style="grid-column: span 1; display:flex; flex-direction:column; gap:var(--space-lg)">
          <div class="card">
            <div class="card-header"><h4>Asset Information</h4></div>
            <div class="card-body">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Category</span>
                  <span class="font-medium">${y(o.type||"-")}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Owner</span>
                  <span class="font-medium">${y(g)}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Assigned To</span>
                  <span class="font-medium">${y(f)}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Location</span>
                  <span class="font-medium">${y(o.site||"Main Office")}</span>
                </div>
                <div style="display:flex; justify-content:space-between">
                  <span class="text-secondary">Interval</span>
                  <span class="font-medium">${o.serviceIntervalMonths||6} Months</span>
                </div>
                ${o.ownerType==="Business"?`
                  <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--border-color); margin-top:4px">
                    <span class="text-secondary">Recovery Rate</span>
                    <span class="font-medium" style="color:var(--color-primary)">$${(o.recoveryRate||0).toFixed(2)}/hr</span>
                  </div>
                `:""}
              </div>
            </div>
          </div>

          ${o.description?`
          <div class="card">
            <div class="card-header"><h4>Description</h4></div>
            <div class="card-body text-secondary" style="font-size:13px">
              ${y(o.description)}
            </div>
          </div>
          `:""}
        </div>

        <div class="card" style="grid-column: span 2">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px var(--space-lg); border-bottom: 1px solid var(--border-color)">
            <div class="tabs" style="border:none; margin:0; padding:0">
              <button class="tab ${s==="history"?"active":""}" id="tab-history" style="padding: 6px 12px; font-size:14px">Activity History</button>
              <button class="tab ${s==="maint"?"active":""}" id="tab-maint" style="padding: 6px 12px; font-size:14px">Maintenance Agreements</button>
            </div>
            ${s==="history"?`
              <button class="btn btn-sm btn-primary" id="btn-add-log">
                <span class="material-icons-outlined" style="font-size:16px">add</span> New Log
              </button>
            `:`
              <button class="btn btn-sm btn-primary" id="btn-configure-plan">
                <span class="material-icons-outlined" style="font-size:16px">settings</span> Configure Plan
              </button>
            `}
          </div>

          <div class="card-body" style="padding:0" id="right-column-content">
            ${l(o,d,k)}
          </div>
        </div>
      </div>
    `,m()}function l(o,f,g){if(s==="history")return`
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:100px">Date</th>
              <th style="width:120px">Meter (${o.meterUnit||"hrs"})</th>
              <th style="width:120px">Type</th>
              <th>Notes</th>
              <th style="text-align:right">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${f.length===0?'<tr><td colspan="5" class="text-center text-tertiary" style="padding:40px">No logs recorded for this asset.</td></tr>':f.sort((i,d)=>new Date(d.date)-new Date(i.date)).map(i=>`
                <tr>
                  <td class="font-medium">${new Date(i.date).toLocaleDateString()}</td>
                  <td class="text-secondary">${i.meter||"-"}</td>
                  <td>
                    <span class="badge ${i.type==="Service"?"badge-success":i.type==="Repair"?"badge-danger":"badge-neutral"}">
                      ${y(i.type)}
                    </span>
                  </td>
                  <td><span class="text-secondary" style="font-size:13px">${y(i.notes||"—")}</span></td>
                  <td style="text-align:right; font-weight:600">${i.cost>0?`$${parseFloat(i.cost).toFixed(2)}`:"—"}</td>
                </tr>
              `).join("")}
          </tbody>
        </table>
      `;if(s==="maint")return g.length===0?`
          <div style="padding:40px; text-align:center" class="text-secondary">
            <span class="material-icons-outlined" style="font-size:48px; color:var(--text-tertiary); margin-bottom:12px">engineering</span>
            <h4 style="margin:0 0 6px 0; color:var(--text-primary)">No Active Maintenance Plan</h4>
            <p style="font-size:13px; margin:0 0 16px 0; max-width:320px; margin-inline:auto">Link this asset to a quote blueprint to auto-generate preventive service schedules and material checks.</p>
            <button class="btn btn-primary btn-sm" id="btn-configure-plan-empty"><span class="material-icons-outlined" style="font-size:16px">add</span> Set Up Plan</button>
          </div>
        `:g.map(i=>{const d=r.getById("quotes",i.quoteId),x=d?d.number:"Unknown";let u="",b="";if(i.triggerType==="Calendar"){const S=new Date(i.nextServiceDate)<new Date;u=`Next Service Due: <strong style="color:${S?"var(--color-danger)":"inherit"}">${i.nextServiceDate}</strong>`,b=S?'<span class="badge badge-danger">OVERDUE</span>':""}else{const h=parseFloat(o.currentMeter||0),k=parseFloat(i.lastTriggeredMeter||0),S=parseFloat(i.meterInterval||0),L=k+S,T=h>=L;u=`Trigger Milestone: <strong>${L} ${o.meterUnit||"hrs"}</strong> (Current: ${h} ${o.meterUnit||"hrs"})`,b=T?'<span class="badge badge-danger">LIMIT EXCEEDED</span>':""}return`
          <div style="padding:20px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
                <h4 style="margin:0; font-size:15px; color:var(--text-primary)">${y(i.name)}</h4>
                <span class="badge ${i.status==="Active"?"badge-success":"badge-neutral"}">${i.status}</span>
                ${b}
              </div>
              <div style="font-size:13px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px">
                <span>Trigger Rule: <strong>${i.triggerType}</strong> ${i.triggerType==="Calendar"?`(${i.frequency})`:`(Every ${i.meterInterval} ${o.meterUnit||"hrs"})`}</span>
                <span>${u}</span>
                <span>Blueprint Template: <a href="#/quotes/${i.quoteId}" class="cell-link font-medium">Quote ${y(x)}</a></span>
              </div>
            </div>
            <div style="display:flex; gap:8px">
              <button class="btn btn-sm ${i.status==="Active"?"btn-secondary":"btn-primary"} btn-toggle-plan" data-id="${i.id}">
                <span class="material-icons-outlined" style="font-size:16px">${i.status==="Active"?"pause":"play_arrow"}</span>
                ${i.status==="Active"?"Pause":"Resume"}
              </button>
              <button class="btn btn-sm btn-secondary btn-edit-plan" data-id="${i.id}">Edit</button>
              <button class="btn btn-sm btn-ghost text-danger btn-delete-plan" data-id="${i.id}"><span class="material-icons-outlined" style="font-size:18px">delete</span></button>
            </div>
          </div>
        `}).join("")}function m(o){var f,g,i;e.querySelector("#btn-edit").addEventListener("click",()=>{X.navigate(`/assets/${a.id}/edit`)}),e.querySelector("#tab-history").addEventListener("click",()=>{s="history",c()}),e.querySelector("#tab-maint").addEventListener("click",()=>{s="maint",c()}),(f=e.querySelector("#btn-add-log"))==null||f.addEventListener("click",()=>{n()}),(g=e.querySelector("#btn-configure-plan"))==null||g.addEventListener("click",()=>{p()}),(i=e.querySelector("#btn-configure-plan-empty"))==null||i.addEventListener("click",()=>{p()}),e.querySelectorAll(".btn-toggle-plan").forEach(d=>{d.addEventListener("click",x=>{const u=x.target.closest("button").dataset.id,h=r.getAll("maintenancePlans").find(k=>k.id===u);if(h){const k=h.status==="Active"?"Paused":"Active";r.update("maintenancePlans",u,{status:k}),H(`Plan ${k==="Active"?"resumed":"paused"} successfully`,"success"),c()}})}),e.querySelectorAll(".btn-edit-plan").forEach(d=>{d.addEventListener("click",x=>{const u=x.target.closest("button").dataset.id,b=r.getById("maintenancePlans",u);b&&p(b)})}),e.querySelectorAll(".btn-delete-plan").forEach(d=>{d.addEventListener("click",x=>{const u=x.target.closest("button").dataset.id,b=r.getById("maintenancePlans",u);b&&me(async()=>{const{showModal:h}=await Promise.resolve().then(()=>Pe);return{showModal:h}},void 0).then(({showModal:h})=>{const k=document.createElement("div");k.innerHTML=`<p>Are you sure you want to delete the maintenance plan "${y(b.name)}"? This action cannot be undone.</p>`,h({title:"Delete Maintenance Plan",content:k,actions:[{label:"Cancel",className:"btn-secondary",onClick:S=>S()},{label:"Delete",className:"btn-danger",onClick:S=>{r.delete("maintenancePlans",u),H("Maintenance plan deleted","success"),S(),c()}}]})})})})}function n(){const o=document.createElement("div");o.innerHTML=`
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
    `,me(async()=>{const{showModal:f}=await Promise.resolve().then(()=>Pe);return{showModal:f}},void 0).then(({showModal:f})=>{f({title:"Add Activity Log",content:o,actions:[{label:"Cancel",className:"btn-secondary",onClick:g=>g()},{label:"Save Log",className:"btn-primary",onClick:g=>{const i=o.querySelector("#log-date").value,d=o.querySelector("#log-type").value,x=parseFloat(o.querySelector("#log-meter").value),u=parseFloat(o.querySelector("#log-cost").value),b=o.querySelector("#log-notes").value;if(!i)return;const h={date:i,type:d,meter:x,cost:u,notes:b},k=[...t.logs||[],h];r.update("assets",t.id,{logs:k,currentMeter:x,status:d==="Repair"?"In Maintenance":t.status}),me(async()=>{const{checkMaintenancePlans:S}=await Promise.resolve().then(()=>ma);return{checkMaintenancePlans:S}},void 0).then(({checkMaintenancePlans:S})=>{S(),g(),c()})}}]})})}function p(o=null){const f=r.getAll("quotes"),g=o?"Edit Maintenance Plan":"Configure Maintenance Plan",i=document.createElement("div");i.innerHTML=`
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="form-group">
          <label class="form-label">Plan Name *</label>
          <input type="text" class="form-input" id="plan-name" placeholder="e.g. Semi-Annual HVAC PM" value="${y((o==null?void 0:o.name)||"")}" required />
        </div>

        <div class="form-group">
          <label class="form-label">Trigger Type *</label>
          <select class="form-select" id="plan-trigger-type">
            <option value="Calendar" ${(o==null?void 0:o.triggerType)==="Calendar"?"selected":""}>Calendar-Based</option>
            <option value="Meter" ${(o==null?void 0:o.triggerType)==="Meter"?"selected":""}>Usage/Meter-Based</option>
          </select>
        </div>

        <!-- Calendar Triggers -->
        <div id="plan-calendar-fields" style="display: ${!o||o.triggerType==="Calendar"?"block":"none"};">
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Recurrence Frequency</label>
            <select class="form-select" id="plan-frequency">
              <option value="Weekly" ${(o==null?void 0:o.frequency)==="Weekly"?"selected":""}>Weekly</option>
              <option value="Monthly" ${(o==null?void 0:o.frequency)==="Monthly"?"selected":""}>Monthly</option>
              <option value="Quarterly" ${!o||(o==null?void 0:o.frequency)==="Quarterly"?"selected":""}>Quarterly</option>
              <option value="Semi-Annually" ${(o==null?void 0:o.frequency)==="Semi-Annually"?"selected":""}>Semi-Annually</option>
              <option value="Annually" ${(o==null?void 0:o.frequency)==="Annually"?"selected":""}>Annually</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Next Service Date *</label>
            <input type="date" class="form-input" id="plan-next-date" value="${(o==null?void 0:o.nextServiceDate)||new Date().toISOString().split("T")[0]}" />
          </div>
        </div>

        <!-- Meter Triggers -->
        <div id="plan-meter-fields" style="display: ${(o==null?void 0:o.triggerType)==="Meter"?"block":"none"};">
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Trigger Interval (${t.meterUnit||"hrs"}) *</label>
            <input type="number" class="form-input" id="plan-meter-interval" value="${(o==null?void 0:o.meterInterval)||500}" placeholder="e.g. 500" />
          </div>
          <div class="form-group">
            <label class="form-label">Last Triggered Meter Milestone (${t.meterUnit||"hrs"})</label>
            <input type="number" class="form-input" id="plan-last-meter" value="${(o==null?void 0:o.lastTriggeredMeter)||t.currentMeter||0}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Blueprint Quote (Item Packs & Labor) *</label>
          <select class="form-select" id="plan-quote-id">
            <option value="">Select quote blueprint...</option>
            ${f.map(b=>`<option value="${b.id}" ${(o==null?void 0:o.quoteId)===b.id?"selected":""}>${y(b.number)} - ${y(b.title)}</option>`).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Plan Status</label>
          <select class="form-select" id="plan-status">
            <option value="Active" ${!o||(o==null?void 0:o.status)==="Active"?"selected":""}>Active</option>
            <option value="Paused" ${(o==null?void 0:o.status)==="Paused"?"selected":""}>Paused</option>
          </select>
        </div>
      </div>
    `;const d=i.querySelector("#plan-trigger-type"),x=i.querySelector("#plan-calendar-fields"),u=i.querySelector("#plan-meter-fields");d.addEventListener("change",b=>{const h=b.target.value==="Calendar";x.style.display=h?"block":"none",u.style.display=h?"none":"block"}),He({title:g,width:450,content:i,actions:[{label:"Cancel",className:"btn-secondary",onClick:b=>b()},{label:o?"Save Plan":"Create Plan",className:"btn-primary",onClick:b=>{const h=i.querySelector("#plan-name").value.trim(),k=d.value,S=i.querySelector("#plan-frequency").value,L=i.querySelector("#plan-next-date").value,T=parseFloat(i.querySelector("#plan-meter-interval").value),I=parseFloat(i.querySelector("#plan-last-meter").value),_=i.querySelector("#plan-quote-id").value,A=i.querySelector("#plan-status").value;if(!h)return H("Plan Name is required","error");if(!_)return H("Please select a blueprint quote","error");const q={name:h,assetId:t.id,quoteId:_,triggerType:k,status:A,frequency:k==="Calendar"?S:null,nextServiceDate:k==="Calendar"?L:null,meterInterval:k==="Meter"?T:null,lastTriggeredMeter:k==="Meter"?I:0,lastNotificationDate:o?o.lastNotificationDate:null};o?(r.update("maintenancePlans",o.id,q),H("Maintenance plan updated successfully","success")):(r.create("maintenancePlans",q),H("Maintenance plan configured successfully","success")),me(async()=>{const{checkMaintenancePlans:w}=await Promise.resolve().then(()=>ma);return{checkMaintenancePlans:w}},void 0).then(({checkMaintenancePlans:w})=>{w(),b(),c()})}}]})}c()}function co(e){let a="All Documents";const t=JSON.parse(localStorage.getItem("currentUser")||'{"role":"admin"}'),s=["All Documents","Company Docs","Health & Safety","Templates","Job Attachments","Customer Attachments","Digital Forms","Invoices","Quotes","Purchase Orders"];function c(){if(t.role==="admin"||t.role==="manager")return s;const m=["All Documents","Health & Safety","Job Attachments","Customer Attachments","Digital Forms","Purchase Orders"],n=t.userTypeId?r.getById("userTypes",t.userTypeId):null;if(n&&n.permissions){const p=n.permissions.find(f=>f.module==="Quotes"),o=n.permissions.find(f=>f.module==="Invoices");p&&p.view&&m.push("Quotes"),o&&o.view&&m.push("Invoices")}return s.filter(p=>m.includes(p))}function l(){const m=c();m.includes(a)||(a="All Documents");const n=[];r.getAll("documents").forEach(b=>{n.push({id:b.id,name:b.name,url:b.url,type:b.type,size:b.size,uploadedAt:b.uploadedAt,folder:b.folder||"Company Docs",entityType:"Global",entityId:"global",entityName:"Company"})}),r.getAll("jobs").forEach(b=>{b.attachments&&Array.isArray(b.attachments)&&b.attachments.forEach(h=>{n.push({id:h.id||Math.random().toString(36).substr(2,9),name:h.name,url:h.url||h.data||"#",type:h.type,size:h.size,uploadedAt:h.uploadedAt||h.date||b.createdAt||new Date().toISOString(),folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})}),b.activityLog&&Array.isArray(b.activityLog)&&b.activityLog.forEach(h=>{h.type==="attachment"&&h.file&&n.push({id:h.id,name:h.file.name,url:h.file.url||h.file.data||"#",type:h.file.type,size:h.file.size,uploadedAt:h.date,folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`}),h.type==="combined"&&Array.isArray(h.files)&&h.files.forEach((k,S)=>{n.push({id:`${h.id}_${S}`,name:k.name,url:k.url||k.data||"#",type:k.type,size:k.size,uploadedAt:h.date,folder:"Job Attachments",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})})}),b.forms&&Array.isArray(b.forms)&&b.forms.forEach((h,k)=>{n.push({id:`form_${b.id}_${k}`,name:`${h.type} - ${new Date(h.date).toLocaleDateString()}`,url:`#/jobs/${b.id}`,type:"Digital Form",size:null,uploadedAt:h.date,folder:"Digital Forms",entityType:"Job",entityId:b.id,entityName:`${b.number} - ${b.title}`})})}),r.getAll("customers").forEach(b=>{b.attachments&&Array.isArray(b.attachments)&&b.attachments.forEach(h=>{n.push({id:h.id||Math.random().toString(36).substr(2,9),name:h.name,url:h.url||h.data||"#",type:h.type,size:h.size,uploadedAt:h.uploadedAt||b.createdAt||new Date().toISOString(),folder:"Customer Attachments",entityType:"Customer",entityId:b.id,entityName:b.company})})}),r.getAll("invoices").forEach(b=>{n.push({id:b.id,name:`Invoice ${b.number}.pdf`,url:`#/invoices/${b.id}`,type:"Invoice PDF",size:null,uploadedAt:b.issueDate,folder:"Invoices",entityType:"Invoice",entityId:b.id,entityName:`Inv ${b.number} - ${b.customerName}`})}),r.getAll("quotes").forEach(b=>{n.push({id:b.id,name:`Quote ${b.number}.pdf`,url:`#/quotes/${b.id}`,type:"Quote PDF",size:null,uploadedAt:b.createdAt,folder:"Quotes",entityType:"Quote",entityId:b.id,entityName:`Quote ${b.number} - ${b.customerName}`})}),r.getAll("purchaseOrders").forEach(b=>{n.push({id:b.id,name:`PO ${b.number}.pdf`,url:`#/purchase-orders/${b.id}`,type:"PO PDF",size:null,uploadedAt:b.issueDate,folder:"Purchase Orders",entityType:"PO",entityId:b.id,entityName:`PO ${b.number} - ${b.supplierName}`})}),r.getAll("taskTemplates").forEach(b=>{n.push({id:`task_tmpl_${b.id}`,name:`${b.name} (Tasklist Template)`,url:"#/settings",type:"Tasklist Template",size:null,uploadedAt:b.createdAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:b.id,entityName:"Settings / Tasklist Templates"})}),r.getAll("formTemplates").forEach(b=>{n.push({id:`form_tmpl_${b.id}`,name:`${b.name} (Compliance Form Template)`,url:"#/settings",type:"Form Template",size:null,uploadedAt:b.createdAt||b.updatedAt||new Date().toISOString(),folder:"Templates",entityType:"Template",entityId:b.id,entityName:"Settings / Compliance Forms"})});const p=n.filter(b=>m.includes(b.folder));p.sort((b,h)=>new Date(h.uploadedAt)-new Date(b.uploadedAt));let o=p;a!=="All Documents"&&(o=p.filter(b=>b.folder===a));const f=m;e.innerHTML=`
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
              ${f.map(b=>{let h="folder";b==="All Documents"?h="dashboard":b==="Company Docs"?h="domain":b==="Health & Safety"?h="health_and_safety":b==="Templates"?h="file_copy":b==="Job Attachments"?h="build":b==="Customer Attachments"?h="people":b==="Digital Forms"?h="assignment":b==="Invoices"?h="receipt_long":b==="Quotes"?h="request_quote":b==="Purchase Orders"&&(h="shopping_cart");const k=a===b,S=b==="All Documents"?p.length:p.filter(L=>L.folder===b).length;return`
                <li>
                  <button class="btn btn-ghost ${k?"active":""}" data-folder="${b}" style="width:100%; justify-content:space-between; padding:8px 12px; background:${k?"var(--color-primary-bg)":"transparent"}; color:${k?"var(--primary-color)":"var(--text-primary)"}; font-weight:${k?"600":"400"}">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="material-icons-outlined" style="font-size:18px">${h}</span> ${b}
                    </div>
                    <span class="badge badge-neutral" style="font-size:10px">${S}</span>
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
    `,e.querySelectorAll("#folder-list button").forEach(b=>{b.addEventListener("click",()=>{a=b.dataset.folder,l()})});let g=[...o];const d=Xe({columns:[{key:"name",label:"File Name",render:b=>{let h="insert_drive_file";return b.type==="Invoice PDF"||b.type==="Quote PDF"||b.type==="PO PDF"?h="picture_as_pdf":b.type==="Digital Form"?h="assignment":b.type&&b.type.includes("image")&&(h="image"),`<div style="display:flex;align-items:center;gap:8px;"><span class="material-icons-outlined" style="color:var(--text-secondary)">${h}</span> <span class="font-medium truncate" style="max-width:300px" title="${y(b.name)}">${y(b.name)}</span></div>`}},{key:"folder",label:"Category",render:b=>y(b.folder||"—")},{key:"size",label:"Size",render:b=>b.size?(b.size/1024).toFixed(1)+" KB":"—"},{key:"entityName",label:"Linked To",render:b=>{if(b.entityType==="Global")return'<span class="text-secondary" style="font-size:12px">Company Shared</span>';let h="#";return b.entityType==="Job"?h=`#/jobs/${b.entityId}`:b.entityType==="Customer"?h=`#/people/${b.entityId}`:b.entityType==="Invoice"?h=`#/invoices/${b.entityId}`:b.entityType==="Quote"?h=`#/quotes/${b.entityId}`:b.entityType==="PO"&&(h=`#/purchase-orders/${b.entityId}`),`<span class="badge badge-neutral">${b.entityType}</span> <a href="${h}">${y(b.entityName)}</a>`}},{key:"uploadedAt",label:"Uploaded",render:b=>b.uploadedAt?new Date(b.uploadedAt).toLocaleDateString():"—"},{key:"actions",label:"",width:"80px",render:b=>b.url&&b.url.startsWith("#/")?`<a href="${y(b.url)}" target="_blank" class="btn btn-sm btn-outline" style="text-decoration:none">View</a>`:`<a href="#/document/view" target="_blank" class="btn btn-sm btn-outline btn-view-doc" data-doc-id="${y(b.id)}" style="text-decoration:none">View</a>`}],data:g,emptyMessage:"No documents found in this category.",emptyIcon:"folder_open",selectable:!0,onSelectionChange:b=>{Ze({container:e.querySelector(".main-wrapper")||e,selectedIds:b,onClear:()=>d.clearSelection(),actions:[{label:"Change Category",icon:"folder_open",onClick:h=>{const k=f.filter(L=>L!=="All Documents"),S=document.createElement("div");S.innerHTML=`
                  <div class="form-group">
                    <label class="form-label">New Category</label>
                    <select class="form-select" id="bulk-folder">
                      ${k.map(L=>`<option value="${L}">${L}</option>`).join("")}
                    </select>
                  </div>
                `,xe({title:`Move ${h.length} Documents`,content:S,actions:[{label:"Cancel",className:"btn-secondary",onClick:L=>L()},{label:"Move",className:"btn-primary",onClick:L=>{const T=S.querySelector("#bulk-folder").value;h.forEach(I=>{r.getById("documents",I)&&r.update("documents",I,{folder:T})}),d.clearSelection(),l(),H(`Moved ${h.length} documents to ${T}`,"success"),L()}}]})}},{label:"Delete Selected",icon:"delete",className:"btn-danger",onClick:h=>{xe({title:"Confirm Bulk Delete",content:`<p>Are you sure you want to delete ${h.length} documents? Only global documents will be removed from the system. Linked attachments must be deleted from their respective jobs/customers.</p>`,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Delete",className:"btn-danger",onClick:k=>{h.forEach(S=>r.delete("documents",S)),d.clearSelection(),l(),H(`Deleted ${h.length} documents`,"success"),k()}}]})}}]})}});e.querySelector("#docs-table-container").appendChild(d);const x=e.querySelector("#docs-search");function u(){const b=x.value.toLowerCase();g=o.filter(h=>h.name.toLowerCase().includes(b)||h.entityName&&h.entityName.toLowerCase().includes(b)||h.folder&&h.folder.toLowerCase().includes(b)),d.updateData(g)}x.addEventListener("input",u),e.querySelector("#docs-table-container").addEventListener("click",b=>{const h=b.target.closest(".btn-view-doc");if(h){const k=h.dataset.docId,S=o.find(L=>L.id===k);S&&localStorage.setItem("currentDocumentView",JSON.stringify({name:S.name,url:S.url,type:S.type}))}}),e.querySelector("#btn-upload-doc").addEventListener("click",()=>{const b=f.filter(k=>k!=="All Documents"),h=document.createElement("div");h.innerHTML=`
        <div class="form-group">
          <label class="form-label">Category / Folder</label>
          <select class="form-select" id="upload-folder">
            ${b.map(k=>`<option value="${k}">${k}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Select File</label>
          <input type="file" class="form-input" id="upload-file-input" accept="image/*,.pdf,.doc,.docx" />
        </div>
      `,xe({title:"Upload Global Document",content:h,actions:[{label:"Cancel",className:"btn-secondary",onClick:k=>k()},{label:"Upload",className:"btn-primary",onClick:k=>{const S=document.getElementById("upload-file-input"),L=document.getElementById("upload-folder").value;if(!S.files.length){H("Please select a file","error");return}const T=S.files[0],I=new FileReader;I.onload=_=>{r.create("documents",{name:T.name,type:T.type||"unknown",size:T.size,url:_.target.result,folder:L,uploadedAt:new Date().toISOString()}),H("Document uploaded successfully","success"),l(),k()},I.readAsDataURL(T)}}]})})}l()}function po(e){let a=null;try{const l=localStorage.getItem("currentDocumentView");l&&(a=JSON.parse(l))}catch(l){console.error("Failed to parse document data:",l)}if(!a||!a.url){e.innerHTML=`
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
              <h2 style="margin: 0; font-size: 16px;">${y(a.name||"View Document")}</h2>
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
          <img src="${y(a.url)}" style="max-width: 100%; max-height: 100%; box-shadow: var(--shadow-md); border-radius: 4px;" alt="${y(a.name)}" />
        `:s?`
          <iframe src="${y(a.url)}" style="width: 100%; height: 100%; border: none; box-shadow: var(--shadow-md); border-radius: 4px; background: white;"></iframe>
        `:`
          <div class="card" style="padding: 40px; text-align: center; max-width: 400px;">
            <span class="material-icons-outlined" style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 16px;">description</span>
            <h4>Cannot preview this file type</h4>
            <p class="text-secondary" style="margin-bottom: 24px;">This file type (${y(a.type||"Unknown")}) cannot be previewed in the browser.</p>
            <a href="${y(a.url)}" download="${y(a.name)}" class="btn btn-primary">Download File</a>
          </div>
        `}
      </div>
    </div>
  `,setTimeout(()=>{const l=document.querySelector(".sidebar"),m=document.querySelector(".topbar"),n=document.getElementById("breadcrumb"),p=document.getElementById("main-content");l&&(l.style.display="none"),m&&(m.style.display="none"),n&&(n.style.display="none"),p&&(p.style.padding="0",p.style.height="100vh",p.style.overflow="hidden")},0);const c=()=>{const l=document.querySelector(".sidebar"),m=document.querySelector(".topbar"),n=document.getElementById("breadcrumb"),p=document.getElementById("main-content");l&&(l.style.display=""),m&&(m.style.display=""),n&&(n.style.display=""),p&&(p.style.padding="",p.style.height="",p.style.overflow=""),window.removeEventListener("hashchange",c)};window.addEventListener("hashchange",c)}ls();Sa();window.__fieldForge={router:X,store:r};const Ja=document.getElementById("app"),uo=ka(),Dt=document.createElement("div");Dt.className="main-wrapper";const mo=Ia(),da=document.createElement("div");da.className="breadcrumb";da.id="breadcrumb";const kt=document.createElement("main");kt.className="main-content";kt.id="main-content";Dt.appendChild(mo);Dt.appendChild(da);Dt.appendChild(kt);Ja.appendChild(uo);Ja.appendChild(Dt);function ke(e){return a=>{kt.innerHTML="",kt.scrollTop=0,e(kt,a)}}X.register("/login",ke(so));X.register("/portal",ke(na));X.register("/contractor-portal/:token",ke(io));X.register("/",ke(hs));X.register("/people",ke(aa));X.register("/people/new",ke((e,a)=>_a(e,{id:"new"})));X.register("/people/:id",ke(_s));X.register("/people/:id/edit",ke((e,a)=>_a(e,a)));X.register("/contractors",ke(Ht));X.register("/contractors/new",ke((e,a)=>Ba(e,{id:"new"})));X.register("/contractors/:id",ke(no));X.register("/contractors/:id/edit",ke((e,a)=>Ba(e,a)));X.register("/suppliers",ke(Rt));X.register("/suppliers/new",ke((e,a)=>Va(e,{id:"new"})));X.register("/suppliers/:id",ke(ro));X.register("/suppliers/:id/edit",ke((e,a)=>Va(e,a)));X.register("/leads",ke(sa));X.register("/leads/new",ke((e,a)=>Na(e,{id:"new"})));X.register("/leads/:id",ke(Ns));X.register("/leads/:id/edit",ke((e,a)=>Na(e,a)));X.register("/notifications",ke(zt));X.register("/quotes",ke(oa));X.register("/quotes/new",ke((e,a)=>Gt(e,{id:"new"})));X.register("/quotes/:id",ke(Gt));X.register("/jobs",ke(ia));X.register("/jobs/new",ke((e,a)=>za(e,{id:"new"})));X.register("/jobs/:id",ke(js));X.register("/jobs/:id/edit",ke((e,a)=>za(e,a)));X.register("/timesheets",ke(Fs));X.register("/assets",ke(Ot));X.register("/assets/new",ke((e,a)=>Ua(e,{id:"new"})));X.register("/assets/:id",ke(lo));X.register("/assets/:id/edit",ke((e,a)=>Ua(e,a)));X.register("/schedule",ke(Os));X.register("/stock",ke(yt));X.register("/stock/new",ke((e,a)=>Fa(e,{id:"new"})));X.register("/stock/:id",ke(Vs));X.register("/stock/:id/edit",ke((e,a)=>Fa(e,a)));X.register("/invoices",ke(Ft));X.register("/invoices/new",ke((e,a)=>Ha(e,{id:"new"})));X.register("/invoices/:id",ke(Ha));X.register("/purchase-orders",ke($t));X.register("/purchase-orders/:id",ke(Us));X.register("/documents",ke(co));X.register("/document/view",ke(po));X.register("/reports",ke(Js));X.register("/settings",ke(eo));X.register("/settings/forms/new",ke((e,a)=>Oa(e,{id:"new"})));X.register("/settings/forms/:id/edit",ke((e,a)=>Oa(e,a)));X.register("/settings/quote-templates/new",ke((e,a)=>Gt(e,{id:"new",type:"template"})));X.register("/settings/quote-templates/:id/edit",ke((e,a)=>Gt(e,{id:a.id,type:"template"})));const bo=["/","/people","/contractors","/suppliers","/leads","/notifications","/quotes","/jobs","/timesheets","/assets","/schedule","/stock","/invoices","/purchase-orders","/documents","/reports","/settings","/settings/forms"];X.onNavigate=(e,a)=>{const t=JSON.parse(localStorage.getItem("currentUser")||"null"),s=e==="/"?"/":"/"+e.split("/").filter(Boolean)[0],c=e.startsWith("/contractor-portal"),l=document.querySelector(".sidebar"),m=document.querySelector(".topbar"),n=document.getElementById("breadcrumb");if(c?(l&&(l.style.display="none"),m&&(m.style.display="none"),n&&(n.style.display="none")):t&&(l&&(l.style.display=""),m&&(m.style.display=""),n&&(n.style.display="")),!t&&e!=="/login"&&!c)return X.navigate("/login"),!1;if(t){if(t.role==="customer"&&bo.includes(s))return X.navigate("/portal"),!1;if(t.role!=="customer"&&s==="/portal")return X.navigate("/"),!1;if(t.role!=="admin"&&t.role!=="customer"&&t.userTypeId&&e!=="/login"){const p=r.getById("userTypes",t.userTypeId);if(p&&p.permissions){const o={"/":"Dashboard","/people":"Customers","/leads":"Leads","/notifications":"Notifications","/quotes":"Quotes","/jobs":"Jobs","/timesheets":"Timesheets","/assets":"Assets","/schedule":"Schedule","/contractors":"Contractors","/suppliers":"Suppliers","/stock":"Stock","/purchase-orders":"Purchase Orders","/invoices":"Invoices","/documents":"Documents","/reports":"Reports","/settings":"Settings"},f=o[s];if(f){let g=!1;if(e==="/jobs/new"&&!Le("Jobs","create")&&(g=!0),e.endsWith("/edit")&&s==="/jobs"&&!Le("Jobs","edit")&&(g=!0),e==="/quotes/new"&&!Le("Quotes","create")&&(g=!0),e==="/suppliers/new"&&!Le("Suppliers","create")&&(g=!0),e.endsWith("/edit")&&s==="/suppliers"&&!Le("Suppliers","edit")&&(g=!0),g){const d=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/suppliers","/assets","/documents","/settings"].find(x=>{const u=o[x];if(u==="Notifications"||u==="Dashboard")return!0;const b=p.permissions.find(h=>h.module===u);return b&&Object.entries(b).some(([h,k])=>h!=="module"&&k===!0)})||"/";return X.navigate(d),!1}if(!(f==="Notifications"||f==="Dashboard")){const i=p.permissions.find(d=>d.module===f);if(!i||Object.entries(i||{}).every(([d,x])=>d==="module"||!x)){const x=["/","/schedule","/jobs","/quotes","/leads","/timesheets","/invoices","/people","/stock","/purchase-orders","/reports","/contractors","/suppliers","/assets","/documents","/settings"].find(u=>{const b=o[u];if(b==="Notifications"||b==="Dashboard")return!0;const h=p.permissions.find(k=>k.module===b);return h&&Object.entries(h).some(([k,S])=>k!=="module"&&S===!0)})||"/";if(s!==x)return X.navigate(x),!1}}}}}}Ta(e),vs(e)};window.addEventListener("fieldforge-logout",()=>{localStorage.removeItem("currentUser");const e=document.querySelector(".sidebar"),a=document.querySelector(".topbar"),t=document.getElementById("breadcrumb");e&&(e.style.display="none"),a&&(a.style.display="none"),t&&(t.style.display="none"),X.navigate("/login")});const fo=JSON.parse(localStorage.getItem("currentUser")||"null");!fo&&window.location.hash!=="#/login"&&!window.location.hash.startsWith("#/contractor-portal")&&(window.location.hash="#/login");X.resolve();
