<template>
  <div id="modelform" class="mt-5">
    <h1 id="title">{{ title }}</h1>
    <p>{{ this.datasets[this.selected].values }}</p>
    <b-container fluid>
      <b-row class="center">
        <b-col id="dataset_list" cols="2" md="2">
          <h6>Datasets</h6>
          <b-list-group>
            <b-list-group-item
              :key="index"
              v-for="(item, index) in datasets"
              href="#"
              v-bind:class="{ active: isSelected(index) }"
              v-on:click="loadSamples(index)"
              style="word-break: break-all"
            >
              {{ item.text }}
            </b-list-group-item>
          </b-list-group>
        </b-col>

        <b-col cols="8" align-self="center">
          <form  @submit="onSubmit">
            <b-row>
              <b-col id="model_creation">
                <v-row class="row" v-if="ispforest">
                  <div class="input-field col s4">
                    <label><b>Number of Trees</b></label>
                    <br />
                    <input
                      id="n_trees"
                      v-model="form.n_trees"
                      type="number"
                      class="validate"
                    />
                  </div>

                  <div class="input-field col s4">
                    <label ><b>Number of Candidates </b></label>
                    <br />
                    <input
                      id="n_candidates"
                      v-model="form.candidates"
                      type="number"
                      class="validate"
                    />
                  </div>
                </v-row>

                <b-row v-else>
                  <div class="input-field col s4">
                    <label><b>Number of Neighbours</b></label>
                    <br />
                    <input
                      id="n_neighbours"
                      v-model="form.neighbours"
                      type="number"
                      class="validate"
                    />
                  </div>

                  <div class="input-field col s4">
                    <label for="window_size"><b>Window Size </b></label>
                    <br />

                    <input
                      id="window_size"
                      v-model="form.window_size"
                      type="number"
                      step="any"
                      class="validate"
                    />
                  </div>
                  <div class="input-field col s4">
                    <label for="v_value"><b>Threshold Value (V) </b></label>
                    <br />
                    <input
                      id="v_value"
                      v-model="form.v_value"
                      type="number"
                      step="step"
                      class="validate"
                    />
                  </div>
                </b-row>

                <br />
                <b-button
                  type="submit"
                  class="btn-large waves-effect waves-light orange"
                  v-on:click="submitCreation()"
                >Create Model</b-button>
                <br />
                <br>
                <p id="accuracy_calculation" style="margin-bottom: 20px">{{ accuracy }}</p>
                <br />

                <b-col style="margin-top: 20px">
                  <input
                    id="prediction_serie"
                    v-model="form.prediction_serie"
                    style=" width: 800px;"
                    name="Predicition Serie"
                    type="text"
                    class="validate"
                  />

                  <b-form-select
                    :options="samples" v-model="form.prediction_serie" size="sm" class="mt-3">
                  </b-form-select>

                  <div class="center">
                    <br />
                    <b-button
                      v-on:click="submitPrediction()"
                      class="btn-large waves-effect waves-light orange"
                    >Predict Serie</b-button
                    >
                    <br>

                    <p style="margin-bottom: 20px; margin-top: 20px;">{{ this.prediction_serie }}</p>
                  </div>
                </b-col>
              </b-col>
            </b-row>
          </form>
          <br>
          <b-col>
          <p> This dataset contains  {{ this.datasets[this.selected].num_series }} different classes and each series contains {{this.datasets[this.selected].serie_size}} values </p>
          </b-col>
        </b-col>
        <b-col id="classifier_selection" cols="2" md="2" style="text-align: left">
          <h6>Classifiers</h6>
          <b-list-group>
            <b-list-group-item
                v-bind:class="{ active: isClassifierSelected('pforest') }"
                v-on:click="onChange()"
                style="word-break: break-all"
            >
              Proximity Forest
            </b-list-group-item>
            <b-list-group-item
                v-bind:class="{ active: isClassifierSelected('knnlb') }"
                v-on:click="onChange()"
                style="word-break: break-all"
            >
              KNN LbEnhanced
            </b-list-group-item>
          </b-list-group>
          <br>
          <br>
          <b-col>
            <h6>Link to Articles</h6>
            <div class="list-group">
              <a href="https://arxiv.org/abs/1808.10594" class="list-group-item list-group-item-action list-group-item-primary">Proximity Forest</a>
              <a href="https://www.researchgate.net/publication/332892906_Elastic_bands_across_the_path_A_new_framework_and_method_to_lower_bound_DTW"
                 class="list-group-item list-group-item-action list-group-item-success">Lower Bounds Enhanced</a>
            </div>
          </b-col>
        </b-col>
      </b-row>
      <br>
      <br>

      <p>{{ this.datasets[this.selected].description }}</p>
      <img v-bind:src="this.datasets[this.selected].image" />

      <p> You can find out more about time series datasets in this <a href="http://www.timeseriesclassification.com/dataset.php">link</a></p>
      <b-col>
      <p>You can install the packages of the classifiers in Python</p>
      <br>
        <p style="text-align: left">Proximity Forests</p>
      <div style="text-align: left; background: #ffffff; overflow:auto;width:auto;border:solid #0685d9;border-width:.1em .1em .1em .8em;padding:.2em .6em;"><pre style="margin: 0; line-height: 125%">pip install PForest-dtw</pre></div>
        <p style="text-align: left">You can check the <a href="https://github.com/moradisten/ProximityForests-python">implementation</a></p>
        <br>
        <p style="text-align: left">LB Enhanced</p>
      <div style=" text-align: left; background: #ffffff; overflow:auto;width:auto;border:solid #0685d9;border-width:.1em .1em .1em .8em;padding:.2em .6em;"><pre style="margin: 0; line-height: 125%">pip install knn-Lbenhanced</pre></div>
        <p style="text-align: left"> You can check the <a href="https://github.com/moradisten/KNN-LB">implementation</a></p>
        <br>
      </b-col>
    </b-container>
  </div>
</template>

<script>
import axios from "axios";
import BLOGENTRIES from '@/statics/data/datasets.json'
import Vue from "vue";

export default {
  name: "Form",
  data() {
    return {
      entries() {
        return BLOGENTRIES;
      },
      texto: "",
      samples: [],
      select_serie: '',
      selected: 0,
      title: "Proximity Forest using DTW",
      accuracy: '',
      prediction_serie: '',
      samples_loaded : false,
      model_created: false,
      form: {
        select_classifiers: 'pforest',
        n_trees: '',
        candidates: '',
        neighbours: '',
        window_size: '',
        v_value: '',
        prediction_serie: '',
        dataset: ''
      },
      classifers: [
        { values: "pforest", text: "Proximity Forest DTW" },
        { value: "knnlb", text: "KNN LbEnhanced" }
      ],
      datasets: [
        { values: "BirdChicken", text: "Bird Chicken",
          description: "MPEG-7 CE Shape-1 Part B is a database of binary images developed for testing MPEG-7 shape descriptors, and is available free online. It is used for testing contour/image and skeleton-based descriptors. Classes of images vary broadly, and include classes that are similar in shape to one another. There are 20 instances of each class, and 60 classes in total. We have extracted the outlines of these images and mapped them into 1-D series of distances to the centre. Bird/Chicken is the problem of distinguishing between an outline of a bird and a chicken",
          image: require('@/assets/img/datasets/birdchicken.png'),
          serie_size: 512 ,num_series: 2},
        { values: "Chinatown", text: "Chinatown",
          description: "PedestrianCountingSystem dataset The City of Melbourne, Australia has developed an automated pedestrian counting system to better understand pedestrian activity within the municipality, such as how people use different city locations at different time of the day. The data analysis can facility decision making and urban planning for the future. We extract data of 10 locations for the whole year 2017. We make two datasets from these data. ## MelbournePedestrian Data are pedestrian count for 12 months of the year 2017. Classes correspond location of sensor placement. ## Chinatown Data are pedestrian count in Chinatown-Swanston St (North for 12 months of the year 2017. Classes are based on whether data are from a normal day or a weekend day. - Class 1: Weekend - Class 2: Weekday There is nothing to infer from the order of examples in the train and test set. Data source: City of Melbourne (see [1]). Data edited by Hoang Anh Dau. [1]",
          image: require("@/assets/img/datasets/Chinatown.jpeg"),
          serie_size: 24, num_series: 2 },
        { values: "Phonemes", text: "Phonemes",
          description: "This data set is a subsample of the data used in the paper Dual-domain Hierarchical Classification of Phonetic Time Series. Each series is extracted from the segmented audio collected from Google Translate, oxforddictionaries.com and the Merrriam-Webster online dictionary. Each of these sources have different features. Audio files collected from Google translate, Oxford, and Merrriam-Webster dictionaries are recorded at 22050, 44100 and 11025 samples per second respectively. All of them have male and female speakers in different ratios. The Oxford dictionary includes British and American accent pronunciation for each word. After data collection, they segment waveforms of the words to generate phonemes using the Forced Aligner tool from the Penn Phonetics Laboratory.",
          image: require("@/assets/img/datasets/Phonemes.jpeg"),
          serie_size: 1024, num_series:  39},
        { values: "ItalyPowerDemand", text: "Italy Power Demand",
          description: "The data was derived from twelve monthly electrical power demand time series from Italy and first used in the paper \"Intelligent Icons: Integrating Lite-Weight Data Mining and Visualization into GUI Operating Systems\". The classification task is to distinguish days from Oct to March (inclusive) from April to September.",
          image: require("@/assets/img/datasets/ItalyPowerDemand.png"),
          serie_size: 24, num_series:   2},
        { values: "Plane", text: "Plane",
          description: "A data set of plane outlines",
          image: require("@/assets/img/datasets/Plane.png"),
          serie_size: 144, num_series:   7 },
        { values: "SonyAIBORobotSurface", text: "SonyAIBORobotSurface",
          image: require("@/assets/img/datasets/sony.gif"),
          description: "This dataset was donated by Manuela Veloso and Douglas Vail of Carnegie Mellon University. The robot has roll/pitch/yaw accelerometers. This data is just the X-axis. The task is to detect the surface being walked on (cement or carpet for Sony1).",
          serie_size: 70, num_series:   2 }
      ],
    };
  },
  methods: {
    onChange() {
      if (this.form.select_classifiers === "pforest") {
        this.form.select_classifiers = "knnlb";
        this.title = "K Nearest Neighbours using enhanced Lower Bounds";
      } else {
        this.form.select_classifiers = "pforest";
        this.title = "Proximity Forest using DTW";
      }
    },
    isSelected(i) {
      return i === this.selected;
    },
    isClassifierSelected(classifier) {
      return this.form.select_classifiers === classifier
    },
    submitCreation() {
      if (this.form.select_classifiers === 'pforest') {
        console.log("trees: " + this.form.n_trees)
        console.log("candidates: " + this.form.candidates)
        console.log("classifier: " + this.form.select_classifiers)
        console.log("dataset   : " + this.datasets[this.selected].values)
      } else {
        console.log("neighbours: " + this.form.neighbours)
        console.log("window    : " + this.form.window_size)
        console.log("threshold : " + this.form.v_value)
        console.log("classifier: " + this.form.select_classifiers)
        console.log("dataset   : " + this.datasets[this.selected].values)
      }
    },
    loadSamples(index) {
      if (this.selected !== index) {
        this.model_created = false
        this.accuracy = ''
        this.samples_loaded = true
        this.selected = index;
        const path = Vue.prototype.$backendURL + 'load-sample/'
        const params = {
          'dataset': this.datasets[this.selected].values
        }
        axios.post(path, params).then((response) => {
          this.samples = []
          for (let i = 0; i < response.data['series_data'].length; i++) {
            this.samples.push({
              value: response.data['series_data'][i]['serie'].toString(),
              text: response.data['series_data'][i]['serie'].toString()
            })
            console.log(this.samples)
          }
          console.log(this.samples)
        })
      }
    },
    submitPrediction() {

      if (this.form.prediction_serie === '' ) {
        this.prediction_serie = ''
        return
      }
      if (!this.model_created) {
        this.prediction_serie = 'You create a model first'
        return
      }
      const path = Vue.prototype.$backendURL + 'predict-serie/'
      console.log(this.form)
      this.form.dataset = this.datasets[this.selected].values
      console.log(this.form.prediction_serie)
      JSON.stringify(this.form)
      axios.post(path, this.form).then((response) => {
        console.log("Label: " + response.data['predicted_class'])
        this.prediction_serie = "Your serie belongs to the class number " + response.data['predicted_class']
      })
    },

    onSubmit (evt) {
      evt.preventDefault()
      const path = Vue.prototype.$backendURL + 'create-model/'
      console.log(this.form)
      this.form.dataset = this.datasets[this.selected].values
      JSON.stringify(this.form)
      if (!this.checkFiels(this.form.select_classifiers)) {
        this.accuracy = 'Some fields are not correct, please check'
        return
      }
      this.accuracy = 'Creating Model....'
      axios.post(path, this.form).then((response) => {
        console.log("Accuracy: " + response.data['accuracy'])
        //this.$loading.hide()
        this.accuracy = 'Your model has an accuracy of ' + response.data['accuracy'] + ' %'
        this.model_created = true

        swal("Model created successfully", "", "success")
      })
        .catch((error) => {
          swal("Model not created", "", "error")
        })

      if (!this.samples_loaded) {
        this.loadSamples(this.selected)
        this.samples_loaded = true
      }

    },
    checkFiels(classifier) {
      var check = true
      if (classifier === 'pforest') {
        if (this.form.n_trees === '' || parseInt(this.form.n_trees) <= 0) {
          check = false
        } else {
          if (this.form.candidates === '' || parseInt(this.form.candidates) <= 0) {
            check = false
          }
        }
      } else {
        if (this.form.neighbours === '' || parseInt(this.form.neighbours) <= 0) {
          check = false
        } else {
          if (this.form.window_size === '' || parseFloat(this.form.window_size) <= 0) {
            check = false
          } else {
            if (this.form.v_value === '' || parseFloat(this.form.v_value) <= 0) {
              check = false
            }
          }
        }
      }
      return check
    },
    selectSerie() {
      this.form.prediction_serie = this.select_serie
    }
  },
  computed: {
    ispforest() {
      return (this.form.select_classifiers === "pforest")
    }
  }
};
</script>

<style scoped>

#modelform {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
}

</style>