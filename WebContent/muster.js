/*!
 * Muster v1.7.2
 * http://apps.education.ucsb.edu/redmine/projects/muster
 *
 * Copyright 2011, Justin Force
 * Licensed under the BSD 3-Clause License
 *
 * Includes "Merge Sort in JavaScript"
 */

/*jslint browser: true, indent: 2 */
/*global jQuery */

// Merge Sort

/*!
 * Merge Sort in JavaScript v1.0
 * http://github.com/sidewaysmilk/merge-sort
 *
 * Copyright (c) 2011, Justin Force
 * Licensed under the BSD 3-Clause License
 */

/*jslint browser: true, indent: 2 */
/*global jQuery */

(function () {

  'use strict';

  // Add stable merge sort method to Array prototype
  //
  if (!Array.mergeSort) {
    Array.prototype.mergeSort = function (compare) {

      var length = this.length,
        middle = Math.floor(length / 2);

      // define default comparison function if none is defined
      //
      if (!compare) {
        compare = function (left, right) {
          if (left  <  right) {
            return -1;
          } else if (left === right) {
            return 0;
          } else {
            return 1;
          }
        };
      }

      if (length < 2) {
        return this;
      }

      // merge left and right arrays using comparison function `compare`
      //
      function merge(left, right, compare) {

        var result = [];

        while (left.length > 0 || right.length > 0) {
          if (left.length > 0 && right.length > 0) {
            if (compare(left[0], right[0]) <= 0) {
              result.push(left[0]);
              left = left.slice(1);
            } else {
              result.push(right[0]);
              right = right.slice(1);
            }
          } else if (left.length > 0) {
            result.push(left[0]);
            left = left.slice(1);
          } else if (right.length > 0) {
            result.push(right[0]);
            right = right.slice(1);
          }
        }
        return result;
      }

      return merge(
        this.slice(0, middle).mergeSort(compare),
        this.slice(middle, length).mergeSort(compare),
        compare
      );
    };
  }

  // Add merge sort to jQuery if it's present
  //
  if (window.jQuery !== undefined) {
    jQuery.fn.mergeSort = function (compare) {
      return jQuery(Array.prototype.mergeSort.call(this, compare));
    };
    jQuery.mergeSort = function (array, compare) {
      return Array.prototype.mergeSort.call(array, compare);
    };
  }

}());


// Muster
//
(function (context, $) {

  'use strict'; // strict ECMAScript interpretation



  // Constants
  //
  var POSSIBLE_PARAMETERS = [ 'database', 'select', 'from', 'where', 'order' ],
    DEFAULT_URL = 'https://apps.education.ucsb.edu/muster/';

  ///////////////////////////////////////////////////////////////////////////////
  // Constructors and utility functions. Utility functions are specifically meant
  // NOT to be methods of the Muster object.
  ///////////////////////////////////////////////////////////////////////////////

  // Constructor
  //
  function Muster(args) {

    if (isString(args)) {
      this.database = args;
    } else if (args !== undefined) {
      this.url = args.url;
      this.database = args.database;
    }

    if (this.url === undefined) {
      this.url = DEFAULT_URL;
    }
  }

  // Constructor wrapper.
  // Whether called as a function or a constructor, it always returns an instance
  // of Muster, i.e. `Muster` and `new Muster()` are equivalent.
  //
  function constructorWrapper(args) {
    return new Muster(args);
  }

  // Assemble the request URI
  //
  function getRequestUri(url, database, params) {

    // each value is [ 'key', 'value' ] and will become 'key=value'
    var parameterPairs = [];

    // Add database to parameters
    params.database = database;

    // assemble the parameters
    $.each(POSSIBLE_PARAMETERS, function () {
      if (params[this] !== undefined && params[this].length > 0) {
        parameterPairs.push([this, window.escape(params[this])].join('='));
      }
    });
    parameterPairs.push('callback=?'); // jQuery JSONP support

    return [url, '?', parameterPairs.join('&')].join('');
  }

  // Return true if obj is a String
  //
  function isString(obj) {

    // XXX We use both typeof and instance of to cover this weird bug
    // in IE and Safari where reloading the page makes these things
    // Strings instead of strings. O_o
    //
    return (typeof obj === 'string' || obj instanceof String);
  }

  /* Return a copy of the table which supports stable sorting when the table's
   * column headings are clicked.
   *
   * Triggers the $(window).bind('muster_sorted') event after sorting.
   *
   * N.B. If table contents are modified after the table is sorted, sorting and
   *      reverse sorting by clicking the same heading multiple times WILL NOT
   *      correctly sort based on the new content. Sorting again by the same
   *      column just reverses the rows. This has the dual benefits of being
   *      efficient and maintaining a stable sort. If, in the future, Muster
   *      needs to handle sorting a table after data has been modified
   *      dynamically, all of the headings should be stripped of their 'sort'
   *      and 'rsort' classes (i.e.
   *      th.removeClass('sorted').removeClass('rsorted')) BEFORE sorting is
   *      performed to ensure a new sort is performed and that the order isn't
   *      simply reversed.
   */
  function getSortableTable(table) {
    table.find('th').css({cursor: 'pointer'}).click(function (event) {

      var sortedRows,
        th = $(event.target),             // the heading that was clicked
        table = th.closest('table'),
        tbody = table.find('tbody'),
        index = th.index() + 1,           // the numerical position of the clicked heading
        rows = table.find('tbody tr'),
        sorted = th.hasClass('sorted'),   // is the column already sorted?
        rsorted = th.hasClass('rsorted'); // is the column already reverse sorted?

      // Remove sort statuses from all other headings
      //
      th.siblings().removeClass('sorted').removeClass('rsorted');

      // If it's already sorted, the quickest solution is to just reverse it.
      // Otherwise, do a stable merge sort of the unsorted column and mark it
      // as sorted.
      //
      if (sorted || rsorted) {
        th.toggleClass('sorted').toggleClass('rsorted');
        sortedRows = Array.prototype.reverse.apply(rows);
      } else {
        sortedRows = rows.mergeSort(function (left, right) {

          // compare the text of each cell, case insensitive
          //
          left  =  $(left).find('td:nth-child(' + index + ')').text().toLowerCase();
          right = $(right).find('td:nth-child(' + index + ')').text().toLowerCase();

          if (left  <  right) {
            return -1;
          } else if (left === right) {
            return 0;
          } else {
            return 1;
          }
        });

        th.toggleClass('sorted');
      }

      tbody.append(sortedRows);

      $(window).trigger('muster_sorted');

    });
    return table;
  }

  // Expose Muster constructor as method of 'context' (i.e. window.Muster). It's
  // not capitalized because it's a method of 'context' that returns an instance
  // of Muster. The Muster constructor should never be called directly.
  //
  context.muster = constructorWrapper;



  ///////////////////////////////////////////////////////////////////////////////
  // Muster's prototype
  // All public methods are defined here.
  ///////////////////////////////////////////////////////////////////////////////
  //
  Muster.prototype = {

    query: function (query, callback) {
      var muster = this;
      $.getJSON(getRequestUri(this.url, this.database, query), function (data) {
        muster.columns = data.columns;
        muster.results = data.results;
        callback.apply(muster);
      });
    },

    // Return true if there are no results
    //
    isEmpty: function () {
      return this.results.length < 1;
    },

    // Return a new copy of this Muster
    //
    clone: function () {

      var property,
        oldMuster = this,
        newMuster = constructorWrapper();

      for (property in oldMuster) {
        if (oldMuster.hasOwnProperty(property)) {
          newMuster[property] = oldMuster[property];
        }
      }
      return newMuster;
    },

    /*
     * Return a copy of this Muster containing only the results for which
     * `filterFunction` returns true.
     *
     * In `filterFunction`, `this` refers to the current row, so to return all
     * of the results for which the first_name field starts with "R", you might
     * do
     *
     *    myResults.filter(function () {
     *      return this.first_name.indexOf('R') === 0;
     *    });
     */
    filter: function (filterFunction) {

      var clone = this.clone();

      clone.results = $.grep(this.results, function (row) {
        return filterFunction.call(row);
      });

      return clone;
    },

    /*
     * Return an array of Musters where each row shares the same value for the
     * `column` passed in.
     *
     * e.g. if your current Muster.results looked like 
     *
     *   myResults = [
     *     {id: 7, name: 'Bob'},
     *     {id: 7, name: 'Sue'},
     *     {id: 9, name: 'Fred'},
     *     {id: 9, name: 'Bob'},
     *   ];
     *
     * then `myResults.groupBy('id');` would yield
     *
     *   [
     *     [
     *       {id: 7, name: 'Bob'},
     *       {id: 7, name: 'Sue'}
     *     ],
     *     [
     *       {id: 9, name: 'Fred'},
     *       {id: 9, name: 'Bob'}
     *     ]
     *   ]
     */
    groupBy: function (column) {

      var ret = [],
        uniq = [],
        muster = this;

      // XXX If we have not encountered this value before, we record its
      // occurrence and create a Muster clone, then set its results to an
      // empty array. If we have seen this value before, we simply push it
      // into the array
      //
      $.each(this.results, function () {
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

    /*
     * Return a modified Muster which joins together similar rows based on
     * `uniqueColumn` (usually something like "id"). Columns with multiple
     * values become nested.
     * 
     * Say we have a Muster that looks like this:
     *
     *   myMuster.results = [
     *     { "id": "2", "friend": "Bob",   "pubtitle": "Jump Up",       "pubyear": "2006" },
     *     { "id": "2", "friend": "Bob",   "pubtitle": "Sit Down",      "pubyear": "2008" },
     *     { "id": "2", "friend": "Bob",   "pubtitle": "Backflips",     "pubyear": "2008" },
     *     { "id": "2", "friend": "Doug",  "pubtitle": "Fly Fishing",   "pubyear": "2010" },
     *     { "id": "3", "friend": "Sue",   "pubtitle": "Old Times",     "pubyear": "2009" },
     *     { "id": "3", "friend": "Sue",   "pubtitle": "Rocking Horse", "pubyear": "2009" },
     *     { "id": "3", "friend": "Daisy", "pubtitle": "Bolts",         "pubyear": "2009" },
     *     { "id": "3", "friend": "Daisy", "pubtitle": "Coffee Fancy",  "pubyear": "2003" }
     *   ]
     *
     * Calling `myMuster.serializeBy('id');` gives us 
     *
     *   [
     *     {
     *       "id": "2",
     *       "friend":   [ "Bob", "Doug" ],
     *       "pubtitle": [ "Jump Up", "Sit Down", "Backflips", "Fly Fishing" ],
     *       "pubyear":  [ "2006", "2008", "2010" ],
     *     },
     *     {
     *       "id": "3",
     *       "friend":   [ "Sue", "Daisy" ],
     *       "pubtitle": [ "Old Times", "Rocking Horse", "Bolts", "Coffee Fancy" ],
     *       "pubyear":  [ "2009", "2003" ],
     *     }
     *   ]
     *
     * But that's not quite right. Some of the pubyears got lost and can't be
     * properly associated with the pubtitles. So, optionally, specify a set of
     * `customProperties` as an array of objects of the form:
     *
     *   myMuster.serializeBy('id', [
     *     { "publication": {"title": "pubtitle", "year": "pubyear" },
     *   ]);
     *
     * When your serialized Muster is created, it will be slightly more complex
     * having nested properties.
     *
     *   [
     *     {
     *       "id": "2",
     *       "friend": [ "Bob", "Doug" ],
     *       "pubtitle": [ "Jump Up", "Sit Down", "Backflips", "Fly Fishing" ],
     *       "pubyear": [ "2006", "2008", "2010" ],
     *       "publication": [
     *         { "title": "Jump Up",     "year": "2006" },
     *         { "title": "Sit Down",    "year": "2008" },
     *         { "title": "Backflips",   "year": "2008" },
     *         { "title": "Fly Fishing", "year": "2010" },
     *       ]
     *     },
     *     {
     *       "id": "3",
     *       "friend":   [ "Sue", "Daisy" ],
     *       "pubtitle": [ "Old Times", "Rocking Horse", "Bolts", "Coffee Fancy" ],
     *       "pubyear":  [ "2009", "2003" ],
     *       "publication": [
     *         { "title": "Old Times",     "year": "2009" },
     *         { "title": "Rocking Horse", "year": "2009" },
     *         { "title": "Bolts",         "year": "2009" },
     *         { "title": "Coffee Fancy",  "year": "2003" },
     *       ]
     *     }
     *   ]
     *
     * So the original joined results are maintained in their original fields,
     * but we get an additional field to handle these fields that are related as
     * a unit. You could now find out some information about this person by
     * referencing these fields directly.
     *
     *   myMuster[0].friend; // ["Bob", "Doug"];
     *
     *   myMuster[1].publication[2].title; // "Rocking Horse"
     */
    serializeBy: function (uniqueColumn, customProperties) {

      var columns,
        grouped = this.groupBy(uniqueColumn),
        clone = this.clone();

      clone.results = [];
      if (grouped.length === 0) {
        return clone;
      }

      columns = grouped[0].columns;

      // add labels from custom properties
      //
      $.each(customProperties, function () {
        var prop;
        for (prop in this) {
          if (this.hasOwnProperty(prop)) {
            columns.push(prop);
          }
        }
      });

      /*
       * TODO: This has become significantly more complicated with the
       * implementaiton of #93. Document this stuff well since it looks very
       * gnarly.
       *
       * For each row in each group, examine the values one at a time.
       *
       *   - If the value isn't yet defined in the output, just copy the
       *     incoming value to the output
       *
       *   - If the value in the output is already defined and is a string, it
       *     is a single value. We convert it to an array consisting of the
       *     original value plus the incoming value.
       *
       *   - Otherwise, the output is already an array. Just push the new value
       *     onto it unless it already exists.
       *
       * Once we figure out the row contents, we push it into the clone and
       * return the clone at the end.
       */
      $.each(grouped, function () {
        var mergedRow = {};

        $.each(this.results, function () {
          var row = this;

          // add any custom properties
          $.each(customProperties, function () {
            var prop, attr, obj;
            for (prop in this) {
              if (this.hasOwnProperty(prop)) {
                obj = {};
                for (attr in this[prop]) {
                  if (this[prop].hasOwnProperty(attr)) {
                    obj[attr] = row[this[prop][attr]];
                  }
                }
                row[prop] = obj;
              }
            }
          });

          $.each(columns, function () {

            /* Set the value for this column. We check for and avoid creating
             * duplicates as we insert because of the nature of SQL queries.
             * Identical values will appear in adjacent cells when it's a join
             * query.
             *
             * If the merged cell isn't set, simply set it to the new value.
             *
             * If the merged cell contains an array, simply push the new value
             * onto the array (as long as it doesn't already exist).
             *
             * If the merged cell is set and is not an array, set the merged
             * cell to an array containing both values (as long as the new value
             * isn't the same as the old one).
             */
            if (mergedRow[this] === undefined) {
              mergedRow[this] = row[this];
            } else if (mergedRow[this] instanceof Array) {
              if (mergedRow[this].indexOf(row[this]) < 0) {
                mergedRow[this].push(row[this]);
              }
            } else {
              if (mergedRow[this] !== row[this]) {
                mergedRow[this] = [mergedRow[this], row[this]];
              }
            }
          });
        });
        clone.results.push(mergedRow);
      });

      return clone;
    },

    // Legacy support for old syntax
    //
    serializeJoinedResults: function (uniqueColumn) {
      return this.serializeBy(uniqueColumn);
    },

    toTable: function (columnSpec, parent, callback) {

      var columns, columnLabels,
        table = $('<table><thead><tr></tr></thead><tbody></tbody></table>'),
        thead = table.find('thead tr'),
        tbody = table.find('tbody');

      if (!columnSpec) {
        columns = columnLabels = this.columns;
      } else {
        columns = [];
        columnLabels = [];
        $.each(columnSpec, function () {
          if (this instanceof Array) {
            columnLabels.push(this[0]);
            columns.push(this[1]);
          } else if (isString(this)) {


            columns.push(this.toString());
            columnLabels.push(this.toString());
          }
        });
      }

      $.each(columnLabels, function () {
        thead.append('<th>' + this);
      });

      $.each(this.results, function () {

        var row = this,
          tr = $('<tr>');

        tbody.append(tr);
        $.each(columns, function () {
          var value,
            td = $('<td>');

          if (typeof this === 'function') {

            // formatting function
            //
            value = this.apply(row);

          } else if (row[this] instanceof Array) {

            // multiple values
            //
            value = row[this].join('</li><li>');
            value = '<ul><li>' + value + '</li></ul>';

          } else {

            // just a string
            //
            value = row[this];
          }
          tr.append(td.append(value));
        });
      });

      table = getSortableTable(table);

      if (parent) {
        $($(parent).html(table));
      }

      if (callback) {
        callback.apply(table);
      }

      return table;
    }
  };

  // Add Array.indexOf to browsers that don't have it (i.e. IE)
  //
  (function () {
    if (Array.indexOf === undefined) {
      Array.prototype.indexOf = function (obj) {
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

}(window, jQuery));

