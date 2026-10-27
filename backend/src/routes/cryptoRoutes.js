import { Router } from 'express';
import { RFC3526_MODP_2048, DEMO_DH_PARAMS, simulateDhExchange } from '../../../crypto/diffieHellman.js';
import { DEFAULT_ELGAMAL_PARAMS, DEMO_ELGAMAL_PARAMS } from '../../../crypto/elgamal.js';
import { isProbablePrime, extendedGcd, modPow, modInverse } from '../../../crypto/math.js';

export const cryptoRoutes = Router();

// Menyediakan parameter standar dan demo untuk Crypto Lab
cryptoRoutes.get('/crypto/parameters', (req, res) => {
  res.json({
    diffieHellman: {
      standard: {
        name: RFC3526_MODP_2048.name,
        g: RFC3526_MODP_2048.g.toString(),
        p: RFC3526_MODP_2048.p.toString()
      },
      demo: DEMO_DH_PARAMS.map(param => ({
        name: param.name,
        p: param.p.toString(),
        g: param.g.toString()
      }))
    },
    elGamal: {
      standard: {
        name: DEFAULT_ELGAMAL_PARAMS.name,
        g: DEFAULT_ELGAMAL_PARAMS.g.toString(),
        p: DEFAULT_ELGAMAL_PARAMS.p.toString()
      },
      demo: DEMO_ELGAMAL_PARAMS.map(param => ({
        name: param.name,
        p: param.p.toString(),
        g: param.g.toString()
      }))
    }
  });
});

// Simulasi DH untuk lab edukasi
cryptoRoutes.post('/crypto/simulate-dh', (req, res) => {
  try {
    const { p, g, privateKeyA, privateKeyB } = req.body;
    if (!p || !g) {
      return res.status(400).json({ error: 'Parameter p dan g wajib diisi' });
    }
    const result = simulateDhExchange(p, g, privateKeyA, privateKeyB);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
