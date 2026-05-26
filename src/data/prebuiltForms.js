export const prebuiltForms = [
  {
    id: "ft_jsa_swms",
    name: "Job Safety Analysis (JSA) / SWMS",
    description: "Outlines risks and control measures before high-risk tasks.",
    sections: [
      {
        id: "s_jsa_info",
        title: "Job Details & Induction",
        columns: 2,
        fields: [
          { id: "f_jsa_job", type: "text", label: "Job Reference / Task Name", required: true, colSpan: 1 },
          { id: "f_jsa_date", type: "date", label: "Date", required: true, colSpan: 1 },
          { id: "f_jsa_supervisor", type: "text", label: "Supervisor Name", required: true, colSpan: 1 },
          { id: "f_jsa_company", type: "text", label: "Company / Contractor", required: true, colSpan: 1 },
          { id: "f_jsa_desc", type: "textarea", label: "Description of Work", required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_jsa_hazards",
        title: "Hazard Identification",
        columns: 2,
        fields: [
          { id: "f_jsa_haz_fall", type: "checkbox", label: "Working at Heights / Fall Risk", colSpan: 1 },
          { id: "f_jsa_haz_elec", type: "checkbox", label: "Live Electrical Work", colSpan: 1 },
          { id: "f_jsa_haz_confined", type: "checkbox", label: "Confined Space Entry", colSpan: 1 },
          { id: "f_jsa_haz_chem", type: "checkbox", label: "Hazardous Chemicals / Asbestos", colSpan: 1 },
          { id: "f_jsa_haz_plant", type: "checkbox", label: "Mobile Plant / Heavy Machinery", colSpan: 1 },
          { id: "f_jsa_haz_other", type: "text", label: "Other Hazards", colSpan: 1 }
        ]
      },
      {
        id: "s_jsa_controls",
        title: "Risk Controls & PPE",
        columns: 2,
        fields: [
          { id: "f_jsa_ppe_hardhat", type: "checkbox", label: "Hard Hat", colSpan: 1 },
          { id: "f_jsa_ppe_boots", type: "checkbox", label: "Steel Capped Boots", colSpan: 1 },
          { id: "f_jsa_ppe_vest", type: "checkbox", label: "Hi-Vis Clothing", colSpan: 1 },
          { id: "f_jsa_ppe_glasses", type: "checkbox", label: "Safety Glasses", colSpan: 1 },
          { id: "f_jsa_control_desc", type: "textarea", label: "Detailed Control Measures", required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_jsa_signoff",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_jsa_info1", type: "info", label: "By signing below, I confirm I have read and understood the hazards and control measures associated with this task." },
          { id: "f_jsa_sign", type: "signature", label: "Worker Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_daily_report",
    name: "Daily Site Report",
    description: "Tracks weather, daily progress, and subcontractor logs.",
    sections: [
      {
        id: "s_dsr_meta",
        title: "Site Conditions",
        columns: 2,
        fields: [
          { id: "f_dsr_date", type: "date", label: "Date", required: true, colSpan: 1 },
          { id: "f_dsr_weather", type: "select", label: "Weather Conditions", options: ["Clear/Sunny", "Overcast", "Light Rain", "Heavy Rain", "Extreme Heat", "High Winds"], required: true, colSpan: 1 },
          { id: "f_dsr_temp", type: "text", label: "Temperature (Approx)", colSpan: 1 },
          { id: "f_dsr_delays", type: "checkbox", label: "Were there any weather delays?", colSpan: 1 }
        ]
      },
      {
        id: "s_dsr_work",
        title: "Work & Progress",
        columns: 1,
        fields: [
          { id: "f_dsr_progress", type: "textarea", label: "Summary of Work Completed Today", required: true },
          { id: "f_dsr_materials", type: "textarea", label: "Materials Delivered / Used" },
          { id: "f_dsr_subs", type: "textarea", label: "Subcontractors on Site (Names/Companies)" }
        ]
      },
      {
        id: "s_dsr_issues",
        title: "Issues & Safety",
        columns: 2,
        fields: [
          { id: "f_dsr_incidents", type: "checkbox", label: "Any safety incidents or near misses?", colSpan: 1 },
          { id: "f_dsr_variations", type: "checkbox", label: "Any client variations requested?", colSpan: 1 },
          { id: "f_dsr_issue_desc", type: "textarea", label: "Issue Details (if any)", colSpan: 2 }
        ]
      },
      {
        id: "s_dsr_signoff",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_dsr_sign", type: "signature", label: "Site Supervisor Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_induction",
    name: "Site Induction Form",
    description: "Standard safety orientations for new workers on site.",
    sections: [
      {
        id: "s_ind_person",
        title: "Worker Details",
        columns: 2,
        fields: [
          { id: "f_ind_name", type: "text", label: "Full Name", required: true, colSpan: 1 },
          { id: "f_ind_company", type: "text", label: "Company", required: true, colSpan: 1 },
          { id: "f_ind_phone", type: "text", label: "Contact Number", required: true, colSpan: 1 },
          { id: "f_ind_emergency", type: "text", label: "Emergency Contact", required: true, colSpan: 1 }
        ]
      },
      {
        id: "s_ind_checklist",
        title: "Induction Checklist",
        columns: 1,
        fields: [
          { id: "f_ind_chk_1", type: "checkbox", label: "Shown site amenities (toilets, crib room, first aid)" },
          { id: "f_ind_chk_2", type: "checkbox", label: "Explained evacuation procedures & assembly points" },
          { id: "f_ind_chk_3", type: "checkbox", label: "Reviewed Site Safety Rules & PPE requirements" },
          { id: "f_ind_chk_4", type: "checkbox", label: "Provided copies of required licenses / white card" }
        ]
      },
      {
        id: "s_ind_signoff",
        title: "Declaration",
        columns: 1,
        fields: [
          { id: "f_ind_info", type: "info", label: "I acknowledge that I have received the site induction and agree to abide by all site safety rules and procedures." },
          { id: "f_ind_sign", type: "signature", label: "Worker Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_plumb_comp",
    name: "Plumbing Compliance Certificate",
    description: "Verifies that gas/plumbing work meets state and local regulatory standards.",
    sections: [
      {
        id: "s_pc_meta",
        title: "Installation Details",
        columns: 2,
        fields: [
          { id: "f_pc_type", type: "select", label: "Work Type", options: ["Sanitary", "Water Supply", "Drainage", "Roofing", "Gasfitting", "Mechanical Services"], required: true, colSpan: 1 },
          { id: "f_pc_class", type: "select", label: "Building Classification", options: ["Class 1", "Class 2-9", "Class 10"], required: true, colSpan: 1 },
          { id: "f_pc_desc", type: "textarea", label: "Description of Plumbing Work", required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_pc_tests",
        title: "Testing & Verification",
        columns: 2,
        fields: [
          { id: "f_pc_test_pressure", type: "checkbox", label: "Pressure test passed", colSpan: 1 },
          { id: "f_pc_test_flow", type: "checkbox", label: "Flow rates verified", colSpan: 1 },
          { id: "f_pc_test_leaks", type: "checkbox", label: "System free of leaks", colSpan: 1 },
          { id: "f_pc_test_standards", type: "checkbox", label: "Complies with AS/NZS 3500", colSpan: 1 }
        ]
      },
      {
        id: "s_pc_sign",
        title: "Plumber Declaration",
        columns: 1,
        fields: [
          { id: "f_pc_license", type: "text", label: "Plumber License Number", required: true },
          { id: "f_pc_info", type: "info", label: "I certify that the plumbing work described above complies with the relevant plumbing laws and standards." },
          { id: "f_pc_sign", type: "signature", label: "Licensed Plumber Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_leak_detect",
    name: "Leak Detection & Backflow Report",
    description: "Documents diagnostic checks and system faults.",
    sections: [
      {
        id: "s_ld_sys",
        title: "System Details",
        columns: 2,
        fields: [
          { id: "f_ld_asset", type: "text", label: "Device / Asset ID", colSpan: 1 },
          { id: "f_ld_type", type: "select", label: "Device Type", options: ["RPZD", "Double Check Valve", "Air Gap", "Other"], required: true, colSpan: 1 },
          { id: "f_ld_loc", type: "text", label: "Exact Location on Site", required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_ld_results",
        title: "Test Results",
        columns: 2,
        fields: [
          { id: "f_ld_pressure", type: "text", label: "Line Pressure (kPa)", colSpan: 1 },
          { id: "f_ld_drop", type: "text", label: "Pressure Drop (kPa)", colSpan: 1 },
          { id: "f_ld_pass", type: "select", label: "Overall Result", options: ["PASS", "FAIL"], required: true, colSpan: 2 },
          { id: "f_ld_notes", type: "textarea", label: "Faults / Repair Notes", colSpan: 2 }
        ]
      },
      {
        id: "s_ld_sign",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_ld_sign", type: "signature", label: "Tester Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_gas_safety",
    name: "Gas Safety Checklist",
    description: "Pre-commissioning and safety assessment logs.",
    sections: [
      {
        id: "s_gs_appliance",
        title: "Appliance Information",
        columns: 2,
        fields: [
          { id: "f_gs_make", type: "text", label: "Make & Model", required: true, colSpan: 1 },
          { id: "f_gs_serial", type: "text", label: "Serial Number", colSpan: 1 },
          { id: "f_gs_type", type: "select", label: "Gas Type", options: ["Natural Gas (NG)", "LPG"], required: true, colSpan: 1 },
          { id: "f_gs_loc", type: "text", label: "Location", colSpan: 1 }
        ]
      },
      {
        id: "s_gs_checks",
        title: "Safety Checks",
        columns: 2,
        fields: [
          { id: "f_gs_vent", type: "checkbox", label: "Ventilation adequate (AS/NZS 5601)", colSpan: 1 },
          { id: "f_gs_clearance", type: "checkbox", label: "Clearances to combustibles met", colSpan: 1 },
          { id: "f_gs_pressure", type: "checkbox", label: "Operating pressure correct", colSpan: 1 },
          { id: "f_gs_leak", type: "checkbox", label: "Soap test / Leak test passed", colSpan: 1 },
          { id: "f_gs_co", type: "checkbox", label: "CO spillage test passed (if applicable)", colSpan: 1 }
        ]
      },
      {
        id: "s_gs_sign",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_gs_license", type: "text", label: "Gas Fitter License No.", required: true },
          { id: "f_gs_sign", type: "signature", label: "Fitter Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_test_tag",
    name: "Test & Tag Report",
    description: "Records the electrical safety status of tools and appliances.",
    sections: [
      {
        id: "s_tt_equip",
        title: "Equipment Details",
        columns: 2,
        fields: [
          { id: "f_tt_id", type: "text", label: "Asset/Plant ID", required: true, colSpan: 1 },
          { id: "f_tt_desc", type: "text", label: "Equipment Description", required: true, colSpan: 1 },
          { id: "f_tt_class", type: "select", label: "Class", options: ["Class I (Earthed)", "Class II (Double Insulated)", "RCD", "Cord Extension"], required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_tt_tests",
        title: "Test Results",
        columns: 2,
        fields: [
          { id: "f_tt_visual", type: "select", label: "Visual Inspection", options: ["Pass", "Fail"], required: true, colSpan: 1 },
          { id: "f_tt_earth", type: "select", label: "Earth Continuity", options: ["Pass", "Fail", "N/A"], required: true, colSpan: 1 },
          { id: "f_tt_insulation", type: "select", label: "Insulation Resistance", options: ["Pass", "Fail"], required: true, colSpan: 1 },
          { id: "f_tt_polarity", type: "select", label: "Polarity (if cord)", options: ["Pass", "Fail", "N/A"], colSpan: 1 },
          { id: "f_tt_overall", type: "select", label: "Overall Result", options: ["PASS (Tagged)", "FAIL (Danger Tagged)"], required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_tt_sign",
        title: "Tester Sign Off",
        columns: 1,
        fields: [
          { id: "f_tt_date", type: "date", label: "Next Test Due Date", required: true },
          { id: "f_tt_sign", type: "signature", label: "Tester Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_switchboard",
    name: "Switchboard Inspection",
    description: "Documents thermal imaging, faults, and board condition.",
    sections: [
      {
        id: "s_sw_meta",
        title: "Board Information",
        columns: 2,
        fields: [
          { id: "f_sw_id", type: "text", label: "Switchboard ID/Name", required: true, colSpan: 1 },
          { id: "f_sw_loc", type: "text", label: "Location", colSpan: 1 },
          { id: "f_sw_rating", type: "text", label: "Main Switch Rating (Amps)", colSpan: 1 },
          { id: "f_sw_rcd", type: "checkbox", label: "Are RCDs fitted to all required circuits?", colSpan: 1 }
        ]
      },
      {
        id: "s_sw_visual",
        title: "Inspection & Thermal",
        columns: 2,
        fields: [
          { id: "f_sw_clean", type: "checkbox", label: "Board clean and free of debris", colSpan: 1 },
          { id: "f_sw_legend", type: "checkbox", label: "Circuit legend accurate and legible", colSpan: 1 },
          { id: "f_sw_thermal", type: "select", label: "Thermal Imaging Result", options: ["Normal", "Minor Hotspots", "Critical Faults Found"], colSpan: 2 },
          { id: "f_sw_notes", type: "textarea", label: "Defects / Rectification required", colSpan: 2 }
        ]
      },
      {
        id: "s_sw_sign",
        title: "Inspector Sign Off",
        columns: 1,
        fields: [
          { id: "f_sw_sign", type: "signature", label: "Electrician Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_cable_verif",
    name: "Cable Verification Report",
    description: "Confirms data or telecom wiring compliance.",
    sections: [
      {
        id: "s_cv_meta",
        title: "Network Details",
        columns: 2,
        fields: [
          { id: "f_cv_cat", type: "select", label: "Cable Category", options: ["Cat 5e", "Cat 6", "Cat 6A", "Optical Fibre", "Coax"], required: true, colSpan: 1 },
          { id: "f_cv_tester", type: "text", label: "Tester Make/Model used", colSpan: 1 }
        ]
      },
      {
        id: "s_cv_results",
        title: "Testing Checklist",
        columns: 2,
        fields: [
          { id: "f_cv_wiremap", type: "checkbox", label: "Wiremap / Continuity passed", colSpan: 1 },
          { id: "f_cv_length", type: "checkbox", label: "Length within limits", colSpan: 1 },
          { id: "f_cv_next", type: "checkbox", label: "NEXT / Return Loss passed", colSpan: 1 },
          { id: "f_cv_label", type: "checkbox", label: "Outlets & Patch panels labelled", colSpan: 1 },
          { id: "f_cv_notes", type: "textarea", label: "Failing Runs / Notes", colSpan: 2 }
        ]
      },
      {
        id: "s_cv_sign",
        title: "Technician Sign Off",
        columns: 1,
        fields: [
          { id: "f_cv_sign", type: "signature", label: "Technician Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_hvac_maint",
    name: "HVAC Maintenance Checklist",
    description: "Used for routine AC and heating system servicing.",
    sections: [
      {
        id: "s_hvac_unit",
        title: "Unit Details",
        columns: 2,
        fields: [
          { id: "f_hvac_make", type: "text", label: "Make & Model", required: true, colSpan: 1 },
          { id: "f_hvac_serial", type: "text", label: "Serial Number", colSpan: 1 },
          { id: "f_hvac_type", type: "select", label: "System Type", options: ["Split System", "Ducted", "Package Unit", "VRV/VRF", "Chiller"], colSpan: 2 }
        ]
      },
      {
        id: "s_hvac_tasks",
        title: "Maintenance Tasks",
        columns: 2,
        fields: [
          { id: "f_hvac_filters", type: "checkbox", label: "Filters cleaned / replaced", colSpan: 1 },
          { id: "f_hvac_coils", type: "checkbox", label: "Evap & Condenser coils cleaned", colSpan: 1 },
          { id: "f_hvac_drain", type: "checkbox", label: "Condensate drain flushed", colSpan: 1 },
          { id: "f_hvac_elec", type: "checkbox", label: "Electrical terminals tightened", colSpan: 1 },
          { id: "f_hvac_refrig", type: "checkbox", label: "Refrigerant charge checked", colSpan: 1 },
          { id: "f_hvac_temp", type: "text", label: "Supply Air Temp (°C)", colSpan: 1 },
          { id: "f_hvac_notes", type: "textarea", label: "Recommendations / Faults", colSpan: 2 }
        ]
      },
      {
        id: "s_hvac_sign",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_hvac_sign", type: "signature", label: "Technician Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_pressure_test",
    name: "Pressure Testing Form",
    description: "Records pressure ratings for refrigerant or ductwork.",
    sections: [
      {
        id: "s_pt_sys",
        title: "System Information",
        columns: 2,
        fields: [
          { id: "f_pt_sys", type: "text", label: "System/Pipework ID", required: true, colSpan: 1 },
          { id: "f_pt_medium", type: "select", label: "Test Medium", options: ["Dry Nitrogen", "Water", "Air", "Refrigerant"], required: true, colSpan: 1 }
        ]
      },
      {
        id: "s_pt_readings",
        title: "Test Readings",
        columns: 2,
        fields: [
          { id: "f_pt_start_p", type: "text", label: "Start Pressure (kPa)", required: true, colSpan: 1 },
          { id: "f_pt_start_t", type: "text", label: "Start Time", required: true, colSpan: 1 },
          { id: "f_pt_end_p", type: "text", label: "End Pressure (kPa)", required: true, colSpan: 1 },
          { id: "f_pt_end_t", type: "text", label: "End Time", required: true, colSpan: 1 },
          { id: "f_pt_result", type: "select", label: "Test Result", options: ["PASS (No drop)", "FAIL (Pressure drop)"], required: true, colSpan: 2 }
        ]
      },
      {
        id: "s_pt_sign",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_pt_sign", type: "signature", label: "Tester Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_commissioning",
    name: "Commissioning Report",
    description: "Ensures systems are operating to manufacturer specifications.",
    sections: [
      {
        id: "s_cm_meta",
        title: "Equipment Information",
        columns: 2,
        fields: [
          { id: "f_cm_equip", type: "text", label: "Equipment Name/ID", required: true, colSpan: 2 },
          { id: "f_cm_make", type: "text", label: "Make & Model", colSpan: 1 },
          { id: "f_cm_serial", type: "text", label: "Serial Number", colSpan: 1 }
        ]
      },
      {
        id: "s_cm_checks",
        title: "Pre-Start & Running Checks",
        columns: 2,
        fields: [
          { id: "f_cm_install", type: "checkbox", label: "Installed to manufacturer specs", colSpan: 1 },
          { id: "f_cm_power", type: "checkbox", label: "Power supply verified", colSpan: 1 },
          { id: "f_cm_controls", type: "checkbox", label: "Thermostat/Controls operational", colSpan: 1 },
          { id: "f_cm_amps", type: "text", label: "Running Amps (L1, L2, L3)", colSpan: 1 },
          { id: "f_cm_notes", type: "textarea", label: "Commissioning Notes / Handover", colSpan: 2 }
        ]
      },
      {
        id: "s_cm_sign",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_cm_sign", type: "signature", label: "Commissioning Tech Signature", required: true }
        ]
      }
    ]
  },
  {
    id: "ft_heights_permit",
    name: "Working at Heights Permit",
    description: "Authorizes ladder, roof, or scaffolding work.",
    sections: [
      {
        id: "s_wh_meta",
        title: "Permit Details",
        columns: 2,
        fields: [
          { id: "f_wh_loc", type: "text", label: "Exact Location of Work", required: true, colSpan: 2 },
          { id: "f_wh_method", type: "select", label: "Access Method", options: ["Scaffolding", "EWP / Boom Lift", "Harness / Roof Anchor", "Extension Ladder", "Platform Ladder"], required: true, colSpan: 1 },
          { id: "f_wh_height", type: "text", label: "Approx Height (m)", colSpan: 1 }
        ]
      },
      {
        id: "s_wh_controls",
        title: "Safety Controls in Place",
        columns: 2,
        fields: [
          { id: "f_wh_barricades", type: "checkbox", label: "Barricades / Drop zones established", colSpan: 1 },
          { id: "f_wh_weather", type: "checkbox", label: "Weather conditions assessed", colSpan: 1 },
          { id: "f_wh_harness", type: "checkbox", label: "Harnesses inspected & in date", colSpan: 1 },
          { id: "f_wh_rescue", type: "checkbox", label: "Rescue plan documented", colSpan: 1 }
        ]
      },
      {
        id: "s_wh_auth",
        title: "Authorization",
        columns: 2,
        fields: [
          { id: "f_wh_auth_name", type: "text", label: "Authorizing Person", required: true, colSpan: 1 },
          { id: "f_wh_auth_sign", type: "signature", label: "Authorization Signature", required: true, colSpan: 1 },
          { id: "f_wh_worker_sign", type: "signature", label: "Worker Signature", required: true, colSpan: 2 }
        ]
      }
    ]
  },
  {
    id: "ft_defect_list",
    name: "Defect / Handover List",
    description: "Records incomplete work or minor fixes required before final sign-off.",
    sections: [
      {
        id: "s_df_meta",
        title: "Handover Details",
        columns: 2,
        fields: [
          { id: "f_df_area", type: "text", label: "Room / Area", required: true, colSpan: 1 },
          { id: "f_df_client", type: "text", label: "Client Name", required: true, colSpan: 1 }
        ]
      },
      {
        id: "s_df_items",
        title: "Defect Identification",
        columns: 1,
        fields: [
          { id: "f_df_list", type: "textarea", label: "List of Defects / Snags", required: true },
          { id: "f_df_photos", type: "checkbox", label: "Photos taken and attached to job?" },
          { id: "f_df_action", type: "select", label: "Required Action", options: ["Touch up paint", "Adjust hinges/doors", "Replace damaged item", "Clean up required", "Other (describe above)"] }
        ]
      },
      {
        id: "s_df_sign",
        title: "Sign Off",
        columns: 2,
        fields: [
          { id: "f_df_builder_sign", type: "signature", label: "Builder/Tech Signature", required: true, colSpan: 1 },
          { id: "f_df_client_sign", type: "signature", label: "Client Signature (Acknowledged)", colSpan: 1 }
        ]
      }
    ]
  },
  {
    id: "ft_site_measure",
    name: "Site Measure Sheet",
    description: "Accurate dimensions for custom cabinets, frames, and trim.",
    sections: [
      {
        id: "s_sm_meta",
        title: "Measurement Details",
        columns: 2,
        fields: [
          { id: "f_sm_room", type: "text", label: "Room / Elevation", required: true, colSpan: 1 },
          { id: "f_sm_type", type: "select", label: "Item to measure", options: ["Kitchen Cabinetry", "Wardrobes", "Windows/Doors", "Skirting/Trim", "Other"], required: true, colSpan: 1 },
          { id: "f_sm_walls", type: "checkbox", label: "Walls checked for plumb?", colSpan: 1 },
          { id: "f_sm_floors", type: "checkbox", label: "Floors checked for level?", colSpan: 1 }
        ]
      },
      {
        id: "s_sm_dims",
        title: "Dimensions",
        columns: 1,
        fields: [
          { id: "f_sm_w", type: "text", label: "Overall Width (mm)" },
          { id: "f_sm_h", type: "text", label: "Overall Height (mm)" },
          { id: "f_sm_d", type: "text", label: "Overall Depth (mm)" },
          { id: "f_sm_notes", type: "textarea", label: "Specific Notes / Cutouts (Plumbing/Electrical)" }
        ]
      },
      {
        id: "s_sm_sign",
        title: "Sign Off",
        columns: 1,
        fields: [
          { id: "f_sm_sign", type: "signature", label: "Measurer Signature", required: true }
        ]
      }
    ]
  }
];
