<template>
  <div class="home">
    <h1 class="headline center">Welcome to my Blog</h1>
    <img alt="Vue logo" src="../assets/avatar.png">
    <div class="sections">
      <div v-for="(section, index) in Object.keys(entries)" :key="index" class="group">
        <h2 class="center">{{subforlders.sections[index]}}</h2>
        <div class="section" v-for="entry in entries[section]" :key="entry.id">
          <div class="entry">
           <!--<b-card
                style="cursor: pointer;"
                :img-src="getImage(entry.image)"
                img-left
                tag="article"
                class="mb-2"
            >
              <b-card-title style="color: #0da766"  @click="$router.push({name: entry.id})">{{entry.title}}</b-card-title>
              <b-card-text>
                {{entry.description}}
              </b-card-text>
              <b-button variant="primary" @click="$router.push({name: entry.id})">Read the post</b-button>
            </b-card> -->


            <div class="card mb-3"  @click="$router.push({name: entry.id})"  style="cursor: pointer">
              <b-row>
                <div class="col-md-4" >
                  <img v-bind:src="getImage(entry.image)" style="height: 100%; width: 100%">
                </div>

                <div class="col-md-8" >
                  <div class="card-body">
                    <h5 class="card-title">{{entry.title}}</h5>
                    <p class="card-text">{{entry.description}}</p>
                    <p class="card-text"><small class="text-muted">Last updated 3 mins ago</small></p>
                  </div>
                </div>
              </b-row>
            </div>


          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BLOGENTRIES from '@/statics/data/blogs.json'

export default {
  name: 'home',

  computed: {
    entries() {
      console.log(BLOGENTRIES)
      return BLOGENTRIES
    },
    subforlders() {
      return {
        sections: [
          "Posts",
          "Basic Courses and Exercises"
        ]
      }
    }
  },
  methods: {
    getImage(type) {
      switch (type) {
        case "education":
          return require("../assets/img/blogimages/education.png");
        case "pills":
          return require("../assets/img/blogimages/pills.png");
        case "projects":
          return require("../assets/img/blogimages/projects.png");
        default:
          return require("../assets/img/blogimages/research.jpg");
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.center {
  text-align: center;
}
.headline {
  text-transform: uppercase;
  margin: 4rem auto;
  font-size: 4rem;
}
img {
  display: block;
  margin: 0 auto;
  width: 150px;
}

h2 {
  color: #11100e;
  text-transform: capitalize;
  margin-bottom: 2rem;
  font-family:  sans-serif;
  font-weight: 100;
}

h3 {
  //color: #0da766;
  color: #27dc7e;
  margin-bottom: 0;
  cursor: pointer;
  font-family:  Helvetica Neue, sans-serif;
  &:hover {
    text-decoration: underline;
  }
  .subtitle {
    color: grey;
    font-size: .98rem;
    float: right;
    font-weight: normal;
  }
}

h5 {
  //color: #0da766;
  color: #27dc7e;
  margin-bottom: 0;
  cursor: pointer;
  font-family:  Helvetica Neue, sans-serif;
  &:hover {
    text-decoration: underline;
  }
  .subtitle {
    color: grey;
    font-size: .98rem;
    float: right;
    font-weight: normal;
  }
}

p {
  color: #11100e;
  margin-top: .4rem;
  font-family:  Helvetica Neue, sans-serif;
}

.sections {
  max-width: 40vw;
  margin: 0 auto;
  margin-top: 4rem;
}

.section {
  margin-bottom: 3rem;
}

.group {
  margin-bottom: 4rem;
}


</style>
