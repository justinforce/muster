(function($) {

  'use strict';

  // ITGDD demo
  muster('itg').query({
    select: '*',
    from: 'devices',
    where: "Status <> 'EIMR' or Status is null",
    order: 'Status asc'
  }, function() {
    this.toTable([
      ['ITG ID', 'Property ID'],
      ['Hostname', 'Host Name'],
      'Status',
      'Platform',
      'Model',
      'Serial Number',
      'OS',
      'CPU',
      'RAM',
      'Room',
      ['Group', 'GSE Group'],
      'Notes'
    ], '#itgdd');
  });

  // Research Interests demo
  muster({
    url: 'http://harold:8080/muster/',
    database: 'ggsedb'
  }).query({
    select: '*',
    from: 'profile,research_interests',
    where: 'research_interests.profile_id = profile.id and active = \'yes\'',
    order: 'last_name asc'
  }, function() {

    var table = this.serializeJoinedResults('id').toTable([
      [
        'Full Name',
        
        function() {
          return this.last_name + ', ' + this.first_name;
        }
      ],
      ['Title', 'title'],
      ['Research Interests (list)', 'interest'],
      [
        'Research Interests (comma separated)',
        
        function() {
          if (this.interest instanceof Array) {
            return this.interest.join(', ');
          } else {
            return this.interest;
          }
        }
      ]
    ]);

    $($('#researchInterests').append(table));
  });

}(jQuery));

/*jslint browser: true, indent: 2 */
/*global muster, jQuery */

