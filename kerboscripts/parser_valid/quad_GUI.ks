local exit is false.

local window_wide is 500. //px
local window_collapsed is 380. //px

local g is gui(window_wide).
set g:x to 10. //window start position
set g:y to 60.
set g:style:padding:h to 5.
set g:style:padding:v to 5.

// Setting up the skin defaults

//set g:skin:font to "Nimbus Mono".
//set g:skin:font to "Hack".
//set g:skin:font to "Source Code Pro".
set g:skin:font to "PT Mono Bold".

set g:skin:toggle:textcolor to rgb(1,1,1).
set g:skin:toggle:on:textcolor to rgb(0.5,1,0).
set g:skin:toggle:hover_on:textcolor to g:skin:toggle:on:textcolor.
set g:skin:toggle:height to 20.
set g:skin:toggle:padding:left to 32.
set g:skin:toggle:bg to "gui/toggle_off.png".
set g:skin:toggle:hover:bg to "gui/toggle_off_hover.png".
set g:skin:toggle:on:bg to "gui/toggle_on.png".
set g:skin:toggle:hover_on:bg to "gui/toggle_on_hover.png".
set g:skin:toggle:active_on:bg to "gui/toggle_mid.png".
set g:skin:toggle:active:bg to "gui/toggle_mid.png".

//to use radio style for toggles, this style must be referenced
set skin_radio to g:skin:add("radio",g:skin:toggle).
set skin_radio:bg to "gui/radio.png".
set skin_radio:hover:bg to "gui/radio_hover.png".
set skin_radio:on:bg to "gui/radio_on.png".
set skin_radio:hover_on:bg to "gui/radio_on.png".
set skin_radio:active_on:bg to "gui/radio_on.png".
set skin_radio:active:bg to "gui/radio_on.png".
set skin_radio:padding:left to 26.


set g:skin:button:textcolor to rgb(1,1,1).
set g:skin:button:bg to "gui/button.png".
set g:skin:button:hover:bg to "gui/button.png".
set g:skin:button:on:bg to "gui/button_on.png".
set g:skin:button:on:textcolor to rgb(0.5,1,0).
set g:skin:button:active:bg to "gui/button_on.png".
set g:skin:button:active_on:bg to "gui/button_on.png".
set g:skin:button:hover_on:bg to "gui/button_on.png".
set g:skin:button:padding:top to 4.
set g:skin:button:padding:bottom to 7.
set g:skin:button:border:h to 7.
set g:skin:button:border:v to 7.

set g:skin:popupmenu:textcolor to rgb(0.5,1,0).
set g:skin:popupmenu:fontsize to 12.
set g:skin:popupmenu:bg to "gui/button.png".
set g:skin:popupmenu:hover:bg to "gui/button.png".
set g:skin:popupmenu:on:bg to "gui/button_on.png".
set g:skin:popupmenu:active:bg to "gui/button_on.png".
set g:skin:popupmenu:active_on:bg to "gui/button_on.png".
set g:skin:popupmenu:hover_on:bg to "gui/button_on.png".
set g:skin:popupmenu:align to "CENTER".
set g:skin:popupmenu:padding:v to 8.
set g:skin:popupmenu:border:h to 7.
set g:skin:popupmenu:border:v to 7.

set g:skin:popupmenuitem:textcolor to rgb(1,1,1).
set g:skin:popupmenuitem:fontsize to 12.
set g:skin:popupmenuitem:font to "PT Mono Bold".
set g:skin:popupmenuitem:padding:h to 10.
set g:skin:popupmenuitem:align to "center".

set g:skin:popupwindow:bg to "gui/indent.png".
set g:skin:popupwindow:margin:h to 5.
set g:skin:popupwindow:padding:h to 0.
set g:skin:popupwindow:margin:top to 5.
set g:skin:popupwindow:padding:v to 0.


set g:skin:verticalsliderthumb:bg to "gui/slider_thumb.png".
set g:skin:verticalsliderthumb:hover:bg to "gui/slider_thumb.png".
set g:skin:verticalsliderthumb:active:bg to "gui/slider_thumb.png".
set g:skin:verticalslider:bg to "gui/slider_indent.png".
set g:skin:verticalslider:border:h to -1.
set g:skin:verticalslider:border:v to 20.

set g:skin:VERTICALSCROLLBAR:bg to "gui/indent.png".
set g:skin:VERTICALSCROLLBAR:border:v to 20.
set g:skin:VERTICALSCROLLBARTHUMB:bg to "gui/button.png".
set g:skin:VERTICALSCROLLBARTHUMB:width to 300.
set g:skin:VERTICALSCROLLBARleftbutton:bg to "gui/button.png".
set g:skin:VERTICALSCROLLBARrightbutton:bg to "gui/button.png".
set g:skin:horizontalSCROLLBARTHUMB:on:bg to "gui/indent.png".
set g:skin:horizontalSCROLLBARleftbutton:bg to "gui/indent.png".
set g:skin:horizontalSCROLLBARrightbutton:bg to "gui/indent.png".


set g:skin:textfield:fontsize to 12.
set g:skin:textfield:textcolor to rgb(0.3,1,0).
set g:skin:textfield:bg to "gui/mini_terminal.png".
set g:skin:textfield:border:h to 7.
set g:skin:textfield:border:v to 7.

set g:skin:box:bg to "gui/indent.png".
set g:skin:box:border:h to 9.
set g:skin:box:border:v to 9.

set g:style:bg to "gui/gui.png". //the main background image of the GUI window


set style_label_compact_val to g:skin:add("label_compact_val",g:skin:label).
set style_label_compact_val:align to "right".
set style_label_compact_val:fontsize to 12.
set style_label_compact to g:skin:add("label_compact",style_label_compact_val).
set style_label_compact:align to "left".
set style_label_compact:textcolor to rgb(1,1,1).
	
	//>> ### Title bar
	local title is g:addhbox(). 
	set title:style:margin:top to 0.
	set title:style:margin:bottom to 2.
	set title:style:padding:left to 5.
	set title:style:padding:right to 2.
	set title:style:padding:v to 0.
		local g_logo is title:addlabel("").
			set g_logo:image to "gui/hoverbot.png".
			set g_logo:style:margin:v to 0.
			set g_logo:style:padding:top to 0.
			set g_logo:style:width to 110. //image is 100px, leave 10 as margin
		local title_label is title:addlabel("<b>" + ship:name + "</b>").
		set title_label:style:fontsize to 14.
		set title_label:style:margin:h to 2.
		set title_label:style:margin:v to 0.
		set title_label:style:textcolor to rgb(0.2,1,0.3).
		//title:addspacing(-1).
		local title_fuel_text is title:addlabel("100%").
		set title_fuel_text:style:margin:h to 2.
		set title_fuel_text:style:margin:v to 0.
		set title_fuel_text:style:width to 38.
		local title_hz is title:addlabel("25hz").
		set title_hz:style:margin:h to 2.
		set title_hz:style:margin:v to 0.
		set title_hz:style:width to 40.
		set title_hz:style:textcolor to yellow.
		local g_hide is title:addbutton("_").
		set g_hide:style:margin:h to 0.
		set g_hide:style:margin:v to 1.
		set g_hide:toggle to true.
		set g_hide:style:width to 20.
		set g_hide:style:height to 20.
		set g_hide:style:textcolor to black.
		set g_hide:style:padding:bottom to 12.
		set g_hide:ontoggle to { 
			parameter b. 
			if b {
				box_all:hide().
				g_logo:hide().
				set g:style:width to window_collapsed.
			}
			else {
				box_all:show().
				g_logo:show().
				set g:style:width to window_wide.
			}
		}.
		local g_close is title:addbutton("X").
		set g_close:style:margin:h to 0.
		set g_close:style:margin:v to 1.
		set g_close:style:width to 20.
		set g_close:style:height to 20.
		set g_close:style:textcolor to black.
		set g_close:onclick to { set exit to true. }.
	//<<
	
	local box_all is g:addvlayout().
	set box_all:style:padding:v to 0.
	set box_all:style:padding:h to 0.
	set box_all:style:margin:v to 0.
	set box_all:style:margin:h to 0.
		
		//>> ### Tabs / show/hide toggles
		local top_box is box_all:addhlayout().
		//set top_box:style:margin:bottom to 4.
			local tab_box is top_box:addhlayout().
			set tab_box:style:width to 204.
			set tab_box:style:margin:h to 0.
			set tab_box:style:padding:v to 2.
			set tab_box:style:padding:h to 2.
			//set tab_box:style:padding:h to 0.
				local tab_modes is tab_box:addbutton("Runmodes").
				set tab_modes:style:margin:v to 0.
				set tab_modes:style:margin:h to 0.
				set tab_modes:toggle to true.
				set tab_modes:exclusive to true.
				set tab_modes:onclick to { box_center:showonly(activeStack). }.
				
				local tab_options is tab_box:addbutton("Options").
				set tab_options:style:margin:v to 0.
				set tab_options:style:margin:h to 0.
				set tab_options:toggle to true.
				set tab_options:exclusive to true.
				set tab_options:onclick to { if tab_options:pressed box_center:showonly(stack_options). }.
			
			top_box:addspacing(-1).
			
			local toggles_box is top_box:addhlayout().
			set toggles_box:style:width to 160.
			set toggles_box:style:padding:h to 0.
				local b_log is toggles_box:addbutton("Log ").
				set b_log:style:margin:v to 1.
				set b_log:style:margin:h to 0.
				set b_log:style to g:skin:toggle.
				set b_log:toggle to true.
				set b_log:pressed to true.
				set b_log:onclick to { set box_log_container:visible to b_log:pressed. }.
				
				local b_readouts is toggles_box:addbutton("Stats").
				set b_readouts:style:margin:v to 1.
				set b_readouts:style:margin:h to 0.
				set b_readouts:style to g:skin:toggle.
				set b_readouts:toggle to true.
				set b_readouts:pressed to true.
				set b_readouts:onclick to { 
					set box_right:visible to b_readouts:pressed.
					if b_readouts:pressed set g:style:width to window_wide.
					else set g:style:width to window_collapsed.
				}.
		//<<
		
		//this one contains the three vertical boxes in the middle; the mode menu, the contextual window, and the stats window on the right:
		local box_main is box_all:addhlayout(). 
		set box_main:style:padding:h to 0.
		set box_main:style:padding:v to 0.
		set box_main:style:height to 260.

			//>> ### Modes selection menu
			local box_left is box_main:addvbox().
			set box_left:style:padding:h to 0.
			set box_left:style:padding:top to 0.
			set box_left:style:padding:bottom to 5.
			set box_left:style:margin:h to 0.
			set box_left:style:margin:v to 0.
			set box_left:style:width to 106.
			//set box_left:style:height to 260.
			//set box_left:style:height to 250.
			set box_left:onRadioChange to selectMode@.
				local mode_label is box_left:addlabel("<b>Modes</b>").
				set mode_label:style:fontsize to 18.
				set mode_label:style:textcolor to rgb(1,1,0).
				//set mode_label:style:font to "Nimbus Mono Bold".
				set mode_label:style:align to "center".
				box_left:addspacing(4).
				local r_landing is box_left:addradiobutton("Landing",false).
				set r_landing:style to skin_radio.
				local r_hover is box_left:addradiobutton("Hover",false).
				set r_hover:style to skin_radio.
				local r_free is box_left:addradiobutton("Free",false).
				set r_free:style to skin_radio.
				local r_bookmark is box_left:addradiobutton("Bookmark",false).
				set r_bookmark:style to skin_radio.
				local r_pos is box_left:addradiobutton("Go To",true).
				set r_pos:style to skin_radio.
				local r_follow is box_left:addradiobutton("Follow",false).
				set r_follow:style to skin_radio.
				local r_patrol is box_left:addradiobutton("Patrol",false).
				set r_patrol:style to skin_radio.
				local r_race is box_left:addradiobutton("Race",false).
				set r_race:style to skin_radio.

				
				box_left:addspacing(-1).
				
				local b_docking is box_left:addbutton("Docking").
				set b_docking:toggle to true.
				set b_docking:style:width to 90.
				set b_docking:style:margin:left to 7.
				set b_docking:style:margin:v to 2.
			//<<	
				
				
			local box_center is box_main:addvbox().
			set box_center:style:margin:h to 0.
			set box_center:style:margin:v to 0.
			set box_center:style:padding:h to 10.
			set box_center:style:padding:v to 10.
			//set box_center:style:bg to "gui/terminal_on.png".
				
				//>> ### Mode specific menus
				local stack_landing is box_center:addstack().
					local box_landing is stack_landing:addvlayout().
						box_landing:addlabel("Cancelling velocity and landing..").
						box_landing:addspacing(-1).
				
				local stack_hover is box_center:addstack().
					local box_hover is stack_hover:addvlayout().
						box_hover:addlabel("Maintaining height above ground..").
						box_hover:addspacing(-1).
				
				local stack_free is box_center:addstack().
					local box_free is stack_free:addvlayout().
						box_free:addlabel("FLY-BY-WIRE").
						box_free:addlabel("[WASD] to steer").
						
						local box_free_speed is box_free:addhlayout().
							local g_free_speed_label is box_free_speed:addlabel("Speed").
							set g_free_speed_label:style to style_label_compact.
							local g_free_speed_label_val is box_free_speed:addlabel("52 m/s").
							set g_free_speed_label_val:style to style_label_compact_val.
							
						local box_free_heading is box_free:addhlayout().
							local g_free_heading_label is box_free_heading:addlabel("Heading").
							set g_free_heading_label:style to style_label_compact.
							local g_free_heading_label_val is box_free_heading:addlabel("275").
							set g_free_heading_label_val:style to style_label_compact_val.
						box_free:addspacing(-1).
				
				local stack_bookmark is box_center:addstack().
					local box_bookmark is stack_bookmark:addvlayout().
						box_bookmark:addlabel("Bookmark").
						
						local dropdown_bookmark is box_bookmark:addpopupmenu().
						set dropdown_bookmark:options to list("DRONE POS","LAUNCHPAD","VAB","RUNWAY E","RUNWAY W","POOL","ISLAND W").
						set dropdown_bookmark:onchange to { parameter c. set_bookmark(c). }.
						box_bookmark:addspacing(-1).
						
				
				local stack_pos is box_center:addstack().
					local box_pos is stack_pos:addvlayout().
						box_pos:addlabel("[W] North").
						box_pos:addlabel("[A] West").
						box_pos:addlabel("[S] South").
						box_pos:addlabel("[D] East").
						box_pos:addspacing(10).
						local g_pos_lat is box_pos:addlabel("Latitude: ").
						local g_pos_lng is box_pos:addlabel("Distance: ").
						box_pos:addspacing(10).
						local g_pos_distance is box_pos:addlabel("Distance: ").
						local g_pos_hdg is box_pos:addlabel("Heading: ").
						box_pos:addspacing(-1).
				
				local stack_follow is box_center:addstack().
					local box_follow is stack_follow:addvlayout().
						local box_follow_dropdown is box_follow:addhlayout().
							box_follow_dropdown:addlabel("TGT").
							
							local dropdown_target is box_follow_dropdown:addpopupmenu().
							set dropdown_target:style:width to 150.
							//set targetsInRange to sortTargets(). //get vessels in range
							//set targetsInRangeStr to targetStrings(targetsInRange). //get their names
							//set dropdown_target:options to targetsInRangeStr.
							//set dropdown_target:index to -1.
							
							//set dropdown_target:onclick to { 
							//	set targetsInRange to sortTargets(). 
							//	set targetsInRangeStr to targetStrings(targetsInRange).
							//	set dropdown_target:options to targetsInRangeStr. 
							//}.
							set dropdown_target:onchange to { parameter c. select_target(c). }.
						
						local box_target_distance is box_follow:addhlayout().
							local g_target_distance_label is box_target_distance:addlabel("Distance").
							set g_target_distance_label:style to style_label_compact.
							local g_target_distance_label_val is box_target_distance:addlabel("").
							set g_target_distance_label_val:style to style_label_compact_val.
						
						box_follow:addlabel("Follow distance:").
						local b_follow_dist is box_follow:addhlayout().
							local g_follow_dist is b_follow_dist:addhslider(0,0,100).
							set g_follow_dist:style:width to 145.
							local g_follow_dist_val is b_follow_dist:addlabel("0m").
							set g_follow_dist_val:style to style_label_compact_val.
							set g_follow_dist:onchange to { parameter val. set followDist to round(val,1). set g_follow_dist_val:text to followDist + "m".  }.
						
						box_follow:addlabel("Circling speed:").
						local b_circling is box_follow:addhlayout().
							local g_circling is b_circling:addhslider(0,0,50).
							set g_circling:style:width to 145.
							local g_circling_val is b_circling:addlabel("0m/s").
							set g_circling_val:style to style_label_compact_val.
							set g_circling:onchange to { parameter val. set rotateSpeed to round(val). set g_circling_val:text to rotateSpeed + "m/s".  }.
						
						box_follow:addspacing(-1).
				
				local stack_patrol is box_center:addstack().
					local box_patrol is stack_patrol:addvlayout().
						box_patrol:addlabel("Patrolling randomly").
						
						box_patrol:addlabel("Radius:").
						local b_patrol_radius is box_patrol:addhlayout().
							local g_patrol_radius is b_patrol_radius:addhslider(0,0,500).
							set g_patrol_radius:style:width to 140.
							local g_patrol_radius_val is b_patrol_radius:addlabel("0m").
							set g_patrol_radius_val:style to style_label_compact_val.
							set g_patrol_radius:onchange to { parameter val. set patrolRadius to round(val,1). set g_patrol_radius_val:text to patrolRadius + "m".  }.
						
						box_patrol:addlabel("Speed cap:").
						local b_patrol_speed is box_patrol:addhlayout().
							local g_patrol_speed is b_patrol_speed:addhslider(0,0,100).
							set g_patrol_speed:style:width to 140.
							local g_patrol_speed_val is b_patrol_speed:addlabel("0m/s").
							set g_patrol_speed_val:style to style_label_compact_val.
							set g_patrol_speed:onchange to { parameter val. set freeSpeed to round(val). set g_patrol_speed_val:text to freeSpeed + "m/s".  }.
							
						box_patrol:addspacing(-1).
				
				local stack_race is box_center:addstack().
					local box_race is stack_race:addvlayout().
						box_race:addlabel("RACE").
						box_race:addspacing(-1).
				
				
				// ### Options
				local stack_options is box_center:addstack().
					local box_options is stack_options:addvlayout().
					set box_options:style:margin:h to 0.
						
						local b_auto_dock is box_options:addcheckbox("Auto dock on low fuel",true).
							set b_auto_dock:style:fontsize to 12.
							set b_auto_dock:ontoggle to { parameter val. set autoFuel to val. }.
						local b_force_dock is box_options:addcheckbox("Stay docked",false).
							set b_force_dock:style:fontsize to 12.
							set b_force_dock:ontoggle to { parameter val. set forceDock to val. }.
						local b_auto_land is box_options:addcheckbox("Land on very low fuel",true).
							set b_auto_land:style:fontsize to 12.
							set b_auto_land:ontoggle to { parameter val. set autoLand to val. }.
						box_options:addspacing(10).
						box_options:addlabel("Vecdraw toggles:").
						local b_vd_terrain is box_options:addcheckbox("Terrain Prediction",false).
							set b_vd_terrain:style:fontsize to 12.
							set b_vd_terrain:ontoggle to { parameter val. toggleTerVec(val). }.
						
						local b_vd_velocity is box_options:addcheckbox("Velocity",false).
							set b_vd_velocity:style:fontsize to 12.
							set b_vd_velocity:ontoggle to { parameter val. toggleVelVec(val). }.
						local b_vd_thrust is box_options:addcheckbox("Engine Thrust Balance",false).
							set b_vd_thrust:style:fontsize to 12.
							set b_vd_thrust:ontoggle to { parameter val. toggleThrVec(val). }.
						local b_vd_attitude is box_options:addcheckbox("Attitude",false).
							set b_vd_attitude:style:fontsize to 12.
							set b_vd_attitude:ontoggle to { parameter val. toggleAccVec(val). }.
						box_options:addspacing(-1).
				
			//<<
			
			set activeMode to r_pos. //initial
			set activeStack to stack_pos. //initial
			box_center:showonly(stack_pos). //initial
			
			function selectMode { //this is called whenever a new mode is selected in the menu
				parameter gui_mode.
				if not stMark {
					set vecs[markHorV]:show to false.
					set vecs[markDesired]:show to false.
				}
				
				if gui_mode = r_landing {
					set activeStack to stack_landing.
					set mode to m_free.
					set submode to m_free.
					set doLanding to true.
					set freeSpeed to 0.
					set freeHeading to 90.
					set targetGeoPos to ship:geoposition.
					set vecs[markDestination]:show to false.
				}
				else if gui_mode = r_hover {
					set activeStack to stack_hover.
					set mode to m_hover.
					set submode to m_hover.
					set vecs[markDestination]:show to false.
				}
				else if gui_mode = r_free {
					set activeStack to stack_free.
					set mode to m_free.
					set submode to m_free.
					set doLanding to false.
					set freeSpeed to 0.
					set freeHeading to 90.
					set vecs[markHorV]:show to true.
					set vecs[markDesired]:show to true.
					set vecs[markDestination]:show to false.
				}
				else if gui_mode = r_bookmark {
					set activeStack to stack_bookmark.
					set mode to m_bookmark.
					set submode to m_pos.
					set dropdown_bookmark:index to 0.
					next_bookmark().
					set vecs[markDestination]:show to true.
					
				}
				else if gui_mode = r_pos {
					set activeStack to stack_pos.
					set targetGeoPos to ship:geoposition.
					set targetString to "LOCAL".
					set mode to m_pos.
					set submode to m_pos.
					set destinationLabel to targetString.
					set vecs[markDestination]:show to true.
					popup("Location submode").
				}
				else if gui_mode = r_follow {
					set activeStack to stack_follow.
					dropdown_target:clear().
					set targetsInRange to sortTargets(). //get vessels in range
					set targetsInRangeStr to targetStrings(targetsInRange). //get their names
					set dropdown_target:options to targetsInRangeStr.
					set dropdown_target:index to 0.
					
					set tarVeh to ship.
					if hastarget {
						if target:istype("Vessel") set tarVeh to target.
						else set tarVeh to target:ship.
						
						tarVeh:connection:sendmessage(list(1)). //request to be added to formation broadcast group
						
						set mode to m_follow.
						set submode to m_follow.
						if tarVeh:loaded { taggedPart(). }
						else { set tarPart to ship:rootpart. set destinationLabel to tarVeh:name. }
						popup("Following " + tarVeh:name).
						entry("Following " + tarVeh:name).
					}
					//else  {
					//	if lastTargetCycle + 5 < time:seconds { set targetsInRange to sortTargets(). set target_i to 0. popup(targetsInRange:length). } //update target list
					//	if targetsInRange:length > 0 {
					//		local counter is 0.
					//		local done is false.
					//		until done or counter = targetsInRange:length {
					//			if targetsInRange[target_i]:position:mag < 100000 {
					//				set done to true.
					//				set tarVeh to targetsInRange[target_i].
					//			}
					//			set target_i to target_i + 1.
					//			set counter to counter + 1.
					//			if target_i = targetsInRange:length set target_i to 0.
					//		}
					//		
					//	}
					//	
					//	set lastTargetCycle to time:seconds.
					//}
					//if not(tarVeh = ship) {
					//	
					//	
					//	set mode to m_follow.
					//	set submode to m_follow.
					//	if tarVeh:loaded { taggedPart(). }
					//	else { set tarPart to ship:rootpart. set destinationLabel to tarVeh:name. }
					//	popup("Following " + tarVeh:name).
					//	entry("Following " + tarVeh:name).
					//}
				}
				else if gui_mode = r_patrol {
					set activeStack to stack_patrol.
					set targetGeoPos to ship:geoposition.
					set patrolGeoPos to targetGeoPos.
					set mode to m_patrol.
					set submode to m_pos.
					set freeSpeed to min(speedlimitmax,30*TWR)/2.
					set destinationLabel to "Waypoint".
					set vecs[markDestination]:show to true.
				}
				else if gui_mode = r_race {
					set activeStack to stack_race.
					set mode to m_race.
					set submode to m_pos.
					set gravitymod to 1.2. //.80
					set thrustmod to 0.95. //.75
					set PID_pitch:kp to 100. 
					set PID_roll:kp to 100.
					set climbDampening to 0.3.
					setLights(1,0.5,0).
					popup("Race mode started").
					listGates().
					nextGate().
					set targetGeoPos to targetGate:geoposition.
					set targetString to targetGate:name.
					set destinationLabel to targetString.
					set vecs[markDestination]:show to false.
					//set vecs[markGate]:show to true.
					toggleVelVec(). 
				}
				
				if mode <> m_free {
					set doLanding to false.
					if not(stMark) {
						set vecs[markHorV]:show to false.
						set vecs[markDesired]:show to false.
					}
				}
				
				if not(mode = m_race) {
					set gravitymod to 1.2.
					set thrustmod to 0.92.
					set PID_pitch:kp to 75. //75
					set PID_roll:kp to 75. //75 
					set climbDampening to 0.15.
					set vecs[markGate]:show to false.
					setLights(0,1,0).
					
					set PID_hAcc to pidloop(1.6 * ipuMod,0,0.2 + 1 - weightRatio,0,90).
					set ang_vel_exponential to 0.5.
				} 
				else { 
					set PID_hAcc to pidloop(1.6 * ipuMod,0,0.1,0,90). //2.1  0.4 
					set ang_vel_exponential to 0.75.
				}
				
				for m in gearMods {
					if m:hasaction("extend/retract") m:doaction("extend/retract",false).
				}
				
				
				set tab_modes:pressed to true.
				
				if not activeStack:visible 
					box_center:showonly(activeStack).
				
				set activeMode to gui_mode.
				entry("Switched mode to " + gui_mode:text).
				
			}
			
			//### Box right stats
			local box_right is box_main:addvlayout().
			set box_right:style:margin:h to 0.
			set box_right:style:margin:v to 0.
			set box_right:style:padding:h to 5.
			set box_right:style:padding:v to 2.
			set box_right:style:width to 160.
				local box_height is box_right:addhlayout().
					local g_height_label to box_height:addlabel("Hover height").
					set g_height_label:style to style_label_compact.
					local g_height_label_val is box_height:addlabel("4.75m").
					set g_height_label_val:style to style_label_compact_val.
					
					//set g_height_label:style:width to 40.
				
				local box_alt is box_right:addhlayout().
					local g_min_alt_label is box_alt:addlabel("Min altitude").
					set g_min_alt_label:style to style_label_compact.
					local g_min_alt is box_alt:addtextfield("").
					set g_min_alt:style:width to 40.
					set g_min_alt:style:height to 18.
					set g_min_alt:onconfirm to { 
						parameter val.
						set val to val:tonumber(0).
						if val < 0 set val to 0.
						if val = 0 set g_min_alt:text to "".
						set minAlt to val.
					}.
				local box_speedlimit is box_right:addhlayout().
					local g_speedlimit_label is box_speedlimit:addlabel("Speedlimit").
					set g_speedlimit_label:style to style_label_compact.
					local g_speedlimit is box_speedlimit:addtextfield("300").
					set g_speedlimit:style:width to 40.
					set g_speedlimit:style:height to 18.
					set g_speedlimit:onconfirm to { 
						parameter val.
						set val to val:tonumber(0).
						if val < 0 set val to 0.
						if val = 0 set g_speedlimit:text to "".
					}.
				box_right:addspacing(10).
				local box_height_error is box_right:addhlayout().
					set box_height_error:style:height to 15.
					local g_height_error_label to box_height_error:addlabel("Height error").
					set g_height_error_label:style to style_label_compact.
					local g_height_error_label_val is box_height_error:addlabel("0m").
					set g_height_error_label_val:style to style_label_compact_val.
				local box_radar is box_right:addhlayout().
					set box_radar:style:height to 15.
					local g_radar_label to box_radar:addlabel("Radar height").
					set g_radar_label:style to style_label_compact.
					local g_radar_label_val is box_radar:addlabel("1.23m").
					set g_radar_label_val:style to style_label_compact_val.
				local box_groundspeed is box_right:addhlayout().
					set box_groundspeed:style:height to 15.
					local g_groundpspeed_label to box_groundspeed:addlabel("Ground speed").
					set g_groundpspeed_label:style to style_label_compact.
					local g_groundpspeed_label_val is box_groundspeed:addlabel("12m/s").
					set g_groundpspeed_label_val:style to style_label_compact_val.
				box_right:addspacing(10).
				local box_TWR is box_right:addhlayout().
					set box_TWR:style:height to 15.
					local g_TWR_label to box_TWR:addlabel("TWR (local)").
					set g_TWR_label:style to style_label_compact.
					local g_TWR_label_val is box_TWR:addlabel("5.75").
					set g_TWR_label_val:style to style_label_compact_val.
				local box_mass is box_right:addhlayout().
					set box_mass:style:height to 15.
					local g_mass_label to box_mass:addlabel("Drone mass").
					set g_mass_label:style to style_label_compact.
					local g_mass_label_val is box_mass:addlabel("1.756t").
					set g_mass_label_val:style to style_label_compact_val.
				local box_payload is box_right:addhlayout().
					set box_payload:style:height to 15.
					local g_payload_label to box_payload:addlabel("Payload").
					set g_payload_label:style to style_label_compact.
					local g_payload_label_val is box_payload:addlabel("0t").
					set g_payload_label_val:style to style_label_compact_val.
				box_right:addspacing(10).
				
				local button_box is box_right:addvbox().
					local b_cam is button_box:addbutton("Switch cam-mode").
						set b_cam:style:margin:v to 2.
						set b_cam:style:margin:h to 2.
						set b_cam:onclick to { toggleCamMode(). }.
					local b_stats is button_box:addbutton("Open vessel stats").
						set b_stats:style:margin:v to 2.
						set b_stats:style:margin:h to 2.
				
				box_right:addspacing(-1).
			
			local g_heightbox is box_main:addvlayout().
				set g_heightbox:style:padding:h to 0.
				set g_heightbox:style:padding:v to 0.
				set g_heightbox:style:margin:h to 0.
				set g_heightbox:style:margin:v to 0.
				set g_heightbox:style:width to 9.
				local g_height is g_heightbox:addvslider(4.75,30,0.5).
				set g_height:style:margin:h to 0.
				set g_height:onchange to { parameter val. set g_height_label_val:text to round(val,2) + "m". set tHeight to val. }.

		local box_log_container is box_all:addvlayout().
		set box_log_container:style:height to 200.
		set box_log_container:style:bg to "gui/terminal.png".
		
		set box_log_container:style:overflow:right to -18. // ! If overflow is negative, the background image will actually be moved inward, much like padding will move other content inwards. 
														   // I use this here to move the background image of the log away from the child scrollbox scrollbar
			local box_log is box_log_container:addscrollbox().
			set box_log:valways to true.
			set box_log:style:margin:v to 10.
			set box_log:style:margin:left to 5.
			set box_log:style:margin:right to 0.
			
			set box_log:style:padding:h to 15.
			set box_log:style:padding:v to 10.
			
			set box_log:style:bg to "gui/blank.png".
				box_log:addlabel("GUI initiated.").
//end of building the menu widgets
				

//when a string is passed to this function, a log entry will appear on the bottom of the log box. If more than 20 log entries exist, remove the oldest one.
function entry { 
	parameter msg.
	if box_log:widgets:length >= 20 box_log:widgets[0]:dispose().
	box_log:addlabel(msg).
	set box_log:position to v(0,1000,0).
}

function next_bookmark {
	set targetGeoPos to ship:geoposition. 
	set targetString to "DRONE POS".
	popup("Bookmark location: " + targetString).
	set destinationLabel to targetString.
	set dropdown_bookmark:text to targetString.
}
function set_bookmark {
	parameter bookmark_str.
	
	if bookmark_str = "DRONE POS" { set targetGeoPos to ship:geoposition. set targetString to "DRONE POS". }
	else if bookmark_str = "LAUNCHPAD" { set targetGeoPos to geo_bookmark("LAUNCHPAD"). set targetString to "LAUNCHPAD". }
	else if bookmark_str = "VAB" { set targetGeoPos to geo_bookmark("VAB"). set targetString to "VAB". }
	else if bookmark_str = "RUNWAY E" { set targetGeoPos to geo_bookmark("RUNWAY E"). set targetString to "RUNWAY E". }
	else if bookmark_str = "RUNWAY W" { set targetGeoPos to geo_bookmark("RUNWAY W"). set targetString to "RUNWAY W". }
	else if bookmark_str = "ISLAND W" { set targetGeoPos to geo_bookmark("ISLAND W"). set targetString to "ISLAND W". }
	else if bookmark_str = "POOL" { set targetGeoPos to geo_bookmark("POOL"). set targetString to "POOL". }
	else { set targetGeoPos to geo_bookmark("LAUNCHPAD"). set targetString to "LAUNCHPAD". }
	popup("Bookmark location: " + targetString).
	set destinationLabel to targetString.
	set dropdown_bookmark:text to targetString.
}
function select_target {
	parameter target_name.
	
	for t in targetsInRange {
		if t:name = target_name {
			set tarVeh to t.
			tarVeh:connection:sendmessage(list(1)). //request to be added to formation broadcast group
			
			set mode to m_follow.
			set submode to m_follow.
			if tarVeh:loaded { taggedPart(). }
			else { set tarPart to ship:rootpart. set destinationLabel to tarVeh:name. }
			popup("Following " + tarVeh:name).
			entry("Following " + tarVeh:name).
			break.
		}
	}
}

set tab_modes:pressed to true.
g:show(). //show the whole window when we get here

when exit then {
	g:dispose().
}
