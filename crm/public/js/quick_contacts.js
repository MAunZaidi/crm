frappe.provide("crm");

crm.QuickContacts = class QuickContacts extends frappe.ui.form.Controller {
	onload() {
		this.setup_contact_no_fields();
	}

	contact_person() {
		this.get_contact_details();
	}
	secondary_contact_person() {
		this.get_contact_details("secondary_");
	}

	get_contact_details(prefix) {
		let me = this;

		if (!prefix) {
			prefix = "";
		}
		let contact_fieldname = prefix + "contact_person";
		let display_fieldname = prefix + "contact_display";
		let contact = me.frm.doc[contact_fieldname];

		let lead = frappe.dynamic_link.doctype == "Lead" ? me.frm.doc[frappe.dynamic_link.fieldname] : null;

		if (contact || lead) {
			me.set_dynamic_link();
			return frappe.call({
				method: "crm.crm.utils.get_contact_details",
				args: {
					contact: contact || "",
					lead: lead,
					get_contact_no_list: 1,
					link_doctype: frappe.dynamic_link.doctype,
					link_name: me.frm.doc[frappe.dynamic_link.fieldname]
				},
				callback: function (r) {
					if (r.message) {
						$.each(r.message || {}, function (k, v) {
							var key_item = `${prefix}${k}`;
							if (me.frm.get_field(key_item)) {
								me.frm.doc[key_item] = v;
								me.frm.refresh_field(key_item);
							}
						});
						me.setup_contact_no_fields(r.message.contact_nos);
					}
				}
			});
		} else {
			me.frm.set_value(display_fieldname, "");
		}
	}

	contact_mobile() {
		this.get_contact_from_number();
	}

	secondary_contact_mobile() {
		this.get_contact_from_number("secondary_");
	}

	get_contact_from_number(prefix) {
		if (!prefix) {
			prefix = "";
		}
		let mobile_field = prefix + "contact_mobile";
		let contact_field = prefix + "contact_person";

		if (this.add_new_contact_number("contact_mobile", 'is_primary_mobile_no', prefix)) {
			return;
		}

		let tasks = [];

		let mobile_no = this.frm.doc[mobile_field];
		if (mobile_no) {
			let contacts = frappe.contacts.get_contacts_from_number(this.frm, mobile_no);
			if (contacts && contacts.length && !contacts.includes(this.frm.doc[contact_field])) {
				tasks = [
					() => this.frm.doc[contact_field] = contacts[0],
					() => this.frm.trigger(contact_field),
					() => {
						this.frm.doc[mobile_field] = mobile_no;
						this.frm.refresh_field(mobile_field);
					},
				];
			}
		}

		tasks.push(() => {
			if (this.frm.doc.contact_mobile_2 == this.frm.doc.contact_mobile) {
				this.frm.doc.contact_mobile_2 = '';
				this.frm.refresh_field('contact_mobile_2');
			}
		});

		return frappe.run_serially(tasks);
	}


	contact_mobile_2() {
		this.add_new_contact_number('contact_mobile_2', 'is_primary_mobile_no');
	}

	contact_phone() {
		this.add_new_contact_number('contact_phone', 'is_primary_phone');
	}

	add_new_contact_number(number_field, number_type, prefix) {
		if (!prefix) {
			prefix = "";
		}
		let mobile_field = prefix + number_field;
		let mobile_no = this.frm.doc[mobile_field];
		let contact_field = prefix + "contact_person";
		let display_field = prefix + "contact_display";

		if (mobile_no == __("[Add New Number]")) {
			this.set_dynamic_link();
			frappe.contacts.add_new_number_dialog(this.frm, mobile_field,
				contact_field, display_field, number_type,
				(phone) => {
					return frappe.run_serially([
						() => this.get_all_contact_nos(),
						() => this.frm.set_value(mobile_field, phone)
					]);
				}
			);

			this.frm.doc[mobile_field] = "";
			this.frm.refresh_field(mobile_field);

			return true;
		}
	}

	setup_contact_no_fields(contact_nos) {
		this.set_dynamic_link();

		if (contact_nos) {
			frappe.contacts.set_all_contact_nos(this.frm, contact_nos);
		}

		frappe.contacts.set_contact_no_select_options(this.frm, 'contact_mobile', 'is_primary_mobile_no', true);
		frappe.contacts.set_contact_no_select_options(this.frm, 'contact_mobile_2', 'is_primary_mobile_no', true);
		frappe.contacts.set_contact_no_select_options(this.frm, 'contact_phone', 'is_primary_phone', true);

		frappe.contacts.set_contact_no_select_options(this.frm, 'secondary_contact_mobile', 'is_primary_mobile_no', true);
	}

	get_all_contact_nos() {
		this.set_dynamic_link();
		return frappe.run_serially([
			() => frappe.contacts.get_all_contact_nos(this.frm, frappe.dynamic_link.doctype,
				this.frm.doc[frappe.dynamic_link.fieldname]),
			() => this.setup_contact_no_fields()
		]);
	}
};
