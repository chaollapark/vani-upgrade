/******************************************************************************/
/*****************************Hare Krsna Hare Krsna****************************/
/*****************************Krsna Krsna Hare Hare****************************/
/******************************Hare Rama Hare Rama*****************************/
/******************************Rama Rama Hare Hare*****************************/
/******************************************************************************/

/*
I do not know how this is working, it just working.
I am more magician than programmer.
In case of panic attack contact me at: banana@dreamdev.sk
*/

//==============================ON_DUCUMENT_READY===============================
//This is separated from outside
$(document).ready(function() {

/******************************************************************************/
/***********************************SETTINGS***********************************/
/******************************************************************************/

var navigationMarginBottom  = 35;
var contentDiv              = $('#content');

var searchSiteSettings = [
    {
        site:       'vanisource',
        apiUrl:     'https://vanisource.org/w/api.php',
        wikiUrl:    'https://vanisource.org/wiki',
        namespace:  '14|0'
    },
    {
        site:       'vaniquotes',
        apiUrl:     'https://vaniquotes.org/w/api.php',
        wikiUrl:    'https://vaniquotes.org/wiki',
        namespace:  '14|0'
    },
    {
        site:       'vanipedia',
        apiUrl:     'https://vanipedia.org/w/api.php',
        wikiUrl:    'https://vanipedia.org/wiki',
        namespace:  '14|0'
    }
];

/******************************************************************************/
/**********************************DEFINITIONS*********************************/
/******************************************************************************/

function getCategoryMembers(category, settings, cmcontinue = null)
{
    var results = [];

    $.ajax({
        url:        settings.apiUrl,
        dataType:   'json',
        type:       'GET',
        data: {
            action:         'query',
            list:           'categorymembers',
            cmtitle:        category,
            format:         'json',
            cmlimit:        500,
            cmcontinue:     cmcontinue,
            cmprop:         'title',
            cmnamespace:    settings.namespace,
            cmtype:         settings.searchType,
            cmdir:          'asc'
        },
        xhrFields: {
            withCredentials: false
        },
        async: false,
        success: function(data) {

            if (typeof data.error !== 'undefined') {
                return [];
            }

            results = data.query.categorymembers;

            if (typeof data['continue'] !== 'undefined') {

                var cmcontinue = data['continue']['cmcontinue'];

                var continueResults = getCategoryMembers(category, settings, cmcontinue);

                results = $.merge(results, continueResults);
            }
        }
    });

    return results;
}

function initWidget(category)
{
    var options     = [];
    var optionsHtml = '';
    var results     = [];
    var totalHits   = 0;

    $.each(searchSiteSettings, function(index, settings) {

            var siteResults = getCategoryMembers(category, settings);

            totalHits += siteResults.length;

            results.push(siteResults);
    });

    for (var i = 0; i <= totalHits * results.length; i++) {

        var index = i % results.length;
        var innerIndex = (i - index) / results.length;

        if (typeof results[index][innerIndex] !== 'undefined') {

            var result = results[index][innerIndex];

            categorySites.push({
                value:  result.title.split(' ').join('_'),
                site:   searchSiteSettings[index].site
            });

            options.push(result.title);
        }
    }

    options.sort();

    $.each(options, function(index, option) {

        optionsHtml += composeOption(option);
    });

    $('div.vs-select-0 .vs-options').append(optionsHtml);

    $('#accordion').accordion({heightStyle: "fill"});

    $('.vs-option').click(function() {

        var value = getOptionValue($(this));

        $.each(categorySites, function(index, cs) {

            if (cs.value == value) {
                targetSite = cs.site;
                return;
            }
        });

        onOptionClick($(this));
    });

    $('.vs-select-search').keyup(function() {
        optionSearchKeyUp($(this));
    });
}

function composeOption(title, value = null, active = false)
{
    var cssClass = '';

    if (value === null) {
        value = title.split(' ').join('_');
    }

    if (active) {
        cssClass = ' active';
    }

    var option =   '<div class="vs-option' + cssClass + '">';
    option +=          '<div class="vs-option-title">' + title.replace('Category:', '') + '</div>';
    option +=          '<div class="vs-option-value">' + value + '</div>';
    option +=      '</div>';

    return option;
}

function composeOptions(members)
{
    var options = '';

    $.each(members, function(index, member) {

        var exp = /^Category:/;

        if (exp.test(member.title)) {
            options += composeOption(member.title);
        }
    });

    return options;
}

function getOptionValue(option)
{
    return option.find('.vs-option-value').html();
}

function optionSearchKeyUp(input)
{
    var options = input.closest('.vs-select').find('.vs-option');

    $.each(options, function(index, option) {

        var value   = $(option).find('.vs-option-title').html().toLowerCase();
        var search  = input.val().toLowerCase();

        if (value.indexOf(search) < 0) {
            $(option).hide();
        } else {
            $(option).show();
        }
    });
}

function onOptionClick(option)
{
    $('#vs-search').val('');
    $('.vs-select-search').val('');
    $('.vs-select-search').keyup();
    option.closest('.vs-options').find('.vs-option.active').removeClass('active');
    option.addClass('active');

    $('.vs-results').html('<div class="vs-loading"></div>');

    window.setTimeout(function() {

        var activeSlotId = option.closest('.vs-select').attr('id').split('-');
        activeSlotId = activeSlotId[activeSlotId.length - 1];

        adjustWidgetSlots(activeSlotId);

        var value = getOptionValue(option);
        var members;

        if (!value) {
            value = getOptionValue($('#vs-select-' + (activeSlotId - 1) + ' .vs-option.active'));
        }

        $.each(searchSiteSettings, function(index, settings) {

            if (settings.site == targetSite) {
                members = getCategoryMembers(value, settings);
                return;
            }
        });

        if (getOptionValue(option)) {

            var optionsHtml = composeOptions(members);

            if (optionsHtml) {

                var title = option.find('.vs-option-title').html();

                $('#accordion').accordion('destroy');

                addWidgetSlot(optionsHtml, title);

                $('#accordion').accordion({heightStyle: 'fill', active: lastSlotIndex});
            }
        }

        if (lastSlotIndex != 0) {
            var parentCat = $('h3.vs-select-' + lastSlotIndex).html();
            parentCat = parentCat.split('>');
            parentCat = parentCat[parentCat.length - 1];
            parentCat = 'Category:' + parentCat;

            members = $.merge([{title: parentCat}], members);
        }

        displayResults(members);

    }, 0);
}

function adjustWidgetSlots(activeSlotId)
{
    for (var i = lastSlotIndex; i >= 0; i--) {

        if (i > activeSlotId) {
            $('.vs-select-' + i).remove();
        } else {
            lastSlotIndex = i;
            break;
        }
    }

    $('#accordion').accordion('refresh');
}

function addWidgetSlot(optionsHtml, title)
{
    lastSlotIndex++;

    optionsHtml = composeOption('All ' + title, '', true) + optionsHtml;

    var slotHtml =  '<h3 class="vs-select-' + lastSlotIndex + '">' + title + '</h3>';
    slotHtml +=     '<div id="vs-select-' + lastSlotIndex + '" class="vs-select vs-select-' + lastSlotIndex + '">';
    slotHtml +=         '<div class="vs-select-search-wrapper">';
    slotHtml +=             '<img class="vs-icon-small" src="https://vanimedia.org/w/images/6/6b/Vs-icon.png" alt="Search">';
    slotHtml +=             '<input class="vs-select-search" type="text" placeholder="Specify...">';
    slotHtml +=         '</div>';
    slotHtml +=         '<div class="vs-options">' + optionsHtml + '</div>';
    slotHtml +=     '</div>';

    $('#accordion').append(slotHtml);

    $('.vs-select-' + lastSlotIndex + ' .vs-option').click(function() {
        onOptionClick($(this));
    });

    $('.vs-select-' + lastSlotIndex + ' .vs-select-search').keyup(function() {
        optionSearchKeyUp($(this));
    });
}

function displayResults(members)
{
    $('.vs-results').html('');

    var htmlCat = '';
    var htmlPag = '';
    var targetSiteUrl;

    $.each(searchSiteSettings, function(index, settings) {

        if (settings.site == targetSite) {
            targetSiteUrl = settings.wikiUrl;
            return;
        }
    });

    $.each(members, function(index, member) {

        var href = targetSiteUrl + '/' + member.title.split(' ').join('_');

        var html = '<p class="vs-result"><a href="' + href + '" target="_blank">' + member.title + '</a></p>';

        var exp = /^Category:/;

        if (exp.test(member.title)) {
            htmlCat += html;
        } else {
            htmlPag += html;
        }
    });

    $('.vs-results').append(htmlCat + htmlPag);
}

function search()
{
    window.setTimeout(function() {

        var search  = $('#vs-search').val().toLowerCase();

        $('.vanisearch .vs-result').each(function() {
            var value   = $(this).find('a').html().toLowerCase();

            if (value.indexOf(search) < 0) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
    });
}

/******************************************************************************/
/********************************INITIALIZATION********************************/
/******************************************************************************/

var targetSite;
var lastSlotIndex = 0;
var categorySites = [];
var viewportHeight = $(window).height();
var acordionOffset;

$('.vanisearch .vs-sidebar').css('height', viewportHeight);

initWidget('Category:vs-search');

$('.vanisearch').show();
$('.vanisearch-loading').hide();

acordionOffset = $('#accordion').offset();

var hellobarRemoveInterval = setInterval(function(){
    if ($('.hellobar').length > 0) {
        $('.hellobar').remove();
        clearInterval(hellobarRemoveInterval);
    }
}, 1000);

/******************************************************************************/
/************************************EVENTS************************************/
/******************************************************************************/

$(window).on('resize', function(){
    viewportHeight = $(window).height();
    $('.vanisearch .vs-sidebar').css('height', viewportHeight);
    $('#accordion').accordion('refresh');
    $('.vanisearch #vs-help-wrapper').css('width', $(window).width()).css('height', $(window).height());
});

$(window).scroll(function(){
    var scroll = $(window).scrollTop();

    if (scroll >= acordionOffset.top) {
        $('#accordion').css('position', 'fixed');
        $('#accordion').css('top', '0');
    } else {
        $('#accordion').css('position', 'static');
    }

    if ( (scroll + $(window).height()) > (contentDiv.offset().top + contentDiv.height() - navigationMarginBottom) ) {

        var top = (scroll + $(window).height()) - (contentDiv.offset().top + contentDiv.height() - navigationMarginBottom);

        top *= -1;

        top = top + 'px';

        $('#accordion').css('position', 'fixed');
        $('#accordion').css('top', top);
    }
});

$('#vs-search').keyup(function() {
    search();
});

$('#vs-help-trigger').click(function() {
    $('.vanisearch #vs-help-wrapper').css('width', $(window).width()).css('height', $(window).height());
    $('.vanisearch #vs-help-wrapper').show();
});

$('#vs-help-close').click(function() {
    $('.vanisearch #vs-help-wrapper').hide();
});

});
//============================ON_DUCUMENT_READY_END=============================
