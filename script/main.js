timeouts = [];
API_BASE = "https://parsi-api-beatbot.fandogh.cloud/"
var poets_list;

function clear_timeouts() {
    timeouts.forEach(id => {
        clearTimeout(id);
    });
}

function create_poemgrid_item(r) {
    it = $("<div>").addClass("items poem-grid");
    im = $("<img>").addClass("avatar").attr("src", r.poet.pic).attr('data-pid', r.poet.p_id);
    tooltip = $("<span>").addClass("tooltip").text("ابیات بیشتر از " + r.poet.name + " ...");
    poem = $("<div>").addClass("poem");
    m1 = $("<span>").addClass("b b1").text(r.m1);
    m2 = $("<span>").addClass("b b2").text(r.m2);
    poet = $("<a>").addClass("poet").attr('href', r.url).attr("target", "_blank").text(r.poet.name);
    poem.append(m1).append(m2).append(poet);
    it.append(im).append(tooltip).append(poem);
    return it
}

function create_biogrid_item(p) {
    it = $("<div>").addClass("items bio-grid");
    im = $("<img>").addClass("avatar").attr("src", p.pic).attr('data-pid', p.p_id);
    tooltip = $("<span>").addClass("tooltip").text("مشاهده چند بیت از " + p.name + " ...");
    poet = $("<a>").addClass("poet").attr('href', p.link).attr("target", "_blank").text(p.name);
    bio = $("<div>").addClass("biography");
    bio_text = $("<p>").text(p.biography);
    bio.append(bio_text);
    it.append(im).append(tooltip).append(poet).append(bio);
    return it
}

function create_biogrid_pager() {
    pager = $("#pager");
    pager.css({
        opacity: 0,
    });

    pager.addClass("bio-grid");
    pager.append($("<li>").addClass("pager-prev").text("<"));
    button_count = Math.ceil(poets_count / capacity);

    if (button_count > 5) {
        if (curr_pager == 1) {
            for (i = 1; i <= 3; i++) pager.append($("<li>").text(i));
            pager.append($("<li>").text("..."));
            pager.append($("<li>").text(button_count));
        } else if (curr_pager == button_count) {
            pager.append($("<li>").text("1"));
            pager.append($("<li>").text("..."));
            for (i = button_count - 2; i <= button_count; i++) pager.append($("<li>").text(i));
        } else {
            pager.append($("<li>").text("1"));
            pager.append($("<li>").text("..."));
            pager.append($("<li>").text(curr_pager));
            pager.append($("<li>").text("..."));
            pager.append($("<li>").text(button_count));
        }
    } else {
        for (i = 1; i <= 5; i++) pager.append($("<li>").text(i));
    }

    $("#pager > li").each(function () {
        if ($(this).text() == curr_pager) $(this).css({ "background-color": "#707070", color: "#F1F1F1" });
        if ($(this).text() == "...") $(this).css({ "background-color": "#F1F1F1", color: "#707070", border: "none" });
    })
    pager.append($("<li>").addClass("pager-next").text(">"));

    pager.delay(c * 400).animate({
        opacity: 1,
    }, 500);
}


function fill_gridview(r, func) {
    vi = $("#view");
    c = 1;
    $(".loader").removeClass("loading");
    r.forEach(d => {
        el = func(d);
        el.css({
            opacity: 0,
            position: "relative",
            bottom: "-50px",
        });
        vi.append(el);
        el.delay(c * 300).animate({
            opacity: 1,
            bottom: "0",
        }, 500);
        c++;
    });
}

function fetch_poem(count, pid) {
    if (!pid) pid = 1;
    $("#view > .items").remove(); $("#pager > li").remove()
    $(".loader").addClass("loading");
    $.ajax({
        url: API_BASE + "/poem/" + count + "?p=" + pid,
        contentType: "application/json",
        dataType: 'json',
        type: "GET",
        success: function (r) {
            clear_timeouts();
            timeouts.push(
                setTimeout(fill_gridview, 800, r, create_poemgrid_item)
            )
        },
    })
}


function fetch_bios(offset, length, pid) {
    $("#view > .items").remove(); $("#pager > li").remove()
    $(".loader").addClass("loading");
    $.ajax({
        url: API_BASE + "/poets?offset=" + offset + "&length=" + length + "&pid=" + pid,
        contentType: "application/json",
        dataType: 'json',
        type: "GET",
        success: function (r) {
            if (pid) curr_pager = r.poets[0].id;
            clear_timeouts();
            timeouts.push(
                setTimeout(fill_gridview, 800, r.poets, create_biogrid_item)
            );
            poets_count = r.all_count;
            timeouts.push(
                setTimeout(create_biogrid_pager, 800, poets_count)
            );
        },
    })
}


function fetch_poets() {
    poets = $("#poets");
    poets.empty()
    poets.append($("<option>").val("1").text("همه شاعران"));
    if (!poets_list) {
        $.ajax({
            url: API_BASE + "/poets",
            contentType: "application/json",
            dataType: 'json',
            type: "GET",
            success: function (r) {
                poets_list = r.poets;
                r.poets.forEach(p => {
                    poets.append(
                        $("<option>").val(p.p_id).text(p.name)
                    )
                });
            },
        })
    } else {
        poets_list.forEach(p => {
            poets.append(
                $("<option>").val(p.p_id).text(p.name)
            )
        });
    }
}


$(document).ready(function () {

    bio_offset = 0;
    p_id = 1;
    curr_pager = 1;
    poets_grid = $("#sw-poet").prop("checked");

    if (poets_grid) {
        for (i = 1; i <= 3; i++) $("#capacity").append($("<option>").text(i));
        capacity = 1;
        fetch_bios(bio_offset, capacity);
    }
    else {
        for (i = 4; i <= 10; i += 2) $("#capacity").append($("<option>").text(i))
        capacity = 4;
        fetch_poem(capacity, p_id);
    };

    fetch_poets()

    $("#pager").on("click", "li", function () {
        txt = $(this).text();
        txt = parseInt(txt, 10);
        if (!isNaN(txt) && txt != curr_pager) {
            curr_pager = txt;
            bio_offset = (txt - 1) * capacity;
            fetch_bios(bio_offset, capacity);
        }
    })

    $("#pager").on("click", ".pager-prev", function () {
        curr_pager = parseInt(curr_pager, 10);
        if (curr_pager != 1) {
            curr_pager = curr_pager - 1;
            bio_offset = (curr_pager - 1) * capacity;
            fetch_bios(bio_offset, capacity);
        }
    })

    $("#pager").on("click", ".pager-next", function () {
        button_count = Math.ceil(poets_count / capacity);
        curr_pager = parseInt(curr_pager, 10);
        if (curr_pager != button_count) {
            curr_pager = curr_pager + 1;
            bio_offset = (curr_pager - 1) * capacity;
            fetch_bios(bio_offset, capacity);
        }
    })

    $("#sw-poet").change(function () {
        capa_el = $("#capacity")
        capa_el.empty()
        poets_grid = true;
        for (i = 1; i <= 3; i++) capa_el.append($("<option>").text(i));
        capacity = 1;
        fetch_bios(bio_offset, capacity);
    })

    $("#sw-poem").change(function () {
        capa_el = $("#capacity")
        capa_el.empty()
        poets_grid = false;
        for (i = 4; i <= 10; i += 2) capa_el.append($("<option>").text(i));
        capacity = 4;
        fetch_poem(capacity, p_id)
    })

    $("#capacity").change(function () {
        selected = $(this).find(":selected").text();
        capacity = selected;
        if (!poets_grid) {
            fetch_poem(capacity, p_id);
        } else {
            p_id = 1;
            fetch_poets();
            bio_offset = 0;
            curr_pager = 1;
            fetch_bios(bio_offset, capacity);
        }
    })

    $("#poets").change(function () {
        selected = $(this).find(":selected").val();
        p_id = selected;
        if (!poets_grid) {
            fetch_poem(capacity, p_id);
        } else {
            capa_el = $("#capacity")
            capa_el.empty()
            for (i = 1; i <= 3; i++) capa_el.append($("<option>").text(i));
            capacity = 1;
            fetch_bios(0, capacity, p_id)
        }
    })

    $("#view").on("click", ".avatar", function (e) {
        p = $(this).attr("data-pid");
        $('#poets option[value="' + p + '"]').attr("selected", true);
        p_id = p;
        fetch_poem(4, p)
    })
    $("#view").on("mouseenter", ".avatar", function (e) {
        $(this).next().css({
            display: "inline",
        })
    })
    $("#view").on("mouseleave", ".avatar", function (e) {
        $(this).next().css({
            display: "none",
        })
    })
})
