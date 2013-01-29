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
      $(this).parent().parent().parent().siblings('div').slideUp(function(){
        setTimeout(function(){
          $('.tabs > div#'+ matchRel).slideDown();
        },500);
      });
    }
  });

  // secondary nav
  $('.tabs nav.secondary a').bind('click',function(e){
    e.preventDefault();
    if ($(this).hasClass('active')) {
      return false;
    } else {
      $('.tabs nav.secondary a').removeClass('active');
      $(this).addClass('active');
      matchRel = $(this).attr('rel');
      $(this).parent().parent().parent().siblings('div').slideUp(function(){
        setTimeout(function(){
          $('.tabs > div#'+ matchRel).slideDown();
        },500);
      });
    }
  });

}