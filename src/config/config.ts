interface Config {
  apiUrl: string;
}

const development: Config = {
  apiUrl: 'http://localhost:3000'
};

const production: Config = {
  apiUrl: 'https://planning-server.onrender.com'
};

const config: Config = process.env.NODE_ENV === 'production' ? production : development;

export default config;
