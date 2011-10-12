var jQuery;(function(context, $) { // closure declaration; var jQuery for JSLint

'use strict'; // strict ECMAScript interpretation

///////////////////////////////////////////////////////////////////////////////
// Constructors and utility functions. Utility functions are specifically meant
// NOT to be methods of the Muster object.
///////////////////////////////////////////////////////////////////////////////


// Constructor
function Muster(args) {
  if (args) {
    this.url = args.url;
    this.database = args.database;
  }
}

// Constructor wrapper.
// Whether called as a function or a constructor, it always returns an instance
// of Muster, i.e. `Muster` and `new Muster()` are equivalent.
function constructorWrapper(args) {
  return new Muster(args);
}

// Assemble the request URI
function getRequestUri(url, database, params) {

  // Add database to parameters
  params.database = database;

  // assemble the parameters
  var parameterPairs = [];
  $.each([
         'database', 'select', 'from', 'where', 'order'
  ], function() {
    if (params[this] !== null && params[this].length > 0) {
      parameterPairs.push( [this, window.escape(params[this])].join('=') );
    }
  });
  parameterPairs.push('callback=?'); // jQuery JSONP support

  return [url, '?', parameterPairs.join('&')].join('');
}

// Return a copy of the table which supports stable sorting when the table's
// column headings are clicked.
function getSortableTable(table) {
  table.find('th').css({cursor: 'pointer'}).click(function(event) {

    var th = $(event.target),
        table = th.closest('table'),
        tbody = table.find('tbody'),
        index = th.index() + 1,
        rows = table.find('tbody tr');

    tbody.append(rows.msort(function(left, right) {

      left  =  $(left).find('td:nth-child(' + index + ')').text().toLowerCase();
      right = $(right).find('td:nth-child(' + index + ')').text().toLowerCase();

      if      (left < right)   { return -1; }
      else if (left === right) { return 0;  }
      else                     { return 1;  }
    }));
  });
  return table;
}

// expose Muster constructor as method of context (i.e. window.Muster). It's
// not capitalized because it's a method that returns an instance of Muster.
// The Muster constructor should never be called directly.
context.muster = constructorWrapper;

///////////////////////////////////////////////////////////////////////////////
// Muster's prototype
// All public methods are defined here.
///////////////////////////////////////////////////////////////////////////////
Muster.prototype = {

  query: function(query, callback) {
    var muster = this;
    $.getJSON(getRequestUri(this.url, this.database, query), function(data) {
      muster.columns = data.columns;
      muster.results = data.results;
      callback.apply(muster);
    });
  },

  isEmpty: function() {
    return this.results.length < 1;
  },

  clone: function() {

    var oldMuster = this,
        newMuster = constructorWrapper(),
        property;

    for (property in oldMuster) {
      if (oldMuster.hasOwnProperty(property)) {
        newMuster[property] = oldMuster[property];
      }
    }
    return newMuster;
  },

  filter: function(column, value) {

    var clone = this.clone();

    clone.results = $.grep(this.results, function(row) {
      return row[column] === value;
    });

    return clone;
  },

  get: function(column) {
    var ret = [];
    $.each(this.results, function() {
      ret.push(this[column]);
    });
    return ret;
  },

  getUnique: function(column) {
    return $.unique(this.get(column));
  },

  getFirst: function(column) {
    return this.results[0][column];
  },

  groupBy: function(column) {

    // ret is an array of arrays. Each array in ret shares the same value for
    // row[column]. uniq keeps track of whether we've encountered a value
    // before so we only traverse the results once.
    var ret = [],
        uniq = [],
        muster = this;

    $.each(this.results, function() {
      var i = uniq.indexOf(this[column]);
      if (i < 0) {
        uniq.push(this[column]);
        i = uniq.length - 1;
        ret[i] = muster.clone();
        ret[i].results = [];
      }
      ret[i].results.push(this);
    });
    return ret;
  },

  // TODO comment this and maybe refactor. Using .groupBy then iterating over
  // the list again is not the most efficient technique possible, but, again,
  // performance vs. readability... It seems pretty fast.
  serializeJoinedResults: function(uniqueColumn) {

    var grouped = this.groupBy(uniqueColumn),
        columns = grouped[0].columns,
        clone = this.clone();

    clone.results = [];

    columns.splice(grouped[0].columns.indexOf(uniqueColumn), 1);
    $.each(grouped, function() {
      var mergedRow = {};
      $.each(this.results, function() {
        var row = this;
        $.each(columns, function() {
          if (mergedRow[this] === undefined) {
            mergedRow[this] = row[this];
          }
          else if (typeof mergedRow[this] === 'string') {
            if (mergedRow[this] !== row[this]) {
              mergedRow[this] = [row[this]];
            }
          }
          else {
            mergedRow[this].push(row[this]);
          }
        });
      });
      clone.results.push(mergedRow);
    });

    return clone;
  },

  toTable: function(columnSpec) {

    var columns,
        columnLabels,
        table = $('<table><thead><tr></tr></thead><tbody></tbody></table>'),
        thead = table.find('thead tr'),
        tbody = table.find('tbody');

    if (!columnSpec) {
      columns = columnLabels = this.columns;
    }
    else {
      columns = [];
      columnLabels = [];
      $.each(columnSpec, function() {
        columns.push(this[0]);
        columnLabels.push(this[1]);
      });
    }

    $.each(columnLabels, function() {
      thead.append('<th>' + this);
    });

    $.each(this.results, function() {

      var row = this,
          tr = $('<tr>');

      tbody.append(tr);
      $.each(columns, function() {
        var text;

        // formatting function
        if (typeof this === 'function') {
          text = this.apply(row);
        }
        // multiple values
        else if (row[this] instanceof Array) {
          text = row[this].join('</li><li>');
          text = '<ul><li>' + text + '</li></ul>';
        }
        // just a string
        else {
          text = row[this];
        }
        tr.append('<td>' + text);
      });
    });
    return getSortableTable(table);
  }
};

// Add Array.indexOf to browsers that don't have it (i.e. IE)
(function() {
  if (!Array.indexOf) {
    Array.prototype.indexOf = function(obj) {
      var i, len;
      for (i = 0, len = this.length; i < len; i += 1) {
        if (this[i] === obj) {
          return i;
        }
      }
      return -1;
    };
  }
}());

// Add stable merge sort to Array and jQuery prototypes
var MergeSort = function() {};
MergeSort.prototype = {

  msort: function(compare) {

    var length = this.length,
        middle = Math.floor(length / 2);

    if (!compare) {
      compare = function(left, right) {
        if (left < right) {
          return -1;
        }
        if (left === right) {
          return 0;
        }
        else {
          return 1;
        }
      };
    }

    if (length < 2) {
      return this;
    }

    function merge(left, right, compare) {

      var result = [];

      while (left.length > 0 || right.length > 0) {
        if (left.length > 0 && right.length > 0) {
          if (compare(left[0], right[0]) <= 0) {
            result.push(left[0]);
            left = left.slice(1);
          }
          else {
            result.push(right[0]);
            right = right.slice(1);
          }
        }
        else if (left.length > 0) {
          result.push(left[0]);
          left = left.slice(1);
        }
        else if (right.length > 0) {
          result.push(right[0]);
          right = right.slice(1);
        }
      }
      return result;
    }

    return merge(
      this.slice(0, middle).msort(compare),
      this.slice(middle, length).msort(compare),
      compare
    );
  }
};
Array.prototype.msort = jQuery.fn.msort = MergeSort.prototype.msort;

}(window, jQuery)); //closure and invocation

/*jslint browser: true, white: true*/

