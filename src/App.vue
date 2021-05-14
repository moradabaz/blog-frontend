<template>
  <div id="app">
    <b-nav pills class="nav nav-tabs justify-content-end" style="margin-right: 30px; margin-bottom: 20px">
      <b-nav-item href="/" onclick="this.selected = 0" v-bind:class="{active : isSelected(0)}" >Home</b-nav-item>
      <b-nav-item></b-nav-item>
      <b-nav-item href="/blog" onclick="this.selected = 0" v-bind:class="{active : isSelected(0)}" >Blog</b-nav-item>
      <b-nav-item></b-nav-item>
      <b-nav-item-dropdown
          id="my-nav-dropdown"
          text="Try ML Classifiers"
          toggle-class="nav-link-custom"
          right
      >
        <b-dropdown-item  href="/predict-time-series/" onclick="this.selected = 1"  v-bind:class="{active : isSelected(1)}">Time Series Classifiers</b-dropdown-item>
        <b-dropdown-item href="/adult-income/"  onclick="this.selected = 2" v-bind:class="{active : isSelected(2)}" >Adult Income</b-dropdown-item>



      </b-nav-item-dropdown>
      <b-nav-item></b-nav-item>
      <b-nav-item href="/about/">About</b-nav-item>
      <b-nav-item></b-nav-item>
    </b-nav>
    <div>
      <router-view/>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      selected: 0
    }
  },
  methods: {
    isSelected(i) {
      console.log("Inicio")
      console.log(this.selected)
      console.log(i)
      console.log("End")
      return i === this.selected
    }
  }
}

</script>

<style scoped>

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;


  color: #2c3e50;
  margin-top: 0px;
}

</style>
