jQuery(function($) {
	
	
	// Generic scroll to anchor
	// ------------------------------
	
	$('.js-scrollto-anchor').click( function(e) {
		
		e.preventDefault();
		
		// grabs the target id from the href
		var target = $($(this).prop('href').match(/\#(.*)/)[0]);
		
		// speed or slow the scroll using data attribute "scrollduration"
		var duration = $(this).data('scrollduration') || 300;
		
		// animate this puppy
		$('html, body').animate({
			scrollTop: target.offset().top
		}, duration, function() {
			
			// focus on the first form control if it exists
			// target.find('.form-control').eq(0).focus();
		});
	});
	
	
	
	
	
	// Generic confirms
	// ------------------------------
	
	$('.js-cancel-confirm').click(function(e) {
		if ( !confirm( $(this).data('confirm') || 'Are you sure? You will lose any changes.') )
			return e.preventDefault();
	});
	$('.js-delete-confirm').click(function(e) {
		if ( !confirm( $(this).data('confirm') || 'Are you sure? This cannot be undone.') )
			return e.preventDefault();
	});
	
	
	
	
	// Commenting
	// ------------------------------
	
	var comments = $('#comments'),
		input = $('.comment-field-input'),
		submit = comments.find('button[type=submit]');
	
	
	// Passing around queries as classes to fire off functions
	
	// scroll to the last comment
	if ($('.scrollToLastComment').length) {
		setTimeout(function() {
			$('html, body').animate({ scrollTop: comments.find('.comment-post').last().offset().top }, 250);
		}, 1000);
	}
	// focus on the comment field
	if ($('.focusOnCommentField').length) {
		
		$('html, body').animate({
			scrollTop: $('.comment-form').offset().top
		}, 300, function() {
			input.focus();
		});
	}

	// delete confirm UI

	$('.item-delete__hidden').hide();
	$('.item-delete__confirm').each(function() {

		var button = $(this),
			wrapper = button.closest('.item-delete'),
			content = wrapper.find('.item-delete__hidden'),
			cancel = wrapper.find('.item-delete__cancel');

		button.click(function() {
			content.show();
			button.hide();
		});
		cancel.click(function() {
			content.hide();
			button.show();
		});
	});
	
	
	
	// Show buttons
	input.focus( function(e) {
		comments.find('.hidden').removeClass('hidden');
	});
	
	
	
	// Check if field has content: enable/disable submit. Disable by default
	submit.attr('disabled','disabled');
	input.keyup(function() {
		if ($.trim($(this).val())) {
			submit.removeAttr('disabled');
		} else {
			submit.attr('disabled','disabled');
		}
	});
	
});
