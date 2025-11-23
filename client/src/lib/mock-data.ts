import car1 from "@assets/generated_images/futuristic_dark_sports_car.png";
import car2 from "@assets/generated_images/luxury_suv_dark_lighting.png";
import car3 from "@assets/generated_images/electric_sedan_cyber_style.png";

export interface Car {
  id: string;
  brand: string;
  model: string;
  price: string;
  type: string;
  image: string;
  specs: {
    acceleration: string;
    topSpeed: string;
    power: string;
  };
  match: number;
}

export const CARS: Car[] = [
  {
    id: "1",
    brand: "Cyber",
    model: "Wraith GT",
    price: "$145,000",
    type: "Sports",
    image: car1,
    specs: {
      acceleration: "2.6s",
      topSpeed: "205 mph",
      power: "750 hp"
    },
    match: 98
  },
  {
    id: "2",
    brand: "Vanguard",
    model: "Obsidian X",
    price: "$89,900",
    type: "SUV",
    image: car2,
    specs: {
      acceleration: "4.2s",
      topSpeed: "155 mph",
      power: "520 hp"
    },
    match: 95
  },
  {
    id: "3",
    brand: "Nexus",
    model: "Prime",
    price: "$65,000",
    type: "Sedan",
    image: car3,
    specs: {
      acceleration: "3.1s",
      topSpeed: "162 mph",
      power: "480 hp"
    },
    match: 92
  },
  {
    id: "4",
    brand: "Porsche",
    model: "911 Dakar",
    price: "$222,000",
    type: "Sports",
    image: "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=2070&auto=format&fit=crop",
    specs: {
      acceleration: "3.2s",
      topSpeed: "190 mph",
      power: "473 hp"
    },
    match: 89
  },
  {
    id: "5",
    brand: "Audi",
    model: "RS e-tron GT",
    price: "$147,100",
    type: "Electric",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2070&auto=format&fit=crop",
    specs: {
      acceleration: "3.1s",
      topSpeed: "155 mph",
      power: "637 hp"
    },
    match: 88
  },
  {
    id: "6",
    brand: "Mercedes-AMG",
    model: "GT 63",
    price: "$175,000",
    type: "Coupe",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=2070&auto=format&fit=crop",
    specs: {
      acceleration: "2.9s",
      topSpeed: "196 mph",
      power: "630 hp"
    },
    match: 85
  },
  {
    id: "7",
    brand: "BMW",
    model: "M4 Competition",
    price: "$78,600",
    type: "Coupe",
    image: "https://images.unsplash.com/photo-1555215695-3004980adade?q=80&w=2070&auto=format&fit=crop",
    specs: {
      acceleration: "3.4s",
      topSpeed: "180 mph",
      power: "503 hp"
    },
    match: 82
  },
  {
    id: "8",
    brand: "Lamborghini",
    model: "Huracán Tecnica",
    price: "$239,000",
    type: "Supercar",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1974&auto=format&fit=crop",
    specs: {
      acceleration: "3.2s",
      topSpeed: "202 mph",
      power: "631 hp"
    },
    match: 78
  },
  {
    id: "9",
    brand: "Tesla",
    model: "Model S Plaid",
    price: "$108,490",
    type: "Electric",
    image: "https://images.unsplash.com/photo-1617704548623-29a30513f140?q=80&w=2070&auto=format&fit=crop",
    specs: {
      acceleration: "1.99s",
      topSpeed: "200 mph",
      power: "1020 hp"
    },
    match: 75
  },
  {
    id: "10",
    brand: "Lucid",
    model: "Air Sapphire",
    price: "$249,000",
    type: "Electric",
    image: "https://images.unsplash.com/photo-1662419082527-6180c2345f32?q=80&w=1974&auto=format&fit=crop",
    specs: {
      acceleration: "1.89s",
      topSpeed: "205 mph",
      power: "1234 hp"
    },
    match: 72
  }
];