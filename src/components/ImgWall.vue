
<template>
  <div v-bind:id="wallId" class="img-wall">
		  <row v-for="row in rows" :key="row" v-bind:thumbnails="thumbnailsByRow(row)"></row>
		  <popup ref="popup"></popup>
	  </div>
</template>

<script>
export default {
  components: {
    popup: {
      data: function() {
        return {
          isVisible: false,
          thumbnail: null,
          styles: {
            backgroundImage: ""
          }
        };
      },

      template:
        '<div class="img-wall__popup" v-show="isVisible" @click="onClick($event)">\
            <div class="img-wall__popup__img" v-bind:style="styles"/>\
            <div class="img-wall__popup__close" @click="onClickClose($event)"></div>\
          </div>',

      methods: {
        setImgSource: function(url) {
          this.styles.backgroundImage = "url(" + url + ")";
        },

        show: function() {
          this.isVisible = true;
        },

        onClick: function(event) {
          event.stopImmediatePropagation();
          //console.log(">>>click icon", this.thumbnail);
          this.$parent.$emit("launchUrl", this.thumbnail); //notify img-wall instance
        },

        onClickClose: function(event) {
          event.stopImmediatePropagation();
          this.isVisible = false;
        },

        setThumbnail: function(data) {
          this.thumbnail = data;
        }
      }
    },

    row: {
      props: ["thumbnails"],

      template:
        '<div class="img-wall__row">\
            <column v-for="thumbnail in thumbnails" :thumbnail="thumbnail"></column>\
          </div>',

      methods: {
        thumbnailsByCell: function(cell) {
          return this.thumbnails ? this.thumbnails[cell] : [];
        }
      },

      components: {
        column: {
          data: function() {
            return {
              styles: {
                height: "",
                width: ""
              }
            };
          },

          props: ["thumbnail"],

          template:
            '<a @click="onClick" class="img-wall__thumbnail">\
                <img v-bind:src="getImageUrl(thumbnail.name)"\
                  v-bind:alt="thumbnail.name"\
                  v-bind:style="styles"/>\
              </a>',

          mounted: function() {
            this.styles.height = this.$parent.$parent.cellHeight;
            this.styles.width = this.$parent.$parent.cellWidth;
          },

          methods: {
            getImageUrl: function(name) {
              return "/assets/img/" + name + ".jpg";
            },

            onClick: function() {
              this.$parent.$parent.$emit(
                "zoomIn",
                this.getImageUrl(this.thumbnail.name),
                this.thumbnail
              ); //notify to img-wall
            }
          }
        }
      }
    }
  },

  props: ["tournament"],

  data: function() {
    return {
      wallId: "img-wall_" + this._uid,
      maxRows: 3,
      maxCells: 5,
      cellWidth: "auto",
      cellHeight: "auto",
      rows: 0,
      cells: 0,
      layout: "Landscape",
      fixedLayout: false
    };
  },

  computed: {
    thumbnails: function() {
      var thumbnails = this.tournament ? this.tournament.thumbnails : [];

      //for testing
      var thumbnails = [
        { thumbnailId: 5, name: "05" },
        { thumbnailId: 6, name: "06" },
        { thumbnailId: 1, name: "01" },
        { thumbnailId: 6, name: "06" },
        { thumbnailId: 7, name: "07" },
        { thumbnailId: 8, name: "08" },
        { thumbnailId: 6, name: "06" },
        { thumbnailId: 7, name: "07" },
        { thumbnailId: 8, name: "08" },
        { thumbnailId: 6, name: "06" },
        { thumbnailId: 8, name: "08" },
        { thumbnailId: 2, name: "02" },
        { thumbnailId: 3, name: "03" },
        { thumbnailId: 4, name: "04" },
        { thumbnailId: 5, name: "05" },
        { thumbnailId: 4, name: "04" }
      ];

      return thumbnails;
    }
  },

  watch: {
    tournament: function() {
      //console.log("tournament @ " + this.wallId);
    },

    layout: function() {
      //todo: re-build if orientation is changed.
    }
  },

  created: function() {
    this.checkLayout();
  },

  mounted: function() {
    var self = this;

    this.redraw();

    this.$on(
      "appResized",
      function() {
        //console.warn(">>img-wall resize...");
        this.checkLayout();
        this.resize();
      }.bind(this)
    );

    this.$on(
      "zoomIn",
      function(url, thumbnail) {
        this.$refs.popup.setImgSource(url);
        this.$refs.popup.setThumbnail(thumbnail);
        this.$refs.popup.show();
      }.bind(this)
    );

    this.$on(
      "launchUrl",
      function(thumbnail) {
        //window.open(this.getLaunchUrl(thumbnail));
        // CRD-695
        this.$emit("tryLaunchingGameByIcon", thumbnail);
      }.bind(this)
    );
    /*
        觀察 mobile orientation 改變就重排 game icons
       */
    window.addEventListener("orientationchange", function() {
      setTimeout(function() {
        self.redraw();
      }, 200);
    });
  },

  methods: {
    /**
     * 清除並且重繪
     * */
    redraw: function redraw() {
      this.rows = 0;
      this.cells = 0;
      var newLayout = this.checkLayout();
      if (newLayout.toLowerCase() === "landscape") {
        this.maxRows = 3;
        this.maxCells = 5;
      } else {
        this.maxCells = 5;
        this.maxRows = 3;
      }

      this.init();
      this.resize();
    },

    /**
     * box排列大小與規則
     */
    init: function init() {
      var totalThumbnails = this.thumbnails.length,
        minSqrt = isNaN(totalThumbnails)
          ? 0
          : Math.floor(Math.sqrt(totalThumbnails));

      if (totalThumbnails <= this.maxCells * this.maxRows) {
        if (
          true /*因為landscape排版比較優越, 所以就用這個*/ /*this.layout == 'Landscape'*/
        ) {
          this.rows = Math.min(minSqrt, this.maxRows);
          this.cells = Math.ceil(totalThumbnails / this.rows);
        } else {
          this.cells = Math.min(minSqrt, this.maxCells);
          this.rows = Math.ceil(totalThumbnails / this.cells);
        }
      } else {
        this.cells = this.maxCells;
        this.rows = Math.ceil(totalThumbnails / this.cells);
      }
    },

    resize: function() {
      //選擇長或寬最小值去計算cell width
      if (this.$el.offsetWidth > 0 && this.$el.offsetHeight > 0) {
        this.cellWidth =
          Math.floor(
            Math.min(
              this.$el.offsetHeight / Math.min(this.rows, this.maxRows),
              this.$el.offsetWidth / Math.min(this.cells, this.maxCells)
            )
          ) + "px";
      } else {
        this.cellWidth = 100 / this.cells + "%";
      }
      // console.warn('============>Leo, cell width = ' + this.cellWidth);
      // console.warn("this.$el.offsetWidth = " + this.$el.offsetWidth);
      // console.warn("this.$el.offsetHeight = " + this.$el.offsetHeight);
    },

    thumbnailsByRow: function(row) {
      return this.thumbnails.slice(
        (row - 1) * this.cells,
        Math.min(row * this.cells, this.thumbnails.length)
      );
    },

    checkLayout: function() {
      if (this.fixedLayout) return;
      var mql = window.matchMedia("(orientation: portrait)");

      if (mql.matches) {
        this.layout = "Portrait";
      } else {
        this.layout = "Landscape";
      }
      return this.layout;
    },

    getLaunchUrl: function(thumbnail) {
      // todo: get url
      return "?gamesn=" + thumbnail.thumbnailId;
    }
  }
};
</script>

<style scoped>
.img-wall {
  display: flex;
  -ms-flex-pack: center;
  justify-content: center;
  -ms-flex-direction: column-reverse;
  flex-direction: column-reverse;
  width: 100%;
  height: 100%;
  display: -ms-flexbox;
  display: flex;
  flex: 1;
  flex-basis: auto; /*UAT-6499 - IE 對預設的flex-basis:0 會有排版的問題, 因此改auto去按照內容排版*/
  overflow: hidden;
  position: absolute;
}

.img-wall__row {
}

.img-wall__thumbnail > img {
  cursor: pointer;
  max-width: 40%;
}

.img-wall__popup {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-pack: center;
  justify-content: center;
  background: #f0d47e;
  background: -webkit-linear-gradient(
    rgba(240, 212, 126, 0.7),
    rgba(206, 138, 98, 0.7)
  );
  background: -o-linear-gradient(
    rgba(240, 212, 126, 0.7),
    rgba(206, 138, 98, 0.7)
  );
  background: -moz-linear-gradient(
    rgba(240, 212, 126, 0.7),
    rgba(206, 138, 98, 0.7)
  );
  background: linear-gradient(
    rgba(240, 212, 126, 0.7),
    rgba(206, 138, 98, 0.7)
  );
}

.img-wall__popup__img {
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  height: 100%;
  width: 100%;
  cursor: pointer;
  max-height: 120px;
}
</style>
