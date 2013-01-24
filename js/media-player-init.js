$(document).ready( domSetup );


function domSetup() {
  // nav
  $('.tabs nav.main a').bind('click',function(e){
    e.preventDefault();
    if ($(this).hasClass('active')) {
      return false;
    } else {
      $('.tabs nav.main a').removeClass('active');
      $(this).addClass('active');
      matchRel = $(this).attr('rel');
      $('.tabs > div').slideUp(function(){
        setTimeout(function(){
          $('.tabs > div#'+ matchRel).slideDown();
        },500);
      });
    }
  });
}