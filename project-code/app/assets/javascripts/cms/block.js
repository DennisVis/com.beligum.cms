
var cms = cms || {};
var cms = (function(e){var t = e || {};

t.blockModule = new (Class.extend
({
	
	//-----CONSTANTS-----

	//-----VARIABLES-----		


	
	//-----PRIVATE FUNCTIONS-----
	
	//-----PUBLIC FUNCTIONS-----
	createContent: function(contentType) {
		
		if (contentType == null || contentType == undefined) {
			contentType = cms.configModule.CLASS_CONTENT_EDITOR;
		}
		
		var newContent = $('<div/>');
		cms.coreModule.contentCount += 1;
		newContent.addClass(cms.configModule.CLASS_BLOCK);
		newContent.addClass(cms.configModule.CLASS_CONTENT);
		newContent.addClass(contentType);
		newContent.html('<p>&lt;THIS IS A NEW BLOCK&gt; <br/><br/> &lt;REPLACE THIS TEXT WITH SOMETHING MEANINGFUL&gt;</p>');
		cms.coreModule.setContentId(newContent);
		cms.registeringModule.registerDragDrop(newContent);
		
				
		Logger.debug("Content: new content created");
		return newContent;
	},
	
	isLastBlockInWindow: function(block) {
		var oldLayoutWindow = cms.configModule.LAYOUT_WINDOW;
		cms.coreModule.setLayoutWindowForBlock(block);
		var retVal = false;
		if (cms.configModule.LAYOUT_WINDOW.find("." + cms.configModule.CLASS_CONTENT).length == 1) {
			retVal = true;
		}
		cms.configModule.LAYOUT_WINDOW = oldLayoutWindow;
		return retVal;
	},
	
	
	getEditorInstance: function(content) {
		var id = content.attr('id');
		return CKEDITOR.instances[id];
	},

	
	isEditing: function(content) {
		// 	- has this block an editor connected?
		//  - has this editor focus
		// => then we are editing this block
		var retVal = false
		var instance = this.getEditorInstance(content);
		Logger.debug(' instance: ' + instance);
		Logger.debug(CKEDITOR.instances);
		if (!(instance == null || instance == undefined)) {
			Logger.debug(instance.focusManager);
			retVal = instance.focusManager.hasFocus;
		}
		Logger.debug('Are we editing this content?:' + retVal);
		return retVal;
	},
	
	//-----CONSTANTS-----
	MAX_COLUMNS: 12,

	//-----PRIVATE FUNCTIONS-----
	
	//-----PUBLIC FUNCTIONS-----
	
	// Add new row to a column
	//DEPRECATED
//	addRow: function(column, content) {
//		// if this row is the first row in the column or the other rows are from type content, 
//		// then add a content block
//		// else create a row that contains a column that contains a content block and add these
//		if (column.children().length == 0 || column.children(0).hasClass(cms.configModule.CLASS_CONTENT)) {
//			column.append(content);
//			Logger.debug('Column: Added row To column');
//		} else {
//			var newRow = cms.blockModule.createRow();
//			var newColumn = cms.blockModule.createColumn();
//			cms.blockModule.addColumnToRow(newRow, newColumn);
//			cms.blockModule.addContentToColumn(newColumn, content);
//			column.append(newRow);
//			Logger.debug('Column: Created new row with new Column and added to existing column');
//		}
//		
//		Logger.debug("LayoutWindow: added new row");
//	},
	
	// create new column that takes the full width
	createColumn: function() {
		var newColumn = $('<div/>');
		newColumn.addClass('span12');
		newColumn.addClass(cms.configModule.CLASS_BLOCK);
		newColumn.addClass(cms.configModule.CLASS_COLUMN);
		Logger.debug('Column: New column created');
		return newColumn;
	},
	
	

	
	
	addContentToColumn: function(column, content) {
		column.append(content);
		Logger.debug("Content: content added");
	},
	
	addColumnToRow: function(row, column) {
		row.append(column);
		Logger.debug("Row: column added to row");
	},
	
	// add a column before or after an existing column
	// We can add max 12 columns to a row
	// calculate the size for x columns (new column included) and set the width of all columns
	addColumnToColumn: function(column, newColumn, position) {
		var row = column.parent();
		var count = row.children('.' + cms.configModule.CLASS_COLUMN).length;
		if (count < 12) {
			// adapt width existing columns - distribute width equally
			var size = Math.floor(12 / (count + 1));
			var mySize = 12 - (size * count);
			$.each(row.children('.' + cms.configModule.CLASS_COLUMN), function(index, tColumn) {
				cms.blockModule.setWidthToColumn($(tColumn), size);
			});
			this.setWidthToColumn(newColumn,mySize);
		} else {
			Logger.debug("wanted to add column but already 12 columns present.");
		}

		if (position == cms.configModule.SIDE_LEFT) {
			column.before(newColumn);
			Logger.debug('Column: added column before existing column')
		} else if (position == cms.configModule.SIDE_RIGHT) {
			column.after(newColumn);
			Logger.debug('Column: added column after existing column')
		} else {
			Logger.error("Column: unknown drop side. This should not be possible");
		}	
		
	},
	
	// resize two columns
	// resizeWidth adds to the left column and takes from the right column
	// negative resizeWidth takes from the left
	resizeTwoColumns: function(columnLeft, columnRight, resizeWidth) {
		var columnLeftWidth = this.getWidthFromColumn(columnLeft.get(0));
		var columnRightWidth = this.getWidthFromColumn(columnRight.get(0));
		
		// Do not resize more than possible
		if ((resizeWidth < 0 && Math.abs(resizeWidth) < columnLeftWidth) || 
				(resizeWidth > 0 && resizeWidth < columnRightWidth)) {
			Logger.debug("resize columns with width: " + resizeWidth);
			columnLeftWidth += resizeWidth;
			columnRightWidth -= resizeWidth;
			this.setWidthToColumn(columnLeft, columnLeftWidth);
			this.setWidthToColumn(columnRight, columnRightWidth);
			Logger.debug('Column: columns resized');
		} else {
			Logger.debug('Column: columns could not be resized');
		}
	},
	
	// distributes width of columns equally inside a row, 
	// if a perfect divison is not possible the first column will take the space that's left
	// e.g. 5 columns 1st column will have width 4, other 4 columns will have width of 2
	distributeWidthColumns: function(row) {	
		if (row.children('.' + cms.configModule.CLASS_COLUMN).first().hasClass(cms.configModule.CLASS_COLUMN)) {
			// Count total width of columns. This should be 12
			var count = 0;
			$.each(row.children('.' + cms.configModule.CLASS_COLUMN), function(index, column) {
				count = count + cms.blockModule.getWidthFromColumn(column);
			});
			if (count != 12) {
				// adapt width existing columns - distribute width equally
				var size = Math.floor(12 / row.children('.' + cms.configModule.CLASS_COLUMN).length);
				var extraSize = 12 - (size * row.children('.' + cms.configModule.CLASS_COLUMN).length);
				$.each(row.children('.' + cms.configModule.CLASS_COLUMN), function(index, tColumn) {
					cms.blockModule.setWidthToColumn($(tColumn), size);
				});
				if (extraSize > 0) {
					cms.blockModule.setWidthToColumn(row.children('.' + cms.configModule.CLASS_COLUMN).first(), extraSize);
				}
				Logger.debug("Column: evenly distributed width of columns");
			}
			
		}
		
	},
	
	setWidthToColumn: function(column, newWidth) {
		column[0].className = column[0].className.replace(/\bspan\d+/g, '');
		column.addClass('span'+newWidth);
		
		
		Logger.debug("Column: changing size");
	},
	
	getWidthFromColumn: function(column) {
		var widths = column.className.match(/\bspan\d+/g, '');
		if (widths != null && widths.length > 0) {
			var nr = widths[0].substring(4, widths[0].length);
			return parseInt(nr);
		} else {
			Logger.error("Column. Could not get width of column");
			return 0;
		}
	},
	
	createRow: function() {
		var newRow = $('<div/>');
		newRow.addClass('row-fluid');
		newRow.addClass(cms.configModule.CLASS_BLOCK);
		newRow.addClass(cms.configModule.CLASS_ROW);
		
		Logger.debug("Row: new row created");
		return newRow;
	}


	
	}
));

return t;})(cms);