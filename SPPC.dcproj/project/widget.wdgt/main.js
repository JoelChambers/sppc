/* This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details. */

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
var mydir = '';
var csv_file = '';
var scroll_area = '';
var product_parts = '';

var vat = 23;
var margin = 0;
var shipping = 10;
var exchange_rate = 1;

function load()
{
	dashcode.setupParts();
	scroll_area = document.getElementById('scrollArea');
	
	var d = new Date();
	mydir = widget.system("dirname '"+location.pathname+"'", null).outputString.trim();
	csv_file = mydir + '/parts.csv';
	
	try {
		var o = widget.system("stat -f '%c' " + csv_file, null);
		d.setTime(parseInt(o.outputString.trim())*100);
		var db_date = d.getDate() + '.' + d.getMonth() + '.' + d.getYear();
	} catch (e) {
		alert(o.errorString);
		return false;
	}
	
	load_products();
		
}

function load_products()
{
	var p = widget.system('awk -F "\t" \'{print $1}\' '+csv_file + ' | uniq', null);
	var p = p.outputString.trim().split("\n");
	var products = new Array(['Select product...', 0]);
	
	for (var i = 0; i < p.length; i++) {
		prod = p[i];
		products.push([prod, prod]);
	}
	
	var popup = document.getElementById('popup');
	popup.object.setOptions(products);
		
	var o = widget.system("wc -l " + csv_file + " | awk '{print $1}'", null);
	$('#search').attr('placeholder', o.outputString.trim()+ ' parts');
	document.getElementById('search').disabled = false;
	$('#search').val('');
	
	// clicking a part number puts it on the clipboard
	$('#front td').live('click', function() {
		widget.system("/bin/echo '" + $(this).text() + "' | /usr/bin/pbcopy", null);
	});
	
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
	// Stop any timers to prevent CPU usage
	// Remove any preferences as needed
	// widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
	// Stop any timers to prevent CPU usage
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
		
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
	// Retrieve any preference values that you need to be synchronized here
	// Use this for an instance key's value:
	// instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
	//
	// Or this for global key's value:
	// globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
	$('#tax_field').val(widget.preferenceForKey('vat'));
	$('#shipping_field').val(widget.preferenceForKey('shipping'));
	$('#margin_field').val(widget.preferenceForKey('margin'));
	$('#rate_field').val(widget.preferenceForKey('rate'));
	
	var front = document.getElementById("front");
	var back = document.getElementById("back");

	if (window.widget) {
		widget.prepareForTransition("ToBack");
	}

	front.style.display = "none";
	back.style.display = "block";

	if (window.widget) {
		setTimeout('widget.performTransition();', 0);
	}
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
	var vat = document.getElementById('tax_field').value;
	widget.setPreferenceForKey(vat, 'vat');
	
	var shipping = document.getElementById('shipping_field').value;
	widget.setPreferenceForKey(shipping, 'shipping');
	
	var margin = document.getElementById('margin_field').value;
	widget.setPreferenceForKey(margin, 'margin');
	
	var rate = document.getElementById('rate_field').value;
	widget.setPreferenceForKey(rate, 'rate');
	
	var front = document.getElementById("front");
	var back = document.getElementById("back");

	if (window.widget) {
		widget.prepareForTransition("ToFront");
	}

	front.style.display="block";
	back.style.display="none";

	if (window.widget) {
		setTimeout('widget.performTransition();', 0);
	}
}

if (window.widget) {
	widget.onremove = remove;
	widget.onhide = hide;
	widget.onshow = show;
	widget.onsync = sync;
}

function list_parts(o)
{
	scroll_area.object.content.innerHTML = '';
	
	var parts = o.outputString.trim().split("\n");
	var rows = '';
	
	var vat = parseInt(widget.preferenceForKey('vat'));
	vat = parseFloat('1.'+vat);
	
	var rate = parseFloat(widget.preferenceForKey('rate'));
	var margin = parseFloat(widget.preferenceForKey('margin'));
	var shipping = parseFloat(widget.preferenceForKey('shipping'));
	
	document.getElementById('search').placeholder = parts.length + ' parts found';
	
	for (var i = 0; i < parts.length; i++)
	{
		var p = parts[i].split('|');
		
		var number = p[0];
		var description = p[1];
		var stock = parseFloat(p[2]);
		var exchange = parseFloat(p[3]);
		
		var stock_price = 0;
		var	ex_price = 0;
		
		// calculate stock price, if given
		if (stock > 0) {
			stock_price = ((stock*100)/(100-margin)+shipping)*rate;
			stock_price = Math.ceil(stock_price*vat);
		} else {
			stock_price = '-';
		}
		
		if (exchange > 0) {
			ex_price = ((exchange*100)/(100-margin)+shipping)*rate;
			ex_price = Math.ceil(ex_price*vat);
		} else {
			ex_price = '-';
		}
		
		rows += '<tr><td>'+number+'</td><td>'+description+'</td><td>'+ex_price+'</td><td>'+stock_price+'</td></tr>';
	
	}
	
	var html = '<table><thead><tr><th class="number">Part #</th><th>Description</th><th class="price">Exchg</th><th class="price">Stock</th></tr></thead><tbody id="search_list">';
	scroll_area.object.content.innerHTML = html+rows+'</tbody></table>';
	scroll_area.object.refresh();
	
}

function select_product(event)
{
	var val = event.target.value;
	
	if (val == 0) {
		return false;
	}
	
	// clean up product name for awk
	p = val.replace(/([+\\(\\)\\/])/g, '\\$1')
	
	widget.system("awk '/^" + p + "\t/' " + csv_file + ' | awk -F "\t" \'{printf("%s|%s|%f|%f\\n",$2,$3,$7,$8)}\'', list_parts);

}

function filter_table()
{
  var rex = new RegExp($('#search_query').val(), 'i');
	$('#search_list tr').hide();
	$('#search_list tr').filter(function() {
    return rex.test($(this).text());
  }).show();
	scroll_area.object.refresh();
  return false;
}


function filter_parts(event)
{
	var rex = new RegExp(event.target.value, 'i');
	$('#search_list tr').hide();
	$('#search_list tr').filter(function() {
    return rex.test($(this).text());
  }).show();
  return false;
}

// Assign this handler to the ondrop event
// on a drop target on your widget's interface
function dragDrop(event)
{
	try {
		var uriString = event.dataTransfer.getData("text/uri-list");	
		var uriList = uriString.split("\n");
		var df = uriList[0].substr(16);
		// filter out vintage parts
		widget.system('iconv -f UTF-16LE '+df+' | grep -v ^~ | tail +2 > '+csv_file, null);
		load_products();
		
	} catch (ex) {
		alert("Problem fetching URI: " + ex);
	}
	
	scroll_area.object.innerHTML = '';
	scroll_area.object.refresh();
	
	event.stopPropagation();
	event.preventDefault();
	
}

// Be sure to assign these handlers for the ondragenter
// and ondragover events on your drop target
// These handlers prevent Web Kit from processing 
// drag events so you can handle the drop when it occurs
function dragEnter(event)
{
	event.stopPropagation();
	event.preventDefault();
}

function dragOver(event)
{
	event.stopPropagation();
	event.preventDefault();
}
