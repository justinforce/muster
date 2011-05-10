$(function() {

  var muster = $.muster({ 
    url: "http://localhost:8080/muster/muster",
    database: "courses",
  });

  var results = muster.query({
    select: "*",
    from: "coursesyear",
    where: "\"year\" = '2010-11'",
    callback: updateTable
  });

  function updateTable(results) {
    $('body').append(muster.toTable());
  }
});