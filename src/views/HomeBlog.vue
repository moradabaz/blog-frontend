<template>
  <div class="home">
    <h1 class="headline center">Welcome to my Blog</h1>
    <img alt="Vue logo" src="../assets/avatar.png">
    <div class="sections">
      <div v-for="(section, index) in Object.keys(entries)" :key="index" class="group">
        <h2 class="center">{{subforlders.sections[index]}}</h2>
        <div class="section" v-for="entry in entries[section]" :key="entry.id">
          <div class="entry">
            <h3 @click="$router.push({name: entry.id})">
              {{entry.title}}
              <span class="subtitle">{{entry.date}}</span>
            </h3>
            <p>{{entry.description}}</p>
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
