frappe.listview_settings['Opportunity'] = {
	add_fields: ["customer_name", "opportunity_type", "opportunity_from", "status"],
	get_indicator: function(doc) {
		var indicator = [__(doc.status), frappe.utils.guess_colour(doc.status), "status,=," + doc.status];
		if(doc.status == "Open") {
			indicator[1] = "orange";
		} else if(doc.status == "Quotation") {
			indicator[1] = "blue";
		} else if (["Converted", "Closed"].includes(doc.status)) {
			indicator[1] = "green";
		} else if (doc.status == "Lost") {
			indicator[1] = "light-gray";
		} else if (doc.status == "Replied") {
			indicator[1] = "purple";
		} else if (doc.status == "To Follow Up") {
			indicator[1] = "light-blue";
		}
		return indicator;
	},
	onload: function(listview) {
		var method = "erpnext.crm.doctype.opportunity.opportunity.set_multiple_status";

		listview.page.add_action_item(__("Set as Open"), function() {
			listview.call_for_selected_items(method, {"status": "Open"});
		});

		listview.page.add_action_item(__("Set as Closed"), function() {
			listview.call_for_selected_items(method, {"status": "Closed"});
		});

		if(listview.page.fields_dict.opportunity_from) {
			listview.page.fields_dict.opportunity_from.get_query = function() {
				return {
					"filters": {
						"name": ["in", ["Customer", "Lead"]],
					}
				};
			};
		}
	}
};
