import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import * as _ from 'underscore';

import { Individual, UserInputs }   from './models/individual';

@Component({
  selector: 'my-app',
  templateUrl: `app/app.component.html`,
})
export class AppComponent {
  userInputs = new UserInputs();

  calcResults = {
    acaAnnually: 0,
    ahcaAnnually: 0,
    acaMonthly: 0,
    ahcaMonthly: 0,
    fplPct: 0.00,
    ahcaMonthlyCredit: 0.00,
    ahcaAnnualCredit: 0.00,
    isCalculated: false,
    isAhcaQualified: false,
    ahcaMonthlyPremium: 0,
    fplVal: 0,
    isAhcaCapped: false,
    acaDifference: 0,
    ahcaDifference: 0
  };

  data = {
    "fplConstants": {
      "firstPerson": 11770.00,
      "additionalPerson": 4160.00
    },
    "healthcarePremiums": {
      "averageAnnualFamily": 18142.00,
      "averageAnnualIndividual": 6432.00
    },
    "acaMetrics": [
      {
        "minFpl": 0,
        "maxFpl": 1.33,
        "minCap": 0.02,
        "maxCap": 0.02
      },
      {
        "minFpl": 1.33,
        "maxFpl": 1.5,
        "minCap": 0.03,
        "maxCap": 0.04
      },
      {
        "minFpl": 1.5,
        "maxFpl": 2.0,
        "minCap": 0.04,
        "maxCap": 0.063
      },
      {
        "minFpl": 2.0,
        "maxFpl": 2.5,
        "minCap": 0.063,
        "maxCap": 0.0805
      },
      {
        "minFpl": 2.5,
        "maxFpl": 3.0,
        "minCap": 0.0805,
        "maxCap": 0.095
      },
      {
        "minFpl": 3.0,
        "maxFpl": 1000.0,
        "minCap": 0.095,
        "maxCap": 0.095
      },
    ],
    "ahcaMetrics": [
      {
        "min": 0,
        "max": 29,
        "annualCredit": 2000.00
      },
      {
        "min": 30,
        "max": 39,
        "annualCredit": 2500.00
      },
      {
        "min": 40,
        "max": 49,
        "annualCredit": 3000.00
      },
      {
        "min": 50,
        "max": 59,
        "annualCredit": 3500.00
      },
      {
        "min": 60,
        "max": 1000,
        "annualCredit": 4000.00
      }
    ]
  };

  calc() {

    var totalFamilyCount = this.getNumberValue(this.userInputs.adults.toString());
    if(this.userInputs.children) {
      totalFamilyCount += this.getNumberValue(this.userInputs.children.toString());
    }
    var fpl = this.data.fplConstants.firstPerson + ((totalFamilyCount - 1) * this.data.fplConstants.additionalPerson);
    
    var pctFpl = this.userInputs.agi / fpl;
    this.calcResults.fplPct = pctFpl;
    this.calcResults.fplVal = fpl;
    var ahcaAnnualCredit = 0;
    var ahcaMonthlyCredit = 0;
    var monthlyPremium = 0;
    var annualPremium = 0;
    if(this.userInputs.individual) {
      monthlyPremium = this.data.healthcarePremiums.averageMonthlyIndividual;
      annualPremium = monthlyPremium * 12;
    } else {
      monthlyPremium = this.data.healthcarePremiums.averageMonthlyFamily;
      annualPremium = monthlyPremium * 12;
    }



    if(this.userInputs.actualMonthlyPremium > 0) {
      monthlyPremium = this.userInputs.actualMonthlyPremium;
      annualPremium = monthlyPremium * 12;
    }

    var acaMetrics = _.filter(this.data.acaMetrics, function (m) { return m.minFpl <= pctFpl && m.maxFpl >= pctFpl });
    
    if (acaMetrics.length == 1) {
      
      var totalOutOfPocket = this.userInputs.agi * acaMetrics[0].maxCap;
      
      this.calcResults.acaAnnually = totalOutOfPocket;
      this.calcResults.acaMonthly = totalOutOfPocket / 12;
      
      if((this.userInputs.individual && this.calcResults.acaAnnually > this.data.healthcarePremiums.averageAnnualIndividual) || (!this.userInputs.individual && this.calcResults.acaAnnually > this.data.healthcarePremiums.averageAnnualFamily)) {  
        if(this.userInputs.individual) {
          this.calcResults.acaAnnually = this.data.healthcarePremiums.averageAnnualIndividual;
          this.calcResults.acaMonthly = this.data.healthcarePremiums.averageAnnualIndividual / 12;
        } else {
          this.calcResults.acaAnnually = this.data.healthcarePremiums.averageAnnualFamily;
          this.calcResults.acaMonthly = this.data.healthcarePremiums.averageAnnualFamily / 12;
        }
      }
    }

    if (this.userInputs.adults == 1 && this.userInputs.agi > 75000) {
      this.calcResults.isAhcaQualified = false;
    } else if (this.userInputs.agi > 150000) {
      this.calcResults.isAhcaQualified = false;
    } else {
      this.calcResults.isAhcaQualified = true;
    }

    var dependentCount = 0;
    var adultDependents = _.sortBy(this.userInputs.adultAges, function(m) { return -1 * m.age; });

    for (var i = 0; i < adultDependents.length; i++) {
      dependentCount++;
      if (dependentCount <= 5) {
        var currentMember = adultDependents[i];
        var ahcaMetrics = _.filter(this.data.ahcaMetrics, function (m) { return m.min <= currentMember.age && m.max > currentMember.age });

        if (ahcaMetrics.length == 1) {
          ahcaAnnualCredit += ahcaMetrics[0].annualCredit;
          ahcaMonthlyCredit += ahcaMetrics[0].annualCredit / 12;

        }
      }
    }

    
    var childDependents = _.sortBy(this.userInputs.childrenAges, function(m) { return -1 * parseInt(m.age.toString()); });
    
    for (var i = 0; i < childDependents.length; i++) {
      if (dependentCount <= 5) {
        var currentMember = childDependents[i];
        var ahcaMetrics = _.filter(this.data.ahcaMetrics, function (m) { return m.min <= currentMember.age && m.max > currentMember.age });

        if (ahcaMetrics.length == 1) {
          ahcaAnnualCredit += ahcaMetrics[0].annualCredit;
          ahcaMonthlyCredit += ahcaMetrics[0].annualCredit / 12;

        }
        dependentCount++;
      }
    }

    this.calcResults.ahcaAnnualCredit = ahcaAnnualCredit;
    if(this.calcResults.ahcaAnnualCredit > 14000) {
      this.calcResults.ahcaAnnualCredit = 14000;
      this.calcResults.isAhcaCapped = true;
    }
    this.calcResults.ahcaMonthlyCredit = ahcaMonthlyCredit;
    if(this.calcResults.isAhcaQualified) {
    if(this.userInputs.individual) {
      this.calcResults.ahcaMonthlyPremium = (this.data.healthcarePremiums.averageAnnualIndividual / 12) - ahcaMonthlyCredit;
    } else {
      this.calcResults.ahcaMonthlyPremium = (this.data.healthcarePremiums.averageAnnualFamily / 12) - ahcaMonthlyCredit;
    }
    } else {
      if(this.userInputs.individual) {
      this.calcResults.ahcaMonthlyPremium = (this.data.healthcarePremiums.averageAnnualIndividual / 12);
    } else {
      this.calcResults.ahcaMonthlyPremium = (this.data.healthcarePremiums.averageAnnualFamily / 12);
    }
    }

    this.updateActual(this.userInputs.actualMonthlyPremium);
    this.calcResults.isCalculated = true;
  }

  updateChildren(e: Event) {
    this.userInputs.childrenAges = [];
    for (var i = 0; i < this.userInputs.children; i++) {
      this.userInputs.childrenAges.push({ index: i, age: 0 });
    }
  }

  updateAdults(e : Event) {
    this.userInputs.adultAges = [];
    for (var i = 0; i < this.userInputs.adults; i++) { 
      this.userInputs.adultAges.push({ index: i, age: 0 });
    }

    if(this.userInputs.adults > 1) {
      this.userInputs.individual = false;
    } 
  }

  getNumberValue(v : string) : number {
    return parseInt(v);
  }

  checkNumber(e: Event) : void {
    var n = e;
    if(n.startsWith('$')) {
      n = n.substring(1);
    }

    n = n.replace(',', '');
    var re = /[0-9]+/;
    if(re.test(n)) {

    var formatted = new CurrencyPipe().transform(n, 'USD', true, '1.0-0');
    
    this.userInputs.agiFormatted = formatted;
    this.userInputs.agi = parseFloat(n);
    this.userInputs.valid = true;
  } else {
      this.userInputs.agiFormatted = '';
      this.userInputs.agi = '';
      this.userInputs.valid = false;
    }
    
  }

  checkActualMonthly(e: Event) : void {
    var n = e;
    if(n.startsWith('$')) {
      n = n.substring(1);
    }

    n = n.replace(',', '');
    var re = /[0-9]+/;
    if(re.test(n)) {

    var formatted = new CurrencyPipe().transform(n, 'USD', true, '1.0-0');
    


    this.userInputs.actualMonthlyPremiumFormatted = formatted;
    this.userInputs.actualMonthlyPremium = parseFloat(n);
    }

    var acaDifference = this.userInputs.actualMonthlyPremium - this.calcResults.acaMonthly;
    var ahcaDifference = this.userInputs.actualMonthlyPremium - this.calcResults.ahcaMonthlyPremium;
    this.calcResults.acaDifference = acaDifference;
    this.calcResults.ahcaDifference = ahcaDifference;
    
  }

  updateActual(n: number) : void {
    var formatted = new CurrencyPipe().transform(n, 'USD', true, '1.0-0');
    


    this.userInputs.actualMonthlyPremiumFormatted = formatted;
    this.userInputs.actualMonthlyPremium = parseFloat(n);
    var acaDifference = this.userInputs.actualMonthlyPremium - this.calcResults.acaMonthly;
    var ahcaDifference = this.userInputs.actualMonthlyPremium - this.calcResults.ahcaMonthlyPremium;
    this.calcResults.acaDifference = acaDifference;
    this.calcResults.ahcaDifference = ahcaDifference;
  }

  abs(v: number) : number {
    return Math.abs(v);
  }

  ngOnInit(): void {
    this.userInputs.individual = true;
    this.userInputs.adults = 1;
    this.userInputs.children = 0;
    this.userInputs.adultAges = [];
    this.userInputs.adultAges.push({index: 0, age: 32 });
    this.userInputs.valid = false;
  }
}
